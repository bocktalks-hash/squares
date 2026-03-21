import { useState, useEffect, useRef, useCallback } from "react";
import { loadTOState, saveTOState } from "../../shared/storage";
import { makeTOGame, toTabLabel, calcDigit, mapStatus, getPollingInterval } from "../../shared/utils";
import { BACKEND, SPORT_CONFIG, TIMEOUT_SLOTS } from "../../shared/constants";
import TOGameView from "./TOGameView";

let toNextId = 1;

// ── Per-game bot manager ───────────────────────────────────────────────────────
// Runs outside of TOGameView so it persists regardless of which tab is visible
function useGameBot(game, updateGame, onToast) {
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState("");
  const [botLive, setBotLive]   = useState(false);
  const [scoreA, setScoreA]     = useState(0);
  const [scoreB, setScoreB]     = useState(0);
  const timerRef      = useRef(null);
  const lastNotified  = useRef(null);
  const gameRef       = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const mapTvTimeoutsToSlots = (tvPlays, lockedResults = {}) => {
    // Pure order-based: sort by clock descending (highest = earliest in half)
    // 1st Official TV Timeout → 16-min slot
    // 2nd Official TV Timeout → 12-min slot
    // 3rd Official TV Timeout →  8-min slot
    // 4th Official TV Timeout →  4-min slot
    // No clock window matching — just chronological order
    const clockToSecs = (clock) => {
      if (!clock) return -1;
      const parts = clock.split(":").map(Number);
      return parts.length === 2 ? parts[0] * 60 + parts[1] : -1;
    };
    const h1Slots = ["h1_16", "h1_12", "h1_8", "h1_4"];
    const h2Slots = ["h2_16", "h2_12", "h2_8", "h2_4"];
    const mapped = {};
    for (const [half, slots] of [[1, h1Slots], [2, h2Slots]]) {
      // Sort by clock descending — highest clock = earliest in half
      const plays = tvPlays
        .filter(p => p.period === half)
        .sort((a, b) => clockToSecs(b.clock) - clockToSecs(a.clock));
      plays.forEach((p, i) => {
        if (i >= slots.length) return; // max 4 per half
        const slotId = slots[i];
        if (lockedResults[slotId]?.locked) return; // never overwrite locked
        mapped[slotId] = p;
      });
    }
    return mapped;
  };

  const fetchScores = useCallback(async () => {
    const g = gameRef.current;
    if (!g.teamA && !g.teamB) { setBotStatus("Set teams in Setup first"); return; }
    try {
      const path = SPORT_CONFIG[g.sport]?.path || "basketball/mens-college-basketball";
      const dateStr = g.gameDate ? g.gameDate.replace(/-/g, "") : "";
      const res = await fetch(`${BACKEND}/scores?sport=${path}${dateStr ? `&dates=${dateStr}` : ""}`);
      const data = await res.json();
      const games = data.games || [];
      let found = g.espnGameId ? games.find(x => x.id === g.espnGameId) : null;
      if (!found) {
        const tA = (g.teamA || "").toLowerCase(), tB = (g.teamB || "").toLowerCase();
        found = games.find(x => {
          const h = (x.homeTeam || "").toLowerCase(), aw = (x.awayTeam || "").toLowerCase();
          return h.includes(tA) || h.includes(tB) || aw.includes(tA) || aw.includes(tB);
        });
      }
      if (!found) { setBotStatus("Game not found on ESPN"); return; }

      const sA = found.awayScore, sB = found.homeScore;
      setScoreA(sA); setScoreB(sB);
      const status = mapStatus(found.status);
      setBotLive(status === "in progress" || status === "halftime");
      setBotStatus(`${found.shortDetail || found.status} · ${new Date().toLocaleTimeString()}`);

      if (g.espnGameId) {
        try {
          const pbpRes = await fetch(`${BACKEND}/playbyplay?gameId=${g.espnGameId}&sport=${path}`);
          const pbpData = await pbpRes.json();
          // Strict filter: only exact "Official TV Timeout" or "Official Media Timeout"
          // Never pick up team timeouts or other stoppages
          const isOfficialTVTimeout = (text) => {
            const t = (text || "").toLowerCase().trim();
            return t === "official tv timeout" || t === "official media timeout";
          };
          const tvPlays = (pbpData.plays || []).filter(p =>
            isOfficialTVTimeout(p.text) &&
            typeof p.homeScore === "number" && typeof p.awayScore === "number" &&
            p.homeScore >= 0 && p.awayScore >= 0 &&
            (p.period === 1 || p.period === 2) // regulation only
          );

          // Always read fresh results to avoid stale closure overwriting locked slots
          const freshResults = { ...gameRef.current.results };
          const updatedResults = { ...freshResults };
          let changed = false;

          if (tvPlays.length > 0) {
            const slotMap = mapTvTimeoutsToSlots(tvPlays, gameRef.current.results);
            Object.entries(slotMap).forEach(([slotId, play]) => {
              // NEVER overwrite a locked slot
              if (updatedResults[slotId]?.locked) return;
              const tvA = play.awayScore ?? sA, tvB = play.homeScore ?? sB;
              const digit = calcDigit(tvA, tvB);
              updatedResults[slotId] = { scoreA: tvA, scoreB: tvB, digit, winner: gameRef.current.assignments?.[digit] || null, locked: false, paid: false, pending: true };
              changed = true;
            });

            const latest = tvPlays[tvPlays.length - 1];
            const tvKey = `${latest.period}-${latest.clock}-${latest.awayScore}-${latest.homeScore}`;
            if (tvKey !== lastNotified.current) {
              lastNotified.current = tvKey;
              const tvA = latest.awayScore ?? sA, tvB = latest.homeScore ?? sB;
              const digit = calcDigit(tvA, tvB);
              const winner = gameRef.current.assignments?.[digit] || null;
              setScoreA(tvA); setScoreB(tvB);
              setBotStatus(`📺 TV Timeout! ${tvA}–${tvB} · Digit ${digit}`);
              onToast(winner
                ? `📺 ${g.teamA} ${tvA}–${tvB} ${g.teamB} — ${winner} wins! (digit ${digit})`
                : `📺 TV Timeout! Digit ${digit} — no player assigned`);
              if (Notification.permission === "granted") {
                new Notification("⏱ Official TV Timeout!", {
                  body: winner
                    ? `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins`
                    : `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
                });
              }
            }
          }

          // Halftime slot
          const allPlays = pbpData.plays || [];
          const period1Plays = allPlays.filter(p => p.period === 1);
          if (period1Plays.length > 0 && !gameRef.current.results["h1_0"]?.locked && !updatedResults["h1_0"]?.locked) {
            const lastP1 = period1Plays[period1Plays.length - 1];
            const period2Started = allPlays.some(p => p.period === 2);
            if (period2Started && lastP1.homeScore != null) {
              const hA = lastP1.awayScore ?? sA, hB = lastP1.homeScore ?? sB;
              const digit = calcDigit(hA, hB);
              updatedResults["h1_0"] = { scoreA: hA, scoreB: hB, digit, winner: gameRef.current.assignments?.[digit] || null, locked: false, paid: false, pending: true };
              changed = true;
            }
          }

          // Final slot
          if (status === "final" && !gameRef.current.results["h2_0"]?.locked && !updatedResults["h2_0"]?.locked) {
            const digit = calcDigit(sA, sB);
            updatedResults["h2_0"] = { scoreA: sA, scoreB: sB, digit, winner: gameRef.current.assignments?.[digit] || null, locked: false, paid: false, pending: true };
            changed = true;
            const finalKey = `final-${sA}-${sB}`;
            if (finalKey !== lastNotified.current) {
              lastNotified.current = finalKey;
              const winner = gameRef.current.assignments?.[digit] || null;
              onToast(winner ? `🏁 Final! ${winner} wins — digit ${digit} (${sA}–${sB})` : `🏁 Final! Digit ${digit} — no player assigned`);
              if (Notification.permission === "granted") {
                new Notification("🏁 Game Final!", {
                  body: winner
                    ? `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins`
                    : `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
                });
              }
            }
          }

          if (changed) updateGame({ results: updatedResults });
        } catch { /* pbp failed silently */ }
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, getPollingInterval(status));
    } catch {
      setBotStatus("Fetch failed — retrying");
      if (botRunning) timerRef.current = setTimeout(fetchScores, 30000);
    }
  }, [botRunning, updateGame, onToast]); // eslint-disable-line

  useEffect(() => {
    if (botRunning) fetchScores();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [botRunning]); // eslint-disable-line

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { botRunning, setBotRunning, botStatus, setBotStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores };
}

// ── BotRunner: mounts for every game, runs even when tab is hidden ─────────────
function BotRunner({ game, updateGame, onToast, children }) {
  const bot = useGameBot(game, updateGame, onToast);
  return children(bot);
}

// ── Main TimeoutGame ───────────────────────────────────────────────────────────
export default function TimeoutGame({ onToast }) {
  const [games, setGames] = useState(() => {
    const saved = loadTOState();
    if (saved?.games?.length) {
      toNextId = Math.max(...saved.games.map(g => g.id)) + 1;
      return saved.games;
    }
    return [makeTOGame(toNextId++)];
  });

  const [activeId, setActiveId] = useState(() => loadTOState()?.activeId || 1);

  useEffect(() => { saveTOState(games, activeId); }, [games, activeId]);

  const addGame = () => {
    const g = makeTOGame(toNextId++);
    setGames(prev => [...prev, g]);
    setActiveId(g.id);
  };

  const removeGame = (id) => {
    if (games.length === 1) return;
    const remaining = games.filter(g => g.id !== id);
    setGames(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const updateGame = (id, patch) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        {games.map(game => (
          // Mount ALL games — only active one is visible; position:absolute so
          // inactive games take zero space and never affect layout
          <div
            key={game.id}
            style={{
              position: "absolute", inset: 0,
              display: game.id === activeId ? "flex" : "none",
              flexDirection: "column", overflow: "hidden",
            }}
          >
            <BotRunner
              game={game}
              updateGame={patch => updateGame(game.id, patch)}
              onToast={onToast}
            >
              {(botProps) => (
                <TOGameView
                  game={game}
                  onUpdate={patch => updateGame(game.id, patch)}
                  onToast={onToast}
                  onDelete={() => removeGame(game.id)}
                  botProps={botProps}
                />
              )}
            </BotRunner>
          </div>
        ))}
      </div>

      <div className="tab-bar">
        <div className="tab-bar-scroll">
          {games.map(g => (
            <div
              key={g.id}
              className={`tab-item ${g.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(g.id)}
            >
              {toTabLabel(g)}
              {games.length > 1 && (
                <span className="tab-close" onClick={e => { e.stopPropagation(); removeGame(g.id); }}>×</span>
              )}
            </div>
          ))}
        </div>
        <div className="tab-add" onClick={addGame} title="Add game">＋</div>
      </div>
    </div>
  );
}

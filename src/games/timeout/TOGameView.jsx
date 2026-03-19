import { useState, useEffect, useRef, useCallback } from "react";
import { BACKEND, SPORT_CONFIG, TIMEOUT_SLOTS } from "../../shared/constants";
import { calcDigit, mapStatus, getPollingInterval, toTabLabel } from "../../shared/utils";
import TOSetupPanel from "./TOSetupPanel";
import { TOBoardPanel, TOPayoutPanel } from "./TOBoardAndPayoutPanels";
import TOLivePanel from "./TOLivePanel";
import PlayersPanel from "../../components/PlayersPanel";
import TOSharePanel from "./TOSharePanel";

export default function TOGameView({ game, onUpdate, onToast, onDelete }) {
  const [tab, setTab] = useState("setup");
  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "live" && botRunning) {
      setTimeout(fetchScores, 100);
    }
  };

  // Bot state lives here so it persists when switching tabs
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus]   = useState("");
  const [botLive, setBotLive]       = useState(false);
  const [scoreA, setScoreA]         = useState(0);
  const [scoreB, setScoreB]         = useState(0);
  const timerRef     = useRef(null);
  const lastNotified = useRef(null);
  const gameRef      = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  // ── Always-on sync: push game state to DB whenever game changes (if shared) ──
  useEffect(() => {
    if (!game.shareCode || !game.hostToken) return;
    const sync = async () => {
      try {
        await fetch(`${BACKEND}/games/${game.shareCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostToken: game.hostToken, data: game }),
        });
      } catch {}
    };
    const t = setTimeout(sync, 800);
    return () => clearTimeout(t);
  }, [game]);

  // ── Challenge badge: poll for pending challenges in background ──────────────
  const [pendingChallengeCount, setPendingChallengeCount] = useState(0);
  const prevChallengeCount = useRef(0);
  useEffect(() => {
    if (!game.shareCode || !game.hostToken) return;
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/games/${game.shareCode}/challenges?hostToken=${game.hostToken}`);
        if (!res.ok) return;
        const { challenges } = await res.json();
        const pending = (challenges || []).filter(c => c.status === "pending").length;
        setPendingChallengeCount(pending);
        if (pending > prevChallengeCount.current) {
          onToast(`⚑ New challenge received — check Share tab`);
        }
        prevChallengeCount.current = pending;
      } catch {}
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [game.shareCode, game.hostToken]);

  const mapTvTimeoutsToSlots = (tvPlays) => {
    const h1 = tvPlays.filter(p => p.period === 1);
    const h2 = tvPlays.filter(p => p.period === 2);
    const h1Slots = ["h1_16", "h1_12", "h1_8", "h1_4", "h1_0"];
    const h2Slots = ["h2_16", "h2_12", "h2_8", "h2_4", "h2_0"];
    const mapped = {};
    h1.forEach((p, i) => { if (i < h1Slots.length) mapped[h1Slots[i]] = p; });
    h2.forEach((p, i) => { if (i < h2Slots.length) mapped[h2Slots[i]] = p; });
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
      setBotStatus(`${found.shortDetail || found.status} · Updated ${new Date().toLocaleTimeString()}`);

      if (g.espnGameId) {
        try {
          const pbpRes = await fetch(`${BACKEND}/playbyplay?gameId=${g.espnGameId}&sport=${path}`);
          const pbpData = await pbpRes.json();
          const tvPlays = (pbpData.plays || []).filter(p =>
            (p.text || "").toLowerCase().includes("official tv timeout") &&
            typeof p.homeScore === "number" && typeof p.awayScore === "number" &&
            p.homeScore >= 0 && p.awayScore >= 0
          );

          const freshResults = { ...gameRef.current.results };
          const updatedResults = { ...freshResults };
          let changed = false;

          if (tvPlays.length > 0) {
            const slotMap = mapTvTimeoutsToSlots(tvPlays);
            Object.entries(slotMap).forEach(([slotId, play]) => {
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
              const winner = g.assignments[digit] || null;
              setScoreA(tvA); setScoreB(tvB);
              setBotStatus(`📺 TV Timeout! Score: ${tvA}–${tvB} · Digit ${digit}`);
              onToast(winner ? `📺 TV Timeout! ${winner} wins — digit ${digit} (${tvA}–${tvB})` : `📺 TV Timeout! Digit ${digit} — no player assigned`);
              if (Notification.permission === "granted") {
                new Notification("⏱ Official TV Timeout!", {
                  body: winner ? `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins` : `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
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
              const winner = g.assignments[digit] || null;
              onToast(winner ? `🏁 Final! ${winner} wins — digit ${digit} (${sA}–${sB})` : `🏁 Final! Digit ${digit} — no player assigned`);
              if (Notification.permission === "granted") {
                new Notification("🏁 Game Final!", {
                  body: winner ? `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins` : `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
                });
              }
            }
          }

          if (changed) onUpdate({ results: updatedResults });
        } catch { /* pbp failed silently */ }
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, getPollingInterval(status));
    } catch {
      setBotStatus("Fetch failed — retrying");
      if (botRunning) timerRef.current = setTimeout(fetchScores, 30000);
    }
  }, [botRunning, onUpdate, onToast]); // eslint-disable-line

  useEffect(() => {
    if (botRunning) fetchScores();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [botRunning]); // eslint-disable-line

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const botProps = { botRunning, setBotRunning, botStatus, setBotStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores };

  const innerTabs = [
    { id: "setup",   label: "Setup",   icon: "⚙" },
    { id: "board",   label: "Board",   icon: "🎯" },
    { id: "live",    label: "Live",    icon: "📡" },
    { id: "payout",  label: "Payout",  icon: "💰" },
    { id: "players", label: "Players", icon: "👥" },
    { id: "share",   label: "Share",   icon: "🔗", badge: pendingChallengeCount },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="inner-tabs">
        {innerTabs.map(t => (
          <div key={t.id} className={`inner-tab ${tab === t.id ? "active" : ""}`} onClick={() => handleTabChange(t.id)}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
            {t.id === "live" && botRunning && <span style={{ marginLeft: 4, color: "var(--win)", fontSize: 9 }}>●</span>}
            {t.badge > 0 && (
              <span style={{
                marginLeft: 5, background: "#e53935", color: "#fff",
                borderRadius: "50%", fontSize: 10, fontWeight: 700,
                width: 16, height: 16, display: "inline-flex",
                alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>
      <div className="game-content">
        {tab === "setup"   && <TOSetupPanel  game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab === "board"   && <TOBoardPanel  game={game} onUpdate={onUpdate} onToast={onToast} />}
        {tab === "live"    && <TOLivePanel   game={game} onUpdate={onUpdate} onToast={onToast} botProps={botProps} />}
        {tab === "payout"  && <TOPayoutPanel game={game} onUpdate={onUpdate} />}
        {tab === "players" && <PlayersPanel />}
        {tab === "share"   && <TOSharePanel  game={game} onUpdate={onUpdate} onToast={onToast} />}
      </div>
    </div>
  );
}

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

  // Convert "MM:SS" clock string to total seconds remaining
  const clockToSeconds = (clock) => {
    if (!clock) return -1;
    const parts = clock.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return -1;
  };

  // TV timeout windows — basketball counts DOWN from 20:00
  // Each slot covers the range between two thresholds (in seconds remaining)
  const TV_WINDOWS = [
    ["_16", 960, 720],   // under 16: clock between 15:59 and 12:01
    ["_12", 720, 480],   // under 12: clock between 11:59 and  8:01
    ["_8",  480, 240],   // under  8: clock between  7:59 and  4:01
    ["_4",  240,   0],   // under  4: clock between  3:59 and  0:00
  ];
  // How far above a threshold we'll still accept as a fallback (seconds)
  const FALLBACK_BUFFER = 60;

  const mapTvTimeoutsToSlots = (tvPlays, lockedResults = {}) => {
    const mapped = {};
    for (const period of [1, 2]) {
      const prefix = period === 1 ? "h1" : "h2";
      const periodPlays = tvPlays.filter(p => p.period === period);

      for (const [suffix, high, low] of TV_WINDOWS) {
        const slotId = `${prefix}${suffix}`;
        if (lockedResults[slotId]?.locked) continue;

        const withSecs = periodPlays.map(p => ({ p, s: clockToSeconds(p.clock) }));

        // PRIMARY: timeouts that happened AFTER the threshold (clock dropped below high)
        // i.e. clock is strictly inside the window
        const after = withSecs.filter(({ s }) => s > low && s < high);
        if (after.length) {
          // Pick the one with the HIGHEST clock (closest to the threshold going down)
          mapped[slotId] = after.reduce((a, b) => a.s >= b.s ? a : b).p;
          continue;
        }

        // FALLBACK: timeout logged just BEFORE the threshold (ESPN sometimes logs early)
        // Accept if within FALLBACK_BUFFER seconds above the threshold
        const before = withSecs.filter(({ s }) => s >= high && s <= high + FALLBACK_BUFFER);
        if (before.length) {
          // Pick the one CLOSEST to (just above) the threshold
          mapped[slotId] = before.reduce((a, b) => a.s <= b.s ? a : b).p;
        }
      }
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
      setBotStatus(`${found.shortDetail || found.status} · Updated ${new Date().toLocaleTimeString()}`);

      if (g.espnGameId) {
        try {
          const pbpRes = await fetch(`${BACKEND}/playbyplay?gameId=${g.espnGameId}&sport=${path}`);
          const pbpData = await pbpRes.json();
          const tvPlays = (pbpData.plays || []).filter(p =>
            (p.text || "").toLowerCase().includes("official tv timeout") &&
            typeof p.homeScore === "number" && typeof p.awayScore === "number" &&
            p.homeScore >= 0 && p.awayScore >= 0 &&
            (p.period === 1 || p.period === 2) // only regulation halves
          );

          const freshResults = { ...gameRef.current.results };
          const updatedResults = { ...freshResults };
          let changed = false;

          if (tvPlays.length > 0) {
            const isAutopilot = !!(gameRef.current.options?.autopilot);
            const slotMap = mapTvTimeoutsToSlots(tvPlays, gameRef.current.results);
            Object.entries(slotMap).forEach(([slotId, play]) => {
              if (updatedResults[slotId]?.locked) return;
              const tvA = play.awayScore ?? sA, tvB = play.homeScore ?? sB;
              const digit = calcDigit(tvA, tvB);
              const winner = gameRef.current.assignments?.[digit] || null;
              // Autopilot: lock immediately. Manual: mark as pending for host to review
              updatedResults[slotId] = { scoreA: tvA, scoreB: tvB, digit, winner, locked: isAutopilot, paid: false, pending: !isAutopilot };
              changed = true;
            });

            const latest = tvPlays[tvPlays.length - 1];
            const tvKey = `${latest.period}-${latest.clock}-${latest.awayScore}-${latest.homeScore}`;
            if (tvKey !== lastNotified.current) {
              lastNotified.current = tvKey;
              const tvA = latest.awayScore ?? sA, tvB = latest.homeScore ?? sB;
              const digit = calcDigit(tvA, tvB);
              const winner = g.assignments[digit] || null;
              const isAuto = !!(gameRef.current.options?.autopilot);
              setScoreA(tvA); setScoreB(tvB);
              setBotStatus(`📺 TV Timeout! Score: ${tvA}–${tvB} · Digit ${digit}${isAuto ? " · AUTO-LOCKED" : ""}`);
              onToast(winner
                ? `📺 TV Timeout! ${winner} wins — digit ${digit} (${tvA}–${tvB})${isAuto ? " 🔒 Auto-locked" : " — tap Lock to confirm"}`
                : `📺 TV Timeout! Digit ${digit} — no player${isAuto ? " 🔒 Auto-locked" : ""}`);
              if (Notification.permission === "granted") {
                new Notification("⏱ Official TV Timeout!", {
                  body: winner ? `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins` : `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
                });
              }
            }
          }

          // Halftime slot — detect via ESPN status OR period 2 starting
          const allPlays = pbpData.plays || [];
          const period1Plays = allPlays.filter(p => p.period === 1);
          const isHalftime = status === "halftime" || allPlays.some(p => p.period === 2);
          if (period1Plays.length > 0 && isHalftime &&
              !gameRef.current.results["h1_0"]?.locked && !updatedResults["h1_0"]?.locked) {
            const lastP1 = period1Plays[period1Plays.length - 1];
            if (lastP1.homeScore != null) {
              const hA = lastP1.awayScore ?? sA, hB = lastP1.homeScore ?? sB;
              const digit = calcDigit(hA, hB);
              const winner = gameRef.current.assignments?.[digit] || null;
              const isAuto = !!(gameRef.current.options?.autopilot);
              updatedResults["h1_0"] = { scoreA: hA, scoreB: hB, digit, winner, locked: isAuto, paid: false, pending: !isAuto };
              changed = true;
              const halfKey = `half-${hA}-${hB}`;
              if (halfKey !== lastNotified.current) {
                lastNotified.current = halfKey;
                onToast(winner
                  ? `⏸ Halftime! ${winner} wins — digit ${digit} (${hA}–${hB})${isAuto ? " 🔒 Auto-locked" : " — tap Lock to confirm"}`
                  : `⏸ Halftime! Digit ${digit} — no player${isAuto ? " 🔒 Auto-locked" : ""}`);
                if (Notification.permission === "granted") {
                  new Notification("⏸ Halftime!", {
                    body: winner ? `${g.teamA} ${hA} – ${hB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins` : `${g.teamA} ${hA} – ${hB} ${g.teamB}  ·  Digit ${digit} — unassigned`,
                  });
                }
              }
            }
          }

          // Final slot
          if (status === "final" && !gameRef.current.results["h2_0"]?.locked && !updatedResults["h2_0"]?.locked) {
            const digit = calcDigit(sA, sB);
            const winner = gameRef.current.assignments?.[digit] || null;
            const isAuto = !!(gameRef.current.options?.autopilot);
            updatedResults["h2_0"] = { scoreA: sA, scoreB: sB, digit, winner, locked: isAuto, paid: false, pending: !isAuto };
            changed = true;
            const finalKey = `final-${sA}-${sB}`;
            if (finalKey !== lastNotified.current) {
              lastNotified.current = finalKey;
              onToast(winner
                ? `🏁 Final! ${winner} wins — digit ${digit} (${sA}–${sB})${isAuto ? " 🔒 Auto-locked" : " — tap Lock to confirm"}`
                : `🏁 Final! Digit ${digit} — no player${isAuto ? " 🔒 Auto-locked" : ""}`);
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

  // handleTabChange defined here so fetchScores is in scope
  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "live" && botRunning) {
      setTimeout(fetchScores, 100);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const botProps = { botRunning, setBotRunning, botStatus, setBotStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores, autopilot: !!(game.options?.autopilot), setAutopilot: (val) => onUpdate({ options: { ...(game.options || {}), autopilot: val } }) };

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

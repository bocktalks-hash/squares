import { useState } from "react";
import { TIMEOUT_SLOTS } from "../../shared/constants";
import { calcDigit } from "../../shared/utils";
import { BACKEND } from "../../shared/constants";

export default function TOLivePanel({ game, onUpdate, onToast, botProps }) {
  const {
    botRunning, setBotRunning, botStatus, botLive,
    scoreA, setScoreA, scoreB, setScoreB,
    fetchScores, autopilot, setAutopilot,
  } = botProps || {};

  const [activeSlotId, setActiveSlotId] = useState("h1_16");
  const [challenging, setChallenging] = useState(false);
  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");

  const liveDigit = calcDigit(scoreA || 0, scoreB || 0);
  const liveWinner = game.assignments?.[liveDigit] || null;

  const startBot = () => {
    Notification.requestPermission();
    setBotRunning(true);
  };
  const stopBot = () => setBotRunning(false);

  const lockSlot = (slotId, sA, sB) => {
    const digit = calcDigit(sA, sB);
    const winner = game.assignments?.[digit] || null;
    const updated = {
      ...game.results,
      [slotId]: { scoreA: sA, scoreB: sB, digit, winner, locked: true, paid: false, pending: false },
    };
    onUpdate({ results: updated });
    const slot = TIMEOUT_SLOTS.find(s => s.id === slotId);
    onToast(winner
      ? `🔒 ${slot?.label || slotId} locked — ${winner} wins!`
      : `🔒 ${slot?.label || slotId} locked — digit ${digit}`);
  };

  const unlockSlot = (slotId) => {
    const updated = { ...game.results };
    delete updated[slotId];
    onUpdate({ results: updated });
    const slot = TIMEOUT_SLOTS.find(s => s.id === slotId);
    onToast(`↩ ${slot?.label || slotId} unlocked`);
  };

  const challenge = async (slotId) => {
    if (!game.espnGameId) { onToast("No ESPN game selected"); return; }
    setChallenging(true);
    try {
      const path = game.sport === "nba"
        ? "basketball/nba"
        : "basketball/mens-college-basketball";
      const res = await fetch(`${BACKEND}/playbyplay?gameId=${game.espnGameId}&sport=${path}`);
      const data = await res.json();
      const plays = data.plays || [];
      const tvPlays = plays.filter(p =>
        (p.text || "").toLowerCase().includes("official tv timeout") &&
        typeof p.homeScore === "number" && typeof p.awayScore === "number"
      );
      if (tvPlays.length === 0) {
        onToast("No official TV timeouts found in ESPN play-by-play");
      } else {
        const latest = tvPlays[tvPlays.length - 1];
        onToast(`📺 ESPN confirms: ${latest.awayScore}–${latest.homeScore} at ${latest.clock} (${latest.period === 1 ? "1st" : "2nd"} half)`);
      }
    } catch {
      onToast("❌ Could not fetch ESPN play-by-play");
    }
    setChallenging(false);
  };

  const activeSlot = TIMEOUT_SLOTS.find(s => s.id === activeSlotId);
  const activeResult = game.results?.[activeSlotId];

  // Use manual scores if entered, otherwise use live bot scores
  const lockA = manualA !== "" ? parseInt(manualA) : (scoreA || 0);
  const lockB = manualB !== "" ? parseInt(manualB) : (scoreB || 0);
  const lockDigit = calcDigit(lockA, lockB);
  const lockWinner = game.assignments?.[lockDigit] || null;

  return (
    <div>
      {/* Live Score Bot */}
      <div className="live-score-card">
        <div className="card-title">Live Score Bot</div>
        <div className="bot-header">
          {!botRunning
            ? <button className="btn btn-primary btn-sm" onClick={startBot} disabled={!game.teamA}>▶ Start Bot</button>
            : <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>}
          {botRunning && (
            <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Refresh</button>
          )}
          <div className={`bot-status ${botLive ? "live" : ""}`} style={{ flex: 1, fontSize: 11 }}>
            {botLive && <span className="pulse" style={{ marginRight: 4 }} />}
            {botStatus || (game.teamA ? `Ready — ${game.teamA} vs ${game.teamB}` : "Select a game in Setup first")}
          </div>
        </div>

        {/* Autopilot toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          <div style={{ flex: 1, fontSize: 12, color: "var(--text-mid)" }}>
            <strong style={{ color: "var(--text)" }}>Autopilot</strong> — auto-lock timeouts when detected
          </div>
          <div
            onClick={() => setAutopilot?.(!autopilot)}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: "pointer", transition: "background .2s",
              background: autopilot ? "var(--court)" : "var(--border)", position: "relative", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: autopilot ? 21 : 3,
              width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s",
            }} />
          </div>
        </div>

        {/* Score display */}
        {(scoreA > 0 || scoreB > 0) ? (
          <div className="score-display" style={{ marginTop: 12 }}>
            <div className="score-team">
              <div className="score-team-name">{game.teamA || "Team A"}</div>
              <div className="score-num">{scoreA}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="score-sep">–</div>
            </div>
            <div className="score-team">
              <div className="score-team-name">{game.teamB || "Team B"}</div>
              <div className="score-num">{scoreB}</div>
            </div>
          </div>
        ) : botRunning ? (
          <div style={{ textAlign: "center", padding: 16, color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>Waiting for game to start…
          </div>
        ) : null}

        {/* Live projected winner */}
        {(scoreA > 0 || scoreB > 0) && (
          <div className="winner-banner">
            <div className="wb-label">Live projected winner</div>
            <div className="wb-eq">
              …{(scoreA || 0) % 10} + …{(scoreB || 0) % 10} = <strong style={{ color: "var(--court-bright)", fontSize: 14 }}>{liveDigit}</strong>
            </div>
            <div className="wb-name" style={{ fontSize: liveWinner ? 38 : 24, color: liveWinner ? "var(--win)" : "var(--text-dim)" }}>
              {liveWinner ? `🏆 ${liveWinner}` : `Digit ${liveDigit} — unassigned`}
            </div>
          </div>
        )}
      </div>

      {/* Lock a Timeout */}
      <div className="card">
        <div className="card-title">Lock a Timeout</div>

        {/* Slot selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TIMEOUT_SLOTS.map(slot => {
            const locked = game.results[slot.id]?.locked;
            const pending = game.results[slot.id]?.pending;
            return (
              <div
                key={slot.id}
                className={`period-tab ${slot.id === activeSlotId ? "active" : ""} ${locked ? "locked" : ""}`}
                onClick={() => setActiveSlotId(slot.id)}
                style={{ position: "relative" }}
              >
                {slot.label}
                {locked && <span style={{ marginLeft: 4, fontSize: 9 }}>🔒</span>}
                {pending && !locked && <span style={{ marginLeft: 4, fontSize: 9, color: "var(--court-bright)" }}>●</span>}
              </div>
            );
          })}
        </div>

        {/* Active slot detail */}
        {activeSlot && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
              <strong style={{ color: "var(--text)" }}>{activeSlot.label}</strong>
              {activeResult?.locked
                ? ` — 🔒 Locked: ${activeResult.scoreA}–${activeResult.scoreB} → digit ${activeResult.digit} → ${activeResult.winner || "unassigned"}`
                : activeResult?.pending
                ? ` — ⏳ Pending (from bot): ${activeResult.scoreA}–${activeResult.scoreB} → digit ${activeResult.digit}`
                : " — Not yet recorded"}
            </div>

            {/* Manual score override */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>{game.teamA || "Team A"}</div>
                <input
                  type="number" min="0" placeholder={scoreA || "0"}
                  value={manualA}
                  onChange={e => setManualA(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontSize: 16, textAlign: "center" }}
                />
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: 18, paddingTop: 18 }}>–</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>{game.teamB || "Team B"}</div>
                <input
                  type="number" min="0" placeholder={scoreB || "0"}
                  value={manualB}
                  onChange={e => setManualB(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontSize: 16, textAlign: "center" }}
                />
              </div>
            </div>

            {/* Winner preview */}
            <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 12, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                …{lockA % 10} + …{lockB % 10} = <strong style={{ color: "var(--court-bright)" }}>{lockDigit}</strong>
              </div>
              <div style={{ fontSize: lockWinner ? 24 : 16, fontWeight: 700, color: lockWinner ? "var(--win)" : "var(--text-dim)" }}>
                {lockWinner ? `🏆 ${lockWinner}` : `Digit ${lockDigit} — unassigned`}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {!activeResult?.locked ? (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => { lockSlot(activeSlotId, lockA, lockB); setManualA(""); setManualB(""); }}
                >
                  🔒 Lock {activeSlot.label}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => unlockSlot(activeSlotId)}
                >
                  ↩ Unlock
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => challenge(activeSlotId)}
                disabled={challenging}
                title="Re-fetch ESPN play-by-play to verify this timeout"
              >
                {challenging ? "⏳" : "⚑ Challenge"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending bot results */}
      {Object.entries(game.results || {}).some(([, r]) => r.pending && !r.locked) && (
        <div className="card">
          <div className="card-title">⏳ Pending Bot Results</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
            Bot detected these — tap Lock on each to confirm
          </div>
          {TIMEOUT_SLOTS.filter(s => game.results[s.id]?.pending && !game.results[s.id]?.locked).map(slot => {
            const res = game.results[slot.id];
            const winner = game.assignments?.[res.digit] || null;
            return (
              <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: "var(--court-bright)", minWidth: 60 }}>{slot.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 56 }}>{res.scoreA}–{res.scoreB}</div>
                <div style={{ flex: 1, fontWeight: 600, color: "var(--court-bright)", fontSize: 12 }}>{winner || `Digit ${res.digit}`}</div>
                <button
                  onClick={() => lockSlot(slot.id, res.scoreA, res.scoreB)}
                  style={{ background: "var(--court-dim)", color: "#fff", border: "none", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  🔒 Lock
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

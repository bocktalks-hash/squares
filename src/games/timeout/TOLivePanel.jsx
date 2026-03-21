import { useState } from "react";
import { TIMEOUT_SLOTS } from "../../shared/constants";
import { calcDigit } from "../../shared/utils";
import { BACKEND } from "../../shared/constants";

// Slot definitions for challenge UI
const HALF_SLOTS = {
  1: ["h1_16", "h1_12", "h1_8", "h1_4"],
  2: ["h2_16", "h2_12", "h2_8", "h2_4"],
};
const SLOT_LABELS = {
  h1_16: "Under 16", h1_12: "Under 12", h1_8: "Under 8", h1_4: "Under 4",
  h2_16: "Under 16", h2_12: "Under 12", h2_8: "Under 8", h2_4: "Under 4",
  h1_0: "Halftime", h2_0: "Final",
};

const isOfficialTVTimeout = (text) => {
  const t = (text || "").toLowerCase().trim();
  return t === "official tv timeout" || t === "official media timeout";
};

const clockToSecs = (clock) => {
  if (!clock) return -1;
  const parts = clock.split(":").map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : -1;
};

export default function TOLivePanel({ game, onUpdate, onToast, botProps }) {
  const {
    botRunning, setBotRunning, botStatus, botLive,
    scoreA, scoreB, fetchScores, autopilot, setAutopilot,
  } = botProps || {};

  const [activeSlotId, setActiveSlotId] = useState("h1_16");
  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");

  // Challenge state
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeHalf, setChallengeHalf] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengePlays, setChallengePlays] = useState(null); // { h1: [...], h2: [...], lastH1: play, lastH2: play }

  const liveDigit  = calcDigit(scoreA || 0, scoreB || 0);
  const liveWinner = game.assignments?.[liveDigit] || null;

  const startBot = () => { Notification.requestPermission(); setBotRunning(true); };
  const stopBot  = () => setBotRunning(false);

  const lockSlot = (slotId, sA, sB) => {
    const digit  = calcDigit(sA, sB);
    const winner = game.assignments?.[digit] || null;
    onUpdate({ results: { ...game.results, [slotId]: { scoreA: sA, scoreB: sB, digit, winner, locked: true, paid: false, pending: false } } });
    const label = SLOT_LABELS[slotId] || slotId;
    onToast(winner ? `🔒 ${label} locked — ${winner} wins!` : `🔒 ${label} locked — digit ${digit}`);
    setManualA(""); setManualB("");
  };

  const unlockSlot = (slotId) => {
    const updated = { ...game.results };
    delete updated[slotId];
    onUpdate({ results: updated });
    onToast(`↩ ${SLOT_LABELS[slotId] || slotId} unlocked`);
  };

  // ── Fetch play-by-play and extract all Official TV Timeouts ──────────────────
  const fetchChallenge = async (half) => {
    if (!game.espnGameId) { onToast("No ESPN game selected"); return; }
    setChallengeLoading(true);
    setChallengeOpen(true);
    setChallengeHalf(half);
    setChallengePlays(null);
    try {
      const path = game.sport === "nba"
        ? "basketball/nba"
        : "basketball/mens-college-basketball";
      const res  = await fetch(`${BACKEND}/playbyplay?gameId=${game.espnGameId}&sport=${path}`);
      const data = await res.json();
      const all  = data.plays || [];

      // Official TV Timeouts only — strict match, sorted by clock desc (earliest first)
      const officialFor = (period) =>
        all
          .filter(p => p.period === period && isOfficialTVTimeout(p.text) &&
            typeof p.homeScore === "number" && typeof p.awayScore === "number")
          .sort((a, b) => clockToSecs(b.clock) - clockToSecs(a.clock));

      // Last scored play of each half for Half/Final slots
      const lastScored = (period) =>
        [...all]
          .filter(p => p.period === period && typeof p.homeScore === "number" && typeof p.awayScore === "number")
          .sort((a, b) => clockToSecs(a.clock) - clockToSecs(b.clock))
          .pop() || null;

      setChallengePlays({
        h1: officialFor(1),
        h2: officialFor(2),
        lastH1: lastScored(1),
        lastH2: lastScored(2),
      });
    } catch {
      onToast("❌ Could not fetch ESPN play-by-play");
      setChallengeOpen(false);
    }
    setChallengeLoading(false);
  };

  // Apply a challenged play to a slot
  const applyChallenge = (slotId, play) => {
    const sA = play.awayScore, sB = play.homeScore;
    const digit  = calcDigit(sA, sB);
    const winner = game.assignments?.[digit] || null;
    // Update as pending — host still manually locks
    onUpdate({ results: { ...game.results, [slotId]: { scoreA: sA, scoreB: sB, digit, winner, locked: false, paid: false, pending: true } } });
    onToast(`✅ ${SLOT_LABELS[slotId]} updated to ${sA}–${sB} · digit ${digit} · tap Lock to confirm`);
  };

  const activeSlot   = TIMEOUT_SLOTS.find(s => s.id === activeSlotId);
  const activeResult = game.results?.[activeSlotId];
  const lockA        = manualA !== "" ? parseInt(manualA) : (scoreA || 0);
  const lockB        = manualB !== "" ? parseInt(manualB) : (scoreB || 0);
  const lockDigit    = calcDigit(lockA, lockB);
  const lockWinner   = game.assignments?.[lockDigit] || null;

  return (
    <div>
      {/* ── Live Score Bot ─────────────────────────────────────────────────── */}
      <div className="live-score-card">
        <div className="card-title">Live Score Bot</div>
        <div className="bot-header">
          {!botRunning
            ? <button className="btn btn-primary btn-sm" onClick={startBot} disabled={!game.teamA}>▶ Start Bot</button>
            : <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>}
          {botRunning && <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Refresh</button>}
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
          <div onClick={() => setAutopilot?.(!autopilot)}
            style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", transition: "background .2s",
              background: autopilot ? "var(--court)" : "var(--border)", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: autopilot ? 21 : 3,
              width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </div>
        </div>

        {/* Scores */}
        {(scoreA > 0 || scoreB > 0) && (
          <div className="score-display" style={{ marginTop: 12 }}>
            <div className="score-team">
              <div className="score-team-name">{game.teamA || "Team A"}</div>
              <div className="score-num">{scoreA}</div>
            </div>
            <div className="score-sep">–</div>
            <div className="score-team">
              <div className="score-team-name">{game.teamB || "Team B"}</div>
              <div className="score-num">{scoreB}</div>
            </div>
          </div>
        )}
        {botRunning && !scoreA && !scoreB && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>Waiting for game to start…
          </div>
        )}

        {/* Live projected winner */}
        {(scoreA > 0 || scoreB > 0) && (
          <div className="winner-banner">
            <div className="wb-label">Live projected winner</div>
            <div className="wb-eq">…{(scoreA||0)%10} + …{(scoreB||0)%10} = <strong style={{ color: "var(--court-bright)", fontSize: 14 }}>{liveDigit}</strong></div>
            <div className="wb-name" style={{ fontSize: liveWinner ? 38 : 24, color: liveWinner ? "var(--win)" : "var(--text-dim)" }}>
              {liveWinner ? `🏆 ${liveWinner}` : `Digit ${liveDigit} — unassigned`}
            </div>
          </div>
        )}
      </div>

      {/* ── Challenge Panel ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">⚑ Challenge / Verify Timeouts</div>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
          Re-fetch ESPN's official play-by-play to verify or correct timeout scores. Only "Official TV Timeout" events are shown.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => fetchChallenge(1)} disabled={challengeLoading}>
            {challengeLoading && challengeHalf === 1 ? "⏳ Loading…" : "⚑ Challenge 1st Half"}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => fetchChallenge(2)} disabled={challengeLoading}>
            {challengeLoading && challengeHalf === 2 ? "⏳ Loading…" : "⚑ Challenge 2nd Half"}
          </button>
        </div>

        {/* Challenge results */}
        {challengeOpen && challengePlays && (
          <div style={{ marginTop: 16 }}>
            {[1, 2].filter(h => !challengeHalf || h === challengeHalf).map(half => {
              const plays  = challengeHalf === 1 ? challengePlays.h1 : challengeHalf === 2 ? challengePlays.h2 : (half === 1 ? challengePlays.h1 : challengePlays.h2);
              const slots  = HALF_SLOTS[half];
              const lastP  = half === 1 ? challengePlays.lastH1 : challengePlays.lastH2;
              const halfSlot  = half === 1 ? "h1_0" : "h2_0";
              const halfLabel = half === 1 ? "Halftime" : "Final";

              return (
                <div key={half}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    color: "var(--court-bright)", marginBottom: 10 }}>
                    {half === 1 ? "1st Half" : "2nd Half"} — Official TV Timeouts
                    <span style={{ color: "var(--text-dim)", fontWeight: 400, marginLeft: 6 }}>
                      ({plays.length} found)
                    </span>
                  </div>

                  {/* 4 timeout slots */}
                  {slots.map((slotId, idx) => {
                    const play    = plays[idx] || null;
                    const current = game.results?.[slotId];
                    const label   = SLOT_LABELS[slotId];
                    const isCurrent = current && play &&
                      current.scoreA === play.awayScore && current.scoreB === play.homeScore;

                    return (
                      <div key={slotId} style={{ display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", marginBottom: 6, borderRadius: 8,
                        background: isCurrent ? "rgba(51,102,204,0.1)" : "var(--surface2)",
                        border: `1px solid ${isCurrent ? "var(--court-dim)" : "var(--border)"}` }}>
                        {/* Slot number */}
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13,
                          color: "var(--court-bright)", minWidth: 62, letterSpacing: .5 }}>
                          #{idx + 1} · {label}
                        </div>

                        {play ? (
                          <>
                            <div style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 40 }}>{play.clock}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
                              {play.awayScore}–{play.homeScore}
                              <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, marginLeft: 6 }}>
                                digit {calcDigit(play.awayScore, play.homeScore)}
                                {game.assignments?.[calcDigit(play.awayScore, play.homeScore)] &&
                                  ` → ${game.assignments[calcDigit(play.awayScore, play.homeScore)]}`}
                              </span>
                            </div>
                            {current?.locked
                              ? <span style={{ fontSize: 11, color: "var(--win)" }}>🔒 Locked</span>
                              : <button onClick={() => applyChallenge(slotId, play)}
                                  style={{ background: "var(--court-dim)", color: "#fff", border: "none",
                                    borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                                  Use
                                </button>
                            }
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--text-dim)", fontStyle: "italic", flex: 1 }}>
                            Not found in ESPN data
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Half / Final slot */}
                  {lastP && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", marginBottom: 14, borderRadius: 8,
                      background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13,
                        color: "var(--warn, #f59e0b)", minWidth: 62, letterSpacing: .5 }}>
                        {halfLabel}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 40 }}>{lastP.clock || "0:00"}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
                        {lastP.awayScore}–{lastP.homeScore}
                        <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, marginLeft: 6 }}>
                          digit {calcDigit(lastP.awayScore, lastP.homeScore)}
                          {game.assignments?.[calcDigit(lastP.awayScore, lastP.homeScore)] &&
                            ` → ${game.assignments[calcDigit(lastP.awayScore, lastP.homeScore)]}`}
                        </span>
                      </div>
                      {game.results?.[halfSlot]?.locked
                        ? <span style={{ fontSize: 11, color: "var(--win)" }}>🔒 Locked</span>
                        : <button onClick={() => applyChallenge(halfSlot, lastP)}
                            style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)",
                              borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                            Use
                          </button>
                      }
                    </div>
                  )}
                </div>
              );
            })}

            <button className="btn btn-secondary btn-sm" onClick={() => { setChallengeOpen(false); setChallengePlays(null); }}>
              Close
            </button>
          </div>
        )}
      </div>

      {/* ── Lock a Timeout ──────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Lock a Timeout</div>

        {/* Slot selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TIMEOUT_SLOTS.map(slot => {
            const locked  = game.results[slot.id]?.locked;
            const pending = game.results[slot.id]?.pending;
            return (
              <div key={slot.id}
                className={`period-tab ${slot.id === activeSlotId ? "active" : ""} ${locked ? "locked" : ""}`}
                onClick={() => setActiveSlotId(slot.id)}>
                {slot.label}
                {locked  && <span style={{ marginLeft: 4, fontSize: 9 }}>🔒</span>}
                {pending && !locked && <span style={{ marginLeft: 4, fontSize: 9, color: "var(--court-bright)" }}>●</span>}
              </div>
            );
          })}
        </div>

        {activeSlot && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
              <strong style={{ color: "var(--text)" }}>{activeSlot.label}</strong>
              {activeResult?.locked
                ? ` — 🔒 ${activeResult.scoreA}–${activeResult.scoreB} · digit ${activeResult.digit} · ${activeResult.winner || "unassigned"}`
                : activeResult?.pending
                ? ` — ⏳ Pending: ${activeResult.scoreA}–${activeResult.scoreB} · digit ${activeResult.digit}`
                : " — Not yet recorded"}
            </div>

            {/* Manual score inputs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>{game.teamA || "Team A"}</div>
                <input type="number" min="0" placeholder={scoreA || "0"} value={manualA}
                  onChange={e => setManualA(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontSize: 16, textAlign: "center" }} />
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: 18, paddingTop: 18 }}>–</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>{game.teamB || "Team B"}</div>
                <input type="number" min="0" placeholder={scoreB || "0"} value={manualB}
                  onChange={e => setManualB(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRadius: 7, padding: "8px 10px", color: "var(--text)", fontSize: 16, textAlign: "center" }} />
              </div>
            </div>

            {/* Winner preview */}
            <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 12,
              borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                …{lockA % 10} + …{lockB % 10} = <strong style={{ color: "var(--court-bright)" }}>{lockDigit}</strong>
              </div>
              <div style={{ fontSize: lockWinner ? 24 : 16, fontWeight: 700, color: lockWinner ? "var(--win)" : "var(--text-dim)" }}>
                {lockWinner ? `🏆 ${lockWinner}` : `Digit ${lockDigit} — unassigned`}
              </div>
            </div>

            {/* Lock / Unlock */}
            <div style={{ display: "flex", gap: 8 }}>
              {!activeResult?.locked
                ? <button className="btn btn-primary" style={{ flex: 1 }}
                    onClick={() => lockSlot(activeSlotId, lockA, lockB)}>
                    🔒 Lock {activeSlot.label}
                  </button>
                : <button className="btn btn-secondary" style={{ flex: 1 }}
                    onClick={() => unlockSlot(activeSlotId)}>
                    ↩ Unlock
                  </button>
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Pending bot results ─────────────────────────────────────────────── */}
      {Object.entries(game.results || {}).some(([, r]) => r.pending && !r.locked) && (
        <div className="card">
          <div className="card-title">⏳ Pending — Tap to Lock</div>
          {TIMEOUT_SLOTS.filter(s => game.results[s.id]?.pending && !game.results[s.id]?.locked).map(slot => {
            const res    = game.results[slot.id];
            const winner = game.assignments?.[res.digit] || null;
            return (
              <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15,
                  color: "var(--court-bright)", minWidth: 60 }}>{slot.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 56 }}>{res.scoreA}–{res.scoreB}</div>
                <div style={{ flex: 1, fontWeight: 600, color: "var(--court-bright)", fontSize: 12 }}>
                  {winner || `Digit ${res.digit}`}
                </div>
                <button onClick={() => lockSlot(slot.id, res.scoreA, res.scoreB)}
                  style={{ background: "var(--court-dim)", color: "#fff", border: "none",
                    borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
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

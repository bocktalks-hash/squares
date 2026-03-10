import { useState } from "react";
import { BACKEND, TIMEOUT_SLOTS, SPORT_CONFIG } from "../../shared/constants";
import { calcDigit, makeAbbr } from "../../shared/utils";

export default function TOLivePanel({ game, onUpdate, onToast, botProps }) {
  const { botRunning, setBotRunning, botStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores } = botProps;
  const [activeSlotId, setActiveSlotId] = useState(() => TIMEOUT_SLOTS.find(s => !game.results[s.id]?.locked)?.id || null);
  const [challenging, setChallenging] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);

  const liveDigit = calcDigit(scoreA, scoreB);
  const liveWinner = game.assignments[liveDigit] || null;

  const lockSlot = (slotId, sA, sB) => {
    const digit = calcDigit(sA, sB);
    const winner = game.assignments[digit] || null;
    const updated = { ...game.results, [slotId]: { scoreA: sA, scoreB: sB, digit, winner, locked: true, paid: false, pending: false } };
    onUpdate({ results: updated });
    const slot = TIMEOUT_SLOTS.find(s => s.id === slotId);
    onToast(winner ? `🔒 ${slot?.label} locked — ${winner} wins!` : `🔒 ${slot?.label} locked — digit ${digit}, no player`);
    const remaining = TIMEOUT_SLOTS.find(s => s.id !== slotId && !game.results[s.id]?.locked);
    if (remaining) setActiveSlotId(remaining.id);
  };

  const challenge = async () => {
    if (!game.espnGameId) { setChallengeResult({ error: "No ESPN game linked — select a game in Setup first." }); return; }
    setChallenging(true); setChallengeResult(null);
    try {
      const path = SPORT_CONFIG[game.sport]?.path || "basketball/mens-college-basketball";
      const res = await fetch(`${BACKEND}/playbyplay?gameId=${game.espnGameId}&sport=${path}`);
      const data = await res.json();
      const plays = data.plays || [];
      const tvPlays = plays.filter(p => (p.text || "").toLowerCase().includes("official tv timeout"));
      if (tvPlays.length === 0) {
        setChallengeResult({ notYet: true, error: "No Official TV Timeout found yet." });
      } else {
        const h1 = tvPlays.filter(p => p.period === 1);
        const h2 = tvPlays.filter(p => p.period === 2);
        const h1Slots = ["h1_16", "h1_12", "h1_8", "h1_4", "h1_0"];
        const h2Slots = ["h2_16", "h2_12", "h2_8", "h2_4", "h2_0"];
        const slotMap = {};
        h1.forEach((p, i) => { if (i < h1Slots.length) slotMap[h1Slots[i]] = p; });
        h2.forEach((p, i) => { if (i < h2Slots.length) slotMap[h2Slots[i]] = p; });
        const matchedPlay = activeSlotId ? slotMap[activeSlotId] : null;
        const slotLabel = activeSlotId ? TIMEOUT_SLOTS.find(s => s.id === activeSlotId)?.label : "?";
        if (!matchedPlay) {
          setChallengeResult({ notYet: true, error: `Timeout at ${slotLabel} hasn't happened yet.` });
        } else {
          const { awayScore, homeScore, clock, period, text } = matchedPlay;
          const validScores = typeof awayScore === "number" && typeof homeScore === "number" && awayScore >= 0 && homeScore >= 0;
          setChallengeResult({ awayScore, homeScore, clock, period, text });
          if (validScores) { setScoreA(awayScore); setScoreB(homeScore); }
        }
      }
    } catch { setChallengeResult({ error: "Could not fetch play-by-play. Try again." }); }
    setChallenging(false);
  };

  const startBot = () => { Notification.requestPermission(); setBotRunning(true); };
  const stopBot  = () => { setBotRunning(false); };
  const activeSlot = TIMEOUT_SLOTS.find(s => s.id === activeSlotId);

  return (
    <div>
      {/* Live Score Bot */}
      <div className="live-score-card">
        <div className="card-title">Live Score Bot</div>
        <div className="bot-header">
          {!botRunning
            ? <button className="btn btn-primary btn-sm" onClick={startBot}>▶ Start Bot</button>
            : <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>}
          {botRunning && <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Now</button>}
          <div className={`bot-status ${botLive ? "live" : ""}`}>
            {botLive && <span className="pulse" style={{ marginRight: 4 }}></span>}
            {botStatus || (game.teamA ? `Tracking ${game.teamA} vs ${game.teamB}` : "Select a game in Setup")}
          </div>
        </div>
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
        <div className="winner-banner">
          <div className="wb-label">Live projected winner</div>
          <div className="wb-eq">…{scoreA % 10} + …{scoreB % 10} = <strong style={{ color: "var(--court-bright)", fontSize: 14 }}>{liveDigit}</strong></div>
          <div className="wb-name" style={{ fontSize: liveWinner ? 38 : 24, color: liveWinner ? "var(--win)" : "var(--text-dim)" }}>
            {liveWinner ? `🏆 ${liveWinner}` : `Digit ${liveDigit} — unassigned`}
          </div>
        </div>
      </div>

      {/* Manual Lock */}
      <div className="card">
        <div className="card-title">Lock a Timeout</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TIMEOUT_SLOTS.map(slot => {
            const locked = game.results[slot.id]?.locked;
            return (
              <div key={slot.id}
                className={`period-tab ${slot.id === activeSlotId ? "active" : ""} ${locked ? "locked" : ""}`}
                onClick={() => !locked && setActiveSlotId(slot.id)}>
                {slot.shortLabel} {locked && "✓"}
              </div>
            );
          })}
        </div>

        {activeSlot && !game.results[activeSlot.id]?.locked && (
          <>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
              Locking: <strong style={{ color: "var(--text)" }}>{activeSlot.label}</strong>
            </div>
            <div className="score-row">
              <label>{makeAbbr(game.teamA) || "A"}</label>
              <div className="score-stepper">
                <button onClick={() => setScoreA(s => Math.max(0, s - 1))}>−</button>
                <input type="number" value={scoreA} onChange={e => setScoreA(parseInt(e.target.value) || 0)} />
                <button onClick={() => setScoreA(s => s + 1)}>+</button>
              </div>
            </div>
            <div className="score-row">
              <label>{makeAbbr(game.teamB) || "B"}</label>
              <div className="score-stepper">
                <button onClick={() => setScoreB(s => Math.max(0, s - 1))}>−</button>
                <input type="number" value={scoreB} onChange={e => setScoreB(parseInt(e.target.value) || 0)} />
                <button onClick={() => setScoreB(s => s + 1)}>+</button>
              </div>
            </div>

            <div className="winner-banner" style={{ margin: "10px 0" }}>
              <div className="wb-label">Winner if locked now</div>
              <div className="wb-eq">…{scoreA % 10} + …{scoreB % 10} = <strong style={{ color: "var(--court-bright)", fontSize: 14 }}>{calcDigit(scoreA, scoreB)}</strong></div>
              <div className="wb-name" style={{ fontSize: game.assignments[calcDigit(scoreA, scoreB)] ? 34 : 20, color: game.assignments[calcDigit(scoreA, scoreB)] ? "var(--win)" : "var(--text-dim)" }}>
                {game.assignments[calcDigit(scoreA, scoreB)] ? `🏆 ${game.assignments[calcDigit(scoreA, scoreB)]}` : `Digit ${calcDigit(scoreA, scoreB)} — unassigned`}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-win" style={{ flex: 1 }} onClick={() => lockSlot(activeSlot.id, scoreA, scoreB)}>
                🔒 Lock {activeSlot.label}
              </button>
              <button className="btn btn-secondary" onClick={challenge} disabled={challenging}>
                {challenging ? "⏳" : "⚠️ Challenge"}
              </button>
            </div>

            {challengeResult && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: challengeResult.notYet ? "rgba(255,165,0,0.08)" : challengeResult.error ? "rgba(239,68,68,0.08)" : "rgba(51,102,204,0.08)", border: `1px solid ${challengeResult.notYet ? "orange" : challengeResult.error ? "var(--danger)" : "var(--court-dim)"}`, fontSize: 12 }}>
                {challengeResult.error && !challengeResult.notYet ? (
                  <div style={{ color: "var(--danger)" }}>{challengeResult.error}</div>
                ) : challengeResult.notYet ? (
                  <div style={{ color: "orange" }}>⏳ {challengeResult.error}</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--court-bright)" }}>⚠️ Official TV Timeout — ESPN Verified</div>
                    <div style={{ color: "var(--text)" }}><strong>{game.teamA}</strong> {challengeResult.awayScore} – {challengeResult.homeScore} <strong>{game.teamB}</strong></div>
                    {challengeResult.clock && <div style={{ color: "var(--text-dim)", marginTop: 3 }}>{challengeResult.period ? `Period ${challengeResult.period} · ` : ""}{challengeResult.clock}</div>}
                    <div style={{ color: "var(--text-dim)", marginTop: 3, fontStyle: "italic" }}>{challengeResult.text}</div>
                    <div style={{ marginTop: 6, color: "var(--win)", fontSize: 11 }}>✓ Scores auto-filled above</div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {activeSlot && game.results[activeSlot.id]?.locked && (
          <div style={{ fontSize: 13, color: "var(--win)", textAlign: "center", padding: "10px 0" }}>
            ✓ {activeSlot.label} is locked
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { BACKEND, SPORT_CONFIG } from "../../shared/constants";
import { getWinner, getPeriodLabel, getTotalPeriods, getPayoutPeriods, getPerPeriodPayout, makeAbbr, mapStatus, getPollingInterval } from "../../shared/utils";

export default function ScoresPanel({ game, onUpdate, onToast, botProps }) {
  const { scoreA, setScoreA, scoreB, setScoreB, botRunning, setBotRunning, botStatus, setBotStatus, botLive, setBotLive, timerRef } = botProps;

  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);
  const periods = getTotalPeriods(game);

  const firstUnlocked = payoutPeriods.find(q => !(game.results || []).some(r => r.quarter === q)) || payoutPeriods[payoutPeriods.length - 1];
  const [currentQ, setCurrentQ] = useState(firstUnlocked);

  useEffect(() => {
    const unlocked = payoutPeriods.find(q => !(game.results || []).some(r => r.quarter === q));
    if (unlocked && unlocked !== currentQ) setCurrentQ(unlocked);
  // eslint-disable-next-line
  }, [game.results]);

  const detectPayoutPeriodKey = (espnGame) => {
    const status = mapStatus(espnGame.status);
    const period = espnGame.period || 0;
    if (status === "final") return `payout_${payoutPeriods[payoutPeriods.length - 1]}`;
    if (status === "halftime") {
      const halfQ = periods === 2 ? 1 : 2;
      if (payoutPeriods.includes(halfQ)) return `payout_${halfQ}`;
      return null;
    }
    if (status === "end of period" && payoutPeriods.includes(period)) return `payout_${period}`;
    return null;
  };

  const fetchScores = useCallback(async () => {
    if (!game.teamA && !game.teamB) { setBotStatus("Select a game in Setup first"); return; }
    try {
      const sport = SPORT_CONFIG[game.sport].path;
      const dateStr = game.gameDate ? game.gameDate.replace(/-/g, "") : "";
      const url = dateStr ? `${BACKEND}/scores?sport=${sport}&dates=${dateStr}` : `${BACKEND}/scores?sport=${sport}`;
      setBotStatus("Fetching scores…");
      const res = await fetch(url);
      const data = await res.json();
      const games = data.games || [];
      let found = game.espnGameId ? games.find(g => g.id === game.espnGameId) : null;
      if (!found) {
        const tA = (game.teamA || "").toLowerCase(), tB = (game.teamB || "").toLowerCase();
        found = games.find(g => {
          const h = (g.homeTeam || "").toLowerCase(), aw = (g.awayTeam || "").toLowerCase();
          return h.includes(tA) || h.includes(tB) || aw.includes(tA) || aw.includes(tB);
        });
      }
      if (!found) { setBotStatus(`Not found — fetched ${games.length} games for ${dateStr || "today"}.`); return; }

      const sA = found.awayScore, sB = found.homeScore;
      setScoreA(sA); setScoreB(sB);
      const status = mapStatus(found.status);
      setBotLive(status === "in progress");
      setBotStatus(`${found.shortDetail || found.status} · Updated ${new Date().toLocaleTimeString()}`);

      const payoutKey = detectPayoutPeriodKey(found);
      if (payoutKey && payoutKey !== game.botLastPeriodKey) {
        onUpdate({ botLastPeriodKey: payoutKey, botLastScore: { a: sA, b: sB } });
        const winner = getWinner(game, sA, sB);
        const matchedQ = parseInt(payoutKey.split("_")[1]);
        const ql = getPeriodLabel(game, matchedQ);
        const payoutAmt = perPeriod > 0 ? ` · $${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}` : "";
        onToast(winner ? `💰 ${ql}: ${winner} wins!${payoutAmt} (${sA}–${sB})` : `${ql} ended: ${sA}–${sB} — no winner`);
        if (Notification.permission === "granted") {
          new Notification(`💰 Squares — ${ql} Final!`, {
            body: winner ? `${winner} wins${payoutAmt}! Score: ${sA}–${sB}` : `Score: ${sA}–${sB} — no winner assigned`,
          });
        }
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, getPollingInterval(status));
    } catch {
      setBotStatus("Fetch failed — will retry");
      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, 30000);
    }
  // eslint-disable-next-line
  }, [game, botRunning, currentQ, onUpdate, onToast]);

  const startBot = () => { Notification.requestPermission(); setBotRunning(true); setBotStatus("Starting..."); };
  const stopBot = () => { setBotRunning(false); if (timerRef.current) clearTimeout(timerRef.current); setBotStatus("Stopped"); setBotLive(false); };

  useEffect(() => { if (botRunning) { fetchScores(); } }, [botRunning]); // eslint-disable-line

  const liveWinner = getWinner(game, scoreA, scoreB);
  const lockedPeriods = new Set((game.results || []).map(r => r.quarter));

  const lockPeriod = () => {
    if (lockedPeriods.has(currentQ)) return;
    const winner = getWinner(game, scoreA, scoreB);
    const result = { quarter: currentQ, scoreA, scoreB, digitA: scoreA % 10, digitB: scoreB % 10, winnerName: winner || "—" };
    const newResults = [...(game.results || []), result];
    const nextPayoutQ = payoutPeriods.find(q => q > currentQ) || currentQ;
    onUpdate({ results: newResults, currentQuarter: nextPayoutQ });
    setCurrentQ(nextPayoutQ);
    const label = getPeriodLabel(game, currentQ);
    const payoutAmt = perPeriod > 0 ? ` · $${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}` : "";
    onToast(winner ? `${label} locked! ${winner} wins!${payoutAmt} 🏆` : `${label} locked — no winner`);
  };

  const allPayoutsDone = payoutPeriods.every(q => lockedPeriods.has(q));

  return (
    <div>
      {/* Score Bot */}
      <div className="live-score-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0 }}>Score Bot</div>
          {botLive && <span className="status-badge live"><span className="pulse"></span> LIVE</span>}
          {botStatus?.includes("Final") && <span className="status-badge final">FINAL</span>}
        </div>
        <div className="bot-header">
          {!botRunning
            ? <button className="btn btn-primary btn-sm" onClick={startBot} disabled={!game.teamA}>▶ Start Bot</button>
            : <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>}
          {botRunning && <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Refresh</button>}
          <div className={`bot-status ${botLive ? "live" : ""}`} style={{ flex: 1, fontSize: 11 }}>
            {botStatus || (game.teamA ? `Ready — ${game.teamA} vs ${game.teamB}` : "Select a game in Setup first")}
          </div>
        </div>
        {(scoreA > 0 || scoreB > 0) ? (
          <div className="score-display" style={{ marginTop: 12 }}>
            <div className="score-team">
              <div className="score-team-name">{game.teamA || "Team A"}</div>
              <div className="score-num">{scoreA}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="score-sep">–</div>
              {botStatus && <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: .5, textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{botStatus.split("·")[0].trim()}</div>}
            </div>
            <div className="score-team">
              <div className="score-team-name">{game.teamB || "Team B"}</div>
              <div className="score-num">{scoreB}</div>
            </div>
          </div>
        ) : botRunning ? (
          <div style={{ textAlign: "center", padding: "16px", color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>Waiting for game to start…
          </div>
        ) : null}
      </div>

      {/* Lock a Period */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            {payoutPeriods.length < periods ? "Lock a Payout Period" : "Lock a Period"}
          </div>
          {perPeriod > 0 && (
            <span style={{ fontSize: 11, color: "var(--win)", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: .5 }}>
              ${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)} / win
            </span>
          )}
        </div>

        <div className="period-tabs">
          {payoutPeriods.map(q => (
            <div key={q}
              className={`period-tab ${q === currentQ ? "active" : ""} ${lockedPeriods.has(q) ? "locked" : ""}`}
              onClick={() => setCurrentQ(q)}>
              {getPeriodLabel(game, q)}{lockedPeriods.has(q) ? " ✓" : ""}
            </div>
          ))}
        </div>

        {payoutPeriods.length < periods && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12, padding: "6px 10px", background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            Tracking: <span style={{ color: "var(--court-bright)", fontWeight: 600 }}>
              {payoutPeriods.map(q => getPeriodLabel(game, q)).join(" · ")}
            </span>
          </div>
        )}

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

        {liveWinner ? (
          <div className="winner-banner">
            <div className="wb-label">{lockedPeriods.has(currentQ) ? `${getPeriodLabel(game, currentQ)} Winner` : "Winner if locked now"}</div>
            <div className="wb-eq">…{scoreA % 10} + …{scoreB % 10} = <strong style={{ color: "var(--court-bright)", fontSize: 14 }}>{(scoreA + scoreB) % 10}</strong></div>
            <div className="wb-name">🏆 {liveWinner}</div>
            {perPeriod > 0 && <div style={{ fontSize: 11, color: "var(--win)", marginTop: 4, fontWeight: 600 }}>${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)} payout</div>}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "14px 0", color: "var(--text-dim)", fontSize: 13, background: "var(--surface2)", borderRadius: 8, margin: "8px 0" }}>
            …{scoreA % 10} + …{scoreB % 10} = <strong style={{ color: "var(--court-bright)" }}>{(scoreA + scoreB) % 10}</strong>
            <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-dim)" }}>No matching square assigned for digit {(scoreA + scoreB) % 10}</div>
          </div>
        )}

        {allPayoutsDone ? (
          <div style={{ textAlign: "center", padding: "12px", background: "var(--win-dim)", borderRadius: 8, marginTop: 10, border: "1px solid rgba(34,197,94,0.3)", color: "var(--win)", fontWeight: 700, fontSize: 13 }}>
            🏁 All payout periods locked!
          </div>
        ) : (
          <button className="btn btn-win" style={{ width: "100%", marginTop: 10, padding: "12px", fontSize: 14 }}
            onClick={lockPeriod} disabled={lockedPeriods.has(currentQ)}>
            {lockedPeriods.has(currentQ) ? `✓ ${getPeriodLabel(game, currentQ)} Already Locked` : `🔒 Lock ${getPeriodLabel(game, currentQ)}`}
          </button>
        )}
      </div>
    </div>
  );
}

import { getPeriodLabel, getPayoutPeriods, getPerPeriodPayout } from "../../shared/utils";

export function HistoryPanel({ game, onUpdate }) {
  const results = game.results || [];
  if (!results.length) return (
    <div className="empty">
      <div className="empty-icon">📋</div>
      <div className="empty-text">No results locked yet.<br />Lock a period in the Scores tab.</div>
    </div>
  );

  const unlockPeriod = (quarter) => onUpdate({ results: results.filter(r => r.quarter !== quarter) });
  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);

  return (
    <div className="card">
      <div className="card-title">Results History</div>
      {results.map((r, i) => {
        const isPayout = payoutPeriods.includes(r.quarter);
        return (
          <div key={i} className="result-row">
            <div className="result-period">
              {getPeriodLabel(game, r.quarter)}
              {perPeriod > 0 && isPayout && <span style={{ fontSize: 9, color: "var(--court-bright)", marginLeft: 4, fontWeight: 700 }}>$</span>}
            </div>
            <div className="result-score">{r.scoreA}–{r.scoreB}</div>
            <div className="result-name" style={{ color: isPayout ? "var(--win)" : "var(--text-mid)" }}>
              {r.winnerName}
              {perPeriod > 0 && isPayout && (
                <span style={{ fontSize: 11, color: "var(--court-bright)", marginLeft: 6, fontWeight: 600 }}>
                  +${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}
                </span>
              )}
            </div>
            <div className="result-digits" style={{ marginRight: 8 }}>…{r.digitA}+…{r.digitB}={(r.digitA + r.digitB) % 10}</div>
            <button className="unlock-btn" onClick={() => unlockPeriod(r.quarter)} title="Unlock to re-enter">↩ Unlock</button>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 12, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
        Tap Unlock to correct a result.
      </div>
    </div>
  );
}

export function PayoutPanel({ game, onUpdate }) {
  const payments = game.payments || {};
  const totalPot = parseFloat(game.totalPot) || 0;
  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);
  const results = game.results || [];

  const squareCounts = {};
  game.grid.flat().forEach(name => { if (name) squareCounts[name] = (squareCounts[name] || 0) + 1; });

  const allPlayers = Array.from(new Set([...game.players, ...Object.keys(squareCounts)])).sort();
  const totalSquares = game.grid.flat().filter(Boolean).length;

  const winsByPlayer = {};
  allPlayers.forEach(p => { winsByPlayer[p] = []; });
  results.forEach(r => {
    if (r.winnerName && payoutPeriods.includes(r.quarter)) {
      if (!winsByPlayer[r.winnerName]) winsByPlayer[r.winnerName] = [];
      winsByPlayer[r.winnerName].push(r);
    }
  });

  const togglePaid = (player) => onUpdate({ payments: { ...payments, [player]: !payments[player] } });

  const costPerSquare = totalSquares > 0 && totalPot > 0
    ? (totalPot / totalSquares)
    : (parseFloat(game.costPerSquare) || 0);

  const paidInTotal = allPlayers.filter(p => payments[p]).reduce((s, p) => s + (squareCounts[p] || 0) * costPerSquare, 0);
  const outstandingTotal = allPlayers.filter(p => !payments[p]).reduce((s, p) => s + (squareCounts[p] || 0) * costPerSquare, 0);
  const paidOutTotal = results.filter(r => payoutPeriods.includes(r.quarter)).reduce((s) => s + perPeriod, 0);

  const periodSplit = payoutPeriods.map(q => ({
    q, label: getPeriodLabel(game, q),
    result: results.find(r => r.quarter === q),
    payout: perPeriod,
  }));

  return (
    <div>
      <div className="card">
        <div className="card-title">💰 Payout Schedule</div>
        {totalPot === 0 ? (
          <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warn-dim)", borderRadius: 7, padding: "10px 12px", border: "1px solid rgba(245,158,11,0.2)" }}>
            ⚠ Set the Total Pot in Setup → Step 1 to see payout amounts.
          </div>
        ) : (
          <>
            <div className="payment-summary" style={{ marginBottom: 14 }}>
              <div className="pay-stat"><div className="ps-val">${totalPot}</div><div className="ps-label">Total Pot</div></div>
              <div className="pay-stat"><div className="ps-val">{payoutPeriods.length}</div><div className="ps-label">Payouts</div></div>
              <div className="pay-stat ps-green"><div className="ps-val">${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}</div><div className="ps-label">Per Winner</div></div>
              <div className="pay-stat"><div className="ps-val" style={{ color: paidOutTotal > 0 ? "var(--win)" : "var(--text-dim)" }}>${paidOutTotal % 1 === 0 ? paidOutTotal : paidOutTotal.toFixed(2)}</div><div className="ps-label">Paid Out</div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {periodSplit.map(({ q, label, result, payout }) => (
                <div key={q} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: result ? "rgba(34,197,94,0.07)" : "var(--surface2)", border: `1px solid ${result ? "rgba(34,197,94,0.25)" : "var(--border)"}`, borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: "var(--court-bright)", minWidth: 52, letterSpacing: .5 }}>{label}</div>
                  <div style={{ flex: 1, fontSize: 13 }}>
                    {result ? <span style={{ fontWeight: 700, color: "var(--win)" }}>{result.winnerName || "—"}</span> : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Not yet locked</span>}
                    {result && <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 8 }}>{result.scoreA}–{result.scoreB}</span>}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: result ? "var(--win)" : "var(--text-dim)" }}>${payout % 1 === 0 ? payout : payout.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">💵 Buy-In Tracker</div>
        {totalSquares > 0 && costPerSquare > 0 && (
          <div className="payment-summary" style={{ marginBottom: 14 }}>
            <div className="pay-stat"><div className="ps-val">{totalSquares}</div><div className="ps-label">Squares Sold</div></div>
            <div className="pay-stat ps-green"><div className="ps-val">${paidInTotal % 1 === 0 ? paidInTotal : paidInTotal.toFixed(2)}</div><div className="ps-label">Collected</div></div>
            <div className={`pay-stat ${outstandingTotal > 0 ? "ps-warn" : "ps-green"}`}><div className="ps-val">${outstandingTotal % 1 === 0 ? outstandingTotal : outstandingTotal.toFixed(2)}</div><div className="ps-label">Outstanding</div></div>
          </div>
        )}
        {allPlayers.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No players assigned yet.</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Player</th>
                <th style={{ textAlign: "center" }}>Sq</th>
                {costPerSquare > 0 && <th style={{ textAlign: "right" }}>Owes</th>}
                <th style={{ textAlign: "right" }}>Winnings</th>
                <th style={{ textAlign: "right", paddingRight: 14 }}>Paid In</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(player => {
                const count = squareCounts[player] || 0;
                const owes = count * costPerSquare;
                const wins = winsByPlayer[player] || [];
                const earned = wins.length * perPeriod;
                const paid = !!payments[player];
                return (
                  <tr key={player}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{player}</td>
                    <td style={{ textAlign: "center", color: "var(--court-bright)", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{count}</td>
                    {costPerSquare > 0 && <td style={{ textAlign: "right", color: paid ? "var(--text-dim)" : "var(--warn)", fontWeight: 600 }}>${owes % 1 === 0 ? owes : owes.toFixed(2)}</td>}
                    <td style={{ textAlign: "right", fontWeight: 700, color: earned > 0 ? "var(--win)" : "var(--text-dim)" }}>{earned > 0 ? `$${earned % 1 === 0 ? earned : earned.toFixed(2)}` : "—"}</td>
                    <td style={{ textAlign: "right", paddingRight: 14 }}>
                      <span className={`paid-toggle ${paid ? "paid" : "unpaid"}`} onClick={() => togglePaid(player)}>
                        {paid ? "✓ Paid" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

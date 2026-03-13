import { TIMEOUT_SLOTS } from "../../shared/constants";
import { calcDigit } from "../../shared/utils";

// ─── Board Panel ──────────────────────────────────────────────────────────────
export function TOBoardPanel({ game, onUpdate, onToast }) {
  const winCounts = {};
  game.players.forEach(p => { winCounts[p] = 0; });
  Object.values(game.results).forEach(r => {
    if (r.locked && r.winner) winCounts[r.winner] = (winCounts[r.winner] || 0) + 1;
  });

  const togglePaid = (slotId) => {
    const cur = game.results[slotId] || {};
    onUpdate({ results: { ...game.results, [slotId]: { ...cur, paid: !cur.paid } } });
  };

  return (
    <div>
      {[1, 2].map(half => (
        <div key={half} className="card">
          <div className="card-title">{half === 1 ? "First Half" : "Second Half"}</div>
          {TIMEOUT_SLOTS.filter(s => s.half === half).map(slot => {
            const res = game.results[slot.id];
            const locked = res?.locked;
            return (
              <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: locked ? "var(--court-bright)" : "var(--text-dim)", minWidth: 60, letterSpacing: .5 }}>
                  {slot.label}
                </div>
                {locked ? (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 56, fontVariantNumeric: "tabular-nums" }}>{res.scoreA}–{res.scoreB}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", minWidth: 52 }}>…{res.scoreA % 10}+…{res.scoreB % 10}={res.digit}</div>
                    <div style={{ flex: 1, fontWeight: 700, color: "var(--win)", fontSize: 13 }}>{res.winner || <span style={{ color: "var(--text-dim)" }}>—</span>}</div>
                    <div onClick={() => togglePaid(slot.id)}
                      style={{ cursor: "pointer", fontSize: 11, color: res.paid ? "var(--win)" : "var(--text-dim)", border: "1px solid", borderColor: res.paid ? "var(--win)" : "var(--border)", borderRadius: 4, padding: "2px 8px", userSelect: "none", flexShrink: 0, background: res.paid ? "var(--win-dim)" : "transparent", transition: "all .15s" }}>
                      {res.paid ? "✓ Paid" : "Unpaid"}
                    </div>
                    <button className="unlock-btn" style={{ marginLeft: 4 }}
                      onClick={() => {
                        const updated = { ...game.results };
                        delete updated[slot.id];
                        onUpdate({ results: updated });
                        onToast(`↩ ${slot.label} unlocked`);
                      }}>↩</button>
                  </>
                ) : res?.pending ? (
                  <>
                    <div style={{ fontSize: 12, color: "var(--court-bright)", minWidth: 60, fontWeight: 600 }}>{res.scoreA}–{res.scoreB}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", minWidth: 52 }}>…{res.scoreA % 10}+…{res.scoreB % 10}={res.digit}</div>
                    <div style={{ flex: 1, fontWeight: 600, color: "var(--court-bright)", fontSize: 12 }}>{res.winner || `Digit ${res.digit}`}</div>
                    <button onClick={() => {
                      const digit = calcDigit(res.scoreA, res.scoreB);
                      const winner = game.assignments[digit] || null;
                      const updated = { ...game.results, [slot.id]: { ...res, digit, winner, locked: true, paid: false, pending: false } };
                      onUpdate({ results: updated });
                      onToast(winner ? `🔒 ${slot.label} locked — ${winner} wins!` : `🔒 ${slot.label} locked — digit ${digit}`);
                    }} style={{ background: "var(--court-dim)", color: "#fff", border: "none", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                      🔒 Lock
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-dim)", fontStyle: "italic", flex: 1 }}>Pending…</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {game.players.length > 0 && (
        <div className="card">
          <div className="card-title">Leaderboard</div>
          {Object.entries(winCounts).sort((a, b) => b[1] - a[1]).map(([player, wins], idx) => {
            const digit = Object.entries(game.assignments).find(([, p]) => p === player)?.[0];
            const isLeader = wins > 0 && idx === 0;
            return (
              <div key={player} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "var(--court-bright)", minWidth: 28, textAlign: "center" }}>{digit ?? "?"}</div>
                <div style={{ flex: 1, fontWeight: 600, color: isLeader ? "var(--text)" : "var(--text-mid)" }}>{player}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: wins > 0 ? "var(--win)" : "var(--text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                  {isLeader && wins > 0 && <span style={{ fontSize: 14 }}>🏆</span>}
                  {wins} <span style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>win{wins !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payout Panel ─────────────────────────────────────────────────────────────
export function TOPayoutPanel({ game, onUpdate }) {
  const totalPot = parseFloat(game.totalPot) || 0;
  const perSlot = totalPot > 0 ? totalPot / TIMEOUT_SLOTS.length : 0;
  const payments = game.payments || {};
  const allPlayers = [...game.players].sort();

  const togglePaid = (player) => onUpdate({ payments: { ...payments, [player]: !payments[player] } });

  const winsByPlayer = {};
  allPlayers.forEach(p => { winsByPlayer[p] = []; });
  Object.entries(game.results).forEach(([slotId, r]) => {
    if (r.locked && r.winner) {
      if (!winsByPlayer[r.winner]) winsByPlayer[r.winner] = [];
      winsByPlayer[r.winner].push(slotId);
    }
  });

  const lockedSlots = Object.values(game.results).filter(r => r.locked);
  const paidOutSoFar = lockedSlots.length * perSlot;
  const paidInCount = allPlayers.filter(p => payments[p]).length;
  const outstandingCount = allPlayers.length - paidInCount;
  const buyInPerPlayer = allPlayers.length > 0 && totalPot > 0 ? totalPot / allPlayers.length : 0;

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
              <div className="pay-stat"><div className="ps-val">${perSlot % 1 === 0 ? perSlot : perSlot.toFixed(2)}</div><div className="ps-label">Per Slot</div></div>
              <div className="pay-stat ps-green"><div className="ps-val">${paidOutSoFar % 1 === 0 ? paidOutSoFar : paidOutSoFar.toFixed(2)}</div><div className="ps-label">Paid Out</div></div>
              <div className="pay-stat ps-warn"><div className="ps-val">${((totalPot - paidOutSoFar) % 1 === 0) ? totalPot - paidOutSoFar : (totalPot - paidOutSoFar).toFixed(2)}</div><div className="ps-label">Remaining</div></div>
            </div>
            {[1, 2].map(half => (
              <div key={half} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-dim)", fontWeight: 600, marginBottom: 6 }}>
                  {half === 1 ? "First Half" : "Second Half"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {TIMEOUT_SLOTS.filter(s => s.half === half).map(slot => {
                    const res = game.results[slot.id];
                    const locked = res?.locked;
                    return (
                      <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: locked ? "rgba(34,197,94,0.07)" : "var(--surface2)", border: `1px solid ${locked ? "rgba(34,197,94,0.25)" : "var(--border)"}`, borderRadius: 7 }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: "var(--court-bright)", minWidth: 44, letterSpacing: .5 }}>{slot.label}</div>
                        <div style={{ flex: 1, fontSize: 12 }}>
                          {locked ? <span style={{ fontWeight: 700, color: "var(--win)" }}>{res.winner || "—"}</span> : <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Pending</span>}
                          {locked && <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 6 }}>{res.scoreA}–{res.scoreB}</span>}
                        </div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: locked ? "var(--win)" : "var(--text-dim)" }}>${perSlot % 1 === 0 ? perSlot : perSlot.toFixed(2)}</div>
                        {locked && (
                          <div onClick={() => {
                            const cur = game.results[slot.id] || {};
                            onUpdate({ results: { ...game.results, [slot.id]: { ...cur, paid: !cur.paid } } });
                          }} style={{ cursor: "pointer", fontSize: 10, fontWeight: 600, color: res.paid ? "var(--win)" : "var(--text-dim)", border: "1px solid", borderColor: res.paid ? "rgba(34,197,94,0.4)" : "var(--border)", borderRadius: 20, padding: "2px 8px", userSelect: "none", background: res.paid ? "var(--win-dim)" : "transparent", transition: "all .15s" }}>
                            {res.paid ? "✓" : "Pay"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">💵 Buy-In Tracker</div>
        {buyInPerPlayer > 0 && (
          <div className="payment-summary" style={{ marginBottom: 14 }}>
            <div className="pay-stat"><div className="ps-val">${buyInPerPlayer % 1 === 0 ? buyInPerPlayer : buyInPerPlayer.toFixed(2)}</div><div className="ps-label">Per Player</div></div>
            <div className="pay-stat ps-green"><div className="ps-val">{paidInCount}</div><div className="ps-label">Paid In</div></div>
            <div className={`pay-stat ${outstandingCount > 0 ? "ps-warn" : "ps-green"}`}><div className="ps-val">{outstandingCount}</div><div className="ps-label">Outstanding</div></div>
          </div>
        )}
        {allPlayers.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No players yet — add them in Setup and randomize digits.</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Player</th>
                <th style={{ textAlign: "center" }}>Digit</th>
                <th style={{ textAlign: "center" }}>Wins</th>
                {totalPot > 0 && <th style={{ textAlign: "right" }}>Earned</th>}
                <th style={{ textAlign: "right", paddingRight: 14 }}>Buy-In</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(player => {
                const digit = Object.entries(game.assignments).find(([, p]) => p === player)?.[0] ?? "—";
                const wins = (winsByPlayer[player] || []).length;
                const earned = wins * perSlot;
                const paid = !!payments[player];
                return (
                  <tr key={player}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{player}</td>
                    <td style={{ textAlign: "center", color: "var(--court-bright)", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18 }}>{digit}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: wins > 0 ? "var(--win)" : "var(--text-dim)" }}>{wins}</td>
                    {totalPot > 0 && <td style={{ textAlign: "right", fontWeight: 700, color: earned > 0 ? "var(--win)" : "var(--text-dim)" }}>{earned > 0 ? `$${earned % 1 === 0 ? earned : earned.toFixed(2)}` : "—"}</td>}
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

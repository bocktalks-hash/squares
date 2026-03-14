import { useState, useEffect } from "react";
import { BACKEND, SPORT_CONFIG, TIMEOUT_SLOTS } from "../shared/constants";
import { makeAbbr } from "../shared/utils";
import { css } from "../shared/styles";

// ── Challenge Modal ────────────────────────────────────────────────────────────
function ChallengeModal({ periodLabel, gameCode, onClose, onToast }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!name.trim()) { onToast("Enter your name"); return; }
    setSending(true);
    try {
      const res = await fetch(`${BACKEND}/games/${gameCode}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim(), periodLabel, message: message.trim() }),
      });
      if (res.ok) { onToast("Challenge submitted!"); onClose(); }
      else onToast("Could not submit challenge");
    } catch {
      onToast("Could not submit challenge");
    }
    setSending(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "var(--surface1)", border: "1px solid var(--border)", borderRadius: 14,
        padding: 24, width: "100%", maxWidth: 380,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 6 }}>Challenge Result</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>
          Challenging: <strong style={{ color: "var(--court-bright)" }}>{periodLabel}</strong>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", color: "var(--text)", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Reason (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Why are you challenging this?" rows={3}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", color: "var(--text)", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={sending}>{sending ? "Sending…" : "Submit Challenge"}</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Squares Viewer ─────────────────────────────────────────────────────────────
function SquaresViewer({ game, code, onToast }) {
  const [challengeTarget, setChallengeTarget] = useState(null);
  const cfg = SPORT_CONFIG[game.sport];

  const currentWinnerCell = () => {
    const last = (game.results || []).slice(-1)[0];
    if (!last) return null;
    const dA = last.scoreA % 10, dB = last.scoreB % 10;
    const c = (game.colPairs || []).findIndex(p => p.includes(dA));
    const r = (game.rowPairs || []).findIndex(p => p.includes(dB));
    return (c >= 0 && r >= 0) ? [r, c] : null;
  };
  const prevWinnerCells = () => (game.results || []).slice(0, -1).map(res => {
    const dA = res.scoreA % 10, dB = res.scoreB % 10;
    const c = (game.colPairs || []).findIndex(p => p.includes(dA));
    const r = (game.rowPairs || []).findIndex(p => p.includes(dB));
    return (c >= 0 && r >= 0) ? `${r},${c}` : null;
  }).filter(Boolean);

  const curCell = currentWinnerCell();
  const prevCells = prevWinnerCells();
  const cellClass = (r, c) => {
    if (curCell && curCell[0] === r && curCell[1] === c) return "sq-cell filled winner-now";
    if (prevCells.includes(`${r},${c}`)) return "sq-cell filled winner-prev";
    if (game.grid?.[r]?.[c]) return "sq-cell filled";
    return "sq-cell empty-cell";
  };

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>👁 Viewing · Read Only</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{game.teamA || "Team A"} vs {game.teamB || "Team B"}</div>
        {game.name && <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>{game.name}</div>}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0 }}>Grid</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{(game.grid || []).flat().filter(Boolean).length}/25 filled</div>
        </div>
        <div className="grid-wrap">
          <table className="sq-grid">
            <thead>
              <tr>
                <th style={{ width: 38 }}>
                  <div style={{ fontSize: 8, color: "var(--text-dim)", lineHeight: 1.3, padding: 2 }}>
                    <span style={{ color: "var(--court-bright)" }}>{game.teamA ? makeAbbr(game.teamA) : "A"}</span>→<br />
                    <span style={{ color: "var(--text-mid)" }}>{game.teamB ? makeAbbr(game.teamB) : "B"}</span>↓
                  </div>
                </th>
                {(game.colPairs || []).map((pair, i) => <th key={i}><div className="col-header">{pair[0]}/{pair[1]}</div></th>)}
              </tr>
            </thead>
            <tbody>
              {(game.rowPairs || []).map((pair, rowIdx) => (
                <tr key={rowIdx}>
                  <th><div className="col-header">{pair[0]}/{pair[1]}</div></th>
                  {(game.colPairs || []).map((_p, colIdx) => (
                    <td key={colIdx} className={cellClass(rowIdx, colIdx)}>{game.grid?.[rowIdx]?.[colIdx] || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(game.results || []).length > 0 && (
        <div className="card">
          <div className="card-title">Results</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {game.results.map((r, i) => (
              <div key={i} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--court-dim)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8 }}>
                    {cfg?.periodLabels?.[r.quarter] || `Period ${r.quarter}`}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontWeight: 700, color: "var(--win)", fontSize: 14 }}>🏆 {r.winnerName}</div>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "3px 8px" }}
                      onClick={() => setChallengeTarget(cfg?.periodLabels?.[r.quarter] || `Period ${r.quarter}`)}>
                      ⚑ Challenge
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 4 }}>
                  {game.teamA} {r.scoreA} – {game.teamB} {r.scoreB}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {challengeTarget && <ChallengeModal periodLabel={challengeTarget} gameCode={code} onClose={() => setChallengeTarget(null)} onToast={onToast} />}
    </div>
  );
}

// ── Timeout Viewer ─────────────────────────────────────────────────────────────
function TimeoutViewer({ game, code, onToast }) {
  const [challengeTarget, setChallengeTarget] = useState(null);
  const half1 = TIMEOUT_SLOTS.filter(s => s.half === 1);
  const half2 = TIMEOUT_SLOTS.filter(s => s.half === 2);

  const SlotCard = ({ slot }) => {
    const result = game.results?.[slot.id];
    const winner = result ? (result.winner || (game.assignments || {})[String(result.digit)]) : null;
    return (
      <div style={{
        background: result ? "rgba(51,102,204,0.08)" : "var(--surface2)",
        border: `1px solid ${result ? "var(--court-dim)" : "var(--border)"}`,
        borderRadius: 8, padding: "10px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: .8, textTransform: "uppercase" }}>{slot.label}</div>
          {result ? (
            <>
              <div style={{ fontWeight: 700, color: "var(--win)", fontSize: 14, marginTop: 2 }}>🏆 {winner || `Digit ${result.digit}`}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                {game.teamA} {result.scoreA} + {game.teamB} {result.scoreB} = …{result.digit}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>Pending</div>
          )}
        </div>
        {result && (
          <button className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "3px 8px", flexShrink: 0 }}
            onClick={() => setChallengeTarget(slot.label)}>
            ⚑ Challenge
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>👁 Viewing · Read Only</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{game.teamA || "Team A"} vs {game.teamB || "Team B"}</div>
      </div>

      {Object.keys(game.assignments || {}).length > 0 && (
        <div className="card">
          <div className="card-title">Player Numbers</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(game.assignments).map(([digit, name]) => (
              <div key={digit} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "var(--court-bright)" }}>{digit}</span>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">1st Half</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{half1.map(s => <SlotCard key={s.id} slot={s} />)}</div>
      </div>
      <div className="card">
        <div className="card-title">2nd Half</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{half2.map(s => <SlotCard key={s.id} slot={s} />)}</div>
      </div>

      {challengeTarget && <ChallengeModal periodLabel={challengeTarget} gameCode={code} onClose={() => setChallengeTarget(null)} onToast={onToast} />}
    </div>
  );
}

// ── Main ViewerMode wrapper ────────────────────────────────────────────────────
export default function ViewerMode({ code }) {
  const [gameData, setGameData] = useState(null);
  const [gameType, setGameType] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchGame = async () => {
    try {
      const res = await fetch(`${BACKEND}/games/${code}`);
      if (!res.ok) { setError("Game not found. Check the code and try again."); return; }
      const { data, type } = await res.json();
      setGameData(data); setGameType(type); setLastUpdate(new Date());
    } catch {
      setError("Could not load game. Check your connection.");
    }
  };

  useEffect(() => {
    fetchGame();
    const t = setInterval(fetchGame, 10000); // poll every 10s for near-realtime updates
    return () => clearInterval(t);
  }, [code]);

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" style={{ height: 24, width: 24, objectFit: "contain" }} />
            Bock Talks <span>{gameType === "timeout" ? "Timeout" : "Squares"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastUpdate && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Updated {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
            <button className="btn btn-secondary btn-sm" onClick={fetchGame}>↻</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
          {error && (
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Game Not Found</div>
              <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 20 }}>{error}</div>
              <button className="btn btn-secondary" onClick={() => window.location.href = "/"}>← Back to App</button>
            </div>
          )}
          {!error && !gameData && <div style={{ padding: 60, textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>Loading game…</div>}
          {!error && gameData && gameType === "timeout" && <TimeoutViewer game={gameData} code={code} onToast={showToast} />}
          {!error && gameData && gameType !== "timeout" && <SquaresViewer game={gameData} code={code} onToast={showToast} />}
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10,
          padding: "10px 20px", fontSize: 14, color: "var(--text)", zIndex: 300,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
        }}>{toast}</div>
      )}
    </>
  );
}

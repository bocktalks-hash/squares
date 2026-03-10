import { useState, useEffect } from "react";
import { BACKEND } from "../shared/constants";
import { makeAbbr } from "../shared/utils";
import { css } from "../shared/styles";

export default function PickMode({ code, token }) {
  const [gameData, setGameData] = useState(null);
  const [pick, setPick] = useState(null); // { player_name, row_idx, col_idx }
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(null); // [rowIdx, colIdx] being claimed
  const [toast, setToast] = useState(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    try {
      // Load game data and player's pick status
      const [gameRes, pickRes] = await Promise.all([
        fetch(`${BACKEND}/games/${code}`),
        fetch(`${BACKEND}/games/${code}/picks?playerToken=${token}`),
      ]);
      if (!gameRes.ok) { setError("Game not found."); return; }
      if (!pickRes.ok) { setError("Your pick link is invalid or has expired."); return; }

      const { data } = await gameRes.json();
      const { pick: pickData } = await pickRes.json();

      setGameData(data);
      setPick(pickData);

      // Check deadline
      if (data.pickDeadline && new Date(data.pickDeadline) < new Date()) {
        setDeadlinePassed(true);
      }
    } catch {
      setError("Could not load game. Check your connection.");
    }
  };

  useEffect(() => { load(); }, [code, token]);

  const claimSquare = async (rowIdx, colIdx) => {
    if (pick?.row_idx !== null && pick?.row_idx !== undefined) {
      showToast("You already picked a square!"); return;
    }
    if (deadlinePassed) { showToast("Pick deadline has passed"); return; }
    if (gameData?.grid?.[rowIdx]?.[colIdx]) {
      showToast(`That square is taken by ${gameData.grid[rowIdx][colIdx]}`); return;
    }

    setClaiming([rowIdx, colIdx]);
    try {
      const res = await fetch(`${BACKEND}/games/${code}/picks/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerToken: token, rowIdx, colIdx }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Square claimed! You're in, ${data.playerName}!`);
        await load(); // Refresh
      } else {
        showToast(data.error || "Could not claim square");
      }
    } catch {
      showToast("Could not claim square");
    }
    setClaiming(null);
  };

  const hasPicked = pick?.row_idx !== null && pick?.row_idx !== undefined;

  if (error) return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="topbar">
          <div className="topbar-logo">Bock Talks <span>Squares</span></div>
        </div>
        <div style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Link Not Found</div>
          <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{error}</div>
        </div>
      </div>
    </>
  );

  if (!gameData || !pick) return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="topbar"><div className="topbar-logo">Bock Talks <span>Squares</span></div></div>
        <div style={{ padding: 60, textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>Loading…</div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" style={{ height: 24, width: 24, objectFit: "contain" }} />
            Bock Talks <span>Squares</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 80px" }}>
          {/* Header */}
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
              {gameData.teamA || "Team A"} vs {gameData.teamB || "Team B"}
            </div>
            <div style={{ fontSize: 14, color: "var(--court-bright)", fontWeight: 600 }}>
              Hey {pick.player_name}! {hasPicked ? "You picked your square 🎉" : "Pick your square below"}
            </div>
            {gameData.pickDeadline && (
              <div style={{ fontSize: 12, color: deadlinePassed ? "var(--danger)" : "var(--text-dim)", marginTop: 6 }}>
                {deadlinePassed ? "⛔ Pick deadline has passed" : `⏰ Pick deadline: ${new Date(gameData.pickDeadline).toLocaleString()}`}
              </div>
            )}
          </div>

          {/* Already picked confirmation */}
          {hasPicked && (
            <div className="card" style={{ textAlign: "center", border: "1px solid var(--win)", background: "var(--win-dim)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--win)" }}>Your Square is Locked In!</div>
              <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 6 }}>
                Row <strong>{(gameData.rowPairs || [])[pick.row_idx]?.join("/")}</strong> ×
                Col <strong>{(gameData.colPairs || [])[pick.col_idx]?.join("/")}</strong>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
                You win if the score ends in these digits!
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="card">
            <div style={{ marginBottom: 10 }}>
              <div className="card-title" style={{ margin: "0 0 4px" }}>
                {hasPicked ? "The Board" : "Tap a square to claim it"}
              </div>
              {!hasPicked && !deadlinePassed && (
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Green = available · Grey = taken · Tap any green square to pick it
                </div>
              )}
            </div>
            <div className="grid-wrap">
              <table className="sq-grid">
                <thead>
                  <tr>
                    <th style={{ width: 38 }}>
                      <div style={{ fontSize: 8, color: "var(--text-dim)", lineHeight: 1.3, padding: 2 }}>
                        <span style={{ color: "var(--court-bright)" }}>{gameData.teamA ? makeAbbr(gameData.teamA) : "A"}</span>→<br />
                        <span style={{ color: "var(--text-mid)" }}>{gameData.teamB ? makeAbbr(gameData.teamB) : "B"}</span>↓
                      </div>
                    </th>
                    {(gameData.colPairs || []).map((pair, i) => (
                      <th key={i}><div className="col-header">{pair[0]}/{pair[1]}</div></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(gameData.rowPairs || []).map((pair, rowIdx) => (
                    <tr key={rowIdx}>
                      <th><div className="col-header">{pair[0]}/{pair[1]}</div></th>
                      {(gameData.colPairs || []).map((_p, colIdx) => {
                        const occupant = gameData.grid?.[rowIdx]?.[colIdx];
                        const isMyPick = hasPicked && pick.row_idx === rowIdx && pick.col_idx === colIdx;
                        const isClaiming = claiming && claiming[0] === rowIdx && claiming[1] === colIdx;
                        const isTaken = !!occupant;
                        const isAvailable = !isTaken && !hasPicked && !deadlinePassed;

                        let cellStyle = {};
                        let cellClass = "sq-cell";
                        if (isMyPick) { cellClass += " filled winner-now"; }
                        else if (isTaken) { cellClass += " filled"; }
                        else if (isAvailable) {
                          cellClass += " empty-cell";
                          cellStyle = { cursor: "pointer", background: "rgba(51,204,100,0.08)", border: "1px solid rgba(51,204,100,0.3)" };
                        } else {
                          cellClass += " empty-cell";
                        }

                        return (
                          <td key={colIdx} className={cellClass} style={cellStyle}
                            onClick={() => isAvailable && claimSquare(rowIdx, colIdx)}>
                            {isClaiming ? "⏳" : (occupant || (isAvailable ? "+" : ""))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

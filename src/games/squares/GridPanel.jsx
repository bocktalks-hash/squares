import { useState } from "react";
import AssignModal from "../../components/AssignModal";
import { makeAbbr } from "../../shared/utils";

export default function GridPanel({ game, onUpdate }) {
  const [assignCell, setAssignCell] = useState(null);

  const currentWinnerCell = () => {
    const last = game.results[game.results.length - 1];
    if (!last) return null;
    const dA = last.scoreA % 10, dB = last.scoreB % 10;
    const c = (game.colPairs || []).findIndex(pair => pair.includes(dA));
    const r = (game.rowPairs || []).findIndex(pair => pair.includes(dB));
    return (c >= 0 && r >= 0) ? [r, c] : null;
  };

  const prevWinnerCells = () => {
    return game.results.slice(0, -1).map(res => {
      const dA = res.scoreA % 10, dB = res.scoreB % 10;
      const c = (game.colPairs || []).findIndex(pair => pair.includes(dA));
      const r = (game.rowPairs || []).findIndex(pair => pair.includes(dB));
      return (c >= 0 && r >= 0) ? `${r},${c}` : null;
    }).filter(Boolean);
  };

  const curCell = currentWinnerCell();
  const prevCells = prevWinnerCells();

  const cellClass = (r, c) => {
    if (curCell && curCell[0] === r && curCell[1] === c) return "sq-cell filled winner-now";
    if (prevCells.includes(`${r},${c}`)) return "sq-cell filled winner-prev";
    if (game.grid[r][c]) return "sq-cell filled";
    return "sq-cell empty-cell";
  };

  const assign = (p) => {
    const [r, c] = assignCell;
    const g = game.grid.map(row => [...row]);
    g[r][c] = p;
    onUpdate({ grid: g });
    setAssignCell(null);
  };

  const clear = () => {
    const [r, c] = assignCell;
    const g = game.grid.map(row => [...row]);
    g[r][c] = "";
    onUpdate({ grid: g });
    setAssignCell(null);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0 }}>
            {game.teamA || "Team A"} vs {game.teamB || "Team B"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
            {game.grid.flat().filter(Boolean).length}/25 filled
          </div>
        </div>

        {game.players.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--warn)", background: "var(--warn-dim)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, border: "1px solid rgba(245,158,11,0.2)" }}>
            ⚠ No players selected — go to Setup → Step 4 to add players, then use Auto-Assign
          </div>
        )}

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
                {(game.colPairs || []).map((pair, i) => (
                  <th key={i}><div className="col-header">{pair[0]}/{pair[1]}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(game.rowPairs || []).map((pair, rowIdx) => (
                <tr key={rowIdx}>
                  <th><div className="col-header">{pair[0]}/{pair[1]}</div></th>
                  {(game.colPairs || []).map((_pair, colIdx) => (
                    <td key={colIdx}
                      className={cellClass(rowIdx, colIdx)}
                      onClick={() => setAssignCell([rowIdx, colIdx])}>
                      {game.grid[rowIdx][colIdx] || "+"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignCell && (
        <AssignModal
          game={game} cell={assignCell}
          onAssign={assign} onClear={clear}
          onClose={() => setAssignCell(null)}
        />
      )}
    </div>
  );
}

export default function AssignModal({ game, cell, onAssign, onClear, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Assign Square</div>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
          Col {cell[1] + 1} · Row {cell[0] + 1}
        </p>
        <div className="modal-player-list">
          {game.players.map(p => (
            <div key={p} className="player-option" onClick={() => onAssign(p)}>{p}</div>
          ))}
        </div>
        <div style={{ flexShrink: 0, marginTop: 10 }}>
          {game.grid[cell[0]][cell[1]] && (
            <button className="btn btn-danger btn-sm" style={{ marginBottom: 6, width: "100%" }} onClick={onClear}>
              Clear Square
            </button>
          )}
          <button className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

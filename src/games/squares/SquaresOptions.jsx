import { useState } from "react";
import { randomPairs } from "../../shared/utils";

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ label, hint, checked, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "13px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0, cursor: "pointer",
          background: checked ? "var(--court)" : "var(--surface3)",
          border: `1px solid ${checked ? "var(--court)" : "var(--border)"}`,
          position: "relative", transition: "all .2s",
          boxShadow: checked ? "0 0 8px rgba(51,102,204,0.4)" : "none",
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

// ── Number picker for one axis ─────────────────────────────────────────────────
// Lets user pick which digit goes in each pair slot
function AxisPicker({ label, pairs, otherPairs, onChange }) {
  const [editingSlot, setEditingSlot] = useState(null); // {pairIdx, digitIdx}

  // All 10 digits used by the OTHER axis (can't share digits between axes)
  // Within this axis, each slot has 2 digits, and all 10 digits must be used once
  const usedInAxis = pairs.flat();

  const handlePick = (digit) => {
    if (editingSlot === null) return;
    const { pairIdx, digitIdx } = editingSlot;

    // Check digit not already used in this axis
    const otherDigits = pairs.flat().filter((_, i) => {
      const pi = Math.floor(i / 2);
      const di = i % 2;
      return !(pi === pairIdx && di === digitIdx);
    });
    if (otherDigits.includes(digit)) return; // already used

    const newPairs = pairs.map((p, i) => {
      if (i !== pairIdx) return p;
      const np = [...p];
      np[digitIdx] = digit;
      return np;
    });
    onChange(newPairs);
    setEditingSlot(null);
  };

  const usedDigits = pairs.flat().filter((_, i) => {
    if (editingSlot === null) return true;
    const pi = Math.floor(i / 2);
    const di = i % 2;
    return !(pi === editingSlot.pairIdx && di === editingSlot.digitIdx);
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>

      {/* Pair slots */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: editingSlot !== null ? 10 : 0 }}>
        {pairs.map((pair, pi) => (
          <div key={pi} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {pair.map((digit, di) => {
              const isEditing = editingSlot?.pairIdx === pi && editingSlot?.digitIdx === di;
              return (
                <div
                  key={di}
                  onClick={() => setEditingSlot(isEditing ? null : { pairIdx: pi, digitIdx: di })}
                  style={{
                    width: 38, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: di === 0 ? "8px 0 0 8px" : "0 8px 8px 0",
                    background: isEditing ? "var(--court)" : "var(--surface2)",
                    border: `1px solid ${isEditing ? "var(--court)" : "var(--border)"}`,
                    cursor: "pointer", transition: "all .15s",
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 22,
                    color: isEditing ? "#fff" : "var(--court-bright)",
                    boxShadow: isEditing ? "0 0 10px rgba(51,102,204,0.4)" : "none",
                  }}
                >
                  {digit}
                </div>
              );
            })}
            {pi < pairs.length - 1 && (
              <div style={{ width: 4, height: 2, background: "var(--border)", margin: "0 2px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Digit picker grid */}
      {editingSlot !== null && (
        <div style={{
          background: "var(--surface3)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 10, marginTop: 8,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>
            Tap a digit to assign it to the highlighted slot:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {[0,1,2,3,4,5,6,7,8,9].map(d => {
              const taken = usedDigits.includes(d);
              return (
                <div
                  key={d}
                  onClick={() => !taken && handlePick(d)}
                  style={{
                    height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, cursor: taken ? "not-allowed" : "pointer",
                    background: taken ? "var(--surface2)" : "var(--surface)",
                    border: `1px solid ${taken ? "var(--border)" : "var(--court-dim)"}`,
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 24,
                    color: taken ? "var(--text-dim)" : "var(--court-bright)",
                    opacity: taken ? 0.4 : 1,
                    transition: "all .1s",
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setEditingSlot(null)}
            style={{
              marginTop: 8, width: "100%", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "7px 0", color: "var(--text-dim)", fontSize: 13, cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main SquaresOptions component ──────────────────────────────────────────────
export default function SquaresOptions({ game, onUpdate, onToast }) {
  const opts = game.options || {};
  const [numberMode, setNumberMode] = useState("random"); // "random" | "custom"

  const setOpt = (key, val) => onUpdate({ options: { ...opts, [key]: val } });

  const handleRandomize = () => {
    const { colPairs, rowPairs } = randomPairs();
    onUpdate({ colPairs, rowPairs });
    if (opts.lockNumbers) {
      try {
        localStorage.setItem("bt_locked_col_pairs", JSON.stringify(colPairs));
        localStorage.setItem("bt_locked_row_pairs", JSON.stringify(rowPairs));
      } catch {}
    }
    onToast("Numbers randomized!");
  };

  const handleLockNumbers = (locked) => {
    setOpt("lockNumbers", locked);
    if (locked) {
      try {
        localStorage.setItem("bt_locked_col_pairs", JSON.stringify(game.colPairs));
        localStorage.setItem("bt_locked_row_pairs", JSON.stringify(game.rowPairs));
      } catch {}
      onToast("Numbers locked — reusing for future games today");
    } else {
      onToast("Numbers unlocked");
    }
  };

  const allDigitsAssigned = (pairs) => {
    const flat = (pairs || []).flat();
    return flat.length === 10 && new Set(flat).size === 10;
  };

  const colsValid = allDigitsAssigned(game.colPairs);
  const rowsValid = allDigitsAssigned(game.rowPairs);

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 4 }}>⚙ Game Options</div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
        Customize how this game runs. Settings are saved per game.
      </div>

      {/* ── Number Picker ── */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
          Number Pairs
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { id: "random", label: "🎲 Randomize" },
            { id: "custom", label: "✏️ Pick My Own" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setNumberMode(m.id)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all .15s",
                background: numberMode === m.id ? "var(--court)" : "var(--surface2)",
                border: `1px solid ${numberMode === m.id ? "var(--court)" : "var(--border)"}`,
                color: numberMode === m.id ? "#fff" : "var(--text-dim)",
                boxShadow: numberMode === m.id ? "0 0 12px rgba(51,102,204,0.3)" : "none",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {numberMode === "random" ? (
          <div>
            {/* Show current pairs */}
            <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  Columns ({game.teamA || "Away"})
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(game.colPairs || []).map((p, i) => (
                    <div key={i} style={{
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "5px 10px",
                      fontFamily: "'Bebas Neue',sans-serif", fontSize: 18,
                      color: "var(--court-bright)", letterSpacing: 1,
                    }}>{p[0]}/{p[1]}</div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  Rows ({game.teamB || "Home"})
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(game.rowPairs || []).map((p, i) => (
                    <div key={i} style={{
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "5px 10px",
                      fontFamily: "'Bebas Neue',sans-serif", fontSize: 18,
                      color: "var(--court-bright)", letterSpacing: 1,
                    }}>{p[0]}/{p[1]}</div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleRandomize}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10,
                background: "var(--court)", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 0 12px rgba(51,102,204,0.3)",
              }}
            >
              🎲 Randomize Numbers
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12, lineHeight: 1.5 }}>
              Tap any digit to change it. Each number 0–9 must appear exactly once per axis.
            </div>
            <AxisPicker
              label={`Columns — ${game.teamA || "Away Team"}`}
              pairs={game.colPairs || [[0,5],[1,6],[2,7],[3,8],[4,9]]}
              otherPairs={game.rowPairs}
              onChange={cols => onUpdate({ colPairs: cols })}
            />
            <AxisPicker
              label={`Rows — ${game.teamB || "Home Team"}`}
              pairs={game.rowPairs || [[0,5],[1,6],[2,7],[3,8],[4,9]]}
              otherPairs={game.colPairs}
              onChange={rows => onUpdate({ rowPairs: rows })}
            />
            {(!colsValid || !rowsValid) && (
              <div style={{ fontSize: 12, color: "var(--warn)", padding: "8px 12px", background: "var(--warn-dim)", borderRadius: 8, marginBottom: 10 }}>
                ⚠️ Each axis needs all 10 digits (0–9) assigned before the game is valid.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lock numbers ── */}
      <Toggle
        label="Lock these numbers"
        hint="Reuse the same pairs across all games you run today — useful when the same group plays multiple games."
        checked={!!opts.lockNumbers}
        onChange={handleLockNumbers}
      />

      {/* ── Axis orientation ── */}
      <Toggle
        label="Winner across the top"
        hint={`Columns show ${game.teamA || "Team A"}'s score digits.`}
        checked={opts.winnerOnTop !== false}
        onChange={val => setOpt("winnerOnTop", val)}
      />

      <Toggle
        label="Loser down the side"
        hint={`Rows show ${game.teamB || "Team B"}'s score digits. Toggle off to swap axes.`}
        checked={opts.loserOnSide !== false}
        onChange={val => setOpt("loserOnSide", val)}
      />

      <Toggle
        label="Show team names on grid"
        hint="Display team abbreviations on the grid header."
        checked={opts.showTeamNames !== false}
        onChange={val => setOpt("showTeamNames", val)}
      />
    </div>
  );
}

import { useState, useRef } from "react";
import { loadRoster, saveRoster } from "../shared/storage";

export default function PlayersPanel() {
  const [roster, setRoster] = useState(() => loadRoster());
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const inputRef = useRef(null);

  const updateRoster = (r) => { setRoster(r); saveRoster(r); };

  const addNew = () => {
    const n = newName.trim();
    if (!n || roster.includes(n)) { setNewName(""); return; }
    updateRoster([...roster, n]);
    setNewName("");
    inputRef.current?.focus();
  };

  const deletePlayer = (p) => updateRoster(roster.filter(x => x !== p));

  const filtered = roster.filter(p =>
    search.trim() === "" || p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "0 4px" }}>
      <div className="card">
        <div className="card-title">Player Roster</div>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 14 }}>
          Your saved players are available across all games — squares, timeout game, everything.
        </p>

        {/* Add new */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            ref={inputRef}
            style={{
              flex: 1, background: "var(--surface2)", border: "1px solid var(--court)",
              borderRadius: 6, padding: "8px 12px", color: "var(--text)", outline: "none",
              fontSize: 14, fontFamily: "'DM Sans',sans-serif",
            }}
            placeholder="Add new player..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNew()}
          />
          <button className="btn btn-primary" onClick={addNew}>Add</button>
        </div>

        {/* Search */}
        {roster.length > 6 && (
          <div style={{ marginBottom: 10 }}>
            <input
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 6, padding: "7px 12px", color: "var(--text)", outline: "none",
                fontSize: 13, fontFamily: "'DM Sans',sans-serif",
              }}
              placeholder={`Search ${roster.length} players...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Roster list */}
        {filtered.length === 0 && search ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "10px 0" }}>
            No players match "{search}"
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "10px 0" }}>
            No players yet — add some above!
          </div>
        ) : (
          <div className="roster-picker">
            {filtered.map(p => {
              const idx = search ? p.toLowerCase().indexOf(search.toLowerCase()) : -1;
              return (
                <div key={p} className="roster-row" style={{ cursor: "default" }}>
                  <div className="roster-name" style={{ flex: 1 }}>
                    {idx >= 0 ? (
                      <>
                        {p.slice(0, idx)}
                        <span style={{ color: "var(--court-bright)", fontWeight: 700 }}>
                          {p.slice(idx, idx + search.length)}
                        </span>
                        {p.slice(idx + search.length)}
                      </>
                    ) : p}
                  </div>
                  <div
                    className="roster-del"
                    style={{ opacity: 1, cursor: "pointer", fontSize: 18, padding: "0 6px", color: "var(--text-dim)" }}
                    onClick={() => deletePlayer(p)}
                  >×</div>
                </div>
              );
            })}
          </div>
        )}

        {roster.length > 0 && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 10 }}>
            {roster.length} player{roster.length !== 1 ? "s" : ""} in roster
          </div>
        )}
      </div>
    </div>
  );
}

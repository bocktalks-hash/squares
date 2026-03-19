import { useState, useEffect, useRef } from "react";
import { BACKEND, SPORT_CONFIG } from "../../shared/constants";
import { loadRoster, saveRoster } from "../../shared/storage";
import { randomPairs, makeAbbr, autoTabName, getPayoutPeriods, getPerPeriodPayout, todayLocal } from "../../shared/utils";
import SquaresOptions from "./SquaresOptions";

export default function SetupPanel({ game, onUpdate, onDelete }) {
  const [espnGames, setEspnGames] = useState([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState("");
  const [roster, setRoster] = useState(() => loadRoster());
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const dateInputRef = useRef(null);

  const updateRoster = (newRoster) => { setRoster(newRoster); saveRoster(newRoster); };

  const togglePlayer = (p) => {
    if (game.players.includes(p)) {
      onUpdate({ players: game.players.filter(x => x !== p) });
    } else {
      onUpdate({ players: [...game.players, p] });
    }
  };

  useEffect(() => { loadGames(); }, [game.sport, selectedDate]);

  const loadGames = async () => {
    setEspnLoading(true); setEspnError(""); setEspnGames([]);
    try {
      const [y, mo, da] = selectedDate.split("-");
      const dateStr = `${y}${mo}${da}`;
      const sport = SPORT_CONFIG[game.sport].path;
      const res = await fetch(`${BACKEND}/scores?sport=${sport}&dates=${dateStr}`);
      const data = await res.json();
      setEspnGames(data.games || []);
      if (!data.games?.length) setEspnError("No games found for this date.");
    } catch {
      setEspnError("Could not load games. Check your connection.");
    }
    setEspnLoading(false);
  };

  const randomize = () => {
    if (game.results.length > 0) {
      if (!window.confirm(`⚠️ You have ${game.results.length} locked result(s). Randomizing will change the pairs and make those results invalid. Continue?`)) return;
    }
    const { colPairs, rowPairs } = randomPairs();
    onUpdate({ colPairs, rowPairs });
  };

  const autoAssign = () => {
    if (!game.players.length) return;
    const grid = Array(5).fill(null).map(() => Array(5).fill(""));
    const slots = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) slots.push([r, c]);
    slots.sort(() => Math.random() - .5);
    slots.forEach(([r, c], i) => { grid[r][c] = game.players[i % game.players.length]; });
    onUpdate({ grid });
  };

  const clearGrid = () => onUpdate({ grid: Array(5).fill(null).map(() => Array(5).fill("")) });

  const selectGame = (g) => {
    const tabName = autoTabName(g.awayTeam, g.homeTeam) || g.shortName || g.name;
    onUpdate({
      teamA: g.awayTeam, teamB: g.homeTeam,
      name: tabName, nameManual: false,
      espnGameId: g.id, gameDate: selectedDate,
      botQuery: g.shortName || g.name,
    });
  };

  const gameSelected = !!(game.teamA && game.teamB);

  return (
    <div>
      {/* Step 1 */}
      <div className="card">
        <div className="card-title">Step 1 — Pick Sport & Date</div>
        <div className="field">
          <label>Sport</label>
          <select value={game.sport} onChange={e => onUpdate({
            sport: e.target.value, teamA: "", teamB: "", name: "", espnGameId: null,
            payoutStructure: SPORT_CONFIG[e.target.value]?.payoutOptions?.[0]?.key || "quarters"
          })}>
            {Object.entries(SPORT_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Payout Structure</label>
          <select
            value={game.payoutStructure || SPORT_CONFIG[game.sport]?.payoutOptions?.[0]?.key}
            onChange={e => onUpdate({ payoutStructure: e.target.value })}
          >
            {(SPORT_CONFIG[game.sport]?.payoutOptions || []).map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Total Pot ($)</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              background: "var(--surface3)", border: "1px solid var(--border)", borderRight: "none",
              borderRadius: "7px 0 0 7px", padding: "9px 11px", color: "var(--text-mid)", fontSize: 14, fontWeight: 600,
            }}>$</span>
            <input type="number" min="0" step="1"
              value={game.totalPot || ""}
              placeholder="0"
              onChange={e => onUpdate({ totalPot: parseFloat(e.target.value) || 0 })}
              style={{
                flex: 1, background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: "0 7px 7px 0", padding: "9px 12px", color: "var(--text)", fontSize: 14, outline: "none",
              }}
            />
          </div>
          {game.totalPot > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>
              {getPayoutPeriods(game).length} payout{getPayoutPeriods(game).length !== 1 ? "s" : ""} · <span style={{ color: "var(--court-bright)", fontWeight: 600 }}>
                ${getPerPeriodPayout(game) % 1 === 0 ? getPerPeriodPayout(game) : getPerPeriodPayout(game).toFixed(2)}
              </span> each
            </div>
          )}
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Date</label>
          <input
            type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            ref={dateInputRef}
            onClick={() => dateInputRef.current?.showPicker?.()}
            style={{
              width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "9px 12px", color: "var(--text)", fontSize: 14,
              fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none", colorScheme: "dark",
            }}
          />
        </div>
      </div>

      {/* Step 2 */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Step 2 — Select Game</div>
          <button className="btn btn-secondary btn-sm" onClick={loadGames} disabled={espnLoading}>
            {espnLoading ? "⏳" : "↻ Refresh"}
          </button>
        </div>
        {espnLoading && <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-dim)", fontSize: 13 }}>Loading games from ESPN…</div>}
        {espnError && !espnLoading && <p style={{ color: "var(--warn)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>{espnError}</p>}
        {!espnLoading && espnGames.length > 0 && (
          <div className="game-select-list">
            {espnGames.map(g => {
              const isSelected = game.espnGameId === g.id;
              return (
                <div key={g.id}
                  className={`game-option ${g.inProgress ? "live" : ""} ${isSelected ? "selected-game" : ""}`}
                  onClick={() => selectGame(g)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div className="go-name">
                      {isSelected && <span style={{ color: "var(--court-bright)", marginRight: 5 }}>✓</span>}
                      {g.awayTeam} vs {g.homeTeam}
                    </div>
                    {g.inProgress && <span className="go-badge live-badge">LIVE</span>}
                    {g.completed && <span className="go-badge final-badge">FINAL</span>}
                  </div>
                  <div className="go-status">
                    {g.inProgress ? `🔴 ${g.awayScore}–${g.homeScore}  ·  ${g.shortDetail || g.status}` : g.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {gameSelected && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(51,102,204,0.08)", border: "1px solid var(--court-dim)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: .8, textTransform: "uppercase", marginBottom: 4 }}>Selected Game</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{game.teamA} vs {game.teamB}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Tab: {game.name}</div>
          </div>
        )}
      </div>

      {/* Step 3 */}
      {gameSelected && (
        <div className="card">
          <div className="card-title">Step 3 — Randomize Numbers</div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
            Each column and row gets 2 random unique digits (0–9), split randomly across the board.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div className="section-label">Columns ({game.teamA ? makeAbbr(game.teamA) : "Away"})</div>
              <div style={{ display: "flex", gap: 4 }}>
                {(game.colPairs || []).map((pair, i) => (
                  <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 700, color: "var(--court-bright)", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
                    {pair[0]}/{pair[1]}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label">Rows ({game.teamB ? makeAbbr(game.teamB) : "Home"})</div>
              <div style={{ display: "flex", gap: 4 }}>
                {(game.rowPairs || []).map((pair, i) => (
                  <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 700, color: "var(--court-bright)", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
                    {pair[0]}/{pair[1]}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={randomize}>🔀 Randomize Numbers</button>
        </div>
      )}

      {/* Step 4 */}
      {gameSelected && (
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Step 4 — Select Players</span>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400 }}>
              {game.players.length} selected
            </span>
          </div>
          {roster.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "10px 0" }}>
              No players in your roster yet — go to the <strong style={{ color: "var(--court-bright)" }}>Players</strong> tab to add some.
            </div>
          ) : (
            <div className="roster-picker">
              {roster.map(p => {
                const inGame = game.players.includes(p);
                return (
                  <div key={p} className={`roster-row ${inGame ? "in-game" : ""}`} onClick={() => togglePlayer(p)}>
                    <div className={`roster-check ${inGame ? "checked" : ""}`}>{inGame && "✓"}</div>
                    <div className="roster-name">{p}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={autoAssign} disabled={!game.players.length}>Auto-Assign Grid</button>
            <button className="btn btn-secondary btn-sm" onClick={clearGrid}>Clear Grid</button>
          </div>
        </div>
      )}

      {/* Step 5 — Game Options */}
      {gameSelected && (
        <SquaresOptions game={game} onUpdate={onUpdate} onToast={() => {}} />
      )}

      {/* Danger Zone */}
      <div className="card">
        <div className="card-title" style={{ color: "var(--danger)" }}>Danger Zone</div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 End & Delete Game</button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { BACKEND, SPORT_CONFIG, TIMEOUT_SLOTS } from "../../shared/constants";
import { loadRoster } from "../../shared/storage";
import { autoTabName, shuffle, todayLocal } from "../../shared/utils";

export default function TOSetupPanel({ game, onUpdate, onDelete }) {
  const [espnGames, setEspnGames] = useState([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState("");
  const [roster, setRoster] = useState(() => loadRoster());
  const [selectedDate, setSelectedDate] = useState(() => game.gameDate || todayLocal());
  const dateInputRef = useRef(null);

  useEffect(() => {
    const onStorage = () => setRoster(loadRoster());
    window.addEventListener("storage", onStorage);
    const interval = setInterval(() => setRoster(loadRoster()), 2000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(interval); };
  }, []);

  useEffect(() => { loadGames(); }, [game.sport, selectedDate]); // eslint-disable-line

  const loadGames = async () => {
    setEspnLoading(true); setEspnError(""); setEspnGames([]);
    try {
      const dateStr = selectedDate.replace(/-/g, "");
      const path = SPORT_CONFIG[game.sport]?.path || "basketball/mens-college-basketball";
      const res = await fetch(`${BACKEND}/scores?sport=${path}&dates=${dateStr}`);
      const data = await res.json();
      setEspnGames(data.games || []);
    } catch { setEspnError("Could not load games."); }
    setEspnLoading(false);
  };

  const selectGame = (g) => {
    const auto = autoTabName(g.awayTeam, g.homeTeam);
    onUpdate({
      teamA: g.awayTeam, teamB: g.homeTeam, espnGameId: g.id, gameDate: selectedDate,
      name: game.nameManual ? game.name : (auto || game.name),
    });
    setEspnGames([]);
  };

  const togglePlayer = (p) => {
    const cur = game.players;
    if (cur.includes(p)) {
      const newAssign = { ...game.assignments };
      Object.keys(newAssign).forEach(d => { if (newAssign[d] === p) delete newAssign[d]; });
      onUpdate({ players: cur.filter(x => x !== p), assignments: newAssign });
    } else {
      if (cur.length >= 10) return;
      onUpdate({ players: [...cur, p] });
    }
  };

  const randomizeAssignments = () => {
    if (game.players.length === 0) return;
    const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, game.players.length);
    const assign = {};
    game.players.forEach((p, i) => { assign[digits[i]] = p; });
    onUpdate({ assignments: assign });
  };

  const assigned = Object.entries(game.assignments).sort((a, b) => a[0] - b[0]);
  const gameSelected = !!(game.teamA && game.teamB);

  return (
    <div>
      {/* Step 1 */}
      <div className="card">
        <div className="card-title">Step 1 — Pick Sport & Date</div>
        <div className="field">
          <label>Sport</label>
          <select value={game.sport} onChange={e => onUpdate({ sport: e.target.value, teamA: "", teamB: "", espnGameId: null })}>
            <option value="ncaab">NCAA Basketball</option>
            <option value="nba">NBA</option>
          </select>
        </div>
        <div className="field">
          <label>Total Pot ($) — split evenly across 10 slots</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ background: "var(--surface3)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "7px 0 0 7px", padding: "9px 11px", color: "var(--text-mid)", fontSize: 14, fontWeight: 600 }}>$</span>
            <input type="number" min="0" step="1" value={game.totalPot || ""} placeholder="0"
              onChange={e => onUpdate({ totalPot: parseFloat(e.target.value) || 0 })}
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "0 7px 7px 0", padding: "9px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
          </div>
          {game.totalPot > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>
              10 slots · <span style={{ color: "var(--court-bright)", fontWeight: 600 }}>${(game.totalPot / 10) % 1 === 0 ? game.totalPot / 10 : (game.totalPot / 10).toFixed(2)}</span> per slot
            </div>
          )}
        </div>
        <div className="field">
          <label>Date</label>
          <input ref={dateInputRef} type="date" value={selectedDate} style={{ colorScheme: "dark" }}
            onClick={() => dateInputRef.current?.showPicker?.()}
            onChange={e => { setSelectedDate(e.target.value); onUpdate({ gameDate: e.target.value }); }} />
        </div>
      </div>

      {/* Step 2 */}
      <div className="card">
        <div className="card-title">Step 2 — Select Game</div>
        {espnLoading && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Loading ESPN games…</div>}
        {espnError && <div style={{ fontSize: 12, color: "var(--danger)" }}>{espnError}</div>}
        {espnGames.length > 0 && (
          <div className="game-select-list">
            {espnGames.map(g => {
              const isSel = game.espnGameId === g.id;
              return (
                <div key={g.id} className={`game-option ${g.inProgress ? "live" : ""}`} onClick={() => selectGame(g)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="go-name">{isSel && <span style={{ color: "var(--court-bright)", marginRight: 5 }}>✓</span>}{g.awayTeam} vs {g.homeTeam}</div>
                    {g.inProgress && <span style={{ fontSize: 10, color: "#f87171", fontWeight: 700 }}>LIVE</span>}
                  </div>
                  <div className="go-status">{g.inProgress ? `🔴 ${g.awayScore}–${g.homeScore}  ·  ${g.shortDetail || g.status}` : g.status}</div>
                </div>
              );
            })}
          </div>
        )}
        {gameSelected && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(51,102,204,0.08)", border: "1px solid var(--court-dim)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: .8, textTransform: "uppercase", marginBottom: 4 }}>Selected</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{game.teamA} vs {game.teamB}</div>
          </div>
        )}
      </div>

      {/* Step 3 */}
      {gameSelected && (
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Step 3 — Select Players</span>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400 }}>{game.players.length}/10</span>
          </div>
          {roster.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No roster yet — go to the Players tab to add some.</div>
          ) : (
            <div className="roster-picker">
              {roster.map(p => {
                const inGame = game.players.includes(p);
                const atMax = game.players.length >= 10 && !inGame;
                return (
                  <div key={p} className={`roster-row ${inGame ? "in-game" : ""}`}
                    style={{ opacity: atMax ? 0.4 : 1, cursor: atMax ? "not-allowed" : "pointer" }}
                    onClick={() => !atMax && togglePlayer(p)}>
                    <div className={`roster-check ${inGame ? "checked" : ""}`}>{inGame && "✓"}</div>
                    <div className="roster-name">{p}</div>
                  </div>
                );
              })}
            </div>
          )}
          {game.players.length > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
              {game.players.length} player{game.players.length !== 1 ? "s" : ""} — {10 - game.players.length} slot{10 - game.players.length !== 1 ? "s" : ""} remaining
            </div>
          )}
        </div>
      )}

      {/* Step 4 */}
      {game.players.length > 0 && (
        <div className="card">
          <div className="card-title">Step 4 — Assign Digits</div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
            Each player gets one unique digit 0–9. At each TV timeout: last digit of Team A score + last digit of Team B score = winning digit.
          </p>
          <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={randomizeAssignments}>🔀 Randomize Digits</button>
          {assigned.length > 0 && (
            <div className="digit-assign">
              {assigned.map(([digit, player]) => (
                <div key={digit} className="digit-card">
                  <div className="dnum">{digit}</div>
                  <div className="dname">{player}</div>
                </div>
              ))}
            </div>
          )}
          {assigned.length === 0 && game.players.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Hit Randomize to assign digits</div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ color: "var(--danger)" }}>Danger Zone</div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 End & Delete Game</button>
      </div>
    </div>
  );
}

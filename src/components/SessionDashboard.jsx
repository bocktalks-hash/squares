import { useState, useEffect, useRef } from "react";
import { BACKEND, SPORT_CONFIG, TIMEOUT_SLOTS } from "../shared/constants";
import { css } from "../shared/styles";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcSquaresWinner(game, scoreA, scoreB) {
  if (scoreA == null || scoreB == null) return null;
  const dA = scoreA % 10;
  const dB = scoreB % 10;
  const cols = game.colDigits || [];
  const rows = game.rowDigits || [];
  const colIdx = cols.findIndex(d => Array.isArray(d) ? d.includes(dA) : d === dA);
  const rowIdx = rows.findIndex(d => Array.isArray(d) ? d.includes(dB) : d === dB);
  if (colIdx === -1 || rowIdx === -1) return null;
  const grid = game.grid || [];
  return grid[rowIdx]?.[colIdx] || null;
}

function calcTimeoutWinner(game, scoreA, scoreB) {
  if (scoreA == null || scoreB == null) return null;
  const digit = (scoreA + scoreB) % 10;
  const players = game.players || [];
  const digits = game.digits || [];
  const idx = digits.indexOf(digit);
  return idx >= 0 ? (players[idx] || null) : null;
}

function liveDigit(scoreA, scoreB) {
  if (scoreA == null || scoreB == null) return null;
  return (scoreA + scoreB) % 10;
}

// ── Squares Card ──────────────────────────────────────────────────────────────
function SquaresCard({ game, data }) {
  const cfg = SPORT_CONFIG[data.sport] || SPORT_CONFIG.ncaab;
  const results = data.results || {};
  const locked = Object.keys(results).filter(k => results[k]?.winner);

  const scoreA = data.liveScoreA ?? null;
  const scoreB = data.liveScoreB ?? null;
  const projected = calcSquaresWinner(data, scoreA, scoreB);

  return (
    <div style={cardStyle}>
      <div style={cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={typeBadge("#3366CC")}>SQUARES</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
            {data.teamA || "Team A"} vs {data.teamB || "Team B"}
          </span>
        </div>
        <span style={sportTag}>{cfg.label}</span>
      </div>

      {/* Live Score */}
      <div style={scoreRow}>
        <div style={scoreBox}>
          <div style={scoreLabel}>{data.teamA || "Team A"}</div>
          <div style={scoreNum}>{scoreA ?? "—"}</div>
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: 18, fontWeight: 700 }}>vs</div>
        <div style={scoreBox}>
          <div style={scoreLabel}>{data.teamB || "Team B"}</div>
          <div style={scoreNum}>{scoreB ?? "—"}</div>
        </div>
      </div>

      {projected && (
        <div style={projectedBanner}>
          🎯 Projected Winner: <strong style={{ color: "var(--court-bright)" }}>{projected}</strong>
        </div>
      )}

      {/* Quarter results */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {Object.entries(cfg.periodLabels || {}).map(([p, label]) => {
          const r = results[p];
          return (
            <div key={p} style={{
              flex: "1 1 80px", background: r?.winner ? "rgba(51,102,204,0.15)" : "var(--surface2)",
              border: `1px solid ${r?.winner ? "var(--court-bright)" : "var(--border)"}`,
              borderRadius: 8, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8 }}>{label}</div>
              {r?.winner ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--court-bright)", marginTop: 3 }}>{r.winner}</div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{r.scoreA}–{r.scoreB}</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>—</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={footerRow}>
        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{locked.length} of {Object.keys(cfg.periodLabels || {}).length} locked</span>
        <a href={`/?join=${game.code}`} target="_blank" rel="noreferrer" style={viewLink}>View Board →</a>
      </div>
    </div>
  );
}

// ── Timeout Card ──────────────────────────────────────────────────────────────
function TimeoutCard({ game, data }) {
  const results = data.results || {};
  const locked = Object.values(results).filter(r => r?.winner).length;
  const scoreA = data.liveScoreA ?? null;
  const scoreB = data.liveScoreB ?? null;
  const projected = calcTimeoutWinner(data, scoreA, scoreB);
  const digit = liveDigit(scoreA, scoreB);

  return (
    <div style={cardStyle}>
      <div style={cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={typeBadge("#7c3aed")}>TIMEOUT</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
            {data.teamA || "Team A"} vs {data.teamB || "Team B"}
          </span>
        </div>
        <span style={sportTag}>NCAA</span>
      </div>

      {/* Live Score */}
      <div style={scoreRow}>
        <div style={scoreBox}>
          <div style={scoreLabel}>{data.teamA || "Team A"}</div>
          <div style={scoreNum}>{scoreA ?? "—"}</div>
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: 18, fontWeight: 700 }}>vs</div>
        <div style={scoreBox}>
          <div style={scoreLabel}>{data.teamB || "Team B"}</div>
          <div style={scoreNum}>{scoreB ?? "—"}</div>
        </div>
      </div>

      {projected && digit !== null && (
        <div style={projectedBanner}>
          🎯 Live digit: <strong style={{ color: "var(--court-bright)" }}>{digit}</strong> → <strong style={{ color: "var(--court-bright)" }}>{projected}</strong>
        </div>
      )}

      {/* Timeout slots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 8 }}>
        {TIMEOUT_SLOTS.map(slot => {
          const r = results[slot.id];
          return (
            <div key={slot.id} style={{
              background: r?.winner ? "rgba(124,58,237,0.15)" : "var(--surface2)",
              border: `1px solid ${r?.winner ? "#7c3aed" : "var(--border)"}`,
              borderRadius: 6, padding: "6px 4px", textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase" }}>{slot.shortLabel}</div>
              {r?.winner ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginTop: 2 }}>{r.winner}</div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>—</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={footerRow}>
        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{locked} of {TIMEOUT_SLOTS.length} locked</span>
        <a href={`/?join=${game.code}`} target="_blank" rel="noreferrer" style={viewLink}>View Board →</a>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = {
  background: "var(--surface1)", border: "1px solid var(--border)",
  borderRadius: 14, padding: 16, marginBottom: 12,
};
const cardHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8,
};
const typeBadge = (color) => ({
  background: color, color: "#fff", fontSize: 9, fontWeight: 800,
  letterSpacing: 1.2, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase",
});
const sportTag = {
  fontSize: 11, color: "var(--text-dim)", background: "var(--surface2)",
  border: "1px solid var(--border)", borderRadius: 5, padding: "2px 8px",
};
const scoreRow = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 10,
};
const scoreBox = { textAlign: "center" };
const scoreLabel = { fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .6 };
const scoreNum = { fontSize: 32, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 };
const projectedBanner = {
  background: "rgba(51,102,204,0.1)", border: "1px solid rgba(51,102,204,0.3)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--text)", marginBottom: 4,
};
const footerRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
};
const viewLink = {
  fontSize: 12, color: "var(--court-bright)", textDecoration: "none", fontWeight: 600,
};


// ── Cross-game Leaderboard ────────────────────────────────────────────────────
function buildLeaderboard(games) {
  const wins = {};

  for (const game of games) {
    const { type, data } = game;
    const results = data.results || {};

    if (type === "squares") {
      Object.values(results).forEach(r => {
        if (r?.winner) wins[r.winner] = (wins[r.winner] || 0) + 1;
      });
    } else if (type === "timeout") {
      Object.values(results).forEach(r => {
        if (r?.winner) wins[r.winner] = (wins[r.winner] || 0) + 1;
      });
    }
  }

  return Object.entries(wins)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function Leaderboard({ games }) {
  const board = buildLeaderboard(games);
  if (!board.length) return null;

  const medals = ["🥇", "🥈", "🥉"];
  const maxWins = board[0]?.count || 1;

  return (
    <div style={{
      background: "var(--surface1)", border: "1px solid var(--border)",
      borderRadius: 14, padding: 16, marginBottom: 16,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "var(--text-dim)",
        textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12,
      }}>🏆 Game Day Leaderboard</div>

      {board.map(({ name, count }, i) => (
        <div key={name} style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: i < board.length - 1 ? 8 : 0,
        }}>
          <div style={{ width: 24, textAlign: "center", fontSize: 16 }}>
            {medals[i] || `${i + 1}.`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--court-bright)" }}>
                {count} win{count !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{
              height: 5, background: "var(--surface2)", borderRadius: 3, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${(count / maxWins) * 100}%`,
                background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--court-bright)",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SessionDashboard({ sessionId }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`${BACKEND}/sessions/${sessionId}`);
      if (!res.ok) { setError("Session not found"); return; }
      const data = await res.json();
      setSession(data);
      setLastUpdate(new Date());
    } catch {
      setError("Could not load session");
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  if (error) return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text)", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{error}</div>
          <div style={{ fontSize: 14, color: "var(--text-dim)" }}>Check the link and try again</div>
        </div>
      </div>
    </>
  );

  if (!session) return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-dim)", fontSize: 16 }}>Loading game day…</div>
      </div>
    </>
  );

  const squaresGames = session.games.filter(g => g.type === "squares");
  const timeoutGames = session.games.filter(g => g.type === "timeout");

  return (
    <>
      <style>{css}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{
          background: "var(--surface1)", borderBottom: "1px solid var(--border)",
          padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.svg" alt="Bock Talks" style={{ height: 28 }} />
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1 }}>Bock Talks</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{session.name}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "right" }}>
            {session.games.length} game{session.games.length !== 1 ? "s" : ""}<br />
            {lastUpdate && `Updated ${lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </div>
        </div>

        <div style={{ padding: "16px 16px 40px", maxWidth: 700, margin: "0 auto" }}>
          <Leaderboard games={session.games} />

          {session.games.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-dim)", padding: 60 }}>
              No games in this session yet
            </div>
          )}

          {squaresGames.length > 0 && (
            <>
              <div style={sectionHeader}>⬛ Squares Games</div>
              {squaresGames.map(g => <SquaresCard key={g.code} game={g} data={g.data} />)}
            </>
          )}

          {timeoutGames.length > 0 && (
            <>
              <div style={sectionHeader}>⏱ Timeout Games</div>
              {timeoutGames.map(g => <TimeoutCard key={g.code} game={g} data={g.data} />)}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const sectionHeader = {
  fontSize: 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase",
  letterSpacing: 1.2, marginBottom: 10, marginTop: 16,
};

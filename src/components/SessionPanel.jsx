import { useState, useEffect } from "react";
import { BACKEND } from "../shared/constants";

export default function SessionPanel({ squaresGames, timeoutGames, onToast }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bocktalks_session") || "null"); } catch { return null; }
  });
  const [creating, setCreating] = useState(false);
  const [sessionName, setSessionName] = useState("Game Day");
  const [syncing, setSyncing] = useState(false);

  const sessionUrl = session ? `${window.location.origin}/?session=${session.id}` : null;

  const sqGames = Array.isArray(squaresGames) ? squaresGames : [];
  const toGames = Array.isArray(timeoutGames) ? timeoutGames : [];
  const allGames = [
    ...sqGames.map(g => ({ ...g, gameType: "squares" })),
    ...toGames.map(g => ({ ...g, gameType: "timeout" })),
  ];

  const publishedGames = allGames.filter(g => g.shareCode);
  const unpublishedGames = allGames.filter(g => !g.shareCode);

  const createSession = async () => {
    if (!publishedGames.length) { onToast("Publish at least one game first via the Share tab"); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          gameCodes: publishedGames.map(g => g.shareCode),
        }),
      });
      const json = await res.json();
      if (!json.id) throw new Error(json.detail || json.error || "Unknown error");
      const sess = { id: json.id, hostToken: json.hostToken, name: sessionName };
      setSession(sess);
      localStorage.setItem("bocktalks_session", JSON.stringify(sess));
      onToast(`✅ Session created! Share the link with your group.`);
    } catch (err) {
      onToast(`❌ ${err.message}`);
    }
    setCreating(false);
  };

  const syncSession = async () => {
    if (!session) return;
    setSyncing(true);
    try {
      await fetch(`${BACKEND}/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostToken: session.hostToken,
          name: session.name,
          gameCodes: publishedGames.map(g => g.shareCode),
        }),
      });
      onToast("✅ Session updated");
    } catch {
      onToast("❌ Could not sync session");
    }
    setSyncing(false);
  };

  const clearSession = () => {
    localStorage.removeItem("bocktalks_session");
    setSession(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(sessionUrl).then(() => onToast("📋 Session link copied!")).catch(() => {});
  };

  return (
    <div style={{ padding: "16px", maxWidth: 600 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Game Day Session</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
          Create one shareable link that shows ALL your games. Your friends open one link and see everything live.
        </div>
      </div>

      {!session ? (
        /* Create Session */
        <div style={card}>
          <div style={cardTitle}>Create a Session</div>

          {unpublishedGames.length > 0 && (
            <div style={{
              background: "rgba(255,160,0,0.1)", border: "1px solid rgba(255,160,0,0.3)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#ffa000",
            }}>
              ⚠️ {unpublishedGames.length} game{unpublishedGames.length > 1 ? "s" : ""} not published yet.
              Go to each game's Share tab and publish them first to include them here.
            </div>
          )}

          {publishedGames.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 14 }}>
              No published games yet. Go to a game's Share tab and hit "Publish & Get Share Link" first.
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>
                Games that will be included ({publishedGames.length})
              </div>
              {publishedGames.map(g => (
                <div key={g.shareCode} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 6,
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                    background: g.gameType === "squares" ? "#3366CC" : "#7c3aed", color: "#fff",
                    textTransform: "uppercase", letterSpacing: .8,
                  }}>{g.gameType}</span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>
                    {g.teamA || "?"} vs {g.teamB || "?"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: "auto", fontFamily: "monospace" }}>
                    {g.shareCode}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Session Name</label>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Game Day, March Madness 2026, etc."
              style={inputStyle}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={createSession}
            disabled={creating || publishedGames.length === 0}
          >
            {creating ? "Creating…" : `🔗 Create Session Link (${publishedGames.length} games)`}
          </button>
        </div>
      ) : (
        /* Session exists */
        <>
          <div style={card}>
            <div style={cardTitle}>Your Session is Live</div>
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--court-bright)",
              borderRadius: 10, padding: "14px 16px", marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>
                Share this link with your group
              </div>
              <div style={{ fontSize: 13, color: "var(--text)", wordBreak: "break-all", fontFamily: "monospace", marginBottom: 10 }}>
                {sessionUrl}
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={copyLink}>
                📋 Copy Session Link
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>
                Games in session ({publishedGames.length})
              </div>
              {publishedGames.map(g => (
                <div key={g.shareCode} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 6,
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                    background: g.gameType === "squares" ? "#3366CC" : "#7c3aed", color: "#fff",
                    textTransform: "uppercase",
                  }}>{g.gameType}</span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>
                    {g.teamA || "?"} vs {g.teamB || "?"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: "auto", fontFamily: "monospace" }}>
                    {g.shareCode}
                  </span>
                </div>
              ))}
              {unpublishedGames.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
                  + {unpublishedGames.length} unpublished game{unpublishedGames.length > 1 ? "s" : ""} — publish them then sync
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={syncSession} disabled={syncing}>
                {syncing ? "Syncing…" : "🔄 Sync Games to Session"}
              </button>
              <button className="btn btn-secondary" onClick={clearSession} style={{ color: "#ef4444" }}>
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const card = {
  background: "var(--surface1)", border: "1px solid var(--border)",
  borderRadius: 14, padding: 18, marginBottom: 14,
};
const cardTitle = {
  fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14,
  textTransform: "uppercase", letterSpacing: .8,
};
const labelStyle = {
  fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase",
  letterSpacing: .8, display: "block", marginBottom: 6,
};
const inputStyle = {
  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 6, padding: "9px 12px", color: "var(--text)", fontSize: 14,
  fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
};

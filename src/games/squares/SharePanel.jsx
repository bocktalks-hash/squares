import { useState, useEffect } from "react";
import { BACKEND } from "../../shared/constants";

const BASE_URL = window.location.origin;

export default function SharePanel({ game, onUpdate, onToast }) {
  const [creating, setCreating] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [pickLinks, setPickLinks] = useState([]);
  const [sendingPicks, setSendingPicks] = useState(false);
  const [deadline, setDeadline] = useState(game.pickDeadline || "");
  const [challengeMsg, setChallengeMsg] = useState({});

  const hasShare = !!(game.shareCode && game.hostToken);

  // Create the shared game in DB
  const createShare = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "squares", data: game }),
      });
      const json = await res.json();
      if (!json.code) throw new Error(json.detail || json.error || "Unknown error");
      const { code, hostToken } = json;
      onUpdate({ shareCode: code, hostToken });
      onToast(`✅ Game published! Code: ${code}`);
    } catch {
      onToast(`❌ ${err.message}`);
    }
    setCreating(false);
  };

  // Sync game state to DB whenever game changes (if shared)
  useEffect(() => {
    if (!hasShare) return;
    const sync = async () => {
      try {
        await fetch(`${BACKEND}/games/${game.shareCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostToken: game.hostToken, data: game }),
        });
      } catch {}
    };
    const t = setTimeout(sync, 1000); // debounce 1s
    return () => clearTimeout(t);
  }, [game]);

  // Load challenges
  const loadChallenges = async () => {
    if (!hasShare) return;
    setLoadingChallenges(true);
    try {
      const res = await fetch(`${BACKEND}/games/${game.shareCode}/challenges?hostToken=${game.hostToken}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch {}
    setLoadingChallenges(false);
  };

  useEffect(() => {
    if (hasShare) {
      loadChallenges();
      const t = setInterval(loadChallenges, 30000);
      return () => clearInterval(t);
    }
  }, [hasShare, game.shareCode]);

  const resolveChallenge = async (id, status) => {
    try {
      await fetch(`${BACKEND}/games/${game.shareCode}/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: game.hostToken, status }),
      });
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      onToast(status === "accepted" ? "✅ Challenge accepted" : "Challenge dismissed");
    } catch {
      onToast("❌ Could not resolve challenge");
    }
  };

  // Send pick invites
  const sendPickInvites = async () => {
    if (!game.players.length) { onToast("Add players first in Setup"); return; }
    setSendingPicks(true);
    try {
      const res = await fetch(`${BACKEND}/games/${game.shareCode}/picks/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: game.hostToken, players: game.players }),
      });
      const data = await res.json();
      setPickLinks(data.links || []);
      onToast(`✅ Pick links ready for ${data.links.length} players`);
    } catch {
      onToast("❌ Could not create pick links");
    }
    setSendingPicks(false);
  };

  const saveDeadline = (val) => {
    setDeadline(val);
    onUpdate({ pickDeadline: val });
  };

  const copyLink = (text) => {
    navigator.clipboard.writeText(text).then(() => onToast("📋 Copied!")).catch(() => {});
  };

  const viewerUrl = hasShare ? `${BASE_URL}/?join=${game.shareCode}` : "";
  const pickUrl = (token) => `${BASE_URL}/?pick=${game.shareCode}&t=${token}`;

  const pendingChallenges = challenges.filter(c => c.status === "pending");

  return (
    <div>
      {/* Share Code */}
      <div className="card">
        <div className="card-title">Share This Game</div>
        {!hasShare ? (
          <>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>
              Publish this game to get a shareable link. Friends can view the board and scores live without being able to change anything.
            </p>
            <button className="btn btn-primary" onClick={createShare} disabled={creating}>
              {creating ? "Publishing…" : "🔗 Publish & Get Share Link"}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                flex: 1, background: "var(--surface2)", border: "1px solid var(--court-dim)",
                borderRadius: 8, padding: "10px 14px", fontFamily: "monospace",
                fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "var(--court-bright)", textAlign: "center",
              }}>
                {game.shareCode}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => copyLink(viewerUrl)}>
                📋 Copy Viewer Link
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => copyLink(game.shareCode)}>
                📋 Copy Code
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", padding: "6px 0", wordBreak: "break-all" }}>
              {viewerUrl}
            </div>
          </>
        )}
      </div>

      {/* Pick Requests — only if published */}
      {hasShare && (
        <div className="card">
          <div className="card-title">Pick Requests</div>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>
            Send each player a personal link so they can choose their own square. Set a deadline to lock picks automatically.
          </p>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Pick Deadline (optional)</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => saveDeadline(e.target.value)}
              style={{
                width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 6, padding: "9px 12px", color: "var(--text)", fontSize: 14,
                fontFamily: "'DM Sans',sans-serif", outline: "none", colorScheme: "dark",
              }}
            />
          </div>

          <button className="btn btn-primary" onClick={sendPickInvites} disabled={sendingPicks || !game.players.length}>
            {sendingPicks ? "Generating…" : `📨 Generate Pick Links (${game.players.length} players)`}
          </button>

          {pickLinks.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: .8, textTransform: "uppercase", marginBottom: 8 }}>
                Player Links — Share individually
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pickLinks.map(({ name, token }) => (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--surface2)", borderRadius: 8, padding: "8px 12px",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{name}</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyLink(pickUrl(token))}>
                      📋 Copy Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Challenges */}
      {hasShare && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>
              Challenges
              {pendingChallenges.length > 0 && (
                <span style={{
                  marginLeft: 8, background: "var(--danger)", color: "#fff",
                  borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                }}>
                  {pendingChallenges.length}
                </span>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadChallenges} disabled={loadingChallenges}>
              {loadingChallenges ? "⏳" : "↻"}
            </button>
          </div>

          {challenges.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "8px 0" }}>No challenges yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {challenges.map(c => (
                <div key={c.id} style={{
                  background: "var(--surface2)", borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${c.status === "pending" ? "var(--warn)" : "var(--border)"}`,
                  opacity: c.status !== "pending" ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                        {c.player_name} <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 12 }}>challenged</span> {c.period_label}
                      </div>
                      {c.message && (
                        <div style={{ fontSize: 12, color: "var(--text-mid)", marginTop: 4, fontStyle: "italic" }}>
                          "{c.message}"
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                        {new Date(c.created_at).toLocaleTimeString()}
                        {c.status !== "pending" && (
                          <span style={{ marginLeft: 8, color: c.status === "accepted" ? "var(--win)" : "var(--text-dim)", fontWeight: 600 }}>
                            · {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {c.status === "pending" && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-sm" style={{ background: "var(--win-dim)", color: "var(--win)", border: "1px solid var(--win)", fontSize: 11 }}
                          onClick={() => resolveChallenge(c.id, "accepted")}>
                          ✓ Accept
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => resolveChallenge(c.id, "dismissed")}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

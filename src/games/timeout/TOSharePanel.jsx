import { useState, useEffect } from "react";
import { BACKEND } from "../../shared/constants";

const BASE_URL = window.location.origin;

export default function TOSharePanel({ game, onUpdate, onToast }) {
  const [creating, setCreating] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  const hasShare = !!(game.shareCode && game.hostToken);

  const createShare = async () => {
    setCreating(true);
    try {
      const pendingGroupId = sessionStorage.getItem("bt_pending_group_id");
      const res = await fetch(`${BACKEND}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "timeout",
          data: game,
          groupId: pendingGroupId ? parseInt(pendingGroupId) : null,
        }),
      });
      const json = await res.json();
      if (!json.code) throw new Error(json.detail || json.error || "Unknown error");
      const { code, hostToken } = json;
      onUpdate({ shareCode: code, hostToken });
      sessionStorage.removeItem("bt_pending_group_id");
      onToast(`✅ Game published! Code: ${code}`);
    } catch (err) {
      onToast(`❌ ${err.message}`);
    }
    setCreating(false);
  };

  // Sync to DB whenever game changes
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
    const t = setTimeout(sync, 1000);
    return () => clearTimeout(t);
  }, [game]);

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
  }, [hasShare]);

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

  const copyLink = (text) => {
    navigator.clipboard.writeText(text).then(() => onToast("📋 Copied!")).catch(() => {});
  };

  const viewerUrl = hasShare ? `${BASE_URL}/?join=${game.shareCode}` : "";
  const pendingChallenges = challenges.filter(c => c.status === "pending");

  return (
    <div>
      <div className="card">
        <div className="card-title">Share This Game</div>
        {!hasShare ? (
          <>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>
              Publish this game so friends can view the timeout board and live scores. They can also request challenges.
            </p>
            <button className="btn btn-primary" onClick={createShare} disabled={creating}>
              {creating ? "Publishing…" : "🔗 Publish & Get Share Link"}
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--court-dim)",
              borderRadius: 8, padding: "10px 14px", fontFamily: "monospace",
              fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "var(--court-bright)",
              textAlign: "center", marginBottom: 12,
            }}>
              {game.shareCode}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => copyLink(viewerUrl)}>
                📋 Copy Viewer Link
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => copyLink(game.shareCode)}>
                📋 Copy Code
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", wordBreak: "break-all" }}>
              {viewerUrl}
            </div>
          </>
        )}
      </div>

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
                        <button className="btn btn-sm"
                          style={{ background: "var(--win-dim)", color: "var(--win)", border: "1px solid var(--win)", fontSize: 11 }}
                          onClick={() => resolveChallenge(c.id, "accepted")}>
                          ✓ Accept
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => resolveChallenge(c.id, "dismissed")}>✕</button>
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

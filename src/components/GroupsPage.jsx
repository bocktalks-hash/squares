import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { BACKEND } from "../shared/constants";

const APP_URL = window.location.origin;

// ── tiny helpers ─────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(BACKEND + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

// ── sub-components ────────────────────────────────────────────────────────────
function MemberRow({ member, isHost, onRemove }) {
  const roleLabel =
    member.role === "host" ? "👑 Host" : member.user_id ? "✓ Member" : "👤 Guest";
  return (
    <div style={styles.memberRow}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={styles.avatar}>{member.display_name[0].toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>
            {member.display_name}
          </div>
          <div style={{ fontSize: 11, color: "#7b8fa6" }}>{roleLabel}</div>
        </div>
      </div>
      {isHost && member.role !== "host" && (
        <button style={styles.removeBtn} onClick={() => onRemove(member.id)}>
          Remove
        </button>
      )}
    </div>
  );
}

function InviteSection({ groupId, userId, onToast }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const data = await api(`/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    setLoading(false);
    if (data.code) {
      setInvite(data);
    } else {
      onToast("Failed to generate invite");
    }
  };

  const link = invite ? `${APP_URL}/?invite=${invite.code}` : null;
  const expires = invite
    ? new Date(invite.expiresAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const copy = () => {
    navigator.clipboard.writeText(link);
    onToast("Invite link copied!");
  };

  return (
    <div style={styles.inviteBox}>
      <div style={{ fontWeight: 600, color: "#fff", marginBottom: 8 }}>
        Invite Link
      </div>
      {invite ? (
        <>
          <div style={styles.linkBox}>{link}</div>
          <div style={{ fontSize: 11, color: "#7b8fa6", marginTop: 4 }}>
            Expires {expires}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={styles.primaryBtn} onClick={copy}>
              📋 Copy Link
            </button>
            <button style={styles.secondaryBtn} onClick={generate}>
              ↻ New Link
            </button>
          </div>
        </>
      ) : (
        <button style={styles.primaryBtn} onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Generate Invite Link"}
        </button>
      )}
    </div>
  );
}

function GroupDetail({ group, userId, onBack, onToast }) {
  const [members, setMembers] = useState(group.members || []);
  const isHost = group.host_user_id === userId;

  const removeMember = async (memberId) => {
    if (!confirm("Remove this member from the group?")) return;
    const data = await api(`/groups/${group.id}/members/${memberId}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    });
    if (data.ok) {
      setMembers((m) => m.filter((x) => x.id !== memberId));
      onToast("Member removed");
    } else {
      onToast("Failed to remove member");
    }
  };

  return (
    <div style={styles.detailWrap}>
      <button style={styles.backBtn} onClick={onBack}>
        ← Back to Groups
      </button>
      <div style={styles.detailHeader}>
        <div style={styles.groupIcon}>
          {group.name[0].toUpperCase()}
        </div>
        <div>
          <div style={styles.groupName}>{group.name}</div>
          <div style={{ color: "#7b8fa6", fontSize: 13 }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {isHost && (
        <InviteSection groupId={group.id} userId={userId} onToast={onToast} />
      )}

      <div style={styles.sectionLabel}>Members</div>
      <div style={styles.memberList}>
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            isHost={isHost}
            onRemove={removeMember}
          />
        ))}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function GroupsPage({ onToast, onSelectGroup }) {
  const { user } = useUser();
  const userId = user?.id;
  const displayName = user?.fullName || user?.username || "Me";

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await api(`/groups?userId=${encodeURIComponent(userId)}`);
    setGroups(Array.isArray(data.groups) ? data.groups : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const createGroup = async () => {
    if (!newName.trim()) return;
    const data = await api("/groups", {
      method: "POST",
      body: JSON.stringify({ name: newName.trim(), hostUserId: userId, displayName }),
    });
    if (data.id) {
      setNewName("");
      setCreating(false);
      onToast(`Group "${data.name}" created!`);
      load();
    } else {
      onToast("Failed to create group");
    }
  };

  const openGroup = async (groupId) => {
    const data = await api(`/groups/${groupId}?userId=${encodeURIComponent(userId)}`);
    if (data.id) setActiveGroup(data);
    else onToast("Failed to load group");
  };

  if (!userId) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Sign in to use Groups</div>
        <div style={{ color: "#7b8fa6", fontSize: 13 }}>
          Groups let you invite friends and track everyone across all your games.
        </div>
      </div>
    );
  }

  if (activeGroup) {
    return (
      <GroupDetail
        group={activeGroup}
        userId={userId}
        onBack={() => { setActiveGroup(null); load(); }}
        onToast={onToast}
      />
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.title}>My Groups</div>
        <button style={styles.primaryBtn} onClick={() => setCreating(true)}>
          + New Group
        </button>
      </div>

      {creating && (
        <div style={styles.createBox}>
          <div style={{ fontWeight: 600, color: "#fff", marginBottom: 10 }}>
            Name your group
          </div>
          <input
            style={styles.input}
            placeholder="e.g. March Madness Crew"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={styles.primaryBtn} onClick={createGroup}>
              Create
            </button>
            <button style={styles.secondaryBtn} onClick={() => { setCreating(false); setNewName(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>
          <div style={{ color: "#7b8fa6" }}>Loading…</div>
        </div>
      ) : groups.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>No groups yet</div>
          <div style={{ color: "#7b8fa6", fontSize: 13 }}>
            Create a group, then invite your friends via link.
          </div>
        </div>
      ) : (
        <div style={styles.groupList}>
          {groups.map((g) => (
            <div key={g.id} style={styles.groupCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={styles.groupIcon}>{g.name[0].toUpperCase()}</div>
                <div>
                  <div style={styles.groupName}>{g.name}</div>
                  <div style={{ color: "#7b8fa6", fontSize: 12 }}>
                    {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                    {g.host_user_id === userId ? " · You're the host" : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {onSelectGroup && (
                  <button
                    style={{ ...styles.secondaryBtn, fontSize: 12 }}
                    onClick={() => onSelectGroup(g)}
                  >
                    Select
                  </button>
                )}
                <button
                  style={{ ...styles.primaryBtn, fontSize: 12 }}
                  onClick={() => openGroup(g.id)}
                >
                  Manage →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────
const styles = {
  wrap: { padding: "20px 16px", maxWidth: 600, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: "#fff" },
  createBox: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 12,
    padding: 16, marginBottom: 16,
  },
  groupList: { display: "flex", flexDirection: "column", gap: 10 },
  groupCard: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 12,
    padding: "14px 16px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12,
  },
  groupIcon: {
    width: 42, height: 42, borderRadius: "50%",
    background: "linear-gradient(135deg, #3366cc, #1a4a9f)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  groupName: { fontWeight: 700, color: "#fff", fontSize: 15 },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 60, textAlign: "center",
  },
  input: {
    width: "100%", boxSizing: "border-box", background: "#0d1829",
    border: "1px solid #2a3a50", borderRadius: 8, color: "#fff",
    padding: "10px 12px", fontSize: 14, outline: "none",
  },
  primaryBtn: {
    background: "#3366cc", color: "#fff", border: "none", borderRadius: 8,
    padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13,
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: "#1a2535", color: "#a0b4cc", border: "1px solid #2a3a50",
    borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: "pointer",
    fontSize: 13, whiteSpace: "nowrap",
  },
  removeBtn: {
    background: "transparent", color: "#e55", border: "1px solid #e55",
    borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer",
  },
  // detail view
  detailWrap: { padding: "20px 16px", maxWidth: 600, margin: "0 auto" },
  backBtn: {
    background: "none", border: "none", color: "#7b8fa6", cursor: "pointer",
    fontSize: 13, padding: 0, marginBottom: 20,
  },
  detailHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  inviteBox: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 12,
    padding: 16, marginBottom: 20,
  },
  linkBox: {
    background: "#0d1829", borderRadius: 8, padding: "10px 12px",
    fontSize: 12, color: "#7b8fa6", wordBreak: "break-all", fontFamily: "monospace",
  },
  sectionLabel: { color: "#7b8fa6", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  memberList: { display: "flex", flexDirection: "column", gap: 8 },
  memberRow: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 10,
    padding: "12px 14px", display: "flex", justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", background: "#2a3a50",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#fff", fontSize: 15, flexShrink: 0,
  },
};

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { BACKEND } from "../shared/constants";

async function api(path, opts = {}) {
  const res = await fetch(BACKEND + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

/**
 * MemberPicker
 * Props:
 *   onConfirm(selectedMembers) — called with array of {userId, guestName, displayName}
 *   onCancel()
 *   title — e.g. "Pick players for Iowa vs Gonzaga"
 *   maxSelect — optional max (10 for timeout, 100 for squares)
 */
export default function MemberPicker({ onConfirm, onCancel, title, maxSelect }) {
  const { user } = useUser();
  const userId = user?.id;

  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load groups
  useEffect(() => {
    if (!userId) return;
    api(`/groups?userId=${encodeURIComponent(userId)}`).then((data) => {
      const g = Array.isArray(data.groups) ? data.groups : [];
      setGroups(g);
      if (g.length === 1) loadGroup(g[0].id);
      setLoadingGroups(false);
    });
  }, [userId]);

  const loadGroup = async (groupId) => {
    setActiveGroupId(groupId);
    setLoadingMembers(true);
    setSelected(new Set());
    const data = await api(`/groups/${groupId}?userId=${encodeURIComponent(userId)}`);
    setMembers(Array.isArray(data.members) ? data.members : []);
    setLoadingMembers(false);
  };

  const toggle = (memberId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        if (maxSelect && next.size >= maxSelect) return prev;
        next.add(memberId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const ids = members
      .slice(0, maxSelect || members.length)
      .map((m) => m.id);
    setSelected(new Set(ids));
  };

  const confirm = () => {
    const picked = members
      .filter((m) => selected.has(m.id))
      .map((m) => ({
        userId: m.user_id || null,
        guestName: m.guest_name || null,
        displayName: m.display_name,
      }));
    onConfirm(picked, activeGroupId);
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTitle}>👥 Select Players</div>
          <button style={s.closeBtn} onClick={onCancel}>✕</button>
        </div>

        {title && <div style={s.subtitle}>{title}</div>}

        {/* Group selector */}
        {!activeGroupId ? (
          <div style={s.section}>
            <div style={s.sectionLabel}>Choose a group</div>
            {loadingGroups ? (
              <div style={s.empty}>Loading…</div>
            ) : groups.length === 0 ? (
              <div style={s.empty}>
                No groups yet. Create one in the Groups tab first.
              </div>
            ) : (
              <div style={s.groupList}>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    style={s.groupBtn}
                    onClick={() => loadGroup(g.id)}
                  >
                    <div style={s.groupIcon}>{g.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "#7b8fa6" }}>
                        {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Back + group name */}
            <div style={s.groupHeader}>
              {groups.length > 1 && (
                <button style={s.backBtn} onClick={() => { setActiveGroupId(null); setMembers([]); }}>
                  ←
                </button>
              )}
              <div style={s.groupHeaderName}>{activeGroup?.name}</div>
              <button style={s.selectAllBtn} onClick={selectAll}>
                Select All
              </button>
            </div>

            {/* Member list */}
            {loadingMembers ? (
              <div style={s.empty}>Loading members…</div>
            ) : members.length === 0 ? (
              <div style={s.empty}>No members in this group yet.</div>
            ) : (
              <div style={s.memberList}>
                {members.map((m) => {
                  const isSel = selected.has(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{ ...s.memberRow, ...(isSel ? s.memberRowSel : {}) }}
                      onClick={() => toggle(m.id)}
                    >
                      <div style={s.check}>{isSel ? "✓" : ""}</div>
                      <div style={s.avatar}>{m.display_name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>
                          {m.display_name}
                        </div>
                        <div style={{ fontSize: 11, color: "#7b8fa6" }}>
                          {m.role === "host" ? "👑 Host" : m.user_id ? "✓ Member" : "👤 Guest"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Count + confirm */}
            <div style={s.footer}>
              <div style={{ color: "#7b8fa6", fontSize: 13 }}>
                {selected.size} selected
                {maxSelect ? ` / ${maxSelect} max` : ""}
              </div>
              <button
                style={{ ...s.confirmBtn, opacity: selected.size === 0 ? 0.4 : 1 }}
                onClick={confirm}
                disabled={selected.size === 0}
              >
                Confirm →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: "#0d1829", border: "1px solid #2a3a50", borderRadius: 16,
    width: "100%", maxWidth: 420, maxHeight: "85vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 18px", borderBottom: "1px solid #1a2535",
  },
  headerTitle: { fontWeight: 700, color: "#fff", fontSize: 16 },
  closeBtn: {
    background: "none", border: "none", color: "#7b8fa6",
    fontSize: 18, cursor: "pointer", padding: 4,
  },
  subtitle: {
    padding: "10px 18px 0", fontSize: 13, color: "#7b8fa6", lineHeight: 1.4,
  },
  section: { padding: 16, flex: 1, overflowY: "auto" },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: "#7b8fa6",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
  },
  empty: { textAlign: "center", color: "#7b8fa6", padding: "32px 0", fontSize: 14 },
  groupList: { display: "flex", flexDirection: "column", gap: 8 },
  groupBtn: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 10,
    padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
    cursor: "pointer", textAlign: "left", width: "100%",
  },
  groupIcon: {
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg, #3366cc, #1a4a9f)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  groupHeader: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 18px", borderBottom: "1px solid #1a2535",
  },
  backBtn: {
    background: "none", border: "none", color: "#7b8fa6",
    fontSize: 18, cursor: "pointer", padding: "0 4px",
  },
  groupHeaderName: { flex: 1, fontWeight: 600, color: "#fff", fontSize: 14 },
  selectAllBtn: {
    background: "none", border: "none", color: "#3366cc",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  memberList: { flex: 1, overflowY: "auto", padding: "8px 16px", display: "flex", flexDirection: "column", gap: 6 },
  memberRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
    border: "1px solid transparent", background: "#1a2535",
    transition: "all 0.15s",
  },
  memberRowSel: {
    background: "#1a2d4d", border: "1px solid #3366cc",
  },
  check: {
    width: 22, height: 22, borderRadius: 6,
    background: "#0d1829", border: "2px solid #2a3a50",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, color: "#3366cc", fontWeight: 700, flexShrink: 0,
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%", background: "#2a3a50",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#fff", fontSize: 14, flexShrink: 0,
  },
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 18px", borderTop: "1px solid #1a2535",
  },
  confirmBtn: {
    background: "#3366cc", color: "#fff", border: "none",
    borderRadius: 8, padding: "9px 20px", fontWeight: 700,
    fontSize: 14, cursor: "pointer",
  },
};

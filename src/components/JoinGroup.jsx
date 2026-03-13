import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/react";
import { BACKEND } from "../shared/constants";

async function api(path, opts = {}) {
  const res = await fetch(BACKEND + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

export default function JoinGroup({ inviteCode }) {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState("idle"); // idle | joining | done | error | expired
  const [guestName, setGuestName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");

  // Try to peek at invite info (group name) for display
  useEffect(() => {
    // We'll get the name back from the join call, nothing to pre-fetch
  }, []);

  const join = async (asGuest = false) => {
    const displayName = asGuest
      ? guestName.trim()
      : user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "Member";

    if (!displayName) return;

    setStatus("joining");
    try {
      const data = await api(`/groups/join/${encodeURIComponent(inviteCode)}`, {
        method: "POST",
        body: JSON.stringify({
          userId: asGuest ? null : user?.id,
          displayName,
        }),
      });

      if (data.error) {
        if (data.error.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
          setMessage(data.error);
        }
        return;
      }

      setStatus("done");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setStatus("error");
      setMessage("Network error — please check your connection and try again.");
    }
  };

  if (!isLoaded) return <Screen><Spinner /></Screen>;

  if (status === "done") {
    return (
      <Screen>
        <div style={s.icon}>✅</div>
        <div style={s.title}>You're in!</div>
        <div style={s.sub}>Taking you to the app…</div>
      </Screen>
    );
  }

  if (status === "expired") {
    return (
      <Screen>
        <div style={s.icon}>⏰</div>
        <div style={s.title}>Invite Expired</div>
        <div style={s.sub}>This link has expired. Ask the host to generate a new one.</div>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen>
        <div style={s.icon}>❌</div>
        <div style={s.title}>Something went wrong</div>
        <div style={s.sub}>{message}</div>
        <button style={s.primaryBtn} onClick={() => setStatus("idle")}>Try again</button>
      </Screen>
    );
  }

  return (
    <Screen>
      <div style={s.logo}>BT</div>
      <div style={s.title}>You've been invited!</div>
      <div style={s.sub}>Join the group to view boards, claim squares, and track your wins.</div>

      {user ? (
        // Signed-in user — join immediately
        <div style={s.card}>
          <div style={s.cardLabel}>Joining as</div>
          <div style={s.nameDisplay}>
            {user.fullName || user.username || user.emailAddresses?.[0]?.emailAddress}
          </div>
          <button
            style={s.primaryBtn}
            onClick={() => join(false)}
            disabled={status === "joining"}
          >
            {status === "joining" ? "Joining…" : "Join Group"}
          </button>
        </div>
      ) : (
        // Not signed in — offer sign in OR guest
        <div style={s.options}>
          <div style={s.card}>
            <div style={s.cardLabel}>Option 1 — Sign in</div>
            <div style={s.cardDesc}>
              Sign in with Google to track your wins and stats across games.
            </div>
            <SignInButton mode="modal" afterSignInUrl={window.location.href}>
              <button style={s.primaryBtn}>Sign in with Google</button>
            </SignInButton>
          </div>

          <div style={s.divider}>or</div>

          <div style={s.card}>
            <div style={s.cardLabel}>Option 2 — Join as guest</div>
            <div style={s.cardDesc}>
              Enter your name to join without an account. You can view boards and claim spots.
            </div>
            <input
              style={s.input}
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join(true)}
            />
            <button
              style={{ ...s.secondaryBtn, marginTop: 10 }}
              onClick={() => join(true)}
              disabled={!guestName.trim() || status === "joining"}
            >
              {status === "joining" ? "Joining…" : "Join as Guest"}
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Screen({ children }) {
  return (
    <div style={s.screen}>
      <div style={s.container}>{children}</div>
    </div>
  );
}

function Spinner() {
  return <div style={{ color: "#7b8fa6" }}>Loading…</div>;
}

const s = {
  screen: {
    minHeight: "100vh", background: "#0d1829",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  container: {
    width: "100%", maxWidth: 420, textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  logo: {
    width: 64, height: 64, borderRadius: 16,
    background: "linear-gradient(135deg, #3366cc, #1a4a9f)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4,
  },
  icon: { fontSize: 52 },
  title: { fontSize: 24, fontWeight: 700, color: "#fff" },
  sub: { fontSize: 14, color: "#7b8fa6", lineHeight: 1.6, maxWidth: 320 },
  options: { width: "100%", display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "#1a2535", border: "1px solid #2a3a50", borderRadius: 14,
    padding: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 8,
  },
  cardLabel: { fontSize: 11, fontWeight: 700, color: "#7b8fa6", textTransform: "uppercase", letterSpacing: 1 },
  cardDesc: { fontSize: 13, color: "#a0b4cc", lineHeight: 1.5 },
  nameDisplay: {
    background: "#0d1829", borderRadius: 8, padding: "10px 12px",
    color: "#fff", fontWeight: 600, fontSize: 15,
  },
  input: {
    width: "100%", boxSizing: "border-box", background: "#0d1829",
    border: "1px solid #2a3a50", borderRadius: 8, color: "#fff",
    padding: "10px 12px", fontSize: 14, outline: "none",
  },
  primaryBtn: {
    width: "100%", background: "#3366cc", color: "#fff", border: "none",
    borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 15,
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%", background: "#0d1829", color: "#a0b4cc",
    border: "1px solid #2a3a50", borderRadius: 10, padding: "12px 0",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  divider: { color: "#2a3a50", fontWeight: 600, fontSize: 13 },
};

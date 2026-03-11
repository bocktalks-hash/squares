import { useState, useEffect, useRef } from "react";
import { css } from "./shared/styles";
import Toast from "./components/Toast";
import ViewerMode from "./components/ViewerMode";
import PickMode from "./components/PickMode";
import SessionDashboard from "./components/SessionDashboard";
import SessionPanel from "./components/SessionPanel";
import GroupsPage from "./components/GroupsPage";
import JoinGroup from "./components/JoinGroup";
import SquaresGame from "./games/squares/SquaresGame";
import TimeoutGame from "./games/timeout/TimeoutGame";
import { STORAGE_KEY, TO_STORAGE_KEY } from "./shared/constants";
import { useAuth, useUser, SignInButton, SignOutButton, UserButton } from "@clerk/react";

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    join: params.get("join"),
    pick: params.get("pick"),
    token: params.get("t"),
    session: params.get("session"),
    invite: params.get("invite"),
  };
}

const { join, pick, token, session, invite } = getUrlParams();

function getStoredGames() {
  try {
    const sq = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const to = JSON.parse(localStorage.getItem(TO_STORAGE_KEY) || "[]");
    return {
      squaresGames: Array.isArray(sq) ? sq : [],
      timeoutGames: Array.isArray(to) ? to : [],
    };
  } catch {
    return { squaresGames: [], timeoutGames: [] };
  }
}

const NAV_ITEMS = [
  { id: "squares",  icon: "⬛", label: "Squares" },
  { id: "timeout",  icon: "⏱",  label: "Timeout" },
  { id: "groups",   icon: "👥", label: "Groups"  },
  { id: "session",  icon: "🔗", label: "Session" },
];

// ── Hamburger drawer ──────────────────────────────────────────────────────────
function Drawer({ mode, setMode, openSession, onClose }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const pick = (id) => {
    if (id === "session") openSession();
    else setMode(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={dr.backdrop} />

      {/* Panel */}
      <div style={dr.panel}>
        {/* Header */}
        <div style={dr.header}>
          <div style={dr.logo}>
            <img src="/logo.svg" alt="Bock Talks" style={{ height: 32, width: 32, borderRadius: "50%" }} />
            <span style={dr.logoText}>Bock Talks</span>
          </div>
          <button onClick={onClose} style={dr.closeBtn}>✕</button>
        </div>

        {/* User info */}
        {isSignedIn && user && (
          <div style={dr.userRow}>
            <div style={dr.userAvatar}>
              {user.imageUrl
                ? <img src={user.imageUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : (user.fullName || "U")[0]}
            </div>
            <div>
              <div style={dr.userName}>{user.fullName || user.username || "You"}</div>
              <div style={dr.userEmail}>{user.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
        )}

        <div style={dr.divider} />

        {/* Nav items */}
        <nav style={dr.nav}>
          {NAV_ITEMS.map(item => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => pick(item.id)}
                style={{ ...dr.navItem, ...(active ? dr.navItemActive : {}) }}
              >
                <span style={dr.navIcon}>{item.icon}</span>
                <span style={dr.navLabel}>{item.label}</span>
                {active && <span style={dr.activeDot} />}
              </button>
            );
          })}
        </nav>

        <div style={dr.divider} />

        {/* Auth */}
        <div style={dr.authSection}>
          {isSignedIn ? (
            <SignOutButton>
              <button style={dr.signOutBtn}>Sign Out</button>
            </SignOutButton>
          ) : (
            <SignInButton mode="modal">
              <button style={dr.signInBtn}>Sign In with Google</button>
            </SignInButton>
          )}
        </div>
      </div>
    </>
  );
}

// ── Desktop nav tabs ──────────────────────────────────────────────────────────
function DesktopNav({ mode, setMode, openSession }) {
  const pick = (id) => id === "session" ? openSession() : setMode(id);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-tab ${mode === item.id ? "active" : ""}`}
          onClick={() => pick(item.id)}
        >
          {item.icon} <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("squares");
  const [toast, setToast] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storedGames, setStoredGames] = useState(getStoredGames);

  const openSession = () => {
    setStoredGames(getStoredGames());
    setMode("session");
  };

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Full-screen URL takeovers
  if (invite) return <JoinGroup inviteCode={invite} />;
  if (join)   return <ViewerMode code={join} />;
  if (pick && token) return <PickMode code={pick} token={token} />;
  if (session) return <SessionDashboard sessionId={session} />;

  return (
    <>
      <style>{css}</style>
      <style>{appStyles}</style>

      <div className="app-shell">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" />
            <span className="logo-wordmark">Bock Talks</span>
          </div>

          {/* Desktop nav — hidden on mobile via CSS */}
          <div className="desktop-nav">
            <DesktopNav mode={mode} setMode={setMode} openSession={openSession} />
            <AuthAvatarDesktop />
          </div>

          {/* Mobile right side — auth avatar + hamburger */}
          <div className="mobile-nav">
            <AuthAvatarMobile />
            <button
              className="hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Drawer ── */}
        {drawerOpen && (
          <Drawer
            mode={mode}
            setMode={setMode}
            openSession={openSession}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        {/* ── Page content ── */}
        <div style={{ display: mode === "squares" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <SquaresGame onToast={msg => setToast(msg)} />
        </div>
        <div style={{ display: mode === "timeout" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <TimeoutGame onToast={msg => setToast(msg)} />
        </div>
        {mode === "groups" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <GroupsPage onToast={msg => setToast(msg)} />
          </div>
        )}
        {mode === "session" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <SessionPanel
              squaresGames={storedGames.squaresGames}
              timeoutGames={storedGames.timeoutGames}
              onToast={msg => setToast(msg)}
            />
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

function AuthAvatarDesktop() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <UserButton afterSignOutUrl="/" />;
  return (
    <SignInButton mode="modal">
      <button className="clerk-sign-in">Sign In</button>
    </SignInButton>
  );
}

function AuthAvatarMobile() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return null;
  return <UserButton afterSignOutUrl="/" />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const appStyles = `
  .clerk-sign-in {
    background: #3366cc; color: #fff; border: none;
    padding: 7px 16px; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .clerk-sign-in:hover { opacity: 0.85; }

  .nav-tab {
    background: none; border: none; color: #7b8fa6;
    padding: 8px 14px; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
    white-space: nowrap; transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .nav-tab:hover { color: #fff; background: #1a2535; }
  .nav-tab.active { color: #fff; background: #1a2535; }

  /* Desktop nav: visible above 640px */
  .desktop-nav {
    display: flex; align-items: center; gap: 8px; margin-left: auto;
  }
  /* Mobile nav: hidden above 640px */
  .mobile-nav { display: none; align-items: center; gap: 10px; margin-left: auto; }

  /* Hamburger button */
  .hamburger {
    background: none; border: none; cursor: pointer;
    display: flex; flex-direction: column; gap: 5px;
    padding: 8px; border-radius: 8px;
  }
  .hamburger:hover { background: #1a2535; }
  .hamburger span {
    display: block; width: 22px; height: 2px;
    background: #a0b4cc; border-radius: 2px; transition: all 0.2s;
  }

  @media(max-width: 640px) {
    .desktop-nav { display: none; }
    .mobile-nav { display: flex; }
    .topbar { padding: 0 12px; }
  }
`;

// ── Drawer styles (plain objects for inline use) ──────────────────────────────
const dr = {
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
    zIndex: 900,
  },
  panel: {
    position: "fixed", top: 0, right: 0, bottom: 0, width: 280,
    background: "#0d1829", borderLeft: "1px solid #1a2535",
    zIndex: 901, display: "flex", flexDirection: "column",
    boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    overflowY: "auto",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 16px 14px", flexShrink: 0,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
    fontWeight: 700, letterSpacing: 2, color: "#fff", textTransform: "uppercase",
  },
  closeBtn: {
    background: "none", border: "none", color: "#7b8fa6",
    fontSize: 18, cursor: "pointer", padding: 6, borderRadius: 6,
    lineHeight: 1,
  },
  userRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 16px 14px",
  },
  userAvatar: {
    width: 42, height: 42, borderRadius: "50%",
    background: "linear-gradient(135deg, #3366cc, #1a4a9f)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#fff", fontSize: 16, flexShrink: 0,
    overflow: "hidden",
  },
  userName: { fontWeight: 700, color: "#fff", fontSize: 14 },
  userEmail: { fontSize: 12, color: "#7b8fa6", marginTop: 2 },
  divider: { height: 1, background: "#1a2535", margin: "4px 0", flexShrink: 0 },
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 10px" },
  navItem: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "13px 14px", borderRadius: 10, cursor: "pointer",
    background: "none", border: "none", color: "#a0b4cc",
    fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    textAlign: "left", width: "100%", position: "relative",
    transition: "all 0.15s",
  },
  navItemActive: {
    background: "#1a2d4d", color: "#fff",
  },
  navIcon: { fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 },
  navLabel: { flex: 1 },
  activeDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#3366cc", flexShrink: 0,
  },
  authSection: { padding: "12px 16px", marginTop: "auto", flexShrink: 0 },
  signInBtn: {
    width: "100%", background: "#3366cc", color: "#fff", border: "none",
    borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  signOutBtn: {
    width: "100%", background: "transparent", color: "#7b8fa6",
    border: "1px solid #1a2535", borderRadius: 10, padding: "11px 0",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
};

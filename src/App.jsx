import { useState, useEffect } from "react";
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
import LandingPage from "./LandingPage";
import PrivacyPolicy from "./PrivacyPolicy";
import TutorialTour, { shouldShowTour } from "./TutorialTour";
import { STORAGE_KEY, TO_STORAGE_KEY } from "./shared/constants";
import { useAuth, useUser, SignInButton, SignOutButton, UserButton } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";


const GUEST_KEY = "bt_guest_mode";

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
  { id: "squares", icon: "⬛", label: "Squares", tour: "tab-squares" },
  { id: "timeout", icon: "⏱",  label: "Timeout", tour: "tab-timeout" },
  { id: "groups",  icon: "👥", label: "Groups",  tour: "tab-groups"  },
  { id: "session", icon: "🔗", label: "Session", tour: "tab-session" },
];

// ── Hamburger drawer ──────────────────────────────────────────────────────────
function Drawer({ mode, setMode, openSession, onClose }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const pickNav = (id) => {
    if (id === "session") openSession();
    else setMode(id);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={dr.backdrop} />
      <div style={dr.panel}>
        <div style={dr.header}>
          <div style={dr.logo}>
            <img src="/logo.png" alt="Bock Talks" style={{ height: 32, width: 32, borderRadius: "50%" }} />
            <span style={dr.logoText}>Bock Talks</span>
          </div>
          <button onClick={onClose} style={dr.closeBtn}>✕</button>
        </div>

        {isSignedIn && user ? (
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
        ) : (
          <div style={dr.guestRow}>
            <div style={dr.guestBadge}>👤 Guest</div>
            <div style={dr.guestHint}>Sign in to unlock groups & group games</div>
          </div>
        )}

        <div style={dr.divider} />

        <nav style={dr.nav}>
          {NAV_ITEMS.map(item => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                data-tour={item.tour}
                onClick={() => pickNav(item.id)}
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
  const pickNav = (id) => id === "session" ? openSession() : setMode(id);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          data-tour={item.tour}
          className={`nav-tab ${mode === item.id ? "active" : ""}`}
          onClick={() => pickNav(item.id)}
        >
          {item.icon} <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
function MainApp({ showTourOnMount }) {
  const [mode, setMode] = useState("squares");
  const [toast, setToast] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storedGames, setStoredGames] = useState(getStoredGames);
  const [showTour, setShowTour] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (showTourOnMount && shouldShowTour()) {
      const t = setTimeout(() => setShowTour(true), 400);
      return () => clearTimeout(t);
    }
  }, [showTourOnMount]);

  const openSession = () => {
    setStoredGames(getStoredGames());
    setMode("session");
  };

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 640) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <style>{css}</style>
      <style>{appStyles}</style>

      <div className="app-shell">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.png" alt="Bock Talks" style={{ height: 32, width: 32, borderRadius: "50%" }} />
            <span className="logo-wordmark">Bock Talks</span>
          </div>

          <div className="desktop-nav">
            <DesktopNav mode={mode} setMode={setMode} openSession={openSession} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="help-btn" onClick={() => setShowTour(true)} title="How to play">?</button>
              {isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="clerk-sign-in">Sign In</button>
                </SignInButton>
              )}
            </div>
          </div>

          <div className="mobile-nav">
            <button className="help-btn" onClick={() => setShowTour(true)} title="How to play">?</button>
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Guest banner */}
        {!isSignedIn && (
          <div className="guest-banner">
            <span>👤 Playing as guest</span>
            <SignInButton mode="modal">
              <button className="guest-banner-btn">Sign in for groups & more</button>
            </SignInButton>
          </div>
        )}

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
            <GroupsPage onToast={msg => setToast(msg)} isSignedIn={!!isSignedIn} />
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

      {showTour && <TutorialTour onDone={() => setShowTour(false)} />}
    </>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100dvh", background: "#060d1a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="Bock Talks" style={{
          width: 56, height: 56, borderRadius: "50%",
          animation: "spin 1.5s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Router wrapper ────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  if (location.pathname === "/privacy") return <PrivacyPolicy />;
  if (location.pathname === "/sso-callback") return <AuthenticateWithRedirectCallback />;
  return <AppCore />;
}

// ── Core app logic ────────────────────────────────────────────────────────────
function AppCore() {
  const { isSignedIn, isLoaded } = useAuth();
  const [guestMode, setGuestMode] = useState(() => sessionStorage.getItem(GUEST_KEY) === "true");
  const [showTourOnMount, setShowTourOnMount] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      sessionStorage.removeItem(GUEST_KEY);
      setGuestMode(false);
    }
  }, [isSignedIn]);

  // Public URL takeovers
  if (invite) return <JoinGroup inviteCode={invite} />;
  if (join)   return <ViewerMode code={join} />;
  if (pick && token) return <PickMode code={pick} token={token} />;
  if (session) return <SessionDashboard sessionId={session} />;

  if (!isLoaded) return <LoadingScreen />;

  if (isSignedIn) return <MainApp showTourOnMount={shouldShowTour()} />;

  if (guestMode) return <MainApp showTourOnMount={showTourOnMount} />;

  return (
    <LandingPage
      onContinueAsGuest={() => {
        sessionStorage.setItem(GUEST_KEY, "true");
        setShowTourOnMount(true);
        setGuestMode(true);
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
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
  .help-btn {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #7b8fa6; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; flex-shrink: 0;
  }
  .help-btn:hover { background: rgba(51,102,204,0.15); border-color: rgba(51,102,204,0.4); color: #3366cc; }
  .guest-banner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; background: rgba(51,102,204,0.08);
    border-bottom: 1px solid rgba(51,102,204,0.15);
    font-size: 13px; color: #7b8fa6; font-family: 'DM Sans', sans-serif; flex-shrink: 0;
  }
  .guest-banner-btn {
    background: none; border: 1px solid #3366cc; color: #3366cc; border-radius: 6px;
    padding: 4px 12px; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.15s;
  }
  .guest-banner-btn:hover { background: rgba(51,102,204,0.12); }
  .nav-tab {
    background: none; border: none; color: #7b8fa6;
    padding: 8px 14px; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
    white-space: nowrap; transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .nav-tab:hover { color: #fff; background: #1a2535; }
  .nav-tab.active { color: #fff; background: #1a2535; }
  .desktop-nav { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .mobile-nav { display: none; align-items: center; gap: 10px; margin-left: auto; }
  .hamburger { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 8px; border-radius: 8px; }
  .hamburger:hover { background: #1a2535; }
  .hamburger span { display: block; width: 22px; height: 2px; background: #a0b4cc; border-radius: 2px; transition: all 0.2s; }
  @media(max-width: 640px) {
    .desktop-nav { display: none; }
    .mobile-nav { display: flex; }
    .topbar { padding: 0 12px; }
    .guest-banner { font-size: 12px; }
  }
`;

const dr = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 900 },
  panel: { position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: "#0d1829", borderLeft: "1px solid #1a2535", zIndex: 901, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.4)", overflowY: "auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 14px", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, color: "#fff", textTransform: "uppercase" },
  closeBtn: { background: "none", border: "none", color: "#7b8fa6", fontSize: 18, cursor: "pointer", padding: 6, borderRadius: 6, lineHeight: 1 },
  userRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 14px" },
  userAvatar: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #3366cc, #1a4a9f)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16, flexShrink: 0, overflow: "hidden" },
  userName: { fontWeight: 700, color: "#fff", fontSize: 14 },
  userEmail: { fontSize: 12, color: "#7b8fa6", marginTop: 2 },
  guestRow: { padding: "10px 16px 14px" },
  guestBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "4px 12px", fontSize: 13, color: "#a0b4cc", fontWeight: 600, marginBottom: 6 },
  guestHint: { fontSize: 12, color: "#4a5a6b", lineHeight: 1.4 },
  divider: { height: 1, background: "#1a2535", margin: "4px 0", flexShrink: 0 },
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 10px" },
  navItem: { display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 10, cursor: "pointer", background: "none", border: "none", color: "#a0b4cc", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: "left", width: "100%", position: "relative", transition: "all 0.15s" },
  navItemActive: { background: "#1a2d4d", color: "#fff" },
  navIcon: { fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 },
  navLabel: { flex: 1 },
  activeDot: { width: 7, height: 7, borderRadius: "50%", background: "#3366cc", flexShrink: 0 },
  authSection: { padding: "12px 16px", marginTop: "auto", flexShrink: 0 },
  signInBtn: { width: "100%", background: "#3366cc", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  signOutBtn: { width: "100%", background: "transparent", color: "#7b8fa6", border: "1px solid #1a2535", borderRadius: 10, padding: "11px 0", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
};

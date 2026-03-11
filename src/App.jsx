import { useState } from "react";
import { css } from "./shared/styles";
import Toast from "./components/Toast";
import ViewerMode from "./components/ViewerMode";
import PickMode from "./components/PickMode";
import SessionDashboard from "./components/SessionDashboard";
import SessionPanel from "./components/SessionPanel";
import SquaresGame from "./games/squares/SquaresGame";
import TimeoutGame from "./games/timeout/TimeoutGame";
import { STORAGE_KEY, TO_STORAGE_KEY } from "./shared/constants";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/react";

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    join: params.get("join"),
    pick: params.get("pick"),
    token: params.get("t"),
    session: params.get("session"),
  };
}

const { join, pick, token, session } = getUrlParams();

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

export default function App() {
  const [mode, setMode] = useState("squares");
  const [toast, setToast] = useState(null);
  const [showSession, setShowSession] = useState(false);
  const [storedGames, setStoredGames] = useState(getStoredGames);

  const openSession = () => {
    setStoredGames(getStoredGames());
    setShowSession(true);
  };

  if (join) return <ViewerMode code={join} />;
  if (pick && token) return <PickMode code={pick} token={token} />;
  if (session) return <SessionDashboard sessionId={session} />;

  return (
    <>
      <style>{css}</style>
      <style>{`
        .clerk-sign-in {
          background: var(--court-bright); color: #fff; border: none;
          padding: 7px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .clerk-sign-in:hover { opacity: 0.85; }
      `}</style>
      <div className="app-shell">
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" />
            Bock Talks <span>{showSession ? "Session" : mode === "squares" ? "Squares" : "Timeout"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="mode-switcher">
              <button
                className={`mode-btn ${!showSession && mode === "squares" ? "active" : ""}`}
                onClick={() => { setShowSession(false); setMode("squares"); }}
              >⬛ Squares</button>
              <button
                className={`mode-btn ${!showSession && mode === "timeout" ? "active" : ""}`}
                onClick={() => { setShowSession(false); setMode("timeout"); }}
              >⏱ Timeout</button>
              <button
                className={`mode-btn ${showSession ? "active" : ""}`}
                onClick={openSession}
                style={{ background: showSession ? "#7c3aed" : undefined }}
              >🔗 Session</button>
            </div>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="clerk-sign-in">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>

        {showSession ? (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <SessionPanel
              squaresGames={storedGames.squaresGames}
              timeoutGames={storedGames.timeoutGames}
              onToast={msg => setToast(msg)}
            />
          </div>
        ) : (
          <>
            <div style={{ display: mode === "squares" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <SquaresGame onToast={msg => setToast(msg)} />
            </div>
            <div style={{ display: mode === "timeout" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <TimeoutGame onToast={msg => setToast(msg)} />
            </div>
          </>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

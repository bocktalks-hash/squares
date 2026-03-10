import { useState } from "react";
import { css } from "./shared/styles";
import Toast from "./components/Toast";
import SquaresGame from "./games/squares/SquaresGame";
import TimeoutGame from "./games/timeout/TimeoutGame";

export default function App() {
  const [mode, setMode] = useState("squares"); // "squares" | "timeout"
  const [toast, setToast] = useState(null);

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">

        {/* ── Top Bar ── */}
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" />
            Bock Talks <span>{mode === "squares" ? "Squares" : "Timeout"}</span>
          </div>
          <div className="mode-switcher">
            <button className={`mode-btn ${mode === "squares" ? "active" : ""}`} onClick={() => setMode("squares")}>
              ⬛ Squares
            </button>
            <button className={`mode-btn ${mode === "timeout" ? "active" : ""}`} onClick={() => setMode("timeout")}>
              ⏱ Timeout
            </button>
          </div>
        </div>

        {/* ── Squares mode ── always mounted so bots keep running when switching */}
        <div style={{
          display: mode === "squares" ? "flex" : "none",
          flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden",
        }}>
          <SquaresGame onToast={msg => setToast(msg)} />
        </div>

        {/* ── Timeout mode ── always mounted so bots keep running when switching */}
        <div style={{
          display: mode === "timeout" ? "flex" : "none",
          flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden",
        }}>
          <TimeoutGame onToast={msg => setToast(msg)} />
        </div>

      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

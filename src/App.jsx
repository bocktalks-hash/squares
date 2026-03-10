import { useState } from "react";
import { css } from "./shared/styles";
import Toast from "./components/Toast";
import ViewerMode from "./components/ViewerMode";
import PickMode from "./components/PickMode";
import SquaresGame from "./games/squares/SquaresGame";
import TimeoutGame from "./games/timeout/TimeoutGame";

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return { join: params.get("join"), pick: params.get("pick"), token: params.get("t") };
}

const { join, pick, token } = getUrlParams();

export default function App() {
  const [mode, setMode] = useState("squares");
  const [toast, setToast] = useState(null);

  if (join) return <ViewerMode code={join} />;
  if (pick && token) return <PickMode code={pick} token={token} />;

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="topbar">
          <div className="topbar-logo">
            <img src="/logo.svg" alt="Bock Talks" />
            Bock Talks <span>{mode === "squares" ? "Squares" : "Timeout"}</span>
          </div>
          <div className="mode-switcher">
            <button className={`mode-btn ${mode === "squares" ? "active" : ""}`} onClick={() => setMode("squares")}>⬛ Squares</button>
            <button className={`mode-btn ${mode === "timeout" ? "active" : ""}`} onClick={() => setMode("timeout")}>⏱ Timeout</button>
          </div>
        </div>
        <div style={{ display: mode === "squares" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <SquaresGame onToast={msg => setToast(msg)} />
        </div>
        <div style={{ display: mode === "timeout" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <TimeoutGame onToast={msg => setToast(msg)} />
        </div>
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

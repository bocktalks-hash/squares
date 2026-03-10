import { useState, useEffect, useRef } from "react";
import SetupPanel from "./SetupPanel";
import GridPanel from "./GridPanel";
import ScoresPanel from "./ScoresPanel";
import { HistoryPanel, PayoutPanel } from "./HistoryAndPayoutPanels";
import PlayersPanel from "../../components/PlayersPanel";

export default function GameView({ game, onUpdate, onToast, onDelete }) {
  const [tab, setTab] = useState("setup");

  // Bot & score state lifted up so it survives tab switches
  const [scoreA, setScoreA]         = useState(0);
  const [scoreB, setScoreB]         = useState(0);
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus]   = useState("");
  const [botLive, setBotLive]       = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const botProps = { scoreA, setScoreA, scoreB, setScoreB, botRunning, setBotRunning, botStatus, setBotStatus, botLive, setBotLive, timerRef };

  const innerTabs = [
    { id: "setup",   label: "Setup",   icon: "⚙" },
    { id: "grid",    label: "Grid",    icon: "⬜" },
    { id: "scores",  label: "Live",    icon: "📡" },
    { id: "players", label: "Players", icon: "👥" },
    { id: "payout",  label: "Payout",  icon: "💰" },
    { id: "history", label: "History", icon: "📋" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="inner-tabs">
        {innerTabs.map(t => (
          <div key={t.id} className={`inner-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
            {t.id === "scores" && botRunning && <span style={{ marginLeft: 4, color: "var(--win)", fontSize: 9 }}>●</span>}
          </div>
        ))}
      </div>
      <div className="game-content">
        {tab === "setup"   && <SetupPanel  game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab === "grid"    && <GridPanel   game={game} onUpdate={onUpdate} />}
        {tab === "scores"  && <ScoresPanel game={game} onUpdate={onUpdate} onToast={onToast} botProps={botProps} />}
        {tab === "players" && <PlayersPanel />}
        {tab === "payout"  && <PayoutPanel game={game} onUpdate={onUpdate} />}
        {tab === "history" && <HistoryPanel game={game} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

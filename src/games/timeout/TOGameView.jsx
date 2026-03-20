import { useState, useEffect, useRef } from "react";
import { BACKEND } from "../../shared/constants";
import TOSetupPanel from "./TOSetupPanel";
import { TOBoardPanel, TOPayoutPanel } from "./TOBoardAndPayoutPanels";
import TOLivePanel from "./TOLivePanel";
import PlayersPanel from "../../components/PlayersPanel";
import TOSharePanel from "./TOSharePanel";

export default function TOGameView({ game, onUpdate, onToast, onDelete, botProps }) {
  const [tab, setTab] = useState("setup");

  // ── Always-on sync: push game state to DB whenever game changes (if shared) ──
  useEffect(() => {
    if (!game.shareCode || !game.hostToken) return;
    const sync = async () => {
      try {
        await fetch(`${BACKEND}/games/${game.shareCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostToken: game.hostToken, data: game }),
        });
      } catch {}
    };
    const t = setTimeout(sync, 800);
    return () => clearTimeout(t);
  }, [game]);

  // ── Challenge badge: poll for pending challenges in background ──────────────
  const [pendingChallengeCount, setPendingChallengeCount] = useState(0);
  const prevChallengeCount = useRef(0);
  useEffect(() => {
    if (!game.shareCode || !game.hostToken) return;
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/games/${game.shareCode}/challenges?hostToken=${game.hostToken}`);
        if (!res.ok) return;
        const { challenges } = await res.json();
        const pending = (challenges || []).filter(c => c.status === "pending").length;
        setPendingChallengeCount(pending);
        if (pending > prevChallengeCount.current) {
          onToast(`⚑ New challenge received — check Share tab`);
        }
        prevChallengeCount.current = pending;
      } catch {}
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [game.shareCode, game.hostToken]);

  // ── Tab change: trigger immediate fetch when switching to Live ──────────────
  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "live" && botProps?.botRunning && botProps?.fetchScores) {
      setTimeout(botProps.fetchScores, 100);
    }
  };

  // Wire autopilot setter through onUpdate
  const fullBotProps = {
    ...botProps,
    autopilot: !!(game.options?.autopilot),
    setAutopilot: (val) => onUpdate({ options: { ...(game.options || {}), autopilot: val } }),
  };

  const innerTabs = [
    { id: "setup",   label: "Setup",   icon: "⚙" },
    { id: "board",   label: "Board",   icon: "🎯" },
    { id: "live",    label: "Live",    icon: "📡" },
    { id: "payout",  label: "Payout",  icon: "💰" },
    { id: "players", label: "Players", icon: "👥" },
    { id: "share",   label: "Share",   icon: "🔗", badge: pendingChallengeCount },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div className="inner-tabs" style={{ flexShrink: 0 }}>
        {innerTabs.map(t => (
          <div key={t.id} className={`inner-tab ${tab === t.id ? "active" : ""}`} onClick={() => handleTabChange(t.id)}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
            {t.id === "live" && botProps?.botRunning && (
              <span style={{ marginLeft: 4, color: "var(--win)", fontSize: 9 }}>●</span>
            )}
            {t.badge > 0 && (
              <span style={{
                marginLeft: 5, background: "#e53935", color: "#fff",
                borderRadius: "50%", fontSize: 10, fontWeight: 700,
                width: 16, height: 16, display: "inline-flex",
                alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>
      <div className="game-content" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {tab === "setup"   && <TOSetupPanel  game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab === "board"   && <TOBoardPanel  game={game} onUpdate={onUpdate} onToast={onToast} />}
        {tab === "live"    && <TOLivePanel   game={game} onUpdate={onUpdate} onToast={onToast} botProps={fullBotProps} />}
        {tab === "payout"  && <TOPayoutPanel game={game} onUpdate={onUpdate} />}
        {tab === "players" && <PlayersPanel />}
        {tab === "share"   && <TOSharePanel  game={game} onUpdate={onUpdate} onToast={onToast} />}
      </div>
    </div>
  );
}

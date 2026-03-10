import { useState, useEffect } from "react";
import { loadTOState, saveTOState } from "../../shared/storage";
import { makeTOGame, toTabLabel } from "../../shared/utils";
import TOGameView from "./TOGameView";

let toNextId = 1;

export default function TimeoutGame({ onToast }) {
  const [games, setGames] = useState(() => {
    const saved = loadTOState();
    if (saved?.games?.length) {
      toNextId = Math.max(...saved.games.map(g => g.id)) + 1;
      return saved.games;
    }
    return [makeTOGame(toNextId++)];
  });

  const [activeId, setActiveId] = useState(() => loadTOState()?.activeId || 1);

  useEffect(() => { saveTOState(games, activeId); }, [games, activeId]);

  const activeGame = games.find(g => g.id === activeId) || games[0];

  const addGame = () => {
    const g = makeTOGame(toNextId++);
    setGames(prev => [...prev, g]);
    setActiveId(g.id);
  };

  const removeGame = (id) => {
    if (games.length === 1) return;
    const remaining = games.filter(g => g.id !== id);
    setGames(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const updateGame = (id, patch) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="main-area">
        {activeGame && (
          <TOGameView
            key={activeGame.id}
            game={activeGame}
            onUpdate={patch => updateGame(activeGame.id, patch)}
            onToast={onToast}
            onDelete={() => removeGame(activeGame.id)}
          />
        )}
      </div>
      <div className="tab-bar">
        <div className="tab-bar-scroll">
          {games.map(g => (
            <div key={g.id} className={`tab-item ${g.id === activeId ? "active" : ""}`} onClick={() => setActiveId(g.id)}>
              {toTabLabel(g)}
              {games.length > 1 && (
                <span className="tab-close" onClick={e => { e.stopPropagation(); removeGame(g.id); }}>×</span>
              )}
            </div>
          ))}
        </div>
        <div className="tab-add" onClick={addGame} title="Add game">＋</div>
      </div>
    </div>
  );
}

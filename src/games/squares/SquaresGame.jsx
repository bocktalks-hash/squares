import { useState, useEffect } from "react";
import { loadState, saveState } from "../../shared/storage";
import { makeNewGame, autoTabName } from "../../shared/utils";
import GameView from "./GameView";

let nextId = 1;

export default function SquaresGame({ onToast }) {
  const [games, setGames] = useState(() => {
    const saved = loadState();
    if (saved?.games?.length) {
      nextId = Math.max(...saved.games.map(g => g.id)) + 1;
      return saved.games;
    }
    return [makeNewGame(nextId++)];
  });

  const [activeId, setActiveId] = useState(() => loadState()?.activeId || 1);

  useEffect(() => { saveState(games, activeId); }, [games, activeId]);

  const activeGame = games.find(g => g.id === activeId) || games[0];

  const addGame = () => {
    const g = makeNewGame(nextId++);
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

  const tabLabel = (g) => g.name || (g.teamA && g.teamB ? autoTabName(g.teamA, g.teamB) : `Game ${g.id}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="main-area">
        {activeGame && (
          <GameView
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
              {tabLabel(g)}
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

import { STORAGE_KEY, ROSTER_KEY, TO_STORAGE_KEY, BACKEND } from "./constants";

// ── Roster ──────────────────────────────────────────────────────────────────
export function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]"); } catch { return []; }
}
export function saveRoster(roster) {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); } catch {}
}

// ── Squares ─────────────────────────────────────────────────────────────────
export function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}
export function saveState(games, activeId) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ games, activeId })); } catch {}
}

// ── Timeout ──────────────────────────────────────────────────────────────────
export function loadTOState() {
  try {
    const s = localStorage.getItem(TO_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
export function saveTOState(games, activeId) {
  try { localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games, activeId })); } catch {}
}

// ── Cloud sync ───────────────────────────────────────────────────────────────
export async function pushToCloud(userId) {
  if (!userId) return;
  try {
    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const sq = sqRaw ? JSON.parse(sqRaw) : { games: [] };
    const to = toRaw ? JSON.parse(toRaw) : { games: [] };
    const roster = loadRoster();
    await fetch(`${BACKEND}/userdata/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        squares: sq.games || [],
        timeout: to.games || [],
        roster,
      }),
    });
  } catch {}
}

export async function pullFromCloud(userId) {
  if (!userId) return false;
  try {
    const res = await fetch(`${BACKEND}/userdata/${encodeURIComponent(userId)}`);
    if (!res.ok) return false;
    const { squares, timeout, roster } = await res.json();

    // Merge cloud into local — cloud wins for any game with same id
    const mergeGames = (local, cloud) => {
      if (!Array.isArray(cloud) || cloud.length === 0) return local;
      if (!Array.isArray(local) || local.length === 0) return cloud;
      const cloudMap = Object.fromEntries(cloud.map(g => [g.id, g]));
      const localFiltered = local.filter(g => !cloudMap[g.id]);
      return [...cloud, ...localFiltered];
    };

    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const localSq = sqRaw ? JSON.parse(sqRaw) : { games: [], activeId: null };
    const localTo = toRaw ? JSON.parse(toRaw) : { games: [], activeId: null };

    const mergedSq = mergeGames(localSq.games || [], squares);
    const mergedTo = mergeGames(localTo.games || [], timeout);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ games: mergedSq, activeId: localSq.activeId }));
    localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games: mergedTo, activeId: localTo.activeId }));
    if (Array.isArray(roster) && roster.length > 0) {
      const localRoster = loadRoster();
      const merged = [...new Set([...localRoster, ...roster])];
      localStorage.setItem(ROSTER_KEY, JSON.stringify(merged));
    }
    return true;
  } catch { return false; }
}

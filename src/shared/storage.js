import { STORAGE_KEY, ROSTER_KEY, TO_STORAGE_KEY, BACKEND } from "./constants";

// ── Current userId (set by App on sign-in) ───────────────────────────────────
let _currentUserId = null;
export function setCloudUserId(id) { _currentUserId = id; }

// ── Debounce helper ──────────────────────────────────────────────────────────
let _pushTimer = null;
function schedulePush() {
  if (!_currentUserId) return;
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(() => pushToCloud(_currentUserId), 1500);
}

// ── Roster ───────────────────────────────────────────────────────────────────
export function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]"); } catch { return []; }
}
export function saveRoster(roster) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    schedulePush();
  } catch {}
}

// ── Squares ──────────────────────────────────────────────────────────────────
export function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}
export function saveState(games, activeId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ games, activeId }));
    schedulePush();
  } catch {}
}

// ── Timeout ──────────────────────────────────────────────────────────────────
export function loadTOState() {
  try {
    const s = localStorage.getItem(TO_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
export function saveTOState(games, activeId) {
  try {
    localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games, activeId }));
    schedulePush();
  } catch {}
}

// ── Cloud push ───────────────────────────────────────────────────────────────
export async function pushToCloud(userId) {
  if (!userId) return;
  try {
    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const sq = sqRaw ? JSON.parse(sqRaw) : { games: [] };
    const to = toRaw ? JSON.parse(toRaw) : { games: [] };
    const roster = loadRoster();
    const url = BACKEND + "/userdata/" + encodeURIComponent(userId);
    await fetch(url, {
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

// ── Cloud pull ───────────────────────────────────────────────────────────────
export async function pullFromCloud(userId) {
  if (!userId) return false;
  try {
    const url = BACKEND + "/userdata/" + encodeURIComponent(userId);
    const res = await fetch(url);
    if (!res.ok) return false;
    const { squares, timeout, roster } = await res.json();

    const hasCloudData = (Array.isArray(squares) && squares.length > 0) ||
                         (Array.isArray(timeout) && timeout.length > 0);

    const mergeGames = (local, cloud) => {
      if (!Array.isArray(cloud) || cloud.length === 0) return local;
      if (!Array.isArray(local) || local.length === 0) return cloud;
      const cloudMap = Object.fromEntries(cloud.map(g => [g.id, g]));
      const localOnly = local.filter(g => !cloudMap[g.id]);
      return [...cloud, ...localOnly];
    };

    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const localSq = sqRaw ? JSON.parse(sqRaw) : { games: [], activeId: null };
    const localTo = toRaw ? JSON.parse(toRaw) : { games: [], activeId: null };

    const mergedSq = mergeGames(localSq.games || [], squares || []);
    const mergedTo = mergeGames(localTo.games || [], timeout || []);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ games: mergedSq, activeId: localSq.activeId }));
    localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games: mergedTo, activeId: localTo.activeId }));

    if (Array.isArray(roster) && roster.length > 0) {
      const localRoster = loadRoster();
      const merged = [...new Set([...roster, ...localRoster])];
      localStorage.setItem(ROSTER_KEY, JSON.stringify(merged));
    }

    return hasCloudData || true;
  } catch { return false; }
}

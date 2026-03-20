import { STORAGE_KEY, ROSTER_KEY, TO_STORAGE_KEY, BACKEND } from "./constants";

// ── Current userId (set by App on sign-in) ────────────────────────────────────
let _currentUserId = null;
let _pushTimer = null;
let _initialized = false; // don't push during initial load

export function setCloudUserId(id) {
  _currentUserId = id;
}

export function markInitialized() {
  // Called by App after pullFromCloud completes — enables auto-push
  _initialized = true;
}

function schedulePush() {
  if (!_currentUserId || !_initialized) return;
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(() => pushToCloud(_currentUserId), 2000);
}

// ── Roster ────────────────────────────────────────────────────────────────────
export function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]"); } catch { return []; }
}
export function saveRoster(roster) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    schedulePush();
  } catch {}
}

// ── Squares ───────────────────────────────────────────────────────────────────
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

// ── Timeout ───────────────────────────────────────────────────────────────────
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

// ── Cloud push ────────────────────────────────────────────────────────────────
export async function pushToCloud(userId) {
  if (!userId) return;
  try {
    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const sq = sqRaw ? JSON.parse(sqRaw) : { games: [] };
    const to = toRaw ? JSON.parse(toRaw) : { games: [] };
    const roster = loadRoster();
    await fetch(${BACKEND}/userdata/${encodeURIComponent(userId)}, {
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

// ── Cloud pull ────────────────────────────────────────────────────────────────
export async function pullFromCloud(userId) {
  if (!userId) return false;
  try {
    const res = await fetch(${BACKEND}/userdata/${encodeURIComponent(userId)});
    if (!res.ok) return false;
    const { squares, timeout, roster } = await res.json();

    const mergeGames = (local, cloud) => {
      if (!Array.isArray(cloud) || cloud.length === 0) return local;
      if (!Array.isArray(local) || local.length === 0) return cloud;
      const cloudMap = Object.fromEntries(
        cloud.filter(g => g.id != null).map(g => [g.id, g])
      );
      const localOnly = local.filter(g => g.id != null && !cloudMap[g.id]);
      return [...cloud, ...localOnly];
    };

    const sqRaw = localStorage.getItem(STORAGE_KEY);
    const toRaw = localStorage.getItem(TO_STORAGE_KEY);
    const localSq = sqRaw ? JSON.parse(sqRaw) : { games: [], activeId: null };
    const localTo = toRaw ? JSON.parse(toRaw) : { games: [], activeId: null };

    const mergedSq = mergeGames(localSq.games || [], squares || []);
    const mergedTo = mergeGames(localTo.games || [], timeout || []);

    // Write merged data back — _initialized is still false so no push fires
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ games: mergedSq, activeId: localSq.activeId }));
    localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games: mergedTo, activeId: localTo.activeId }));

    if (Array.isArray(roster) && roster.length > 0) {
      const localRoster = loadRoster();
      const merged = [...new Set([...roster, ...localRoster])];
      localStorage.setItem(ROSTER_KEY, JSON.stringify(merged));
    }

    return true;
  } catch { return false; }
}

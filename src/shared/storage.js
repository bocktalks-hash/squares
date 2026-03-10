import { STORAGE_KEY, ROSTER_KEY, TO_STORAGE_KEY } from "./constants";

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

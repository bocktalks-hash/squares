import { TEAM_ABBR, SPORT_CONFIG } from "./constants";

// ── Array helpers ─────────────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Squares grid helpers ──────────────────────────────────────────────────────
export function randomPairs() {
  const c = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const r = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const colPairs = [[c[0],c[1]], [c[2],c[3]], [c[4],c[5]], [c[6],c[7]], [c[8],c[9]]];
  const rowPairs = [[r[0],r[1]], [r[2],r[3]], [r[4],r[5]], [r[6],r[7]], [r[8],r[9]]];
  return { colPairs, rowPairs };
}

export function getWinner(game, scoreA, scoreB) {
  const dA = scoreA % 10, dB = scoreB % 10;
  const colIdx = (game.colPairs || []).findIndex(pair => pair.includes(dA));
  const rowIdx = (game.rowPairs || []).findIndex(pair => pair.includes(dB));
  if (colIdx === -1 || rowIdx === -1) return null;
  return game.grid[rowIdx][colIdx] || null;
}

export function getPeriodLabel(game, q) {
  return SPORT_CONFIG[game.sport]?.periodLabels[q] || `Q${q}`;
}

export function getTotalPeriods(game) {
  return SPORT_CONFIG[game.sport]?.periods || 4;
}

export function getPayoutPeriods(game) {
  const opts = SPORT_CONFIG[game.sport]?.payoutOptions || [];
  const chosen = opts.find(o => o.key === game.payoutStructure) || opts[0];
  return chosen ? chosen.periods : [getTotalPeriods(game)];
}

export function getPerPeriodPayout(game) {
  const pot = parseFloat(game.totalPot) || 0;
  const periods = getPayoutPeriods(game);
  if (!periods.length) return 0;
  return pot / periods.length;
}

// ── Timeout game helpers ──────────────────────────────────────────────────────
export function calcDigit(scoreA, scoreB) {
  return (scoreA % 10 + scoreB % 10) % 10;
}

// ── Team name helpers ─────────────────────────────────────────────────────────
export function makeAbbr(name) {
  if (!name) return "???";
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(TEAM_ABBR)) {
    if (lower === key || lower.includes(key)) return val;
  }
  const clean = lower.replace(/\b(university|college|of|the|state|at)\b/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  if (words.length === 2) return (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  return words.map(w => w[0]).join("").substring(0, 4).toUpperCase();
}

export function autoTabName(teamA, teamB) {
  if (!teamA && !teamB) return null;
  const a = makeAbbr(teamA), b = makeAbbr(teamB);
  if (teamA && teamB) return `${a} vs ${b}`;
  if (teamA) return a;
  return b;
}

// ── Game factory functions ────────────────────────────────────────────────────
export function makeNewGame(id) {
  const { colPairs, rowPairs } = randomPairs();
  return {
    id, name: "", nameManual: false,
    teamA: "", teamB: "",
    players: [],
    colPairs, rowPairs,
    grid: Array(5).fill(null).map(() => Array(5).fill("")),
    results: [],
    currentQuarter: 1,
    sport: "nba",
    espnGameId: null,
    gameDate: null,
    botQuery: "",
    botRunning: false,
    botIntervalMins: 10,
    botLastPeriodKey: null,
    botLastScore: null,
    botLastGameStatus: null,
    payoutStructure: "quarters",
    totalPot: 0,
    costPerSquare: 0,
    payments: {},
  };
}

export function makeTOGame(id) {
  return {
    id, name: "", nameManual: false,
    teamA: "", teamB: "",
    sport: "ncaab",
    espnGameId: null, gameDate: null,
    players: [],
    assignments: {},
    results: {},
    botRunning: false,
    botLastSlotId: null,
    totalPot: 0,
    payments: {},
  };
}

export function toTabLabel(g) {
  if (g.name) return g.name;
  if (g.teamA && g.teamB) return autoTabName(g.teamA, g.teamB);
  return `Game ${g.id}`;
}

// ── ESPN status helpers ───────────────────────────────────────────────────────
export function mapStatus(s) {
  const n = (s || "").toLowerCase();
  if (n.includes("final")) return "final";
  if (n.includes("half")) return "halftime";
  if (n.includes("progress") || n.includes("live")) return "in progress";
  if (n.includes("end")) return "end of period";
  return "not started";
}

export function getPollingInterval(status) {
  if (status === "final") return 300000;
  if (status === "in progress") return 30000;
  if (status === "halftime" || status === "end of period") return 60000;
  return 120000;
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

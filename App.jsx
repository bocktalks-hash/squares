import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKEND = "https://squares-backend-production.up.railway.app";
const STORAGE_KEY = "squares_app_v2";
const ROSTER_KEY = "squares_roster_v1";

function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]"); } catch { return []; }
}
function saveRoster(roster) {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); } catch {}
}

// Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

// Each axis gets all 10 digits split into 5 pairs of 2, randomized independently.
// Columns and rows are shuffled separately — no fixed pairings ever.
function randomPairs() {
  const c = shuffle([0,1,2,3,4,5,6,7,8,9]);
  const r = shuffle([0,1,2,3,4,5,6,7,8,9]);
  const colPairs = [[c[0],c[1]],[c[2],c[3]],[c[4],c[5]],[c[6],c[7]],[c[8],c[9]]];
  const rowPairs = [[r[0],r[1]],[r[2],r[3]],[r[4],r[5]],[r[6],r[7]],[r[8],r[9]]];
  return { colPairs, rowPairs };
}

const SPORT_CONFIG = {
  nba:   { label:"NBA", path:"basketball/nba", periods:4, periodLabels:{1:"Q1",2:"Q2",3:"Q3",4:"Final"},
    payoutOptions:[
      { key:"quarters", label:"All Quarters (Q1 · Q2 · Q3 · Final)", periods:[1,2,3,4] },
      { key:"halves",   label:"Halves Only (Q2 · Final)",             periods:[2,4]     },
      { key:"final",    label:"Final Only",                           periods:[4]       },
    ]
  },
  ncaab: { label:"NCAA Basketball", path:"basketball/mens-college-basketball", periods:2, periodLabels:{1:"1st Half",2:"Final"},
    payoutOptions:[
      { key:"halves", label:"Both Halves (1st Half · Final)", periods:[1,2] },
      { key:"final",  label:"Final Only",                     periods:[2]   },
    ]
  },
  nfl:   { label:"NFL", path:"football/nfl", periods:4, periodLabels:{1:"Q1",2:"Half",3:"Q3",4:"Final"},
    payoutOptions:[
      { key:"quarters", label:"All Quarters (Q1 · Half · Q3 · Final)", periods:[1,2,3,4] },
      { key:"halves",   label:"Halves Only (Half · Final)",             periods:[2,4]     },
      { key:"final",    label:"Final Only",                             periods:[4]       },
    ]
  },
  ncaaf: { label:"College Football", path:"football/college-football", periods:4, periodLabels:{1:"Q1",2:"Half",3:"Q3",4:"Final"},
    payoutOptions:[
      { key:"quarters", label:"All Quarters (Q1 · Half · Q3 · Final)", periods:[1,2,3,4] },
      { key:"halves",   label:"Halves Only (Half · Final)",             periods:[2,4]     },
      { key:"final",    label:"Final Only",                             periods:[4]       },
    ]
  },
};

const TEAM_ABBR = {
  "lakers":"LAL","celtics":"BOS","warriors":"GSW","bulls":"CHI","heat":"MIA","nets":"BKN",
  "knicks":"NYK","sixers":"PHI","bucks":"MIL","suns":"PHX","nuggets":"DEN","clippers":"LAC",
  "spurs":"SAS","mavs":"DAL","mavericks":"DAL","rockets":"HOU","grizzlies":"MEM","wolves":"MIN",
  "timberwolves":"MIN","thunder":"OKC","jazz":"UTA","trail blazers":"POR","blazers":"POR",
  "kings":"SAC","hawks":"ATL","hornets":"CHA","pistons":"DET","pacers":"IND","cavaliers":"CLE",
  "cavs":"CLE","magic":"ORL","raptors":"TOR","wizards":"WSH",
  "chiefs":"KC","eagles":"PHI","cowboys":"DAL","patriots":"NE","packers":"GB","bears":"CHI",
  "niners":"SF","49ers":"SF","rams":"LAR","ravens":"BAL","broncos":"DEN","steelers":"PIT",
  "bills":"BUF","chargers":"LAC","raiders":"LV","seahawks":"SEA","vikings":"MIN",
  "falcons":"ATL","saints":"NO","buccaneers":"TB","bucs":"TB","cardinals":"ARI",
  "lions":"DET","giants":"NYG","jets":"NYJ","colts":"IND","texans":"HOU","jaguars":"JAX",
  "titans":"TEN","browns":"CLE","bengals":"CIN","dolphins":"MIA","commanders":"WSH",
  "iowa":"IOWA","michigan":"MICH","ohio state":"OSU","alabama":"BAMA","georgia":"UGA",
  "kentucky":"UK","duke":"DUKE","kansas":"KU","north carolina":"UNC","gonzaga":"GONZ",
  "houston":"HOU","tennessee":"TENN","auburn":"AUB","texas":"TEX","ucla":"UCLA",
  "arkansas":"ARK","baylor":"BAY","villanova":"NOVA","connecticut":"UCONN","uconn":"UCONN",
  "creighton":"CRE","marquette":"MARQ","purdue":"PURD","indiana":"IND","illinois":"ILL",
  "michigan state":"MSU","florida":"FLA","lsu":"LSU","texas tech":"TTU","ttu":"TTU",
  "west virginia":"WVU","iowa state":"IAST","oklahoma":"OU","virginia":"UVA",
  "rutgers":"RUTG","penn state":"PSU","stanford":"STAN","arizona":"ARIZ","oregon":"ORE",
  "nebraska":"NEB","wisconsin":"WIS","minnesota":"MINN","northwestern":"NW","ohio":"OHIO",
  "notre dame":"ND","butler":"BUT","xavier":"XAV","dayton":"DAY","cincinnati":"CIN",
  "miami":"MIA","florida state":"FSU","wake forest":"WAKE","duke blue devils":"DUKE",
  "north carolina state":"NCST","nc state":"NCST","syracuse":"SYR","pittsburgh":"PITT",
  "pitt":"PITT","louisville":"LOU","clemson":"CLEM","georgia tech":"GT","virginia tech":"VT",
  "colorado":"COLO","utah":"UTAH","washington":"WASH","california":"CAL","usc":"USC",
  "san diego state":"SDSU","nevada":"NEV","boise state":"BSU","utah state":"USU",
  "new mexico":"UNM","fresno state":"FRES","wyoming":"WYO","air force":"AFA",
  "saint mary":"SMC","st mary":"SMC","memphis":"MEM","wichita state":"WICH",
  "tulsa":"TULSA","east carolina":"ECU","south florida":"USF","temple":"TEM",
  "ole miss":"MISS","mississippi":"MISS","mississippi state":"MSST","vanderbilt":"VAN",
  "south carolina":"SCAR","missouri":"MIZZ","kentucky wildcats":"UK",
};

function makeAbbr(name) {
  if (!name) return "???";
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(TEAM_ABBR)) {
    if (lower === key || lower.includes(key)) return val;
  }
  const clean = lower.replace(/\b(university|college|of|the|state|at)\b/g,"").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0,4).toUpperCase();
  if (words.length === 2) return (words[0].substring(0,2)+words[1].substring(0,2)).toUpperCase();
  return words.map(w=>w[0]).join("").substring(0,4).toUpperCase();
}

function autoTabName(teamA, teamB) {
  if (!teamA && !teamB) return null;
  const a = makeAbbr(teamA), b = makeAbbr(teamB);
  if (teamA && teamB) return `${a} vs ${b}`;
  if (teamA) return a;
  return b;
}

function makeNewGame(id) {
  const { colPairs, rowPairs } = randomPairs();
  return {
    id, name:"", nameManual:false,
    teamA:"", teamB:"",
    players:[],
    colPairs,
    rowPairs,
    grid: Array(5).fill(null).map(()=>Array(5).fill("")),
    results:[],
    currentQuarter:1,
    sport:"nba",
    espnGameId: null,
    gameDate: null,
    botQuery:"",
    botRunning:false,
    botIntervalMins:10,
    botLastPeriodKey:null,
    botLastScore:null,
    botLastGameStatus:null,
    payoutStructure: "quarters", // which periods pay out
    totalPot: 0,                 // total dollar amount in the pot
    costPerSquare: 0,
    payments: {},
  };
}

function getWinner(game, scoreA, scoreB) {
  const dA = scoreA % 10, dB = scoreB % 10;
  const colIdx = (game.colPairs||[]).findIndex(pair => pair.includes(dA));
  const rowIdx = (game.rowPairs||[]).findIndex(pair => pair.includes(dB));
  if (colIdx === -1 || rowIdx === -1) return null;
  return game.grid[rowIdx][colIdx] || null;
}

function getPeriodLabel(game, q) {
  return SPORT_CONFIG[game.sport]?.periodLabels[q] || `Q${q}`;
}
function getTotalPeriods(game) {
  return SPORT_CONFIG[game.sport]?.periods || 4;
}

// Returns the list of period numbers that actually pay out for this game's payout structure
function getPayoutPeriods(game) {
  const opts = SPORT_CONFIG[game.sport]?.payoutOptions || [];
  const chosen = opts.find(o => o.key === game.payoutStructure) || opts[0];
  return chosen ? chosen.periods : [getTotalPeriods(game)];
}

// Dollar amount paid out per winning period
function getPerPeriodPayout(game) {
  const pot = parseFloat(game.totalPot) || 0;
  const periods = getPayoutPeriods(game);
  if (!periods.length) return 0;
  return pot / periods.length;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}
function saveState(games, activeId) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ games, activeId })); } catch {}
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Barlow+Condensed:wght@500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

:root {
  --bg: #080b10;
  --surface: #0f1318;
  --surface2: #161c24;
  --surface3: #1e2736;
  --border: #232d3f;
  --border-bright: #2e3d56;
  --court: #3366CC;
  --court-dim: #1a3266;
  --court-mid: #2a4d99;
  --court-bright: #5585e8;
  --court-glow: rgba(51,102,204,0.15);
  --text: #dde4f0;
  --text-mid: #9aaabf;
  --text-dim: #5a6a7e;
  --win: #22c55e;
  --win-dim: rgba(34,197,94,0.12);
  --win-glow: rgba(34,197,94,0.25);
  --danger: #ef4444;
  --danger-dim: rgba(239,68,68,0.12);
  --warn: #f59e0b;
  --warn-dim: rgba(245,158,11,0.12);
}

html, body, #root {
  height:100%; background:var(--bg); color:var(--text);
  font-family:'DM Sans',sans-serif; overflow:hidden;
  -webkit-font-smoothing:antialiased;
}

/* ── Top Bar ── */
.topbar {
  height:54px; flex-shrink:0;
  background: linear-gradient(180deg, #0d1520 0%, var(--surface) 100%);
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; padding:0 14px; gap:10px;
  position:relative;
}
.topbar::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, var(--court-dim), transparent);
}
.topbar-logo {
  display:flex; align-items:center; gap:9px;
  font-family:'Barlow Condensed',sans-serif; font-size:20px;
  font-weight:700; letter-spacing:2.5px; color:var(--text-mid);
  text-transform:uppercase;
}
.topbar-logo img { height:34px; width:34px; object-fit:contain; border-radius:50%; flex-shrink:0; }
.topbar-logo span { color:#fff; font-weight:700; }

/* ── Mode Switcher ── */
.mode-switcher { display:flex; gap:4px; margin-left:auto; }
.mode-btn {
  padding:5px 12px; border-radius:5px; font-size:11px; font-weight:600;
  cursor:pointer; border:1px solid var(--border); color:var(--text-dim);
  background:transparent; transition:all .15s; letter-spacing:.5px;
  font-family:'DM Sans',sans-serif;
}
.mode-btn:hover { border-color:var(--border-bright); color:var(--text-mid); }
.mode-btn.active {
  background:var(--court); border-color:var(--court);
  color:#fff; box-shadow:0 0 12px rgba(51,102,204,0.35);
}

/* ── Layout ── */
.app-shell { display:flex; flex-direction:column; height:100vh; }
.main-area { flex:1; overflow:hidden; display:flex; flex-direction:column; min-height:0; }
.game-content { flex:1; overflow-y:auto; padding:14px 14px 20px; }
.game-content::-webkit-scrollbar { width:4px; }
.game-content::-webkit-scrollbar-track { background:transparent; }
.game-content::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

/* ── Bottom Game Tabs ── */
.tab-bar {
  display:flex; align-items:stretch; background:var(--surface);
  border-top:1px solid var(--border); flex-shrink:0; min-height:46px;
  position:relative;
}
.tab-bar-scroll {
  flex:1; display:flex; align-items:stretch;
  overflow-x:auto; scrollbar-width:none; min-width:0;
}
.tab-bar-scroll::-webkit-scrollbar { display:none; }
.tab-bar::-webkit-scrollbar { display:none; }
.tab-item {
  flex-shrink:0; padding:0 16px; cursor:pointer; font-size:11px; font-weight:600;
  color:var(--text-dim); border-top:2px solid transparent; white-space:nowrap;
  transition:all .15s; display:flex; align-items:center; gap:6px;
  letter-spacing:.8px; text-transform:uppercase; position:relative;
}
.tab-item:hover { color:var(--text-mid); background:rgba(255,255,255,0.02); }
.tab-item.active { color:var(--court-bright); border-top-color:var(--court); background:rgba(51,102,204,0.06); }
.tab-item .tab-close {
  opacity:0; font-size:13px; color:var(--text-dim);
  transition:opacity .15s; margin-left:2px; line-height:1;
}
.tab-item:hover .tab-close { opacity:1; }
.tab-item .tab-close:hover { color:var(--danger); }
.tab-add {
  flex-shrink:0; width:48px; min-width:48px; cursor:pointer; color:var(--text-dim);
  font-size:20px; display:flex; align-items:center; justify-content:center;
  transition:all .15s; border-left:1px solid var(--border);
  background:var(--surface);
}
.tab-add:hover { color:var(--court-bright); background:rgba(51,102,204,0.06); }

/* ── Inner Tabs ── */
.inner-tabs {
  display:flex; gap:0; border-bottom:1px solid var(--border);
  margin-bottom:14px; flex-shrink:0; overflow-x:auto; scrollbar-width:none;
}
.inner-tabs::-webkit-scrollbar { display:none; }
.inner-tab {
  flex-shrink:0; padding:9px 16px; cursor:pointer; font-size:11px; font-weight:600;
  letter-spacing:.8px; color:var(--text-dim); border-bottom:2px solid transparent;
  text-transform:uppercase; transition:all .15s; white-space:nowrap;
  display:flex; align-items:center; gap:5px;
}
.inner-tab:hover { color:var(--text-mid); }
.inner-tab.active { color:var(--court-bright); border-bottom-color:var(--court); }

/* ── Cards ── */
.card {
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  padding:16px; margin-bottom:12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
}
.card-title {
  font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700;
  letter-spacing:2px; color:var(--court-bright); margin-bottom:12px;
  text-transform:uppercase;
}

/* ── Live Score Card — elevated prominence ── */
.live-score-card {
  background: linear-gradient(160deg, #0d1726 0%, #0a1020 100%);
  border:1px solid var(--court-dim); border-radius:12px;
  padding:16px; margin-bottom:12px;
  box-shadow: 0 0 0 1px rgba(51,102,204,0.1), 0 4px 20px rgba(0,0,0,0.4);
}

/* ── Form Elements ── */
.field { margin-bottom:12px; }
.field label {
  display:block; font-size:10px; font-weight:600; letter-spacing:1px;
  text-transform:uppercase; color:var(--text-dim); margin-bottom:5px;
}
.field input, .field select {
  width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:7px;
  padding:9px 12px; color:var(--text); font-size:14px; font-family:'Inter',sans-serif;
  outline:none; transition:border-color .15s, box-shadow .15s;
}
.field input:focus, .field select:focus {
  border-color:var(--court); box-shadow:0 0 0 3px rgba(51,102,204,0.15);
}
.field select option { background:var(--surface2); }

/* ── Buttons ── */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:9px 16px; border-radius:7px; font-size:13px; font-weight:600;
  cursor:pointer; border:none; transition:all .15s;
  font-family:'Inter',sans-serif; letter-spacing:.2px; white-space:nowrap;
}
.btn-primary { background:var(--court); color:#fff; }
.btn-primary:hover { background:var(--court-bright); box-shadow:0 0 14px rgba(51,102,204,0.4); }
.btn-secondary { background:var(--surface2); color:var(--text-mid); border:1px solid var(--border); }
.btn-secondary:hover { border-color:var(--border-bright); color:var(--text); }
.btn-danger { background:var(--danger-dim); color:#fca5a5; border:1px solid rgba(239,68,68,0.25); }
.btn-danger:hover { background:var(--danger); color:#fff; border-color:var(--danger); }
.btn-win {
  background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08));
  color:var(--win); border:1px solid rgba(34,197,94,0.35);
}
.btn-win:hover { background:var(--win); color:#000; border-color:var(--win); box-shadow:0 0 14px rgba(34,197,94,0.3); }
.btn-sm { padding:6px 11px; font-size:12px; }
.btn-xs { padding:4px 8px; font-size:11px; }
.btn:disabled { opacity:.35; cursor:not-allowed; }

/* ── Player Chips ── */
.player-list { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
.player-chip {
  display:inline-flex; align-items:center; gap:5px; background:var(--surface2);
  border:1px solid var(--border); border-radius:20px; padding:4px 10px; font-size:12px;
  transition:border-color .12s;
}
.player-chip:hover { border-color:var(--border-bright); }
.player-chip .rm { cursor:pointer; color:var(--text-dim); font-size:14px; transition:color .12s; line-height:1; }
.player-chip .rm:hover { color:var(--danger); }

/* ── Grid ── */
.grid-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.sq-grid { border-collapse:collapse; width:100%; table-layout:fixed; }
.sq-grid th, .sq-grid td {
  border:1px solid var(--border); text-align:center; font-size:10px; padding:0;
}
.sq-grid th {
  background:var(--surface2); color:var(--text-dim); font-weight:700;
  padding:5px 2px; letter-spacing:.3px;
}
.col-header {
  font-size:14px; color:var(--court-bright);
  font-family:'Bebas Neue',sans-serif; letter-spacing:1px;
}
.sq-cell {
  height:50px; cursor:pointer; transition:background .12s, color .12s;
  font-size:9px; font-weight:600; color:var(--text-dim);
  overflow:hidden; padding:2px;
  display:table-cell; vertical-align:middle; text-align:center;
  user-select:none; word-break:break-word; line-height:1.2;
}
.sq-cell:hover { background:var(--surface3); color:var(--text); }
.sq-cell.filled { color:var(--text-mid); background:rgba(51,102,204,0.07); }
.sq-cell.filled:hover { background:rgba(51,102,204,0.14); }
.sq-cell.winner-now {
  background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1)) !important;
  color:var(--win) !important;
  box-shadow:inset 0 0 0 2px var(--win);
  font-weight:700; animation:winPulse 2s ease-in-out infinite;
}
.sq-cell.winner-prev {
  background:rgba(34,197,94,0.06) !important;
  color:rgba(34,197,94,0.6) !important;
  box-shadow:inset 0 0 0 1px rgba(34,197,94,0.2);
}
.sq-cell.empty-cell { color:var(--border-bright); font-size:14px; }
.sq-cell.empty-cell:hover { color:var(--court-bright); background:var(--court-glow); }
@keyframes winPulse {
  0%,100% { box-shadow:inset 0 0 0 2px var(--win), 0 0 0 0 rgba(34,197,94,0); background: linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.08)) !important; }
  50% { box-shadow:inset 0 0 0 2px var(--win), 0 0 14px 3px rgba(34,197,94,0.25); background: linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.12)) !important; }
}

/* ── Score Bot ── */
.bot-header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.bot-status { font-size:11px; color:var(--text-dim); flex:1; min-width:0; }
.bot-status.live { color:#f87171; }
.pulse { display:inline-block; width:7px; height:7px; border-radius:50%; background:#f87171; animation:pulse 1.4s ease-in-out infinite; flex-shrink:0; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }

/* ── Score Display ── */
.score-display {
  display:flex; align-items:center; justify-content:center; gap:16px;
  padding:20px 16px 16px;
  background: linear-gradient(160deg, var(--surface2) 0%, #101520 100%);
  border-radius:10px; margin:10px 0; border:1px solid var(--border);
  position:relative; overflow:hidden;
}
.score-display::before {
  content:''; position:absolute; top:0; left:50%; transform:translateX(-50%);
  width:60%; height:1px;
  background: linear-gradient(90deg, transparent, rgba(51,102,204,0.4), transparent);
}
.score-team { text-align:center; flex:1; }
.score-team-name {
  font-size:10px; color:var(--text-dim); font-weight:600;
  letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;
}
.score-num {
  font-family:'Bebas Neue',sans-serif; font-size:62px; line-height:1;
  color:var(--text); letter-spacing:-1px;
}
.score-sep {
  font-family:'Bebas Neue',sans-serif; font-size:28px;
  color:var(--border-bright); flex-shrink:0;
}
.score-detail { text-align:center; font-size:11px; color:var(--text-dim); margin-top:4px; }

/* ── Winner Preview ── */
.winner-preview {
  background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03));
  border:1px solid rgba(34,197,94,0.25); border-radius:10px;
  padding:14px 16px; text-align:center; margin:10px 0;
  position:relative; overflow:hidden;
}
.winner-preview::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent);
}
.winner-preview .label {
  font-size:9px; letter-spacing:1.5px; text-transform:uppercase;
  color:var(--text-dim); margin-bottom:6px; font-weight:600;
}
.winner-preview .digit-eq {
  font-size:11px; color:var(--text-dim); margin-bottom:6px;
}
.winner-preview .name {
  font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:700;
  color:var(--win); letter-spacing:1px; line-height:1;
}

/* ── Score Inputs ── */
.score-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.score-row label {
  font-size:11px; font-weight:600; color:var(--text-dim);
  min-width:52px; letter-spacing:.5px; text-transform:uppercase;
}
.score-stepper { display:flex; align-items:center; }
.score-stepper button {
  background:var(--surface2); border:1px solid var(--border); color:var(--text-mid);
  width:36px; height:36px; cursor:pointer; font-size:18px;
  transition:all .1s; display:flex; align-items:center; justify-content:center;
}
.score-stepper button:hover { background:var(--surface3); color:var(--text); border-color:var(--border-bright); }
.score-stepper button:first-child { border-radius:7px 0 0 7px; }
.score-stepper button:last-child { border-radius:0 7px 7px 0; }
.score-stepper input {
  width:60px; height:36px; background:var(--surface2); border:1px solid var(--border);
  border-left:none; border-right:none; color:var(--text); text-align:center;
  font-size:16px; font-weight:700; outline:none; font-family:'Bebas Neue',sans-serif;
}

/* ── Period Tabs ── */
.period-tabs { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.period-tab {
  padding:7px 16px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer;
  border:1px solid var(--border); color:var(--text-dim); transition:all .15s;
  letter-spacing:.5px; text-transform:uppercase;
}
.period-tab:hover { border-color:var(--border-bright); color:var(--text-mid); }
.period-tab.active { background:var(--court); border-color:var(--court); color:#fff; box-shadow:0 0 10px rgba(51,102,204,0.3); }
.period-tab.locked { background:var(--win-dim); border-color:rgba(34,197,94,0.3); color:var(--win); }

/* ── Results History ── */
.result-row {
  display:flex; align-items:center; gap:10px; padding:11px 0;
  border-bottom:1px solid var(--border); font-size:13px;
}
.result-row:last-child { border-bottom:none; }
.result-period {
  font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700;
  color:var(--court-bright); min-width:52px; letter-spacing:.5px; text-transform:uppercase;
}
.result-score { color:var(--text-dim); font-size:12px; min-width:68px; font-variant-numeric:tabular-nums; }
.result-name { font-weight:700; color:var(--win); flex:1; font-size:14px; }
.result-digits { font-size:10px; color:var(--text-dim); font-variant-numeric:tabular-nums; }

/* ── Empty State ── */
.empty { text-align:center; padding:48px 20px; color:var(--text-dim); }
.empty-icon { font-size:36px; margin-bottom:12px; opacity:.3; }
.empty-text { font-size:13px; line-height:1.6; }

/* ── Toast ── */
.toast-wrap {
  position:fixed; bottom:70px; left:50%; transform:translateX(-50%);
  z-index:1000; pointer-events:none; width:calc(100% - 32px); max-width:380px;
}
.toast {
  background:var(--surface); border:1px solid var(--win);
  border-radius:10px; padding:13px 18px; font-size:13px; font-weight:600; color:var(--text);
  box-shadow:0 4px 30px rgba(0,0,0,.6), 0 0 20px rgba(34,197,94,0.15);
  animation:slideUp .25s cubic-bezier(.34,1.56,.64,1);
  display:flex; align-items:center; gap:10px;
}
@keyframes slideUp {
  from { transform:translateY(16px); opacity:0; }
  to { transform:translateY(0); opacity:1; }
}

/* ── Modal ── */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.75);
  backdrop-filter:blur(4px); z-index:500;
  display:flex; align-items:center; justify-content:center; padding:16px;
  animation:fadeIn .15s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.modal {
  background:var(--surface); border:1px solid var(--border-bright); border-radius:14px;
  padding:20px; width:100%; max-width:320px; max-height:82vh;
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,.7);
  animation:modalIn .2s cubic-bezier(.34,1.2,.64,1);
}
@keyframes modalIn { from{transform:scale(.95);opacity:0} to{transform:scale(1);opacity:1} }
.modal-player-list {
  overflow-y:auto; max-height:320px; margin:0 -4px; padding:0 4px;
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
}
.modal-title {
  font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:700;
  letter-spacing:1.5px; color:var(--court-bright); margin-bottom:14px;
  text-transform:uppercase;
}
.player-option {
  padding:11px 14px; cursor:pointer; border-radius:7px; font-size:13px;
  transition:background .1s; margin-bottom:3px; color:var(--text-mid);
}
.player-option:hover { background:var(--surface2); color:var(--text); }

/* ── Roster picker ── */
.roster-picker {
  border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom:10px;
  max-height:220px; overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
}
.roster-row {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  border-bottom:1px solid var(--border); cursor:pointer; transition:background .1s;
  font-size:13px;
}
.roster-row:last-child { border-bottom:none; }
.roster-row:hover { background:var(--surface2); }
.roster-row.in-game { background:rgba(51,102,204,0.08); }
.roster-check {
  width:17px; height:17px; border-radius:4px; border:2px solid var(--border);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:10px;
  transition:all .12s;
}
.roster-check.checked { background:var(--court); border-color:var(--court); color:#fff; }
.roster-name { flex:1; color:var(--text-mid); }
.roster-del { color:var(--text-dim); font-size:16px; padding:0 4px; opacity:0; transition:opacity .12s; line-height:1; }
.roster-row:hover .roster-del { opacity:1; }
.roster-del:hover { color:var(--danger); }

/* ── Digit assignment display ── */
.digit-assign { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.digit-card {
  background:var(--surface2); border:1px solid var(--border); border-radius:9px;
  padding:10px 12px; min-width:76px; text-align:center; transition:border-color .12s;
}
.digit-card:hover { border-color:var(--border-bright); }
.digit-card .dnum {
  font-family:'Bebas Neue',sans-serif; font-size:32px; color:var(--court-bright);
  line-height:1;
}
.digit-card .dpair { font-size:9px; color:var(--text-dim); margin-bottom:2px; letter-spacing:.5px; }
.digit-card .dname { font-size:11px; font-weight:600; color:var(--text-mid); }

/* ── Game selector ── */
.game-select-list {
  display:flex; flex-direction:column; gap:5px;
  max-height:260px; overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
}
.game-option {
  padding:11px 13px; border:1px solid var(--border); border-radius:8px; cursor:pointer;
  transition:all .12s; font-size:13px; background:var(--surface2);
}
.game-option:hover { border-color:var(--court-dim); background:rgba(51,102,204,0.06); }
.game-option.selected-game { border-color:var(--court); background:rgba(51,102,204,0.1); }
.game-option .go-name { font-weight:600; color:var(--text); font-size:13px; }
.game-option .go-status { font-size:11px; color:var(--text-dim); margin-top:3px; }
.game-option.live .go-status { color:#f87171; }
.game-option .go-badge {
  font-size:9px; font-weight:700; letter-spacing:.8px; padding:2px 6px;
  border-radius:4px; flex-shrink:0;
}
.go-badge.live-badge { background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.2); }
.go-badge.final-badge { background:var(--surface3); color:var(--text-dim); border:1px solid var(--border); }

.row-flex { display:flex; gap:8px; align-items:flex-end; }
.row-flex .field { flex:1; }

.section-label {
  font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-dim);
  margin-bottom:8px; font-weight:600;
}


/* ── Unlock button ── */
.unlock-btn {
  font-size:10px; padding:3px 9px; border-radius:4px; cursor:pointer;
  background:transparent; color:var(--text-dim); border:1px solid var(--border);
  transition:all .15s; font-family:'DM Sans',sans-serif; font-weight:600;
  letter-spacing:.3px;
}
.unlock-btn:hover { color:var(--warn); border-color:var(--warn); background:var(--warn-dim); }

/* ── Section divider ── */
.section-divider {
  height:1px; background:linear-gradient(90deg,transparent,var(--border),transparent);
  margin:16px 0;
}

/* ── Status badge ── */
.status-badge {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:600; letter-spacing:.6px; text-transform:uppercase;
  padding:3px 8px; border-radius:20px;
}
.status-badge.live { background:rgba(248,113,113,0.12); color:#f87171; border:1px solid rgba(248,113,113,0.2); }
.status-badge.final { background:var(--surface3); color:var(--text-dim); border:1px solid var(--border); }
.status-badge.scheduled { background:var(--court-glow); color:var(--court-bright); border:1px solid rgba(51,102,204,0.2); }

/* ── Big winner banner ── */
.winner-banner {
  background: linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.04));
  border:1px solid rgba(34,197,94,0.3); border-radius:12px;
  padding:18px; text-align:center; margin:10px 0; position:relative; overflow:hidden;
}
.winner-banner::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(34,197,94,0.5),transparent);
}
.winner-banner .wb-label { font-size:9px; letter-spacing:1.5px; color:var(--text-dim); text-transform:uppercase; margin-bottom:4px; font-weight:600; }
.winner-banner .wb-eq { font-size:12px; color:var(--text-dim); margin-bottom:8px; }
.winner-banner .wb-name { font-family:'Bebas Neue',sans-serif; font-size:40px; color:var(--win); letter-spacing:2px; line-height:1; }
.winner-banner .wb-sub { font-size:11px; color:var(--text-dim); margin-top:4px; }

/* ── Responsive / Mobile ── */
@media(max-width:480px) {
  .score-num { font-size:48px; }
  .sq-cell { height:44px; font-size:8px; }
  .inner-tab { padding:9px 12px; font-size:10px; }
  .topbar-logo { font-size:17px; }
}
@media(max-width:360px) {
  .sq-cell { height:40px; }
  .score-num { font-size:42px; }
}

/* ── Payment / Payout Panels ── */
.payment-summary { display:flex; gap:8px; flex-wrap:wrap; }
.pay-stat {
  flex:1; min-width:72px; background:var(--surface2); border:1px solid var(--border);
  border-radius:8px; padding:10px 12px; text-align:center;
}
.pay-stat .ps-val { font-family:'Bebas Neue',sans-serif; font-size:22px; color:var(--court-bright); line-height:1; }
.pay-stat .ps-label { font-size:9px; color:var(--text-dim); letter-spacing:.8px; text-transform:uppercase; margin-top:3px; }
.pay-stat.ps-green .ps-val { color:var(--win); }
.pay-stat.ps-warn .ps-val { color:var(--warn); }
.payment-table { width:100%; border-collapse:collapse; }
.payment-table th {
  font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-dim);
  font-weight:600; padding:6px 8px; text-align:left; border-bottom:1px solid var(--border);
}
.payment-table td { padding:9px 8px; border-bottom:1px solid rgba(35,45,63,0.6); font-size:13px; vertical-align:middle; }
.payment-table tr:last-child td { border-bottom:none; }
.payment-table tr:hover td { background:rgba(255,255,255,0.018); }
.paid-toggle {
  display:inline-flex; align-items:center; gap:5px; cursor:pointer;
  font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px;
  border:1px solid; transition:all .15s; user-select:none; white-space:nowrap;
}
.paid-toggle.paid { color:var(--win); border-color:rgba(34,197,94,0.4); background:var(--win-dim); }
.paid-toggle.unpaid { color:var(--text-dim); border-color:var(--border); background:transparent; }
.paid-toggle.paid:hover { background:rgba(34,197,94,0.2); }
.paid-toggle.unpaid:hover { color:var(--text-mid); border-color:var(--border-bright); }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-wrap">
      <div className="toast">🏆 {msg}</div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ game, cell, onAssign, onClear, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Assign Square</div>
        <p style={{fontSize:12,color:"var(--text-dim)",marginBottom:12}}>
          Col {cell[1]+1} · Row {cell[0]+1}
        </p>
        <div className="modal-player-list">
          {game.players.map(p => (
            <div key={p} className="player-option" onClick={() => onAssign(p)}>{p}</div>
          ))}
        </div>
        <div style={{flexShrink:0, marginTop:10}}>
          {game.grid[cell[0]][cell[1]] && (
            <button className="btn btn-danger btn-sm" style={{marginBottom:6,width:"100%"}} onClick={onClear}>
              Clear Square
            </button>
          )}
          <button className="btn btn-secondary btn-sm" style={{width:"100%"}} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Squares Payout Panel ─────────────────────────────────────────────────────
function SquaresPayoutPanel({ game, onUpdate }) {
  const payments = game.payments || {};
  const totalPot = parseFloat(game.totalPot) || 0;
  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);
  const results = game.results || [];  // null guard for games saved before this field existed

  // Count squares per player from the grid
  const squareCounts = {};
  game.grid.flat().forEach(name => {
    if (name) squareCounts[name] = (squareCounts[name] || 0) + 1;
  });

  const allPlayers = Array.from(new Set([...game.players, ...Object.keys(squareCounts)])).sort();
  const totalSquares = game.grid.flat().filter(Boolean).length;

  // How many payout slots each player has won
  const winsByPlayer = {};
  allPlayers.forEach(p => { winsByPlayer[p] = []; });
  results.forEach(r => {
    if (r.winnerName && payoutPeriods.includes(r.quarter)) {
      if (!winsByPlayer[r.winnerName]) winsByPlayer[r.winnerName] = [];
      winsByPlayer[r.winnerName].push(r);
    }
  });

  const togglePaid = (player) => {
    onUpdate({ payments: { ...payments, [player]: !payments[player] } });
  };

  // Per-player: how much they owe (buy-in) vs how much they've won
  const costPerSquare = totalSquares > 0 && totalPot > 0
    ? (totalPot / totalSquares)
    : (parseFloat(game.costPerSquare) || 0);

  const paidInTotal = allPlayers.filter(p => payments[p])
    .reduce((s, p) => s + (squareCounts[p] || 0) * costPerSquare, 0);
  const outstandingTotal = allPlayers.filter(p => !payments[p])
    .reduce((s, p) => s + (squareCounts[p] || 0) * costPerSquare, 0);
  const paidOutTotal = results
    .filter(r => payoutPeriods.includes(r.quarter))
    .reduce((s) => s + perPeriod, 0);

  const periodSplit = payoutPeriods.map(q => ({
    q,
    label: getPeriodLabel(game, q),
    result: results.find(r => r.quarter === q),
    payout: perPeriod,
  }));

  return (
    <div>
      {/* Payout schedule */}
      <div className="card">
        <div className="card-title">💰 Payout Schedule</div>
        {totalPot === 0 ? (
          <div style={{fontSize:13,color:"var(--warn)",background:"var(--warn-dim)",borderRadius:7,padding:"10px 12px",border:"1px solid rgba(245,158,11,0.2)"}}>
            ⚠ Set the Total Pot in Setup → Step 1 to see payout amounts.
          </div>
        ) : (
          <>
            <div className="payment-summary" style={{marginBottom:14}}>
              <div className="pay-stat">
                <div className="ps-val">${totalPot}</div>
                <div className="ps-label">Total Pot</div>
              </div>
              <div className="pay-stat">
                <div className="ps-val">{payoutPeriods.length}</div>
                <div className="ps-label">Payouts</div>
              </div>
              <div className="pay-stat ps-green">
                <div className="ps-val">${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}</div>
                <div className="ps-label">Per Winner</div>
              </div>
              <div className="pay-stat" style={{borderColor: paidOutTotal > 0 ? "rgba(34,197,94,0.25)" : undefined}}>
                <div className="ps-val" style={{color: paidOutTotal > 0 ? "var(--win)" : "var(--text-dim)"}}>
                  ${paidOutTotal % 1 === 0 ? paidOutTotal : paidOutTotal.toFixed(2)}
                </div>
                <div className="ps-label">Paid Out</div>
              </div>
            </div>

            {/* Per-period breakdown */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {periodSplit.map(({ q, label, result, payout }) => (
                <div key={q} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                  background: result ? "rgba(34,197,94,0.07)" : "var(--surface2)",
                  border: `1px solid ${result ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
                  borderRadius:8,
                }}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"var(--court-bright)",minWidth:52,letterSpacing:.5}}>{label}</div>
                  <div style={{flex:1,fontSize:13}}>
                    {result ? (
                      <span style={{fontWeight:700,color:"var(--win)"}}>{result.winnerName || "—"}</span>
                    ) : (
                      <span style={{color:"var(--text-dim)",fontSize:12}}>Not yet locked</span>
                    )}
                    {result && <span style={{fontSize:11,color:"var(--text-dim)",marginLeft:8}}>{result.scoreA}–{result.scoreB}</span>}
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color: result ? "var(--win)" : "var(--text-dim)"}}>
                    ${payout % 1 === 0 ? payout : payout.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Buy-in tracker */}
      <div className="card">
        <div className="card-title">💵 Buy-In Tracker</div>

        {/* Summary */}
        {totalSquares > 0 && costPerSquare > 0 && (
          <div className="payment-summary" style={{marginBottom:14}}>
            <div className="pay-stat">
              <div className="ps-val">{totalSquares}</div>
              <div className="ps-label">Squares Sold</div>
            </div>
            <div className="pay-stat ps-green">
              <div className="ps-val">${paidInTotal % 1 === 0 ? paidInTotal : paidInTotal.toFixed(2)}</div>
              <div className="ps-label">Collected</div>
            </div>
            <div className={`pay-stat ${outstandingTotal > 0 ? "ps-warn" : "ps-green"}`}>
              <div className="ps-val">${outstandingTotal % 1 === 0 ? outstandingTotal : outstandingTotal.toFixed(2)}</div>
              <div className="ps-label">Outstanding</div>
            </div>
          </div>
        )}

        {allPlayers.length === 0 ? (
          <div style={{fontSize:13,color:"var(--text-dim)"}}>No players assigned yet — add players in Setup and auto-assign the grid.</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Player</th>
                <th style={{textAlign:"center"}}>Sq</th>
                {costPerSquare > 0 && <th style={{textAlign:"right"}}>Owes</th>}
                <th style={{textAlign:"right"}}>Winnings</th>
                <th style={{textAlign:"right",paddingRight:14}}>Paid In</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(player => {
                const count = squareCounts[player] || 0;
                const owes = count * costPerSquare;
                const wins = winsByPlayer[player] || [];
                const earned = wins.length * perPeriod;
                const paid = !!payments[player];
                const net = earned - owes;
                return (
                  <tr key={player}>
                    <td style={{fontWeight:600,color:"var(--text)"}}>{player}</td>
                    <td style={{textAlign:"center",color:"var(--court-bright)",fontFamily:"'Bebas Neue',sans-serif",fontSize:16}}>{count}</td>
                    {costPerSquare > 0 && (
                      <td style={{textAlign:"right",color:paid?"var(--text-dim)":"var(--warn)",fontWeight:600}}>
                        ${owes % 1 === 0 ? owes : owes.toFixed(2)}
                      </td>
                    )}
                    <td style={{textAlign:"right",fontWeight:700,color:earned>0?"var(--win)":earned<0?"var(--danger)":"var(--text-dim)"}}>
                      {earned > 0 ? `$${earned % 1 === 0 ? earned : earned.toFixed(2)}` : "—"}
                    </td>
                    <td style={{textAlign:"right",paddingRight:14}}>
                      <span className={`paid-toggle ${paid?"paid":"unpaid"}`} onClick={() => togglePaid(player)}>
                        {paid ? "✓ Paid" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Setup Panel ──────────────────────────────────────────────────────────────
function SetupPanel({ game, onUpdate, onDelete }) {
  const [newPlayer, setNewPlayer] = useState("");
  const [espnGames, setEspnGames] = useState([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState("");
  const [roster, setRoster] = useState(() => loadRoster());
  const dateInputRef = useRef(null);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Pick a date";
    const [y, m, d] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
  };

  const updateRoster = (newRoster) => {
    setRoster(newRoster);
    saveRoster(newRoster);
  };

  // Toggle a roster player in/out of this game
  const togglePlayer = (p) => {
    if (game.players.includes(p)) {
      onUpdate({ players: game.players.filter(x => x !== p) });
    } else {
      onUpdate({ players: [...game.players, p] });
    }
  };

  // Delete from roster entirely
  const deleteFromRoster = (p) => {
    updateRoster(roster.filter(x => x !== p));
    // Also remove from this game if present
    if (game.players.includes(p)) {
      onUpdate({ players: game.players.filter(x => x !== p) });
    }
  };
  // Get today's date in local timezone (avoids UTC shifting the date back)
  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const [selectedDate, setSelectedDate] = useState(todayLocal());

  // Auto-load games whenever sport or date changes
  useEffect(() => {
    loadGames();
  // eslint-disable-next-line
  }, [game.sport, selectedDate]);

  const loadGames = async () => {
    setEspnLoading(true); setEspnError(""); setEspnGames([]);
    try {
      // Build YYYYMMDD from local date string — no UTC conversion ever
      const [y, mo, da] = selectedDate.split("-");
      const dateStr = `${y}${mo}${da}`;
      const sport = SPORT_CONFIG[game.sport].path;
      const res = await fetch(`${BACKEND}/scores?sport=${sport}&dates=${dateStr}`);
      const data = await res.json();
      setEspnGames(data.games || []);
      if (!data.games?.length) setEspnError("No games found for this date.");
    } catch {
      setEspnError("Could not load games. Check your connection.");
    }
    setEspnLoading(false);
  };

  const addPlayer = () => {
    const p = newPlayer.trim();
    if (!p) return;
    // Add to global roster if not already there
    if (!roster.includes(p)) {
      updateRoster([...roster, p]);
    }
    // Add to this game if not already there
    if (!game.players.includes(p)) {
      onUpdate({ players:[...game.players, p] });
    }
    setNewPlayer("");
  };

  const removePlayer = (p) => onUpdate({ players: game.players.filter(x=>x!==p) });

  const randomize = () => {
    if (game.results.length > 0) {
      if (!window.confirm(`⚠️ You have ${game.results.length} locked result(s). Randomizing will change the pairs and make those results invalid. Continue?`)) return;
    }
    const { colPairs, rowPairs } = randomPairs();
    onUpdate({ colPairs, rowPairs });
  };

  const autoAssign = () => {
    if (!game.players.length) return;
    const grid = Array(5).fill(null).map(()=>Array(5).fill(""));
    const slots=[];
    for(let r=0;r<5;r++) for(let c=0;c<5;c++) slots.push([r,c]);
    slots.sort(()=>Math.random()-.5);
    slots.forEach(([r,c],i)=>{ grid[r][c]=game.players[i%game.players.length]; });
    onUpdate({ grid });
  };

  const clearGrid = () => onUpdate({ grid: Array(5).fill(null).map(()=>Array(5).fill("")) });

  const selectGame = (g) => {
    const tabName = autoTabName(g.awayTeam, g.homeTeam) || g.shortName || g.name;
    onUpdate({
      teamA: g.awayTeam,
      teamB: g.homeTeam,
      name: tabName,
      nameManual: false,
      espnGameId: g.id,
      gameDate: selectedDate,   // store the date the game was picked from
      botQuery: g.shortName || g.name,
    });
  };

  const gameSelected = !!(game.teamA && game.teamB);

  return (
    <div>
      {/* ── Step 1: Sport & Date ── */}
      <div className="card">
        <div className="card-title">Step 1 — Pick Sport & Date</div>
        <div className="field">
          <label>Sport</label>
          <select value={game.sport} onChange={e => onUpdate({ sport: e.target.value, teamA:"", teamB:"", name:"", espnGameId:null, payoutStructure: SPORT_CONFIG[e.target.value]?.payoutOptions?.[0]?.key || "quarters" })}>
            {Object.entries(SPORT_CONFIG).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Payout Structure</label>
          <select value={game.payoutStructure || SPORT_CONFIG[game.sport]?.payoutOptions?.[0]?.key}
            onChange={e => onUpdate({ payoutStructure: e.target.value })}>
            {(SPORT_CONFIG[game.sport]?.payoutOptions || []).map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Total Pot ($)</label>
          <div style={{display:"flex",alignItems:"center"}}>
            <span style={{background:"var(--surface3)",border:"1px solid var(--border)",borderRight:"none",
              borderRadius:"7px 0 0 7px",padding:"9px 11px",color:"var(--text-mid)",fontSize:14,fontWeight:600}}>$</span>
            <input type="number" min="0" step="1"
              value={game.totalPot || ""}
              placeholder="0"
              onChange={e => onUpdate({ totalPot: parseFloat(e.target.value) || 0 })}
              style={{flex:1,background:"var(--surface2)",border:"1px solid var(--border)",
                borderRadius:"0 7px 7px 0",padding:"9px 12px",color:"var(--text)",fontSize:14,outline:"none"}} />
          </div>
          {(game.totalPot > 0) && (
            <div style={{fontSize:11,color:"var(--text-dim)",marginTop:5}}>
              {getPayoutPeriods(game).length} payout{getPayoutPeriods(game).length!==1?"s":""} · <span style={{color:"var(--court-bright)",fontWeight:600}}>${getPerPeriodPayout(game) % 1 === 0 ? getPerPeriodPayout(game) : getPerPeriodPayout(game).toFixed(2)}</span> each
            </div>
          )}
        </div>

        <div className="field" style={{marginBottom:0}}>
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            ref={dateInputRef}
            onClick={e => { e.preventDefault(); dateInputRef.current?.showPicker?.(); }}
            style={{
              width:"100%", background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:6, padding:"9px 12px", color:"var(--text)", fontSize:14,
              fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none",
              colorScheme:"dark",
            }}
          />
        </div>
      </div>

      {/* ── Step 2: Pick Game ── */}
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div className="card-title" style={{margin:0}}>Step 2 — Select Game</div>
          <button className="btn btn-secondary btn-sm" onClick={loadGames} disabled={espnLoading}>
            {espnLoading ? "⏳" : "↻ Refresh"}
          </button>
        </div>

        {espnLoading && (
          <div style={{textAlign:"center",padding:"20px 0",color:"var(--text-dim)",fontSize:13}}>
            Loading games from ESPN...
          </div>
        )}
        {espnError && !espnLoading && (
          <p style={{color:"var(--warn)",fontSize:12,textAlign:"center",padding:"8px 0"}}>{espnError}</p>
        )}
        {!espnLoading && espnGames.length > 0 && (
          <div className="game-select-list">
            {espnGames.map(g => {
              const isSelected = game.espnGameId === g.id;
              return (
                <div key={g.id}
                  className={`game-option ${g.inProgress?"live":""} ${isSelected?"selected-game":""}`}
                  onClick={() => selectGame(g)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <div className="go-name">
                      {isSelected && <span style={{color:"var(--court-bright)",marginRight:5}}>✓</span>}
                      {g.awayTeam} vs {g.homeTeam}
                    </div>
                    {g.inProgress && <span className="go-badge live-badge">LIVE</span>}
                    {g.completed && <span className="go-badge final-badge">FINAL</span>}
                  </div>
                  <div className="go-status">
                    {g.inProgress ? `🔴 ${g.awayScore}–${g.homeScore}  ·  ${g.shortDetail||g.status}` : g.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {gameSelected && (
          <div style={{marginTop:12,padding:"10px 14px",background:"rgba(51,102,204,0.08)",border:"1px solid var(--court-dim)",borderRadius:8}}>
            <div style={{fontSize:11,color:"var(--text-dim)",letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>Selected Game</div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>{game.teamA} vs {game.teamB}</div>
            <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Tab: {game.name}</div>
          </div>
        )}
      </div>

      {/* ── Step 3: Numbers (only show after game selected) ── */}
      {gameSelected && (
        <div className="card">
          <div className="card-title">Step 3 — Randomize Numbers</div>
          <p style={{fontSize:12,color:"var(--text-dim)",marginBottom:12}}>
            Each column and row gets 2 random unique digits (0–9), split randomly across the board. Hit Randomize to get a new draw before the game starts.
          </p>
          <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:14,flexWrap:"wrap"}}>
            <div>
              <div className="section-label">Columns ({game.teamA ? makeAbbr(game.teamA) : "Away"})</div>
              <div style={{display:"flex",gap:4}}>
                {(game.colPairs||[]).map((pair,i)=>(
                  <div key={i} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 10px",fontSize:14,fontWeight:700,color:"var(--court-bright)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>
                    {pair[0]}/{pair[1]}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label">Rows ({game.teamB ? makeAbbr(game.teamB) : "Home"})</div>
              <div style={{display:"flex",gap:4}}>
                {(game.rowPairs||[]).map((pair,i)=>(
                  <div key={i} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 10px",fontSize:14,fontWeight:700,color:"var(--court-bright)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>
                    {pair[0]}/{pair[1]}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={randomize}>🔀 Randomize Numbers</button>
        </div>
      )}

      {/* ── Step 4: Players (only show after game selected) ── */}
      {gameSelected && (
        <div className="card">
          <div className="card-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Step 4 — Select Players</span>
            <span style={{fontSize:11,color:"var(--text-dim)",fontWeight:400}}>
              {game.players.length} selected · manage in Players tab
            </span>
          </div>

          {roster.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-dim)",padding:"10px 0"}}>
              No players in your roster yet — go to the <strong style={{color:"var(--court-bright)"}}>Players</strong> tab to add some.
            </div>
          ) : (
            <div className="roster-picker">
              {roster.map(p => {
                const inGame = game.players.includes(p);
                return (
                  <div key={p} className={`roster-row ${inGame ? "in-game" : ""}`} onClick={() => togglePlayer(p)}>
                    <div className={`roster-check ${inGame ? "checked" : ""}`}>{inGame && "✓"}</div>
                    <div className="roster-name">{p}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button className="btn btn-secondary btn-sm" onClick={autoAssign} disabled={!game.players.length}>
              Auto-Assign Grid
            </button>
            <button className="btn btn-secondary btn-sm" onClick={clearGrid}>Clear Grid</button>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <div className="card">
        <div className="card-title" style={{color:"var(--danger)"}}>Danger Zone</div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 End & Delete Game</button>
      </div>
    </div>
  );
}

// ─── Grid Panel ───────────────────────────────────────────────────────────────
function GridPanel({ game, onUpdate }) {
  const [assignCell, setAssignCell] = useState(null);

  const currentWinnerCell = () => {
    const last = game.results[game.results.length-1];
    if (!last) return null;
    const dA=last.scoreA%10, dB=last.scoreB%10;
    const c=(game.colPairs||[]).findIndex(pair=>pair.includes(dA));
    const r=(game.rowPairs||[]).findIndex(pair=>pair.includes(dB));
    return (c>=0&&r>=0)?[r,c]:null;
  };
  const prevWinnerCells = () => {
    return game.results.slice(0,-1).map(res=>{
      const dA=res.scoreA%10, dB=res.scoreB%10;
      const c=(game.colPairs||[]).findIndex(pair=>pair.includes(dA));
      const r=(game.rowPairs||[]).findIndex(pair=>pair.includes(dB));
      return (c>=0&&r>=0)?`${r},${c}`:null;
    }).filter(Boolean);
  };

  const curCell = currentWinnerCell();
  const prevCells = prevWinnerCells();

  const cellClass = (r,c) => {
    if (curCell && curCell[0]===r && curCell[1]===c) return "sq-cell filled winner-now";
    if (prevCells.includes(`${r},${c}`)) return "sq-cell filled winner-prev";
    if (game.grid[r][c]) return "sq-cell filled";
    return "sq-cell empty-cell";
  };

  const assign = (p) => {
    const [r,c]=assignCell;
    const g=game.grid.map(row=>[...row]);
    g[r][c]=p; onUpdate({grid:g}); setAssignCell(null);
  };
  const clear = () => {
    const [r,c]=assignCell;
    const g=game.grid.map(row=>[...row]);
    g[r][c]=""; onUpdate({grid:g}); setAssignCell(null);
  };

  return (
    <div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div className="card-title" style={{margin:0}}>
            {game.teamA||"Team A"} vs {game.teamB||"Team B"}
          </div>
          <div style={{fontSize:11,color:"var(--text-dim)"}}>
            {game.grid.flat().filter(Boolean).length}/25 filled
          </div>
        </div>
        {game.players.length === 0 && (
          <div style={{fontSize:12,color:"var(--warn)",background:"var(--warn-dim)",borderRadius:6,padding:"8px 12px",marginBottom:12,border:"1px solid rgba(245,158,11,0.2)"}}>
            ⚠ No players selected — go to Setup → Step 4 to add players, then use Auto-Assign
          </div>
        )}
        <div className="grid-wrap">
          <table className="sq-grid">
            <thead>
              <tr>
                <th style={{width:38}}>
                  <div style={{fontSize:8,color:"var(--text-dim)",lineHeight:1.3,padding:2}}>
                    <span style={{color:"var(--court-bright)"}}>{game.teamA?makeAbbr(game.teamA):"A"}</span>→<br/>
                    <span style={{color:"var(--text-mid)"}}>{game.teamB?makeAbbr(game.teamB):"B"}</span>↓
                  </div>
                </th>
                {(game.colPairs||[]).map((pair,i)=>(
                  <th key={i}>
                    <div className="col-header">{pair[0]}/{pair[1]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(game.rowPairs||[]).map((pair, rowIdx)=>(
                <tr key={rowIdx}>
                  <th>
                    <div className="col-header">{pair[0]}/{pair[1]}</div>
                  </th>
                  {(game.colPairs||[]).map((_pair, colIdx)=>(
                    <td key={colIdx}
                      className={cellClass(rowIdx,colIdx)}
                      onClick={()=>setAssignCell([rowIdx,colIdx])}>
                      {game.grid[rowIdx][colIdx] || "+"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignCell && (
        <AssignModal game={game} cell={assignCell}
          onAssign={assign} onClear={clear} onClose={()=>setAssignCell(null)} />
      )}
    </div>
  );
}

// ─── Scores Panel ─────────────────────────────────────────────────────────────
function ScoresPanel({ game, onUpdate, onToast, botProps }) {
  const { scoreA, setScoreA, scoreB, setScoreB, botRunning, setBotRunning, botStatus, setBotStatus, botLive, setBotLive, timerRef } = botProps;

  // Only ever cycle through payout periods
  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);
  const periods = getTotalPeriods(game);

  // currentQ tracks which payout period is selected — defaults to first unpaid payout period
  const firstUnlocked = payoutPeriods.find(q => !(game.results||[]).some(r => r.quarter === q)) || payoutPeriods[payoutPeriods.length - 1];
  const [currentQ, setCurrentQ] = useState(firstUnlocked);

  // Keep currentQ pointing at the first still-unlocked payout period as results come in
  useEffect(() => {
    const unlocked = payoutPeriods.find(q => !(game.results||[]).some(r => r.quarter === q));
    if (unlocked && unlocked !== currentQ) setCurrentQ(unlocked);
  // eslint-disable-next-line
  }, [game.results]);

  const getInterval = (status) => {
    if (!status) return 120000;
    if (status==="final") return 300000;
    if (status==="in progress") return 30000;
    if (status==="halftime" || status==="end of period") return 60000;
    return 120000;
  };

  const mapStatus = (s) => {
    const n = (s||"").toLowerCase();
    if (n.includes("final")) return "final";
    if (n.includes("half")) return "halftime";
    if (n.includes("progress")||n.includes("live")) return "in progress";
    if (n.includes("end")) return "end of period";
    return "not started";
  };

  // Map ESPN period/status to which payout-period this is
  const detectPayoutPeriodKey = (espnGame) => {
    const status = mapStatus(espnGame.status);
    const period = espnGame.period || 0;
    // "final" always maps to the last payout period
    if (status === "final") return `payout_${payoutPeriods[payoutPeriods.length - 1]}`;
    // "halftime" maps to the payout period that covers Q2 (for 4-period sports) or Q1 (for 2-period)
    if (status === "halftime") {
      const halfQ = periods === 2 ? 1 : 2;
      if (payoutPeriods.includes(halfQ)) return `payout_${halfQ}`;
      return null; // halftime not a payout period
    }
    // end of period — check if that period number is a payout period
    if (status === "end of period" && payoutPeriods.includes(period)) {
      return `payout_${period}`;
    }
    return null;
  };

  const fetchScores = useCallback(async () => {
    if (!game.teamA && !game.teamB) {
      setBotStatus("Select a game in Setup first"); return;
    }
    try {
      const sport = SPORT_CONFIG[game.sport].path;
      const dateStr = game.gameDate ? game.gameDate.replace(/-/g,"") : "";
      const url = dateStr
        ? `${BACKEND}/scores?sport=${sport}&dates=${dateStr}`
        : `${BACKEND}/scores?sport=${sport}`;
      setBotStatus("Fetching scores…");
      const res = await fetch(url);
      const data = await res.json();
      const games = data.games || [];
      console.log("ESPN returned:", games.map(g => g.id + ":" + g.awayTeam + " vs " + g.homeTeam).join(" | "));
      console.log("Looking for ID:", game.espnGameId);
      let found = game.espnGameId ? games.find(g => g.id === game.espnGameId) : null;
      if (!found) {
        const teamAl = (game.teamA||"").toLowerCase();
        const teamBl = (game.teamB||"").toLowerCase();
        found = games.find(g=>{
          const h=(g.homeTeam||"").toLowerCase();
          const aw=(g.awayTeam||"").toLowerCase();
          return h.includes(teamAl)||h.includes(teamBl)||aw.includes(teamAl)||aw.includes(teamBl);
        });
      }
      if (!found) {
        setBotStatus(`Not found — fetched ${games.length} games for ${dateStr||"today"}.`);
        return;
      }

      const sA=found.awayScore, sB=found.homeScore;
      setScoreA(sA); setScoreB(sB);
      const status = mapStatus(found.status);
      setBotLive(status==="in progress");
      setBotStatus(`${found.shortDetail||found.status} · Updated ${new Date().toLocaleTimeString()}`);

      // Only notify/auto-advance on PAYOUT period endings
      const payoutKey = detectPayoutPeriodKey(found);
      if (payoutKey && payoutKey !== game.botLastPeriodKey) {
        onUpdate({ botLastPeriodKey: payoutKey, botLastScore:{a:sA,b:sB} });
        const winner = getWinner(game, sA, sB);
        // Figure out which payout period this is to label it correctly
        const matchedQ = parseInt(payoutKey.split("_")[1]);
        const ql = getPeriodLabel(game, matchedQ);
        const payoutAmt = perPeriod > 0 ? ` · $${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}` : "";
        onToast(winner
          ? `💰 ${ql}: ${winner} wins!${payoutAmt} (${sA}–${sB})`
          : `${ql} ended: ${sA}–${sB} — no winner`);
        if (Notification.permission==="granted") {
          new Notification(`💰 Squares — ${ql} Final!`, {
            body: winner
              ? `${winner} wins${payoutAmt}! Score: ${sA}–${sB}`
              : `Score: ${sA}–${sB} — no winner assigned`
          });
        }
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) {
        timerRef.current = setTimeout(fetchScores, getInterval(status));
      }
    } catch {
      setBotStatus("Fetch failed — will retry");
      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, 30000);
    }
  // eslint-disable-next-line
  }, [game, botRunning, currentQ, onUpdate, onToast]);

  const startBot = () => {
    Notification.requestPermission();
    setBotRunning(true);
    setBotStatus("Starting...");
  };
  const stopBot = () => {
    setBotRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setBotStatus("Stopped");
    setBotLive(false);
  };

  useEffect(() => {
    if (botRunning) { fetchScores(); }
  // eslint-disable-next-line
  }, [botRunning]);

  const liveWinner = getWinner(game, scoreA, scoreB);
  const lockedPeriods = new Set((game.results||[]).map(r=>r.quarter));

  const lockPeriod = () => {
    if (lockedPeriods.has(currentQ)) return;
    const winner = getWinner(game, scoreA, scoreB);
    const result = { quarter:currentQ, scoreA, scoreB,
      digitA:scoreA%10, digitB:scoreB%10, winnerName:winner||"—" };
    const newResults = [...(game.results||[]), result];
    // Advance to next PAYOUT period, not just +1
    const nextPayoutQ = payoutPeriods.find(q => q > currentQ) || currentQ;
    onUpdate({ results:newResults, currentQuarter:nextPayoutQ });
    setCurrentQ(nextPayoutQ);
    const label = getPeriodLabel(game, currentQ);
    const payoutAmt = perPeriod > 0 ? ` · $${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}` : "";
    onToast(winner ? `${label} locked! ${winner} wins!${payoutAmt} 🏆` : `${label} locked — no winner`);
  };

  const allPayoutsDone = payoutPeriods.every(q => lockedPeriods.has(q));

  return (
    <div>
      {/* Score Bot */}
      <div className="live-score-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div className="card-title" style={{margin:0}}>Score Bot</div>
          {botLive && (
            <span className="status-badge live">
              <span className="pulse"></span> LIVE
            </span>
          )}
          {botStatus?.includes("Final") && (
            <span className="status-badge final">FINAL</span>
          )}
        </div>
        <div className="bot-header">
          {!botRunning ? (
            <button className="btn btn-primary btn-sm" onClick={startBot} disabled={!game.teamA}>▶ Start Bot</button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>
          )}
          {botRunning && (
            <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Refresh</button>
          )}
          <div className={`bot-status ${botLive?"live":""}`} style={{flex:1,fontSize:11}}>
            {botStatus || (game.teamA ? `Ready — ${game.teamA} vs ${game.teamB}` : "Select a game in Setup first")}
          </div>
        </div>

        {(scoreA > 0 || scoreB > 0) ? (
          <div className="score-display" style={{marginTop:12}}>
            <div className="score-team">
              <div className="score-team-name">{game.teamA||"Team A"}</div>
              <div className="score-num">{scoreA}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div className="score-sep">–</div>
              {botStatus && <div style={{fontSize:10,color:"var(--text-dim)",letterSpacing:.5,textAlign:"center",maxWidth:80,lineHeight:1.3}}>{botStatus.split("·")[0].trim()}</div>}
            </div>
            <div className="score-team">
              <div className="score-team-name">{game.teamB||"Team B"}</div>
              <div className="score-num">{scoreB}</div>
            </div>
          </div>
        ) : botRunning ? (
          <div style={{textAlign:"center",padding:"16px",color:"var(--text-dim)",fontSize:12,marginTop:8}}>
            <div style={{fontSize:28,marginBottom:6}}>⏳</div>
            Waiting for game to start…
          </div>
        ) : null}
      </div>

      {/* Lock a Period — only shows payout periods */}
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div className="card-title" style={{margin:0}}>
            {payoutPeriods.length < periods ? "Lock a Payout Period" : "Lock a Period"}
          </div>
          {perPeriod > 0 && (
            <span style={{fontSize:11,color:"var(--win)",fontWeight:700,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:.5}}>
              ${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)} / win
            </span>
          )}
        </div>

        {/* Only payout period tabs */}
        <div className="period-tabs">
          {payoutPeriods.map(q => (
            <div key={q}
              className={`period-tab ${q===currentQ?"active":""} ${lockedPeriods.has(q)?"locked":""}`}
              onClick={() => setCurrentQ(q)}>
              {getPeriodLabel(game, q)}
              {lockedPeriods.has(q) ? " ✓" : ""}
            </div>
          ))}
        </div>

        {/* Show context if non-payout periods exist */}
        {payoutPeriods.length < periods && (
          <div style={{fontSize:11,color:"var(--text-dim)",marginBottom:12,padding:"6px 10px",background:"var(--surface2)",borderRadius:6,border:"1px solid var(--border)"}}>
            Tracking: <span style={{color:"var(--court-bright)",fontWeight:600}}>
              {payoutPeriods.map(q => getPeriodLabel(game, q)).join(" · ")}
            </span>
            {" "}— other periods don't pay out
          </div>
        )}

        <div className="score-row">
          <label>{makeAbbr(game.teamA)||"A"}</label>
          <div className="score-stepper">
            <button onClick={()=>setScoreA(s=>Math.max(0,s-1))}>−</button>
            <input type="number" value={scoreA} onChange={e=>setScoreA(parseInt(e.target.value)||0)} />
            <button onClick={()=>setScoreA(s=>s+1)}>+</button>
          </div>
        </div>
        <div className="score-row">
          <label>{makeAbbr(game.teamB)||"B"}</label>
          <div className="score-stepper">
            <button onClick={()=>setScoreB(s=>Math.max(0,s-1))}>−</button>
            <input type="number" value={scoreB} onChange={e=>setScoreB(parseInt(e.target.value)||0)} />
            <button onClick={()=>setScoreB(s=>s+1)}>+</button>
          </div>
        </div>

        {liveWinner ? (
          <div className="winner-banner">
            <div className="wb-label">
              {lockedPeriods.has(currentQ) ? `${getPeriodLabel(game,currentQ)} Winner` : "Winner if locked now"}
            </div>
            <div className="wb-eq">…{scoreA%10} + …{scoreB%10} = <strong style={{color:"var(--court-bright)",fontSize:14}}>{(scoreA+scoreB)%10}</strong></div>
            <div className="wb-name">🏆 {liveWinner}</div>
            {perPeriod > 0 && (
              <div style={{fontSize:11,color:"var(--win)",marginTop:4,fontWeight:600}}>
                ${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)} payout
              </div>
            )}
          </div>
        ) : (
          <div style={{textAlign:"center",padding:"14px 0",color:"var(--text-dim)",fontSize:13,background:"var(--surface2)",borderRadius:8,margin:"8px 0"}}>
            …{scoreA%10} + …{scoreB%10} = <strong style={{color:"var(--court-bright)"}}>{(scoreA+scoreB)%10}</strong>
            <div style={{fontSize:11,marginTop:4,color:"var(--text-dim)"}}>No matching square assigned for digit {(scoreA+scoreB)%10}</div>
          </div>
        )}

        {allPayoutsDone ? (
          <div style={{textAlign:"center",padding:"12px",background:"var(--win-dim)",borderRadius:8,marginTop:10,border:"1px solid rgba(34,197,94,0.3)",color:"var(--win)",fontWeight:700,fontSize:13}}>
            🏁 All payout periods locked!
          </div>
        ) : (
          <button className="btn btn-win" style={{width:"100%",marginTop:10,padding:"12px",fontSize:14}}
            onClick={lockPeriod} disabled={lockedPeriods.has(currentQ)}>
            {lockedPeriods.has(currentQ) ? `✓ ${getPeriodLabel(game,currentQ)} Already Locked` : `🔒 Lock ${getPeriodLabel(game,currentQ)}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ game, onUpdate }) {
  const results = game.results || [];
  if (!results.length) return (
    <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No results locked yet.<br/>Lock a period in the Scores tab.</div></div>
  );

  const unlockPeriod = (quarter) => {
    onUpdate({ results: results.filter(r => r.quarter !== quarter) });
  };

  const payoutPeriods = getPayoutPeriods(game);
  const perPeriod = getPerPeriodPayout(game);

  return (
    <div className="card">
      <div className="card-title">Results History</div>
      {results.map((r,i)=>{
        const isPayout = payoutPeriods.includes(r.quarter);
        return (
          <div key={i} className="result-row">
            <div className="result-period">
              {getPeriodLabel(game,r.quarter)}
              {perPeriod > 0 && isPayout && (
                <span style={{fontSize:9,color:"var(--court-bright)",marginLeft:4,fontWeight:700}}>$</span>
              )}
            </div>
            <div className="result-score">{r.scoreA}–{r.scoreB}</div>
            <div className="result-name" style={{color: isPayout ? "var(--win)" : "var(--text-mid)"}}>
              {r.winnerName}
              {perPeriod > 0 && isPayout && (
                <span style={{fontSize:11,color:"var(--court-bright)",marginLeft:6,fontWeight:600}}>
                  +${perPeriod % 1 === 0 ? perPeriod : perPeriod.toFixed(2)}
                </span>
              )}
            </div>
            <div className="result-digits" style={{marginRight:8}}>…{r.digitA}+…{r.digitB}={(r.digitA+r.digitB)%10}</div>
            <button className="unlock-btn" onClick={() => unlockPeriod(r.quarter)} title="Unlock to re-enter">↩ Unlock</button>
          </div>
        );
      })}
      <div style={{fontSize:11,color:"var(--text-dim)",marginTop:12,padding:"8px 0",borderTop:"1px solid var(--border)"}}>
        Tap Unlock to correct a result — this removes the lock so you can re-enter the score.
      </div>
    </div>
  );
}

// ─── Game View ────────────────────────────────────────────────────────────────
function GameView({ game, onUpdate, onToast, onDelete }) {
  const [tab, setTab] = useState("setup");

  // ── Bot & score state lifted up so it survives tab switches ──
  const [scoreA, setScoreA]       = useState(0);
  const [scoreB, setScoreB]       = useState(0);
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus]   = useState("");
  const [botLive, setBotLive]       = useState(false);
  const timerRef = useRef(null);
  // Stop bot if game is deleted or component unmounts
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const botProps = { scoreA, setScoreA, scoreB, setScoreB, botRunning, setBotRunning, botStatus, setBotStatus, botLive, setBotLive, timerRef };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div className="inner-tabs">
        {[
          {id:"setup",   label:"Setup",   icon:"⚙"},
          {id:"grid",    label:"Grid",    icon:"⬜"},
          {id:"scores",  label:"Live",    icon:"📡"},
          {id:"players", label:"Players", icon:"👥"},
          {id:"payout",  label:"Payout",  icon:"💰"},
          {id:"history", label:"History", icon:"📋"},
        ].map(t=>(
          <div key={t.id} className={`inner-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            <span style={{fontSize:13}}>{t.icon}</span> {t.label}
            {t.id==="scores" && botRunning && <span style={{marginLeft:4,color:"var(--win)",fontSize:9}}>●</span>}
          </div>
        ))}
      </div>
      <div className="game-content">
        {tab==="setup"   && <SetupPanel game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab==="grid"    && <GridPanel game={game} onUpdate={onUpdate} />}
        {tab==="scores"  && <ScoresPanel game={game} onUpdate={onUpdate} onToast={onToast} botProps={botProps} />}
        {tab==="players" && <PlayersPanel />}
        {tab==="payout"  && <SquaresPayoutPanel game={game} onUpdate={onUpdate} />}
        {tab==="history" && <HistoryPanel game={game} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}


// ─── Players Panel ────────────────────────────────────────────────────────────
function PlayersPanel() {
  const [roster, setRoster] = useState(() => loadRoster());
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const inputRef = useRef(null);

  const updateRoster = (r) => { setRoster(r); saveRoster(r); };

  const addNew = () => {
    const n = newName.trim();
    if (!n || roster.includes(n)) { setNewName(""); return; }
    updateRoster([...roster, n]);
    setNewName("");
    inputRef.current?.focus();
  };

  const deletePlayer = (p) => updateRoster(roster.filter(x => x !== p));

  const filtered = roster.filter(p =>
    search.trim() === "" || p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{padding:"0 4px"}}>
      <div className="card">
        <div className="card-title">Player Roster</div>
        <p style={{fontSize:12,color:"var(--text-dim)",marginBottom:14}}>
          Your saved players are available across all games — squares, timeout game, everything.
          Add or remove players here.
        </p>

        {/* Add new */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input
            ref={inputRef}
            style={{flex:1,background:"var(--surface2)",border:"1px solid var(--court)",borderRadius:6,
              padding:"8px 12px",color:"var(--text)",outline:"none",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}
            placeholder="Add new player..."
            value={newName}
            onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addNew()} />
          <button className="btn btn-primary" onClick={addNew}>Add</button>
        </div>

        {/* Search */}
        {roster.length > 6 && (
          <div style={{marginBottom:10}}>
            <input
              style={{width:"100%",boxSizing:"border-box",background:"var(--surface2)",
                border:"1px solid var(--border)",borderRadius:6,padding:"7px 12px",
                color:"var(--text)",outline:"none",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}
              placeholder={`Search ${roster.length} players...`}
              value={search}
              onChange={e=>setSearch(e.target.value)} />
          </div>
        )}

        {/* Roster list */}
        {filtered.length === 0 && search ? (
          <div style={{fontSize:13,color:"var(--text-dim)",padding:"10px 0"}}>No players match "{search}"</div>
        ) : filtered.length === 0 ? (
          <div style={{fontSize:13,color:"var(--text-dim)",padding:"10px 0"}}>No players yet — add some above!</div>
        ) : (
          <div className="roster-picker">
            {filtered.map(p => {
              const idx = search ? p.toLowerCase().indexOf(search.toLowerCase()) : -1;
              return (
                <div key={p} className="roster-row" style={{cursor:"default"}}>
                  <div className="roster-name" style={{flex:1}}>
                    {idx >= 0 ? (
                      <>
                        {p.slice(0, idx)}
                        <span style={{color:"var(--court-bright)",fontWeight:700}}>{p.slice(idx, idx+search.length)}</span>
                        {p.slice(idx+search.length)}
                      </>
                    ) : p}
                  </div>
                  <div className="roster-del"
                    style={{opacity:1,cursor:"pointer",fontSize:18,padding:"0 6px",color:"var(--text-dim)"}}
                    onClick={()=>deletePlayer(p)}>×</div>
                </div>
              );
            })}
          </div>
        )}

        {roster.length > 0 && (
          <div style={{fontSize:11,color:"var(--text-dim)",marginTop:10}}>
            {roster.length} player{roster.length!==1?"s":""} in roster
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
let nextId = 1;

export default function App() {
  const [games, setGames] = useState(() => {
    const saved = loadState();
    if (saved?.games?.length) {
      nextId = Math.max(...saved.games.map(g=>g.id)) + 1;
      return saved.games;
    }
    return [makeNewGame(nextId++)];
  });
  const [activeId, setActiveId] = useState(() => {
    const saved = loadState();
    return saved?.activeId || 1;
  });
  const [toast, setToast] = useState(null);

  useEffect(() => { saveState(games, activeId); }, [games, activeId]);

  const activeGame = games.find(g=>g.id===activeId) || games[0];

  const addGame = () => {
    const g = makeNewGame(nextId++);
    setGames(prev=>[...prev, g]);
    setActiveId(g.id);
  };

  const removeGame = (id) => {
    if (games.length===1) return;
    const remaining = games.filter(g=>g.id!==id);
    setGames(remaining);
    if (activeId===id) setActiveId(remaining[0].id);
  };

  const updateGame = (id, patch) => {
    setGames(prev=>prev.map(g=>g.id===id ? {...g,...patch} : g));
  };

  const tabLabel = (g) => g.name || (g.teamA && g.teamB ? autoTabName(g.teamA,g.teamB) : `Game ${g.id}`);

  const [mode, setMode] = useState("squares"); // "squares" | "timeout"

  return (
    <>
      <style>{css + `
        /* ── Mode switcher ── */
        .mode-switcher { display:flex; gap:2px; background:var(--surface2); border-radius:8px; padding:3px; margin-left:auto; }
        .mode-btn {
          padding:5px 14px; border-radius:6px; font-size:11px; font-weight:700; letter-spacing:.6px;
          text-transform:uppercase; cursor:pointer; transition:all .15s; color:var(--text-dim); border:none;
          background:transparent; font-family:'DM Sans',sans-serif;
        }
        .mode-btn.active { background:var(--court); color:#fff; }
        .mode-btn:hover:not(.active) { color:var(--text); }

        /* ── Roster picker ── */
        .roster-picker { display:flex; flex-direction:column; gap:4px; max-height:280px; overflow-y:auto;
          scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
        .roster-row { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:6px;
          cursor:pointer; transition:background .12s; border:1px solid transparent; }
        .roster-row:hover { background:var(--surface2); }
        .roster-row.in-game { border-color:var(--court-dim); background:rgba(51,102,204,0.06); }
        .roster-check { width:18px; height:18px; border-radius:4px; border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700;
          flex-shrink:0; color:var(--court-bright); }
        .roster-check.checked { background:var(--court); border-color:var(--court); color:#fff; }
        .roster-name { font-size:13px; font-weight:500; }

        /* ── TO topbar subtitle ── */
        .topbar-subtitle { font-size:11px; color:var(--text-dim); letter-spacing:.8px; text-transform:uppercase; margin-left:2px; margin-top:2px; }
      `}</style>
      <div className="app-shell">
        {/* Top Bar */}
        <div className="topbar">
          <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
            <div className="topbar-logo">
              <img src="/logo.svg" alt="Bock Talks logo" />
              Bock Talks <span>{mode === "squares" ? "Squares" : "Timeout"}</span>
            </div>
          </div>
          {/* Mode Switcher */}
          <div className="mode-switcher">
            <button className={`mode-btn ${mode==="squares"?"active":""}`} onClick={() => setMode("squares")}>⬛ Squares</button>
            <button className={`mode-btn ${mode==="timeout"?"active":""}`} onClick={() => setMode("timeout")}>⏱ Timeout</button>
          </div>
        </div>

        {/* Squares mode */}
        <div style={{display: mode === "squares" ? "contents" : "none"}}>
          <div className="main-area">
            {activeGame && (
              <GameView
                key={activeGame.id}
                game={activeGame}
                onUpdate={patch=>updateGame(activeGame.id, patch)}
                onToast={msg=>setToast(msg)}
                onDelete={()=>removeGame(activeGame.id)}
              />
            )}
          </div>
          <div className="tab-bar">
            <div className="tab-bar-scroll">
              {games.map(g=>(
                <div key={g.id} className={`tab-item ${g.id===activeId?"active":""}`} onClick={()=>setActiveId(g.id)}>
                  {tabLabel(g)}
                  {games.length>1 && (
                    <span className="tab-close" onClick={e=>{e.stopPropagation();removeGame(g.id);}}>×</span>
                  )}
                </div>
              ))}
            </div>
            <div className="tab-add" onClick={addGame} title="Add game">＋</div>
          </div>
        </div>

        {/* Timeout mode — always mounted so bots keep running when switching modes */}
        <div style={{display: mode === "timeout" ? "contents" : "none"}}>
          <TimeoutApp onToast={msg=>setToast(msg)} />
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUT GAME
// ═══════════════════════════════════════════════════════════════════════════════

const TO_STORAGE_KEY = "timeout_app_v1";
const TIMEOUT_SLOTS = [
  { id:"h1_16", half:1, label:"16:00", shortLabel:"1H·16" },
  { id:"h1_12", half:1, label:"12:00", shortLabel:"1H·12" },
  { id:"h1_8",  half:1, label:"8:00",  shortLabel:"1H·8"  },
  { id:"h1_4",  half:1, label:"4:00",  shortLabel:"1H·4"  },
  { id:"h1_0",  half:1, label:"Half",  shortLabel:"Half"  },
  { id:"h2_16", half:2, label:"16:00", shortLabel:"2H·16" },
  { id:"h2_12", half:2, label:"12:00", shortLabel:"2H·12" },
  { id:"h2_8",  half:2, label:"8:00",  shortLabel:"2H·8"  },
  { id:"h2_4",  half:2, label:"4:00",  shortLabel:"2H·4"  },
  { id:"h2_0",  half:2, label:"Final", shortLabel:"Final" },
];

function loadTOState() {
  try { const s = localStorage.getItem(TO_STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveTOState(games, activeId) {
  try { localStorage.setItem(TO_STORAGE_KEY, JSON.stringify({ games, activeId })); } catch {}
}

function makeTOGame(id) {
  return {
    id, name: "", nameManual: false,
    teamA: "", teamB: "",
    sport: "ncaab",
    espnGameId: null, gameDate: null,
    players: [],       // max 10, each gets a digit 0-9
    assignments: {},   // digit (0-9) -> player name
    results: {},       // slotId -> { scoreA, scoreB, digit, winner, locked, paid }
    botRunning: false,
    botLastSlotId: null,
    totalPot: 0,       // total pot across all slots
    payments: {},      // playerName -> bool (paid buy-in)
  };
}

function toTabLabel(g) {
  if (g.name) return g.name;
  if (g.teamA && g.teamB) return autoTabName(g.teamA, g.teamB);
  return `Game ${g.id}`;
}

function calcDigit(scoreA, scoreB) {
  return (scoreA % 10 + scoreB % 10) % 10;
}

// ─── Timeout Payout Panel ─────────────────────────────────────────────────────
function TOPayoutPanel({ game, onUpdate }) {
  const totalPot = parseFloat(game.totalPot) || 0;
  const perSlot = totalPot > 0 ? totalPot / TIMEOUT_SLOTS.length : 0;
  const payments = game.payments || {};
  const allPlayers = [...game.players].sort();

  const togglePaid = (player) => {
    onUpdate({ payments: { ...payments, [player]: !payments[player] } });
  };

  // Win counts per player
  const winsByPlayer = {};
  allPlayers.forEach(p => { winsByPlayer[p] = []; });
  Object.entries(game.results).forEach(([slotId, r]) => {
    if (r.locked && r.winner) {
      if (!winsByPlayer[r.winner]) winsByPlayer[r.winner] = [];
      winsByPlayer[r.winner].push(slotId);
    }
  });

  const lockedSlots = Object.values(game.results).filter(r => r.locked);
  const paidOutSoFar = lockedSlots.length * perSlot;
  const paidInCount = allPlayers.filter(p => payments[p]).length;
  const outstandingCount = allPlayers.length - paidInCount;

  // Buy-in per player = total pot / number of players
  const buyInPerPlayer = allPlayers.length > 0 && totalPot > 0
    ? totalPot / allPlayers.length : 0;

  return (
    <div>
      {/* Pot summary */}
      <div className="card">
        <div className="card-title">💰 Payout Schedule</div>
        {totalPot === 0 ? (
          <div style={{fontSize:13,color:"var(--warn)",background:"var(--warn-dim)",borderRadius:7,padding:"10px 12px",border:"1px solid rgba(245,158,11,0.2)"}}>
            ⚠ Set the Total Pot in Setup → Step 1 to see payout amounts.
          </div>
        ) : (
          <>
            <div className="payment-summary" style={{marginBottom:14}}>
              <div className="pay-stat">
                <div className="ps-val">${totalPot}</div>
                <div className="ps-label">Total Pot</div>
              </div>
              <div className="pay-stat">
                <div className="ps-val">${perSlot % 1 === 0 ? perSlot : perSlot.toFixed(2)}</div>
                <div className="ps-label">Per Slot</div>
              </div>
              <div className="pay-stat ps-green">
                <div className="ps-val">${paidOutSoFar % 1 === 0 ? paidOutSoFar : paidOutSoFar.toFixed(2)}</div>
                <div className="ps-label">Paid Out</div>
              </div>
              <div className="pay-stat ps-warn">
                <div className="ps-val">${((totalPot - paidOutSoFar) % 1 === 0) ? totalPot - paidOutSoFar : (totalPot - paidOutSoFar).toFixed(2)}</div>
                <div className="ps-label">Remaining</div>
              </div>
            </div>

            {/* Slot-by-slot breakdown */}
            {[1,2].map(half => (
              <div key={half} style={{marginBottom:10}}>
                <div style={{fontSize:10,letterSpacing:1.2,textTransform:"uppercase",color:"var(--text-dim)",fontWeight:600,marginBottom:6}}>
                  {half === 1 ? "First Half" : "Second Half"}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {TIMEOUT_SLOTS.filter(s => s.half === half).map(slot => {
                    const res = game.results[slot.id];
                    const locked = res?.locked;
                    return (
                      <div key={slot.id} style={{
                        display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                        background: locked ? "rgba(34,197,94,0.07)" : "var(--surface2)",
                        border: `1px solid ${locked ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
                        borderRadius:7,
                      }}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"var(--court-bright)",minWidth:44,letterSpacing:.5}}>{slot.label}</div>
                        <div style={{flex:1,fontSize:12}}>
                          {locked
                            ? <span style={{fontWeight:700,color:"var(--win)"}}>{res.winner || "—"}</span>
                            : <span style={{color:"var(--text-dim)",fontStyle:"italic"}}>Pending</span>}
                          {locked && <span style={{fontSize:11,color:"var(--text-dim)",marginLeft:6}}>{res.scoreA}–{res.scoreB}</span>}
                        </div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:locked?"var(--win)":"var(--text-dim)"}}>
                          ${perSlot % 1 === 0 ? perSlot : perSlot.toFixed(2)}
                        </div>
                        {locked && (
                          <div onClick={() => {
                            const cur = game.results[slot.id] || {};
                            onUpdate({ results: { ...game.results, [slot.id]: { ...cur, paid: !cur.paid } } });
                          }}
                            style={{cursor:"pointer",fontSize:10,fontWeight:600,
                              color:res.paid?"var(--win)":"var(--text-dim)",
                              border:"1px solid",borderColor:res.paid?"rgba(34,197,94,0.4)":"var(--border)",
                              borderRadius:20,padding:"2px 8px",userSelect:"none",background:res.paid?"var(--win-dim)":"transparent",transition:"all .15s"}}>
                            {res.paid ? "✓" : "Pay"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Buy-in tracker */}
      <div className="card">
        <div className="card-title">💵 Buy-In Tracker</div>
        {buyInPerPlayer > 0 && (
          <div className="payment-summary" style={{marginBottom:14}}>
            <div className="pay-stat">
              <div className="ps-val">${buyInPerPlayer % 1 === 0 ? buyInPerPlayer : buyInPerPlayer.toFixed(2)}</div>
              <div className="ps-label">Per Player</div>
            </div>
            <div className="pay-stat ps-green">
              <div className="ps-val">{paidInCount}</div>
              <div className="ps-label">Paid In</div>
            </div>
            <div className={`pay-stat ${outstandingCount > 0 ? "ps-warn" : "ps-green"}`}>
              <div className="ps-val">{outstandingCount}</div>
              <div className="ps-label">Outstanding</div>
            </div>
          </div>
        )}

        {allPlayers.length === 0 ? (
          <div style={{fontSize:13,color:"var(--text-dim)"}}>No players yet — add them in Setup and randomize digits.</div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Player</th>
                <th style={{textAlign:"center"}}>Digit</th>
                <th style={{textAlign:"center"}}>Wins</th>
                {totalPot > 0 && <th style={{textAlign:"right"}}>Earned</th>}
                {buyInPerPlayer > 0 && <th style={{textAlign:"right"}}>Net</th>}
                <th style={{textAlign:"right",paddingRight:14}}>Buy-In</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(player => {
                const digit = Object.entries(game.assignments).find(([,p])=>p===player)?.[0] ?? "—";
                const wins = (winsByPlayer[player] || []).length;
                const earned = wins * perSlot;
                const net = earned - buyInPerPlayer;
                const paid = !!payments[player];
                return (
                  <tr key={player}>
                    <td style={{fontWeight:600,color:"var(--text)"}}>{player}</td>
                    <td style={{textAlign:"center",color:"var(--court-bright)",fontFamily:"'Bebas Neue',sans-serif",fontSize:18}}>{digit}</td>
                    <td style={{textAlign:"center",fontWeight:700,color:wins>0?"var(--win)":"var(--text-dim)"}}>{wins}</td>
                    {totalPot > 0 && (
                      <td style={{textAlign:"right",fontWeight:700,color:earned>0?"var(--win)":"var(--text-dim)"}}>
                        {earned > 0 ? `$${earned % 1 === 0 ? earned : earned.toFixed(2)}` : "—"}
                      </td>
                    )}
                    {buyInPerPlayer > 0 && (
                      <td style={{textAlign:"right",fontWeight:700,
                        color: net > 0 ? "var(--win)" : net < 0 ? "var(--danger)" : "var(--text-dim)"}}>
                        {net > 0 ? `+$${net % 1 === 0 ? net : net.toFixed(2)}`
                          : net < 0 ? `-$${Math.abs(net) % 1 === 0 ? Math.abs(net) : Math.abs(net).toFixed(2)}`
                          : "$0"}
                      </td>
                    )}
                    <td style={{textAlign:"right",paddingRight:14}}>
                      <span className={`paid-toggle ${paid?"paid":"unpaid"}`} onClick={() => togglePaid(player)}>
                        {paid ? "✓ Paid" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Timeout Setup Panel ──────────────────────────────────────────────────────
function TOSetupPanel({ game, onUpdate, onDelete }) {
  const [espnGames, setEspnGames]   = useState([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError]   = useState("");
  // Live roster — stays in sync with the Players tab
  const [roster, setRoster] = useState(() => loadRoster());
  useEffect(() => {
    const onStorage = () => setRoster(loadRoster());
    window.addEventListener("storage", onStorage);
    const interval = setInterval(() => setRoster(loadRoster()), 2000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(interval); };
  }, []);

  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const [selectedDate, setSelectedDate] = useState(() => game.gameDate || todayLocal());
  const dateInputRef = useRef(null);

  useEffect(() => { loadGames(); }, [game.sport, selectedDate]);

  const loadGames = async () => {
    setEspnLoading(true); setEspnError(""); setEspnGames([]);
    try {
      const dateStr = selectedDate.replace(/-/g, "");
      const path = SPORT_CONFIG[game.sport]?.path || "basketball/mens-college-basketball";
      const res = await fetch(`${BACKEND}/scores?sport=${path}&dates=${dateStr}`);
      const data = await res.json();
      setEspnGames(data.games || []);
    } catch { setEspnError("Could not load games."); }
    setEspnLoading(false);
  };

  const selectGame = (g) => {
    const auto = autoTabName(g.awayTeam, g.homeTeam);
    onUpdate({ teamA: g.awayTeam, teamB: g.homeTeam, espnGameId: g.id, gameDate: selectedDate,
      name: game.nameManual ? game.name : (auto || game.name) });
    setEspnGames([]);
  };

  const togglePlayer = (p) => {
    const cur = game.players;
    if (cur.includes(p)) {
      // remove — also clear their assignment
      const newAssign = { ...game.assignments };
      Object.keys(newAssign).forEach(d => { if (newAssign[d] === p) delete newAssign[d]; });
      onUpdate({ players: cur.filter(x => x !== p), assignments: newAssign });
    } else {
      if (cur.length >= 10) return; // max 10
      onUpdate({ players: [...cur, p] });
    }
  };

  const randomizeAssignments = () => {
    if (game.players.length === 0) return;
    const digits = shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0, game.players.length);
    const assign = {};
    game.players.forEach((p, i) => { assign[digits[i]] = p; });
    onUpdate({ assignments: assign });
  };

  const assigned = Object.entries(game.assignments).sort((a,b) => a[0]-b[0]);
  const gameSelected = !!(game.teamA && game.teamB);

  return (
    <div>
      {/* Step 1: Sport */}
      <div className="card">
        <div className="card-title">Step 1 — Pick Sport & Date</div>
        <div className="field">
          <label>Sport</label>
          <select value={game.sport} onChange={e => onUpdate({ sport: e.target.value, teamA:"", teamB:"", espnGameId:null })}>
            <option value="ncaab">NCAA Basketball</option>
            <option value="nba">NBA</option>
          </select>
        </div>
        <div className="field">
          <label>Total Pot ($) — split evenly across 10 slots</label>
          <div style={{display:"flex",alignItems:"center"}}>
            <span style={{background:"var(--surface3)",border:"1px solid var(--border)",borderRight:"none",
              borderRadius:"7px 0 0 7px",padding:"9px 11px",color:"var(--text-mid)",fontSize:14,fontWeight:600}}>$</span>
            <input type="number" min="0" step="1"
              value={game.totalPot || ""}
              placeholder="0"
              onChange={e => onUpdate({ totalPot: parseFloat(e.target.value) || 0 })}
              style={{flex:1,background:"var(--surface2)",border:"1px solid var(--border)",
                borderRadius:"0 7px 7px 0",padding:"9px 12px",color:"var(--text)",fontSize:14,outline:"none"}} />
          </div>
          {(game.totalPot > 0) && (
            <div style={{fontSize:11,color:"var(--text-dim)",marginTop:5}}>
              10 slots · <span style={{color:"var(--court-bright)",fontWeight:600}}>${(game.totalPot / 10) % 1 === 0 ? game.totalPot / 10 : (game.totalPot / 10).toFixed(2)}</span> per slot win
            </div>
          )}
        </div>
        <div className="field">
          <label>Date</label>
          <input ref={dateInputRef} type="date" value={selectedDate}
            style={{colorScheme:"dark"}}
            onClick={() => dateInputRef.current?.showPicker?.()}
            onChange={e => { setSelectedDate(e.target.value); onUpdate({ gameDate: e.target.value }); }} />
        </div>
      </div>

      {/* Step 2: Pick Game */}
      <div className="card">
        <div className="card-title">Step 2 — Select Game</div>
        {espnLoading && <div style={{fontSize:12,color:"var(--text-dim)"}}>Loading ESPN games…</div>}
        {espnError && <div style={{fontSize:12,color:"var(--danger)"}}>{espnError}</div>}
        {espnGames.length > 0 && (
          <div className="game-select-list">
            {espnGames.map(g => {
              const isSel = game.espnGameId === g.id;
              return (
                <div key={g.id} className={`game-option ${g.inProgress?"live":""}`} onClick={() => selectGame(g)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div className="go-name">
                      {isSel && <span style={{color:"var(--court-bright)",marginRight:5}}>✓</span>}
                      {g.awayTeam} vs {g.homeTeam}
                    </div>
                    {g.inProgress && <span style={{fontSize:10,color:"#f87171",fontWeight:700}}>LIVE</span>}
                  </div>
                  <div className="go-status">{g.inProgress ? `🔴 ${g.awayScore}–${g.homeScore}  ·  ${g.shortDetail||g.status}` : g.status}</div>
                </div>
              );
            })}
          </div>
        )}
        {gameSelected && (
          <div style={{marginTop:12,padding:"10px 14px",background:"rgba(51,102,204,0.08)",border:"1px solid var(--court-dim)",borderRadius:8}}>
            <div style={{fontSize:11,color:"var(--text-dim)",letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>Selected</div>
            <div style={{fontWeight:700,fontSize:15}}>{game.teamA} vs {game.teamB}</div>
          </div>
        )}
      </div>

      {/* Step 3: Players (max 10) */}
      {gameSelected && (
        <div className="card">
          <div className="card-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Step 3 — Select Players</span>
            <span style={{fontSize:11,color:"var(--text-dim)",fontWeight:400}}>
              {game.players.length}/10 selected
            </span>
          </div>
          {roster.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-dim)"}}>No roster yet — go to the Players tab to add some.</div>
          ) : (
            <div className="roster-picker">
              {roster.map(p => {
                const inGame = game.players.includes(p);
                const atMax = game.players.length >= 10 && !inGame;
                return (
                  <div key={p} className={`roster-row ${inGame?"in-game":""} ${atMax?"":""}` }
                    style={{opacity: atMax ? 0.4 : 1, cursor: atMax ? "not-allowed" : "pointer"}}
                    onClick={() => !atMax && togglePlayer(p)}>
                    <div className={`roster-check ${inGame?"checked":""}`}>{inGame && "✓"}</div>
                    <div className="roster-name">{p}</div>
                  </div>
                );
              })}
            </div>
          )}
          {game.players.length > 0 && (
            <div style={{fontSize:11,color:"var(--text-dim)",marginTop:8}}>
              {game.players.length} player{game.players.length!==1?"s":""} — {10-game.players.length} slot{10-game.players.length!==1?"s":""} remaining
            </div>
          )}
        </div>
      )}

      {/* Step 4: Randomize digits */}
      {game.players.length > 0 && (
        <div className="card">
          <div className="card-title">Step 4 — Assign Digits</div>
          <p style={{fontSize:12,color:"var(--text-dim)",marginBottom:12}}>
            Each player gets one unique digit 0–9. At each TV timeout: last digit of Team A score + last digit of Team B score = winning digit.
          </p>
          <button className="btn btn-primary" style={{marginBottom:14}} onClick={randomizeAssignments}>
            🔀 Randomize Digits
          </button>
          {assigned.length > 0 && (
            <div className="digit-assign">
              {assigned.map(([digit, player]) => (
                <div key={digit} className="digit-card">
                  <div className="dnum">{digit}</div>
                  <div className="dname">{player}</div>
                </div>
              ))}
            </div>
          )}
          {assigned.length === 0 && game.players.length > 0 && (
            <div style={{fontSize:12,color:"var(--text-dim)"}}>Hit Randomize to assign digits</div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{color:"var(--danger)"}}>Danger Zone</div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 End & Delete Game</button>
      </div>
    </div>
  );
}

// ─── Timeout Board Panel ──────────────────────────────────────────────────────
function TOBoardPanel({ game, onUpdate, onToast }) {
  const winCounts = {};
  game.players.forEach(p => { winCounts[p] = 0; });
  Object.values(game.results).forEach(r => {
    if (r.locked && r.winner) winCounts[r.winner] = (winCounts[r.winner] || 0) + 1;
  });

  const togglePaid = (slotId) => {
    const cur = game.results[slotId] || {};
    onUpdate({ results: { ...game.results, [slotId]: { ...cur, paid: !cur.paid } } });
  };

  return (
    <div>
      {/* Timeout slots */}
      {[1, 2].map(half => (
        <div key={half} className="card">
          <div className="card-title">{half === 1 ? "First Half" : "Second Half"}</div>
          {TIMEOUT_SLOTS.filter(s => s.half === half).map(slot => {
            const res = game.results[slot.id];
            const locked = res?.locked;
            return (
              <div key={slot.id} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 0",
                borderBottom:"1px solid var(--border)"
              }}>
                {/* Slot label */}
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif", fontSize:15,
                  color: locked ? "var(--court-bright)" : "var(--text-dim)",
                  minWidth:60, letterSpacing:.5
                }}>{slot.label}</div>

                {locked ? (
                  <>
                    <div style={{fontSize:12,color:"var(--text-dim)",minWidth:56,fontVariantNumeric:"tabular-nums"}}>
                      {res.scoreA}–{res.scoreB}
                    </div>
                    <div style={{fontSize:11,color:"var(--text-dim)",minWidth:52}}>
                      …{res.scoreA%10}+…{res.scoreB%10}={res.digit}
                    </div>
                    <div style={{flex:1,fontWeight:700,color:"var(--win)",fontSize:13}}>
                      {res.winner || <span style={{color:"var(--text-dim)"}}>—</span>}
                    </div>
                    <div onClick={() => togglePaid(slot.id)}
                      style={{cursor:"pointer",fontSize:11,
                        color:res.paid?"var(--win)":"var(--text-dim)",
                        border:"1px solid",borderColor:res.paid?"var(--win)":"var(--border)",
                        borderRadius:4,padding:"2px 8px",userSelect:"none",flexShrink:0,
                        background:res.paid?"var(--win-dim)":"transparent",transition:"all .15s"}}>
                      {res.paid ? "✓ Paid" : "Unpaid"}
                    </div>
                    <button className="unlock-btn" style={{marginLeft:4}}
                      onClick={() => {
                        const updated = { ...game.results };
                        delete updated[slot.id];
                        onUpdate({ results: updated });
                        onToast(`↩ ${slot.label} unlocked`);
                      }}
                      title="Unlock to correct">↩</button>
                  </>
                ) : res?.pending ? (
                  // Bot found this TV timeout — show score + projected winner, ready to lock
                  <>
                    <div style={{fontSize:12,color:"var(--court-bright)",minWidth:60,fontWeight:600}}>
                      {res.scoreA}–{res.scoreB}
                    </div>
                    <div style={{fontSize:11,color:"var(--text-dim)",minWidth:52}}>
                      …{res.scoreA%10}+…{res.scoreB%10}={res.digit}
                    </div>
                    <div style={{flex:1,fontWeight:600,color:"var(--court-bright)",fontSize:12}}>
                      {res.winner || `Digit ${res.digit}`}
                    </div>
                    <button
                      onClick={() => {
                        const digit = calcDigit(res.scoreA, res.scoreB);
                        const winner = game.assignments[digit] || null;
                        const updated = { ...game.results,
                          [slot.id]: { ...res, digit, winner, locked: true, paid: false, pending: false }
                        };
                        onUpdate({ results: updated });
                        onToast(winner ? `🔒 ${slot.label} locked — ${winner} wins!` : `🔒 ${slot.label} locked — digit ${digit}`);
                      }}
                      style={{
                        background:"var(--court-dim)",color:"#fff",border:"none",
                        borderRadius:5,padding:"3px 10px",fontSize:11,cursor:"pointer",
                        fontWeight:600,flexShrink:0
                      }}>
                      🔒 Lock
                    </button>
                  </>
                ) : (
                  <div style={{fontSize:12,color:"var(--text-dim)",fontStyle:"italic",flex:1}}>
                    Pending…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Leaderboard */}
      {game.players.length > 0 && (
        <div className="card">
          <div className="card-title">Leaderboard</div>
          {Object.entries(winCounts)
            .sort((a,b) => b[1]-a[1])
            .map(([player, wins], idx) => {
              const digit = Object.entries(game.assignments).find(([,p])=>p===player)?.[0];
              const isLeader = wins > 0 && idx === 0;
              return (
                <div key={player} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 0",
                  borderBottom:"1px solid var(--border)",
                  background: isLeader ? "rgba(34,197,94,0.04)" : "transparent",
                  margin: isLeader ? "0 -16px" : undefined, padding: isLeader ? "10px 16px" : "10px 0"
                }}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"var(--court-bright)",minWidth:28,textAlign:"center"}}>{digit ?? "?"}</div>
                  <div style={{flex:1,fontWeight:600,color: isLeader ? "var(--text)" : "var(--text-mid)"}}>{player}</div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:18,
                    color:wins>0?"var(--win)":"var(--text-dim)",
                    display:"flex",alignItems:"center",gap:4
                  }}>
                    {isLeader && wins > 0 && <span style={{fontSize:14}}>🏆</span>}
                    {wins} <span style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>win{wins!==1?"s":""}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Timeout Live Panel ───────────────────────────────────────────────────────
function TOLivePanel({ game, onUpdate, onToast, botProps }) {
  const { botRunning, setBotRunning, botStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores } = botProps;
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [challenging, setChallenging] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);

  // Determine next unlocked slot
  const nextSlot = TIMEOUT_SLOTS.find(s => !game.results[s.id]?.locked);

  useEffect(() => {
    if (nextSlot && !activeSlotId) setActiveSlotId(nextSlot.id);
  }, []);

  const liveDigit = calcDigit(scoreA, scoreB);
  const liveWinner = game.assignments[liveDigit] || null;

  const lockSlot = (slotId, sA, sB) => {
    const digit = calcDigit(sA, sB);
    const winner = game.assignments[digit] || null;
    const updated = {
      ...game.results,
      [slotId]: { scoreA: sA, scoreB: sB, digit, winner, locked: true, paid: false, pending: false }
    };
    onUpdate({ results: updated });
    const slot = TIMEOUT_SLOTS.find(s => s.id === slotId);
    onToast(winner ? `🔒 ${slot?.label} locked — ${winner} wins!` : `🔒 ${slot?.label} locked — digit ${digit}, no player`);
    const remaining = TIMEOUT_SLOTS.find(s => s.id !== slotId && !game.results[s.id]?.locked);
    if (remaining) setActiveSlotId(remaining.id);
  };

  // Challenge — fetch ESPN play-by-play and find the TV timeout matching the SELECTED slot
  const challenge = async () => {
    if (!game.espnGameId) { setChallengeResult({ error: "No ESPN game linked — select a game in Setup first." }); return; }
    setChallenging(true); setChallengeResult(null);
    try {
      const path = SPORT_CONFIG[game.sport]?.path || "basketball/mens-college-basketball";
      const res = await fetch(`${BACKEND}/playbyplay?gameId=${game.espnGameId}&sport=${path}`);
      const data = await res.json();
      const plays = data.plays || [];
      const tvPlays = plays.filter(p => (p.text||"").toLowerCase().includes("official tv timeout"));
      if (tvPlays.length === 0) {
        setChallengeResult({ notYet: true, error: "No Official TV Timeout found yet — game may not have started." });
      } else {
        const h1 = tvPlays.filter(p => p.period === 1);
        const h2 = tvPlays.filter(p => p.period === 2);
        const h1Slots = ["h1_16","h1_12","h1_8","h1_4","h1_0"];
        const h2Slots = ["h2_16","h2_12","h2_8","h2_4","h2_0"];
        const slotMap = {};
        h1.forEach((p,i) => { if (i < h1Slots.length) slotMap[h1Slots[i]] = p; });
        h2.forEach((p,i) => { if (i < h2Slots.length) slotMap[h2Slots[i]] = p; });

        const matchedPlay = activeSlotId ? slotMap[activeSlotId] : null;
        const slotLabel = activeSlotId ? TIMEOUT_SLOTS.find(s=>s.id===activeSlotId)?.label : "?";

        if (!matchedPlay) {
          // Slot hasn't happened yet — show as a waiting state, don't auto-fill scores
          setChallengeResult({
            notYet: true,
            error: `Timeout at ${slotLabel} hasn't happened yet — bot will auto-detect it when it occurs.`
          });
        } else {
          const { awayScore, homeScore, clock, period, text } = matchedPlay;
          // Validate scores look reasonable before auto-filling
          const validScores = typeof awayScore === "number" && typeof homeScore === "number"
            && awayScore >= 0 && homeScore >= 0;
          setChallengeResult({ awayScore, homeScore, clock, period, text });
          if (validScores) { setScoreA(awayScore); setScoreB(homeScore); }
        }
      }
    } catch {
      setChallengeResult({ error: "Could not fetch play-by-play. Try again." });
    }
    setChallenging(false);
  };

  const startBot = () => { Notification.requestPermission(); setBotRunning(true); };
  const stopBot  = () => { setBotRunning(false); };

  const activeSlot = TIMEOUT_SLOTS.find(s => s.id === activeSlotId);

  return (
    <div>
      {/* Live Score Bot */}
      <div className="live-score-card">
        <div className="card-title">Live Score Bot</div>
        <div className="bot-header">
          {!botRunning
            ? <button className="btn btn-primary btn-sm" onClick={startBot}>▶ Start Bot</button>
            : <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>}
          {botRunning && <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Now</button>}
          <div className={`bot-status ${botLive?"live":""}`}>
            {botLive && <span className="pulse" style={{marginRight:4}}></span>}
            {botStatus || (game.teamA ? `Tracking ${game.teamA} vs ${game.teamB}` : "Select a game in Setup")}
          </div>
        </div>
        <div className="score-display" style={{marginTop:12}}>
          <div className="score-team">
            <div className="score-team-name">{game.teamA||"Team A"}</div>
            <div className="score-num">{scoreA}</div>
          </div>
          <div className="score-sep">–</div>
          <div className="score-team">
            <div className="score-team-name">{game.teamB||"Team B"}</div>
            <div className="score-num">{scoreB}</div>
          </div>
        </div>

        {/* Live projected winner */}
        <div className="winner-banner">
          <div className="wb-label">Live projected winner</div>
          <div className="wb-eq">…{scoreA%10} + …{scoreB%10} = <strong style={{color:"var(--court-bright)",fontSize:14}}>{liveDigit}</strong></div>
          <div className="wb-name" style={{fontSize: liveWinner ? 38 : 24, color: liveWinner ? "var(--win)" : "var(--text-dim)"}}>
            {liveWinner ? `🏆 ${liveWinner}` : `Digit ${liveDigit} — unassigned`}
          </div>
        </div>
      </div>

      {/* Manual Score Entry + Lock */}
      <div className="card">
        <div className="card-title">Lock a Timeout</div>

        {/* Slot selector */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {TIMEOUT_SLOTS.map(slot => {
            const locked = game.results[slot.id]?.locked;
            return (
              <div key={slot.id}
                className={`period-tab ${slot.id===activeSlotId?"active":""} ${locked?"locked":""}`}
                onClick={() => !locked && setActiveSlotId(slot.id)}>
                {slot.shortLabel} {locked && "✓"}
              </div>
            );
          })}
        </div>

        {activeSlot && !game.results[activeSlot.id]?.locked && (
          <>
            <div style={{fontSize:12,color:"var(--text-dim)",marginBottom:10}}>
              Locking: <strong style={{color:"var(--text)"}}>{activeSlot.label}</strong>
            </div>
            <div className="score-row">
              <label>{makeAbbr(game.teamA)||"A"}</label>
              <div className="score-stepper">
                <button onClick={() => setScoreA(s => Math.max(0,s-1))}>−</button>
                <input type="number" value={scoreA} onChange={e => setScoreA(parseInt(e.target.value)||0)} />
                <button onClick={() => setScoreA(s => s+1)}>+</button>
              </div>
            </div>
            <div className="score-row">
              <label>{makeAbbr(game.teamB)||"B"}</label>
              <div className="score-stepper">
                <button onClick={() => setScoreB(s => Math.max(0,s-1))}>−</button>
                <input type="number" value={scoreB} onChange={e => setScoreB(parseInt(e.target.value)||0)} />
                <button onClick={() => setScoreB(s => s+1)}>+</button>
              </div>
            </div>

            <div className="winner-banner" style={{margin:"10px 0"}}>
              <div className="wb-label">Winner if locked now</div>
              <div className="wb-eq">…{scoreA%10} + …{scoreB%10} = <strong style={{color:"var(--court-bright)",fontSize:14}}>{calcDigit(scoreA,scoreB)}</strong></div>
              <div className="wb-name" style={{fontSize: game.assignments[calcDigit(scoreA,scoreB)] ? 34 : 20, color: game.assignments[calcDigit(scoreA,scoreB)] ? "var(--win)" : "var(--text-dim)"}}>
                {game.assignments[calcDigit(scoreA,scoreB)] ? `🏆 ${game.assignments[calcDigit(scoreA,scoreB)]}` : `Digit ${calcDigit(scoreA,scoreB)} — unassigned`}
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-win" style={{flex:1}}
                onClick={() => lockSlot(activeSlot.id, scoreA, scoreB)}>
                🔒 Lock {activeSlot.label}
              </button>
              <button className="btn btn-secondary" onClick={challenge} disabled={challenging}
                title="Re-fetch ESPN play-by-play to verify the official TV timeout score">
                {challenging ? "⏳" : "⚠️ Challenge"}
              </button>
            </div>

            {/* Challenge result */}
            {challengeResult && (
              <div style={{
                marginTop:10, padding:"10px 14px", borderRadius:8,
                background: challengeResult.notYet
                  ? "rgba(255,165,0,0.08)"
                  : challengeResult.error
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(51,102,204,0.08)",
                border: `1px solid ${challengeResult.notYet ? "orange" : challengeResult.error ? "var(--danger)" : "var(--court-dim)"}`,
                fontSize:12
              }}>
                {challengeResult.error && !challengeResult.notYet ? (
                  <div style={{color:"var(--danger)"}}>{challengeResult.error}</div>
                ) : challengeResult.notYet ? (
                  <div style={{color:"orange"}}>
                    ⏳ {challengeResult.error}
                  </div>
                ) : (
                  <>
                    <div style={{fontWeight:700,marginBottom:4,color:"var(--court-bright)"}}>
                      ⚠️ Official TV Timeout — ESPN Verified
                    </div>
                    <div style={{color:"var(--text)"}}>
                      <strong>{game.teamA}</strong> {challengeResult.awayScore} – {challengeResult.homeScore} <strong>{game.teamB}</strong>
                    </div>
                    {challengeResult.clock && (
                      <div style={{color:"var(--text-dim)",marginTop:3}}>
                        {challengeResult.period ? `Period ${challengeResult.period} · ` : ""}{challengeResult.clock}
                      </div>
                    )}
                    <div style={{color:"var(--text-dim)",marginTop:3,fontStyle:"italic"}}>{challengeResult.text}</div>
                    <div style={{marginTop:6,color:"var(--win)",fontSize:11}}>✓ Scores auto-filled above</div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {activeSlot && game.results[activeSlot.id]?.locked && (
          <div style={{fontSize:13,color:"var(--win)",textAlign:"center",padding:"10px 0"}}>
            ✓ {activeSlot.label} is locked
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeout Game View ────────────────────────────────────────────────────────
// Bot state lives HERE so it persists when switching between setup/board/live/players tabs
function TOGameView({ game, onUpdate, onToast, onDelete }) {
  const [tab, setTab] = useState("setup");

  // ── Bot state lifted up so it survives tab switches ──
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus]   = useState("");
  const [botLive, setBotLive]       = useState(false);
  const [scoreA, setScoreA]         = useState(0);
  const [scoreB, setScoreB]         = useState(0);
  const timerRef     = useRef(null);
  const lastNotified = useRef(null);
  const gameRef      = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const mapStatus = (s) => {
    const n = (s||"").toLowerCase();
    if (n.includes("final")) return "final";
    if (n.includes("half")) return "halftime";
    if (n.includes("progress")||n.includes("live")) return "in progress";
    if (n.includes("end")) return "end of period";
    return "not started";
  };
  const getInterval = (status) => {
    if (status === "final") return 300000;
    if (status === "in progress") return 30000;
    if (status === "halftime" || status === "end of period") return 60000;
    return 120000;
  };
  const mapTvTimeoutsToSlots = (tvPlays) => {
    const h1 = tvPlays.filter(p => p.period === 1);
    const h2 = tvPlays.filter(p => p.period === 2);
    const h1Slots = ["h1_16","h1_12","h1_8","h1_4","h1_0"];
    const h2Slots = ["h2_16","h2_12","h2_8","h2_4","h2_0"];
    const mapped = {};
    h1.forEach((p,i) => { if (i < h1Slots.length) mapped[h1Slots[i]] = p; });
    h2.forEach((p,i) => { if (i < h2Slots.length) mapped[h2Slots[i]] = p; });
    return mapped;
  };

  const fetchScores = useCallback(async () => {
    const g = gameRef.current;
    if (!g.teamA && !g.teamB) { setBotStatus("Set teams in Setup first"); return; }
    try {
      const path = SPORT_CONFIG[g.sport]?.path || "basketball/mens-college-basketball";
      const dateStr = g.gameDate ? g.gameDate.replace(/-/g,"") : "";
      const res = await fetch(`${BACKEND}/scores?sport=${path}${dateStr?`&dates=${dateStr}`:""}`);
      const data = await res.json();
      const games = data.games || [];
      let found = g.espnGameId ? games.find(x => x.id === g.espnGameId) : null;
      if (!found) {
        const tA=(g.teamA||"").toLowerCase(), tB=(g.teamB||"").toLowerCase();
        found = games.find(x => {
          const h=(x.homeTeam||"").toLowerCase(), aw=(x.awayTeam||"").toLowerCase();
          return h.includes(tA)||h.includes(tB)||aw.includes(tA)||aw.includes(tB);
        });
      }
      if (!found) { setBotStatus("Game not found on ESPN"); return; }

      const sA = found.awayScore, sB = found.homeScore;
      setScoreA(sA); setScoreB(sB);
      const status = mapStatus(found.status);
      setBotLive(status === "in progress" || status === "halftime");
      setBotStatus(`${found.shortDetail||found.status} · Updated ${new Date().toLocaleTimeString()}`);

      if (g.espnGameId) {
        try {
          const pbpRes = await fetch(`${BACKEND}/playbyplay?gameId=${g.espnGameId}&sport=${path}`);
          const pbpData = await pbpRes.json();
          // Only keep TV timeout plays that have valid numeric scores
          const tvPlays = (pbpData.plays||[]).filter(p=>
            (p.text||"").toLowerCase().includes("official tv timeout") &&
            typeof p.homeScore === "number" && typeof p.awayScore === "number" &&
            p.homeScore >= 0 && p.awayScore >= 0
          );

          const updatedResults = { ...g.results };
          let changed = false;

          // ── TV Timeout slots (h1_16 … h2_4) ──
          if (tvPlays.length > 0) {
            const slotMap = mapTvTimeoutsToSlots(tvPlays);
            Object.entries(slotMap).forEach(([slotId, play]) => {
              if (!updatedResults[slotId]?.locked) {
                const tvA = play.awayScore ?? sA, tvB = play.homeScore ?? sB;
                const digit = calcDigit(tvA, tvB);
                updatedResults[slotId] = {
                  scoreA:tvA, scoreB:tvB, digit,
                  winner: g.assignments[digit]||null,
                  locked:false, paid:false, pending:true
                };
                changed = true;
              }
            });

            // Notify for newest TV timeout
            const latest = tvPlays[tvPlays.length-1];
            const tvKey = `${latest.period}-${latest.clock}-${latest.awayScore}-${latest.homeScore}`;
            if (tvKey !== lastNotified.current) {
              lastNotified.current = tvKey;
              const tvA = latest.awayScore ?? sA, tvB = latest.homeScore ?? sB;
              const digit = calcDigit(tvA, tvB);
              const winner = g.assignments[digit]||null;
              setScoreA(tvA); setScoreB(tvB);
              setBotStatus(`📺 TV Timeout! Score: ${tvA}–${tvB} · Digit ${digit}`);
              onToast(winner
                ? `📺 TV Timeout! ${winner} wins — digit ${digit} (${tvA}–${tvB})`
                : `📺 TV Timeout! Digit ${digit} — no player assigned`);
              if (Notification.permission==="granted") {
                new Notification("⏱ Official TV Timeout!", {
                  body: winner
                    ? `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins`
                    : `${g.teamA} ${tvA} – ${tvB} ${g.teamB}  ·  Digit ${digit} — unassigned`
                });
              }
            }
          }

          // ── Halftime slot (h1_0) — use score when period 2 starts ──
          // Find the last play of period 1 (score right before period 2 begins)
          const allPlays = pbpData.plays || [];
          const period1Plays = allPlays.filter(p => p.period === 1);
          if (period1Plays.length > 0 && !updatedResults["h1_0"]?.locked) {
            const lastP1 = period1Plays[period1Plays.length - 1];
            // Only fill if period 2 has started (confirms halftime is over)
            const period2Started = allPlays.some(p => p.period === 2);
            if (period2Started && lastP1.homeScore != null) {
              const hA = lastP1.awayScore ?? sA, hB = lastP1.homeScore ?? sB;
              const digit = calcDigit(hA, hB);
              updatedResults["h1_0"] = {
                scoreA:hA, scoreB:hB, digit,
                winner: g.assignments[digit]||null,
                locked:false, paid:false, pending:true
              };
              changed = true;
            }
          }

          // ── Final slot (h2_0) — use completed game score ──
          if (status === "final" && !updatedResults["h2_0"]?.locked) {
            const digit = calcDigit(sA, sB);
            updatedResults["h2_0"] = {
              scoreA:sA, scoreB:sB, digit,
              winner: g.assignments[digit]||null,
              locked:false, paid:false, pending:true
            };
            changed = true;
            // Notify final
            const finalKey = `final-${sA}-${sB}`;
            if (finalKey !== lastNotified.current) {
              lastNotified.current = finalKey;
              const winner = g.assignments[digit]||null;
              onToast(winner
                ? `🏁 Final! ${winner} wins — digit ${digit} (${sA}–${sB})`
                : `🏁 Final! Digit ${digit} — no player assigned`);
              if (Notification.permission==="granted") {
                new Notification("🏁 Game Final!", {
                  body: winner
                    ? `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit}  ·  ${winner} wins`
                    : `${g.teamA} ${sA} – ${sB} ${g.teamB}  ·  Digit ${digit} — unassigned`
                });
              }
            }
          }

          if (changed) onUpdate({ results: updatedResults });
        } catch { /* pbp failed silently */ }
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (botRunning) timerRef.current = setTimeout(fetchScores, getInterval(status));
    } catch {
      setBotStatus("Fetch failed — retrying");
      if (botRunning) timerRef.current = setTimeout(fetchScores, 30000);
    }
  }, [botRunning, onUpdate, onToast]);

  useEffect(() => {
    if (botRunning) fetchScores();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [botRunning]);

  // Stop bot when game is deleted / component unmounts
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const botProps = { botRunning, setBotRunning, botStatus, setBotStatus, botLive, scoreA, setScoreA, scoreB, setScoreB, fetchScores };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div className="inner-tabs">
        {[
          {id:"setup",   label:"Setup",   icon:"⚙"},
          {id:"board",   label:"Board",   icon:"🎯"},
          {id:"live",    label:"Live",    icon:"📡"},
          {id:"payout",  label:"Payout",  icon:"💰"},
          {id:"players", label:"Players", icon:"👥"},
        ].map(t => (
          <div key={t.id} className={`inner-tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            <span style={{fontSize:13}}>{t.icon}</span> {t.label}
            {t.id==="live" && botRunning && <span style={{marginLeft:4,color:"var(--win)",fontSize:9}}>●</span>}
          </div>
        ))}
      </div>
      <div className="game-content">
        {tab==="setup"   && <TOSetupPanel game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab==="board"   && <TOBoardPanel game={game} onUpdate={onUpdate} onToast={onToast} />}
        {tab==="live"    && <TOLivePanel  game={game} onUpdate={onUpdate} onToast={onToast} botProps={botProps} />}
        {tab==="payout"  && <TOPayoutPanel game={game} onUpdate={onUpdate} />}
        {tab==="players" && <PlayersPanel />}
      </div>
    </div>
  );
}

// ─── Timeout App Root ─────────────────────────────────────────────────────────
let toNextId = 1;

function TimeoutApp({ onToast }) {
  const [games, setGames] = useState(() => {
    const saved = loadTOState();
    if (saved?.games?.length) {
      toNextId = Math.max(...saved.games.map(g=>g.id)) + 1;
      return saved.games;
    }
    return [makeTOGame(toNextId++)];
  });
  const [activeId, setActiveId] = useState(() => loadTOState()?.activeId || 1);

  useEffect(() => { saveTOState(games, activeId); }, [games, activeId]);

  const activeGame = games.find(g=>g.id===activeId) || games[0];

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
    setGames(prev => prev.map(g => g.id===id ? {...g,...patch} : g));
  };

  return (
    <>
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
            <div key={g.id} className={`tab-item ${g.id===activeId?"active":""}`} onClick={() => setActiveId(g.id)}>
              {toTabLabel(g)}
              {games.length > 1 && (
                <span className="tab-close" onClick={e => { e.stopPropagation(); removeGame(g.id); }}>×</span>
              )}
            </div>
          ))}
        </div>
        <div className="tab-add" onClick={addGame} title="Add game">＋</div>
      </div>
    </>
  );
}

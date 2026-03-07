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
  nba:   { label:"NBA", path:"basketball/nba", periods:4, periodLabels:{1:"Q1",2:"Q2",3:"Q3",4:"Final"} },
  ncaab: { label:"NCAA Basketball", path:"basketball/mens-college-basketball", periods:2, periodLabels:{1:"1st Half",2:"Final"} },
  nfl:   { label:"NFL", path:"football/nfl", periods:4, periodLabels:{1:"Q1",2:"Half",3:"Q3",4:"Final"} },
  ncaaf: { label:"College Football", path:"football/college-football", periods:4, periodLabels:{1:"Q1",2:"Half",3:"Q3",4:"Final"} },
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
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

:root {
  --bg: #0a0d12;
  --surface: #141820;
  --surface2: #1c2230;
  --border: #2a3345;
  --court: #3366CC;
  --court-dim: #1e3d7a;
  --court-bright: #4d7de8;
  --gold: #ffffff;
  --gold-dim: rgba(255,255,255,0.55);
  --text: #e8edf5;
  --text-dim: #7a8899;
  --win: #22c55e;
  --win-dim: rgba(34,197,94,0.15);
  --danger: #ef4444;
  --warn: #f59e0b;
}

html, body, #root { height:100%; background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; overflow:hidden; }

/* ── Top Bar ── */
.topbar {
  height:52px; background:var(--surface); border-bottom:1px solid var(--border);
  display:flex; align-items:center; padding:0 16px; gap:12px; flex-shrink:0;
  background: linear-gradient(90deg, var(--surface) 0%, #101626 100%);
}
.topbar-logo { display:flex; align-items:center; gap:10px; font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; color:var(--court-bright); }
.topbar-logo img { height:36px; width:36px; object-fit:contain; border-radius:50%; flex-shrink:0; }
.topbar-logo span { color:var(--gold); }

/* ── Layout ── */
.app-shell { display:flex; flex-direction:column; height:100vh; }
.main-area { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.game-content { flex:1; overflow-y:auto; padding:16px; }

/* ── Tab Bar ── */
.tab-bar {
  display:flex; align-items:center; gap:0; background:var(--surface);
  border-top:1px solid var(--border); flex-shrink:0; overflow-x:auto;
  scrollbar-width:none; padding:0 4px;
}
.tab-bar::-webkit-scrollbar { display:none; }
.tab-item {
  flex-shrink:0; padding:10px 16px; cursor:pointer; font-size:12px; font-weight:600;
  color:var(--text-dim); border-top:2px solid transparent; white-space:nowrap;
  transition:all .15s; display:flex; align-items:center; gap:6px; letter-spacing:.5px;
  text-transform:uppercase;
}
.tab-item:hover { color:var(--text); }
.tab-item.active { color:var(--court-bright); border-top-color:var(--court); }
.tab-item .tab-close { opacity:0; font-size:14px; color:var(--text-dim); transition:opacity .15s; }
.tab-item:hover .tab-close { opacity:1; }
.tab-add {
  flex-shrink:0; padding:10px 14px; cursor:pointer; color:var(--text-dim);
  font-size:18px; transition:color .15s;
}
.tab-add:hover { color:var(--court-bright); }

/* ── Inner Tabs ── */
.inner-tabs { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:16px; flex-shrink:0; }
.inner-tab {
  padding:10px 18px; cursor:pointer; font-size:13px; font-weight:600; letter-spacing:.4px;
  color:var(--text-dim); border-bottom:2px solid transparent; text-transform:uppercase;
  transition:all .15s;
}
.inner-tab:hover { color:var(--text); }
.inner-tab.active { color:var(--court-bright); border-bottom-color:var(--court); }

/* ── Cards ── */
.card {
  background:var(--surface); border:1px solid var(--border); border-radius:10px;
  padding:16px; margin-bottom:14px;
}
.card-title {
  font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:1.5px;
  color:var(--court-bright); margin-bottom:12px;
}

/* ── Form Elements ── */
.field { margin-bottom:12px; }
.field label { display:block; font-size:11px; font-weight:600; letter-spacing:.8px; text-transform:uppercase; color:var(--text-dim); margin-bottom:5px; }
.field input, .field select {
  width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:6px;
  padding:9px 12px; color:var(--text); font-size:14px; font-family:'DM Sans',sans-serif;
  outline:none; transition:border-color .15s;
}
.field input:focus, .field select:focus { border-color:var(--court); }
.field select option { background:var(--surface2); }

/* ── Buttons ── */
.btn {
  display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:6px;
  font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all .15s;
  font-family:'DM Sans',sans-serif; letter-spacing:.3px;
}
.btn-primary { background:var(--court); color:#fff; }
.btn-primary:hover { background:var(--court-bright); }
.btn-secondary { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
.btn-secondary:hover { border-color:var(--court); color:var(--court-bright); }
.btn-danger { background:#7f1d1d; color:#fca5a5; }
.btn-danger:hover { background:var(--danger); color:#fff; }
.btn-win { background:var(--win-dim); color:var(--win); border:1px solid var(--win); }
.btn-sm { padding:6px 11px; font-size:12px; }
.btn-xs { padding:4px 8px; font-size:11px; }
.btn:disabled { opacity:.4; cursor:not-allowed; }

/* ── Player Chips ── */
.player-list { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:10px; }
.player-chip {
  display:inline-flex; align-items:center; gap:5px; background:var(--surface2);
  border:1px solid var(--border); border-radius:20px; padding:4px 10px; font-size:12px;
}
.player-chip .rm { cursor:pointer; color:var(--text-dim); font-size:14px; transition:color .12s; }
.player-chip .rm:hover { color:var(--danger); }

/* ── Grid ── */
.grid-wrap { overflow-x:auto; }
.sq-grid { border-collapse:collapse; min-width:300px; width:100%; }
.sq-grid th, .sq-grid td {
  border:1px solid var(--border); text-align:center; font-size:11px; padding:0;
}
.sq-grid th { background:var(--surface2); color:var(--text-dim); font-weight:700; padding:6px 4px; letter-spacing:.5px; }
.col-header { font-size:13px; color:var(--court-bright); font-family:'Bebas Neue',sans-serif; letter-spacing:1px; }
.sq-cell {
  width:60px; height:52px; cursor:pointer; transition:background .15s;
  font-size:10px; font-weight:600; color:var(--text-dim);
  overflow:hidden; padding:0;
  /* make the whole cell a flex box so content centers perfectly */
  display:table-cell; vertical-align:middle; text-align:center;
  user-select:none;
}
.sq-cell:hover { background:var(--surface2); color:var(--text); }
.sq-cell.filled { color:var(--text); background: rgba(51,102,204,0.08); }
.sq-cell.winner-now { background:rgba(34,197,94,0.2) !important; color:var(--win) !important; box-shadow:inset 0 0 0 2px var(--win); font-weight:700; }
.sq-cell.winner-prev { background:rgba(34,197,94,0.07) !important; color:rgba(34,197,94,0.7) !important; }
.sq-cell.empty-cell { color:transparent; }
.sq-cell.empty-cell:hover { color:var(--text-dim); }

/* ── Score Bot ── */
.bot-header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.bot-status { font-size:11px; color:var(--text-dim); }
.bot-status.live { color:#f87171; }
.pulse { display:inline-block; width:7px; height:7px; border-radius:50%; background:#f87171; animation:pulse 1.2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

.score-display {
  display:flex; align-items:center; justify-content:center; gap:20px;
  padding:18px; background:var(--surface2); border-radius:8px; margin:12px 0;
}
.score-team { text-align:center; }
.score-team-name { font-size:11px; color:var(--text-dim); font-weight:600; letter-spacing:.8px; text-transform:uppercase; margin-bottom:4px; }
.score-num { font-family:'Bebas Neue',sans-serif; font-size:48px; line-height:1; color:var(--text); }
.score-sep { font-family:'Bebas Neue',sans-serif; font-size:32px; color:var(--border); }
.score-detail { text-align:center; font-size:12px; color:var(--text-dim); margin-top:4px; }
.winner-preview {
  background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04));
  border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:12px 16px;
  text-align:center; margin:8px 0;
}
.winner-preview .label { font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); margin-bottom:4px; }
.winner-preview .name { font-family:'Bebas Neue',sans-serif; font-size:26px; color:var(--win); letter-spacing:1px; }

/* ── Score Inputs ── */
.score-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.score-row label { font-size:12px; font-weight:600; color:var(--text-dim); min-width:70px; }
.score-stepper { display:flex; align-items:center; gap:0; }
.score-stepper button {
  background:var(--surface2); border:1px solid var(--border); color:var(--text);
  width:28px; height:32px; cursor:pointer; font-size:16px; transition:background .1s;
}
.score-stepper button:hover { background:var(--border); }
.score-stepper button:first-child { border-radius:6px 0 0 6px; }
.score-stepper button:last-child { border-radius:0 6px 6px 0; }
.score-stepper input {
  width:52px; height:32px; background:var(--surface2); border:1px solid var(--border);
  border-left:none; border-right:none; color:var(--text); text-align:center;
  font-size:15px; font-weight:700; outline:none;
}

/* ── Period Tabs ── */
.period-tabs { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.period-tab {
  padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer;
  border:1px solid var(--border); color:var(--text-dim); transition:all .15s;
  letter-spacing:.3px;
}
.period-tab:hover { border-color:var(--court); color:var(--court-bright); }
.period-tab.active { background:var(--court); border-color:var(--court); color:#fff; }
.period-tab.locked { background:var(--win-dim); border-color:var(--win); color:var(--win); }

/* ── Results History ── */
.result-row {
  display:flex; align-items:center; gap:10px; padding:10px 0;
  border-bottom:1px solid var(--border); font-size:13px;
}
.result-row:last-child { border-bottom:none; }
.result-period { font-family:'Bebas Neue',sans-serif; font-size:15px; color:var(--court-bright); min-width:56px; }
.result-score { color:var(--text-dim); font-size:12px; min-width:70px; }
.result-name { font-weight:700; color:var(--win); flex:1; }
.result-digits { font-size:11px; color:var(--text-dim); }

/* ── Empty State ── */
.empty { text-align:center; padding:40px 20px; color:var(--text-dim); }
.empty-icon { font-size:40px; margin-bottom:12px; opacity:.4; }
.empty-text { font-size:14px; }

/* ── Toast ── */
.toast-wrap { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:1000; pointer-events:none; }
.toast {
  background:var(--surface); border:1px solid var(--win); border-radius:10px;
  padding:12px 20px; font-size:13px; font-weight:600; color:var(--text);
  box-shadow:0 4px 24px rgba(0,0,0,.5); animation:slideUp .3s ease;
  display:flex; align-items:center; gap:10px;
}
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

/* ── Modal ── */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:500;
  display:flex; align-items:center; justify-content:center; padding:16px;
}
.modal {
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  padding:20px; width:100%; max-width:320px; max-height:80vh;
  display:flex; flex-direction:column; overflow:hidden;
}
.modal-player-list {
  overflow-y:auto; flex:1; margin:0 -4px; padding:0 4px;
  /* nice scrollbar */
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
}
.modal-title { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:1.5px; color:var(--court-bright); margin-bottom:14px; }
.player-option {
  padding:10px 14px; cursor:pointer; border-radius:6px; font-size:13px;
  transition:background .1s; margin-bottom:4px;
}
.player-option:hover { background:var(--surface2); color:var(--court-bright); }

/* ── Responsive ── */
@media(max-width:480px) {
  .score-num { font-size:36px; }
  .sq-cell { width:48px; height:44px; font-size:9px; }
}

/* ── Roster picker ── */
.roster-picker {
  border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom:10px;
  max-height:220px; overflow-y:auto;
}
.roster-row {
  display:flex; align-items:center; gap:10px; padding:9px 12px;
  border-bottom:1px solid var(--border); cursor:pointer; transition:background .12s;
  font-size:13px;
}
.roster-row:last-child { border-bottom:none; }
.roster-row:hover { background:var(--surface2); }
.roster-row.in-game { background:rgba(51,102,204,0.08); }
.roster-check { width:16px; height:16px; border-radius:4px; border:2px solid var(--border);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:10px; }
.roster-check.checked { background:var(--court); border-color:var(--court); color:#fff; }
.roster-name { flex:1; }
.roster-del { color:var(--text-dim); font-size:16px; padding:0 4px; opacity:0; transition:opacity .12s; }
.roster-row:hover .roster-del { opacity:1; }
.roster-del:hover { color:var(--danger); }

/* ── Digit assignment display ── */
.digit-assign { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.digit-card {
  background:var(--surface2); border:1px solid var(--border); border-radius:8px;
  padding:8px 12px; min-width:80px; text-align:center;
}
.digit-card .dnum { font-family:'Bebas Neue',sans-serif; font-size:28px; color:var(--court-bright); line-height:1; }
.digit-card .dpair { font-size:10px; color:var(--text-dim); margin-bottom:2px; letter-spacing:.5px; }
.digit-card .dname { font-size:11px; font-weight:600; color:var(--text); }

/* ── Game selector ── */
.game-select-list { display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto; }
.game-option {
  padding:10px 12px; border:1px solid var(--border); border-radius:8px; cursor:pointer;
  transition:all .15s; font-size:13px;
}
.game-option:hover { border-color:var(--court); background:rgba(51,102,204,0.08); }
.game-option .go-name { font-weight:600; color:var(--text); }
.game-option .go-status { font-size:11px; color:var(--text-dim); margin-top:2px; }
.game-option.live .go-status { color:#f87171; }

.row-flex { display:flex; gap:8px; align-items:flex-end; }
.row-flex .field { flex:1; }

.section-label {
  font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim);
  margin-bottom:8px; font-weight:600;
}
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
          <select value={game.sport} onChange={e => onUpdate({ sport: e.target.value, teamA:"", teamB:"", name:"", espnGameId:null })}>
            {Object.entries(SPORT_CONFIG).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
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
                  className={`game-option ${g.inProgress?"live":""}`}
                  style={isSelected ? {borderColor:"var(--court)",background:"rgba(51,102,204,0.12)"} : {}}
                  onClick={() => selectGame(g)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div className="go-name">
                      {isSelected && <span style={{color:"var(--court-bright)",marginRight:5}}>✓</span>}
                      {g.awayTeam} vs {g.homeTeam}
                    </div>
                    {g.inProgress && <span style={{fontSize:10,color:"#f87171",fontWeight:700,letterSpacing:.5}}>LIVE</span>}
                    {g.completed && <span style={{fontSize:10,color:"var(--text-dim)",fontWeight:700}}>FINAL</span>}
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div className="card-title" style={{margin:0}}>
            {game.teamA||"Team A"} vs {game.teamB||"Team B"}
          </div>
        </div>
        <div className="grid-wrap">
          <table className="sq-grid">
            <thead>
              <tr>
                <th style={{width:40}}>
                  <div style={{fontSize:9,color:"var(--text-dim)"}}>B→<br/>A↓</div>
                </th>
                {(game.colPairs||[]).map((pair,i)=>(
                  <th key={i}>
                    <div className="col-header">{pair[0]}/{pair[1]}</div>
                    <div style={{fontSize:9,color:"var(--text-dim)",marginTop:1}}>{game.teamA?makeAbbr(game.teamA):"A"}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(game.rowPairs||[]).map((pair, rowIdx)=>(
                <tr key={rowIdx}>
                  <th>
                    <div className="col-header">{pair[0]}/{pair[1]}</div>
                    <div style={{fontSize:9,color:"var(--text-dim)"}}>{game.teamB?makeAbbr(game.teamB):"B"}</div>
                  </th>
                  {(game.colPairs||[]).map((_pair, colIdx)=>(
                    <td key={colIdx}
                      className={cellClass(rowIdx,colIdx)}
                      onClick={()=>setAssignCell([rowIdx,colIdx])}>
                      {game.grid[rowIdx][colIdx] || "·"}
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
function ScoresPanel({ game, onUpdate, onToast }) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [currentQ, setCurrentQ] = useState(game.currentQuarter || 1);
  const [botRunning, setBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState("");
  const [botLive, setBotLive] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const timerRef = useRef(null);
  const periods = getTotalPeriods(game);

  useEffect(() => { setCurrentQ(game.currentQuarter || 1); }, [game.currentQuarter]);

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

  const detectPeriodKey = (espnGame) => {
    const s = espnGame.statusName || "";
    const period = espnGame.period || 0;
    const status = mapStatus(espnGame.status);
    if (status==="final") return `final`;
    if (status==="halftime") return `half`;
    if (status==="end of period") return `endq${period}`;
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
      setBotStatus(`Fetching... date=${dateStr||"today"} id=${game.espnGameId||"none"}`);
      const res = await fetch(url);
      const data = await res.json();
      const games = data.games || [];
      // Show debug info of what came back
      const gameNames = games.map(g => g.id + ":" + g.awayTeam + " vs " + g.homeTeam).join(" | ");
      console.log("ESPN returned:", gameNames);
      console.log("Looking for ID:", game.espnGameId);
      // Match by ESPN game ID first (most reliable), fall back to team name
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
        setBotStatus(`Not found — fetched ${games.length} games for ${dateStr||"today"}. IDs: ${games.slice(0,3).map(g=>g.id).join(",")}…`);
        setLastFetch(new Date()); return;
      }

      const sA=found.awayScore, sB=found.homeScore;
      setScoreA(sA); setScoreB(sB);
      const status = mapStatus(found.status);
      setBotLive(status==="in progress");
      setBotStatus(`${found.shortDetail||found.status} · Updated ${new Date().toLocaleTimeString()}`);
      setLastFetch(new Date());

      const periodKey = detectPeriodKey(found);
      if (periodKey && periodKey !== game.botLastPeriodKey) {
        // Auto-detected a period end
        const isCheckpoint =
          status==="final" ||
          status==="halftime" ||
          status==="end of period";
        if (isCheckpoint) {
          onUpdate({ botLastPeriodKey: periodKey, botLastScore:{a:sA,b:sB} });
          const winner = getWinner(game, sA, sB);
          const ql = getPeriodLabel(game, currentQ);
          onToast(winner ? `${ql}: ${winner} wins! (${sA}-${sB})` : `${ql}: No winner found`);
          if (Notification.permission==="granted") {
            new Notification("Squares — Period End!", { body: winner ? `${ql}: ${winner} wins! Score: ${sA}-${sB}` : `${ql} ended: ${sA}-${sB}` });
          }
        }
      }

      // Reschedule with smart interval
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line
  }, [botRunning]);

  const liveWinner = getWinner(game, scoreA, scoreB);
  const lockedPeriods = new Set(game.results.map(r=>r.quarter));

  const lockPeriod = () => {
    if (lockedPeriods.has(currentQ)) return;
    const winner = getWinner(game, scoreA, scoreB);
    const result = { quarter:currentQ, scoreA, scoreB,
      digitA:scoreA%10, digitB:scoreB%10, winnerName:winner||"—" };
    const newResults = [...game.results, result];
    const nextQ = Math.min(currentQ+1, periods);
    onUpdate({ results:newResults, currentQuarter:nextQ });
    setCurrentQ(nextQ);
    const label = getPeriodLabel(game, currentQ);
    onToast(winner ? `${label} locked! ${winner} wins! 🏆` : `${label} locked — no winner`);
  };

  return (
    <div>
      {/* Score Bot */}
      <div className="card">
        <div className="card-title">Score Bot</div>
        <div className="bot-header">
          {!botRunning ? (
            <button className="btn btn-primary btn-sm" onClick={startBot} disabled={!game.teamA}>▶ Start Bot</button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={stopBot}>■ Stop</button>
          )}
          {botRunning && (
            <button className="btn btn-secondary btn-sm" onClick={fetchScores}>↻ Now</button>
          )}
          <div className={`bot-status ${botLive?"live":""}`}>
            {botLive && <span className="pulse" style={{marginRight:4}}></span>}
            {botStatus || (game.teamA ? `Ready — tracking ${game.teamA} vs ${game.teamB}${game.gameDate ? " · "+game.gameDate : ""}` : "Select a game in Setup first")}
          </div>
        </div>

        {botStatus && botStatus.includes("EDT") || botStatus.includes("EST") || botStatus.includes("CT") || botStatus.includes("PT") || (scoreA > 0 || scoreB > 0) ? (
          <div className="score-display" style={{marginTop:12}}>
            {scoreA === 0 && scoreB === 0 && botStatus && (botStatus.includes("EDT")||botStatus.includes("EST")||botStatus.includes("CT")||botStatus.includes("PT")) ? (
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,color:"var(--text-dim)",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Scheduled</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"var(--court-bright)",letterSpacing:1}}>{botStatus.split("·")[0].trim()}</div>
                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:4}}>Tracking — scores will appear at tip-off</div>
              </div>
            ) : (
              <>
                <div className="score-team">
                  <div className="score-team-name">{game.teamA||"Team A"}</div>
                  <div className="score-num">{scoreA}</div>
                </div>
                <div className="score-sep">–</div>
                <div className="score-team">
                  <div className="score-team-name">{game.teamB||"Team B"}</div>
                  <div className="score-num">{scoreB}</div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Manual Entry */}
      <div className="card">
        <div className="card-title">Lock a Period</div>
        <div className="period-tabs">
          {Array.from({length:periods},(_,i)=>i+1).map(q=>(
            <div key={q}
              className={`period-tab ${q===currentQ?"active":""} ${lockedPeriods.has(q)?"locked":""}`}
              onClick={()=>setCurrentQ(q)}>
              {getPeriodLabel(game,q)} {lockedPeriods.has(q)?"✓":""}
            </div>
          ))}
        </div>

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
          <div className="winner-preview">
            <div className="label">Winner if locked now</div>
            <div className="name">🏆 {liveWinner}</div>
          </div>
        ) : (
          <div style={{fontSize:12,color:"var(--text-dim)",textAlign:"center",padding:"10px 0"}}>
            Digits: {scoreA%10} + {scoreB%10} = {(scoreA+scoreB)%10} — no matching square yet
          </div>
        )}

        <button className="btn btn-win" style={{width:"100%",marginTop:8}}
          onClick={lockPeriod} disabled={lockedPeriods.has(currentQ)}>
          {lockedPeriods.has(currentQ) ? `${getPeriodLabel(game,currentQ)} Locked ✓` : `🔒 Lock ${getPeriodLabel(game,currentQ)}`}
        </button>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ game }) {
  if (!game.results.length) return (
    <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No results locked yet</div></div>
  );
  return (
    <div className="card">
      <div className="card-title">Results History</div>
      {game.results.map((r,i)=>(
        <div key={i} className="result-row">
          <div className="result-period">{getPeriodLabel(game,r.quarter)}</div>
          <div className="result-score">{r.scoreA}–{r.scoreB}</div>
          <div className="result-name">{r.winnerName}</div>
          <div className="result-digits">…{r.digitA}+…{r.digitB}={(r.digitA+r.digitB)%10}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Game View ────────────────────────────────────────────────────────────────
function GameView({ game, onUpdate, onToast, onDelete }) {
  const [tab, setTab] = useState("setup");
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div className="inner-tabs">
        {["setup","grid","scores","players","history"].map(t=>(
          <div key={t} className={`inner-tab ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
            {t}
          </div>
        ))}
      </div>
      <div className="game-content">
        {tab==="setup"   && <SetupPanel game={game} onUpdate={onUpdate} onDelete={onDelete} />}
        {tab==="grid"    && <GridPanel game={game} onUpdate={onUpdate} />}
        {tab==="scores"  && <ScoresPanel game={game} onUpdate={onUpdate} onToast={onToast} />}
        {tab==="players" && <PlayersPanel />}
        {tab==="history" && <HistoryPanel game={game} />}
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

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-logo"><img src="/logo.svg" alt="Bock Talks logo" />Bock Talks <span>Squares</span></div>
        </div>

        {/* Main */}
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

        {/* Game Tab Bar */}
        <div className="tab-bar">
          {games.map(g=>(
            <div key={g.id} className={`tab-item ${g.id===activeId?"active":""}`} onClick={()=>setActiveId(g.id)}>
              {tabLabel(g)}
              {games.length>1 && (
                <span className="tab-close" onClick={e=>{e.stopPropagation();removeGame(g.id);}}>×</span>
              )}
            </div>
          ))}
          <div className="tab-add" onClick={addGame} title="Add game">＋</div>
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
    </>
  );
}

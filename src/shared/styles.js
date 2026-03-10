export const css = `
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
@supports (height: 100dvh) {
  html, body, #root { height: 100dvh; }
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
.mode-switcher {
  display:flex; gap:2px; background:var(--surface2);
  border-radius:8px; padding:3px; margin-left:auto;
}
.mode-btn {
  padding:5px 14px; border-radius:6px; font-size:11px; font-weight:700;
  letter-spacing:.6px; text-transform:uppercase; cursor:pointer;
  transition:all .15s; color:var(--text-dim); border:none;
  background:transparent; font-family:'DM Sans',sans-serif;
}
.mode-btn.active { background:var(--court); color:#fff; }
.mode-btn:hover:not(.active) { color:var(--text); }

/* ── Layout ── */
.app-shell {
  display:flex; flex-direction:column; overflow:hidden;
  height: 100vh; height: 100dvh;
}
.main-area { flex:1; overflow:hidden; display:flex; flex-direction:column; min-height:0; }
.game-content {
  flex:1; overflow-y:auto;
  padding:14px 14px calc(46px + env(safe-area-inset-bottom) + 14px);
}
.game-content::-webkit-scrollbar { width:4px; }
.game-content::-webkit-scrollbar-track { background:transparent; }
.game-content::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

/* ── Bottom Game Tabs ── */
.tab-bar {
  display:flex; align-items:stretch; background:var(--surface);
  border-top:1px solid var(--border); min-height:46px;
  position:fixed; bottom:0; left:0; right:0; z-index:200;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab-bar-scroll {
  flex:1; display:flex; align-items:stretch;
  overflow-x:auto; scrollbar-width:none; min-width:0;
}
.tab-bar-scroll::-webkit-scrollbar { display:none; }
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
@media (hover: none) { .tab-item .tab-close { opacity:0.6; } }
.tab-add {
  flex-shrink:0; width:48px; min-width:48px; cursor:pointer; color:var(--text-dim);
  font-size:20px; display:flex; align-items:center; justify-content:center;
  transition:all .15s; border-left:1px solid var(--border); background:var(--surface);
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
  padding:9px 12px; color:var(--text); font-size:14px; font-family:'DM Sans',sans-serif;
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
  font-family:'DM Sans',sans-serif; letter-spacing:.2px; white-space:nowrap;
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
.player-chip {
  display:inline-flex; align-items:center; gap:5px; background:var(--surface2);
  border:1px solid var(--border); border-radius:20px; padding:4px 10px; font-size:12px;
}
.player-chip .rm { cursor:pointer; color:var(--text-dim); font-size:14px; line-height:1; }
.player-chip .rm:hover { color:var(--danger); }

/* ── Grid ── */
.grid-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.sq-grid { border-collapse:collapse; width:100%; table-layout:fixed; }
.sq-grid th, .sq-grid td { border:1px solid var(--border); text-align:center; font-size:10px; padding:0; }
.sq-grid th { background:var(--surface2); color:var(--text-dim); font-weight:700; padding:5px 2px; letter-spacing:.3px; }
.col-header { font-size:14px; color:var(--court-bright); font-family:'Bebas Neue',sans-serif; letter-spacing:1px; }
.sq-cell {
  height:50px; cursor:pointer; transition:background .12s, color .12s;
  font-size:9px; font-weight:600; color:var(--text-dim);
  overflow:hidden; padding:2px; display:table-cell; vertical-align:middle;
  text-align:center; user-select:none; word-break:break-word; line-height:1.2;
}
.sq-cell:hover { background:var(--surface3); color:var(--text); }
.sq-cell.filled { color:var(--text-mid); background:rgba(51,102,204,0.07); }
.sq-cell.filled:hover { background:rgba(51,102,204,0.14); }
.sq-cell.winner-now {
  background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1)) !important;
  color:var(--win) !important; box-shadow:inset 0 0 0 2px var(--win);
  font-weight:700; animation:winPulse 2s ease-in-out infinite;
}
.sq-cell.winner-prev {
  background:rgba(34,197,94,0.06) !important; color:rgba(34,197,94,0.6) !important;
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
.score-team-name { font-size:10px; color:var(--text-dim); font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
.score-num { font-family:'Bebas Neue',sans-serif; font-size:62px; line-height:1; color:var(--text); letter-spacing:-1px; }
.score-sep { font-family:'Bebas Neue',sans-serif; font-size:28px; color:var(--border-bright); flex-shrink:0; }
.score-detail { text-align:center; font-size:11px; color:var(--text-dim); margin-top:4px; }

/* ── Winner Banner ── */
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

/* ── Score Inputs ── */
.score-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.score-row label { font-size:11px; font-weight:600; color:var(--text-dim); min-width:52px; letter-spacing:.5px; text-transform:uppercase; }
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
.result-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid var(--border); font-size:13px; }
.result-row:last-child { border-bottom:none; }
.result-period { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; color:var(--court-bright); min-width:52px; letter-spacing:.5px; text-transform:uppercase; }
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
@keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }

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
.modal-player-list { overflow-y:auto; max-height:320px; margin:0 -4px; padding:0 4px; scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
.modal-title { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:700; letter-spacing:1.5px; color:var(--court-bright); margin-bottom:14px; text-transform:uppercase; }
.player-option { padding:11px 14px; cursor:pointer; border-radius:7px; font-size:13px; transition:background .1s; margin-bottom:3px; color:var(--text-mid); }
.player-option:hover { background:var(--surface2); color:var(--text); }

/* ── Roster Picker ── */
.roster-picker { display:flex; flex-direction:column; gap:4px; max-height:280px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
.roster-row { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:6px; cursor:pointer; transition:background .12s; border:1px solid transparent; }
.roster-row:hover { background:var(--surface2); }
.roster-row.in-game { border-color:var(--court-dim); background:rgba(51,102,204,0.06); }
.roster-check { width:18px; height:18px; border-radius:4px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; color:var(--court-bright); }
.roster-check.checked { background:var(--court); border-color:var(--court); color:#fff; }
.roster-name { font-size:13px; font-weight:500; }
.roster-del { color:var(--text-dim); font-size:16px; padding:0 4px; opacity:0; transition:opacity .12s; line-height:1; }
.roster-row:hover .roster-del { opacity:1; }
.roster-del:hover { color:var(--danger); }

/* ── Digit Cards ── */
.digit-assign { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.digit-card { background:var(--surface2); border:1px solid var(--border); border-radius:9px; padding:10px 12px; min-width:76px; text-align:center; transition:border-color .12px; }
.digit-card:hover { border-color:var(--border-bright); }
.digit-card .dnum { font-family:'Bebas Neue',sans-serif; font-size:32px; color:var(--court-bright); line-height:1; }
.digit-card .dname { font-size:11px; font-weight:600; color:var(--text-mid); }

/* ── Game Selector ── */
.game-select-list { display:flex; flex-direction:column; gap:5px; max-height:260px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
.game-option { padding:11px 13px; border:1px solid var(--border); border-radius:8px; cursor:pointer; transition:all .12s; font-size:13px; background:var(--surface2); }
.game-option:hover { border-color:var(--court-dim); background:rgba(51,102,204,0.06); }
.game-option.selected-game { border-color:var(--court); background:rgba(51,102,204,0.1); }
.game-option .go-name { font-weight:600; color:var(--text); font-size:13px; }
.game-option .go-status { font-size:11px; color:var(--text-dim); margin-top:3px; }
.game-option.live .go-status { color:#f87171; }
.go-badge { font-size:9px; font-weight:700; letter-spacing:.8px; padding:2px 6px; border-radius:4px; flex-shrink:0; }
.go-badge.live-badge { background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.2); }
.go-badge.final-badge { background:var(--surface3); color:var(--text-dim); border:1px solid var(--border); }

/* ── Misc ── */
.row-flex { display:flex; gap:8px; align-items:flex-end; }
.row-flex .field { flex:1; }
.section-label { font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-dim); margin-bottom:8px; font-weight:600; }
.unlock-btn { font-size:10px; padding:3px 9px; border-radius:4px; cursor:pointer; background:transparent; color:var(--text-dim); border:1px solid var(--border); transition:all .15s; font-family:'DM Sans',sans-serif; font-weight:600; letter-spacing:.3px; }
.unlock-btn:hover { color:var(--warn); border-color:var(--warn); background:var(--warn-dim); }
.section-divider { height:1px; background:linear-gradient(90deg,transparent,var(--border),transparent); margin:16px 0; }
.status-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:600; letter-spacing:.6px; text-transform:uppercase; padding:3px 8px; border-radius:20px; }
.status-badge.live { background:rgba(248,113,113,0.12); color:#f87171; border:1px solid rgba(248,113,113,0.2); }
.status-badge.final { background:var(--surface3); color:var(--text-dim); border:1px solid var(--border); }
.status-badge.scheduled { background:var(--court-glow); color:var(--court-bright); border:1px solid rgba(51,102,204,0.2); }

/* ── Payment / Payout ── */
.payment-summary { display:flex; gap:8px; flex-wrap:wrap; }
.pay-stat { flex:1; min-width:72px; background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 12px; text-align:center; }
.pay-stat .ps-val { font-family:'Bebas Neue',sans-serif; font-size:22px; color:var(--court-bright); line-height:1; }
.pay-stat .ps-label { font-size:9px; color:var(--text-dim); letter-spacing:.8px; text-transform:uppercase; margin-top:3px; }
.pay-stat.ps-green .ps-val { color:var(--win); }
.pay-stat.ps-warn .ps-val { color:var(--warn); }
.payment-table { width:100%; border-collapse:collapse; }
.payment-table th { font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-dim); font-weight:600; padding:6px 8px; text-align:left; border-bottom:1px solid var(--border); }
.payment-table td { padding:9px 8px; border-bottom:1px solid rgba(35,45,63,0.6); font-size:13px; vertical-align:middle; }
.payment-table tr:last-child td { border-bottom:none; }
.payment-table tr:hover td { background:rgba(255,255,255,0.018); }
.paid-toggle { display:inline-flex; align-items:center; gap:5px; cursor:pointer; font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; border:1px solid; transition:all .15s; user-select:none; white-space:nowrap; }
.paid-toggle.paid { color:var(--win); border-color:rgba(34,197,94,0.4); background:var(--win-dim); }
.paid-toggle.unpaid { color:var(--text-dim); border-color:var(--border); background:transparent; }
.paid-toggle.paid:hover { background:rgba(34,197,94,0.2); }
.paid-toggle.unpaid:hover { color:var(--text-mid); border-color:var(--border-bright); }

/* ── Responsive ── */
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
`;

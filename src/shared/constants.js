export const BACKEND = "https://squares-backend-production.up.railway.app";
export const STORAGE_KEY = "squares_app_v2";
export const ROSTER_KEY = "squares_roster_v1";
export const TO_STORAGE_KEY = "timeout_app_v1";

export const SPORT_CONFIG = {
  nba: {
    label: "NBA",
    path: "basketball/nba",
    periods: 4,
    periodLabels: { 1: "Q1", 2: "Q2", 3: "Q3", 4: "Final" },
    payoutOptions: [
      { key: "quarters", label: "All Quarters (Q1 · Q2 · Q3 · Final)", periods: [1, 2, 3, 4] },
      { key: "halves",   label: "Halves Only (Q2 · Final)",             periods: [2, 4] },
      { key: "final",    label: "Final Only",                           periods: [4] },
    ],
  },
  ncaab: {
    label: "NCAA Basketball",
    path: "basketball/mens-college-basketball",
    periods: 2,
    periodLabels: { 1: "1st Half", 2: "Final" },
    payoutOptions: [
      { key: "halves", label: "Both Halves (1st Half · Final)", periods: [1, 2] },
      { key: "final",  label: "Final Only",                     periods: [2] },
    ],
  },
  nfl: {
    label: "NFL",
    path: "football/nfl",
    periods: 4,
    periodLabels: { 1: "Q1", 2: "Half", 3: "Q3", 4: "Final" },
    payoutOptions: [
      { key: "quarters", label: "All Quarters (Q1 · Half · Q3 · Final)", periods: [1, 2, 3, 4] },
      { key: "halves",   label: "Halves Only (Half · Final)",             periods: [2, 4] },
      { key: "final",    label: "Final Only",                             periods: [4] },
    ],
  },
  ncaaf: {
    label: "College Football",
    path: "football/college-football",
    periods: 4,
    periodLabels: { 1: "Q1", 2: "Half", 3: "Q3", 4: "Final" },
    payoutOptions: [
      { key: "quarters", label: "All Quarters (Q1 · Half · Q3 · Final)", periods: [1, 2, 3, 4] },
      { key: "halves",   label: "Halves Only (Half · Final)",             periods: [2, 4] },
      { key: "final",    label: "Final Only",                             periods: [4] },
    ],
  },
};

export const TEAM_ABBR = {
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

export const TIMEOUT_SLOTS = [
  { id: "h1_16", half: 1, label: "16:00", shortLabel: "1H·16" },
  { id: "h1_12", half: 1, label: "12:00", shortLabel: "1H·12" },
  { id: "h1_8",  half: 1, label: "8:00",  shortLabel: "1H·8"  },
  { id: "h1_4",  half: 1, label: "4:00",  shortLabel: "1H·4"  },
  { id: "h1_0",  half: 1, label: "Half",  shortLabel: "Half"  },
  { id: "h2_16", half: 2, label: "16:00", shortLabel: "2H·16" },
  { id: "h2_12", half: 2, label: "12:00", shortLabel: "2H·12" },
  { id: "h2_8",  half: 2, label: "8:00",  shortLabel: "2H·8"  },
  { id: "h2_4",  half: 2, label: "4:00",  shortLabel: "2H·4"  },
  { id: "h2_0",  half: 2, label: "Final", shortLabel: "Final" },
];

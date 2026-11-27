/* IB Chemistry - topic practice platform (SL & HL, MCQ / P2 / Paper 1B) */
const app = document.getElementById("app");
const PAGE_SIZE = 8;
const P2_PAGE_SIZE = 2;
const isStructPaper = p => p === "P2" || p === "P1B";   // self-marking with official mark scheme
let state = { view: "home", chapter: null, name: "", answers: {}, marks: {}, page: 0, submitted: false, marking: false,
  browse: { level: "SL", paper: "MCQ" } };
/* Level keys are internal and stable (access codes and saved attempts rely on them);
   LEVEL_LABELS is what students see. SLP / HLP = complete past papers shown as numbered sets. */
const LEVELS = ["Pre-IB", "SL", "HL", "SLP", "HLP", "TL"];
const LEVEL_LABELS = { "Pre-IB": "Pre-IB", "SL": "Topical SL", "HL": "Topical HL", "SLP": "SL Past Papers", "HLP": "HL Past Papers", "TL": "Topical Learning" };
const PAPERS = ["MCQ", "FRQ", "P1B"];
const PREIB_PAPERS = ["MCQ", "FRQ"];
const LEVEL_PAPERS = { "Pre-IB": ["MCQ", "FRQ"], "SL": ["MCQ", "P2", "P1B"], "HL": ["MCQ", "P2", "P1B"], "SLP": ["MCQ", "P2"], "HLP": ["MCQ", "P2"], "TL": ["MCQ"] };
const isPastPaperLevel = l => /P$/.test(l);
const paperLabel = (level, p) => isPastPaperLevel(level) ? ({ "MCQ": "Paper 1", "P2": "Paper 2" }[p] || p) : p;
/* Bootstrap from URL: #preib/#topic/#sets/#p1b/#p2 preselect a level+paper tab;
   ?code=IBQ... applies a class access code non-interactively (used when the quiz is
   embedded in the ibchemni platform, which unlocks chapters for purchased courses). */
(function bootFromUrl() {
  if (typeof location === "undefined") return;
  const h = location.hash;
  if (h === "#preib") state.browse.level = "Pre-IB";
  if (h === "#topic") { state.browse.level = "SL"; state.browse.paper = "MCQ"; }
  if (h === "#sets")  { state.browse.level = "SLP"; state.browse.paper = "MCQ"; }
  if (h === "#p1b")   { state.browse.level = "SL"; state.browse.paper = "P1B"; }
  if (h === "#p2")    { state.browse.level = "SL"; state.browse.paper = "P2"; }
  if (h === "#tl")    state.browse.level = "TL";
  // embeds never take a code (ENTRY itself is declared further down, so look at the URL here)
  const q = new URLSearchParams(location.search).has("entry") ? "" : new URLSearchParams(location.search).get("code");
  if (q) {
    try {
      const obj = decodeAccess(q);
      if (obj && Array.isArray(obj.a) && (obj.a[0] !== "*" || obj.c === "TEACHER")) {
        localStorage.setItem("access", JSON.stringify({ cls: obj.c, allow: obj.a }));
        /* embedded entries: carry the student's name from the platform identity,
           so no second sign-in is ever asked inside the embed */
        const m = /^Student (.+)$/.exec(obj.c || "");
        if (m && localStorage.getItem("stuName") !== m[1]) localStorage.setItem("stuName", m[1]);
      }
    } catch (e) { /* invalid code: ignore, the normal code box still works */ }
  }
})();

/* Entry modes: ?entry=... restricts the app to a subset of levels/papers
   (used by the ibchemni personal-site embeds). Entries never include Pre-IB.
   No entry parameter = full app, behaviour unchanged. */
const ENTRY_CFG = {
  "topical-units":   { levels: ["SL", "HL", "TL"], papers: ["MCQ", "P2"], home: "/topical" },   // HL topical bank reorganised to units 2026-11-27; TL = interactive Topical Learning courses
  "past-paper-sets": { levels: ["SLP", "HLP"], papers: ["MCQ", "P2"], home: "/past-paper-sets" },
  "exam-sprint-p1b": { levels: ["SL", "HL"], papers: ["P1B"], home: "/exam-sprint" },
  "exam-sprint-p2":  { levels: ["SL", "HL"], papers: ["P2"], home: "/exam-sprint" }
};
const ENTRY = (() => {
  if (typeof location === "undefined") return null;
  const params = new URLSearchParams(location.search);
  const e = params.get("entry") || "";
  const cfg = ENTRY_CFG[e];
  return cfg ? { name: e, levels: cfg.levels.slice(), papers: cfg.papers.slice(), home: cfg.home, review: params.get("review") || "" } : null;
})();
if (ENTRY) {
  if (ENTRY.levels.indexOf(state.browse.level) === -1) state.browse.level = ENTRY.levels[0];
  if (ENTRY.papers.indexOf(state.browse.paper) === -1) state.browse.paper = ENTRY.papers[0];
}

/* ---------- Pre-IB topics (merged from the SL MCQ bank) ---------- */
const PREIB_TOPICS = [
  { id: "preib-stoich",   title: "Stoichiometry",     src: ["u1b"] },
  { id: "preib-atoms",    title: "Atomic Structure",  src: ["u1a"] },
  { id: "preib-periodic", title: "Periodic Trends",   src: ["u3"] },
  { id: "preib-bonding",  title: "Chemical Bonding",  src: ["u2"] }
];
const PREIB_CH = PREIB_TOPICS.map(t => ({
  id: t.id,
  title: t.title,
  level: "Pre-IB",
  level2: "SL",
  paper: "MCQ",
  _src: t.src,
  questions: t.src.flatMap(cid => {
    const c = QUIZ_DATA.chapters.find(x => x.id === cid);
    return c ? c.questions : [];
  })
}));

/* ---------- Pre-IB FRQ sets (auto-marked by keyword rubrics) ---------- */
const FRQ_INSTRUCTIONS = `<b>For each molecule, answer all seven parts:</b>
  <ol class="frqol">
    <li>Draw the Lewis structure.</li>
    <li>State the number of electron domains around the central atom.</li>
    <li>State the <b>electron domain geometry</b>.</li>
    <li>State the <b>molecular geometry</b>.</li>
    <li>Predict the <b>bond angle</b>.</li>
    <li>Determine the <b>bond polarity</b> (use electronegativities; show δ⁺/δ⁻). Values: H 2.20 · B 2.04 · C 2.55 · N 3.04 · O 3.44 · F 3.98 · P 2.19 · S 2.58 · Cl 3.16</li>
    <li>Judge the <b>molecular polarity</b> — polar or non-polar, and explain in terms of bond dipoles and symmetry.</li>
  </ol>`;

const PREIB_FRQ_SETS = [
  {
    id: "preib-frq-polarity",
    title: "Chemical Bonding · Molecular Polarity (VSEPR & Polarity)",
    level: "Pre-IB", level2: "SL", paper: "FRQ", _src: ["preib-frq"],
    intro: FRQ_INSTRUCTIONS,
    questions: [
      { marks: 7,
        prompt: "<strong>CO₂ (carbon dioxide)</strong><br>Explain why CO₂ contains polar bonds but is a non-polar molecule.",
        rubric: [
          { d: "Electron domains around C: 2 (two C=O double bonds, no lone pairs)", k: ["2 electron", "two electron", "2 domain", "two domain", "2 region", "two region", "two double bond", "2 double bond", "no lone pair"] },
          { d: "Electron domain geometry: linear", k: ["linear"] },
          { d: "Molecular geometry: linear", k: ["linear"] },
          { d: "Bond angle: 180°", k: ["180"] },
          { d: "C=O bonds polar; shown with δ⁺/δ⁻ (ΔEN = 0.89), Cδ⁺=Oδ⁻", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: non-polar", k: ["non-polar", "nonpolar", "non polar"] },
          { d: "Two identical bond dipoles point in opposite directions and cancel by symmetry", k: ["cancel", "opposite", "symmetry", "symmetrical", "balance"] } ],
        key: "<ul><li>Electron domains: <b>2</b> (two C=O double bonds, no lone pairs)</li><li>Domain & molecular geometry: <b>linear</b></li><li>Bond angle: <b>180°</b></li><li>Bond polarity: C=O polar (ΔEN = 3.44 − 2.55 = 0.89); Cδ⁺=Oδ⁻</li><li>Molecular polarity: <b>non-polar</b> — two identical dipoles point in opposite directions and cancel by symmetry.</li></ul>" },
      { marks: 7,
        prompt: "<strong>HCN (hydrogen cyanide)</strong><br>H–C≡N: predict the geometry and overall polarity.",
        rubric: [
          { d: "Electron domains around C: 2 (C–H single + C≡N triple, no lone pairs)", k: ["2 electron", "two electron", "2 domain", "two domain", "2 region", "two region", "no lone pair"] },
          { d: "Electron domain geometry: linear", k: ["linear"] },
          { d: "Molecular geometry: linear", k: ["linear"] },
          { d: "Bond angle: 180°", k: ["180"] },
          { d: "Bond polarity: C≡N strongly polar (Nδ⁻); C–H nearly non-polar", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "No symmetry cancellation — ends different (H vs N), net dipole points toward N", k: ["toward n", "towards n", "toward the n", "no cancel", "not cancel", "cannot cancel", "don't cancel", "do not cancel", "different atom", "different element", "different end", "net dipole"] } ],
        key: "<ul><li>Electron domains: <b>2</b> (C–H single, C≡N triple, no lone pairs)</li><li>Domain & molecular geometry: <b>linear</b></li><li>Bond angle: <b>180°</b></li><li>Bond polarity: C–H nearly non-polar (ΔEN 0.35); C≡N strongly polar (ΔEN 0.49), Nδ⁻</li><li>Molecular polarity: <b>polar</b> — ends are different (H vs N), no cancellation; net dipole points toward N.</li></ul>" },
      { marks: 7,
        prompt: "<strong>SO₂ (sulfur dioxide)</strong><br>SO₂ and CO₂ both contain two double bonds, yet SO₂ is polar while CO₂ is not. Draw the Lewis structure of SO₂ and account for the difference.",
        rubric: [
          { d: "Electron domains around S: 3 (two S=O bonds + 1 lone pair)", k: ["3 electron", "three electron", "3 domain", "three domain", "3 region", "three region", "lone pair"] },
          { d: "Electron domain geometry: trigonal planar", k: ["trigonal planar", "triangular planar", "planar triangular"] },
          { d: "Molecular geometry: bent (V-shaped)", k: ["bent", "v-shaped", "v shaped", "angular"] },
          { d: "Bond angle ≈119° (slightly less than 120°)", k: ["119", "120", "less than 120"] },
          { d: "S=O bonds polar (ΔEN = 0.86); Sδ⁺=Oδ⁻", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "Bent shape → dipoles do not cancel (unlike linear CO₂); lone pair forces the bend", k: ["not cancel", "don't cancel", "do not cancel", "cannot cancel", "no cancel", "bent", "asymmetr", "not symmetr", "co2", "lone pair"] } ],
        key: "<ul><li>Electron domains: <b>3</b> (two S=O + <b>1 lone pair</b>)</li><li>Domain geometry: <b>trigonal planar</b>; molecular geometry: <b>bent</b></li><li>Bond angle: <b>≈119°</b></li><li>Bond polarity: S=O polar (ΔEN 0.86); Sδ⁺=Oδ⁻</li><li>Molecular polarity: <b>polar</b> — bent shape means the two bond dipoles do not cancel; net dipole toward the O atoms. CO₂ is linear so its dipoles cancel; SO₂'s lone pair forces a bent shape.</li></ul>" },
      { marks: 7,
        prompt: "<strong>BF₃ (boron trifluoride)</strong><br>Predict the geometry of BF₃ and its polarity. Comment on the bond angles.",
        rubric: [
          { d: "Electron domains around B: 3 (three B–F bonds, no lone pairs)", k: ["3 electron", "three electron", "3 domain", "three domain", "3 region", "three region", "no lone pair"] },
          { d: "Electron domain geometry: trigonal planar", k: ["trigonal planar", "triangular planar"] },
          { d: "Molecular geometry: trigonal planar", k: ["trigonal planar", "triangular planar"] },
          { d: "Bond angle: 120°", k: ["120"] },
          { d: "B–F highly polar (ΔEN = 1.94); Bδ⁺–Fδ⁻", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: non-polar", k: ["non-polar", "nonpolar", "non polar"] },
          { d: "Three identical dipoles at 120° sum to zero by symmetry", k: ["cancel", "sum to zero", "add to zero", "vector", "symmetry", "symmetrical", "balance", "equal"] } ],
        key: "<ul><li>Electron domains: <b>3</b> (three B–F, no lone pairs; incomplete octet acceptable)</li><li>Domain & molecular geometry: <b>trigonal planar</b></li><li>Bond angle: <b>120°</b></li><li>Bond polarity: B–F highly polar (ΔEN 1.94); Bδ⁺–Fδ⁻</li><li>Molecular polarity: <b>non-polar</b> — three identical dipoles at 120° sum to zero. Bond polarity ≠ molecular polarity.</li></ul>" },
      { marks: 7,
        prompt: "<strong>CH₂O (methanal / formaldehyde)</strong><br>Predict the geometry around the central carbon atom and determine the direction of the net dipole.",
        rubric: [
          { d: "Electron domains around C: 3 (two C–H + one C=O, no lone pairs)", k: ["3 electron", "three electron", "3 domain", "three domain", "3 region", "three region", "three bond", "3 bond"] },
          { d: "Electron domain geometry: trigonal planar", k: ["trigonal planar", "triangular planar"] },
          { d: "Molecular geometry: trigonal planar", k: ["trigonal planar", "triangular planar"] },
          { d: "Bond angle ≈120° (H–C–H compressed to ~116°)", k: ["120", "116"] },
          { d: "C=O polar (ΔEN 0.89); C–H nearly non-polar", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "C=O dipole not balanced by the two C–H dipoles; net dipole points from C toward O", k: ["toward o", "towards o", "toward the o", "toward oxygen", "towards oxygen", "net dipole", "not balance", "not cancel", "do not cancel", "cannot cancel", "no cancel", "oxygen end"] } ],
        key: "<ul><li>Electron domains: <b>3</b> (two C–H + one C=O, no lone pairs)</li><li>Domain & molecular geometry: <b>trigonal planar</b></li><li>Bond angle: <b>≈120°</b> (H–C–H ~116°)</li><li>Bond polarity: C=O polar; C–H nearly non-polar</li><li>Molecular polarity: <b>polar</b> — C=O dipole not balanced by C–H dipoles; net dipole points toward O.</li></ul>" },
      { marks: 7,
        prompt: "<strong>CH₄ (methane)</strong><br>Explain why CH₄ is non-polar.",
        rubric: [
          { d: "Electron domains around C: 4 (four C–H bonds, no lone pairs)", k: ["4 electron", "four electron", "4 domain", "four domain", "4 region", "four region", "four bond", "4 bond"] },
          { d: "Electron domain geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Molecular geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Bond angle: 109.5°", k: ["109.5", "109"] },
          { d: "C–H bonds essentially non-polar (ΔEN = 0.35)", k: ["re:c[–-]h", "0.35", "re:bond.{0,14}non", "re:non.{0,8}bond", "re:almost non", "re:nearly non", "re:essentially non", "re:weakly polar"] },
          { d: "Molecule overall: non-polar", k: ["non-polar molecule", "nonpolar molecule", "molecule is non", "non-polar overall", "overall non", "whole molecule", "ch4 is non", "methane is non", "re:(?<!c[–-]h )(?<!bond )non[- ]?polar"] },
          { d: "Two reasons: bonds ~non-polar AND tetrahedral shape fully symmetric", k: ["symmetry", "symmetrical", "tetrahedr", "cancel", "equal", "four bond", "4 bond"] } ],
        key: "<ul><li>Electron domains: <b>4</b> (four C–H, no lone pairs)</li><li>Domain & molecular geometry: <b>tetrahedral</b></li><li>Bond angle: <b>109.5°</b></li><li>Bond polarity: C–H essentially non-polar (ΔEN 0.35)</li><li>Molecular polarity: <b>non-polar</b> — bonds nearly non-polar AND perfectly symmetric tetrahedron (both layers needed).</li></ul>" },
      { marks: 7,
        prompt: "<strong>CH₃Cl (chloromethane)</strong><br>CH₃Cl has the same tetrahedral arrangement as CH₄, yet it is polar. Explain.",
        rubric: [
          { d: "Electron domains around C: 4 (three C–H + one C–Cl, no lone pairs)", k: ["4 electron", "four electron", "4 domain", "four domain", "4 region", "four region"] },
          { d: "Electron domain geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Molecular geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Bond angle ≈109.5° (slightly distorted)", k: ["109.5", "109"] },
          { d: "C–Cl strongly polar (ΔEN = 0.61); Cδ⁺–Clδ⁻; C–H nearly non-polar", k: ["polar", "δ", "delta", "0.61"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "Substituting one H by Cl breaks the symmetry; C–Cl dipole not cancelled, net dipole toward Cl", k: ["symmetry", "symmetrical", "asymmetr", "not cancel", "not balance", "do not cancel", "cannot cancel", "no cancel", "toward cl", "towards cl", "toward the cl", "chlorine end", "toward chlorine", "different substituent", "different atom", "unequal", "not equal"] } ],
        key: "<ul><li>Electron domains: <b>4</b> (three C–H + one C–Cl)</li><li>Domain & molecular geometry: <b>tetrahedral</b></li><li>Bond angle: <b>≈109.5°</b> (slightly distorted)</li><li>Bond polarity: C–Cl strongly polar (ΔEN 0.61); Cδ⁺–Clδ⁻</li><li>Molecular polarity: <b>polar</b> — replacing one H with Cl breaks the symmetry; C–Cl dipole not cancelled, net dipole toward Cl.</li></ul>" },
      { marks: 7,
        prompt: "<strong>NH₃ (ammonia)</strong><br>Predict the geometry and bond angle of NH₃, and explain why the bond angle is smaller than that of a perfect tetrahedron.",
        rubric: [
          { d: "Electron domains around N: 4 (three N–H bonds + 1 lone pair)", k: ["4 electron", "four electron", "4 domain", "four domain", "lone pair", "3 bond", "three bond"] },
          { d: "Electron domain geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Molecular geometry: trigonal pyramidal", k: ["pyramidal"] },
          { d: "Bond angle ≈107°", k: ["107"] },
          { d: "N–H bonds polar (ΔEN = 0.84); Nδ⁻–Hδ⁺", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "Lone pair repels bonding pairs more strongly → angle compressed to 107° (< 109.5°)", k: ["lone pair", "repel", "repulsion", "compress", "less than 109", "<109", "smaller than"] } ],
        key: "<ul><li>Electron domains: <b>4</b> (three N–H + <b>1 lone pair</b>)</li><li>Domain geometry: <b>tetrahedral</b>; molecular geometry: <b>trigonal pyramidal</b></li><li>Bond angle: <b>≈107°</b></li><li>Bond polarity: N–H polar (ΔEN 0.84)</li><li>Molecular polarity: <b>polar</b> — pyramidal, three N–H dipoles don't cancel.</li><li>Angle smaller than 109.5° because the lone pair repels bonding pairs more strongly.</li></ul>" },
      { marks: 7,
        prompt: "<strong>H₂O (water)</strong><br>Predict the geometry and bond angle of H₂O, and explain why the bond angle is smaller than that of NH₃.",
        rubric: [
          { d: "Electron domains around O: 4 (two O–H bonds + 2 lone pairs)", k: ["lone pair", "4 electron", "four electron", "4 domain", "four domain", "2 bond", "two bond"] },
          { d: "Electron domain geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Molecular geometry: bent (V-shaped)", k: ["bent", "v-shaped", "v shaped", "angular"] },
          { d: "Bond angle ≈104.5°", k: ["104.5", "104", "105"] },
          { d: "O–H highly polar (ΔEN = 1.24); Oδ⁻–Hδ⁺", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: polar", k: ["re:(?<!non[- ]?)polar"] },
          { d: "Two lone pairs repel more than NH₃'s one → angle smaller than 107°", k: ["two lone", "2 lone", "lone pair", "repel", "repulsion", "smaller than", "less than 107", "<107", "more repul", "greater repul"] } ],
        key: "<ul><li>Electron domains: <b>4</b> (two O–H + <b>2 lone pairs</b>)</li><li>Domain geometry: <b>tetrahedral</b>; molecular geometry: <b>bent</b></li><li>Bond angle: <b>≈104.5°</b></li><li>Bond polarity: O–H highly polar (ΔEN 1.24)</li><li>Molecular polarity: <b>polar</b> — bent shape, dipoles don't cancel.</li><li>Angle < NH₃'s 107° because two lone pairs repel more than one. Order: CH₄ 109.5° → NH₃ 107° → H₂O 104.5°.</li></ul>" },
      { marks: 7,
        prompt: "<strong>CCl₄ (tetrachloromethane)</strong><br>Each C–Cl bond in CCl₄ is strongly polar. Explain why CCl₄ is nevertheless a non-polar molecule, contrasting it with CH₃Cl.",
        rubric: [
          { d: "Electron domains around C: 4 (four C–Cl bonds, no lone pairs)", k: ["4 electron", "four electron", "4 domain", "four domain", "4 region", "four region", "four bond", "4 bond"] },
          { d: "Electron domain geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Molecular geometry: tetrahedral", k: ["tetrahedral"] },
          { d: "Bond angle: 109.5°", k: ["109.5", "109"] },
          { d: "C–Cl bonds strongly polar (ΔEN = 0.61); Cδ⁺–Clδ⁻", k: ["polar", "δ", "delta"] },
          { d: "Molecule overall: non-polar", k: ["non-polar", "nonpolar", "non polar"] },
          { d: "Four identical dipoles cancel in 3-D tetrahedral symmetry; in CH₃Cl one dipole differs so cancellation fails", k: ["cancel", "symmetry", "symmetrical", "sum to zero", "add to zero", "vector", "balance", "equal", "ch3cl"] } ],
        key: "<ul><li>Electron domains: <b>4</b> (four C–Cl)</li><li>Domain & molecular geometry: <b>tetrahedral</b></li><li>Bond angle: <b>109.5°</b></li><li>Bond polarity: C–Cl strongly polar (ΔEN 0.61)</li><li>Molecular polarity: <b>non-polar</b> — four identical dipoles cancel in 3-D symmetry; in CH₃Cl one dipole differs so cancellation fails.</li></ul>" }
    ]
  }
];
const PREIB_FRQ_CH = PREIB_FRQ_SETS;

/* ---------- FRQ auto-marking ---------- */
function normAns(t) { return String(t || "").toLowerCase().replace(/[\u2018\u2019]/g, "'"); }
function hitKw(t, kw) {
  if (kw.slice(0, 3) === "re:") { try { return new RegExp(kw.slice(3)).test(t); } catch (e) { return false; } }
  return t.indexOf(kw) > -1;
}
function gradeFRQ(q, ans) {
  const t = normAns(ans);
  const points = q.rubric.map(r => ({ d: r.d, ok: r.k.some(k => hitKw(t, k)) }));
  return { points, s: points.filter(p => p.ok).length };
}

function activeChapters() {
  if (state.browse.level !== "Pre-IB") return QUIZ_DATA.chapters;
  return state.browse.paper === "FRQ" ? PREIB_FRQ_CH : PREIB_CH;
}

/* ---------- cloud reporting (Tencent CloudBase, optional) ---------- */
/* If cloud-config.js has an env id, every finished attempt is stored in the
   "attempts" table (CloudBase PostgreSQL) so the teacher can see results without score codes. */
let _tcbApp = null;
async function tcbReady() {
  if (typeof TCB_ENV === "undefined" || !TCB_ENV || typeof cloudbase === "undefined") return null;
  if (!_tcbApp) {
    _tcbApp = cloudbase.init({ env: TCB_ENV, region: (typeof TCB_REGION !== "undefined" && TCB_REGION) || "ap-shanghai" });
    const r = await _tcbApp.auth.signInAnonymously();
    if (r && r.error) throw r.error;
  }
  return _tcbApp;
}
function cloudReportAsync(data) {
  const send = d => tcbReady()
    .then(app => app && app.rdb().from("attempts").insert(d))
    .then(r => { if (r && r.error) throw r.error; });
  return send(data).catch(err => {
    if (data.data === undefined) throw err;
    return send(Object.assign({}, data, { data: undefined })).catch(() => { throw err; });   // table without the "data" column
  });
}
function cloudReport(data) {
  cloudReportAsync(data)
    .catch(err => console.warn("cloud report skipped:", err && err.message || err));
}
/* Attempts finished before cloud reporting existed live only in this browser's
   localStorage (latest one per chapter). Upload each of them once, on page load. */
function levelKeyOf(ch) { return ch.id.indexOf("preib-") === 0 ? "Pre-IB" : (ch.level2 || "SL"); }
function cloudMarkSynced(id, date) { localStorage.setItem("cloudsync:attempt:" + id, String(date)); }
async function backfillLocalAttempts() {
  try {
    if (typeof TCB_ENV === "undefined" || !TCB_ENV || typeof cloudbase === "undefined") return;
    const name = (localStorage.getItem("stuName") || "").trim();
    if (!name) return;
    const byId = {};
    [QUIZ_DATA.chapters, PREIB_CH, PREIB_FRQ_CH].forEach(list => (list || []).forEach(c => { byId[c.id] = c; }));
    const cls = currentClass();
    const pend = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("attempt:") !== 0) continue;
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
      if (!saved || saved.score === undefined) continue;
      if (localStorage.getItem("cloudsync:" + k) === String(saved.date)) continue;
      pend.push({ id: k.slice(8), saved });
    }
    for (const p of pend) {
      const ch = byId[p.id] || { id: p.id, title: p.id };
      const s = p.saved;
      await cloudReportAsync({
        n: name, cls: cls, ch: p.id, title: ch.title || p.id,
        level: levelKeyOf(ch), paper: ch.paper || (s.kind === "frq" ? "FRQ" : s.kind === "p2" ? "P2" : "MCQ"),
        s: +s.score || 0, t: +s.total || 0,
        data: JSON.stringify(s),
        detail: s.kind === "frq" && s.results ? s.results.map(r => (r && r.s) || 0).join("-")
          : s.kind === "p2" && s.marks ? (ch.questions || []).map((q, qi) => { const m = s.marks[qi]; return m ? m.g + "/" + m.t : "0/0"; }).join("-")
          : "",
        date: s.date || ""
      });
      cloudMarkSynced(p.id, s.date);
    }
  } catch (err) {
    console.warn("cloud backfill stopped:", err && err.message || err);
  }
}

/* ---------- student accounts (name + PIN) and cross-device history ---------- */
/* An account is one row in the cloud table "students": name, class and a PIN hash. Signing in
   personalises this page (a static site cannot enforce anything server-side): it fixes the name used
   for submissions, refuses submissions under a name that already belongs to an account, and lists
   every attempt stored for that name, restoring the answers so they can be reviewed. */
function cloudOn() { return typeof TCB_ENV !== "undefined" && !!TCB_ENV && typeof cloudbase !== "undefined"; }
function session() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem("session") || "null"); } catch (e) {}
  return v && v.n && v.name ? v : null;       // older sessions without a display name are signed out
}
function setSession(v) { v ? localStorage.setItem("session", JSON.stringify(v)) : localStorage.removeItem("session"); }
async function dbRows(table, filters) {
  const app = await tcbReady();
  if (!app) throw new Error("Cloud storage is not configured.");
  let q = app.rdb().from(table).select("*");
  Object.keys(filters || {}).forEach(k => { q = q.eq(k, filters[k]); });
  const r = await q;
  if (r.error) throw r.error;
  return r.data || [];
}
async function hasAccount(name) {
  if (!cloudOn() || !name) return false;
  try { return (await dbRows("students", { name: name })).length > 0; }
  catch (e) { return false; }                 // accounts not available: do not block anyone
}
function nowStamp() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtWhen(v) {
  if (!v) return "";
  const d = new Date(String(v).indexOf("T") > -1 ? v : String(v).replace(" ", "T"));
  if (isNaN(d)) return String(v);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function findChapter(id) {
  for (const list of [PREIB_CH, PREIB_FRQ_CH]) {
    const c = list.find(x => x.id === id);
    if (c) return c;
  }
  return QUIZ_DATA.chapters.find(x => x.id === id) || null;
}
function openAccount() { state.view = "account"; render(); window.scrollTo(0, 0); }
function signOut() { setSession(null); state.name = ""; refreshOwned(); refreshAssigned(); goHome(); }
let pwJustChanged = false;
function renderAccount() {
  const s = session();
  if (s) {
    const askPassword = !s.changed && !s.pwSkip;
    app.innerHTML = `
  <header class="site small"><div class="inner">
    <div class="back" onclick="goHome()">← Back</div>
    <h1>My history</h1>
    <p>Signed in as <b>${escHTML(s.name)}</b> <span class="meta">(${escHTML(s.n)})</span> · <a class="tlink" onclick="signOut()">sign out</a></p>
  </div></header>
  <main class="wrap">
    ${pwJustChanged ? `<section class="card"><div class="meta"><b>Your password has been changed.</b> Use the new one next time you sign in.</div></section>` : ""}
    ${askPassword ? `<section class="card">
      <div class="listhead">Choose your own password</div>
      <p class="footnote" style="margin-top:4px">Your account still uses the class starting password, which everyone knows. Pick a password of your own to keep your results private — you can do this <b>once</b>.</p>
      <div class="namebar">
        <input type="password" id="np1" autocomplete="new-password" placeholder="New password (4–32 characters)">
        <input type="password" id="np2" autocomplete="new-password" placeholder="Repeat new password">
        <button onclick="changePassword()">Save new password</button>
        <a class="tlink" style="margin-left:8px" onclick="skipPasswordChange()">not now</a>
      </div>
      <div class="meta" id="pwErr" style="color:#9B2C2C; min-height:20px"></div>
    </section>` : ""}
    <section class="card"><div id="historyBox"><div class="meta">Loading your attempts…</div></div></section>
  </main>`;
    pwJustChanged = false;
    loadHistory();
    return;
  }
  app.innerHTML = `
  <header class="site small"><div class="inner">
    <div class="back" onclick="goHome()">← Back</div>
    <h1>Student sign-in</h1>
    <p>Use the email address your teacher has on the class roster.</p>
  </div></header>
  <main class="wrap">
    <section class="card">
      <div class="namebar"><label for="accEmail">Email</label>
        <input type="email" id="accEmail" autocomplete="username" placeholder="name@example.com" value="${escAttr(localStorage.getItem("accEmail") || "")}" onkeydown="if (event.key === 'Enter') accountSignIn()"></div>
      <div class="namebar"><label for="accPass">Password</label>
        <input type="password" id="accPass" autocomplete="current-password" placeholder="Password" onkeydown="if (event.key === 'Enter') accountSignIn()">
        <button onclick="accountSignIn()">Sign in</button></div>
      <div class="meta" id="accErr" style="color:#9B2C2C; min-height:20px"></div>
      <div class="footnote" style="border:0; padding:6px 0 0">Accounts are set up by your teacher. The starting password is <b>123456</b>; you will be asked to choose your own the first time you sign in. Keep your password private — anyone who knows it can sign in as you.</div>
    </section>
  </main>`;
}
async function accountSignIn() {
  const errEl = document.getElementById("accErr");
  const emailEl = document.getElementById("accEmail"), passEl = document.getElementById("accPass");
  const email = MB_email(emailEl.value), pass = passEl.value;
  errEl.textContent = "";
  if (email.indexOf("@") < 1) { errEl.textContent = "Please enter your school email address."; emailEl.focus(); return; }
  if (!pass) { errEl.textContent = "Please enter your password."; passEl.focus(); return; }
  if (!cloudOn()) { errEl.textContent = "Accounts are not available right now (cloud storage is off)."; return; }
  document.querySelectorAll("button").forEach(b => { b.disabled = true; });
  try {
    let rows = [];
    try { rows = await dbRows("students", { n: email }); }
    catch (e) {
      errEl.textContent = "Accounts are not available right now (" + (e.code || e.message || e) + ").";
      return;
    }
    if (!rows.length) {
      errEl.textContent = "No account exists for " + email + ". Accounts are created by your teacher — check the address you typed (it is the one on the class roster).";
      return;
    }
    if (rows[0].pin !== await MB_pinHash(email, pass)) {
      errEl.textContent = "That password does not match this account.";
      passEl.focus();
      return;
    }
    localStorage.setItem("accEmail", email);
    const name = rows[0].name || email;
    setSession({ n: email, name: name, changed: !!rows[0].changed, cls: rows[0].cls || "", t: Date.now() });
    localStorage.setItem("stuName", name);
    state.name = name;
    refreshOwned();
    refreshAssigned();
    renderAccount();
  } catch (e) {
    errEl.textContent = "Sign-in failed: " + (e.message || e);
  } finally {
    document.querySelectorAll("button").forEach(b => { b.disabled = false; });
  }
}
function skipPasswordChange() {
  setSession(Object.assign({}, session(), { pwSkip: true }));
  renderAccount();
}
async function changePassword() {
  const me = session(), errEl = document.getElementById("pwErr");
  const p1 = document.getElementById("np1").value, p2 = document.getElementById("np2").value;
  errEl.textContent = "";
  if (!MB_validPassword(p1)) { errEl.textContent = "Use 4 to 32 characters: letters, digits or !@#$%^&*_.-"; return; }
  if (p1 === MB_DEFAULT_PASSWORD) { errEl.textContent = "Choose a different password from the starting one."; return; }
  if (p1 !== p2) { errEl.textContent = "The two passwords do not match."; document.getElementById("np2").focus(); return; }
  if (!cloudOn()) { errEl.textContent = "Accounts are not available right now."; return; }
  document.querySelectorAll("button").forEach(b => { b.disabled = true; });
  try {
    const app = await tcbReady();
    const r = await app.rdb().from("students").update({ pin: await MB_pinHash(me.n, p1), changed: true }).eq("n", me.n);
    if (r.error) throw r.error;
    setSession({ n: me.n, name: me.name, changed: true, t: me.t });
    pwJustChanged = true;
    renderAccount();
  } catch (e) {
    errEl.textContent = "Could not save the new password: " + (e.message || e);
  } finally {
    document.querySelectorAll("button").forEach(b => { b.disabled = false; });
  }
}
async function loadHistory() {
  const box = document.getElementById("historyBox"), me = session();
  if (!box || !me) return;
  let rows = [];
  try {
    const app = await tcbReady();
    let skip = 0;
    while (true) {                                   // newest first, 1000 rows at a time
      const r = await app.rdb().from("attempts").select("*").eq("n", me.name).order("id", { ascending: false }).range(skip, skip + 999);
      if (r.error) throw r.error;
      const part = r.data || [];
      rows = rows.concat(part);
      if (part.length < 1000 || skip >= 9000) break;
      skip += 1000;
    }
  } catch (e) {
    box.innerHTML = `<div class="meta" style="color:#9B2C2C">Could not load your attempts: ${escHTML(e.message || String(e))}</div>`;
    return;
  }
  const seen = {};
  const items = rows.map(r => {
    const ch = findChapter(r.ch), latest = !seen[r.ch];
    seen[r.ch] = true;
    const lvl = ch ? (ch.id.indexOf("preib-") === 0 ? "Pre-IB" : LEVEL_LABELS[ch.level2 || "SL"]) : (LEVEL_LABELS[r.level] || r.level || "");
    const isMCQ = (ch ? ch.paper : r.paper) === "MCQ" || (ch ? ch.paper : r.paper) === undefined;
    const restorable = !!ch && (isMCQ || !!r.data);     // multiple choice can always be reopened (chosen letters, or just the key)
    const action = restorable
      ? `<button class="ghost" data-row="${escAttr(JSON.stringify(r))}" onclick="reviewFromHistory(this)">${latest ? "Review" : "View"}</button>`
      : `<span class="meta">score only</span>`;
    return `<div class="chapter${ch && !isAllowed(ch) ? " locked" : ""}">
      <div class="chapter-main"><div class="chapter-no small">${latest ? "latest" : "earlier"}</div>
        <div><h3>${escHTML(r.title || r.ch)}</h3>
          <div class="meta">${escHTML(lvl)} · ${fmtWhen(r.date || r.created_at)}</div></div>
      </div>${action}<div class="badge">${+r.s || 0}/${+r.t || 0}</div></div>`;
  });
  box.innerHTML = rows.length
    ? `<div class="meta" style="margin-bottom:10px">${rows.length} attempt${rows.length === 1 ? "" : "s"} on record · newest first</div>${items.join("")}`
    : `<div class="meta">Nothing is stored for your name yet. Finish a quiz and it will appear here.</div>`;
}
function reviewFromHistory(el) {
  let r;
  try { r = JSON.parse(el.dataset.row); } catch (e) { return; }
  const ch = findChapter(r.ch);
  if (!ch) { alert("This quiz is no longer available."); return; }
  if (!isAllowed(ch)) { alert("This quiz is not unlocked by the access code on this device."); return; }
  const kind = ch.paper === "FRQ" ? "frq" : isStructPaper(ch.paper) ? "p2" : "mcq";
  let saved = null;
  try { saved = r.data ? JSON.parse(r.data) : null; } catch (e) {}
  if (!saved && kind === "mcq") {                   // rows written before full answers were stored
    saved = { answers: {} };
    const answers = {};
    String(r.detail).split("").forEach((c, i) => { const k = "ABCD".indexOf(c); if (k > -1) answers[i] = k; });
    saved = { answers };
  }
  if (!saved || !saved.answers) { alert("This earlier attempt only kept the score, not your answers."); return; }
  state.browse = { level: ch.id.indexOf("preib-") === 0 ? "Pre-IB" : (ch.level2 || "SL"), paper: ch.paper || "MCQ" };
  const idx = activeChapters().indexOf(ch);
  if (idx < 0) { alert("This quiz could not be opened."); return; }
  state = Object.assign({}, state, { view: "quiz", chapter: idx, name: session().name, answers: saved.answers || {},
    marks: saved.marks || {}, frqResults: saved.results || null, page: 0, submitted: true, marking: false,
    reviewDate: r.date || "", reviewOnly: true });
  render(); window.scrollTo(0, 0);
}

/* ---------- quizzes the student has already finished ---------- */
/* The teacher hands out a new access code for each task, so earlier chapters drop out of the code.
   A quiz the student has finished (saved on this device, or on record for their account) stays
   open for them; chapters that were never assigned and never done remain locked. */
let ownedIds = new Set();
function refreshOwned() {
  ownedIds = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf("attempt:") === 0) ownedIds.add(k.slice(8));
  }
  const me = session();
  if (me && cloudOn()) {
    dbRows("attempts", { n: me.name }).then(rows => {
      rows.forEach(r => { if (r.ch) ownedIds.add(r.ch); });
      if (state.view === "home") render();
    }).catch(() => {});
  }
}

/* ---------- tasks the teacher has assigned to the student's class ---------- */
/* Rows of the cloud table "assignments": one per (class, quiz). Read after sign-in; they open the
   quiz for every signed-in student of that class until the teacher removes the row. */
let assignedIds = new Set(), assignedList = [];
function refreshAssigned() {
  assignedIds = new Set(); assignedList = [];
  const me = session();
  if (!me || !cloudOn()) return Promise.resolve();
  return (async () => {
    if (!me.cls) {                                  // sessions saved before the class was stored with them
      const acc = await dbRows("students", { n: me.n });
      if (!acc.length || !acc[0].cls) return;
      me.cls = acc[0].cls;
      setSession(me);
    }
    const rows = await dbRows("assignments", { cls: me.cls }).catch(() => []);
    rows.slice().sort((x, y) => (+x.id || 0) - (+y.id || 0)).forEach(r => {
      if (r.ch && !assignedIds.has(r.ch)) { assignedIds.add(r.ch); assignedList.push(r); }
    });
  })().then(() => { if (state.view === "home") render(); }).catch(() => {});
}
function openById(id) {
  const ch = findChapter(id);
  if (!ch || !isAllowed(ch)) { lockedClick(); return; }
  state.browse = { level: levelKeyOf(ch), paper: ch.paper || "MCQ" };
  const idx = activeChapters().indexOf(ch);
  if (idx < 0) return;
  openChapter(idx);
}
function tasksHTML() {
  const head = `<div class="listhead">My tasks — set by your teacher</div>`;
  if (!assignedList.length) return head + `<div class="card tasks"><div class="meta">No task has been set for your class yet. Check back after your lesson.</div></div>`;
  const items = assignedList.map(r => {
    const ch = findChapter(r.ch);
    if (!ch) return "";
    const when = fmtWhen(r.created_at || r.date || "");
    const setOn = when ? " · set " + escHTML(when.slice(0, 10)) : "";
    return `<div class="chapter task" onclick="openById('${escAttr(r.ch)}')">
      <div class="chapter-main"><div class="chapter-no small">${escHTML(LEVEL_LABELS[levelKeyOf(ch)] || "")}</div>
        <div><h3>${escHTML(ch.title)}</h3>
          <div class="meta">${escHTML(paperLabel(levelKeyOf(ch), ch.paper || "MCQ"))} · ${ch.questions.length} questions${setOn}</div></div>
      </div><div class="badge">Open</div></div>`;
  }).join("");
  return head + items;
}

/* ---------- platform embed: access, saved attempts and review come from the ibchemni site ---------- */
/* In embed mode the quiz asks the site's own API (same origin, session cookie) what the signed-in
   student may open, reports every finished attempt there, and can replay one of them read-only. */
let platformReady = false, platformSignedIn = false, platformSaveNote = "";
async function platformJson(url, options) {
  const r = await fetch(url, Object.assign({ credentials: "same-origin" }, options || {}));
  let data = null;
  try { data = await r.json(); } catch (e) { /* non-JSON error page */ }
  return { status: r.status, data: data || {} };
}
/* Attempts that could not be saved (offline, signed out meanwhile) wait here and are sent again
   on the next visit. */
async function sendAttempt(payload) {
  const r = await platformJson("/api/practice/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (r.status === 401) platformSignedIn = false;
  return !!(r.data && r.data.ok);
}
function queuePendingAttempt(payload) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem("pendingAttempts") || "[]"); } catch (e) {}
  list.push(payload);
  localStorage.setItem("pendingAttempts", JSON.stringify(list.slice(-20)));
}
async function flushPendingAttempts() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem("pendingAttempts") || "[]"); } catch (e) {}
  if (!list.length) return;
  const rest = [];
  for (const payload of list) {
    let sent = false;
    if (platformSignedIn) {
      try { sent = await sendAttempt(payload); } catch (e) { /* offline: keep it for later */ }
    }
    if (!sent) rest.push(payload);
  }
  localStorage.setItem("pendingAttempts", JSON.stringify(rest));
}
async function platformReport(payload) {
  let sent = false;
  try { sent = await sendAttempt(payload); } catch (e) { /* offline */ }
  if (!sent) throw new Error("attempt not saved");
}
function setSaveNote(html) {
  platformSaveNote = html;
  const el = document.getElementById("saveNote");
  if (el) el.innerHTML = html;
}
/* The account's latest attempt of every chapter, so cards show "last score" on any device. */
async function hydrateFromPlatform() {
  const r = await platformJson("/api/practice/attempts");
  if (!(r.data && r.data.ok)) return;                          // list unreadable: keep what this device has
  const latest = r.data.latest || {};
  for (let i = localStorage.length - 1; i >= 0; i--) {        // this device now mirrors this account only
    const k = localStorage.key(i);
    if (k && k.indexOf("attempt:") === 0) localStorage.removeItem(k);
  }
  Object.keys(latest).forEach(id => {
    const saved = latest[id].saved;
    if (saved && saved.score !== undefined) localStorage.setItem("attempt:" + id, JSON.stringify(saved));
  });
}
function renderPlatformReviewFailed(status) {
  app.innerHTML = `
  <header class="site small"><div class="inner"><div class="back" onclick="goHome()">← Back</div><h1>Attempt not available</h1></div></header>
  <main class="wrap"><section class="card"><div class="meta">${status === 401
    ? "Sign in to see this attempt." : status === 404
    ? "This attempt does not exist, or it belongs to another account." : "The attempt could not be loaded. Please try again in a moment."}</div></section></main>`;
}
function showPlatformReview(a) {
  const ch = findChapter(a.chapterId), saved = a.answers || {};
  if (!ch || !saved.answers || saved.kind === "frq") { renderPlatformReviewFailed(404); return; }
  state.browse = { level: levelKeyOf(ch), paper: ch.paper || "MCQ" };
  const idx = activeChapters().indexOf(ch);
  if (idx < 0) { renderPlatformReviewFailed(404); return; }
  platformSignedIn = true;
  state = Object.assign({}, state, { view: "quiz", chapter: idx, name: localStorage.getItem("stuName") || "",
    answers: saved.answers || {}, marks: saved.marks || {}, frqResults: null, page: 0, submitted: true, marking: false,
    reviewDate: fmtWhen(a.createdAt), reviewOnly: true });
  render(); window.scrollTo(0, 0);
}
async function platformBoot() {
  if (!ENTRY) return;
  localStorage.removeItem("access");                 // never carry another account's unlock over
  try {
    const r = await platformJson("/api/quiz/access?entry=" + encodeURIComponent(ENTRY.name));
    platformSignedIn = !!(r.data && r.data.ok);
    if (platformSignedIn) {
      localStorage.setItem("access", JSON.stringify({ cls: r.data.cls, allow: r.data.allow || [] }));
      localStorage.setItem("stuName", r.data.name || "");
      state.name = r.data.name || "";
    } else {
      localStorage.removeItem("stuName");
    }
    if (ENTRY.review) {                              // read-only replay of one saved attempt
      const a = await platformJson("/api/practice/attempts/" + encodeURIComponent(ENTRY.review));
      if (a.data && a.data.ok && a.data.attempt) showPlatformReview(a.data.attempt); else renderPlatformReviewFailed(a.status);
      return;
    }
    if (platformSignedIn) {
      await hydrateFromPlatform();
      flushPendingAttempts();
    }
  } catch (err) {
    console.warn("platform access unavailable:", err && err.message || err);
  }
  platformReady = true;
  if (state.view === "home") render();
}

/* ---------- access codes ---------- */
function hash6(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function b64urlEnc(s) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDec(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(s + "===".slice((s.length + 3) % 4))));
}
function encodeAccess(cls, allow) {
  const payload = JSON.stringify({ c: cls, a: allow });
  return "IBQ." + b64urlEnc(payload) + "." + hash6(payload);
}
function decodeAccess(code) {
  const parts = String(code || "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== "IBQ") throw new Error("format");
  const payload = b64urlDec(parts[1]);
  if (hash6(payload) !== parts[2]) throw new Error("checksum");
  return JSON.parse(payload);
}
function getAccess() {
  let a = null;
  try { a = JSON.parse(localStorage.getItem("access") || "null"); } catch (e) { return null; }
  // An all-chapters code only works for the teacher. Students used to get such codes; tasks are now
  // assigned per class instead (teacher.html section 1), so an old one stored on a student's device unlocks nothing.
  if (a && Array.isArray(a.allow) && a.allow[0] === "*" && a.cls !== "TEACHER") { localStorage.removeItem("access"); return null; }
  return a;
}
function currentClass() { return (session() && session().cls) || (getAccess() || {}).cls || ""; }
/* A rule from the platform is a quiz chapter id, "level:<SL|HL|SLP|HLP>" or "paper:<MCQ|P2|P1B>". */
function ruleOpens(rule, ch) {
  if (rule === "*") return true;
  if (rule === ch.id) return true;
  if (rule.indexOf("level:") === 0) return (ch.level2 || "SL") === rule.slice(6);
  if (rule.indexOf("paper:") === 0) return (ch.paper || "MCQ") === rule.slice(6);
  return false;
}
function isAllowed(ch) {
  if (ENTRY) {                                   // embed: only what the platform opened for this session
    const a = getAccess();
    return !!a && (a.allow || []).some(r => ruleOpens(r, ch));
  }
  if (ownedIds.has(ch.id) || assignedIds.has(ch.id)) return true;   // finished earlier, or assigned to the class
  if (ch._src && ch._src.some(id => assignedIds.has(id))) return true;
  const a = getAccess();
  if (!a) return false;
  if (a.allow[0] === "*") return true;
  if (ch._src) return ch._src.some(id => a.allow.indexOf(id) > -1);
  return a.allow.indexOf(ch.id) > -1;
}
function applyCode() {
  const input = document.getElementById("accessInput");
  try {
    const obj = decodeAccess(input.value);
    if (obj.a[0] === "*" && obj.c !== "TEACHER") {
      alert("This all-chapters code is for the teacher only. Sign in with your school email instead: the tasks your teacher has assigned to your class are open for you.");
      return;
    }
    localStorage.setItem("access", JSON.stringify({ cls: obj.c, allow: obj.a }));
    render();
  } catch (e) {
    alert("That code is not valid. Please check it and try again.");
    input.focus();
  }
}
function clearAccess() {
  localStorage.removeItem("access");
  render();
}
function lockedClick() {
  if (ENTRY) {
    alert(platformSignedIn
      ? "This set is not open for your account yet. Ask IB chem Ni to unlock it."
      : "Sign in first: the sets opened for your account appear here after you sign in.");
    return;
  }
  alert("This section is locked. Please enter the access code your teacher gave you.");
  const el = document.getElementById("accessInput");
  if (el) el.focus();
}

/* ---------- Topical Learning: interactive self-study courses ---------- */
/* Courses live in topical-learning/<slug>/ next to this app and open in a new tab. The teacher
   unlocks them per student on the platform (Admin → practice unlocks, QuizGrant item
   "course:<id>"); the rule travels to this app through /api/quiz/access like every other
   hand-unlocked set, so nothing here is open by default. */
const COURSES = [
  { id: "tl-s32", rule: "course:tl-s32", path: "topical-learning/s32-organic-structure/index.html",
    tag: "S3.2", title: "Organic Chemistry — Structure",
    meta: "Self-study course · Cambridge Ch.11 backbone · 5 modules · 30 worked examples, practice sets, 42 checkpoint questions · Apple Pencil sketching" }
];
function courseAllowed(c) {
  const a = getAccess();
  if (ENTRY) return !!a && (a.allow || []).some(r => r === "*" || r === c.rule);
  if (assignedIds.has(c.rule)) return true;
  return !!a && (a.allow[0] === "*" || a.allow.indexOf(c.rule) > -1);
}
function openCourse(id) {
  const c = COURSES.find(x => x.id === id);
  if (!c || !courseAllowed(c)) { lockedClick(); return; }
  const base = location.pathname.replace(/\/[^\/]*$/, "/");   // folder this index.html lives in
  window.open(base + c.path, "_blank");
}
function renderTLHome() {
  const me = session(), acc = getAccess();
  const authBar = ENTRY
    ? (platformSignedIn
      ? `<div class="authbar"><button class="btn-auth light" onclick="platformGo('/my-practice')">My practice record</button></div>`
      : `<div class="authbar"><button class="btn-auth light" onclick="platformGo('/login')">Sign in</button></div>`)
    : me
      ? `<div class="authbar"><button class="btn-auth light" onclick="openAccount()">My history</button><button class="btn-auth light" onclick="signOut()">Sign out</button></div>`
      : `<div class="authbar"><button class="btn-auth" onclick="openAccount()">Sign in</button></div>`;
  const levelTabs = (ENTRY ? ENTRY.levels : LEVELS).map(l =>
    `<button class="pill${l === "TL" ? " on" : ""}" onclick="setLevel('${l}')">${LEVEL_LABELS[l] || l}</button>`).join("");
  const cards = COURSES.map(c => {
    const allowed = courseAllowed(c);
    return `<div class="chapter${allowed ? "" : " locked"}" onclick="${allowed ? `openCourse('${c.id}')` : "lockedClick()"}">
      <div class="chapter-main">
        <div class="chapter-no">${c.tag}</div>
        <div>
          <h3>${escHTML(c.title)}</h3>
          <div class="meta">${escHTML(c.meta)}</div>
        </div>
      </div>
      <div class="badge${allowed ? "" : " lock"}">${allowed ? "Open course" : "Locked"}</div>
    </div>`;
  }).join("");
  const openHere = COURSES.filter(courseAllowed).length;
  const accBar = ENTRY
    ? `<div class="codebar"><div class="acc-status" id="accStatus">${!platformSignedIn
        ? `<b>Sign in</b> to open the courses your teacher has unlocked for you.`
        : openHere
          ? `Open for you: <b>${openHere} of ${COURSES.length}</b> interactive course${COURSES.length === 1 ? "" : "s"}. Progress and sketches are saved in the course tab on this device.`
          : `No course is open for your account yet. Ask IB chem Ni to unlock it.`}</div></div>`
    : `<div class="codebar"><div class="acc-status">${me
        ? `Signed in to <b>${escHTML(me.cls || "your class")}</b> — courses unlocked for your account open below`
        : `Locked — <b>sign in</b> to open the courses unlocked for your account, or enter an access code`}</div></div>`;
  app.innerHTML = `
  <header class="site"><div class="inner">
    ${authBar}
    <div class="kicker">${QUIZ_DATA.course} · Topic practice &amp; past papers</div>
    <h1>${ENTRY ? "Choose your chapter" : "Choose your level and paper"}</h1>
    <p>${ENTRY
      ? "Interactive self-study courses. Ask your teacher to unlock a course, then open it here — your progress is kept on this device."
      : "Interactive self-study courses, unlocked by your teacher. Real IB questions, by topic or as complete papers, stay in the other tabs."}</p>
  </div></header>
  <main class="wrap">
    <div class="lvlrow">${levelTabs}</div>
    ${accBar}
    <div class="listhead">Topical Learning · interactive courses</div>
    ${cards}
    <div class="footnote">Each course is a full self-study unit: fill-in concept builders, worked examples from the Cambridge Coursebook with instant feedback, practice sets, checkpoint quizzes and free-hand sketching with Apple Pencil.${ENTRY ? "" : `<br><a class="tlink" href="teacher.html">Teacher view</a>`}</div>
  </main>`;
}

function srcLabel(src) {
  if (/^Q\d+$/.test(src || "")) return "";               // past-paper sets: the number is already printed
  const m = /_(SL|HL)_(\w+?)_(\d{4})_Q(\d+)$/.exec(src || "");
  if (!m) return src || "";
  return `${m[3]} ${m[2]} · Q${m[4]}`;
}
function isRight(q, a) { return a !== undefined && a !== null && (a === q.answer || (q.alt || []).indexOf(a) > -1); }
function answerText(q) {
  return [q.answer].concat(q.alt || []).filter((v, i, arr) => arr.indexOf(v) === i).map(v => "ABCD"[v]).join(" / ");
}

function escAttr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

function chapterStats(ch) {
  const saved = JSON.parse(localStorage.getItem("attempt:" + ch.id) || "null");
  return saved;
}

function render() {
  if (state.view === "home") renderHome();
  else if (state.view === "quiz") renderQuiz();
  else if (state.view === "account") renderAccount();
  else renderResult();
}

function renderHome() {
  if (ENTRY && !platformReady) {                 // waiting for the platform to say what this session may open
    app.innerHTML = `
  <header class="site"><div class="inner"><div class="kicker">${QUIZ_DATA.course} · Topic practice &amp; past papers</div><h1>Choose your chapter</h1></div></header>
  <main class="wrap"><section class="card"><div class="meta">Opening your chapters…</div></section></main>`;
    return;
  }
  if (state.browse.level === "TL") { renderTLHome(); return; }
  const { level, paper } = state.browse;
  const all = activeChapters();
  const group = all.map((ch, i) => ({ ch, i }))
    .filter(x => (x.ch.level2 || "SL") === (level === "Pre-IB" ? "SL" : level) && (x.ch.paper || "MCQ") === paper);
  const total = group.reduce((s, x) => s + x.ch.questions.length, 0);
  const hasBank = group.length > 0;
  const acc = getAccess();
  const me = session();
  const accLine = me
    ? `Signed in as <b>${escHTML(me.name)}</b> · <a class="tlink" onclick="openAccount()">My history</a> · <a class="tlink" onclick="signOut()">sign out</a>`
    : `<button class="btn-auth wide" onclick="openAccount()">Sign in with your school email</button>
       <div class="meta" style="margin-top:6px">Sign in to open the tasks your teacher sets for your class and to keep your results.</div>`;
  const authBar = ENTRY
    ? (platformSignedIn
      ? `<div class="authbar"><button class="btn-auth light" onclick="platformGo('/my-practice')">My practice record</button></div>`
      : `<div class="authbar"><button class="btn-auth light" onclick="platformGo('/login')">Sign in</button></div>`)
    : me
    ? `<div class="authbar"><button class="btn-auth light" onclick="openAccount()">My history</button><button class="btn-auth light" onclick="signOut()">Sign out</button></div>`
    : `<div class="authbar"><button class="btn-auth" onclick="openAccount()">Sign in</button></div>`;

  const cards = group.map(x => {
    const ch = x.ch, i = x.i;
    const a = chapterStats(ch);
    const allowed = isAllowed(ch);
    const badge = !allowed
      ? `<div class="badge lock">Locked</div>`
      : (a ? `<div class="badge done">${a.score}/${a.total}</div>` : `<div class="badge">${ch.questions.length} Q</div>`);
    const isSub = ch.id.indexOf(".") > -1;
    const tag = isSub ? ch.id.replace("ch", "") : String(group.indexOf(x) + 1).padStart(2, "0");
    const groupLabel = ch.id === "ch4.1"
      ? `<div class="sublabel">Ch4 · Chemical Bonding &amp; Structure — split into three parts</div>` : "";
    return `${groupLabel}<div class="chapter${isSub ? " sub" : ""}${allowed ? "" : " locked"}"
      onclick="${allowed ? `openChapter(${i})` : "lockedClick()"}">
      <div class="chapter-main">
        <div class="chapter-no${isSub ? " small" : ""}">${tag}</div>
        <div>
          <h3>${ch.title}</h3>
          <div class="meta">${ch.level}${a ? " · last score " + a.score + "/" + a.total : ""}</div>
        </div>
      </div>${badge}
    </div>`;
  }).join("");

  const openHere = group.filter(x => isAllowed(x.ch)).length;
  const emptyCard = hasBank ? "" : `
    <div class="chapter placeholder">
      <div>
        <h3>No question bank here yet</h3>
        <div class="meta">${LEVEL_LABELS[level] || level} · ${paperLabel(level, paper)} — this section opens once the question bank is imported.</div>
      </div>
    </div>`;

  const codeRow = open => open
    ? `<div class="acc-row">
        <input type="text" id="accessInput" placeholder="Access code, e.g. IBQ.eyJjIjoiRFIyQSJ9.k3v2q" spellcheck="false">
        <button onclick="applyCode()">Unlock</button>
      </div>`
    : `<details class="codesmall"><summary>Or open a quiz with an access code</summary>
        <div class="acc-row" style="margin-top:8px">
          <input type="text" id="accessInput" placeholder="Access code, e.g. IBQ.eyJjIjoiRFIyQSJ9.k3v2q" spellcheck="false">
          <button onclick="applyCode()">Unlock</button>
        </div></details>`;
  const accBar = ENTRY
    ? `<div class="codebar"><div class="acc-status" id="accStatus">${!platformSignedIn
        ? `<b>Sign in</b> to open the sets unlocked for your account and to keep your results.`
        : acc && acc.allow[0] === "*"
          ? `Open for you: <b>all chapters</b> (teacher).`
          : openHere
            ? `Open for you here: <b>${openHere} of ${group.length}</b> chapter${group.length === 1 ? "" : "s"}. Results are saved to your practice record.`
            : `No chapter here is open for your account yet. Ask IB chem Ni to unlock it.`}</div></div>`
    : `
    <div class="codebar">
      <div class="acc-status" id="accStatus">${me
        ? `Signed in to <b>${escHTML(me.cls || "your class")}</b> — tasks your teacher has set for your class are open below`
        : acc
          ? `Unlocked as class <b>${escHTML(acc.cls)}</b> · ${acc.allow[0] === "*" ? "all chapters" : acc.allow.length + " chapter(s)"} <a class="tlink" onclick="clearAccess()">switch code</a>`
          : `Locked — <b>sign in</b> to open the tasks your teacher sets, or enter an access code`}</div>
      ${me ? "" : accLine}
      ${me && !acc ? "" : codeRow(me || acc)}
      ${me ? `<div class="accline" id="accLine">${accLine}</div>` : ""}
    </div>
    ${me ? `<div id="taskBox">${tasksHTML()}</div>` : ""}`;

  const paperTabs = (ENTRY ? ENTRY.papers : (LEVEL_PAPERS[level] || PAPERS)).map(p =>
    `<button class="tab${p === paper ? " on" : ""}" onclick="setPaper('${p}')">${paperLabel(level, p)}</button>`).join("");
  const levelTabs = (ENTRY ? ENTRY.levels : LEVELS).map(l =>
    `<button class="pill${l === level ? " on" : ""}" onclick="setLevel('${l}')">${LEVEL_LABELS[l] || l}</button>`).join("");
  const heading = `${LEVEL_LABELS[level] || level} · ${paperLabel(level, paper)}`;
  app.innerHTML = `
  <header class="site"><div class="inner">
    ${authBar}
    <div class="kicker">${QUIZ_DATA.course} · Topic practice &amp; past papers</div>
    <h1>${ENTRY ? "Choose your chapter" : "Choose your level and paper"}</h1>
    <p>${ENTRY
      ? "Real IB questions by syllabus unit. Chapters unlocked for your account open below — no extra sign-in needed."
      : "Real IB questions, by topic or as complete papers. Sign in with your school email to see the tasks your teacher sets."}</p>
  </div></header>
  <main class="wrap">
    <div class="lvlrow">${levelTabs}</div>
    <div class="tabs">${paperTabs}</div>
    ${accBar}
    <div class="listhead">${heading}${hasBank ? ` · ${total} questions` : ""}</div>
    ${cards}${emptyCard}
    <div class="footnote">Every question keeps its original diagram or structure, so figures stay exact. Your score is shown immediately after submission, with the correct answer for each question.${ENTRY ? "" : `<br><a class="tlink" href="teacher.html">Teacher view</a>`}</div>
  </main>`;
}

function escHTML(s) { return String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }
function setLevel(l) {
  if (ENTRY && ENTRY.levels.indexOf(l) === -1) return;
  state.browse.level = l;
  const papers = ENTRY ? ENTRY.papers : (LEVEL_PAPERS[l] || PAPERS);
  if (papers.indexOf(state.browse.paper) === -1) state.browse.paper = ENTRY ? ENTRY.papers[0] : "MCQ";
  if (state.view !== "home") state.view = "home";
  render();
}
function setPaper(p) { if (ENTRY && ENTRY.papers.indexOf(p) === -1) return; state.browse.paper = p; if (state.view !== "home") state.view = "home"; render(); }

function openChapter(i) {
  const ch = activeChapters()[i];
  if (!isAllowed(ch)) { lockedClick(); return; }
  state = { view: "quiz", chapter: i, name: localStorage.getItem("stuName") || "", answers: {}, marks: {}, page: 0, submitted: false, marking: false,
    browse: state.browse, frqResults: null, reviewDate: null };
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("attempt:" + ch.id) || "null"); } catch (e) {}
  if (ch.paper === "FRQ" && saved && saved.kind === "frq") {
    state.answers = saved.answers || {};
    state.frqResults = saved.results || ch.questions.map((q, qi) => gradeFRQ(q, state.answers[qi]));
    state.submitted = true;
    state.reviewDate = saved.date || "";
  }
  if (isStructPaper(ch.paper) && saved && saved.kind === "p2") {
    state.answers = saved.answers || {};
    state.marks = saved.marks || {};
    state.submitted = true;
    state.reviewDate = saved.date || "";
  }
  render(); window.scrollTo(0, 0);
}

function reviewAttempt() { state.view = "quiz"; render(); window.scrollTo(0, 0); }
function startFresh() {
  if (ENTRY) {
    const ch = activeChapters()[state.chapter];
    if (!ch || !isAllowed(ch)) { lockedClick(); return; }
    if (ENTRY.review) { platformGo(ENTRY.home); return; }       // practising again starts from the chapter list
  }
  state.answers = {}; state.marks = {}; state.frqResults = null; state.submitted = false; state.marking = false; state.reviewDate = null; state.reviewOnly = false; state.page = 0;
  render(); window.scrollTo(0, 0);
}

/* ---------- Paper 2 (structured questions + mark scheme self-marking) ---------- */
function p2QuestionHTML(q, qi) {
  const writing = !state.submitted && !state.marking;
  if (writing) {
    return `<article class="q p2">
      <div class="qtop"><span class="qidx">${qi + 1}</span><span class="qsrc">${srcLabel(q.src)}</span></div>
      <img class="qimg" src="${q.img}" alt="Question ${qi + 1}" loading="lazy">
      <textarea class="frqbox" data-q="${qi}" oninput="typeAns(this)" placeholder="Type your key answers here (optional — you can also work on paper)...">${escHTML(state.answers[qi] || "")}</textarea>
    </article>`;
  }
  const given = String(state.answers[qi] || "").trim();
  const m = state.marks[qi];
  const scoreCtl = state.marking
    ? `<div class="markrow">
         <label>My mark for this question:</label>
         <input type="number" class="mkin" min="0" step="1" value="${m ? m.g : 0}" data-q="${qi}" data-k="g" oninput="markInput(this)"> /
         <input type="number" class="mkin" min="0" step="1" placeholder="total" value="${m ? m.t : ""}" data-q="${qi}" data-k="t" oninput="markInput(this)">
       </div>`
    : `<div class="frqscore ${m && m.g === m.t ? "full" : !m || m.g === 0 ? "zero" : ""}">${m ? m.g + " / " + m.t : "not marked"}</div>`;
  return `<article class="q p2 graded">
    <div class="qtop"><span class="qidx">${qi + 1}</span><span class="qsrc">${srcLabel(q.src)}</span></div>
    <img class="qimg" src="${q.img}" alt="Question ${qi + 1}" loading="lazy">
    <div class="frqgiven"><div class="frqlabel">Your notes / answers</div>
      <div class="frqtext${given ? "" : " empty"}">${given ? escHTML(given).replace(/\n/g, "<br>") : "<i>Worked on paper</i>"}</div></div>
    <div class="msblock"><div class="frqlabel">Official mark scheme — check each marking point, then enter your mark above</div>
      ${q.ms
        ? `<img class="qimg msimg" src="${q.ms}" alt="Mark scheme ${qi + 1}" loading="lazy">`
        : `<div class="msmissing">Official mark scheme not available for this question yet — use the mark totals printed on the question paper, or ask your teacher.</div>`}</div>
    ${scoreCtl}
  </article>`;
}

function frqQuestionHTML(q, qi) {
  if (!state.submitted) {
    return `<article class="q frq">
      <div class="qtop"><span class="qidx">${qi + 1}</span><span class="qsrc">[${q.marks} marks]</span></div>
      <div class="frqprompt">${q.prompt}</div>
      <textarea class="frqbox" data-q="${qi}" oninput="typeAns(this)" placeholder="Type your answer here...">${escHTML(state.answers[qi] || "")}</textarea>
    </article>`;
  }
  const res = (state.frqResults && state.frqResults[qi]) || { points: q.rubric.map(r => ({ d: r.d, ok: false })), s: 0 };
  const pts = res.points.map(p =>
    `<li class="${p.ok ? "pt ok" : "pt no"}"><span class="ptmark">${p.ok ? "✓" : "✗"}</span> ${escHTML(p.d)}</li>`).join("");
  const ans = String(state.answers[qi] || "").trim();
  return `<article class="q frq graded">
    <div class="qtop"><span class="qidx">${qi + 1}</span><span class="qsrc">${res.s} / ${q.marks} marks</span></div>
    <div class="frqprompt">${q.prompt}</div>
    <div class="frqgiven"><div class="frqlabel">Your answer</div>
      <div class="frqtext${ans ? "" : " empty"}">${ans ? escHTML(ans).replace(/\n/g, "<br>") : "<i>No answer given</i>"}</div></div>
    <div class="frqscore ${res.s === q.marks ? "full" : res.s === 0 ? "zero" : ""}">${res.s} / ${q.marks}</div>
    <ul class="ptlist">${pts}</ul>
    <div class="modelkey"><div class="frqlabel">Model answer</div>${q.key}</div>
  </article>`;
}

function renderQuiz() {
  const ch = activeChapters()[state.chapter];
  if (!ch) { state.view = "home"; renderHome(); return; }
  const isFRQ = ch.paper === "FRQ";
  const isP2 = isStructPaper(ch.paper);
  const total = ch.questions.length;
  const size = isFRQ ? 5 : isP2 ? P2_PAGE_SIZE : PAGE_SIZE;
  const pages = Math.ceil(total / size);
  const start = state.page * size;
  const slice = ch.questions.slice(start, start + size);
  const answered = isP2
    ? ch.questions.filter((q, qi) => String(state.answers[qi] || "").trim()).length
    : isFRQ
      ? ch.questions.filter((q, qi) => String(state.answers[qi] || "").trim()).length
      : Object.keys(state.answers).length;

  const qs = slice.map((q, k) => {
    const qi = start + k;
    if (isFRQ) return frqQuestionHTML(q, qi);
    if (isP2) return p2QuestionHTML(q, qi);
    const picked = state.answers[qi];
    const opts = ["A", "B", "C", "D"].map((L, oi) => {
      let cls = "";
      if (state.submitted) cls = isRight(q, oi) ? "correct" : (picked === oi ? "wrong" : "");
      else if (picked === oi) cls = "sel";
      return `<button class="opt ${cls}" data-q="${qi}" data-o="${oi}" onclick="pick(this)">${L}</button>`;
    }).join("");
    let verdict = "";
    if (state.submitted) {
      const ok = q.void || isRight(q, picked);          // a withdrawn question scores even if left blank
      verdict = q.void
        ? `<div class="verdict ${ok ? "ok" : "no"}">${ok ? "Mark awarded — this question was withdrawn in the original paper" : "Withdrawn question — no mark recorded"}</div>`
        : `<div class="verdict ${ok ? "ok" : "no"}">${ok ? "Correct" : `Incorrect — answer is ${answerText(q)}`}</div>`;
    }
    return `<article class="q">
      <div class="qtop"><span class="qidx">${qi + 1}</span><span class="qsrc">${srcLabel(q.src)}</span></div>
      <img class="qimg" src="${q.img}" alt="Question ${qi + 1}" loading="lazy">
      <div class="opts">${opts}</div>${verdict}
    </article>`;
  }).join("");

  const pager = pages > 1 ? `<div class="pager">
      <button class="ghost" onclick="goPage(${state.page - 1})" ${state.page === 0 ? "disabled" : ""}>Previous</button>
      <span class="pageinfo">${state.page + 1} / ${pages}</span>
      <button class="ghost" onclick="goPage(${state.page + 1})" ${state.page === pages - 1 ? "disabled" : ""}>Next</button>
    </div>` : "";

  const reviewBar = state.submitted && state.reviewDate
    ? `<div class="reviewbar">Reviewing your attempt from <b>${state.reviewDate}</b> · <a class="tlink" onclick="startFresh()">start a fresh attempt</a></div>` : "";
  const introBar = isFRQ && !state.submitted ? `<div class="q frqintro">${ch.intro || ""}</div>` : "";
  const p2bar = isP2 && state.marking && !state.submitted
    ? `<div class="reviewbar" style="background:#EAF3EA;border-color:#BBD8BB">Compare your answer with the <b>official mark scheme</b> under each question, then enter the mark you earned (and the question total) in the boxes. When every question is marked, click <b>Save my marks</b>.</div>` : "";

  app.innerHTML = `
  <header class="site small"><div class="inner">
    <div class="back" onclick="goHome()">← ${isPastPaperLevel(ch.level2) ? "All sets" : "All chapters"}</div>
    <h1>${ch.title}</h1>
    <p>${isFRQ ? total + " free-response questions · auto-marked" : isP2 ? total + " structured questions · mark-scheme self-marking" : total + " questions"} · ${ch.level}</p>
  </div></header>
  <main class="wrap">
    ${state.submitted ? "" : `<div class="namebar">
      <label>Your name</label>
      ${ENTRY ? `<b>${escHTML(state.name)}</b>`
        : session() ? `<b>${escHTML(session().name)}</b><a class="tlink" style="margin-left:8px" onclick="signOut()">not you? sign out</a>` : nameField()}
    </div>`}
    ${reviewBar}
    <div class="progress"><div class="progress-bar"><i id="progBar" style="width:${Math.round(100 * answered / total)}%"></i></div>
      <span id="progText">${answered} / ${total} answered</span></div>
    ${introBar}
    ${p2bar}
    ${qs}
    ${pager}
    <div class="submitbar">
      ${state.submitted
        ? `<button onclick="finish()">See my score</button>`
        : isP2 && state.marking
          ? `<button onclick="saveMarks()">Save my marks</button>`
          : `<button onclick="submitQuiz()">Submit and mark</button>`}
    </div>
    ${state.submitted ? "" : `<div class="footnote">${isFRQ
      ? "Write your answers in full sentences. Marks are awarded per marking point — partial credit is given automatically, and the model answer appears after you submit."
      : isP2
        ? "Answer the questions (type key results here, or work on paper). After submitting, the official mark scheme appears under each question so you can mark yourself, just like an examiner would."
        : "Answer as many as you can, then submit. Correct answers appear with each question."}</div>`}
  </main>`;
}

/* ---------- class roster (from access code) ---------- */
function classRoster() {
  if (typeof MB_CLASSES === "undefined") return null;
  const a = { cls: currentClass() };
  if (!a.cls) return null;
  const norm = s => String(s || "").toLowerCase().replace(/[\s·._-]/g, "");
  return MB_CLASSES.find(c => norm(c.name) === norm(a.cls) || norm(c.name).indexOf(norm(a.cls)) > -1) || null;
}
function gradePrefix(clsName) {
  const s = String(clsName || "").toLowerCase();
  if (s.includes("grade 12")) return "12ib";
  if (s.includes("grade 11")) return "11ib";
  if (s.includes("grade 10") || s.includes("pre-ib") || s.includes("preib")) return "preib";
  return "";
}
function nameField() {
  const rc = classRoster();
  if (!rc || state.manualName) {
    return `<input type="text" id="stuName" placeholder="e.g. 12ib Alex" value="${escAttr(state.name)}">`;
  }
  const cur = state.name || "";
  const opts = rc.students.map(x => {
    const v = MB_displayName(rc.name, x);
    return `<option value="${escAttr(v)}"${v === cur ? " selected" : ""}>${v}</option>`;
  }).join("");
  return `<select id="stuName">
      <option value="">— select your name —</option>${opts}
    </select>
    <a class="tlink" style="font-size:12px; margin-left:8px" onclick="toggleManualName(true)">Not on the list?</a>`;
}
function toggleManualName(on) {
  state.manualName = !!on;
  renderQuiz();
}

function pick(btn) {
  if (state.submitted) return;
  const qi = +btn.dataset.q, oi = +btn.dataset.o;
  state.answers[qi] = oi;
  btn.parentElement.querySelectorAll(".opt").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  const total = activeChapters()[state.chapter].questions.length;
  const answered = Object.keys(state.answers).length;
  const bar = document.getElementById("progBar"), txt = document.getElementById("progText");
  if (bar) bar.style.width = Math.round(100 * answered / total) + "%";
  if (txt) txt.textContent = `${answered} / ${total} answered`;
}

function goPage(p) {
  const ch = activeChapters()[state.chapter];
  const size = ch.paper === "FRQ" ? 5 : isStructPaper(ch.paper) ? P2_PAGE_SIZE : PAGE_SIZE;
  const total = ch.questions.length;
  const pages = Math.ceil(total / size);
  if (p < 0 || p >= pages) return;
  state.page = p;
  renderQuiz();
  window.scrollTo(0, 0);
}

function typeAns(ta) {
  if (state.submitted) return;
  state.answers[ta.dataset.q] = ta.value;
  const ch = activeChapters()[state.chapter];
  const total = ch.questions.length;
  const answered = ch.questions.filter((q, qi) => String(state.answers[qi] || "").trim()).length;
  const bar = document.getElementById("progBar"), txt = document.getElementById("progText");
  if (bar) bar.style.width = Math.round(100 * answered / total) + "%";
  if (txt) txt.textContent = `${answered} / ${total} answered`;
}

function goHome() {
  if (ENTRY && ENTRY.review) { platformGo("/my-practice"); return; }   // leaving a replay goes back to the record
  state.view = "home"; render(); window.scrollTo(0, 0);
}
function platformGo(url) {
  try { if (window.top !== window) { window.top.location.href = url; return; } } catch (e) { /* framed elsewhere: move this frame */ }
  window.location.href = url;
}

async function submitQuiz() {
  const el = document.getElementById("stuName");
  if (ENTRY) state.name = localStorage.getItem("stuName") || "";
  else if (session()) state.name = session().name;
  else if (el) state.name = el.value.trim();
  if (!state.name) { alert("Please enter your name first."); el && el.focus(); return; }
  if (!ENTRY && cloudOn() && (!session() || session().name !== state.name) && await hasAccount(state.name)) {
    alert(state.name + " already has an account. Sign in with your name and PIN to submit as " + state.name + ".");
    return;
  }
  localStorage.setItem("stuName", state.name);
  const ch = activeChapters()[state.chapter];
  const isFRQ = ch.paper === "FRQ";
  const isP2 = isStructPaper(ch.paper);
  const total = ch.questions.length;
  const answered = (isFRQ || isP2)
    ? ch.questions.filter((q, qi) => String(state.answers[qi] || "").trim()).length
    : Object.keys(state.answers).length;
  const unanswered = total - answered;
  if (unanswered > 0 && !confirm(unanswered + " question(s) still unanswered. Submit anyway?")) return;
  if (isFRQ) state.frqResults = ch.questions.map((q, qi) => gradeFRQ(q, state.answers[qi]));
  if (isP2) { state.marking = true; render(); window.scrollTo(0, 0); return; }
  state.submitted = true;
  render(); window.scrollTo(0, 0);
}

function markInput(el) {
  const qi = +el.dataset.q;
  const m = state.marks[qi] || { g: 0, t: 0 };
  m[el.dataset.k] = parseInt(el.value, 10) || 0;
  state.marks[qi] = m;
}

function saveMarks() {
  const ch = activeChapters()[state.chapter];
  const marks = {};
  for (let qi = 0; qi < ch.questions.length; qi++) {
    const m = state.marks[qi];
    if (!m) continue;
    if (m.t < 1 || m.g < 0 || m.g > m.t) {
      alert("Question " + (qi + 1) + ": please enter a total of at least 1, with your mark between 0 and the total.");
      return;
    }
    marks[qi] = m;
  }
  if (Object.keys(marks).length === 0) {
    alert("Please enter your mark and the question total under each question first.");
    return;
  }
  state.marks = marks;
  state.marking = false;
  state.submitted = true;
  finish();
}

function score() {
  const ch = activeChapters()[state.chapter];
  if (ch.paper === "FRQ") {
    const s = (state.frqResults || []).reduce((a, r) => a + r.s, 0);
    const t = ch.questions.reduce((a, q) => a + (q.marks || 0), 0);
    return { s, t };
  }
  if (isStructPaper(ch.paper)) {
    let s = 0, t = 0;
    ch.questions.forEach((q, qi) => {
      const m = state.marks[qi];
      if (m) { s += m.g; t += m.t; }
    });
    return { s, t };
  }
  let s = 0;
  ch.questions.forEach((q, qi) => { if (q.void || isRight(q, state.answers[qi])) s++; });
  return { s, t: ch.questions.length };
}

function finish() {
  const ch = activeChapters()[state.chapter];
  const isFRQ = ch.paper === "FRQ";
  const isP2 = isStructPaper(ch.paper);
  const { s, t } = score();
  if (!t) { alert("No marks recorded yet."); return; }
  const pct = Math.round(100 * s / t);
  const grid = ch.questions.map((q, qi) => {
    if (isFRQ) {
      const r = (state.frqResults && state.frqResults[qi]) || { s: 0 };
      return `<span class="cell ${r.s === q.marks ? "ok" : r.s === 0 ? "no" : "half"}" title="Q${qi + 1}: ${r.s}/${q.marks}">${qi + 1}</span>`;
    }
    if (isP2) {
      const m = state.marks[qi] || { g: 0, t: 0 };
      const ratio = m.t ? m.g / m.t : 0;
      return `<span class="cell ${m.t && m.g === m.t ? "ok" : ratio < 0.5 ? "no" : "half"}" title="Q${qi + 1}: ${m.g}/${m.t}">${qi + 1}</span>`;
    }
    const ok = q.void || isRight(q, state.answers[qi]);
    const given = state.answers[qi] !== undefined ? "ABCD"[state.answers[qi]] : "–";
    return `<span class="cell ${ok ? "ok" : "no"}" title="Q${qi + 1}: you ${given}, answer ${q.void ? "withdrawn" : answerText(q)}">${qi + 1}</span>`;
  }).join("");
  const payload = {
    n: state.name, c: ch.title, s: `${s}/${t}`,
    a: isFRQ
      ? ch.questions.map((q, qi) => ((state.frqResults && state.frqResults[qi]) || { s: 0 }).s).join("-")
      : isP2
        ? ch.questions.map((q, qi) => { const m = state.marks[qi]; return m ? m.g + "/" + m.t : "0/0"; }).join("-")
        : ch.questions.map((q, qi) => state.answers[qi] !== undefined ? "ABCD"[state.answers[qi]] : "-").join(""),
    d: nowStamp()
  };
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const saved = isFRQ
    ? { score: s, total: t, date: payload.d, kind: "frq", answers: state.answers, results: state.frqResults }
    : isP2
      ? { score: s, total: t, date: payload.d, kind: "p2", answers: state.answers, marks: state.marks }
      : { score: s, total: t, date: payload.d, kind: "mcq", answers: state.answers };
  if (!state.reviewOnly) {                       // reviewing an old attempt must not overwrite or re-send it
    localStorage.setItem("attempt:" + ch.id, JSON.stringify(saved));
    if (ENTRY) {
      platformSaveNote = "Saving this attempt to your practice record…";
      platformReport({ chapterId: ch.id, chapterTitle: ch.title, level: levelKeyOf(ch), paper: ch.paper || "MCQ", entry: ENTRY.name, score: s, total: t, saved })
        .then(() => setSaveNote("This attempt is saved to your <b>practice record</b>; your teacher can see it there."))
        .catch(() => {
          queuePendingAttempt({ chapterId: ch.id, chapterTitle: ch.title, level: levelKeyOf(ch), paper: ch.paper || "MCQ", entry: ENTRY.name, score: s, total: t, saved });
          setSaveNote("This attempt could <b>not</b> be saved just now. It is kept on this device and will be added to your practice record next time you open a practice page.");
        });
    } else {
    ownedIds.add(ch.id);
    cloudReportAsync({
      n: payload.n, cls: currentClass(), ch: ch.id, title: ch.title,
      level: levelKeyOf(ch), paper: ch.paper || "MCQ",
      s: s, t: t, detail: payload.a, date: payload.d, data: JSON.stringify(saved)
    }).then(() => cloudMarkSynced(ch.id, payload.d))
      .catch(err => console.warn("cloud report skipped:", err && err.message || err));
    }
  }

  app.innerHTML = `
  <header class="site small"><div class="inner">
    <div class="back" onclick="goHome()">← ${isPastPaperLevel(ch.level2) ? "All sets" : "All chapters"}</div>
    <h1>${ch.title}</h1>
  </div></header>
  <main class="wrap">
    <section class="card result">
      <div class="scoreline"><span class="score">${s}</span><span class="oft">/ ${t}</span><span class="pct">${pct}%</span></div>
      <div class="who">${state.name} · ${ch.title}</div>
      <div class="progress-bar big"><i style="width:${pct}%"></i></div>
      <div class="grid">${grid}</div>
      <div class="legend"><span class="key ok"></span>${isFRQ || isP2 ? "full marks" : "correct"} <span class="key no"></span>${isFRQ || isP2 ? "no marks" : "incorrect"}</div>
    </section>
    <section class="card">
      <div class="listhead">${ENTRY ? "Saved to your practice record" : "Score report for your teacher"}</div>
      ${ENTRY ? `<p class="footnote" style="margin-top:0" id="saveNote">${platformSaveNote}</p>` : `<p class="footnote" style="margin-top:0">Copy this code and paste it to your teacher (or send a screenshot of this page).</p>`}
      ${ENTRY ? "" : `<div class="codebox" id="codeBox">${code}</div>`}
      <div class="row">
        ${ENTRY ? `<button class="ghost" onclick="platformGo('/my-practice')">My practice record</button>` : `<button onclick="copyCode(this)">Copy code</button>`}
        <button class="ghost" onclick="reviewAttempt()">Review my answers</button>
        <button class="ghost" onclick="goHome()">Back to chapters</button>
      </div>
    </section>
  </main>`;
  window.scrollTo(0, 0);
}

function copyCode(btn) {
  const text = document.getElementById("codeBox").textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = "Copy code"), 1500);
  });
}

refreshOwned();
refreshAssigned();
if (ENTRY) {
  render();                                      // "Opening your chapters…" until the platform answers
  window.__platformReady = platformBoot();       // nothing is sent to school storage in an embed
} else {
  render();
  backfillLocalAttempts();
}

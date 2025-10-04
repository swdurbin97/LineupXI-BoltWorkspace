/**
 * build-overrides.js
 * -------------------------------------------------------
 * Generates frontend/public/data/formation-overrides.json
 * with clean, consistently spaced slot coordinates that
 * match a left→right field orientation at 100% zoom.
 *
 * How it works:
 * - Reads the existing formations file (formations-complete.json).
 * - For each formation, it detects slot roles from the slot codes
 *   (GK, CB, LB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW,
 *   ST, CF, LF, RF, etc.).
 * - Applies a spacing algorithm to avoid bunching and to place
 *   lines at sensible X “columns” with even Y distribution.
 * - Writes the resulting coordinates as overrides so the UI
 *   uses them without touching your base data.
 *
 * Run from /frontend:
 *   node tools/build-overrides.js
 *     – or –
 *   npm run build:overrides
 *
 * (Your package.json should have:
 *   "build:overrides": "node tools/build-overrides.js"
 * )
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname; // /frontend/tools
const PUBLIC_DATA = path.resolve(ROOT, '../public/data');
const INPUT = path.join(PUBLIC_DATA, 'formations-complete.json');
const OUTPUT = path.join(PUBLIC_DATA, 'formation-overrides.json');

// ----- Tunable layout constants (percent-of-field) -----------------

// Horizontal “columns” (left -> right). Tweak if you need the whole
// board tighter or looser later; one place changes all formations.
const X = {
  gk: 7,        // goalkeeper
  d: 22,        // back line (CB/LB/RB in a 4- or 3-back)
  wb: 30,       // wingbacks (LWB/RWB) in 5-back
  dmid: 38,     // holding mids (CDM)
  cm: 50,       // central mids
  am: 62,       // attacking mids / CAM
  wing: 70,     // wide mids/forwards (LW/RW, LM/RM)
  ss: 74,       // second-striker / support striker (LF/RF)
  st: 82        // primary striker(s)
};

// Vertical lanes (top->bottom). These give nice even spacing at 100% zoom.
const Y = {
  top: 18,           // fullback/wing top lane
  upper: 30,         // upper CB / upper mid
  upperMid: 40,      // between upper and center
  center: 50,        // exact middle
  lowerMid: 60,      // between center and lower
  lower: 70,         // lower CB / lower mid
  bottom: 82         // fullback/wing bottom lane
};

// For lines that need more than 2 players, we’ll spread them evenly
// within boundary lanes (inclusive).
function spreadY(count, top = Y.upper, bottom = Y.lower) {
  if (count <= 1) return [Y.center];
  const step = (bottom - top) / (count - 1);
  return Array.from({ length: count }, (_, i) => round1(top + i * step));
}

// Round to 0.1 precision to keep the JSON tidy.
function round1(n) {
  return Math.round(n * 10) / 10;
}

function is(code, ...needles) {
  const s = String(code).toUpperCase();
  return needles.some(n => s.includes(n));
}

function classifySlot(code) {
  // Normalize by common role “families”
  const s = String(code).toUpperCase();

  if (is(s, 'GK')) return 'GK';

  // Centre-backs
  if (is(s, 'CB')) return 'CB';

  // Fullbacks
  if (is(s, 'LB')) return 'LB';
  if (is(s, 'RB')) return 'RB';

  // Wingbacks (5-back systems)
  if (is(s, 'LWB')) return 'LWB';
  if (is(s, 'RWB')) return 'RWB';

  // Defensive mids
  if (is(s, 'CDM', 'DM')) return 'CDM';

  // Central mids
  if (is(s, 'CM') && !is(s, 'CDM')) return 'CM';

  // Attacking mids / 10s
  if (is(s, 'CAM', 'AM')) return 'CAM';

  // Classic wide mids
  if (is(s, 'LM')) return 'LM';
  if (is(s, 'RM')) return 'RM';

  // Wingers (front three)
  if (is(s, 'LW')) return 'LW';
  if (is(s, 'RW')) return 'RW';

  // Strikers / forwards
  if (is(s, 'CF')) return 'CF';
  if (is(s, 'LF')) return 'LF';
  if (is(s, 'RF')) return 'RF';
  if (is(s, 'ST')) return 'ST';

  // Fallback (central mid-ish)
  return 'CM';
}

function assignCoords(slots, formationName) {
  // Split by role family
  const groups = {
    GK: [],
    CB: [],
    LB: [],
    RB: [],
    LWB: [],
    RWB: [],
    CDM: [],
    CM: [],
    CAM: [],
    LM: [],
    RM: [],
    LW: [],
    RW: [],
    CF: [],
    LF: [],
    RF: [],
    ST: [],
    OTHER: []
  };

  slots.forEach(slot => {
    const c = classifySlot(slot.code || slot.slotCode || slot.name || '');
    (groups[c] || groups.OTHER).push(slot);
  });

  const out = {};

  // 1) GK
  groups.GK.forEach(s => { out[s.code] = { x: X.gk, y: Y.center }; });

  // 2) Back line(s)
  // Fullbacks (LB/RB) — push to top/bottom lanes
  groups.LB.forEach(s => { out[s.code] = { x: X.d, y: Y.top }; });
  groups.RB.forEach(s => { out[s.code] = { x: X.d, y: Y.bottom }; });

  // Wingbacks (5-back): slightly higher than standard fullbacks
  groups.LWB.forEach(s => { out[s.code] = { x: X.wb, y: Y.top }; });
  groups.RWB.forEach(s => { out[s.code] = { x: X.wb, y: Y.bottom }; });

  // Centre-backs: spread evenly between upper and lower lanes
  {
    const y = spreadY(groups.CB.length, Y.upper, Y.lower);
    groups.CB.forEach((s, i) => { out[s.code] = { x: X.d, y: y[i] }; });
  }

  // 3) Midfield
  // CDMs (deeper)
  {
    const y = spreadY(groups.CDM.length, Y.upperMid, Y.lowerMid);
    groups.CDM.forEach((s, i) => { out[s.code] = { x: X.dmid, y: y[i] }; });
  }

  // CMs (central)
  {
    const y = spreadY(groups.CM.length, Y.upperMid, Y.lowerMid);
    groups.CM.forEach((s, i) => { out[s.code] = { x: X.cm, y: y[i] }; });
  }

  // CAMs (higher)
  {
    const y = spreadY(groups.CAM.length, Y.upperMid, Y.lowerMid);
    groups.CAM.forEach((s, i) => { out[s.code] = { x: X.am, y: y[i] }; });
  }

  // LM / RM (wide mids)
  groups.LM.forEach(s => { out[s.code] = { x: X.wing, y: Y.top }; });
  groups.RM.forEach(s => { out[s.code] = { x: X.wing, y: Y.bottom }; });

  // 4) Front line
  // Wingers
  groups.LW.forEach(s => { out[s.code] = { x: X.wing, y: Y.top }; });
  groups.RW.forEach(s => { out[s.code] = { x: X.wing, y: Y.bottom }; });

  // Support striker variants
  groups.LF.forEach(s => { out[s.code] = { x: X.ss, y: Y.upperMid }; });
  groups.RF.forEach(s => { out[s.code] = { x: X.ss, y: Y.lowerMid }; });
  groups.CF.forEach(s => { out[s.code] = { x: X.ss, y: Y.center }; });

  // Strikers: spread modestly to avoid overlap
  {
    // If there are two STs, one slightly above center, one below
    const top = 44, bottom = 56;
    const y = spreadY(groups.ST.length, top, bottom);
    groups.ST.forEach((s, i) => { out[s.code] = { x: X.st, y: y[i] }; });
  }

  // Done — return slotCode -> {x,y}
  return out;
}

function build() {
  if (!fs.existsSync(INPUT)) {
    console.error(`✖ Cannot find ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('✖ formations-complete.json is not valid JSON.');
    console.error(e);
    process.exit(1);
  }

  // Data may be { formations: [...] } or just an array — handle both.
  const formations = Array.isArray(data) ? data : (data.formations || data.items || []);

  if (!formations || formations.length === 0) {
    console.error('✖ No formations found in formations-complete.json');
    process.exit(1);
  }

  const overrides = {};
  let touched = 0;

  formations.forEach(f => {
    const name = f.name || f.code || f.id || 'unknown';
    const slots = f.slots || f.positions || f.items || [];

    if (!slots || slots.length === 0) return;

    const mapped = assignCoords(slots, name);
    overrides[name] = mapped;
    touched++;
  });

  const pretty = JSON.stringify(overrides, null, 2);
  fs.writeFileSync(OUTPUT, pretty, 'utf-8');

  console.log('✔ formation-overrides.json written');
  console.log(`  • Source formations: ${formations.length}`);
  console.log(`  • Overridden formations: ${touched}`);
  console.log(`  • Output: ${OUTPUT}`);
}

build();

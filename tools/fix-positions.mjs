import fs from 'fs';
import path from 'path';

const file = path.resolve('frontend/public/data/formation-overrides.json');
if (!fs.existsSync(file)) {
  console.error(`\n❌ Not found: ${file}\nMake sure formation-overrides.json exists.\n`);
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf8');
let data;
try { data = JSON.parse(raw); }
catch (e) {
  console.error('❌ Could not parse formation-overrides.json:', e.message);
  process.exit(1);
}

// Heuristic: if vertical spread >> horizontal spread, treat as top->bottom and rotate to left->right
function rotateIfTopBottom(slots) {
  const entries = Object.entries(slots);
  if (!entries.length) return false;
  const xs = entries.map(([, s]) => s.x);
  const ys = entries.map(([, s]) => s.y);
  const rangeX = Math.max(...xs) - Math.min(...xs);
  const rangeY = Math.max(...ys) - Math.min(...ys);
  const looksTopBottom = rangeY > rangeX * 1.15;

  if (looksTopBottom) {
    // Rotate 90° so GK (small y) ends up on the LEFT (small x)
    for (const k of Object.keys(slots)) {
      const { x, y } = slots[k];
      slots[k] = { x: y, y: 100 - x };
    }
    return true;
  }
  return false;
}

function normalizeAndSpread(slots) {
  const entries = Object.entries(slots);
  if (!entries.length) return;

  // Fill the field with a bit of margin
  const xs = entries.map(([, s]) => s.x);
  const ys = entries.map(([, s]) => s.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = Math.max(1e-6, maxX - minX);
  const ry = Math.max(1e-6, maxY - minY);

  const MARGIN_X = 10; // %
  const MARGIN_Y = 8;  // %
  const sx = v => MARGIN_X + ((v - minX) / rx) * (100 - 2 * MARGIN_X);
  const sy = v => MARGIN_Y + ((v - minY) / ry) * (100 - 2 * MARGIN_Y);

  for (const [, s] of entries) {
    s.x = +sx(s.x).toFixed(1);
    s.y = +sy(s.y).toFixed(1);
  }

  // Gentle deconflict
  const THRESH = 4;  // if closer than this on an axis, push apart
  const PUSH   = 2.5;

  entries.sort((a, b) => a[1].x - b[1].x);
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1][1], b = entries[i][1];
    if (Math.abs(b.x - a.x) < THRESH) {
      const half = PUSH * 0.5;
      a.x = Math.max(MARGIN_X, a.x - half);
      b.x = Math.min(100 - MARGIN_X, b.x + half);
    }
  }

  entries.sort((a, b) => a[1].y - b[1].y);
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1][1], b = entries[i][1];
    if (Math.abs(b.y - a.y) < THRESH) {
      const half = PUSH * 0.5;
      a.y = Math.max(MARGIN_Y, a.y - half);
      b.y = Math.min(100 - MARGIN_Y, b.y + half);
    }
  }
}

let rotatedCount = 0;
let formationCount = 0;

for (const [code, formation] of Object.entries(data)) {
  const slots = formation?.slots || formation?.SLOTS;
  if (!slots || typeof slots !== 'object') continue;
  formationCount++;
  if (rotateIfTopBottom(slots)) rotatedCount++;
  normalizeAndSpread(slots);
}

// Backup and write
const bak = file.replace(/\.json$/i, `.${Date.now()}.bak.json`);
fs.writeFileSync(bak, raw);
fs.writeFileSync(file, JSON.stringify(data, null, 2));

console.log(`\n✅ Updated ${formationCount} formations`);
console.log(`↺ Rotated (top→bottom ➜ left→right): ${rotatedCount}`);
console.log(`🗂  Backup saved: ${bak}\n`);
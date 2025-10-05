#!/usr/bin/env node
/**
 * Validate canonical formations.json
 * - Every formation has 11 slots
 * - Coordinates within bounds (0-105, 0-68)
 * - GK has lowest x (leftmost)
 * - orientation = "left-right"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const canonicalPath = path.join(projectRoot, 'public/data/formations.json');

console.log('Validating canonical formations.json...\n');

const data = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const formations = data.formations || [];

let errors = 0;
let warnings = 0;

console.log(`Found ${formations.length} formations\n`);

formations.forEach((formation, idx) => {
  const name = formation.code || formation.name || `#${idx}`;
  const slots = formation.slot_map || [];

  // Check slot count
  if (slots.length !== 11) {
    console.error(`❌ ${name}: Expected 11 slots, got ${slots.length}`);
    errors++;
  }

  // Check orientation
  if (formation.orientation !== 'left-right') {
    console.error(`❌ ${name}: orientation should be "left-right", got "${formation.orientation}"`);
    errors++;
  }

  // Check slot_id uniqueness
  const slotIds = slots.map(s => s.slot_id).filter(Boolean);
  const uniqueSlotIds = new Set(slotIds);

  if (slotIds.length !== uniqueSlotIds.size) {
    console.error(`❌ ${name}: Duplicate slot_ids found`);
    errors++;
  }

  if (slotIds.length !== slots.length) {
    console.error(`❌ ${name}: Some slots missing slot_id`);
    errors++;
  }

  // Check coordinates
  let gkX = null;
  let maxForwardX = 0;

  slots.forEach(slot => {
    const {slot_code, slot_id, x, y} = slot;

    // Bounds check
    if (x < 0 || x > 105) {
      console.error(`❌ ${name}/${slot_code}: x=${x} out of bounds [0, 105]`);
      errors++;
    }
    if (y < 0 || y > 68) {
      console.error(`❌ ${name}/${slot_code}: y=${y} out of bounds [0, 68]`);
      errors++;
    }

    // GK check
    if (slot_code === 'GK') {
      gkX = x;
    }

    // Forward check
    if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(slot_code) && x > maxForwardX) {
      maxForwardX = x;
    }
  });

  // GK should be leftmost (lowest x)
  if (gkX !== null) {
    const allX = slots.map(s => s.x);
    const minX = Math.min(...allX);
    if (gkX !== minX) {
      console.error(`❌ ${name}/GK: x=${gkX}, but min x in formation is ${minX} (GK should be leftmost)`);
      errors++;
    }
  }

  // At least one forward should be rightmost
  if (maxForwardX < 60) {
    console.warn(`⚠️  ${name}: No forward with x > 60 (max forward x=${maxForwardX})`);
    warnings++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Validated ${formations.length} formations`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ Validation FAILED');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Validation passed with warnings');
} else {
  console.log('\n✅ All validations passed');
}

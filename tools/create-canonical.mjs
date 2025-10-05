#!/usr/bin/env node
/**
 * Create canonical formations.json from seed
 * - Drop meta block
 * - Add slot_id (1-11) to each slot
 * - Keep clean slot_code values (CB, CM, ST - no numbers)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const seedPath = path.join(projectRoot, 'public/data/inputs/formations_seed_clean.json');
const canonicalPath = path.join(projectRoot, 'public/data/formations.json');

console.log('Creating canonical formations.json from seed...\n');

const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Transform formations: add slot_id to each slot
// Format: ${formation.code}:${slot_code}:${index}
// This ensures uniqueness even when same slot_code appears multiple times
const canonical = {
  formations: seedData.formations.map(formation => {
    // Track count of each slot_code to generate unique indices
    const slotCodeCounts = {};

    return {
      ...formation,
      orientation: 'left-right',
      slot_map: formation.slot_map.map((slot) => {
        const slotCode = slot.slot_code;
        const count = slotCodeCounts[slotCode] || 0;
        slotCodeCounts[slotCode] = count + 1;

        return {
          ...slot,
          slot_id: `${formation.code}:${slotCode}:${count}`
        };
      })
    };
  })
};

// Write canonical
fs.writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2));

console.log(`✅ Created ${canonicalPath}`);
console.log(`   - ${canonical.formations.length} formations`);
console.log(`   - Each slot has unique slot_id: ${canonical.formations[0].code}:${canonical.formations[0].slot_map[0].slot_code}:${0}`);
console.log(`   - Clean slot_code labels (CB, CM, ST)`);
console.log(`   - Coordinates: absolute 105×68, bottom-left origin`);
console.log(`   - Orientation: left-right\n`);

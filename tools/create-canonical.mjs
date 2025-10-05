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
const canonical = {
  formations: seedData.formations.map(formation => ({
    ...formation,
    orientation: 'left-right',
    slot_map: formation.slot_map.map((slot, idx) => ({
      ...slot,
      slot_id: idx + 1  // 1-11 for each formation
    }))
  }))
};

// Write canonical
fs.writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2));

console.log(`✅ Created ${canonicalPath}`);
console.log(`   - ${canonical.formations.length} formations`);
console.log(`   - Each slot has slot_id (1-11) for internal use`);
console.log(`   - Clean slot_code labels (CB, CM, ST)`);
console.log(`   - Coordinates: absolute 105×68, bottom-left origin`);
console.log(`   - Orientation: left-right\n`);

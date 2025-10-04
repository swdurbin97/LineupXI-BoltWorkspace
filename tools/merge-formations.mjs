#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function loadJSON(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function saveJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function compareSlots(slot1, slot2) {
  return slot1.slot_code === slot2.slot_code &&
         slot1.x === slot2.x &&
         slot1.y === slot2.y;
}

function compareFormations(f1, f2) {
  if (f1.slot_map.length !== f2.slot_map.length) {
    return false;
  }

  for (let i = 0; i < f1.slot_map.length; i++) {
    if (!compareSlots(f1.slot_map[i], f2.slot_map[i])) {
      return false;
    }
  }

  return true;
}

function mergeFormations(seedData, authData) {
  const merged = new Map();
  const conflicts = [];
  const stats = {
    seedOnly: 0,
    authOnly: 0,
    identical: 0,
    conflicts: 0,
    total: 0
  };

  seedData.formations.forEach(formation => {
    merged.set(formation.code, {
      formation,
      source: 'seed'
    });
  });

  authData.formations.forEach(authFormation => {
    const existing = merged.get(authFormation.code);

    if (!existing) {
      merged.set(authFormation.code, {
        formation: authFormation,
        source: 'auth'
      });
    } else {
      const seedFormation = existing.formation;

      if (compareFormations(seedFormation, authFormation)) {
        merged.set(authFormation.code, {
          formation: authFormation,
          source: 'both'
        });
      } else {
        conflicts.push({
          code: authFormation.code,
          seed: seedFormation,
          auth: authFormation
        });

        merged.set(authFormation.code, {
          formation: authFormation,
          source: 'auth-conflict'
        });
      }
    }
  });

  merged.forEach(entry => {
    if (entry.source === 'seed') stats.seedOnly++;
    if (entry.source === 'auth') stats.authOnly++;
    if (entry.source === 'both') stats.identical++;
    if (entry.source === 'auth-conflict') stats.conflicts++;
  });

  stats.total = merged.size;

  const canonical = {
    formations: Array.from(merged.values()).map(entry => entry.formation)
  };

  return { canonical, conflicts, stats };
}

const seedPath = join(projectRoot, 'public/data/outputs/formations_seed_normalized.json');
const authPath = join(projectRoot, 'public/data/outputs/formations_auth_normalized.json');
const canonicalPath = join(projectRoot, 'public/data/outputs/formations_canonical.json');
const conflictsPath = join(projectRoot, 'public/data/outputs/merge_conflicts.json');

console.log('\n=== Formation Merge ===\n');

try {
  const seedData = loadJSON(seedPath);
  const authData = loadJSON(authPath);

  const { canonical, conflicts, stats } = mergeFormations(seedData, authData);

  saveJSON(canonicalPath, canonical);
  console.log(`✓ Canonical formations saved: ${canonicalPath}`);
  console.log(`  Total formations: ${stats.total}`);

  if (conflicts.length > 0) {
    saveJSON(conflictsPath, { conflicts });
    console.log(`\n⚠ Conflicts detected: ${conflicts.length}`);
    console.log(`  Conflict report: ${conflictsPath}`);

    console.log('\n  Conflicting formations:');
    conflicts.forEach(conflict => {
      console.log(`    - ${conflict.code}`);
    });
  }

  console.log('\n=== Merge Statistics ===');
  console.log(`  Identical (both sources):  ${stats.identical}`);
  console.log(`  Conflicts (resolved):      ${stats.conflicts}`);
  console.log(`  Seed only:                 ${stats.seedOnly}`);
  console.log(`  Auth only:                 ${stats.authOnly}`);
  console.log(`  Total formations:          ${stats.total}`);

  console.log('\n✓ Merge complete!\n');
} catch (error) {
  console.error('Error during merge:', error.message);
  process.exit(1);
}

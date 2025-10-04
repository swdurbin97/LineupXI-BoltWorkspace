#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function normalizeFormation(formation, isAuthoritative = false) {
  const slotCountMap = new Map();

  const normalizedSlots = formation.slot_map.map((slot) => {
    const baseCode = slot.slot_code.replace(/\d+$/, '');
    const count = slotCountMap.get(baseCode) || 0;
    slotCountMap.set(baseCode, count + 1);

    const occurrence = count + 1;

    let finalCode;
    if (isAuthoritative) {
      finalCode = slot.slot_code;
    } else {
      const totalOfThisType = formation.slot_map.filter(s =>
        s.slot_code.replace(/\d+$/, '') === baseCode
      ).length;

      if (totalOfThisType > 1) {
        finalCode = `${baseCode}${occurrence}`;
      } else {
        finalCode = baseCode;
      }
    }

    return {
      slot_code: finalCode,
      x: slot.x,
      y: slot.y
    };
  });

  return {
    code: formation.code,
    name: formation.name,
    style: formation.style,
    slot_map: normalizedSlots,
    position_counts_sum: formation.position_counts_sum || 11
  };
}

function loadJSON(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function saveJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function convertFile(inputPath, outputPath, isAuthoritative = false) {
  console.log(`Converting: ${inputPath}`);

  const data = loadJSON(inputPath);

  const normalized = {
    formations: data.formations.map(f => normalizeFormation(f, isAuthoritative))
  };

  saveJSON(outputPath, normalized);
  console.log(`✓ Saved to: ${outputPath}`);
  console.log(`  Formations: ${normalized.formations.length}`);

  return normalized;
}

const seedInput = join(projectRoot, 'public/data/inputs/formations_seed_clean.json');
const seedOutput = join(projectRoot, 'public/data/outputs/formations_seed_normalized.json');

const authInput = join(projectRoot, 'public/data/formations-authoritative.json');
const authOutput = join(projectRoot, 'public/data/outputs/formations_auth_normalized.json');

console.log('\n=== Formation Normalization ===\n');

try {
  convertFile(seedInput, seedOutput, false);
  console.log('');
  convertFile(authInput, authOutput, true);
  console.log('\n✓ Normalization complete!\n');
} catch (error) {
  console.error('Error during normalization:', error.message);
  process.exit(1);
}

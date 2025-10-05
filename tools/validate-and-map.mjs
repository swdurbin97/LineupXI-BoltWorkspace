#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Levenshtein distance
function levenshteinDistance(a, b) {
  if (!a || !b) return 999;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  const matrix = [];
  for (let i = 0; i <= bLower.length; i++) matrix[i] = [i];
  for (let j = 0; j <= aLower.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bLower.length][aLower.length];
}

// Load data
const formations = JSON.parse(readFileSync(join(projectRoot, 'public/data/formations.json'), 'utf8'));
const canonicalFormations = formations.formations;
const canonicalCodes = canonicalFormations.map(f => f.code);

const tactics = JSON.parse(readFileSync(join(projectRoot, 'tmp/tactics_normalized_temp.json'), 'utf8'));
const tacticsEntries = tactics.tactics_content;

console.log('═══════════════════════════════════════════════════════════════');
console.log('CODE VALIDATION & MAPPING REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Canonical formations: ${canonicalCodes.length}`);
console.log(`Tactics entries:      ${tacticsEntries.length}\n`);

// Build auto-mapping suggestions
const mapping = {};
const unmapped = [];

tacticsEntries.forEach(entry => {
  const legacyCode = entry.code;

  // Try exact match
  if (canonicalCodes.includes(legacyCode)) {
    mapping[legacyCode] = legacyCode;
    return;
  }

  // Try removing hyphens and spaces
  const normalized = legacyCode.replace(/[-\s]/g, '');
  const match = canonicalFormations.find(f => f.code === normalized || f.name === legacyCode);

  if (match) {
    mapping[legacyCode] = match.code;
  } else {
    // Find closest matches
    const distances = canonicalFormations.map(cf => ({
      code: cf.code,
      name: cf.name,
      distance: Math.min(
        levenshteinDistance(legacyCode, cf.code),
        levenshteinDistance(legacyCode, cf.name)
      )
    }));
    distances.sort((a, b) => a.distance - b.distance);
    unmapped.push({ legacyCode, suggestions: distances.slice(0, 3) });
  }
});

// Report
console.log('AUTO-MAPPED CODES (legacy → canonical):');
console.log('─'.repeat(63));
let autoMappedCount = 0;
Object.entries(mapping).forEach(([legacy, canonical]) => {
  if (legacy !== canonical) {
    const formation = canonicalFormations.find(f => f.code === canonical);
    console.log(`  ${legacy.padEnd(25)} → ${canonical.padEnd(20)} (${formation.name})`);
    autoMappedCount++;
  }
});
if (autoMappedCount === 0) {
  console.log('  (none - all matched exactly or need manual mapping)');
}
console.log(`\n  Total auto-mapped: ${autoMappedCount}\n`);

if (unmapped.length > 0) {
  console.log('UNMAPPED CODES (need manual confirmation):');
  console.log('─'.repeat(63));
  unmapped.forEach(({ legacyCode, suggestions }) => {
    console.log(`  ⚠️  "${legacyCode}"`);
    console.log(`      Top 3 suggestions:`);
    suggestions.forEach(({ code, name, distance }) => {
      console.log(`        - ${code.padEnd(20)} (${name}) [distance: ${distance}]`);
    });
    console.log('');
  });
  console.log(`  Total unmapped: ${unmapped.length}\n`);
}

// Find missing canonical codes
const mappedCanonicalCodes = new Set(Object.values(mapping));
const missingCodes = canonicalCodes.filter(code => !mappedCanonicalCodes.has(code));

if (missingCodes.length > 0) {
  console.log('MISSING IN TACTICS (present in canonical but no tactics content):');
  console.log('─'.repeat(63));
  missingCodes.forEach(code => {
    const formation = canonicalFormations.find(f => f.code === code);
    console.log(`  • ${code.padEnd(20)} (${formation.name})`);
  });
  console.log(`\n  Total missing: ${missingCodes.length}\n`);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Auto-mapped:    ${autoMappedCount}`);
console.log(`Exact matches:  ${Object.keys(mapping).length - autoMappedCount}`);
console.log(`Needs mapping:  ${unmapped.length}`);
console.log(`Missing codes:  ${missingCodes.length}`);
console.log('═══════════════════════════════════════════════════════════════');

#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

/**
 * Calculate Levenshtein distance between two strings (case-insensitive)
 */
function levenshteinDistance(a, b) {
  if (!a || !b) return 999; // Large distance for undefined/null values
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const matrix = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Find top N closest matches for a given code
 */
function findClosestMatches(code, canonicalCodes, n = 3) {
  const distances = canonicalCodes.map(canonical => ({
    code: canonical,
    distance: levenshteinDistance(code, canonical)
  }));

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, n);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('TACTICS CONTENT VALIDATOR');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load formations.json
const formationsPath = join(projectRoot, 'public', 'data', 'formations.json');
if (!existsSync(formationsPath)) {
  console.error('❌ Error: formations.json not found at', formationsPath);
  process.exit(1);
}

const formationsData = JSON.parse(readFileSync(formationsPath, 'utf8'));
const canonicalCodes = new Set(formationsData.formations.map(f => f.code));

console.log(`✓ Loaded ${canonicalCodes.size} canonical formation codes from formations.json\n`);

// Load tactics.json (optional)
const tacticsPath = join(projectRoot, 'public', 'data', 'tactics.json');
if (!existsSync(tacticsPath)) {
  console.log('⚠️  No tactics.json found - this is expected before initial import');
  console.log(`   Expected path: ${tacticsPath}\n`);
  console.log('Missing content: ALL formations need tactical content');
  console.log(`   Total: ${canonicalCodes.size} formations\n`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('VALIDATION COMPLETE (no tactics.json to validate)');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(0);
}

const tacticsData = JSON.parse(readFileSync(tacticsPath, 'utf8'));
const tacticsContent = tacticsData.tactics_content || [];

console.log(`✓ Loaded ${tacticsContent.length} tactics entries from tactics.json\n`);

// Build name-based sets (PRIMARY KEY)
const canonicalNames = new Set(formationsData.formations.map(f => f.name));
const tacticsNames = new Set(tacticsContent.map(t => t.name));

// Build code→name mapping from canonical formations
const codeToName = new Map();
formationsData.formations.forEach(f => {
  if (!codeToName.has(f.code)) {
    codeToName.set(f.code, []);
  }
  codeToName.get(f.code).push(f.name);
});

// 1:1 Coverage Check by NAME
const missingByName = [...canonicalNames].filter(name => !tacticsNames.has(name));
const unknownByName = [...tacticsNames].filter(name => !canonicalNames.has(name));

if (missingByName.length > 0) {
  console.log('Missing content by NAME (in formations.json but not in tactics.json):');
  console.log('─'.repeat(63));
  missingByName.forEach(name => {
    const formation = formationsData.formations.find(f => f.name === name);
    console.log(`  • ${formation.code.padEnd(20)} ${name}`);
  });
  console.log(`\n  Total missing: ${missingByName.length}\n`);
} else {
  console.log('✓ All formations have tactical content (by name)\n');
}

if (unknownByName.length > 0) {
  console.log('Unknown names (in tactics.json but not in formations.json):');
  console.log('─'.repeat(63));
  unknownByName.forEach(name => {
    console.log(`  ⚠️  "${name}"`);
  });
  console.log(`\n  Total unknown: ${unknownByName.length}\n`);
} else {
  console.log('✓ All tactics names match canonical formations\n');
}

// Code Consistency Check (informational)
const codeWarnings = [];
tacticsContent.forEach(tactics => {
  const formation = formationsData.formations.find(f => f.name === tactics.name);
  if (formation && tactics.code !== formation.code) {
    codeWarnings.push({
      name: tactics.name,
      tacticsCode: tactics.code,
      expectedCode: formation.code
    });
  }
});

if (codeWarnings.length > 0) {
  console.log('⚠️  Code mismatches (informational - name is primary key):');
  console.log('─'.repeat(63));
  codeWarnings.forEach(({ name, tacticsCode, expectedCode }) => {
    console.log(`  Name: "${name}"`);
    console.log(`    Tactics code:  ${tacticsCode}`);
    console.log(`    Expected code: ${expectedCode}`);
    console.log('');
  });
  console.log(`  Total mismatches: ${codeWarnings.length}\n`);
}

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('VALIDATION SUMMARY (by NAME - primary key)');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Canonical formations:  ${canonicalNames.size}`);
console.log(`Tactics entries:       ${tacticsContent.length}`);
console.log(`Missing by name:       ${missingByName.length}`);
console.log(`Unknown names:         ${unknownByName.length}`);
console.log(`Code warnings:         ${codeWarnings.length}`);
console.log('═══════════════════════════════════════════════════════════════');

process.exit(0);

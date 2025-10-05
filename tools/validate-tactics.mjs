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
const tacticsCodes = new Set(tacticsContent.map(t => t.code));

console.log(`✓ Loaded ${tacticsCodes.size} tactics entries from tactics.json\n`);

// Find missing content
const missingContent = [...canonicalCodes].filter(code => !tacticsCodes.has(code));

if (missingContent.length > 0) {
  console.log('Missing content (in formations.json but not in tactics.json):');
  console.log('─'.repeat(63));
  missingContent.forEach(code => {
    const formation = formationsData.formations.find(f => f.code === code);
    console.log(`  • ${code.padEnd(20)} (${formation?.name || 'unknown'})`);
  });
  console.log(`\n  Total missing: ${missingContent.length}\n`);
} else {
  console.log('✓ All formations have tactical content\n');
}

// Find unknown codes
const unknownCodes = [...tacticsCodes].filter(code => !canonicalCodes.has(code));

if (unknownCodes.length > 0) {
  console.log('Unknown codes (in tactics.json but not in formations.json):');
  console.log('─'.repeat(63));

  const canonicalCodesArray = [...canonicalCodes];
  unknownCodes.forEach(code => {
    const suggestions = findClosestMatches(code, canonicalCodesArray, 3);
    console.log(`  ⚠️  "${code}"`);
    console.log(`      Suggestions:`);
    suggestions.forEach(({ code: suggestedCode, distance }) => {
      console.log(`        - ${suggestedCode} (distance: ${distance})`);
    });
    console.log('');
  });

  console.log(`  Total unknown: ${unknownCodes.length}\n`);
} else {
  console.log('✓ All tactics codes match canonical formations\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Canonical formations:  ${canonicalCodes.size}`);
console.log(`Tactics entries:       ${tacticsCodes.size}`);
console.log(`Missing content:       ${missingContent.length}`);
console.log(`Unknown codes:         ${unknownCodes.length}`);
console.log('═══════════════════════════════════════════════════════════════');

process.exit(0);

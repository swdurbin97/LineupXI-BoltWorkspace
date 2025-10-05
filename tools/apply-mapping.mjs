#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load canonical formations
const formations = JSON.parse(readFileSync(join(projectRoot, 'public/data/formations.json'), 'utf8'));
const canonicalFormations = formations.formations;

// Create lookup maps
const codeToFormation = new Map();
const nameToFormation = new Map();
canonicalFormations.forEach(f => {
  codeToFormation.set(f.code, f);
  nameToFormation.set(f.name, f);
});

// Load normalized tactics
const tactics = JSON.parse(readFileSync(join(projectRoot, 'tmp/tactics_normalized_temp.json'), 'utf8'));
const tacticsEntries = tactics.tactics_content;

console.log('Applying approved mapping and adding name field...\n');

// Helper: normalize to array
function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => item.trim()).filter(item => item.length > 0);
  }
  return value
    .split(/[\n•;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Mapping function
function mapLegacyToCanonical(legacyCode) {
  // Special case: approved mapping
  if (legacyCode === '4-3-3') {
    return '433 (Balanced)';
  }

  // Try exact match
  if (codeToFormation.has(legacyCode)) {
    return legacyCode;
  }

  // Try removing hyphens/spaces
  const normalized = legacyCode.replace(/[-\s]/g, '');
  if (codeToFormation.has(normalized)) {
    return normalized;
  }

  // Try matching by name
  const formation = canonicalFormations.find(f => f.name === legacyCode);
  if (formation) {
    return formation.code;
  }

  console.warn(`⚠️  Could not map legacy code: ${legacyCode}`);
  return legacyCode;
}

// Map and enrich tactics entries
const mappedTactics = tacticsEntries.map(entry => {
  const canonicalCode = mapLegacyToCanonical(entry.code);
  const formation = codeToFormation.get(canonicalCode);

  if (!formation) {
    console.error(`❌ ERROR: No canonical formation found for code: ${canonicalCode} (from legacy: ${entry.code})`);
    return null;
  }

  return {
    code: formation.code,
    name: formation.name,
    title: entry.title || formation.name,
    overview: entry.overview || '',
    advantages: normalizeToArray(entry.advantages),
    disadvantages: normalizeToArray(entry.disadvantages),
    how_to_counter: normalizeToArray(entry.how_to_counter),
    suggested_counters: normalizeToArray(entry.suggested_counters),
    player_roles: normalizeToArray(entry.player_roles),
    summary_table: entry.summary_table || ''
  };
}).filter(Boolean);

console.log(`Mapped ${mappedTactics.length} tactics entries\n`);

// Find missing formations
const mappedNames = new Set(mappedTactics.map(t => t.name));
const missingFormations = canonicalFormations.filter(f => !mappedNames.has(f.name));

console.log(`Missing formations: ${missingFormations.length}`);
missingFormations.forEach(f => {
  console.log(`  • ${f.code.padEnd(20)} ${f.name}`);
});
console.log('');

// Add stubs for missing formations
const stubs = missingFormations.map(f => ({
  code: f.code,
  name: f.name,
  title: f.name,
  overview: 'Tactical notes coming soon.',
  advantages: [],
  disadvantages: [],
  how_to_counter: [],
  suggested_counters: [],
  player_roles: [],
  summary_table: ''
}));

console.log(`Adding ${stubs.length} stub entries for missing formations\n`);

// Combine and sort by code
const allTactics = [...mappedTactics, ...stubs].sort((a, b) => {
  // Sort by code, then by name for variants
  if (a.code === b.code) {
    return a.name.localeCompare(b.name);
  }
  return a.code.localeCompare(b.code);
});

// Write to public/data/tactics.json
const output = { tactics_content: allTactics };
writeFileSync(
  join(projectRoot, 'public/data/tactics.json'),
  JSON.stringify(output, null, 2)
);

console.log('✅ Written public/data/tactics.json');
console.log(`   Total entries: ${allTactics.length}`);
console.log(`   Content entries: ${mappedTactics.length}`);
console.log(`   Stub entries: ${stubs.length}`);

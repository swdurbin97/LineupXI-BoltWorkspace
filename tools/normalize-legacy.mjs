#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read legacy tactics
const data = JSON.parse(readFileSync(join(projectRoot, 'tmp/tactics_content_seed_from_docx.json'), 'utf8'));
const legacy = data.tactics_content;

console.log('Legacy tactics loaded:');
console.log('  Total entries:', legacy.length);
console.log('  First entry formation_code:', legacy[0]?.formation_code);
console.log('');

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

// Normalize each entry
const normalized = legacy.map(entry => ({
  code: entry.formation_code || entry.code,
  title: entry.title?.trim() || entry.formation_code || entry.code,
  overview: entry.overview?.trim() || '',
  advantages: normalizeToArray(entry.advantages),
  disadvantages: normalizeToArray(entry.disadvantages),
  how_to_counter: normalizeToArray(entry.how_to_counter),
  suggested_counters: normalizeToArray(entry.suggested_counters),
  player_roles: normalizeToArray(entry.player_roles),
  summary_table: entry.summary_table?.trim() || ''
}));

// Save to temp for inspection
writeFileSync(
  join(projectRoot, 'tmp/tactics_normalized_temp.json'),
  JSON.stringify({ tactics_content: normalized }, null, 2)
);

console.log('Normalized tactics saved to tmp/tactics_normalized_temp.json');
console.log('  Total normalized entries:', normalized.length);
console.log('');

// Extract codes for validation
const codes = normalized.map(e => e.code);
console.log('Codes found:');
codes.forEach((code, idx) => console.log(`  ${String(idx + 1).padStart(2)}. ${code}`));

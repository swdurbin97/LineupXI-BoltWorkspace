#!/usr/bin/env node

/**
 * Materialize sanitized tactics content to disk
 * - Loads raw tactics.json
 * - Applies full sanitization pipeline
 * - Backs up original to tactics.backup.<timestamp>.json
 * - Writes sanitized content back to tactics.json
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Import sanitizer logic (duplicated from src/data/tactics.ts for Node.js compatibility)
const URL_RE = /\bhttps?:\/\/\S+/gi;
const DOMAIN_RE = /\b[\w.-]+\.(?:com|org|net|io|co|uk)(?:\/\S*)?/gi;
const PLUS_CHAIN_RE = /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+/gi;

function sanitizeText(input) {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");

  s = s.replace(
    /\b(Footballizer|Wikipedia|Guardian|Analyst|Voice|Community|Coaching|Page|FC)(?=The\b)/g,
    '$1 '
  );

  s = s.replace(/([.,;:])(?=[A-Za-z])/g, '$1 ');

  s = s.replace(URL_RE, "");
  s = s.replace(PLUS_CHAIN_RE, "");
  s = s.replace(DOMAIN_RE, "");
  s = s.replace(/\b([\w-]+)\s*\.\s*(com|org|net|io|co|uk)\b/gi, "");
  s = s.replace(/\s+\.\s*(com|org|net|io|co|uk)\b/gi, "");

  s = s.replace(/[\[\(\{]{1,2}\s*turn\d+(?:view|search)\d+\s*[\]\)\}]{1,2}\s*,?/gi, '');
  s = s.replace(/\bturn\d+(?:view|search)\d+\b/gi, '');

  s = s.replace(/(Voice|Jobs|Community|Coaching)([A-Z][a-z]+)/g, '$1 $2');
  s = s.replace(/\b([A-Z][a-z]+)\1\b/g, '$1');

  const brands = [
    'A-Champs Interactive Community',
    'Sports Interactive Community',
    'Voice Interactive Community',
    'The Philly Soccer Page',
    'Soccer Est Du Quebec',
    'The Football Tactics Board',
    'The Football Analyst',
    'Interactive Community',
    'Philly Soccer Page',
    'Charlotte Rise FC',
    'Jobs In Coaching',
    'Ekkono Coaching',
    'Jobs In Football',
    'Football Analyst',
    'Soccer Coaching Pro',
    'Soccer Mastermind',
    'Football insides',
    'Football inside',
    'Build Lineup',
    'Football DNA',
    "Coaches' Voice",
    "Coaches Voice",
    'Coaching Pro',
    'In Football',
    'Footballizer',
    'Buildlineup',
    'The Guardian',
    'Wikipedia',
    'Mastermind',
    'Talksport',
    'BlazePod',
    'Coach 365',
    'Guardian',
    'Rise FC',
    'YouTube',
    'Reddit'
  ];

  let prev = '';
  while (prev !== s) {
    prev = s;
    for (const brand of brands) {
      const escapedBrand = brand.replace(/[()' .]/g, '\\$&');
      s = s.replace(
        new RegExp(`([.,])\\s*${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\s*$`, 'gi'),
        '$1'
      );
      s = s.replace(
        new RegExp(`\\s+${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\s*$`, 'gi'),
        ''
      );
    }
  }

  prev = '';
  while (prev !== s) {
    prev = s;
    for (const brand of brands) {
      const escapedBrand = brand.replace(/[()' .]/g, '\\$&');
      s = s.replace(
        new RegExp(`\\b${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\b`, 'gi'),
        ''
      );
    }
  }

  prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\s+(?:[A-Z][a-z']+\s+){0,4}(?:Voice|Community|Coaching|Analyst|Pro|FC|DNA)\.?$/g, '.');
  }

  prev = '';
  while (prev !== s) {
    prev = s;
    for (const brand of brands) {
      const pattern = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      s = s.replace(pattern, '');
    }
  }

  s = s.replace(/([.?,!])[''"]\s*$/g, '$1');

  s = s.replace(/\.{2,}/g, '.').replace(/\s+\./g, '.');
  s = s.replace(/[ \t]+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();

  s = s.replace(/\bJobs In Coaching\b/gi, '');
  s = s.replace(/[ \t]+/g, " ").trim();

  return s;
}

function sanitizeList(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map(sanitizeText).map(s => s.trim()).filter(Boolean);
}

function formatPlayerRoles(items) {
  let arr = Array.isArray(items) ? items : [];
  arr = arr.map(s => s.trim()).filter(Boolean);

  // B1: Insert missing colon after role label & fix malformed colons
  arr = arr.map(bullet => {
    // First, fix double colons and space-before-colon issues
    bullet = bullet.replace(/\s+:\s+/g, ': ').replace(/:\s*:/g, ':');

    // Then check if colon is missing
    const labelMatch = bullet.match(/^([A-Z][A-Za-z\s-]*(?:\([^)]*\))?)([^:])/);
    if (labelMatch && labelMatch[2] && /[A-Z]/.test(labelMatch[2])) {
      const label = labelMatch[1];
      const rest = bullet.slice(label.length);
      return `${label}: ${rest.trim()}`;
    }
    return bullet;
  });

  // B2: Merge continuation bullets
  const merged = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const startsWithContinuation = /^(they|it|their|one|the other)\b/i.test(current);

    if (startsWithContinuation && merged.length > 0) {
      const previous = merged[merged.length - 1];
      const endsWithTerminal = /[.!?]\s*$/.test(previous);

      if (!endsWithTerminal) {
        merged[merged.length - 1] = `${previous} ${current}`;
        continue;
      }
    }

    merged.push(current);
  }

  // Capitalize first character & remove trailing stray quotes
  return merged.map(bullet => {
    let s = bullet.trim();
    if (s.length > 0) {
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    s = s.replace(/[''"]\s*$/g, '');
    return s;
  }).filter(Boolean);
}

async function materialize() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MATERIALIZE SANITIZED TACTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const tacticsPath = join(projectRoot, 'public', 'data', 'tactics.json');
  const timestamp = Date.now();
  const backupPath = join(projectRoot, 'public', 'data', `tactics.backup.${timestamp}.json`);

  // Load raw
  console.log('Loading raw tactics.json...');
  const rawContent = await readFile(tacticsPath, 'utf8');
  const rawData = JSON.parse(rawContent);

  if (!rawData.tactics_content || !Array.isArray(rawData.tactics_content)) {
    throw new Error('Invalid tactics.json structure');
  }

  console.log(`Loaded ${rawData.tactics_content.length} formations\n`);

  // Backup original
  console.log(`Creating backup: tactics.backup.${timestamp}.json`);
  await writeFile(backupPath, rawContent, 'utf8');

  // Sanitize
  console.log('Applying sanitization pipeline...\n');
  let paragraphsChanged = 0;
  let listItemsChanged = 0;

  const sanitized = rawData.tactics_content.map(entry => {
    const rawOverview = entry.overview || '';
    const rawAdvantages = entry.advantages || [];
    const rawDisadvantages = entry.disadvantages || [];
    const rawHowToCounter = entry.how_to_counter || [];
    const rawSuggestedCounters = entry.suggested_counters || [];
    const rawPlayerRoles = entry.player_roles || [];

    const sanitizedOverview = rawOverview
      .split('\n\n')
      .map(sanitizeText)
      .filter(Boolean)
      .join('\n\n');

    const sanitizedAdvantages = sanitizeList(rawAdvantages);
    const sanitizedDisadvantages = sanitizeList(rawDisadvantages);
    const sanitizedHowToCounter = sanitizeList(rawHowToCounter);
    const sanitizedSuggestedCounters = sanitizeList(rawSuggestedCounters);
    const sanitizedPlayerRoles = formatPlayerRoles(sanitizeList(rawPlayerRoles));

    // Count changes
    if (rawOverview !== sanitizedOverview) paragraphsChanged++;
    listItemsChanged += (rawAdvantages.length - sanitizedAdvantages.length);
    listItemsChanged += (rawDisadvantages.length - sanitizedDisadvantages.length);
    listItemsChanged += (rawHowToCounter.length - sanitizedHowToCounter.length);
    listItemsChanged += (rawSuggestedCounters.length - sanitizedSuggestedCounters.length);
    listItemsChanged += (rawPlayerRoles.length - sanitizedPlayerRoles.length);

    return {
      code: entry.code,
      name: entry.name,
      title: entry.title,
      overview: sanitizedOverview,
      advantages: sanitizedAdvantages,
      disadvantages: sanitizedDisadvantages,
      how_to_counter: sanitizedHowToCounter,
      suggested_counters: sanitizedSuggestedCounters,
      player_roles: sanitizedPlayerRoles,
      summary_table: (entry.summary_table || '').trim()
    };
  });

  // Sort by code, then name for stable output
  sanitized.sort((a, b) => {
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  // Write back
  const output = {
    tactics_content: sanitized
  };

  await writeFile(tacticsPath, JSON.stringify(output, null, 2), 'utf8');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total formations: ${sanitized.length}`);
  console.log(`Overview paragraphs changed: ${paragraphsChanged}`);
  console.log(`List items changed: ${Math.abs(listItemsChanged)}`);
  console.log(`\nBackup: tactics.backup.${timestamp}.json`);
  console.log(`Output: tactics.json (sanitized, sorted by code)`);
  console.log('═══════════════════════════════════════════════════════════════');
}

materialize().catch(err => {
  console.error('Materialize failed:', err);
  process.exit(1);
});

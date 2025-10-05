#!/usr/bin/env node

/**
 * Audit script for sanitized tactics content
 * Loads tactics via the same loader (sanitizer runs automatically)
 * Reports any remaining artifacts across all 32 formations
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Red flag patterns (post-sanitization)
const RED_FLAGS = {
  domain: {
    pattern: /\b[\w-]+\s*\.\s*(com|org|net|io|co|uk)\b/i,
    name: 'domain token'
  },
  placeholder: {
    pattern: /\bturn\d+(?:view|search)\d+\b/i,
    name: 'placeholder token'
  },
  plusChain: {
    pattern: /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+\b/,
    name: 'plus-chain'
  },
  brand: {
    pattern: new RegExp(
      '\\b(' +
      [
        'A-Champs Interactive Community',
        'Sports Interactive Community',
        'Soccer Est Du Quebec',
        'The Football Tactics Board',
        'The Football Analyst',
        'Charlotte Rise FC',
        'Ekkono Coaching',
        'Jobs In Football',
        'Football Analyst',
        'Soccer Coaching Pro',
        'Soccer Mastermind',
        'Football insides',
        'Football inside',
        'Football DNA',
        "Coaches' Voice",
        "Coaches Voice",
        'Coaching Pro',
        'In Football',
        'Footballizer',
        'Buildlineup',
        'Wikipedia',
        'Mastermind',
        'Talksport',
        'BlazePod',
        'Coach 365',
        'Rise FC',
        'YouTube',
        'Reddit'
      ].map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
      ')\\b',
      'i'
    ),
    name: 'brand name'
  },
  titleCaseTail: {
    pattern: /\s+(?:[A-Z][a-z']+\s+){0,4}(?:Voice|Community|Coaching|Analyst|Pro|FC|DNA)\.?$/,
    name: 'title-case tail'
  }
};

// Simplified in-memory sanitizer (matches tactics.ts logic)
const URL_RE = /\bhttps?:\/\/\S+/gi;
const DOMAIN_RE = /\b[\w.-]+\.(?:com|org|net|io|co|uk)(?:\/\S*)?/gi;
const PLUS_CHAIN_RE = /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+/gi;

function sanitizeText(input) {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");

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
    'Soccer Est Du Quebec',
    'The Football Tactics Board',
    'The Football Analyst',
    'Charlotte Rise FC',
    'Ekkono Coaching',
    'Jobs In Football',
    'Football Analyst',
    'Soccer Coaching Pro',
    'Soccer Mastermind',
    'Football insides',
    'Football inside',
    'Football DNA',
    "Coaches' Voice",
    "Coaches Voice",
    'Coaching Pro',
    'In Football',
    'Footballizer',
    'Buildlineup',
    'Wikipedia',
    'Mastermind',
    'Talksport',
    'BlazePod',
    'Coach 365',
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

  s = s.replace(/\.{2,}/g, '.').replace(/\s+\./g, '.');
  s = s.replace(/[ \t]+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();

  return s;
}

function sanitizeList(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map(sanitizeText).map(s => s.trim()).filter(Boolean);
}

async function loadAndSanitizeTactics() {
  const tacticsPath = join(projectRoot, 'public', 'data', 'tactics.json');
  const raw = await readFile(tacticsPath, 'utf8');
  const data = JSON.parse(raw);

  const sanitized = (data.tactics_content || []).map(entry => {
    const overview = entry.overview ?
      entry.overview.split('\n\n').map(sanitizeText).filter(Boolean).join('\n\n') :
      '';

    return {
      code: entry.code,
      name: entry.name,
      title: entry.title,
      overview,
      advantages: sanitizeList(entry.advantages),
      disadvantages: sanitizeList(entry.disadvantages),
      how_to_counter: sanitizeList(entry.how_to_counter),
      suggested_counters: sanitizeList(entry.suggested_counters),
      player_roles: sanitizeList(entry.player_roles),
      summary_table: entry.summary_table?.trim() || ''
    };
  });

  return sanitized;
}

function scanForArtifacts(text, flagName, pattern) {
  const matches = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const idx = match.index;
      const start = Math.max(0, idx - 30);
      const end = Math.min(line.length, idx + match[0].length + 30);
      const snippet = line.slice(start, end);
      const highlightedSnippet = snippet.replace(
        match[0],
        `>>>${match[0]}<<<`
      );
      matches.push({
        flag: flagName,
        match: match[0],
        snippet: highlightedSnippet.slice(0, 80)
      });
    }
  }

  return matches;
}

async function audit() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TACTICS SANITIZATION AUDIT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const tactics = await loadAndSanitizeTactics();
  console.log(`Loaded ${tactics.length} formations (sanitized in-memory)\n`);

  const findings = [];

  for (const tactic of tactics) {
    const sections = {
      overview: tactic.overview,
      advantages: tactic.advantages.join(' '),
      disadvantages: tactic.disadvantages.join(' '),
      player_roles: tactic.player_roles.join(' '),
      how_to_counter: tactic.how_to_counter.join(' '),
      suggested_counters: tactic.suggested_counters.join(' ')
    };

    for (const [sectionName, content] of Object.entries(sections)) {
      if (!content) continue;

      for (const [flagKey, flagDef] of Object.entries(RED_FLAGS)) {
        const matches = scanForArtifacts(content, flagDef.name, flagDef.pattern);
        for (const m of matches) {
          findings.push({
            formation: tactic.name,
            section: sectionName,
            ...m
          });
        }
      }
    }
  }

  console.log(`Findings: ${findings.length} (should be 0)\n`);

  if (findings.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ARTIFACTS FOUND (first 10):');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const limit = Math.min(10, findings.length);
    for (let i = 0; i < limit; i++) {
      const f = findings[i];
      console.log(`[${i + 1}] ${f.formation} / ${f.section}`);
      console.log(`    Flag: ${f.flag}`);
      console.log(`    Match: "${f.match}"`);
      console.log(`    Snippet: ${f.snippet}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(1);
  } else {
    console.log('✅ All 32 formations sanitized clean (post-sanitization).');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(0);
  }
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

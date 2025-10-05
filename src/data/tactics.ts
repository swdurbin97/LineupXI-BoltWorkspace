import type { FormationTactics, TacticsContent } from '../types/tactics';

const URL_RE = /\bhttps?:\/\/\S+/gi;
const DOMAIN_RE = /\b[\w.-]+\.(?:com|org|net|io|co|uk)(?:\/\S*)?/gi;
const PLUS_CHAIN_RE = /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+/gi;

/**
 * Sanitizes text by removing URLs, domains, plus-chains, placeholder tokens, and trailing source citations.
 *
 * Test cases:
 * - "...defense.Wikipedia" → "...defense."
 * - "...effective.YouTube" → "...effective."
 * - "...build-ups.The Football Analyst" → "...build-ups."
 * - "...Jobs In FootballFootball insides" → "..." (strip tail, tidy spacing)
 * - "Text {{turn0view0}}, [turn1search2]" → "Text" (removes placeholder tokens)
 */
export function sanitizeText(input?: string): string {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");

  // Fix missing space after punctuation (prevents .YouTube from escaping rules)
  s = s.replace(/([.,;:])(?=[A-Za-z])/g, '$1 ');

  // Remove URLs and plus-chains first
  s = s.replace(URL_RE, "");
  s = s.replace(PLUS_CHAIN_RE, "");
  s = s.replace(DOMAIN_RE, "");

  // Remove domains with spaces around dot (e.g., "thetitansfa. com")
  // Also handle split domains left by other operations (e.g., "In. com")
  s = s.replace(/\b([\w-]+)\s*\.\s*(com|org|net|io|co|uk)\b/gi, "");
  // Clean up standalone TLD remnants
  s = s.replace(/\s+\.\s*(com|org|net|io|co|uk)\b/gi, "");

  // Remove placeholder tokens (with or without brackets): {{turn0view0}}, turn1search2, etc.
  s = s.replace(/[\[\(\{]{1,2}\s*turn\d+(?:view|search)\d+\s*[\]\)\}]{1,2}\s*,?/gi, '');
  s = s.replace(/\bturn\d+(?:view|search)\d+\b/gi, '');

  // Fix concatenated brand seams (targeted to avoid breaking camelCase)
  s = s.replace(/(Voice|Jobs|Community|Coaching)([A-Z][a-z]+)/g, '$1 $2');

  // Fix doubled brand fragments early (e.g., FootballFootball → Football, Jobs In FootballSoccer → Jobs In Football)
  s = s.replace(/\b([A-Z][a-z]+)\1\b/g, '$1');

  // Expanded brand list for comprehensive removal (case-insensitive)
  // Order matters: match longer phrases first to avoid partial matches
  // ONLY matches at end of line/paragraph, not in middle of text
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
    // Note: "Jobs In" removed - too short, causes false positives
  ];

  // Remove brands with optional suffixes at end of lines/paragraphs
  // Pattern handles: (brand)(?:'?\s*Voice| Coaching Pro)?(?:\s+(?:inside|insides))?
  let prev = '';
  while (prev !== s) {
    prev = s;
    for (const brand of brands) {
      const escapedBrand = brand.replace(/[()' .]/g, '\\$&');

      // Match brand at end with optional suffixes
      // Pattern 1: After punctuation (preserve the punctuation)
      // .Wikipedia → . (period stays), ,Talksport' Voice → , (comma stays)
      s = s.replace(
        new RegExp(`([.,])\\s*${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\s*$`, 'gi'),
        '$1'
      );

      // Pattern 2: After space (no punctuation before brand)
      // Jobs In FootballFootball insides → (empty)
      s = s.replace(
        new RegExp(`\\s+${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\s*$`, 'gi'),
        ''
      );
    }
  }

  // Remove brands anywhere in text (parentheses, citations, etc.)
  // This is more aggressive - targets brands in any context
  prev = '';
  while (prev !== s) {
    prev = s;
    for (const brand of brands) {
      const escapedBrand = brand.replace(/[()' .]/g, '\\$&');
      // Remove brand with optional suffixes in any position (not just end)
      s = s.replace(
        new RegExp(`\\b${escapedBrand}(?:'?\\s*Voice|\\s+Coaching Pro)?(?:\\s+(?:inside|insides))?\\b`, 'gi'),
        ''
      );
    }
  }

  // Generic title-case tail removal (last resort after brand list)
  // Remove trailing 1-5 TitleCase words ending with whitelisted terms
  // Reduces false positives by only matching known brand/source suffixes
  prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\s+(?:[A-Z][a-z']+\s+){0,4}(?:Voice|Community|Coaching|Analyst|Pro|FC|DNA)\.?$/g, '.');
  }

  // Clean double punctuation and fix spacing
  s = s.replace(/\.{2,}/g, '.').replace(/\s+\./g, '.');
  s = s.replace(/[ \t]+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();

  return s;
}

export function sanitizeList(items?: string[] | string): string[] {
  const arr = Array.isArray(items) ? items : normalizeToArray(items);
  return arr.map(sanitizeText).map(s => s.trim()).filter(Boolean);
}

/**
 * Load tactics content from public/data/tactics.json
 * Returns empty content if file is missing or invalid
 */
export async function loadTactics(): Promise<TacticsContent> {
  try {
    const response = await fetch('/data/tactics.json');
    if (!response.ok) {
      return { tactics_content: [] };
    }
    const data = await response.json();

    const sanitized: FormationTactics[] = (data.tactics_content || []).map((entry: any) => {
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

    return { tactics_content: sanitized };
  } catch (error) {
    console.warn('Failed to load tactics.json:', error);
    return { tactics_content: [] };
  }
}

/**
 * Normalize a value to an array of strings
 * Handles both string (split on \n, •, or ;) and array inputs
 */
export function normalizeToArray(value?: string | string[]): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  // Split on newlines, bullets, or semicolons
  return value
    .split(/[\n•;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

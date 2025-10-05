import type { FormationTactics, TacticsContent } from '../types/tactics';

const URL_RE = /\bhttps?:\/\/\S+/gi;
const DOMAIN_RE = /\b[\w.-]+\.(?:com|org|net|io|co|uk)(?:\/\S*)?/gi;
const PLUS_CHAIN_RE = /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+/gi;

/**
 * Sanitizes text by removing URLs, domains, plus-chains, and trailing source citations.
 *
 * Test cases:
 * - "...defense.Wikipedia" → "...defense."
 * - "...effective.Talksport' Voice" → "...effective."
 * - "...build-ups.Wikipedia" → "...build-ups."
 * - "...Jobs In FootballFootball insides" → "..." (strip tail, tidy spacing)
 */
export function sanitizeText(input?: string): string {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");

  // Remove URLs and plus-chains first
  s = s.replace(URL_RE, "");
  s = s.replace(PLUS_CHAIN_RE, "");
  s = s.replace(DOMAIN_RE, "");

  // Fix doubled brand fragments early (e.g., FootballFootball → Football)
  s = s.replace(/\b([A-Z][a-z]+)\1\b/g, '$1');

  // Expanded brand list for comprehensive removal
  const brands = [
    'Wikipedia',
    'Jobs In Football',
    "Coaches' Voice",
    "Coaches Voice",
    'Footballizer',
    'BlazePod',
    'Soccer Coaching Pro',
    'Talksport',
    'The Football Tactics Board',
    '3sportsessionplanner.com',
    'Football inside',
    'Football insides',
    'Football DNA',
    'Jobs In',
    'Coaching Pro',
    'In Football'
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

  // Cleanup: collapse whitespace and fix punctuation spacing
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

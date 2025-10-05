import type { FormationTactics, TacticsContent } from '../types/tactics';

const URL_RE = /\bhttps?:\/\/\S+/gi;
const DOMAIN_RE = /\b[\w.-]+\.(?:com|org|net|io|co|uk)(?:\/\S*)?/gi;
const PLUS_CHAIN_RE = /(?<!\s)\+(?:\d+|[A-Za-z][\w-]*)+/gi;

export function sanitizeText(input?: string): string {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");
  s = s.replace(URL_RE, "");
  s = s.replace(PLUS_CHAIN_RE, "");
  s = s.replace(DOMAIN_RE, "");

  // Remove trailing source names (iteratively until stable)
  const sources = [
    'Coaches Voice', "Coaches' Voice", 'Footballizer', 'Jobs In Football',
    'Wikipedia', 'BlazePod', 'Soccer Coaching Pro', 'Football DNA',
    'Jobs In', 'Coaching Pro', 'In Football'
  ];
  let prev = '';
  while (prev !== s) {
    prev = s;
    for (const source of sources) {
      const pattern = new RegExp(`\\s+${source.replace(/[()' ]/g, '\\$&')}\\s*$`, 'gi');
      s = s.replace(pattern, '');
    }
  }

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

import type { TacticsContent } from '../types/tactics';

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
    return data as TacticsContent;
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

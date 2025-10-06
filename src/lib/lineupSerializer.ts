import type { Lineup } from './types';
import type { SavedLineup, SerializedBuilderState } from '../types/lineup';

/**
 * Serialize current lineup state for comparison and saving
 */
export function serializeLineup(
  lineup: Lineup | null,
  formationName: string,
  teamName?: string | null
): SerializedBuilderState | null {
  if (!lineup) return null;

  // Convert benchSlots to bench array (filter out nulls)
  const bench = (lineup.benchSlots || []).filter((id): id is string => id !== null);

  return {
    formation: {
      code: lineup.formationCode,
      name: formationName
    },
    assignments: {
      onField: { ...lineup.onField },
      bench
    },
    teamId: lineup.teamId || null,
    teamName: teamName || null
  };
}

/**
 * Deep equality check for serialized states
 */
export function isEqual(a: SerializedBuilderState | null, b: SerializedBuilderState | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  if (a.formation.code !== b.formation.code) return false;
  if (a.teamId !== b.teamId) return false;

  // Compare onField
  const aKeys = Object.keys(a.assignments.onField).sort();
  const bKeys = Object.keys(b.assignments.onField).sort();
  if (aKeys.length !== bKeys.length) return false;
  if (aKeys.some((k, i) => k !== bKeys[i])) return false;
  if (aKeys.some(k => a.assignments.onField[k] !== b.assignments.onField[k])) return false;

  // Compare bench
  if (a.assignments.bench.length !== b.assignments.bench.length) return false;
  if (a.assignments.bench.some((id, i) => id !== b.assignments.bench[i])) return false;

  return true;
}


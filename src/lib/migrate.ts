import { Lineup } from './types';

export function migrateWorkingLineup(raw: any, formationsSeed: any): Lineup | null {
  // If raw is null/undefined → return null
  if (!raw) return null;

  // Start with a base structure
  const migrated: Lineup = {
    teamId: raw.teamId || '',
    formationCode: raw.formationCode || '',
    onField: {},
    benchSlots: Array(8).fill(null),
    bench: [], // Keep for backwards compat
    roles: raw.roles || {}
  };

  // If teamId is missing, cannot proceed
  if (!migrated.teamId) return null;

  // Handle benchSlots migration from old bench array
  if (Array.isArray(raw.benchSlots) && raw.benchSlots.length === 8) {
    // Already has benchSlots in correct format
    migrated.benchSlots = raw.benchSlots;
  } else if (Array.isArray(raw.bench) && raw.bench.length > 0) {
    // Migrate from old bench array to benchSlots
    const benchPlayers = raw.bench.slice(0, 8);
    migrated.benchSlots = Array(8).fill(null);
    benchPlayers.forEach((playerId: string, idx: number) => {
      if (playerId) migrated.benchSlots[idx] = playerId;
    });
  } else if (Array.isArray(raw.benchSlots)) {
    // Has benchSlots but wrong length - pad or trim to 8
    const slots = raw.benchSlots.slice(0, 8);
    migrated.benchSlots = Array(8).fill(null);
    slots.forEach((id: string | null, idx: number) => {
      if (id) migrated.benchSlots[idx] = id;
    });
  }

  // Handle formation and onField
  if (!migrated.formationCode && formationsSeed?.formations?.length > 0) {
    // No formation code - use first available
    migrated.formationCode = formationsSeed.formations[0].code;
  }

  // Find the formation to get slot codes
  const formation = formationsSeed?.formations?.find(
    (f: any) => f.code === migrated.formationCode
  );

  if (formation && formation.slot_map) {
    // Build proper onField map with all slots
    const newOnField: Record<string, string | null> = {};
    
    formation.slot_map.forEach((slot: any) => {
      const slotCode = slot.slot_code;
      // Preserve existing placement if it exists
      if (raw.onField && typeof raw.onField === 'object' && raw.onField[slotCode]) {
        newOnField[slotCode] = raw.onField[slotCode];
      } else {
        newOnField[slotCode] = null;
      }
    });
    
    migrated.onField = newOnField;
  } else if (raw.onField && typeof raw.onField === 'object') {
    // No formation found but has onField - preserve it
    migrated.onField = raw.onField;
  } else {
    // No valid onField or formation - create empty map
    if (formationsSeed?.formations?.length > 0) {
      const defaultFormation = formationsSeed.formations[0];
      migrated.formationCode = defaultFormation.code;
      const newOnField: Record<string, string | null> = {};
      defaultFormation.slot_map.forEach((slot: any) => {
        newOnField[slot.slot_code] = null;
      });
      migrated.onField = newOnField;
    }
  }

  return migrated;
}
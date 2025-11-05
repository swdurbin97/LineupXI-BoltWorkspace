import type { PositionCode } from './positions';

/**
 * Position Relations - Sprint 2 Scaffold
 *
 * This file defines the compatibility scoring system for auto-placement logic.
 * Scores range from 0.0 (incompatible) to 1.0 (perfect match).
 *
 * STATUS: Scaffold only - awaiting compatibility data from Stephen
 * INTEGRATION: Sprint 2 (Phase 2C auto-placement feature)
 */

export const POSITION_RELATIONS: Record<
  PositionCode,
  Partial<Record<PositionCode, number>>
> = {
  // TODO (Sprint 2): Populate with compatibility scores
  // Example structure (awaiting real data):
  //
  // CB: {
  //   CB: 1.0,   // Perfect match
  //   LB: 0.7,   // Good compatibility
  //   RB: 0.7,   // Good compatibility
  //   CDM: 0.6,  // Moderate compatibility
  //   LWB: 0.5,  // Fair compatibility
  //   RWB: 0.5   // Fair compatibility
  // },
  //
  // ST: {
  //   ST: 1.0,   // Perfect match
  //   CF: 0.9,   // Very high compatibility
  //   LF: 0.7,   // Good compatibility
  //   RF: 0.7,   // Good compatibility
  //   CAM: 0.5   // Fair compatibility
  // }
};

/**
 * Calculate compatibility score between a player's position and a formation slot.
 *
 * @param playerPos - Player's primary or secondary position
 * @param slotPos - Formation slot position code
 * @returns Compatibility score (0.0 - 1.0) or null if no relation defined
 *
 * @example
 * getCompatibilityScore('CB', 'CB')  // 1.0 (perfect match)
 * getCompatibilityScore('CB', 'CDM') // 0.6 (moderate)
 * getCompatibilityScore('GK', 'ST')  // 0.0 or null (incompatible)
 *
 * TODO (Sprint 2): Implement scoring logic once POSITION_RELATIONS is populated
 * TODO (Sprint 2): Add fallback strategy for missing relations
 * TODO (Sprint 2): Consider bidirectional scoring (A→B vs B→A)
 */
export function getCompatibilityScore(
  playerPos: PositionCode,
  slotPos: PositionCode
): number | null {
  // TODO (Sprint 2): Implement scoring algorithm
  //
  // Suggested implementation:
  // const relations = POSITION_RELATIONS[playerPos];
  // if (!relations) return null;
  // return relations[slotPos] ?? null;

  return null;
}

/**
 * Get all compatible positions for a given player position, sorted by score.
 *
 * @param playerPos - Player's position
 * @param minScore - Minimum compatibility threshold (default: 0.5)
 * @returns Array of [PositionCode, score] tuples, sorted descending
 *
 * TODO (Sprint 2): Implement for auto-placement suggestions
 */
export function getCompatiblePositions(
  playerPos: PositionCode,
  minScore: number = 0.5
): Array<[PositionCode, number]> {
  // TODO (Sprint 2): Implement
  return [];
}

/**
 * Find best available slot for a player based on position compatibility.
 *
 * @param playerPos - Player's primary position
 * @param availableSlots - Array of open formation slots
 * @returns Best matching slot code or null if none suitable
 *
 * TODO (Sprint 2): Core logic for auto-placement feature
 */
export function suggestBestSlot(
  playerPos: PositionCode,
  availableSlots: PositionCode[]
): PositionCode | null {
  // TODO (Sprint 2): Implement auto-placement algorithm
  //
  // Suggested approach:
  // 1. Calculate compatibility scores for all available slots
  // 2. Return slot with highest score above threshold (e.g., 0.5)
  // 3. Return null if no suitable slots found

  return null;
}

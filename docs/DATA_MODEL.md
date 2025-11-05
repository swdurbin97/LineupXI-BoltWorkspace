# LineupXI Data Model

**Version**: 2.0 (Sprint 1)
**Last Updated**: January 2025
**Status**: Active Development (Phase 2)

---

## Overview

This document defines the core data structures used throughout LineupXI. All types are defined in TypeScript and enforced at build time.

**Key Storage Layers:**
- **Phase 1 (MVP)**: localStorage-based persistence
- **Phase 2 (Current)**: Migration to Supabase PostgreSQL with user authentication
- **Future**: Real-time sync, team sharing, cloud backups

---

## Core Models

### Player

Represents an individual athlete on a team roster.

```typescript
interface Player {
  id: string;                    // UUID generated at creation
  name: string;                  // Full player name
  jersey: number;                // Shirt number (1-99)
  primaryPos: PositionCode;      // Main position (validated)
  secondaryPos?: PositionCode[]; // Up to 3 alternative positions (Phase 2B)
  foot?: 'L' | 'R' | 'B';        // Preferred foot: Left, Right, Both
  notes?: string;                // Free-text coach notes
  status?: PlayerStatus;         // Availability status
}

type PlayerStatus = 'available' | 'injured' | 'unavailable' | 'suspended';

// Sprint 1: Position codes are now validated constants
type PositionCode =
  | "GK"   // Goalkeeper
  | "CB"   // Center Back
  | "LB"   // Left Back
  | "RB"   // Right Back
  | "LWB"  // Left Wing Back
  | "RWB"  // Right Wing Back
  | "CDM"  // Central Defensive Midfielder
  | "CM"   // Central Midfielder
  | "CAM"  // Central Attacking Midfielder
  | "LM"   // Left Midfielder
  | "RM"   // Right Midfielder
  | "LW"   // Left Winger
  | "RW"   // Right Winger
  | "CF"   // Center Forward
  | "ST"   // Striker
  | "LAM"  // Left Attacking Midfielder
  | "RAM"  // Right Attacking Midfielder
  | "LF"   // Left Forward
  | "RF";  // Right Forward
```

**Storage:**
- **Current**: Nested in `Team.players[]` array in localStorage
- **Phase 2A+**: Supabase `players` table with `team_id` foreign key

**Validation Rules:**
- `jersey` must be unique within team
- `primaryPos` must be valid PositionCode (enforced by dropdown)
- `secondaryPos` limited to 3 positions max (Phase 2B)
- `name` cannot be empty

**Migration Notes (Sprint 1):**
- Legacy free-text positions normalized to PositionCode on load
- Migration flag: `positions-normalized-v1` in localStorage
- Invalid positions default to empty string (user must fix)

---

### Team

A collection of players representing a squad.

```typescript
interface Team {
  id: string;              // UUID generated at creation
  name: string;            // Team display name
  colors?: {
    primary?: string;      // Hex color (future: kit customization)
    secondary?: string;    // Hex color
  };
  players: Player[];       // Array of player objects
  createdAt?: number;      // Unix timestamp (Phase 2)
  updatedAt?: number;      // Unix timestamp (Phase 2)
}
```

**Storage:**
- **Current**: localStorage key `lineupxi:teams:v1` (array of teams)
- **Phase 2A+**: Supabase `teams` table with `user_id` foreign key

**Validation Rules:**
- `name` cannot be empty
- Team must have unique `id`
- Players within team must have unique jersey numbers

**Relationships:**
- One team → Many players
- One team → Many saved lineups

---

### Formation

A tactical template defining player slot positions on the pitch.

```typescript
interface Formation {
  code: string;              // Unique identifier (e.g., "442", "433")
  name: string;              // Display name (e.g., "4-4-2")
  style: string;             // Tactical classification
  description?: string;      // Brief overview
  slot_map: FormationSlot[]; // Array of 11 position slots
}

interface FormationSlot {
  slot_id: string;           // Unique: "{code}:{position}:{index}"
  slot_code: PositionCode;   // Position abbreviation (CB, CM, ST, etc.)
  x: number;                 // Horizontal position (0-105 units)
  y: number;                 // Vertical position (0-68 units)
}
```

**Example Slot ID**: `"442:CM:1"` = Second central midfielder in 4-4-2

**Coordinate System:**
- Pitch dimensions: 105 × 68 units
- Origin: Bottom-left (0, 0)
- Goalkeeper at top: y ≈ 94
- Attackers at bottom: y ≈ 20-30
- Left-to-right orientation

**Storage:**
- **Read-only data**: `/public/data/formations.json`
- **Overrides**: `/public/data/formation-overrides.json` (manual fixes)
- **Not user-editable** (admin content only)

---

### Lineup

A complete team selection with player assignments to formation slots.

```typescript
interface Lineup {
  teamId: string;                        // Reference to Team
  teamName?: string;                     // Cached for display
  formationCode: string;                 // Reference to Formation
  formationName?: string;                // Cached for display
  onField: Record<string, string | null>; // slotId → playerId mapping
  benchSlots: (string | null)[];         // Array of 8 player IDs
  roles: LineupRoles;                    // Special assignments
}

interface LineupRoles {
  captain?: string;       // Player ID of team captain
  viceCaptain?: string;   // Player ID of vice-captain (Phase 2C)
  gk?: string;            // Backup goalkeeper (set pieces)
  pk?: string;            // Penalty kick taker
  ck?: string;            // Corner kick taker
  fk?: string;            // Free kick taker
}
```

**Storage:**
- **Working Lineup**: localStorage key `lineupxi:working_lineup:v1`
- **Saved Lineups**: localStorage key `lineupxi:saved_lineups:v1` (array)
- **Phase 2A+**: Supabase `saved_lineups` table

**Validation Rules:**
- Must have exactly 1 goalkeeper on field (enforced by UI)
- Cannot assign same player to multiple field slots
- Bench limited to 8 slots
- All player IDs must exist in referenced team

---

### SavedLineup

A persisted lineup with metadata for later retrieval.

```typescript
interface SavedLineup {
  id: string;                   // UUID
  name: string;                 // User-defined lineup name
  teamId: string;               // Reference to Team
  teamName: string;             // Cached team name
  formation: {
    code: string;               // Formation code
    name: string;               // Formation display name
  };
  assignments: {
    onField: Record<string, string>;  // Only assigned slots
    bench: string[];                   // Compact array (no nulls)
  };
  roles?: LineupRoles;          // Captain and set piece takers
  notes?: string;               // User notes about the lineup
  createdAt: number;            // Unix timestamp (ms)
  updatedAt: number;            // Unix timestamp (ms)
}
```

---

## Position System (Sprint 1)

### Position Constants

Defined in `src/data/positions.ts`:

```typescript
export const POSITIONS = [
  "GK",        // Goalkeeper
  "CB",        // Center Back
  "LB", "RB",  // Full Backs
  "LWB", "RWB", // Wing Backs
  "CDM",       // Defensive Midfielder
  "CM",        // Central Midfielder
  "CAM",       // Attacking Midfielder
  "LM", "RM",  // Wide Midfielders
  "LAM", "RAM", // Wide Attacking Midfielders
  "LW", "RW",  // Wingers
  "LF", "RF",  // Wide Forwards
  "CF",        // Center Forward
  "ST"         // Striker
] as const;

export type PositionCode = typeof POSITIONS[number];
```

### Position Normalization

Legacy/free-text positions normalized via `src/lib/normalizers.ts`:

**Mapping Examples:**
- "goalkeeper", "keeper", "gk" → `"GK"`
- "centre back", "center back", "centerback" → `"CB"`
- "left midfield", "left mid" → `"LM"`
- "striker", "forward", "attacker" → `"ST"`

**Migration:**
- Runs once on app load (guarded by `positions-normalized-v1` flag)
- Normalizes all players across all teams
- Logs summary to console (normalized, unchanged, failed)

---

## CSV Import/Export Format

### Player CSV Format

**Headers (required):**
```csv
name,jersey,position,foot,status,notes
```

**Import Behavior (Sprint 1):**
- Position column normalized via `normalizers.ts`
- Invalid positions skip row with warning
- Duplicate jersey numbers within import rejected
- Summary shown after import: "Imported X, Skipped Y"
- Console log shows skipped rows with details

**Export Behavior:**
- Only exports validated PositionCode values
- Status defaults to "available" if missing
- Notes column optional (empty if not set)

---

## Validation Rules Summary

### Player Validation
- ✅ Name: Non-empty string
- ✅ Jersey: Integer 1-99, unique within team
- ✅ Primary Position: Must be valid PositionCode
- ✅ Secondary Positions: Max 3, all must be valid (Phase 2B)
- ✅ Foot: Must be 'L', 'R', or 'B' (optional)
- ✅ Status: Must be valid PlayerStatus (optional, defaults to 'available')

### Team Validation
- ✅ Name: Non-empty string
- ✅ Players: No duplicate jersey numbers

### Lineup Validation
- ✅ Exactly 1 goalkeeper on field
- ✅ No player assigned to multiple field slots
- ✅ Bench limited to 8 players
- ✅ All player IDs exist in team
- ✅ Formation code must exist

---

## Type Definitions Location

All TypeScript type definitions are located in:
- `src/lib/types.ts` - Core Player, Team types
- `src/types/lineup.ts` - Lineup and SerializedLineup types
- `src/types/formation.ts` - Formation and FormationSlot types
- `src/types/tactics.ts` - TacticsContent types
- `src/data/positions.ts` - PositionCode type (Sprint 1)

---

**Document Maintained By**: Development Team
**Review Frequency**: Each sprint/phase completion
**Related Docs**: ARCHITECTURE.md, GLOSSARY.md

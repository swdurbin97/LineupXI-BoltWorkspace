# LineupXI Glossary

**Version**: 2.0
**Last Updated**: January 2025 (Sprint 1)

---

## Core Concepts

### Formation
A tactical arrangement of players on the field, defined by numeric notation (e.g., "4-4-2", "3-5-2"). Each formation has:
- **Formation Code**: Unique identifier (e.g., "442", "352")
- **Formation Name**: Display name matching the code
- **Slot Map**: Array of position slots with x/y coordinates on the pitch
- **Style**: Tactical classification (e.g., "Balanced", "Attacking", "Defensive")

### Lineup
A complete team selection for a match, consisting of:
- **Starting XI**: 11 players assigned to formation slots on the field
- **Bench**: Up to 8 substitute players
- **Roles**: Special assignments (captain, goalkeeper, set piece takers)
- **Formation**: The tactical shape being used

**Important Distinction**: A formation is a tactical template; a lineup is the actual player assignments.

### Team / Teamsheet
A roster of players available for selection. Contains:
- **Team Name**: Display name for the squad
- **Players**: Array of player objects
- **Team Colors**: Optional primary/secondary colors (future feature)

### Player
An individual athlete on the teamsheet with:
- **Name**: Full player name
- **Jersey Number**: Unique within the team
- **Primary Position**: Main positional role (validated PositionCode)
- **Secondary Positions**: Array of alternative positions (up to 3, Phase 2B)
- **Foot**: Preferred foot (L, R, or B for both)
- **Status**: Availability (available, injured, unavailable, suspended)
- **Notes**: Optional text field

### Position
A role on the field defined by a standardized code. LineupXI uses 19 canonical positions:

**Goalkeeper:**
- GK - Goalkeeper

**Defenders:**
- CB - Center Back
- LB - Left Back
- RB - Right Back
- LWB - Left Wing Back
- RWB - Right Wing Back

**Midfielders:**
- CDM - Central Defensive Midfielder
- CM - Central Midfielder
- CAM - Central Attacking Midfielder
- LM - Left Midfielder
- RM - Right Midfielder
- LAM - Left Attacking Midfielder
- RAM - Right Attacking Midfielder

**Attackers:**
- CF - Center Forward
- ST - Striker
- LW - Left Winger
- RW - Right Winger
- LF - Left Forward
- RF - Right Forward

**Position vs. Slot:** A "position" is a player attribute; a "slot" is a formation coordinate where a player is placed.

### Slot
A specific position in a formation's slot map:
- **Slot ID**: Unique identifier (e.g., "442:CB:0")
- **Slot Code**: Position abbreviation (e.g., "CB", "CM", "ST")
- **Coordinates**: X/Y position on 105x68 pitch (bottom-left origin)

### Tactics
Educational content describing how to use a formation effectively:
- **Overview**: General description and philosophy
- **Advantages**: Strengths of the formation
- **Disadvantages**: Weaknesses and vulnerabilities
- **Player Roles**: Responsibilities by position
- **Counter Tactics**: How to play against this formation
- **Suggested Counters**: Formations that counter this setup

---

## User Workflows

### Teamsheet Management
Creating and maintaining a roster of players:
1. Create a new team
2. Add players with jersey numbers and positions
3. Import/export players via CSV
4. Edit player details and availability status

### Lineup Building
Assigning players to a formation:
1. Select a team
2. Choose a formation
3. Drag players to field positions
4. Assign players to bench slots
5. Set roles (captain, set piece takers)
6. Save the lineup for future use

### Saved Lineups
Storing and loading complete lineups:
- **Create**: Save a new lineup with name and notes
- **Load**: Restore a saved lineup to the builder
- **Duplicate**: Create a copy for variations
- **Rename**: Update lineup name
- **Delete**: Remove a saved lineup
- **View**: Preview lineup without loading to builder

### Tactics Explorer
Learning about formations and positions:
- Browse formations by backline (3-back, 4-back, 5-back)
- Search formations by name or tactical attributes
- View detailed formation analysis
- Read position guides and responsibilities

---

## Data Model Terms

### Persistence
- **localStorage**: Current storage mechanism (Phase 2A migrating to Supabase)
- **User Data**: Teams, players, lineups (will be user-scoped after auth)
- **Static Data**: Formations, tactics, position definitions (read-only)

### Assignment Types
- **onField**: Record mapping slot IDs to player IDs
- **benchSlots**: Array of 8 player IDs (or null for empty slots)
- **roles**: Object with captain, GK, and set piece taker assignments

### State Management
- **TeamsContext**: Global state for all teams and players
- **LineupsContext**: Global state for lineup builder
- **working**: The current lineup being edited in the builder

---

## UI Component Terms

### Builder Sections
- **Field**: Visual pitch with draggable player slots
- **Bench Grid**: 8 slots for substitute players
- **Available Players**: Unassigned players from the roster
- **Roles Panel**: Captain and set piece assignments
- **Formation Picker**: Dropdown to change tactical shape

### Player Card Variants
- **DEFAULT**: Large cards in available section (116x156px)
- **FIELD**: Medium cards on the pitch (84x118px)
- **BENCH**: Small cards in bench grid (80x104px)

### Visual Elements
- **Slot Marker**: Circular position indicator on the field
- **Player Badge**: Jersey number and position on slot marker
- **Role Badge**: Captain "C" or set piece indicators
- **Mini Pitch Preview**: Small field visualization in saved lineup cards

---

## Technical Terms

### Formation Overrides
Customized x/y coordinates for specific formations to fix visual overlaps:
- Stored in `/public/data/formation-overrides.json`
- Applied at runtime via `formationOverrides.ts`
- Used by position editor tool in lineup builder

### Position Relations (Sprint 2)
Compatibility scores between positions for auto-placement:
- Stored in `src/data/position-relations.ts`
- Numeric scores from 0.0 (incompatible) to 1.0 (perfect match)
- Used to calculate optimal slot suggestions

### Serialization
Converting lineup state to/from storage format:
- **SerializedBuilderState**: Flattened format for persistence
- Includes assignments, formation metadata, team info
- Used for saved lineups and change detection

### Position Normalization (Sprint 1)
Converting legacy/free-text position strings to validated PositionCode:
- Mapping table in `src/lib/normalizers.ts`
- Applied during CSV import and data migration
- Examples: "centre back" → "CB", "striker" → "ST"

---

## Common Abbreviations

- **MVP**: Minimum Viable Product (Phase 1)
- **RLS**: Row-Level Security (Supabase feature for data isolation)
- **XI**: Eleven (starting lineup, pronounced "eleven")
- **CAM**: Central Attacking Midfielder (also called "number 10")
- **CDM**: Central Defensive Midfielder (also called "pivot" or "holding mid")
- **CB**: Center Back (also called "centre-back")
- **ST**: Striker (also called "forward")
- **GK**: Goalkeeper (also called "keeper")
- **CSV**: Comma-Separated Values (import/export format)

---

## Deprecated Terms

These terms were used in earlier builds but should be avoided:

- ❌ **orientation**: Field direction (always left→right in current version)
- ❌ **bench** (as array): Old storage format, replaced by benchSlots
- ❌ **yslm**: Internal prefix from early prototypes, being phased out
- ❌ **rail**: Deprecated player card variant name

---

## Future Terminology (Phase 2+)

Terms planned for upcoming phases:

- **User Profile**: Account settings and preferences (Phase 2A)
- **Team Sharing**: Multi-user access to rosters (future)
- **Position Zones**: Visual areas on field for position education (Phase 2G)
- **Auto-Placement**: Smart player slot suggestions (Phase 2C)
- **Swap Logic**: Two-way player exchange on drag-drop (Phase 2C)
- **Secondary Positions**: Alternative positions for versatile players (Phase 2B)

---

**Document Maintained By**: Development Team
**Related Docs**: ARCHITECTURE.md, DATA_MODEL.md

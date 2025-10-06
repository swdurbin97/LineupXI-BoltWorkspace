# Saved Lineups Implementation (Archive-Only)

## Overview
Implemented localStorage-based saved lineups feature as an **archive-only view/manage system**. Users can save, rename, duplicate, and delete lineups from the Lineup page, then view and manage them on the /saved page.

**IMPORTANT:** Loading saved lineups back into the builder is NOT supported. Saved Lineups is purely for viewing and managing your lineup collection.

**Updates:**
- **Task 1 (Simplified UX):** Single "Save Lineup" / "Save Changes" button on Lineup page. Management actions (Rename, Duplicate, Delete) only on /saved page.
- **Task A (Archive-Only):** Removed all "Load" functionality. No hydration, no diff modal, no cross-team/formation loading.

---

## Architecture

### Lineup Page (Builder)
**Purpose:** Build and save lineups
**Features:**
- Place players on field (drag & drop)
- Assign bench players
- Set roles (captain, set pieces)
- **Save Lineup** - Creates new entry in archive
- **Save Changes** - Updates existing entry (when dirty)

**NOT Supported:**
- Loading saved lineups back into builder
- "Loaded: [name]" status chip (removed)
- Cross-team or cross-formation hydration

### Saved Lineups Page (/saved)
**Purpose:** View and manage lineup archive
**Features:**
- **Grid View** - Cards with mini pitch preview
- **List View** - Table with name, team, formation, players, updated date
- **Search** - Filter by lineup name
- **Filters** - Team, formation
- **Sort** - Updated date, name (asc/desc)
- **Actions** - Rename, Duplicate, Delete (via kebab menu)

**NOT Supported:**
- Load button (removed)
- Navigate to /lineup with loadSavedId
- Diff modal comparing current vs saved

---

## Files

### Core Logic
- **src/lib/savedLineups.ts** - localStorage CRUD (list, get, saveNew, update, remove, duplicate)
- **src/lib/lineupSerializer.ts** - Serialization (serializeLineup, isEqual)
- **src/lib/toast.ts** - Toast notifications
- **src/types/lineup.ts** - SavedLineup, SerializedBuilderState types

### UI Components
- **src/components/modals/SaveLineupModal.tsx** - Save/SaveAs modal
- **src/components/modals/RenameLineupModal.tsx** - Rename modal
- **src/components/modals/DeleteConfirmModal.tsx** - Delete confirmation
- **src/components/saved/SavedLineupCard.tsx** - Grid card component
- **src/pages/saved/index.tsx** - Saved Lineups page
- **src/pages/lineup/index.tsx** - Lineup builder page

### Removed (Task A)
- ~~**src/components/modals/LoadLineupModal.tsx**~~ - DELETED
- ~~computeDiff, savedToSerialized~~ - Removed from lineupSerializer.ts
- ~~LoadOptions, hydrating state, beginApplyLoadedLineup~~ - Removed from lineup page
- ~~"Loaded: [name]" chip~~ - Removed from header
- ~~Shell/Core split for hydration~~ - Simplified back to single component

---

## Data Structure

### LocalStorage Key
```
lineupxi:saved_lineups:v1
```

### SavedLineup
```typescript
{
  id: string;               // sl_<timestamp>_<random>
  name: string;
  teamId?: string | null;
  teamName?: string | null;
  formation: { code: string; name: string };
  createdAt: number;        // epoch ms
  updatedAt: number;
  assignments: {
    onField: Record<string, string | null>;  // slotId -> playerId
    bench: string[];                         // player IDs
  };
  roles?: {
    captain?: string;
    gk?: string;
    pk?: string;
    ck?: string;
    fk?: string;
  };
  notes?: string;
}
```

---

## User Flows

### Save New Lineup
1. Build lineup on /lineup page
2. Click "Save Lineup" button
3. Modal opens with prefilled name: `Team — Formation — YYYY-MM-DD`
4. (Optional) Edit name, add notes
5. (Optional) Check "Create a copy instead of updating" if lineup is already loaded
6. Click "Save Lineup"
7. Toast: "Lineup saved"
8. Entry appears on /saved page

### Update Existing Lineup
1. Make changes to lineup (move player, change bench, etc.)
2. Orange dot appears (dirty indicator)
3. "Save Changes" button enables
4. Click "Save Changes" (or Ctrl/Cmd+S)
5. Direct update, no modal
6. Toast: "Changes saved"
7. Orange dot disappears, button disabled

### View Saved Lineups
1. Navigate to /saved
2. Grid or List view
3. See: Name, team chip, formation chip, mini preview
4. Footer: "X/11 on field, Y on bench", "Updated Z ago"

### Rename Lineup
1. On /saved page, click kebab menu (•••) on card
2. Select "Rename"
3. Modal opens with current name
4. Edit name, click "Rename Lineup"
5. Toast: "Lineup renamed"

### Duplicate Lineup
1. On /saved page, click kebab menu
2. Select "Duplicate"
3. Copy created instantly with " (copy)" suffix
4. Toast: "Lineup duplicated"

### Delete Lineup
1. On /saved page, click kebab menu
2. Select "Delete"
3. Confirmation modal appears
4. Click "Delete Lineup"
5. Toast: "Lineup deleted"
6. Entry removed from list

---

## Save Button Behavior

| State | Button Label | Click Action | Disabled? |
|-------|--------------|--------------|-----------|
| New lineup (no loaded ID) | "Save Lineup" | Opens Save modal | No |
| Loaded + dirty | "Save Changes" | Direct update (no modal) | No |
| Loaded + clean | "Save Changes" | - | Yes (grey) |

**Keyboard:** Ctrl/Cmd+S triggers same behavior as button

---

## Dirty Detection

**Dirty state** = Current lineup differs from `lastSavedSnapshot`

**Triggers:**
- Place/remove player on field
- Assign/remove player from bench
- Change role (captain, set pieces)
- Switch formation (resets dirty state)

**Visual Indicator:**
- Orange dot appears when dirty
- "Save Changes" button enables

**Comparison:** Deep equality check via `isEqual(currentSerialized, lastSavedSnapshot)`

---

## Empty States

### Saved Lineups Page (No Lineups)
```
No saved lineups yet

Get started by building a lineup and clicking "Save Lineup".

[Open Lineup Builder] button → navigates to /lineup
```

### Saved Lineups Page (No Matches)
```
No lineups match your filters.

(Try different search/filter criteria)
```

---

## Implementation Notes

### Why Archive-Only?
**Problem:** Loading saved lineups across teams/formations caused:
- "Rendered fewer hooks than expected" crashes
- Complex hydration logic (setTimeout, two-phase loading)
- Diff modals, cross-team player resolution
- Unclear UX (when to switch team? formation? both?)

**Solution:** Remove loading entirely
- Saved Lineups = read-only archive
- Lineup builder = independent workspace
- Simpler codebase, no hydration bugs
- Clear separation of concerns

### Removed Complexity
- ~~LoadLineupModal.tsx~~ (100+ lines)
- ~~computeDiff, savedToSerialized~~ (50+ lines)
- ~~hydrating state, Phase 2 useEffect~~ (60+ lines)
- ~~beginApplyLoadedLineup~~ (40+ lines)
- ~~Shell/Core split~~ (70+ lines)
- **Total:** ~320 lines removed

### Bundle Impact
- Before (with load): 309.41 KB (93.87 KB gzipped)
- After (archive-only): 300.09 KB (91.76 KB gzipped)
- **Savings:** -9.32 KB (-2.11 KB gzipped)

---

## Future Enhancements (Not Implemented)

### View Modal (Planned Next)
- Mini pitch + bench visualization
- Read-only, no editing
- "Close" button only

### Snapshot Capture (Planned)
- PNG/JPG of lineup formation
- Attached to SavedLineup
- Displayed in cards/view modal

### Export/Import (Deferred)
- JSON export of lineup
- Import from file
- Share lineups between users

### Notes & Tags (Deferred)
- Rich text notes
- Tags/categories for filtering
- Favorite/star lineups

---

## Technical Details

### Storage Limits
- localStorage max: ~5-10 MB (browser dependent)
- Typical lineup: ~1-2 KB
- Estimated capacity: ~2,500-5,000 lineups
- Error handling: `StorageFullError` with user-friendly message

### Data Safety
- All updates wrapped in try/catch
- Toast feedback on errors
- No data loss on failed saves
- Defensive JSON parsing (Shell error panel)

### Performance
- Instant save (synchronous localStorage)
- Instant CRUD operations
- No network latency
- List refresh after mutations

---

## Acceptance Criteria ✅

✅ No "Load" button anywhere (grid, list, kebab menu)
✅ No LoadLineupModal file (deleted)
✅ No hydration/loading logic in lineup page
✅ No "Loaded: [name]" chip in header
✅ Saving still works (creates/updates entries)
✅ Toast confirms save
✅ Saved Lineups page: grid/list, search, filters, sort
✅ CRUD operations: Rename, Duplicate, Delete
✅ Build passes (300.09 KB, 91.76 KB gzipped)
✅ No unused imports or dead code

---

## QA Results

**Test 1: Save New Lineup**
- ✅ Build lineup → Click "Save Lineup" → Modal opens
- ✅ Confirm → Entry appears on /saved
- ✅ Toast: "Lineup saved"

**Test 2: Update Lineup**
- ✅ Move player → Orange dot appears
- ✅ Click "Save Changes" → No modal, direct update
- ✅ Toast: "Changes saved"

**Test 3: Saved Lineups Page**
- ✅ Grid view shows cards with preview
- ✅ List view shows table
- ✅ Search, filters, sort work
- ✅ No Load button visible

**Test 4: Rename/Duplicate/Delete**
- ✅ Kebab menu shows 3 actions only
- ✅ Rename modal works
- ✅ Duplicate creates copy
- ✅ Delete confirmation works

**Test 5: Code Search**
- ✅ No occurrences of `loadSavedId`
- ✅ No occurrences of `LoadLineupModal`
- ✅ No occurrences of `computeDiff`
- ✅ No occurrences of `beginApplyLoadedLineup`
- ✅ No occurrences of `hydrating` state

**Test 6: Build**
- ✅ `npm run build` succeeds
- ✅ No TypeScript errors
- ✅ No unused imports

---

The Saved Lineups feature is now a simple, reliable archive system. Users save lineups from the builder and manage them on /saved, with no complex loading or hydration logic.

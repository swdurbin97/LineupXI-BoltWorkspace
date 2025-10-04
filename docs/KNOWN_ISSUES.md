# Known Issues – MVP Focus

This file lists the known bugs and incomplete features that must be resolved to achieve the MVP goals.

---

## 1️⃣ Formation Positioning
- **Issue:** Player markers are misaligned on the field (incorrect X/Y coordinates).  
- **Expected:** Markers should match the proper formation layout defined in `FormationVisualsFinal.pdf` and `formationSeed.js`.  
- **Impact:** Core lineup visualization is inaccurate.  
- **Files:** `src/components/FormationField.jsx`, `src/data/formationSeed.js`.  
- **Priority:** High

---

## 2️⃣ Position Label Cleanup
- **Issue:** Player markers display numeric suffixes (e.g., “CB1”, “CB2”) on the field.  
- **Expected:** Display only base position codes (e.g., “CB”, “ST”). Numeric identifiers may remain in data for internal reference.  
- **Impact:** Visual clutter and inconsistency.  
- **Fix Scope:** Front-end presentation only.  
- **Priority:** High

---

## 3️⃣ Save Lineup Feature
- **Issue:** Lineup save functionality is not implemented.  
- **Expected:** Coaches can save the current lineup and see it listed on the Saved Lineups tab.  
- **Impact:** Major MVP requirement incomplete.  
- **Dependencies:** Requires localStorage or lightweight JSON persistence.  
- **Priority:** High

---

## 4️⃣ Responsive Field Scaling
- **Issue:** Field and player positions distort when resizing the browser window.  
- **Expected:** Maintain a **1:2 pixel ratio (height:width)** for the field container while preserving player positioning relative to field center.  
- **Impact:** Poor UX and layout inconsistency.  
- **Fix Scope:** Likely CSS grid or SVG scaling adjustments.  
- **Priority:** Medium

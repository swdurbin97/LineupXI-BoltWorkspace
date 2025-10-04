# MVP Scope – LineupXI

This document defines the Minimum Viable Product (MVP) requirements for the **LineupXI** web application.  
The MVP delivers the essential functionality needed for youth soccer coaches to create, manage, and visualize team lineups efficiently.

---

## 🎯 MVP Goals
- Enable coaches to build, save, and load accurate team lineups.
- Ensure the field layout and formation positioning are visually correct and responsive.
- Centralize essential coaching tools (TeamSheets, LineupBuilder, Saved Lineups, and Tactics) in a single interface.
- Provide a stable and functional base for future feature expansion.

---

## 🧩 Core MVP Features

| Priority | Feature | Description |
|-----------|----------|-------------|
| 1️⃣ | **Team Creation** | Create and name new teams within the app. Add, edit, and delete players for each team. |
| 2️⃣ | **Player Import (CSV)** | Import player lists from a CSV file. Imported data populates the TeamSheets tab automatically and prevents duplicate players. |
| 3️⃣ | **Formation Selection & Drag-and-Drop Lineup Builder** | Select formations (e.g., 4-3-3, 3-5-2, etc.), drag and drop players into correct field positions, and display accurate position markers per formation coordinates. Position labels show base abbreviations only (e.g., “CB”, “ST”) without numeric suffixes. |
| 4️⃣ | **Save & Load Lineups** | Save current lineups locally (localStorage or JSON store). Saved configurations appear under the Saved Lineups tab and can be re-loaded into the builder. |
| 5️⃣ | **Tactics Tab** | Display formation diagrams, descriptions, and tactical advantages/disadvantages from the existing formation seed data. |
| 6️⃣ | **Field Responsiveness & Layout** | Maintain a consistent **1:2 pixel ratio (height:width)** for the field container, representing a standard 60×120-yard layout. Ensure all elements scale properly when resizing the browser window. |

---

## 🧱 Stretch (Post-MVP) Features
- Player editing enhancements and personalized notes.  
- Team import/export via external APIs.  
- Training drill integration and scheduling.  
- Notion synchronization for session documentation.  
- Dark mode toggle.  

---

## ✅ Success Criteria
- App runs successfully in Bolt with `npm run dev` and no console errors.  
- All MVP features function correctly and visually align with formation references.  
- Field maintains its 1:2 ratio across viewport sizes.  
- Coaches can create, import, and save team lineups end-to-end without encountering UI errors.  

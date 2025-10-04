# LineupXI Frontend (MVP Build)

This is the React + Vite + Tailwind client for the **LineupLab MVP**.
Bolt should work **only inside `frontend/src/`** and follow `/docs/MVP_SCOPE.md`.

---

## Rules for Bolt
- Modify code only in `frontend/src/**` (keep changes small/atomic).
- Ignore `/_legacy`, `/design`, `/data_reference`, and root `/assets` unless told.
- After each patch, STOP and ask me to run locally:

    npm run dev -- --port 5179 --open

---

## Structure (what matters for MVP)
- `src/pages/` — **Teamsheets**, **LineupBuilder**
- `src/components/` — table, draggable player cards, pitch/drop-zones
- `src/store/`, `src/utils/`, `src/lib/` — supporting logic as needed
- `src/assets/` — frontend images/icons
- `src/data/` — temporary/reference data (ok for early wiring)

---

## References
- `/docs/MVP_SCOPE.md` — scope and priorities
- `/docs/WORKING_WITH_BOLT.md` — rules of engagement

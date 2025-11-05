# LineupXI Frontend (MVP Build)

![CI](https://github.com/swdurbin97/LineupXI-MVP/actions/workflows/ci.yml/badge.svg)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://lineup-xi-mvp.vercel.app)

This is the React + Vite + Tailwind client for the **LineupXI MVP**.
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

## Documentation

- **[Architecture](/docs/ARCHITECTURE.md)** — Technical architecture, tech stack, component patterns, and data flow
- **[Data Model](/docs/DATA_MODEL.md)** — Core data structures, validation rules, and database schema
- **[Glossary](/docs/GLOSSARY.md)** — App-specific terminology and concepts
- **[MVP Scope](/docs/MVP_SCOPE.md)** — Feature scope and priorities
- **[Known Issues](/docs/KNOWN_ISSUES.md)** — Tracked bugs and limitations

---

## Links

**Production:** https://lineup-xi-mvp.vercel.app
**Example Preview:** https://lineup-xi-mvp-git-test-preview-deploy-swdurbin97s-projects.vercel.app

## Deployments

Pull requests automatically generate preview deployments on Vercel. Merges to `main` trigger production deployments.

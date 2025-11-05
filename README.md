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

## References
- `/docs/MVP_SCOPE.md` — scope and priorities
- `/docs/WORKING_WITH_BOLT.md` — rules of engagement

---

## Links

**Production:** https://lineup-xi-mvp.vercel.app
**Example Preview:** https://lineup-xi-mvp-git-test-preview-deploy-swdurbin97s-projects.vercel.app

## Deployments

Pull requests automatically generate preview deployments on Vercel. Merges to `main` trigger production deployments.

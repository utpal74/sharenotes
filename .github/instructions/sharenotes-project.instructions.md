---
description: "ShareNotes application-specific constraints. Keep these separate from the reusable SDLC workflow instructions."
applyTo: "{backend,frontend}/**"
---

# ShareNotes Application Constraints

- ShareNotes is a NestJS API and Vite React frontend prototype with in-memory note storage and demo-user headers; do not describe it as production-ready.
- Preserve documented API behavior unless the approved change updates the contract.
- Keep owner authorization, version conflict handling, soft deletion, share-link revocation, and public read-only access covered by tests.
- Treat the backend as authoritative for validation and authorization; client validation is for usability.
- Prefer the existing NestJS, React, TypeScript, Vitest, and Vite patterns.
- For backend changes run `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e` from `backend/`. For frontend changes run `npm run lint` and `npm run build` from `frontend/`. Report checks not run and why.

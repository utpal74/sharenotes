# ShareNotes Repository Instructions

## Scope

ShareNotes is a NestJS API and Vite React frontend. The current implementation is a prototype with in-memory note storage and demo-user headers. Do not describe prototype behavior as production-ready.

## Engineering Rules

- Preserve the API behavior documented in `architecture.md` and `impl-plan.md` unless the change updates those contracts.
- Keep owner authorization, version conflict handling, soft deletion, share-link revocation, and public read-only access covered by tests.
- Treat the backend as the authority for validation and authorization. Client validation is only for usability.
- Do not add secrets, credentials, generated build output, or local environment files.
- Prefer focused changes and existing NestJS, React, TypeScript, Vitest, and Vite patterns.
- Use ASCII in source and documentation unless the existing file requires another encoding.

## Validation

For backend changes run `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e` from `backend/`. For frontend changes run `npm run lint` and `npm run build` from `frontend/`. Report commands that cannot run and why.

## Review Expectations

Review correctness, authorization, security, error handling, test coverage, clarity, duplication, dependency risk, and documentation. Findings must identify the affected file and explain user impact. Separate prototype limitations from regressions introduced by a change.

---
name: docs-sync
description: Detect stale claims in docs vs implementation — file paths, unimplemented features, command drift
tools: [file, shell]
---

1. **File path references** — Read `docs/architecture.md` and `docs/impl-plan.md`. For every file or directory path mentioned in those documents, check whether it exists in the repo. Record each path as present or missing.

2. **Unimplemented feature claims** — Scan all files under `docs/` for any mention of: PostgreSQL, Redis, Docker, object storage, real authentication, migrations, rate limiting, OpenAPI, Playwright. For each match, search the `backend/` and `frontend/` source trees for corresponding implementation code (e.g., imports, config, schema files, test files). Flag the claim as "not yet implemented" when no code evidence exists.

3. **Script command drift** — Read `.github/PULL_REQUEST_TEMPLATE.md` and extract every `npm run <script>` command. For each command, determine which package it targets (backend or frontend) and verify the script name exists in the `scripts` section of the relevant `package.json`. Flag any command that is absent or renamed.

4. **Agent skill path drift** — Inspect all files under `.github/agents/skills/` and `.github/agents/instructions/`. Confirm that any references to architecture or implementation plan documents point to `docs/architecture.md` and `docs/impl-plan.md`, not to root-level paths such as `architecture.md` or `impl-plan.md` that existed before the `docs/` reorganization.

5. **Known limitations accuracy** — Read `docs/final-review-checklist.md`. For each limitation it lists (in-memory storage, demo/mock authentication, no database), verify the claim matches current code: confirm no database client is imported in `backend/src/`, no real auth provider is wired up, and no persistent storage layer exists. Flag any checklist item that is no longer accurate.

6. **Output** — Produce three labeled markdown lists summarising results:
   - **In sync** — paths exist, features are correctly described as absent, scripts match, doc references are up to date.
   - **Stale** — claims that once matched the codebase but no longer do (renamed paths, removed scripts, features now present but still marked missing, old root-level doc references still in agent files).
   - **Missing** — significant implementation details or architectural decisions visible in the code that have no coverage in any doc.

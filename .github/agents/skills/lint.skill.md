---
name: Run Lint
description: "Run oxlint across backend and frontend. Reports violations and exits non-zero on failure."
tools: [execute]
user-invocable: true
---
Run linting for both projects in sequence. Stop and report on the first failure.

1. From `backend/` run `npm run lint`. Capture output and exit code.
2. From `frontend/` run `npm run lint`. Capture output and exit code.

Report a summary table: project, command, exit code, and any violations found. If either step fails, list the affected files and rule IDs so the caller knows exactly what to fix.

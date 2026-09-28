---
name: lint
description: "Run backend and frontend lint commands and report exact results. Use after implementation changes and during SDLC verification."
user-invocable: false
---
# Lint Verification

Run from the repository root:

1. `npm run lint` in `backend/`.
2. `npm run lint` in `frontend/`.

Record each command, exit status, and violations. Identify the affected file and rule when available. Do not weaken lint rules or claim a warning is a failure unless the command fails.
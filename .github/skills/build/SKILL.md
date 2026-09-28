---
name: build
description: "Build the NestJS backend and Vite frontend, report exact commands and compiler output. Use after code changes and during SDLC verification."
user-invocable: false
---
# Build Verification

Run from the repository root:

1. `npm run build` in `backend/`.
2. `npm run build` in `frontend/`.

Record each command, exit status, and actionable compiler or bundler errors. Stop to report a failure rather than hiding it by changing compiler configuration. Report only commands actually run.
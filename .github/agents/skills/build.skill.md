---
name: Run Build
description: "Compile backend (NestJS) and bundle frontend (Vite). Reports TypeScript and build errors."
tools: [execute]
user-invocable: true
---
Build both projects in sequence. Stop and report on the first failure.

1. From `backend/` run `npm run build`. Capture TypeScript compiler and nest-cli output.
2. From `frontend/` run `npm run build`. Capture Vite + tsc output.

Report a summary table: project, command, exit code, and any compiler or bundler errors. Highlight missing imports, type errors, and unreachable dist paths. Do not suppress errors by editing tsconfig or build scripts.

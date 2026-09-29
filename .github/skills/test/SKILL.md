---
name: test
description: "Run backend unit and end-to-end tests and report pass/fail counts and failure details. Use after implementation changes and during SDLC verification."
user-invocable: false
---
# Test Verification

Run from `backend/`:

1. `npm test` for unit tests.
2. `npm run test:e2e` for end-to-end tests.

Record command, exit status, pass/fail/skip counts, and assertion details for failures. The frontend currently has no test suite; state this as a coverage gap rather than implying frontend behavior was tested. Do not weaken or skip assertions to make the suite pass.
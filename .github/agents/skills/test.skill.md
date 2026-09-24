---
name: Run Tests
description: "Run backend unit tests and E2E tests with Vitest. Reports pass/fail counts and failure details."
tools: [execute]
user-invocable: true
---
Run the full backend test suite. The frontend has no test suite; note that gap.

1. From `backend/` run `npm test` (Vitest unit tests). Capture pass/fail/skip counts.
2. From `backend/` run `npm run test:e2e` (Vitest E2E tests). Capture pass/fail/skip counts.

Report a summary table: suite, command, tests passed, tests failed, tests skipped, and exit code. For each failure include the test name, file, and assertion message. Do not weaken assertions or skip tests to make the suite green.

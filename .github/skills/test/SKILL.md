---
name: test
description: "Discover and run tests relevant to changed behavior, reporting complete pass/fail evidence."
user-invocable: false
---

# Test Verification

1. Inspect repository guidance, manifests, test configuration, scripts, and CI to find applicable test suites and exact commands.
2. Run focused tests for changed behavior first, then other required local suites relevant to the approved plan. Do not assume a test framework or that every component has tests.
3. Record exact commands, working directories, exit status, pass/fail/skip counts, and useful failure details. Do not expose secret values in logs or reports.
4. State missing test coverage and checks that could not run. Do not weaken, delete, or skip assertions to make a suite pass.

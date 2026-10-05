# ShareNotes Core Notes and Sharing

**Proposed PR title:** Complete ShareNotes prototype note lifecycle and sharing

**Delivery draft; no commit, push, or remote PR action is authorized.** The user approved staging the reviewed application, tests, CI, documentation, and this run's artifacts on October 5, 2026, with the exclusions recorded below. Node 22 and remote GitHub Actions remain unverified; this is not a production-readiness or security-clearance claim.

## Summary

This change completes the ShareNotes prototype note lifecycle and sharing experience: it enforces the inclusive serialized UTF-8 note-size contract, bounds raw JSON requests, and adds owner-confirmed share revocation with truthful, accessible UI feedback. It adds backend HTTP/service and frontend interaction coverage, wires frontend tests into CI, and synchronizes the README and PR evidence template while retaining the documented in-memory/demo-user prototype boundary.

## Changes Made

- `.github/pull_request_template.md` - Add a frontend unit-test evidence row.
- `.github/workflows/agentic-sdlc.yml` - Check that the frontend test script exists.
- `.github/workflows/quality.yml` - Run frontend tests and report test, lint, and build step outcomes accurately.
- `README.md` - Document the exact note-size and raw-body limits, share revocation/copy behavior, validation commands, and prototype/security limitations.
- `backend/package.json`, `backend/package-lock.json` - Declare Express directly for the shared parser setup.
- `backend/src/main.ts` - Use the common application bootstrap.
- `backend/src/create-application.ts` - Share production/E2E setup, configure the 32 MiB JSON parser cap, and return an explicit 413 for parser-limit errors.
- `backend/src/notes/notes.service.ts` - Name the exact 31,457,280-byte semantic limit and clarify the title/content-only error.
- `backend/src/notes/notes.service.spec.ts` - Cover exact/over-limit values, normalized titles, no-mutation behavior, and denied share creation.
- `backend/test/app.e2e-spec.ts` - Cover HTTP lifecycle, identity/authorization, version conflicts, semantic and raw-body limits, share/revoke/delete, and public reads.
- `frontend/package.json`, `frontend/package-lock.json` - Add the Vitest/jsdom/Testing Library test stack and `npm test`.
- `frontend/vite.config.ts`, `frontend/src/test/setup.ts` - Configure the frontend test environment and cleanup.
- `frontend/src/note-size.ts` - Share the normalized UTF-8 size calculation.
- `frontend/src/App.tsx`, `frontend/src/App.css` - Add note-scoped share/revoke and copy outcomes, confirmations, accessible feedback, advisory size feedback, and async state protection.
- `frontend/src/App.test.tsx` - Cover note/share interactions, public read-only behavior, errors, confirmations, and deferred async races.
- `artifacts/sharenotes-core-notes/requirements.md` - Approved October 5 requirements and scope.
- `artifacts/sharenotes-core-notes/architecture.md` - Approved design and API/security boundaries.
- `artifacts/sharenotes-core-notes/design-review.md` - Independent design review and constraints.
- `artifacts/sharenotes-core-notes/impl-plan.md` - Approved implementation plan and recorded implementation evidence.
- `artifacts/sharenotes-core-notes/review.md` - Independent code review, final focused PASS, and incremental review findings.
- `artifacts/sharenotes-core-notes/verification.md` - Latest verification record, including audit acceptance and outstanding runtime/CI limitations.

The source input is already committed. Older artifact directories are outside this change.

## Test Evidence

The results below are transcribed from the October 5, 2026 implementation and verification artifacts; the full suites were not rerun for this Phase 8 draft. Focused tests listed separately were independently rerun by the phase-7 verifier. No GitHub Actions result or link is available.

| Check | Recorded result |
| --- | --- |
| Backend lint (`backend/`: `npm run lint`) | Reported exit 0; not independently rerun in the latest focused reverify. |
| Backend build (`backend/`: `npm run build`) | Reported exit 0; not independently rerun in the latest focused reverify. |
| Backend unit tests (`backend/`: `npm test`) | Reported exit 0; 5 passed, 0 failed, 5 total. Latest full suite not independently rerun. |
| Backend E2E tests (`backend/`: `npm run test:e2e`) | Reported exit 0; 6 passed, 0 failed, 6 total. Latest full suite not independently rerun. |
| Frontend unit tests (`frontend/`: `npm test`) | Reported exit 0; 24 passed, 0 failed, 24 total. Latest full suite not independently rerun. |
| Frontend lint (`frontend/`: `npm run lint`) | Reported exit 0 with warning `src/App.tsx:73:14`, `react(set-state-in-effect)`. |
| Frontend build (`frontend/`: `npm run build`) | Reported exit 0; not independently rerun in the latest focused reverify. |
| Focused backend service test | `backend/`: `.\node_modules\.bin\vitest.cmd run src/notes/notes.service.spec.ts -t 'rejects non-owner share creation without adding an active link'` - exit 0; 1 passed, 3 skipped; 1 test file passed. |
| Focused backend E2E test | `backend/`: `.\node_modules\.bin\vitest.cmd run --config ./vitest.config.e2e.ts -t 'enforces owner-only sharing, active-link reuse, revocation, and deletion'` - exit 0; 1 passed, 5 skipped; 1 test file passed. |
| Focused frontend test | `frontend/`: `.\node_modules\.bin\vitest.cmd run src/App.test.tsx -t 'keeps unsaved edits private and serves the latest saved content'` - exit 0; 1 passed, 23 skipped; 1 test file passed. |
| Node 22 / remote CI | **Not run; pending/unverified.** Local evidence used Node 25.8.2/npm 11.12.0; configured CI uses Node 22. |

The focused backend runs printed the existing `vite-tsconfig-paths` deprecation notice. Populate the PR template's CI evidence with actual run results before submission; local reports are not CI results.

## Security and Data Considerations

- Authorization remains prototype-only: `x-user-id` is caller-controlled, and the UI uses `demo-user`; this is not authentication.
- Notes and share links remain in-memory. Share URLs are bearer capabilities; revocation prevents future reads but cannot recall copied URLs or content already viewed.
- The October 5 backend audit recorded **one high and one moderate** advisory in development/build-tool dependency paths. The user explicitly accepted this limitation for this prototype delivery. The audit exited 1; it is not a pass or security clearance, and no remediation is represented here.
- The configured npm audit is non-blocking. No fresh audit is claimed.
- Do not stage or publish the protected VS Code configuration changes. The unexpected implementation-agent instruction-file change has not been reviewed and is not attributed to this implementation.

## Known Limitations

- Node 22 compatibility and remote GitHub Actions results remain pending; local checks ran on Node 25.8.2. The frontend lint warning remains.
- The accepted high/moderate development-tool advisories remain unresolved. Production authentication, persistent storage, attachments, rich text, and deployment are out of scope.
- The README's pre-existing launcher-path discrepancy remains outside scope.
- **Not Found:** No remote CI run/result was available for this draft.
- This is a delivery draft, not a submitted PR. The exact staged diff and the results of staged-path, ignore, whitespace, and content-safety checks will be provided with the staging proposal. No remote PR existence check or PR creation/update is claimed.

## Delivery Proposal and Worktree Scope

- Current branch: `demo/sharenotes-full-sdlc`; remote default branch confirmed read-only as `main`.
- Proposed commit message (not executed):

  ```text
  feat: complete ShareNotes prototype lifecycle

  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```

- **Staging approval:** The user explicitly approved staging the reviewed application, tests, CI, documentation, and current run artifacts on October 5, 2026. Approval excludes the protected and ignored paths below; it does not authorize commit, push, or remote PR actions.
- **Proposed staging set:** The 26 files listed under **Changes Made** above, including this `artifacts/sharenotes-core-notes/pr-description.md`. No source input or older-run artifact is included.
- **Explicit exclusions:**
  - `.github/agents/implementation-engineer.agent.md` - pre-existing, unreviewed change; contents and diff intentionally not inspected.
  - `.vscode/mcp.json` and `.vscode/settings.json` - protected pre-existing changes; contents and diffs intentionally not inspected.
  - `backend/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` - tracked generated cache matched by the `**/node_modules/` ignore rule.
  - `.gitignore` files and all other ignored paths - none are part of the approved candidate set; no `.gitignore` file is changed.
- No changelog entry is included because this delivery did not receive approval to change a changelog. The proposed commit message (not executed) is:

  ```text
  feat: complete ShareNotes prototype lifecycle

  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```

- **PR title:** Complete ShareNotes prototype note lifecycle and sharing.
- **PR body:** This draft at `artifacts/sharenotes-core-notes/pr-description.md`.
- **Base branch:** `main` (read-only confirmed). **Current branch:** `demo/sharenotes-full-sdlc`.
- **Remote action:** None authorized. No open-PR check, push, PR creation, or PR update is claimed.
  - `.github/agents/implementation-engineer.agent.md` - unexpected modified file; not authored/reviewed for this task. Its content and diff were not inspected.
  - `.vscode/mcp.json` and `.vscode/settings.json` - protected pre-existing modifications. Their contents and diffs were not inspected.
  - `backend/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` - tracked but matched by `.gitignore` (`**/node_modules/`); must never be staged.
- Human scope/priority decision is required before staging: explicitly authorize excluding the two protected VS Code paths as a departure from the standard stage-all policy, and decide whether the unexpected agent-file change should remain excluded or receive independent review before any inclusion is considered. The ignored cache file remains excluded regardless.
- Remote delivery was not attempted. GitHub is identified as the host and `main` as the default branch, but no open-PR check was performed. The GitHub CLI was unavailable and no GitHub PR-creation integration was exposed in this session. If remote delivery is later approved and tooling is available, the compare URL is https://github.com/utpal74/sharenotes/compare/main...demo%2Fsharenotes-full-sdlc?expand=1. No PR existence, creation, or update is claimed.

## Changelog

**Suggestion only - `CHANGELOG.md` was not changed; obtain human approval before adding:**

```markdown
### Added

- Complete the ShareNotes prototype note lifecycle with owner-confirmed share revocation, truthful copy feedback, and interaction coverage.

### Changed

- Enforce the inclusive 31,457,280-byte serialized UTF-8 note limit, cap raw JSON requests at 32 MiB, and run frontend tests in the quality workflow.
```

## Reviewer Checklist

- [ ] Confirm the final reviewed file set and authorize how protected/unreviewed worktree changes are handled before staging.
- [ ] Review authorization, public sharing, revocation, data, and prototype limitations.
- [ ] Verify backend and frontend checks on the configured Node 22 runtime and record actual GitHub Actions outcomes.
- [ ] Review the accepted audit limitation and decide whether any further dependency action is required.
- [ ] Confirm the README, PR evidence, and proposed changelog entry; approve any changelog edit separately.
- [ ] Confirm no ignored/generated or protected files are staged.

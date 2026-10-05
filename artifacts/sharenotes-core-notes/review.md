# ShareNotes Core Notes and Sharing - Independent Code Review

**Review phase:** SDLC phase 6
**Original review disposition (October 5, 2026):** **BLOCKED** - one medium-severity correctness finding required remediation and a rerun of this review.
**R1 rereview disposition (October 5, 2026):** **BLOCKED** - R1 was resolved; the rereview identified one medium-severity sidebar-refresh failure regression (R2), requiring remediation and another review.
**Final R2 rereview verdict (October 5, 2026):** **PASS** - R2 is resolved; no blocking findings remain in this focused rereview.
**Reviewed:** October 5, 2026
**Scope:** Approved requirements FR-01 through FR-08, architecture, design-review findings F1-F4, and the approved implementation plan.

## Findings

### R1 - Medium (blocking): A successful create completed after navigation is omitted from the notes list

**File/symbol:** [frontend/src/App.tsx](../../frontend/src/App.tsx), `saveNote` (around lines 128-140).

**Evidence:** After `POST /notes` resolves, `saveNote` returns immediately if the selected-note generation changed. That return occurs before `loadNotes`, which is the only refresh of the sidebar list after a successful create. Thus, if the user submits a new note and switches context before the POST response arrives, the backend can create the note but the UI discards its successful result and leaves it out of the list until a later reload. The same early return after a successful update can leave the sidebar summary stale. In addition, `loadNotes` writes its response to state without checking whether its initiating request is still current (around lines 55-59), allowing an older list response to overwrite a newer list.

**Impact:** A successfully saved note may appear lost to the user even though it exists in backend state. This violates the note create/list behavior in FR-01 and is a residual gap in the async-context handling required by design-review F2.

**Required remediation:** Reconcile the notes list after successful mutations even when the initiating editor context is stale, without switching or overwriting the user's current selection. Guard list responses with an appropriate request generation/order so a late response cannot replace a newer list. Add deterministic deferred-promise UI coverage: submit a create (and, as applicable, update), navigate before its response, resolve success, then assert that the current selection remains unchanged and the saved note appears in the sidebar. Also verify an older list response cannot overwrite a more recent refresh.

## Requirement and design-review traceability

| Item | Review result |
| --- | --- |
| FR-01 lifecycle | Backend lifecycle and ordinary frontend create/open/save paths are covered. R1 leaves a navigation-during-create/update list-consistency defect. |
| FR-02 size | Service and HTTP tests exercise the inclusive 31,457,280-byte serialized UTF-8 contract, normalized titles, oversize 413, and no mutation on rejection. The separately configured 32 MiB raw JSON parser limit is exercised over HTTP. |
| FR-03 authorization | The omitted-header `demo-user` fallback and existing non-owner HTTP 401 are preserved. E2E cases cover unauthorized update/share/revoke/delete and state preservation. This remains caller-controlled prototype identity, not authentication. |
| FR-04 versioning | E2E coverage asserts 409 for a stale update and reads back the unchanged newer version. |
| FR-05 sharing | Active-link reuse, fresh token after revocation, latest saved public content, clipboard failure behavior, and read-only public UI are covered. |
| FR-06 revoked/deleted links | E2E coverage asserts public 404 after revocation and soft deletion. |
| FR-07 feedback/confirmation | Delete and revoke confirmations, errors, revoke success, clipboard outcomes, and accessible status/error roles are implemented and covered. |
| FR-08 tests | Backend service/E2E tests and frontend interaction/race tests are present; the additional list-refresh race in R1 is not covered. |
| F1 parser boundary | Addressed: production and E2E use `createApplication`, with the explicit parser cap, 413 handling, malformed JSON path, and URL-encoded parsing covered. |
| F2 asynchronous UI context | Deferred tests cover open/save/share/clipboard/revoke context switches. R1 is the remaining successful-mutation/list reconciliation gap. |
| F3 size feedback | Addressed: frontend normalization and serialized UTF-8 calculation agree with backend rules; tests cover normalized titles and multibyte boundaries. |
| F4 test evidence/accessibility | Addressed in source: frontend tests are wired into CI, outcome summaries use step outcomes, and user feedback uses status/alert semantics. Actual Node 22 CI execution remains unverified. |

## API contract check

The README documents the eight `/api/v1` operations. No route-shape or intended response-contract drift was found in the reviewed controller/service behavior; tests now provide behavioral evidence for the relevant routes.

| Operation | Documented / implemented behavior | Test evidence | Status |
| --- | --- | --- | --- |
| `POST /notes` | Create note; fallback owner; normalized title and exact serialized size | Fallback lifecycle E2E; exact/oversize HTTP boundary; service unit tests | In sync |
| `GET /notes`, `GET /notes/:noteId` | Owner-scoped listing and retrieval; missing/deleted is 404; different owner is 401 | Lifecycle and identity E2E | In sync |
| `PATCH /notes/:noteId` | Owner-only versioned update; stale is 409; oversize is 413 | Unauthorized/no-mutation, stale/no-overwrite, and size-boundary E2E | In sync |
| `DELETE /notes/:noteId` | Owner-only soft deletion; links become unavailable | Unauthorized-state and successful-delete/public-404 E2E | In sync |
| `POST /notes/:noteId/share` | Owner-only active-link reuse; new token after revocation | Reuse, non-owner rejection, and fresh-token E2E; UI interaction tests | In sync |
| `DELETE /notes/:noteId/share/:token` | Owner-only revocation; public token subsequently returns 404 | Non-owner state preservation and successful revocation E2E; UI confirmation/outcome tests | In sync |
| `GET /shared/:token` | Public, read-only latest saved note; unavailable link is 404 | Latest-content/revoked/deleted E2E; frontend read-only test | In sync |

## Documentation synchronization

### In sync

- README size claims now state the exact inclusive UTF-8 JSON measurement and distinguish the raw 32 MiB parser limit.
- README share/revoke, clipboard-failure, prototype-authentication, test-command, and in-memory-storage claims agree with the reviewed implementation and manifests.
- The reviewed README local documentation links resolve to existing files.

### Stale

- The README's PowerShell and Bash launch examples use root-level launcher paths, while the launchers are under `scripts/`. This predates the reviewed implementation and is outside the approved change scope; it is not a blocker for this review.

### Missing

- No directly related required documentation was found missing. There is no OpenAPI schema, but none is required by the approved scope.

## Assumptions, checks, and limitations

- The implementation plan records passing local backend lint/build/unit/E2E checks and frontend lint/build/tests. They were not rerun during this independent review to avoid duplicating the reported suite. The report records local execution on Node 25.8.2; the configured Node 22 CI workflow was not run, and dependency engine warnings were reported by the implementation phase.
- Reviewer checks run: `npm ls --package-lock-only --depth=0` in both workspaces passed; scoped `git diff --check` passed; `npm audit --offline --audit-level=high` reported zero vulnerabilities in each workspace. The audit was offline and is not a current network-backed advisory check. The configured CI audit is `continue-on-error: true`, so it is informational rather than a merge blocker.
- Dependency review: the backend now directly declares Express, which the new bootstrap imports. Frontend additions are development-only test dependencies. Both lockfiles resolve against their manifests; the frontend lock adds 89 package entries without removals or version changes to existing entries.
- No production authentication, persistence, rich text, attachments, or deployment scope was introduced. The prototype's caller-controlled `x-user-id` and in-memory storage remain existing limitations, accurately documented.

## Reviewed and excluded worktree scope

The review covered staged and unstaged changes relative to `HEAD` for the reported backend/frontend implementation, tests, manifests/lockfiles, README, and quality workflow, plus the relevant untracked implementation/test files. The approved requirements, architecture, design review, and implementation plan were read as review inputs and were not changed. This report is the only new review artifact.

Per the orchestrator's instructions, `.vscode` files and the separately reported unexpected change to `.github/agents/implementation-engineer.agent.md` were not inspected and are not attributed to the reviewed implementation. The unexpected agent-file change has unverified ownership and must be explicitly reviewed/excluded during human final staging review. Do not stage protected or unrelated paths.

## Original summary (superseded by the rereview below)

The backend API contract, size boundaries, authorization behavior, parser setup, share lifecycle, dependency consistency, README feature claims, and CI outcome reporting are substantially aligned with the approved scope. **R1 remains a phase 6 blocker:** successful note mutations that finish after a context switch must still reconcile the sidebar without taking over the active editor, and stale list responses must not overwrite newer state. Rerun this review after remediation.

## Phase 6 rereview - R1 remediation

**Rereview scope:** The approved requirements, architecture, implementation plan, original review, and the complete `frontend/src/App.tsx` delta relevant to R1 and its coupled list-refresh races. The new deterministic cases in `frontend/src/App.test.tsx` were inspected. Protected VS Code files and the unrelated implementation-engineer agent change were not inspected or attributed.

### Finding status

- **R1 - Resolved:** A successful create or update now triggers a notes-list refresh even after the initiating selection has changed. The existing editor and notice are updated only while the initiating context remains current. The monotonic list-request generation rejects responses from older list requests, including late failures, after a newer request has started. Deferred UI tests cover late create, late update, and an older list response arriving after a newer refresh; the tests assert the current editor/notice remain unchanged and the sidebar reflects the successful mutation or latest refresh.
- **R2 - Medium (blocking): Late successful mutation followed by a failed list refresh clears the sidebar and hides the error.** [frontend/src/App.tsx](../../frontend/src/App.tsx), `saveNote` / `loadNotes`. After the mutation succeeds, `saveNote` always calls `loadNotes`, including when navigation made its captured selection context stale. If this is the newest list request and it fails, `loadNotes` sets `notes` to `[]`; its error notice is conditional on the old context still being current, so it is suppressed after navigation. The user can therefore see an empty sidebar with no indication that refresh failed, even though the successful mutation remains in backend state. This failure path is enabled by the R1 change and is not covered by the new tests. Preserve the last successfully loaded list on refresh failure and expose the refresh failure without replacing an unrelated current-context notice; add a deterministic deferred test for a successful late mutation followed by a failed list refresh.

### Assumptions and test gaps

- A failed `GET /notes` refresh is an unavailable list, not evidence that the owner has no notes; the current-context error path already treats it as a request failure.
- No test covers a successful mutation completed after navigation followed by a failed list refresh, so preservation of the prior sidebar and nonintrusive error feedback are unverified.

### Contract, documentation, and security checks

- **API contract:** R1 changes no route, request, response, or authorization behavior. The API contract table and evidence from the original review remain applicable.
- **Documentation synchronization:** No product documentation or workflow command changed in this remediation. The previously recorded README synchronization results and the pre-existing launcher-path discrepancy remain as documented above.
- **Security:** The reviewed R1 delta changes client-side asynchronous list state only; it does not change identity, authorization, share-token handling, or input validation. This is a scoped code review, not a full security audit. No security scanner or dependency audit was rerun for this rereview.
- **Dependencies:** No dependency or manifest changes are part of the R1 remediation.

### Verification and limitations

- Independently ran `npm test` from `frontend/`: **passed**, 1 test file and all 15 tests.
- The implementation plan separately records the focused three-test R1 run, frontend lint, and frontend build as passing; those commands were not rerun in this rereview.
- The available runtime is Node 25.8.2 with npm 11.12.0. The configured Node 22 CI environment and remote CI remain unverified; preserve this as an outstanding verification limitation, not a source finding.
- No application or documentation files were changed during this rereview. Only this review artifact was updated.

### Current decision

The originally blocking R1 is resolved on the inspected implementation and supported by the full frontend test suite. **Do not unblock phase 6 yet:** R2 is a new medium-severity correctness/error-reporting regression in the same changed path. Remediate R2 and rerun the review before phase 6 signoff.

## Final phase 6 rereview - R2 remediation

**Rereview scope:** The approved R2 requirement and its history above, the approved requirements, architecture, design review, implementation plan, and the current `frontend/src/App.tsx` and `frontend/src/App.test.tsx` paths relevant to sidebar refresh failures and list-request ordering. Protected VS Code files and the unrelated implementation-engineer agent change were not inspected or attributed. No application, test, dependency, or other artifact files were changed during this rereview.

### Findings

- **R2 - Resolved (was Medium, blocking): Sidebar refresh failures preserve the last loaded list and are announced independently of editor/share feedback.** [frontend/src/App.tsx](../../frontend/src/App.tsx), `loadNotes` and sidebar rendering. The failed-refresh path no longer replaces `notes` with an empty list. It records a separate `listError`, rendered as an accessible `role="alert"` in the sidebar, without changing selection, editor contents, share state, or the editor notice. A successful latest refresh clears that list error. Post-save failure wording identifies that the note was saved but its list refresh failed. The existing selection-context guard prevents the late save from showing a save success/failure notice in a different editor context.
- **List request ordering - No finding.** `listRequestGeneration` advances for every request and on unmount; only the latest request can update either list data or its refresh error. Deferred tests exercise all four older/newer success/failure combinations.
- **No other concrete blocking or material coupled finding** was identified in the scoped R2 changes.

### Assumptions and test gaps

- A failed list request means the latest list could not be retrieved, not that the library is empty; retaining the last successful list is the correct user-visible behavior.
- The new deferred create/update tests cover navigation before mutation completion, a subsequent refresh failure, preservation of both existing sidebar entries, preservation of the active editor and unsaved content, and preservation of the current share success or failure notice. They also assert that no save failure or misleading save success notice appears. Normal refresh failure/recovery and initial-list failure are covered separately.
- No R2-specific test gap was found in the inspected frontend suite. Node 22 and remote CI execution remain unverified.

### API contract, documentation, security, and dependencies

- **API contract:** R2 changes no operation, request/response shape, authorization rule, or API behavior. The API contract findings and tests recorded in the original review remain applicable; backend code was outside this focused rereview.
- **Documentation synchronization:**
  - **In sync:** R2 changes no product documentation or workflow commands; no new documentation drift was found.
  - **Stale:** The previously recorded, pre-existing README launcher-path discrepancy remains outside this review's scope.
  - **Missing:** No R2-related documentation is missing; no OpenAPI schema is required by the approved scope.
- **Security:** The R2 change is limited to frontend list/editor state and error presentation; it does not alter identity, authorization, share-token handling, or input validation. No security scanner or dependency audit was rerun, and this focused review is not a full security audit.
- **Dependencies:** No dependency or manifest changes are part of R2 remediation.

### Verification and limitations

- From `frontend/`, independently ran:
  - `npm test` - **passed**, 1 test file and all 23 tests.
  - `npm run lint` - **exit 0**, with the existing `react(set-state-in-effect)` warning at `src/App.tsx:73:14`.
  - `npm run build` - **passed**, including `tsc -b` and the Vite production build.
- The configured Node 22 CI environment and remote CI were not run. No backend checks were rerun because R2 changes no backend code. No dependency audit or full repository audit was performed.

### Final decision

**PASS for the focused R2 rereview; no unresolved blocking findings.** R1 remains resolved as recorded in the preceding history. This is phase 6 review disposition only; it does not constitute phase 7 verification, human final-diff approval, or authorization to stage, commit, push, or create a pull request. No delegation is required.

## Incremental phase 6 review after phase 7 bounded remediation

**Review date:** October 5, 2026

**Scope:** Only the incremental test, PR/CI, README, and coupled behavior changes requested after the R2 review: non-owner share-creation state assertions, the unsaved-draft public-view test, frontend test evidence wiring, and the README audit-status correction. R1 and R2 history above is retained. This is not a rerun of the prior full implementation/security trace.

### Findings

- **No blocking code findings in the reviewed delta.**
- **AC-03 / non-owner share creation - covered:** `backend/src/notes/notes.service.spec.ts`, `NotesService share ownership`, asserts the link map size is unchanged after the rejected non-owner call, the pre-existing token still resolves, and owner creation reuses that link. `backend/test/app.e2e-spec.ts` also verifies the unauthorized HTTP request is rejected, the existing URL remains readable, and the owner still receives the original token. This closes the prior no-state-change assertion gap. The unit assertion deliberately observes the private map through `Reflect`; it is somewhat implementation-coupled, but directly verifies the approved no-mutation property and is not a blocker.
- **AC-05 / unsaved draft privacy - covered:** `frontend/src/App.test.tsx`, `keeps unsaved edits private and serves the latest saved content publicly`, verifies typing a draft does not issue a create/update request, a public route continues to show only saved content, and after save a newly rendered public view receives the new saved content. The public fetch has no owner headers. This closes the prior unsaved-draft coverage gap.
- **Frontend test wiring and evidence - in sync:** `quality.yml` runs frontend `npm test` and reports each test/lint/build step's actual outcome; `agentic-sdlc.yml` checks that the frontend test script exists; the PR template now includes a frontend unit-test count row. These changes match the frontend `npm test` script.
- **README audit statement - corrected:** README now says the npm audit job is configured but non-blocking, which agrees with `agentic-sdlc.yml`'s `continue-on-error: true`. It does not characterize the audit as a required security gate. The previously recorded root-level launcher-path discrepancy is unchanged and outside this delta.

### API contract and documentation synchronization

| Surface | Review result |
| --- | --- |
| Non-owner share creation | Existing 401 contract is preserved; state-preservation assertions now cover service and HTTP behavior. |
| Public reads | The public route still exposes the latest saved note only; the added UI interaction proves an unsaved editor draft is not made public. |
| PR/quality workflow | The test script, required quality step, outcome summary, and PR evidence row are aligned. |
| README security wording | Accurately distinguishes a configured non-blocking audit from a security gate. |

### Assumptions, test gaps, and verification limits

- The phase-7 verification record reports backend **4 unit / 6 E2E** tests and frontend **23** tests. The implementation reports the incremental totals as backend **5 unit / 6 E2E** and frontend **24**, with lint/build passing. Those incremental suites were not rerun during this focused review, as directed; `verification.md` remains the earlier evidence snapshot and does not independently verify the new counts.
- No additional test gap was identified in the narrowly reviewed changes. Full suites were intentionally not relaunched.
- Node 22 execution and remote CI remain **unverified**; treat this as a separate verification gate, not as evidence that the source changes fail.

### Dependency and security gate

- The phase-7 online backend audit recorded **one high and one moderate advisory** in development/build-tool dependency paths. This remains pending a separate human decision on remediation or acceptance. No install, audit fix, or dependency change was performed for this incremental review.
- The configured audit remains non-blocking in CI. This limitation is accurately documented in README and must not be treated as a passing required security gate. The finding is an existing pending dependency risk, not a regression introduced by the test/documentation/CI delta.

### Incremental disposition

**PASS for the reviewed incremental code/test/documentation/CI delta; no blocking code findings.** The prior AC-03 and AC-05 coverage gaps are closed by the added tests. This verdict does not clear the pending backend dependency-audit decision or the separate Node 22/remote-CI verification gate, and does not authorize staging, committing, pushing, or PR preparation.

# ShareNotes Core Notes and Sharing - Implementation Plan

## Status and authority

- **SDLC phase:** 4 - implementation planning, updated with phase 5 implementation evidence.
- **Plan status:** Scope and priority were approved for phase 5 on October 5, 2026. T1-T9 implementation and local verification are complete. T10 remains pending independent review/verification and separate delivery approval; this update does not claim phase 6 or 7 signoff.
- **Approved inputs:** [Requirements](./requirements.md), [architecture decisions 1-3](./architecture.md), and independent [design review](./design-review.md). Requirements and architecture were approved October 5, 2026. The review permits planning and identifies no new material product decision; its F1-F4 findings are mandatory planning constraints, not implementation approval.
- **Run mode:** Standard mode on the supplied current branch `demo/sharenotes-full-sdlc`. Final staging, commit, push, and PR actions require separate explicit human approval.
- **Phase 4 boundary (at planning time):** This artifact was the only authorized output during planning. Phase 5 implementation is now complete under the approved plan; the original source `docs/input/sharenotes-core-notes.md` and older artifact directories remain untouched.
- **Observed repository basis:** NestJS/Express API and React/Vite frontend; in-memory notes and share state; `demo-user` frontend identity and omitted-header backend fallback; note service already measures serialized title/content but its error mentions attachments; no shared production/E2E bootstrap setup; current E2E coverage is the root health endpoint only; frontend has no test runner/script; `.github/workflows/quality.yml` currently reports frontend lint/build as passed unconditionally in its `always()` summary. These are static observations, not runtime or test evidence.
- **Protected worktree state:** Two pre-existing changes to `.vscode/mcp.json` and `.vscode/settings.json` were reported by the orchestrator. Do not inspect, edit, stage, or revert them. Explicitly distinguish them from this work in any later diff/approval review.

## Scope and non-goals

Complete and test the existing prototype only: note lifecycle, exact serialized UTF-8 size behavior, existing owner checks/version conflict, public read-only sharing, owner revocation, accessible truthful feedback, frontend interaction coverage, CI evidence, and directly related README synchronization.

Do not add production authentication, persistence, attachments, rich text, deployment, production hardening, or unrelated README fixes (including launcher-path discrepancies). Do not alter the existing `demo-user` UI identity, omitted `x-user-id` fallback, or non-owner HTTP 401. Preserve active-link reuse, issue a fresh URL after revocation, and keep clipboard failure distinct from share creation failure. A revoked link cannot recall URLs already copied or content already read.

## Dependency-ordered tasks

G0 scope/priority approval is recorded below. T1-T9 are **completed** in dependency order; T10 remains pending. Actual local verification evidence and limitations are recorded under T9.

### G0 - Human approval gate (P0, satisfied)

- **Deliverable:** Human approval of this bounded plan and its scope/priority before phase 5. **Completed:** approved October 5, 2026.
- **Dependencies:** Approved requirements, architecture, and phase-3 review (already supplied).
- **Status:** Scope/priority approval recorded; G0 is satisfied.
- **Decision status:** No unresolved material product decision was raised by the reviewer. Scope and task priority are approved; do not reopen the approved product decisions absent a new requirement.
- **Verification/evidence:** Human approval recorded in this plan, dated October 5, 2026.

### T1 - Lock the backend semantic size contract and service tests (P1)

- **Deliverables / likely files:** `backend/src/notes/notes.service.ts`; new `backend/src/notes/notes.service.spec.ts` (or extend an existing notes service spec if one is added first).
- **Dependencies:** G0.
- **Work:** Keep the final-value normalization already used by the backend (`title.trim() || 'Untitled note'` on create; trimmed nonempty update title or existing title; existing content default behavior). Define the semantic maximum explicitly as **31,457,280 bytes**. Measure only `Buffer.byteLength(JSON.stringify({ title, content }), 'utf8')` with this exact property order, after normalization. Accept equality, reject any larger value with HTTP-domain status 413 and a clear title/content-only message; remove the misleading attachment claim. Keep the service authoritative.
- **Acceptance / traceability:** Unit cases prove exactly 31,457,280 accepted and 31,457,281 rejected, using multibyte content and the normalized title rules; assert the stored/returned `sizeBytes` equals the measured representation and rejected creates/updates do not mutate state. Covers FR-02, NFR-01, AC-02; design-review F3 and F1's requirement that transport tests supplement (not replace) service tests.
- **Risks:** Large fixtures can consume memory. Generate and retain one boundary fixture at a time; do not weaken the exact threshold or substitute character count.
- **Status:** Completed.
- **Verification evidence:** `npm test -- src/notes/notes.service.spec.ts` from `backend/` passed (3 tests). The final complete backend suite passed in T9.

### T2 - Share production-equivalent Express parser setup (P1)

- **Deliverables / likely files:** `backend/src/main.ts`; a shared app/bootstrap configuration module under `backend/src/` (exact filename chosen during implementation); `backend/test/app.e2e-spec.ts` and/or a dedicated notes E2E spec.
- **Dependencies:** G0.
- **Work:** Use one setup path for production startup and HTTP E2E applications, including the API prefix and relevant app configuration. Explicitly control Nest's default body-parser registration so a later parser cannot be shadowed by Nest's smaller default. Install Express JSON parsing with an explicit **32 MiB** limit before routes, preserve other currently supported parser behavior (including URL-encoded parsing) rather than disabling parsers wholesale, and translate only parser-limit failures to an explicit HTTP 413. Pass unrelated parser errors through the normal error path; do not create success-shaped fallbacks. Configure CORS and prefix consistently for real and test apps where applicable.
- **Acceptance / traceability:** A production-launched app and Supertest E2E app use the same parser/setup function and order; JSON above the raw cap receives explicit 413, while ordinary supported requests/parsers continue to work. This raw transport cap is separate from the semantic note-size measurement and is not a reason to alter that threshold. Covers FR-02, AC-02, NFR-01; design-review F1 and approved architecture decision 1.
- **Risks:** Middleware ordering is critical: parser must run before Nest routes; error handling must not swallow non-size errors. A 32 MiB raw cap still permits significant concurrent memory use, accepted as a prototype limitation.
- **Status:** Completed.
- **Verification evidence:** The production and E2E apps share `createApplication`; the final E2E suite passed, including an exact 32 MiB raw body reaching semantic validation, a body above the raw cap returning explicit 413, malformed JSON passing to the normal 400 path, and URL-encoded parsing.

### T3 - Cover backend HTTP lifecycle and boundary behavior (P1)

- **Deliverables / likely files:** `backend/test/app.e2e-spec.ts` and/or `backend/test/notes.e2e-spec.ts`; use existing Vitest/Supertest configuration and fresh test application/service state per case.
- **Dependencies:** T1 and T2.
- **Work:** Exercise create/list/open/update/delete; omitted-header `demo-user` fallback; owner and distinct non-owner `x-user-id`; successful owner update and stale-version 409 with read-after-conflict proving no overwrite; exact semantic limit over HTTP on create and update; one byte over returning explicit 413 without create/update mutation; active share URL reuse; owner-only revoke; new URL after revoke; latest saved public values; public 404 after revoke and soft deletion; 204 delete/revoke. Assert non-owner 401 on update, delete, share, and revoke, then inspect state to prove denied requests changed nothing. Keep the public share read-only and unauthenticated; do not add draft or mutation access.
- **Acceptance / traceability:** All route/status/state assertions above pass against the shared production-equivalent bootstrap; raw request envelope/version bytes are accounted for separately from `JSON.stringify({ title, content })`. Covers FR-01-FR-06, FR-08, AC-01-AC-06; design-review F1 and approved identity/share decisions.
- **Risks:** Large HTTP requests increase test time/memory. Build minimal bodies, avoid duplicate in-memory copies, and keep one large test payload alive at a time; preserve the exact boundaries.
- **Status:** Completed.
- **Verification evidence:** `npm run test:e2e` from `backend/` passed (6 tests), including lifecycle, omitted-header fallback, preserved non-owner 401, 409/no-overwrite, exact semantic boundaries, share reuse/revoke/fresh token, latest public values, 404, 204, and state-preservation assertions.

### T4 - Add approved frontend test foundation (P1)

- **Deliverables / likely files:** `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.ts`, a frontend test setup file, and initial test utilities/test file(s), such as `frontend/src/test/setup.ts` and `frontend/src/App.test.tsx`.
- **Dependencies:** G0.
- **Work:** Add mutually compatible versions of Vitest, jsdom, React Testing Library, and user-event for the existing React 19, Vite 8, TypeScript 6, Node 22 setup; update the lockfile with the manifest. Configure jsdom and test setup using the repository's existing Vitest conventions. Add `npm test` running `vitest run`. Mock browser APIs at the test boundary and use rendered UI/user interactions rather than component-internal state.
- **Acceptance / traceability:** A deterministic frontend test runs with the declared script; the test environment supports accessible-role queries, mocked `fetch`, `navigator.clipboard`, and `window.confirm`. Covers FR-08, AC-08; approved architecture decision 2 and design-review F4.
- **Risks:** Dependency compatibility and lockfile drift. Select compatible versions and verify clean installation with the repository's npm/Node 22 CI configuration.
- **Status:** Completed.
- **Verification evidence:** Frontend manifest and lockfile updated with the compatible Vitest 4, jsdom 27, Testing Library 16/user-event 14 and DOM peer dependency. `npm install --legacy-peer-deps --no-audit --no-fund`, `npm test` (13 tests), and `npm run build` passed in T9.

### T5 - Implement correct, note-scoped owner UI behavior (P1)

- **Deliverables / likely files:** `frontend/src/App.tsx`, related `frontend/src/App.css` styles only if necessary, and a narrowly scoped shared helper if needed.
- **Dependencies:** G0 and T1 (semantic title/size contract); may proceed in parallel with T2-T4 after G0.
- **Work:**
  - Align advisory byte measurement with backend effective titles: trimmed nonempty title, otherwise `Untitled note` for create and existing title for update. Measure UTF-8 serialized `{ title, content }` in the same order. Clearly describe it as advisory; server remains authoritative.
  - Retain the returned share token and full URL in the selected note's context. Provide owner revoke using the existing DELETE route and native `window.confirm`; cancellation performs no request. On successful revoke, clear active token/preview/copied state and announce success. On failure, retain enough link context to retry and announce the error, never success.
  - Keep share creation and clipboard writes as distinct outcomes. Keep/render the URL and provide a retry/copy or selectable URL after clipboard failure; say it was not copied. Only report copied after the clipboard promise resolves. Preserve active URL reuse and allow a later fresh URL after revoke.
  - Prevent stale note-scoped async continuations from restoring another selected note's state. Guard open/save/share creation, the transition from share response to clipboard call, clipboard completion, and revoke success/failure (and any other selected-note mutation discovered in implementation) against the initiating note/selection generation. A stale share completion must not write to clipboard after context has changed. An already-started clipboard write cannot be recalled, but its late completion must not overwrite current UI state. Clear URL/token state on selecting another note and creating a draft. Do not silently revoke as a race workaround.
  - Give visible success/status and error feedback suitable live-region semantics (`status` for non-errors and `alert`/appropriate error announcement), with truthful text for copy, save, and revoke outcomes. Keep public view read-only and continue omitting owner identity on public fetches.
- **Acceptance / traceability:** Note switching while deferred open/share/copy/revoke operations are pending never shows another note's URL, copied state, notice, or revoke result; stale operations do not initiate clipboard effects after context changes. Confirm/cancel, owner revoke outcomes, clipboard failure with URL retained, accessible truthful feedback, normalized advisory warning, demo identity, and public read-only behavior all match approved contracts. Covers FR-02-FR-07, NFR-01-NFR-03, AC-01, AC-05-AC-08; design-review F2-F4 and approved architecture decision 3.
- **Risks:** Clipboard writes are external side effects and cannot be rolled back. Keep URL visibility/revocation context explicit and do not claim revocation removes previously copied content.
- **Status:** Completed.
- **Verification evidence:** T6 interaction tests cover deferred open/save/share/clipboard/revoke completions, selected-note isolation, clipboard effects, normalized advisory size feedback, accessible outcomes, revoke, and retained URL behavior.

### T6 - Add frontend behavior and race-condition coverage (P1)

- **Deliverables / likely files:** `frontend/src/App.test.tsx` and focused test helpers under `frontend/src/` as appropriate.
- **Dependencies:** T4 and T5.
- **Work:** Test create/list/open/save and owner `x-user-id`; public read without owner header and no mutation controls; normalized-title advisory threshold with multibyte text; visible save/conflict/oversize errors; delete confirm/cancel; share active URL display and successful clipboard copy; clipboard rejection while URL remains and retry is truthful; revoke confirm/cancel, success clearing and failure retention; fresh link behavior after revocation; and accessible success/error announcements. Use deterministic deferred fetch/clipboard promises to switch selected notes before open/share/copy/revoke completion and prove late results cannot restore the prior note's state or trigger an outdated clipboard write.
- **Acceptance / traceability:** Tests observe user-facing controls, roles and text; assert no success indication on any failure/cancel and no link leakage into a different selected-note context. Covers FR-01-FR-08, AC-01, AC-05-AC-08; design-review F2-F4.
- **Risks:** Brittle implementation-detail tests and timing-dependent race tests. Use user-event and explicitly controlled promises, not arbitrary sleeps.
- **Status:** Completed.
- **Verification evidence:** `npm test` from `frontend/` passed (13 tests); required `npm run lint` and `npm run build` also passed in T9.

### T7 - Wire truthful frontend CI evidence (P1)

- **Deliverables / likely files:** `.github/workflows/quality.yml`; update `.github/workflows/agentic-sdlc.yml` only if a workflow-level summary contract must be kept synchronized and evidence shows it currently asserts an inaccurate frontend result.
- **Dependencies:** T4 and T6.
- **Work:** Run frontend `npm test` in the existing reusable frontend quality job alongside lint/build. Replace hard-coded “passed” frontend summary claims with the actual outcomes of the respective steps (success, failure, skipped, or cancelled); test counts may be reported when available but must not be invented or defaulted to success. Preserve failing commands as failing quality gates. Do not treat route-grep or the configured non-blocking npm audit as behavioral test evidence.
- **Acceptance / traceability:** CI executes the test suite; summaries truthfully represent the outcome of lint, build, and tests even when a step fails or is skipped; a failing frontend test fails the quality job. Covers FR-08, AC-08; architecture verification design and design-review F4.
- **Risks:** Workflow summary steps run under `always()` and may execute after failed or skipped steps; use actual step outcomes and preserve job failure semantics.
- **Status:** Workflow wiring and summary behavior implemented; no remote CI run was performed.
- **Verification evidence:** `.github/workflows/quality.yml` runs the frontend test script and reports actual test/lint/build step outcomes. Local frontend checks passed in T9; a GitHub Actions outcome remains unverified and is not claimed.

### T8 - Synchronize only directly related documentation (P2)

- **Deliverables / likely files:** `README.md`.
- **Dependencies:** T1, T2, T5, and T7 so the documented contract matches implementation and configured checks.
- **Work:** Replace ambiguous “30 MB” wording with the exact inclusive **31,457,280-byte UTF-8 JSON measurement** over normalized `{ title, content }`, distinguish the **32 MiB raw JSON transport cap**, and state that backend validation is authoritative. Describe owner link revocation/confirmation, active-link reuse/fresh URL after revoke, truthful copy failure behavior, and the frontend `npm test` command as supported. Preserve prototype-only `x-user-id`/in-memory limitations and avoid claiming production security/readiness.
- **Acceptance / traceability:** README claims match source, API behavior, manifests, and workflows; do not update source input, historical artifacts, unrelated launcher examples, or out-of-scope persistence/authentication plans. Covers NFR-03-NFR-04 and docs-sync skill requirements; FR-02, FR-05, FR-07, FR-08.
- **Risks:** Existing README includes unrelated stale launcher and historical roadmap statements. Keep changes tightly scoped; do not broaden or imply those unrelated items were fixed.
- **Status:** Completed.
- **Verification evidence:** README size thresholds/representation, backend authority, share/revoke/copy behavior, frontend test command, and prototype limitations were cross-checked against source, manifests, and workflow.

### T9 - Integrated verification and implementation evidence (P1, completion gate)

- **Deliverable:** Actual local command/result record below in this approved current-run plan; no separate phase 6/7 verification signoff is implied.
- **Dependencies:** T3, T6, T7, T8.
- **Work and required checks:** From `backend/`, run `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e`. From `frontend/`, run `npm test`, `npm run lint`, and `npm run build`. Run all checks against the final integrated changes and report failures, skipped checks, and limitations accurately; do not weaken tests or convert errors to success.
- **Acceptance / traceability:** Backend service and real-HTTP transport tests prove the exact inclusive semantic boundary plus raw 32 MiB rejection; E2E proves state-preserving 401/409/413, share reuse/revoke/fresh-token/public 404 and lifecycle; frontend tests prove user-visible accessible outcomes and races; build/lint and CI test wiring succeed. Covers FR-01-FR-08 and AC-01-AC-08.
- **Risks:** Large-payload E2E can stress CI memory/time. Preserve one-fixture-at-a-time construction and full required thresholds. If a genuine environmental constraint prevents a check, record it as not run rather than claiming success.
- **Status:** Local implementation verification completed; remote CI was not run.
- **Actual commands and results (working directory shown):**
  - `backend/`: `npm run lint` exit 0; `npm run build` exit 0; `npm test` exit 0 (2 files, 4 tests passed); `npm run test:e2e` exit 0 (1 file, 6 tests passed).
  - `backend/`: focused `npm test -- src/notes/notes.service.spec.ts` exit 0 (3 tests passed).
  - `frontend/`: `npm test` exit 0 (1 file, 13 tests passed); `npm run lint` exit 0; `npm run build` exit 0.
  - `frontend/` and `backend/`: `npm install --legacy-peer-deps --no-audit --no-fund` exit 0 after the relevant manifests were changed; lockfiles were updated.
  - Final scoped `git diff --check` exit 0. Generated tracked build/install side effects were restored; no commit or staging was performed.
- **Environment limitation:** The host reported Node.js 25.8.2 and npm 11.12.0, not CI's configured Node 22. Backend dependency installation emitted EBADENGINE warnings for Angular devkit packages requiring Node 22.22.3/24.15.0 or newer supported lines. All listed local checks nevertheless passed on the available runtime. The Node 22 CI environment and an actual workflow run remain unverified. Vitest also prints the existing `vite-tsconfig-paths` deprecation notice in backend test runs.

### T10 - Final scope/diff review and separately approved delivery (P0 gate)

- **Deliverable:** Human-reviewed final diff and explicit delivery decision; no commit, push, or PR is authorized by this plan alone.
- **Dependencies:** T9.
- **Review checklist:** Confirm only approved application/tests/config/README and run-artifact changes are present; source input and older artifact directories remain unchanged; no production auth/persistence/attachments/richtext/deployment scope was introduced; docs and CI reflect actual behavior; tests and results are truthful. Confirm pre-existing `.vscode/mcp.json` and `.vscode/settings.json` changes remain untouched and are excluded from any proposed staging set. Do not stage `.gitignore` or ignored paths.
- **Blocked-until:** Separate explicit human approval for any stage/commit/push/remote PR operation. Standard mode/current branch is not delivery authorization. Do not create or update remote resources without that approval.
- **Evidence:** Human approval plus phase 6 review, phase 7 verification, and a separately reviewed implementation diff remain pending. The original phase 4 plan was prepared without Git status/diff; phase 5 performed a scoped status/diff check without inspecting the protected VS Code files.

## Dependency summary

```text
G0
├── T1 ──┐
├── T2 ──┴── T3 ──────────────────────────────┐
├── T4 ───────┐                                │
└── T5 ───────┴── T6 ── T7 ──┐                │
          T1 + T2 + T5 + T7 ── T8              │
                             T3 + T6 + T7 + T8 ┴── T9 ── T10
```

T2 and T4 can proceed in parallel after G0; T5 can proceed after G0 and T1. T6 requires both UI implementation and its test foundation. CI must not be marked complete until the new frontend tests exist and run.

## Definition of done

1. Scope and priority for this plan were approved for phase 5; T1-T9 implementation and local validation are complete.
2. The implementation meets each linked requirement and acceptance criterion without leaving this prototype scope.
3. The backend semantic byte limit is exactly inclusive 31,457,280 bytes over normalized `JSON.stringify({ title, content })`; separate 32 MiB Express raw JSON parsing and explicit 413 behavior are exercised through the same setup used in production and E2E.
4. Existing fallback, non-owner 401, version 409/no-overwrite, soft deletion, public read-only 404, active-link reuse, and fresh post-revoke URL behavior remain covered and correct.
5. Frontend revoke, clipboard failure, accessible truthful feedback, title normalization, and asynchronous selected-note isolation are covered by deterministic user-level tests.
6. Frontend Vitest/jsdom/RTL/user-event dependencies and lockfile, `npm test`, CI test execution, and actual-outcome reporting are synchronized.
7. Relevant README claims are synchronized; all required build/lint/unit/E2E/frontend checks and their actual outcomes are recorded, with no hidden failures.
8. The original input, older artifacts, and both pre-existing `.vscode` changes remain untouched. Any later delivery actions occur only after their own explicit human approval.

## Approval record / remaining blockers

- **Scope/priority approval:** Approved October 5, 2026 for phase 5 implementation. G0 is satisfied; T1-T9 are complete.
- **Additional product decision:** None identified by the independent reviewer; the approved requirements/architecture govern. Any newly discovered material decision must be surfaced for approval rather than silently assumed.
- **Separate delivery blocker:** Staging, commit, push, or PR remains unapproved and requires explicit human approval after implementation review and verification.
- **Current-phase validation:** T1-T9 source, test, dependency, CI, and README changes were implemented and the local results above were collected. T10 review, remote CI/phase 7 verification, staging, commit, push, and PR/remote operations were not performed.

## Phase 5 remediation evidence for phase 6 finding R1

- **Authorization:** The user explicitly authorized this scoped remediation on October 5, 2026. No new product decision was introduced.
- **Change:** `frontend/src/App.tsx` now refreshes the notes list after every successful create or update, even if navigation made the initiating editor context stale. Editor selection and notices are still changed only for the current context. A monotonically increasing list-request generation prevents out-of-order list successes or failures from replacing newer state; initial and mutation-triggered list loads use the same guard.
- **Focused deterministic coverage:** `frontend/src/App.test.tsx` adds deferred-response UI cases for a create and an update completing after navigation, asserting that the current editor/notice remain intact while the sidebar reflects the successful mutation. A further deferred-list case asserts that an older response cannot overwrite a newer refresh.
- **Verification run from `frontend/`:** `npx vitest run src/App.test.tsx -t "successfully created|pending save|older notes-list"` exited 0 (3 passed, 12 skipped); `npm test` exited 0 (1 file, 15 passed); `npm run lint` exited 0; `npm run build` exited 0.
- **Scope and review status:** No backend files changed, so backend checks were not rerun. The independent phase 6 report `review.md` was not modified; R1 remediation is implemented and locally verified, but independent re-review/signoff remains pending. No files were staged and no commit, push, or PR was performed.

## Phase 5 remediation evidence for phase 6 finding R2

- **Authorization:** The user explicitly approved this tightly coupled reliability remediation on October 5, 2026. R1 is resolved per the independent rereview; no additional product decision or dependency was needed.
- **Change:** `frontend/src/App.tsx` preserves the last successfully loaded sidebar list when fetching fails. A separate workspace-scoped sidebar alert reports list failures even when navigation has made the saving editor context stale, without replacing current editor/share notices or changing selection, unsaved text, or share-link state. Initial failure shows an unavailable list rather than an empty library or endless loading. Post-save errors explicitly say the note was saved but list refresh failed; deletion-triggered refresh uses the same distinct causal reporting. Only the latest list request can update the list or its error, and a successful latest refresh clears that error.
- **Deterministic coverage:** Eight cases in `frontend/src/App.test.tsx` cover initial failure; normal successful save followed by refresh failure and recovery; deferred successful create/update after navigation followed by refresh rejection, preserving both sidebar entries, current editor/unsaved text, and current share success/error notice; and all four older/newer list success/failure combinations, ensuring stale responses cannot replace current list/error state.
- **Exact local verification (all from `frontend/`):**
  - First `npx vitest run src/App.test.tsx -t "notes-list refresh failures"` exited 1 (7 passed, 1 failed, 15 skipped). The new share-success assertion expected accessible button name `Copied`, but the existing icon contributes to its actual name `✓Copied`. Corrected the query to `/Copied/`; no production behavior or test expectation was weakened.
  - Rerun `npx vitest run src/App.test.tsx -t "notes-list refresh failures"` exited 0 (1 file passed; 8 passed, 15 skipped; 14.82s).
  - `npm test` exited 0 (1 file passed; all 23 tests passed, none failed/skipped; 30.62s).
  - `npm run lint` exited 0 with one warning: `src/App.tsx:73:14`, `react(set-state-in-effect)`, at the initial `loadNotes()` effect. No lint rule was disabled or suppressed.
  - `npm run build` exited 0 (`tsc -b` and Vite 8.2.2; 18 modules transformed; Vite build 910ms).
- **Limitations / follow-up:** Backend checks were not rerun because no backend code changed. Node 22/remote CI remain unverified. Phase 6 independent rereview of R2 and T10 delivery approval remain pending; this evidence does not change the reviewer verdict. No dependency installation, manifest changes, delegation, staging, commit, push, or PR. The reviewer reports, original input, and older artifacts remain untouched. The unrelated agent file and protected VS Code files remain untouched and uninspected.

## Phase 5 targeted remediation for phase 7 coverage findings AC-03 and AC-05

- **Authorization:** The user approved this bounded remediation. The phase 7 `verification.md` verdict was not edited.
- **AC-03 change and coverage:** `backend/src/notes/notes.service.spec.ts` now proves that a non-owner share-creation rejection leaves the service's active-link map at one entry and the original public link readable. `backend/test/app.e2e-spec.ts` asserts the existing HTTP 401, reads the original public link after rejection, and verifies an owner request still receives that same token. This supplements, rather than substitutes for, the service state assertion with same-owner link reuse.
- **AC-05 change and coverage:** `frontend/src/App.test.tsx` edits a saved note without saving, verifies no create/update request was sent, and confirms the public view still displays only the latest saved title/content. It then saves the draft and verifies a fresh public read displays the newly saved values.
- **Documentation/workflow coupling:** `.github/PULL_REQUEST_TEMPLATE.md` now includes frontend unit-test counts; `.github/workflows/agentic-sdlc.yml` checks that `frontend/package.json` defines `test`; the README now accurately identifies the configured npm audit as non-blocking rather than claiming there is no security-scanning pipeline.
- **Focused verification:** From `backend/`, `npm test -- src/notes/notes.service.spec.ts` exited 0 (1 file, 4 passed); `.\node_modules\.bin\vitest.cmd run --config ./vitest.config.e2e.ts -t 'enforces owner-only sharing'` exited 0 (1 passed, 5 skipped). From `frontend/`, `.\node_modules\.bin\vitest.cmd run src/App.test.tsx -t 'keeps unsaved edits private'` exited 0 (1 passed, 23 skipped). Initial AC-05 runs exposed assertions querying all mounted roots and matching the owner's private textarea as well as public content; both public assertions were scoped to their visitor renders, and the focused test then passed.
- **Integrated verification:** From `backend/`, `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e` each exited 0; unit tests reported 5 passed and E2E reported 6 passed. From `frontend/`, `npm test`, `npm run lint`, and `npm run build` each exited 0; frontend tests reported 24 passed, and lint reported the existing `react(set-state-in-effect)` warning at `src/App.tsx:73:14`. A local package/template check confirmed the frontend evidence row and referenced package scripts are present.
- **Limitations / follow-up:** No dependency audit/fix or manifest/lockfile change was made because the backend dependency decision remains pending; the configured CI audit is non-blocking. Local checks used Node v25.8.2/npm 11.12.0; Node 22 and remote CI remain unverified. The unrelated launcher-path discrepancy remains out of scope. Build-generated backend outputs were removed/restored after verification. No verdict document, protected VS Code configuration, unrelated agent file, or earlier artifact was changed; nothing was staged, committed, pushed, or submitted as a PR.

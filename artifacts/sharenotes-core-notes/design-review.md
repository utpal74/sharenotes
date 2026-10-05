# ShareNotes Core Notes and Sharing - Independent Architecture Review

**Review phase:** SDLC phase 3, independent architecture review

**Review disposition:** Conditionally acceptable; proceed to phase 4 planning with the findings below explicitly accounted for.

**Implementation gate:** Not opened by this review. No production code, CI, tests, dependency manifests, or architecture artifact were changed.

**Approval status:** Requirements and architecture decisions are recorded as approved on October 5, 2026. No additional material product decision is required by this review.

## Review scope and evidence

Reviewed the approved [requirements](./requirements.md) and [architecture](./architecture.md), the applicable [ShareNotes project instructions](../../.github/instructions/sharenotes-project.instructions.md), reviewer configuration and workflow, and the required API-contract, security-scan, and docs-sync skills. Inspected the relevant README, Nest bootstrap/module/controller/service/types, frontend app and Vite config, backend test/config, workspace manifests, and quality/security workflows.

The application remains the approved in-memory/demo-user prototype. The `x-user-id` header is caller-controlled and is not authentication; public share tokens are bearer capabilities. Neither is reviewed or described as production security. Findings below are focused on this design and its approved requirements, not a comprehensive vulnerability assessment.

## Severity-ranked findings

### F1 - High: Make the raw JSON cap effective at the actual Nest/Express request boundary

**Evidence:** The approved design calls for a 32 MiB Express JSON parser limit and an explicit 413 for parser rejection ([architecture, Backend](./architecture.md), [backend `main.ts`](../../backend/src/main.ts)). Current bootstrap uses `NestFactory.create(AppModule)` without parser configuration. Nest's Express platform installs its default JSON parser unless configured otherwise; a later parser registration may not see a request already consumed or rejected. Current E2E setup creates the app directly from `AppModule` in [backend `app.e2e-spec.ts`](../../backend/test/app.e2e-spec.ts), without the production prefix or bootstrap configuration.

**Impact:** The current framework parser can reject requests far below the approved semantic limit, so the exact-boundary note cannot reach `NotesService`. A test configured differently from production could pass while the running API still rejects valid notes, or the parser error could fail to use the promised 413 response.

**Recommendation (planning detail, not a new product decision):** Define one shared Express/Nest setup used by both production bootstrap and HTTP E2E tests. Explicitly control Nest's default parser registration, install the bounded JSON parser before routing, and ensure parser-limit errors return an explicit 413. Test through the real HTTP route for create and update, including a request at the semantic maximum and one above it, while separately checking the raw 32 MiB cap and no unintended state mutation. Do not treat a service-only boundary test as proof of transport behavior.

### F2 - Medium: Protect note-scoped UI state from late asynchronous completions

**Evidence:** The architecture correctly requires clearing link-specific state on note changes and describes separate share-creation and clipboard outcomes ([architecture, Frontend](./architecture.md)). In the current [frontend `App.tsx`](../../frontend/src/App.tsx), note opening, saving, share creation, and clipboard work are asynchronous and their continuations update shared component state. Clearing the share preview when a user selects a different note does not by itself prevent an earlier request from later restoring the old note's URL, copied indicator, or notice.

**Impact:** A delayed open/share/copy/revoke response can associate one note's share URL or status with a different selected note. This is a correctness and privacy/confusion risk in the owner UI, especially when the user switches notes while a request is pending.

**Recommendation (planning detail):** Define how in-flight operations are scoped to the note that initiated them. Use a selected-note/request generation guard (or an equivalent explicit interaction lock) so stale completions cannot overwrite current selection or link state. Keep a successfully created URL available only in its originating note context, and apply revoke success/failure only to that context. Add deterministic UI tests with deferred fetch/clipboard promises that switch notes before each operation resolves. Do not silently revoke a link as a race workaround.

### F3 - Low: Align advisory frontend size feedback with backend normalization

**Evidence:** The backend measures the final title after trim/default normalization and the content as UTF-8 JSON bytes ([backend `notes.service.ts`](../../backend/src/notes/notes.service.ts)); the current frontend measures the raw editor title and content in [frontend `App.tsx`](../../frontend/src/App.tsx). The architecture requires the same serialization while also specifying backend normalization ([architecture, Backend and Frontend](./architecture.md)).

**Impact:** Client feedback can disagree with the authoritative calculation for whitespace-only or padded titles. The backend remains authoritative, so this is not a bypass, but a valid payload could be rejected early by the UI or appear acceptable and then fail at the API.

**Recommendation (planning detail):** Either apply the same title trim/default rule before the advisory client measurement or make the UI message explicitly advisory and let the server decide. Keep backend acceptance/rejection and exact 31,457,280-byte tests authoritative; include normalized-title and multibyte cases in tests.

### F4 - Low: Keep the new frontend test/CI evidence truthful and accessible

**Evidence:** The approved frontend test stack and CI `npm test` step are identified in the architecture ([architecture, Verification design](./architecture.md)). The frontend currently has no test script or test dependencies ([frontend `package.json`](../../frontend/package.json)); the reusable [quality workflow](../../.github/workflows/quality.yml) currently runs only frontend lint/build and its `always()` summary unconditionally labels those checks passed. The editor notice in current [frontend `App.tsx`](../../frontend/src/App.tsx) is not given an explicit live-region role.

**Impact:** The approved test tooling must be added compatibly with the existing React 19, Vite 8, TypeScript 6, and Node 22 setup and committed with a synchronized lockfile. A summary that reports success regardless of outcome would misstate CI evidence, and visible errors/successes may not be announced to assistive technology.

**Recommendation (planning detail):** Select mutually compatible test dependency versions and update the frontend lockfile with the manifest; add `npm test` to the quality job and report actual test outcomes rather than unconditional success. Give success and error feedback appropriate live-region semantics and assert user-visible/accessibility roles in interaction tests. No additional tooling is needed for this review.

## Requirement traceability

| Requirement | Architecture coverage and repository evidence | Review result |
| --- | --- | --- |
| FR-01 note lifecycle | Existing controller/service and editor cover create/list/open/save; architecture retains them and calls for lifecycle coverage. | Covered in design; test evidence is currently absent. |
| FR-02 exact serialized UTF-8 limit | Architecture specifies normalized `JSON.stringify({ title, content })`, inclusive 31,457,280-byte limit, 32 MiB transport cap, and HTTP plus service cases. Current service uses `30 * 1024 * 1024` (numerically the approved threshold) but mentions attachments in its rejection text. | Covered subject to F1 parser wiring and F3 advisory normalization; tests not run. |
| FR-03 owner-only mutations, demo identity, omitted-header fallback, existing 401 | Controller/service use the fallback and throw `UnauthorizedException` for another owner; architecture preserves these semantics and excludes real authentication. | Covered; distinct-owner/no-state-change tests are planned, not present. |
| FR-04 stale save returns 409 without overwrite | Service checks version before replacing state; architecture requires conflict and read-after-conflict tests. | Covered; tests are planned, not present. |
| FR-05 active-link reuse, fresh link after revoke, copy, latest read-only public view | Service reuses active links and returns a newly generated token after revocation; controller returns the token/path; current UI has no revoke action and conflates clipboard failure with share failure. Architecture supplies the intended UI behavior. | Covered; F2 must guard asynchronous UI state. Tests are planned, not present. |
| FR-06 revoked/deleted public links return 404 | Service rejects revoked tokens and deleted notes; architecture retains capability-based read-only access and 404. | Covered; tests are planned, not present. |
| FR-07 confirmations and visible outcomes | Current UI confirms deletion but has no revoke control; architecture adds native revoke confirmation and distinct success/failure handling. | Covered; include accessible status/error announcements (F4). |
| FR-08 backend and frontend automated behavior coverage | Existing backend configs support Vitest and Supertest E2E; current E2E covers only the root health route. Frontend has no test runner. Architecture specifies the approved frontend stack and a quality-workflow test step. | Covered as a proposed approach; tests, dependencies, and CI change remain unimplemented. |

## API contract and evidence

The README documents these eight routes. The controller/service implementation matches their core intended operations; there is no observed route-shape drift. Available tests do not yet establish notes API behavior.

| Operation | Documented/implemented behavior observed | Test evidence observed | Status |
| --- | --- | --- | --- |
| `POST /notes` | Create; defaults/normalizes title and measures serialized title/content. | No notes-specific test; only root health E2E. | Implemented; exact boundary and fallback coverage missing. |
| `GET /notes` | List active notes for the header owner or omitted-header fallback; supports limit/offset. | No notes-specific test. | Implemented; identity/lifecycle coverage missing. |
| `GET /notes/:noteId` | Retrieve an active owned note; missing/deleted is 404 and a different owner is 401. | No notes-specific test. | Implemented; status/fallback coverage missing. |
| `PATCH /notes/:noteId` | Owner check, version conflict 409, size check, then update. | No notes-specific test. | Implemented; no-overwrite and boundary coverage missing. |
| `DELETE /notes/:noteId` | Owner-only soft-delete; 204 and invalidates links. | No notes-specific test. | Implemented; state-preservation/public-404 coverage missing. |
| `POST /notes/:noteId/share` | Owner-only create/reuse; response includes token and `/shared/:token` path. | No notes-specific test; UI currently copies returned URL. | Implemented; reuse/authorization coverage missing. |
| `DELETE /notes/:noteId/share/:token` | Owner-only revoke; 204; invalid/mismatched/revoked link is 404. | No notes-specific test; no owner UI control. | API implemented; UI and API behavior coverage missing. |
| `GET /shared/:token` | Public latest saved note; read-only response, no-cache/ETag; revoked/deleted is 404. | No notes-specific test; current UI renders a read-only route. | Implemented; latest-value and unavailable-link coverage missing. |

## Security, consistency, operations, and accessibility assessment

- **Authorization/privacy:** The design accurately labels `x-user-id` checks as prototype-only, preserves 401 rather than inventing 403, and treats the opaque share token as a bearer capability. Revocation blocks later reads but cannot recall copied URLs or already retrieved content. No production-authentication expansion is warranted under the approved scope.
- **Input/resource boundary:** Separate raw parser and semantic size limits are appropriate. A 32 MiB per-request parser bound still permits significant memory use under concurrent requests; this is an acknowledged prototype limitation, not a request to add production rate limiting or infrastructure. F1 is required so the stated transport limit actually governs requests.
- **Data consistency/failure handling:** Version checks precede writes; soft-delete revokes all associated links; active-link reuse and fresh post-revoke token behavior are coherent. Clipboard failure is correctly designed as distinct from successful link creation. F2 covers stale frontend completions.
- **Scale/operations:** Process-local maps and loss on restart are correctly retained and documented as prototype behavior. Large boundary requests have CI memory/time cost; the architecture appropriately recommends one minimal fixture at a time. No persistence, deployment, or production scale work is justified.
- **Accessibility:** Native confirmation preserves the existing interaction pattern. Explicit status/error announcements should be planned with F4 so revoke, copy, and request outcomes are available beyond visual presentation.
- **Testability:** Backend unit plus real HTTP E2E coverage is an appropriate split, provided both exercise production-equivalent parser configuration. Frontend RTL/user-event tests are appropriate for confirmation, clipboard and request failures, and read-only presentation; deferred-promise race tests should cover F2.

## Documentation synchronization

### In sync

- README route inventory agrees with the eight controller routes and their core purpose.
- README and project instructions correctly describe an in-memory NestJS/React-Vite development prototype and its lack of production authentication/persistence.
- Backend Vitest/Supertest configuration and CI scripts exist as described; current configured backend quality workflow includes lint, build, unit, and E2E checks.

### Stale

- README describes only a “30 MB” title/content limit, not the exact UTF-8 serialized representation or inclusive 31,457,280-byte boundary. The architecture correctly requires documentation alignment.
- README launcher examples use root-level script paths although launchers are under `scripts/`; this is unrelated to the approved feature scope and should not be silently folded into implementation.
- README feature claims do not yet describe owner revocation, the exact error/confirmation behavior, or the precise share-size contract. Current app's share preview says the URL was copied even when clipboard writing fails; the architecture correctly calls for a distinct outcome.

### Missing

- README-level detail for omitted `x-user-id` fallback and the prototype-only 401 owner behavior is not needed to expand the scope, but implementation documentation should avoid implying real authentication.
- There is no notes-specific backend behavior test evidence, frontend interaction test suite, frontend `test` script, or frontend CI test step yet.
- The API has no observed OpenAPI schema; none is required by the approved scope.

## Decisions, alternatives, blockers, and gate

### Accepted decisions

The user-approved requirements and architecture decisions remain the authority: retain the existing prototype; use the exact inclusive serialized UTF-8 semantic limit and separate 32 MiB raw JSON cap; preserve demo identity, omitted-header fallback, and current non-owner 401; add confirmed owner revocation with visible outcomes and correct share-state clearing; retain active-link reuse and generate a fresh post-revoke token; use frontend Vitest/jsdom/React Testing Library/user-event with CI and backend unit/E2E behavior coverage.

### Rejected alternatives within this review

- Do not rebuild the app, add production authentication or persistence, or broaden the work into attachments, deployment, or production hardening.
- Do not change the established non-owner 401 to a presumed 403.
- Do not measure the semantic note limit using raw HTTP bytes or include the version/envelope in the title/content contract.
- Do not treat clipboard failure as share-link creation failure, or introduce a share-status endpoint when the existing create/reuse response already returns the token.
- Do not treat route grep, service-only tests, or CI audit configuration as substitutes for the approved behavioral checks.

### Remaining blockers and approvals

No unresolved material product decision or additional human approval is identified. F1-F4 are concrete planning/implementation constraints, not requests to expand approved scope. The planner should make them explicit in the implementation plan, including production-equivalent HTTP test setup, stale-completion guards, normalization-consistent advisory feedback, and truthful/accessibly announced frontend CI outcomes.

**Phase 3 verdict:** Review complete. The approved architecture is acceptable with the listed findings. **Phase 4 planning may proceed**; implementation remains gated on completion and approval of the plan. No architecture update is made in this review.

## Checks and limits

- **Performed:** Static review of the named approved artifacts, applicable instructions/skills, repository source, tests/configuration, manifests, README, and relevant CI workflows; confirmed the requested artifact directory listing did not contain `design-review.md` before creating it.
- **Not run by instruction:** Builds, lint, unit/E2E/frontend tests, dependency installation/restoration, network audit, or other scanner execution. No runtime behavior or test result is claimed.
- **Not performed:** No production/app/CI/input/other artifact edits; no staging, commit, push, or PR action; no inspection of `.vscode/mcp.json` or `.vscode/settings.json`; no delegation.

# ShareNotes Core Notes and Sharing - Architecture

**Status:** Approved architecture design based on the user's October 5, 2026 approval of decisions 1–3. Implementation and verification have not been performed; independent phase 3 design review remains pending.
**Scope:** Complete the existing prototype in place. This is not a rebuild or a production architecture.
**Inputs:** [Approved requirements](./requirements.md), [original request](../../docs/input/sharenotes-core-notes.md), [project README](../../README.md), and the inspected source, tests, manifests, and workflows.

## 1. Observed current state

- **Runtime and boundaries:** The backend is NestJS/TypeScript on its default Express adapter; `main.ts` sets `/api/v1` and enables CORS with `origin: true` and credentials. The frontend is a React/TypeScript single-page app built by Vite and hard-codes `http://localhost:3000/api/v1`. There is no observed deployment topology to design for.
- **Backend ownership:** `NotesController` maps note and sharing HTTP routes to `NotesService`. That service owns all note/share state in process-local `Map`s, generates UUID note IDs and 32-byte base64url share tokens, enforces owner checks, version conflicts, soft deletion, active-link reuse, and public lookup. Omitted `x-user-id` uses `demo-user`; a different ID is rejected through Nest `UnauthorizedException` (HTTP 401). A restart loses all state.
- **Payload limit:** The service and editor currently use `30 * 1024 * 1024` bytes (31,457,280 bytes). The backend computes `Buffer.byteLength(JSON.stringify({ title, content }), 'utf8')` after existing title trim/default behavior, and rejects only values greater than the limit. The frontend checks the same serialized fields using `Blob.size`. The backend error text incorrectly refers to attachments; attachments are not in scope. No Express body-parser override is visible, so the framework's much smaller default JSON body limit may reject large HTTP requests before this service check.
- **UI:** `frontend/src/App.tsx` owns editor, notice, and share-preview state. It confirms deletion with `window.confirm`, calls the create/reuse share endpoint, then copies the URL. There is no revoke control. Selecting another note does not currently clear share preview state. A clipboard failure is currently reported as share failure even though link creation may have succeeded. The public route fetches the token URL without the demo identity header and renders a read-only article or an error.
- **Contracts and tests:** The README documents all eight `/api/v1` routes. There is no observed OpenAPI schema. Backend Vitest is configured for `*.spec.ts`; Supertest/Vitest E2E is configured for `*.e2e-spec.ts`. Existing tests cover only the starter health/controller response; no notes-specific backend tests were found. The frontend has no test runner, test command, or testing dependencies.
- **CI and security tooling:** `.github/workflows/quality.yml` runs backend lint/build/unit/E2E and frontend lint/build. `.github/workflows/agentic-sdlc.yml` runs `npm audit --audit-level=high` for both workspaces with `continue-on-error: true`, and statically checks the eight controller routes. No frontend test step is configured. These are configured checks, not results from this phase.

## 2. Proposed target and component responsibilities

Retain the existing NestJS service/controller and React/Vite application. Make only the approved lifecycle, size-contract, owner UI, and automated-coverage changes. Keep the backend authoritative; do not introduce a database, real authentication, attachments, rich text, or deployment work.

```text
Owner browser (demo-user)                 Public visitor (share token)
  React editor + API helper                    React read-only route
       | x-user-id: demo-user                       | no owner header
       +--------------------+-----------------------+
                            v
              NestJS / Express, /api/v1
           bounded JSON parsing -> NotesController
                            |
                            v
                  NotesService (authority)
             notes Map + share-links Map

Vitest service tests -> service rules and byte boundaries
Vitest + Supertest E2E -> HTTP, headers, parser, status, and lifecycle
Frontend Vitest + React Testing Library -> user-visible interactions
```

### Backend

- Keep `NotesController` as the HTTP adapter and `NotesService` as the sole owner of note, ownership, version, deletion, and share-link rules. Do not duplicate authorization or size enforcement in the controller.
- Keep the existing route shapes and response semantics. Preserve the omitted-header fallback and the actual non-owner response (401); tests should assert it rather than change it to a presumed 403.
- Set an explicit, bounded Express JSON parser limit of **32 MiB**. This approved raw-body cap allows a valid maximum-sized note plus the API envelope/version field; it is transport protection, not the note-size contract. Requests rejected at this earlier boundary should continue to receive an explicit 413 rather than a success-shaped fallback.
- Keep `NotesService` measurement on the final title/content values after its existing trim/default rules: UTF-8 byte length of exactly `JSON.stringify({ title, content })`, property order as shown, with `MAX_NOTE_BYTES = 31_457_280`. Accept equality; return 413 for any larger measured value with a clear title/content-only message. Do not count version, attachments, or other fields in this domain measurement. Keep the service check authoritative regardless of browser validation.
- Keep optimistic version checks before replacing the note; stale writes return the existing 409 payload and must not mutate state. Keep soft deletion and its current invalidation of all links. Keep idempotent active-link reuse; after revocation, create a fresh opaque token.
- Public lookup remains capability-based, unauthenticated and read-only. Continue returning the latest saved note, and 404 for unknown/revoked tokens or deleted notes. Preserve the current `Cache-Control: no-cache, must-revalidate` and version ETag behavior; do not add mutations or draft access to this route.

### Frontend

- Keep the single React app and existing API helper. Retain `demo-user` for owner requests and omit it for public reads. Use the same serialized UTF-8 size calculation as the backend for early usability feedback, but never treat it as security enforcement.
- Add revoke to the selected-note share controls using the existing `DELETE /notes/:noteId/share/:token` operation. Retain the token returned by `POST /notes/:noteId/share` in component state; that operation already returns the token and reuses an active link, so no status endpoint is needed. Ask for explicit confirmation before revocation, matching the existing native delete-confirmation pattern.
- On successful revocation, clear the active token, copied preview, and copied indicator and show a visible success notice. On failure, retain enough context to retry and show the error without a success notice. Clear link-specific state when changing note or creating a new draft so one note's URL is never presented as another note's.
- Handle creation and clipboard copying as distinct outcomes: keep/render the generated URL if clipboard access is denied, offer a visible retry/copy action or selectable URL, and report that it was not copied. Do not claim copying succeeded until the clipboard write resolves. A revoked URL already copied elsewhere cannot be recalled; the UI should make this limitation clear where useful.
- Keep public content display-only. Revoke affects future API reads, not content already read or copied by a visitor.

## 3. API contract and drift

The table compares the README contract with the inspected controller/service and available test evidence. The existing backend's Nest defaults apply where the controller does not override the status.

| Operation | Documented behavior | Implemented behavior | Test evidence | Status / required action |
| --- | --- | --- | --- | --- |
| `POST /notes` | Create title/content note | Creates for header owner or fallback; trims/defaults title; checks serialized bytes; returns note (Nest 201) | No notes test found | Implemented; add owner/default and exact-limit/oversize coverage; replace inaccurate attachment error |
| `GET /notes` | List active notes for current development user | Owner-filtered, paginated summary (200) | No notes test found | Implemented; add lifecycle/identity coverage as needed |
| `GET /notes/:noteId` | Retrieve owned note | Active note returned; missing/deleted is 404; different owner is 401 | No notes test found | Implemented; add identity and fallback coverage |
| `PATCH /notes/:noteId` | Update owned note with version; stale version conflicts | Owner-checked; version mismatch is 409; payload check precedes write | No notes test found | Implemented; add 401, 409/no-overwrite, exact-size, and oversize coverage |
| `DELETE /notes/:noteId` | Soft-delete owned note | Owner-checked 204; marks deleted and revokes its links | No notes test found | Implemented; add owner/non-owner state-preservation and public-404 coverage |
| `POST /notes/:noteId/share` | Create or reuse active share link | Owner-checked; reuses active token or creates token; returns token and `/shared/:token` path (Nest 201) | No notes test found; UI copies URL | Implemented; add authorization, reuse, and new-token-after-revoke tests |
| `DELETE /notes/:noteId/share/:token` | Revoke a share link | Owner-checked 204; unknown, wrong-note, or already revoked link is 404 | No notes test found; no UI control | API implemented; approved owner UI missing; add API and interaction coverage |
| `GET /shared/:token` | Unauthenticated read-only public note | Latest active note returned; revoked/unknown/deleted is 404; sets no-cache and ETag | No notes test found; read-only UI exists | Implemented; add current-content, read-only, and 404 coverage |

There is no observed HTTP contract drift in the core routes, but requested notes-specific test evidence is missing and the revoke UI is absent. The documented “30 MB” shorthand is numerically the existing 30 MiB threshold but does not state the exact serialized UTF-8 measurement or inclusive boundary. Document the precise contract and supported revoke/test behavior when implementation is approved. Do not change unrelated README discrepancies in this scope.

## 4. Data ownership, state, and security boundaries

- **Data owner:** `NotesService` owns note and share-link maps. A note owner ID and an optional share `revokedAt` timestamp determine access. Do not add a second frontend or controller authority.
- **Owner trust boundary:** `x-user-id` is caller-controlled and always `demo-user` in this UI. Any caller can impersonate that identity; the observed 401 check only distinguishes supplied IDs and is not authentication. This remains a demo-only trust limitation, not a security guarantee.
- **Public trust boundary:** Possession of an unguessable share token grants read-only access to the latest saved note until revocation/deletion. Treat the token as a bearer secret; do not log or expose it beyond the share response/UI. Revocation blocks subsequent server reads but cannot retract copied URLs or already retrieved content.
- **Input/resource boundary:** The backend must bound raw request parsing and independently enforce the exact semantic size after parsing. UTF-8 byte length, not JavaScript character count, is authoritative. Client-side checks are advisory. The in-memory store, broad configured CORS origin, and user-selected identity prevent any production-security claim.
- **Error boundary:** Keep explicit 401 owner rejection, 404 unavailable note/link, 409 stale version, and 413 oversized payload responses. In the UI, distinguish cancellation from failed requests and successful actions from clipboard or network failures.
- **Excluded expansions:** No production authentication, durable persistence, attachments, rich text, deployment, or broader security hardening is part of this design.

## 5. Verification design for implementation phase

### Backend

Add service unit tests under the existing Vitest `*.spec.ts` pattern for title/content measurement and domain state transitions. Add Supertest HTTP E2E tests under the existing `*.e2e-spec.ts` pattern to verify controller wiring and parser behavior, not merely mocked service calls.

Required measurable cases:

1. Construct title/content whose `Buffer.byteLength(JSON.stringify({ title, content }), 'utf8')` is exactly **31,457,280** and prove acceptance; construct the same representation at **31,457,281** and prove 413. Include non-ASCII content so a character-count implementation cannot pass accidentally. Assert the returned/stored `sizeBytes` matches the measured bytes.
2. Exercise the exact-limit request over HTTP as well as the service. This verifies the configured JSON parser lets the valid request reach domain validation. Verify one byte above reaches an explicit rejection and that no note is created/updated. Account for raw JSON envelope and update `version` bytes separately from the contract measurement.
3. Exercise create/list/open/save/delete and omitted-header fallback; create with one `x-user-id`, then prove a distinct ID receives the existing 401 on update, delete, share, and revoke, with subsequent reads proving unauthorized attempts did not mutate state.
4. Exercise successful update, stale version 409 and unchanged latest data; active-share URL reuse; successful revoke; a different URL after revoke; public latest-saved values; 404 after revoke and after soft deletion; and 204 revoke/delete responses.

Use existing Vitest, Nest testing utilities, and Supertest; the dependencies/configuration already exist. Keep tests isolated with fresh application/service state per test. Avoid keeping multiple large boundary fixtures in memory at once.

### Frontend

There is currently no frontend test infrastructure. The approved fit is Vitest with `jsdom`, `@testing-library/react`, and `@testing-library/user-event`, following the repository's existing Vitest use in backend. Mock `fetch`, `navigator.clipboard`, and `window.confirm`; test through rendered controls rather than implementation-only state. Add a frontend `test` script that runs `vitest run`, and run it in the reusable quality workflow with `npm test` from `frontend/`.

Cover: demo identity on owner requests and no owner header on public reads; edit/save and stale/oversized errors; deletion confirmation/cancel; share creation and active URL display; successful clipboard copy and clipboard failure with URL still available; revoke confirmation/cancel and visible success/failure; stale share state invalidation on note changes; and public read-only content plus unavailable/revoked response. Ensure tests assert visible outcomes and that no success state appears on failure.

### CI, docs, and configured security checks

- Extend `.github/workflows/quality.yml` to run frontend `npm test` alongside existing backend unit/E2E, lint, and build checks. Keep the route-static check and npm audit job as supplementary checks, not substitutes for behavioral tests.
- Align the README's size description and share-revoke/user-visible behavior with the implemented contract; preserve its prototype-only authentication and storage limitations.
- The existing CI config has `npm audit --audit-level=high` for each workspace, but the workflow is non-blocking (`continue-on-error: true`). No scanner was run in this architecture phase, no dependency install was performed, and no third-party source/secret submission is authorized. Treat the audit as configured but deferred; report actual findings and its non-blocking policy in the later verification. This is a focused trust/validation design, not a comprehensive security audit.

## 6. Risks and approval record

### Approved architecture decisions

The user explicitly approved the following on October 5, 2026:

> “Approve architecture decisions 1–3”

1. **Raw HTTP body cap and semantic size:** Configure a **32 MiB** raw JSON parser cap. Separately retain the inclusive semantic limit of **31,457,280 bytes**, measured as the UTF-8 byte length of exactly `JSON.stringify({ title, content })` after the service's existing title trim/default behavior. Accept equality and reject larger values. The parser cap is a transport bound and does not change this semantic contract.
2. **Frontend tests and CI:** Use Vitest, `jsdom`, React Testing Library, and `user-event`; add a frontend `test` script running `vitest run`, and run that script in the reusable quality workflow as `npm test` from `frontend/`.
3. **Revoke and clipboard interaction:** Use native `window.confirm` for revocation; clear local share state after a successful revoke and when note selection changes; keep the generated URL visible if clipboard access fails and report the copy failure separately from share creation.

### Implementation dependencies and risks

- **Boundary reachability remains an implementation dependency:** configure the approved 32 MiB parser cap so the exact semantic boundary can be exercised over HTTP. No approval blocker remains for this decision.
- In-memory state means notes/links disappear on restart and tests must not assume persistence.
- Demo identity headers are spoofable; the share capability is intentionally public until revoked. Neither should be represented as real account security.
- Revocation cannot erase copied links, cached/previously displayed content, or knowledge already obtained by visitors.
- Large payload boundary tests can consume substantial memory and time; create minimal single-fixture payloads, avoid repeated serialization where possible, and ensure the CI runner can handle them without weakening the exact threshold assertions.
- The audit workflow is configured but non-blocking; this design does not claim scanner execution or a comprehensive vulnerability assessment.

**Phase status:** The architecture decisions above are approved, but this design has not been implemented or tested. The independent phase 3 architecture review is still pending. This approval record changes no scope and does not approve implementation or verification results.

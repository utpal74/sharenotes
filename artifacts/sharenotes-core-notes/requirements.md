# ShareNotes Core Notes and Sharing - Requirements

## Approval status

**Approved by the user on October 5, 2026.** The user approved the requirements and all proposed decisions recorded below. This completes the phase 1 requirements approval gate; subsequent phase gates remain in effect. This artifact records requirements only and does not claim implementation or test completion.

## Source and run metadata

- **Source type:** Markdown, read as UTF-8.
- **Source identifier:** `sharenotes-core-notes`.
- **Source file:** [docs/input/sharenotes-core-notes.md](../../docs/input/sharenotes-core-notes.md)
- **Source status:** Draft requirement; its requirements and proposed decisions have since been approved by the user for this run.
- **Repository:** ShareNotes.
- **Run mode requested by the user:** Standard mode on the current branch `demo/sharenotes-full-sdlc`. This overrides the source file's local-only execution statement; approval gates remain in effect.
- **Delivery boundary:** This phase updates only this requirements artifact. No application, source input, prior artifact, or VS Code configuration is to be changed. No staging, commit, push, remote resource creation, or test execution is authorized by this phase.
- **Orchestrator-verified worktree state:** The orchestrator independently verified pre-existing modifications to `.vscode/mcp.json` and `.vscode/settings.json` using `git status`. The requirements analyst did not run Git to verify this state. The files' contents were not inspected; they must not be touched.
- **Orchestrator-verified artifact path state:** The orchestrator independently verified that `artifacts/sharenotes-core-notes/` did not exist before artifact creation using `Test-Path`. The requirements analyst did not run that check. This artifact is the only output authorized in that directory for this task.
- **Other protected artifacts:** Prior outputs in `artifacts/sharenotes/` and `artifacts/sdlc-workflow-generalization/` must remain untouched. The historical baseline requirements are context only and do not define or approve this run's requirements.

## Source requirements and scope

The source requests validation and completion of the existing prototype, not a rebuild. It names these capabilities:

- Create, list, open, and save notes containing a title and text.
- Enforce a backend maximum of 31,457,280 bytes over UTF-8 `JSON.stringify({title,content})`, accepting the exact limit and rejecting larger payloads.
- Restrict note mutations and share creation/revocation to the designated owner.
- Reject stale saves with `409 Conflict` without overwriting a newer version.
- Provide a copyable share URL that displays the latest saved note read-only.
- Return `404 Not Found` for public access through revoked links or deleted notes.
- Confirm deletion and clearly display errors.
- Provide an owner-facing share-revocation action with confirmation and visible success or error feedback.
- Produce automated backend behavior coverage and relevant frontend interaction coverage.

Production authentication, persistent storage, rich text, attachments, and deployment are explicitly out of scope. Prototype owner checks must not be represented as production authentication. Deletion is included because the source requires deleted-note public links to return 404 and calls for deletion confirmation.

## Repository observations: existing behavior, not verification

The following are static observations recorded from the repository source and documentation; no application was run and these are not test results:

- The README describes the application as a NestJS API and React/Vite frontend prototype. The backend stores notes and share links in in-memory maps; the frontend uses `demo-user` as its UI identity. See [README.md](../../README.md) and [ShareNotes project instructions](../../.github/instructions/sharenotes-project.instructions.md).
- The UI and notes API contain create, list, open, save, soft-delete, and public-read flows. Delete uses a browser confirmation dialog; the UI displays request errors in its notice area.
- The notes service measures UTF-8 bytes of `JSON.stringify({ title, content })` and sets its maximum to `30 * 1024 * 1024` bytes. It does not account for attachments. Its oversized error mentions attachments even though attachments are outside the scope.
- Ownership checks compare the note owner ID with the supplied development user ID. This is not real authentication.
- Updates compare the supplied version to the current version and throw a conflict when they differ.
- The API supports creating and revoking share links. Link creation reuses an existing active link for that note. The frontend can copy a generated URL, but has no revoke control.
- Public retrieval reads the current active note; revoked links and deleted notes are not found by the backend. The public page has read-only presentation.
- The current backend E2E file exercises only the root health response; repository test listings show no notes-specific automated coverage. Package scripts for backend build, lint, unit tests, and E2E tests, and frontend build and lint, are present in their respective manifests. Results have not been run or verified for this phase.

These observations describe the inspected code, not a decision to preserve every current behavior. The approved requirements and decisions below govern later work.

## Actors

| Actor | Role |
| --- | --- |
| Note owner | Uses the prototype UI identity `demo-user` and performs owner-only operations on their notes, including saving, deleting, sharing, and revoking a share link. API behavior also supports distinguishing identities supplied through `x-user-id`; omitted-header fallback behavior is to be preserved. |
| Public visitor | Opens an active share URL and reads the latest saved note without mutation controls or mutation access. |
| Automated test runner / reviewer | Runs relevant backend and frontend checks and records actual commands, outcomes, and evidence for the covered behaviors. |

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | A prototype user can create a note with a title and text content, list their active notes, open a note, and save changes to its title and text. |
| FR-02 | The backend is authoritative for enforcing a maximum serialized payload size of 31,457,280 bytes, measured as the UTF-8 byte length of `JSON.stringify({title,content})`. A payload at the exact limit is accepted; a larger payload is rejected with a clear error. |
| FR-03 | Only the designated owner can update or delete a note, create a share link for it, or revoke one of its links. Unauthorized attempts must not change note or link state. The UI continues to use `demo-user`, and the current omitted-`x-user-id` fallback behavior is preserved. API tests exercise distinct `x-user-id` identities and retain the existing non-owner rejection; determine the precise response status from the implementation rather than assuming or inventing one. |
| FR-04 | A save based on a stale note version returns HTTP `409 Conflict` and does not overwrite the current saved note. |
| FR-05 | The owner can obtain and copy a share URL for a saved note. Repeated creation while a link is active reuses that active URL. After revocation, a later creation produces a new URL. A visitor with an active URL can read the latest saved title and text in a read-only view; the visitor cannot use the share URL to mutate the note. |
| FR-06 | A revoked URL and a URL for a deleted note return HTTP `404 Not Found` to public visitors. |
| FR-07 | Deleting a note requires explicit confirmation. The owner-facing revoke action also requires confirmation and visibly reports success or failure. Relevant request failures, including save conflicts, oversized payloads, and sharing, revocation, or deletion failures, are visibly communicated without implying success. |
| FR-08 | Automated backend behavior checks cover the note lifecycle, payload limit, owner authorization, stale-version protection, and share/revoke/delete behavior. Relevant frontend interaction checks cover confirmation, clipboard copying, visible errors and revoke outcomes, and public read-only viewing. Actual outcomes must be recorded; this requirement does not claim checks have run. |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | The backend is authoritative for payload validation and owner authorization; frontend validation is supplementary usability feedback. |
| NFR-02 | Public sharing grants read-only access to an active saved note. Owner mutation capabilities are not granted to public visitors. |
| NFR-03 | The solution remains a development prototype. Demo-user headers and in-memory storage do not establish production authentication or persistence. No production-readiness claim is permitted. |
| NFR-04 | Preserve unrelated current behavior and use existing repository conventions. Do not introduce production authentication, persistence, rich text, attachments, or deployment work under this scope. |

## Acceptance criteria

No implementation or test completion is implied by these acceptance criteria.

| ID | Acceptance criterion |
| --- | --- |
| AC-01 | Using the approved prototype identity behavior, a user can create a title/text note, see it in their list, open it, save changed title/text, and observe the saved values on reopening. The UI continues to use `demo-user`, and API requests without `x-user-id` retain the current fallback behavior. |
| AC-02 | Backend tests demonstrate acceptance at exactly 31,457,280 UTF-8 bytes for `JSON.stringify({title,content})` and rejection above that limit, with a clear error. |
| AC-03 | API tests exercise owner and distinct non-owner `x-user-id` values for update, delete, share creation, and revocation. The owner succeeds; the non-owner is rejected without state changes. Preserve and assert the existing non-owner rejection status after determining it from the implementation; do not invent a status code. |
| AC-04 | Submitting an outdated note version returns `409 Conflict`; a subsequent read proves the newer saved values were not overwritten. |
| AC-05 | While a share is active, creating another share returns the same active URL. The owner can copy that URL. A public visitor sees the latest saved title/text in read-only form, has no mutation controls, and cannot access an unsaved draft. |
| AC-06 | Public requests using a revoked link or a link for a deleted note return HTTP `404 Not Found`. Creating a share after revoking the prior active link produces a new URL. |
| AC-07 | The UI requires confirmation before deletion and before revocation. It visibly presents failures, including failed saves and failed share/revoke/delete requests, and visibly indicates successful revocation. |
| AC-08 | Relevant backend behavior tests and frontend interaction tests cover the applicable criteria, including clipboard copying, confirmation, errors, and public read-only viewing. Run the checks and record their actual commands, pass/fail outcomes, and limitations. |

## Decisions and assumptions

- **Approved decisions (October 5, 2026):** The user approved the exact size representation and boundary, prototype identity behavior, UI revocation and confirmation, active-link reuse and post-revocation URL behavior, and the required backend and frontend coverage recorded above.
- The directly supplied human request selects standard mode on the current branch, rather than the source file's local-only mode. This is an execution-mode override only.
- The user-specified scope and exclusions take precedence over capabilities described only in historical baseline artifacts.
- Existing prototype implementation may be reused if it satisfies the approved requirements; this request is validation/completion, not a fresh rebuild.
- Owner identity remains prototype-only because production authentication is explicitly excluded. Existing behavior for an omitted `x-user-id` header is to be preserved. The precise existing non-owner rejection status must be read from the implementation when writing or updating tests; no status is assumed here.
- No commit, push, or pull request is authorized by the standard-mode request alone; each needs separate explicit approval.
- The orchestrator verified pre-existing VS Code configuration modifications. They are out of scope and must not be inspected or changed.

## Dependencies

- Existing NestJS backend, React/Vite frontend, and their current API/UI patterns.
- Existing owner-check behavior, omitted-header fallback, and non-owner rejection status, to be confirmed from implementation when adding or updating tests.
- Human approval of this requirements artifact before phase 2; approved on October 5, 2026.
- The configured package scripts are potential validation commands; no commands have been run in phase 1.

## Out of scope

- Production authentication or identity-provider integration.
- Persistent database or storage; in-memory prototype storage remains.
- Rich-text editor or content sanitization.
- Attachments or attachment-size accounting.
- Deployment, production operations, or production readiness.
- Changes to `.vscode/mcp.json`, `.vscode/settings.json`, historical artifacts, the source input, or unrelated application behavior.
- Staging, committing, pushing, creating a remote pull request, architecture work, implementation, or tests in this phase.

## Documentation synchronization (docs-sync)

### In sync

- The selected Markdown input and its referenced README and historical baseline requirements exist. The repository's ShareNotes-specific instruction file and the required docs-sync skill also exist.
- Core API/UI behavior observed in the source broadly corresponds to the README's stated prototype note and sharing flows. Backend/frontend validation script names listed in the README exist in the respective package manifests.
- The orchestrator independently verified that the target artifact directory was absent before artifact creation.

### Stale

- The historical [baseline requirements](../sharenotes/requirements.md) describe registered users, rich text, attachments, and hosted production scope. Those claims conflict with this run's explicit prototype-only scope and must not be carried forward as approved requirements.
- The README's PowerShell and Bash launcher examples invoke `start-sharenotes` at the repository root, while the inspected launchers are under `scripts/`.
- The README describes a 30 MB title/content limit without documenting the byte representation or boundary. The approved contract is serialized UTF-8 JSON byte length with an inclusive maximum of 31,457,280 bytes.
- Historical workflow and verification artifacts cannot serve as approval or current-run evidence. Only the approved requirements and checks actually run for this run can do so.

### Missing

- The frontend has no share-revocation control, although the backend has a revoke endpoint; adding the owner-facing control, confirmation, and visible outcome is part of this approved scope.
- Automated checks specific to note lifecycle, size, authorization, stale versions, sharing/revocation, and UI behavior were not found in the inspected test files. Current test evidence for the requested behaviors is therefore missing.

## Phase 1 checks and disposition

- **Artifact path/collision check:** The orchestrator verified before artifact creation that the requested directory did not exist. The requirements analyst did not independently run `Test-Path`.
- **Repository context review:** Completed for applicable instructions, source, README, API/UI implementation, package scripts, and existing test listings.
- **Implementation/build/lint/test/architecture checks:** Not run; outside phase 1 scope.
- **Git status/diff verification:** The orchestrator independently verified the pre-existing `.vscode` modifications using `git status`; the requirements analyst did not run Git. No `.vscode` contents were inspected or changed.
- **Approval:** Approved by the user on October 5, 2026. No material requirements questions remain unresolved.

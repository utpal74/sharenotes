# ShareNotes Core Notes and Sharing

**Status:** Draft requirement for human approval.
**Source:** Current [project README](../../README.md) and
[baseline requirements](../../artifacts/sharenotes/requirements.md).

## User Story

As a ShareNotes user, I want to create, edit, delete, and share text notes
so that I can manage my thoughts and let others read selected notes.

## Scope

Validate and complete the existing prototype's core note workflows.
Reuse existing functionality; do not rebuild features that already meet
these requirements. This input is not a replacement for the missing original
Word source or approval of the production implementation plan.

## Acceptance Criteria

1. A user can create, list, open, and save notes with a title and text content.
2. The backend rejects title/content payloads over 30 MB with a clear error.
3. Only the designated owner can edit, delete, create a share link, or revoke it.
4. Saving a stale note version returns `409 Conflict` without overwriting edits.
5. An owner can generate and copy a unique share URL; visitors can read the
   latest saved note without editing controls.
6. Revoked links and deleted notes return `404 Not Found` to public visitors.
7. Deletion requires confirmation, and errors are clearly displayed.
8. Relevant automated checks cover these behaviors and record actual results.

## Limitations and Execution

In-memory storage and demo-user headers remain prototype-only; owner checks
do not establish real authentication. Production authentication, persistence,
rich text, attachments, and deployment are outside this input's scope.
Run in local-only mode and obtain requirements and plan approval before changes.

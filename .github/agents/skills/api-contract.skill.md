---
name: api-contract
description: Verify all API endpoints, response shapes, and error codes in code match docs/architecture.md
tools: [file]
---

1. **Extract contract** — Read `docs/architecture.md`. For every endpoint record: HTTP method, route, request body shape, response body shape, success status code, and all documented error codes and their response bodies.

2. **Compare controller** — Read `backend/src/notes/notes.controller.ts`. For each of the eight endpoints below, confirm the decorator method and route exactly match the doc:
   - `POST /api/v1/notes`
   - `GET /api/v1/notes`
   - `GET /api/v1/notes/:noteId`
   - `PATCH /api/v1/notes/:noteId`
   - `DELETE /api/v1/notes/:noteId`
   - `POST /api/v1/notes/:noteId/share`
   - `DELETE /api/v1/notes/:noteId/share/:token`
   - `GET /api/v1/shared/:token` (public, no auth guard)

3. **Error codes** — Read `backend/src/notes/notes.service.ts`. Verify that on optimistic-lock failure `NOTE_VERSION_CONFLICT` is thrown as an HTTP 409 with a response body containing exactly `{ code, message, currentVersion }`. Flag any missing field or wrong status code.

4. **Frontend alignment** — Read `frontend/src/App.tsx`. For every `fetch()` call: confirm the target route matches the doc, confirm 409 responses are caught and `currentVersion` is read from the response body to drive the conflict-resolution UI.

5. **Status codes** — Confirm `DELETE /api/v1/notes/:noteId` and `DELETE /api/v1/notes/:noteId/share/:token` return `204 No Content` with no body. Confirm `GET /api/v1/shared/:token` sets both a `Cache-Control` header and an `ETag` header on success.

6. **Output** — Produce a contract drift table covering all eight endpoints:

   | Endpoint | Doc Says | Code Does | Status |
   |---|---|---|---|
   | `POST /api/v1/notes` | | | ✅ / ⚠️ / ❌ |
   | `GET /api/v1/notes` | | | ✅ / ⚠️ / ❌ |
   | `GET /api/v1/notes/:noteId` | | | ✅ / ⚠️ / ❌ |
   | `PATCH /api/v1/notes/:noteId` | | | ✅ / ⚠️ / ❌ |
   | `DELETE /api/v1/notes/:noteId` | | | ✅ / ⚠️ / ❌ |
   | `POST /api/v1/notes/:noteId/share` | | | ✅ / ⚠️ / ❌ |
   | `DELETE /api/v1/notes/:noteId/share/:token` | | | ✅ / ⚠️ / ❌ |
   | `GET /api/v1/shared/:token` | | | ✅ / ⚠️ / ❌ |

   Fill each row with a one-line summary of what the doc specifies and what the code actually does. Use ✅ Match when both agree, ⚠️ Drift when there is a partial mismatch (wrong field name, missing header, etc.), and ❌ Missing when the endpoint or behaviour is absent from code or docs entirely. List any remediation steps below the table.

---
name: security-scan
description: Check auth bypass risks, CORS config, token entropy, payload limits, and dependency CVEs
tools: [shell, file]
---

1. **Auth bypass check** — Read `backend/src/notes/notes.controller.ts`. For every endpoint that is scoped to an owner (create, update, delete, share, getOwn), confirm the handler extracts the `x-user-id` request header and passes it directly to the corresponding service method. Flag any path that falls through to `DEFAULT_OWNER_ID` as a High-severity auth bypass risk.

2. **CORS risk** — Read `backend/src/main.ts`. Locate the `app.enableCors(...)` call. If the configuration contains both `origin: true` (or a wildcard) and `credentials: true` simultaneously, flag it as **High** severity — this combination reflects any origin and allows credentialed cross-site requests, violating the CORS spec and exposing session tokens.

3. **Share token entropy** — Read `backend/src/notes/notes.service.ts`. Find the share-link generation logic and confirm it uses `randomBytes(32).toString('base64url')` (or equivalent 256-bit entropy). Flag any use of `Math.random()`, UUIDs, or buffers smaller than 16 bytes as **High** severity (insufficient entropy).

4. **Payload limit enforcement** — Read `backend/src/notes/notes.service.ts` (and any DTO/pipe files it references). Confirm that `MAX_NOTE_BYTES = 30 * 1024 * 1024` is defined and checked before the note content is persisted to the database. Flag the absence of this check as **Medium** severity (denial-of-service via oversized payload).

5. **Secret exposure** — Run the following command and review every match, excluding known-safe tokens such as TypeScript type keywords (`secretKey` DTO fields with no value, `password` inside Joi validation schemas, etc.):
   ```
   grep -rn "password\|secret\|key\|apikey" backend/src frontend/src --include="*.ts" --include="*.tsx" -i
   ```
   Flag any hardcoded credential values (e.g., `SECRET=abc123`, `apiKey: "live_..."`) as **Critical**. Flag environment variable names logged or returned in responses as **High**.

6. **Dependency audit** — Run both audits and capture output:
   ```
   cd backend && npm audit --audit-level=high
   ```
   ```
   cd frontend && npm audit --audit-level=high
   ```
   Treat any `high` or `critical` CVE with a known fix as **High** severity. Treat unfixable `high` CVEs as **Medium** pending upstream resolution.

7. **Output** — Produce a markdown findings table summarising all results from steps 1-6:

   | Severity | Finding | File | Recommendation |
   |----------|---------|------|----------------|
   | (Critical / High / Medium / Low / Info) | Short description of the issue | Relative file path and line number if applicable | Concrete remediation step |

   If no issues are found for a step, add an `Info` row stating it passed. End the table with a **Summary** line: total findings by severity level.

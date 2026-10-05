# ShareNotes

ShareNotes is a note management and sharing application. The current repository contains a working vertical slice for creating, editing, deleting, and sharing notes through public read-only links.

The project is being built from the requirements and architecture documents in this repository. The current implementation is a development prototype and is not production-ready yet.

## Features Currently Implemented

- Create a note with a title and text content.
- List notes for the development user.
- Open and edit an existing note.
- Optimistic version checks for updates.
- Return `409 Conflict` when an older note version is submitted.
- Soft-delete notes.
- Generate an opaque public share token.
- Reuse an active share link, copy its URL, and keep the URL available if clipboard copying fails.
- Confirm and revoke a share link from the owner UI; a later share creates a fresh URL.
- View a shared note without editing controls.
- Invalidate a shared link when its note is deleted.
- Enforce an inclusive 31,457,280-byte UTF-8 limit on `JSON.stringify({ title, content })` after title trimming/defaulting; larger notes receive HTTP 413 and the backend is authoritative.
- Limit raw JSON request bodies to 32 MiB independently; larger request bodies receive HTTP 413 before note validation.
- Responsive frontend layout for desktop and mobile widths.

## Project Structure

```text
sharenotes/
|-- backend/                 NestJS API
|   |-- src/
|   |-- test/
|   `-- package.json
|-- frontend/                React + Vite application
|   |-- src/
|   `-- package.json
|-- docs/                     ShareNotes project documentation and SDLC inputs
|   `-- input/                 Jira-derived, Word, or Markdown requirement sources
|-- artifacts/                Run-specific outputs from the generic SDLC workflow
|-- .github/                  Copilot agents, instructions, skills, MCP workflow, and GitHub Actions
|-- .vscode/mcp.json          Workspace GitHub MCP server configuration
|-- scripts/                  Word-story extraction and application launch helpers
|   |-- start-sharenotes.ps1 Windows PowerShell launcher
|   `-- start-sharenotes.sh  Bash launcher
`-- README.md
```

## Run the Agentic SDLC

The repository includes reusable Copilot agents for an eight-phase, human-gated SDLC workflow. Explicitly start the `SDLC Orchestrator` in Copilot Chat and provide a Jira issue key, a `.docx`/`.md` path, or place exactly one supported input file in `docs/input/`. Jira retrieval requires an available Jira integration. Dropping a file in the folder does not automatically trigger the agent.

Generated requirements, architecture, design review, plan, code review, verification, and delivery draft files go to `artifacts/<safe-source-id>/`; existing run outputs are not overwritten without approval. Local-only mode is the default. Review [docs/input/README.md](docs/input/README.md) for intake rules and [.github/README.md](.github/README.md) for workflow and approval details.

## Prerequisites

- Node.js compatible with the installed project dependencies.
- npm.
- PowerShell on Windows, or Bash for the shell launcher.

No database or Docker installation is required for the current prototype because the backend uses in-memory storage.

## Install Dependencies

From the repository root:

```powershell
Push-Location backend
npm install
Pop-Location

Push-Location frontend
npm install
Pop-Location
```

On Bash:

```bash
(cd backend && npm install)
(cd frontend && npm install)
```

## Start the Application

### Windows PowerShell

From the repository root:

```powershell
.\start-sharenotes.ps1
```

The script opens the backend and frontend using their local project binaries.

### Bash

From the repository root:

```bash
bash ./start-sharenotes.sh
```

Press `Ctrl+C` to stop both services.

### Start Services Manually

Backend:

```powershell
Push-Location backend
.\node_modules\.bin\nest.cmd start --watch --host 0.0.0.0 --port 3000
```

Frontend, in a second terminal:

```powershell
Push-Location frontend
.\node_modules\.bin\vite.cmd --host 0.0.0.0 --port 5173
```

## Local URLs

- Frontend: http://localhost:5173/
- API notes endpoint: http://localhost:3000/api/v1/notes
- API base path: http://localhost:3000/api/v1

The frontend currently uses the development identity `demo-user` through the `x-user-id` request header.

## Current API Surface

All API routes use the `/api/v1` prefix.

| Method   | Endpoint                      | Purpose                                            |
| -------- | ----------------------------- | -------------------------------------------------- |
| `POST`   | `/notes`                      | Create a note                                      |
| `GET`    | `/notes`                      | List active notes for the current development user |
| `GET`    | `/notes/:noteId`              | Retrieve an owned note                             |
| `PATCH`  | `/notes/:noteId`              | Update an owned note using its current `version`   |
| `DELETE` | `/notes/:noteId`              | Soft-delete an owned note                          |
| `POST`   | `/notes/:noteId/share`        | Create or reuse an active share link               |
| `DELETE` | `/notes/:noteId/share/:token` | Revoke a share link                                |
| `GET`    | `/shared/:token`              | Read a shared note without authentication          |

Example create request:

```powershell
$body = @{ title = 'First note'; content = 'A note from ShareNotes.' } | ConvertTo-Json
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/notes `
  -Headers @{ 'x-user-id' = 'demo-user' } `
  -ContentType 'application/json' `
  -Body $body
```

Example update request:

```powershell
$body = @{
  title = 'Updated note'
  content = 'Updated content.'
  version = 1
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri http://localhost:3000/api/v1/notes/<note-id> `
  -Headers @{ 'x-user-id' = 'demo-user' } `
  -ContentType 'application/json' `
  -Body $body
```

## Validation Commands

Backend:

```powershell
Push-Location backend
npm run lint
npm run build
npm test
npm run test:e2e
```

Frontend:

```powershell
Push-Location frontend
npm test
npm run build
npm run lint
```

The frontend tests use Vitest with jsdom and React Testing Library.

## Persistence Status

The current backend does **not** use PostgreSQL or another persistent database.

Notes and share links are stored in JavaScript `Map` instances inside the running NestJS process. As a result:

- Data exists only while the backend process is running.
- Restarting the backend clears notes and share links.
- Starting the application again does not restore previous notes.
- The launcher scripts do not start PostgreSQL, MinIO, or Redis.

The next persistence phase is planned to add PostgreSQL, migrations, object storage, Redis, and a database-backed notes service. See [impl-plan.md](artifacts/sharenotes/impl-plan.md) for the dependency-ordered implementation plan.

## Current Limitations

### Authentication and Authorization

- There is no real registration, login, identity provider, session, refresh-token, or CSRF implementation.
- The development identity is supplied through `x-user-id: demo-user`.
- A caller who can choose that header can impersonate the demo user.
- Owner-facing share revocation prevents future reads of that URL but cannot recall copied URLs or content already viewed.
- Production authentication and authorization must be implemented before deployment.

### Storage and Attachments

- Notes are stored in memory rather than PostgreSQL.
- Attachments are not implemented yet.
- The inclusive 31,457,280-byte note limit covers UTF-8 bytes of normalized `JSON.stringify({ title, content })`; blank create titles become `Untitled note`, blank update titles retain the current title, and attachments are not counted.
- The separate 32 MiB limit applies to raw JSON HTTP request bodies; requests above it receive HTTP 413.
- MinIO or cloud object storage is not configured.
- Signed upload and download URLs are not implemented.
- Attachment cleanup jobs, retries, and retention jobs are not implemented.

### Rich Text and Security

- The editor is currently a text area, not a Tiptap or Lexical rich-text editor.
- Backend and frontend rich-text sanitization is not implemented.
- There is no configured content security policy, rate limiting, or audit log. The configured npm audit job is non-blocking and is not a security gate.
- The public share token is generated securely for the prototype, but token hashes are not persisted because there is no database yet.

### Operations

- There is no Docker Compose environment yet.
- There are no database migrations, backups, restore procedures, or production deployment configuration.
- The launcher scripts start application processes only.
- Observability, distributed tracing, dashboards, and alerting are not configured.
- The frontend API URL is currently hard-coded to `http://localhost:3000/api/v1`.

### Product Scope

- Real-time collaborative editing is out of scope for v1.
- Note attachments, multiple users, search, note folders, and link expiration are not currently available.
- Public shared links are read-only, but full production access controls remain to be implemented.

## Recommended Next Steps

1. Add Docker Compose for PostgreSQL, MinIO, and Redis.
2. Add environment-based configuration and database migrations.
3. Replace the in-memory maps with PostgreSQL repositories.
4. Implement real authentication, sessions, CSRF protection, and rate limits.
5. Integrate Tiptap or Lexical with backend and frontend sanitization.
6. Add attachment validation, private object storage, signed URLs, and cleanup jobs.
7. Add OpenAPI documentation and integration tests for persistence and security.
8. Add CI/CD, observability, backups, deployment, and rollback runbooks.

## Design Documents

- [Requirements](artifacts/sharenotes/requirements.md)
- [Architecture](artifacts/sharenotes/architecture.md)
- [Design Review](artifacts/sharenotes/design-review.md)
- [Final Review Checklist](artifacts/sharenotes/final-review-checklist.md)
- [Implementation Plan](artifacts/sharenotes/impl-plan.md)
- [Code Review](artifacts/sharenotes/review.md)
- [Verification](artifacts/sharenotes/verification.md)
- [PR Draft](artifacts/sharenotes/pr-description.md)

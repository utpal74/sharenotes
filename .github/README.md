# Repository Delivery Assets

This folder contains the shared delivery workflow for steps 6 through 8 of the ShareNotes capstone statement.

- `agents/` contains focused review, verification, and release agents.
- `hooks/git/` contains optional local pre-commit and post-commit hooks.
- `workflows/quality.yml` runs the available backend and frontend quality checks on pull requests and pushes to `main`.
- `pull_request_template.md` captures review evidence and known limitations.
- `copilot-instructions.md` keeps agent work aligned with the prototype's documented contracts.

The repository is not yet production-ready. The remaining implementation plan still includes authentication, database/object storage, attachments, OpenAPI, integration security tests, observability, deployment, backups, and rollback evidence.

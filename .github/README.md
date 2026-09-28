# Repository Delivery Assets

This folder contains the shared agentic SDLC workflow for all eight steps of the ShareNotes capstone.

- `agents/` contains eight phase specialists and the `SDLC Orchestrator`.
- Start the pipeline by opening this repository in VS Code, selecting `SDLC Orchestrator`, and providing a `.docx` path or placing exactly one Word file in `docs/input/`.
- Say `local-only` to keep all outputs in the working tree, skip all commits and remote actions, and create a PR draft at `docs/pr-description.md`. Standard mode can create a local requirements commit after approval and only pushes/opens the PR after final confirmation.
- The orchestrator reads `.github/config/default.yml`, extracts the Word story, loads the phase skills listed there, delegates in order, and enforces artifact and human-approval gates.
- The phase agents read the prior approved documents directly. Their artifact chain is `docs/requirements.md`, `docs/architecture.md`, `docs/design-review.md`, `docs/impl-plan.md`, implementation, `docs/review.md`, `docs/verification.md`, then the changelog and pull request.
- `skills/<name>/SKILL.md` contains the eight supported, on-demand workflow skills.
- `instructions/` contains workspace instructions; `.github/copilot-instructions.md` is the always-on project instruction file.
- `scripts/extract-word-requirements.ps1` extracts text from `.docx` without adding a package dependency.
- `hooks/` contains optional local Git hooks. Enable them with `git config core.hooksPath .github/hooks`; they are not pushed or automatically enabled.
- `workflows/` contains GitHub Actions only. They run on GitHub after a pull request or push to `main`; steps 5-7 run local checks before that.
- `pull_request_template.md` captures review evidence and known limitations.
- `copilot-instructions.md` keeps agent work aligned with the prototype's documented contracts.

The repository is not yet production-ready. The remaining implementation plan still includes authentication, database/object storage, attachments, OpenAPI, integration security tests, observability, deployment, backups, and rollback evidence.

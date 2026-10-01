# Copilot SDLC Workflow

This folder contains a reusable, repository-aware eight-phase SDLC workflow. The agents and core skills are not tied to a particular product stack: they inspect the active repository and use its own guidance, architecture, scripts, tests, and CI.

## Start a run

Explicitly invoke `SDLC Orchestrator` in Copilot Chat. Give it one Jira issue key, a `.docx`/`.md` requirement path, or place exactly one supported input file in `docs/input/` and ask it to use that file. Adding a file does not automatically trigger Copilot. Jira intake requires an available Jira MCP/integration; otherwise provide the issue text in a Markdown or Word file.

The orchestrator creates a safe per-source directory at `artifacts/<source-id>/` and writes all generated workflow documents there. It does not overwrite an existing run directory without asking. See `docs/input/README.md` and `artifacts/README.md` for intake and output details.

## Human approval and delivery

- The pipeline pauses for requirement clarification and approval, material architecture/design decisions, and implementation-plan approval.
- Local-only is the default: it does not stage, commit, push, or create remote pull requests.
- Standard delivery requires separate human approval of the staged diff and remote action. The PR author never commits paths matched by `.gitignore` (even if already tracked) or `.gitignore` files themselves, and checks staged content for secrets.
- Repository-specific instructions belong in applicable `.github/instructions/*.instructions.md` files. The reusable root `.github/copilot-instructions.md` avoids assuming the target project's stack.
- Skills in `skills/<name>/SKILL.md` discover the repository's own commands and tooling rather than prescribing a framework.

## Contents

- `agents/`: the orchestrator and eight phase agents.
- `config/default.yml`: accepted sources, artifact paths, phases, and delivery policy.
- `instructions/`: reusable delivery guidance and this repository's scoped application constraints.
- `skills/`: reusable API-contract, build, changelog, docs-sync, lint, PR-prep, security, and test workflows.
- `workflows/`: GitHub Actions for this ShareNotes repository's own CI. These workflows are repository-specific and are not required by the reusable SDLC agents.
- `hooks/`: optional local Git hooks; enable only when appropriate for this repository.
- `.vscode/mcp.json`: workspace GitHub MCP configuration for VS Code. It uses a masked input for credentials and requires Docker.

The agents do not watch folders or run automatically. A human must invoke the orchestrator; remote Jira/GitHub actions additionally require the corresponding integration and explicit approval.

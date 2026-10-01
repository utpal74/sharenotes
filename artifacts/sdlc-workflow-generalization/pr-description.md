## Summary

Generalize the Copilot SDLC workflow so the orchestrator, phase agents, and skills work in any repository rather than assuming the ShareNotes stack. Runs now accept a Jira issue key or a `.docx`/`.md` requirement, write per-run outputs to `artifacts/<source-id>/`, and keep a human approval gate before every commit, push, or remote PR. This PR also tidies Copilot configuration and moves existing generated artifacts out of `docs/`.

## Changes Made

- `.github/agents/sdlc-orchestrator.agent.md`: accept Jira/`.docx`/`.md` sources, derive a safe run ID, route outputs to `artifacts/<run-id>/`, default to local-only, and detect the actual default branch and host.
- `.github/agents/requirements-analyst.agent.md`, `solution-architect.agent.md`, `architecture-reviewer.agent.md`, `delivery-planner.agent.md`, `implementation-engineer.agent.md`, `code-reviewer.agent.md`, `quality-verifier.agent.md`: read and write artifact paths supplied by the orchestrator; remove ShareNotes stack and limitation assumptions.
- `.github/agents/pull-request-author.agent.md`: stage all changes except paths matched by `.gitignore` (including already-tracked ignored files) and `.gitignore` files themselves, verify with `git check-ignore`, reuse the current non-default branch instead of creating new branches, update an existing open PR by pushing rather than opening a duplicate, use Git CLI for commit/push, prefer a host-matching MCP PR tool over a CLI, and never assume `main`.
- `.github/config/default.yml`: describe intake types, the artifact layout, collision handling, local-only default, staging policy, and PR-creation order.
- `.github/skills/*/SKILL.md` (api-contract, build, changelog, docs-sync, lint, pr-prep, security-scan, test): discover the repository's commands, tooling, and contracts instead of using fixed `backend/`/`frontend/` npm commands.
- `.github/copilot-instructions.md`: replace ShareNotes-specific rules with reusable workflow rules.
- `.github/instructions/sharenotes-project.instructions.md`: new; keep ShareNotes constraints and validation commands scoped to `backend/` and `frontend/`.
- `.github/instructions/copilot-instructions.md`: removed; it duplicated the root instruction file.
- `.github/README.md`, `README.md`, `docs/input/README.md`, `artifacts/README.md`: document intake, the artifact layout, approval gates, and that agents never trigger automatically.
- `docs/*.md` -> `artifacts/sharenotes/*.md`: move requirements, architecture, design review, implementation plan, review, verification, and final review checklist; add the earlier PR draft as `artifacts/sharenotes/pr-description.md`. Update moved-path references.
- `CHANGELOG.md`: record this delivery under Unreleased.
- `artifacts/sdlc-workflow-generalization/pr-description.md`: this PR body.

Excluded because `.gitignore` lists `.vscode/`: local changes to `.vscode/mcp.json` (removes the account name from the token prompt) and `.vscode/settings.json` (chat terminal auto-approve for `git add`/`git commit`). Both files are already tracked, so the repository keeps their previous versions.

## Test Evidence

Run locally on October 1, 2026 from the working tree for this PR. GitHub Actions have not run yet; they run after push.

| Check                                                      | Result                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Backend lint (`npm run lint`)                              | Passed, exit 0                                                                    |
| Backend build (`npm run build`)                            | Passed, exit 0                                                                    |
| Backend unit tests (`npm test`)                            | `1 passed, 0 failed, 1 total` (1 test file)                                       |
| Backend E2E tests (`npm run test:e2e`)                     | `1 passed, 0 failed, 1 total` (1 test file)                                       |
| Frontend lint (`npm run lint`)                             | Passed, exit 0; 1 existing warning: `src/App.tsx:42` `react(set-state-in-effect)` |
| Frontend build (`npm run build`)                           | Passed, exit 0                                                                    |
| Prettier check on changed agents, skills, config, and docs | Passed                                                                            |
| Local Markdown link check (37 files)                       | Passed; no missing targets                                                        |
| Manifest skill paths exist (8 unique)                      | Passed                                                                            |
| `git diff --check`                                         | Passed                                                                            |

Backend tests also printed the existing `vite-tsconfig-paths` deprecation notice. Running the builds rewrote tracked generated files (`backend/dist/*`, `backend/tsconfig.build.tsbuildinfo`, and a vitest cache file); those side effects were restored and are not part of this PR.

Not run: an end-to-end SDLC Orchestrator run on a sample Jira, `.docx`, or `.md` input. The agent changes are prompt instructions and were checked by review, not by execution.

## Security and Data Considerations

- Authorization impact: none. No application source changed.
- Public sharing impact: none.
- Data migration or rollback impact: none. Artifact moves are tracked renames.
- No `.vscode/` changes are included. The committed `.vscode/mcp.json` still contains the earlier token prompt text naming a GitHub account (no token value). The committed `.vscode/settings.json` already contains a Jira instance URL and a personal email.
- `.gitignore` lists `.vscode/` and `**/node_modules/`, but `.vscode/mcp.json`, `.vscode/settings.json`, and about 10,140 files under `backend/node_modules/` are already tracked. This PR does not change that; removing them from the index is a separate decision.

## Known Limitations

- Dropping a file in `docs/input/` does not trigger the orchestrator; a person must invoke it.
- Jira intake needs a Jira MCP or integration in the session. Otherwise the user must supply the ticket text as a `.md` or `.docx` file.
- `.vscode/mcp.json` configures only the GitHub MCP server, and it requires Docker.
- `.github/workflows/*.yml` and `.github/pull_request_template.md` remain ShareNotes-specific; the reusable agents do not depend on them.
- Artifacts in `artifacts/sharenotes/` are historical and were moved, not regenerated. `requirements.md` is still marked pending reconciliation with a source Word document.
- ShareNotes remains a prototype with in-memory storage and demo-user headers; production-readiness gaps are tracked in `artifacts/sharenotes/impl-plan.md`.

## Changelog

- Make the SDLC workflow repository-agnostic with Jira/`.docx`/`.md` intake and per-run `artifacts/<source-id>/` outputs; move existing artifacts out of `docs/`; tidy Copilot instructions and MCP configuration.

## Reviewer Checklist

- [ ] Requirements and architecture contracts were checked.
- [ ] Owner authorization and public read behavior are tested.
- [ ] Error and conflict behavior is covered.
- [ ] Security and dependency implications were reviewed.
- [ ] Documentation and known limitations are accurate.
- [ ] Test evidence is reproducible.

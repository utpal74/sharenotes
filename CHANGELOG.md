# Changelog

## [Unreleased]

### Added
- Add an eight-phase ShareNotes SDLC pipeline with named Copilot agents, a Word-story intake helper, a phase-to-skill manifest, and local-only execution.
- Add discoverable workflow skills, workspace instructions, optional local Git hooks, and a PR description draft workflow.

- Accept Jira issue keys, `.docx`, and `.md` requirement sources, and write each run's workflow outputs to `artifacts/<source-id>/`.
- Add scoped ShareNotes application instructions separate from the reusable workflow instructions.

### Changed
- Make the SDLC orchestrator, phase agents, and skills repository-agnostic: they discover the target project's stack, commands, and CI instead of assuming ShareNotes.
- Default the orchestrator to local-only mode; standard delivery stages all changes except paths matched by `.gitignore` (including already-tracked ignored files) and prefers a host-matching MCP PR integration over a CLI.
- Move generated SDLC artifacts from `docs/` to `artifacts/sharenotes/` and update architecture, review, and README references.
- Reuse the GitHub Actions quality workflow from the SDLC workflow and verify backend and frontend script references.

### Removed
- Remove the duplicate `.github/instructions/copilot-instructions.md`.
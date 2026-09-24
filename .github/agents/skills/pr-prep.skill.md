---
name: PR Prep
description: "Generate a filled-in pull request description by running all validation commands and collecting results into the standard PR template."
tools: [read, search, execute]
user-invocable: true
---
Collect the information needed to fill in `.github/agents/instructions/pull_request_template.md`.

1. Run lint, build, unit tests, and E2E tests for backend and frontend. Record each command and its exit code.
2. Read the current git diff (staged + unstaged) and recent commit messages to derive a summary of changes.
3. Check `docs/architecture.md` and `docs/impl-plan.md` for any contract sections relevant to the changed files.
4. Identify security or authorization implications in the diff.

Output a completed PR description using the template structure:
- Summary: one paragraph describing the problem solved.
- Changes Made: bullet list from the diff.
- Test Evidence: table with the six commands and their results.
- Security and Data Considerations: filled from diff analysis.
- Known Limitations: prototype constraints that still apply.
- Changelog: one entry per logical change.
- Reviewer Checklist: leave all boxes unchecked for the human reviewer.

Do not commit, push, or open a PR unless explicitly requested.

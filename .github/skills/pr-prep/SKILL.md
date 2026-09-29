---
name: pr-prep
description: "Prepare a ShareNotes pull request from the current diff, review, and verification evidence, including the required description and checklist. Use in SDLC step 8."
user-invocable: false
---
# Pull Request Preparation

1. Read `docs/requirements.md`, `docs/architecture.md`, `docs/impl-plan.md`, `docs/review.md`, `docs/verification.md`, `.github/pull_request_template.md`, and the current diff.
2. Fill the required sections: a 2-3 sentence **Summary**; **Changes Made** listing each changed file and reason; **Test Evidence** with exact output or CI links; **Known Limitations** including Not Found and out-of-scope items; and an unchecked **Reviewer Checklist**.
3. Include the template's security/data considerations and changelog entry. Clearly identify checks not run and why.
4. Present the final title, body, changelog, and diff for human approval. Do not stage, commit, push, or create a PR without explicit confirmation.
5. Always open a brand-new pull request; never search for, reuse, or update an existing open PR. After the local commit is approved, push from a freshly created, uniquely named branch (e.g. `<feature-branch>-pr-<UTC-timestamp>`) so `gh pr create` (or the GitHub MCP create-pull-request action) always succeeds in creating a new PR.
---
name: pr-prep
description: "Prepare a repository-appropriate delivery summary or pull request from verified changes and evidence."
user-invocable: false
---

# Pull Request Preparation

1. Read the requirements, architecture, plan, review, and verification artifacts from the paths supplied by the orchestrator, any applicable repository PR template, and the current diff.
2. Follow the target repository's established delivery format. Include summary, changed files/reasons, exact verification evidence, known limitations, and an unchecked reviewer checklist when appropriate. Clearly identify checks not run and why.
3. Include security/data considerations when relevant. Update a changelog only if the repository maintains one or the user requests one. Write the draft to the artifact path supplied by the orchestrator.
4. In standard mode, inspect all worktree changes and stage every change, including pre-existing changes, except paths matched by the repository's ignore rules and any `.gitignore` file itself. Ignore rules apply to already-tracked files too; never use `git add -f`. After staging, run `git diff --cached --name-only | git check-ignore --no-index --stdin` and unstage every reported path. List excluded paths in the proposal. Stage reviewed paths explicitly, never with a blanket `git add -A`. Check for secrets or unsafe-to-publish content and stop to ask if found. Present the exact staged diff, commit message, delivery summary, and remote action for human approval before committing. Local-only mode must not stage, commit, push, or create a remote resource.
5. After approval, use Git CLI for commit and push operations. Detect the actual default branch and host instead of assuming `main` or GitHub. If already on a non-default branch, commit and push to that branch; do not create a new branch. Only on the default branch, propose one feature branch and wait for approval. Push without force-pushing. If an open PR from the branch already exists, the push updates it; report that PR instead of opening a duplicate. Otherwise prefer an available host-matching MCP PR-creation tool, then the authenticated CLI for that host. If neither route is available, report the blocker and the host's new-PR URL without claiming remote delivery. Never ask for credentials in chat.

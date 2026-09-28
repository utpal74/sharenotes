---
name: docs-sync
description: "Check documentation against code for broken local paths, stale feature claims, command drift, conflicting contracts, and inaccurate prototype limitations. Use during review and verification."
user-invocable: false
---
# Documentation Synchronization

1. Check local links and file paths in `docs/`, `README.md`, and `.github/` customizations.
2. Compare feature and production-readiness claims with `backend/` and `frontend/` implementation. Identify planned or absent infrastructure as such.
3. Compare commands in `.github/pull_request_template.md` with both `backend/package.json` and `frontend/package.json`.
4. Verify references to instructions and skills use the supported `.github/instructions/` and `.github/skills/<name>/SKILL.md` locations.
5. Check `docs/final-review-checklist.md` and `docs/verification.md` for stale or contradictory statements.
6. Report findings under **In sync**, **Stale**, and **Missing**. Do not edit unrelated documents to silence a finding.
---
name: changelog
description: "Create a Keep a Changelog entry for the current delivery from the actual diff and verified test evidence. Use for step 8 PR preparation."
user-invocable: false
---
# Changelog Entry

1. Read the current diff and the completed `docs/review.md` and `docs/verification.md`. Use commit history only as supporting context; do not claim changes that are not in the current delivery.
2. Prepare a concise `## [Unreleased]` entry with applicable `### Added`, `### Changed`, `### Fixed`, or `### Security` headings.
3. Include the current prototype limitations only when relevant and verified. Do not copy stale limitations blindly.
4. In the SDLC workflow, update or create root `CHANGELOG.md` after the human approves the final delivery. In standalone use, present the proposed entry and ask before writing.
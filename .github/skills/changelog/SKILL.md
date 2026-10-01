---
name: changelog
description: "Create a Keep a Changelog entry for the current delivery from the actual diff and verified test evidence. Use for step 8 PR preparation."
user-invocable: false
---

# Changelog Entry

1. Read the current diff and completed review and verification artifacts at the paths supplied by the orchestrator. Use commit history only as supporting context; do not claim changes that are not in the current delivery.
2. Prepare a concise `## [Unreleased]` entry with applicable `### Added`, `### Changed`, `### Fixed`, or `### Security` headings.
3. Include the current prototype limitations only when relevant and verified. Do not copy stale limitations blindly.
4. Update an existing project changelog after human approval. If none exists, create one only when the user or approved plan requests it. In standalone use, present the proposed entry and ask before writing.

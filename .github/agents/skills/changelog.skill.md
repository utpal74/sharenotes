---
name: changelog
description: Draft a CHANGELOG.md entry from git history, categorized by type, with prototype limitations noted
tools: [shell, file]
---

1. **Collect commits** — run: `git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD`. If the output is empty, fall back to: `git log --oneline -30`.

2. **Categorize commits** — group the resulting messages into these buckets:
   - **Features** — new behavior, endpoints, UI components, or capabilities.
   - **Bug Fixes** — corrections to existing behavior.
   - **Tests** — new or updated tests only.
   - **Docs** — documentation changes only.
   - **Chores** — build, CI, config, or dependency updates.

   Skip merge commits and any message whose entire content is `WIP`, `fixup`, or a bare `chore: add`.

3. **Draft entry** — format the result as a `## [Unreleased]` section following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), with sub-sections `### Added`, `### Fixed`, and `### Changed` (omit a sub-section if it has no entries). Each line item should be a concise, human-readable sentence derived from the commit message.

4. **Prototype note** — append the following blockquote directly after the entry:

   > **Prototype limitations:** In-memory storage only (data cleared on restart), demo authentication via x-user-id header, no Docker Compose or migrations.

5. **Output** — print the full CHANGELOG entry to the chat, then ask the user: "Would you like me to append this entry to CHANGELOG.md?"  Do not write to the file unless the user confirms.

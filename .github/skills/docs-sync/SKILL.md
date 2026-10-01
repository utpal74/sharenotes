---
name: docs-sync
description: "Check documentation against code for broken local paths, stale feature claims, command drift, conflicting contracts, and inaccurate prototype limitations. Use during review and verification."
user-invocable: false
---

# Documentation Synchronization

1. Find the target repository's documentation, configuration, and workflow artifacts. Check their relative links, local paths, and generated claims against current files.
2. Compare product, implementation, and readiness statements with the actual source and available evidence. Identify planned or absent capabilities explicitly.
3. Compare documented commands with the repository's current manifests, scripts, and CI configuration; flag commands that do not exist.
4. Verify references to Copilot instructions, agents, and skills use paths and filenames that exist in the target repository.
5. Check workflow artifacts and checklists for stale or contradictory statements, including any phase outputs supplied by the orchestrator.
6. Report findings under **In sync**, **Stale**, and **Missing**. Do not edit unrelated documents to silence a finding.

---
name: lint
description: "Discover and run available linters for the changed target-repository components."
user-invocable: false
---

# Lint Verification

1. Inspect repository instructions, manifests, scripts, and CI to find configured lint/static-analysis commands and working directories.
2. Run the narrowest applicable lint checks first. Do not add tooling or dependencies as part of verification without approval.
3. Record each exact command, working directory, exit status, and violations with affected file/rule when available. Report when no linter is configured or a check cannot run.
4. Do not weaken lint rules to make a command pass; distinguish warnings from failures based on actual command status.

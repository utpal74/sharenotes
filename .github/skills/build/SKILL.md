---
name: build
description: "Discover and run the target repository's relevant build checks, reporting exact results."
user-invocable: false
---

# Build Verification

1. Inspect repository guidance, manifests, scripts, and CI to identify build commands and their working directories. Do not assume a language, framework, package manager, or fixed directory layout.
2. Run builds relevant to the changed components, starting with the narrowest available check. Avoid installation or dependency changes unless the user approves them or a documented project workflow requires them.
3. Record each exact command, working directory, exit status, and actionable compiler/bundler output. State checks that do not exist or could not run and why.
4. Do not alter compiler settings, scripts, or production code just to suppress a build failure. Do not claim a build passed unless it was run successfully.

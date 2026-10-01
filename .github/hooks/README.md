# Local Git Hooks

These hooks run in this clone only. Enable them once from the repository root:

```powershell
git config core.hooksPath .github/hooks
```

The pre-commit hook runs backend and frontend lint/build checks before each local commit. Node.js and both projects' dependencies must already be installed. The post-commit hook prints the recorded commit subject. GitHub Actions do not depend on these hooks.

To disable the local hook override:

```powershell
git config --unset core.hooksPath
```

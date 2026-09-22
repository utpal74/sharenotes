# Git Hooks

These hooks provide local quality gates for step 7 verification.

Enable them for this checkout with:

```sh
git config core.hooksPath .github/hooks/git
```

The pre-commit hook runs backend and frontend lint/build checks. The post-commit hook prints the recorded commit subject. The hooks do not modify files, require secrets, or replace CI.

On Windows, run the setup command from Git Bash or use an equivalent shell that can execute the hook files.

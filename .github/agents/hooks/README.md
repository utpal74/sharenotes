# Agent Hooks

Git hooks for agent-driven workflows. Enable with:

```sh
git config core.hooksPath .github/agents/hooks
```

The pre-commit hook runs backend and frontend lint/build checks before each commit. The post-commit hook prints the recorded commit subject.

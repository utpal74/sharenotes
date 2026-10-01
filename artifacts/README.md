# Generated SDLC Artifacts

The SDLC Orchestrator writes each run's requirements, architecture, design review, implementation plan, review, verification, and delivery draft under `artifacts/<safe-source-id>/`.

Run the orchestrator explicitly with one Jira issue key, one `.docx`/`.md` path, or exactly one supported file in `docs/input/`. A file appearing in `docs/input/` does not automatically start Copilot. Jira intake requires an available Jira integration; otherwise provide the issue text as a supported file.

Generated artifacts are local working files unless you explicitly approve their inclusion in a commit. Existing run directories are never overwritten without your direction.

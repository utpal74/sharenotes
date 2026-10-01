# SDLC Requirement Intake

This folder is an optional intake location for the repository-aware SDLC Orchestrator. It accepts one `.docx` or `.md` requirement file per run. Place the file itself here; do not create a nested folder around it. Alternatively, provide a supported file path or a Jira issue key when you invoke the orchestrator.

## Supported sources

- **Markdown (`.md`)**: read directly as UTF-8.
- **Word (`.docx`)**: extract text with `scripts/extract-word-requirements.ps1` when the script is available; otherwise the orchestrator uses an available document reader or reports that it cannot read the file.
- **Jira issue key**: retrieve the issue through an available Jira MCP/integration. If no Jira integration is available, provide the ticket text or save the requirement as a supported file. The agent must not invent or guess issue content.

When discovering files in this folder, exactly one `.docx` or `.md` source must be present. If there are zero or multiple candidates, the orchestrator asks which source to use and stops. Input files are preserved and are not modified.

## Run the workflow

1. Open the repository in VS Code and explicitly start the `SDLC Orchestrator` agent; dropping a file in this folder does not automatically trigger Copilot.
2. Provide a Jira issue key, a `.docx`/`.md` path, or ask the agent to use the single file in `docs/input/`.
3. The agent creates a safe source identifier and writes workflow artifacts under `artifacts/<source-id>/`.
4. Answer clarification and approval questions at each phase gate. The default mode is local-only; ask for standard mode and separately approve any commit, push, or remote pull request.

If an artifact directory for the same source already exists, the orchestrator must ask whether to resume it or use a unique suffix; it must not silently overwrite prior results.

# Repository-Agnostic SDLC Instructions

## Scope

These instructions govern the reusable Copilot SDLC workflow. Treat the checked-out repository as the target project and inspect its own instructions, manifests, source, tests, and CI before making project-specific recommendations or changes.

## Workflow Rules

- Accept only the configured input types and require an explicit, readable source. Never invent ticket content or infer requirements from a filename.
- Keep workflow artifacts under the run-specific directory supplied by the orchestrator. Do not overwrite artifacts from another run or modify the original input.
- Ask for clarification when requirements are ambiguous or material decisions remain. Human approval is required at the phase gates defined by the orchestrator.
- Follow target-project conventions and instructions. Do not assume a language, framework, package manager, test command, API style, deployment target, or release process.
- Keep implementation within the approved plan, add relevant tests, and report commands and results accurately. Do not weaken tests or hide failures.
- Preserve existing behavior unless the approved requirements intentionally change it. Identify security, data-loss, authorization, and compatibility risks.
- Never add secrets, credentials, local environment files, generated output, or unsafe content to a commit. Do not stage `.gitignore` files or any path matched by the repository's ignore rules, even if it is already tracked.
- Do not commit, push, or create remote resources without explicit human approval.
- Preserve the file's existing encoding and formatting; otherwise prefer ASCII for new source and documentation.

## Artifact and Review Rules

- Use the artifact paths passed by the orchestrator rather than assuming files live under `docs/`.
- Clearly separate facts observed in the repository, proposed target behavior, assumptions, decisions, and unresolved questions.
- Report unsupported tooling and checks not run; never present plans or drafts as completed implementation or verification.
- Review the full relevant diff and directly related documentation before declaring a phase complete.

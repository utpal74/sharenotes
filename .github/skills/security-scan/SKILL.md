---
name: security-scan
description: "Review security-sensitive changes and use security tooling already configured for the target repository."
user-invocable: false
---

# Security Review

1. Identify applicable trust boundaries, identities, data sensitivity, authorization, input validation, external integrations, and threat assumptions from approved requirements and repository context.
2. Inspect the relevant implementation and tests for concrete security defects. Search for likely hard-coded credentials and inspect matches in context; distinguish identifiers from secret values and never reproduce secrets.
3. Find security scanners and dependency audit commands already configured by the repository. Run relevant checks when available and practical; do not assume npm, a particular cloud, or network access.
4. Report findings by severity, file, evidence, user impact, and remediation. Record unavailable checks explicitly. Do not claim a vulnerability based only on a planned property or unsupported assumption.

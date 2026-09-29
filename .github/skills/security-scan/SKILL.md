---
name: security-scan
description: "Review authorization, CORS, share-token generation, payload limits, secret exposure, and npm audit findings. Use during implementation review and verification."
user-invocable: false
---
# Security Review

1. Read the relevant controllers, services, DTOs, and `backend/src/main.ts`. Verify owner authorization, public read-only access, CORS policy, token generation, and server-side payload validation against actual code and documented requirements.
2. Search source for likely hard-coded credentials. Inspect matches in context; distinguish identifiers/schema fields from actual secret values and never reproduce secrets in the report.
3. Run `npm audit --audit-level=high` in both `backend/` and `frontend/` when dependencies are installed and network access is available. Record unavailable checks explicitly.
4. Report findings by severity, file, evidence, user impact, and remediation. Do not assert a vulnerability based solely on a planned architecture property or an assumed constant.
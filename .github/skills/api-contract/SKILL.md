---
name: api-contract
description: "Compare API routes, request/response contracts, error handling, authorization, and frontend calls against docs/architecture.md. Use during architecture, implementation review, or verification."
user-invocable: false
---
# API Contract Check

1. Read `docs/architecture.md` and extract each documented endpoint, method, request, response, status code, and security rule.
2. Compare those contracts with `backend/src/notes/notes.controller.ts`, `backend/src/notes/notes.service.ts`, and the relevant frontend API calls.
3. Verify owner-only mutation behavior, public read-only sharing, `404` behavior for deleted/revoked shares, and `409` version conflicts against both docs and code. Do not assume a behavior exists just because it is in the architecture.
4. Check tests for the changed contracts. Distinguish missing implementation, missing coverage, and intentional prototype limitations.
5. Return a drift table with endpoint, documented behavior, implemented behavior, test evidence, and status, followed by concrete remediation items.
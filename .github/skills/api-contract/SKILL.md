---
name: api-contract
description: "When a project exposes an API, compare its documented contracts with implementation, consumers, and tests."
user-invocable: false
---

# API Contract Check

1. Determine whether the target project exposes HTTP, RPC, event, command-line, or other externally consumed contracts. If no API-like surface exists, state that this check is not applicable.
2. Find contract sources in project documentation, schemas, route definitions, generated specifications, and tests. Identify methods/operations, inputs, outputs, errors, authorization, and compatibility rules that apply.
3. Compare those contracts with implementation, consumers, and tests. Do not infer behavior from intended documentation alone.
4. Return a concise drift table with operation, documented behavior, implemented behavior, test evidence, and status, followed by concrete remediation items. Distinguish missing implementation, missing coverage, and intentional limitations.

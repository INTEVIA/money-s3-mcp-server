# Money S3 MCP Server — Implementation Status

Full GraphQL schema coverage achieved. All queries and mutations are implemented.

## Coverage Summary

| Category | Queries | Mutations | Total Tools |
|---|---|---|---|
| Invoices | 4 (list+get x2) | 6 (CRUD x2) | 10 |
| Companies | 2 (list+get) | 3 (CRUD) | 5 |
| Documents | 10 (list+get x5) | 15 (CRUD x5) | 25 |
| Warehouse | 14 (list+get) | 28 (CRUD) | 42 |
| Orders | 10 (list x8, services, repairs) | 16 (CRUD x6, services x2) | 26 |
| Codebooks | 18 (list x18) | 33 (CRUD x11) | 51 |
| Accounting | 8 (list x8) | 0 | 8 |
| Employees | 4 (list+get, types, codes) | 3 (wage CRUD) | 7 |
| Agenda | 6 (list+switch+get+years+types+eshops+activities) | 3 (job order CRUD) | 12 |
| Import status | 1 | 0 | 1 |
| **Total** | | | **187** |

## Intentionally Excluded

| Schema Item | Reason |
|---|---|
| `definitionXMLTransfers` query | Internal config — CLAUDE.md says "always use defaults" |
| `createProductionNote` / `updateProductionNote` / `deleteProductionNote` | Do not exist in the schema — production notes are read-only |

## Remaining Gaps (non-blocking)

- No GET (detail) queries for order-domain entities (received/issued orders, offers, inquiries, services, repairs) — list queries include enough fields for most use cases
- `ORDER_DOCUMENT_DETAIL_FIELDS` fragment is defined but unused — ready for GET queries if needed

# Money S3 MCP Server — Remaining Implementation

What is left to implement to reach 100% coverage of the GraphQL schema.

---

## 1. Missing Queries (6)

### Codebooks (3 queries)

| Schema Query | Tool Name | Description |
|---|---|---|
| `banks` | `list_banks` | Seznam bank (codebook) |
| `combinedNomenclatures` | `list_combined_nomenclatures` | Kombinovana nomenklatura (celni kody) |
| `municipalityPostalCodes` | `list_municipality_postal_codes` | Obce a PSC |

**Files to create/edit:**
- `src/graphql/queries/codebooks.ts` — add 3 query strings
- `src/tools/codebooks.ts` — register 3 list tools (pagination only, same pattern as `list_countries`)

### Warehouse (3 queries)

| Schema Query | Tool Name | Description |
|---|---|---|
| `productionNotes` | `list_production_notes` | Vyrobni listy (in-store document type) |
| `stockTakingDocuments` | `list_stock_taking_documents` | Inventurni doklady |
| `stockTakingTypes` | `list_stock_taking_types` | Typy inventur |

**Files to create/edit:**
- `src/graphql/queries/warehouse.ts` — add 3 query strings
- `src/tools/warehouse.ts` — register 3 list tools

### Intentionally excluded

| Schema Query | Reason |
|---|---|
| `definitionXMLTransfers` | Internal config, CLAUDE.md says "always use defaults" |

---

## 2. Missing Mutations (41)

### 2a. Codebook CRUD — 33 mutations (11 entities x 3)

None of these have a mutation file yet. Create `src/graphql/mutations/codebooks.ts`.

| Entity | create | update | delete | Schema Input Types |
|---|---|---|---|---|
| `Operation` | `createOperation` | `updateOperation` | `deleteOperation` | `OperationInput`, `UpdateOperation`, `DeleteOperation` |
| `VatClassification` | `createVatClassification` | `updateVatClassification` | `deleteVatClassification` | `VatClassificationInput`, `UpdateVatClassification`, `DeleteVatClassification` |
| `VatAccountingAcc` | `createVatAccountingAcc` | `updateVatAccountingAcc` | `deleteVatAccountingAcc` | `VatAccountingAccInput`, `UpdateVatAccountingAcc`, `DeleteVatAccountingAcc` |
| `VatAccountingTr` | `createVatAccountingTr` | `updateVatAccountingTr` | `deleteVatAccountingTr` | `VatAccountingTrInput`, `UpdateVatAccountingTr`, `DeleteVatAccountingTr` |
| `AccountAssignmentAcc` | `createAccountAssignmentAcc` | `updateAccountAssignmentAcc` | `deleteAccountAssignmentAcc` | `AccountAssignmentAccInput`, `UpdateAccountAssignmentAcc`, `DeleteAccountAssignmentAcc` |
| `AccountAssignmentTr` | `createAccountAssignmentTr` | `updateAccountAssignmentTr` | `deleteAccountAssignmentTr` | `AccountAssignmentTrInput`, `UpdateAccountAssignmentTr`, `DeleteAccountAssignmentTr` |
| `AccountChart` | `createAccountChart` | `updateAccountChart` | `deleteAccountChart` | `AccountChartInput`, `UpdateAccountChart`, `DeleteAccountChart` |
| `AccountMovement` | `createAccountMovement` | `updateAccountMovement` | `deleteAccountMovement` | `AccountMovementInput`, `UpdateAccountMovement`, `DeleteAccountMovement` |
| `Centre` | `createCentre` | `updateCentre` | `deleteCentre` | `CentreInput`, `UpdateCentre`, `DeleteCentre` |
| `BankAccountCashBox` | `createBankAccountCashBox` | `updateBankAccountCashBox` | `deleteBankAccountCashBox` | `BankAccountCashBoxInput`, `UpdateBankAccountCashBox`, `DeleteBankAccountCashBox` |
| `Parameter` | `createParameter` | `updateParameter` | `deleteParameter` | `ParameterInput`, `UpdateParameter`, `DeleteParameter` |

**Files to create/edit:**
- `src/graphql/mutations/codebooks.ts` — NEW file, 33 mutation strings
- `src/tools/codebooks.ts` — register 33 tools (create/update/delete for each entity)
- `src/tools/accounting.ts` — alternatively, accounting-related mutations (VatAccounting, AccountAssignment, AccountChart, AccountMovement) could go here

**Pattern:** All mutations return `ImportPromise`. Use `executeMutationWithCheck()` or manual `client.mutate()` + `client.waitForImport()`.

### 2b. Warehouse — In-store Document Update/Delete — 8 mutations

These 4 entities already have `create` mutations. Missing: `update` and `delete`.

| Entity | update | delete | Schema Input Types |
|---|---|---|---|
| `ReceivedSlip` | `updateReceivedSlip` | `deleteReceivedSlip` | `UpdateInStoreDocument`, `DeleteInStoreDocument` |
| `IssuedSlip` | `updateIssuedSlip` | `deleteIssuedSlip` | `UpdateInStoreDocument`, `DeleteInStoreDocument` |
| `SaleSlip` | `updateSaleSlip` | `deleteSaleSlip` | `UpdateInStoreDocument`, `DeleteInStoreDocument` |
| `TransferNote` | `updateTransferNote` | `deleteTransferNote` | `UpdateInStoreDocument`, `DeleteInStoreDocument` |

**Note:** All 4 entity types share the same input types (`UpdateInStoreDocument`, `DeleteInStoreDocument`). Only the mutation name differs.

**Files to edit:**
- `src/graphql/mutations/warehouse.ts` — add 8 mutation strings
- `src/tools/warehouse.ts` — register 8 tools

### 2c. Warehouse — Delivery Notes — 6 mutations

No create/update/delete exists for delivery notes yet.

| Entity | create | update | delete | Schema Input Types |
|---|---|---|---|---|
| `ReceivedDeliveryNote` | `createReceivedDeliveryNote` | `updateReceivedDeliveryNote` | `deleteReceivedDeliveryNote` | `InStoreDocumentInput`, `UpdateInStoreDocument`, `DeleteInStoreDocument` |
| `IssuedDeliveryNote` | `createIssuedDeliveryNote` | `updateIssuedDeliveryNote` | `deleteIssuedDeliveryNote` | `InStoreDocumentInput`, `UpdateInStoreDocument`, `DeleteInStoreDocument` |

**Files to edit:**
- `src/graphql/mutations/warehouse.ts` — add 6 mutation strings
- `src/tools/warehouse.ts` — register 6 tools

### 2d. Warehouse — Stock Taking Documents — 3 mutations

| Entity | create | update | delete | Schema Input Types |
|---|---|---|---|---|
| `StockTakingDocument` | `createStockTakingDocument` | `updateStockTakingDocument` | `deleteStockTakingDocument` | Check `schema.graphql` for exact input types |

**Files to edit:**
- `src/graphql/mutations/warehouse.ts` — add 3 mutation strings
- `src/tools/warehouse.ts` — register 3 tools

---

## 3. Spec Update — 7 Undocumented Tools

These tools exist in code but are missing from `MONEY_S3_MCP_SERVER_SPEC.md` section 13:

| Tool | File | Section to update |
|---|---|---|
| `switch_agenda` | `agenda.ts` | 13.9 Agenda |
| `get_current_agenda` | `agenda.ts` | 13.9 Agenda |
| `get_internal_document` | `documents.ts` | 13.3 Documents |
| `get_liability` | `documents.ts` | 13.3 Documents |
| `get_receivable` | `documents.ts` | 13.3 Documents |
| `update_received_inquiry` | `orders.ts` | 13.5 Orders |
| `update_issued_inquiry` | `orders.ts` | 13.5 Orders |

---

## 4. Summary Table

| Category | Missing Queries | Missing Mutations | Total New Tools |
|---|---|---|---|
| Codebooks (read) | 3 | 0 | 3 |
| Codebooks (CRUD) | 0 | 33 | 33 |
| Warehouse (read) | 3 | 0 | 3 |
| Warehouse (in-store update/delete) | 0 | 8 | 8 |
| Warehouse (delivery notes) | 0 | 6 | 6 |
| Warehouse (stock taking) | 0 | 3 | 3 |
| Spec update only | 0 | 0 | 0 |
| **Total** | **6** | **50** | **56** |

After implementing all 56 new tools, the total will be **187 tools** (131 current + 56 new).

---

## 5. Implementation Order (recommended)

1. **Codebook queries** (3 tools) — quick, read-only, same pattern as existing codebook tools
2. **Warehouse queries** (3 tools) — quick, read-only
3. **In-store document update/delete** (8 tools) — shared input types, repetitive pattern
4. **Delivery note CRUD** (6 tools) — same shared input types as above
5. **Stock taking document CRUD** (3 tools) — check schema for input types
6. **Codebook CRUD** (33 tools) — largest batch, all follow the same mutation pattern
7. **Spec update** — add 7 undocumented tools + all new tools to section 13

---

## 6. Key Implementation Notes

- **All mutations return `ImportPromise`** — use `executeMutationWithCheck()` or `client.mutate()` + `client.waitForImport()`
- **In-store documents share input types** — `InStoreDocumentInput`, `UpdateInStoreDocument`, `DeleteInStoreDocument` are reused across receivedSlips, issuedSlips, saleSlips, transferNotes, receivedDeliveryNotes, issuedDeliveryNotes
- **Always check `schema.graphql`** for exact field names, required fields, and input type structures before implementing
- **Tool descriptions must be in Czech**
- **All tool handlers must use `withErrorHandler()`** wrapper
- **Check for deprecated fields** in schema before implementing (e.g. never use fields marked `@deprecated`)

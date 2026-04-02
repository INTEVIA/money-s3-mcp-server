# Money S3 MCP Server — Unified Implementation Specification

> Consolidated specification from three independent analyses (Opus, Sonnet, Haiku). This document is the single source of truth for implementing an MCP server that connects AI agents to the Money S3 accounting system via its official GraphQL API.

---

## Comparative Summary of Source Analyses

| Aspect | Opus | Sonnet | Haiku |
|--------|------|--------|-------|
| **Depth** | Most comprehensive — ~80 tools, RefInput patterns, DefinitionXMLTransfer defaults, scalar types | Good spec — clear tool definitions, GraphQL fragments, codegen | Tutorial-level — 4 basic tools, working code skeleton |
| **Auth** | OAuth 2.0 (Client Credentials + ROPC flows), AgendaGuid header | Bearer token only (no OAuth details) | Bearer API key only |
| **Async Mutations** | Detailed ImportPromise + polling pattern | Well-explained ImportPromise polling | Missing entirely |
| **Pagination** | Correct: offset-based (skip/take) with CollectionSegment | Correct: skip/take + CollectionSegment | Incorrect: uses edges/node (Relay cursor pattern) |
| **Filter Details** | String = eq/neq only, full operator reference | Good abstraction of simple params → complex where | Basic filter building |
| **SDK API** | Modern `McpServer` from `mcp.js` | Older `Server` class | Older `Server` class |
| **Validation** | Zod schemas | JSON Schema | None (loose TypeScript) |
| **Type Generation** | Manual types + Zod | graphql-codegen | Manual interfaces |
| **Deployment** | Claude Desktop config | stdio + SSE mention | Docker, PM2, systemd |
| **Unique Value** | DefinitionXMLTransfer table, RefInput reference, cancel states, year semantics, gotchas | GraphQL fragments for field selection, Czech tool descriptions, codegen pipeline | Caching, retry/backoff, rate limiting, security checklist, troubleshooting |

### Key Corrections (Haiku errors)

1. **Pagination model**: Money S3 uses `CollectionSegment` (`items`, `totalCount`, `pageInfo { hasNextPage, hasPreviousPage }`) with `skip`/`take` — NOT Relay-style `edges`/`node`/`cursor`.
2. **Mutations are asynchronous**: All write operations return `ImportPromise`, not direct results. Polling `importStatus` is mandatory.
3. **Auth is OAuth 2.0**: Not a simple API key — requires token endpoint, client credentials, and token refresh.
4. **Node.js requirement**: >=20, not >=16.

---

## 1. Project Overview

### What We're Building

An MCP (Model Context Protocol) server in TypeScript that exposes the Money S3 accounting system to AI agents (Claude Desktop, Claude Code, Cursor, etc.) via the standardized MCP protocol. The AI agent will be able to read and write data — invoices, cash documents, company directory, warehouse, payroll, and more.

### Key Properties of Money S3 API

| Property | Detail |
|----------|--------|
| Protocol | GraphQL (not REST) |
| Endpoint | `https://{domain}.api.moneys3.eu/graphql/` (remote) or `http://localhost:85/graphql/` (local) |
| Reads | Synchronous — queries return data immediately |
| Writes | **Asynchronous** — mutations return `ImportPromise` with GUID, result obtained via `importStatus` query |
| Authentication | OAuth 2.0 (Client Credentials or Resource Owner Password Credentials) |
| Agenda | Identified by GUID, passed in HTTP header `AgendaGuid` |
| Pagination | Offset-based (`skip`/`take`), NOT cursor-based |
| String filtering | `eq`/`neq` only — no `contains`, `startsWith`, or regex |

---

## 2. Technology Stack

```
Runtime:           Node.js >= 20
Language:          TypeScript 5.x (strict mode)
MCP SDK:           @modelcontextprotocol/sdk (latest) — use McpServer from server/mcp.js
GraphQL client:    graphql-request
Type generation:   graphql-codegen (generate types from schema.graphql)
Validation:        zod (for config + MCP tool input schemas)
Build:             tsup or tsc → dist/
Linting:           eslint + prettier
Transport:         stdio (primary, for Claude Desktop / Claude Code) + Streamable HTTP (optional)
```

---

## 3. Project Structure

```
money-s3-mcp-server/
├── package.json
├── tsconfig.json
├── codegen.ts                       # graphql-codegen configuration
├── .env.example
├── .gitignore
├── schema.graphql                   # Money S3 GraphQL schema (reference, ~21k lines)
├── src/
│   ├── index.ts                     # Entry point — init & start MCP server
│   ├── config.ts                    # Env config validated with Zod
│   ├── auth/
│   │   └── oauth.ts                 # OAuth 2.0 token management (obtain, cache, refresh)
│   ├── graphql/
│   │   ├── client.ts                # GraphQL client wrapper with auth + AgendaGuid headers
│   │   ├── queries/                 # GraphQL query strings organized by domain
│   │   │   ├── invoices.ts
│   │   │   ├── companies.ts
│   │   │   ├── warehouse.ts
│   │   │   ├── documents.ts
│   │   │   ├── orders.ts
│   │   │   ├── codebooks.ts
│   │   │   ├── accounting.ts
│   │   │   └── employees.ts
│   │   └── mutations/               # GraphQL mutation strings by domain
│   │       ├── invoices.ts
│   │       ├── companies.ts
│   │       ├── warehouse.ts
│   │       ├── documents.ts
│   │       ├── orders.ts
│   │       └── employees.ts
│   ├── tools/                       # MCP tool definitions + handlers
│   │   ├── invoices.ts              # Issued + received invoices
│   │   ├── companies.ts             # Company directory
│   │   ├── warehouse.ts             # Articles, stocks, slips, transfers
│   │   ├── documents.ts             # Cash vouchers, bank statements, internal docs, liabilities, receivables
│   │   ├── orders.ts                # Orders, offers, inquiries
│   │   ├── codebooks.ts             # Currencies, VAT, account charts, numerical series...
│   │   ├── accounting.ts            # Journal, account assignments, VAT accounting
│   │   ├── employees.ts             # Employees + wages
│   │   ├── import-status.ts         # Async import status check
│   │   └── agenda.ts                # Agendas, years, job orders
│   ├── helpers/
│   │   ├── import-poller.ts         # waitForImport() — poll importStatus after mutations
│   │   ├── pagination.ts            # skip/take helper, page/pageSize abstraction
│   │   └── filters.ts               # Build GraphQL where objects from simple MCP params
│   ├── fragments/                   # Default GraphQL field selections per entity type
│   │   ├── invoice.ts
│   │   ├── company.ts
│   │   ├── article.ts
│   │   └── ...
│   └── generated/
│       └── graphql.ts               # Auto-generated types from graphql-codegen
```

---

## 4. Configuration

### Environment Variables (.env)

```env
# Required
MONEY_S3_DOMAIN=company-name              # Domain (without .api.moneys3.eu suffix)
MONEY_S3_CLIENT_ID=xxxxxxxx               # Client ID from API Keys in Money S3
MONEY_S3_CLIENT_SECRET=xxxxxxxx           # Client Secret
MONEY_S3_AGENDA_GUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  # Agenda GUID

# Optional — for Resource Owner Password Credentials flow
MONEY_S3_USERNAME=                         # Username (no spaces!)
MONEY_S3_PASSWORD=                         # User password

# Optional
MONEY_S3_LOCAL=false                       # true = local access (localhost:85)
MONEY_S3_APP_ID=                           # App ID (for local access)

# Optional — import polling
IMPORT_POLL_TIMEOUT_MS=30000               # Max wait time for import (default 30s)
IMPORT_POLL_INTERVAL_MS=1000               # Poll interval (default 1s)
```

### config.ts — Zod Validation

```typescript
import { z } from "zod";

const configSchema = z.object({
  domain: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  agendaGuid: z.string().uuid(),
  username: z.string().optional(),
  password: z.string().optional(),
  isLocal: z.boolean().default(false),
  appId: z.string().optional(),
  importPollTimeoutMs: z.number().default(30000),
  importPollIntervalMs: z.number().default(1000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    domain: process.env.MONEY_S3_DOMAIN,
    clientId: process.env.MONEY_S3_CLIENT_ID,
    clientSecret: process.env.MONEY_S3_CLIENT_SECRET,
    agendaGuid: process.env.MONEY_S3_AGENDA_GUID,
    username: process.env.MONEY_S3_USERNAME || undefined,
    password: process.env.MONEY_S3_PASSWORD || undefined,
    isLocal: process.env.MONEY_S3_LOCAL === "true",
    appId: process.env.MONEY_S3_APP_ID || undefined,
    importPollTimeoutMs: Number(process.env.IMPORT_POLL_TIMEOUT_MS) || 30000,
    importPollIntervalMs: Number(process.env.IMPORT_POLL_INTERVAL_MS) || 1000,
  });
}
```

---

## 5. Authentication (OAuth 2.0)

### Token Endpoints

- **Remote**: `https://{domain}.api.moneys3.eu/connect/token`
- **Local**: `http://localhost:85/connect/token?AppId={APP_ID}`

### Client Credentials Flow (recommended)

```
POST /connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

### Resource Owner Password Credentials Flow (alternative)

```
POST /connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
&username={USERNAME}
&password={PASSWORD}
```

### Implementation Requirements (auth/oauth.ts)

- Obtain access token on first call
- Cache token in memory
- Auto-refresh before expiration (or on 401 response, max 1 retry)
- Return clear error on auth failure
- **Username must NOT contain spaces** — validate in config

### Required HTTP Headers for Every GraphQL Request

```
Authorization: Bearer {access_token}
Content-Type: application/json
AgendaGuid: {AGENDA_GUID}
```

The `AgendaGuid` header is **mandatory** for all communication with a specific agenda.

---

## 6. GraphQL Client (graphql/client.ts)

```typescript
class MoneyS3Client {
  constructor(config: Config, auth: OAuthManager) {}

  async query<T>(query: string, variables?: Record<string, any>): Promise<T>
  async mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T>

  private getEndpoint(): string {
    if (this.config.isLocal) return "http://localhost:85/graphql/";
    return `https://${this.config.domain}.api.moneys3.eu/graphql/`;
  }
}
```

The client must:
- Automatically attach `Authorization` and `AgendaGuid` headers
- Parse GraphQL errors and return human-readable messages
- Support configurable timeout (default 30s)
- Log requests for debugging (optional, controlled by env)

---

## 7. Pagination & Filtering

### Pagination Model: CollectionSegment (offset-based)

All collection queries use offset-based pagination with `skip`/`take`:

```graphql
query {
  issuedInvoices(skip: 0, take: 20) {
    totalCount           # Total record count
    pageInfo {
      hasNextPage        # Boolean
      hasPreviousPage    # Boolean
    }
    items {              # Array of results
      id
      documentNumber
    }
  }
}
```

- `skip` — number of records to skip (offset)
- `take` — number of records to return (limit)
- **MCP tools should expose**: `page` (default 1) and `pageSize` (default 20, max 100)
- **Internally convert**: `skip = (page - 1) * pageSize`, `take = pageSize`
- Always return `totalCount` in responses for context

### Ordering

All collections support ordering via `order` parameter:

```graphql
query {
  issuedInvoices(order: [{ dateOfIssue: DESC }]) {
    items { ... }
  }
}
```

Directions: `ASC`, `DESC`

### Filtering

Filtering via `where` parameter with rich operator logic:

#### Numeric Operators (IntOperationFilterInput, DecimalOperationFilterInput)
- `eq`, `neq` — equals / not equals
- `gt`, `gte` — greater than / greater than or equal
- `lt`, `lte` — less than / less than or equal
- `in`, `nin` — in list / not in list

#### Date Operators (DateOperationFilterInput)
- Same as numeric: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`
- Format: ISO 8601 string (e.g., `"2025-01-15"`)

#### String Operators (EqualNonEqualStringOperationFilterInput)
- **Only `eq`, `neq`** — exact match / not equals
- **No `contains`, `startsWith`, or regex available**

#### Boolean Operators
- `eq`, `neq`

#### Logical Combinations
- Every filter input supports `and: [...]` and `or: [...]`

### Filter Helper Pattern

MCP tools should expose simple named parameters and internally translate them to GraphQL `where` structures:

```typescript
// MCP tool params → GraphQL where
function buildInvoiceFilter(params: {
  dateFrom?: string;
  dateTo?: string;
  documentNumber?: string;
  variableSymbol?: string;
  partnerIco?: string;
  year?: number;
}): object {
  const where: any = {};
  if (params.dateFrom || params.dateTo) {
    where.dateOfIssue = {};
    if (params.dateFrom) where.dateOfIssue.gte = params.dateFrom;
    if (params.dateTo) where.dateOfIssue.lte = params.dateTo;
  }
  if (params.documentNumber) {
    where.documentNumber = { eq: params.documentNumber };
  }
  if (params.variableSymbol) {
    where.variableSymbol = { eq: params.variableSymbol };
  }
  if (params.partnerIco) {
    where.partnerAddress = {
      identificationNumber: { eq: params.partnerIco }
    };
  }
  if (params.year) {
    where.year = { eq: params.year };
  }
  return where;
}
```

---

## 8. Asynchronous Mutations (ImportPromise)

**This is the most critical API-specific pattern.**

### How Writes Work in Money S3

1. Call a mutation (e.g., `createIssuedInvoice`) → returns `ImportPromise`:
   ```graphql
   type ImportPromise {
     guid: UUID!        # GUID for subsequent status polling
     isSuccess: Boolean! # Whether request was accepted into the queue
   }
   ```
2. Data enters the Money S3 import queue
3. Poll status via query:
   ```graphql
   query {
     importStatus(importGuid: "...") {
       guid
       state      # UNPROCESSED | IN_PROCESS | OK | WARNING | ERROR
       stateInfo  # Detail message
     }
   }
   ```

### Import Poller Implementation (helpers/import-poller.ts)

```typescript
export async function waitForImport(
  client: MoneyS3Client,
  guid: string,
  options?: { timeoutMs?: number; intervalMs?: number }
): Promise<{ success: boolean; state: string; stateInfo?: string }> {
  const timeout = options?.timeoutMs ?? 30000;
  const interval = options?.intervalMs ?? 1000;
  const maxAttempts = Math.ceil(timeout / interval);

  for (let i = 0; i < maxAttempts; i++) {
    const result = await client.query(IMPORT_STATUS_QUERY, { importGuid: guid });
    const { state, stateInfo } = result.importStatus;

    if (state === "OK") return { success: true, state, stateInfo };
    if (state === "WARNING") return { success: true, state, stateInfo };
    if (state === "ERROR") return { success: false, state, stateInfo };

    // Still UNPROCESSED or IN_PROCESS — wait and retry
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return {
    success: false,
    state: "TIMEOUT",
    stateInfo: `Import was not completed within ${timeout / 1000} seconds. Use check_import_status tool with guid: ${guid}`
  };
}
```

### Every Mutation Tool Must

1. Call the mutation → get `{ guid, isSuccess }`
2. If `isSuccess === false` → return error immediately
3. Call `waitForImport(client, guid)`
4. Return result to AI agent with state info

### DefinitionXMLTransfer Parameter

Each mutation accepts an optional `definitionXMLTransfer` parameter. **Use the schema defaults** — they are correctly set for each entity type:

| Entity | Default shortCut |
|--------|-----------------|
| CashVoucher | `_PD` |
| BankStatement | `_BD` |
| Liability, Receivable | `_PH+ZV` |
| InternalDocument | `_ID` |
| IssuedInvoice, ReceivedInvoice | `_FP+FV` |
| Company | `_ADR` |
| Article | `_KK` |
| WarehouseStock | `_ZAS` |
| InStoreDocument (slips) | `_S` |
| OrderDocument (orders, offers) | `_O+P+N` |
| Wage | `_MZDY` |
| JobOrder | `_ZAK` |
| Centre | `_STR` |
| Operation | `_CIN` |
| VatClassification | `_CLNDPH` |
| AccountChart, AccountMovement | `_UCOSN+POH` |
| AccountAssignment | `_PREDK` |
| VatAccounting | `_ZAUCDPH` |
| BankAccountCashBox | `_BU+POKL` |
| Parameter | `_PAR` |
| StockTakingDocument | `_INVD` |
| NumericalSerie | — (read-only) |

---

## 9. Reference Types (RefInput Pattern)

Many input types reference existing entities via "RefInput" types. Always use the identifying key (shortCut, prefix, code), NOT the database ID:

| RefInput Type | Key | Example |
|--------------|-----|---------|
| `NumericalSerieRefInput` | `prefix: String!` | `{ prefix: "FV" }` |
| `BankAccountCashBoxRefInput` | `shortCut: String!` | `{ shortCut: "KB" }` |
| `CentreRefInput` | `shortCut: String!` | `{ shortCut: "PROD" }` |
| `JobOrderRefInput` | `shortCut: String!` | `{ shortCut: "ZAK001" }` |
| `OperationRefInput` | `shortCut: String!` | `{ shortCut: "SLUZBY" }` |
| `VatClassificationRefInput` | `shortCut: String!` | `{ shortCut: "UD" }` |
| `CurrencyRefInput` | `code: String!` | `{ code: "EUR", exchangeRate: 25.50 }` |
| `JobOrderTypeRefInput` | `shortCut: String!` | `{ shortCut: "TYP1" }` |
| `AccountAssignmentInput` | `shortCut: String` | `{ shortCut: "F" }` |
| `WarehouseRefInput` | `shortCut: String!` | `{ shortCut: "HL" }` |
| `StateRefInput` | `code: String!` | `{ code: "CZ" }` |
| `ShippingRefInput` | `shortCut: String!` | `{ shortCut: "PPL" }` |

**In MCP tools**: expose simple string params (e.g., `centreShortCut`, `jobOrderShortCut`) and internally wrap them into RefInput objects.

---

## 10. Scalar Types

| GraphQL Scalar | TypeScript Type | Format |
|----------------|----------------|--------|
| `Date` | `string` | ISO 8601: `"2025-01-15"` |
| `DateTime` | `string` | ISO 8601: `"2025-01-15T10:30:00Z"` |
| `Decimal` | `string \| number` | Decimal number |
| `UUID` | `string` | RFC 4122: `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"` |
| `Long` | `number` | 64-bit integer |
| `TimeOnly` | `string` | Time: `"10:30:00"` |
| `Int` | `number` | 32-bit integer |
| `Boolean` | `boolean` | `true` / `false` |
| `String` | `string` | UTF-8 text |

---

## 11. GraphQL Field Selection (Fragments)

Define default field selections for each major entity type. Fragments must cover fields useful for the AI agent but avoid being excessively large (skip binary data, deep nested objects unless needed).

### Example: Issued Invoice — List Fields

```
id, documentNumber, guid, description, dateOfIssue, dateOfTaxing, dateOfMaturity,
dateOfPayment, variableSymbol, invoiceType, isCreditNote, totalWithVatHc,
totalWithoutVatHc, amountToPayHc, remainingAmountToPayHc,
partnerAddress {
  company { id name }
  identificationNumber
  businessAddress { name street municipality }
}
currency { code }
items { description amount unitPriceHc vatRate priceType }
```

### Example: Issued Invoice — Detail Fields (extend list with)

```
registrationNumber, specificSymbol, pairingSymbol, orderNumber,
dateOfAccountingEvent, dateOfVatApplication, isSimplifiedTaxReceipt,
jobOrder { shortCut name }
centre { shortCut name }
operation { shortCut name }
vatClassification { shortCut }
accountAssignment { shortCut }
numericalSerie { prefix }
items { ...(all fields) }
payments { ... }
vatRateSummary { ... }
```

### Example: Company Fields

```
id, guid, code, name (from businessAddress), identificationNumber,
vatIdentificationNumber, isVatPayer, isPerson,
businessAddress { name street municipality countryName },
email, phoneNumber, mobileNumber, www, accountNumber, bankCode,
note, discount, maturityReceivablesDays, maturityLiabilitiesDays
```

---

## 12. MCP Tool Design Principles

- **Name**: `snake_case` (e.g., `list_issued_invoices`, `create_cash_voucher`)
- **Description**: In Czech — the AI agent reads this to decide which tool to call
- **Input Schema**: Validated with Zod, precise types, required fields marked, `date`/`uuid` formats where relevant
- **Simplified Parameters**: Never expose full GraphQL depth — tools internally build the query
- **Pagination everywhere**: Default `pageSize: 20`, max `100`. No tool loads unlimited records
- **Sorting**: Expose `sortBy` and `sortDirection` params with sensible defaults
- **Always return `totalCount`** for context
- **Error responses**: Human-readable message via `isError: true`

### Tool Implementation Pattern

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const listIssuedInvoicesSchema = z.object({
  page: z.number().int().min(1).default(1).describe("Page number"),
  pageSize: z.number().int().min(1).max(100).default(20).describe("Records per page"),
  dateFrom: z.string().optional().describe("Date of issue from (YYYY-MM-DD)"),
  dateTo: z.string().optional().describe("Date of issue to (YYYY-MM-DD)"),
  documentNumber: z.string().optional().describe("Document number (exact match)"),
  variableSymbol: z.string().optional().describe("Variable symbol (exact match)"),
  partnerIco: z.string().optional().describe("Partner ICO (exact match)"),
  year: z.number().int().optional().describe("Accounting year"),
  sortBy: z.enum(["dateOfIssue", "documentNumber", "totalWithVatHc"]).default("dateOfIssue"),
  sortDirection: z.enum(["ASC", "DESC"]).default("DESC"),
});

export function registerInvoiceTools(server: McpServer, client: MoneyS3Client) {
  server.tool(
    "list_issued_invoices",
    "Vypise vydane faktury s filtrovanim dle data, firmy, cisla dokladu. Pouzij pro vyhledani a prehled faktur.",
    listIssuedInvoicesSchema.shape,
    async (params) => {
      const skip = (params.page - 1) * params.pageSize;
      const where = buildInvoiceFilter(params);
      const order = [{ [params.sortBy]: params.sortDirection }];

      const result = await client.query(LIST_ISSUED_INVOICES_QUERY, {
        skip,
        take: params.pageSize,
        where: Object.keys(where).length > 0 ? where : undefined,
        order,
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result.issuedInvoices, null, 2),
        }],
      };
    }
  );
}
```

### Mutation Tool Pattern

```typescript
server.tool(
  "create_issued_invoice",
  "Vytvori vydanou fakturu. Vyzaduje datum vystaveni, polozky a dalsi povinne udaje.",
  createIssuedInvoiceSchema.shape,
  async (params) => {
    const input = buildInvoiceInput(params);  // Transform simple params to GraphQL input

    const importPromise = await client.mutate(CREATE_ISSUED_INVOICE, { input });

    if (!importPromise.createIssuedInvoice.isSuccess) {
      return { content: [{ type: "text", text: "Chyba: Pozadavek nebyl prijat." }], isError: true };
    }

    const result = await waitForImport(client, importPromise.createIssuedInvoice.guid);

    if (!result.success) {
      return { content: [{ type: "text", text: `Chyba importu: ${result.stateInfo}` }], isError: true };
    }

    return {
      content: [{
        type: "text",
        text: `Faktura uspesne vytvorena. Stav: ${result.state}. ${result.stateInfo ?? ""}`,
      }],
    };
  }
);
```

---

## 13. Complete Tool Catalog

### 13.1 Invoices (tools/invoices.ts)

| Tool | Description | GraphQL Operation |
|------|-------------|-------------------|
| `list_issued_invoices` | List issued invoices with filtering | `query issuedInvoices(...)` |
| `get_issued_invoice` | Detail of one issued invoice by ID | `query issuedInvoices(where: { id: { eq: ... } })` |
| `create_issued_invoice` | Create issued invoice | `mutation createIssuedInvoice(...)` |
| `update_issued_invoice` | Update issued invoice | `mutation updateIssuedInvoice(...)` |
| `delete_issued_invoice` | Delete issued invoice | `mutation deleteIssuedInvoice(...)` |
| `list_received_invoices` | List received invoices | `query receivedInvoices(...)` |
| `get_received_invoice` | Detail of received invoice | `query receivedInvoices(where: ...)` |
| `create_received_invoice` | Create received invoice | `mutation createReceivedInvoice(...)` |
| `update_received_invoice` | Update received invoice | `mutation updateReceivedInvoice(...)` |
| `delete_received_invoice` | Delete received invoice | `mutation deleteReceivedInvoice(...)` |

**Create params (simplified):**
- `dateOfIssue` (required), `dateOfTaxing`, `dateOfMaturity` — string, date format
- `description`, `variableSymbol`, `specificSymbol` — string
- `numericalSeriePrefix` — string → `NumericalSerieRefInput { prefix }`
- `partnerIco` / `partnerName` — string → `CompanyInput`
- `payOnShortCut` — string → `BankAccountCashBoxRefInput { shortCut }`
- `jobOrderShortCut`, `centreShortCut`, `operationShortCut` — refs
- `vatClassificationShortCut`, `accountAssignmentShortCut` — refs
- `currencyCode` — string → `CurrencyRefInput { code }`
- `items[]`: `{ description, amount, unitPrice, vatRate, priceType? }`

### 13.2 Company Directory (tools/companies.ts)

| Tool | Description | GraphQL Operation |
|------|-------------|-------------------|
| `list_companies` | List companies | `query companies(...)` |
| `get_company` | Company detail by ID | `query companies(where: { id: ... })` |
| `create_company` | Create company | `mutation createCompany(...)` |
| `update_company` | Update company | `mutation updateCompany(...)` |
| `delete_company` | Delete company | `mutation deleteCompany(...)` |

**Filter params:** `name`, `identificationNumber`, `year`

### 13.3 Cash Vouchers, Bank Statements, Internal Documents, Liabilities, Receivables (tools/documents.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_cash_vouchers` | `query cashVouchers(...)` |
| `get_cash_voucher` | `query cashVouchers(where: { id: ... })` |
| `create_cash_voucher` | `mutation createCashVoucher(...)` |
| `update_cash_voucher` | `mutation updateCashVoucher(...)` |
| `delete_cash_voucher` | `mutation deleteCashVoucher(...)` |
| `list_bank_statements` | `query bankStatements(...)` |
| `get_bank_statement` | `query bankStatements(where: { id: ... })` |
| `create_bank_statement` | `mutation createBankStatement(...)` |
| `update_bank_statement` | `mutation updateBankStatement(...)` |
| `delete_bank_statement` | `mutation deleteBankStatement(...)` |
| `list_internal_documents` | `query internalDocuments(...)` |
| `create_internal_document` | `mutation createInternalDocument(...)` |
| `update_internal_document` | `mutation updateInternalDocument(...)` |
| `delete_internal_document` | `mutation deleteInternalDocument(...)` |
| `list_liabilities` | `query liabilities(...)` |
| `create_liability` | `mutation createLiability(...)` |
| `update_liability` | `mutation updateLiability(...)` |
| `delete_liability` | `mutation deleteLiability(...)` |
| `list_receivables` | `query receivables(...)` |
| `create_receivable` | `mutation createReceivable(...)` |
| `update_receivable` | `mutation updateReceivable(...)` |
| `delete_receivable` | `mutation deleteReceivable(...)` |

**Shared filter params:** `dateFrom`, `dateTo`, `documentNumber`, `variableSymbol`, `year`

### 13.4 Warehouse (tools/warehouse.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_articles` | `query articles(...)` |
| `get_article` | `query articles(where: { id: ... })` |
| `create_article` | `mutation createArticle(...)` |
| `update_article` | `mutation updateArticle(...)` |
| `delete_article` | `mutation deleteArticle(...)` |
| `list_warehouse_stocks` | `query warehouseStocks(...)` |
| `get_warehouse_stock` | `query warehouseStocks(where: ...)` |
| `create_warehouse_stock` | `mutation createWarehouseStock(...)` |
| `update_warehouse_stock` | `mutation updateWarehouseStock(...)` |
| `delete_warehouse_stock` | `mutation deleteWarehouseStock(...)` |
| `list_warehouses` | `query warehouses(...)` |
| `list_received_slips` | `query receivedSlips(...)` |
| `create_received_slip` | `mutation createReceivedSlip(...)` |
| `list_issued_slips` | `query issuedSlips(...)` |
| `create_issued_slip` | `mutation createIssuedSlip(...)` |
| `list_sale_slips` | `query saleSlips(...)` |
| `create_sale_slip` | `mutation createSaleSlip(...)` |
| `list_transfer_notes` | `query transferNotes(...)` |
| `create_transfer_note` | `mutation createTransferNote(...)` |
| `list_received_delivery_notes` | `query receivedDeliveryNotes(...)` |
| `list_issued_delivery_notes` | `query issuedDeliveryNotes(...)` |
| `list_stock_takings` | `query stockTakings(...)` |

**Note:** Warehouse documents (slips, transfers, delivery notes) share input type `InStoreDocumentInput` and filter type `IInStoreDocumentFilterInput`.

### 13.5 Orders, Offers, Inquiries (tools/orders.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_received_orders` | `query receivedOrders(...)` |
| `create_received_order` | `mutation createReceivedOrder(...)` |
| `update_received_order` | `mutation updateReceivedOrder(...)` |
| `delete_received_order` | `mutation deleteReceivedOrder(...)` |
| `list_issued_orders` | `query issuedOrders(...)` |
| `create_issued_order` | `mutation createIssuedOrder(...)` |
| `update_issued_order` | `mutation updateIssuedOrder(...)` |
| `delete_issued_order` | `mutation deleteIssuedOrder(...)` |
| `list_received_offers` | `query receivedOffers(...)` |
| `create_received_offer` | `mutation createReceivedOffer(...)` |
| `update_received_offer` | `mutation updateReceivedOffer(...)` |
| `delete_received_offer` | `mutation deleteReceivedOffer(...)` |
| `list_issued_offers` | `query issuedOffers(...)` |
| `create_issued_offer` | `mutation createIssuedOffer(...)` |
| `update_issued_offer` | `mutation updateIssuedOffer(...)` |
| `delete_issued_offer` | `mutation deleteIssuedOffer(...)` |
| `list_received_inquiries` | `query receivedInquiries(...)` |
| `create_received_inquiry` | `mutation createReceivedInquiry(...)` |
| `delete_received_inquiry` | `mutation deleteReceivedInquiry(...)` |
| `list_issued_inquiries` | `query issuedInquiries(...)` |
| `create_issued_inquiry` | `mutation createIssuedInquiry(...)` |
| `delete_issued_inquiry` | `mutation deleteIssuedInquiry(...)` |
| `list_services` | `query services(...)` |
| `list_repairs` | `query repairs(...)` |

**Note:** Orders, offers, and inquiries share `IOrderDocument` type and `IOrderDocumentFilterInput` for reads. Each has its own input type for writes.

### 13.6 Codebooks (tools/codebooks.ts)

| Tool | GraphQL Operation | Description |
|------|-------------------|-------------|
| `list_vat_classifications` | `query vatClassifications(...)` | VAT classifications |
| `list_account_charts` | `query accountCharts(...)` | Chart of accounts |
| `list_currencies` | `query currencies(...)` | Currencies |
| `list_exchange_lists` | `query exchangeLists(...)` | Exchange rates |
| `list_centres` | `query centres(...)` | Cost centres |
| `list_operations` | `query operations(...)` | Activities/operations |
| `list_numerical_series` | `query numericalSeries(...)` | Numerical series (needed for creating docs) |
| `list_bank_account_cash_boxes` | `query bankAccountCashBoxes(...)` | Bank accounts & cash boxes |
| `list_parameters` | `query parameters(...)` | Parameters |
| `list_countries` | `query countries(...)` | Countries |
| `list_constant_symbols` | `query constantSymbols(...)` | Constant symbols |
| `list_price_levels` | `query priceLevels(...)` | Price levels |
| `list_vat_purposes` | `query vatPurposes(...)` | VAT purposes |
| `list_address_keys` | `query addressKeys(...)` | Address keys |
| `list_shippings` | `query shippings(...)` | Shipping providers |

**Note:** Most codebooks also support CRUD mutations. Implement read tools first (higher priority), then writes.

### 13.7 Accounting (tools/accounting.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_account_assignments_acc` | `query accountAssignmentAccs(...)` — double-entry bookkeeping |
| `list_account_assignments_tr` | `query accountAssignmentTrs(...)` — tax records |
| `list_account_movements` | `query accountMovements(...)` |
| `list_vat_accounting_accs` | `query vatAccountingAccs(...)` — VAT accounting (double-entry) |
| `list_vat_accounting_trs` | `query vatAccountingTrs(...)` — VAT accounting (tax records) |
| `list_journal_accs` | `query journalAccs(...)` — accounting journal (double-entry) |
| `list_journal_trs` | `query journalTrs(...)` — cash journal (tax records) |
| `list_non_monetary_payments` | `query nonMonetaryPayments(...)` |

### 13.8 Employees & Wages (tools/employees.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_employees` | `query employees(...)` |
| `get_employee` | `query employees(where: { id: ... })` |
| `list_employment_types` | `query employmentType(...)` |
| `list_employment_codes` | `query employmentCode(...)` |
| `create_wage` | `mutation createWage(...)` |
| `update_wage` | `mutation updateWage(...)` |
| `delete_wage` | `mutation deleteWage(...)` |

**Legislation note:** Schema uses `@legislationDirective(legislationType: CZ | SK)`. Fields with this directive are valid only for the corresponding country. Note this in relevant tool descriptions.

### 13.9 Agendas, Years, Job Orders (tools/agenda.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `list_agendas` | `query agendas(...)` |
| `list_years` | `query years` |
| `list_job_orders` | `query jobOrders(...)` |
| `get_job_order` | `query jobOrders(where: { id: ... })` |
| `create_job_order` | `mutation createJobOrder(...)` |
| `update_job_order` | `mutation updateJobOrder(...)` |
| `delete_job_order` | `mutation deleteJobOrder(...)` |
| `list_job_order_types` | `query jobOrderTypes(...)` |
| `list_activities` | `query activities(...)` |
| `list_eshops` | `query eshops(...)` |

### 13.10 Import Status (tools/import-status.ts)

| Tool | GraphQL Operation |
|------|-------------------|
| `check_import_status` | `query importStatus(importGuid: ...)` |

**Input:** `importGuid: string` (required, UUID)

---

## 14. Entry Point (src/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { OAuthManager } from "./auth/oauth.js";
import { MoneyS3Client } from "./graphql/client.js";

import { registerInvoiceTools } from "./tools/invoices.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerWarehouseTools } from "./tools/warehouse.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerCodebookTools } from "./tools/codebooks.js";
import { registerAccountingTools } from "./tools/accounting.js";
import { registerEmployeeTools } from "./tools/employees.js";
import { registerImportStatusTools } from "./tools/import-status.js";
import { registerAgendaTools } from "./tools/agenda.js";

async function main() {
  const config = loadConfig();
  const auth = new OAuthManager(config);
  const client = new MoneyS3Client(config, auth);

  const server = new McpServer({
    name: "money-s3",
    version: "1.0.0",
    description: "MCP server for Money S3 accounting system (GraphQL API)",
  });

  // Register all tool groups
  registerInvoiceTools(server, client);
  registerCompanyTools(server, client);
  registerWarehouseTools(server, client);
  registerDocumentTools(server, client);
  registerOrderTools(server, client);
  registerCodebookTools(server, client);
  registerAccountingTools(server, client);
  registerEmployeeTools(server, client);
  registerImportStatusTools(server, client);
  registerAgendaTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Money S3 MCP server running on stdio");
}

main().catch(console.error);
```

---

## 15. Error Handling

### GraphQL Errors

```typescript
function formatGraphQLError(error: unknown): string {
  if (error instanceof ClientError) {
    const messages = error.response?.errors?.map(e => e.message).join("; ");
    return `GraphQL chyba: ${messages ?? error.message}`;
  }
  if (error instanceof Error) return `Chyba: ${error.message}`;
  return "Neznama chyba";
}
```

### Authentication Errors

- **401 Unauthorized** → auto-refresh token, retry once
- **403 Forbidden** → user lacks permissions → return clear error

### Import State Errors

- `state: "ERROR"` → return `stateInfo` as error message
- `state: "WARNING"` → return `stateInfo` as warning, confirm success
- Timeout → clear message: "Import nebyl dokoncen do X sekund"

### MCP Error Response Format

```typescript
return {
  content: [{ type: "text", text: `Chyba: ${errorMessage}` }],
  isError: true,
};
```

### Retry Logic (for transient errors)

```typescript
async function queryWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error("Unreachable");
}
```

---

## 16. package.json Scripts

```json
{
  "name": "money-s3-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": { "money-s3-mcp": "dist/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "codegen": "graphql-codegen --config codegen.ts",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "graphql-request": "^7.0.0",
    "graphql": "^16.0.0",
    "zod": "^3.23.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "typescript": "^5.5.0",
    "tsx": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 17. Implementation Priority

### Phase 1 — Foundation (MVP)

1. Project setup (package.json, tsconfig.json, .env.example, codegen)
2. `config.ts` — Zod-validated configuration
3. `auth/oauth.ts` — OAuth 2.0 token management
4. `graphql/client.ts` — GraphQL client with auth
5. `helpers/import-poller.ts` — waitForImport polling
6. `helpers/pagination.ts` — skip/take abstraction
7. `helpers/filters.ts` — filter builder
8. `tools/import-status.ts` — check_import_status
9. `tools/agenda.ts` — list_agendas, list_years
10. `tools/codebooks.ts` — list_numerical_series, list_currencies, list_vat_classifications, list_bank_account_cash_boxes
11. `tools/invoices.ts` — list/get/create issued + received invoices
12. `tools/companies.ts` — list/get/create companies
13. `tools/documents.ts` — list/create cash vouchers + bank statements
14. `src/index.ts` — MCP server entry point

### Phase 2 — Warehouse & Orders

15. `tools/warehouse.ts` — articles, stocks, warehouses, slips
16. `tools/orders.ts` — received/issued orders, offers, inquiries

### Phase 3 — Accounting & Completion

17. `tools/documents.ts` — add internal documents, liabilities, receivables
18. `tools/accounting.ts` — journal, account assignments, VAT accounting
19. `tools/employees.ts` — employees, wages
20. Update and delete operations for all entities
21. CRUD for codebooks (lower priority)

---

## 18. Client Registration (Claude Desktop / Claude Code)

### Claude Desktop — `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "money-s3": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "MONEY_S3_DOMAIN": "my-domain",
        "MONEY_S3_CLIENT_ID": "...",
        "MONEY_S3_CLIENT_SECRET": "...",
        "MONEY_S3_AGENDA_GUID": "..."
      }
    }
  }
}
```

### Claude Code — `.claude/settings.json` or `claude_code_config.json`

```json
{
  "mcpServers": {
    "money-s3": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/money-s3-mcp-server",
      "env": {
        "MONEY_S3_DOMAIN": "my-domain",
        "MONEY_S3_CLIENT_ID": "...",
        "MONEY_S3_CLIENT_SECRET": "...",
        "MONEY_S3_AGENDA_GUID": "..."
      }
    }
  }
}
```

---

## 19. Security Best Practices

1. **Never hardcode credentials** — always use environment variables
2. **`.env` must be in `.gitignore`** — never commit secrets
3. **Always use HTTPS** for remote API access
4. **Log without sensitive data** — never log tokens, secrets, or full API responses with credentials
5. **Validate all inputs** — Zod schemas on all tool inputs
6. **Rate limit** — consider rate limiting GraphQL requests to avoid API abuse
7. **Token refresh** — never expose expired tokens, refresh proactively

---

## 20. Important Gotchas & Edge Cases

1. **Writes are always async** — never returns data directly, always `ImportPromise` → poll `importStatus`
2. **String filtering is eq/neq only** — Money S3 API does NOT support `contains`, `startsWith`, or regex
3. **References always via shortCut/prefix/code** — never via ID
4. **Username must NOT contain spaces** — validate in docs
5. **Default DefinitionXMLTransfer** — always use schema defaults, don't override
6. **Pagination is offset-based** (skip/take), not cursor-based
7. **AgendaGuid** must be in HTTP header of every request
8. **CompanyInput dual use** — used as input for `createCompany` AND inline as `partnerAddress`/`deliveryAddress` on invoices (identifies partner via `identificationNumber` or `guid`)
9. **Year parameter** — filters and delete operations often accept `year` to scope to a specific accounting year
10. **Cancel enum on invoices** — documents can have states `NONE`, `CANCELLING`, `CANCELLED` — filter appropriately
11. **Legislation directive** — some schema fields are annotated `@legislationDirective(legislationType: CZ | SK)` — valid only for the respective country

---

## 21. Deployment Options

### Local Development

```bash
npm run dev    # Uses tsx for hot-reload
```

### Production (stdio — primary)

```bash
npm run build && npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### PM2 (VPS)

```bash
npm install -g pm2
pm2 start dist/index.js --name "money-s3-mcp"
pm2 startup && pm2 save
```

---

## Appendix: Input File Reference

- `schema.graphql` — complete Money S3 GraphQL schema (~21,000 lines) — the authoritative source of truth for types, queries, mutations, and input structures. Consult this file for any ambiguity.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import { toPaginationArgs } from "../helpers/pagination.js";
import {
  eqFilter,
  dateRangeFilter,
  buildWhere,
  buildOrder,
} from "../helpers/filters.js";
import { toolListResponse, withErrorHandler } from "../helpers/response.js";
import { paginationFields, type CollectionResponse } from "../helpers/types.js";
import {
  LIST_JOURNAL_ACCS,
  LIST_JOURNAL_TRS,
  LIST_ACCOUNT_ASSIGNMENT_ACCS,
  LIST_ACCOUNT_ASSIGNMENT_TRS,
  LIST_ACCOUNT_MOVEMENTS,
  LIST_VAT_ACCOUNTING_ACCS,
  LIST_VAT_ACCOUNTING_TRS,
  LIST_NON_MONETARY_PAYMENTS,
} from "../graphql/queries/accounting.js";

function registerSimpleListTool(
  server: McpServer,
  client: MoneyS3Client,
  toolName: string,
  description: string,
  query: string,
  responseKey: string,
  defaultSortBy = "shortCut",
  sortableFields: [string, ...string[]] = ["shortCut"],
): void {
  server.tool(
    toolName,
    description,
    {
      ...paginationFields,
      sortBy: z.enum(sortableFields).default(defaultSortBy).describe("Pole pro řazení"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(query, {
        skip,
        take,
        order,
      });

      return toolListResponse(
        result[responseKey].items,
        result[responseKey].totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );
}

export function registerAccountingTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  server.tool(
    "list_journal_accs",
    "Vypíše účetní žurnál (podvojné účetnictví) s filtrování dle data, čísla dokladu a částky",
    {
      ...paginationFields,
      dateFrom: z.string().optional().describe("Datum od (ISO formát, např. 2024-01-01)"),
      dateTo: z.string().optional().describe("Datum do (ISO formát, např. 2024-12-31)"),
      srcDocumentNumber: z.string().optional().describe("Číslo zdrojového dokladu"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: z.enum(["id", "date", "amount", "year"]).default("date").describe("Pole pro řazení"),
      sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        date: dateRangeFilter(params.dateFrom, params.dateTo),
        srcDocumentNumber: eqFilter(params.srcDocumentNumber),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_JOURNAL_ACCS, {
        skip, take, where, order,
      });

      return toolListResponse(result.journalAccs.items, result.journalAccs.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_journal_trs",
    "Vypíše peněžní žurnál (daňová evidence) s filtrování dle data, čísla dokladu a částky",
    {
      ...paginationFields,
      dateFrom: z.string().optional().describe("Datum od (ISO formát, např. 2024-01-01)"),
      dateTo: z.string().optional().describe("Datum do (ISO formát, např. 2024-12-31)"),
      srcDocumentNumber: z.string().optional().describe("Číslo zdrojového dokladu"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: z.enum(["id", "date", "amount", "year"]).default("date").describe("Pole pro řazení"),
      sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        date: dateRangeFilter(params.dateFrom, params.dateTo),
        srcDocumentNumber: eqFilter(params.srcDocumentNumber),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_JOURNAL_TRS, {
        skip, take, where, order,
      });

      return toolListResponse(result.journalTrs.items, result.journalTrs.totalCount, params.page, params.pageSize);
    }),
  );

  registerSimpleListTool(server, client, "list_account_assignments_acc", "Vypíše předkontace (podvojné účetnictví)", LIST_ACCOUNT_ASSIGNMENT_ACCS, "accountAssignmentAccs", "shortCut", ["shortCut", "type"]);
  registerSimpleListTool(server, client, "list_account_assignments_tr", "Vypíše předkontace (daňová evidence)", LIST_ACCOUNT_ASSIGNMENT_TRS, "accountAssignmentTrs", "shortCut", ["shortCut", "type"]);
  registerSimpleListTool(server, client, "list_account_movements", "Vypíše účetní pohyby (daňová evidence)", LIST_ACCOUNT_MOVEMENTS, "accountMovements", "shortCut", ["shortCut", "type"]);
  registerSimpleListTool(server, client, "list_vat_accounting_accs", "Vypíše účtování DPH (podvojné účetnictví)", LIST_VAT_ACCOUNTING_ACCS, "vatAccountingAccs", "shortCut", ["shortCut", "type"]);
  registerSimpleListTool(server, client, "list_vat_accounting_trs", "Vypíše účtování DPH (daňová evidence)", LIST_VAT_ACCOUNTING_TRS, "vatAccountingTrs", "shortCut", ["shortCut", "type"]);
  registerSimpleListTool(server, client, "list_non_monetary_payments", "Vypíše nepeněžní platidla (stravenky, poukázky apod.)", LIST_NON_MONETARY_PAYMENTS, "nonMonetaryPayments", "shortCut", ["shortCut"]);
}

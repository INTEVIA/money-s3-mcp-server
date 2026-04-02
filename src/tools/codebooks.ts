import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import { toPaginationArgs } from "../helpers/pagination.js";
import { eqFilter, buildWhere, buildOrder } from "../helpers/filters.js";
import { toolListResponse, withErrorHandler } from "../helpers/response.js";
import { paginationFields, type CollectionResponse } from "../helpers/types.js";
import {
  LIST_CURRENCIES,
  LIST_CENTRES,
  LIST_OPERATIONS,
  LIST_NUMERICAL_SERIES,
  LIST_BANK_ACCOUNT_CASH_BOXES,
  LIST_VAT_CLASSIFICATIONS,
  LIST_ACCOUNT_CHARTS,
  LIST_COUNTRIES,
  LIST_CONSTANT_SYMBOLS,
  LIST_EXCHANGE_LISTS,
  LIST_PRICE_LEVELS,
  LIST_VAT_PURPOSES,
  LIST_ADDRESS_KEYS,
  LIST_SHIPPINGS,
  LIST_PARAMETERS,
} from "../graphql/queries/codebooks.js";

export function registerCodebookTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  server.tool(
    "list_currencies",
    "Vypíše číselník měn (ISO kódy, země, kurzy). Filtruj dle kódu měny.",
    {
      ...paginationFields,
      code: z.string().optional().describe("ISO kód měny (např. EUR, USD)"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ code: eqFilter(params.code) });
      const result = await client.query<CollectionResponse>(LIST_CURRENCIES, { skip, take, where });
      return toolListResponse(result.currencies.items, result.currencies.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_centres",
    "Vypíše číselník středisek. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka střediska"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const order = buildOrder("shortCut", "ASC");
      const result = await client.query<CollectionResponse>(LIST_CENTRES, { skip, take, where, order });
      return toolListResponse(result.centres.items, result.centres.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_operations",
    "Vypíše číselník činností. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka činnosti"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const order = buildOrder("shortCut", "ASC");
      const result = await client.query<CollectionResponse>(LIST_OPERATIONS, { skip, take, where, order });
      return toolListResponse(result.operations.items, result.operations.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_numerical_series",
    "Vypíše číselník číselných řad. Filtruj dle prefixu.",
    {
      ...paginationFields,
      prefix: z.string().optional().describe("Prefix číselné řady (např. FV, FP)"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ prefix: eqFilter(params.prefix) });
      const result = await client.query<CollectionResponse>(LIST_NUMERICAL_SERIES, { skip, take, where });
      return toolListResponse(result.numericalSeries.items, result.numericalSeries.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_bank_account_cash_boxes",
    "Vypíše číselník bankovních účtů a pokladen. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka bankovního účtu/pokladny"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_BANK_ACCOUNT_CASH_BOXES, { skip, take, where });
      return toolListResponse(result.bankAccountCashBoxes.items, result.bankAccountCashBoxes.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_vat_classifications",
    "Vypíše číselník klasifikací DPH. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka členění DPH"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_VAT_CLASSIFICATIONS, { skip, take, where });
      return toolListResponse(result.vatClassifications.items, result.vatClassifications.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_account_charts",
    "Vypíše účtový rozvrh (účtová osnova). Filtruj dle čísla účtu.",
    {
      ...paginationFields,
      account: z.string().optional().describe("Číslo účtu (např. 211, 321)"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ account: eqFilter(params.account) });
      const result = await client.query<CollectionResponse>(LIST_ACCOUNT_CHARTS, { skip, take, where });
      return toolListResponse(result.accountCharts.items, result.accountCharts.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_countries",
    "Vypíše číselník států (ISO kódy, EU členství, SEPA). Filtruj dle kódu.",
    {
      ...paginationFields,
      code: z.string().optional().describe("ISO kód státu (např. CZ, SK, DE)"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ code: eqFilter(params.code) });
      const result = await client.query<CollectionResponse>(LIST_COUNTRIES, { skip, take, where });
      return toolListResponse(result.countries.items, result.countries.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_constant_symbols",
    "Vypíše číselník konstantních symbolů. Filtruj dle kódu.",
    {
      ...paginationFields,
      code: z.string().optional().describe("Kód konstantního symbolu"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ code: eqFilter(params.code) });
      const result = await client.query<CollectionResponse>(LIST_CONSTANT_SYMBOLS, { skip, take, where });
      return toolListResponse(result.constantSymbols.items, result.constantSymbols.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_exchange_lists",
    "Vypíše kurzovní lístky s kurzy měn",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.query<CollectionResponse>(LIST_EXCHANGE_LISTS, { skip, take });
      return toolListResponse(result.exchangeLists.items, result.exchangeLists.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_price_levels",
    "Vypíše číselník cenových hladin. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka cenové hladiny"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_PRICE_LEVELS, { skip, take, where });
      return toolListResponse(result.priceLevels.items, result.priceLevels.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_vat_purposes",
    "Vypíše číselník účelů DPH. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka účelu DPH"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_VAT_PURPOSES, { skip, take, where });
      return toolListResponse(result.vatPurposes.items, result.vatPurposes.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_address_keys",
    "Vypíše číselník klíčů adresáře. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka klíče adresáře"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_ADDRESS_KEYS, { skip, take, where });
      return toolListResponse(result.addressKeys.items, result.addressKeys.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_shippings",
    "Vypíše číselník dopravců. Filtruj dle zkratky.",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka dopravce"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ shortCut: eqFilter(params.shortCut) });
      const result = await client.query<CollectionResponse>(LIST_SHIPPINGS, { skip, take, where });
      return toolListResponse(result.shippings.items, result.shippings.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_parameters",
    "Vypíše číselník parametrů (pro zásoby)",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.query<CollectionResponse>(LIST_PARAMETERS, { skip, take });
      return toolListResponse(result.parameters.items, result.parameters.totalCount, params.page, params.pageSize);
    }),
  );
}

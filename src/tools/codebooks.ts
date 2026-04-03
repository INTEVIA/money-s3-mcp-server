import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import { toPaginationArgs } from "../helpers/pagination.js";
import { eqFilter, buildWhere, buildOrder } from "../helpers/filters.js";
import {
  toolError,
  toolListResponse,
  toolMutationResponse,
  withErrorHandler,
} from "../helpers/response.js";
import {
  paginationFields,
  cleanInput,
  type CollectionResponse,
  type ImportPromiseResponse,
} from "../helpers/types.js";
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
  LIST_BANKS,
  LIST_COMBINED_NOMENCLATURES,
  LIST_MUNICIPALITY_POSTAL_CODES,
} from "../graphql/queries/codebooks.js";
import {
  CREATE_OPERATION,
  UPDATE_OPERATION,
  DELETE_OPERATION,
  CREATE_VAT_CLASSIFICATION,
  UPDATE_VAT_CLASSIFICATION,
  DELETE_VAT_CLASSIFICATION,
  CREATE_VAT_ACCOUNTING_ACC,
  UPDATE_VAT_ACCOUNTING_ACC,
  DELETE_VAT_ACCOUNTING_ACC,
  CREATE_VAT_ACCOUNTING_TR,
  UPDATE_VAT_ACCOUNTING_TR,
  DELETE_VAT_ACCOUNTING_TR,
  CREATE_ACCOUNT_ASSIGNMENT_ACC,
  UPDATE_ACCOUNT_ASSIGNMENT_ACC,
  DELETE_ACCOUNT_ASSIGNMENT_ACC,
  CREATE_ACCOUNT_ASSIGNMENT_TR,
  UPDATE_ACCOUNT_ASSIGNMENT_TR,
  DELETE_ACCOUNT_ASSIGNMENT_TR,
  CREATE_ACCOUNT_CHART,
  UPDATE_ACCOUNT_CHART,
  DELETE_ACCOUNT_CHART,
  CREATE_ACCOUNT_MOVEMENT,
  UPDATE_ACCOUNT_MOVEMENT,
  DELETE_ACCOUNT_MOVEMENT,
  CREATE_CENTRE,
  UPDATE_CENTRE,
  DELETE_CENTRE,
  CREATE_BANK_ACCOUNT_CASH_BOX,
  UPDATE_BANK_ACCOUNT_CASH_BOX,
  DELETE_BANK_ACCOUNT_CASH_BOX,
  CREATE_PARAMETER,
  UPDATE_PARAMETER,
  DELETE_PARAMETER,
} from "../graphql/mutations/codebooks.js";

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

  server.tool(
    "list_banks",
    "Vypíše banky (číselník)",
    {
      ...paginationFields,
      code: z.string().optional().describe("Kód banky"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ code: eqFilter(params.code) });
      const result = await client.query<CollectionResponse>(LIST_BANKS, { skip, take, where });
      return toolListResponse(result.banks.items, result.banks.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_combined_nomenclatures",
    "Vypíše kombinovanou nomenklaturu (celní kódy)",
    {
      ...paginationFields,
      code: z.string().optional().describe("Kód kombinované nomenklatury"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ code: eqFilter(params.code) });
      const result = await client.query<CollectionResponse>(LIST_COMBINED_NOMENCLATURES, { skip, take, where });
      return toolListResponse(result.combinedNomenclatures.items, result.combinedNomenclatures.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_municipality_postal_codes",
    "Vypíše obce a PSČ",
    {
      ...paginationFields,
      postalCode: z.string().optional().describe("PSČ pro filtrování"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ postalCode: eqFilter(params.postalCode) });
      const result = await client.query<CollectionResponse>(LIST_MUNICIPALITY_POSTAL_CODES, { skip, take, where });
      return toolListResponse(result.municipalityPostalCodes.items, result.municipalityPostalCodes.totalCount, params.page, params.pageSize);
    }),
  );

  // ===========================================================================
  // CRUD tools — Operations (Činnosti)
  // ===========================================================================

  server.tool(
    "create_operation",
    "Vytvoří novou činnost v číselníku",
    {
      shortCut: z.string().describe("Zkratka činnosti"),
      name: z.string().optional().describe("Název činnosti"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const operation = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_OPERATION,
        { operation },
      );

      if (!result.createOperation.isSuccess) {
        return toolError("Požadavek na vytvoření činnosti nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createOperation.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_operation",
    "Aktualizuje existující činnost v číselníku",
    {
      shortCut: z.string().optional().describe("Zkratka činnosti"),
      name: z.string().optional().describe("Název činnosti"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const operation = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_OPERATION,
        { operation },
      );

      if (!result.updateOperation.isSuccess) {
        return toolError("Požadavek na aktualizaci činnosti nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateOperation.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_operation",
    "Smaže činnost z číselníku",
    {
      id: z.number().describe("ID činnosti ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const operation = cleanInput({
        id: params.id,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_OPERATION,
        { operation },
      );

      if (!result.deleteOperation.isSuccess) {
        return toolError("Požadavek na smazání činnosti nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteOperation.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — VatClassification (Členění DPH)
  // ===========================================================================

  server.tool(
    "create_vat_classification",
    "Vytvoří nové členění DPH v číselníku",
    {
      shortCut: z.string().describe("Zkratka členění DPH"),
      dateFrom: z.string().describe("Datum platnosti od (ISO formát)"),
      description: z.string().optional().describe("Popis členění DPH"),
      type: z.string().optional().describe("Typ členění DPH"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatClassification = cleanInput({
        shortCut: params.shortCut,
        dateFrom: params.dateFrom,
        description: params.description,
        type: params.type,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_VAT_CLASSIFICATION,
        { vatClassification },
      );

      if (!result.createVatClassification.isSuccess) {
        return toolError("Požadavek na vytvoření členění DPH nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createVatClassification.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_vat_classification",
    "Aktualizuje existující členění DPH",
    {
      shortCut: z.string().optional().describe("Zkratka členění DPH"),
      dateFrom: z.string().optional().describe("Datum platnosti od (ISO formát)"),
      description: z.string().optional().describe("Popis členění DPH"),
      type: z.string().optional().describe("Typ členění DPH"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatClassification = cleanInput({
        shortCut: params.shortCut,
        dateFrom: params.dateFrom,
        description: params.description,
        type: params.type,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_VAT_CLASSIFICATION,
        { vatClassification },
      );

      if (!result.updateVatClassification.isSuccess) {
        return toolError("Požadavek na aktualizaci členění DPH nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateVatClassification.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_vat_classification",
    "Smaže členění DPH z číselníku",
    {
      shortCut: z.string().describe("Zkratka členění DPH ke smazání"),
      dateFrom: z.string().describe("Datum platnosti od (ISO formát)"),
    },
    withErrorHandler(async (params) => {
      const vatClassification = {
        shortCut: params.shortCut,
        dateFrom: params.dateFrom,
      };

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_VAT_CLASSIFICATION,
        { vatClassification },
      );

      if (!result.deleteVatClassification.isSuccess) {
        return toolError("Požadavek na smazání členění DPH nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteVatClassification.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — VatAccountingAcc (Účtování DPH — podvojné)
  // ===========================================================================

  server.tool(
    "create_vat_accounting_acc",
    "Vytvoří nové účtování DPH (podvojné účetnictví)",
    {
      shortCut: z.string().describe("Zkratka účtování DPH"),
      type: z.string().optional().describe("Typ účtování DPH"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingAcc = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_VAT_ACCOUNTING_ACC,
        { vatAccountingAcc },
      );

      if (!result.createVatAccountingAcc.isSuccess) {
        return toolError("Požadavek na vytvoření účtování DPH (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createVatAccountingAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_vat_accounting_acc",
    "Aktualizuje účtování DPH (podvojné účetnictví)",
    {
      shortCut: z.string().optional().describe("Zkratka účtování DPH"),
      type: z.string().optional().describe("Typ účtování DPH"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingAcc = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_VAT_ACCOUNTING_ACC,
        { vatAccountingAcc },
      );

      if (!result.updateVatAccountingAcc.isSuccess) {
        return toolError("Požadavek na aktualizaci účtování DPH (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateVatAccountingAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_vat_accounting_acc",
    "Smaže účtování DPH (podvojné účetnictví)",
    {
      id: z.number().describe("ID účtování DPH ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingAcc = cleanInput({
        id: params.id,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_VAT_ACCOUNTING_ACC,
        { vatAccountingAcc },
      );

      if (!result.deleteVatAccountingAcc.isSuccess) {
        return toolError("Požadavek na smazání účtování DPH (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteVatAccountingAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — VatAccountingTr (Účtování DPH — daňová evidence)
  // ===========================================================================

  server.tool(
    "create_vat_accounting_tr",
    "Vytvoří nové účtování DPH (daňová evidence)",
    {
      shortCut: z.string().describe("Zkratka účtování DPH"),
      type: z.string().optional().describe("Typ účtování DPH"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingTr = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_VAT_ACCOUNTING_TR,
        { vatAccountingTr },
      );

      if (!result.createVatAccountingTr.isSuccess) {
        return toolError("Požadavek na vytvoření účtování DPH (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createVatAccountingTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_vat_accounting_tr",
    "Aktualizuje účtování DPH (daňová evidence)",
    {
      shortCut: z.string().optional().describe("Zkratka účtování DPH"),
      type: z.string().optional().describe("Typ účtování DPH"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingTr = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_VAT_ACCOUNTING_TR,
        { vatAccountingTr },
      );

      if (!result.updateVatAccountingTr.isSuccess) {
        return toolError("Požadavek na aktualizaci účtování DPH (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateVatAccountingTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_vat_accounting_tr",
    "Smaže účtování DPH (daňová evidence)",
    {
      id: z.number().describe("ID účtování DPH ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const vatAccountingTr = cleanInput({
        id: params.id,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_VAT_ACCOUNTING_TR,
        { vatAccountingTr },
      );

      if (!result.deleteVatAccountingTr.isSuccess) {
        return toolError("Požadavek na smazání účtování DPH (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteVatAccountingTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — AccountAssignmentAcc (Předkontace — podvojné)
  // ===========================================================================

  server.tool(
    "create_account_assignment_acc",
    "Vytvoří novou předkontaci (podvojné účetnictví)",
    {
      shortCut: z.string().describe("Zkratka předkontace"),
      type: z.string().optional().describe("Typ předkontace"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentAcc = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_ACCOUNT_ASSIGNMENT_ACC,
        { accountAssignmentAcc },
      );

      if (!result.createAccountAssignmentAcc.isSuccess) {
        return toolError("Požadavek na vytvoření předkontace (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createAccountAssignmentAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_account_assignment_acc",
    "Aktualizuje předkontaci (podvojné účetnictví)",
    {
      shortCut: z.string().describe("Zkratka předkontace (identifikátor)"),
      type: z.string().optional().describe("Typ předkontace"),
      description: z.string().optional().describe("Popis"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentAcc = cleanInput({
        shortCut: params.shortCut,
        type: params.type,
        description: params.description,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_ACCOUNT_ASSIGNMENT_ACC,
        { accountAssignmentAcc },
      );

      if (!result.updateAccountAssignmentAcc.isSuccess) {
        return toolError("Požadavek na aktualizaci předkontace (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateAccountAssignmentAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_account_assignment_acc",
    "Smaže předkontaci (podvojné účetnictví)",
    {
      shortCut: z.string().describe("Zkratka předkontace ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentAcc = cleanInput({
        shortCut: params.shortCut,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_ACCOUNT_ASSIGNMENT_ACC,
        { accountAssignmentAcc },
      );

      if (!result.deleteAccountAssignmentAcc.isSuccess) {
        return toolError("Požadavek na smazání předkontace (Acc) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteAccountAssignmentAcc.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — AccountAssignmentTr (Předkontace — daňová evidence)
  // ===========================================================================

  server.tool(
    "create_account_assignment_tr",
    "Vytvoří novou předkontaci (daňová evidence)",
    {
      shortCut: z.string().describe("Zkratka předkontace"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ předkontace"),
      note: z.string().optional().describe("Poznámka"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentTr = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        note: params.note,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_ACCOUNT_ASSIGNMENT_TR,
        { accountAssignmentTr },
      );

      if (!result.createAccountAssignmentTr.isSuccess) {
        return toolError("Požadavek na vytvoření předkontace (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createAccountAssignmentTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_account_assignment_tr",
    "Aktualizuje předkontaci (daňová evidence)",
    {
      shortCut: z.string().describe("Zkratka předkontace (identifikátor)"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ předkontace"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentTr = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_ACCOUNT_ASSIGNMENT_TR,
        { accountAssignmentTr },
      );

      if (!result.updateAccountAssignmentTr.isSuccess) {
        return toolError("Požadavek na aktualizaci předkontace (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateAccountAssignmentTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_account_assignment_tr",
    "Smaže předkontaci (daňová evidence)",
    {
      shortCut: z.string().describe("Zkratka předkontace ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountAssignmentTr = cleanInput({
        shortCut: params.shortCut,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_ACCOUNT_ASSIGNMENT_TR,
        { accountAssignmentTr },
      );

      if (!result.deleteAccountAssignmentTr.isSuccess) {
        return toolError("Požadavek na smazání předkontace (Tr) nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteAccountAssignmentTr.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — AccountChart (Účtový rozvrh)
  // ===========================================================================

  server.tool(
    "create_account_chart",
    "Vytvoří nový účet v účtovém rozvrhu",
    {
      account: z.string().describe("Číslo účtu (např. 211, 321)"),
      name: z.string().optional().describe("Název účtu"),
      type: z.string().optional().describe("Typ účtu"),
      note: z.string().optional().describe("Poznámka"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountChart = cleanInput({
        account: params.account,
        name: params.name,
        type: params.type,
        note: params.note,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_ACCOUNT_CHART,
        { accountChart },
      );

      if (!result.createAccountChart.isSuccess) {
        return toolError("Požadavek na vytvoření účtu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createAccountChart.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_account_chart",
    "Aktualizuje účet v účtovém rozvrhu",
    {
      account: z.string().describe("Číslo účtu (identifikátor)"),
      name: z.string().optional().describe("Název účtu"),
      type: z.string().optional().describe("Typ účtu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const accountChart = cleanInput({
        account: params.account,
        name: params.name,
        type: params.type,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_ACCOUNT_CHART,
        { accountChart },
      );

      if (!result.updateAccountChart.isSuccess) {
        return toolError("Požadavek na aktualizaci účtu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateAccountChart.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_account_chart",
    "Smaže účet z účtového rozvrhu",
    {
      account: z.string().describe("Číslo účtu ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountChart = cleanInput({
        account: params.account,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_ACCOUNT_CHART,
        { accountChart },
      );

      if (!result.deleteAccountChart.isSuccess) {
        return toolError("Požadavek na smazání účtu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteAccountChart.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — AccountMovement (Účetní pohyb)
  // ===========================================================================

  server.tool(
    "create_account_movement",
    "Vytvoří nový účetní pohyb v číselníku",
    {
      shortCut: z.string().describe("Zkratka účetního pohybu"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ pohybu"),
      column: z.string().optional().describe("Sloupec"),
      note: z.string().optional().describe("Poznámka"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountMovement = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        column: params.column,
        note: params.note,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_ACCOUNT_MOVEMENT,
        { accountMovement },
      );

      if (!result.createAccountMovement.isSuccess) {
        return toolError("Požadavek na vytvoření účetního pohybu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createAccountMovement.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_account_movement",
    "Aktualizuje účetní pohyb v číselníku",
    {
      shortCut: z.string().describe("Zkratka účetního pohybu (identifikátor)"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ pohybu"),
      column: z.string().optional().describe("Sloupec"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const accountMovement = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        column: params.column,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_ACCOUNT_MOVEMENT,
        { accountMovement },
      );

      if (!result.updateAccountMovement.isSuccess) {
        return toolError("Požadavek na aktualizaci účetního pohybu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateAccountMovement.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_account_movement",
    "Smaže účetní pohyb z číselníku",
    {
      shortCut: z.string().describe("Zkratka účetního pohybu ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const accountMovement = cleanInput({
        shortCut: params.shortCut,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_ACCOUNT_MOVEMENT,
        { accountMovement },
      );

      if (!result.deleteAccountMovement.isSuccess) {
        return toolError("Požadavek na smazání účetního pohybu nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteAccountMovement.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — Centre (Středisko)
  // ===========================================================================

  server.tool(
    "create_centre",
    "Vytvoří nové středisko v číselníku",
    {
      shortCut: z.string().describe("Zkratka střediska"),
      name: z.string().optional().describe("Název střediska"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const centre = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_CENTRE,
        { centre },
      );

      if (!result.createCentre.isSuccess) {
        return toolError("Požadavek na vytvoření střediska nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createCentre.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_centre",
    "Aktualizuje existující středisko v číselníku",
    {
      shortCut: z.string().optional().describe("Zkratka střediska"),
      name: z.string().optional().describe("Název střediska"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const centre = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_CENTRE,
        { centre },
      );

      if (!result.updateCentre.isSuccess) {
        return toolError("Požadavek na aktualizaci střediska nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateCentre.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_centre",
    "Smaže středisko z číselníku",
    {
      id: z.number().describe("ID střediska ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const centre = cleanInput({
        id: params.id,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_CENTRE,
        { centre },
      );

      if (!result.deleteCentre.isSuccess) {
        return toolError("Požadavek na smazání střediska nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteCentre.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — BankAccountCashBox (Bankovní účet / Pokladna)
  // ===========================================================================

  server.tool(
    "create_bank_account_cash_box",
    "Vytvoří nový bankovní účet nebo pokladnu v číselníku",
    {
      shortCut: z.string().describe("Zkratka bankovního účtu/pokladny"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ (bankovní účet / pokladna)"),
      accountNumber: z.string().optional().describe("Číslo účtu"),
      bankCode: z.string().optional().describe("Kód banky"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const bankAccountCashBox = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_BANK_ACCOUNT_CASH_BOX,
        { bankAccountCashBox },
      );

      if (!result.createBankAccountCashBox.isSuccess) {
        return toolError("Požadavek na vytvoření bankovního účtu/pokladny nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createBankAccountCashBox.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_bank_account_cash_box",
    "Aktualizuje bankovní účet nebo pokladnu",
    {
      shortCut: z.string().optional().describe("Zkratka bankovního účtu/pokladny"),
      description: z.string().optional().describe("Popis"),
      type: z.string().optional().describe("Typ (bankovní účet / pokladna)"),
      accountNumber: z.string().optional().describe("Číslo účtu"),
      bankCode: z.string().optional().describe("Kód banky"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const bankAccountCashBox = cleanInput({
        shortCut: params.shortCut,
        description: params.description,
        type: params.type,
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_BANK_ACCOUNT_CASH_BOX,
        { bankAccountCashBox },
      );

      if (!result.updateBankAccountCashBox.isSuccess) {
        return toolError("Požadavek na aktualizaci bankovního účtu/pokladny nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateBankAccountCashBox.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_bank_account_cash_box",
    "Smaže bankovní účet nebo pokladnu z číselníku",
    {
      shortCut: z.string().describe("Zkratka bankovního účtu/pokladny ke smazání"),
      year: z.number().optional().describe("Rok účetního období"),
    },
    withErrorHandler(async (params) => {
      const bankAccountCashBox = cleanInput({
        shortCut: params.shortCut,
        year: params.year,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_BANK_ACCOUNT_CASH_BOX,
        { bankAccountCashBox },
      );

      if (!result.deleteBankAccountCashBox.isSuccess) {
        return toolError("Požadavek na smazání bankovního účtu/pokladny nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteBankAccountCashBox.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // ===========================================================================
  // CRUD tools — Parameter (Parametr)
  // ===========================================================================

  server.tool(
    "create_parameter",
    "Vytvoří nový parametr v číselníku (pro zásoby)",
    {
      name: z.string().describe("Název parametru"),
      type: z.string().optional().describe("Typ parametru"),
      measureUnit: z.string().optional().describe("Měrná jednotka"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const parameter = cleanInput({
        name: params.name,
        type: params.type,
        measureUnit: params.measureUnit,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_PARAMETER,
        { parameter },
      );

      if (!result.createParameter.isSuccess) {
        return toolError("Požadavek na vytvoření parametru nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createParameter.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_parameter",
    "Aktualizuje parametr v číselníku",
    {
      name: z.string().describe("Název parametru (identifikátor)"),
      type: z.string().optional().describe("Typ parametru"),
      measureUnit: z.string().optional().describe("Měrná jednotka"),
    },
    withErrorHandler(async (params) => {
      const parameter = cleanInput({
        name: params.name,
        type: params.type,
        measureUnit: params.measureUnit,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_PARAMETER,
        { parameter },
      );

      if (!result.updateParameter.isSuccess) {
        return toolError("Požadavek na aktualizaci parametru nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateParameter.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_parameter",
    "Smaže parametr z číselníku",
    {
      id: z.number().describe("ID parametru ke smazání"),
    },
    withErrorHandler(async (params) => {
      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_PARAMETER,
        { parameter: { id: params.id } },
      );

      if (!result.deleteParameter.isSuccess) {
        return toolError("Požadavek na smazání parametru nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteParameter.guid);
      return toolMutationResponse(importResult);
    }),
  );
}

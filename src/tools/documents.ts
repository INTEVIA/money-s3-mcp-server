import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";

import { toPaginationArgs } from "../helpers/pagination.js";
import {
  dateRangeFilter,
  eqFilter,
  buildWhere,
  buildOrder,
} from "../helpers/filters.js";
import {
  toolError,
  toolListResponse,
  toolSuccess,
  withErrorHandler,
} from "../helpers/response.js";
import {
  paginationFields,
  cleanInput,
  type CollectionResponse,
} from "../helpers/types.js";
import { executeMutationWithCheck } from "../helpers/mutation.js";
import {
  LIST_CASH_VOUCHERS,
  GET_CASH_VOUCHER,
  LIST_BANK_STATEMENTS,
  GET_BANK_STATEMENT,
  LIST_INTERNAL_DOCUMENTS,
  GET_INTERNAL_DOCUMENT,
  LIST_LIABILITIES,
  GET_LIABILITY,
  LIST_RECEIVABLES,
  GET_RECEIVABLE,
} from "../graphql/queries/documents.js";
import {
  CREATE_CASH_VOUCHER,
  UPDATE_CASH_VOUCHER,
  DELETE_CASH_VOUCHER,
  CREATE_BANK_STATEMENT,
  UPDATE_BANK_STATEMENT,
  DELETE_BANK_STATEMENT,
  CREATE_INTERNAL_DOCUMENT,
  UPDATE_INTERNAL_DOCUMENT,
  DELETE_INTERNAL_DOCUMENT,
  CREATE_LIABILITY,
  UPDATE_LIABILITY,
  DELETE_LIABILITY,
  CREATE_RECEIVABLE,
  UPDATE_RECEIVABLE,
  DELETE_RECEIVABLE,
} from "../graphql/mutations/documents.js";

// ---------------------------------------------------------------------------
// Shared Zod schemas for common document filter params
// ---------------------------------------------------------------------------

const documentFilterSchema = {
  ...paginationFields,
  dateFrom: z
    .string()
    .optional()
    .describe("Datum vystavení od (YYYY-MM-DD)"),
  dateTo: z
    .string()
    .optional()
    .describe("Datum vystavení do (YYYY-MM-DD)"),
  documentNumber: z
    .string()
    .optional()
    .describe("Číslo dokladu"),
  variableSymbol: z
    .string()
    .optional()
    .describe("Variabilní symbol"),
  year: z
    .number()
    .optional()
    .describe("Účetní rok"),
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDocumentTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // =========================================================================
  // CASH VOUCHERS (Pokladní doklady)
  // =========================================================================

  server.tool(
    "list_cash_vouchers",
    "Vypíše pokladní doklady s filtrováním dle data, čísla dokladu, pokladny, variabilního symbolu",
    {
      ...documentFilterSchema,
      cashBoxShortCut: z.string().optional().describe("Zkratka pokladny (přesná shoda, např. POKL)"),
      description: z.string().optional().describe("Popis dokladu (přesná shoda)"),
      sortBy: z
        .enum(["id", "documentNumber", "dateOfIssue", "totalWithVatHc", "year"])
        .default("dateOfIssue")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("DESC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        dateOfIssue: dateRangeFilter(params.dateFrom, params.dateTo),
        documentNumber: eqFilter(params.documentNumber),
        variableSymbol: eqFilter(params.variableSymbol),
        description: eqFilter(params.description),
        cashBox: params.cashBoxShortCut
          ? { shortCut: { eq: params.cashBoxShortCut } }
          : undefined,
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_CASH_VOUCHERS,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.cashVouchers.items,
        result.cashVouchers.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  server.tool(
    "get_cash_voucher",
    "Zobrazí detail pokladního dokladu podle ID",
    {
      id: z.number().describe("ID pokladního dokladu"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = { id: { eq: params.id } };
      if (params.year !== undefined) where.year = { eq: params.year };

      const result = await client.query<CollectionResponse>(
        GET_CASH_VOUCHER,
        { where },
      );

      const item = result.cashVouchers.items[0];
      if (!item) {
        return toolError(
          `Pokladní doklad s ID ${params.id} nebyl nalezen`,
        );
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_cash_voucher",
    "Vytvoří nový pokladní doklad",
    {
      isExpense: z.boolean().describe("Výdaj (true) nebo příjem (false)"),
      documentNumber: z
        .string()
        .optional()
        .describe("Číslo dokladu"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfPayment: z
        .string()
        .optional()
        .describe("Datum úhrady (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
      partnerName: z
        .string()
        .optional()
        .describe("Název partnera na dokladu"),
      partnerIco: z.string().optional().describe("IČO partnera na dokladu"),
    },
    withErrorHandler(async (params) => {
      const cashVoucher = cleanInput({
        isExpense: params.isExpense,
        documentNumber: params.documentNumber,
        dateOfIssue: params.dateOfIssue,
        dateOfPayment: params.dateOfPayment,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        variableSymbol: params.variableSymbol,
        description: params.description,
        note: params.note,
        partnerAddress:
          params.partnerName !== undefined || params.partnerIco !== undefined
            ? cleanInput({
                businessAddress: params.partnerName !== undefined
                  ? { name: params.partnerName }
                  : undefined,
                identificationNumber: params.partnerIco,
              })
            : undefined,
      });

      return executeMutationWithCheck(client, CREATE_CASH_VOUCHER, { cashVoucher }, "createCashVoucher");
    }),
  );

  server.tool(
    "update_cash_voucher",
    "Aktualizuje existující pokladní doklad",
    {
      guid: z.string().describe("GUID pokladního dokladu (UUID)"),
      isExpense: z
        .boolean()
        .optional()
        .describe("Výdaj (true) nebo příjem (false)"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfPayment: z
        .string()
        .optional()
        .describe("Datum úhrady (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const cashVoucher = cleanInput({
        guid: params.guid,
        isExpense: params.isExpense,
        documentNumber: params.documentNumber,
        dateOfIssue: params.dateOfIssue,
        dateOfPayment: params.dateOfPayment,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        variableSymbol: params.variableSymbol,
        description: params.description,
        note: params.note,
      });

      return executeMutationWithCheck(client, UPDATE_CASH_VOUCHER, { cashVoucher }, "updateCashVoucher");
    }),
  );

  server.tool(
    "delete_cash_voucher",
    "Smaže pokladní doklad",
    {
      id: z.number().describe("ID pokladního dokladu ke smazání"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const cashVoucher = cleanInput({
        id: params.id,
        year: params.year,
      });

      return executeMutationWithCheck(client, DELETE_CASH_VOUCHER, { cashVoucher }, "deleteCashVoucher");
    }),
  );

  // =========================================================================
  // BANK STATEMENTS (Bankovní výpisy)
  // =========================================================================

  server.tool(
    "list_bank_statements",
    "Vypíše bankovní výpisy s filtrováním dle data, bankovního účtu, čísla dokladu, popisu, variabilního symbolu",
    {
      ...documentFilterSchema,
      bankAccountShortCut: z.string().optional().describe("Zkratka bankovního účtu (přesná shoda, např. BAN, ÚVĚR-ČS 25)"),
      description: z.string().optional().describe("Popis dokladu (přesná shoda)"),
      sortBy: z
        .enum([
          "id",
          "documentNumber",
          "bankStatementNumber",
          "dateOfIssue",
          "totalWithVatHc",
          "year",
        ])
        .default("dateOfIssue")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("DESC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        dateOfIssue: dateRangeFilter(params.dateFrom, params.dateTo),
        documentNumber: eqFilter(params.documentNumber),
        variableSymbol: eqFilter(params.variableSymbol),
        description: eqFilter(params.description),
        bankAccount: params.bankAccountShortCut
          ? { shortCut: { eq: params.bankAccountShortCut } }
          : undefined,
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_BANK_STATEMENTS,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.bankStatements.items,
        result.bankStatements.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  server.tool(
    "get_bank_statement",
    "Zobrazí detail bankovního výpisu podle ID",
    {
      id: z.number().describe("ID bankovního výpisu"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = { id: { eq: params.id } };
      if (params.year !== undefined) where.year = { eq: params.year };

      const result = await client.query<CollectionResponse>(
        GET_BANK_STATEMENT,
        { where },
      );

      const item = result.bankStatements.items[0];
      if (!item) {
        return toolError(
          `Bankovní výpis s ID ${params.id} nebyl nalezen`,
        );
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_bank_statement",
    "Vytvoří nový bankovní výpis",
    {
      isExpense: z.boolean().describe("Výdaj (true) nebo příjem (false)"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      bankStatementNumber: z
        .number()
        .optional()
        .describe("Číslo bankovního výpisu"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfPayment: z
        .string()
        .optional()
        .describe("Datum úhrady (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      constantSymbol: z.string().optional().describe("Konstantní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
      partnerName: z
        .string()
        .optional()
        .describe("Název partnera na dokladu"),
      partnerIco: z.string().optional().describe("IČO partnera na dokladu"),
    },
    withErrorHandler(async (params) => {
      const bankStatement = cleanInput({
        isExpense: params.isExpense,
        documentNumber: params.documentNumber,
        bankStatementNumber: params.bankStatementNumber,
        dateOfIssue: params.dateOfIssue,
        dateOfPayment: params.dateOfPayment,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        variableSymbol: params.variableSymbol,
        constantSymbol: params.constantSymbol,
        specificSymbol: params.specificSymbol,
        description: params.description,
        note: params.note,
        partnerAddress:
          params.partnerName !== undefined || params.partnerIco !== undefined
            ? cleanInput({
                businessAddress: params.partnerName !== undefined
                  ? { name: params.partnerName }
                  : undefined,
                identificationNumber: params.partnerIco,
              })
            : undefined,
      });

      return executeMutationWithCheck(client, CREATE_BANK_STATEMENT, { bankStatement }, "createBankStatement");
    }),
  );

  server.tool(
    "update_bank_statement",
    "Aktualizuje existující bankovní výpis (identifikace dle čísla dokladu a roku)",
    {
      documentNumber: z
        .string()
        .describe("Číslo dokladu pro identifikaci"),
      year: z.number().optional().describe("Účetní rok"),
      isExpense: z
        .boolean()
        .optional()
        .describe("Výdaj (true) nebo příjem (false)"),
      bankStatementNumber: z
        .number()
        .optional()
        .describe("Číslo bankovního výpisu"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfPayment: z
        .string()
        .optional()
        .describe("Datum úhrady (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      constantSymbol: z.string().optional().describe("Konstantní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const bankStatement = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        isExpense: params.isExpense,
        bankStatementNumber: params.bankStatementNumber,
        dateOfIssue: params.dateOfIssue,
        dateOfPayment: params.dateOfPayment,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        variableSymbol: params.variableSymbol,
        constantSymbol: params.constantSymbol,
        specificSymbol: params.specificSymbol,
        description: params.description,
        note: params.note,
      });

      return executeMutationWithCheck(client, UPDATE_BANK_STATEMENT, { bankStatement }, "updateBankStatement");
    }),
  );

  server.tool(
    "delete_bank_statement",
    "Smaže bankovní výpis",
    {
      id: z.number().describe("ID bankovního výpisu ke smazání"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const bankStatement = cleanInput({
        id: params.id,
        year: params.year,
      });

      return executeMutationWithCheck(client, DELETE_BANK_STATEMENT, { bankStatement }, "deleteBankStatement");
    }),
  );

  // =========================================================================
  // INTERNAL DOCUMENTS (Interní doklady)
  // =========================================================================

  server.tool(
    "list_internal_documents",
    "Vypíše interní doklady s filtrováním dle data, čísla dokladu, variabilního symbolu",
    {
      ...paginationFields,
      dateFrom: z
        .string()
        .optional()
        .describe("Datum účtování od (YYYY-MM-DD)"),
      dateTo: z
        .string()
        .optional()
        .describe("Datum účtování do (YYYY-MM-DD)"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: z
        .enum([
          "id",
          "documentNumber",
          "dateOfAccountingEvent",
          "totalWithVatHc",
          "year",
        ])
        .default("id")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("ASC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        dateOfAccountingEvent: dateRangeFilter(
          params.dateFrom,
          params.dateTo,
        ),
        documentNumber: eqFilter(params.documentNumber),
        variableSymbol: eqFilter(params.variableSymbol),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_INTERNAL_DOCUMENTS,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.internalDocuments.items,
        result.internalDocuments.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  server.tool(
    "get_internal_document",
    "Zobrazí detail interního dokladu podle ID",
    {
      id: z.number().describe("ID interního dokladu"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = { id: { eq: params.id } };
      if (params.year !== undefined) where.year = { eq: params.year };

      const result = await client.query<CollectionResponse>(
        GET_INTERNAL_DOCUMENT,
        { where },
      );

      const item = result.internalDocuments.items[0];
      if (!item) {
        return toolError(
          `Interní doklad s ID ${params.id} nebyl nalezen`,
        );
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_internal_document",
    "Vytvoří nový interní doklad",
    {
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfVatApplication: z
        .string()
        .optional()
        .describe("Datum uplatnění DPH (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
      partnerName: z
        .string()
        .optional()
        .describe("Název partnera na dokladu"),
      partnerIco: z.string().optional().describe("IČO partnera na dokladu"),
    },
    withErrorHandler(async (params) => {
      const internalDocument = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        dateOfVatApplication: params.dateOfVatApplication,
        variableSymbol: params.variableSymbol,
        description: params.description,
        note: params.note,
        partnerAddress:
          params.partnerName !== undefined || params.partnerIco !== undefined
            ? cleanInput({
                businessAddress: params.partnerName !== undefined
                  ? { name: params.partnerName }
                  : undefined,
                identificationNumber: params.partnerIco,
              })
            : undefined,
      });

      return executeMutationWithCheck(client, CREATE_INTERNAL_DOCUMENT, { internalDocument }, "createInternalDocument");
    }),
  );

  server.tool(
    "update_internal_document",
    "Aktualizuje existující interní doklad (identifikace dle čísla dokladu a roku)",
    {
      documentNumber: z
        .string()
        .describe("Číslo dokladu pro identifikaci"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const internalDocument = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        variableSymbol: params.variableSymbol,
        description: params.description,
        note: params.note,
      });

      return executeMutationWithCheck(client, UPDATE_INTERNAL_DOCUMENT, { internalDocument }, "updateInternalDocument");
    }),
  );

  server.tool(
    "delete_internal_document",
    "Smaže interní doklad",
    {
      id: z.number().describe("ID interního dokladu ke smazání"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const internalDocument = cleanInput({
        id: params.id,
        year: params.year,
      });

      return executeMutationWithCheck(client, DELETE_INTERNAL_DOCUMENT, { internalDocument }, "deleteInternalDocument");
    }),
  );

  // =========================================================================
  // LIABILITIES (Závazky)
  // =========================================================================

  server.tool(
    "list_liabilities",
    "Vypíše závazky s filtrováním dle data, čísla dokladu, variabilního symbolu",
    {
      ...documentFilterSchema,
      sortBy: z
        .enum([
          "id",
          "documentNumber",
          "dateOfIssue",
          "dateOfMaturity",
          "totalWithVatHc",
          "remainingAmountToPayHc",
          "year",
        ])
        .default("id")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("ASC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        dateOfIssue: dateRangeFilter(params.dateFrom, params.dateTo),
        documentNumber: eqFilter(params.documentNumber),
        variableSymbol: eqFilter(params.variableSymbol),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_LIABILITIES,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.liabilities.items,
        result.liabilities.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  server.tool(
    "get_liability",
    "Zobrazí detail závazku podle ID",
    {
      id: z.number().describe("ID závazku"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = { id: { eq: params.id } };
      if (params.year !== undefined) where.year = { eq: params.year };

      const result = await client.query<CollectionResponse>(
        GET_LIABILITY,
        { where },
      );

      const item = result.liabilities.items[0];
      if (!item) {
        return toolError(
          `Závazek s ID ${params.id} nebyl nalezen`,
        );
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_liability",
    "Vytvoří nový závazek",
    {
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfVatApplication: z
        .string()
        .optional()
        .describe("Datum uplatnění DPH (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      constantSymbol: z.string().optional().describe("Konstantní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      receivedDocumentNumber: z
        .string()
        .optional()
        .describe("Číslo přijatého dokladu"),
      note: z.string().optional().describe("Poznámka"),
      isCreditNote: z
        .boolean()
        .optional()
        .describe("Dobropis (true/false)"),
      partnerName: z
        .string()
        .optional()
        .describe("Název partnera na dokladu"),
      partnerIco: z.string().optional().describe("IČO partnera na dokladu"),
    },
    withErrorHandler(async (params) => {
      const liability = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfIssue: params.dateOfIssue,
        dateOfMaturity: params.dateOfMaturity,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        dateOfVatApplication: params.dateOfVatApplication,
        variableSymbol: params.variableSymbol,
        constantSymbol: params.constantSymbol,
        specificSymbol: params.specificSymbol,
        description: params.description,
        receivedDocumentNumber: params.receivedDocumentNumber,
        note: params.note,
        isCreditNote: params.isCreditNote,
        partnerAddress:
          params.partnerName !== undefined || params.partnerIco !== undefined
            ? cleanInput({
                businessAddress: params.partnerName !== undefined
                  ? { name: params.partnerName }
                  : undefined,
                identificationNumber: params.partnerIco,
              })
            : undefined,
      });

      return executeMutationWithCheck(client, CREATE_LIABILITY, { liability }, "createLiability");
    }),
  );

  server.tool(
    "update_liability",
    "Aktualizuje existující závazek (identifikace dle čísla dokladu a roku)",
    {
      documentNumber: z
        .string()
        .describe("Číslo dokladu pro identifikaci"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const liability = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfIssue: params.dateOfIssue,
        dateOfMaturity: params.dateOfMaturity,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        variableSymbol: params.variableSymbol,
        description: params.description,
        note: params.note,
      });

      return executeMutationWithCheck(client, UPDATE_LIABILITY, { liability }, "updateLiability");
    }),
  );

  server.tool(
    "delete_liability",
    "Smaže závazek",
    {
      id: z.number().describe("ID závazku ke smazání"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const liability = cleanInput({
        id: params.id,
        year: params.year,
      });

      return executeMutationWithCheck(client, DELETE_LIABILITY, { liability }, "deleteLiability");
    }),
  );

  // =========================================================================
  // RECEIVABLES (Pohledávky)
  // =========================================================================

  server.tool(
    "list_receivables",
    "Vypíše pohledávky s filtrováním dle data, čísla dokladu, variabilního symbolu",
    {
      ...documentFilterSchema,
      sortBy: z
        .enum([
          "id",
          "documentNumber",
          "dateOfIssue",
          "dateOfMaturity",
          "totalWithVatHc",
          "remainingAmountToPayHc",
          "year",
        ])
        .default("id")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("ASC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        dateOfIssue: dateRangeFilter(params.dateFrom, params.dateTo),
        documentNumber: eqFilter(params.documentNumber),
        variableSymbol: eqFilter(params.variableSymbol),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_RECEIVABLES,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.receivables.items,
        result.receivables.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  server.tool(
    "get_receivable",
    "Zobrazí detail pohledávky podle ID",
    {
      id: z.number().describe("ID pohledávky"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = { id: { eq: params.id } };
      if (params.year !== undefined) where.year = { eq: params.year };

      const result = await client.query<CollectionResponse>(
        GET_RECEIVABLE,
        { where },
      );

      const item = result.receivables.items[0];
      if (!item) {
        return toolError(
          `Pohledávka s ID ${params.id} nebyla nalezena`,
        );
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_receivable",
    "Vytvoří novou pohledávku",
    {
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfVatApplication: z
        .string()
        .optional()
        .describe("Datum uplatnění DPH (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      constantSymbol: z.string().optional().describe("Konstantní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
      isCreditNote: z
        .boolean()
        .optional()
        .describe("Dobropis (true/false)"),
      partnerName: z
        .string()
        .optional()
        .describe("Název partnera na dokladu"),
      partnerIco: z.string().optional().describe("IČO partnera na dokladu"),
    },
    withErrorHandler(async (params) => {
      const receivable = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfIssue: params.dateOfIssue,
        dateOfMaturity: params.dateOfMaturity,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        dateOfTaxing: params.dateOfTaxing,
        dateOfVatApplication: params.dateOfVatApplication,
        variableSymbol: params.variableSymbol,
        constantSymbol: params.constantSymbol,
        specificSymbol: params.specificSymbol,
        orderNumber: params.orderNumber,
        description: params.description,
        note: params.note,
        isCreditNote: params.isCreditNote,
        partnerAddress:
          params.partnerName !== undefined || params.partnerIco !== undefined
            ? cleanInput({
                businessAddress: params.partnerName !== undefined
                  ? { name: params.partnerName }
                  : undefined,
                identificationNumber: params.partnerIco,
              })
            : undefined,
      });

      return executeMutationWithCheck(client, CREATE_RECEIVABLE, { receivable }, "createReceivable");
    }),
  );

  server.tool(
    "update_receivable",
    "Aktualizuje existující pohledávku (identifikace dle čísla dokladu a roku)",
    {
      documentNumber: z
        .string()
        .describe("Číslo dokladu pro identifikaci"),
      year: z.number().optional().describe("Účetní rok"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      dateOfAccountingEvent: z
        .string()
        .optional()
        .describe("Datum účtování (YYYY-MM-DD)"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
      description: z.string().optional().describe("Popis dokladu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const receivable = cleanInput({
        documentNumber: params.documentNumber,
        year: params.year,
        dateOfIssue: params.dateOfIssue,
        dateOfMaturity: params.dateOfMaturity,
        dateOfAccountingEvent: params.dateOfAccountingEvent,
        variableSymbol: params.variableSymbol,
        orderNumber: params.orderNumber,
        description: params.description,
        note: params.note,
      });

      return executeMutationWithCheck(client, UPDATE_RECEIVABLE, { receivable }, "updateReceivable");
    }),
  );

  server.tool(
    "delete_receivable",
    "Smaže pohledávku",
    {
      id: z.number().describe("ID pohledávky ke smazání"),
      year: z.number().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const receivable = cleanInput({
        id: params.id,
        year: params.year,
      });

      return executeMutationWithCheck(client, DELETE_RECEIVABLE, { receivable }, "deleteReceivable");
    }),
  );
}

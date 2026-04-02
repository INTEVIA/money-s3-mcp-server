import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";

import { toPaginationArgs } from "../helpers/pagination.js";
import { eqFilter, buildWhere, buildOrder } from "../helpers/filters.js";
import {
  toolError,
  toolListResponse,
  toolMutationResponse,
  toolSuccess,
  withErrorHandler,
} from "../helpers/response.js";
import {
  paginationFields,
  cleanInput,
  type CollectionResponse,
  type ImportPromiseResponse,
} from "../helpers/types.js";
import { LIST_COMPANIES, GET_COMPANY } from "../graphql/queries/companies.js";
import {
  CREATE_COMPANY,
  UPDATE_COMPANY,
  DELETE_COMPANY,
} from "../graphql/mutations/companies.js";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCompanyTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // -------------------------------------------------------------------------
  // list_companies
  // -------------------------------------------------------------------------
  server.tool(
    "list_companies",
    "Vypíše firmy z adresáře s filtrováním dle IČO, názvu, kódu a dalších parametrů",
    {
      ...paginationFields,
      identificationNumber: z
        .string()
        .optional()
        .describe("IČO firmy pro filtrování"),
      vatIdentificationNumber: z
        .string()
        .optional()
        .describe("DIČ firmy pro filtrování"),
      name: z
        .string()
        .optional()
        .describe("Název firmy (hledá v obchodní adrese)"),
      code: z
        .string()
        .optional()
        .describe("Kód partnera"),
      email: z
        .string()
        .optional()
        .describe("E-mail firmy"),
      sortBy: z
        .enum([
          "id",
          "identificationNumber",
          "code",
          "email",
          "lastChangeDate",
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
        identificationNumber: eqFilter(params.identificationNumber),
        vatIdentificationNumber: eqFilter(params.vatIdentificationNumber),
        code: eqFilter(params.code),
        email: eqFilter(params.email),
        businessAddress: params.name
          ? { name: { eq: params.name } }
          : undefined,
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_COMPANIES, {
        skip,
        take,
        where,
        order,
      });

      return toolListResponse(
        result.companies.items,
        result.companies.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // get_company
  // -------------------------------------------------------------------------
  server.tool(
    "get_company",
    "Zobrazí detail firmy z adresáře podle ID",
    {
      id: z.number().describe("ID firmy"),
    },
    withErrorHandler(async (params) => {
      const result = await client.query<CollectionResponse>(GET_COMPANY, {
        where: { id: { eq: params.id } },
      });

      const item = result.companies.items[0];
      if (!item) {
        return toolError(`Firma s ID ${params.id} nebyla nalezena`);
      }
      return toolSuccess(item);
    }),
  );

  // -------------------------------------------------------------------------
  // create_company
  // -------------------------------------------------------------------------
  server.tool(
    "create_company",
    "Vytvoří novou firmu v adresáři",
    {
      name: z.string().describe("Název firmy (obchodní adresa)"),
      street: z.string().optional().describe("Ulice (obchodní adresa)"),
      municipality: z
        .string()
        .optional()
        .describe("Město (obchodní adresa)"),
      identificationNumber: z.string().optional().describe("IČO"),
      vatIdentificationNumber: z.string().optional().describe("DIČ"),
      isVatPayer: z
        .boolean()
        .optional()
        .describe("Plátce DPH"),
      isPerson: z
        .boolean()
        .optional()
        .describe("Fyzická osoba"),
      email: z.string().optional().describe("E-mail"),
      phoneNumber: z.string().optional().describe("Telefonní číslo"),
      mobileNumber: z.string().optional().describe("Mobilní číslo"),
      www: z.string().optional().describe("Webová adresa"),
      bankName: z.string().optional().describe("Název banky"),
      accountNumber: z.string().optional().describe("Číslo účtu"),
      bankCode: z.string().optional().describe("Kód banky"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      code: z.string().optional().describe("Kód partnera"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const company = cleanInput({
        businessAddress: cleanInput({
          name: params.name,
          street: params.street,
          municipality: params.municipality,
        }),
        identificationNumber: params.identificationNumber,
        vatIdentificationNumber: params.vatIdentificationNumber,
        isVatPayer: params.isVatPayer,
        isPerson: params.isPerson,
        email: params.email,
        phoneNumber: params.phoneNumber,
        mobileNumber: params.mobileNumber,
        www: params.www,
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        variableSymbol: params.variableSymbol,
        code: params.code,
        note: params.note,
      });

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_COMPANY,
        { company },
      );

      if (!result.createCompany.isSuccess) {
        return toolError("Požadavek na vytvoření firmy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createCompany.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // update_company
  // -------------------------------------------------------------------------
  server.tool(
    "update_company",
    "Aktualizuje existující firmu v adresáři",
    {
      guid: z.string().describe("GUID firmy (UUID)"),
      name: z
        .string()
        .optional()
        .describe("Nový název firmy (obchodní adresa)"),
      street: z.string().optional().describe("Ulice (obchodní adresa)"),
      municipality: z
        .string()
        .optional()
        .describe("Město (obchodní adresa)"),
      identificationNumber: z.string().optional().describe("IČO"),
      vatIdentificationNumber: z.string().optional().describe("DIČ"),
      isVatPayer: z
        .boolean()
        .optional()
        .describe("Plátce DPH"),
      isPerson: z
        .boolean()
        .optional()
        .describe("Fyzická osoba"),
      email: z.string().optional().describe("E-mail"),
      phoneNumber: z.string().optional().describe("Telefonní číslo"),
      mobileNumber: z.string().optional().describe("Mobilní číslo"),
      www: z.string().optional().describe("Webová adresa"),
      bankName: z.string().optional().describe("Název banky"),
      accountNumber: z.string().optional().describe("Číslo účtu"),
      bankCode: z.string().optional().describe("Kód banky"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      code: z.string().optional().describe("Kód partnera"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const company: Record<string, unknown> = {
        guid: params.guid,
      };

      // Build business address if any address fields provided (use !== undefined
      // so that empty strings can be sent to clear fields).
      if (
        params.name !== undefined ||
        params.street !== undefined ||
        params.municipality !== undefined
      ) {
        company.businessAddress = cleanInput({
          name: params.name,
          street: params.street,
          municipality: params.municipality,
        });
      }

      if (params.identificationNumber !== undefined)
        company.identificationNumber = params.identificationNumber;
      if (params.vatIdentificationNumber !== undefined)
        company.vatIdentificationNumber = params.vatIdentificationNumber;
      if (params.isVatPayer !== undefined)
        company.isVatPayer = params.isVatPayer;
      if (params.isPerson !== undefined)
        company.isPerson = params.isPerson;
      if (params.email !== undefined)
        company.email = params.email;
      if (params.phoneNumber !== undefined)
        company.phoneNumber = params.phoneNumber;
      if (params.mobileNumber !== undefined)
        company.mobileNumber = params.mobileNumber;
      if (params.www !== undefined)
        company.www = params.www;
      if (params.bankName !== undefined)
        company.bankName = params.bankName;
      if (params.accountNumber !== undefined)
        company.accountNumber = params.accountNumber;
      if (params.bankCode !== undefined)
        company.bankCode = params.bankCode;
      if (params.variableSymbol !== undefined)
        company.variableSymbol = params.variableSymbol;
      if (params.code !== undefined)
        company.code = params.code;
      if (params.note !== undefined)
        company.note = params.note;

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_COMPANY,
        { company },
      );

      if (!result.updateCompany.isSuccess) {
        return toolError("Požadavek na aktualizaci firmy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateCompany.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // delete_company
  // -------------------------------------------------------------------------
  server.tool(
    "delete_company",
    "Smaže firmu z adresáře",
    {
      id: z.number().describe("ID firmy ke smazání"),
    },
    withErrorHandler(async (params) => {
      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_COMPANY,
        { company: { id: params.id } },
      );

      if (!result.deleteCompany.isSuccess) {
        return toolError("Požadavek na smazání firmy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteCompany.guid);
      return toolMutationResponse(importResult);
    }),
  );
}

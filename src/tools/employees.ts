import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";

import { toPaginationArgs } from "../helpers/pagination.js";
import { buildWhere, buildOrder } from "../helpers/filters.js";
import {
  toolError,
  toolListResponse,
  toolMutationResponse,
  toolSuccess,
  withErrorHandler,
} from "../helpers/response.js";
import {
  paginationFields,
  type CollectionResponse,
  type ImportPromiseResponse,
} from "../helpers/types.js";
import {
  LIST_EMPLOYEES,
  GET_EMPLOYEE,
  LIST_EMPLOYMENT_TYPES,
  LIST_EMPLOYMENT_CODES,
} from "../graphql/queries/employees.js";
import {
  CREATE_WAGE,
  UPDATE_WAGE,
  DELETE_WAGE,
} from "../graphql/mutations/employees.js";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerEmployeeTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // -------------------------------------------------------------------------
  // list_employees
  // -------------------------------------------------------------------------
  server.tool(
    "list_employees",
    "Vypíše zaměstnance s filtrováním dle příjmení, jména, osobního čísla",
    {
      ...paginationFields,
      lastName: z
        .string()
        .optional()
        .describe("Příjmení zaměstnance (obsahuje)"),
      firstName: z
        .string()
        .optional()
        .describe("Jméno zaměstnance (obsahuje)"),
      personalNumber: z
        .string()
        .optional()
        .describe("Osobní číslo zaměstnance (obsahuje)"),
      sortBy: z
        .enum(["id", "lastName", "firstName", "personalNumber", "lastChange"])
        .default("lastName")
        .describe("Pole pro řazení"),
      sortDirection: z
        .enum(["ASC", "DESC"])
        .default("ASC")
        .describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        lastName: params.lastName
          ? { contains: params.lastName }
          : undefined,
        firstName: params.firstName
          ? { contains: params.firstName }
          : undefined,
        personalNumber: params.personalNumber
          ? { contains: params.personalNumber }
          : undefined,
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_EMPLOYEES,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.employees.items,
        result.employees.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // get_employee
  // -------------------------------------------------------------------------
  server.tool(
    "get_employee",
    "Zobrazí detail zaměstnance podle ID včetně časových období a pracovních poměrů",
    {
      id: z.number().describe("ID zaměstnance"),
    },
    withErrorHandler(async (params) => {
      const result = await client.query<CollectionResponse>(
        GET_EMPLOYEE,
        { where: { id: { eq: params.id } } },
      );

      const item = result.employees.items[0];
      if (!item) {
        return toolError(
          `Zaměstnanec s ID ${params.id} nebyl nalezen`,
        );
      }
      return toolSuccess(item);
    }),
  );

  // -------------------------------------------------------------------------
  // list_employment_types
  // -------------------------------------------------------------------------
  server.tool(
    "list_employment_types",
    "Vypíše typy pracovních poměrů",
    {
      ...paginationFields,
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const result = await client.query<CollectionResponse>(
        LIST_EMPLOYMENT_TYPES,
        { skip, take },
      );

      return toolListResponse(
        result.employmentType.items,
        result.employmentType.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // list_employment_codes
  // -------------------------------------------------------------------------
  server.tool(
    "list_employment_codes",
    "Vypíše kódy pracovních poměrů (ČSSZ)",
    {
      ...paginationFields,
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const result = await client.query<CollectionResponse>(
        LIST_EMPLOYMENT_CODES,
        { skip, take },
      );

      return toolListResponse(
        result.employmentCode.items,
        result.employmentCode.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // create_wage
  // -------------------------------------------------------------------------
  server.tool(
    "create_wage",
    "Vytvoří mzdu pro zaměstnance za daný měsíc a rok",
    {
      personalNumber: z
        .string()
        .describe("Osobní číslo zaměstnance"),
      year: z.number().describe("Rok mzdy"),
      month: z.number().min(1).max(12).describe("Měsíc mzdy (1-12)"),
      note: z.string().optional().describe("Poznámka ke mzdě"),
      employmentRelationships: z
        .array(
          z.object({
            id: z.number().optional().describe("ID pracovního poměru"),
            workingDays: z
              .number()
              .optional()
              .describe("Počet pracovních dnů"),
            workingHours: z
              .number()
              .optional()
              .describe("Počet pracovních hodin"),
            workedDays: z
              .number()
              .optional()
              .describe("Počet odpracovaných dnů"),
            workedHours: z
              .number()
              .optional()
              .describe("Počet odpracovaných hodin"),
          }),
        )
        .optional()
        .describe("Seznam pracovních poměrů se mzdovými údaji"),
    },
    withErrorHandler(async (params) => {
      const wage: Record<string, unknown> = {
        employee: { personalNumber: params.personalNumber },
        year: params.year,
        month: params.month,
      };
      if (params.note !== undefined) wage.note = params.note;
      if (params.employmentRelationships !== undefined) {
        wage.employmentRelationships = params.employmentRelationships;
      }

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_WAGE,
        { wage },
      );

      if (!result.createWage.isSuccess) {
        return toolError("Požadavek na vytvoření mzdy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.createWage.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // update_wage
  // -------------------------------------------------------------------------
  server.tool(
    "update_wage",
    "Aktualizuje mzdu zaměstnance za daný měsíc a rok",
    {
      personalNumber: z
        .string()
        .describe("Osobní číslo zaměstnance"),
      year: z.number().describe("Rok mzdy"),
      month: z.number().min(1).max(12).describe("Měsíc mzdy (1-12)"),
      note: z.string().optional().describe("Poznámka ke mzdě"),
      employmentRelationships: z
        .array(
          z.object({
            id: z.number().optional().describe("ID pracovního poměru"),
            workingDays: z
              .number()
              .optional()
              .describe("Počet pracovních dnů"),
            workingHours: z
              .number()
              .optional()
              .describe("Počet pracovních hodin"),
            workedDays: z
              .number()
              .optional()
              .describe("Počet odpracovaných dnů"),
            workedHours: z
              .number()
              .optional()
              .describe("Počet odpracovaných hodin"),
          }),
        )
        .optional()
        .describe("Seznam pracovních poměrů se mzdovými údaji"),
    },
    withErrorHandler(async (params) => {
      const wage: Record<string, unknown> = {
        employee: { personalNumber: params.personalNumber },
        year: params.year,
        month: params.month,
      };
      if (params.note !== undefined) wage.note = params.note;
      if (params.employmentRelationships !== undefined) {
        wage.employmentRelationships = params.employmentRelationships;
      }

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_WAGE,
        { wage },
      );

      if (!result.updateWage.isSuccess) {
        return toolError("Požadavek na aktualizaci mzdy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.updateWage.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // delete_wage
  // -------------------------------------------------------------------------
  server.tool(
    "delete_wage",
    "Smaže mzdu zaměstnance podle ID",
    {
      id: z.number().describe("ID mzdy ke smazání"),
    },
    withErrorHandler(async (params) => {
      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_WAGE,
        { wage: { id: params.id } },
      );

      if (!result.deleteWage.isSuccess) {
        return toolError("Požadavek na smazání mzdy nebyl přijat");
      }

      const importResult = await client.waitForImport(result.deleteWage.guid);
      return toolMutationResponse(importResult);
    }),
  );
}

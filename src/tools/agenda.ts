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
  type YearsResponse,
} from "../helpers/types.js";
import {
  LIST_AGENDAS,
  LIST_YEARS,
  LIST_JOB_ORDERS,
  GET_JOB_ORDER,
  LIST_JOB_ORDER_TYPES,
  LIST_ESHOPS,
  LIST_ACTIVITIES,
} from "../graphql/queries/agenda.js";
import {
  CREATE_JOB_ORDER,
  UPDATE_JOB_ORDER,
  DELETE_JOB_ORDER,
} from "../graphql/mutations/agenda.js";

export function registerAgendaTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  server.tool(
    "list_agendas",
    "Vypíše dostupné agendy (firmy) v systému Money S3. Funguje i bez nastavené agendy.",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.queryWithoutAgenda<CollectionResponse>(LIST_AGENDAS, { skip, take });
      return toolListResponse(result.agendas.items, result.agendas.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "switch_agenda",
    "Přepne aktivní agendu (firmu). Všechny následující operace budou pracovat s touto agendou.",
    {
      agendaGuid: z.string().uuid().describe("GUID agendy (získáte z list_agendas)"),
    },
    withErrorHandler(async (params) => {
      client.setAgendaGuid(params.agendaGuid);
      return toolSuccess({ agendaGuid: params.agendaGuid, message: `Agenda přepnuta na ${params.agendaGuid}` });
    }),
  );

  server.tool(
    "get_current_agenda",
    "Zobrazí aktuálně nastavenou agendu (GUID)",
    {},
    withErrorHandler(async () => {
      const guid = client.getAgendaGuid();
      if (!guid) {
        return toolError("Žádná agenda není nastavena. Použijte switch_agenda.");
      }
      return toolSuccess({ agendaGuid: guid });
    }),
  );

  server.tool(
    "list_years",
    "Vypíše účetní roky aktuální agendy (vrátí pole, ne stránkovanou kolekci)",
    {},
    withErrorHandler(async () => {
      const result = await client.query<YearsResponse>(LIST_YEARS);
      return toolSuccess({ items: result.years, totalCount: result.years.length });
    }),
  );

  server.tool(
    "list_job_orders",
    "Vypíše zakázky s filtrování dle zkratky, názvu a stavu",
    {
      ...paginationFields,
      shortCut: z.string().optional().describe("Zkratka zakázky (obsahuje)"),
      name: z.string().optional().describe("Název zakázky (obsahuje)"),
      state: z.enum(["PRELIMINARY", "PLANNED", "LAUNCHED", "STARTED", "TRANSMITED", "CLOSED"]).optional().describe("Stav zakázky"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: z.enum(["shortCut", "name", "lastChange", "year"]).default("shortCut").describe("Pole pro řazení"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);

      const where = buildWhere({
        shortCut: params.shortCut ? { contains: params.shortCut } : undefined,
        name: params.name ? { contains: params.name } : undefined,
        state: eqFilter(params.state),
        year: eqFilter(params.year),
      });

      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_JOB_ORDERS, { skip, take, where, order });
      return toolListResponse(result.jobOrders.items, result.jobOrders.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "get_job_order",
    "Zobrazí detail zakázky podle zkratky včetně aktivit",
    { shortCut: z.string().describe("Zkratka zakázky") },
    withErrorHandler(async (params) => {
      const result = await client.query<CollectionResponse>(GET_JOB_ORDER, {
        where: { shortCut: { eq: params.shortCut } },
      });

      const item = result.jobOrders.items[0];
      if (!item) {
        return toolError(`Zakázka se zkratkou '${params.shortCut}' nebyla nalezena`);
      }
      return toolSuccess(item);
    }),
  );

  server.tool(
    "create_job_order",
    "Vytvoří novou zakázku",
    {
      shortCut: z.string().describe("Zkratka zakázky (povinné)"),
      name: z.string().optional().describe("Název zakázky"),
      note: z.string().optional().describe("Poznámka"),
      isBusinessCase: z.boolean().optional().describe("Obchodní případ"),
      state: z.enum(["PRELIMINARY", "PLANNED", "LAUNCHED", "STARTED", "TRANSMITED", "CLOSED"]).optional().describe("Stav zakázky"),
      dateOfPlannedStart: z.string().optional().describe("Datum plánového zahájení (ISO formát)"),
      dateOfStart: z.string().optional().describe("Datum zahájení (ISO formát)"),
      dateOfPlannedHandOver: z.string().optional().describe("Datum plánovaného předání (ISO formát)"),
      dateOfHandOver: z.string().optional().describe("Datum předání (ISO formát)"),
      warrantyTo: z.string().optional().describe("Záruka do (ISO formát)"),
      responsibleEmployee: z.string().optional().describe("Odpovědný zaměstnanec"),
      jobOrderTypeShortCut: z.string().optional().describe("Zkratka typu zakázky"),
      rating: z.string().optional().describe("Hodnocení"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
    },
    withErrorHandler(async (params) => {
      const jobOrder: Record<string, unknown> = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
        isBusinessCase: params.isBusinessCase,
        state: params.state,
        dateOfPlannedStart: params.dateOfPlannedStart,
        dateOfStart: params.dateOfStart,
        dateOfPlannedHandOver: params.dateOfPlannedHandOver,
        dateOfHandOver: params.dateOfHandOver,
        warrantyTo: params.warrantyTo,
        responsibleEmployee: params.responsibleEmployee,
        rating: params.rating,
        orderNumber: params.orderNumber,
      });
      if (params.jobOrderTypeShortCut !== undefined) {
        jobOrder.jobOrderType = { shortCut: params.jobOrderTypeShortCut };
      }

      const result = await client.mutate<ImportPromiseResponse>(CREATE_JOB_ORDER, { jobOrder });
      const promise = result.createJobOrder;
      if (!promise.isSuccess) {
        return toolError("Požadavek na vytvoření zakázky nebyl přijat");
      }
      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "update_job_order",
    "Aktualizuje existující zakázku (identifikace dle zkratky)",
    {
      shortCut: z.string().describe("Zkratka zakázky (identifikátor)"),
      name: z.string().optional().describe("Nový název zakázky"),
      note: z.string().optional().describe("Poznámka"),
      isBusinessCase: z.boolean().optional().describe("Obchodní případ"),
      state: z.enum(["PRELIMINARY", "PLANNED", "LAUNCHED", "STARTED", "TRANSMITED", "CLOSED"]).optional().describe("Stav zakázky"),
      dateOfPlannedStart: z.string().optional().describe("Datum plánového zahájení (ISO formát)"),
      dateOfStart: z.string().optional().describe("Datum zahájení (ISO formát)"),
      dateOfPlannedHandOver: z.string().optional().describe("Datum plánovaného předání (ISO formát)"),
      dateOfHandOver: z.string().optional().describe("Datum předání (ISO formát)"),
      warrantyTo: z.string().optional().describe("Záruka do (ISO formát)"),
      responsibleEmployee: z.string().optional().describe("Odpovědný zaměstnanec"),
      jobOrderTypeShortCut: z.string().optional().describe("Zkratka typu zakázky"),
      rating: z.string().optional().describe("Hodnocení"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
    },
    withErrorHandler(async (params) => {
      const jobOrder: Record<string, unknown> = cleanInput({
        shortCut: params.shortCut,
        name: params.name,
        note: params.note,
        isBusinessCase: params.isBusinessCase,
        state: params.state,
        dateOfPlannedStart: params.dateOfPlannedStart,
        dateOfStart: params.dateOfStart,
        dateOfPlannedHandOver: params.dateOfPlannedHandOver,
        dateOfHandOver: params.dateOfHandOver,
        warrantyTo: params.warrantyTo,
        responsibleEmployee: params.responsibleEmployee,
        rating: params.rating,
        orderNumber: params.orderNumber,
      });
      if (params.jobOrderTypeShortCut !== undefined) {
        jobOrder.jobOrderType = { shortCut: params.jobOrderTypeShortCut };
      }

      const result = await client.mutate<ImportPromiseResponse>(UPDATE_JOB_ORDER, { jobOrder });
      const promise = result.updateJobOrder;
      if (!promise.isSuccess) {
        return toolError("Požadavek na aktualizaci zakázky nebyl přijat");
      }
      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "delete_job_order",
    "Smaže zakázku podle ID",
    {
      id: z.number().describe("ID zakázky ke smazání"),
      year: z.number().optional().describe("Účetní rok zakázky"),
    },
    withErrorHandler(async (params) => {
      const jobOrder = cleanInput({ id: params.id, year: params.year });

      const result = await client.mutate<ImportPromiseResponse>(DELETE_JOB_ORDER, { jobOrder });
      const promise = result.deleteJobOrder;
      if (!promise.isSuccess) {
        return toolError("Požadavek na smazání zakázky nebyl přijat");
      }
      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  server.tool(
    "list_job_order_types",
    "Vypíše typy zakázek",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.query<CollectionResponse>(LIST_JOB_ORDER_TYPES, { skip, take });
      return toolListResponse(result.jobOrderTypes.items, result.jobOrderTypes.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_eshops",
    "Vypíše e-shopy připojené k agendě",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.query<CollectionResponse>(LIST_ESHOPS, { skip, take });
      return toolListResponse(result.eshops.items, result.eshops.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "list_activities",
    "Vypíše aktivity (události a činnosti) v systému",
    paginationFields,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const result = await client.query<CollectionResponse>(LIST_ACTIVITIES, { skip, take });
      return toolListResponse(result.activities.items, result.activities.totalCount, params.page, params.pageSize);
    }),
  );
}

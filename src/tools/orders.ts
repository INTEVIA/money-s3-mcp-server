/**
 * MCP tool definitions for order domain:
 * orders, offers, and inquiries (received + issued).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import {
  LIST_RECEIVED_ORDERS,
  LIST_ISSUED_ORDERS,
  LIST_RECEIVED_OFFERS,
  LIST_ISSUED_OFFERS,
  LIST_RECEIVED_INQUIRIES,
  LIST_ISSUED_INQUIRIES,
  LIST_SERVICES,
  LIST_REPAIRS,
} from "../graphql/queries/orders.js";
import {
  CREATE_RECEIVED_ORDER,
  UPDATE_RECEIVED_ORDER,
  DELETE_RECEIVED_ORDER,
  CREATE_ISSUED_ORDER,
  UPDATE_ISSUED_ORDER,
  DELETE_ISSUED_ORDER,
  CREATE_RECEIVED_OFFER,
  UPDATE_RECEIVED_OFFER,
  DELETE_RECEIVED_OFFER,
  CREATE_ISSUED_OFFER,
  UPDATE_ISSUED_OFFER,
  DELETE_ISSUED_OFFER,
  CREATE_RECEIVED_INQUIRY,
  UPDATE_RECEIVED_INQUIRY,
  DELETE_RECEIVED_INQUIRY,
  CREATE_ISSUED_INQUIRY,
  UPDATE_ISSUED_INQUIRY,
  DELETE_ISSUED_INQUIRY,
} from "../graphql/mutations/orders.js";
import { toPaginationArgs } from "../helpers/pagination.js";
import { buildWhere, buildOrder, dateRangeFilter, eqFilter } from "../helpers/filters.js";
import { toolError, toolListResponse, withErrorHandler } from "../helpers/response.js";
import { executeMutationWithCheck } from "../helpers/mutation.js";
import {
  paginationFields,
  cleanInput,
  type CollectionResponse,
} from "../helpers/types.js";

// ── Shared Zod schemas ─────────────────────────────────────────────────────

const orderDocumentItemSchema = z.object({
  description: z.string().describe("Popis položky"),
  amount: z.number().optional().describe("Počet měrných jednotek (množství)"),
  unitPriceHc: z.number().optional().describe("Jednotková cena v domácí měně"),
  unitPrice: z.number().optional().describe("Jednotková cena v měně dokladu"),
  vatRate: z.number().optional().describe("Sazba DPH (%)"),
  priceType: z.enum(["WITHOUT_VAT", "WITH_VAT"]).optional().describe("Typ ceny"),
  discountPercentage: z.number().optional().describe("Sleva na položce (%)"),
  note: z.string().optional().describe("Poznámka k položce"),
  warehouseCode: z.string().optional().describe("Kód skladu pro položku"),
  articleGuid: z.string().optional().describe("GUID artiklu pro položku"),
  shortCut: z.string().optional().describe("Zkratka položky"),
  amountUnit: z.string().optional().describe("Měrná jednotka (např. ks, kg)"),
  dateOfSettleBy: z.string().optional().describe("Datum vyřízení do (YYYY-MM-DD)"),
  estimatedPurchasePrice: z.number().optional().describe("Předpokládaná nákupní cena"),
});

type OrderDocumentItemParams = z.infer<typeof orderDocumentItemSchema>;

function buildOrderDocumentItemInput(item: OrderDocumentItemParams): Record<string, unknown> {
  const input: Record<string, unknown> = { description: item.description };
  if (item.amount !== undefined) input.amount = item.amount;
  if (item.unitPriceHc !== undefined) input.unitPriceHc = item.unitPriceHc;
  if (item.unitPrice !== undefined) input.unitPrice = item.unitPrice;
  if (item.vatRate !== undefined) input.vatRate = item.vatRate;
  if (item.priceType !== undefined) input.priceType = item.priceType;
  if (item.discountPercentage !== undefined) input.discountPercentage = item.discountPercentage;
  if (item.note !== undefined) input.note = item.note;
  if (item.shortCut !== undefined) input.shortCut = item.shortCut;
  if (item.amountUnit !== undefined) input.amountUnit = item.amountUnit;
  if (item.dateOfSettleBy !== undefined) input.dateOfSettleBy = item.dateOfSettleBy;
  if (item.estimatedPurchasePrice !== undefined) input.estimatedPurchasePrice = item.estimatedPurchasePrice;
  if (item.warehouseCode !== undefined) input.warehouse = { code: item.warehouseCode };
  if (item.articleGuid !== undefined) input.article = { guid: item.articleGuid };
  return input;
}

const orderDocumentFilterSchema = {
  ...paginationFields,
  dateFrom: z.string().optional().describe("Datum vystavení od (YYYY-MM-DD)"),
  dateTo: z.string().optional().describe("Datum vystavení do (YYYY-MM-DD)"),
  documentNumber: z.string().optional().describe("Číslo dokladu (přesná shoda)"),
  variableSymbol: z.string().optional().describe("Variabilní symbol (přesná shoda)"),
  description: z.string().optional().describe("Popis dokladu (přesná shoda)"),
  partnerIco: z.string().optional().describe("IČO partnera (přesná shoda)"),
  year: z.number().int().optional().describe("Účetní rok"),
  sortBy: z.enum(["dateOfIssue", "documentNumber", "dateOfSettleBy"]).default("dateOfIssue").describe("Řazení podle"),
  sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
};

function buildOrderDocumentWhere(params: {
  dateFrom?: string; dateTo?: string; documentNumber?: string;
  variableSymbol?: string; description?: string; partnerIco?: string; year?: number;
}): Record<string, unknown> | undefined {
  return buildWhere({
    dateOfIssue: dateRangeFilter(params.dateFrom, params.dateTo),
    documentNumber: eqFilter(params.documentNumber),
    variableSymbol: eqFilter(params.variableSymbol),
    description: eqFilter(params.description),
    year: eqFilter(params.year),
    partnerAddress: params.partnerIco
      ? { identificationNumber: eqFilter(params.partnerIco) }
      : undefined,
  });
}

const orderDocumentInputSchema = z.object({
  documentNumber: z.string().optional().describe("Číslo dokladu"),
  description: z.string().optional().describe("Popis dokladu"),
  dateOfIssue: z.string().describe("Datum vystavení (YYYY-MM-DD)"),
  dateOfSettleBy: z.string().optional().describe("Datum vyřízení do (YYYY-MM-DD)"),
  dateOfSettled: z.string().optional().describe("Datum vyřízení (YYYY-MM-DD)"),
  dateOfSettleFirst: z.string().optional().describe("Datum zahájení vyřízení od (YYYY-MM-DD)"),
  note: z.string().optional().describe("Poznámka"),
  variableSymbol: z.string().optional().describe("Variabilní symbol"),
  receivedDocumentNumber: z.string().optional().describe("Číslo přijatého dokladu"),
  paymentMethod: z.string().optional().describe("Způsob platby"),
  shippingMethod: z.string().optional().describe("Způsob dopravy"),
  numericalSeriePrefix: z.string().optional().describe("Prefix číselné řady"),
  centreShortCut: z.string().optional().describe("Zkratka střediska"),
  jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
  operationShortCut: z.string().optional().describe("Zkratka činnosti"),
  currencyCode: z.string().optional().describe("Kód měny (např. EUR)"),
  partnerIdentificationNumber: z.string().optional().describe("IČO partnera"),
  partnerName: z.string().optional().describe("Název partnera"),
  items: z.array(orderDocumentItemSchema).optional().describe("Položky dokladu"),
});

type OrderDocumentInputParams = z.infer<typeof orderDocumentInputSchema>;

function buildOrderDocumentInput(params: OrderDocumentInputParams): Record<string, unknown> {
  const input: Record<string, unknown> = { dateOfIssue: params.dateOfIssue };
  if (params.documentNumber !== undefined) input.documentNumber = params.documentNumber;
  if (params.description !== undefined) input.description = params.description;
  if (params.dateOfSettleBy !== undefined) input.dateOfSettleBy = params.dateOfSettleBy;
  if (params.dateOfSettled !== undefined) input.dateOfSettled = params.dateOfSettled;
  if (params.dateOfSettleFirst !== undefined) input.dateOfSettleFirst = params.dateOfSettleFirst;
  if (params.note !== undefined) input.note = params.note;
  if (params.variableSymbol !== undefined) input.variableSymbol = params.variableSymbol;
  if (params.receivedDocumentNumber !== undefined) input.receivedDocumentNumber = params.receivedDocumentNumber;
  if (params.paymentMethod !== undefined) input.paymentMethod = params.paymentMethod;
  if (params.shippingMethod !== undefined) input.shippingMethod = params.shippingMethod;
  if (params.numericalSeriePrefix !== undefined) input.numericalSerie = { prefix: params.numericalSeriePrefix };
  if (params.centreShortCut !== undefined) input.centre = { shortCut: params.centreShortCut };
  if (params.jobOrderShortCut !== undefined) input.jobOrder = { shortCut: params.jobOrderShortCut };
  if (params.operationShortCut !== undefined) input.operation = { shortCut: params.operationShortCut };
  if (params.currencyCode !== undefined) input.currency = { code: params.currencyCode };
  if (params.partnerIdentificationNumber !== undefined || params.partnerName !== undefined) {
    input.partnerAddress = cleanInput({
      identificationNumber: params.partnerIdentificationNumber,
      businessAddress: params.partnerName !== undefined ? { name: params.partnerName } : undefined,
    });
  }
  if (params.items) input.items = params.items.map(buildOrderDocumentItemInput);
  return input;
}

const orderDocumentUpdateSchema = orderDocumentInputSchema.extend({
  id: z.number().int().describe("ID dokladu k aktualizaci"),
  year: z.number().int().optional().describe("Účetní rok dokladu"),
});

type OrderDocumentUpdateParams = z.infer<typeof orderDocumentUpdateSchema>;

function buildOrderDocumentUpdateInput(params: OrderDocumentUpdateParams): Record<string, unknown> {
  const input = buildOrderDocumentInput(params);
  input.id = params.id;
  if (params.year !== undefined) input.year = params.year;
  return input;
}

// ── Register all order tools ────────────────────────────────────────────────

export function registerOrderTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // ── Received Orders ──────────────────────────────────────────────────

  server.tool(
    "list_received_orders",
    "Vypíše přijaté objednávky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_RECEIVED_ORDERS, { skip, take, where, order });
      return toolListResponse(result.receivedOrders.items, result.receivedOrders.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_received_order",
    "Vytvoří přijatou objednávku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const receivedOrder = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_RECEIVED_ORDER, { receivedOrder }, "createReceivedOrder");
    }),
  );

  server.tool(
    "update_received_order",
    "Aktualizuje přijatou objednávku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const receivedOrder = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_RECEIVED_ORDER, { receivedOrder }, "updateReceivedOrder");
    }),
  );

  server.tool(
    "delete_received_order",
    "Smaže přijatou objednávku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const receivedOrder = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_RECEIVED_ORDER, { receivedOrder }, "deleteReceivedOrder");
    }),
  );

  // ── Issued Orders ─────────────────────────────────────────────────────

  server.tool(
    "list_issued_orders",
    "Vypíše vydané objednávky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_ISSUED_ORDERS, { skip, take, where, order });
      return toolListResponse(result.issuedOrders.items, result.issuedOrders.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_issued_order",
    "Vytvoří vydanou objednávku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const issuedOrder = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_ISSUED_ORDER, { issuedOrder }, "createIssuedOrder");
    }),
  );

  server.tool(
    "update_issued_order",
    "Aktualizuje vydanou objednávku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const issuedOrder = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_ISSUED_ORDER, { issuedOrder }, "updateIssuedOrder");
    }),
  );

  server.tool(
    "delete_issued_order",
    "Smaže vydanou objednávku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const issuedOrder = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_ISSUED_ORDER, { issuedOrder }, "deleteIssuedOrder");
    }),
  );

  // ── Received Offers ───────────────────────────────────────────────────

  server.tool(
    "list_received_offers",
    "Vypíše přijaté nabídky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_RECEIVED_OFFERS, { skip, take, where, order });
      return toolListResponse(result.receivedOffers.items, result.receivedOffers.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_received_offer",
    "Vytvoří přijatou nabídku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const receivedOffer = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_RECEIVED_OFFER, { receivedOffer }, "createReceivedOffer");
    }),
  );

  server.tool(
    "update_received_offer",
    "Aktualizuje přijatou nabídku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const receivedOffer = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_RECEIVED_OFFER, { receivedOffer }, "updateReceivedOffer");
    }),
  );

  server.tool(
    "delete_received_offer",
    "Smaže přijatou nabídku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const receivedOffer = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_RECEIVED_OFFER, { receivedOffer }, "deleteReceivedOffer");
    }),
  );

  // ── Issued Offers ─────────────────────────────────────────────────────

  server.tool(
    "list_issued_offers",
    "Vypíše vydané nabídky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_ISSUED_OFFERS, { skip, take, where, order });
      return toolListResponse(result.issuedOffers.items, result.issuedOffers.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_issued_offer",
    "Vytvoří vydanou nabídku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const issuedOffer = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_ISSUED_OFFER, { issuedOffer }, "createIssuedOffer");
    }),
  );

  server.tool(
    "update_issued_offer",
    "Aktualizuje vydanou nabídku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const issuedOffer = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_ISSUED_OFFER, { issuedOffer }, "updateIssuedOffer");
    }),
  );

  server.tool(
    "delete_issued_offer",
    "Smaže vydanou nabídku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const issuedOffer = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_ISSUED_OFFER, { issuedOffer }, "deleteIssuedOffer");
    }),
  );

  // ── Received Inquiries ────────────────────────────────────────────────

  server.tool(
    "list_received_inquiries",
    "Vypíše přijaté poptávky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_RECEIVED_INQUIRIES, { skip, take, where, order });
      return toolListResponse(result.receivedInquiries.items, result.receivedInquiries.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_received_inquiry",
    "Vytvoří přijatou poptávku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const receivedInquiry = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_RECEIVED_INQUIRY, { receivedInquiry }, "createReceivedInquiry");
    }),
  );

  server.tool(
    "update_received_inquiry",
    "Aktualizuje přijatou poptávku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const receivedInquiry = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_RECEIVED_INQUIRY, { receivedInquiry }, "updateReceivedInquiry");
    }),
  );

  server.tool(
    "delete_received_inquiry",
    "Smaže přijatou poptávku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const receivedInquiry = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_RECEIVED_INQUIRY, { receivedInquiry }, "deleteReceivedInquiry");
    }),
  );

  // ── Issued Inquiries ──────────────────────────────────────────────────

  server.tool(
    "list_issued_inquiries",
    "Vypíše vydané poptávky s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_ISSUED_INQUIRIES, { skip, take, where, order });
      return toolListResponse(result.issuedInquiries.items, result.issuedInquiries.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_issued_inquiry",
    "Vytvoří vydanou poptávku. Zadej datum vystavení, položky a další údaje.",
    orderDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const issuedInquiry = buildOrderDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_ISSUED_INQUIRY, { issuedInquiry }, "createIssuedInquiry");
    }),
  );

  server.tool(
    "update_issued_inquiry",
    "Aktualizuje vydanou poptávku. Zadej ID dokladu a pole k aktualizaci.",
    orderDocumentUpdateSchema.shape,
    withErrorHandler(async (params) => {
      const issuedInquiry = buildOrderDocumentUpdateInput(params);
      return executeMutationWithCheck(client, UPDATE_ISSUED_INQUIRY, { issuedInquiry }, "updateIssuedInquiry");
    }),
  );

  server.tool(
    "delete_issued_inquiry",
    "Smaže vydanou poptávku podle ID.",
    { id: z.number().int().describe("ID dokladu ke smazání"), year: z.number().int().optional().describe("Účetní rok dokladu") },
    withErrorHandler(async (params) => {
      const issuedInquiry = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_ISSUED_INQUIRY, { issuedInquiry }, "deleteIssuedInquiry");
    }),
  );

  // ── Services (Servisní doklady) ─────────────────────────────────────────

  server.tool(
    "list_services",
    "Vypíše servisní doklady s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_SERVICES, { skip, take, where, order });
      return toolListResponse(result.services.items, result.services.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Repairs (Opravy) ────────────────────────────────────────────────────

  server.tool(
    "list_repairs",
    "Vypíše opravy s filtrováním dle data, čísla dokladu, partnera.",
    orderDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildOrderDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_REPAIRS, { skip, take, where, order });
      return toolListResponse(result.repairs.items, result.repairs.totalCount, params.page, params.pageSize);
    }),
  );
}

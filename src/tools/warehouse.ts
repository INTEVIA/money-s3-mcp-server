/**
 * MCP tool definitions for warehouse domain:
 * articles, warehouse stocks, warehouses, and in-store documents.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import {
  LIST_ARTICLES,
  GET_ARTICLE,
  LIST_WAREHOUSE_STOCKS,
  GET_WAREHOUSE_STOCK,
  LIST_WAREHOUSES,
  LIST_RECEIVED_SLIPS,
  LIST_ISSUED_SLIPS,
  LIST_SALE_SLIPS,
  LIST_TRANSFER_NOTES,
  LIST_RECEIVED_DELIVERY_NOTES,
  LIST_ISSUED_DELIVERY_NOTES,
  LIST_STOCK_TAKINGS,
  LIST_PRODUCTION_NOTES,
  LIST_STOCK_TAKING_DOCUMENTS,
  LIST_STOCK_TAKING_TYPES,
} from "../graphql/queries/warehouse.js";
import {
  CREATE_ARTICLE,
  UPDATE_ARTICLE,
  DELETE_ARTICLE,
  CREATE_WAREHOUSE_STOCK,
  UPDATE_WAREHOUSE_STOCK,
  DELETE_WAREHOUSE_STOCK,
  CREATE_RECEIVED_SLIP,
  CREATE_ISSUED_SLIP,
  CREATE_SALE_SLIP,
  CREATE_TRANSFER_NOTE,
  UPDATE_RECEIVED_SLIP,
  UPDATE_ISSUED_SLIP,
  UPDATE_SALE_SLIP,
  UPDATE_TRANSFER_NOTE,
  UPDATE_RECEIVED_DELIVERY_NOTE,
  UPDATE_ISSUED_DELIVERY_NOTE,
  DELETE_RECEIVED_SLIP,
  DELETE_ISSUED_SLIP,
  DELETE_SALE_SLIP,
  DELETE_TRANSFER_NOTE,
  DELETE_RECEIVED_DELIVERY_NOTE,
  DELETE_ISSUED_DELIVERY_NOTE,
  CREATE_RECEIVED_DELIVERY_NOTE,
  CREATE_ISSUED_DELIVERY_NOTE,
  CREATE_STOCK_TAKING_DOCUMENT,
  UPDATE_STOCK_TAKING_DOCUMENT,
  DELETE_STOCK_TAKING_DOCUMENT,
} from "../graphql/mutations/warehouse.js";
import { toPaginationArgs } from "../helpers/pagination.js";
import {
  buildWhere,
  buildOrder,
  dateRangeFilter,
  eqFilter,
  containsFilter,
} from "../helpers/filters.js";
import {
  toolSuccess,
  toolError,
  toolListResponse,
  withErrorHandler,
} from "../helpers/response.js";
import { executeMutationWithCheck } from "../helpers/mutation.js";
import {
  paginationFields,
  cleanInput,
  type CollectionResponse,
} from "../helpers/types.js";

// ── Shared Zod schemas ─────────────────────────────────────────────────────

const stockItemSchema = z.object({
  description: z.string().describe("Popis položky"),
  unitOfMeasure: z.number().optional().describe("Počet měrných jednotek (množství)"),
  unitPriceHc: z.number().optional().describe("Jednotková cena v domácí měně"),
  unitPrice: z.number().optional().describe("Jednotková cena"),
  vatRate: z.number().optional().describe("Sazba DPH (%)"),
  priceType: z.enum(["WITHOUT_VAT", "WITH_VAT"]).optional().describe("Typ ceny"),
  warehouseCode: z.string().optional().describe("Kód skladu pro položku"),
  articleGuid: z.string().optional().describe("GUID artiklu pro položku"),
  note: z.string().optional().describe("Poznámka k položce"),
  purchasePrice: z.number().optional().describe("Nákupní cena"),
  weight: z.number().optional().describe("Hmotnost"),
});

type StockItemParams = z.infer<typeof stockItemSchema>;

function buildStockItemInput(item: StockItemParams): Record<string, unknown> {
  const input: Record<string, unknown> = { description: item.description };
  if (item.unitOfMeasure !== undefined) input.unitOfMeasure = item.unitOfMeasure;
  if (item.unitPriceHc !== undefined) input.unitPriceHc = item.unitPriceHc;
  if (item.unitPrice !== undefined) input.unitPrice = item.unitPrice;
  if (item.vatRate !== undefined) input.vatRate = item.vatRate;
  if (item.priceType !== undefined) input.priceType = item.priceType;
  if (item.note !== undefined) input.note = item.note;
  if (item.purchasePrice !== undefined) input.purchasePrice = item.purchasePrice;
  if (item.weight !== undefined) input.weight = item.weight;
  if (item.warehouseCode !== undefined) input.warehouse = { code: item.warehouseCode };
  if (item.articleGuid !== undefined) input.article = { guid: item.articleGuid };
  return input;
}

// ── In-store document filter/input schemas ──────────────────────────────────

const inStoreDocumentFilterSchema = {
  ...paginationFields,
  dateFrom: z.string().optional().describe("Datum vystavení od (YYYY-MM-DD)"),
  dateTo: z.string().optional().describe("Datum vystavení do (YYYY-MM-DD)"),
  documentNumber: z.string().optional().describe("Číslo dokladu (přesná shoda)"),
  variableSymbol: z.string().optional().describe("Variabilní symbol (přesná shoda)"),
  description: z.string().optional().describe("Popis dokladu (přesná shoda)"),
  partnerIco: z.string().optional().describe("IČO partnera (přesná shoda)"),
  year: z.number().int().optional().describe("Účetní rok"),
  sortBy: z.enum(["dateOfIssue", "documentNumber", "dateOfStockMovement"]).default("dateOfIssue").describe("Řazení podle"),
  sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
};

function buildInStoreDocumentWhere(params: {
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

const inStoreDocumentInputSchema = z.object({
  documentNumber: z.string().optional().describe("Číslo dokladu"),
  description: z.string().optional().describe("Popis dokladu"),
  dateOfIssue: z.string().describe("Datum vystavení (YYYY-MM-DD)"),
  dateOfStockMovement: z.string().optional().describe("Datum skladového pohybu (YYYY-MM-DD)"),
  note: z.string().optional().describe("Poznámka"),
  variableSymbol: z.string().optional().describe("Variabilní symbol"),
  orderNumber: z.string().optional().describe("Číslo objednávky"),
  numericalSeriePrefix: z.string().optional().describe("Prefix číselné řady"),
  centreShortCut: z.string().optional().describe("Zkratka střediska"),
  jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
  operationShortCut: z.string().optional().describe("Zkratka činnosti"),
  currencyCode: z.string().optional().describe("Kód měny (např. EUR)"),
  partnerIdentificationNumber: z.string().optional().describe("IČO partnera"),
  partnerName: z.string().optional().describe("Název partnera"),
  transferWarehouseCode: z.string().optional().describe("Kód cílového skladu (pro převodky)"),
  items: z.array(stockItemSchema).min(1).describe("Položky dokladu (min. 1)"),
});

type InStoreDocumentInputParams = z.infer<typeof inStoreDocumentInputSchema>;

function buildInStoreDocumentInput(params: InStoreDocumentInputParams): Record<string, unknown> {
  const input: Record<string, unknown> = {
    dateOfIssue: params.dateOfIssue,
    items: params.items.map(buildStockItemInput),
  };
  if (params.documentNumber !== undefined) input.documentNumber = params.documentNumber;
  if (params.description !== undefined) input.description = params.description;
  if (params.dateOfStockMovement !== undefined) input.dateOfStockMovement = params.dateOfStockMovement;
  if (params.note !== undefined) input.note = params.note;
  if (params.variableSymbol !== undefined) input.variableSymbol = params.variableSymbol;
  if (params.orderNumber !== undefined) input.orderNumber = params.orderNumber;
  if (params.numericalSeriePrefix !== undefined) input.numericalSerie = { prefix: params.numericalSeriePrefix };
  if (params.centreShortCut !== undefined) input.centre = { shortCut: params.centreShortCut };
  if (params.jobOrderShortCut !== undefined) input.jobOrder = { shortCut: params.jobOrderShortCut };
  if (params.operationShortCut !== undefined) input.operation = { shortCut: params.operationShortCut };
  if (params.currencyCode !== undefined) input.currency = { code: params.currencyCode };
  if (params.transferWarehouseCode !== undefined) input.transferWarehouse = { code: params.transferWarehouseCode };
  if (params.partnerIdentificationNumber !== undefined || params.partnerName !== undefined) {
    input.partnerAddress = cleanInput({
      identificationNumber: params.partnerIdentificationNumber,
      businessAddress: params.partnerName !== undefined ? { name: params.partnerName } : undefined,
    });
  }
  return input;
}

// ── In-store document update schema ────────────────────────────────────────

const inStoreDocumentUpdateSchema = z.object({
  documentNumber: z.string().describe("Číslo dokladu (identifikátor pro aktualizaci)"),
  description: z.string().optional().describe("Popis dokladu"),
  dateOfIssue: z.string().optional().describe("Datum vystavení (YYYY-MM-DD)"),
  note: z.string().optional().describe("Poznámka"),
  items: z.array(stockItemSchema).optional().describe("Položky dokladu (JSON pole)"),
});

type InStoreDocumentUpdateParams = z.infer<typeof inStoreDocumentUpdateSchema>;

function buildInStoreDocumentUpdateInput(params: InStoreDocumentUpdateParams): Record<string, unknown> {
  const input: Record<string, unknown> = {
    documentNumber: params.documentNumber,
  };
  if (params.description !== undefined) input.description = params.description;
  if (params.dateOfIssue !== undefined) input.dateOfIssue = params.dateOfIssue;
  if (params.note !== undefined) input.note = params.note;
  if (params.items !== undefined) input.items = params.items.map(buildStockItemInput);
  return input;
}

// ── In-store document delete schema ────────────────────────────────────────

const inStoreDocumentDeleteSchema = {
  id: z.number().int().describe("ID dokladu ke smazání"),
  year: z.number().int().optional().describe("Účetní rok"),
};

// ── Helpers: register update/delete for in-store document types ────────────

interface InStoreDocTypeConfig {
  typeName: string;
  varName: string;
  updateMutation: string;
  deleteMutation: string;
  updateMutationKey: string;
  deleteMutationKey: string;
  czNameGenitive: string;
}

function registerInStoreDocumentUpdateTool(
  server: McpServer,
  client: MoneyS3Client,
  toolName: string,
  description: string,
  cfg: InStoreDocTypeConfig,
): void {
  server.tool(
    toolName,
    description,
    inStoreDocumentUpdateSchema.shape,
    withErrorHandler(async (params: InStoreDocumentUpdateParams) => {
      const input = buildInStoreDocumentUpdateInput(params);
      return executeMutationWithCheck(client, cfg.updateMutation, { [cfg.varName]: input }, cfg.updateMutationKey);
    }),
  );
}

function registerInStoreDocumentDeleteTool(
  server: McpServer,
  client: MoneyS3Client,
  toolName: string,
  description: string,
  cfg: InStoreDocTypeConfig,
): void {
  server.tool(
    toolName,
    description,
    inStoreDocumentDeleteSchema,
    withErrorHandler(async (params: { id: number; year?: number }) => {
      const input = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, cfg.deleteMutation, { [cfg.varName]: input }, cfg.deleteMutationKey);
    }),
  );
}

// ── Register all warehouse tools ────────────────────────────────────────────

export function registerWarehouseTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // ── Articles ────────────────────────────────────────────────────────────

  server.tool(
    "list_articles",
    "Vypíše skladové karty (artikly) s filtrováním dle názvu, kódu, čárového kódu. Použij pro vyhledání artiklu.",
    {
      ...paginationFields,
      description: z.string().optional().describe("Popis artiklu (obsahuje)"),
      shortcut: z.string().optional().describe("Zkratka artiklu (obsahuje)"),
      barCode: z.string().optional().describe("Čárový kód (přesná shoda)"),
      catalogue: z.string().optional().describe("Katalogové číslo (přesná shoda)"),
      plu: z.string().optional().describe("PLU kód (přesná shoda)"),
      sortBy: z.enum(["description", "shortcut", "lastChange"]).default("description").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({
        description: containsFilter(params.description),
        shortcut: containsFilter(params.shortcut),
        barCode: eqFilter(params.barCode),
        catalogue: eqFilter(params.catalogue),
        plu: eqFilter(params.plu),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_ARTICLES, { skip, take, where, order });

      return toolListResponse(result.articles.items, result.articles.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "get_article",
    "Zobrazí detail artiklu (skladové karty) podle ID. Vrací kompletní informace včetně měrné jednotky, DPH, EAN.",
    { id: z.number().int().describe("ID artiklu") },
    withErrorHandler(async (params) => {
      const result = await client.query<CollectionResponse>(GET_ARTICLE, { where: { id: { eq: params.id } } });
      if (!result.articles.items.length) {
        return toolError(`Artikl s ID ${params.id} nebyl nalezen.`);
      }
      return toolSuccess(result.articles.items[0]);
    }),
  );

  server.tool(
    "create_article",
    "Vytvoří nový artikl (skladovou kartu). Zadej popis, zkratku, měrnou jednotku a další vlastnosti.",
    {
      description: z.string().describe("Popis artiklu"),
      shortCut: z.string().optional().describe("Zkratka artiklu"),
      note: z.string().optional().describe("Poznámka"),
      mainMeasureUnit: z.string().optional().describe("Hlavní měrná jednotka (např. ks, kg, m)"),
      barCode: z.string().optional().describe("Čárový kód"),
      catalogue: z.string().optional().describe("Katalogové číslo"),
      plu: z.string().optional().describe("PLU kód"),
      purchaseVatRate: z.number().optional().describe("Sazba DPH pro nákup (%)"),
      salesVatRate: z.number().optional().describe("Sazba DPH pro prodej (%)"),
      warranty: z.number().int().optional().describe("Délka záruky"),
      guid: z.string().optional().describe("GUID artiklu (volitelné)"),
    },
    withErrorHandler(async (params) => {
      const article = cleanInput({
        description: params.description,
        shortCut: params.shortCut,
        note: params.note,
        mainMeasureUnit: params.mainMeasureUnit,
        barCode: params.barCode,
        catalogue: params.catalogue,
        plu: params.plu,
        purchaseVatRate: params.purchaseVatRate,
        salesVatRate: params.salesVatRate,
        warranty: params.warranty,
        guid: params.guid,
      });
      return executeMutationWithCheck(client, CREATE_ARTICLE, { article }, "createArticle");
    }),
  );

  server.tool(
    "update_article",
    "Aktualizuje existující artikl (skladovou kartu). Zadej GUID artiklu a pole k aktualizaci.",
    {
      guid: z.string().describe("GUID artiklu k aktualizaci"),
      description: z.string().optional().describe("Nový popis"),
      shortCut: z.string().optional().describe("Nová zkratka"),
      note: z.string().optional().describe("Nová poznámka"),
      mainMeasureUnit: z.string().optional().describe("Nová hlavní měrná jednotka"),
      barCode: z.string().optional().describe("Nový čárový kód"),
      catalogue: z.string().optional().describe("Nové katalogové číslo"),
      plu: z.string().optional().describe("Nový PLU kód"),
      purchaseVatRate: z.number().optional().describe("Nová sazba DPH pro nákup (%)"),
      salesVatRate: z.number().optional().describe("Nová sazba DPH pro prodej (%)"),
    },
    withErrorHandler(async (params) => {
      const article = cleanInput({
        guid: params.guid,
        description: params.description,
        shortCut: params.shortCut,
        note: params.note,
        mainMeasureUnit: params.mainMeasureUnit,
        barCode: params.barCode,
        catalogue: params.catalogue,
        plu: params.plu,
        purchaseVatRate: params.purchaseVatRate,
        salesVatRate: params.salesVatRate,
      });
      return executeMutationWithCheck(client, UPDATE_ARTICLE, { article }, "updateArticle");
    }),
  );

  server.tool(
    "delete_article",
    "Smaže artikl (skladovou kartu) podle ID.",
    { id: z.number().int().describe("ID artiklu ke smazání") },
    withErrorHandler(async (params) => {
      return executeMutationWithCheck(client, DELETE_ARTICLE, { article: { id: params.id } }, "deleteArticle");
    }),
  );

  // ── Warehouse Stocks ──────────────────────────────────────────────────

  server.tool(
    "list_warehouse_stocks",
    "Vypíše skladové zásoby s filtrováním dle popisu, zkratky, čárového kódu. Zobrazuje aktuální množství, ceny, sklad.",
    {
      ...paginationFields,
      description: z.string().optional().describe("Popis zásoby (přesná shoda)"),
      shortCut: z.string().optional().describe("Zkratka zásoby (přesná shoda)"),
      barCode: z.string().optional().describe("Čárový kód (přesná shoda)"),
      catalogue: z.string().optional().describe("Katalogové číslo (přesná shoda)"),
      plu: z.string().optional().describe("PLU kód (přesná shoda)"),
      sortBy: z.enum(["description", "shortCut"]).default("description").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({
        description: eqFilter(params.description),
        shortCut: eqFilter(params.shortCut),
        barCode: eqFilter(params.barCode),
        catalogue: eqFilter(params.catalogue),
        plu: eqFilter(params.plu),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_WAREHOUSE_STOCKS, { skip, take, where, order });

      return toolListResponse(result.warehouseStocks.items, result.warehouseStocks.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "get_warehouse_stock",
    "Zobrazí detail skladové zásoby podle ID. Vrací kompletní informace včetně množství, cen, skladu, artiklu.",
    { id: z.number().int().describe("ID skladové zásoby") },
    withErrorHandler(async (params) => {
      const result = await client.query<CollectionResponse>(GET_WAREHOUSE_STOCK, { where: { id: { eq: params.id } } });
      if (!result.warehouseStocks.items.length) {
        return toolError(`Skladová zásoba s ID ${params.id} nebyla nalezena.`);
      }
      return toolSuccess(result.warehouseStocks.items[0]);
    }),
  );

  server.tool(
    "create_warehouse_stock",
    "Vytvoří novou skladovou zásobu. Zadej artikl (guid), sklad (kód) a další vlastnosti.",
    {
      articleGuid: z.string().describe("GUID artiklu"),
      warehouseCode: z.string().describe("Kód skladu"),
      note: z.string().optional().describe("Poznámka"),
      purchaseVatRate: z.number().optional().describe("Sazba DPH pro nákup (%)"),
      salesVatRate: z.number().optional().describe("Sazba DPH pro prodej (%)"),
      lastPurchasePrice: z.number().optional().describe("Poslední nákupní cena"),
    },
    withErrorHandler(async (params) => {
      const warehouseStock = cleanInput({
        article: { guid: params.articleGuid },
        warehouse: { code: params.warehouseCode },
        note: params.note,
        purchaseVatRate: params.purchaseVatRate,
        salesVatRate: params.salesVatRate,
        lastPurchasePrice: params.lastPurchasePrice,
      });
      return executeMutationWithCheck(client, CREATE_WAREHOUSE_STOCK, { warehouseStock }, "createWarehouseStock");
    }),
  );

  // ── Warehouses (read-only list) ───────────────────────────────────────

  server.tool(
    "list_warehouses",
    "Vypíše seznam skladů. Použij pro zjištění dostupných skladů a jejich kódů.",
    {
      ...paginationFields,
      name: z.string().optional().describe("Název skladu (přesná shoda)"),
      code: z.string().optional().describe("Kód skladu (přesná shoda)"),
      sortBy: z.enum(["name", "code"]).default("name").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({
        name: eqFilter(params.name),
        code: eqFilter(params.code),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_WAREHOUSES, { skip, take, where, order });

      return toolListResponse(result.warehouses.items, result.warehouses.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Received Slips (Příjemky) ─────────────────────────────────────────

  server.tool(
    "list_received_slips",
    "Vypíše příjemky (skladové příjmové doklady) s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_RECEIVED_SLIPS, { skip, take, where, order });

      return toolListResponse(result.receivedSlips.items, result.receivedSlips.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_received_slip",
    "Vytvoří příjemku (skladový příjmový doklad). Zadej datum, položky s artiklem, množstvím a cenou.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const receivedSlip = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_RECEIVED_SLIP, { receivedSlip }, "createReceivedSlip");
    }),
  );

  // ── Issued Slips (Výdejky) ────────────────────────────────────────────

  server.tool(
    "list_issued_slips",
    "Vypíše výdejky (skladové výdajové doklady) s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_ISSUED_SLIPS, { skip, take, where, order });

      return toolListResponse(result.issuedSlips.items, result.issuedSlips.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_issued_slip",
    "Vytvoří výdejku (skladový výdajový doklad). Zadej datum, položky s artiklem, množstvím a cenou.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const issuedSlip = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_ISSUED_SLIP, { issuedSlip }, "createIssuedSlip");
    }),
  );

  // ── Sale Slips (Prodejky) ─────────────────────────────────────────────

  server.tool(
    "list_sale_slips",
    "Vypíše prodejky (prodejní doklady) s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_SALE_SLIPS, { skip, take, where, order });

      return toolListResponse(result.saleSlips.items, result.saleSlips.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_sale_slip",
    "Vytvoří prodejku (prodejní doklad). Zadej datum, položky s artiklem, množstvím a cenou.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const saleSlip = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_SALE_SLIP, { saleSlip }, "createSaleSlip");
    }),
  );

  // ── Transfer Notes (Převodky) ─────────────────────────────────────────

  server.tool(
    "list_transfer_notes",
    "Vypíše převodky (skladové převodové doklady) s filtrováním dle data, čísla dokladu.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(LIST_TRANSFER_NOTES, { skip, take, where, order });

      return toolListResponse(result.transferNotes.items, result.transferNotes.totalCount, params.page, params.pageSize);
    }),
  );

  server.tool(
    "create_transfer_note",
    "Vytvoří převodku (skladový převod mezi sklady). Zadej datum, cílový sklad a položky.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const transferNote = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_TRANSFER_NOTE, { transferNote }, "createTransferNote");
    }),
  );

  // ── Received Delivery Notes (Přijaté dodací listy) ──────────────────────

  server.tool(
    "list_received_delivery_notes",
    "Vypíše přijaté dodací listy s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_RECEIVED_DELIVERY_NOTES, { skip, take, where, order });
      return toolListResponse(result.receivedDeliveryNotes.items, result.receivedDeliveryNotes.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Issued Delivery Notes (Vydané dodací listy) ─────────────────────────

  server.tool(
    "list_issued_delivery_notes",
    "Vypíše vydané dodací listy s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_ISSUED_DELIVERY_NOTES, { skip, take, where, order });
      return toolListResponse(result.issuedDeliveryNotes.items, result.issuedDeliveryNotes.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Stock Takings (Inventury) ───────────────────────────────────────────

  server.tool(
    "list_stock_takings",
    "Vypíše inventury (skladové inventarizace) s filtrováním dle roku.",
    {
      ...paginationFields,
      year: z.number().int().optional().describe("Účetní rok"),
      sortBy: z.enum(["dateOfStockTaking", "stockTakingNumber"]).default("dateOfStockTaking").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({ year: eqFilter(params.year) });
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_STOCK_TAKINGS, { skip, take, where, order });
      return toolListResponse(result.stockTakings.items, result.stockTakings.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Update / Delete Warehouse Stock ─────────────────────────────────────

  server.tool(
    "update_warehouse_stock",
    "Aktualizuje skladovou zásobu. Identifikace přes artikl (guid) a sklad (kód).",
    {
      articleGuid: z.string().describe("GUID artiklu"),
      warehouseCode: z.string().describe("Kód skladu"),
      note: z.string().optional().describe("Nová poznámka"),
      purchaseVatRate: z.number().optional().describe("Nová sazba DPH pro nákup (%)"),
      salesVatRate: z.number().optional().describe("Nová sazba DPH pro prodej (%)"),
      lastPurchasePrice: z.number().optional().describe("Nová poslední nákupní cena"),
    },
    withErrorHandler(async (params) => {
      const warehouseStock = cleanInput({
        article: { guid: params.articleGuid },
        warehouse: { code: params.warehouseCode },
        note: params.note,
        purchaseVatRate: params.purchaseVatRate,
        salesVatRate: params.salesVatRate,
        lastPurchasePrice: params.lastPurchasePrice,
      });
      return executeMutationWithCheck(client, UPDATE_WAREHOUSE_STOCK, { warehouseStock }, "updateWarehouseStock");
    }),
  );

  server.tool(
    "delete_warehouse_stock",
    "Smaže skladovou zásobu podle ID.",
    { id: z.number().int().describe("ID skladové zásoby ke smazání") },
    withErrorHandler(async (params) => {
      return executeMutationWithCheck(client, DELETE_WAREHOUSE_STOCK, { warehouseStock: { id: params.id } }, "deleteWarehouseStock");
    }),
  );

  // ── Production Notes (Výrobní listy) ──────────────────────────────────────

  server.tool(
    "list_production_notes",
    "Vypíše výrobní listy s filtrováním dle data, čísla dokladu, partnera.",
    inStoreDocumentFilterSchema,
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildInStoreDocumentWhere(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_PRODUCTION_NOTES, { skip, take, where, order });
      return toolListResponse(result.productionNotes.items, result.productionNotes.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Stock Taking Documents (Inventurní doklady) ───────────────────────────

  server.tool(
    "list_stock_taking_documents",
    "Vypíše inventurní doklady s filtrováním dle roku, popisu nebo ID inventury.",
    {
      ...paginationFields,
      year: z.number().int().optional().describe("Účetní rok"),
      description: z.string().optional().describe("Popis inventurního dokladu (přesná shoda)"),
      stockTakingId: z.number().int().optional().describe("ID inventury"),
      sortBy: z.enum(["stockTakingDocumentId", "lastChangeDate"]).default("lastChangeDate").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("DESC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const where = buildWhere({
        year: eqFilter(params.year),
        description: eqFilter(params.description),
        stockTakingId: eqFilter(params.stockTakingId),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_STOCK_TAKING_DOCUMENTS, { skip, take, where, order });
      return toolListResponse(result.stockTakingDocuments.items, result.stockTakingDocuments.totalCount, params.page, params.pageSize);
    }),
  );

  // ── Stock Taking Types (Typy inventur) ────────────────────────────────────

  server.tool(
    "list_stock_taking_types",
    "Vypíše typy inventur.",
    {
      ...paginationFields,
      sortBy: z.enum(["name", "shortCut"]).default("name").describe("Řazení podle"),
      sortDirection: z.enum(["ASC", "DESC"]).default("ASC").describe("Směr řazení"),
    },
    withErrorHandler(async (params) => {
      const { skip, take } = toPaginationArgs(params);
      const order = buildOrder(params.sortBy, params.sortDirection);
      const result = await client.query<CollectionResponse>(LIST_STOCK_TAKING_TYPES, { skip, take, order });
      return toolListResponse(result.stockTakingTypes.items, result.stockTakingTypes.totalCount, params.page, params.pageSize);
    }),
  );

  // ── In-store document Update / Delete tools (6 doc types) ─────────────────

  const inStoreDocTypes: InStoreDocTypeConfig[] = [
    {
      typeName: "received_slip",
      varName: "receivedSlip",
      updateMutation: UPDATE_RECEIVED_SLIP,
      deleteMutation: DELETE_RECEIVED_SLIP,
      updateMutationKey: "updateReceivedSlip",
      deleteMutationKey: "deleteReceivedSlip",
      czNameGenitive: "příjemky",
    },
    {
      typeName: "issued_slip",
      varName: "issuedSlip",
      updateMutation: UPDATE_ISSUED_SLIP,
      deleteMutation: DELETE_ISSUED_SLIP,
      updateMutationKey: "updateIssuedSlip",
      deleteMutationKey: "deleteIssuedSlip",
      czNameGenitive: "výdejky",
    },
    {
      typeName: "sale_slip",
      varName: "saleSlip",
      updateMutation: UPDATE_SALE_SLIP,
      deleteMutation: DELETE_SALE_SLIP,
      updateMutationKey: "updateSaleSlip",
      deleteMutationKey: "deleteSaleSlip",
      czNameGenitive: "prodejky",
    },
    {
      typeName: "transfer_note",
      varName: "transferNote",
      updateMutation: UPDATE_TRANSFER_NOTE,
      deleteMutation: DELETE_TRANSFER_NOTE,
      updateMutationKey: "updateTransferNote",
      deleteMutationKey: "deleteTransferNote",
      czNameGenitive: "převodky",
    },
    {
      typeName: "received_delivery_note",
      varName: "receivedDeliveryNote",
      updateMutation: UPDATE_RECEIVED_DELIVERY_NOTE,
      deleteMutation: DELETE_RECEIVED_DELIVERY_NOTE,
      updateMutationKey: "updateReceivedDeliveryNote",
      deleteMutationKey: "deleteReceivedDeliveryNote",
      czNameGenitive: "přijatého dodacího listu",
    },
    {
      typeName: "issued_delivery_note",
      varName: "issuedDeliveryNote",
      updateMutation: UPDATE_ISSUED_DELIVERY_NOTE,
      deleteMutation: DELETE_ISSUED_DELIVERY_NOTE,
      updateMutationKey: "updateIssuedDeliveryNote",
      deleteMutationKey: "deleteIssuedDeliveryNote",
      czNameGenitive: "vydaného dodacího listu",
    },
  ];

  for (const cfg of inStoreDocTypes) {
    registerInStoreDocumentUpdateTool(
      server,
      client,
      `update_${cfg.typeName}`,
      `Aktualizuje existující doklad (${cfg.czNameGenitive}). Identifikace přes číslo dokladu.`,
      cfg,
    );

    registerInStoreDocumentDeleteTool(
      server,
      client,
      `delete_${cfg.typeName}`,
      `Smaže doklad (${cfg.czNameGenitive}) podle ID.`,
      cfg,
    );
  }

  // ── Create Delivery Notes (Dodací listy) ──────────────────────────────────

  server.tool(
    "create_received_delivery_note",
    "Vytvoří přijatý dodací list. Zadej datum, položky s artiklem, množstvím a cenou.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const receivedDeliveryNote = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_RECEIVED_DELIVERY_NOTE, { receivedDeliveryNote }, "createReceivedDeliveryNote");
    }),
  );

  server.tool(
    "create_issued_delivery_note",
    "Vytvoří vydaný dodací list. Zadej datum, položky s artiklem, množstvím a cenou.",
    inStoreDocumentInputSchema.shape,
    withErrorHandler(async (params) => {
      const issuedDeliveryNote = buildInStoreDocumentInput(params);
      return executeMutationWithCheck(client, CREATE_ISSUED_DELIVERY_NOTE, { issuedDeliveryNote }, "createIssuedDeliveryNote");
    }),
  );

  // ── Stock Taking Document CRUD (Inventurní doklady) ───────────────────────

  server.tool(
    "create_stock_taking_document",
    "Vytvoří inventurní doklad. Zadej ID inventury a číslo inventurního dokladu.",
    {
      stockTakingDocumentId: z.string().describe("Číslo inventurního dokladu"),
      stockTakingId: z.number().int().describe("ID inventury"),
      description: z.string().optional().describe("Popis"),
      checkedByEmployee: z.string().optional().describe("Zaměstnanec provádějící kontrolu"),
      note: z.string().optional().describe("Poznámka"),
    },
    withErrorHandler(async (params) => {
      const stockTakingDocument = cleanInput({
        stockTakingDocumentId: params.stockTakingDocumentId,
        stockTakingId: params.stockTakingId,
        description: params.description,
        checkedByEmployee: params.checkedByEmployee,
        note: params.note,
      });
      return executeMutationWithCheck(client, CREATE_STOCK_TAKING_DOCUMENT, { stockTakingDocument }, "createStockTakingDocument");
    }),
  );

  server.tool(
    "update_stock_taking_document",
    "Aktualizuje inventurní doklad. Zadej ID inventury a číslo inventurního dokladu.",
    {
      stockTakingDocumentId: z.string().describe("Číslo inventurního dokladu"),
      stockTakingId: z.number().int().describe("ID inventury"),
      description: z.string().optional().describe("Nový popis"),
      checkedByEmployee: z.string().optional().describe("Nový zaměstnanec provádějící kontrolu"),
      note: z.string().optional().describe("Nová poznámka"),
    },
    withErrorHandler(async (params) => {
      const stockTakingDocument = cleanInput({
        stockTakingDocumentId: params.stockTakingDocumentId,
        stockTakingId: params.stockTakingId,
        description: params.description,
        checkedByEmployee: params.checkedByEmployee,
        note: params.note,
      });
      return executeMutationWithCheck(client, UPDATE_STOCK_TAKING_DOCUMENT, { stockTakingDocument }, "updateStockTakingDocument");
    }),
  );

  server.tool(
    "delete_stock_taking_document",
    "Smaže inventurní doklad podle ID.",
    {
      id: z.number().int().describe("ID inventurního dokladu ke smazání"),
      year: z.number().int().optional().describe("Účetní rok"),
    },
    withErrorHandler(async (params) => {
      const stockTakingDocument = cleanInput({ id: params.id, year: params.year });
      return executeMutationWithCheck(client, DELETE_STOCK_TAKING_DOCUMENT, { stockTakingDocument }, "deleteStockTakingDocument");
    }),
  );
}

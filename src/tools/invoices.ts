import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";

import { toPaginationArgs } from "../helpers/pagination.js";
import {
  dateRangeFilter,
  eqFilter,
  partnerIcoFilter,
  buildWhere,
  buildOrder,
} from "../helpers/filters.js";
import {
  toolSuccess,
  toolError,
  toolListResponse,
  toolMutationResponse,
  withErrorHandler,
} from "../helpers/response.js";
import {
  paginationFields,
  type CollectionResponse,
  type ImportPromiseResponse,
} from "../helpers/types.js";
import {
  LIST_ISSUED_INVOICES,
  GET_ISSUED_INVOICE,
  LIST_RECEIVED_INVOICES,
  GET_RECEIVED_INVOICE,
} from "../graphql/queries/invoices.js";
import {
  CREATE_ISSUED_INVOICE,
  UPDATE_ISSUED_INVOICE,
  DELETE_ISSUED_INVOICE,
  CREATE_RECEIVED_INVOICE,
  UPDATE_RECEIVED_INVOICE,
  DELETE_RECEIVED_INVOICE,
} from "../graphql/mutations/invoices.js";

// ---------------------------------------------------------------------------
// Shared Zod schemas (invoice-specific)
// ---------------------------------------------------------------------------

const invoiceItemSchema = z.object({
  description: z.string().describe("Popis položky"),
  amount: z.number().describe("Počet jednotek"),
  unitPriceHc: z.number().describe("Jednotková cena v domácí měně"),
  vatRate: z.number().default(21).describe("Sazba DPH v % (výchozí 21)"),
  priceType: z
    .enum(["WITHOUT_VAT", "WITH_VAT", "ONLY_BASE", "ONLY_VAT"])
    .default("WITHOUT_VAT")
    .describe("Typ ceny"),
  unitPrice: z
    .number()
    .optional()
    .describe("Jednotková cena v měně dokladu (pro cizí měnu)"),
  amountUnit: z.string().optional().describe("Měrná jednotka (ks, hod, ...)"),
  discountPercentage: z.number().optional().describe("Sleva na položce v %"),
  catalogue: z.string().optional().describe("Katalogové číslo"),
  note: z.string().optional().describe("Poznámka k položce"),
  sequence: z
    .number()
    .optional()
    .describe("Pořadí položky (automaticky pokud neuvedeno)"),
  barCode: z.string().optional().describe("Čárový kód"),
  shortCut: z.string().optional().describe("Zkratka skladové zásoby"),
  isDeposit: z.boolean().optional().describe("Zálohová položka"),
  isTaxed: z.boolean().optional().describe("Záloha byla zdaněna"),
  isInverse: z.boolean().optional().describe("Storno zaúčtování zálohy"),
  accountAssignmentShortCut: z
    .string()
    .optional()
    .describe("Zkratka předkontace"),
  vatClassificationShortCut: z
    .string()
    .optional()
    .describe("Zkratka členění DPH"),
  centreShortCut: z.string().optional().describe("Zkratka střediska"),
  jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
  operationShortCut: z.string().optional().describe("Zkratka činnosti"),
});

const partnerAddressSchema = z
  .object({
    name: z.string().optional().describe("Název firmy"),
    street: z.string().optional().describe("Ulice"),
    municipality: z.string().optional().describe("Město/obec"),
    postalCode: z.string().optional().describe("PSČ"),
    countryName: z.string().optional().describe("Název země"),
    identificationNumber: z.string().optional().describe("IČO"),
    vatIdentificationNumber: z.string().optional().describe("DIČ"),
    email: z.string().optional().describe("E-mail"),
    phoneNumber: z.string().optional().describe("Telefon"),
    guid: z
      .string()
      .optional()
      .describe("GUID existující adresy z adresáře"),
  })
  .optional()
  .describe("Adresa obchodního partnera");

// ---------------------------------------------------------------------------
// Helper: build CompanyInput from flat partner params
// ---------------------------------------------------------------------------

function buildPartnerAddress(
  partner?: z.infer<typeof partnerAddressSchema>,
): Record<string, unknown> | undefined {
  if (!partner) return undefined;

  const result: Record<string, unknown> = {};

  if (partner.guid !== undefined) {
    result.guid = partner.guid;
  }

  // Build businessAddress sub-object (AddressInput).
  const address: Record<string, unknown> = {};
  if (partner.name !== undefined) address.name = partner.name;
  if (partner.street !== undefined) address.street = partner.street;
  if (partner.municipality !== undefined)
    address.municipality = partner.municipality;
  if (partner.postalCode !== undefined) {
    address.municipalityPostalCode = { postalCode: partner.postalCode };
  }
  if (partner.countryName !== undefined) {
    address.countryName = partner.countryName;
  }
  if (Object.keys(address).length > 0) {
    result.businessAddress = address;
  }

  if (partner.identificationNumber !== undefined)
    result.identificationNumber = partner.identificationNumber;
  if (partner.vatIdentificationNumber !== undefined)
    result.vatIdentificationNumber = partner.vatIdentificationNumber;
  if (partner.email !== undefined) result.email = partner.email;
  if (partner.phoneNumber !== undefined)
    result.phoneNumber = partner.phoneNumber;

  return Object.keys(result).length > 0 ? result : undefined;
}

// ---------------------------------------------------------------------------
// Helper: build item input array from tool params
// ---------------------------------------------------------------------------

function buildItemInputs(
  items?: z.infer<typeof invoiceItemSchema>[],
): Record<string, unknown>[] | undefined {
  if (!items || items.length === 0) return undefined;

  return items.map((item) => {
    const input: Record<string, unknown> = {
      description: item.description,
      amount: item.amount,
      unitPriceHc: item.unitPriceHc,
      vatRate: item.vatRate,
      priceType: item.priceType,
    };

    if (item.unitPrice !== undefined) input.unitPrice = item.unitPrice;
    if (item.amountUnit !== undefined) input.amountUnit = item.amountUnit;
    if (item.discountPercentage !== undefined)
      input.discountPercentage = item.discountPercentage;
    if (item.catalogue !== undefined) input.catalogue = item.catalogue;
    if (item.note !== undefined) input.note = item.note;
    if (item.sequence !== undefined) input.sequence = item.sequence;
    if (item.barCode !== undefined) input.barCode = item.barCode;
    if (item.shortCut !== undefined) input.shortCut = item.shortCut;
    if (item.isDeposit !== undefined) input.isDeposit = item.isDeposit;
    if (item.isTaxed !== undefined) input.isTaxed = item.isTaxed;
    if (item.isInverse !== undefined) input.isInverse = item.isInverse;
    if (item.accountAssignmentShortCut !== undefined)
      input.accountAssignment = { shortCut: item.accountAssignmentShortCut };
    if (item.vatClassificationShortCut !== undefined)
      input.vatClassification = { shortCut: item.vatClassificationShortCut };
    if (item.centreShortCut !== undefined)
      input.centre = { shortCut: item.centreShortCut };
    if (item.jobOrderShortCut !== undefined)
      input.jobOrder = { shortCut: item.jobOrderShortCut };
    if (item.operationShortCut !== undefined)
      input.operation = { shortCut: item.operationShortCut };

    return input;
  });
}

// ---------------------------------------------------------------------------
// Helper: build invoice input from flat params (shared by create + update)
// ---------------------------------------------------------------------------

function buildInvoiceInput(params: Record<string, unknown>): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  // Simple scalar fields — all use !== undefined to preserve "" and 0
  if (params.dateOfIssue !== undefined) input.dateOfIssue = params.dateOfIssue;
  if (params.dateOfTaxing !== undefined) input.dateOfTaxing = params.dateOfTaxing;
  if (params.dateOfMaturity !== undefined) input.dateOfMaturity = params.dateOfMaturity;
  if (params.documentNumber !== undefined) input.documentNumber = params.documentNumber;
  if (params.description !== undefined) input.description = params.description;
  if (params.variableSymbol !== undefined) input.variableSymbol = params.variableSymbol;
  if (params.specificSymbol !== undefined) input.specificSymbol = params.specificSymbol;
  if (params.pairingSymbol !== undefined) input.pairingSymbol = params.pairingSymbol;
  if (params.orderNumber !== undefined) input.orderNumber = params.orderNumber;
  if (params.invoiceType !== undefined) input.invoiceType = params.invoiceType;
  if (params.isCreditNote !== undefined) input.isCreditNote = params.isCreditNote;
  if (params.paymentMethod !== undefined) input.paymentMethod = params.paymentMethod;
  if (params.shippingMethod !== undefined) input.shippingMethod = params.shippingMethod;
  if (params.invoiceTextBeforePrices !== undefined)
    input.invoiceTextBeforePrices = params.invoiceTextBeforePrices;
  if (params.invoiceTextBehindPrices !== undefined)
    input.invoiceTextBehindPrices = params.invoiceTextBehindPrices;
  if (params.receivedDocumentNumber !== undefined)
    input.receivedDocumentNumber = params.receivedDocumentNumber;
  if (params.note !== undefined) input.note = params.note;

  // RefInput wrapping: single-field refs
  if (params.numericalSeriePrefix !== undefined)
    input.numericalSerie = { prefix: params.numericalSeriePrefix };
  if (params.accountAssignmentShortCut !== undefined)
    input.accountAssignment = { shortCut: params.accountAssignmentShortCut };
  if (params.centreShortCut !== undefined)
    input.centre = { shortCut: params.centreShortCut };
  if (params.jobOrderShortCut !== undefined)
    input.jobOrder = { shortCut: params.jobOrderShortCut };
  if (params.operationShortCut !== undefined)
    input.operation = { shortCut: params.operationShortCut };
  if (params.vatClassificationShortCut !== undefined)
    input.vatClassification = { shortCut: params.vatClassificationShortCut };

  // Currency (composite ref)
  if (params.currencyCode !== undefined) {
    const curr: Record<string, unknown> = { code: params.currencyCode };
    if (params.exchangeRate !== undefined) curr.exchangeRate = params.exchangeRate;
    if (params.exchangeRateAmount !== undefined)
      curr.exchangeRateAmount = params.exchangeRateAmount;
    input.currency = curr;
  }

  // Partner address
  const partnerAddr = buildPartnerAddress(
    params.partnerAddress as z.infer<typeof partnerAddressSchema>,
  );
  if (partnerAddr) input.partnerAddress = partnerAddr;

  // Items
  const itemInputs = buildItemInputs(
    params.items as z.infer<typeof invoiceItemSchema>[] | undefined,
  );
  if (itemInputs) input.items = itemInputs;

  return input;
}

// ---------------------------------------------------------------------------
// Shared Zod field groups (reused across issued + received tools)
// ---------------------------------------------------------------------------

const invoiceTypeEnum = z
  .enum([
    "NORMAL",
    "ADVANCE",
    "PROFORMA",
    "TAX_DOCUMENT",
    "OLD_ADVANCE",
    "OLD_PROFORMA",
  ]);

const issuedInvoiceSortEnum = z
  .enum([
    "dateOfIssue",
    "documentNumber",
    "totalWithVatHc",
    "dateOfMaturity",
    "amountToPayHc",
    "id",
  ]);

const receivedInvoiceSortEnum = z
  .enum([
    "dateOfIssue",
    "documentNumber",
    "totalWithVatHc",
    "dateOfMaturity",
    "amountToPayHc",
    "id",
  ]);

// ===========================================================================
// Tool registration
// ===========================================================================

export function registerInvoiceTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  // -------------------------------------------------------------------------
  // LIST ISSUED INVOICES
  // -------------------------------------------------------------------------
  server.tool(
    "list_issued_invoices",
    "Vypíše vydané faktury s filtrováním dle data, firmy, čísla dokladu, variabilního symbolu. Podporuje stránkování a řazení.",
    {
      ...paginationFields,
      dateFrom: z
        .string()
        .optional()
        .describe("Datum vystavení od (YYYY-MM-DD)"),
      dateTo: z
        .string()
        .optional()
        .describe("Datum vystavení do (YYYY-MM-DD)"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      partnerIco: z
        .string()
        .optional()
        .describe("IČO obchodního partnera"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: issuedInvoiceSortEnum
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
        partnerAddress: params.partnerIco
          ? partnerIcoFilter(params.partnerIco)
          : undefined,
        year: eqFilter(params.year),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_ISSUED_INVOICES,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.issuedInvoices.items,
        result.issuedInvoices.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // GET ISSUED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "get_issued_invoice",
    "Vrátí detail jedné vydané faktury podle ID včetně položek, plateb, DPH souhrnu a adres.",
    {
      id: z.number().describe("ID vydané faktury"),
      year: z.number().optional().describe("Účetní rok (nepovinné)"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = {
        id: { eq: params.id },
      };
      if (params.year !== undefined) {
        where.year = { eq: params.year };
      }

      const result = await client.query<CollectionResponse>(
        GET_ISSUED_INVOICE,
        { where },
      );

      const invoice = result.issuedInvoices.items[0];
      if (!invoice) {
        return toolError(`Vydaná faktura s ID ${params.id} nebyla nalezena`);
      }

      return toolSuccess(invoice);
    }),
  );

  // -------------------------------------------------------------------------
  // CREATE ISSUED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "create_issued_invoice",
    "Vytvoří novou vydanou fakturu s položkami. Povinné je datum vystavení, zdanitelného plnění a splatnosti. Položky definují řádky faktury.",
    {
      dateOfIssue: z.string().describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfMaturity: z.string().describe("Datum splatnosti (YYYY-MM-DD)"),
      numericalSeriePrefix: z
        .string()
        .optional()
        .describe("Prefix číselné řady (např. 'FV')"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      description: z.string().optional().describe("Popis dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      pairingSymbol: z.string().optional().describe("Párovací symbol"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
      invoiceType: invoiceTypeEnum
        .default("NORMAL")
        .describe("Typ faktury"),
      isCreditNote: z.boolean().optional().describe("Dobropis"),
      paymentMethod: z
        .string()
        .optional()
        .describe("Způsob úhrady (např. 'Příkazem')"),
      shippingMethod: z
        .string()
        .optional()
        .describe("Způsob dopravy"),
      currencyCode: z
        .string()
        .optional()
        .describe("Kód měny (např. 'EUR'). Pokud neuvedeno, použije se CZK."),
      exchangeRate: z
        .number()
        .optional()
        .describe("Kurz měny (pro cizí měnu)"),
      exchangeRateAmount: z
        .number()
        .optional()
        .describe("Počet jednotek měny pro kurz (např. 1 nebo 100)"),
      accountAssignmentShortCut: z
        .string()
        .optional()
        .describe("Zkratka předkontace"),
      centreShortCut: z.string().optional().describe("Zkratka střediska"),
      jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
      operationShortCut: z.string().optional().describe("Zkratka činnosti"),
      vatClassificationShortCut: z
        .string()
        .optional()
        .describe("Zkratka členění DPH"),
      invoiceTextBeforePrices: z
        .string()
        .optional()
        .describe("Text před cenami na faktuře"),
      invoiceTextBehindPrices: z
        .string()
        .optional()
        .describe("Text za cenami na faktuře"),
      partnerAddress: partnerAddressSchema,
      items: z
        .array(invoiceItemSchema)
        .optional()
        .describe("Položky faktury"),
    },
    withErrorHandler(async (params) => {
      const input = buildInvoiceInput(params);

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_ISSUED_INVOICE,
        { issuedInvoice: input },
      );

      const promise = result.createIssuedInvoice;
      if (!promise.isSuccess) {
        return toolError("Požadavek na vytvoření vydané faktury nebyl přijat");
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // UPDATE ISSUED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "update_issued_invoice",
    "Aktualizuje existující vydanou fakturu. Identifikace přes GUID faktury. Předejte pouze pole, která chcete změnit.",
    {
      guid: z.string().describe("GUID vydané faktury k aktualizaci"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      numericalSeriePrefix: z
        .string()
        .optional()
        .describe("Prefix číselné řady"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      description: z.string().optional().describe("Popis dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      pairingSymbol: z.string().optional().describe("Párovací symbol"),
      orderNumber: z.string().optional().describe("Číslo objednávky"),
      invoiceType: invoiceTypeEnum
        .optional()
        .describe("Typ faktury"),
      isCreditNote: z.boolean().optional().describe("Dobropis"),
      paymentMethod: z.string().optional().describe("Způsob úhrady"),
      shippingMethod: z.string().optional().describe("Způsob dopravy"),
      currencyCode: z.string().optional().describe("Kód měny"),
      exchangeRate: z.number().optional().describe("Kurz měny"),
      exchangeRateAmount: z
        .number()
        .optional()
        .describe("Počet jednotek měny pro kurz"),
      accountAssignmentShortCut: z
        .string()
        .optional()
        .describe("Zkratka předkontace"),
      centreShortCut: z.string().optional().describe("Zkratka střediska"),
      jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
      operationShortCut: z.string().optional().describe("Zkratka činnosti"),
      vatClassificationShortCut: z
        .string()
        .optional()
        .describe("Zkratka členění DPH"),
      invoiceTextBeforePrices: z
        .string()
        .optional()
        .describe("Text před cenami"),
      invoiceTextBehindPrices: z
        .string()
        .optional()
        .describe("Text za cenami"),
      partnerAddress: partnerAddressSchema,
      items: z
        .array(invoiceItemSchema)
        .optional()
        .describe("Položky faktury (nahradí existující)"),
    },
    withErrorHandler(async (params) => {
      const input = buildInvoiceInput(params);
      input.guid = params.guid;

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_ISSUED_INVOICE,
        { issuedInvoice: input },
      );

      const promise = result.updateIssuedInvoice;
      if (!promise.isSuccess) {
        return toolError(
          "Požadavek na aktualizaci vydané faktury nebyl přijat",
        );
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // DELETE ISSUED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "delete_issued_invoice",
    "Smaže vydanou fakturu podle jejího ID.",
    {
      id: z.number().describe("ID vydané faktury ke smazání"),
      year: z.number().optional().describe("Účetní rok (nepovinné)"),
    },
    withErrorHandler(async (params) => {
      const input: Record<string, unknown> = { id: params.id };
      if (params.year !== undefined) input.year = params.year;

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_ISSUED_INVOICE,
        { issuedInvoice: input },
      );

      const promise = result.deleteIssuedInvoice;
      if (!promise.isSuccess) {
        return toolError("Požadavek na smazání vydané faktury nebyl přijat");
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // LIST RECEIVED INVOICES
  // -------------------------------------------------------------------------
  server.tool(
    "list_received_invoices",
    "Vypíše přijaté faktury s filtrováním dle data, firmy, čísla dokladu, variabilního symbolu. Podporuje stránkování a řazení.",
    {
      ...paginationFields,
      dateFrom: z
        .string()
        .optional()
        .describe("Datum vystavení od (YYYY-MM-DD)"),
      dateTo: z
        .string()
        .optional()
        .describe("Datum vystavení do (YYYY-MM-DD)"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      receivedDocumentNumber: z
        .string()
        .optional()
        .describe("Číslo přijatého dokladu"),
      partnerIco: z
        .string()
        .optional()
        .describe("IČO obchodního partnera"),
      year: z.number().optional().describe("Účetní rok"),
      sortBy: receivedInvoiceSortEnum
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
        receivedDocumentNumber: eqFilter(params.receivedDocumentNumber),
        partnerAddress: params.partnerIco
          ? partnerIcoFilter(params.partnerIco)
          : undefined,
        year: eqFilter(params.year),
      });
      const order = buildOrder(params.sortBy, params.sortDirection);

      const result = await client.query<CollectionResponse>(
        LIST_RECEIVED_INVOICES,
        { skip, take, where, order },
      );

      return toolListResponse(
        result.receivedInvoices.items,
        result.receivedInvoices.totalCount,
        params.page,
        params.pageSize,
      );
    }),
  );

  // -------------------------------------------------------------------------
  // GET RECEIVED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "get_received_invoice",
    "Vrátí detail jedné přijaté faktury podle ID včetně položek, plateb, DPH souhrnu a adres.",
    {
      id: z.number().describe("ID přijaté faktury"),
      year: z.number().optional().describe("Účetní rok (nepovinné)"),
    },
    withErrorHandler(async (params) => {
      const where: Record<string, unknown> = {
        id: { eq: params.id },
      };
      if (params.year !== undefined) {
        where.year = { eq: params.year };
      }

      const result = await client.query<CollectionResponse>(
        GET_RECEIVED_INVOICE,
        { where },
      );

      const invoice = result.receivedInvoices.items[0];
      if (!invoice) {
        return toolError(`Přijatá faktura s ID ${params.id} nebyla nalezena`);
      }

      return toolSuccess(invoice);
    }),
  );

  // -------------------------------------------------------------------------
  // CREATE RECEIVED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "create_received_invoice",
    "Vytvoří novou přijatou fakturu s položkami. Povinné je datum vystavení, zdanitelného plnění a splatnosti.",
    {
      dateOfIssue: z.string().describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfMaturity: z.string().describe("Datum splatnosti (YYYY-MM-DD)"),
      numericalSeriePrefix: z
        .string()
        .optional()
        .describe("Prefix číselné řady (např. 'FP')"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      receivedDocumentNumber: z
        .string()
        .optional()
        .describe("Číslo přijatého dokladu (z dodavatele)"),
      description: z.string().optional().describe("Popis dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      pairingSymbol: z.string().optional().describe("Párovací symbol"),
      note: z.string().optional().describe("Poznámka"),
      invoiceType: invoiceTypeEnum
        .default("NORMAL")
        .describe("Typ faktury"),
      isCreditNote: z.boolean().optional().describe("Dobropis"),
      paymentMethod: z
        .string()
        .optional()
        .describe("Způsob úhrady"),
      currencyCode: z
        .string()
        .optional()
        .describe("Kód měny (např. 'EUR')"),
      exchangeRate: z
        .number()
        .optional()
        .describe("Kurz měny (pro cizí měnu)"),
      exchangeRateAmount: z
        .number()
        .optional()
        .describe("Počet jednotek měny pro kurz"),
      accountAssignmentShortCut: z
        .string()
        .optional()
        .describe("Zkratka předkontace"),
      centreShortCut: z.string().optional().describe("Zkratka střediska"),
      jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
      operationShortCut: z.string().optional().describe("Zkratka činnosti"),
      vatClassificationShortCut: z
        .string()
        .optional()
        .describe("Zkratka členění DPH"),
      partnerAddress: partnerAddressSchema,
      items: z
        .array(invoiceItemSchema)
        .optional()
        .describe("Položky faktury"),
    },
    withErrorHandler(async (params) => {
      const input = buildInvoiceInput(params);

      const result = await client.mutate<ImportPromiseResponse>(
        CREATE_RECEIVED_INVOICE,
        { receivedInvoice: input },
      );

      const promise = result.createReceivedInvoice;
      if (!promise.isSuccess) {
        return toolError(
          "Požadavek na vytvoření přijaté faktury nebyl přijat",
        );
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // UPDATE RECEIVED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "update_received_invoice",
    "Aktualizuje existující přijatou fakturu. Identifikace přes GUID faktury. Předejte pouze pole, která chcete změnit.",
    {
      guid: z.string().describe("GUID přijaté faktury k aktualizaci"),
      dateOfIssue: z
        .string()
        .optional()
        .describe("Datum vystavení (YYYY-MM-DD)"),
      dateOfTaxing: z
        .string()
        .optional()
        .describe("Datum zdanitelného plnění (YYYY-MM-DD)"),
      dateOfMaturity: z
        .string()
        .optional()
        .describe("Datum splatnosti (YYYY-MM-DD)"),
      numericalSeriePrefix: z
        .string()
        .optional()
        .describe("Prefix číselné řady"),
      documentNumber: z.string().optional().describe("Číslo dokladu"),
      receivedDocumentNumber: z
        .string()
        .optional()
        .describe("Číslo přijatého dokladu"),
      description: z.string().optional().describe("Popis dokladu"),
      variableSymbol: z.string().optional().describe("Variabilní symbol"),
      specificSymbol: z.string().optional().describe("Specifický symbol"),
      pairingSymbol: z.string().optional().describe("Párovací symbol"),
      note: z.string().optional().describe("Poznámka"),
      invoiceType: invoiceTypeEnum
        .optional()
        .describe("Typ faktury"),
      isCreditNote: z.boolean().optional().describe("Dobropis"),
      paymentMethod: z.string().optional().describe("Způsob úhrady"),
      currencyCode: z.string().optional().describe("Kód měny"),
      exchangeRate: z.number().optional().describe("Kurz měny"),
      exchangeRateAmount: z
        .number()
        .optional()
        .describe("Počet jednotek měny pro kurz"),
      accountAssignmentShortCut: z
        .string()
        .optional()
        .describe("Zkratka předkontace"),
      centreShortCut: z.string().optional().describe("Zkratka střediska"),
      jobOrderShortCut: z.string().optional().describe("Zkratka zakázky"),
      operationShortCut: z.string().optional().describe("Zkratka činnosti"),
      vatClassificationShortCut: z
        .string()
        .optional()
        .describe("Zkratka členění DPH"),
      partnerAddress: partnerAddressSchema,
      items: z
        .array(invoiceItemSchema)
        .optional()
        .describe("Položky faktury (nahradí existující)"),
    },
    withErrorHandler(async (params) => {
      const input = buildInvoiceInput(params);
      input.guid = params.guid;

      const result = await client.mutate<ImportPromiseResponse>(
        UPDATE_RECEIVED_INVOICE,
        { receivedInvoice: input },
      );

      const promise = result.updateReceivedInvoice;
      if (!promise.isSuccess) {
        return toolError(
          "Požadavek na aktualizaci přijaté faktury nebyl přijat",
        );
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );

  // -------------------------------------------------------------------------
  // DELETE RECEIVED INVOICE
  // -------------------------------------------------------------------------
  server.tool(
    "delete_received_invoice",
    "Smaže přijatou fakturu podle jejího ID.",
    {
      id: z.number().describe("ID přijaté faktury ke smazání"),
      year: z.number().optional().describe("Účetní rok (nepovinné)"),
    },
    withErrorHandler(async (params) => {
      const input: Record<string, unknown> = { id: params.id };
      if (params.year !== undefined) input.year = params.year;

      const result = await client.mutate<ImportPromiseResponse>(
        DELETE_RECEIVED_INVOICE,
        { receivedInvoice: input },
      );

      const promise = result.deleteReceivedInvoice;
      if (!promise.isSuccess) {
        return toolError("Požadavek na smazání přijaté faktury nebyl přijat");
      }

      const importResult = await client.waitForImport(promise.guid);
      return toolMutationResponse(importResult);
    }),
  );
}

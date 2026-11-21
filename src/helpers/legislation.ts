/**
 * Legislation detection for Money S3 agendas.
 *
 * Money S3 supports CZ and SK legislation. Some GraphQL fields are only
 * available for SK agendas (e.g. vatPurpose, vatIdentificationNumberSk,
 * isSimplifiedTaxReceipt). Querying these on a CZ agenda causes a runtime
 * error. This module auto-detects the legislation per agenda and caches it.
 */

export type LegislationType = "CZ" | "SK";

/** Per-agenda legislation cache: agendaGuid → CZ | SK */
const legislationCache = new Map<string, LegislationType>();

/** Global override from env (applies to all agendas). */
let globalOverride: LegislationType | undefined;

export function setGlobalLegislation(value: LegislationType | undefined): void {
  globalOverride = value;
}

export function getLegislation(agendaGuid: string): LegislationType | undefined {
  if (globalOverride) return globalOverride;
  return legislationCache.get(agendaGuid);
}

export function setLegislation(agendaGuid: string, value: LegislationType): void {
  legislationCache.set(agendaGuid, value);
}

export function isSkLegislation(agendaGuid: string): boolean {
  return getLegislation(agendaGuid) === "SK";
}

/**
 * Check if a GraphQL error indicates SK-only field access on a CZ agenda.
 */
export function isLegislationError(error: unknown): boolean {
  if (error && typeof error === "object" && "response" in error) {
    const resp = error as { response: { errors?: Array<{ message: string }> } };
    return resp.response.errors?.some(
      (e) => e.message.includes("legislation"),
    ) ?? false;
  }
  if (error instanceof Error) {
    return error.message.includes("legislation");
  }
  return false;
}

/**
 * SK-only scalar fields that must be stripped from queries for CZ agendas.
 */
const SK_ONLY_SCALAR_FIELDS = [
  "vatIdentificationNumberSk",
  "isSimplifiedTaxReceipt",
];

/**
 * SK-only object fields (with sub-selections) that must be stripped.
 */
const SK_ONLY_OBJECT_FIELD = "vatPurpose";

/**
 * Remove SK-only fields from a GraphQL query string.
 * Handles both scalar fields (single line) and object fields (with { ... } block).
 */
export function stripSkFields(query: string): string {
  let result = query;

  // Remove scalar fields (standalone lines like "  vatIdentificationNumberSk")
  for (const field of SK_ONLY_SCALAR_FIELDS) {
    result = result.replace(new RegExp(`^\\s*${field}\\s*$`, "gm"), "");
  }

  // Remove object field with nested selection: "vatPurpose { ... }"
  // Matches: optional whitespace, field name, optional whitespace, { ... }, optional whitespace
  result = result.replace(
    new RegExp(`^\\s*${SK_ONLY_OBJECT_FIELD}\\s*\\{[^}]*\\}\\s*$`, "gm"),
    "",
  );

  return result;
}

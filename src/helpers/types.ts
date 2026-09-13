/**
 * Shared types, interfaces, and Zod schemas used across all tool modules.
 * Eliminates duplication of common patterns.
 */

import { z } from "zod";
import { getMaxPageSize } from "./pagination.js";

// ---------------------------------------------------------------------------
// GraphQL response types
// ---------------------------------------------------------------------------

/** Response from any paginated collection query (skip/take pattern). */
export interface CollectionResponse {
  [key: string]: {
    totalCount: number;
    items: Record<string, unknown>[];
  };
}

/** Response from any mutation — all Money S3 mutations return ImportPromise. */
export interface ImportPromiseResponse {
  [key: string]: {
    guid: string;
    isSuccess: boolean;
  };
}

/** Response from the importStatus query. */
export interface ImportStatusResponse {
  importStatus: {
    guid: string;
    state: string;
    stateInfo: string | null;
  };
}

/** Response from the `years` query (plain array, no pagination). */
export interface YearsResponse {
  years: Array<{
    id: string;
    year: number;
    dateFrom: string;
    dateTo: string;
  }>;
}

// ---------------------------------------------------------------------------
// Shared Zod field schemas
// ---------------------------------------------------------------------------

/**
 * Reusable pagination fields — use with spread in tool schemas.
 * Max page size is configurable via MAX_PAGE_SIZE env var.
 * Note: Zod .max() uses a getter so it reflects the runtime config value.
 */
export const paginationFields = {
  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Číslo stránky (výchozí 1)"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(200)
    .default(20)
    .describe(`Počet záznamů na stránku (výchozí 20, max viz MAX_PAGE_SIZE)`),
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Strip undefined values from an object.
 * Used to build clean mutation inputs without sending undefined fields.
 */
export function cleanInput(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}


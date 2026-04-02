/**
 * Filter builder utilities.
 * Convert simple tool parameters into GraphQL where objects.
 */

/** Build a date range filter: { gte: dateFrom, lte: dateTo } */
export function dateRangeFilter(
  dateFrom?: string,
  dateTo?: string,
): Record<string, string> | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const filter: Record<string, string> = {};
  if (dateFrom) filter.gte = dateFrom;
  if (dateTo) filter.lte = dateTo;
  return filter;
}

/** Build an exact-match filter: { eq: value } */
export function eqFilter<T extends string | number | boolean>(
  value: T | undefined,
): { eq: T } | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return { eq: value };
}

/** Build a nested sub-filter for partner address by ICO */
export function partnerIcoFilter(
  ico?: string,
): Record<string, unknown> | undefined {
  if (!ico) return undefined;
  return {
    identificationNumber: { eq: ico },
  };
}

/**
 * Assemble a where object from field filters, dropping undefined entries.
 * Returns undefined if no filters are active (= no filtering).
 */
export function buildWhere(
  fields: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const where: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      where[key] = value;
    }
  }
  return Object.keys(where).length > 0 ? where : undefined;
}

/** Build an order array from sortBy/sortDirection params */
export function buildOrder(
  sortBy: string,
  sortDirection: string,
): Array<Record<string, string>> {
  return [{ [sortBy]: sortDirection }];
}

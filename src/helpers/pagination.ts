/**
 * Pagination utilities.
 *
 * The max page size is configurable via MAX_PAGE_SIZE env var (default 50).
 * Both the Zod validation (paginationFields) and runtime conversion
 * (toPaginationArgs) use this single value.
 */

/** Current max page size — set once at startup from config. */
let maxPageSize = 50;

/** Set the global max page size. Called once from index.ts after config load. */
export function setMaxPageSize(value: number): void {
  maxPageSize = value;
}

/** Get the current max page size. */
export function getMaxPageSize(): number {
  return maxPageSize;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationArgs {
  skip: number;
  take: number;
}

/**
 * Convert user-friendly page/pageSize to GraphQL skip/take.
 * Clamps pageSize to the configured max.
 */
export function toPaginationArgs(params: PaginationParams): PaginationArgs {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, params.pageSize ?? 20));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

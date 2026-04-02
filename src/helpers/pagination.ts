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
 */
export function toPaginationArgs(params: PaginationParams): PaginationArgs {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}


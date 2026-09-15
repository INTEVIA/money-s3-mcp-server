/**
 * Standardized MCP tool response builders and handler wrapper.
 */

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: true;
}

/** Return a successful tool response with JSON data. */
export function toolSuccess(data: unknown): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/** Return an error tool response with a human-readable message. */
export function toolError(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: `Chyba: ${message}` }],
    isError: true,
  };
}

/** Format a list response with pagination info. */
export function toolListResponse(
  items: unknown[],
  totalCount: number,
  page: number,
  pageSize: number,
): ToolResponse {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  return toolSuccess({
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
  });
}

/** Format a mutation result response. */
export function toolMutationResponse(result: {
  success: boolean;
  state: string;
  stateInfo?: string;
  guid: string;
}): ToolResponse {
  if (!result.success) {
    return toolError(
      `Import selhal (${result.state}): ${result.stateInfo ?? "Neznámá chyba"}`,
    );
  }
  return toolSuccess({
    success: true,
    state: result.state,
    stateInfo: result.stateInfo,
    guid: result.guid,
  });
}

/**
 * Wrap a tool handler with standardised error handling.
 * Eliminates duplicated try/catch blocks across all tools.
 */
export function withErrorHandler<T>(
  handler: (params: T) => Promise<ToolResponse>,
): (params: T) => Promise<ToolResponse> {
  return async (params: T) => {
    try {
      return await handler(params);
    } catch (error) {
      return toolError(
        error instanceof Error ? error.message : "Neznámá chyba",
      );
    }
  };
}

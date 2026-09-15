/**
 * Shared mutation execution with isSuccess check and import polling.
 * Eliminates duplication of the mutation → isSuccess → waitForImport pattern.
 */

import type { MoneyS3Client } from "../graphql/client.js";
import { toolError, toolMutationResponse, type ToolResponse } from "./response.js";
import type { ImportPromiseResponse } from "./types.js";

/**
 * Execute a mutation, check isSuccess, and poll for import completion.
 * Uses client.waitForImport() which respects configured poll timeouts.
 */
export async function executeMutationWithCheck(
  client: MoneyS3Client,
  mutation: string,
  variables: Record<string, unknown>,
  mutationKey: string,
): Promise<ToolResponse> {
  const result = await client.mutate<ImportPromiseResponse>(mutation, variables);
  const importPromise = result[mutationKey];

  if (!importPromise?.isSuccess) {
    return toolError("Požadavek nebyl přijat do fronty importu.");
  }

  const importResult = await client.waitForImport(importPromise.guid);
  return toolMutationResponse(importResult);
}

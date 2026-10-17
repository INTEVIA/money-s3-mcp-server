import type { MoneyS3Client } from "../graphql/client.js";
import { IMPORT_STATUS_QUERY } from "../graphql/queries/import-status.js";
import type { ImportStatusResponse } from "./types.js";

export interface ImportResult {
  success: boolean;
  state: string;
  stateInfo?: string;
  guid: string;
}

/**
 * Poll importStatus until the async mutation completes.
 * States: UNPROCESSED → IN_PROCESS → OK | WARNING | ERROR
 */
export async function waitForImport(
  client: MoneyS3Client,
  guid: string,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<ImportResult> {
  const timeout = options?.timeoutMs ?? 30_000;
  const interval = options?.intervalMs ?? 1_000;
  const maxAttempts = Math.ceil(timeout / interval);

  for (let i = 0; i < maxAttempts; i++) {
    const result = await client.query<ImportStatusResponse>(
      IMPORT_STATUS_QUERY,
      { importGuid: guid },
    );

    const { state, stateInfo } = result.importStatus;

    if (state === "OK" || state === "WARNING") {
      return { success: true, state, stateInfo: stateInfo ?? undefined, guid };
    }
    if (state === "ERROR") {
      return {
        success: false,
        state,
        stateInfo: stateInfo ?? undefined,
        guid,
      };
    }

    // Still UNPROCESSED or IN_PROCESS — wait and retry
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return {
    success: false,
    state: "TIMEOUT",
    stateInfo: `Import nebyl dokončen do ${timeout / 1000} sekund. Použij nástroj check_import_status s guid: ${guid}`,
    guid,
  };
}

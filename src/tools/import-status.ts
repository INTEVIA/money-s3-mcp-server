import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MoneyS3Client } from "../graphql/client.js";
import { toolSuccess, withErrorHandler } from "../helpers/response.js";
import { IMPORT_STATUS_QUERY } from "../graphql/queries/import-status.js";
import type { ImportStatusResponse } from "../helpers/types.js";

export function registerImportStatusTools(
  server: McpServer,
  client: MoneyS3Client,
): void {
  server.tool(
    "check_import_status",
    "Zkontroluje stav asynchronního importu podle GUID. Stavy: UNPROCESSED, IN_PROCESS, OK, WARNING, ERROR",
    {
      guid: z
        .string()
        .uuid()
        .describe("GUID importu (UUID vrácené z mutace)"),
    },
    withErrorHandler(async (params) => {
      const result = await client.query<ImportStatusResponse>(
        IMPORT_STATUS_QUERY,
        { importGuid: params.guid },
      );

      return toolSuccess({
        guid: result.importStatus.guid,
        state: result.importStatus.state,
        stateInfo: result.importStatus.stateInfo,
      });
    }),
  );
}

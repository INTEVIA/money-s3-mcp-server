#!/usr/bin/env node

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig, type Config } from "./config.js";
import { OAuthManager } from "./auth/oauth.js";
import { MoneyS3Client } from "./graphql/client.js";

// Tool registrations
import { registerInvoiceTools } from "./tools/invoices.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerWarehouseTools } from "./tools/warehouse.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerCodebookTools } from "./tools/codebooks.js";
import { registerAccountingTools } from "./tools/accounting.js";
import { registerEmployeeTools } from "./tools/employees.js";
import { registerImportStatusTools } from "./tools/import-status.js";
import { registerAgendaTools } from "./tools/agenda.js";

async function main() {
  const config = loadConfig();
  const auth = new OAuthManager(config);
  const client = new MoneyS3Client(config, auth);

  const server = new McpServer({
    name: "money-s3",
    version: "1.0.0",
  });

  // Register all tool groups
  registerImportStatusTools(server, client);
  registerAgendaTools(server, client);
  registerCodebookTools(server, client);
  registerInvoiceTools(server, client);
  registerCompanyTools(server, client);
  registerDocumentTools(server, client);
  registerWarehouseTools(server, client);
  registerOrderTools(server, client);
  registerAccountingTools(server, client);
  registerEmployeeTools(server, client);

  if (config.transport === "http") {
    await startHttpTransport(server, config);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Money S3 MCP server běží na stdio transportu");
  }
}

// ---------------------------------------------------------------------------
// Bearer token auth
// ---------------------------------------------------------------------------

/**
 * Verify the Authorization: Bearer <token> header.
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns true if authorized, false if rejected (response already sent).
 */
function checkAuth(
  req: IncomingMessage,
  res: ServerResponse,
  expectedToken: string,
): boolean {
  const header = req.headers.authorization;

  if (!header) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
    });
    res.end(JSON.stringify({ error: "Missing Authorization header" }));
    return false;
  }

  const [scheme, token] = header.split(" ", 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
    });
    res.end(JSON.stringify({ error: "Invalid Authorization header format" }));
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(expectedToken, "utf8");
  const actual = Buffer.from(token, "utf8");
  const valid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!valid) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid token" }));
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Favicon
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const faviconBuffer = readFileSync(join(__dirname, "assets", "favicon.png"));

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

async function startHttpTransport(server: McpServer, config: Config): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const authEnabled = config.authToken !== undefined;

  if (authEnabled) {
    console.error("HTTP auth: Bearer token ověřování je aktivní");
  } else {
    console.error(
      "HTTP auth: VAROVÁNÍ — MCP_AUTH_TOKEN není nastaven, endpoint /mcp je nechráněný!",
    );
  }

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // Health check — always public (for Docker HEALTHCHECK / load balancers)
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Favicon
    if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.png") {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      });
      res.end(faviconBuffer);
      return;
    }

    // MCP endpoint — protected by bearer token when MCP_AUTH_TOKEN is set
    if (url.pathname === "/mcp") {
      if (authEnabled && !checkAuth(req, res, config.authToken!)) {
        return;
      }
      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  httpServer.listen(config.port, "0.0.0.0", () => {
    console.error(
      `Money S3 MCP server běží na HTTP transportu (port ${config.port})`,
    );
  });

  const shutdown = async () => {
    console.error("Ukončuji server...");
    await transport.close();
    httpServer.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Kritická chyba při spuštění serveru:", error);
  process.exit(1);
});

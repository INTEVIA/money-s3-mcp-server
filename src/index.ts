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

  // Apply global settings from config
  const { setMaxPageSize } = await import("./helpers/pagination.js");
  setMaxPageSize(config.maxPageSize);

  if (config.legislation) {
    const { setGlobalLegislation } = await import("./helpers/legislation.js");
    setGlobalLegislation(config.legislation);
    console.error(`Legislativa nastavena globálně z env: ${config.legislation}`);
  }

  const auth = new OAuthManager(config);
  const client = new MoneyS3Client(config, auth);

  // Factory: creates a new McpServer with all tools registered.
  // Called once for stdio, or once per HTTP session.
  function createMcpServer(): McpServer {
    const server = new McpServer({
      name: "money-s3",
      version: "1.0.0",
    });
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
    return server;
  }

  if (config.transport === "http") {
    await startHttpTransport(createMcpServer, config);
  } else {
    const transport = new StdioServerTransport();
    await createMcpServer().connect(transport);
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

/** True for addresses that are reachable only from the local machine. */
function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    h === "localhost" ||
    h === "::1" ||
    h.startsWith("127.") ||
    h.startsWith("::ffff:127.")
  );
}

/**
 * DNS rebinding / cross-site protection for the unauthenticated loopback mode.
 * A malicious web page can make the browser reach 127.0.0.1 under its own
 * domain name — reject any Host or Origin that is not a loopback address.
 * Returns true if allowed, false if rejected (response already sent).
 */
function checkLocalRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const reject = (error: string): false => {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error }));
    return false;
  };

  const hostHeader = req.headers.host;
  if (!hostHeader) {
    return reject("Missing Host header");
  }
  let hostname: string;
  try {
    hostname = new URL(`http://${hostHeader}`).hostname;
  } catch {
    return reject("Invalid Host header");
  }
  if (!isLoopbackHost(hostname)) {
    return reject("Host not allowed");
  }

  // Non-browser MCP clients send no Origin; browsers always do on cross-site requests
  const origin = req.headers.origin;
  if (origin !== undefined) {
    let originHostname: string;
    try {
      originHostname = new URL(origin).hostname;
    } catch {
      return reject("Origin not allowed");
    }
    if (!isLoopbackHost(originHostname)) {
      return reject("Origin not allowed");
    }
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

async function startHttpTransport(
  createServer_: () => McpServer,
  config: Config,
): Promise<void> {
  const authEnabled = config.authToken !== undefined;

  // Fail closed: never expose an unauthenticated /mcp on a network interface
  if (!authEnabled && !isLoopbackHost(config.host)) {
    throw new Error(
      `MCP_AUTH_TOKEN není nastaven a MCP_HOST=${config.host} není loopback adresa — ` +
        "server odmítá vystavit nechráněný endpoint /mcp do sítě. " +
        "Nastavte MCP_AUTH_TOKEN (např. `openssl rand -hex 32`) nebo MCP_HOST=127.0.0.1.",
    );
  }

  if (authEnabled) {
    console.error("HTTP auth: Bearer token ověřování je aktivní");
  } else {
    console.error(
      `HTTP auth: MCP_AUTH_TOKEN není nastaven — endpoint /mcp je bez ověřování, dostupný jen lokálně (${config.host})`,
    );
  }

  // Session map: sessionId → { transport, lastActivity }
  const sessions = new Map<
    string,
    { transport: StreamableHTTPServerTransport; lastActivity: number }
  >();

  // Session TTL: close sessions idle for more than 30 minutes
  const SESSION_TTL_MS = 30 * 60 * 1000;
  const sessionCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastActivity > SESSION_TTL_MS) {
        console.error(`Uzavírám neaktivní session ${id}`);
        session.transport.close().catch(() => {});
        sessions.delete(id);
      }
    }
  }, 60_000);

  const httpServer = createServer(async (req, res) => {
    // Fixed base — a malformed Host header must not throw (unhandled rejection kills the process)
    const url = new URL(req.url ?? "/", "http://localhost");

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

    // MCP endpoint — bearer token, or loopback-only Host/Origin check when no token is set
    if (url.pathname === "/mcp") {
      const allowed = authEnabled
        ? checkAuth(req, res, config.authToken!)
        : checkLocalRequest(req, res);
      if (!allowed) {
        return;
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      // Reuse existing session transport if available
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.lastActivity = Date.now();
        await session.transport.handleRequest(req, res);
        return;
      }

      // New session: create a fresh transport + server
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport, lastActivity: Date.now() });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      const mcpServer = createServer_();
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  httpServer.listen(config.port, config.host, () => {
    console.error(
      `Money S3 MCP server běží na HTTP transportu (${config.host}:${config.port})`,
    );
  });

  const shutdown = async () => {
    console.error("Ukončuji server...");
    clearInterval(sessionCleanupInterval);
    for (const session of sessions.values()) {
      await session.transport.close();
    }
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

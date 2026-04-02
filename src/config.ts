import { z } from "zod";

const configSchema = z.object({
  domain: z.string().min(1, "MONEY_S3_DOMAIN je povinný"),
  clientId: z.string().min(1, "MONEY_S3_CLIENT_ID je povinný"),
  clientSecret: z.string().min(1, "MONEY_S3_CLIENT_SECRET je povinný"),
  agendaGuid: z.string().uuid("MONEY_S3_AGENDA_GUID musí být platné UUID").optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  isLocal: z.boolean().default(false),
  appId: z.string().min(1, "MONEY_S3_APP_ID je povinný"),
  importPollTimeoutMs: z.number().int().positive().default(30000),
  importPollIntervalMs: z.number().int().positive().default(1000),
  transport: z.enum(["stdio", "http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
  authToken: z.string().optional(),
  legislation: z.enum(["CZ", "SK"]).optional(),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    domain: process.env.MONEY_S3_DOMAIN,
    clientId: process.env.MONEY_S3_CLIENT_ID,
    clientSecret: process.env.MONEY_S3_CLIENT_SECRET,
    agendaGuid: process.env.MONEY_S3_AGENDA_GUID || undefined,
    username: process.env.MONEY_S3_USERNAME || undefined,
    password: process.env.MONEY_S3_PASSWORD || undefined,
    isLocal: process.env.MONEY_S3_LOCAL === "true",
    appId: process.env.MONEY_S3_APP_ID,
    importPollTimeoutMs: parseInt(process.env.IMPORT_POLL_TIMEOUT_MS || "30000", 10),
    importPollIntervalMs: parseInt(process.env.IMPORT_POLL_INTERVAL_MS || "1000", 10),
    transport: process.env.MCP_TRANSPORT || "stdio",
    port: parseInt(process.env.MCP_PORT || "3000", 10),
    authToken: process.env.MCP_AUTH_TOKEN || undefined,
    legislation: process.env.MONEY_S3_LEGISLATION || undefined,
  });
}

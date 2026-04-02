import { GraphQLClient } from "graphql-request";
import type { Config } from "../config.js";
import type { OAuthManager } from "../auth/oauth.js";
import { waitForImport, type ImportResult } from "../helpers/import-poller.js";

/** Default request timeout: 30 seconds. */
const REQUEST_TIMEOUT_MS = 30_000;

export class MoneyS3Client {
  private graphqlClient: GraphQLClient;
  private config: Config;
  private auth: OAuthManager;

  constructor(config: Config, auth: OAuthManager) {
    this.config = config;
    this.auth = auth;
    this.graphqlClient = new GraphQLClient(this.getEndpoint());
  }

  /**
   * Execute a GraphQL query with automatic auth, timeout, and retry on 401.
   */
  async query<T>(
    queryStr: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    await this.updateHeaders();
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    try {
      return await this.graphqlClient.request<T>({
        document: queryStr,
        variables,
        signal,
      });
    } catch (error: unknown) {
      // On 401, force token refresh and retry once
      if (this.isAuthError(error)) {
        await this.updateHeaders(true);
        const retrySignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
        return await this.graphqlClient.request<T>({
          document: queryStr,
          variables,
          signal: retrySignal,
        });
      }
      throw this.formatError(error);
    }
  }

  /**
   * Execute a GraphQL mutation (same as query, alias for clarity).
   */
  async mutate<T>(
    mutationStr: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.query<T>(mutationStr, variables);
  }

  private async updateHeaders(forceRefresh = false): Promise<void> {
    const token = await this.auth.getToken(forceRefresh);
    this.graphqlClient.setHeaders({
      Authorization: `Bearer ${token}`,
      AgendaGuid: this.config.agendaGuid,
    });
  }

  private isAuthError(error: unknown): boolean {
    if (error && typeof error === "object" && "response" in error) {
      const resp = (error as { response: { status?: number } }).response;
      return resp?.status === 401;
    }
    return false;
  }

  private getEndpoint(): string {
    if (this.config.isLocal) return "http://localhost:85/graphql/";
    return `https://${this.config.domain}.api.moneys3.eu/graphql/`;
  }

  /**
   * Poll importStatus using configured timeouts from env.
   */
  async waitForImport(guid: string): Promise<ImportResult> {
    return waitForImport(this, guid, {
      timeoutMs: this.config.importPollTimeoutMs,
      intervalMs: this.config.importPollIntervalMs,
    });
  }

  /**
   * Format a GraphQL or network error into a human-readable Error.
   * Public so tool handlers can use it in their catch blocks.
   */
  formatError(error: unknown): Error {
    if (error && typeof error === "object" && "response" in error) {
      const resp = error as {
        response: { errors?: Array<{ message: string }> };
        message: string;
      };
      const messages = resp.response.errors
        ?.map((e) => e.message)
        .join("; ");
      return new Error(`GraphQL chyba: ${messages ?? resp.message}`);
    }
    if (error instanceof Error) return new Error(`Chyba: ${error.message}`);
    return new Error("Neznámá chyba");
  }
}

import { GraphQLClient } from "graphql-request";
import type { Config } from "../config.js";
import type { OAuthManager } from "../auth/oauth.js";
import { waitForImport, type ImportResult } from "../helpers/import-poller.js";
import {
  getLegislation,
  setLegislation,
  isLegislationError,
  stripSkFields,
  type LegislationType,
} from "../helpers/legislation.js";

/** Default request timeout: 30 seconds. */
const REQUEST_TIMEOUT_MS = 30_000;

export class MoneyS3Client {
  private graphqlClient: GraphQLClient;
  private config: Config;
  private auth: OAuthManager;
  private activeAgendaGuid: string | undefined;

  constructor(config: Config, auth: OAuthManager) {
    this.config = config;
    this.auth = auth;
    this.activeAgendaGuid = config.agendaGuid;
    this.graphqlClient = new GraphQLClient(this.getEndpoint());
  }

  /**
   * Switch the active agenda. All subsequent requests will use this GUID.
   */
  setAgendaGuid(guid: string): void {
    this.activeAgendaGuid = guid;
  }

  /**
   * Get the currently active agenda GUID, or undefined if not set.
   */
  getAgendaGuid(): string | undefined {
    return this.activeAgendaGuid;
  }

  /**
   * Get the detected legislation type for the active agenda.
   */
  getLegislationType(): LegislationType | undefined {
    if (!this.activeAgendaGuid) return undefined;
    return getLegislation(this.activeAgendaGuid);
  }

  /**
   * Execute a GraphQL query with automatic auth, timeout, retry on 401,
   * and legislation-aware SK field stripping.
   *
   * On first call for an agenda, assumes SK (full fields). If the API returns
   * a legislation error, marks the agenda as CZ, strips SK fields, and retries.
   */
  async query<T>(
    queryStr: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    await this.updateHeaders();
    const effectiveQuery = this.applyLegislationFilter(queryStr);
    return this.executeRequest<T>(effectiveQuery, queryStr, variables);
  }

  /**
   * Execute a GraphQL query without requiring AgendaId header (agenda selection).
   * Used for agenda-listing queries that must work before an agenda is selected.
   */
  async queryWithoutAgenda<T>(
    queryStr: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    await this.updateHeadersWithoutAgenda();
    return this.executeRequest<T>(queryStr, queryStr, variables);
  }

  /**
   * Strip SK-only fields if the active agenda is known to be CZ.
   * If legislation is unknown (first call), return the full query (try SK first).
   */
  private applyLegislationFilter(queryStr: string): string {
    if (!this.activeAgendaGuid) return queryStr;
    const leg = getLegislation(this.activeAgendaGuid);
    if (leg === "CZ") return stripSkFields(queryStr);
    return queryStr; // SK or unknown — send full query
  }

  private async executeRequest<T>(
    queryStr: string,
    originalQueryStr: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
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
        await this.updateHeadersWithoutAgenda(true);
        const retrySignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
        return await this.graphqlClient.request<T>({
          document: queryStr,
          variables,
          signal: retrySignal,
        });
      }

      // On legislation error, mark agenda as CZ, strip SK fields, and retry
      if (this.activeAgendaGuid && isLegislationError(error)) {
        setLegislation(this.activeAgendaGuid, "CZ");
        console.error(
          `Agenda ${this.activeAgendaGuid} detekována jako CZ legislativa, opakuji dotaz bez SK polí`,
        );
        const czQuery = stripSkFields(originalQueryStr);
        const retrySignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
        return await this.graphqlClient.request<T>({
          document: czQuery,
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
    if (!this.activeAgendaGuid) {
      throw new Error(
        "Agenda není nastavena. Použijte nástroj switch_agenda nebo nastavte MONEY_S3_AGENDA_GUID.",
      );
    }
    const token = await this.auth.getToken(forceRefresh);
    this.graphqlClient.setHeaders({
      Authorization: `Bearer ${token}`,
      AgendaId: this.activeAgendaGuid,
    });
  }

  private async updateHeadersWithoutAgenda(forceRefresh = false): Promise<void> {
    const token = await this.auth.getToken(forceRefresh);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (this.activeAgendaGuid) {
      headers.AgendaId = this.activeAgendaGuid;
    }
    this.graphqlClient.setHeaders(headers);
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

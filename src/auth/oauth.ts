import type { Config } from "../config.js";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class OAuthManager {
  private config: Config;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Returns a valid access token, refreshing if necessary.
   * @param forceRefresh - Force a new token even if current one appears valid
   */
  async getToken(forceRefresh = false): Promise<string> {
    // Return cached token if still valid (with 60s safety margin)
    if (
      !forceRefresh &&
      this.accessToken &&
      Date.now() < this.tokenExpiresAt - 60_000
    ) {
      return this.accessToken;
    }

    await this.fetchNewToken();

    if (!this.accessToken) {
      throw new Error("Chyba autentizace: nepodařilo se získat přístupový token");
    }

    return this.accessToken;
  }

  private async fetchNewToken(): Promise<void> {
    const tokenUrl = this.getTokenUrl();
    const body = this.buildTokenRequestBody();

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chyba autentizace (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  private getTokenUrl(): string {
    const appIdParam = `?AppId=${encodeURIComponent(this.config.appId)}`;
    if (this.config.isLocal) {
      return `http://localhost:85/connect/token${appIdParam}`;
    }
    return `https://${this.config.domain}.api.moneys3.eu/connect/token${appIdParam}`;
  }

  private buildTokenRequestBody(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("client_id", this.config.clientId);
    params.set("client_secret", this.config.clientSecret);

    if (this.config.username && this.config.password) {
      // Resource Owner Password Credentials flow
      params.set("grant_type", "password");
      params.set("username", this.config.username);
      params.set("password", this.config.password);
    } else {
      // Client Credentials flow (recommended)
      params.set("grant_type", "client_credentials");
    }

    return params;
  }
}

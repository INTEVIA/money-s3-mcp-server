# Money S3 API — Facts from Seyfor Support Communication

Source: Email thread seyfor#453989 "Zprovozneni API" (2026-02-25 to 2026-03-27)
Participants: Tomas Skocdopole (tomas.skocdopole@intevia.cz), Lucie Randulova (podpora@money.cz, Seyfor a.s.)

---

## 1. OAuth 2.0 Authentication — Two Grant Types

The Money S3 API supports two OAuth 2.0 flows. Which one to use depends on whether a Money S3 user is assigned to the ClientId/Secret pair in the API key configuration ("Klice API").

### Client Credentials

- **Requires:** ClientId + Secret
- **Prerequisite:** A Money S3 user **must be assigned** to the ClientId/Secret in the API key settings
- Access permissions correspond to the assigned user (e.g., "uzivatel API s plnymi pravy")
- **Rule:** If a user IS assigned to the key, you MUST use Client Credentials

### Resource Owner Password Credentials (ROPC)

- **Requires:** ClientId + Secret + Money S3 username + password
- **Prerequisite:** The user field in the API key settings must be **left empty**
- The username/password are provided at authentication time
- Access permissions correspond to the user whose credentials are provided
- **Rule:** If NO user is assigned to the key, Client Credentials will NOT work — you must use ROPC

### Confirmed Rules (all answered YES by Seyfor)

1. User assigned to key → must use Client Credentials
2. No user assigned to key → Client Credentials does NOT work
3. No user assigned to key → must use ROPC

### Highest Privilege Behavior

If no user is filled in the API Key configuration, the ClientId+Secret combination gets the highest permissions regardless of user. (Observed by customer, not contradicted by support.)

---

## 2. ClientId/Secret Scoping and Multi-Agenda Access

- ClientId and Secret are **visible across all agendas**
- You **can** have separate ClientId/Secret per application (e.g., Digitoo, wflow, custom app)
- You **can** also use a single ClientId/Secret for everything
- Best practice: separate ClientId/Secret per application

### Multi-Agenda Scenarios (confirmed by Seyfor)

**Scenario A — Client Credentials:**
1. Create Money user "AplikaceA" with access to AgendaA and AgendaB
2. Create ClientId+Secret, assign user AplikaceA
3. Connect via Client Credentials (ClientId + Secret only)
4. Result: access to AgendaA and AgendaB only

**Scenario B — ROPC:**
1. Create Money user AplikaceA (access: AgendaA, AgendaB) and AplikaceB (access: AgendaA, AgendaC)
2. Create ClientId+Secret, leave user field empty
3. Connect via ROPC with user=AplikaceA → access to AgendaA and AgendaB
4. Connect via ROPC with user=AplikaceB → access to AgendaA and AgendaC

---

## 3. Tunnel vs Localhost (Network Access)

### Tunnel Enabled ("Tunel povolen")

- API accessible via `https://{domain}.api.moneys3.eu/graphql/`
- Traffic routed through Azure — considered secure
- Accessible from anywhere on the internet

### Tunnel Disabled

- API accessible **only via localhost** (127.0.0.1) on the machine running Money S3
- **No native LAN access** — cannot reach the API from another machine on the same subnet (e.g., 192.168.x.x)
- This is a confirmed limitation: only two modes exist (localhost or tunnel)

### LAN Access Workarounds (used by other integrators)

- **Reverse proxy:** Set up your own tunnel/proxy to route traffic from LAN to localhost
- **Port forwarding:** Install API on PC1 (192.168.0.1) on port 80, configure PC2 (192.168.0.2) to route port 80 to PC1's IP

These are not officially supported or documented by Seyfor. Feature request for native LAN access was submitted.

---

## 4. x86/x64 Installation and Update Rules

- Both 32-bit and 64-bit installers exist
- **Critical rule:** Whichever architecture is updated **LAST** becomes the "primary" — it runs the API service (S3Api), S3 Automatik, and BankaAPI
- To keep 64-bit as primary: update 32-bit first, then 64-bit second
- Only one architecture runs the API service at a time

---

## 5. API Stability and Troubleshooting

### Windows Service

- API service name: **S3Api** (visible in Windows Task Manager / Services)
- Check API status in Money S3: **Nastroje > S3api** — displays API status and configuration

### Known Error — API_VERSIONING_MISSMATCH

```json
{
  "errors": [{
    "message": "Check versioning mismatch general error: MonS3API.MonS3APIException: Uzivatel nebyl prihlasen...",
    "extensions": { "code": "API_VERSIONING_MISSMATCH" }
  }]
}
```

- Error code is misspelled in the API itself: `API_VERSIONING_MISSMATCH` (double S)
- Root cause in stack trace: "Uzivatel nebyl prihlasen" (User was not logged in) during `SetAgenda(Guid)` and `GetDbVersion()` calls
- Internal source paths: `Seyfor.S3Api.Data.MonS3ApiContext.cs:line 66`, `Seyfor.S3Api.GraphQL.Interceptors.HttpRequestInterceptor.cs:line 105`

### Resolution

- **Restarting the S3Api service resolves ~99% of API issues** (confirmed by Seyfor)
- In severe cases: log out all Money S3 users, fully shut down Money, then restart the service
- Service restart is recommended after: failed token fetch, API misbehavior after update, general instability

### Intermediate State

- GraphQL API queries can work while the web UI (Banana Cake Pop) does not load — this is a known behavior. The GraphQL endpoint (`/graphql/`) may respond correctly even when the web IDE shows a loading spinner.

---

## 6. API Endpoints and Documentation

### Endpoints

| URL | Purpose |
|-----|---------|
| `https://{domain}.api.moneys3.eu/graphql/` | Customer-specific API endpoint (requires tunnel) |
| `https://s3api.api.moneys3.eu/graphql/` | Seyfor's public test/schema reference (Banana Cake Pop) |

Navigating to just the domain without `/graphql/` displays nothing — this is normal.

### Documentation

Only two official documentation sources exist:

- `https://money.cz/navod/api-v-money-s3/` — general API guide
- `https://money.cz/navod/api-v-money-s3-pro-vyvojare/` — developer guide

Plus the schema reference in Banana Cake Pop at `https://s3api.api.moneys3.eu/graphql/`.

Schema is being gradually expanded. Some fields are for Slovak agendas only (not indicated in the schema). Documentation is acknowledged by Seyfor as sparse; examples are being prepared.

---

## 7. Seyfor Support Contact

- **Company:** Seyfor, a.s., Drobneho 555/49, 602 00 Brno
- **Support email:** podpora@money.cz
- **Phone:** +420 549 522 503
- **Web:** www.seyfor.cz
- Support can help with specific query/mutation examples on request
- Remote service/consultation sessions available for installation inspection

# Money S3 MCP Server

MCP server pro propojeni AI asistentu s ucetnim systemem **Money S3** pres jeho GraphQL API.

Umoznuje Claudovi (a dalsim AI agentum) pres standardni [Model Context Protocol](https://modelcontextprotocol.io) cist a zapisovat data v Money S3 — faktury, pokladni doklady, bankovni vypisy, sklad, objednavky, ucetnictvi, mzdy a dalsich 15 ciselniku.

## Predpoklady

- **Node.js** >= 20
- **Money S3** s aktivovanym GraphQL API
- API pristupove udaje (Client ID, Client Secret, App ID)

## Instalace

```bash
git clone <url-repozitare> money-s3-mcp-server
cd money-s3-mcp-server
npm install
```

## Konfigurace

Zkopiruj `.env.example` a doplnte sve udaje:

```bash
cp .env.example .env
```

Obsah `.env`:

```env
# Povinne
MONEY_S3_DOMAIN=nazev-domeny              # Domena API (bez .api.moneys3.eu)
MONEY_S3_CLIENT_ID=xxxxxxxx               # Client ID z Klice API v Money S3
MONEY_S3_CLIENT_SECRET=xxxxxxxx           # Client Secret
MONEY_S3_APP_ID=xxxxxxxx                  # ID aplikace (z money.cz, pouziva se v token URL)

# Volitelne — agenda (pokud nenastavite, pouzijte nastroj switch_agenda)
MONEY_S3_AGENDA_GUID=                     # Vychozi agenda GUID (pro pouziti s jednou agendou)
MONEY_S3_LEGISLATION=                     # CZ nebo SK (auto-detekce pokud nenastavite)

# Volitelne — pro Resource Owner Password Credentials flow
MONEY_S3_USERNAME=                         # Uzivatelske jmeno (bez mezer!)
MONEY_S3_PASSWORD=                         # Heslo

# Volitelne — lokalni pristup
MONEY_S3_LOCAL=false                       # true = localhost:85

# Volitelne — paginace
MAX_PAGE_SIZE=50                           # Max zaznamu na stranku (vychozi 50, zvyste pro vykonnejsi modely)

# Volitelne — import polling
IMPORT_POLL_TIMEOUT_MS=30000               # Max cekani na async import (ms)
IMPORT_POLL_INTERVAL_MS=1000               # Interval pollingu (ms)

# Volitelne — transport (Docker / HTTP)
MCP_TRANSPORT=stdio                        # "stdio" (vychozi) nebo "http" (Docker)
MCP_PORT=3000                              # Port pro HTTP rezim
MCP_AUTH_TOKEN=                            # Bearer token pro HTTP auth (doporuceno pro produkci)
```

### Kde najdu pristupove udaje?

1. **MONEY_S3_DOMAIN** — domena vaseho Money S3 cloudu (cast pred `.api.moneys3.eu`)
2. **Client ID / Secret** — v Money S3 jdete do *Nastaveni > API > Klice API*, vytvorte novy klic
3. **App ID** — vyplnte formular na money.cz, ID aplikace vam prijde emailem
4. **Agenda GUID** (volitelne) — v Money S3 jdete do *Nastaveni > Agendy*, kliknete na agendu, GUID je v detailu. Pokud nenastavite, pouzijte nastroj `list_agendas` a `switch_agenda` za behu.

## Sestaveni a spusteni

```bash
# Sestaveni TypeScriptu
npm run build

# Spusteni (produkce, stdio — vychozi)
npm start

# Spusteni HTTP rezimu (pro Docker / sitovy pristup)
MCP_TRANSPORT=http MCP_PORT=3000 npm start

# Vyvoj s automatickym reloadem
npm run dev
```

## Pouziti s Claude Desktop

Pridejte do `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "money-s3": {
      "command": "node",
      "args": ["/absolutni/cesta/k/money-s3-mcp-server/dist/index.js"],
      "env": {
        "MONEY_S3_DOMAIN": "moje-domena",
        "MONEY_S3_CLIENT_ID": "vas-client-id",
        "MONEY_S3_CLIENT_SECRET": "vas-client-secret",
        "MONEY_S3_APP_ID": "vase-app-id"
      }
    }
  }
}
```

> **Poznamka:** `MONEY_S3_AGENDA_GUID` je volitelny. Pokud ho nenastavite, pouzijte `list_agendas` a `switch_agenda` pro vyber agendy za behu. Pro jednoagendove nasazeni ho muzete pridat do `env`.

Umisteni konfiguracniho souboru:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Po restartu Claude Desktop se server automaticky spusti a zpristupni 187 nastroju.

## Pouziti s Claude Code

### Pres CLI (doporuceno)

```bash
# Stdio (lokalni vyvoj)
claude mcp add money-s3 node /cesta/k/money-s3-mcp-server/dist/index.js \
  --transport stdio \
  --env MONEY_S3_DOMAIN=moje-domena \
  --env MONEY_S3_CLIENT_ID=vas-client-id \
  --env MONEY_S3_CLIENT_SECRET=vas-client-secret \
  --env MONEY_S3_APP_ID=vase-app-id

# HTTP (Docker / remote server)
claude mcp add money-s3 https://vas-server.example.com/mcp \
  --transport http \
  --header "Authorization: Bearer VAS_MCP_AUTH_TOKEN"
```

### Rucne pres settings.json

Pridejte do `.claude/settings.json` v projektu nebo globalne:

```json
{
  "mcpServers": {
    "money-s3": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/cesta/k/money-s3-mcp-server",
      "env": {
        "MONEY_S3_DOMAIN": "moje-domena",
        "MONEY_S3_CLIENT_ID": "vas-client-id",
        "MONEY_S3_CLIENT_SECRET": "vas-client-secret",
        "MONEY_S3_APP_ID": "vase-app-id"
      }
    }
  }
}
```

## Spusteni v Dockeru

Server podporuje HTTP transport pomoci `StreamableHTTPServerTransport` z MCP SDK — moderni protokol pro kontejnerizovane nasazeni.

### Rychly start s Docker Compose

1. Zkopirujte `.env.example` na `.env` a doplnte pristupove udaje
2. Nastavte bezpecnostni token:

```bash
cp .env.example .env
# Doplnte MONEY_S3_DOMAIN, CLIENT_ID, CLIENT_SECRET, APP_ID
# Nastavte MCP_AUTH_TOKEN pro zabezpeceni:
echo "MCP_AUTH_TOKEN=$(openssl rand -hex 32)" >> .env
```

3. Spustte:

```bash
docker compose up --build -d
```

4. Overeni:

```bash
# Health check (verejny, bez tokenu)
curl http://localhost:3000/health
# → {"status":"ok"}

# MCP endpoint (vyzaduje token)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VAS_TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### Rucni Docker build

```bash
docker build -t money-s3-mcp .
docker run -d -p 3000:3000 --env-file .env money-s3-mcp
```

### Automaticky start po rebootu

Kontejner ma `restart: always`, takze se automaticky spusti po restartu. Predpoklad: Docker daemon musi byt zapnuty pri startu systemu.

```bash
# Overeni, ze Docker startuje pri bootu (systemd)
sudo systemctl enable docker

# Overeni, ze kontejner bezi a ma restart policy "always"
docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' money-s3-mcp-server-money-s3-mcp-1
# → always
```

Pokud pouzivate `docker run` misto Compose, pridejte `--restart always`:

```bash
docker run -d --restart always -p 3000:3000 --env-file .env money-s3-mcp
```

### Vlastnosti Docker obrazu

- **Multi-stage build** — prvni faze kompiluje TypeScript, druha obsahuje jen produkci
- **node:22-alpine** — minimalni obraz (~50 MB)
- **Non-root uzivatel** — bezi pod `mcpuser` (UID 1001)
- **HEALTHCHECK** — Docker automaticky kontroluje `/health` kazdych 30s
- **Graceful shutdown** — reaguje na SIGTERM (Docker stop)
- **restart: always** — kontejner se automaticky spusti po rebootu i po padu

## Transporty

Server podporuje dva transportni rezimy, vyber pres env promennou `MCP_TRANSPORT`:

| Rezim | Popis | Pouziti |
|-------|-------|---------|
| `stdio` (vychozi) | stdin/stdout, MCP pres podproces | Claude Desktop, Claude Code, lokalni vyvoj |
| `http` | Streamable HTTP na portu `MCP_PORT` | Docker, sitove nasazeni, vice klientu |

### HTTP transport — endpointy

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/health` | GET | Health check — vzdy verejny (pro Docker HEALTHCHECK / load balancer) |
| `/mcp` | POST | MCP zpravy (klient → server) — chraneny tokenem |
| `/mcp` | GET | SSE notifikace (server → klient) — chraneny tokenem |
| `/mcp` | DELETE | Ukonceni MCP session — chraneny tokenem |

## Zabezpeceni HTTP transportu

Kdyz je server v HTTP rezimu, endpoint `/mcp` je **ve vychozim stavu otevreny** (pro snadny lokalni vyvoj). Pro produkci **nutne nastavit** `MCP_AUTH_TOKEN`.

### Konfigurace

```bash
# Generovani nahodneho tokenu
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
```

### Jak to funguje

- Nastaven `MCP_AUTH_TOKEN` → kazdý pozadavek na `/mcp` musi obsahovat hlavicku `Authorization: Bearer <token>`
- Nenastaven `MCP_AUTH_TOKEN` → endpoint je nechraneny (varování do logu)
- `/health` je **vzdy verejny** — neni chraneny tokenem (pro Docker HEALTHCHECK, load balancery)

### HTTP odpovedi pri chybe autentizace

| Situace | HTTP kod | Odpoved |
|---------|----------|---------|
| Chybi hlavicka `Authorization` | 401 | `{"error":"Missing Authorization header"}` |
| Spatny format (ne `Bearer <token>`) | 401 | `{"error":"Invalid Authorization header format"}` |
| Neplatny token | 403 | `{"error":"Invalid token"}` |

Token je porovnavan pomoci `crypto.timingSafeEqual()` — odolny vuci timing attackum.

### Pripojeni AI klienta pres HTTP

AI klient (napr. Claude Desktop Remote, vlastni agent) se pripojuje takto:

```json
{
  "mcpServers": {
    "money-s3": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer VAS_TOKEN"
      }
    }
  }
}
```

## Priklady pouziti v Claude

```
"Vypis vsechny vydane faktury z ledna 2025"

"Kolik mame neuhrazenych pohledavek?"

"Najdi firmu s ICO 12345678 a ukaž jeji kontaktni udaje"

"Vytvor vydanou fakturu pro firmu ABC s.r.o. na 10 000 Kc za konzultacni sluzby"

"Jake zbozi mame na sklade s mnozstvim pod 5 kusu?"

"Ukaž pokladni doklady za posledni tyden"

"Kolik zamestnancu mame a jake maji pracovni pomery?"

"Ukaz mi dostupne agendy a prepni na firmu ABC"

"Prepni na agendu XYZ a vypis vydane faktury za brezen"
```

## Dostupne nastroje (187)

### Faktury (10 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_issued_invoices` | Vydane faktury s filtrovanim dle data, firmy, neuhrazene castky |
| `get_issued_invoice` | Detail vydane faktury vcetne polozek, plateb, DPH souhrnu |
| `create_issued_invoice` | Vytvori vydanou fakturu s polozkami |
| `update_issued_invoice` | Aktualizuje vydanou fakturu (identifikace pres GUID) |
| `delete_issued_invoice` | Smaze vydanou fakturu |
| `list_received_invoices` | Prijate faktury s filtrovanim dle data, firmy, neuhrazene castky |
| `get_received_invoice` | Detail prijate faktury |
| `create_received_invoice` | Vytvori prijatou fakturu |
| `update_received_invoice` | Aktualizuje prijatou fakturu |
| `delete_received_invoice` | Smaze prijatou fakturu |

### Adresaŕ firem (5 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_companies` | Firmy z adresare s filtrovanim dle ICO, nazvu, kodu |
| `get_company` | Detail firmy vcetne kontaktnich osob, pobocek |
| `create_company` | Vytvori novou firmu v adresari |
| `update_company` | Aktualizuje firmu |
| `delete_company` | Smaze firmu |

### Pokladna, banka, interni doklady (25 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_cash_vouchers` | Pokladni doklady s filtrovanim dle data, pokladny, popisu |
| `get_cash_voucher` | Detail pokladniho dokladu |
| `create_cash_voucher` | Vytvori pokladni doklad |
| `update_cash_voucher` | Aktualizuje pokladni doklad |
| `delete_cash_voucher` | Smaze pokladni doklad |
| `list_bank_statements` | Bankovni vypisy s filtrovanim dle data, bankovniho uctu, popisu |
| `get_bank_statement` | Detail bankovniho vypisu |
| `create_bank_statement` | Vytvori bankovni vypis |
| `update_bank_statement` | Aktualizuje bankovni vypis |
| `delete_bank_statement` | Smaze bankovni vypis |
| `list_internal_documents` | Interni doklady |
| `get_internal_document` | Detail interniho dokladu |
| `create_internal_document` | Vytvori interni doklad |
| `update_internal_document` | Aktualizuje interni doklad |
| `delete_internal_document` | Smaze interni doklad |
| `list_liabilities` | Zavazky |
| `get_liability` | Detail zavazku |
| `create_liability` | Vytvori zavazek |
| `update_liability` | Aktualizuje zavazek |
| `delete_liability` | Smaze zavazek |
| `list_receivables` | Pohledavky |
| `get_receivable` | Detail pohledavky |
| `create_receivable` | Vytvori pohledavku |
| `update_receivable` | Aktualizuje pohledavku |
| `delete_receivable` | Smaze pohledavku |

### Sklad (42 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_articles` | Skladove karty (artikly) s filtrovanim dle nazvu, kodu |
| `get_article` | Detail artiklu |
| `create_article` | Vytvori artikl (skladovou kartu) |
| `update_article` | Aktualizuje artikl |
| `delete_article` | Smaze artikl |
| `list_warehouse_stocks` | Skladove zasoby s aktualnim mnozstvim |
| `get_warehouse_stock` | Detail zasoby |
| `create_warehouse_stock` | Vytvori skladovou zasobu |
| `update_warehouse_stock` | Aktualizuje skladovou zasobu |
| `delete_warehouse_stock` | Smaze skladovou zasobu |
| `list_warehouses` | Seznam skladu |
| `list_received_slips` | Prijemky |
| `create_received_slip` | Vytvori prijemku |
| `update_received_slip` | Aktualizuje prijemku |
| `delete_received_slip` | Smaze prijemku |
| `list_issued_slips` | Vydejky |
| `create_issued_slip` | Vytvori vydejku |
| `update_issued_slip` | Aktualizuje vydejku |
| `delete_issued_slip` | Smaze vydejku |
| `list_sale_slips` | Prodejky |
| `create_sale_slip` | Vytvori prodejku |
| `update_sale_slip` | Aktualizuje prodejku |
| `delete_sale_slip` | Smaze prodejku |
| `list_transfer_notes` | Prevodky |
| `create_transfer_note` | Vytvori prevodku |
| `update_transfer_note` | Aktualizuje prevodku |
| `delete_transfer_note` | Smaze prevodku |
| `list_received_delivery_notes` | Prijate dodaci listy |
| `create_received_delivery_note` | Vytvori prijaty dodaci list |
| `update_received_delivery_note` | Aktualizuje prijaty dodaci list |
| `delete_received_delivery_note` | Smaze prijaty dodaci list |
| `list_issued_delivery_notes` | Vydane dodaci listy |
| `create_issued_delivery_note` | Vytvori vydany dodaci list |
| `update_issued_delivery_note` | Aktualizuje vydany dodaci list |
| `delete_issued_delivery_note` | Smaze vydany dodaci list |
| `list_production_notes` | Vyrobni listy |
| `list_stock_takings` | Inventury |
| `list_stock_taking_documents` | Inventurni doklady |
| `create_stock_taking_document` | Vytvori inventurni doklad |
| `update_stock_taking_document` | Aktualizuje inventurni doklad |
| `delete_stock_taking_document` | Smaze inventurni doklad |
| `list_stock_taking_types` | Typy inventur |

### Objednavky, nabidky, poptavky (26 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_received_orders` | Prijate objednavky |
| `create_received_order` | Vytvori prijatou objednavku |
| `update_received_order` | Aktualizuje prijatou objednavku |
| `delete_received_order` | Smaze prijatou objednavku |
| `list_issued_orders` | Vydane objednavky |
| `create_issued_order` | Vytvori vydanou objednavku |
| `update_issued_order` | Aktualizuje vydanou objednavku |
| `delete_issued_order` | Smaze vydanou objednavku |
| `list_received_offers` | Prijate nabidky |
| `create_received_offer` | Vytvori prijatou nabidku |
| `update_received_offer` | Aktualizuje prijatou nabidku |
| `delete_received_offer` | Smaze prijatou nabidku |
| `list_issued_offers` | Vydane nabidky |
| `create_issued_offer` | Vytvori vydanou nabidku |
| `update_issued_offer` | Aktualizuje vydanou nabidku |
| `delete_issued_offer` | Smaze vydanou nabidku |
| `list_received_inquiries` | Prijate poptavky |
| `create_received_inquiry` | Vytvori prijatou poptavku |
| `update_received_inquiry` | Aktualizuje prijatou poptavku |
| `delete_received_inquiry` | Smaze prijatou poptavku |
| `list_issued_inquiries` | Vydane poptavky |
| `create_issued_inquiry` | Vytvori vydanou poptavku |
| `update_issued_inquiry` | Aktualizuje vydanou poptavku |
| `delete_issued_inquiry` | Smaze vydanou poptavku |
| `list_services` | Servisni doklady |
| `list_repairs` | Opravy |

### Ciselniky (51 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_currencies` | Meny (ISO kody, kurzy) |
| `list_centres` | Strediska |
| `create_centre` | Vytvori stredisko |
| `update_centre` | Aktualizuje stredisko |
| `delete_centre` | Smaze stredisko |
| `list_operations` | Cinnosti |
| `create_operation` | Vytvori cinnost |
| `update_operation` | Aktualizuje cinnost |
| `delete_operation` | Smaze cinnost |
| `list_numerical_series` | Ciselne rady |
| `list_bank_account_cash_boxes` | Bankovni ucty a pokladny |
| `create_bank_account_cash_box` | Vytvori bankovni ucet/pokladnu |
| `update_bank_account_cash_box` | Aktualizuje bankovni ucet/pokladnu |
| `delete_bank_account_cash_box` | Smaze bankovni ucet/pokladnu |
| `list_vat_classifications` | Klasifikace DPH |
| `create_vat_classification` | Vytvori klasifikaci DPH |
| `update_vat_classification` | Aktualizuje klasifikaci DPH |
| `delete_vat_classification` | Smaze klasifikaci DPH |
| `list_account_charts` | Uctovy rozvrh (uctova osnova) |
| `create_account_chart` | Vytvori ucet v rozvrhu |
| `update_account_chart` | Aktualizuje ucet v rozvrhu |
| `delete_account_chart` | Smaze ucet z rozvrhu |
| `list_countries` | Staty (ISO kody) |
| `list_constant_symbols` | Konstantni symboly |
| `list_exchange_lists` | Kurzovni listky |
| `list_price_levels` | Cenove hladiny |
| `list_vat_purposes` | Ucely DPH |
| `list_address_keys` | Klice adres |
| `list_shippings` | Dopravci |
| `list_parameters` | Parametry (pro zasoby) |
| `create_parameter` | Vytvori parametr |
| `update_parameter` | Aktualizuje parametr |
| `delete_parameter` | Smaze parametr |
| `list_banks` | Banky (ciselnik) |
| `list_combined_nomenclatures` | Kombinovana nomenklatura (celni kody) |
| `list_municipality_postal_codes` | Obce a PSC |
| `create_vat_accounting_acc` | Vytvori uctovani DPH (podvojne) |
| `update_vat_accounting_acc` | Aktualizuje uctovani DPH (podvojne) |
| `delete_vat_accounting_acc` | Smaze uctovani DPH (podvojne) |
| `create_vat_accounting_tr` | Vytvori uctovani DPH (danova evidence) |
| `update_vat_accounting_tr` | Aktualizuje uctovani DPH (danova evidence) |
| `delete_vat_accounting_tr` | Smaze uctovani DPH (danova evidence) |
| `create_account_assignment_acc` | Vytvori predkontaci (podvojne) |
| `update_account_assignment_acc` | Aktualizuje predkontaci (podvojne) |
| `delete_account_assignment_acc` | Smaze predkontaci (podvojne) |
| `create_account_assignment_tr` | Vytvori predkontaci (danova evidence) |
| `update_account_assignment_tr` | Aktualizuje predkontaci (danova evidence) |
| `delete_account_assignment_tr` | Smaze predkontaci (danova evidence) |
| `create_account_movement` | Vytvori ucetni pohyb |
| `update_account_movement` | Aktualizuje ucetni pohyb |
| `delete_account_movement` | Smaze ucetni pohyb |

### Ucetnictvi (8 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_journal_accs` | Ucetni zurnal (podvojne ucetnictvi) |
| `list_journal_trs` | Penezni zurnal (danova evidence) |
| `list_account_assignments_acc` | Predkontace (podvojne ucetnictvi) |
| `list_account_assignments_tr` | Predkontace (danova evidence) |
| `list_account_movements` | Ucetni pohyby |
| `list_vat_accounting_accs` | Uctovani DPH (podvojne ucetnictvi) |
| `list_vat_accounting_trs` | Uctovani DPH (danova evidence) |
| `list_non_monetary_payments` | Nepenezni platidla (stravenky, poukazky) |

### Zamestnanci a mzdy (7 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_employees` | Zamestnanci s filtrovanim dle jmena, osobniho cisla |
| `get_employee` | Detail zamestnance vcetne pracovnich pomeru |
| `list_employment_types` | Typy pracovnich pomeru |
| `list_employment_codes` | Kody pracovnich pomeru (CSSZ) |
| `create_wage` | Vytvori mzdu zamestnanci za mesic/rok |
| `update_wage` | Aktualizuje mzdu |
| `delete_wage` | Smaze mzdu |

### Agendy a zakazky (12 nastroju)

| Nastroj | Popis |
|---------|-------|
| `list_agendas` | Dostupne agendy (firmy) v systemu — funguje i bez nastavene agendy |
| `switch_agenda` | Prepne aktivni agendu (vsechny nasledujici operace budou pracovat s touto agendou) |
| `get_current_agenda` | Zobrazi aktualne nastavenou agendu (GUID) |
| `list_years` | Ucetni roky aktualni agendy |
| `list_job_orders` | Zakazky s filtrovanim |
| `get_job_order` | Detail zakazky |
| `create_job_order` | Vytvori zakazku |
| `update_job_order` | Aktualizuje zakazku |
| `delete_job_order` | Smaze zakazku |
| `list_job_order_types` | Typy zakazek |
| `list_eshops` | E-shopy pripojene k agende |
| `list_activities` | Aktivity |

### Import status (1 nastroj)

| Nastroj | Popis |
|---------|-------|
| `check_import_status` | Zkontroluje stav asynchronniho importu podle GUID |

## Architektura

```
src/
├── index.ts                     # Vstupni bod — McpServer + stdio/HTTP transport
├── config.ts                    # Zod-validovana konfigurace z env promennych
├── auth/oauth.ts                # OAuth 2.0 (Client Credentials + ROPC flow)
├── graphql/
│   ├── client.ts                # GraphQL klient s automatickou autentizaci a timeouty
│   ├── queries/ (10 souboru)    # GraphQL dotazy dle domeny
│   └── mutations/ (8 souboru)   # GraphQL mutace dle domeny
├── tools/ (10 souboru)          # 187 MCP nastroju
├── helpers/
│   ├── types.ts                 # Sdilene typy, rozhrani a Zod schemata
│   ├── response.ts              # Standardizovane odpovedi + withErrorHandler
│   ├── mutation.ts              # Sdileny vzor mutace s kontrolou isSuccess
│   ├── import-poller.ts         # Polling stavu asynchronniho importu
│   ├── pagination.ts            # Prevod page/pageSize na skip/take
│   ├── filters.ts               # Sestaveni GraphQL filtru z jednoduchych parametru
│   └── legislation.ts           # Auto-detekce CZ/SK legislativy a filtrace poli
```

### Jak funguje zapis dat

Vsechny zapisy (create/update/delete) v Money S3 API jsou **asynchronni**. Mutace vraci `ImportPromise` s GUID a server automaticky polluje vysledek pres `importStatus`, nez vrati odpoved AI agentovi.

```
1. Tool zavola GraphQL mutaci
2. API vrati ImportPromise { guid, isSuccess }
3. Server polluje importStatus(guid) kazdou sekundu
4. Az state = OK/WARNING/ERROR, vrati vysledek agentovi
```

### CZ/SK legislativa

Money S3 podporuje ceskou (CZ) i slovenskou (SK) legislativu. Nektere pole v GraphQL API jsou dostupne **pouze pro slovenskou legislativu** — pri dotazu na ceske agende API vrati chybu `"Member is available only for 'Sk' legislation"`.

Server tuto situaci resi automaticky:

1. Prvni dotaz na agendu odesle vsechna pole (predpoklada SK)
2. Pokud API vrati chybu legislativy, oznaci agendu jako CZ
3. SK pole se automaticky odstrani z dotazu a pozadavek se opakuje
4. Vsechny dalsi dotazy uz SK pole neobsahuji (zadny zbytecny pozadavek navic)

Legislativu lze vynutit pres env promennou `MONEY_S3_LEGISLATION=CZ` (nebo `SK`). Pokud neni nastavena, detekuje se automaticky.

Aktualni legislativu agendy zjistite nastrojem `get_current_agenda`.

## Reseni potizi

### "Chyba autentizace"
- Overite spravnost `MONEY_S3_CLIENT_ID` a `MONEY_S3_CLIENT_SECRET`
- Overite, ze API klic je aktivni v Money S3
- Pro ROPC flow: uzivatelske jmeno nesmi obsahovat mezery

### "Agenda neni nastavena"
- Nastavte `MONEY_S3_AGENDA_GUID` v env, nebo pouzijte nastroj `list_agendas` a nasledne `switch_agenda`

### "GraphQL chyba"
- Skontrolujte, ze aktivni agenda je platny GUID existujici agendy
- Overite, ze API klic ma opravneni k dane agende

### "API_VERSIONING_MISSMATCH" nebo "Uzivatel nebyl prihlasen"
- Restartujte Windows sluzbu **S3Api** (v Task Manager / Services) — resi 99% pripadu
- V extremnim pripade: odhlaste vsechny uzivatele Money S3, vypnete Money, restartujte sluzbu
- Zkontrolujte stav v Money S3: Nastroje > S3api

### "Import nebyl dokoncen"
- Zvyste `IMPORT_POLL_TIMEOUT_MS` (vychozi 30s)
- Pouzijte nastroj `check_import_status` s GUID pro rucni kontrolu

### Server se nespusti
- Overite, ze mate Node.js >= 20 (`node --version`)
- Overite, ze jsou nainstalovane zavislosti (`npm install`)
- Overite, ze projekt je sestaven (`npm run build`)

## Skripty

| Skript | Popis |
|--------|-------|
| `npm run build` | Sestavi TypeScript do `dist/` |
| `npm start` | Spusti server (produkce) |
| `npm run dev` | Spusti server s automatickym reloadem (vyvoj) |
| `npm run typecheck` | Zkontroluje typy bez sestaveni |
| `npm run lint` | Spusti ESLint |

## Technicky stack

| Vrstva | Technologie |
|--------|-------------|
| Runtime | Node.js >= 20 |
| Jazyk | TypeScript 5.x (strict mode) |
| MCP SDK | `@modelcontextprotocol/sdk` |
| GraphQL klient | `graphql-request` |
| Validace | `zod` |
| Transport | stdio (Claude Desktop / CLI) nebo HTTP (Docker / sit) |
| Kontejnerizace | Docker (multi-stage Alpine build) |
| HTTP auth | Bearer token (`MCP_AUTH_TOKEN`, timing-safe porovnani) |

## Licence

MIT

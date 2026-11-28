# Changelog

Všechny podstatné změny projektu jsou zaznamenány v tomto souboru.
Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/).

## [Unreleased]

### Bezpečnost

- **HTTP transport je nově fail-closed.** Server dříve v HTTP režimu vždy naslouchal
  na `0.0.0.0` a bez nastaveného `MCP_AUTH_TOKEN` vystavil endpoint `/mcp` (všechny
  nástroje — faktury, mzdy, banka, sklad, účetnictví) komukoliv v síti bez ověření.
  - Nová proměnná `MCP_HOST` (výchozí `127.0.0.1`) určuje adresu pro naslouchání.
  - Bez `MCP_AUTH_TOKEN` na jiné než loopback adrese server odmítne nastartovat.
  - Bez tokenu na loopback adrese přijímá `/mcp` jen požadavky s lokální hlavičkou
    `Host` / `Origin` (ochrana proti DNS rebinding útokům z prohlížeče).
  - Děkujeme **Anasovi** (syedanasmohiuddinsyed@gmail.com) za nahlášení této zranitelnosti.
- Opraven pád serveru při požadavku s neplatnou hlavičkou `Host`.

### Nekompatibilní změny

- Docker obraz a `docker-compose.yml` nastavují `MCP_HOST=0.0.0.0` a vyžadují
  `MCP_AUTH_TOKEN` — bez něj kontejner nenastartuje (Compose skončí chybou už při
  `docker compose up`). Token vygenerujete příkazem `openssl rand -hex 32`.
- Lokální spuštění `MCP_TRANSPORT=http npm start` nově naslouchá jen na `127.0.0.1`;
  pro síťový přístup nastavte `MCP_HOST=0.0.0.0` spolu s `MCP_AUTH_TOKEN`.

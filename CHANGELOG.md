# Changelog

Notable changes to the Emelia MCP server and to this repository. Versions match the `version` of [`server.json`](server.json).

## OAuth, 143 tools in 8 categories (2026-10-20)

The server now signs you in with your Emelia account and covers the whole Emelia API except the legacy campaigns, plus the inbox. Server version: 0.1.0.

- Sign-in with your Emelia account over OAuth 2.1, the recommended connection: the client opens an Emelia page and you click **Authorize**. Dynamic client registration and PKCE (`S256`); a request without credentials gets `401` with a `WWW-Authenticate` header that points to `https://mcp.emelia.io/.well-known/oauth-protected-resource/mcp`. The access lasts 30 days and most clients renew it, for as long as they are used at least once every 180 days. Disconnect an assistant in **Settings**, **API & Webhooks**, **Connected apps**.
- The API key keeps working, in `Authorization` (as is or as `Bearer <key>`) or `X-Api-Key`, for scripts, CI and clients without OAuth.
- 143 tools in 8 categories instead of 26 in 4 families: campaigns (32), lists (17), enrichment (5), linkedin_scraper (15), mailboxes (8), account (5), inbox (39), inbox_settings (22). The assistant can now write the sequence of a campaign, set its settings, senders and lists, start, pause and duplicate it, export campaigns and lists, run LinkedIn extractions, manage mailboxes, credits history, webhooks and the blacklist.
- The 61 tools of `inbox` and `inbox_settings` read, sort and answer the emails of the Emelia inbox and manage its labels, AI label rules, views, filters and auto-forward rules. They appear once the Inbox was opened in the Emelia app.
- `?toolsets=` on the server URL turns on only some categories. An unknown category gets an HTTP `400` that lists the valid ones.
- ChatGPT can connect, in developer mode.
- Repository: README rewritten around OAuth, client configurations without a key plus `*.api-key.json` variants, [`server.json`](server.json) without the required `Authorization` header, [`tools.json`](tools.json) and [`docs/TOOLS.md`](docs/TOOLS.md) regenerated, with categories instead of families and a Destructive column for the tools flagged `destructiveHint`.

## Repository rebuilt (2026-10-15)

This repository now documents the hosted server instead of shipping a local one.

- README, tool reference ([`docs/TOOLS.md`](docs/TOOLS.md), generated from [`tools.json`](tools.json)) and ready-to-copy client configurations in [`examples/`](examples).
- [`server.json`](server.json) for the official MCP registry (`io.emelia/emelia`), [`glama.json`](glama.json).
- Security policy, issue forms and a workflow that validates the manifests and the generated docs.
- The local stdio server of 2025 is kept, unmaintained, on the [`legacy-stdio`](https://github.com/emelia-io/emelia-mcp/tree/legacy-stdio) branch.

## 0.1.0 (August 2026)

First version of the hosted server.

- Hosted server at `https://mcp.emelia.io/mcp`, over Streamable HTTP, stateless.
- Authentication with the Emelia API key, in the `Authorization` or `X-Api-Key` header. No OAuth yet.
- 26 tools in 4 families: campaigns (7), lists and contacts (12), enrichment (4), deliverability (3).

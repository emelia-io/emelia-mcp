<p align="center">
  <a href="https://emelia.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/emelia-logo-white.svg">
      <img src="assets/emelia-logo.svg" alt="Emelia" width="240">
    </picture>
  </a>
</p>

<h1 align="center">Emelia MCP Server</h1>

<p align="center">
  Connect Claude, Cursor, VS Code or any MCP client to your Emelia account.<br>
  Run your cold email and LinkedIn outreach from your AI assistant: campaigns, lists, contacts, enrichment and warmup.
</p>

<p align="center">
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Streamable_HTTP-1F344B" alt="MCP: Streamable HTTP"></a>
  <a href="#authentication"><img src="https://img.shields.io/badge/auth-API_key-1F344B" alt="Auth: API key"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1F344B" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://docs.emelia.io/docs/ai/mcp">Documentation</a> ·
  <a href="https://emelia.io">Website</a> ·
  <a href="docs/TOOLS.md">Tools</a> ·
  <a href="examples">Examples</a> ·
  <a href="#support">Support</a>
</p>

> [!NOTE]
> **Live.** The Emelia MCP server answers at `https://mcp.emelia.io/mcp` (version 0.1.0). It authenticates with an Emelia API key only: **OAuth is not supported yet**, so a client that can only sign in with OAuth, such as ChatGPT, cannot connect for now.

[Emelia](https://emelia.io) is a cold email and LinkedIn prospecting platform. This repository documents its official [Model Context Protocol](https://modelcontextprotocol.io) server: a hosted, remote server that gives an AI assistant access to **your Emelia account**, through your API key. The assistant can read your campaigns and their statistics, read the latest replies, create draft campaigns, manage lists and contacts (a contact added to a list enters the campaigns of that list), find and verify emails and phone numbers, and check the warmup of your mailboxes.

There is nothing to install: add the server URL and your API key to your assistant.

## Contents

- [What you can ask](#what-you-can-ask)
- [Server URL](#server-url)
- [Authentication](#authentication)
- [Quick start](#quick-start): [Claude](#claude-claudeai-and-claude-desktop), [Claude Code](#claude-code), [ChatGPT](#chatgpt), [Cursor](#cursor), [VS Code](#vs-code), [Windsurf](#windsurf), [stdio clients](#clients-that-only-support-stdio)
- [Tools](#tools)
- [Security and guardrails](#security-and-guardrails)
- [Privacy](#privacy)
- [FAQ](#faq)
- [En français](#en-français)
- [Support](#support)

## What you can ask

| Ask your assistant | What happens |
| --- | --- |
| "What is the reply rate of my Q4 SaaS founders campaign since Monday, step by step?" | It finds the campaign with `list_campaigns`, then reads the global and per step statistics with `get_campaign_stats`. |
| "Show me the latest replies to that campaign and draft an answer to each one." | It reads the reply activities with `get_campaign_activities` and writes the drafts in the conversation. Nothing is sent: the server cannot send email. |
| "Find and verify the email of Hugo Martin at Brightlane, in France, then add him to my Warm leads list." | It runs `find_email` and `verify_email` (both spend credits), then `add_contact_to_list`. He enters the campaigns that use the list. |
| "Here are 60 prospects: create a list called Paris agencies and add them." | It creates the list with `create_list` and loads the contacts with `add_contacts_to_list_bulk`, 100 at most per call, duplicates detected. |
| "Do we already have jane.doe@example.com in one of our lists?" | It searches every list with `find_contact`. |
| "Which of my mailboxes are disconnected, and which ones have a low warmup score?" | It checks `list_email_providers` and `get_warmup_status`. |

## Server URL

```text
https://mcp.emelia.io/mcp
```

- **Transport**: Streamable HTTP, stateless (`POST` only).
- **Authentication**: your Emelia API key in the `Authorization` header (as is or as `Bearer <key>`), or in `X-Api-Key`. No OAuth yet.
- **Scope**: the Emelia account of the key, with everything the key can do.
- **Tools**: **26 tools** in **4 families**: campaigns, lists and contacts, enrichment, deliverability.
- **Plans**: every Emelia plan, within the API quota of the account (see [Quotas and limits](#quotas-and-limits)).
- **Health check**: `https://mcp.emelia.io/mcp/health` answers `{"ok":true}`.
- **Registry manifest**: [`server.json`](server.json), for the official MCP registry (`io.emelia/emelia`).

## Authentication

### API key

1. In the Emelia app, open **Settings**, **API & Webhooks** ([v3.emelia.io/settings/api](https://v3.emelia.io/settings/api)) and click **Create new key**.
2. Copy the key: 48 letters and digits. Keep it like a password.

Send it in the `Authorization` header, as is:

```http
Authorization: YOUR_EMELIA_API_KEY
```

`Authorization: Bearer YOUR_EMELIA_API_KEY` and `X-Api-Key: YOUR_EMELIA_API_KEY` work too. A key has no scopes: it can read and change your campaigns, lists and contacts and spend your credits. Create one key per client, so you can revoke one without touching the others.

**Revoke a key**: **Settings**, **API & Webhooks**, then disable or delete the key. Every client that uses it stops working at its next call.

### OAuth

**Not supported yet.** The server does not run an OAuth sign-in: every client must send an API key in a header. Clients that only connect to remote servers with OAuth, such as ChatGPT, cannot use it for now.

### For client developers

A request without a key gets `401` with the JSON-RPC error `-32001` (`Missing Emelia API key`), and no `WWW-Authenticate` challenge. The server checks that a key is present, then forwards it to the Emelia API with each tool call: a wrong key shows up at the first tool call, not when listing the tools. Every request must accept both `application/json` and `text/event-stream`.

## Quick start

Name the server `emelia` in every client: the tools then show up as `mcp__emelia__<tool>`, which the [Claude for B2B Outreach](#is-there-a-claude-code-plugin) plugin expects. Ready-to-copy files are in [`examples/`](examples).

### Claude (claude.ai and Claude Desktop)

Custom connectors are added once to your Claude account and are then available in Claude Desktop too. The Claude free plan is limited to one custom connector.

1. On claude.ai, open **Customize**, then **Connectors**. Click **+ Add**, then **Add custom connector**.
2. Name it `Emelia` and enter `https://mcp.emelia.io/mcp` as the server URL.
3. For authentication, choose **No sign-in**.
4. Under **Request headers**, add the header `authorization` with your API key as the value, then click **Add**.

The **Request headers** section is in beta at Anthropic and is not shown on every account yet. Without it, use the [configuration file of Claude Desktop](#clients-that-only-support-stdio) or [Claude Code](#claude-code). On Team and Enterprise plans, an owner adds the connector in **Organization settings**, **Connectors**: the header is then shared by the whole organization, and every member acts on the same Emelia account.

### Claude Code

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp \
  --header "Authorization: YOUR_EMELIA_API_KEY"
```

Then run `/mcp` in Claude Code: `emelia` should be connected. Ask "list my campaigns" to check the key. A project-level [`.mcp.json`](examples/claude-code/.mcp.json) that reads the key from an environment variable is in the [examples](examples/claude-code/README.md).

### ChatGPT

**Not supported yet.** ChatGPT connects to custom MCP servers with OAuth or without authentication, and cannot send an API key. Use Claude, Cursor, VS Code or Windsurf in the meantime.

### Cursor

<a href="https://cursor.com/install-mcp?name=emelia&config=eyJ1cmwiOiJodHRwczovL21jcC5lbWVsaWEuaW8vbWNwIiwiaGVhZGVycyI6eyJBdXRob3JpemF0aW9uIjoiWU9VUl9FTUVMSUFfQVBJX0tFWSJ9fQ=="><img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Add Emelia to Cursor" height="32"></a>

The button adds the server with a placeholder: replace `YOUR_EMELIA_API_KEY` with your key in the MCP settings of Cursor. Or add the server to `.cursor/mcp.json` in a project, or to `~/.cursor/mcp.json` for every project ([example](examples/cursor/.cursor/mcp.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "url": "https://mcp.emelia.io/mcp",
      "headers": {
        "Authorization": "${env:EMELIA_API_KEY}"
      }
    }
  }
}
```

Cursor reads the key from the `EMELIA_API_KEY` environment variable, so it stays out of the file.

### VS Code

<a href="https://insiders.vscode.dev/redirect/mcp/install?name=emelia&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.emelia.io%2Fmcp%22%2C%22headers%22%3A%7B%22Authorization%22%3A%22YOUR_EMELIA_API_KEY%22%7D%7D"><img src="https://img.shields.io/badge/VS_Code-Install_server-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Install in VS Code" height="32"></a>

The button adds the server with a placeholder to replace. To keep the key out of the file, add the server to `.vscode/mcp.json` with an input ([example](examples/vscode/.vscode/mcp.json)): VS Code asks for the key the first time the server starts and stores it securely.

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "emelia-api-key",
      "description": "Emelia API key",
      "password": true
    }
  ],
  "servers": {
    "emelia": {
      "type": "http",
      "url": "https://mcp.emelia.io/mcp",
      "headers": {
        "Authorization": "${input:emelia-api-key}"
      }
    }
  }
}
```

The tools are then available in Copilot Chat, in agent mode.

### Windsurf

Windsurf (now Devin Desktop) reads `~/.config/devin/mcp_config.json`, or `%APPDATA%\devin\mcp_config.json` on Windows. Older Windsurf versions read `~/.codeium/windsurf/mcp_config.json`. Add the server there ([example](examples/windsurf/mcp_config.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "url": "https://mcp.emelia.io/mcp",
      "headers": {
        "Authorization": "${env:EMELIA_API_KEY}"
      }
    }
  }
}
```

The key comes from the `EMELIA_API_KEY` environment variable.

### Clients that only support stdio

A client that can only start local servers, such as Claude Desktop through its configuration file, reaches Emelia through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), a local bridge that needs Node.js 18 or later. In `claude_desktop_config.json` (**Settings**, **Developer**, **Edit Config**, then restart Claude Desktop) ([example](examples/claude-desktop/claude_desktop_config.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@0.1.38",
        "https://mcp.emelia.io/mcp",
        "--header",
        "Authorization:${EMELIA_API_KEY}"
      ],
      "env": {
        "EMELIA_API_KEY": "YOUR_EMELIA_API_KEY"
      }
    }
  }
}
```

The `mcp-remote` version is pinned on purpose: without a version, `npx` runs whatever release is the latest at each start, and that process holds your key. Move the pin only after reviewing the new release. Keep `Authorization:${EMELIA_API_KEY}` without a space: some clients split arguments on spaces.

### Other clients

Any client that supports remote MCP servers over Streamable HTTP with a custom header works with the server URL and the `Authorization` header (or `X-Api-Key` if your client reserves `Authorization`). A quick test with `curl`:

```bash
curl -s https://mcp.emelia.io/mcp \
  -H "Authorization: $EMELIA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_campaigns","arguments":{}}}'
```

## Tools

The server exposes **26 tools** in **4 families**. Every tool has a title, an input schema and, for the tools that only read or that delete, the MCP annotation that says so (`readOnlyHint`, `destructiveHint`). The full list with every parameter is in [docs/TOOLS.md](docs/TOOLS.md), generated from [tools.json](tools.json).

<!-- generated:tools-summary:start -->
| Family | Tools | What it covers |
| --- | ---: | --- |
| [Campaigns](docs/TOOLS.md#campaigns) | 7 | List and read campaigns, create drafts, statistics per step, latest activities and replies, manual tasks. |
| [Lists and contacts](docs/TOOLS.md#lists-and-contacts) | 12 | Create, rename and delete lists; add contacts one by one or 100 at a time, update, find and delete them. |
| [Enrichment](docs/TOOLS.md#enrichment) | 4 | Find a professional email or a phone number, verify an email, read a job that was still running. |
| [Deliverability](docs/TOOLS.md#deliverability) | 3 | Sending mailboxes, disconnected mailboxes, warmup status and score, turning warmup on. |
| **Total** | **26** | 13 Read, 8 Write, 2 Delete, 3 Credits |

**Campaigns**: `list_campaigns`, `get_campaign`, `create_campaign`, `get_campaign_stats`, `get_campaign_activities`, `list_manual_tasks`, `complete_manual_task`

**Lists and contacts**: `create_list`, `list_lists`, `get_list`, `rename_list`, `delete_list`, `get_list_contacts`, `get_contact`, `add_contact_to_list`, `add_contacts_to_list_bulk`, `update_contact`, `delete_contact`, `find_contact`

**Enrichment**: `find_email`, `find_phone`, `verify_email`, `get_enrichment_result`

**Deliverability**: `list_email_providers`, `get_warmup_status`, `set_warmup`

<!-- generated:tools-summary:end -->

Not in the MCP server yet: starting or pausing a campaign, writing its sequence, choosing its senders and schedule, LinkedIn extractions and the blacklist. They are in the [Emelia REST API](https://docs.emelia.io/docs/all-endpoints) and in the Emelia app.

## Security and guardrails

- **Your key opens the whole account.** There are no scopes: the assistant can change your campaigns, lists and contacts and spend your credits. Give each client its own key and revoke it when you stop using it.
- **Deleting is flagged.** `delete_list` and `delete_contact` delete data for good and carry the `destructiveHint` annotation, so clients ask you before running them. Keep that confirmation on, and on the tools that spend credits.
- **Nothing leaves your mailboxes.** No tool sends an email, replies to a prospect or starts a campaign: the assistant prepares, you launch from the Emelia app.
- **No double charges by mistake.** The enrichment tools wait up to 90 seconds for their result. A longer job comes back with its `jobId`: read it with `get_enrichment_result`, which costs nothing, instead of starting a new search, which is billed again.
- **Duplicates are detected.** Adding a contact whose email or LinkedIn URL is already in the list returns the existing contact instead of creating a second one.
- **No secrets.** `list_email_providers` masks the passwords and secrets of your mailboxes.
- **Stateless.** The server keeps no session and stores nothing: it forwards your key to the Emelia API on each call.
- **Out of reach today**: sending email, starting or pausing campaigns, connecting or removing mailboxes, LinkedIn session cookies, API keys, webhooks and billing.

### Quotas and limits

The tools count against the API quota of the account, shared with the Emelia REST API and every API key of the account. The enrichment tools and the list and contact tools are not counted.

| Plan | Requests per minute |
| --- | ---: |
| No active plan | 30 |
| Start | 100 |
| Grow | 300 |
| Scale | 1,000 |

The window lasts 60 seconds from the first request. Over the limit, tools fail until the next window: wait a minute, then go on at a slower pace. Details: [rate limits](https://docs.emelia.io/docs/rate-limits).

Only enrichment spends credits; campaigns, lists, contacts and statistics never do.

| Tool | Cost | Refunded when |
| --- | ---: | --- |
| `find_email` | 1 credit | No email is found |
| `find_phone` | 50 credits | No number is found |
| `verify_email` | 0.25 credit | Never |

Requests to the server are limited to 4 MB. `add_contacts_to_list_bulk` takes 1 to 100 contacts, `get_list_contacts` returns 50 contacts per page by default and 100 at most, and `get_campaign_activities` returns the 30 most recent activities. Each tool returns the whole API response: ask for small pages on big lists.

## Privacy

- The assistant reaches the Emelia account of the key you gave it, until you revoke the key.
- What the assistant reads (contacts, campaign statistics, replies) goes to the AI client you use, such as Claude or Cursor, under that provider's own terms. Use a dedicated key, and remove the server when you no longer need it.
- The server keeps no session and stores no data of its own.
- The [Emelia privacy policy](https://emelia.io/privacy_policy) applies to the service.

## FAQ

### Where is the source code?

The Emelia MCP server is a hosted service: it runs on Emelia's servers, and its code is not public. This repository holds everything you need to use it: the documentation, the registry manifest ([`server.json`](server.json)), the machine-readable tool list ([`tools.json`](tools.json)) and ready-to-copy client configurations. There is nothing to build or run.

### Do I need to install anything?

No. Clients that support remote MCP servers connect to the URL directly. Only clients limited to local (stdio) servers need the [`mcp-remote`](#clients-that-only-support-stdio) bridge.

### Is it free?

The server comes with your Emelia account. Its calls count in the per minute quota of your plan, and enrichment spends your credits as in the app.

### Will OAuth be supported?

Not today: the server authenticates with an API key only. That is why ChatGPT cannot connect yet.

### Which campaigns does the assistant see?

The campaigns of the current Emelia app, where one sequence can mix email and LinkedIn steps. Archived campaigns and the legacy single-channel campaigns are left out.

### Can the assistant launch a campaign or send email?

No. It creates draft campaigns and feeds the lists your campaigns use; starting, pausing and writing the sequence happen in the Emelia app or through the REST API.

### How do contacts reach a campaign?

Through lists. A campaign uses one or several lists: a contact added to one of them with `add_contact_to_list` or `add_contacts_to_list_bulk` enters the campaign.

### Is there a Claude Code plugin?

Yes: [**Claude for B2B Outreach**](https://github.com/emelia-io/claude-outreach), an open source plugin that runs a whole outbound workflow (targeting, lead sourcing, enrichment, sequence writing, deliverability, launch, reply triage). It uses this server when it is configured under the name `emelia`.

```text
/plugin marketplace add emelia-io/claude-outreach
/plugin install claude-outreach@claude-outreach
```

### Where did the old local server go?

The first version, a local stdio server from 2025, is kept on the [`legacy-stdio`](https://github.com/emelia-io/emelia-mcp/tree/legacy-stdio) branch. It is no longer maintained: use the hosted server.

## En français

**Le serveur MCP d'Emelia** permet de piloter votre prospection cold email et LinkedIn depuis Claude, Cursor, VS Code ou tout client MCP : campagnes, listes, contacts, recherche d'email et de téléphone, vérification d'email et warmup, en langage naturel.

- **Adresse** : `https://mcp.emelia.io/mcp`, rien à installer.
- **Connexion** : votre clé d'API Emelia dans l'en-tête `Authorization`. Créez-la dans l'application, **Settings**, **API & Webhooks**. Pas encore d'OAuth : ChatGPT ne peut pas s'y connecter pour l'instant.
- **Quotas** : ceux de votre forfait, de 30 à 1 000 requêtes par minute. Seule la recherche de coordonnées consomme des crédits.

## Support

- Questions about Emelia, your account or a connection: [contact@emelia.io](mailto:contact@emelia.io).
- A mistake in this documentation or in a client configuration, or a missing tool: [open an issue](https://github.com/emelia-io/emelia-mcp/issues/new/choose).
- A security vulnerability: follow [SECURITY.md](SECURITY.md), and do not open a public issue.

Documentation: [docs.emelia.io](https://docs.emelia.io) · Website: [emelia.io](https://emelia.io) · [Privacy policy](https://emelia.io/privacy_policy) · [Terms](https://emelia.io/cgv)

## License

The documentation and configuration files of this repository are released under the [MIT License](LICENSE). The Emelia service, including the hosted MCP server, is proprietary and governed by the [Emelia terms](https://emelia.io/cgv).

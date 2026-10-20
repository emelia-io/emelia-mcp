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
  Connect Claude, ChatGPT, Cursor, VS Code or any MCP client to your Emelia account.<br>
  Run your cold email and LinkedIn outreach from your AI assistant: campaigns and sequences, lists, enrichment, LinkedIn extractions, mailboxes and the inbox.
</p>

<p align="center">
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Streamable_HTTP-1F344B" alt="MCP: Streamable HTTP"></a>
  <a href="#authentication"><img src="https://img.shields.io/badge/auth-OAuth_2.1_%7C_API_key-1F344B" alt="Auth: OAuth 2.1 or API key"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1F344B" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://docs.emelia.io/docs/mcp">Documentation</a> ·
  <a href="https://emelia.io">Website</a> ·
  <a href="docs/TOOLS.md">Tools</a> ·
  <a href="examples">Examples</a> ·
  <a href="#support">Support</a>
</p>

[Emelia](https://emelia.io) is a cold email and LinkedIn prospecting platform. This repository documents its official [Model Context Protocol](https://modelcontextprotocol.io) server: a hosted, remote server that gives an AI assistant access to **your Emelia account**. The assistant can create campaigns, write their sequence, start and pause them, read their statistics and replies, manage lists and contacts, find and verify emails and phone numbers, run LinkedIn extractions, manage your sending mailboxes and their warmup, and, once the Inbox is set up, read, sort and answer the emails of your Emelia inbox.

There is nothing to install: add the server URL to your assistant and sign in with your Emelia account.

## Contents

- [What you can ask](#what-you-can-ask)
- [Server URL](#server-url)
- [Authentication](#authentication)
- [Quick start](#quick-start): [Claude](#claude-claudeai-and-claude-desktop), [Claude Code](#claude-code), [ChatGPT](#chatgpt), [Cursor](#cursor), [VS Code](#vs-code), [Windsurf](#windsurf), [stdio clients](#clients-that-only-support-stdio), [other clients](#other-clients)
- [Tool categories](#tool-categories)
- [Tools](#tools)
- [The inbox tools](#the-inbox-tools)
- [Security and guardrails](#security-and-guardrails)
- [Quotas and limits](#quotas-and-limits)
- [Privacy](#privacy)
- [FAQ](#faq)
- [En français](#en-français)
- [Support](#support)

## What you can ask

| Ask your assistant | What happens |
| --- | --- |
| "Read the sequence guide, then write a sequence for my Q4 SaaS founders campaign: an email, a LinkedIn invitation two days later, and a follow-up email three days after that if they did not reply. Show it to me before you save it." | It reads `get_campaign_sequence_guide` and the campaign with `get_campaign`, shows you the sequence, then saves it with `update_campaign_steps`. |
| "What is the reply rate of my Q4 SaaS founders campaign since Monday, step by step?" | It finds the campaign with `list_campaigns`, then reads the global and per step statistics with `get_campaign_stats`. |
| "Read the replies I received this week, tell me who asks for a meeting, and draft an answer to each of them. Do not send anything." | It lists the emails of the inbox with `list_emails`, reads the conversations with `get_thread` and prepares the answers with `draft_reply`. Nothing is sent until you approve a draft. |
| "Find and verify the email of Hugo Martin at Brightlane, in France, then add him to my Warm leads list." | It runs `find_email` and `verify_email` (both spend credits), then `add_contact_to_list`. He enters the campaigns that use the list. |
| "Extract this Sales Navigator search, then find the emails of the contacts." | It starts the extraction with `create_linkedin_scraper`, follows it with `get_linkedin_scraper`, then runs `enrich_linkedin_scraper` (1 credit per email found). |
| "Which of my mailboxes are disconnected, and which ones have a low warmup score?" | It checks `list_email_providers` and `get_warmup_status`. |

## Server URL

```text
https://mcp.emelia.io/mcp
```

- **Transport**: Streamable HTTP, stateless (`POST` only).
- **Authentication**: sign in with your Emelia account (OAuth 2.1, recommended), or an Emelia API key in the `Authorization` header (as is or as `Bearer <key>`) or in `X-Api-Key`.
- **Scope**: your whole Emelia account. Signing in gives the same access as an API key.
- **Tools**: **143 tools** in **8 categories**, all of them by default, or the ones you pick with [`?toolsets=`](#tool-categories). The inbox tools appear once the [Inbox is set up](#the-inbox-tools).
- **Plans**: every Emelia plan, within the quotas of the account (see [Quotas and limits](#quotas-and-limits)).
- **Health check**: `https://mcp.emelia.io/mcp/health` answers `{"ok":true}`.
- **Registry manifest**: [`server.json`](server.json), for the official MCP registry (`io.emelia/emelia`).

## Authentication

### Sign in with your Emelia account (recommended)

Most clients run the sign-in by themselves the first time they connect. There is nothing to copy:

1. Add the server URL to your client. It opens an Emelia page in your browser, on `https://v3.emelia.io/oauth/consent/...`.
2. Sign in to Emelia if needed, and check the account shown on the page.
3. Click **Authorize**. You are sent back to your client, connected.

The page waits 10 minutes; after that, start the connection again from the client. The assistant then acts as you, with the same access and the same per minute quota as an API key: it reads and changes your campaigns, lists, contacts and mailboxes, sends emails and spends your credits.

The access lasts 30 days, and most clients renew it on their own: they stay connected as long as you use them at least once every 180 days. A client that does not renew it asks you to sign in again after 30 days.

**Disconnect an assistant**: in the [Emelia app](https://v3.emelia.io), open **Settings**, **API & Webhooks**, **Connected apps**, and click **Disconnect**. The assistant loses access within 30 seconds.

### API key

For scripts, CI jobs, a machine without a browser, or a client that cannot sign in with OAuth, use an Emelia API key instead:

1. In the Emelia app, open **Settings**, **API & Webhooks** ([v3.emelia.io/settings/api](https://v3.emelia.io/settings/api)) and click **Create new key**.
2. Copy the key: 48 letters and digits. Keep it like a password.

Send it in the `Authorization` header, as is:

```http
Authorization: YOUR_EMELIA_API_KEY
```

`Authorization: Bearer YOUR_EMELIA_API_KEY` and `X-Api-Key: YOUR_EMELIA_API_KEY` work too. With a key, the client does not ask you to sign in. A key has no scopes: it opens the whole account. Create one key per client, so you can revoke one without touching the others.

**Revoke a key**: **Settings**, **API & Webhooks**, then disable or delete the key. Every client that uses it stops working at its next call.

### For client developers

OAuth clients need no configuration: a request without credentials gets a `401` with the JSON-RPC error `-32001` (`Authentication required. ...`) and a `WWW-Authenticate` header that points to the protected resource metadata (RFC 9728):

```http
WWW-Authenticate: Bearer resource_metadata="https://mcp.emelia.io/.well-known/oauth-protected-resource/mcp"
```

The authorization server is `https://mcp.emelia.io/`. Clients register through dynamic client registration (RFC 7591), then use the authorization code flow with PKCE (`S256`) and refresh tokens.

An API key is checked at the first tool call, not when the tools are listed: a wrong key still lists the Emelia tools. Every request must accept both `application/json` and `text/event-stream`.

## Quick start

Name the server `emelia` in every client: the tools then show up as `mcp__emelia__<tool>`, which the [Claude for B2B Outreach](#is-there-a-claude-code-plugin) plugin expects. Claude loads tools on demand, so in Claude Code, Claude Desktop and claude.ai, connect the plain URL. The other clients send every tool to the model: give them only the [categories](#tool-categories) you need. Ready-to-copy files are in [`examples/`](examples).

### Claude (claude.ai and Claude Desktop)

1. On claude.ai or in Claude Desktop, open **Customize**, **Connectors**, then **Add**, **Add custom connector** (Pro and Max plans).
2. Name it `emelia` and enter `https://mcp.emelia.io/mcp` as the URL. Leave the advanced settings empty and add the connector.
3. Click **Connect**: the Emelia page opens. Click **Authorize**.

The connector belongs to your Claude account: it works on claude.ai and in Claude Desktop, and its calls come from Anthropic's cloud, not from your computer. On Team and Enterprise plans, an owner adds the connector once in the organization settings, and each member connects their own Emelia account.

### Claude Code

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp
```

Then run `/mcp` in Claude Code, pick `emelia` and choose **Authenticate**. Your browser opens Emelia: check the account shown and click **Authorize**. Ask "list my campaigns" to test it.

For a project shared with your team, commit the [`.mcp.json`](examples/claude-code/.mcp.json) of the examples at the root of the project: it holds no secret, and each person signs in with their own Emelia account. With an API key (CI, scripts, a machine without a browser):

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp \
  --header "Authorization: YOUR_EMELIA_API_KEY"
```

More in [examples/claude-code](examples/claude-code/README.md).

### ChatGPT

ChatGPT adds MCP servers in developer mode, on the paid plans:

1. Turn on developer mode in **Settings**, **Apps & Connectors**, **Advanced settings**, **Developer mode**.
2. Create a connector named `Emelia`, with the URL `https://mcp.emelia.io/mcp?toolsets=campaigns,lists,inbox` and the authentication **OAuth**.
3. ChatGPT opens the Emelia page: click **Authorize**.

The Emelia tools then show up in the tools of your conversations. Keep a [`toolsets`](#tool-categories) filter, with the categories you need, so that the list of tools stays short.

### Cursor

<a href="https://cursor.com/install-mcp?name=emelia&config=eyJ1cmwiOiJodHRwczovL21jcC5lbWVsaWEuaW8vbWNwIn0="><img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Add Emelia to Cursor" height="32"></a>

The button adds the server with every category: add `?toolsets=` to its URL in the MCP settings of Cursor. Or add the server to `.cursor/mcp.json` in a project, or to `~/.cursor/mcp.json` for every project ([example](examples/cursor/.cursor/mcp.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "url": "https://mcp.emelia.io/mcp?toolsets=campaigns,lists,enrichment"
    }
  }
}
```

Cursor then shows that `emelia` needs a sign-in, in its MCP settings: start it, and click **Authorize** on the Emelia page. Cursor sends every active tool to the model, hence the [`toolsets`](#tool-categories) filter. To use an API key, see [this example](examples/cursor/mcp.api-key.json).

### VS Code

<a href="https://insiders.vscode.dev/redirect/mcp/install?name=emelia&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.emelia.io%2Fmcp%22%7D"><img src="https://img.shields.io/badge/VS_Code-Install_server-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Install in VS Code" height="32"></a>

The button installs the server with every category: add `?toolsets=` to the URL in the configuration it creates. Or add the server to `.vscode/mcp.json`, or run **MCP: Open User Configuration** ([example](examples/vscode/.vscode/mcp.json)):

```json
{
  "servers": {
    "emelia": {
      "type": "http",
      "url": "https://mcp.emelia.io/mcp?toolsets=campaigns,inbox"
    }
  }
}
```

When the server starts, VS Code asks you to allow the sign-in to `mcp.emelia.io`: accept, then click **Authorize** on the Emelia page. The tools are then available in Copilot Chat, in agent mode. To use an API key without writing it in the file, see [this example](examples/vscode/mcp.api-key.json).

### Windsurf

Windsurf (now Devin Desktop) reads `~/.config/devin/mcp_config.json`, or `%APPDATA%\devin\mcp_config.json` on Windows. Older Windsurf versions read `~/.codeium/windsurf/mcp_config.json`. Add the server there ([example](examples/windsurf/mcp_config.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "url": "https://mcp.emelia.io/mcp?toolsets=campaigns,lists,enrichment"
    }
  }
}
```

The sign-in runs over OAuth. The Cascade agent uses at most 100 tools at a time across all servers, fewer than the 143 of Emelia: keep a [`toolsets`](#tool-categories) filter. To use an API key, see [this example](examples/windsurf/mcp_config.api-key.json).

### Clients that only support stdio

A client that can only start local servers, such as Claude Desktop through its configuration file, reaches Emelia through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), a local bridge that needs Node.js 18 or later. In `claude_desktop_config.json` (**Settings**, **Developer**, **Edit Config**, then quit and restart Claude Desktop) ([example](examples/claude-desktop/claude_desktop_config.json)):

```json
{
  "mcpServers": {
    "emelia": {
      "command": "npx",
      "args": ["-y", "mcp-remote@0.1.38", "https://mcp.emelia.io/mcp"]
    }
  }
}
```

On first use, `mcp-remote` opens the Emelia page in your browser to sign in. For an API key, use [this example](examples/claude-desktop/claude_desktop_config.api-key.json) instead. In Claude Desktop, the [custom connector](#claude-claudeai-and-claude-desktop) needs no file and no bridge.

The `mcp-remote` version is pinned on purpose: without a version, `npx` runs whatever release is the latest at each start, and that process holds your access to Emelia. Move the pin only after reviewing the new release.

### Other clients

Any client that supports remote MCP servers over Streamable HTTP works with the server URL. Clients with MCP authorization sign you in on their own. For the others, send an API key in the `Authorization` header, or in `X-Api-Key` if your client reserves `Authorization`. If the client sends every tool to the model, add [`?toolsets=`](#tool-categories). A quick test of a key with `curl`:

```bash
curl -s https://mcp.emelia.io/mcp \
  -H "Authorization: $EMELIA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_campaigns","arguments":{}}}'
```

## Tool categories

The categories are a parameter of the server URL, not separate servers. Add `toolsets` to turn on only the ones you need:

```text
https://mcp.emelia.io/mcp?toolsets=campaigns,lists,enrichment
```

- Values: `campaigns`, `lists`, `enrichment`, `linkedin_scraper`, `mailboxes`, `account`, `inbox` and `inbox_settings`, separated by commas.
- Without the parameter, every category is on. That is the right choice for Claude (Claude Code, Claude Desktop and claude.ai), which loads tools on demand.
- Cursor, VS Code, ChatGPT, Windsurf and most other clients send the description of every tool to the model with each message, and some cap the number of tools: give them only the categories they need.
- An unknown category gets an HTTP `400` that lists the valid ones, and the client cannot connect until the URL is fixed.
- A tool of a category that is off cannot be called, even when the description of another tool names it: add its category to the URL if the assistant needs it.

Ready-made combinations and how to change the categories in each client: [Tool categories](https://docs.emelia.io/docs/mcp/categories).

## Tools

The server exposes **143 tools** in **8 categories**. Every tool has a title, an input schema and, for the tools that only read or that are destructive, the MCP annotation that says so (`readOnlyHint`, `destructiveHint`); the inbox tools also declare an output schema. The full list with every parameter is in [docs/TOOLS.md](docs/TOOLS.md), generated from [tools.json](tools.json), and on [docs.emelia.io](https://docs.emelia.io/docs/mcp/tools).

<!-- generated:tools-summary:start -->
| Category | Tools | What it covers |
| --- | ---: | --- |
| [Campaigns](docs/TOOLS.md#campaigns) | 32 | Campaigns, their sequence and its guide, the contacts of a campaign, statistics and activities, manual tasks, attachments and voice notes. |
| [Lists](docs/TOOLS.md#lists) | 17 | Lists, contacts, exports, custom variables. |
| [Enrichment](docs/TOOLS.md#enrichment) | 5 | Find an email or a phone number, verify an email. |
| [LinkedIn scraper](docs/TOOLS.md#linkedin-scraper) | 15 | Sales Navigator and LinkedIn search extractions, and the LinkedIn accounts that run them. |
| [Mailboxes](docs/TOOLS.md#mailboxes) | 8 | Sending mailboxes, warmup, health check. |
| [Account](docs/TOOLS.md#account) | 5 | Credits, webhooks, blacklist. |
| [Inbox](docs/TOOLS.md#inbox) | 39 | Read, search, sort, reply to and send the emails of the inbox. |
| [Inbox settings](docs/TOOLS.md#inbox-settings) | 22 | Labels, AI label rules, views, inbox filters, auto-forward rules. |
| **Total** | **143** | 48 Read, 65 Write, 24 Destructive, 6 Credits |

**Campaigns**: `list_campaigns`, `get_campaign`, `create_campaign`, `get_campaign_stats`, `get_campaign_activities`, `list_manual_tasks`, `complete_manual_task`, `delete_campaign`, `rename_campaign`, `get_campaign_sequence_guide`, `update_campaign_steps`, `update_campaign_settings`, `update_campaign_recipients`, `update_campaign_identities`, `schedule_campaign_start`, `duplicate_campaign`, `start_campaign`, `pause_campaign`, `archive_campaign`, `reactivate_campaign`, `finish_campaign`, `send_campaign_test_email`, `list_campaign_contacts`, `add_contact_to_campaign`, `remove_contact_from_campaign`, `set_campaign_contact_field`, `get_activity_message`, `get_campaign_progress`, `list_step_contacts`, `export_campaign`, `upload_campaign_attachments`, `upload_linkedin_voice_note`

**Lists**: `create_list`, `list_lists`, `get_list`, `rename_list`, `delete_list`, `get_list_contacts`, `get_contact`, `add_contact_to_list`, `add_contacts_to_list_bulk`, `update_contact`, `delete_contact`, `find_contact`, `find_campaigns_using_lists`, `export_list`, `get_list_export`, `create_custom_variable`, `check_custom_variable`

**Enrichment**: `find_email`, `find_phone`, `verify_email`, `get_enrichment_result`, `list_enrichment_jobs`

**LinkedIn scraper**: `list_linkedin_scrapers`, `get_linkedin_scraper`, `create_linkedin_scraper`, `rename_linkedin_scraper`, `delete_linkedin_scraper`, `pause_linkedin_scraper`, `resume_linkedin_scraper`, `split_linkedin_scraper`, `filter_linkedin_scraper`, `enrich_linkedin_scraper`, `download_linkedin_scraper`, `add_linkedin_scraper_webhook`, `remove_linkedin_scraper_webhook`, `connect_linkedin_scraper_account`, `update_linkedin_scraper_account`

**Mailboxes**: `list_email_providers`, `get_warmup_status`, `set_warmup`, `create_email_provider`, `update_email_provider`, `delete_email_provider`, `update_sender_name`, `check_mailbox_health`

**Account**: `list_credit_usage`, `list_webhooks`, `get_blacklist`, `add_to_blacklist`, `remove_from_blacklist`

**Inbox**: `get_reference`, `get_workspace`, `list_mailboxes`, `sync_mailbox`, `get_unread_counts`, `suggest_contacts`, `set_workspace_timezone`, `list_emails`, `search_emails`, `get_email`, `get_thread`, `get_attachment`, `mark_emails_read`, `pin_emails`, `move_emails`, `trash_emails`, `apply_label_to_emails`, `remove_label_from_emails`, `dismiss_waiting_for_reply`, `get_unsubscribe_options`, `unsubscribe`, `get_draft`, `create_draft`, `update_draft`, `delete_draft`, `send_draft`, `send_email`, `draft_reply`, `draft_forward`, `schedule_draft`, `cancel_scheduled_send`, `add_draft_attachment`, `remove_draft_attachment`, `cancel_auto_reply`, `generate_magic_reply`, `list_snippets`, `create_snippet`, `update_snippet`, `delete_snippet`

**Inbox settings**: `list_labels`, `create_label`, `update_label`, `delete_label`, `list_ai_label_rules`, `create_ai_label_rule`, `update_ai_label_rule`, `delete_ai_label_rule`, `classify_existing_emails`, `list_views`, `create_view`, `update_view`, `delete_view`, `list_inbox_filters`, `create_inbox_filter`, `update_inbox_filter`, `delete_inbox_filter`, `list_auto_forward_rules`, `create_auto_forward_rule`, `update_auto_forward_rule`, `delete_auto_forward_rule`, `get_auto_forward_logs`

<!-- generated:tools-summary:end -->

Only the legacy campaigns, the email only or LinkedIn only campaigns of the previous Emelia campaign system, have no tools: use their [REST API routes](https://docs.emelia.io/docs/campaigns/legacy).

## The inbox tools

The 61 tools of the `inbox` and `inbox_settings` categories work on the Inbox of your Emelia account: they read, search, sort and answer its emails, and manage its labels, AI label rules, views, inbox filters, auto-forward rules and snippets.

They appear only once the Inbox has been opened in Emelia. On an account that never opened it, the server lists the 82 other tools, with no error: open the **Inbox** tab of the [Emelia app](https://v3.emelia.io/inbox) once, wait a few minutes, then reconnect the server in your client. The links these tools return open the email or the draft in the Emelia inbox.

## Security and guardrails

- **The assistant acts as you.** Signed in or with an API key, it reaches the whole account, with no scopes: it can change your campaigns, lists, contacts and mailboxes, start campaigns, send emails and spend your credits. Keep the confirmations of your client on for the tools that delete data, send messages or spend credits.
- **Destructive tools are flagged.** Deletions carry the `destructiveHint` annotation, and so do the inbox tools that send, forward or move emails to Trash or Spam, so that clients ask you before running them. `start_campaign` and `send_campaign_test_email` are not flagged, but they send real messages, and their descriptions say so.
- **You approve every email the inbox tools send.** The tools that send (`send_draft`, `send_email`, `schedule_draft`, `unsubscribe`), the ones that create or change an auto-forward rule, and most deletions refuse to run without `confirm: true`, which the assistant may only set once you approved that exact email or action.
- **Emails are treated as data.** The server instructs the assistant that emails, attachments, sender names and subjects come from third parties, and that it must never follow instructions found in them.
- **No double charges by mistake.** The enrichment tools wait up to 90 seconds for their result. A longer job comes back with its `jobId`: read it with `get_enrichment_result`, which costs nothing, instead of starting a new search, which is billed again.
- **Duplicates are detected.** Adding a contact whose email or LinkedIn URL is already in the list returns the existing contact instead of creating a second one.
- **No secrets.** `list_email_providers` masks the passwords and secrets of your mailboxes.
- **Stateless.** The server keeps no session and stores no data of its own: Emelia holds the sign-in, and each call carries your access token or your key to the Emelia API.

## Quotas and limits

The server has no quota of its own: it uses the ones of your account, whether you signed in or use an API key.

- **Emelia tools.** The tools of the `campaigns`, `linkedin_scraper`, `mailboxes` and `account` categories count in the per minute quota of the account, shared with the Emelia REST API: 30 requests per minute without an active plan, 100 on Start, 300 on Grow and 1,000 on Scale. The `lists` and `enrichment` tools are not counted. Over the quota, a tool fails with "Emelia API rate limit reached. Wait a moment and retry.", and the quota frees up within a minute. Details: [rate limits](https://docs.emelia.io/docs/rate-limits).
- **Inbox tools.** 60 requests per minute and 10,000 per month per Emelia account; a tool that acts on several emails costs one request per email, with at most 60 emails per call. Safety limits apply per hour: 50 sends (send, schedule or unsubscribe), 200 recipients, 500 emails moved to Trash or Spam, and 30 Magic Reply suggestions.

These tools spend Emelia credits ([prices](https://docs.emelia.io/docs/credits)):

| Tool | Cost |
| --- | --- |
| `find_email` | 1 credit, refunded when no email is found |
| `find_phone` | 50 credits, refunded when no number is found |
| `verify_email` | 0.25 credit, never refunded |
| `enrich_linkedin_scraper` | 1 credit per email found |
| `generate_magic_reply` | Emelia credits for each suggestion |
| `classify_existing_emails` | Emelia credits for each email classified |

Two more cases: without a subscription, `create_linkedin_scraper` extracts on credits, about 1 credit per 2 contacts; and while AI label rules exist, each new email of the inbox is classified with credits. Campaigns, lists, contacts, exports and statistics never cost credits.

Requests to the server are limited to 4 MB. The files of `upload_campaign_attachments`, `upload_linkedin_voice_note` and `add_draft_attachment` travel in base64 inside that request: about 3 MB of file per call. Each tool returns the whole API response, except the CSV of `export_campaign`, `export_list`, `get_list_export` and `download_linkedin_scraper`, cut at 100,000 characters on a line boundary: ask for small pages on big lists, and narrow the exports with their filters. Errors and their causes: [Limits and troubleshooting](https://docs.emelia.io/docs/mcp/troubleshooting).

## Privacy

- The assistant reaches the Emelia account you signed in with, or the account of the key, until you disconnect it or revoke the key.
- What the assistant reads (contacts, campaign statistics, emails and replies) goes to the AI client you use, such as Claude, ChatGPT or Cursor, under that provider's own terms. Turn on only the categories you need, and disconnect the assistant when you no longer use it.
- The server keeps no session and stores no data of its own.
- The [Emelia privacy policy](https://emelia.io/privacy_policy) applies to the service.

## FAQ

### Where is the source code?

The Emelia MCP server is a hosted service: it runs on Emelia's servers, and its code is not public. This repository holds everything you need to use it: the documentation, the registry manifest ([`server.json`](server.json)), the machine-readable tool list ([`tools.json`](tools.json)) and ready-to-copy client configurations. There is nothing to build or run.

### Do I need to install anything?

No. Clients that support remote MCP servers connect to the URL directly. Only clients limited to local (stdio) servers need the [`mcp-remote`](#clients-that-only-support-stdio) bridge.

### Is it free?

The server comes with your Emelia account. Its calls count in the quotas of your account, and the tools that spend credits do so as in the app.

### Is OAuth supported?

Yes, and it is the recommended way to connect: add the URL, sign in to Emelia and click **Authorize**. An API key still works, for scripts, CI and clients that cannot sign in. See [Authentication](#authentication).

### Which campaigns does the assistant see?

The campaigns of the current Emelia app, where one sequence can mix email and LinkedIn steps. Archived campaigns are left out of `list_campaigns`, and the legacy single-channel campaigns have no tools.

### Can the assistant write a sequence, launch a campaign or send email?

Yes. It can replace the sequence of a campaign that is not running (`update_campaign_steps`, after reading `get_campaign_sequence_guide`), set its schedule, senders and lists, then start or pause it. In the inbox, it drafts replies and sends them once you approve them. Keep the confirmations of your client on: `start_campaign` sends to the real contacts of the campaign.

### How do contacts reach a campaign?

Through lists. A campaign uses one or several lists, set with `update_campaign_recipients`: a contact added to one of them with `add_contact_to_list` or `add_contacts_to_list_bulk` enters the campaign. `add_contact_to_campaign` adds a single contact through a list made for it.

### My client limits the number of tools, or the context fills up.

Turn on only the categories you need with [`?toolsets=`](#tool-categories), for example `?toolsets=campaigns,lists,enrichment`.

### How do I disconnect an assistant?

In the Emelia app, **Settings**, **API & Webhooks**, **Connected apps**, **Disconnect**. For an API key, disable or delete the key on the same page.

### Is there a Claude Code plugin?

Yes: [**Claude for B2B Outreach**](https://github.com/emelia-io/claude-outreach), an open source plugin that runs a whole outbound workflow (targeting, lead sourcing, enrichment, sequence writing, deliverability, launch, reply triage). It uses this server when it is configured under the name `emelia`.

```text
/plugin marketplace add emelia-io/claude-outreach
/plugin install claude-outreach@claude-outreach
```

### Where did the old local server go?

The first version, a local stdio server from 2025, is kept on the [`legacy-stdio`](https://github.com/emelia-io/emelia-mcp/tree/legacy-stdio) branch. It is no longer maintained: use the hosted server.

## En français

**Le serveur MCP d'Emelia** permet de piloter votre prospection cold email et LinkedIn depuis Claude, ChatGPT, Cursor, VS Code ou tout client MCP, en langage naturel : campagnes et séquences, listes et contacts, recherche et vérification d'email et de téléphone, extractions LinkedIn, boîtes d'envoi et warmup, et la boîte de réception Emelia.

- **Adresse** : `https://mcp.emelia.io/mcp`, rien à installer.
- **Connexion** : ajoutez l'adresse dans votre assistant, une page Emelia s'ouvre, cliquez sur **Authorize**. Une clé d'API (**Settings**, **API & Webhooks**) reste possible pour les scripts et les clients sans OAuth.
- **Catégories** : 8 catégories d'outils, toutes actives par défaut ; `?toolsets=` n'active que celles dont vous avez besoin. Les outils de la boîte de réception apparaissent une fois l'Inbox ouverte dans Emelia.
- **Quotas** : ceux de votre compte, de 30 à 1 000 requêtes par minute selon le forfait. La recherche de coordonnées et les fonctions d'IA de la boîte de réception consomment des crédits.

## Support

- Questions about Emelia, your account or a connection: [contact@emelia.io](mailto:contact@emelia.io).
- A mistake in this documentation or in a client configuration, or a missing tool: [open an issue](https://github.com/emelia-io/emelia-mcp/issues/new/choose).
- A security vulnerability: follow [SECURITY.md](SECURITY.md), and do not open a public issue.

Documentation: [docs.emelia.io](https://docs.emelia.io) · Website: [emelia.io](https://emelia.io) · [Privacy policy](https://emelia.io/privacy_policy) · [Terms](https://emelia.io/cgv)

## License

The documentation and configuration files of this repository are released under the [MIT License](LICENSE). The Emelia service, including the hosted MCP server, is proprietary and governed by the [Emelia terms](https://emelia.io/cgv).

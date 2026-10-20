# Client configurations

Ready-to-copy configurations for the Emelia MCP server, `https://mcp.emelia.io/mcp`. Each client has an OAuth version, the recommended one: the client opens an Emelia page in your browser, where you click **Authorize**, and no key is written anywhere. Each client also has an API key version, for scripts, CI and machines without a browser.

| Client | OAuth | API key | Where the file goes |
| --- | --- | --- | --- |
| Claude Code | [`claude-code/README.md`](claude-code/README.md), [`.mcp.json`](claude-code/.mcp.json) | [`claude-code/README.md`](claude-code/README.md#with-an-api-key) | `.mcp.json` at the root of a project, or the `claude mcp add` command |
| Claude Desktop, through `mcp-remote` | [`claude_desktop_config.json`](claude-desktop/claude_desktop_config.json) | [`claude_desktop_config.api-key.json`](claude-desktop/claude_desktop_config.api-key.json) | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| Cursor | [`.cursor/mcp.json`](cursor/.cursor/mcp.json) | [`mcp.api-key.json`](cursor/mcp.api-key.json) | `.cursor/mcp.json` in a project, or `~/.cursor/mcp.json` |
| VS Code | [`.vscode/mcp.json`](vscode/.vscode/mcp.json) | [`mcp.api-key.json`](vscode/mcp.api-key.json) | `.vscode/mcp.json` in a workspace, or **MCP: Open User Configuration** |
| Windsurf (Devin Desktop) | [`mcp_config.json`](windsurf/mcp_config.json) | [`mcp_config.api-key.json`](windsurf/mcp_config.api-key.json) | `~/.config/devin/mcp_config.json`, `%APPDATA%\devin\mcp_config.json` (Windows), or `~/.codeium/windsurf/mcp_config.json` on older Windsurf versions |

If the file already exists, add the `emelia` entry next to your other servers instead of replacing the file. An `*.api-key.json` file goes in the same place as the OAuth version, under the name given in the last column. Keep the name `emelia`: the [Claude for B2B Outreach](https://github.com/emelia-io/claude-outreach) plugin expects the tools as `mcp__emelia__<tool>`.

Claude (claude.ai and Claude Desktop) and ChatGPT add the server from their settings, without a file: see the [quick start](../README.md#quick-start).

## Using an API key

Create a key in Emelia, **Settings**, **API & Webhooks**, **Create new key**. A key opens the whole account: give each client its own key. See [Authentication](../README.md#api-key).

- **Cursor and Windsurf** read the key from the `EMELIA_API_KEY` environment variable (`${env:EMELIA_API_KEY}`), so it stays out of the file. Set it where the client is started, for example `export EMELIA_API_KEY=YOUR_EMELIA_API_KEY` in a terminal, then start the client from that terminal. An app opened from the Dock or the Start menu may not see variables set in a shell profile.
- **VS Code** asks for the key the first time the server starts and stores it securely (`${input:emelia-api-key}`).
- **Claude Code** expands `${EMELIA_API_KEY}` in `.mcp.json`, or takes the key in the `--header` option of `claude mcp add`.
- **Claude Desktop through `mcp-remote`** reads the key from the `env` block of its configuration: replace `YOUR_EMELIA_API_KEY` with your key, and keep that file private. Keep `Authorization:${EMELIA_API_KEY}` without a space: some clients split arguments on spaces.

Never commit a file that contains a real key. If a key leaks, disable or delete it in **Settings**, **API & Webhooks**, then create a new one.

## `mcp-remote` is pinned

The Claude Desktop examples run `mcp-remote@0.1.38`: without a version, `npx` runs the latest release at each start, and that process holds your access to Emelia. Move the pin only after reviewing the new release.

## Tool categories

Every example can load fewer tools by adding `?toolsets=` to the URL, for example `https://mcp.emelia.io/mcp?toolsets=campaigns,lists,enrichment`. The Cursor, VS Code and Windsurf examples do it, because these clients send every tool to the model; the Claude examples keep every category, because Claude loads tools on demand. Values: `campaigns`, `lists`, `enrichment`, `linkedin_scraper`, `mailboxes`, `account`, `inbox`, `inbox_settings`. See [Tool categories](../README.md#tool-categories).

# Client configurations

Ready-to-copy configurations for the Emelia MCP server, `https://mcp.emelia.io/mcp`. The server authenticates with an Emelia API key sent in the `Authorization` header: OAuth is not supported yet, so every example carries the key, read from an environment variable or a secret input whenever the client allows it.

| Client | Example | Where the file goes |
| --- | --- | --- |
| Claude Code | [`claude-code/README.md`](claude-code/README.md), [`.mcp.json`](claude-code/.mcp.json) | `.mcp.json` at the root of a project, or the `claude mcp add` command |
| Claude Desktop, through `mcp-remote` | [`claude_desktop_config.json`](claude-desktop/claude_desktop_config.json) | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| Cursor | [`.cursor/mcp.json`](cursor/.cursor/mcp.json) | `.cursor/mcp.json` in a project, or `~/.cursor/mcp.json` |
| VS Code | [`.vscode/mcp.json`](vscode/.vscode/mcp.json) | `.vscode/mcp.json` in a workspace, or **MCP: Open User Configuration** |
| Windsurf (Devin Desktop) | [`mcp_config.json`](windsurf/mcp_config.json) | `~/.config/devin/mcp_config.json`, `%APPDATA%\devin\mcp_config.json` (Windows), or `~/.codeium/windsurf/mcp_config.json` on older Windsurf versions |

If the file already exists, add the `emelia` entry next to your other servers instead of replacing the file. Keep the name `emelia`: the [Claude for B2B Outreach](https://github.com/emelia-io/claude-outreach) plugin expects the tools as `mcp__emelia__<tool>`.

Claude (claude.ai and Claude Desktop) adds the server from its settings, without a file: see the [quick start](../README.md#claude-claudeai-and-claude-desktop). ChatGPT cannot connect yet, for lack of OAuth.

## Using your API key

Create a key in Emelia, **Settings**, **API & Webhooks**, **Create new key**. See [Authentication](../README.md#api-key).

- **Cursor and Windsurf** read the key from the `EMELIA_API_KEY` environment variable (`${env:EMELIA_API_KEY}`), so it stays out of the file. Set it where the client is started, for example `export EMELIA_API_KEY=your_key` in a terminal, then start the client from that terminal. An app opened from the Dock or the Start menu may not see variables set in a shell profile.
- **VS Code** asks for the key the first time the server starts and stores it securely (`${input:emelia-api-key}`).
- **Claude Code** expands `${EMELIA_API_KEY}` in `.mcp.json`, or takes the key in the `--header` option of `claude mcp add`.
- **Claude Desktop through `mcp-remote`** reads the key from the `env` block of its configuration: replace `YOUR_EMELIA_API_KEY` with your key, and keep that file private. `mcp-remote` is pinned (`mcp-remote@0.1.38`): without a version, `npx` runs the latest release at each start, with your key.

Never commit a file that contains a real key. If a key leaks, disable or delete it in **Settings**, **API & Webhooks**, then create a new one.

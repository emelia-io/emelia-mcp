# Claude Code

## For you, in every project

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp \
  --header "Authorization: YOUR_EMELIA_API_KEY"
```

Then run `/mcp` in Claude Code: `emelia` should be connected. The key itself is checked at the first tool call, so ask "list my campaigns" to be sure.

## For a project shared with your team

Commit a `.mcp.json` at the root of the project. It reads the key from an environment variable, which Claude Code expands when it starts, so the key never lands in the repository. That file is the same as [`.mcp.json`](.mcp.json):

```json
{
  "mcpServers": {
    "emelia": {
      "type": "http",
      "url": "https://mcp.emelia.io/mcp",
      "headers": {
        "Authorization": "${EMELIA_API_KEY}"
      }
    }
  }
}
```

Each person sets their own key, for example `export EMELIA_API_KEY=your_key`, before starting Claude Code.

Create the key in Emelia, **Settings**, **API & Webhooks**, **Create new key**. A key opens the whole account: give Claude Code its own key.

## If `/mcp` shows "needs authentication"

The header does not reach the server: check that `EMELIA_API_KEY` is set in the shell that started Claude Code, or that the `--header` option was given.

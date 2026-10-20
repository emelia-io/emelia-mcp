# Claude Code

## With OAuth (recommended)

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp
```

Then run `/mcp` in Claude Code, pick `emelia` and choose **Authenticate**. Your browser opens Emelia: check the account shown and click **Authorize**. Back in Claude Code, `emelia` shows as connected. Ask "list my campaigns" to test it.

`--scope user` makes the server available in every project. For a project shared with your team, commit a `.mcp.json` at the root of the project instead. It holds no secret: each person signs in with their own Emelia account, with `/mcp`, the first time. That file is the same as [`.mcp.json`](.mcp.json):

```json
{
  "mcpServers": {
    "emelia": {
      "type": "http",
      "url": "https://mcp.emelia.io/mcp"
    }
  }
}
```

Keep every category: Claude Code loads the tools on demand.

## With an API key

For CI, scripts or a machine without a browser, pass the key in a header. Claude Code then does not ask you to sign in:

```bash
claude mcp add --transport http --scope user emelia https://mcp.emelia.io/mcp \
  --header "Authorization: YOUR_EMELIA_API_KEY"
```

In a shared `.mcp.json`, read the key from an environment variable instead of writing it in the file. Claude Code expands `${EMELIA_API_KEY}` when it starts:

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

Each person sets their own key, for example `export EMELIA_API_KEY=YOUR_EMELIA_API_KEY`, before starting Claude Code. Create the key in Emelia, **Settings**, **API & Webhooks**, **Create new key**. A key opens the whole account: give Claude Code its own key.

The key is checked at the first tool call, not when `/mcp` shows the server as connected: ask "list my campaigns" to be sure.

## If `/mcp` shows "needs authentication"

With OAuth, pick `emelia` in `/mcp` and choose **Authenticate**. The Emelia page waits 10 minutes: past that, start again from `/mcp`. With an API key, the header does not reach the server: check that `EMELIA_API_KEY` is set in the shell that started Claude Code, or that the `--header` option was given.

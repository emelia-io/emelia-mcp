# Security policy

The Emelia MCP server gives AI assistants access to an Emelia account: campaigns, contacts and credits. We take its security seriously. Thank you for helping keep Emelia users safe.

## Reporting a vulnerability

Email **contact@emelia.io** with the subject **Security**. Please do not open a public issue, pull request or discussion for a vulnerability.

A useful report includes:

- what is affected: the MCP endpoint, a specific tool, or a file of this repository;
- the steps to reproduce, with the requests and responses involved;
- the impact you observed or expect, for example access to another account or a key that keeps working after being revoked;
- the date and time of your tests, with their timezone;
- how to reach you, and whether you would like to be credited.

Before sending, remove API keys, passwords and the personal data of your contacts from your report.

## If your API key leaked

An Emelia API key opens its whole account. Open the Emelia app, **Settings**, **API & Webhooks**, disable or delete the key right away, then create a new one and update your MCP clients.

## Testing guidelines

- Test only with your own Emelia account. Do not access, change or delete data that is not yours.
- Do not send email to people who did not agree to receive it, and do not spend credits you do not own.
- No denial of service, load testing, spam or social engineering.
- Give us a reasonable amount of time to fix an issue before you disclose it.

## Scope

- The hosted MCP server at `https://mcp.emelia.io/mcp`.
- The contents of this repository: documentation, `server.json`, `tools.json`, the scripts and the client configurations.

The Emelia app and the Emelia REST API are covered by the same contact address.

## Supply chain

Using the hosted server needs no local code. Clients limited to local servers use the `mcp-remote` bridge through `npx`: the examples pin its version (`mcp-remote@0.1.38`), so that a new upstream release never runs with your key or your sign-in before it was reviewed.

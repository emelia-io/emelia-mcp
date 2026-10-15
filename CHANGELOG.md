# Changelog

Notable changes to the Emelia MCP server and to this repository. Versions match the `version` of [`server.json`](server.json).

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

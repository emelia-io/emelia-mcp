#!/usr/bin/env python3
"""Validate server.json and glama.json against the JSON schemas they declare.

    python3 scripts/validate_schemas.py                # schemas and consistency
    python3 scripts/validate_schemas.py --check-icons  # also check the icons of server.json

Needs the jsonschema package: pip install "jsonschema[format-nongpl]"
"""

import json
import struct
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from jsonschema import FormatChecker
from jsonschema.validators import validator_for

ROOT = Path(__file__).resolve().parent.parent
# Schemas are downloaded and trusted: only these hosts may serve them.
SCHEMA_HOSTS = {"static.modelcontextprotocol.io", "glama.ai"}
USER_AGENT = "emelia-mcp-validate"
MAX_ICON_BYTES = 5 * 1024 * 1024
# Icons served from this repository are checked against the local file, so that
# a pull request can change an icon before it is on the default branch.
OWN_RAW_PREFIX = "https://raw.githubusercontent.com/emelia-io/emelia-mcp/"

errors = []


def load(name):
    with open(ROOT / name, encoding="utf-8") as file:
        return json.load(file)


def fetch(url, limit=None):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.headers.get_content_type(), response.read(limit)


def is_https(value):
    parsed = urllib.parse.urlsplit(value) if isinstance(value, str) else None
    return bool(parsed and parsed.scheme == "https" and parsed.hostname)


def check_schema(name, document):
    """Validate a document against the schema named in its $schema."""
    url = document.get("$schema")
    if not is_https(url) or urllib.parse.urlsplit(url).hostname not in SCHEMA_HOSTS:
        errors.append(f"{name}: $schema must be an https URL on {', '.join(sorted(SCHEMA_HOSTS))}.")
        return
    try:
        status, _, body = fetch(url)
    except Exception as error:  # reported like any other problem
        errors.append(f"{name}: could not download {url}: {error}")
        return
    if status != 200:
        errors.append(f"{name}: could not download {url} (HTTP {status}).")
        return
    schema = json.loads(body)
    validator_class = validator_for(schema)
    validator_class.check_schema(schema)
    validator = validator_class(schema, format_checker=FormatChecker())
    problems = sorted(validator.iter_errors(document), key=lambda error: list(error.absolute_path))
    for problem in problems:
        path = "/".join(str(part) for part in problem.absolute_path) or "(root)"
        errors.append(f"{name}: {path}: {problem.message}")
    print(f"{name}: {'valid' if not problems else 'INVALID'} against {url}")


def check_server(server, tools):
    """Rules of the official registry that the schema does not express, the
    choices of this repository, and consistency with tools.json."""
    urls = [("websiteUrl", server.get("websiteUrl"))]
    urls += [(f"icons/{i}/src", icon.get("src")) for i, icon in enumerate(server.get("icons", []))]
    remotes = server.get("remotes") or []
    urls += [(f"remotes/{i}/url", remote.get("url")) for i, remote in enumerate(remotes)]
    for path, value in urls:
        if value is not None and not is_https(value):
            errors.append(f"server.json: {path}: must be an https URL.")
    if len(server.get("description", "")) > 100:
        errors.append("server.json: description: the official registry accepts 100 characters at most.")
    if "repository" in server:
        errors.append("server.json: repository: this repository is documentation, not the source code of the server.")
    if not remotes:
        errors.append("server.json: remotes: a hosted server needs at least one remote.")
    for i, remote in enumerate(remotes):
        if remote.get("type") != "streamable-http":
            errors.append(f"server.json: remotes/{i}/type: expected streamable-http.")
    themes = {icon.get("theme") for icon in server.get("icons", [])}
    if not {"light", "dark"} <= themes:
        errors.append("server.json: icons: expected one icon with theme light and one with theme dark.")

    info = tools.get("server", {})
    for field in ("title", "description", "version", "websiteUrl"):
        if info.get(field) != server.get(field):
            errors.append(f"tools.json: server.{field} differs from server.json.")
    if info.get("url") not in [remote.get("url") for remote in remotes]:
        errors.append("tools.json: server.url is not one of the remotes of server.json.")


def png_size(data):
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return None
    width, height = struct.unpack(">II", data[16:24])
    return f"{width}x{height}"


def local_icon(src):
    """Local file behind a raw.githubusercontent.com URL of this repository."""
    rest = src[len(OWN_RAW_PREFIX):].split("/", 1)  # "<branch>", "<path>"
    if len(rest) != 2:
        return None
    return ROOT / rest[1]


def check_icons(server):
    for icon in server.get("icons", []):
        src = icon.get("src")
        if src.startswith(OWN_RAW_PREFIX):
            path = local_icon(src)
            if not path or not path.is_file():
                errors.append(f"icon {src}: no file at {path.relative_to(ROOT) if path else '?'} in this repository.")
                continue
            body = path.read_bytes()
            content_type = "image/png" if body[:8] == b"\x89PNG\r\n\x1a\n" else "unknown"
            status = "local"
        else:
            try:
                status, content_type, body = fetch(src, MAX_ICON_BYTES)
            except Exception as error:  # network errors are reported, not raised
                errors.append(f"icon {src}: {error}")
                continue
            if status != 200:
                errors.append(f"icon {src}: HTTP {status}, expected 200.")
        size = png_size(body) if content_type == "image/png" else None
        print(f"icon {src}: {status}, {content_type}, {size or 'size not read'}, theme {icon.get('theme', 'any')}")
        if icon.get("mimeType") and content_type != icon["mimeType"]:
            errors.append(f"icon {src}: is {content_type}, declared {icon['mimeType']}.")
        sizes = icon.get("sizes") or []
        if size and sizes and "any" not in sizes and size not in sizes:
            errors.append(f"icon {src}: image is {size}, declared {', '.join(sizes)}.")


def main():
    server = load("server.json")
    tools = load("tools.json")
    check_schema("server.json", server)
    check_schema("glama.json", load("glama.json"))
    check_server(server, tools)
    if "--check-icons" in sys.argv[1:]:
        check_icons(server)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

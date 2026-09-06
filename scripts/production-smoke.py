#!/usr/bin/env python3
"""Dependency-free Studihome production smoke."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Mapping

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
USER_AGENT = "Studihome-Production-Smoke/1.0"
DEFAULT_BASE_URL = "https://studihome.id"
DEFAULT_FUNCTIONS_URL = (
    "https://hbfmhwwxbgidsnljupca.supabase.co/functions/v1"
)


class SmokeError(RuntimeError):
    pass


@dataclass(frozen=True)
class HttpResult:
    status: int
    headers: Mapping[str, str]
    body: bytes


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeError(message)


def _headers_dict(headers) -> dict[str, str]:
    return {
        str(key).lower(): str(value).strip()
        for key, value in headers.items()
    }


def http_request(
    url: str,
    *,
    method: str = "GET",
    body: bytes | None = None,
    headers: Mapping[str, str] | None = None,
    timeout: float = 15.0,
    attempts: int = 3,
    allow_http_error: bool = False,
) -> HttpResult:
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(
            url,
            data=body,
            method=method,
            headers={
                "User-Agent": USER_AGENT,
                **dict(headers or {}),
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return HttpResult(
                    int(response.status),
                    _headers_dict(response.headers),
                    response.read(),
                )
        except urllib.error.HTTPError as error:
            result = HttpResult(
                int(error.code),
                _headers_dict(error.headers),
                error.read(),
            )
            if allow_http_error:
                return result
            last_error = error
            if error.code < 500 or attempt == attempts:
                break
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            if attempt == attempts:
                break

        time.sleep(2)

    raise SmokeError(
        f"HTTP request failed after {attempts} attempt(s): "
        f"{url}: {last_error}"
    )


def require_header(
    headers: Mapping[str, str],
    name: str,
    expected: str,
    *,
    contains: bool = False,
) -> None:
    actual = str(headers.get(name.lower(), ""))
    matched = (
        expected.lower() in actual.lower()
        if contains
        else actual.lower() == expected.lower()
    )
    require(
        matched,
        f"Header {name} expected {expected!r}; got {actual!r}",
    )


def parse_json(body: bytes, label: str) -> dict:
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception as error:
        raise SmokeError(f"{label} is not valid JSON: {error}") from error
    require(isinstance(payload, dict), f"{label} root must be an object")
    return payload


def validate_version(
    payload: Mapping[str, object],
    expected_sha: str,
) -> None:
    require(payload.get("status") == "ok", "Version status is not ok")
    require(payload.get("commit") == expected_sha, "Version SHA mismatch")
    require(
        payload.get("environment") == "production",
        "Version environment is not production",
    )


def validate_agent(payload: Mapping[str, object]) -> None:
    require(
        payload.get("status") == "success",
        "Agent Search status is not success",
    )
    results = payload.get("results")
    require(isinstance(results, list), "Agent Search results is not a list")
    require(
        payload.get("count") == len(results),
        "Agent Search count/result mismatch",
    )


def validate_sitemap(body: bytes) -> int:
    try:
        root = ET.fromstring(body)
    except ET.ParseError as error:
        raise SmokeError(f"Sitemap XML invalid: {error}") from error

    require(root.tag.endswith("urlset"), "Sitemap root is not urlset")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [
        (node.text or "").strip()
        for node in root.findall("s:url/s:loc", ns)
    ]
    require(bool(locs), "Sitemap contains no URLs")
    require(len(locs) == len(set(locs)), "Sitemap contains duplicate URLs")

    required = {
        "https://studihome.id/",
        "https://studihome.id/privasi",
        "https://studihome.id/ketentuan",
        "https://studihome.id/ai-video",
        "https://studihome.id/ai-automation",
        "https://studihome.id/ai-content",
    }
    missing = sorted(required.difference(locs))
    require(
        not missing,
        "Missing sitemap URLs: " + ", ".join(missing),
    )

    private_roots = (
        "/admin",
        "/dapur",
        "/kamar",
        "/dashboard",
        "/creator-studio",
        "/ruang-kerja",
    )
    bad = []
    for location in locs:
        path = urllib.parse.urlparse(location).path
        if any(
            path == root_path or path.startswith(root_path + "/")
            for root_path in private_roots
        ):
            bad.append(location)

    require(not bad, "Private URLs in sitemap: " + ", ".join(bad))
    return len(locs)


def wait_for_production_sha(
    base_url: str,
    expected_sha: str,
    max_attempts: int = 36,
    delay_seconds: float = 10.0,
) -> None:
    print("Wait for production alias SHA")
    for attempt in range(1, max_attempts + 1):
        actual = ""
        try:
            result = http_request(
                f"{base_url}/api/version",
                attempts=1,
                timeout=10,
                allow_http_error=True,
            )
            if result.body:
                payload = parse_json(result.body, "version endpoint")
                actual = str(payload.get("commit") or "").lower()
        except Exception:
            actual = ""

        if actual == expected_sha:
            print(f"Production alias matches {expected_sha}")
            return

        print(
            f"Production alias not ready "
            f"(attempt {attempt}/{max_attempts}, got: {actual or 'none'})"
        )
        if attempt != max_attempts:
            time.sleep(delay_seconds)

    raise SmokeError(
        f"Production alias did not converge to {expected_sha}"
    )


def smoke_public_pages(base_url: str) -> None:
    home = http_request(f"{base_url}/")
    require(home.status == 200, "Homepage did not return 200")
    require(b"Studihome" in home.body, "Homepage marker missing")

    require_header(
        home.headers,
        "strict-transport-security",
        "max-age=31536000",
        contains=True,
    )
    require_header(home.headers, "x-content-type-options", "nosniff")
    require_header(
        home.headers,
        "referrer-policy",
        "strict-origin-when-cross-origin",
    )
    require_header(home.headers, "x-frame-options", "DENY")
    require_header(
        home.headers,
        "content-security-policy",
        "frame-ancestors 'none';",
        contains=True,
    )
    require_header(
        home.headers,
        "permissions-policy",
        "camera=(), microphone=(), geolocation=()",
        contains=True,
    )

    for path in ("/privasi", "/ketentuan"):
        page = http_request(f"{base_url}{path}")
        require(page.status == 200, f"{path} did not return 200")

    dapur = http_request(f"{base_url}/dapur")
    require(dapur.status == 200, "Dapur did not return 200")
    require_header(
        dapur.headers,
        "x-robots-tag",
        "noindex, nofollow, noarchive",
        contains=True,
    )
    dapur_html = dapur.body.decode("utf-8", errors="replace").lower()
    require(
        'name="robots" content="noindex, nofollow, noarchive"' in dapur_html,
        "Dapur meta robots noindex guard missing",
    )
    print("Public pages/security smoke: PASS")


def smoke_sitemap_and_public_api(base_url: str) -> None:
    sitemap = http_request(f"{base_url}/sitemap.xml")
    count = validate_sitemap(sitemap.body)
    print(f"Sitemap smoke: PASS ({count} unique URLs)")

    agent = http_request(f"{base_url}/api/agent-search")
    validate_agent(parse_json(agent.body, "Agent Search"))
    print("Agent Search smoke: PASS")

    pseo = http_request(
        f"{base_url}/solusi/ai-video-untuk-umkm.md"
    )
    markdown = pseo.body.decode("utf-8", errors="replace")
    require(
        markdown.startswith("# Solusi Video dengan AI untuk UMKM"),
        "pSEO Markdown title mismatch",
    )
    print("pSEO Markdown smoke: PASS")


def smoke_edge_unauthenticated(functions_url: str) -> None:
    for name in (
        "send-email-verification",
        "provision_managed_creators",
    ):
        result = http_request(
            f"{functions_url}/{name}",
            method="POST",
            body=b"{}",
            headers={"Content-Type": "application/json"},
            attempts=1,
            allow_http_error=True,
        )
        require(
            result.status == 401,
            f"{name} unauthenticated status was "
            f"{result.status}, expected 401",
        )
        print(f"{name} unauthenticated boundary: PASS (401)")


def smoke_version(base_url: str, expected_sha: str) -> None:
    result = http_request(f"{base_url}/api/version")
    require(result.status == 200, "Version endpoint did not return 200")
    require_header(
        result.headers,
        "cache-control",
        "no-store",
        contains=True,
    )
    validate_version(
        parse_json(result.body, "version endpoint"),
        expected_sha,
    )
    print("Version endpoint smoke: PASS")


def self_test() -> None:
    sha = "a" * 40
    validate_version(
        {
            "status": "ok",
            "commit": sha,
            "environment": "production",
        },
        sha,
    )
    validate_agent({"status": "success", "count": 0, "results": []})
    require_header(
        {"cache-control": "no-store, max-age=0"},
        "cache-control",
        "no-store",
        contains=True,
    )

    sitemap = b"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://studihome.id/</loc></url>
<url><loc>https://studihome.id/privasi</loc></url>
<url><loc>https://studihome.id/ketentuan</loc></url>
<url><loc>https://studihome.id/ai-video</loc></url>
<url><loc>https://studihome.id/ai-automation</loc></url>
<url><loc>https://studihome.id/ai-content</loc></url>
</urlset>
"""
    require(validate_sitemap(sitemap) == 6, "Sitemap self-test mismatch")
    print("Production smoke self-test: PASS")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    expected_sha = str(os.environ.get("EXPECTED_SHA", "")).strip().lower()
    require(
        bool(SHA_RE.fullmatch(expected_sha)),
        "EXPECTED_SHA must be a 40-character Git SHA",
    )

    base_url = str(
        os.environ.get("BASE_URL", DEFAULT_BASE_URL)
    ).rstrip("/")
    functions_url = str(
        os.environ.get(
            "SUPABASE_FUNCTIONS_URL",
            DEFAULT_FUNCTIONS_URL,
        )
    ).rstrip("/")

    wait_for_production_sha(base_url, expected_sha)
    smoke_public_pages(base_url)
    smoke_sitemap_and_public_api(base_url)
    smoke_edge_unauthenticated(functions_url)
    smoke_version(base_url, expected_sha)

    print(f"Studihome production smoke: PASS for {expected_sha}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SmokeError as error:
        print(f"::error::{error}", file=sys.stderr)
        raise SystemExit(1)

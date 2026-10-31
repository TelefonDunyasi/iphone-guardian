#!/usr/bin/env python3
"""Static smoke checks for the iPhone Guardian PWA and native starter."""
from pathlib import Path
import json
import re
import sys
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

index_path = ROOT / "index.html"
manifest_path = ROOT / "manifest.webmanifest"
worker_path = ROOT / "sw.js"
native_path = ROOT / "ios/Sources/iPhoneGuardianApp.swift"

for path in (index_path, manifest_path, worker_path, native_path):
    require(path.is_file(), f"Required file is missing: {path.relative_to(ROOT)}")

if index_path.is_file():
    html = index_path.read_text(encoding="utf-8")
    required_ids = (
        "urlCheckForm", "messageGuardForm", "appAdvisorForm",
        "tasks", "authForm", "dashReport",
    )
    for element_id in required_ids:
        require((f'id="{element_id}"' in html) or (f"id='{element_id}'" in html),
                f"Missing required PWA element: #{element_id}")

    for feature in ("analyzeUrlLocally", "Mesajı analiz et", "Apple App Store"):
        require(feature.casefold() in html.casefold(),
                f"Missing expected PWA feature text/code: {feature}")

    require("güvenlik garantisi değildir" in html.casefold(),
            "PWA must clearly state that heuristic results are not a security guarantee.")
    require("sunucuya gönderilmedi" in html.casefold(),
            "PWA must disclose that local message analysis is not sent to a server.")

    class LinkChecker(HTMLParser):
        def __init__(self):
            super().__init__()
            self.bad_links = []
        def handle_starttag(self, tag, attrs):
            if tag != "a":
                return
            attrs = dict(attrs)
            if attrs.get("target") == "_blank":
                rel = set((attrs.get("rel") or "").lower().split())
                if not {"noopener", "noreferrer"}.issubset(rel):
                    self.bad_links.append(attrs.get("href", "(href missing)"))

    checker = LinkChecker()
    checker.feed(html)
    for href in checker.bad_links:
        errors.append(f'External new-tab link is missing rel="noopener noreferrer": {href}')

if manifest_path.is_file():
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        require(bool(manifest.get("name")), "Web manifest must define a name.")
        require(bool(manifest.get("start_url")), "Web manifest must define start_url.")
        require(manifest.get("display") in ("standalone", "fullscreen", "minimal-ui"),
                "Web manifest should use an installable display mode.")
    except (json.JSONDecodeError, OSError) as exc:
        errors.append(f"Web manifest is invalid: {exc}")

if worker_path.is_file():
    worker = worker_path.read_text(encoding="utf-8")
    require("addEventListener" in worker and "fetch" in worker,
            "Service worker should register lifecycle and fetch handlers.")
    require("url.origin !== self.location.origin" in worker,
            "Service worker must not intercept third-party requests.")
    require('request.mode === "navigate"' in worker,
            "Offline index fallback must be limited to page navigation.")
    require('caches.match("./index.html")' in worker,
            "Service worker should keep an offline navigation fallback.")
    require("Response.error()" in worker,
            "Missing offline assets must not be replaced with the HTML page.")

if native_path.is_file():
    native = native_path.read_text(encoding="utf-8")
    for marker in ("LocalURLAnalyzer", "MessageAnalyzer", "ChecklistView", "AppAdvisorView"):
        require(marker in native, f"Native iOS app is missing expected component: {marker}")

if errors:
    print("iPhone Guardian smoke checks FAILED:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("iPhone Guardian smoke checks passed.")
print("PWA forms, privacy disclosures, install metadata, service worker, and native modules are present.")

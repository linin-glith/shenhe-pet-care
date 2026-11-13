# -*- coding: utf-8 -*-
"""The legacy addresses, and whether they still point somewhere.

WHAT THIS CHECKS
  1. every address the legacy site published is in the map. A legacy
     address that is not in the map is an address a search engine may
     still be holding, and it answers 404 - the history behind it is
     gone and the engine has to find the page again from nothing.
  2. every target in the map is a page the site publishes. A redirect to
     an address that does not exist is a redirect to nowhere.
  3. (with --live) every legacy address answers 301, and answers it with
     the address the map names. A redirect to the WRONG page is worse
     than no redirect: it hands one product's history to another one.

    That third one is not hypothetical. The site carried a redirect for
    the legacy shampoo address that pointed at the Multi-Purpose Pet
    Wash page, because the two are both cleansers and the guess looked
    reasonable. The SKU says otherwise, and so does the name.

WHY THE MAP IS A SEPARATE FILE
The rules that serve these addresses live in the nginx vhost, which is
on the server and not in the repository. So the map lives here, in the
repository, and the vhost is generated from it. One list, checked
against the legacy capture, and against the live answers.
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, "scripts", "legacy-redirects.json")
CAPTURE = os.path.join(ROOT, "content", "_livejsonld.json")
SITE = "https://shenhezhongke.com"


def legacy_addresses():
    """Every product address the legacy capture knows, with its SKU."""
    found = {}

    def collect(node):
        if isinstance(node, dict):
            url = node.get("url") or ""
            sku = node.get("sku") or ""
            if isinstance(url, str) and "/products/" in url and sku:
                found.setdefault(url.rsplit("/", 1)[-1], sku)
            for v in node.values():
                collect(v)
        elif isinstance(node, list):
            for v in node:
                collect(v)

    collect(json.load(open(CAPTURE, encoding="utf-8")))
    return found


def published():
    """The product pages the site publishes now."""
    sm = os.path.join(ROOT, "public", "sitemap.xml")
    text = open(sm, encoding="utf-8").read()
    return {u.rsplit("/", 1)[-1] for u in re.findall(r"<loc>([^<]+)</loc>", text) if "/products/" in u}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="also ask the live site what it answers")
    args = ap.parse_args()

    doc = json.load(open(MAP, encoding="utf-8"))
    mapping = doc["redirects"]
    problems = []

    legacy = legacy_addresses()
    for slug, sku in sorted(legacy.items()):
        if slug not in mapping:
            problems.append(f"the legacy address {slug} ({sku}) is not in the map")

    pages = published()
    for slug, target in sorted(mapping.items()):
        if target not in pages:
            problems.append(f"{slug} redirects to {target}, which the site does not publish")

    for slug in sorted(mapping):
        if slug in pages:
            problems.append(f"{slug} is in the map and is also a published page")

    # --- the live answers -------------------------------------------------
    checked = 0
    if args.live and not problems:
        for slug, target in sorted(mapping.items()):
            url = f"{SITE}/products/{slug}"
            request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
            opener = urllib.request.build_opener(NoRedirect)
            try:
                response = opener.open(request, timeout=30)
                code, location = response.status, response.headers.get("Location", "")
            except urllib.error.HTTPError as e:
                code, location = e.code, e.headers.get("Location", "")
            except Exception as e:
                problems.append(f"{slug} could not be asked: {e}")
                continue
            checked += 1
            if code != 301:
                problems.append(f"{slug} answers {code}, not 301")
                continue
            if not location.endswith(f"/products/{target}"):
                problems.append(f"{slug} redirects to {location}, not /products/{target}")

    if problems:
        for p in problems:
            sys.stderr.write("    %s\n" % p)
        sys.stderr.write("  the legacy addresses do not all point somewhere\n")
        return 1

    detail = f"{len(mapping)} legacy addresses, all mapped to a published page"
    if checked:
        detail += f", and all {checked} answer 301 to the page they name"
    print(f"  the legacy addresses: {detail}")
    return 0


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """A redirect is the thing being checked, so it is not followed."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


if __name__ == "__main__":
    sys.exit(main())

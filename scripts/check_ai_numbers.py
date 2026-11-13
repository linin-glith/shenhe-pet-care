#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE NUMBERS IN THE MACHINE FILES HAVE TO BE THE NUMBERS ON THE SITE.

WHAT THIS IS FOR
Two numbers in the machine-readable files were typed by hand and had
drifted away from the site:

  - llms-full.json said the minimum order was 500 while every SKU, every
    product page and llms.txt said 1,000 or more. An engine that reads
    the machine file and quotes it would tell a buyer the opposite of
    what the page says;
  - the AI manifest said "59 buyer Q&A pairs" while the knowledge base
    holds 94.

Both are hand-typed values inside files that a build regenerates - and a
build that regenerates a file does not necessarily rewrite the values in
it. So the value survives, and the number goes on being wrong.

WHAT IT CHECKS
  1. the minimum order in llms-full.json is the floor of the catalogue's
     minimum orders;
  2. the number of Q&A pairs in the AI manifest is the number the
     knowledge base holds;
  3. every address the site advertises to a crawler - in robots.txt, in
     the sitemaps, in the AI manifest - exists in the build. An address
     that is advertised and not there is a dead end for an engine.

Run:  python scripts/check_ai_numbers.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
PUBLIC = os.path.join(ROOT, "public")

problems: list[str] = []


def read(path: str) -> str:
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def load(path: str):
    raw = read(path)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except ValueError as e:
        problems.append("%s is not valid JSON: %s" % (os.path.basename(path), e))
        return None


def main() -> int:
    # ------------------------------------------------------------------
    # 1. the minimum order
    # ------------------------------------------------------------------
    catalogue = load(os.path.join(ROOT, "lib", "products.json"))
    if catalogue is None:
        problems.append("lib/products.json cannot be read")
    else:
        floors = []
        for p in catalogue.get("products") or []:
            if p.get("status") != "active":
                continue
            n = re.sub(r"[^\d]", "", str(p.get("moq") or ""))
            if n:
                floors.append(int(n))
        floor = min(floors) if floors else 0

        full = load(os.path.join(PUBLIC, "llms-full.json"))
        if full is None:
            problems.append("public/llms-full.json cannot be read")
        else:
            st = ((full.get("company") or {}).get("shippingTerms") or {})
            stated = st.get("minOrderQuantity")
            if stated != floor:
                problems.append(
                    "llms-full.json says the minimum order is %s, and the catalogue's floor is %s"
                    % (stated, floor))
            # and every product in the same file has to agree with it
            for p in (full.get("products") or []):
                n = re.sub(r"[^\d]", "", str(p.get("moq") or ""))
                if n and int(n) < floor:
                    problems.append("llms-full.json lists %s with a minimum order of %s, below the floor %s"
                                    % (p.get("name"), n, floor))

    # ------------------------------------------------------------------
    # 2. the number of Q&A pairs
    # ------------------------------------------------------------------
    faq = load(os.path.join(PUBLIC, "assets", "data", "faq.json"))
    manifest = load(os.path.join(PUBLIC, ".well-known", "ai-manifest.json"))
    if faq is None or manifest is None:
        problems.append("the knowledge base or the AI manifest cannot be read")
    else:
        count = len(faq.get("items") or [])
        raw = read(os.path.join(PUBLIC, ".well-known", "ai-manifest.json"))
        m = re.search(r'"(\d+)\s+buyer Q&A pairs"', raw)
        if not m:
            problems.append("the AI manifest does not say how many Q&A pairs it holds")
        elif int(m.group(1)) != count:
            problems.append(
                "the AI manifest says %s Q&A pairs and the knowledge base holds %s"
                % (m.group(1), count))

    # ------------------------------------------------------------------
    # 3. every address the site advertises has to exist
    # ------------------------------------------------------------------
    advertised = set()
    robots = read(os.path.join(PUBLIC, "robots.txt"))
    for u in re.findall(r"^Sitemap:\s*(\S+)", robots, re.M):
        path = u.split("shenhezhongke.com", 1)[-1]
        if path.startswith("/"):
            advertised.add(path)
    for name in ("sitemap.xml", "sitemap-ai.xml", "llms-sitemap.xml", "sitemap-index.xml"):
        body = read(os.path.join(PUBLIC, name))
        for u in re.findall(r"<loc>([^<]+)</loc>", body):
            path = u.split("shenhezhongke.com", 1)[-1] or "/"
            advertised.add(path)
    raw_manifest = read(os.path.join(PUBLIC, ".well-known", "ai-manifest.json"))
    for u in re.findall(r'https://shenhezhongke\.com(/[A-Za-z0-9_.\-/]+)', raw_manifest):
        advertised.add(u)

    missing = []
    for path in sorted(advertised):
        if path.endswith("/"):
            local = os.path.join(OUT, path.strip("/"), "index.html")
        else:
            local = os.path.join(OUT, path.strip("/"))
        if not os.path.exists(local):
            missing.append(path)
    if missing:
        problems.append("%d advertised address(es) are not in the build: %s"
                        % (len(missing), ", ".join(missing[:5])))

    if problems:
        print("FAIL  the machine files do not agree with the site")
        for p in problems[:12]:
            print("    " + p)
        return 1

    print("ok    the minimum order, the Q&A count and every advertised address agree")
    return 0


if __name__ == "__main__":
    sys.exit(main())

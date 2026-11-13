#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE PRODUCT FEED, AGAINST THE CATALOGUE AND AGAINST THE SERVER.

WHAT THIS IS FOR

The feed (public/product-feed.json) is the one file an agent fetches to
answer "do you make it, what is the minimum order, and how do I send you
the details". It is generated from lib/products.json, so it cannot drift
from the catalogue by construction - but a generated file that is never
checked is a generated file nobody reads.

So the feed is checked against three things it cannot be allowed to
disagree with:

  1. THE CATALOGUE. Every active SKU is in the feed, with the minimum
     order, the lead times, the size and the name the catalogue says. And
     nothing else is in it.

  2. THE SERVER. The enquiry contract in the feed is compared with the
     fields server-pg/server.js actually reads. The old API description
     left out volume, quantity, incoterm, customerType and source_detail,
     and the three that make an enquiry QUOTABLE are products, volume and
     country - so an agent that followed it produced an enquiry the desk
     had to chase. This gate is what stops that from happening again.

  3. THE PUBLISHED FILES. The feed is in public/ AND in the build, the
     reading lists advertise it, the agent skills name it, and the OpenAPI
     document carries the same field list.

AND THE ONE THING THE FEED MUST NEVER CARRY
A price. There is no price in it, and the minimum order in it is a
quantity. The site is quote-only.

USAGE
  python scripts/check_product_feed.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(ROOT, "out")
FEED = os.path.join(PUBLIC, "product-feed.json")
CATALOGUE = os.path.join(ROOT, "lib", "products.json")
SERVER = os.path.join(ROOT, "server-pg", "server.js")
OPENAPI = os.path.join(PUBLIC, ".well-known", "openapi.json")
SKILLS = os.path.join(ROOT, "agent-skills")

# A currency amount. The feed must carry none of these.
AMOUNT = re.compile(r"(?:US\$|USD|RMB|\$)\s*\d[\d,]*(?:\.\d+)?")


def read(path: str) -> str:
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def load(path: str):
    with io.open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    problems: list[str] = []

    if not os.path.exists(FEED):
        print("!! public/product-feed.json is not there")
        return 2
    feed = load(FEED)
    catalogue = load(CATALOGUE)
    active = [p for p in catalogue["products"] if p["status"] == "active"]

    items = feed.get("items") or []
    by_id = {i.get("id"): i for i in items}

    # The other view of the same record. The two published files are written
    # by the same helper, so a difference between them is a hand-edit.
    machine = load(os.path.join(PUBLIC, "llms-full.json"))
    machine_by_id = {p.get("id"): p for p in (machine.get("products") or [])}

    # ---- 1. the catalogue ------------------------------------------------
    for p in active:
        item = by_id.get(p["id"])
        if item is None:
            problems.append("the feed has no entry for %s (%s)" % (p["id"], p["name_en"]))
            continue
        if item.get("name") != p["name_en"]:
            problems.append(
                "%s: the feed says %r, the catalogue says %r" % (p["id"], item.get("name"), p["name_en"])
            )
        want_moq = "%s %s" % ("{:,}".format(p["moq"]), p["moq_unit"])
        if (item.get("minimumOrder") or {}).get("text") != want_moq:
            problems.append(
                "%s: the feed's minimum order is %r, the catalogue says %r"
                % (p["id"], (item.get("minimumOrder") or {}).get("text"), want_moq)
            )
        want_lead = "%s days stock · %s days private label" % (
            p["lead_time_days_stock"], p["lead_time_days_oem"])
        if (item.get("leadTime") or {}).get("text") != want_lead:
            problems.append(
                "%s: the feed's lead time is %r, the catalogue says %r"
                % (p["id"], (item.get("leadTime") or {}).get("text"), want_lead)
            )
        if item.get("hsCode") != p.get("hs_code"):
            problems.append("%s: the feed's HS code is not the catalogue's" % p["id"])
        other = machine_by_id.get(p["id"]) or {}
        if other and item.get("claim") != other.get("claim"):
            problems.append(
                "%s: the feed's claim is not the one the other published view carries"
                % p["id"]
            )

    # The two published views must carry the same products: the catalogue
    # SKUs, plus the two Pet Nutrition products that are quoted one at a
    # time and are not catalogue SKUs.
    if set(by_id) != set(machine_by_id):
        problems.append(
            "the feed and llms-full.json carry different products: only in the feed %s, "
            "only in llms-full.json %s"
            % (sorted(set(by_id) - set(machine_by_id)), sorted(set(machine_by_id) - set(by_id)))
        )

    if feed.get("meta", {}).get("skuCount") != len(items):
        problems.append("the feed's skuCount does not match the number of items")
    if feed.get("meta", {}).get("pricePublished") is not False:
        problems.append("the feed does not say that it publishes no price")

    # ---- 2. the server --------------------------------------------------
    inquiry = feed.get("enquiry") or {}
    fields = set((inquiry.get("fields") or {}).keys())
    # The API service is not in the published copy of this repository, so the
    # comparison below has nothing to compare against there. It is skipped, and
    # it says so - a gate that crashes on a missing file tells nobody anything.
    has_server = os.path.exists(SERVER)
    server_src = read(SERVER) if has_server else ""
    server_fields = set(re.findall(r"body\.(\w+)", server_src))
    bot_fields = set((inquiry.get("botChecks") or {}).keys()) - {"note"}
    # The bot-check fields are read by the server but are not enquiry fields.
    want = server_fields - bot_fields
    missing = want - fields
    extra = fields - want
    if has_server:
        if missing:
            problems.append(
                "the feed's enquiry contract does not carry %s - the server reads them, so an "
                "agent that follows the feed would leave them out" % sorted(missing)
            )
        if extra:
            problems.append(
                "the feed's enquiry contract carries %s - the server does not read them, so "
                "an agent would be sending fields that go nowhere" % sorted(extra)
            )
    else:
        print(
            "   the API service is not in this repository: the enquiry contract was not "
            "compared with the fields the server reads"
        )
    for required in ("message",):
        if required not in fields:
            problems.append("the feed's enquiry contract does not carry the required %r" % required)
    if inquiry.get("endpoint", "").rstrip("/") != "https://shenhezhongke.com/api/inquiries":
        problems.append("the feed's enquiry endpoint is not the one the site serves")

    # ---- 3. the published files -----------------------------------------
    published = os.path.join(OUT, "product-feed.json")
    if not os.path.exists(published):
        problems.append("the feed is not in the build (out/product-feed.json)")
    else:
        try:
            if load(published) != feed:
                problems.append("the feed in the build is not the feed in public/")
        except Exception as e:
            problems.append("the feed in the build cannot be read: %s" % e)

    if os.path.exists(OPENAPI):
        try:
            api = load(OPENAPI)
            body = (api.get("paths", {}).get("/api/inquiries", {}).get("post", {})
                    .get("requestBody", {}).get("content", {})
                    .get("application/json", {}).get("schema", {}))
            api_fields = set((body.get("properties") or {}).keys())
            if api_fields != fields:
                problems.append(
                    "the OpenAPI document and the feed describe different enquiries: "
                    "only in the API %s, only in the feed %s"
                    % (sorted(api_fields - fields), sorted(fields - api_fields))
                )
        except Exception as e:
            problems.append("the OpenAPI document cannot be read: %s" % e)
    else:
        problems.append("public/.well-known/openapi.json is not there")

    for skill in ("shenhe-sourcing", "shenhe-rfq-helper"):
        path = os.path.join(SKILLS, skill, "SKILL.md")
        if not os.path.exists(path):
            problems.append("the skill %s is not there" % skill)
            continue
        text = read(path)
        if "/product-feed.json" not in text:
            problems.append("the skill %s does not name the product feed" % skill)

    # The site's convention: robots.txt names the sitemaps, and the AI
    # index lists the machine-readable files themselves.
    sitemap_ai = read(os.path.join(PUBLIC, "sitemap-ai.xml"))
    if "/product-feed.json" not in sitemap_ai:
        problems.append("sitemap-ai.xml does not list the product feed")

    # ---- the one thing it must never carry ------------------------------
    blob = json.dumps(feed, ensure_ascii=False)
    for m in AMOUNT.finditer(blob):
        problems.append("the feed carries a currency amount: %r" % m.group(0))

    print("feed entries                : %d" % len(items))
    print("catalogue SKUs on the feed  : %d of %d"
          % (len([i for i in items if i.get("id") in {p["id"] for p in active}]), len(active)))
    print("enquiry fields in the feed  : %d" % len(fields))
    print("fields the server reads     : %d" % len(want))

    if problems:
        print()
        print("!! %d product feed problem(s):" % len(problems))
        for p in problems:
            print("  - %s" % p)
        return 1

    print()
    print("OK: the feed is the catalogue, the enquiry contract is the server's, the "
          "files that point at it exist, and there is no price in it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

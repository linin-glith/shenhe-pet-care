#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE SITE PUBLISHES NO OFFER. NOT IN THE TEXT, NOT IN THE MARKUP.

WHY THIS FILE EXISTS

On 2026-11-08 two pages published an OfferCatalog. Google read it as a
catalogue of offers and said, in the merchant listings report:

    "price or priceSpecification must be specified (in offers)"

An OfferCatalog is a catalogue OF OFFERS, so the whole node had to go -
not just the price inside it. It went on 2026-11-08, and the pages have
been clean ever since.

But that fix was a DECISION, and a decision nobody checks is a decision
that comes back. The price gate (check_no_price_leak.py) covers currency
amounts in the visible text. It does not cover the structured data, where
a price does not have to look like a price: "price": 0, "price": "on
request", a priceSpecification with a currency and no value - none of
those carry a currency amount, and all of them are what Google is asking
for.

So this gate reads the JSON-LD of every built page and refuses:

  - a node of type Offer, AggregateOffer, OfferCatalog or Demand
  - a node with an offers property
  - a price key anywhere: price, priceSpecification, lowPrice, highPrice
  - a currency key: priceCurrency
  - and the same thing written as microdata instead of JSON-LD

WHAT IS NOT FORBIDDEN

priceRange on a LocalBusiness is a business-level price INDICATOR ("$$"),
not a price for a product. The site does not publish one today. If it is
ever added, it must not carry a currency amount - the price gate still
holds that line, and this gate does not touch it.

WHAT IS READ, AND WHAT THE OTHER GATE ALREADY DOES

The built pages. The RSC payload files beside them are the same pages in
a machine format, and Google does not read them as structured data.

There is another gate on this rule, inside scripts/check-build.mjs: it
forbids the KEYS ("offers", "price", "priceCurrency", "availability",
"priceSpecification", "lowPrice", "highPrice", "priceRange",
"hasOfferCatalog") on the JSON-LD blocks of the built pages. Two gates on
one rule is deliberate here, because the rule has been broken twice
(2026-11-04, 2026-11-08) and a rule that has been broken twice needs two
locks. This one covers the three things the other does not:

  - the TYPE. The other gate forbids the key that carries an offer; a
    node whose @type is Offer and which sits under a key the reader does
    not know is an offer the other gate never sees, and it is exactly
    what Google's merchant listings report reads.
  - microdata. The other gate reads JSON-LD blocks only, so an
    itemprop="price" written into the page itself would be invisible to it.
  - and the same rule a second time, on the same blocks, with the key
    list below.

USAGE
  python scripts/check_no_offers.py [--dir out]
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(ROOT, "out")

LD = re.compile(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', re.S | re.I)

# The node types that are an offer, by any name.
OFFER_TYPES = {"Offer", "AggregateOffer", "OfferCatalog", "Demand"}

# The properties that carry a price, or the promise of one.
PRICE_KEYS = {
    "price",
    "priceSpecification",
    "lowPrice",
    "highPrice",
    "priceCurrency",
    "availability",
    "hasOfferCatalog",
}

# The same thing written as microdata, or left in the page as a raw string.
RAW_MARKERS = (
    '"offers"',
    '"priceSpecification"',
    '"priceCurrency"',
    '"availability"',
    '"hasOfferCatalog"',
    '"OfferCatalog"',
    '"AggregateOffer"',
    'itemprop="price"',
    'itemprop="priceCurrency"',
    'itemprop="availability"',
    'itemprop="offers"',
)


def read(path: str) -> str:
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def walk(node, path, problems, page):
    """Every node of the tree, by name and by key."""
    if isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, "%s[%d]" % (path, i), problems, page)
        return
    if not isinstance(node, dict):
        return

    t = node.get("@type")
    types = t if isinstance(t, list) else [t]
    for ty in types:
        if ty in OFFER_TYPES:
            problems.append(
                "%s: a %s node - this site publishes no offer, and a %s is what "
                "Google reads as a catalogue of things to buy" % (page, ty, ty)
            )
    for key in node:
        if key in PRICE_KEYS:
            problems.append(
                "%s: a %r property in the structured data - a price is not published, "
                "so a price key is a claim the site does not make" % (page, key)
            )
        if key == "offers":
            problems.append(
                "%s: an 'offers' property - the site publishes no offer" % page
            )
    for k, v in node.items():
        walk(v, "%s.%s" % (path, k), problems, page)


def main() -> int:
    out_dir = DEFAULT_OUT
    args = sys.argv[1:]
    if "--dir" in args:
        i = args.index("--dir")
        out_dir = args[i + 1] if i + 1 < len(args) else DEFAULT_OUT
    if not os.path.isdir(out_dir):
        print("!! %s is not there - build the site first" % out_dir)
        return 2

    problems: list[str] = []
    pages = 0
    blocks = 0

    for base, dirs, names in os.walk(out_dir):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for n in sorted(names):
            if not n.endswith(".html"):
                continue
            p = os.path.join(base, n)
            rel = os.path.relpath(p, out_dir).replace("\\", "/")
            raw = read(p)
            pages += 1

            for marker in RAW_MARKERS:
                if marker in raw:
                    problems.append(
                        "%s: %s appears in the page - the site publishes no offer, "
                        "not in JSON-LD and not as microdata" % (rel, marker)
                    )

            for m in LD.finditer(raw):
                blocks += 1
                try:
                    data = json.loads(m.group(1).strip())
                except Exception as e:
                    problems.append(
                        "%s: a JSON-LD block does not parse (%s) - a block the reader "
                        "discards is worse than no block" % (rel, str(e)[:60])
                    )
                    continue
                walk(data, "$", problems, rel)

    print("pages scanned              : %d" % pages)
    print("JSON-LD blocks read        : %d" % blocks)
    print("offers in the structured data: %d" % len(problems))

    if problems:
        print()
        print("!! %d offer problem(s):" % len(problems))
        for p in problems[:12]:
            print("  - %s" % p)
        if len(problems) > 12:
            print("  ... and %d more" % (len(problems) - 12))
        return 1

    print()
    print("OK: the site publishes no offer - no offer node, no offers property, "
          "no price key, no microdata price.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

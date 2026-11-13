#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EVERY CATALOGUE PRODUCT PAGE SAYS WHICH SIZE IT IS, AND CARRIES THE
FACTORY, THE CAPACITY AND THE TERMS.

THE FIRST RULE: TWO PRODUCT PAGES MAY NOT WEAR THE SAME DESCRIPTION
Four of them did. The cat litter powder in 300 g and in 500 g, and the
multi-purpose wash in 200 mL and in 300 mL, each pair had one
description, because the description is assembled from its pieces and
the size was one optional piece among several. A buyer searching either
size wants the one in their hand, and a search engine cannot tell two
pages apart if they read the same.

THE SECOND RULE: THE PRODUCT PAGE CARRIES WHAT THE BUYER ASKS NEXT
The round 112 audit measured it: the factory appeared on 11 of 99 pages,
the capacity on 6, the trade terms on 33. Those are the questions a
sourcing manager asks at the product. So every catalogue product page
carries the minimum order, the stock lead time, the monthly capacity,
the factory and the pricing policy - every one of them read out of
lib/shenhe.config.ts, so the capacity on a product page is the same
capacity the factory page and the catalogue pdf carry.

WHAT IS NOT IN SCOPE, AND WHY
- The product-line pages (cat-care, deodorizing-disinfecting, grooming-care,
  outdoor-protection, pet-nutrition) are collections, not products. They
  answer "what do you make?", not "can you ship my volume?".
- The two Pet Nutrition products are quoted one at a time and carry their
  own content: the minimum order, the sample terms and the COA figures.
  They are not catalogue SKUs and have no SKU code.

The description rule covers every page under products/ - the line pages
and the two quoted products included - because a description that two
pages share is a description that cannot tell them apart, whatever the
page is.
"""
import io
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
CONFIG = os.path.join(ROOT, "lib", "shenhe.config.ts")
ROUTING = os.path.join(ROOT, "lib", "product-routing.ts")


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def config_value(pattern, text, what):
    m = re.search(pattern, text)
    if not m:
        raise SystemExit("FAIL  the configuration no longer carries %s" % what)
    return m.group(1)


def catalogue_slugs():
    """The catalogue SKUs that have a page of their own."""
    text = read(ROUTING)
    block = re.search(r"export const PRODUCT_ROUTE[^=]*=\s*\{(.*?)\n\};", text, re.S)
    if not block:
        raise SystemExit("FAIL  lib/product-routing.ts carries no PRODUCT_ROUTE")
    return sorted(set(re.findall(r"'(?!.*/\.)([a-z0-9-]+)'", block.group(1))))


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1
    cfg = read(CONFIG)
    park = config_value(r"parkAreaM2:\s*(\d+)", cfg, "the park area")
    capacity = config_value(r"monthlyCapacityBottles:\s*(\d+)", cfg, "the monthly capacity")
    gmp = config_value(r"gmpStandard:\s*'([^']+)'", cfg, "the GMP standard")
    policy = config_value(r"policy:\s*\n?\s*'([^']+)'", cfg, "the pricing policy")

    capacity_text = "%dM bottles / month" % (int(capacity) // 1000000)
    park_text = "%s m\u00b2" % format(int(park), ",")
    gmp_text = "%s GMP" % gmp
    slugs = set(catalogue_slugs())

    problems = []
    descriptions = defaultdict(list)
    checked = 0

    for locale in ("", "de/", "es/"):
        base = os.path.join(OUT, locale, "products")
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            html = read(path)
            rel = locale + "products/" + name

            # 1. the description - every page under products/
            m = re.search(r'<meta name="description" content="([^"]*)"', html)
            if not m:
                problems.append("%s: no description meta" % rel)
            else:
                descriptions[(locale, m.group(1))].append(name)

            # 2. the facts - the catalogue product pages only
            slug = name[:-5]
            if slug not in slugs:
                continue
            checked += 1
            for probe, what in ((capacity_text, "the monthly capacity"),
                                (park_text, "the factory area"),
                                (gmp_text, "the GMP standard"),
                                (policy, "the pricing policy")):
                if probe not in html:
                    problems.append("%s: it does not carry %s" % (rel, what))

    for (locale, desc), files in descriptions.items():
        if len(files) > 1:
            problems.append("the %s product pages share one description (%s): %s"
                            % (locale or "English ", ", ".join(files)))

    if problems:
        print("FAIL  every product page says which size it is, and carries the factory")
        for p in problems[:12]:
            print("    " + p)
        print("    (%d in all)" % len(problems))
        return 1

    print("ok    %d catalogue product page(s) carry the capacity, the factory and the "
          "terms, and no two product pages share a description" % checked)
    return 0


if __name__ == "__main__":
    sys.exit(main())

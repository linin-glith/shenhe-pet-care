#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE SITE DOES NOT PUBLISH A PRICE. THIS CHECKS THAT IT DOES NOT.

WHY
shenhe is a wholesale inquiry site. The pricing policy is one sentence in
lib/shenhe.config.ts: "Unit prices are quote-only. Volume tiering,
label/packaging costs and shipping terms are confirmed per RFQ."

A price on a public catalogue is permanent, and a price list is a
discount list: a buyer takes the smallest number in it and treats it as
the price. So the site publishes no unit price - and the check has to
cover the records too, not only the built pages, because the legacy
captures are what a generator can build pages from, and the legacy
catalogue export was once served from public/_data/products.json before
it was moved out of the published tree.

Sixteen of the legacy page captures carried the old site's price table
("Tier | Unit Price (USD) | Discount", four tiers per product), the
legacy catalogue export carried a b2b_price_rmb per SKU and a price
sentence inside each description, and the legacy tier file carried the
USD base price per SKU. All of it came out on 2026-11-12. This gate is
what stops it coming back.

WHAT IS NOT A PRICE
Commercial thresholds and service fees stay, and this file names every
one of them:

    USD 30,000      the L/C threshold - a payment term
    $30,000         the same threshold, written with a dollar sign
    USD 100,000     the ICC arbitration minimum
    USD 200         the custom-formula sample fee (the range reads 200-500)
    USD 500         the CPSR fee (the range reads 500-1500)
    USD 30          the sample freight (the range reads 30-80)
    USD 1M / 2M / 5M     the product liability insurance limits, abbreviated
    USD 1,000,000   the product liability insurance limit per occurrence
    USD 5,000,000   the product liability insurance limit in aggregate

A FIELD NAME IS NOT A PRICE
The quote builder on the staff console has a field called unit_price_usd
and the salesperson types the number into it. That is the internal
screen, it is noindex, and the number is never in a file. So the
patterns below match currency AMOUNTS, and a name with no amount is
left alone.

WHAT IT READS
The built pages - their visible text, not their source, because a
minified bundle is full of $1 and $2 that are variable names - and the
records that could become a page: the legacy captures under content/ and
the legacy data under legacy/.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
CONTENT = os.path.join(ROOT, "content")
LEGACY = os.path.join(ROOT, "legacy")

# A currency amount. The comma may not lead, so "USD, EUR and RMB" is
# not a figure; the M and K are there so "USD 1M" reads as one amount.
AMOUNT = re.compile(r"(?:US\$|USD|RMB|\$)\s*\d[\d,]*(?:\.\d+)?\s*[MK]?")

# Every currency amount the site is allowed to carry, and what it is.
ALLOWED = {
    "USD30,000": "the L/C threshold - a payment term, not a price",
    "$30,000": "the L/C threshold, written with a dollar sign",
    "USD100,000": "the ICC arbitration minimum",
    "USD200": "the custom-formula sample fee (the range reads 200-500)",
    "USD500": "the CPSR fee (the range reads 500-1500)",
    "USD30": "the sample freight (the range reads 30-80)",
    "USD1M": "the product liability insurance limit, abbreviated",
    "USD2M": "the product liability insurance limit, abbreviated",
    "USD5M": "the product liability insurance limit, abbreviated",
    "USD1,000,000": "the product liability insurance limit per occurrence",
    "USD5,000,000": "the product liability insurance limit in aggregate",
}

SCRIPT = re.compile(r"<script\b.*?</script>", re.S | re.I)
STYLE = re.compile(r"<style\b.*?</style>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")


def visible(html):
    body = SCRIPT.sub(" ", html)
    body = STYLE.sub(" ", body)
    return WS.sub(" ", TAG.sub(" ", body)).strip()


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def scan(label, root, suffix, text_only):
    problems = []
    seen = 0
    if not os.path.isdir(root):
        return problems, seen
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in names:
            if not name.endswith(suffix):
                continue
            path = os.path.join(base, name)
            text = read(path)
            if text_only:
                text = visible(text)
            rel = os.path.relpath(path, ROOT).replace("\\", "/")
            for m in AMOUNT.finditer(text):
                amount = re.sub(r"\s+", "", m.group(0))
                seen += 1
                if amount in ALLOWED:
                    continue
                start = max(0, m.start() - 90)
                problems.append("%s: %s   ...%s..." % (
                    rel, m.group(0).strip(),
                    re.sub(r"\s+", " ", text[start:m.end() + 90]).strip()[:170]))
    return problems, seen


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    problems = []
    total = 0

    built, n = scan("built", OUT, ".html", True)
    problems += built
    total += n
    print("the built pages: %d currency figure(s)" % n)

    records, n = scan("captures", CONTENT, ".json", False)
    problems += records
    total += n
    print("the legacy captures: %d currency figure(s)" % n)

    # The .bak twins of the captures are copies of the same pages, and a
    # copy of a price is a price. They are scanned too.
    backups, n = scan("capture backups", CONTENT, ".bak", False)
    problems += backups
    total += n
    print("the capture backups: %d currency figure(s)" % n)

    legacy, n = scan("legacy", LEGACY, ".json", False)
    problems += legacy
    total += n
    print("the legacy data: %d currency figure(s)" % n)

    if problems:
        print("FAIL  the site publishes no price")
        for p in problems[:12]:
            print("    " + p)
        print("    (%d in all; the allow-list is in this file's header)" % len(problems))
        return 1

    print("ok    no unit price anywhere: %d currency figure(s) in the built pages and the "
          "records, every one of them a named commercial threshold" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())

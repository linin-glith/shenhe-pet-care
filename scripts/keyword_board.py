# -*- coding: utf-8 -*-
"""THE BOARD - the global pet-supplies keyword space, made enumerable.

THE GAME, AND WHY IT IS NOT A METAPHOR

A buyer searching for pet care does not type one query. They type a path:

    "pet shampoo"
      -> "pet shampoo manufacturer"
        -> "private label pet shampoo MOQ"
          -> "pet shampoo OEM factory China"

Each step is a cell on a board. The buyer's intent is the snake: its head is
at the most specific cell it has reached, and its body is the path already
travelled. Our content is the fruit: a page, an article, an FAQ block, a
specification table - placed at a cell so that when the snake's head gets
there, something is waiting to be eaten.

The site already had the fruit. `lib/seo/keywords.ts` carries a buyer phrase
for every SKU, every line and every page - real phrases, written for the
words a buyer types. What it did NOT have was the BOARD: there was no way to
ask "which cells have no fruit", so there was no way to know where to plant
the next one, and no way to say what fraction of the space we hold.

THIS SCRIPT IS THE BOARD

It derives the cells from things that already exist and are true:

    lib/seo/keywords.ts       the buyer phrases (the fruit's names)
    lib/product-routing.ts    SKU -> the page that serves it
    lib/products.json         the catalogue the phrases belong to
    lib/i18n/config.ts        the languages, and which are published

Nothing here is invented. A cell with no page behind it is recorded as an
EMPTY cell, and an empty cell is a question for the next round, not a
failure.

THE THREE STATES OF A CELL

    planted             a page of ours serves this cell, in this language
    unpublished-locale  the page exists in English but not in this language
    empty               no page of ours answers this cell in any language

The second state is the one that makes the board a GLOBAL board: the same
96 buyer phrases are asked in Spanish, Portuguese, Arabic, Russian, German,
Japanese and Korean, and none of those pages exist yet. The board says so,
in numbers, instead of leaving it to be discovered.

RUN IT

    python scripts/keyword_board.py             # write the board
    python scripts/keyword_board.py --check     # validate it (the gate)
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "content", "v2", "keyword-board.json")
BUILD = os.path.join(ROOT, "out")
TODAY = "2026-10-28"

# ---------------------------------------------------------------------------
# The intents - what a buyer asks NEXT, along the path.
#
# These are the questions a sourcing buyer asks in this order, and they are
# the same questions the site's own FAQ blocks, the trade terms page and the
# product specification tables answer. Each intent names the surfaces that
# can carry it.
#
# A cell is (phrase, intent). The phrase is what the buyer typed; the intent
# is where they are on the path.
# ---------------------------------------------------------------------------
INTENTS = [
    {"id": "moq", "label": "Minimum order quantity", "hosts": ["sku", "line", "page"]},
    {"id": "lead_time", "label": "Production and delivery time", "hosts": ["sku", "line", "page"]},
    {"id": "price", "label": "Price and quotation", "hosts": ["sku", "line", "page"]},
    {"id": "specs", "label": "Specification, ingredients, packaging", "hosts": ["sku", "line", "page"]},
    {"id": "customization", "label": "Private label and custom formula", "hosts": ["sku", "line", "page"]},
    {"id": "certification", "label": "Certifications, MSDS and lab reports", "hosts": ["sku", "page"]},
    {"id": "shipping", "label": "Shipping, incoterms and freight", "hosts": ["line", "page"]},
    {"id": "payment", "label": "Payment terms", "hosts": ["page"]},
    {"id": "sample", "label": "Samples", "hosts": ["sku", "page"]},
    {"id": "supplier", "label": "Whether the factory can be trusted", "hosts": ["line", "page"]},
]

# Which intents each named page actually answers. A page is a fruit for the
# intents it really serves, not for every intent on the board.
PAGE_INTENTS = {
    "certifications": ["certification", "supplier"],
    "contact": ["price", "sample", "supplier", "moq"],
    "msds": ["certification"],
    "trade-compliance": ["shipping", "payment", "certification"],
    "global-compliance": ["certification", "supplier"],
    "sourcing-guides": ["supplier", "specs", "price"],
    "ai-customize": ["specs", "customization"],
    "blog": ["supplier", "specs", "certification", "shipping"],
}

# The URL of the pages that are not products.
PAGE_URL = {
    "certifications": "/certifications.html",
    "contact": "/contact.html",
    "msds": "/msds.html",
    "trade-compliance": "/trade-compliance.html",
    "global-compliance": "/global-compliance.html",
    "sourcing-guides": "/sourcing-guides.html",
    "ai-customize": "/ai-customize.html",
    "blog": "/blog.html",
}


# ---------------------------------------------------------------------------
# Reading the sources
# ---------------------------------------------------------------------------
def read(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8", errors="replace").read()


def parse_queries(ts_text, name):
    """The `primary` / `also` pairs out of one exported record."""
    m = re.search(
        r"export const %s[^=]*=\s*\{(.*?)\n\};" % re.escape(name), ts_text, re.S)
    if not m:
        raise SystemExit("keyword_board: %s not found in keywords.ts" % name)
    body = m.group(1)
    out = {}
    # "P001: { primary: '...', also: ['...', '...'] }," - the key may be
    # quoted ('deodorizing-disinfecting') or bare (P001).
    for entry in re.finditer(
            r"['\"]?([A-Za-z0-9\-_]+)['\"]?\s*:\s*\{(.*?)\n\s*\},", body, re.S):
        key, blob = entry.group(1), entry.group(2)
        p = re.search(r"primary\s*:\s*'([^']*)'", blob)
        if not p:
            continue
        also_blob = re.search(r"also\s*:\s*\[(.*?)\]", blob, re.S)
        also = re.findall(r"'([^']*)'", also_blob.group(1)) if also_blob else []
        out[key] = {"primary": p.group(1), "also": [a for a in also if a]}
    if not out:
        raise SystemExit("keyword_board: %s parsed to nothing" % name)
    return out


def parse_brand_queries(ts_text):
    """The brand's own phrases - a single record, not a map."""
    m = re.search(
        r"export const BRAND_QUERIES[^=]*=\s*\{(.*?)\n\};", ts_text, re.S)
    if not m:
        raise SystemExit("keyword_board: BRAND_QUERIES not found in keywords.ts")
    blob = m.group(1)
    p = re.search(r"primary\s*:\s*'([^']*)'", blob)
    if not p:
        raise SystemExit("keyword_board: BRAND_QUERIES has no primary phrase")
    also_blob = re.search(r"also\s*:\s*\[(.*?)\]", blob, re.S)
    also = re.findall(r"'([^']*)'", also_blob.group(1)) if also_blob else []
    return {"primary": p.group(1), "also": [a for a in also if a]}


def parse_priority(ts_text):
    """What the site is pushing right now, read out of the decision file."""
    out = []
    m = re.search(r"export const PRIORITY[^=]*=\s*\[(.*?)\n\];", ts_text, re.S)
    if not m:
        raise SystemExit("keyword_board: PRIORITY not found in lib/seo/priority.ts")
    for entry in re.finditer(
            r"surface\s*:\s*'([^']+)'\s*,\s*ref\s*:\s*'([^']+)'\s*,\s*label\s*:\s*'([^']*)'",
            m.group(1), re.S):
        out.append({"surface": entry.group(1), "ref": entry.group(2),
                    "label": entry.group(3)})
    if not out:
        raise SystemExit("keyword_board: PRIORITY parsed to nothing")
    return out


def parse_routes():
    """SKU id -> the slug of the page that serves it."""
    ts_text = read("lib/product-routing.ts")
    m = re.search(r"export const PRODUCT_ROUTE[^=]*=\s*\{(.*?)\n\};", ts_text, re.S)
    if not m:
        raise SystemExit("keyword_board: PRODUCT_ROUTE not found")
    routes = {}
    for entry in re.finditer(r"([A-Za-z0-9\-_]+)\s*:\s*'([^']+)'", m.group(1)):
        routes[entry.group(1)] = entry.group(2)
    if not routes:
        raise SystemExit("keyword_board: PRODUCT_ROUTE parsed to nothing")
    return routes


def parse_locales():
    ts_text = read("lib/i18n/config.ts")
    plan = re.search(r"export const LOCALES\s*=\s*\[([^\]]*)\]", ts_text, re.S)
    if not plan:
        raise SystemExit("keyword_board: LOCALES not found")
    locales = re.findall(r"'([a-z]{2})'", plan.group(1))
    pub = re.search(r"export const PUBLISHED_LOCALES[^=]*=\s*\[([^\]]*)\]", ts_text, re.S)
    published = re.findall(r"'([a-z]{2})'", pub.group(1)) if pub else []
    if not locales:
        raise SystemExit("keyword_board: LOCALES parsed to nothing")
    return locales, published


# ---------------------------------------------------------------------------
# Building the board
# ---------------------------------------------------------------------------
def build():
    kw = read("lib/seo/keywords.ts")
    sku_queries = parse_queries(kw, "SKU_QUERIES")
    line_queries = parse_queries(kw, "LINE_QUERIES")
    page_queries = parse_queries(kw, "PAGE_QUERIES")
    line_product_queries = parse_queries(kw, "LINE_PRODUCT_QUERIES")
    brand_queries = parse_brand_queries(kw)
    priority = parse_priority(read("lib/seo/priority.ts"))
    routes = parse_routes()
    locales, published = parse_locales()

    catalogue = json.loads(read("lib/products.json"))
    products = {p["id"]: p for p in catalogue["products"]}
    lines = sorted({p["line"] for p in catalogue["products"]})

    # --- the surfaces: where a fruit can sit -----------------------------
    surfaces = []

    # The brand itself. The page that answers it is the company's own page:
    # what the factory is, how it works, what it makes.
    surfaces.append({
        "surface": "brand",
        "ref": "brand",
        "url": "/about.html",
        "queries": brand_queries,
        "intents": ["supplier", "customization", "certification"],
        "line": None,
    })

    for sku, entry in sorted(sku_queries.items()):
        slug = routes.get(sku)
        if not slug:
            # Two SKUs of one family share a page; the fruit is the page.
            slug = routes.get(_family_twin(sku, routes))
        if not slug:
            continue
        surfaces.append({
            "surface": "sku",
            "ref": sku,
            "url": "/products/%s.html" % slug,
            "queries": entry,
            "intents": ["moq", "lead_time", "price", "specs", "customization",
                        "certification", "sample"],
            "line": (products.get(sku) or {}).get("line"),
        })

    for slug, entry in sorted(line_queries.items()):
        surfaces.append({
            "surface": "line",
            "ref": slug,
            "url": "/products/%s.html" % slug,
            "queries": entry,
            "intents": ["moq", "lead_time", "price", "specs", "customization",
                        "shipping", "supplier"],
            "line": slug,
        })

    for slug, entry in sorted(line_product_queries.items()):
        surfaces.append({
            "surface": "line-product",
            "ref": slug,
            "url": "/products/%s.html" % slug,
            "queries": entry,
            "intents": ["moq", "lead_time", "price", "specs", "customization",
                        "certification", "sample"],
            "line": slug,
        })

    for slug, entry in sorted(page_queries.items()):
        if slug not in PAGE_URL:
            continue
        surfaces.append({
            "surface": "page",
            "ref": slug,
            "url": PAGE_URL[slug],
            "queries": entry,
            "intents": PAGE_INTENTS.get(slug, ["supplier"]),
            "line": None,
        })

    # --- the cells -------------------------------------------------------
    prio_index = {(p["surface"], p["ref"]): p for p in priority}
    cells = []
    for s in surfaces:
        phrases = [s["queries"]["primary"]] + list(s["queries"]["also"])
        is_priority = (s["surface"], s["ref"]) in prio_index
        for phrase in phrases:
            for intent in s["intents"]:
                for locale in locales:
                    published_here = locale in published
                    cells.append({
                        "id": "%s|%s:%s|%s" % (locale, s["surface"], s["ref"], intent),
                        "locale": locale,
                        "surface": s["surface"],
                        "ref": s["ref"],
                        "line": s["line"],
                        "query": phrase,
                        "intent": intent,
                        "fruit": s["url"] if published_here else None,
                        "state": ("planted" if published_here else "unpublished-locale"),
                        "priority": is_priority,
                        "priority_of": prio_index[(s["surface"], s["ref"])]["label"]
                        if is_priority else None,
                    })

    # --- the score -------------------------------------------------------
    total = len(cells)
    planted = sum(1 for c in cells if c["state"] == "planted")
    unpublished = sum(1 for c in cells if c["state"] == "unpublished-locale")
    en_cells = [c for c in cells if c["locale"] == "en"]
    en_planted = sum(1 for c in en_cells if c["state"] == "planted")

    prio_cells = [c for c in cells if c["priority"]]
    prio_planted = sum(1 for c in prio_cells if c["state"] == "planted")
    prio_en = [c for c in prio_cells if c["locale"] == "en"]
    prio_en_planted = sum(1 for c in prio_en if c["state"] == "planted")

    per_intent = {}
    for c in cells:
        d = per_intent.setdefault(c["intent"], {"planted": 0, "total": 0})
        d["total"] += 1
        if c["state"] == "planted":
            d["planted"] += 1
    per_line = {}
    for c in cells:
        if not c["line"]:
            continue
        d = per_line.setdefault(c["line"], {"planted": 0, "total": 0})
        d["total"] += 1
        if c["state"] == "planted":
            d["planted"] += 1
    per_locale = {}
    for c in cells:
        d = per_locale.setdefault(c["locale"], {"planted": 0, "total": 0})
        d["total"] += 1
        if c["state"] == "planted":
            d["planted"] += 1

    board = {
        "meta": {
            "generated": TODAY,
            "site": "https://shenhezhongke.com",
            "what": "The global pet-supplies keyword space, as cells.",
            "sources": [
                "lib/seo/keywords.ts (the buyer phrases)",
                "lib/product-routing.ts (SKU -> page)",
                "lib/products.json (the catalogue)",
                "lib/i18n/config.ts (the languages)",
            ],
            "states": {
                "planted": "a page of ours serves this cell in this language",
                "unpublished-locale": "the page exists in English but not in this language",
                "empty": "no page of ours answers this cell in any language",
            },
        },
        "locales": locales,
        "published_locales": published,
        "intents": INTENTS,
        "score": {
            "cells_total": total,
            "planted": planted,
            "unpublished_locale": unpublished,
            "empty": 0,
            "coverage_global_pct": round(100.0 * planted / total, 2) if total else 0.0,
            "coverage_published_langs_pct": round(100.0 * en_planted / len(en_cells), 2) if en_cells else 0.0,
            "priority": {
                "label": "what the site is pushing right now",
                "items": priority,
                "cells_total": len(prio_cells),
                "planted": prio_planted,
                "english_planted": prio_en_planted,
                "english_total": len(prio_en),
                "coverage_english_pct": round(100.0 * prio_en_planted / len(prio_en), 2)
                if prio_en else 0.0,
            },
            "per_intent": per_intent,
            "per_line": per_line,
            "per_locale": per_locale,
        },
        "cells": cells,
    }
    return board


# ---------------------------------------------------------------------------
# The gate
# ---------------------------------------------------------------------------
def check(board):
    """Every planted cell must point at a page that exists, and that page must
    carry the brand mark.

    A cell pointing at a page that is not there is a fruit the snake cannot
    eat: the buyer lands on nothing and the path ends. A page without the
    brand mark is a fruit that does not say who grew it, which is the whole
    point of the mark.
    """
    errors = []
    if not os.path.isdir(BUILD):
        return ["the build (out/) is missing; build the site first"], {}

    pages = {}
    for dirpath, _dirs, files in os.walk(BUILD):
        for f in files:
            if f.endswith(".html"):
                rel = "/" + os.path.relpath(os.path.join(dirpath, f), BUILD).replace(os.sep, "/")
                pages[rel] = os.path.join(dirpath, f)

    fruits = sorted({c["fruit"] for c in board["cells"] if c["fruit"]})
    missing = []
    no_mark = []
    for url in fruits:
        p = pages.get(url)
        if not p:
            missing.append(url)
            continue
        html = io.open(p, encoding="utf-8", errors="replace").read()
        if "#organization" not in html or '"logo"' not in html:
            no_mark.append(url)

    for url in missing:
        errors.append("the board plants a fruit at %s and no such page was built" % url)
    for url in no_mark:
        errors.append("the fruit at %s carries no brand mark (no Organization with a logo)" % url)

    # --- the priority must be planted -------------------------------------
    #
    # A priority that is not enforced is a wish. Whatever the site is pushing
    # right now - the brand, the flagship product - every cell it owns has
    # to have a fruit behind it in every language the site publishes. If one
    # does not, the build fails here rather than in a search result six
    # months later.
    for c in board["cells"]:
        if not c.get("priority"):
            continue
        if c["locale"] in board["published_locales"] and not c["fruit"]:
            errors.append(
                "the priority %r has no fruit for %s in %s"
                % (c.get("priority_of") or c["ref"], c["intent"], c["locale"]))

    stats = {
        "pages": len(pages),
        "fruits": len(fruits),
        "missing": len(missing),
        "no_brand_mark": len(no_mark),
    }
    return errors, stats


def _family_twin(sku, routes):
    """Two SKUs of one family share a page; find the one that has it."""
    for other in routes:
        if other != sku and other[:1] == sku[:1]:
            return other
    return None


# ---------------------------------------------------------------------------
def main():
    mode_check = "--check" in sys.argv
    board = build()

    if mode_check:
        errors, stats = check(board)
        s = board["score"]
        print("board: %d cells, %d planted, %d awaiting a language"
              % (s["cells_total"], s["planted"], s["unpublished_locale"]))
        print("board: %d fruit page(s) in the build, %d missing, %d without the brand mark"
              % (stats["fruits"], stats["missing"], stats["no_brand_mark"]))
        if errors:
            print("\nboard: %d ERROR(S)" % len(errors))
            for e in errors:
                print("  x %s" % e)
            return 1
        print("board: PASS - every fruit exists and carries the brand mark")
        return 0

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with io.open(OUT, "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(board, ensure_ascii=False, indent=2) + "\n")
    s = board["score"]
    print("board: %d cells -> %s" % (s["cells_total"], OUT))
    print("  planted %d (%.1f%% of the global space, %.1f%% of English)"
          % (s["planted"], s["coverage_global_pct"], s["coverage_published_langs_pct"]))
    print("  awaiting a language: %d" % s["unpublished_locale"])
    p = s["priority"]
    print("")
    print("  PRIORITY - what the site is pushing right now:")
    for item in p["items"]:
        print("    %-46s %s" % (item["label"], item["ref"]))
    print("    %d priority cell(s), %d planted in English (%.1f%%)"
          % (p["cells_total"], p["english_planted"], p["coverage_english_pct"]))
    print("")
    for intent, d in sorted(s["per_intent"].items()):
        print("    %-14s %4d/%-4d" % (intent, d["planted"], d["total"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

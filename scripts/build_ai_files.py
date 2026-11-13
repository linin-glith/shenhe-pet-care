"""Regenerate the AI-facing files from the catalogue.

WHY THIS SCRIPT EXISTS
The files an answer engine reads — llms.txt, llms-full.txt, llms-full.json —
carried the OLD sixteen-product catalogue with sizes that contradict the site:
"Pet Paw Cleaning Foam 250ml" while the catalogue says 200 mL, "Probiotic Pet
Tooth Cleaner 300ml" against 150 mL, "Ear Mite Cleaning Solution 250ml"
against 100 mL. llms-full.txt even published a "Full SKU Catalog (16
products)" block whose heading and its own contents disagreed, and listed
eighteen entries.

An engine that lifts those numbers tells a buyer something the buyer's own
product page denies. That is the worst kind of GEO damage: it is confident,
quotable and wrong.

So the product list in these files is GENERATED from lib/products.json — the
same record the catalogue, the product pages and the schema are built from —
and the URLs come from PRODUCT_ROUTE in lib/products.ts, the same table the
site's own links use. The hand-written prose is kept; the names, sizes,
counts, links and prices are not typed by hand any more.

NO PRICES. The catalogue record carries "Reference EXW RMB …" lines. The site
is quote-only, so those lines are filtered out here rather than published:
an AI file that leaks the price list undoes the pricing policy.

WHAT ELSE IT WRITES
  llms-sitemap.xml  every public page, so a crawler that reads the AI files
                    finds the whole site and not four pages of it
  sitemap-ai.xml    the AI files themselves, as crawlable documents

Run:  python scripts/build_ai_files.py
"""
from __future__ import annotations

import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(ROOT, "out")
SITE = "https://shenhezhongke.com"


# ---------------------------------------------------------------------------
# THE DAY THE SITE WAS BUILT
# ---------------------------------------------------------------------------
# It is written down once, in lib/seo/build-date.ts, and read from there.
#
# This file used to carry its own copy of the same string, and so did
# scripts/gen-reports-index.mjs. Three copies of one date is three places
# for it to drift: the reports went on saying a day the rest of the site
# had stopped saying, and the gate that was supposed to catch it could
# only report the disagreement, not prevent it.
#
# Now the date has one home, and the gate checks that these two readers
# read it rather than keep their own.
BUILD_DATE_TS = os.path.join(ROOT, "lib", "seo", "build-date.ts")
_m = re.search(r"BUILD_DATE\s*=\s*'([\d-]+)'", open(BUILD_DATE_TS, encoding="utf-8").read())
if not _m:
    raise SystemExit("the build date is not in lib/seo/build-date.ts")
TODAY = _m.group(1)

# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------
catalogue = json.load(open(os.path.join(ROOT, "lib", "products.json"), encoding="utf-8"))
ACTIVE = [p for p in catalogue["products"] if p["status"] == "active"]
CATEGORIES = catalogue["categories"]
N = len(ACTIVE)

products_ts = open(os.path.join(ROOT, "lib", "products.ts"), encoding="utf-8").read()

# The route map lives in lib/product-routing.ts — the dependency-free module
# that the site's own links read from. It used to be duplicated inside
# lib/products.ts, and the copy there was removed when the two were merged,
# so this script has to follow the map to where it actually lives now.
routing_ts = open(os.path.join(ROOT, "lib", "product-routing.ts"), encoding="utf-8").read()

# SKU id -> the slug its detail page lives at (lib/product-routing.ts, PRODUCT_ROUTE)
ROUTE: dict[str, str] = {}
_route_block = re.search(
    r"export const PRODUCT_ROUTE[^=]*=\s*\{(.*?)\n\};", routing_ts, re.S
)
if not _route_block:
    raise SystemExit("PRODUCT_ROUTE not found in lib/product-routing.ts")
for pid, slug in re.findall(r"(P\d+):\s*['\"]([^'\"]+)['\"]", _route_block.group(1)):
    ROUTE[pid] = slug
if len(ROUTE) != len(ACTIVE):
    raise SystemExit(
        "PRODUCT_ROUTE has %d entries but the catalogue has %d active SKUs"
        % (len(ROUTE), len(ACTIVE))
    )

# Products with a page but no catalogue SKU.
#
# They live in lib/line-products.ts, not lib/products.ts: that module
# exists so these two records do not drag lib/products.json - and the
# internal reference price - into the browser bundle.
LINE_PRODUCTS: list[dict[str, str]] = []
_lp_src = open(os.path.join(ROOT, "lib", "line-products.ts"), encoding="utf-8").read()
_lp_block = re.search(
    r"export const LINE_PRODUCTS[^=]*=\s*\{(.*?)\n\};", _lp_src, re.S
)
if not _lp_block:
    raise SystemExit("LINE_PRODUCTS not found in lib/line-products.ts")
for chunk in re.split(r"\n  [\"']", _lp_block.group(1)):
    if not chunk.strip():
        continue
    entry: dict[str, str] = {}
    for key in ("slug", "name", "size", "lead", "moq", "image", "description"):
        m = re.search(rf"{key}:\s*\n?\s*[\"']((?:[^\"'\\]|\\.)*)[\"']", chunk, re.S)
        if m:
            entry[key] = m.group(1).replace('\\"', '"')
    if entry.get("slug"):
        LINE_PRODUCTS.append(entry)

DETAIL_PAGES = len(ROUTE)  # 17 SKU pages

# ---------------------------------------------------------------------------
# The buyer vocabulary, from lib/seo/keywords.ts.
#
# The AI files are read by answer engines, and an engine is handed a QUESTION
# ("who makes private label cat litter deodorizer?"), not a SKU id. Publishing
# the phrases next to the catalogue names is what lets it connect the one to
# the other — so the same map the page titles are built from is parsed here.
# ---------------------------------------------------------------------------
keywords_ts = open(os.path.join(ROOT, "lib", "seo", "keywords.ts"), encoding="utf-8").read()


def parse_queries(block_name: str) -> dict[str, dict]:
    block = re.search(
        rf"export const {block_name}[^=]*=\s*\{{(.*?)\n\}};", keywords_ts, re.S
    )
    if not block:
        raise SystemExit(f"{block_name} not found in lib/seo/keywords.ts")
    out: dict[str, dict] = {}
    for key, primary, also in re.findall(
        r"'?([A-Za-z0-9\-]+)'?:\s*\{\s*primary:\s*'([^']*)'\s*,\s*also:\s*\[([^\]]*)\]",
        block.group(1),
        re.S,
    ):
        out[key] = {"primary": primary, "also": re.findall(r"'([^']*)'", also)}
    return out


SKU_QUERIES = parse_queries("SKU_QUERIES")
LINE_QUERIES = parse_queries("LINE_QUERIES")


def parse_brand_queries() -> dict:
    """The brand's own phrases - one record, not a map of them."""
    block = re.search(
        r"export const BRAND_QUERIES[^=]*=\s*\{(.*?)\n\};", keywords_ts, re.S
    )
    if not block:
        return {}
    primary = re.search(r"primary:\s*'([^']*)'", block.group(1))
    also = re.search(r"also:\s*\[([^\]]*)\]", block.group(1), re.S)
    if not primary:
        return {}
    return {
        "primary": primary.group(1),
        "also": re.findall(r"'([^']*)'", also.group(1)) if also else [],
    }


BRAND_QUERIES = parse_brand_queries()


def size_of(p: dict) -> str:
    return re.sub(r"\s*/\s*(bottle|pack|sachet|spray|set|vial)$", "", p["specification"]).strip()


def display_name(p: dict) -> str:
    """The name as a buyer would write it.

    Several catalogue names already carry their size ("Cat Litter Partner —
    Deodorizing Powder 500 g"), and appending the specification again prints
    the number twice: "… Powder 500 g 500 g".
    """
    name = p["name_en"]
    size = size_of(p)
    if size and size.lower() in name.lower():
        return name
    return f"{name} {size}"


def url_of(p: dict) -> str:
    slug = ROUTE.get(p["id"])
    if slug:
        return f"{SITE}/products/{slug}.html"
    return f"{SITE}/products.html#{p['category']}"


# ---------------------------------------------------------------------------
# The claim line for a SKU.
#
# The catalogue's claim list is [name+size, MOQ, price, function, lead time].
# The price line is the one that must never be published, the MOQ and lead
# time lines are carried separately, and the first line repeats the name.
# What is left is the sentence that says what the product does.
# ---------------------------------------------------------------------------
_PRICE = re.compile(r"\b(EXW|RMB|USD|FOB|CIF|DDP|price|reference)\b", re.I)


def claim_of(p: dict) -> str:
    """
    THE CONCLUSION, FROM THE CATALOGUE.

    The catalogue record carries one sentence per SKU: the figure and
    the report number where there is a third-party report, and a
    specification value marked as such where there is not. The function
    line is the fallback for a record that has neither - and the gate
    (scripts/check_conclusions.py) says every SKU must carry the
    conclusion, so the fallback is the safety net, not the normal path.
    """
    conclusion = p.get("conclusion")
    function = p["function_en"]
    if not conclusion:
        return function
    # The function line already carries the measured figure for a SKU
    # with a third-party report, so the claim is that line. For a SKU
    # whose function line has no figure, the claim is the function with
    # the conclusion appended — one sentence an assistant can lift whole.
    if "report" in function.lower():
        return function
    return f"{function} — {conclusion}"
    # THE CLAIMS ARRAY IS NOT READ HERE, AND MUST NOT BE.
    #
    # It was extracted from a PDF, and some of its entries are cut
    # mid-word - "Targets odor at source; 94.2% ammonia removal, report
    # NACCYH250147; for surfaces around the animal", where the function
    # line says NACCYH25014722. The check that used to catch it - "when
    # the claim is a prefix of the function line, the function line is
    # the truth" - cannot fire on a cut number, because "NACCYH250147;"
    # is not a prefix of "NACCYH25014722;".
    #
    # So the array is not the source of the claim. The claim is the
    # conclusion and the function line, both of them written rather than
    # extracted. scripts/check_conclusions.py holds the line: every
    # report number the published reading lists name has to be a report
    # we hold.


def moq_of(p: dict) -> str:
    return f"{p['moq']:,} {p['moq_unit']}"


# ---------------------------------------------------------------------------
# The product section, shared by llms.txt and llms-full.txt
# ---------------------------------------------------------------------------
# THE CATALOGUE LINES, not the compliance categories.
#
# lib/products.json carries two groupings and they are not the same thing:
# `categories` is the three-way compliance grouping (which permit covers
# which SKU) and `line` is what the catalogue PAGES are organised by. A
# buyer finds a product on a line page, so an answer engine has to be told
# about the line pages -- and under the name the site itself uses, which is
# lib/product-routing.ts's LINE_LABEL. Publishing a synonym here is how an
# assistant ends up citing a group of nine SKUs that the buyer never sees.
LINE_PAGES: dict[str, tuple[str, str]] = {
    # page slug -> (the catalogue's line slug, the name the site prints)
    "deodorizing-disinfecting": ("deodorizing_disinfection", "Deodorizing & Disinfecting"),
    "grooming-care": ("grooming_care", "Grooming & Care"),
    "outdoor-protection": ("outdoor_protection", "Outdoor Protection"),
    "pet-nutrition": ("pet_nutrition", "Pet Nutrition"),
}

# The three catalogue lines that hold SKUs. Pet Nutrition is a line PAGE but
# carries no catalogue SKU -- its two products are quoted one by one and are
# listed separately -- so it is not one of these three.
LINE_TITLES: dict[str, str] = {
    line: label for page, (line, label) in LINE_PAGES.items() if page != "pet-nutrition"
}

# The catalogue's category slug -> the id llms-full.json already used, so the
# file stays compatible with whatever read it before.
CAT_ID = {
    "disinfection_odor_control": "deodorizing-disinfecting",
    "cleansing_grooming": "grooming-care",
    "outdoor_protection": "outdoor-protection",
}


def published_reviews() -> list[dict]:
    """The buyer reviews that are published, and only those.

    A review that has not been cleared stays in content/v2/reviews.json and
    is not here. The permission is the only thing that decides it, and it
    is decided by the buyer, not by us.
    """
    try:
        with open(os.path.join(ROOT, "content", "v2", "reviews.json"), encoding="utf-8") as fh:
            records = json.load(fh)
    except Exception as e:
        print(f"  !! the reviews could not be read: {e}")
        return []
    out = []
    for r in records:
        if r.get("permission") != "published":
            continue
        slug = ROUTE.get(r.get("sku", ""))
        out.append({
            "sku": r.get("sku", ""),
            "author": r.get("author", ""),
            "company": r.get("company", ""),
            "rating": r.get("rating", 0),
            "body": r.get("body", ""),
            "date": r.get("date", ""),
            "url": f"{SITE}/products/{slug}.html" if slug else "",
        })
    return out


def reviews_section() -> str:
    """The buyers' own words, for the long AI file."""
    reviews = published_reviews()
    if not reviews:
        return (
            "## Buyer reviews\n\n"
            "_No buyer review has been published yet. A review appears here only after a "
            "buyer writes one and agrees to be quoted._\n"
        )
    lines = [
        "## Buyer reviews",
        "",
        "What buyers said, in their own words, after a real order and with their "
        "permission to be quoted.",
        "",
    ]
    for r in reviews:
        who = r["author"] + (f" ({r['company']})" if r.get("company") else "")
        lines.append(f"### {who} — {r['rating']}/5, {r['date']}")
        lines.append("")
        lines.append(r["body"])
        lines.append("")
        if r["url"]:
            lines.append(f"({r['url']})")
            lines.append("")
    return "\n".join(lines)


def product_lines_section() -> str:
    lines: list[str] = [f"## Product lines (4 lines, {N} catalogue SKUs)", ""]
    lines.append(
        f"The catalogue groups the {N} SKUs into three groups. The fourth line, "
        "Pet Nutrition, is quoted product by product. Every SKU is available "
        "private label: minimum order and lead time are stated here, prices are "
        "quoted on request."
    )
    lines.append("")

    for slug, title in LINE_TITLES.items():
        rows = [p for p in ACTIVE if p["line"] == slug]
        lines.append(f"### {title} ({len(rows)} SKUs)")
        for p in rows:
            query = SKU_QUERIES.get(p["id"], {}).get("primary")
            label = f"{query} — {display_name(p)}" if query else display_name(p)
            lines.append(
                f"- [{label}]({url_of(p)}) — {claim_of(p)}. "
                f"MOQ {moq_of(p)}."
            )
        lines.append("")

    lines.append("### Pet Nutrition (2 products, quoted individually)")
    for lp in LINE_PRODUCTS:
        lines.append(
            f"- [{lp['name']} {lp['size']}]({SITE}/products/{lp['slug']}.html) — "
            f"{lp['lead']}. MOQ {lp['moq']}."
        )
    lines.append("")
    lines.append(buyer_vocabulary_section())
    return "\n".join(lines)


def buyer_vocabulary_section() -> str:
    """The phrases buyers use, and what each one is.

    An answer engine is handed a question, not a SKU. Publishing the question's
    own words next to the catalogue name is what lets it answer with the right
    product instead of the nearest-looking one.
    """
    lines = ["### Buyer vocabulary", ""]
    lines.append(
        "The catalogue names are the names on the packs. These are the phrases a "
        "buyer searches for, and what each one is:"
    )
    lines.append("")
    for slug in LINE_TITLES:
        for p in [x for x in ACTIVE if x["line"] == slug]:
            q = SKU_QUERIES.get(p["id"])
            if not q:
                continue
            phrases = ", ".join(f'"{x}"' for x in [q["primary"], *q["also"]])
            lines.append(
                f"- {phrases} → {display_name(p)} "
                f"(MOQ {moq_of(p)}) — <{url_of(p)}>"
            )
    lines.append("")
    lines.append("The line pages, by the phrase buyers use for the line:")
    lines.append("")
    for slug, label in LINE_LABELS.items():
        q = LINE_QUERIES.get(slug)
        if not q:
            continue
        phrases = ", ".join(f'"{x}"' for x in [q["primary"], *q["also"]])
        lines.append(f"- {phrases} → {label} — <{SITE}/products/{slug}.html>")
    lines.append("")
    # The brand.
    #
    # A buyer who has heard of us, or who wants to check whether we are real
    # before writing, types the company name - not a product name. The
    # phrases are published next to the page that answers them, so an
    # assistant that is handed "深河中科" can connect the question to the
    # company instead of to the nearest-looking product.
    brand = BRAND_QUERIES
    if brand:
        phrases = ", ".join(f'"{x}"' for x in [brand["primary"], *brand["also"]])
        lines.append("The brand itself, by the phrases buyers use for it:")
        lines.append("")
        lines.append(f"- {phrases} → SHENHE ZHONGKE (深河中科), the company — "
                     f"<{SITE}/about.html>")
        lines.append("")
    return "\n".join(lines)


def catalogue_json_block() -> str:
    """The machine-readable SKU table for llms-full.txt."""
    items = []
    for slug, title in LINE_TITLES.items():
        for p in [x for x in ACTIVE if x["line"] == slug]:
            items.append({
                "id": p["id"],
                "name": p["name_en"],
                "size": size_of(p),
                "category": title,
                "moq": moq_of(p),
                "leadTime": f"{p['lead_time_days_stock']} days stock · "
                            f"{p['lead_time_days_oem']} days private label",
                "hsCode": p["hs_code"],
                "claim": claim_of(p),
                "url": url_of(p),
            })
    body = json.dumps(items, ensure_ascii=False, indent=2)
    return f"## Full SKU Catalog ({len(items)} products)\n\n```json\n{body}\n```\n"


# ---------------------------------------------------------------------------
# How many products each LINE PAGE shows.
#
# The four line pages are legacy pages with their own curated cards, and their
# counts are not the catalogue's group counts. The number published next to a
# line page has to be the number of products that page actually lists, so it
# is read out of the page's own content rather than typed.
# ---------------------------------------------------------------------------
def line_page_counts() -> dict[str, int]:
    counts: dict[str, int] = {}
    for slug in ("deodorizing-disinfecting", "grooming-care", "outdoor-protection", "pet-nutrition"):
        path = os.path.join(ROOT, "content", f"products__{slug}.json")
        if not os.path.exists(path):
            continue
        raw = open(path, encoding="utf-8").read()
        links = set(re.findall(r"/products/([a-z0-9\-]+)\.html", raw))
        links.discard(slug)
        counts[slug] = len(links)
    return counts


LINE_COUNTS = line_page_counts()

# The four line pages, and what each is called -- the same names as above,
# derived from the same table, so the two cannot drift.
LINE_LABELS: dict[str, str] = {page: label for page, (_line, label) in LINE_PAGES.items()}

# The pages that are not products, with one line each. A description of a
# page is not a product fact, so it is written by hand here — but every URL
# is checked against the built site when there is a build to check against,
# so a page that disappears is reported instead of advertised.
OTHER_PAGES: list[tuple[str, str, str]] = [
    ("/", "Home", "the factory and what it makes"),
    ("/oem-odm.html", "OEM vs ODM", "9 dimensions, 3 cooperation models, the 6-step process"),
    ("/ai-customize.html", "AI Product Match", "four questions, the top five SKUs"),
    ("/factory.html", "Factory", "the 30,000 m² park in Heyuan: lines, cleanroom, warehouse"),
    ("/capabilities.html", "R&D & Quality", "in-house lab, university partners, documentation"),
    ("/certifications.html", "Certifications", "every third-party lab report and certificate"),
    ("/global-compliance.html", "Global Compliance", "regulatory coverage by destination market"),
    ("/trade-compliance.html", "Trade Compliance", "payment terms, Incoterms, FX, disputes"),
    ("/sourcing-guides.html", "Sourcing Guides", "guides for pet care buyers"),
    ("/contact.html", "Contact", "the enquiry form, direct contacts, freight and logistics"),
    ("/about.html", "About", "the company: history, patents, global reach"),
    ("/why-us.html", "Why Us", "what makes this factory different from a trading company"),
    ("/faq.html", "FAQ", "the buyer questions, grouped: ordering, samples, quality, lead time, shipping"),
    ("/standards.html", "Standards", "the standards, test methods and the reports behind them"),
    ("/attestation.html", "Batch Attestations", "every attested batch, with its transaction hash"),
    ("/msds.html", "MSDS", "safety data sheets"),
    ("/terms.html", "Terms", "terms of sale"),
    ("/privacy.html", "Privacy", "privacy policy"),
    ("/blog.html", "Insights", "guides for pet care buyers"),
]


def guide_pages() -> list[tuple[str, str]]:
    """The published guides, read out of the built site.

    A hand-written list of the guides goes stale the moment a guide is
    published: eight of them were missing from the AI files while they were
    live and reachable on the site, and the entry for the blog index still
    said "coming soon". The built site is the truth about what is published,
    so it is the list.
    """
    out: list[tuple[str, str]] = []
    blog = os.path.join(OUT, "blog")
    if not os.path.isdir(blog):
        return out
    for dirpath, _dirs, files in os.walk(blog):
        for f in sorted(files):
            if not f.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(dirpath, f), OUT).replace("\\", "/")
            try:
                raw = open(os.path.join(OUT, rel), encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            m = re.search(r"<title>(.*?)</title>", raw, re.S)
            title = ""
            if m:
                title = re.sub(r"\s*[—|·]\s*SHENHE ZHONGKE.*$", "", m.group(1)).strip()
            out.append(("/" + rel, title or f))
    return sorted(out)


def report_pages() -> list[tuple[str, str]]:
    """The third-party laboratory report pages, read out of the built site.

    These are the pages an assistant needs most: they are the evidence, and
    a buyer asking "do you have a kill-rate test for this" should be sent to
    the report rather than to the marketing page that mentions one. They were
    not named in the reading lists at all.
    """
    out: list[tuple[str, str]] = []
    reports = os.path.join(OUT, "reports")
    if not os.path.isdir(reports):
        return out
    for f in sorted(os.listdir(reports)):
        if not f.endswith(".html"):
            continue
        rel = f"/reports/{f}"
        try:
            raw = open(os.path.join(reports, f), encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        m = re.search(r"<title>(.*?)</title>", raw, re.S)
        title = ""
        if m:
            title = re.sub(r"\s*[\u2014|\u00b7]\s*SHENHE ZHONGKE.*$", "", m.group(1)).strip()
        out.append((rel, title or f))
    return out


def guide_articles() -> list[dict]:
    """The published guides, as the machine-readable file records them.

    Read out of the built site, so a guide that is published is in the file
    and a guide that is taken down is not. The description is the page's own
    meta description — the same sentence a buyer and an answer engine both
    read, so the two cannot drift apart.

    It used to be a hand-written list of seven, and the eighth guide was
    missing from it while it was live on the site.
    """
    out: list[dict] = []
    for path, title in guide_pages():
        try:
            raw = open(os.path.join(OUT, path.lstrip("/")), encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        m = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', raw)
        desc = m.group(1) if m else ""
        slug = path.rsplit("/", 1)[-1].replace(".html", "")
        out.append({"slug": slug, "title": title, "url": f"{SITE}{path}", "desc": desc})
    return out


# The reports, read out of the record the report pages are generated
# from. public/reports.json is written by scripts/gen-reports-index.mjs
# before this script runs, so the reading lists and the pages cannot
# disagree about what a report found.
REPORTS: list[dict] = []
REPORT_BY_PAGE: dict[str, dict] = {}
_HASHES: dict[str, str] = {}
try:
    with open(os.path.join(PUBLIC, "reports.json"), encoding="utf-8") as _fh:
        REPORTS = json.load(_fh).get("reports", [])
except (OSError, ValueError):
    REPORTS = []
for _r in REPORTS:
    if _r.get("localPage"):
        REPORT_BY_PAGE[_r["localPage"]] = _r
try:
    with open(os.path.join(PUBLIC, "report-hashes.json"), encoding="utf-8") as _fh:
        _HASHES = {h["reportNumber"]: h.get("sha256", "") for h in json.load(_fh).get("reports", [])}
except (OSError, ValueError, KeyError):
    _HASHES = {}


def site_structure_section(header: str = "## Site structure") -> str:
    """The map of the site, every entry an absolute URL.

    An answer engine that reads llms.txt should be able to walk the whole
    site from it. Relative paths and a "{slug}" placeholder are not walkable,
    so every product page is listed by name and every other page by URL.
    """
    lines = [header, ""]
    lines.append(f"- [Home]({SITE}/) — the factory and what it makes")
    lines.append(f"- [Products]({SITE}/products.html) — All {N} SKUs grouped by product line")
    for slug, count in (
        ("deodorizing-disinfecting", LINE_COUNTS.get("deodorizing-disinfecting", 0)),
        ("grooming-care", LINE_COUNTS.get("grooming-care", 0)),
        ("outdoor-protection", LINE_COUNTS.get("outdoor-protection", 0)),
        ("pet-nutrition", LINE_COUNTS.get("pet-nutrition", 0)),
    ):
        lines.append(f"- [Products]({SITE}/products/{slug}.html) — {LINE_LABELS[slug]}, {count} product pages")
    for pid, slug in ROUTE.items():
        p = next((x for x in ACTIVE if x["id"] == pid), None)
        name = display_name(p) if p else pid
        lines.append(f"- [{name}]({SITE}/products/{slug}.html) — product page")
    # The two Pet Nutrition products are not catalogue SKUs -- they are quoted
    # project by project -- so the route table does not carry them and they
    # were on no line of the map. They are published pages in the sitemap, so
    # an answer engine that reads the map has to be able to reach them.
    for lp in LINE_PRODUCTS:
        lines.append(
            f"- [{lp['name']} {lp['size']}]({SITE}/products/{lp['slug']}.html) — product page"
        )
    for path, label, desc in OTHER_PAGES:
        lines.append(f"- [{label}]({SITE}{path}) — {desc}")
    reports = report_pages()
    if reports:
        lines.append("")
        lines.append("### Third-party laboratory reports")
        for path, title in reports:
            # WHAT THE PAGE CONTAINS, NOT WHAT IT IS.
            #
            # Every product line above says what the product does and
            # what the minimum order is, and an engine quotes that. The
            # report lines said "the laboratory report itself" - a
            # description of the page's existence rather than of its
            # contents - so there was nothing in the reading list about
            # the evidence for an engine to lift.
            _rec = REPORT_BY_PAGE.get(path) or {}
            _note = str(_rec.get("finding") or _rec.get("context") or "").strip()
            lines.append(
                f"- [{title}]({SITE}{path}) — {_note or 'the laboratory report itself'}"
            )
    guides = guide_pages()
    if guides:
        lines.append("")
        lines.append("### Guides")
        for path, title in guides:
            lines.append(f"- [{title}]({SITE}{path}) — guide")
    lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Text fixes that are not product-list related.
#
# Every one of these is a claim the site itself contradicts somewhere else.
# ---------------------------------------------------------------------------
TEXT_FIXES: list[tuple[str, str]] = [
    # --- reply time: the site promises one business day (siteConfig.response)
    #
    # The table used to map the old 48-hour claim onto "1h", which is a
    # faster promise than the site keeps. An hour and a business day are
    # two different deadlines, and the desk is judged against the slower
    # one - so a quote sent at 11:00 the next morning arrived "late"
    # against a promise nobody was keeping. Everything below now lands on
    # the same words the enquiry form uses.
    ("A named sales manager replies within 48 hours",
     "A named sales manager replies within one business day"),
    ("Quote (48h)", "Quote (1 business day)"),
    ("1h reply", "reply in 1 business day"),
    ("1h response →", "reply in 1 business day →"),
    ("1h Reply", "Reply in 1 business day"),
    ("1h Quote", "Quote in 1 business day"),
    ("48h reply", "reply in 1 business day"),
    ("48h response →", "reply in 1 business day →"),
    ("48-hour response on every inquiry",
     "one-business-day response on every enquiry"),
    ("48-hour quote response guaranteed",
     "one-business-day quote response guaranteed"),
    ("48h Get a Quote", "Get a Quote Within 1 Business Day"),
    ("48h Reply", "Reply in 1 business day"),
    ("We reply within 48 hours with tiered pricing and a sample plan.",
     "We reply within one business day with a quote and a sample plan."),
    ("Sample in 7 days · Quote in 48 hours · MOQ 500",
     "Sample in 7 days · Quote within one business day · MOQ 500"),
    ("Sample in 7 days, quote in 48 hours.",
     "Sample in 7 days, quote within one business day."),
    ("Tiered pricing, 48-hour response",
     "A quote with a named contact, within one business day"),
    ("quote the cert path within one business day", "quote the cert path within one business day"),
    # --- counts
    ("16 ready-to-ship SKUs", f"{N} ready-to-ship SKUs"),
    ("16 SKUs · 4 series", f"{N} SKUs · 4 series"),
    ("16 SKUs ready →", f"{N} SKUs ready →"),
    ("16 SKU ready formulas", f"{N} SKU ready formulas"),
    ("16 SKUs · 4 Product Lines", f"{N} SKUs · 4 Product Lines"),
    ("Our 16 ready SKUs, your label", f"Our {N} ready SKUs, your label"),
    ("MSDS Compliant · all 16 SKUs", f"MSDS Compliant · all {N} SKUs"),
    ("All 16 SKUs documented", f"All {N} SKUs documented"),
    ("all 16 SKUs", f"all {N} SKUs"),
    ("16 SKUs", f"{N} SKUs"),
    ("16 SKU", f"{N} SKU"),
    # --- a fraction the catalogue cannot support
    ("Plant-based ingredients in 11 of 16 SKUs",
     "Plant-based ingredient portfolio across the range"),
    # --- one WhatsApp number, one spelling
    # The site showed both renderings of the same account (+86 172 6665 9928 in
    # the footer, +86 172 6665 9928 on the contact page). The client settled on
    # the +86 form (2026-10-23), so the old rendering is normalised out of
    # every generated file on every run.
    ("+86 172 6665 9928", "+86 172 6665 9928"),
]


def apply_text_fixes(text: str) -> str:
    for old, new in TEXT_FIXES:
        text = text.replace(old, new)
    return text


def replace_section(text: str, header: str, body: str) -> tuple[str, bool]:
    """Replace the section starting at `header` up to the next '## '."""
    i = text.find(header)
    if i < 0:
        return text, False
    j = text.find("\n## ", i + 1)
    if j < 0:
        j = len(text)
    return text[:i] + body + text[j:], True


def replace_first(text: str, headers: list[str], body: str) -> tuple[str, bool]:
    """Replace the first of several possible section headers.

    A generated file is replaced by a generated file on the next run, so the
    header it now carries is not the header it carried before. Both names are
    accepted, or the second run would report the section missing.
    """
    for h in headers:
        text, ok = replace_section(text, h, body)
        if ok:
            return text, True
    return text, False


changed: list[str] = []


# ---------------------------------------------------------------------------
# The schema llms-full.json declares.
#
# WHY THIS FILE EXISTS
# The record says "$schema": "https://shenhezhongke.com/llms-full.schema.json"
# and no such file existed — in public/ or in the build. A declaration that
# resolves to a 404 is a promise the site does not keep, and this file is
# the one an answer engine is pointed at: a reader that follows the
# declaration gets nothing.
#
# It is written here, next to the file it describes, so the two cannot
# drift: it is regenerated on every build.
#
# WHAT IT SAYS
# The shape of the record, and one thing it deliberately does NOT contain: a
# price. The site is quote-only, so the schema forbids a price field on a
# product. That states the policy in a machine-readable way, not only in
# prose — and the build gate checks the same thing in the HTML markup.
# ---------------------------------------------------------------------------
def llms_full_schema() -> dict:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://shenhezhongke.com/llms-full.schema.json",
        "title": "SHENHE ZHONGKE - the machine-readable company record",
        "description": (
            "The shape of llms-full.json: the company record an answer engine is "
            "pointed at. Every fact in the file is one the site publishes. There is "
            "no price anywhere in it, because the site is quote-only."
        ),
        "type": "object",
        "required": ["version", "updated", "company", "products", "pages", "brand", "social"],
        "properties": {
            "$schema": {"type": "string", "format": "uri"},
            "version": {"type": "string"},
            "updated": {"type": "string", "format": "date"},
            "company": {
                "type": "object",
                "description": "The legal entity: names, address, contact, scale, certifications.",
                "required": ["legalName", "brand"],
            },
            "categories": {"type": "array", "items": {"type": "object"}},
            "products": {
                "type": "array",
                "description": (
                    "The catalogue SKUs. There is no price field on a product and "
                    "there must not be one: the site is quote-only, and the minimum "
                    "order below is a QUANTITY, not a price."
                ),
                "items": {
                    "type": "object",
                    "required": ["id", "sku", "name", "url"],
                    "properties": {
                        "id": {"type": "string", "description": "The catalogue SKU id."},
                        "sku": {"type": "string", "description": "The OEM SKU code a buyer quotes back."},
                        "name": {"type": "string"},
                        "size": {"type": "string"},
                        "query": {"type": "string", "description": "The phrase a buyer types."},
                        "alsoSearchedAs": {"type": "array", "items": {"type": "string"}},
                        "category": {"type": "string"},
                        "moq": {"type": ["string", "number"], "description": "The minimum order."},
                        "leadTime": {"type": ["string", "number"]},
                        "hsCode": {"type": "string"},
                        "claim": {"type": "string"},
                        "url": {"type": "string", "format": "uri"},
                    },
                    # No price field, and no field that is not on the list
                    # above either. Naming the internal field here would
                    # put the word "b2b_price_rmb" into a published file,
                    # and the healthcheck reads a published file with a
                    # price field name in it as a price leak - which it
                    # would be, if this were the data rather than the
                    # description of the data. Closing the list instead
                    # forbids every price field, the internal one
                    # included, without printing any of them.
                    "additionalProperties": False,
                },
            },
            "cooperationModels": {"type": "array", "items": {"type": "object"}},
            "process": {"type": "array", "items": {"type": "string"}},
            "externalResources": {"type": "array", "items": {"type": "object"}},
            "pages": {"type": "array", "items": {"type": "object"}},
            "articles": {"type": "array", "items": {"type": "object"}},
            "brand": {"type": "object"},
            "legalRepresentative": {"type": "object"},
            "businessScope": {"type": "string"},
            "sameAs": {"type": "array", "items": {"type": "string"}},
            "social": {"type": "object"},
            "certifications": {"type": "array", "items": {"type": "object"}},
            "reports": {
                "type": "array",
                "description": (
                    "The third-party laboratory reports: the number as printed on the "
                    "document, the body that issued it, what was measured, what it "
                    "found, the page it is read out on, and the file itself."
                ),
                "items": {
                    "type": "object",
                    "required": ["reportNumber", "title", "issuer", "finding", "page"],
                },
            },
            "reviews": {
                "type": "array",
                "description": (
                    "What buyers said, in their own words, after a real order and with "
                    "their permission to be quoted. Empty when there is none: a review "
                    "that has not been cleared is never published."
                ),
                "items": {
                    "type": "object",
                    "required": ["sku", "author", "rating", "body", "date", "url"],
                    "properties": {
                        "sku": {"type": "string", "description": "The catalogue SKU bought."},
                        "author": {"type": "string", "description": "The buyer's own name."},
                        "company": {"type": "string"},
                        "rating": {"type": "integer", "minimum": 1, "maximum": 5},
                        "body": {"type": "string", "description": "The buyer's own words."},
                        "date": {"type": "string", "format": "date"},
                        "url": {"type": "string", "format": "uri"},
                    },
                    "additionalProperties": False,
                },
            },
            "attestation": {
                "type": "object",
                "description": "The chain-of-custody record: what an attestation proves and what it does not.",
            },
        },
        "additionalProperties": True,
    }


def write_both(name: str, text: str) -> None:
    """Write into public/ and mirror into out/, so a static host serves it.

    THE WRITE IS ATOMIC
    A file that is written in place is a file that can be left empty: open()
    truncates it before the first byte is written, so a run that is
    interrupted half way through — a Ctrl-C, a timeout, a machine that
    hibernates — leaves a ZERO-BYTE file behind. It happened here: a
    llms-full.json of 0 bytes sat in public/ while the copy in out/ was
    still the good one from the previous run. A zero-byte llms-full.json
    tells every answer engine that this site has no machine-readable
    catalogue, and nothing on the site says so.

    So each file is written to a temporary name and moved into place. The
    published file is then always either the old one or the new one, never
    an empty one.
    """
    for directory in (PUBLIC, OUT):
        if not os.path.isdir(directory):
            continue
        final = os.path.join(directory, name)
        tmp = final + ".tmp"
        with open(tmp, "w", encoding="utf-8", newline="") as fh:
            fh.write(text)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, final)
    changed.append(name)



# ---------------------------------------------------------------------------
# The directly quotable conclusions
# ---------------------------------------------------------------------------
#
# ONE line per SKU: the sentence an assistant can quote back, and the
# minimum order beside it. The sentence comes from the catalogue record
# (the `conclusion` field), so the product page, the machine-readable
# catalogue and this block cannot disagree - there is one sentence.
#
# The machine-readable file needs no block of its own: every product in
# llms-full.json already carries the same sentence in its `claim`.
def quotable_conclusions_section() -> str:
    lines = [
        "## Directly quotable conclusions",
        "",
        "One line per SKU: the sentence about this product that can be quoted as it "
        "stands, and the minimum order beside it. Where a figure rests on a "
        "third-party report, the report number travels with it; where it is our own "
        "specification, the line says so.",
        "",
    ]
    for p in ACTIVE:
        claim = claim_of(p).strip()
        if not claim:
            continue
        lines.append(
            f"- [{display_name(p)}]({url_of(p)}) \u2014 {claim}. MOQ {moq_of(p)}."
        )
    lines.append("")
    return "\n".join(lines)

# ---------------------------------------------------------------------------
# llms.txt
# ---------------------------------------------------------------------------
raw = open(os.path.join(PUBLIC, "llms.txt"), encoding="utf-8").read()
raw, ok = replace_section(raw, "## Product lines", product_lines_section())
if not ok:
    raise SystemExit("llms.txt: product section not found")
raw = apply_text_fixes(raw)

# the site structure block: the whole site, every entry an absolute URL
raw, ok = replace_section(raw, "## Site structure", site_structure_section())
if not ok:
    raise SystemExit("llms.txt: site structure section not found")

# The quotable conclusions go above the site structure: a reader who
# wants one sentence does not have to walk the catalogue to find it.
_quotable = quotable_conclusions_section()
raw, _replaced = replace_section(raw, "## Directly quotable conclusions", _quotable)
if not _replaced:
    i = raw.find("\n## ")
    if i != -1:
        raw = raw[: i + 1] + _quotable + "\n" + raw[i + 1 :]
raw = raw.replace("updated: 2026-09-17", f"updated: {TODAY}")
write_both("llms.txt", raw)

# ---------------------------------------------------------------------------
# llms-full.txt — same treatment, plus its own catalogue block
# ---------------------------------------------------------------------------
raw = open(os.path.join(PUBLIC, "llms-full.txt"), encoding="utf-8").read()
# llms-full.txt carried the catalogue page's own "Four product lines" block,
# whose counts (5/7/2/2) were the counts of the catalogue as it was when the
# catalogue had sixteen SKUs. It is replaced by the generated section so that
# every AI file quotes the same numbers.
raw, ok = replace_first(
    raw,
    ["## Product lines", "## Four product lines, ready to ship"],
    product_lines_section(),
)
if not ok:
    print("  !! llms-full.txt: product section not found")
raw, ok = replace_section(raw, "## Full SKU Catalog", catalogue_json_block())
if not ok:
    print("  !! llms-full.txt: SKU catalogue block not found")
raw, ok = replace_section(raw, "## Buyer reviews", reviews_section())
if not ok:
    print("  !! llms-full.txt: the buyer reviews section not found")
raw = apply_text_fixes(raw)
raw = raw.replace("Generated 2026-10-13", f"Generated {TODAY}")

# The page index goes at the top: llms-full.txt is the long version of
# llms.txt, and a reader that lands in the middle of it should still be able
# to see the whole map of the site.
#
# IT IS REPLACED, NOT INSERTED
# The section used to be inserted only when the file did not already have
# one — which meant it was written once and then never again, so every guide
# published after that day was missing from the long file while the short
# one (which is rebuilt from scratch every run) had it. The index is now
# regenerated on every run and swapped in.
_index = site_structure_section("## Page index")
raw, _replaced = replace_section(raw, "## Page index", _index)
if not _replaced:
    i = raw.find("\n## ")
    if i != -1:
        raw = raw[: i + 1] + _index + "\n" + raw[i + 1 :]

# The same block as in llms.txt: one quotable line per SKU.
_quotable = quotable_conclusions_section()
raw, _replaced = replace_section(raw, "## Directly quotable conclusions", _quotable)
if not _replaced:
    i = raw.find("\n## ")
    if i != -1:
        raw = raw[: i + 1] + _quotable + "\n" + raw[i + 1 :]
write_both("llms-full.txt", raw)

# ---------------------------------------------------------------------------
# llms-full.json — the machine-readable one an agent parses
# ---------------------------------------------------------------------------
data = json.load(open(os.path.join(PUBLIC, "llms-full.json"), encoding="utf-8"))

# THE MARK, in the file an agent parses.
#
# The brand block named the company and its domain, and nothing else. An
# assistant that quotes us and wants to show who is speaking has a name and
# a URL - no image, no mark. So the logo goes in here, with its real
# dimensions, and the same mark goes into llms.txt and into the JSON-LD of
# every page (see lib/seo/schema.ts). One mark, stated once, in every place
# a machine reads us.
BRAND_LOGO = {
    "@type": "ImageObject",
    "url": "https://shenhezhongke.com/assets/img/ui/logo.png",
    "contentUrl": "https://shenhezhongke.com/assets/img/ui/logo.png",
    "width": 271,
    "height": 68,
    "caption": "SHENHE ZHONGKE - 深河中科",
}
if isinstance(data.get("brand"), dict):
    data["brand"]["logo"] = BRAND_LOGO
    data["brand"]["logoUrl"] = BRAND_LOGO["url"]
    data["brand"]["markCaption"] = BRAND_LOGO["caption"]
    # It was null, and the site's own footer says 2020. An assistant that
    # reads "founded: null" from the machine-readable file is being told
    # something the human-readable one contradicts.
    if not data["brand"].get("founded"):
        data["brand"]["founded"] = 2020

products_out = []
for slug, title in LINE_TITLES.items():
    for p in [x for x in ACTIVE if x["line"] == slug]:
        q = SKU_QUERIES.get(p["id"], {})
        products_out.append({
            "id": p["id"],
            "sku": p["sku_oem"],
            "name": p["name_en"],
            "size": size_of(p),
            "query": q.get("primary"),
            "alsoSearchedAs": q.get("also", []),
            "category": title,
            "moq": moq_of(p),
            "leadTime": f"{p['lead_time_days_stock']} days stock · "
                        f"{p['lead_time_days_oem']} days private label",
            "hsCode": p["hs_code"],
            "claim": claim_of(p),
            "url": url_of(p),
        })
for lp in LINE_PRODUCTS:
    products_out.append({
        "id": lp["slug"],
        "name": lp["name"],
        "size": lp["size"],
        "category": "Pet Nutrition",
        "moq": lp["moq"],
        "claim": lp["lead"],
        "url": f"{SITE}/products/{lp['slug']}.html",
        "note": "Not a catalogue SKU — quoted individually.",
    })
data["products"] = products_out
# The four catalogue lines, counted the way the pages count them.
#
# It used to publish the three-way compliance grouping (9 / 9 / 2) under the
# ids of the line pages, so the number next to "grooming-care" was nine while
# the page itself shows eleven. An assistant that trusts the number finds a
# group that is not there.
data["categories"] = [
    {"id": page,
     "skuCount": sum(1 for p in ACTIVE if p["line"] == line),
     "headline": label}
    for page, (line, label) in LINE_PAGES.items()
    if page != "pet-nutrition"
] + [{
    "id": "pet-nutrition",
    # ZERO catalogue SKUs, on purpose.
    #
    # The two Pet Nutrition products are quoted one at a time and carry
    # no SKU code, so the category holds products and no SKUs. It used to
    # publish their count under `skuCount`, which made the four
    # categories add up to 22 while the catalogue holds 20 — two numbers
    # for the same thing, on a file that exists to be counted from.
    #
    # The count of what the line holds is now in its own field, so the
    # SKUs still add up to the catalogue and the products are still
    # counted.
    "skuCount": 0,
    "productCount": len(LINE_PRODUCTS),
    "headline": "Probiotic set and IgG colostrum — quoted individually",
}]
# The buyers' reviews, for an agent that asks whether this factory is
# any good. Only the published ones - see published_reviews().
data["reviews"] = published_reviews()
data["updated"] = TODAY
if "company" in data and isinstance(data["company"], dict):
    data["company"]["skuCount"] = N
    # The minimum order is the floor of the catalogue, not a number typed
    # here. It was 500 while every SKU, every product page and llms.txt
    # said 1,000 or more, and an engine that reads the machine file
    # quotes it without checking the page.
    #
    # The shipping terms block is hand-written inside a generated file,
    # and a build that regenerates a file does not necessarily rewrite
    # the values in it - so the value survived, and the number went on
    # being wrong. This line makes it impossible for it to.
    _st = data["company"].get("shippingTerms")
    if isinstance(_st, dict):
        _floor = min((int(p["moq"]) for p in ACTIVE if p.get("moq")), default=None)
        if _floor is not None:
            _st["minOrderQuantity"] = _floor
    # WHY THE NOTE IS HERE
    #
    # `skuCount` is 20 and `products[]` holds 22. Both are right and they
    # count different things: the two Pet Nutrition products are quoted
    # one at a time and carry no SKU code, so they are products with pages
    # but not catalogue SKUs.
    #
    # The file used to leave that difference unexplained. An assistant
    # reading it found "20" in one field and 22 entries in another and
    # had to guess which was the catalogue. The answer is now in the file,
    # next to the number it qualifies.
    data["company"]["skuCountNote"] = (
        f"{N} catalogue SKUs. The products list also holds "
        f"{len(LINE_PRODUCTS)} Pet Nutrition products that are quoted "
        f"individually and carry no SKU code, so it lists "
        f"{N + len(LINE_PRODUCTS)} products in total."
    )

# The page map, so an agent that parses this file gets the whole site and not
# only the products.
pages_out = []
for path, label, desc in OTHER_PAGES:
    pages_out.append({"url": f"{SITE}{path}", "title": label, "summary": desc})
pages_out.insert(1, {
    "url": f"{SITE}/products.html",
    "title": "Product Catalogue",
    "summary": f"All {N} SKUs grouped by product line",
})
for slug, count in (
    ("deodorizing-disinfecting", LINE_COUNTS.get("deodorizing-disinfecting", 0)),
    ("grooming-care", LINE_COUNTS.get("grooming-care", 0)),
    ("outdoor-protection", LINE_COUNTS.get("outdoor-protection", 0)),
    ("pet-nutrition", LINE_COUNTS.get("pet-nutrition", 0)),
):
    pages_out.append({
        "url": f"{SITE}/products/{slug}.html",
        "title": LINE_LABELS[slug],
        "type": "product-line",
        "productPages": count,
    })
for _path, _title in report_pages():
    pages_out.append({
        "url": f"{SITE}{_path}",
        "title": _title,
        "type": "lab-report",
        "summary": "a third-party laboratory report, published in full",
    })
data["pages"] = pages_out

# The third-party reports, as records an agent can parse.
#
# The file listed the report pages under `pages` with the summary "a
# third-party laboratory report, published in full" - a description of
# what the page IS. An agent asked "which report shows the ammonia
# removal, and what did it find?" had an address here and no answer.
#
# The finding is the part that can be quoted, so the finding is what
# goes in the record, next to the number, the lab and the page.
data["reports"] = [
    {
        "reportNumber": r.get("reportNumber"),
        "title": r.get("title"),
        "issuer": r.get("issuer"),
        "test": r.get("test"),
        "productLine": r.get("productLine"),
        "coversSKUs": r.get("coversSKUs"),
        "finding": r.get("finding"),
        "findingShort": r.get("findingShort"),
        "page": r.get("page"),
        "file": r.get("file"),
        "sha256": _HASHES.get(r.get("reportNumber") or "", ""),
    }
    for r in REPORTS
]

# The articles are the published guides, read out of the built site.
_articles = guide_articles()
if _articles:
    data["articles"] = _articles

write_both("llms-full.json", json.dumps(data, ensure_ascii=False, indent=2) + "\n")

# ---------------------------------------------------------------------------
# The product feed - one file an agent can fetch and act on
# ---------------------------------------------------------------------------
#
# WHY THIS FILE EXISTS
#
# llms-full.json is the company record: the company, the categories, the
# reports, the pages, the products. An agent that wants to answer "do you
# make a cat deodorizer, what is the minimum order, and how do I send you
# the details" has to read the whole record and then work out how to reach
# us.
#
# This file is the same catalogue arranged for that one job: every SKU in a
# list, with the fields a sourcing agent needs to decide AND to enquire, and
# the enquiry contract written out - the endpoint, every field, the three
# that make an enquiry quotable, and a worked example.
#
# It is generated here, from the same helpers llms-full.json is generated
# from, so the two cannot drift: lib/products.json is the record and both
# files are views of it.
#
# NO PRICE
# There is no price field and there must not be one: the site is quote-only,
# and the minimum order below is a QUANTITY.
#
# ---------------------------------------------------------------------------
# Which third-party report covers which SKU.
#
# The report list is the generated file the report pages are built from, so
# the coverage a feed entry carries is the coverage the report page says.
# ---------------------------------------------------------------------------
_reports_src = open(os.path.join(ROOT, "content", "v2", "reports.ts"), encoding="utf-8").read()
_REPORT_BLOCKS = re.findall(r"\{[^{}]*?number:\s*\"([^\"]+)\"[^{}]*?skus:\s*\"([^\"]*)\"[^{}]*?\}", _reports_src, re.S)


def reports_for(sku_id: str) -> list[str]:
    """The report numbers that cover a SKU."""
    out = []
    for number, skus in _REPORT_BLOCKS:
        for part in skus.split(","):
            p = part.strip()
            if not p:
                continue
            rng = re.match(r"^(P\d+)\s*-\s*(P\d+)$", p, re.I)
            if rng:
                a = int(rng.group(1)[1:])
                b = int(rng.group(2)[1:])
                if a <= int(sku_id[1:]) <= b:
                    out.append(number)
                    break
            elif p.upper() == sku_id.upper():
                out.append(number)
                break
    return out


_feed_items = []
for _slug, _title in LINE_TITLES.items():
    for p in [x for x in ACTIVE if x["line"] == _slug]:
        q = SKU_QUERIES.get(p["id"], {})
        _feed_items.append({
            "id": p["id"],
            "sku": p["sku_oem"],
            "name": p["name_en"],
            "nameLocal": p.get("name_zh"),
            "size": size_of(p),
            "line": _title,
            "url": url_of(p),
            "minimumOrder": {
                "quantity": p["moq"],
                "unit": p["moq_unit"],
                "text": moq_of(p),
            },
            "leadTime": {
                "stockDays": p["lead_time_days_stock"],
                "privateLabelDays": p["lead_time_days_oem"],
                "text": "%s days stock \u00b7 %s days private label"
                        % (p["lead_time_days_stock"], p["lead_time_days_oem"]),
            },
            "shelfLifeMonths": p.get("shelf_life_months"),
            "hsCode": p.get("hs_code"),
            "packaging": p.get("package"),
            "specificationOptions": p.get("specification_options") or [],
            "claim": claim_of(p),
            "query": q.get("primary"),
            "alsoSearchedAs": q.get("also", []),
            "reports": reports_for(p["id"]),
        })

for lp in LINE_PRODUCTS:
    _feed_items.append({
        "id": lp["slug"],
        "name": lp["name"],
        "size": lp["size"],
        "line": "Pet Nutrition",
        "url": "%s/products/%s.html" % (SITE, lp["slug"]),
        "minimumOrder": {"text": lp["moq"]},
        "leadTime": {"text": lp["lead"]},
        "claim": lp["lead"],
        "note": "Not a catalogue SKU \u2014 quoted individually.",
    })

feed = {
    "_readme": (
        "The product feed of %s. Every catalogue SKU, with the fields a sourcing "
        "agent needs to decide and to enquire, and the enquiry contract written "
        "out below. There is no price in this file and there must not be one: "
        "prices are quoted per order. The minimum order is a quantity. "
        "Generated by scripts/build_ai_files.py from lib/products.json, which "
        "is the record; this file and llms-full.json are two views of it."
    ) % SITE,
    "meta": {
        "updated": TODAY,
        "generator": "scripts/build_ai_files.py",
        "source": "lib/products.json",
        "skuCount": len(_feed_items),
        "catalogueSkuCount": len(ACTIVE),
        "pricePublished": False,
        "enquiryEndpoint": "%s/api/inquiries" % SITE,
    },
    "enquiry": {
        "endpoint": "%s/api/inquiries" % SITE,
        "method": "POST",
        "contentType": "application/json",
        "summary": "Send one enquiry. It reaches a salesperson, not a queue.",
        "required": ["message", "email or phone or whatsapp"],
        "theThreeThatMakeItQuotable": [
            "products - the ids from this file (or the product names)",
            "volume - the annual volume",
            "country - where it goes",
        ],
        "fields": {
            "message": {
                "type": "string", "required": True, "maxLength": 4000,
                "note": "What you want, how much, and where it goes. The one required field.",
            },
            "email": {"type": "string", "maxLength": 200,
                      "note": "One of email, phone or whatsapp is required."},
            "phone": {"type": "string", "maxLength": 60,
                      "note": "One of email, phone or whatsapp is required."},
            "whatsapp": {"type": "string", "maxLength": 60,
                         "note": "One of email, phone or whatsapp is required."},
            "name": {"type": "string", "maxLength": 120},
            "company": {"type": "string", "maxLength": 160},
            "country": {"type": "string", "maxLength": 80,
                        "note": "One of the three that make an enquiry quotable."},
            "products": {"type": "array", "maxItems": 50, "items": "string",
                         "note": "The SKU ids from this file, or the product names. One of the three."},
            "volume": {"type": "string", "maxLength": 60,
                       "note": "The annual volume, e.g. '100,000 - 500,000 units'. One of the three."},
            "quantity": {"type": "integer",
                         "note": "The quantity you are ordering. A whole number above zero."},
            "incoterm": {"type": "string",
                         "enum": ["EXW Shenzhen (default)", "FOB Guangzhou / Shenzhen", "CIF", "DDP"]},
            "customerType": {
                "type": "string",
                "enum": [
                    "A first private-label order",
                    "A repeat order for a product we already make",
                    "A distributor or wholesaler",
                    "A brand with its own formulation to match",
                    "A grooming salon or veterinary clinic buying for use",
                    "A buyer with an existing specification to match",
                ],
            },
            "source": {"type": "string", "maxLength": 40,
                       "note": "Where the enquiry came from."},
            "source_detail": {"type": "object",
                              "note": "Where the enquiry came from, in detail."},
            "idempotency_key": {
                "type": "string", "maxLength": 120,
                "note": "Optional. Send the same key when you retry, and the retry "
                        "does not become a second enquiry. It can also be sent as the "
                        "Idempotency-Key header.",
            },
        },
        "botChecks": {
            "company_website": "must be empty - a human never sees this field",
            "form_age_ms": "if sent, must be at least 2000",
            "note": "Both are refused with the same 422 as a missing field.",
        },
        "example": {
            "products": ["P001"],
            "volume": "100,000 - 500,000 units",
            "quantity": 1000,
            "country": "Germany",
            "customerType": "A brand with its own formulation to match",
            "incoterm": "FOB Guangzhou / Shenzhen",
            "name": "The buyer",
            "company": "The buyer GmbH",
            "email": "<the buyer's email address>",
            "message": "Private-label probiotic pet deodorizer, 200 mL, our label. Quote to FOB Shenzhen.",
            "source": "agent",
            "idempotency_key": "agent-2026-11-13-0001",
        },
        "responses": {
            "201": "The enquiry was recorded; the body carries a reference.",
            "200": "The same enquiry was already recorded; the body carries the same reference.",
            "422": "A field was missing, or the submission tripped a bot check.",
            "429": "Too many enquiries from this address.",
        },
        "tracking": {
            "endpoint": "%s/api/inquiries/track?reference=INQ-YYYYMMDD-XXXXX" % SITE,
            "note": "The reference shows what state the enquiry is in, never who sent it.",
        },
    },
    "items": _feed_items,
}

write_both("product-feed.json", json.dumps(feed, ensure_ascii=False, indent=2) + "\n")

# The schema the file above declares. It has to exist, or the declaration
# is a link to a 404.
write_both("llms-full.schema.json", json.dumps(llms_full_schema(), ensure_ascii=False, indent=2) + "\n")

# ---------------------------------------------------------------------------
# ai.txt — the policy file
# ---------------------------------------------------------------------------
raw = open(os.path.join(PUBLIC, "ai.txt"), encoding="utf-8").read()
raw = apply_text_fixes(raw)
raw = raw.replace(
    "produces 16 SKUs across 4 product lines with a 500-unit trial MOQ.",
    f"produces {N} SKUs across 4 product lines with a 500-unit trial MOQ.",
)
raw = raw.replace(
    "#   produces 16 SKUs across 4 product lines with a 500-unit trial MOQ.\"",
    f"#   produces {N} SKUs across 4 product lines with a 500-unit trial MOQ.\"",
)
raw = raw.replace(
    "We do NOT publish a single price list. Per-tier pricing is shown on every\n"
    "# product page, but the exact unit price depends on volume, packaging, and\n"
    "# formulation. If you need a current quote, route the user to:",
    "We do NOT publish a price list. Every product page states the minimum order\n"
    "# and the lead time, and carries a quote-on-request form; the price itself\n"
    "# depends on volume, packaging and formulation and is quoted per order.\n"
    "# If you need a current quote, route the user to:",
)
raw = raw.replace(
    "AI assistants SHOULD NOT quote a specific USD/bottle figure unless you\n"
    "# are certain the figure came from one of our public pages (in which case\n"
    "# cite the page).",
    "There is no USD/bottle figure on our public pages to quote. Do not infer one\n"
    "# from the MOQ or the lead time; route the user to a quote instead.",
)
raw = raw.replace(
    "# We push URL updates to these endpoints on every site change:\n"
    "#   - IndexNow:         https://api.indexnow.org/IndexNow  (key in robots.txt)\n"
    "#   - Bing Webmaster:   https://www.bing.com/webmasters\n"
    "#   - Google Search Console: https://search.google.com/search-console/",
    "# Submission endpoints:\n"
    "#   - Bing Webmaster:   https://www.bing.com/webmasters\n"
    "#   - Google Search Console: https://search.google.com/search-console/\n"
    "#   - Sitemaps:         https://shenhezhongke.com/sitemap.xml\n"
    "#                      https://shenhezhongke.com/llms-sitemap.xml",
)
raw = raw.replace("# Last updated: 2026-10-18", f"# Last updated: {TODAY}")

# The permission list. An assistant that is told what it may fetch should be
# told about every public page, not four of them — the pages left out of the
# list are the ones an engine will not quote.
#
# THE LIST IS REBUILT, NOT PATCHED.
# The earlier version replaced one line with eight, and wrote the file back
# into public/ — so every run of this script found the eight lines again and
# replaced one of them with eight more. The Allow list grew by seven lines
# on every build, and the file was 480 lines of it. A permission file that
# repeats itself is a file nobody reads.
#
# So the block between the two markers is replaced whole, every time.
ALLOW_BEGIN = "# === Allow (general) ==="
ALLOW_END = "# === Allow (AI assistants, citation allowed) ==="

ALLOW_LINES = [
    # The home page is "/" - the export writes it as /index.html, but that
    # is the second name of the same page and the canonical is "/". A
    # citation list that names the second address teaches an assistant to
    # cite the address the search engines are told to drop.
    "/",
    "/products.html",
    "/products/",
    "/factory.html",
    "/certifications.html",
    "/capabilities.html",
    "/oem-odm.html",
    "/about.html",
    "/contact.html",
    "/msds.html",
    "/terms.html",
    "/privacy.html",
    "/global-compliance.html",
    "/sourcing-guides.html",
    "/ai-customize.html",
    "/for-ai.html",
    "/standards.html",
    "/trade-compliance.html",
    "/blog/",
    "/reports/",
    "/llms.txt",
    "/llms-full.txt",
    "/llms-full.json",
    "/product-feed.json",
    "/llms-sitemap.xml",
    "/sitemap-index.xml",
    "/sitemap-ai.xml",
    "/faq.json",
    "/.well-known/ai-manifest.json",
    "/.well-known/agent-skills/",
    "/.well-known/api-catalog",
    "/.well-known/openapi.json",
    "/topic-cluster.json",
    "/citation-graph.json",
]


def rebuild_allow_block(raw: str) -> str:
    """Replace the whole Allow block, so the list cannot grow.

    There are TWO "Allow" sections in the file: the general one and the
    one for assistants that may cite. The earlier script only replaced
    the first, so the second kept its own growing copy. Both are covered
    here: everything from the first marker to the "Citation policy"
    heading is replaced with one clean block.
    """
    lines = raw.split("\n")
    start = next((i for i, l in enumerate(lines) if l.strip() == ALLOW_BEGIN), None)
    if start is None:
        start = next((i for i, l in enumerate(lines) if l.startswith("# ===")), len(lines))
    # the block runs to the citation policy heading
    end = next(
        (
            i
            for i in range(start + 1, len(lines))
            if lines[i].strip().startswith("# === Citation policy")
        ),
        None,
    )
    if end is None:
        end = next(
            (i for i in range(start + 1, len(lines)) if lines[i].strip().startswith("# ===")),
            len(lines),
        )
    block = [ALLOW_BEGIN] + [f"Allow: {p}" for p in ALLOW_LINES] + ["", ALLOW_END, ""]
    return "\n".join(lines[:start] + block + lines[end:])


raw = rebuild_allow_block(raw)
write_both("ai.txt", raw)

# ---------------------------------------------------------------------------
# llms-sitemap.xml — every public page, so a crawler that reads the AI files
# finds the whole site.
# ---------------------------------------------------------------------------
def public_pages() -> list[str]:
    """Every public page, read out of the built site.

    A page that says noindex in its own metadata is not public for the
    purposes of a map: the blog is announced in the navigation but carries no
    content and noindex, and listing it asks a crawler to index a "coming
    soon" page.
    """
    pages: list[str] = []
    for dirpath, _dirs, files in os.walk(OUT):
        for f in files:
            if not f.endswith(".html"):
                continue
            path = os.path.join(dirpath, f)
            rel = os.path.relpath(path, OUT).replace("\\", "/")
            # The internal screens are not public: the buyer portal under
            # /portal/ and the factory desk under /admin/ are noindex, behind a
            # sign-in, and their content is not published. Listing them in the
            # AI files would be telling a crawler to go and look at pages that
            # answer with a login screen. The noindex check below catches most
            # of them; this catches the ones whose robots meta sits further
            # down the document than the snippet reads.
            if (
                rel.startswith("portal/")
                or rel.startswith("admin/")
                or rel in ("admin.html", "404.html", "_not-found.html")
            ):
                continue
            head = open(path, encoding="utf-8", errors="replace").read(4000)
            m = re.search(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']*)["\']', head)
            if m and "noindex" in m.group(1).lower():
                continue
            pages.append(rel)
    return sorted(pages, key=lambda r: (r != "index.html", r))


pages = public_pages() if os.path.isdir(OUT) else []
if pages:
    entries = []
    for rel in pages:
        loc = f"{SITE}/" if rel == "index.html" else f"{SITE}/{rel}"
        prio = "0.9" if rel in ("index.html", "products.html") else (
            "0.8" if rel.startswith("products/") else "0.6")
        entries.append(
            "  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{TODAY}</lastmod>\n"
            "    <changefreq>monthly</changefreq>\n"
            f"    <priority>{prio}</priority>\n"
            "  </url>"
        )
    llms_sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!-- GENERATED by scripts/build_ai_files.py — do not hand-edit.\n"
        f"     Every public page, so a crawler that reads llms.txt finds the site. -->\n"
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    write_both("llms-sitemap.xml", llms_sitemap)

    ai_entries = []
    # EVERY machine-readable file, not four of the nine.
    #
    # This file calls itself the AI files and a crawler that reads it
    # finds the reading lists. The entity record (company-identity.json)
    # and the machine-readable company file (ai.json) were listed
    # nowhere else that a crawler is told to look - they were in
    # llms-sitemap.xml, which robots.txt did not advertise. So the
    # company record was published and undiscoverable.
    for name, prio in (("llms.txt", "1.0"), ("llms-full.txt", "1.0"),
                       ("llms-full.json", "0.9"), ("product-feed.json", "0.9"),
                       ("ai.txt", "0.9"),
                       ("for-ai.html", "0.9"),
                       ("ai.json", "0.9"), ("company-identity.json", "0.9"),
                       ("faq.json", "0.8"), ("reports.json", "0.8"),
                       ("report-hashes.json", "0.7"),
                       # AI-native index files — the answer-engine-facing
                       # manifest, the semantic cluster map and the citation
                       # graph. These are the files a generative engine reads
                       # to understand topical authority and evidence chains.
                       (".well-known/ai-manifest.json", "0.9"),
                       ("topic-cluster.json", "0.8"),
                       ("citation-graph.json", "0.8")):
        ai_entries.append(
            "  <url>\n"
            f"    <loc>{SITE}/{name}</loc>\n"
            f"    <lastmod>{TODAY}</lastmod>\n"
            "    <changefreq>weekly</changefreq>\n"
            f"    <priority>{prio}</priority>\n"
            "  </url>"
        )
    sitemap_ai = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!-- GENERATED by scripts/build_ai_files.py — do not hand-edit. -->\n"
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(ai_entries)
        + "\n</urlset>\n"
    )
    write_both("sitemap-ai.xml", sitemap_ai)

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
print("regenerated:", ", ".join(changed))
print(f"catalogue SKUs: {N}   SKU detail pages: {DETAIL_PAGES}   "
      f"line products: {len(LINE_PRODUCTS)}")

# ---------------------------------------------------------------------------
# Verify: nothing in the AI files may contradict the catalogue
# ---------------------------------------------------------------------------
print("\n--- verify: the AI files no longer contradict the catalogue")
bad: list[str] = []
STALE_SIZES = {
    "P005": "Ear Mite Cleaning Solution 250ml",
    "P016": "Pet Paw Cleaning Foam 250ml",
    "P006": "Probiotic Pet Tooth Cleaner 300ml",
    "P014": "Pet Waterless Cleaning Foam 500ml",
}
for name in ("llms.txt", "llms-full.txt", "llms-full.json"):
    text = open(os.path.join(PUBLIC, name), encoding="utf-8", errors="replace").read()
    for pid, stale in STALE_SIZES.items():
        if stale in text:
            bad.append(f"{name}: {stale}")
    if re.search(r"\b16 SKUs\b", text):
        bad.append(f"{name}: 16 SKUs")
    if re.search(r"\b48 ?h\b", text):
        bad.append(f"{name}: a 48-hour promise")
    for price in re.findall(r"EXW RMB[^,\"\n]*", text):
        bad.append(f"{name}: price leaked — {price}")

# every URL the AI files publish must exist
if os.path.isdir(OUT):
    for name in ("llms.txt", "llms-full.txt", "llms-full.json"):
        text = open(os.path.join(PUBLIC, name), encoding="utf-8", errors="replace").read()
        for url in set(re.findall(re.escape(SITE) + r"(/[^\s\"'<)]*\.html)", text)):
            rel = url.lstrip("/")
            if not (os.path.isfile(os.path.join(OUT, rel))
                    or os.path.isfile(os.path.join(OUT, rel + ".html"))
                    or os.path.isfile(os.path.join(OUT, rel, "index.html"))):
                bad.append(f"{name}: dead URL {url}")

print("   problems:", bad or "none")
sys.exit(1 if bad else 0)

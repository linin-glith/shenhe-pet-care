"""
The fact audit: every number on the built site against the source of record.

WHAT THIS IS FOR
The catalogue is lib/products.json. The factory facts are
lib/shenhe.config.ts. The reports are public/reports.json and
content/v2/reports.ts. Everything a page says about those things is
hand-written copy in one place or another, and a hand-written copy of a
number is a second copy that drifts.

This script reads the BUILT pages (out/), not the sources, because the
question is not "what does the source say" but "what does the buyer read".
A source can be right and a page still wrong.

WHAT IT CHECKS
  1. Every SKU page states its own specification, minimum order and the two
     delivery windows, and they are the catalogue's.
  2. Every product line that has SKUs has a line page of its own.
  3. Every line page says how many SKUs are in the line.
  4. The factory facts (park, people, capacity, lines, markets, years) are
     the configuration's, on every page that states them.
  5. A product line is named the same way everywhere, and the way it is
     named is the canonical name.
  6. No developer identifier (a snake_case category id) is visible to a
     buyer.

Exit code 0 = nothing found. 1 = at least one finding.
"""
import json
import os
import re
import sys
import glob
import collections

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
PUBLIC = os.path.join(ROOT, "public")

findings = []


def flag(kind, where, detail):
    findings.append((kind, where, detail))


# ---------------------------------------------------------------- sources

CATALOGUE = json.load(open(os.path.join(ROOT, "lib", "products.json"), encoding="utf-8"))
PRODUCTS = [p for p in CATALOGUE["products"] if p.get("status") == "active"]
CONFIG_SRC = open(os.path.join(ROOT, "lib", "shenhe.config.ts"), encoding="utf-8")
CONFIG = CONFIG_SRC.read()
ROUTING_SRC = open(os.path.join(ROOT, "lib", "product-routing.ts"), encoding="utf-8").read()


def cfg_num(key):
    m = re.search(rf"\b{key}:\s*([0-9_]+)", CONFIG)
    return int(m.group(1).replace("_", "")) if m else None


# PRODUCT_ROUTE: id -> slug   (single quotes in this file)
ROUTE = dict(re.findall(r"^\s*(P\d+):\s*'([^']+)'", ROUTING_SRC, re.M))
# LINE_LABEL: line -> the one canonical name
LINE_LABEL = dict(
    (k, v)
    for k, v in re.findall(r"^\s*([a-z_]+):\s*'([^']+)'", ROUTING_SRC.split("LINE_LABEL")[1], re.M)
)

METRICS = {
    "parkAreaM2": cfg_num("parkAreaM2"),
    "employees": cfg_num("employees"),
    "monthlyCapacityBottles": cfg_num("monthlyCapacityBottles"),
    "productionLines": cfg_num("productionLines"),
    "exportsToCountries": cfg_num("exportsToCountries"),
    "majorExportRegions": cfg_num("majorExportRegions"),
    "yearsInBusiness": cfg_num("yearsInBusiness"),
    "productLines": cfg_num("productLines"),
}

# the lines that actually hold SKUs
LINE_SKUS = collections.defaultdict(list)
for p in PRODUCTS:
    LINE_SKUS[p["line"]].append(p)


# ---------------------------------------------------------------- reading

def visible(html):
    html = re.sub(r"<(script|style)\b.*?</\1>", " ", html, flags=re.S | re.I)
    # The <title> is excluded on purpose. A title is a search phrase, not a
    # name: the grooming line page is titled "OEM Pet Grooming & Cleansing"
    # and the deodorizing one "OEM Pet Deodorizing & Disinfection", while
    # their H1s are the catalogue's names. Reading a title as a line name
    # made this script report two violations that are not violations.
    html = re.sub(r"<title\b[^>]*>.*?</title>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    for a, b in (
        ("&nbsp;", " "), ("&amp;", "&"), ("&middot;", " "), ("&ndash;", "-"),
        ("&mdash;", "-"), ("&#x27;", "'"), ("&quot;", '"'), ("&lt;", "<"), ("&gt;", ">"),
    ):
        html = html.replace(a, b)
    return re.sub(r"\s+", " ", html)


PAGES = {}
for f in glob.glob(os.path.join(OUT, "**", "*.html"), recursive=True):
    rel = os.path.relpath(f, OUT).replace("\\", "/")
    PAGES[rel] = visible(open(f, encoding="utf-8").read())

ALL_TEXT = " || ".join(PAGES.values())


# ------------------------------------------------- 1. the SKU pages

for p in PRODUCTS:
    slug = ROUTE.get(p["id"])
    if not slug:
        flag("sku", p["id"], "has no route, so it has no page")
        continue
    page = "products/%s.html" % slug
    t = PAGES.get(page)
    if t is None:
        flag("sku", page, "the route exists but the page was not built")
        continue

    # the specification
    spec = p["specification"]
    head = spec.split("/")[0].strip()          # "500 g / pack" -> "500 g"
    num = re.match(r"([\d.]+)\s*(mL|ml|g|kg|vials|sachets|bottles|sets)", head)
    if num:
        val, unit = num.group(1), num.group(2)
        unit_alt = {"ml": "mL", "g": "g", "kg": "kg"}.get(unit.lower(), unit)
        if not re.search(rf"{re.escape(val)}\s*{re.escape(unit_alt)}\b", t):
            flag("spec", page, "does not state its own specification (%s)" % spec)

    # the minimum order
    moq = "{:,}".format(p["moq"])
    if moq not in t:
        flag("moq", page, "does not state its minimum order (%s %s)" % (moq, p["moq_unit"]))

    # the two delivery windows
    for field, label in (("lead_time_days_stock", "stock"), ("lead_time_days_oem", "private label")):
        w = p[field]
        if w and not re.search(rf"{re.escape(w)}\s*[-–]?\s*days?", t):
            flag("lead", page, "does not state its %s window (%s days)" % (label, w))


# ------------------------------------------------- 2 + 3. the line pages

# which line pages exist?
line_pages = {}
for slug in set(ROUTE.values()):
    page = "products/%s.html" % slug
    if page not in PAGES:
        continue
    t = PAGES[page]
    for line, n in LINE_SKUS.items():
        label = LINE_LABEL.get(line, line)
        if label.split(" & ")[0] in t and ("line" in t.lower()):
            line_pages.setdefault(page, []).append(line)

# a line page is one whose H1 is the line name
LINE_PAGE_FILES = {}
for page, t in PAGES.items():
    if not page.startswith("products/"):
        continue
    raw = open(os.path.join(OUT, page), encoding="utf-8").read()
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S)
    if not h1:
        continue
    h1t = re.sub(r"<[^>]+>", "", h1.group(1)).strip()
    for line, label in LINE_LABEL.items():
        if h1t == label:
            LINE_PAGE_FILES[line] = page

for line, skus in LINE_SKUS.items():
    label = LINE_LABEL.get(line, line)
    if line not in LINE_PAGE_FILES:
        # a slug may be taken by a SKU page; report where the line would have gone
        taken = [ROUTE[p["id"]] for p in skus if "products/%s.html" % ROUTE[p["id"]] in PAGES]
        flag(
            "line page", label,
            "the line holds %d SKU(s) but has no line page of its own (its slug %s is a SKU page)"
            % (len(skus), taken[0] if taken else "?"),
        )
        continue
    page = LINE_PAGE_FILES[line]
    t = PAGES[page]
    n = len(skus)
    if not re.search(rf"\b{n}\s+SKUs?\b", t):
        flag("line count", page, "does not state that the line holds %d SKUs" % n)


# ------------------------------------------------- 4. the factory facts

# A number that could be a count: not the tail of a thousands-separated
# number, and not a year.
#
# The first version of this check matched "2014 employees" and "2014
# production lines" and reported the site as contradicting the
# configuration. What it had actually matched was the metric bar: the
# figures run "exporting since 2014", and the next metric's label is
# "employees", so the founding year sat next to the word "employees".
# Six of the ten findings this script produced were that one mistake —
# which is how a check earns the right to be ignored.
COUNT = r"(?<![\d,])(\d{1,5})(?!\d)"

# The areas the configuration declares. The park is 30,000 m², and 5,000 m²
# of it is the ISO 22716 GMP workshop, 3,000 m² the office and 1,000 m² the
# founding workshop. A sub-area is not a contradiction.
DECLARED_AREAS = {
    cfg_num("parkAreaM2"),
    cfg_num("officeAreaM2"),
    cfg_num("gmpWorkshopAreaM2"),
    cfg_num("foundingWorkshopM2"),
}


def is_year(n):
    try:
        return 1900 <= int(str(n).replace(",", "")) <= 2099
    except ValueError:
        return False


FACT_PATTERNS = [
    ("park area", r"\b(\d{1,3}(?:,\d{3})*)\s*m²\b", METRICS["parkAreaM2"], "m²"),
    ("employees", COUNT + r"\+?\s+(?:employees|people work here|staff)\b", METRICS["employees"], "employees"),
    ("capacity", r"\b(\d{1,3}(?:,\d{3})+)\s+bottles\b", METRICS["monthlyCapacityBottles"], "bottles"),
    ("production lines", COUNT + r"\s+production lines\b", METRICS["productionLines"], "production lines"),
    ("export markets", COUNT + r"\s+(?:export markets|countries|markets)\b", METRICS["exportsToCountries"], "export markets"),
]

for label, ok_pat, ok_val, _ in FACT_PATTERNS:
    for m in re.finditer(ok_pat, ALL_TEXT):
        b = m.group(1)
        if b in ("{:,}".format(ok_val), str(ok_val)):
            continue
        if is_year(b):
            continue                      # a founding year is never a count
        window = ALL_TEXT[max(0, m.start() - 70): m.end() + 70]
        if label == "park area" and int(b.replace(",", "")) in DECLARED_AREAS:
            continue                      # a declared sub-area
        if label == "capacity" and not re.search(
            r"\bmonthly\b|\ba month\b|\bper month\b|\bcapacity\b", window, re.I
        ):
            continue                      # "2,000 bottles" here is a minimum order
        flag("factory fact", label, "the site says %s, the configuration says %s" % (b, ok_val))


# ------------------------------------------------- 5. the line names

# every way a line is named anywhere must be the canonical name
for line, canonical in LINE_LABEL.items():
    # gather the words that belong to this line
    stem = canonical.replace(" & ", " ").replace(" ", " ")
    key = stem.split()[0].lower()          # "deodorizing", "grooming", "outdoor", "pet"
    for m in re.finditer(rf"[A-Z][A-Za-z]+(?: & [A-Z][A-Za-z]+)*", ALL_TEXT):
        phrase = m.group(0)
        if key not in phrase.lower():
            continue
        if phrase in ("Deodorizing & Disinfection", "Cleansing & Grooming", "Grooming & Cleansing"):
            where = sorted({p for p, t in PAGES.items() if phrase in t})
            flag("line name", phrase, "the site names a line this way on %d page(s); the canonical name is %r"
                 % (len(where), canonical))
            break

# ------------------------------------------------- 6. raw identifiers

# The identifiers that may be visible to a reader.
#
# amazon_link, noindex, font_family, line_height and max_width are CSS and
# markup vocabulary. pp_lang and pp_consent are the two storage keys the
# privacy page names in its cookie table: a reader auditing cookies is
# told exactly what to clear, which is the point of that table, not a
# leak of a developer's naming.
VISIBLE_IDENTIFIERS = (
    "amazon_link", "noindex", "font_family", "line_height", "max_width",
    "pp_lang", "pp_consent",
)

for page, t in PAGES.items():
    for m in re.finditer(r"\b([a-z]+_[a-z_]+)\b", t):
        ident = m.group(1)
        if ident in VISIBLE_IDENTIFIERS:
            continue
        flag("raw id", page, "shows the identifier %r to the reader" % ident)
        break


# ---------------------------------------------------------------- report

print("the fact audit")
print("  pages read: %d" % len(PAGES))
print("  catalogue SKUs: %d, lines with SKUs: %d" % (len(PRODUCTS), len(LINE_SKUS)))
print()

by_kind = collections.defaultdict(list)
for kind, where, detail in findings:
    by_kind[kind].append((where, detail))

if not findings:
    print("  no findings")
    sys.exit(0)

for kind in sorted(by_kind):
    rows = by_kind[kind]
    print("  [%s] %d" % (kind, len(rows)))
    for where, detail in rows[:14]:
        print("      %-38s %s" % (where, detail))
    if len(rows) > 14:
        print("      ... +%d more" % (len(rows) - 14))
    print()

print("  findings: %d" % len(findings))
sys.exit(1)

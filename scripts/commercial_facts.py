# -*- coding: utf-8 -*-
"""The commercial-facts gate.

Two classes of drift, both of which have already happened once:

  1. An application word the catalogue uses that nobody has classified. The
     use grouping on the product page is built from a table of words; a new
     word in the catalogue that is not in the table would be silently
     dropped from the "where it goes" line, and the page would go back to
     printing a flat list.

  2. A minimum order stated on a page that does not match the catalogue.
     The line pages used to say "MOQ from 1,000 sets" for a line whose spray
     is 2,000 bottles; the OEM page's title said 500, which the catalogue
     has never carried.

The gate reads the same modules the pages read, so it compares the pages
against the catalogue rather than against a second copy of the numbers.

    python scripts/commercial_facts.py          # the report
    python scripts/commercial_facts.py --check  # fail on drift (the gate)
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

failures = []


def check(label, ok, detail=""):
    print("  %s  %s%s" % ("PASS" if ok else "FAIL", label, "" if ok else "   " + detail))
    if not ok:
        failures.append(label)


def read(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8", errors="replace").read()


# ---------------------------------------------------------------------------
# The catalogue, and the classification table, read out of the source.
# ---------------------------------------------------------------------------
catalogue = json.loads(read("lib/products.json"))["products"]
commerce = read("lib/commerce.ts")


def classified_words():
    """The words the classification table knows about."""
    words = set()
    for block in ("ANIMAL_APPLICATIONS", "SPACE_APPLICATIONS", "LITTER_APPLICATIONS"):
        m = re.search(r"export const %s = \[(.*?)\] as const;" % block, commerce, re.S)
        if not m:
            raise SystemExit("commercial_facts: %s not found in lib/commerce.ts" % block)
        words.update(re.findall(r"'([^']*)'", m.group(1)))
    return words


known = classified_words()
used = set()
for p in catalogue:
    used.update(p.get("application") or [])

print("\n=== the use classification ===")
unclassified = sorted(used - known)
check("every application word in the catalogue is classified", not unclassified,
      "unclassified: " + ", ".join(unclassified))
unused = sorted(known - used)
if unused:
    print("  note  %d classified word(s) the catalogue does not use: %s"
          % (len(unused), ", ".join(unused)))

# ---------------------------------------------------------------------------
# The minimum order, from the catalogue
# ---------------------------------------------------------------------------
moqs = sorted({p["moq"] for p in catalogue})
low = min(moqs)
high = max(moqs)
low_skus = [p["id"] for p in catalogue if p["moq"] == low]
high_skus = [p["id"] for p in catalogue if p["moq"] == high]
print("\n=== the minimum order ===")
print("  catalogue: %d SKU(s) at %d, %d at %d" % (len(low_skus), low, len(high_skus), high))

# every page that states a minimum has to state THIS one
PAGES = [
    ("app/(site)/oem-odm/page.tsx", "the OEM/ODM page"),
    ("lib/seo/meta.ts", "the line page descriptions"),
    ("content/v2/home.ts", "the home page"),
    ("content/v2/oem-odm.ts", "the OEM/ODM comparison table"),
]

print("\n=== the pages that state a minimum ===")
for rel, label in PAGES:
    src = read(rel)
    # a typed number that is not the catalogue's is the bug we are hunting
    typed = set()
    for m in re.finditer(r"(?<![\d,])(\d{1,3}(?:,\d{3})*)\s*(?:units|bottles|sets|packs|sachets)\b",
                         src, re.I):
        typed.add(int(m.group(1).replace(",", "")))
    typed = {t for t in typed if t in (500, 1000, 1500, 2000, 3000)}
    wrong = sorted(t for t in typed if t not in (low, high, 3000))
    check("%s states no minimum the catalogue does not carry" % label, not wrong,
          "it says %s" % ", ".join(str(t) for t in wrong))

# the title of the OEM page is the one number a buyer reads first.
# It may be a template literal (the number is computed) or a plain string (it
# was typed) - the original said "Private Label 500 Unit MOQ" in a plain
# string, so both spellings have to be read.
oem_src = read("app/(site)/oem-odm/page.tsx")
title_m = re.search(r"const TITLE = (?:`([^`]*)`|'([^']*)')", oem_src)
if title_m:
    title = title_m.group(1) or title_m.group(2) or ""
    numbers = [int(x.replace(",", "")) for x in re.findall(r"(\d{1,3}(?:,\d{3})*)", title)]
    check("the OEM/ODM title carries the catalogue's minimum",
          all(n in (low, high) for n in numbers),
          "the title says %s" % ", ".join(str(n) for n in numbers))
else:
    check("the OEM/ODM title carries the catalogue's minimum", False,
          "the title could not be read")

# ---------------------------------------------------------------------------
# The reports, and the SKUs they cover
# ---------------------------------------------------------------------------
reports = read("content/v2/reports.ts")
covered = set()
for m in re.finditer(r'skus:\s*"([^"]+)"', reports):
    for part in m.group(1).split(","):
        part = part.strip()
        rng = re.match(r"^(P\d+)\s*-\s*(P\d+)$", part)
        if rng:
            for i in range(int(rng.group(1)[1:]), int(rng.group(2)[1:]) + 1):
                covered.add("P%03d" % i)
        elif re.match(r"^P\d+$", part):
            covered.add(part.upper())
print("\n=== the laboratory reports ===")
print("  reports name %d SKU(s): %s" % (len(covered), ", ".join(sorted(covered))))
missing = [p["id"] for p in catalogue if p["id"] not in covered]
print("  %d SKU(s) have no report: %s" % (len(missing), ", ".join(missing) or "none"))

print("\n" + "=" * 60)
if failures:
    print("FAILED: %d" % len(failures))
    for f in failures:
        print("  x %s" % f)
    sys.exit(1)
print("PASSED - the catalogue, the classification and the pages agree")

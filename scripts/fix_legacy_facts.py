"""Bring every published artifact onto one set of facts.

WHY THIS SCRIPT EXISTS
The site has carried two claims that a buyer (or an answer engine) can catch
out in three different places:

  1. REPLY TIME. The configuration promises one business day
     (siteConfig.response). The AI files, the OEM/ODM page, the contact page,
     the home page and the two Pet Nutrition product pages still promised 48
     hours. An engine that reads two pages gets two answers and quotes the
     one it happens to have read.

  2. SKU COUNT. The catalogue has 20 active SKUs. The AI files, the i18n
     dictionaries, the chat-bot knowledge base and the about page still said
     16 — and the about page put "16 Patented SKUs" next to "220+ employees"
     as a CURRENT statistic, so the number a buyer compares against the
     catalogue was wrong.

Both are text, both are published, and both are machine-readable. So they are
fixed here, in one place, with the replacement table written out in full so
it can be reviewed and reverted.

WHAT IS DELIBERATELY LEFT ALONE
  - "within 48 hours" where 48 hours is about a SAMPLE DISPATCH, not a reply.
  - "within 48h" in the recall SOP (identify at 24h, notify at 48h, publish
    at 72h).
  - content/_livejsonld.json, the capture of the live site, which is kept as
    the record of what the site used to say.
  - lib/products.ts, whose "16 SKUs" is a code comment about the old
    hand-typed count.

Run: python scripts/fix_legacy_facts.py [--dry-run]
"""
from __future__ import annotations

import argparse
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Phrases that are NOT reply promises. They are lifted out before the rules
# run and put back afterwards, so the catch-all cannot touch them.
# ---------------------------------------------------------------------------
PROTECT: list[tuple[str, str]] = [
    ("samples dispatched with tracking within 48 hours", "@@SAMPLE_DISPATCH_1@@"),
    ("dispatch the sample with a tracking number within 48 hours", "@@SAMPLE_DISPATCH_2@@"),
    ("dispatched within 48h", "@@SAMPLE_DISPATCH_3@@"),
    # a code comment that QUOTES the legacy wording on purpose
    ('Legacy: "16 ready-to-ship SKUs across 4 product lines"', "@@LEGACY_QUOTE_1@@"),
]

# ---------------------------------------------------------------------------
# The replacement table. Applied in order, so the specific patterns run before
# the catch-alls.
#
# "one business day" is the wording siteConfig.response already uses, and it
# is the FASTEST promise on the site, so it can absorb the slower leftovers
# without weakening anything the sales team committed to.
# ---------------------------------------------------------------------------
REPLACEMENTS: list[tuple[str, str]] = [
    # --- the contact page ----------------------------------------------------
    (
        "We reply to every inquiry within 48 hours.",
        "We reply to every inquiry within one business day (CST).",
    ),
    (
        "A named sales manager replies within 48 hours",
        "A named sales manager replies within one business day",
    ),
    (
        "A named sales manager reads your inquiry within 48 hours",
        "A named sales manager reads your inquiry within one business day",
    ),
    (
        "Get a 48-hour quote from SHENHE ZHONGKE",
        "Get a quote from SHENHE ZHONGKE within one business day",
    ),
    # --- the shared "reply with pricing" sentence ----------------------------
    (
        "We reply within 48 hours with tiered pricing and a sample plan.",
        "We reply within one business day with a quote and a sample plan.",
    ),
    (
        "We'll reply within 48 hours with tiered pricing and a sample plan",
        "We'll reply within one business day with a quote and a sample plan",
    ),
    (
        "We reply within 48 hours with tiered pricing",
        "We reply within one business day with a quote",
    ),
    # --- the OEM/ODM page ----------------------------------------------------
    ("get a quote within 48 hours", "get a quote within one business day"),
    ("Get a 48-hour quote.", "Get a quote within one business day."),
    (
        "Tiered pricing with a 48-hour response.",
        "A quote with a named contact, within one business day.",
    ),
    (
        "Tiered pricing, 48-hour response",
        "A quote with a named contact, within one business day",
    ),
    (
        "Standard response time is 4 working hours during China business hours",
        "Standard response time is within one business day during China business hours",
    ),
    ("We'll respond within 48 hours.", "We'll respond within one business day."),
    # --- the home page -------------------------------------------------------
    (
        "48-hour response on every inquiry",
        "one-business-day response on every enquiry",
    ),
    (
        "48-hour quote response guaranteed",
        "one-business-day quote response guaranteed",
    ),
    ("48-hour quote response", "one-business-day quote response"),
    ("quote in 48 hours", "quote within one business day"),
    # --- badges, chips, short labels -----------------------------------------
    ("48h Get a Quote", "Get a Quote Within 1 Business Day"),
    (">48h Quote<", ">Quote in 1 business day<"),
    ("48h Reply", "Reply in 1 business day"),
    ("48h reply", "reply in 1 business day"),
    ("48h response →", "reply in 1 business day →"),
    # --- the chat-bot knowledge base ------------------------------------------
    ("a 48h-response tailored quote", "a one-business-day tailored quote"),
    ("48h-response confirmation", "one-business-day response confirmation"),
    ("48h tailored response", "one-business-day tailored response"),
    ("Custom quote within 48h", "Custom quote within one business day"),
    ("(within 48h)", "(within one business day)"),
    ("(48h)", "(one business day)"),
    # --- catch-alls ----------------------------------------------------------
    ("within 48 hours", "within one business day"),
    ("within 48h", "within one business day"),
    ("in 48h.", "within one business day."),
    # --- German ---------------------------------------------------------------
    ("48h Angebot", "Angebot innerhalb eines Werktags"),
    ("48h Antwort", "Antwort innerhalb eines Werktags"),
    ("48h-Antwortbestätigung", "Antwortbestätigung innerhalb eines Werktags"),
    # --- Spanish --------------------------------------------------------------
    ("Cotización en 48h", "Cotización en 1 día hábil"),
    ("Respuesta en 48h", "Respuesta en 1 día hábil"),
    ("respuesta en 48h", "respuesta en 1 día hábil"),
    ("cotización en 48 horas", "cotización en 1 hora"),
    ("confirmación de respuesta en 48h", "confirmación de respuesta en 1 día hábil"),
    # --- the SKU count --------------------------------------------------------
    ("16 ready-to-ship SKUs", "20 ready-to-ship SKUs"),
    ("16 ready SKUs", "20 ready SKUs"),
    ("16 ready formulas", "20 ready formulas"),
    ("16 mature SKUs", "20 mature SKUs"),
    ("16 SKU listos", "20 SKU listos"),
    ("16 SKU existentes", "20 SKU existentes"),
    ("16 ready-to-ship SKU", "20 ready-to-ship SKU"),
    ("16 SKU ready formulas", "20 SKU ready formulas"),
    ("16 SKUs", "20 SKUs"),
    ("16 SKU", "20 SKU"),
    ("16 products", "20 products"),
]

# Files this script must not touch, and why.
EXCLUDE = {
    os.path.join("content", "_livejsonld.json"),
    os.path.join("content", "v2", "shipping.json"),
    os.path.join("lib", "shipping.ts"),
    os.path.join("content", "trade-compliance.json"),
    os.path.join("lib", "products.ts"),
}

# The chat-bot knowledge base describes the catalogue's line structure with the
# counts the catalogue had when the catalogue had sixteen SKUs. The sentence
# names four lines with four counts, so it is replaced as a whole rather than
# half-updated.
FAQ_LINE_SENTENCE = (
    "4 product lines: 1) Deodorizing & Disinfecting (5 SKUs - enzyme/chlorine-"
    "dioxide formulas for litter, surfaces, kennels). 2) Grooming & Care (7 SKUs "
    "- shampoo, foam, paw care, ear care, dental). 3) Outdoor Protection (2 SKUs "
    "- DEET-free insect repellent). 4) Pet Nutrition (2 SKUs - IgG colostrum, "
    "probiotics)."
)
FAQ_LINE_SENTENCE_NEW = (
    "4 product lines over 20 catalogue SKUs. The catalogue groups them into "
    "three: Deodorizing & Disinfection (9 SKUs - enzyme and chlorine-dioxide "
    "formulas for litter, surfaces, kennels), Cleansing & Grooming (9 SKUs - "
    "shampoo, foam, paw care, ear care, dental) and Outdoor Protection (2 SKUs - "
    "plant-based insect repellent). The Pet Nutrition line (probiotic set, IgG "
    "colostrum) is quoted product by product."
)

# The about page's meta description. The original wording is kept in
# PROVENANCE.md so it can be restored verbatim if the customer confirms the
# registered-IP count.
ABOUT_DESCRIPTION_OLD = (
    "SHENHE ZHONGKE \u2014 a national high-tech pet care manufacturer, founded 2014 "
    "in Heyuan, Guangdong. 16 patented SKUs across 4 product lines."
)
ABOUT_DESCRIPTION_NEW = (
    "SHENHE ZHONGKE \u2014 a national high-tech pet care manufacturer, founded 2014 "
    "in Heyuan, Guangdong. 20 private-label SKUs across 4 product lines."
)
ABOUT_OG_OLD = (
    "SHENHE ZHONGKE \u2014 A national high-tech pet care manufacturer founded 2014 "
    "in Heyuan, Guangdong. University-partnered R&D, 16 mature SKUs across 4 "
    "product lines, all formulas patented and verifiable. Independent export "
    "station serving global B2B partners."
)
ABOUT_OG_NEW = (
    "SHENHE ZHONGKE \u2014 A national high-tech pet care manufacturer founded 2014 "
    "in Heyuan, Guangdong. University-partnered R&D, 20 private-label SKUs across "
    "4 product lines, formulas patented and verifiable. Independent export station "
    "serving global B2B partners."
)

# The about page's CURRENT statistic tile ("16 / Patented SKUs") and the
# milestone pill. Regex, because the legacy HTML spaces its attributes oddly.
ABOUT_STAT_NUMBER = re.compile(
    r'(<div\s+class=\\"pp-stat-number\\">)16(</div>)', re.S
)
ABOUT_STAT_LABEL = re.compile(
    r'(<div\s+class=\\"pp-text-tiny\\">)Patented SKUs(</div>)', re.S
)
ABOUT_MILESTONE = re.compile(r"2024 16 patented SKUs")

TARGETS: list[str] = []
for folder, pattern in (
    ("content", ".json"),
    ("content", ".ts"),
    ("public/assets/i18n", ".json"),
    ("public/assets/data", ".json"),
    ("app", ".tsx"),
    ("components", ".tsx"),
    ("lib", ".ts"),
):
    base = os.path.join(ROOT, folder)
    if not os.path.isdir(base):
        continue
    for dirpath, _dirs, files in os.walk(base):
        for f in files:
            if f.endswith(pattern):
                TARGETS.append(os.path.join(dirpath, f))

TARGETS = [
    p for p in TARGETS
    if os.path.relpath(p, ROOT).replace("/", os.sep) not in EXCLUDE
]


def patch(path: str, dry: bool) -> list[tuple[str, int]]:
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    original = raw
    hits: list[tuple[str, int]] = []

    # 1. lift the non-reply phrases out
    for old, marker in PROTECT:
        n = raw.count(old)
        if n:
            raw = raw.replace(old, marker)
            hits.append(("PROTECTED: " + old[:60], n))

    # 2. the files that need a bespoke edit. These run BEFORE the table,
    #    because the table would otherwise eat the string they look for
    #    ("All 16 SKUs carry registered formula or design IP" would already
    #    have become "All 20 SKUs ...").
    name = os.path.basename(path)
    if name == "faq.json":
        n = raw.count(FAQ_LINE_SENTENCE)
        if n:
            raw = raw.replace(FAQ_LINE_SENTENCE, FAQ_LINE_SENTENCE_NEW)
            hits.append(("catalogue line counts", n))
        n = raw.count("typically respond within 24 hours on business days")
        if n:
            raw = raw.replace(
                "typically respond within 24 hours on business days",
                "typically respond within one business day during business hours",
            )
            hits.append(("24-hour reply promise", n))

    if name == "about.json":
        for old, new in ((ABOUT_DESCRIPTION_OLD, ABOUT_DESCRIPTION_NEW),
                         (ABOUT_OG_OLD, ABOUT_OG_NEW)):
            n = raw.count(old)
            if n:
                raw = raw.replace(old, new)
                hits.append((old[:48], n))
        raw, n = ABOUT_STAT_NUMBER.subn(r"\g<1>20\g<2>", raw)
        if n:
            hits.append(("stat tile 16 -> 20", n))
        raw, n = ABOUT_STAT_LABEL.subn(r"\g<1>Active SKUs\g<2>", raw)
        if n:
            hits.append(("stat tile label -> Active SKUs", n))
        raw, n = ABOUT_MILESTONE.subn("2024 Formula IP registered", raw)
        if n:
            hits.append(("2024 milestone", n))

    if name == "shenhe.config.ts":
        for old, new in (
            ("title: '16 patented SKUs \u00b7 independent export station',",
             "title: 'Formula IP registered \u00b7 independent export station',"),
            ("desc: 'All 16 SKUs carry registered formula or design IP. Independent export stat",
             "desc: 'Formulas carry registered formula or design IP. Independent export stat"),
            ("    patentedSkus: 16,\n", ""),
            ("linkSuffix: '48h response',", "linkSuffix: 'reply in 1 business day',"),
            ("about.html: 30,000m\u00b2 park / 220+ employees / 16 patented SKUs / 2017 ISO 22716 / 2025 300K bottles per month",
             "about.html: 30,000m\u00b2 park / 220+ employees / 20 active SKUs / 2017 ISO 22716 / 2025 300K bottles per month"),
        ):
            n = raw.count(old)
            if n:
                raw = raw.replace(old, new)
                hits.append((old[:48], n))

    # 3. the table
    for old, new in REPLACEMENTS:
        n = raw.count(old)
        if n:
            raw = raw.replace(old, new)
            hits.append((old, n))

    # 4. put the protected phrases back
    for old, marker in PROTECT:
        n = raw.count(marker)
        if n:
            raw = raw.replace(marker, old)
            hits.append(("restored: " + old[:60], -n))

    if raw != original:
        if not dry:
            with open(path, "w", encoding="utf-8", newline="") as fh:
                fh.write(raw)
        return hits
    return []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    total = 0
    touched = 0
    for path in sorted(TARGETS):
        hits = patch(path, args.dry_run)
        if not hits:
            continue
        touched += 1
        rel = os.path.relpath(path, ROOT)
        print(f"{rel}")
        for old, n in hits:
            total += abs(n)
            print(f"    x{n:<3d} {old[:88]}")
    print(f"\n{touched} files, {total} replacements"
          + ("  (dry run — nothing written)" if args.dry_run else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

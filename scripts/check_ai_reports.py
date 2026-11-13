#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE AI READING LISTS, AGAINST THE REPORT RECORD.

WHAT THIS IS FOR
The files an answer engine reads - llms.txt, llms-full.txt, llms-full.json -
are the only place this site says what it has in a form an engine can lift
whole. The product lines in them carry the claim and the minimum order. The
report lines used to carry a report number and a fingerprint and nothing
else, so an engine reading them could see that ten reports existed and could
not quote a single measured number, and had no address to send a buyer to.

THE TRAFFIC SAYS WHAT THAT COSTS
In eleven days the AI crawlers read the report pages forty times and sent
nobody to one. The product pages were cited. The report pages were fetched
and dropped - an engine that has nothing quotable on a page does not send
a buyer there, however many times it reads it.

So the finding goes into the reading lists, and this gate is what keeps it
there.

WHAT IT CHECKS
  1. every report in public/reports.json appears, with its number and its
     finding, in llms.txt, in llms-full.txt and in llms-full.json;
  2. the report page carries the number in its heading;
  3. the build date is the same in the three places that carry it.

ON THE THIRD ONE
The build date lives in lib/seo/build-date.ts, in scripts/gen-reports-index.mjs
and in scripts/build_ai_files.py. They had drifted apart - 2026-11-02,
2026-11-02 and 2026-10-22 - and a crawler that reads one page saying
2026-11-02 and another saying 2026-10-22 learns that the date on a page
means nothing. Three copies of one date are one fact, and this is what
keeps them one fact.

Run:  python scripts/check_ai_reports.py
"""
from __future__ import annotations

import html as html_mod
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


def fail(msg: str) -> None:
    problems.append(msg)


def page_text(html: str) -> str:
    """What a reader of the page actually sees.

    The finding is compared against the TEXT of the page, not against the
    markup. One of the findings is "Hydrogen sulfide 0.15 → <0.010 mg/m³",
    and the "<" is written into the markup as "&lt;" - so a check that
    compares the raw string against the raw HTML fails on a page that
    carries the finding perfectly well. The question is whether a reader
    can see it, and that is a question about the text.
    """
    text = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return html_mod.unescape(text)


def section(text: str, header: str) -> str:
    """One section of a reading list, from its heading to the next one.

    "Is the finding in the file" is too weak a question. The finding can
    be in the lab-reports list and missing from the site map, and the
    engine reads both. So the check is done per line: the line that
    names a report has to say what the report found.
    """
    i = text.find(header)
    if i < 0:
        return ""
    j = text.find("\n## ", i + 1)
    return text[i:j] if j > 0 else text[i:]


def line_with(text: str, needle: str) -> str:
    """The one line that mentions the needle, or the empty string."""
    for line in text.splitlines():
        if needle in line:
            return line
    return ""


def main() -> int:
    reports_path = os.path.join(PUBLIC, "reports.json")
    if not os.path.exists(reports_path):
        print("FAIL  public/reports.json is not there — run gen-reports-index.mjs first")
        return 1
    try:
        with io.open(reports_path, "r", encoding="utf-8") as f:
            reports = json.load(f).get("reports", [])
    except (OSError, ValueError) as e:
        print("FAIL  public/reports.json cannot be read: %s" % e)
        return 1
    if not reports:
        print("FAIL  public/reports.json holds no reports")
        return 1

    # ---- 1. the reading lists
    llms = read(os.path.join(PUBLIC, "llms.txt"))
    llms_full = read(os.path.join(PUBLIC, "llms-full.txt"))
    try:
        with io.open(os.path.join(PUBLIC, "llms-full.json"), "r", encoding="utf-8") as f:
            machine = json.load(f)
    except (OSError, ValueError) as e:
        fail("llms-full.json cannot be read: %s" % e)
        machine = {}

    machine_reports = {r.get("reportNumber"): r for r in (machine.get("reports") or [])}

    # The two places a reading list names a report. The lab-reports list
    # says what each report found; the site map says what each report
    # PAGE holds. Both are read by an engine, and a report that is named
    # in one and bare in the other is a report the engine cannot quote.
    LISTS = (
        ("llms.txt", llms, "## Site structure"),
        ("llms-full.txt", llms_full, "## Page index"),
    )
    LAB_LISTS = (
        ("llms.txt", llms),
        ("llms-full.txt", llms_full),
    )

    for r in reports:
        number = r.get("reportNumber") or ""
        finding = (r.get("finding") or "").strip()
        page = r.get("page") or ""
        if not number:
            fail("a report in reports.json has no number")
            continue
        if not finding:
            fail("%s: reports.json carries no finding for it" % number)
            continue

        for name, text, header in LISTS:
            line = line_with(section(text, header), page or number)
            if not line:
                fail("%s: the site map does not name the report %s" % (name, number))
            elif finding not in line:
                fail("%s: the site map line for %s does not say what it found — %r" % (name, number, line))

        for name, text in LAB_LISTS:
            lab = section(text, "## Third-party lab reports")
            line = line_with(lab, number)
            if not line:
                fail("%s: the lab-reports list does not name %s" % (name, number))
            elif finding not in line:
                fail("%s: the lab-reports line for %s does not carry the finding — %r" % (name, number, line))
            if page and page not in lab:
                fail("%s: the lab-reports list does not carry the page address %s" % (name, page))

        rec = machine_reports.get(number)
        if rec is None:
            fail("llms-full.json: no record for the report %s" % number)
        else:
            if (rec.get("finding") or "").strip() != finding:
                fail("llms-full.json: the finding for %s is not the record's" % number)
            if page and (rec.get("page") or "") != page:
                fail("llms-full.json: the page for %s is not the record's" % number)
            if not rec.get("issuer"):
                fail("llms-full.json: the record for %s names no laboratory" % number)

    # ---- 2. the report page carries the number in its heading
    for r in reports:
        number = r.get("reportNumber") or ""
        page = r.get("localPage") or ""
        if not page:
            continue
        html = read(os.path.join(OUT, page.lstrip("/")))
        if not html:
            fail("the built report page %s is not there" % page)
            continue
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        heading = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""
        if number not in heading:
            fail("%s: the heading does not carry the report number — %r" % (page, heading))
        finding = (r.get("finding") or "").strip()
        if finding and finding not in page_text(html):
            fail("%s: the page does not carry the finding" % page)

    # ---- 3. one build date, written down once
    #
    # THE DATE USED TO LIVE IN THREE PLACES, AND THIS GATE ONLY COMPLAINED.
    #
    # lib/seo/build-date.ts held it, scripts/gen-reports-index.mjs held it,
    # and scripts/build_ai_files.py held it. The check below compared the
    # three and failed when they disagreed — which is the right complaint,
    # but it is a complaint about a state that should not have been
    # reachable. The reports went on saying 2026-11-08 while the rest of
    # the site said something else, and the fix had to be made by hand
    # every time.
    #
    # So now the date has one home and the other two READ it. The check is
    # now on the shape of the code, not on the agreement of the values:
    # the source must hold the date, and neither reader may hold a literal
    # of its own. A reader that grew a literal again would drift again,
    # and the build says so instead of a person finding out later.
    def date_in(rel: str, pattern: str) -> str:
        m = re.search(pattern, read(os.path.join(ROOT, rel)))
        return m.group(1) if m else ""

    source_date = date_in("lib/seo/build-date.ts", r"BUILD_DATE\s*=\s*'([\d-]+)'")
    if not source_date:
        fail("the build date cannot be read out of lib/seo/build-date.ts")

    readers = (
        "scripts/gen-reports-index.mjs",
        "scripts/build_ai_files.py",
    )
    for rel in readers:
        text = read(os.path.join(ROOT, rel))
        own_literal = date_in(rel, r"(?:BUILD_DATE|TODAY)\s*=\s*['\"][\d-]+['\"]")
        if own_literal:
            fail(
                "%s carries its own build date (%s) — the date lives in "
                "lib/seo/build-date.ts, and this file must read it from there"
                % (rel, own_literal)
            )
        if "build-date.ts" not in text:
            fail(
                "%s does not read the build date from lib/seo/build-date.ts — "
                "one date, one place" % rel
            )

    # ---- 4. every percentage in an AI file is one the site publishes
    #
    # THIS IS THE "0%" RULE
    # The long AI file carried a copy of the certifications page, and the
    # copy carried that page's animated counters at their starting value:
    # three "0%" where the real figures are 94.2%, above 99.999% and 96.6%.
    # The site publishes no 0% figure at all.
    #
    # An engine reading that file could have quoted "0% ammonia removal" -
    # which is the opposite of what the report says, in the file that
    # exists to be quoted from. So: a percentage in an AI file has to be a
    # percentage that appears on the site.
    site_percentages: set[str] = set()
    if os.path.isdir(OUT):
        for dirpath, _dirs, files in os.walk(OUT):
            for fn in files:
                if not fn.endswith(".html"):
                    continue
                body = read(os.path.join(dirpath, fn))
                # WHAT A READER SEES, plus what a machine reads.
                #
                # The markup carries percentages nobody reads: a CSS
                # gradient stop ("#0b0f12 0%") is not a figure this site
                # publishes, and counting it would leave a hole in this
                # rule - an AI file could say "0%" and pass, because the
                # built pages happen to contain a 0% in a gradient. The
                # styles are stripped first, so the set is the figures
                # that are really published: the visible text, and the
                # JSON-LD that a crawler reads.
                visible = page_text(body)
                for num in re.findall(r"(\d+(?:\.\d+)?)\s*%", visible):
                    site_percentages.add(num)
                for block in re.findall(
                    r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', body, re.S | re.I
                ):
                    for num in re.findall(r"(\d+(?:\.\d+)?)\s*%", html_mod.unescape(block)):
                        site_percentages.add(num)
    if not site_percentages:
        fail("the built site holds no percentage at all - the check below cannot run")

    for name in ("llms.txt", "llms-full.txt", "llms-full.json", "ai.txt"):
        text = read(os.path.join(PUBLIC, name))
        if not text:
            fail("%s cannot be read" % name)
            continue
        unknown = sorted({n for n in re.findall(r"(\d+(?:\.\d+)?)\s*%", text) if n not in site_percentages})
        for num in unknown:
            fail("%s: %s%% is not a percentage the site publishes" % (name, num))

    if problems:
        print()
        for p in problems:
            print("FAIL  " + p)
        print()
        print("%d problem(s). An AI file that cannot be quoted from is a page that is" % len(problems))
        print("fetched and dropped.")
        return 1
    print("ok    the reading lists carry all %d reports, with their findings and their pages" % len(reports))
    print("ok    the build date is written once (%s) and read from there by the other two" % source_date)
    return 0


if __name__ == "__main__":
    sys.exit(main())

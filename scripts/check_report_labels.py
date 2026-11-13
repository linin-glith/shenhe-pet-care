#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONE REPORT, ONE DESCRIPTION.

The site publishes ten third-party laboratory reports. Each one is
described in several places: the report page, the product pages that
carry the report, the certifications page and the machine files. They
all read from one record - content/v2/reports.ts, which the generator
writes out of the one place the reports are written down
(app/(site)/certifications/page.tsx).

WHAT WENT WRONG
2024FM11612R02D is a microbiological and quality test - an aerobic
bacterial count, thermotolerant coliforms, a total effective substance
and a pH, against QB/T 4524-2013. The record called it an "ingredient
disclosure", and it printed that label on the report page, on three
product pages, on the certifications page and in the machine files. A
buyer asking for an ingredient list would have been sent to a document
with no ingredient list in it.

THE SECOND HALF OF THE STORY
The label was corrected in the record, and the product page still said
the old thing - because the build order put `next build` BEFORE the
generator that writes content/v2/reports.ts. The product pages were
built from the PREVIOUS build's record, so the site carried two
descriptions of one report at the same time, and no gate noticed.

So this checks the BUILT site:

  1. every report page carries the record's title and its test name;
  2. every product page that names a report names it the way the record
     does - the label beside the report number is the record's, not a
     copy somebody typed;
  3. the phrase the wrong label used is nowhere on the site.

The record is the one truth. This checks that the pages agree with it.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
RECORDS = os.path.join(ROOT, "content", "v2", "reports.ts")

# The label the wrong record used. It is not a banned word - the site's
# own compliance pages say "NICCAS / AICIS ingredient disclosure" about
# a service it really does offer. This is the SENTENCE the record used
# for a report that carries no ingredient list.
RETIRED = "full ingredient disclosure"


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def records():
    """The record: number -> title, test, note."""
    text = read(RECORDS)
    out = {}
    for m in re.finditer(
            r'number:\s*"([^"]+)"[\s\S]{0,900}?\n  \}', text):
        block = m.group(0)
        number = m.group(1)
        entry = {}
        for key in ("title", "test", "note"):
            mm = re.search(r'%s:\s*"((?:[^"\\]|\\.)*)"' % key, block)
            if mm:
                entry[key] = mm.group(1).replace('\\"', '"')
        if number:
            out[number] = entry
    return out


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1
    if not os.path.exists(RECORDS):
        print("FAIL  content/v2/reports.ts is not there - the generator has not run")
        return 1

    rec = records()
    if not rec:
        print("FAIL  no report was read out of content/v2/reports.ts")
        return 1

    problems = []
    checked_pages = 0
    checked_rows = 0

    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in names:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            rel = os.path.relpath(path, OUT).replace("\\", "/")
            html = read(path)
            checked_pages += 1

            if RETIRED in html:
                problems.append(
                    "%s: the page carries the retired phrase %r - a report that has no "
                    "ingredient list in it cannot be described by one" % (rel, RETIRED)
                )

            # A report page carries its record's title and its test name.
            m = re.search(r"/reports/([0-9a-z]+)\.html$", "/" + rel)
            if m:
                slug = m.group(1)
                for number, entry in rec.items():
                    if not entry.get("title"):
                        continue
                    if number.lower().replace("-", "").replace("/", "") == slug.replace(
                            "-", "").replace("/", ""):
                        if entry["title"] not in html:
                            problems.append(
                                "%s: the report page does not carry the record's title %r"
                                % (rel, entry["title"])
                            )
                        if entry.get("test") and entry["test"] not in html:
                            problems.append(
                                "%s: the report page does not carry the record's test name %r"
                                % (rel, entry["test"])
                            )

            # A product page that names a report names it the way the
            # record does. The row is: <a>Report 2024FM11612R02D</a><span>
            # Ingredient disclosure · code L2XB63B9 · batch 2024061102</span>
            for mm in re.finditer(
                    r">Report ([A-Za-z0-9]+)</a><span[^>]*>([^<]{0,90}?) \u00b7 code",
                    html):
                number, label = mm.group(1), mm.group(2)
                entry = rec.get(number)
                checked_rows += 1
                if not entry:
                    problems.append("%s: it names the report %s, which is not in the record"
                                    % (rel, number))
                    continue
                if entry.get("test") and entry["test"] not in label:
                    problems.append(
                        "%s: the report %s is described as %r here, and the record says %r"
                        % (rel, number, label.strip(), entry["test"])
                    )

    if problems:
        print("FAIL  one report, one description")
        for p in problems[:12]:
            print("    " + p)
        return 1

    if checked_rows == 0:
        print("FAIL  no report row was found on any page - the check cannot see anything")
        return 1

    print(
        "ok    every report is described the way the record describes it (%d report(s), "
        "%d report row(s) on %d page(s), and the retired label is nowhere)"
        % (len(rec), checked_rows, checked_pages)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

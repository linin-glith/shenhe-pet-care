#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EVERY SKU HAS A CONCLUSION, AND THE CONCLUSION TELLS THE TRUTH.

WHAT THIS IS FOR
The GEO plan's first item: a conclusion sentence an assistant can lift
whole, for every SKU, not for the eight that happened to have a third-
party report. It lives in the catalogue record (lib/products.json), so
the page, the machine files and this gate all read the same sentence.

THE RULES
  1. Every active SKU carries a conclusion.
  2. A conclusion that names a report names a report that EXISTS.
  3. A conclusion that names a report names one that COVERS that SKU -
     the coverage table is lib/report-coverage.ts, which is what the
     product page itself reads.
  4. A conclusion with no report number says it is a specification
     value. "24-month shelf life" is a number we hold; without the
     marker an assistant can quote it as if a laboratory had measured
     it, and then we are held to a number no document carries.
  5. A conclusion that names a report says which report - the number
     travels with the figure, always.

The first version of rule 4 was "a conclusion with no report number
must contain a digit" - and it passed a sentence that said "good
value" with a digit somewhere in it. The marker is named, not inferred.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, "lib", "products.json")
COVERAGE = os.path.join(ROOT, "lib", "report-coverage.ts")
REPORTS = os.path.join(ROOT, "content", "v2", "reports.ts")

MARKER = "specification value, not third-party tested"
REPORT_IN_TEXT = re.compile(r"report\s+([A-Za-z0-9]+)")
REPORT_NUMBER = re.compile(r'number:\s*"([^"]+)"')
COVERAGE_ENTRY = re.compile(r"(P\d+):\s*\{([^}]*)\}", re.S)
REPORTS_IN_ENTRY = re.compile(r"reports:\s*\[([^\]]*)\]")


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def main():
    problems = []

    catalogue = json.loads(read(CATALOGUE))
    products = [p for p in catalogue.get("products", [])
                if p.get("status", "active") == "active"]

    known = set(REPORT_NUMBER.findall(read(REPORTS)))

    coverage_text = read(COVERAGE)
    coverage = {}
    for m in COVERAGE_ENTRY.finditer(coverage_text):
        sku, body = m.group(1), m.group(2)
        mm = REPORTS_IN_ENTRY.search(body)
        reports = []
        if mm:
            reports = re.findall(r"'([^']+)'", mm.group(1))
        coverage[sku] = reports

    with_report = 0
    for p in products:
        pid = p.get("id", "?")
        conclusion = (p.get("conclusion") or "").strip()
        if not conclusion:
            problems.append("%s: no conclusion sentence" % pid)
            continue
        named = REPORT_IN_TEXT.findall(conclusion)
        if named:
            with_report += 1
            for number in named:
                if number not in known:
                    problems.append("%s: the conclusion names the report %s, which does "
                                    "not exist" % (pid, number))
                    continue
                covered = coverage.get(pid, [])
                if covered and number not in covered:
                    problems.append(
                        "%s: the conclusion names the report %s, and the coverage table "
                        "does not list it for this SKU (it lists %s)"
                        % (pid, number, ", ".join(covered) or "nothing"))
        else:
            if MARKER not in conclusion:
                problems.append(
                    "%s: the conclusion quotes a figure with no report behind it and "
                    "does not say it is a specification value" % pid)

    # AND THE PUBLISHED READING LISTS MAY NOT NAME A REPORT THAT DOES
    # NOT EXIST.
    #
    # The catalogue's claims array was extracted from a PDF and some of
    # its entries are cut mid-word - "report NACCYH250147;" instead of
    # "report NACCYH25014722;" - and a reading list that quotes a
    # truncated report number hands an assistant a number no document
    # carries.
    # AND THE TWO PET-NUTRITION PRODUCTS, WHICH ARE NOT CATALOGUE SKUS.
    #
    # They are quoted one at a time and have no SKU code, so they live
    # in their own record. Their conclusion is their lead line, and it
    # has to carry a figure - they have the best figures on the site -
    # and say that the figure is a COA value.
    nutrition = read(os.path.join(ROOT, "lib", "line-products.ts"))
    leads = re.findall(r"lead:\s*[\"']([^\"']{20,})[\"']", nutrition)
    if len(leads) < 2:
        problems.append("the pet-nutrition products: their lead lines could not be read")
    for lead in leads[:2]:
        if MARKER not in lead:
            problems.append("a pet-nutrition product: its conclusion does not say it is a "
                            "specification value")
        if not re.search(r"\d", lead):
            problems.append("a pet-nutrition product: its conclusion carries no figure")

    # AND ONLY ONE MODULE MAY DEFINE THEM.
    #
    # lib/products.ts and lib/line-products.ts each defined the same
    # two products, and BOTH copies were live - the SEO modules read
    # one, the components read the other. Two copies of a record are two
    # records, and nothing says so when only one is edited.
    definers = []
    for rel in ("lib/products.ts", "lib/line-products.ts"):
        p = os.path.join(ROOT, rel.replace("/", os.sep))
        if not os.path.exists(p):
            continue
        if re.search(r"export const LINE_PRODUCTS", read(p)):
            definers.append(rel)
    if len(definers) != 1:
        problems.append("the pet-nutrition products are defined in %s - one module, "
                        "not several" % (", ".join(definers) or "no module at all"))

    for name in ("llms.txt", "llms-full.txt", "llms-full.json"):
        path = os.path.join(ROOT, "public", name)
        if not os.path.exists(path):
            continue
        text = read(path)
        for m in re.finditer(r"[Rr]eport\s+(?:№\.\s*)?([A-Za-z0-9]{8,})", text):
            number = m.group(1)
            # A report number has an upper-case letter and a digit in it;
            # "the report measured" is a phrase, not a number.
            if not re.search(r"[A-Z]", number) or not re.search(r"\d", number):
                continue
            if number in known:
                continue
            problems.append("%s: it names the report %s, which does not exist"
                            % (name, number))

    if problems:
        print("FAIL  every SKU has a conclusion, and the conclusion tells the truth")
        for p in problems[:12]:
            print("    " + p)
        return 1

    print("ok    every SKU has a conclusion (%d SKU(s): %d with a third-party report and "
          "its number, %d specification values marked as such)"
          % (len(products), with_report, len(products) - with_report))
    return 0


if __name__ == "__main__":
    sys.exit(main())

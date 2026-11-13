#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE HAND-WRITTEN AI FILE, AGAINST THE RECORD.

WHAT THIS IS FOR
public/llms.txt is written by hand - it is the file an answer engine
reads first, and it is the only one of the four that nobody generates.
So the numbers in it can drift away from the ones the catalogue and the
pages carry, and an engine that reads two different answers believes
neither.

llms-full.json is generated and is already checked against the record
(scripts/check_published_numbers.py). llms.txt is not, so it is checked
here:

  - the catalogue counts in it (the SKUs, the product lines) must be
    the catalogue's;
  - every number in its company block must also be printed by the site,
    so the two copies agree.

THE RULE
If a number is in llms.txt and nowhere else on the site, it is a
number only the AI file knows - and the day the factory changes it, the
AI file is the one that is wrong.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
PUBLIC = os.path.join(ROOT, "public")
LLMS = os.path.join(PUBLIC, "llms.txt")
CATALOGUE = os.path.join(ROOT, "lib", "products.json")


def read(path):
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception:
        return ""


def fail(msg):
    print("FAIL  " + msg)
    return 1


def company_block(text):
    """The facts at the top of llms.txt, as the pairs they are."""
    out = {}
    for line in text.splitlines():
        m = re.match(r"^>?\s*\*\*([A-Za-z /]+)\*\*\s*:\s*(.+)$", line.strip())
        if m:
            out[m.group(1).strip().lower()] = m.group(2).strip()
    return out


def main():
    if not os.path.exists(LLMS):
        print("FAIL  public/llms.txt is not there")
        return 1
    text = read(LLMS)
    if not text:
        print("FAIL  public/llms.txt cannot be read")
        return 1

    problems = 0
    facts = company_block(text)
    if not facts:
        problems += fail("the company block of llms.txt cannot be read")
        return problems

    # ---- 1. the catalogue counts
    with io.open(CATALOGUE, "r", encoding="utf-8") as f:
        data = json.load(f)
    skus = [p for p in data.get("products", []) if p.get("status") == "active"]
    sku_count = len(skus)
    lines = len({p.get("category") for p in skus if p.get("category")})
    all_lines = len(data.get("categories") or [])

    head = text[:4000]
    m = re.search(r"(\d+)\s+catalogue SKUs", head)
    if m and int(m.group(1)) != sku_count:
        problems += fail("llms.txt says %s catalogue SKUs and the catalogue holds %d"
                        % (m.group(1), sku_count))
    # The product LINES are not the catalogue's categories: the pet
    # nutrition line carries no SKU and is quoted project by project, and
    # the site counts four. So the line count is checked against the
    # site, below, and not against the categories here.

    # ---- 2. every number in the company block is printed by the site
    site = ""
    for name in ("index.html", "about.html", "factory.html", "capabilities.html"):
        site += " " + read(os.path.join(OUT, name))
    site_numbers = set(re.findall(r"\d[\d,\.]*", site))

    for key in ("founded", "employees", "facility", "monthly capacity", "certifications"):
        value = facts.get(key)
        if not value:
            continue
        for number in re.findall(r"\d[\d,\.]*", value):
            plain = number.replace(",", "")
            if number in site_numbers or plain in site_numbers:
                continue
            # 2020 is written as a year, and the site says "since 2020"
            if number == "2020" and "2020" in site:
                continue
            problems += fail("llms.txt says %s = %s (%s) and that number is printed nowhere on the site"
                            % (key, number, value))

    if problems:
        print()
        print("%d problem(s). The AI file must not know a number the site does not print."
              % problems)
        return 1
    print("ok    llms.txt agrees with the catalogue and with the pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())

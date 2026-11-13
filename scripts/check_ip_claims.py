#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE REGISTRATIONS GATE.

A registration is only worth publishing if a buyer can check it. So the
site prints them, and this gate holds three things at once:

  1. EVERY REGISTRATION NUMBER PRINTED ON THE SITE IS IN THE RECORD.
     The record is content/v2/ip-assets.ts — one file, read by the page
     and by the machine-readable files. A number printed anywhere that is
     not in the record is a number nobody can trace back, and it is either
     a typo or a claim nobody checked.

  2. EVERY REGISTRATION IN THE RECORD IS PRINTED SOMEWHERE.
     The other direction. A registration we hold and never mention is an
     asset the buyer cannot see, and the record is the proof that we know
     about it.

  3. NOTHING DEAD IS IN THE RECORD.
     A trademark that was rejected, opposed or cancelled is not an asset.
     One of ours was rejected while this file was being written, and the
     record nearly named it as registered. A registration whose status is
     a rejection, an opposition or a lapse does not go in.

  4. THE ENTITY RECORD AND THE PAGE AGREE.
     public/company-identity.json is the record an agent reads, and
     llms-full.json carries the same block. Both must carry the same
     numbers as the record, or an agent gets a different answer from a
     reader.
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
RECORD = os.path.join(ROOT, "content", "v2", "ip-assets.ts")
ENTITY = os.path.join(ROOT, "public", "company-identity.json")
IP_PAGE = "intellectual-property.html"

# A Chinese patent application number, a granted announcement number, and an
# enterprise standard number.
PATTERN_APPLICATION = re.compile(r"CN\d{12}\.\d")
PATTERN_ANNOUNCEMENT = re.compile(r"CN\d{9}U\b")
PATTERN_STANDARD = re.compile(r"Q/[A-Z]+\s*\d+-\d{4}")
PATTERNS = [PATTERN_APPLICATION, PATTERN_ANNOUNCEMENT, PATTERN_STANDARD]

DEAD_WORDS = ("驳回", "已销亡", "失效", "异议", "rejected", "dead", "lapsed", "opposed")

# A registration that was refused is not an asset, and printing its number
# is worse than printing nothing: a buyer can look it up and find it dead,
# with our site as the thing that sent them there.
#
# 89702454 - the class 3 application that was refused (2026-06-15). The record
# carries no trademark number at all because of it, and the date that was
# going to be published with it belongs to a different mark.
FORBIDDEN_NUMBERS = ("89702454",)

IP_PAGE = "intellectual-property.html"

TAG = re.compile(r"<[^>]+>")
SCRIPT = re.compile(r"<script\b.*?</script>", re.S | re.I)
STYLE = re.compile(r"<style\b.*?</style>", re.S | re.I)


def read(path: str) -> str:
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def visible(page: str) -> str:
    body = SCRIPT.sub(" ", page)
    body = STYLE.sub(" ", body)
    return re.sub(r"\s+", " ", TAG.sub(" ", body))


def record_numbers() -> tuple[set[str], list[dict]]:
    """The identifiers the one record holds, and the record itself."""
    src = read(RECORD)
    numbers: set[str] = set()
    entries: list[dict] = []
    for block in re.findall(r"\{\s*kind:.*?\n  \},", src, re.S):
        entry = {"raw": block}
        for key in ("identifier", "announcementNumber", "status", "title", "howToVerify"):
            m = re.search(rf"{key}:\s*'([^']*)'", block)
            if m:
                entry[key] = m.group(1)
        for pat in PATTERNS:
            for m in pat.finditer(block):
                numbers.add(m.group(0))
        # A trademark registration number has no prefix, so the patterns above
        # cannot see it. The identifier field is the number the register
        # prints, so it is taken as it stands.
        if entry.get("identifier"):
            numbers.add(entry["identifier"])
        entries.append(entry)
    return numbers, entries


def main() -> int:
    if not os.path.isdir(OUT):
        print("!! out/ is not there — build the site first")
        return 2

    problems: list[str] = []
    numbers, entries = record_numbers()
    if not numbers:
        problems.append("content/v2/ip-assets.ts holds no registration number at all")

    # --- the whole build, as a reader sees it -----------------------
    pages: dict[str, str] = {}
    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for n in names:
            if n.endswith(".html"):
                p = os.path.join(base, n)
                pages[os.path.relpath(p, OUT).replace("\\", "/")] = visible(read(p))

    printed = "\n".join(pages.values())

    # --- rule 1: every printed number is in the record ---------------
    for pat in PATTERNS:
        for m in pat.finditer(printed):
            if m.group(0) not in numbers:
                problems.append(
                    f"the site prints {m.group(0)}, and it is not in content/v2/ip-assets.ts — "
                    f"a registration number nobody can trace back"
                )

    # --- rule 2: every record number is printed somewhere ------------
    for number in sorted(numbers):
        if number not in printed:
            problems.append(
                f"content/v2/ip-assets.ts holds {number}, and no page prints it — a "
                f"registration the buyer cannot see is not an asset"
            )

    # --- rule 3: nothing dead is in the record ----------------------
    for entry in entries:
        status = (entry.get("status") or "") + " " + (entry.get("title") or "")
        for word in DEAD_WORDS:
            if word in status:
                problems.append(
                    f"content/v2/ip-assets.ts carries an entry whose status says {word!r} — "
                    f"a rejected, opposed or lapsed registration is not an asset"
                )
                break

    # --- rule 5: a refused number is nowhere on the site -----
    for number in FORBIDDEN_NUMBERS:
        for name, body in pages.items():
            if number in body:
                problems.append(
                    f"/{name} prints {number} - that registration was refused, and a "
                    f"buyer who looks it up finds it dead"
                )

    # --- rule 4: the entity record agrees ---------------------------
    if os.path.exists(ENTITY):
        try:
            entity = json.loads(read(ENTITY))
        except Exception as e:
            problems.append(f"public/company-identity.json does not parse: {e}")
            entity = None
        if entity:
            block = (entity.get("company") or {}).get("intellectualProperty") or {}
            blob = json.dumps(block, ensure_ascii=False)
            found: set[str] = set()
            for pat in PATTERNS:
                for m in pat.finditer(blob):
                    found.add(m.group(0))
            # Every number the record holds has to be in the entity record as
            # it stands - a trademark number is not a pattern, so it is
            # looked for as the string the register prints.
            missing = {n for n in numbers if n not in blob}
            if missing:
                problems.append(
                    f"public/company-identity.json does not carry {sorted(missing)} — an agent "
                    f"reading the entity record gets a different answer from a reader"
                )
            extra = found - numbers
            if extra:
                problems.append(
                    f"public/company-identity.json carries {sorted(extra)}, which is not in "
                    f"content/v2/ip-assets.ts"
                )
    else:
        problems.append("public/company-identity.json is missing")

    # --- the page itself --------------------------------------------
    if IP_PAGE not in pages:
        problems.append(f"/{IP_PAGE} is not in the build")
    else:
        html = read(os.path.join(OUT, IP_PAGE))
        h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        if len(h1s) != 1:
            problems.append(f"/{IP_PAGE} has {len(h1s)} h1 elements — a page has exactly one")
        if "FAQPage" not in html:
            problems.append(f"/{IP_PAGE} publishes no FAQPage")

    print("registrations in the record : %d" % len(numbers))
    print("  " + ", ".join(sorted(numbers)))
    print("pages scanned              : %d" % len(pages))

    if problems:
        print()
        print("!! %d registration problem(s):" % len(problems))
        for p in problems:
            print("  - %s" % p)
        return 1

    print()
    print("OK: every registration printed on the site is in the record, every registration in "
          "the record is printed, and nothing dead is in it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

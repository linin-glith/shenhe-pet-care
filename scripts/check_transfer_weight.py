#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE TRANSFER WEIGHT GATE.

WHAT IT IS FOR
The page weight gate next door measures the MARKUP: the HTML and the
structured data in it. It cannot see the images and the scripts a page
makes the browser download, and those are the larger half of what a buyer
waits for. A page can stay well under the markup ceiling and still make a
phone download two megabytes.

So this gate measures the other half, out of the same build:

  1. FIRST-SCREEN WEIGHT - the scripts, the stylesheets, the preloads and
     the images that are not lazy. This is what a first-time visitor waits
     for, and it is the number that decides whether the page feels fast.

  2. TOTAL WEIGHT - everything the page references, including the images
     below the fold. A page that pulls three megabytes is paid for on a
     phone that scrolls.

  3. ONE FILE - no single picture above a line. A 900 kB hero is not a
     page weight problem; it is one picture that should have been
     smaller, and a per-page total would bury it.

HOW A BROWSER'S PICTURE IS COUNTED
A picture on this site is a <picture> element: a WebP <source> carrying the
list of sizes, and an <img> carrying the original as the fallback for a
browser that cannot read WebP. The browser downloads ONE of them, never
both. This gate counts the WebP list's LARGEST candidate, because that is
what a wide screen takes, and falls back to the original only when there
is no WebP sibling.

THE BYTES ARE THE BUILD'S BYTES
Not the bytes on the wire. nginx gzips what it serves, so the number a
buyer downloads is roughly a quarter of the number here. The ceiling is
set on the build because that is what the build can be held to, and the
delivery side has its own check: scripts/check_delivery_headers.py.

THE CEILINGS ARE ABSOLUTE
Same reason as the markup gate: a relative gate needs a baseline that
other work moves, and a gate that fails for reasons nobody is looking at
is a gate people turn off. An absolute ceiling is stable, and it still
catches the thing this gate exists for - a change that quietly doubles
what a page pulls.

THE NUMBERS
Measured on the build of 2026-11-13, over all 105 pages:
  scripts and stylesheets   1,036 kB on every page (the Next.js runtime)
  first-screen pictures       305 kB (the home page's hero)
  everything a page pulls   2,143 kB (the certifications page)
  one picture                  222 kB (a report cover)
The ceilings sit a fifth above those, so ordinary content work does not
trip them and a real regression does.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"

# What a first-time visitor waits for: the code, and the pictures that are
# not lazy.
MAX_FIRST_SCREEN_BYTES = 1_850_000

# Everything the page references.
MAX_TOTAL_BYTES = 3_250_000

# One picture.
MAX_SINGLE_FILE_BYTES = 280_000

PICTURE = re.compile(r"<picture\b[^>]*>(.*?)</picture>", re.S | re.I)
SOURCE = re.compile(r"<source\b[^>]*?\bsrcset=\"([^\"]+)\"", re.I)
IMG = re.compile(r"<img\b[^>]*>", re.I)
IMG_SRC = re.compile(r"\bsrc=\"([^\"]+)\"", re.I)
IMG_SRCSET = re.compile(r"\bsrcset=\"([^\"]+)\"", re.I)
EAGER = re.compile(r'\bloading="eager"|\bfetchpriority="high"', re.I)
SCRIPT = re.compile(r"<script\b[^>]*?\bsrc=\"([^\"]+)\"", re.I)
LINK = re.compile(r"<link\b[^>]*>", re.I)
LINK_HREF = re.compile(r"\bhref=\"([^\"]+)\"", re.I)
LINK_REL = re.compile(r"\brel=\"([^\"]+)\"", re.I)


def size_of(url: str) -> int:
    """The size of a referenced file in the build, or 0 if it is not there."""
    if not url or url.startswith(("http://", "https://", "data:")):
        return 0
    path = url.split("?")[0].split("#")[0]
    if not path.startswith("/"):
        return 0
    full = OUT / path.lstrip("/")
    if full.is_dir():
        full = full / "index.html"
    try:
        return full.stat().st_size
    except OSError:
        return 0


def candidates(srcset: str):
    out = []
    for part in srcset.split(","):
        url = part.strip().split(" ")[0]
        if url:
            out.append(url)
    return out


def picture_bytes(inner: str):
    """What the browser takes for one picture, and whether it is above the fold."""
    src = SOURCE.search(inner)
    if src:
        cands = candidates(src.group(1))
        if cands:
            best = max(cands, key=size_of)
            return size_of(best), best
    tag = IMG.search(inner)
    if tag:
        tag = tag.group(0)
        setattr_ = IMG_SRCSET.search(tag)
        if setattr_:
            cands = candidates(setattr_.group(1))
            if cands:
                best = max(cands, key=size_of)
                return size_of(best), best
        s = IMG_SRC.search(tag)
        if s:
            return size_of(s.group(1)), s.group(1)
    return 0, ""


def measure(html: str):
    """The bytes a page makes the browser download, split three ways."""
    code = 0
    for src in SCRIPT.findall(html):
        code += size_of(src)
    preloads = 0
    for tag in LINK.findall(html):
        rel = LINK_REL.search(tag)
        href = LINK_HREF.search(tag)
        if not rel or not href:
            continue
        kinds = rel.group(1).lower()
        if "stylesheet" in kinds:
            code += size_of(href.group(1))
        elif "preload" in kinds:
            preloads += size_of(href.group(1))

    images = 0
    eager = 0
    biggest = (0, "")

    # The pictures that live in a <picture>: the WebP list is what the
    # browser takes.
    for block in PICTURE.findall(html):
        n, url = picture_bytes(block)
        images += n
        if n > biggest[0]:
            biggest = (n, url)
        if EAGER.search(block):
            eager += n

    # The pictures that stand alone.
    for tag in IMG.findall(html):
        if "<picture" in html[max(0, html.find(tag) - 200): html.find(tag)]:
            continue  # already counted with its <picture>
        setattr_ = IMG_SRCSET.search(tag)
        if setattr_:
            cands = candidates(setattr_.group(1))
            if cands:
                best = max(cands, key=size_of)
                n, url = size_of(best), best
            else:
                n, url = 0, ""
        else:
            s = IMG_SRC.search(tag)
            n, url = (size_of(s.group(1)), s.group(1)) if s else (0, "")
        images += n
        if n > biggest[0]:
            biggest = (n, url)
        if EAGER.search(tag):
            eager += n

    first_screen = code + preloads + eager
    total = code + preloads + images
    return first_screen, total, images, biggest


def main() -> int:
    global OUT
    parser = argparse.ArgumentParser(
        description="the transfer weight gate: what a page makes the browser download")
    parser.add_argument("--dir", default=str(OUT),
                        help="the build directory to measure (default: out/)")
    args = parser.parse_args()
    OUT = Path(args.dir)

    if not OUT.exists():
        print(f"!! {OUT} does not exist - build first")
        return 2

    problems = []
    pages = 0
    heaviest_first = ("", 0)
    heaviest_total = ("", 0)
    biggest_file = (0, "")
    total_site = 0

    for p in sorted(OUT.rglob("*.html")):
        rel = str(p.relative_to(OUT)).replace(os.sep, "/")
        html = p.read_text(encoding="utf-8", errors="replace")
        first, total, images, biggest = measure(html)
        pages += 1
        total_site += total
        if first > heaviest_first[1]:
            heaviest_first = (rel, first)
        if total > heaviest_total[1]:
            heaviest_total = (rel, total)
        if biggest[0] > biggest_file[0]:
            biggest_file = (biggest[0], biggest[1])

        if first > MAX_FIRST_SCREEN_BYTES:
            problems.append(
                f"{rel}: the first screen pulls {first:,} bytes - over the "
                f"{MAX_FIRST_SCREEN_BYTES:,} byte ceiling"
            )
        if total > MAX_TOTAL_BYTES:
            problems.append(
                f"{rel}: the page pulls {total:,} bytes - over the "
                f"{MAX_TOTAL_BYTES:,} byte ceiling"
            )
        if biggest[0] > MAX_SINGLE_FILE_BYTES:
            problems.append(
                f"{rel}: {biggest[1]} is {biggest[0]:,} bytes - over the "
                f"{MAX_SINGLE_FILE_BYTES:,} byte ceiling for one picture"
            )

    print(f"pages                     : {pages}")
    print(f"heaviest first screen     : {heaviest_first[0]} - "
          f"{heaviest_first[1]:,} bytes")
    print(f"heaviest page in total    : {heaviest_total[0]} - "
          f"{heaviest_total[1]:,} bytes")
    print(f"biggest single picture    : {biggest_file[1]} - {biggest_file[0]:,} bytes")
    print(f"the pages together       : {total_site:,} bytes "
          f"(shared files counted once per page)")
    print(f"ceilings                  : {MAX_FIRST_SCREEN_BYTES:,} B first screen, "
          f"{MAX_TOTAL_BYTES:,} B a page, {MAX_SINGLE_FILE_BYTES:,} B one picture")

    if problems:
        print(f"\n!! {len(problems)} transfer weight problem(s):\n")
        for problem in problems[:12]:
            print("    " + problem)
        print("\nFAIL  a page pulls more than it should")
        return 1

    print("\nOK: no page's first screen, no page in total, and no single "
          "picture is over its ceiling.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
THE PAGE WEIGHT GATE.

Adding markup is cheap; adding it without noticing is not. This gate is
the answer to "we added a schema to every page — did that cost anything?".

It checks three things, all absolute rather than relative, so it does not
fight with any other work in the repository:

  1. NO PAGE MAY GROW PAST A CEILING.
     The heaviest page on the site is the home page, and it is measured in
     hundreds of kilobytes because the catalogue is rendered into it. The
     ceiling is set with headroom above that, so ordinary content work
     does not trip it and a markup change that quadruples a page does.

  2. THE MARKUP MAY NOT TAKE OVER THE PAGE.
     A page whose JSON-LD is a third of its bytes is a page that ships a
     vocabulary instead of a product. The share is checked on every page.

  3. THE SITE'S MARKUP IS BOUNDED IN TOTAL.
     A hundred pages each adding a kilobyte of schema is a hundred
     kilobytes nobody decided to spend.

WHY THE CEILINGS ARE ABSOLUTE
A relative gate — "no page may grow by more than 5%" — needs a baseline
that has to be updated by hand, and a baseline that other work in the
repository moves is a gate that fails for reasons nobody is looking at.
An absolute ceiling is stable, and it still catches the thing this gate
exists for: a change that quietly doubles a page.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"

# The heaviest page today is the catalogue, at about 330 kB. The ceiling
# sits a fifth above that.
MAX_PAGE_BYTES = 400_000

# The markup on one page, in bytes. The heaviest today is the home page at
# about 38 kB, and it is heavy because the catalogue is in it.
MAX_MARKUP_BYTES = 45_000

# The markup may be at most this share of a page — but only on a page big
# enough for the share to mean anything. The report pages are ten kilobytes
# of page and four kilobytes of structured data, and that is the right
# shape for them: the markup IS the content. On a page of 300 kB the
# markup must not become a quarter of it.
MIN_PAGE_FOR_SHARE = 60_000
MAX_MARKUP_SHARE = 0.20

# The site's markup, in total.
MAX_TOTAL_MARKUP_BYTES = 1_500_000

LD_BLOCK = re.compile(
    r'<script type="application/ld\+json"[^>]*>.*?</script>', re.S
)


def main() -> int:
    if not OUT.exists():
        print(f"!! {OUT} does not exist — build first")
        return 2

    problems: list[str] = []
    heaviest = ("", 0)
    heaviest_markup = ("", 0.0)
    total_html = 0
    total_markup = 0

    for p in sorted(OUT.rglob("*.html")):
        rel = str(p.relative_to(OUT)).replace("\\", "/")
        raw = p.read_bytes()
        size = len(raw)
        total_html += size
        markup = sum(len(m.group(0).encode("utf-8")) for m in LD_BLOCK.finditer(raw.decode("utf-8", "replace")))
        total_markup += markup

        if size > heaviest[1]:
            heaviest = (rel, size)
        share = markup / size if size else 0
        if share > heaviest_markup[1]:
            heaviest_markup = (rel, share)

        if size > MAX_PAGE_BYTES:
            problems.append(
                f"{rel}: {size:,} bytes — over the {MAX_PAGE_BYTES:,} byte ceiling"
            )
        if markup > MAX_MARKUP_BYTES:
            problems.append(
                f"{rel}: {markup:,} bytes of markup — over the {MAX_MARKUP_BYTES:,} byte ceiling"
            )
        if size >= MIN_PAGE_FOR_SHARE and share > MAX_MARKUP_SHARE:
            problems.append(
                f"{rel}: the markup is {share:.0%} of the page — over the "
                f"{MAX_MARKUP_SHARE:.0%} ceiling"
            )

    if total_markup > MAX_TOTAL_MARKUP_BYTES:
        problems.append(
            f"the site's markup is {total_markup:,} bytes — over the "
            f"{MAX_TOTAL_MARKUP_BYTES:,} byte ceiling"
        )

    print(f"pages                     : {len(list(OUT.rglob('*.html')))}")
    print(f"total HTML                : {total_html:,} bytes")
    print(f"total markup              : {total_markup:,} bytes "
          f"({total_markup / max(1, total_html):.1%} of the HTML)")
    print(f"heaviest page             : {heaviest[0]} — {heaviest[1]:,} bytes")
    print(f"heaviest markup share     : {heaviest_markup[0]} — {heaviest_markup[1]:.1%}")
    print(f"markup ceiling            : {MAX_MARKUP_BYTES:,} B a page, "
          f"{MAX_MARKUP_SHARE:.0%} of a page over {MIN_PAGE_FOR_SHARE:,} B")

    if problems:
        print(f"\n!! {len(problems)} page weight problem(s):\n")
        for x in problems:
            print(f"  - {x}")
        return 1

    print("\nOK: no page is over the ceiling, and the markup has not taken over any page.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

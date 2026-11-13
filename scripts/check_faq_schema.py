#!/usr/bin/env python3
"""
THE FAQPage GATE.

A FAQPage schema is a claim: "these questions are answered on this page".
It is the one structured-data type that can be checked against the page
itself, because the questions are on the page in the markup.

So this gate holds the claim to what the page shows:

  1. A page that publishes a FAQPage must show every question the schema
     names. A schema that describes a question the reader cannot find is a
     false claim, and a search engine voids the rich result for it.
  2. A page that shows a question must declare it. Otherwise the markup
     is under-claiming: the answer is on the page and the engine is not
     told, which is the state the product pages were in before this gate
     existed.
  3. One FAQPage per page. An engine reads the first block and ignores
     the rest, so a second block is a claim nobody checks.
  4. No question twice in the same schema.

HOW A VISIBLE QUESTION IS FOUND
The site's Q&A renders as a definition list: the question in the <dt>, the
answer in the <dd>. The questions are NOT all in one section — the product
pages put the ordering questions in the section that carries id="faq" and
the use-and-safety questions in the depth block above it, and the contact
page, the guides and the market pages put theirs in sections with no id
at all. A gate that only looked inside id="faq" called sixteen honest
pages dishonest, which is how a gate teaches people to ignore it.

So the gate reads every <dt> on the page and keeps the ones that are
questions: the ones that end in a question mark. Every specification term
on this site — "Minimum order", "Stock lead time", "Ingredients", "MOQ" —
is a label, not a question, and none of them ends in a question mark.
That test is the only place the gate guesses, and it is checked against
the data on every build: if a page ever asks a question the markup does
not declare, the build stops.

WHAT IT DELIBERATELY DOES NOT CHECK
It does not check that the answers are good, true or complete. It checks
one thing: that the markup and the page say the same thing. A gate that
tried to judge the answers would be a gate nobody would trust.
"""
from __future__ import annotations

import html as htmllib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"

LD_BLOCK = re.compile(
    r'<script type="application/ld\+json"[^>]*>(.*?)</script>', re.S
)
DT = re.compile(r"<dt[^>]*>(.*?)</dt>", re.S)
SUMMARY = re.compile(r"<summary[^>]*>(.*?)</summary>", re.S)
TAG = re.compile(r"<[^>]+>")


def norm(s: str) -> str:
    """The text a reader sees, with the markup taken out."""
    t = TAG.sub(" ", s)
    t = htmllib.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def walk_nodes(value) -> list[dict]:
    """
    Every schema node in a JSON-LD value, however deep.

    The blocks on this site come in three shapes: a bare node, a node
    wrapped in an @graph, and — on the product pages — a node wrapped in an
    @graph that is itself wrapped in an @graph. A reader that stops at the
    first level misses half the site's FAQ blocks and reports pages that
    have a schema as pages that have none.
    """
    found: list[dict] = []
    if isinstance(value, list):
        for item in value:
            found.extend(walk_nodes(item))
    elif isinstance(value, dict):
        found.append(value)
        graph = value.get("@graph")
        if isinstance(graph, list):
            for item in graph:
                found.extend(walk_nodes(item))
    return found


def schema_faq_pages(page: str) -> list[list[str]]:
    """Every FAQPage block on the page, as the list of question names."""
    out = []
    for m in LD_BLOCK.finditer(page):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        for node in walk_nodes(data):
            if node.get("@type") != "FAQPage":
                continue
            names = []
            for q in node.get("mainEntity", []) or []:
                if isinstance(q, dict):
                    names.append(norm(str(q.get("name", ""))))
            out.append(names)
    return out


def visible_questions(page: str) -> list[str]:
    """
    Every question the page shows.

    A <dt> is a question when it ends in a question mark. Everything else
    in a definition list on this site is a label.
    """
    out = []
    for m in list(DT.finditer(page)) + list(SUMMARY.finditer(page)):
        text = norm(m.group(1))
        if text.endswith("?") and text not in out:
            out.append(text)
    return out


def main() -> int:
    if not OUT.exists():
        print(f"!! {OUT} does not exist — build first")
        return 2

    problems: list[str] = []
    checked = 0
    with_schema = 0
    with_visible = 0
    total_questions = 0

    for p in sorted(OUT.rglob("*.html")):
        rel = str(p.relative_to(OUT)).replace("\\", "/")
        page = p.read_text(encoding="utf-8", errors="replace")
        visible = visible_questions(page)
        blocks = schema_faq_pages(page)
        checked += 1
        if visible:
            with_visible += 1
        if blocks:
            with_schema += 1
        total_questions += len(visible)

        if len(blocks) > 1:
            problems.append(
                f"{rel}: {len(blocks)} FAQPage blocks on one page — an engine reads "
                f"the first and ignores the rest"
            )
            continue

        if blocks:
            names = blocks[0]
            dupes = sorted({n for n in names if names.count(n) > 1})
            if dupes:
                problems.append(f"{rel}: the FAQPage asks the same question twice: {dupes}")
            only_schema = [n for n in names if n not in visible]
            if only_schema:
                problems.append(
                    f"{rel}: the FAQPage names {len(only_schema)} question(s) the page "
                    f"does not show:\n     " + "\n     ".join(only_schema[:8])
                )
            only_page = [n for n in visible if n not in names]
            if only_page:
                problems.append(
                    f"{rel}: the page asks {len(only_page)} question(s) the FAQPage does "
                    f"not declare:\n     " + "\n     ".join(only_page[:8])
                )
        else:
            if visible:
                problems.append(
                    f"{rel}: {len(visible)} question(s) on the page and no FAQPage — the "
                    f"answers are there and the markup does not say so"
                )

    print(f"pages checked              : {checked}")
    print(f"pages showing questions    : {with_visible}")
    print(f"pages publishing a FAQPage : {with_schema}")
    print(f"questions found on pages   : {total_questions}")

    if problems:
        print(f"\n!! {len(problems)} FAQ schema problem(s):\n")
        for x in problems:
            print(f"  - {x}")
        return 1

    print("\nOK: every page that shows questions publishes them, and every published question is on the page.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

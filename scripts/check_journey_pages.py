#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE JOURNEY GATE.

Five pages carry the buyer's order, one stage each: the quotation, the
sample, the production run, the shipment, and what happens afterwards. This
gate is what stops them from rotting.

THE RULES

  1. ALL FIVE PAGES ARE IN THE BUILD. A stage that is linked from the footer
     and not built is a 404 on every page of the site.
  2. EACH HAS EXACTLY ONE H1, AND IT IS THE BUYER'S QUESTION.
     The H1 is not a title, it is the sentence the buyer typed. So it ends
     in a question mark, and it is the question written down in
     content/v2/journey.ts — one list, read by the footer, by the page and
     by this gate, so the three cannot disagree.
  3. EACH PUBLISHES ITS QUESTIONS, AND EVERY PUBLISHED QUESTION IS ON THE
     PAGE. A stage page that answers a question in the markup but not on
     the page is claiming something it does not deliver.
  4. NONE OF THEM PUBLISHES A UNIT PRICE.
     The site is quote-only. A stage page that carries a price turns the
     policy into a promise, and the price gate on the rest of the site
     becomes a special case. The currency amounts these pages are allowed
     to carry are the payment thresholds — the letter-of-credit minimum,
     the sample freight, the insurance limit — and nothing else.
  5. THE FOOTER LINKS ALL FIVE ON EVERY PUBLIC PAGE.
     A stage page nobody links to is an orphan: it gets no link from the
     pages a buyer actually lands on, and the internal link is what tells
     a crawler it is worth reading.
"""
from __future__ import annotations

import html as htmllib
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
JOURNEY_TS = os.path.join(ROOT, "content", "v2", "journey.ts")

H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)
LD_BLOCK = re.compile(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', re.S | re.I)
TAG = re.compile(r"<[^>]+>")
SCRIPT = re.compile(r"<script\b.*?</script>", re.S | re.I)
STYLE = re.compile(r"<style\b.*?</style>", re.S | re.I)
WS = re.compile(r"\s+")

# The same rule the price gate holds: a currency amount, and the ones these
# pages are allowed to carry because they are payment thresholds rather
# than prices.
AMOUNT = re.compile(r"(?:US\$|USD|RMB|\$)\s*\d[\d,]*(?:\.\d+)?\s*[MK]?")
ALLOWED = {
    "USD30,000": "the L/C threshold - a payment term, not a price",
    "$30,000": "the L/C threshold, written with a dollar sign",
    "USD100,000": "the ICC arbitration minimum",
    "USD200": "the custom-formula sample fee",
    "USD500": "the CPSR fee",
    "USD30": "the sample freight",
    "USD1M": "the product liability insurance limit, abbreviated",
    "USD2M": "the product liability insurance limit, abbreviated",
    "USD5M": "the product liability insurance limit, abbreviated",
    "USD1,000,000": "the product liability insurance limit per occurrence",
    "USD5,000,000": "the product liability insurance limit in aggregate",
}

MIN_FAQ_QUESTIONS = 5


def norm(s: str) -> str:
    return WS.sub(" ", htmllib.unescape(TAG.sub(" ", s))).strip()


def visible_text(html: str) -> str:
    body = SCRIPT.sub(" ", html)
    body = STYLE.sub(" ", body)
    return WS.sub(" ", TAG.sub(" ", body)).strip()


def read(path: str) -> str:
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def journey_stages() -> list[dict]:
    """The stages, read out of the one list the footer and the pages use."""
    src = read(JOURNEY_TS)
    stages = []
    for block in re.findall(r"\{\s*href:\s*'([^']+)',(.*?)\}", src, re.S):
        href, rest = block
        label = re.search(r"label:\s*'([^']*)'", rest)
        question = re.search(r"question:\s*'([^']*)'", rest)
        stages.append(
            {
                "href": href,
                "label": label.group(1) if label else "",
                "question": question.group(1) if question else "",
            }
        )
    return stages


def faq_questions(html: str) -> list[str]:
    out: list[str] = []
    for m in LD_BLOCK.finditer(html):
        try:
            data = json.loads(m.group(1).strip())
        except Exception:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, list):
                stack.extend(node)
            elif isinstance(node, dict):
                if node.get("@type") == "FAQPage":
                    for q in node.get("mainEntity", []) or []:
                        if isinstance(q, dict):
                            out.append(norm(str(q.get("name", ""))))
                for v in node.values():
                    if isinstance(v, (dict, list)):
                        stack.append(v)
    return out


def main() -> int:
    if not os.path.isdir(OUT):
        print("!! out/ is not there - build the site first")
        return 2

    stages = journey_stages()
    if len(stages) != 5:
        print("!! content/v2/journey.ts does not hold five stages (found %d)" % len(stages))
        return 1

    problems: list[str] = []
    built = {}
    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for n in names:
            if n.endswith(".html"):
                p = os.path.join(base, n)
                built[os.path.relpath(p, OUT).replace("\\", "/")] = read(p)

    # --- rules 1 to 4, one page at a time ------------------------------
    for stage in stages:
        rel = stage["href"].lstrip("/")
        if rel not in built:
            problems.append("%s is not in the build - the footer links it on every page" % stage["href"])
            continue
        html = built[rel]

        h1s = [norm(h) for h in H1.findall(html)]
        if len(h1s) != 1:
            problems.append("%s has %d h1 elements - a page has exactly one" % (rel, len(h1s)))
        else:
            h1 = h1s[0]
            if not h1.endswith("?"):
                problems.append("%s: the h1 is not a question - it should be what the buyer typed: %r" % (rel, h1))
            if stage["question"] and h1 != stage["question"]:
                problems.append(
                    "%s: the h1 does not match the question in content/v2/journey.ts\n"
                    "     page    : %s\n     journey : %s" % (rel, h1, stage["question"])
                )

        questions = faq_questions(html)
        if len(questions) < MIN_FAQ_QUESTIONS:
            problems.append(
                "%s publishes %d FAQPage questions - a stage page that answers one question "
                "is not a stage page" % (rel, len(questions))
            )
        visible = [q for q in H1.findall(html)]
        page_text = visible_text(html)
        for q in questions:
            if q and q not in page_text:
                problems.append("%s: the FAQPage publishes a question the page does not show: %s" % (rel, q[:80]))

        text = visible_text(html)
        for m in AMOUNT.finditer(text):
            token = m.group(0).replace(" ", "").replace("US$", "USD")
            if token not in ALLOWED:
                problems.append(
                    "%s: %r is a currency amount, and this site does not publish prices" % (rel, m.group(0))
                )

    # --- rule 5: the footer links all five on every public page --------
    public = [rel for rel, html in built.items() if "<footer" in html]
    for stage in stages:
        missing = [rel for rel in public if stage["href"] not in built[rel]]
        if missing:
            problems.append(
                "%s is not linked from the footer on %d page(s) - the first is %s"
                % (stage["href"], len(missing), missing[0])
            )

    print("stages checked          : %d" % len(stages))
    print("public pages with a footer: %d" % len(public))
    for stage in stages:
        rel = stage["href"].lstrip("/")
        ok = rel in built
        print("   %-22s %s" % (stage["href"], "in the build" if ok else "MISSING"))

    if problems:
        print()
        print("!! %d journey problem(s):" % len(problems))
        for p in problems:
            print("  - %s" % p)
        return 1

    print()
    print("OK: five stages, one H1 each in the buyer's own words, their questions published, "
          "no unit price, and every stage linked from the footer.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

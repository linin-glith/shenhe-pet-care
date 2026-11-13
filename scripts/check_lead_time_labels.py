#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE 25-40 DAY WINDOW MUST NOT BE CALLED "OEM" - IN ANY WORD ORDER.

WHY
On this site OEM means the BUYER's formula - a 30-45 day job - and that is
not a field of any product. The per-product windows are the stock one
(7-15 days) and the private-label one (25-40 days). The record that holds
the second one is called `lead_time_days_oem`, and that name leaked into
twenty product pages and the home page, where it was rendered next to the
value 25-40.

So a buyer who reads the trade page (where OEM is defined as their own
formula, 30-45 days) and then a product page (where the same label means
25-40 days) was told two different things by the same site. That is worse
than a grammar mistake: it is the site contradicting itself about when the
goods arrive.

THE BLIND SPOT THIS VERSION CLOSES
The first version of this gate looked for the literal string "OEM lead
time". The labels that survived it were the INVERTED ones - "Lead time . OEM"
and "Lead . OEM" - and a gate that can only read one word order cannot see
them. So the rule is now about the LABEL, not about a phrase:

  - "OEM" next to a lead term, with no punctuation between them
  - a lead term and "OEM" separated by a separator character (. | / - -)

and the stock labels have their own rule, because "Lead time . stock" is
also a label rather than a sentence.

WHAT IS NOT A LABEL
"Lead time: 7-14 days. Request a quote for OEM/ODM orders." - there "OEM"
and "lead" belong to different sentences, and no separator joins them.

WHAT IT ALSO CHECKS
  - the private-label window must be labelled as such
  - the buyer's own formula must still be described as OEM somewhere, so
    that correcting the label does not quietly delete the definition

Run: python scripts/check_lead_time_labels.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

BLOCK = re.compile(r"<(script|style|noscript|svg)\b[\s\S]*?</\1>", re.I)
TAG = re.compile(r"<[^>]+>")

# a lead term and "OEM" that are one label: adjacent, or joined by a
# separator character
OEM_LABEL = re.compile(
    r"\bOEM\b[ \t]{0,2}\b(?:lead|Lead|LEAD)\b"
    r"|\b(?:lead|Lead|LEAD)\b(?:[ \t]{0,2}\b(?:time|Time)\b)?"
    r"[ \t]{0,2}[·•|/\\\-–—][ \t]{0,2}\bOEM\b"
)

# the stock labels have the same shape
STOCK_LABEL = re.compile(
    r"\b(?:lead|Lead|LEAD)\b(?:[ \t]{0,2}\b(?:time|Time)\b)?"
    r"[ \t]{0,2}[·•|/\\\-–—][ \t]{0,2}\bstock\b",
    re.I,
)


def visible(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()
    html = BLOCK.sub(" ", html)
    html = re.sub(r"<!--[\s\S]*?-->", " ", html)
    text = re.sub(r"\s+", " ", TAG.sub(" ", html))
    return text


def pages():
    out = []
    for root, dirs, files in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith("__")]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.join(root, f))
    return sorted(out)


def main():
    if not os.path.isdir(OUT):
        print("FAIL  there is no out/ directory - build the site first")
        return 1

    problems = []
    saw_private_label = False
    saw_buyer_formula = False

    for path in pages():
        rel = os.path.relpath(path, OUT).replace("\\", "/")
        text = visible(path)
        for m in OEM_LABEL.finditer(text):
            problems.append("%s: a label calls the lead time OEM  ...%s..."
                            % (rel, text[max(0, m.start() - 40):m.end() + 20].strip()))
        for m in STOCK_LABEL.finditer(text):
            problems.append("%s: a label calls the stock window something other than "
                            "'Stock lead time'  ...%s..."
                            % (rel, text[max(0, m.start() - 40):m.end() + 20].strip()))
        if "Private-label lead time" in text:
            saw_private_label = True
        if re.search(r"30[–-]45", text) and re.search(r"\bOEM\b", text):
            saw_buyer_formula = True

    if not saw_private_label:
        problems.append("no page calls the 25-40 day window 'Private-label lead time'")
    if not saw_buyer_formula:
        problems.append("nowhere describes the buyer's own formula (30-45 days) as OEM - "
                        "the definition has been lost rather than corrected")

    if problems:
        print("FAIL  the 25-40 day window must not be called OEM")
        for p in problems[:12]:
            print("    %s" % p)
        if len(problems) > 12:
            print("    ... and %d more" % (len(problems) - 12))
        return 1

    print("ok    the two lead-time windows are named apart: stock and private label")
    return 0


if __name__ == "__main__":
    sys.exit(main())

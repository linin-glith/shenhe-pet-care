#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE ENGLISH ON THIS SITE HAS ONE HOUSE STYLE, AND IT HAS NO UNQUALIFIED PROMISES.

WHAT IT CHECKS, ON THE BUILT OUTPUT

1. Spelling. The site writes "enquiry" and "catalogue" (British) and "odor",
   "deodorizer", "deodorizing" (American). That mix is deliberate and it is
   settled: the industry noun stays "catalogue", the brand name stays
   "Power Odor Eliminator", and everything else follows the table. Two
   spellings of one word on one page is the thing a native reader notices
   before they can say what it is.

2. Temperature. "25 °C" with a space, one form only.

3. Claims. A B2B buyer's legal team reads the claim a second time.
   "pet-safe if licked" is an unconditional safety promise - not allowed
   under EU BPR labelling, and most US pet brands strike it. "99.9% kill
   rate against common pathogens" names no organism, no contact time and
   no report. ">94.2%" says we measured more than the report says. They do
   not argue about it: they strike it, and then they discount every other
   number on the page.

   So every efficacy number is followed by the report it rests on, or it
   does not go on the page.

WHAT IS ALLOWED, AND WHY
A short list, written out with the reason. A rule whose exceptions are
"whatever the regex missed" is not a rule.

USAGE
  python scripts/check_english_house_style.py [--dir out]
"""

import io
import os
import re
import sys
from html.parser import HTMLParser

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# 1. the spellings that are retired
# ---------------------------------------------------------------------------
RETIRED_SPELLINGS = [
    (r"\bdeodoris\w*\b", "deodoriser / deodorising - the house style is deodorizer / deodorizing"),
    (r"\bodour\w*\b", "odour - the house style is odor"),
    # a path like /.well-known/api-catalog is an address, not copy
    (r"(?<![\w/-])catalog(?![\w-])", "catalog - the house style is catalogue"),
    (r"(?<![\w-])inquir(?:y|ies)(?![\w-])", "inquiry - the house style is enquiry"),
]

# ---------------------------------------------------------------------------
# 2. the temperature
# ---------------------------------------------------------------------------
TEMPERATURE = re.compile(r"\d+\s*°C\b")
TEMPERATURE_OK = re.compile(r"\d+\s+°C\b")

# ---------------------------------------------------------------------------
# 3. the claim blacklist
# ---------------------------------------------------------------------------
BLACKLIST = [
    (r"pet-safe if licked", "an unconditional safety promise"),
    (r"\bsafe if licked\b", "an unconditional safety promise"),
    (r"\bsafe for pets\b", "an unconditional safety promise"),
    (r"\bnon-?toxic\b", "an unconditional safety promise"),
    (r"100%\s*natural", "an unconditional promise"),
    (r"kill rate against common pathogens", "a claim with no organism and no report"),
    (r"99\.9\s*%", "a kill-rate claim that names no strain, no contact time and no report"),
    (r">\s*94\.2\s*%", "the report says 94.2%, so >94.2% is a number we cannot show"),
    (r"\bmore than 94\.2\s*%", "the report says 94.2%, so 'more than' is a number we cannot show"),
    (r"\bbest in China\b", "an unprovable superlative"),
]

# a claim that IS allowed, with the reason it is allowed
ALLOWED_CLAIMS = [
    # the sourcing guide warns buyers AGAINST exactly this, so the word is
    # the point of the sentence, not a promise
    (r"presents document review or market review as a guaranteed approval",
     "a warning against the practice, not a promise"),
]

# ---------------------------------------------------------------------------
# 4. the reading lists
# ---------------------------------------------------------------------------
# llms.txt, llms-full.txt and llms-full.json are what an AI agent reads when
# a buyer asks it to find a supplier. They are written by hand, and they had
# drifted from the site they describe: "Free sample within 7 days",
# "Low MOQ 500", "48-hour response", "15-25 days". The site's own review
# counts "free sample" as a strength ("free sample 命中 0") - the reading
# lists broke that promise in the one place a machine would repeat it.
READING_LISTS = ["llms.txt", "llms-full.txt", "llms-full.json", "ai.json"]

READING_BANNED = [
    (r"\bfree samples?\b", "the samples are chargeable, fee confirmed in the quotation"),
    (r"\b500 units\b", "the catalogue's lowest minimum is 1,000 sets - it has never carried 500"),
    (r"\b48[- ]hour (?:response|quote|reply)\b", "the reply is within one business day"),
    (r"\b15[–-]25 days \(label", "the private-label window is 25-40 days"),
    (r"\b(?:low|min) moq 500\b", "the catalogue's lowest minimum is 1,000 sets"),
    (r"\bMOQ 500\b", "the catalogue's lowest minimum is 1,000 sets"),
    (r"response guaranteed", "the site does not promise a guaranteed response"),
    (r"pet-safe if licked", "an unconditional safety promise"),
    (r"kill rate against common pathogens", "a claim with no organism and no report"),
    (r">\s*94\.2\s*%", "the report says 94.2%"),
    (r"\bdeodoris\w*\b", "deodorizer / deodorizing is the house style"),
    (r"\bodour\w*\b", "odor is the house style"),
    (r"(?<![\w-])inquir(?:y|ies)(?![\w-])", "enquiry is the house style"),
]


def compile_all(pairs):
    return [(re.compile(p, re.I), why) for p, why in pairs]


SPELLINGS = compile_all(RETIRED_SPELLINGS)
CLAIMS = compile_all(BLACKLIST)
ALLOWED = compile_all(ALLOWED_CLAIMS)

# the whole html file is never worth reading as prose
SKIP_TEXT = ("script", "style", "noscript", "template", "svg")


class Visible(HTMLParser):
    """The text a reader sees."""

    def __init__(self):
        HTMLParser.__init__(self)
        self.skip = 0
        self.buf = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TEXT:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in SKIP_TEXT and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data)

    def text(self):
        return " ".join(self.buf)


def read(path):
    return io.open(path, encoding="utf-8", errors="replace").read()


def allowed_at(text, start):
    for pat, _why in ALLOWED:
        m = pat.search(text)
        if m and abs(m.start() - start) < 200:
            return True
    return False


def main():
    argv = sys.argv[1:]
    out_dir = os.path.join(SITE, "out")
    if "--dir" in argv:
        out_dir = argv[argv.index("--dir") + 1]
        if not os.path.isabs(out_dir):
            out_dir = os.path.join(SITE, out_dir)

    if not os.path.isdir(out_dir):
        print("  the build output is not there: %s" % out_dir)
        return 1

    failures = []
    pages = 0

    for dirpath, dirnames, filenames in os.walk(out_dir):
        dirnames[:] = [d for d in dirnames if d != ".next"]
        for fn in sorted(filenames):
            if not fn.endswith(".html"):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, out_dir).replace("\\", "/")
            if rel.startswith("admin"):
                # the console is the staff tool and it is in Chinese
                continue
            pages += 1
            v = Visible()
            v.feed(read(path))
            text = v.text()

            for pat, why in SPELLINGS:
                for m in pat.finditer(text):
                    failures.append("%s: %r is retired (%s)"
                                    % (rel, m.group(0), why))

            for m in TEMPERATURE.finditer(text):
                if not TEMPERATURE_OK.match(text[m.start():m.end()]):
                    failures.append("%s: %r - the house style is '25 °C' with a space"
                                    % (rel, m.group(0)))

            for pat, why in CLAIMS:
                for m in pat.finditer(text):
                    if allowed_at(text, m.start()):
                        continue
                    failures.append("%s: %r - %s"
                                    % (rel, m.group(0), why))

    # ---- the reading lists an AI agent reads
    for name in READING_LISTS:
        path = os.path.join(out_dir, name)
        if not os.path.exists(path):
            failures.append("%s: the reading list is not in the build" % name)
            continue
        text = read(path)
        for pat, why in compile_all(READING_BANNED):
            for m in pat.finditer(text):
                failures.append("%s: %r - %s" % (name, m.group(0), why))

    if failures:
        print("  the English does not follow the house style:")
        for f in failures[:40]:
            print("    !! %s" % f)
        if len(failures) > 40:
            print("    ... and %d more" % (len(failures) - 40))
        return 1

    print("  the English follows the house style: %d pages and %d reading lists "
          "checked, one spelling, one temperature, no unqualified promise"
          % (pages, len(READING_LISTS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

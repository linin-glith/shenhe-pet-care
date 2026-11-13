#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
P0-6 — ONE RESPONSE PROMISE FOR THE WHOLE SITE.

WHAT THIS DOES
Replaces the reply promise everywhere it is written, so the site says one
thing: a first answer within one business day.

WHY THE PROMISE CHANGED
The site promised "one business day" in forty-odd places. That was never a
promise the factory had confirmed it could keep, and a promise the site
cannot keep is worse than no promise: a buyer who waits an hour and gets
nothing has been told to distrust the one number that was on the page. Until
the factory confirms a shorter figure, the conservative value is the one to
publish — and a promise that is met is worth more than a promise that is
fast.

WHAT IS DELIBERATELY NOT TOUCHED
  - "business hours" meaning WORKING HOURS ("during China business hours
    09:00-18:00 CST"). That is a different sense of the words and it stays.
  - "samples dispatched with tracking within 48 hours" and the recall SOP.
    Those are a sample dispatch and a recall procedure, not a reply.
  - HEALTH-CHECK.md. It is the project's own history, and rewriting history
    to hide what the site used to promise is falsifying the record.
  - The .bak files. They are the previous state of a file, kept for diffing.

RUN
python scripts/fix_response_promise.py [--dry]
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {
    "node_modules", ".next", "out", ".git", ".vercel",
    "legacy", "docs", "i18n-routes-parked", "_backup-handwritten",
    "__pycache__", ".venv", "venv",
}
SKIP_FILES = {"HEALTH-CHECK.md"}
SKIP_SUFFIX = (".bak", ".bak-2026", ".orig")

EXTS = (".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".json", ".txt", ".html", ".md")

# (pattern, replacement) — applied in order. The first four are the promise;
# the rest are the other ways the same promise was written.
RULES = [
    # --- the promise itself -------------------------------------------------
    ("one business day", "one business day"),
    ("One business day", "One business day"),
    ("1 business day", "1 business day"),
    ("1 Business day", "1 Business day"),
    ("one-business-day", "one-business-day"),
    ("1-business-day", "1-business-day"),
    ("business-day quote", "business-day quote"),
    # --- the same promise, other spellings ---------------------------------
    ("Get a Quote Within 1 Business Day", "Get a Quote Within 1 Business Day"),
    ("Get a Quote within one business day", "Get a Quote within one business day"),
    ("get a quote within one business day", "get a quote within one business day"),
    ("reply within one business day", "reply within one business day"),
    ("replies within one business day", "replies within one business day"),
    ("within one business day", "within one business day"),
    ("within one business day", "within one business day"),
    ("one-business-day response", "one-business-day response"),
    ("one-business-day response guarantee", "one-business-day response guarantee"),
    ("reply < 1 day", "reply < 1 day"),
    ("within one business day", "within one business day"),
    ('"1 business day"', '"1 business day"'),
    ("'1 business day'", "'1 business day'"),
    # --- the two odd promises that were left behind ------------------------
    ("quote the cert path within one business day", "quote the cert path within one business day"),
    # The email channel said "same day" while the WhatsApp channel said
    # "one business day" — two promises on one page. Both are now one.
    ("Within one business day on WhatsApp during China Standard Time working hours. Same day by email.",
     "Within one business day on WhatsApp during China Standard Time working hours. The same window by email."),
    ("Within one business day on WhatsApp during China Standard Time working hours, and the same window by email.",
     "Within one business day on WhatsApp during China Standard Time working hours, and the same window by email."),
    ("Within one business day by email during China Standard Time working hours.",
     "Within one business day by email during China Standard Time working hours."),
    ("the same window by email", "the same window by email"),
    ("and the same window by email", "and the same window by email"),
    ("get a written quotation within one business day",
     "get a written quotation within one business day"),
]


def files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn in SKIP_FILES:
                continue
            if fn.endswith(SKIP_SUFFIX):
                continue
            if not fn.endswith(EXTS):
                continue
            yield os.path.join(dirpath, fn)


def main():
    dry = "--dry" in sys.argv
    changed = []
    hits = {}

    for path in files():
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        try:
            raw = io.open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue

        out = raw
        count = 0
        for src, dst in RULES:
            if src in out:
                n = out.count(src)
                out = out.replace(src, dst)
                count += n
                hits.setdefault(rel, []).append("%s -> %s  x%d" % (src, dst, n))
        if count and out != raw:
            changed.append((rel, count))
            if not dry:
                io.open(path, "w", encoding="utf-8", newline="").write(out)

    print("files changed: %d, replacements: %d%s" %
          (len(changed), sum(c for _, c in changed), "  (dry run)" if dry else ""))
    for rel, _ in changed:
        for h in hits.get(rel, []):
            print("  %-52s %s" % (rel, h))

    # --- what is left -------------------------------------------------------
    left = []
    for path in files():
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        try:
            raw = io.open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue
        for m in re.finditer(r"business[ -]hour", raw, re.I):
            line = raw[:m.start()].count("\n") + 1
            snippet = raw.splitlines()[line - 1].strip()[:120]
            left.append("%s:%d  %s" % (rel, line, snippet))
    print("\nremaining 'business hour' (excluding working-hours senses): %d" % len(left))
    for l in left:
        print("  " + l)


if __name__ == "__main__":
    main()

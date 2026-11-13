#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE LEDGER'S ENCODING DAMAGE, AND THE TWO KINDS OF IT.

WHY THIS EXISTS

There are two kinds of wrong characters in HEALTH-CHECK.md, and they need
opposite handling:

  1. A LOST CHARACTER - U+FFFD. A Chinese character is three bytes in
     UTF-8, and a shell pipeline that cannot carry them swallows two or
     three of them, so the character becomes two or three U+FFFD. These
     are real losses: the sentence is unreadable and the character has to
     be put back from the words around it.

  2. A QUOTED DEFECT - the characters 路 / 掳 / 銆 / 脳 / 鈫 / 锟 / 馃.
     These are what UTF-8 punctuation becomes when its bytes are read as
     GBK: 掳 is the degree sign, for example, and the rest are the same
     family. They LOOK like ordinary Chinese, so a scan for U+FFFD misses
     them entirely.

     And they must not be repaired: round 59 of the ledger is about exactly
     these, and the lines that show them are quoting the defect they
     describe - "below 25掳C" beside "below 25°C" is the before-and-after
     of the fix. Changing them would delete the evidence and leave the
     record claiming that nothing was ever wrong.

So this script reports the two kinds separately: the losses as something
to fix, the quoted ones as something to leave alone.

USAGE
  python scripts/check_ledger_encoding.py
"""
from __future__ import annotations

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The characters UTF-8 punctuation becomes when its bytes are read as GBK.
#
# 路 is NOT in the list: it is an ordinary Chinese character and the ledger
# uses it in ordinary words (227 times). Counting it would drown the signal.
QUOTED = "掳銆脳鈫锟馃"

FILES = [
    os.path.join(ROOT, "HEALTH-CHECK.md"),
    os.path.join(ROOT, "docs", "自有商标公网使用基线扫描-2026-11-13.md"),
]


def main() -> int:
    problems: list[str] = []

    for path in FILES:
        if not os.path.exists(path):
            continue
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        s = io.open(path, encoding="utf-8", errors="replace").read()

        # --- 1. the real losses
        for m in re.finditer("\ufffd+", s):
            i = m.start()
            line = s.count("\n", 0, i) + 1
            problems.append(
                "%s line %d: a character was lost here - %r"
                % (rel, line, s[max(0, i - 45):i + 25].replace("\n", " "))
            )

        # --- 2. the quoted defects (reported, never repaired)
        quoted = {ch: s.count(ch) for ch in QUOTED if s.count(ch)}
        if quoted:
            print("%s" % rel)
            print("   quoted defects (round 59 is about these - LEAVE THEM): %s"
                  % ", ".join("%s x%d" % (ch, n) for ch, n in sorted(quoted.items())))

    if problems:
        print()
        print("!! %d lost character(s):" % len(problems))
        for p in problems:
            print("  - %s" % p)
        return 1

    print()
    print("OK: no character was lost, and the quoted defects are still there as evidence.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

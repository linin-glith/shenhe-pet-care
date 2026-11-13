#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the WCAG AA gate can fail.

A gate that has only ever passed is not a gate. This runs the REAL gate
in its AA mode against the real built page carrying the defect it exists
to catch: text painted in a colour that does not reach the standard.

The file is restored in a `finally` block, so the build output is back
exactly as it was whether the check passes, fails or throws.
"""
import io
import os
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = join(REPO, "out", "index.html")
GATE = join(REPO, "scripts", "check_text_contrast.mjs")

# A line of copy painted in a grey that reads at 1.8:1 on white.
# The anchor is a paragraph on a solid ground: the heading sits on the
# dark hero, and the probe leaves out anything whose ground it cannot
# read - a gradient is not a colour.
GOOD = '<p class="v2-eyebrow">'
BAD = '<p class="v2-eyebrow" style="color:#b8c0c5">'


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate(only="index.html"):
    cmd = ["node", GATE, "--standard", "aa", "--only", only]
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=1800,
                       encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(TARGET):
        print("FAIL  %s does not exist - build the site first" % TARGET)
        return 1

    original = read(TARGET)
    if GOOD not in original:
        print("FAIL  the page does not carry %s, so the defect cannot be injected" % GOOD)
        return 1

    try:
        write(TARGET, original.replace(GOOD, BAD, 1))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED - it did not catch the unreadable heading")
            return 1
        if "does not reach the contrast" not in out:
            print("THE GATE WENT RED, but not for the contrast check:")
            for line in out.splitlines()[-20:]:
                print("   " + line.strip()[:160])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "ratio" in line or "does not reach" in line:
                print("   " + line.strip()[:170])
    finally:
        write(TARGET, original)
        print("  (the built page is restored)")

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[-1200:])
        return 1
    print("  and it is green again on the restored page")
    print("\nTHE GATE CAN FAIL: it measures the rendered page, and it catches text that does not reach the standard.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the contrast gate can fail.

A gate that has only ever passed is not a gate. This runs the REAL gate
against the real built page carrying the bug it exists to catch: a figure
painted in the colour of the ground it stands on.

The file is restored in a `finally` block, so the build output is back
exactly as it was whether the check passes, fails or throws.
"""
import io
import os
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = join(REPO, "out", "products.html")
GATE = join(REPO, "scripts", "check_text_contrast.mjs")

# The figure was painted with text-v2-ink-100 on a bg-v2-ink-900 ground.
# text-v2-ink-900 is the same colour as the ground, which is the bug.
GOOD = "text-v2-ink-100"
BAD = "text-v2-ink-900"


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate(pages=None, only=None):
    cmd = ["node", GATE]
    if pages:
        cmd += ["--pages", str(pages)]
    if only:
        cmd += ["--only", only]
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=1800,
                       encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(TARGET):
        print("FAIL  %s does not exist - build the site first" % TARGET)
        return 1

    original = read(TARGET)
    if GOOD not in original:
        print("FAIL  the page does not carry %s, so the probe cannot be injected" % GOOD)
        return 1

    try:
        write(TARGET, original.replace(GOOD, BAD))
        code, out = run_gate(only='products.html')
        if code == 0:
            print("THE GATE PASSED - it did not catch the invisible figure")
            return 1
        if "the text has to be readable" not in out:
            print("THE GATE WENT RED, but not for the contrast check:")
            for line in out.splitlines()[-20:]:
                print("   " + line.strip()[:160])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "ratio" in line or "cannot be read" in line:
                print("   " + line.strip()[:170])
    finally:
        write(TARGET, original)
        print("  (the built page is restored)")

    code, out = run_gate(only='products.html')
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[-1200:])
        return 1
    print("  and it is green again on the restored page")
    print("\nTHE GATE CAN FAIL: it measures the rendered page, and it catches a figure painted in the colour of its ground.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

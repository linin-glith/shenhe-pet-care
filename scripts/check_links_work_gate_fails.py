#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the link gate can fail.

A gate that has only ever passed is not a gate. This runs the REAL gate
against the real built page carrying the bug it exists to catch: a link
that does not lead anywhere - here, one that swallows the click.

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
GATE = join(REPO, "scripts", "check_links_work.mjs")

# A link that stops the browser from following it - the shape of the bug
# this gate exists for.
GOOD = 'href="/contact.html"'
BAD = 'href="/contact.html" onclick="return false"'


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate(pages=1, links=14):
    cmd = ["node", GATE, "--pages", str(pages), "--links", str(links)]
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=1800,
                       encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(TARGET):
        print("FAIL  %s does not exist - build the site first" % TARGET)
        return 1

    original = read(TARGET)
    if GOOD not in original:
        print("FAIL  the page does not carry %s, so the bug cannot be injected" % GOOD)
        return 1

    try:
        write(TARGET, original.replace(GOOD, BAD, 1))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED - it did not catch the dead link")
            return 1
        if "does not lead anywhere" not in out:
            print("THE GATE WENT RED, but not for the link check:")
            for line in out.splitlines()[-20:]:
                print("   " + line.strip()[:160])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "DEAD" in line or "does not lead anywhere" in line:
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
    print("\nTHE GATE CAN FAIL: it presses the links, and a link that does not lead anywhere is caught.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

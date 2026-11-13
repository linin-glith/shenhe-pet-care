#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the lead-time label gate can fail - in BOTH word orders.

A gate that has only ever passed is not a gate. And a gate that only reads
one word order is a gate with a blind spot: the first version of this one
looked for the literal "OEM lead time" and never saw the inverted
"Lead time . OEM", which sat on twenty product pages for a round.

So this injects each form in turn into a real built page, runs the REAL
gate, and checks that it goes red for that reason. The page is restored in
a `finally` block, so the build output is back exactly as it was.
"""
import io
import os
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = join(REPO, "out", "products", "cat-litter-companion.html")
GATE = join(REPO, "scripts", "check_lead_time_labels.py")

GOOD = "Private-label lead time"

# the three wrong labels, one per word order and one for the stock window
BAD_FORMS = [
    ("OEM lead time", "the same order"),
    ("Lead time · OEM", "the inverted order"),
    ("Lead · OEM", "the short inverted order"),
    ("Lead time · stock", "the stock window"),
]


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate():
    p = subprocess.run([sys.executable, GATE], cwd=REPO, capture_output=True, text=True,
                       timeout=600, encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(TARGET):
        print("FAIL  %s does not exist - build the site first" % TARGET)
        return 1
    original = read(TARGET)
    if GOOD not in original:
        print("FAIL  the page does not carry %r, so the probe cannot be injected" % GOOD)
        return 1

    try:
        for bad, label in BAD_FORMS:
            # every occurrence, not just the first: a page carries the label
            # twice, once in the visible text and once in the JSON-LD, and
            # the first one in the file is usually the JSON-LD, which the
            # gate strips before it reads.
            write(TARGET, original.replace(GOOD, bad))
            code, out = run_gate()
            if code == 0:
                print("THE GATE PASSED - it did not catch %r" % bad)
                return 1
            if "must not be called OEM" not in out:
                print("THE GATE WENT RED, but not for this check:")
                for line in out.splitlines()[-12:]:
                    print("   " + line.strip()[:160])
                return 1
            print("THE GATE CAUGHT %r (%s):" % (bad, label))
            for line in out.splitlines():
                if "cat-litter-companion" in line:
                    print("   " + line.strip()[:170])
                    break
    finally:
        write(TARGET, original)
        print("  (the built page is restored)")

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[-1200:])
        return 1
    print("  and it is green again on the restored page")
    print("\nTHE GATE CAN FAIL: in every word order, and it stops the 25-40 day "
          "window from being called OEM again.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

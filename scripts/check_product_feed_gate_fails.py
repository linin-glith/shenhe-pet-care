#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proof that the product feed gate can go red.

A gate that has never failed is not a gate. This puts one defect at a time
into the published feed, runs the gate, and checks that it names the
defect. Then it puts the feed back and checks that the gate is green.

WHAT IS INJECTED
  1. a claim that does not match the other published view - the drift the
     feed would have if it were ever hand-edited
  2. a missing enquiry field - the gap that made an agent's enquiry
     unquotable, and the one this gate exists to prevent
  3. a price - the one thing the feed must never carry

USAGE
  python scripts/check_product_feed_gate_fails.py
"""

import io
import json
import os
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_product_feed.py")
FEED = os.path.join(SITE, "public", "product-feed.json")


def run_gate():
    p = subprocess.run([sys.executable, GATE], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", cwd=SITE)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(FEED):
        print("  there is no published feed to test against")
        return 1

    backup = io.open(FEED, encoding="utf-8", newline="").read()
    original = json.loads(backup)

    def write(feed):
        with io.open(FEED, "w", encoding="utf-8", newline="") as f:
            f.write(json.dumps(feed, ensure_ascii=False, indent=2) + "\n")

    # ---- the feed as it is, must be green
    code, out = run_gate()
    if code != 0:
        print("  the gate is RED on the current feed, so the proof means nothing:")
        print(out)
        return 1
    print("  green on the current feed")

    cases = []

    # 1. a claim that does not match the other published view
    f = json.loads(backup)
    f["items"][0]["claim"] = "A claim somebody typed by hand."
    cases.append(("a claim that drifts from the other view", f, "claim"))

    # 2. a missing enquiry field
    f = json.loads(backup)
    del f["inquiry"]["fields"]["volume"]
    cases.append(("an enquiry field the server reads is missing", f, "volume"))

    # 3. a price
    f = json.loads(backup)
    f["items"][0]["price"] = "USD 12.00"
    cases.append(("a price in the feed", f, "currency amount"))

    try:
        for label, feed, expected in cases:
            write(feed)
            code, out = run_gate()
            if code == 0:
                print("  !! the gate stayed GREEN with %s" % label)
                print(out)
                return 1
            if expected not in out:
                print("  !! the gate went red but did not name the %s" % expected)
                print(out)
                return 1
            print("  red on %s" % label)
    finally:
        with io.open(FEED, "w", encoding="utf-8", newline="") as f:
            f.write(backup)

    code, out = run_gate()
    if code != 0:
        print("  !! the gate stayed RED after the feed was put back:")
        print(out)
        return 1
    print("  green again after the feed was put back")

    print()
    print("OK: the gate catches a drifting claim, a missing enquiry field and a price, "
          "and goes green again when the feed is put back.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

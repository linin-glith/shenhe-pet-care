#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the tap-card gate can fail.

The gate is there because a card is printed once and then sits in a
warehouse for months: if the address on the card and the address the
site serves drift apart, the card stops being true and nobody finds out
until a buyer taps it.

So this puts a wrong address on the card, and the gate has to notice.
Then the artwork goes back exactly as it was, and the gate has to be
green again.

The file is restored in a `finally` block and the bytes are compared
afterwards, so the artwork is back exactly as it was whether the check
passes, fails or throws.
"""
import hashlib
import io
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTWORK = os.path.join(ROOT, "public", "chip-card.svg")
GATE = os.path.join(ROOT, "scripts", "check_chip_card.py")

WRONG = "https://example.invalid/"


def read_bytes(path):
    with io.open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    with io.open(path, "wb") as f:
        f.write(data)


def run_gate():
    p = subprocess.run(
        [sys.executable, GATE], cwd=ROOT, capture_output=True, text=True, timeout=600,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(ARTWORK):
        print("FAIL  the artwork is not there - build the site first")
        return 1

    original = read_bytes(ARTWORK)
    before = hashlib.sha256(original).hexdigest()
    text = original.decode("utf-8", "replace")
    if "https://shenhezhongke.com/" not in text:
        print("FAIL  the artwork does not print the site address - is it the right file?")
        return 1

    try:
        write_bytes(ARTWORK, text.replace("https://shenhezhongke.com/", WRONG).encode("utf-8"))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED - it did not notice the wrong address")
            return 1
        if "the card prints" not in out:
            print("THE GATE WENT RED, but not about the address:")
            for line in out.splitlines()[-12:]:
                print("   " + line.strip()[:170])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "the card prints" in line or "does not print" in line:
                print("   " + line.strip()[:170])
    finally:
        write_bytes(ARTWORK, original)
        after = hashlib.sha256(read_bytes(ARTWORK)).hexdigest()
        print("  (the artwork is restored: %s)"
              % ("the same bytes" if after == before else "NOT THE SAME BYTES"))
        if after != before:
            return 1

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILE:")
        print(out[-1500:])
        return 1
    print("  and it is green again on the restored artwork")
    print()
    print("THE GATE CAN FAIL: a card that prints the wrong address is caught.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

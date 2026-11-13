#!/usr/bin/env python3
"""
Proof that the English copy gate can go red.

A gate that has never failed is not a gate. This copies the built site to a
temporary directory, puts one of the three defects back, runs the gate
against that copy, and checks that it reports the defect.

Then it puts the site back and checks that the gate is green again.

WHAT IS INJECTED
  1. a Chinese product name inside an English sentence
  2. the other spelling of the word
  3. the word that is not a word

USAGE
  python scripts/check_english_copy_gate_fails.py
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_english_copy_consistency.py")

# (file, the good text, the defect)
CASES = [
    ("certifications.html",
     "measured on the Power Odor Eliminator (Extra Strength) / PURE PAWS PET DEODORANT sample.",
     "measured on the 净味小子 / PURE PAWS PET DEODORANT sample."),
    ("certifications.html",
     "Track enquiry",
     "Track inquiry"),
    ("contact.html",
     "private-label programme",
     "private-label programmeme"),
]


def run_gate(out_dir):
    p = subprocess.run([sys.executable, GATE, "--dir", out_dir],
                       capture_output=True, text=True, encoding="utf-8",
                       errors="replace", cwd=SITE)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.isdir(os.path.join(SITE, "out")):
        print("  no build to test against")
        return 1

    tmp = tempfile.mkdtemp(prefix="shenhe-copy-gate-")
    work = os.path.join(tmp, "out")
    shutil.copytree(os.path.join(SITE, "out"), work)
    try:
        # ---- the site as it is, must be green
        code, out = run_gate(work)
        if code != 0:
            print("  the gate is RED on the current build, so the proof means nothing:")
            print(out)
            return 1
        print("  green on the current build")

        for name, good, bad in CASES:
            target = os.path.join(work, name.replace("/", os.sep))
            original = io.open(target, encoding="utf-8").read()
            if original.count(good) == 0:
                print("  !! the injection point is gone in %s: %r" % (name, good[:60]))
                return 1
            io.open(target, "w", encoding="utf-8", newline="").write(
                original.replace(good, bad, 1))
            code, out = run_gate(work)
            if code == 0:
                print("  !! the gate did NOT go red for: %s" % bad[:50])
                print(out)
                return 1
            print("  red for: %s" % bad[:50])
            # put it back before the next case
            io.open(target, "w", encoding="utf-8", newline="").write(original)

        # ---- the site as it was, must be green again
        code, out = run_gate(work)
        if code != 0:
            print("  !! the gate did not come back green:")
            print(out)
            return 1
        print("  green again after the defects were removed")
        print("  the gate knows how to fail")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

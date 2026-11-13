#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proof that the house-style gate can fail.

A gate that has only ever passed is not a gate. This copies the built site
to a temporary directory, puts each defect back in turn, runs the REAL
gate against the copy, and checks that it goes red for that reason.

Then it puts the site back and checks that the gate is green again.

WHAT IS INJECTED
  1. a retired spelling
  2. a temperature without the space
  3. an unconditional safety promise
  4. an efficacy number with no report

A NOTE ON WHERE THE DEFECT IS PUT
Every occurrence is replaced, not just the first. A page carries the same
sentence twice - once in the visible text and once in the JSON-LD - and the
first occurrence in the file is usually the JSON-LD, which the gate strips
before it reads. Replacing only that one would prove nothing.
"""
import io
import os
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_english_house_style.py")

# (file, the good text that must be there, the defect)
CASES = [
    ("certifications.html",
     "the Power Odor Eliminator (Extra Strength)",
     "the Power Odor Eliminator (Extra Strength), pet-safe if licked"),
    ("certifications.html",
     "54 °C",
     "54°C"),
    ("certifications.html",
     "Cat litter deodorizer",
     "Cat litter deodoriser"),
    ("products/pet-disinfectant-deodorizing-solution.html",
     "biocidal kill-rate claims are made only on markets where the product is registered",
     "lab-tested 99.9% kill rate against common pathogens"),
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

    tmp = tempfile.mkdtemp(prefix="shenhe-style-gate-")
    work = os.path.join(tmp, "out")
    shutil.copytree(os.path.join(SITE, "out"), work)
    try:
        code, out = run_gate(work)
        if code != 0:
            print("  the gate is RED on the current build, so the proof means nothing:")
            print(out[:2500])
            return 1
        print("  green on the current build")

        for name, good, bad in CASES:
            target = os.path.join(work, name.replace("/", os.sep))
            original = io.open(target, encoding="utf-8").read()
            if original.count(good) == 0:
                print("  !! the injection point is gone in %s: %r" % (name, good[:60]))
                return 1
            io.open(target, "w", encoding="utf-8", newline="").write(
                original.replace(good, bad))
            code, out = run_gate(work)
            if code == 0:
                print("  !! the gate did NOT go red for: %r" % bad[:60])
                print(out[:1500])
                return 1
            print("  red for: %r" % bad[:60])
            io.open(target, "w", encoding="utf-8", newline="").write(original)

        code, out = run_gate(work)
        if code != 0:
            print("  !! the gate did not come back green:")
            print(out[:1500])
            return 1
        print("  green again after the defects were removed")
        print("  the gate knows how to fail")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

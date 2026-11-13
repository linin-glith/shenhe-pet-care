#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proof that the transfer weight gate can go red.

A gate that has never failed is not a gate. This copies the built site to a
temporary directory, puts the weight back in - the way a page gets heavy
when someone adds a picture - runs the gate against that copy, and checks
that it reports the weight and names which ceiling was crossed.

Then it puts the site back and checks that the gate is green again.

WHAT IS INJECTED
Three ways a page gets heavier, and the three ceilings that exist for
them:

  1. a first-screen picture - what a first-time visitor waits for
  2. four lazy pictures - what the whole page pulls
  3. one large picture - a single file that should have been smaller

The first case crosses two ceilings at once: a picture big enough to
matter to the first screen is also big enough to matter on its own. That
is the ceiling doing its job, not a fault in the proof.

USAGE
  python scripts/check_transfer_weight_gate_fails.py
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_transfer_weight.py")

FAT = "/assets/img/_gate-weight-test.webp"


def picture(size_kb, name=FAT, eager=False):
    loading = "eager" if eager else "lazy"
    return ('<img src="%s" alt="" width="10" height="10" loading="%s" '
            'decoding="async"/>' % (name, loading))


# (page, what is injected, how big the file is, what the gate must say)
CASES = [
    ("index.html", picture(400, eager=True), 400 * 1024, "the first screen pulls"),
    ("certifications.html", picture(150, name="/assets/img/_gate-w2.webp") * 4,
     0, "the page pulls"),
    ("about.html", picture(400, name="/assets/img/_gate-w3.webp"), 400 * 1024,
     "ceiling for one picture"),
]

# The four pictures of the second case are four files.
EXTRA_FILES = {
    "/assets/img/_gate-weight-test.webp": 400 * 1024,
    "/assets/img/_gate-w2.webp": 150 * 1024,
    "/assets/img/_gate-w3.webp": 400 * 1024,
}


def run_gate(out_dir):
    p = subprocess.run(
        [sys.executable, GATE, "--dir", out_dir],
        capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=SITE
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def write_file(work, url, size):
    path = os.path.join(work, url.lstrip("/").replace("/", os.sep))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(b"\x00" * size)


def main():
    if not os.path.isdir(os.path.join(SITE, "out")):
        print("  no build to test against")
        return 1

    tmp = tempfile.mkdtemp(prefix="shenhe-transfer-gate-")
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

        for name, payload, _size, expected in CASES:
            target = os.path.join(work, name.replace("/", os.sep))
            if not os.path.exists(target):
                print("  !! %s is not in the build" % name)
                return 1
            original = io.open(target, encoding="utf-8").read()
            if "</body>" not in original:
                print("  !! the injection point is gone in %s" % name)
                return 1
            io.open(target, "w", encoding="utf-8", newline="").write(
                original.replace("</body>", payload + "</body>", 1))
            for url, size in EXTRA_FILES.items():
                write_file(work, url, size)

            code, out = run_gate(work)
            if code == 0:
                print("  !! the gate stayed GREEN with the weight injected into %s" % name)
                print(out)
                return 1
            if expected not in out:
                print("  !! the gate went red but did not say %r" % expected)
                print(out)
                return 1
            print("  red on %s, and it said: %s" % (name, expected))

            # ---- and back again
            io.open(target, "w", encoding="utf-8", newline="").write(original)
            for url in EXTRA_FILES:
                path = os.path.join(work, url.lstrip("/").replace("/", os.sep))
                if os.path.exists(path):
                    os.remove(path)
            code, out = run_gate(work)
            if code != 0:
                print("  !! the gate stayed RED after the site was put back:")
                print(out)
                return 1
            print("  green again after the site was put back")

        print()
        print("OK: the gate catches a heavy first screen, a heavy page and one "
              "large picture, and goes green again when the site is put back.")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""Prove the published-address gate can fail.

The gate is there because the site published two addresses a buyer's letter
cannot reach - on 370 places - and nothing caught it. The first version of
the gate had a blind spot: it walked .html files only, so the machine-
readable files and the .well-known directory were never read. It was GREEN
while .well-known/security.txt published a dead address.

This proves the fixed gate fails when a dead address is put back - in
exactly the file the old gate could not see.

The file is restored in a `finally` block, so the build output is back
exactly as it was whether the check passes, fails or throws.
"""
import io
import os
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = join(REPO, "out", ".well-known", "security.txt")
GATE = join(REPO, "scripts", "check-build.mjs")
NODE = r"C:\Program Files\nodejs\node.exe"

# THE ADDRESS THE SITE MUST NOT PUBLISH, AND THE ONE IT DOES.
#
# The published address is the company's mailbox, sales@. The address the
# site must not publish is the machine's identity, mail@: it sends as
# itself and holds the system's notices and the bounces, and a buyer who
# wrote to it wrote to a machine.
DEAD = "mail@shenhezhongke.com"
LIVE = "sales@shenhezhongke.com"


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate():
    p = subprocess.run(
        [NODE, GATE], cwd=REPO, capture_output=True, text=True, timeout=1800,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(TARGET):
        print("FAIL  %s does not exist - build the site first" % TARGET)
        return 1

    original = read(TARGET)
    if LIVE not in original:
        print("FAIL  %s does not carry %s, so the probe cannot be injected" % (TARGET, LIVE))
        return 1

    try:
        # The dead address goes into the file the old gate could not read:
        # the .well-known directory.
        write(TARGET, original.replace(LIVE, DEAD))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED — it did not catch the dead address")
            return 1
        if "a published address has to be one a letter can reach" not in out:
            print("THE GATE WENT RED, but not for the address check:")
            for line in out.splitlines()[-20:]:
                print("   " + line.strip()[:160])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "a published address" in line or "cannot receive" in line:
                print("   " + line.strip()[:170])
    finally:
        write(TARGET, original)
        print("  (the file is restored)")

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[-1500:])
        return 1
    print("  and it is green again on the restored files")
    print("\nTHE GATE CAN FAIL: it reads the machine-readable files, not only the pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""Prove the one-rule gate can fail.

The gate is there because the form and the desk kept the reply deadline
twice, once each, and the two copies drifted. The first version of the
gate looked for ONE NAME in each file - `function replyDeadline(` in the
form, `CLOSED_WEEKDAYS` in the desk - and two of those names had never
existed in this repository, so those checks passed because the name was
absent rather than because a copy was absent.

This proves the fixed gate fails when a copy of the rule is put back
under a name it has never seen.

The file is restored in a `finally` block and the bytes are compared
afterwards, so the source is back exactly as it was whether the check
passes, fails or throws.
"""
import hashlib
import io
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(REPO, "components", "v2", "EnquiryWorkbench.tsx")
GATE = os.path.join(REPO, "scripts", "check_response_deadline.mjs")
NODE = r"C:\Program Files\nodejs\node.exe"

# A second copy of the rule, under a name the old gate did not look for.
INJECT = """
/*
 * INJECTED BY THE PROOF. A second copy of the rule, on purpose, under a
 * name the old gate did not look for - which is the whole point: a check
 * that looks for one name cannot catch a copy that has another one.
 */
function localCopyOfTheRule(from: Date = new Date()): number {
  const d = new Date(from.getTime() + 8 * 60 * 60 * 1000);
  d.setUTCHours(18, 0, 0, 0);
  while (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}
"""


def read_bytes(p):
    with io.open(p, "rb") as f:
        return f.read()


def write_bytes(p, data):
    with io.open(p, "wb") as f:
        f.write(data)


def run_gate():
    p = subprocess.run(
        [NODE, GATE], cwd=REPO, capture_output=True, text=True, timeout=600,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.exists(GATE):
        print("FAIL  the gate is not there")
        return 1

    original = read_bytes(TARGET)
    before = hashlib.sha256(original).hexdigest()

    try:
        write_bytes(TARGET, original + INJECT.encode("utf-8"))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED - it did not catch the second copy of the rule")
            return 1
        if "the desk keeps no copy of it" not in out:
            print("THE GATE WENT RED, but not for the copy check:")
            for line in out.splitlines()[-20:]:
                print("   " + line.strip()[:170])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "keeps no copy" in line or "FAIL " in line:
                print("   " + line.strip()[:170])
    finally:
        write_bytes(TARGET, original)
        after = hashlib.sha256(read_bytes(TARGET)).hexdigest()
        print("  (the file is restored: %s)" % ("the same bytes" if after == before else "NOT THE SAME BYTES"))
        if after != before:
            return 1

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILE:")
        print(out[-1500:])
        return 1
    print("  and it is green again on the restored file")
    print()
    print("THE GATE CAN FAIL: it looks for the arithmetic, not for one name.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the security-header gate can fail.

A gate that has never been seen red is a gate nobody knows what it is for.
So this puts four defects in, one at a time, and the gate has to go red on
each of them - and then the files go back and the gate has to be green
again.

  1. a new analytics script the policy does not allow. This is the one
     that matters going forward: the script loads, the policy blocks it,
     and nobody reads the console of a buyer's phone.
  2. an inline event handler, with script-src-attr set to 'none'.
  3. an inline style, with no 'unsafe-inline' in style-src.
  4. a policy on the server that is not the policy in the repository. The
     drift check has to notice, or the two copies drift apart quietly.

The files are restored in a `finally` block and the bytes are compared
afterwards, so the build output and the policy file are back exactly as
they were whether the check passes, fails or throws.
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
GATE = os.path.join(ROOT, "scripts", "check_security_headers.py")
POLICY = os.path.join(ROOT, "lib", "security-headers.json")


def read_bytes(path):
    with io.open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    with io.open(path, "wb") as f:
        f.write(data)


def run_gate(mode="--static"):
    """Ask the gate for exactly one half. The gate refuses to run both,
    and it used to run neither - so the caller has to be explicit."""
    p = subprocess.run(
        [sys.executable, GATE, mode],
        cwd=ROOT, capture_output=True, text=True, timeout=900,
        encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def expect_red(label, needle):
    code, out = run_gate()
    if code == 0:
        print("THE GATE PASSED - it did not notice %s" % label)
        return False
    if needle.lower() not in out.lower():
        print("THE GATE WENT RED, but not for %s:" % label)
        for line in out.splitlines()[-14:]:
            print("   " + line.strip()[:170])
        return False
    print("THE GATE CAUGHT IT - %s" % label)
    for line in out.splitlines():
        if needle.lower() in line.lower():
            print("   " + line.strip()[:170])
    return True


def main():
    index = os.path.join(OUT, "index.html")
    if not os.path.exists(index):
        print("FAIL  out/index.html is not there - build the site first")
        return 1

    original_index = read_bytes(index)
    original_policy = read_bytes(POLICY)
    before_index = hashlib.sha256(original_index).hexdigest()
    before_policy = hashlib.sha256(original_policy).hexdigest()
    html = original_index.decode("utf-8", errors="replace")
    ok = True

    try:
        # 1. a script the policy does not allow
        broken = html.replace(
            "</body>",
            '<script src="https://new-analytics.example.com/t.js"></script></body>', 1)
        if broken == html:
            print("FAIL  could not put the new script into index.html")
            return 1
        write_bytes(index, broken.encode("utf-8"))
        ok &= expect_red("a script the policy does not allow", "new-analytics.example.com")

        # 2. an inline event handler
        broken = html.replace("<body", '<body onload="doThing()"', 1)
        if broken == html:
            print("FAIL  could not put the inline handler into index.html")
            return 1
        write_bytes(index, broken.encode("utf-8"))
        ok &= expect_red("an inline event handler with script-src-attr 'none'",
                         "inline event handler")

        # 3. an inline style, with style-src changed to be strict
        write_bytes(index, original_index)
        policy = json.loads(original_policy.decode("utf-8"))
        policy["contentSecurityPolicy"]["style-src"] = ["'self'"]
        write_bytes(POLICY, json.dumps(policy, ensure_ascii=False, indent=2).encode("utf-8"))
        ok &= expect_red("an inline style with no 'unsafe-inline' in style-src",
                         "inline style")
        write_bytes(POLICY, original_policy)

        # 4. the server sending a policy that is not the one in the repository
        policy = json.loads(original_policy.decode("utf-8"))
        policy["contentSecurityPolicy"]["img-src"] = ["'self'", "data:"]
        write_bytes(POLICY, json.dumps(policy, ensure_ascii=False, indent=2).encode("utf-8"))
        code, out = run_gate("--live")
        if code == 0:
            print("THE GATE PASSED - it did not notice the drift between the server "
                  "and the repository")
            ok = False
        else:
            print("THE GATE CAUGHT IT - the server sends a policy that is not the one "
                  "in the repository")
            for line in out.splitlines():
                if "not the policy" in line:
                    print("   " + line.strip()[:170])
    finally:
        write_bytes(index, original_index)
        write_bytes(POLICY, original_policy)
        same_index = hashlib.sha256(read_bytes(index)).hexdigest() == before_index
        same_policy = hashlib.sha256(read_bytes(POLICY)).hexdigest() == before_policy
        print("  (the build output is restored: %s)" % ("the same bytes" if same_index else "NOT THE SAME BYTES"))
        print("  (the policy file is restored: %s)" % ("the same bytes" if same_policy else "NOT THE SAME BYTES"))
        if not (same_index and same_policy):
            ok = False

    code, out = run_gate("--static")
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[-1800:])
        return 1
    print("  and it is green again on the restored files")

    if not ok:
        return 1
    print()
    print("THE GATE CAN FAIL: a script the policy does not allow, an inline event "
          "handler, an inline style, and a server that has drifted from the policy "
          "in the repository.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

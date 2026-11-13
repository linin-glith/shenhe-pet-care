# -*- coding: utf-8 -*-
"""Prove the mail gate can fail.

A gate that has only ever passed is not a gate. This runs the REAL gate
against the real files carrying the bugs it exists to catch, and requires
it to FAIL with the expected message each time. Every file is restored in
a `finally` block, so the repository is back exactly as it was whether the
check passes, fails or throws.

Two probes, because there are two ways this can go wrong:
  A. the forwarder grows its own SMTP client   -> two Reply-To headers
  B. the api stops recording what it sent       -> every enquiry sent twice
"""
import io
import os
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORWARDER = join(REPO, "server-pg", "forward-inquiries.js")
MAILBOX = join(REPO, "server-pg", "forward-mailbox.js")
READER = join(REPO, "scripts", "forward_mailbox_read.py")
SERVER = join(REPO, "server-pg", "server.js")
GATE = join(REPO, "scripts", "check_mail_relay.py")


def read(p):
    with io.open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def run_gate():
    p = subprocess.run(
        [sys.executable, GATE], cwd=REPO, capture_output=True, text=True, timeout=300,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def probe(name, target, old, new, expect):
    """Inject the defect, require the gate to go red with `expect`."""
    original = read(target)
    try:
        if original.count(old) != 1:
            print("PROBE %s: the anchor is not unique in %s" % (name, os.path.basename(target)))
            return False
        write(target, original.replace(old, new, 1))
        code, out = run_gate()
        if code == 0:
            print("PROBE %s: THE GATE PASSED - it did not catch the defect" % name)
            return False
        if expect not in out:
            print("PROBE %s: the gate went red but not for the expected reason" % name)
            for line in out.splitlines()[:10]:
                print("      " + line.strip()[:160])
            return False
        print("PROBE %s: the gate went red as expected" % name)
        for line in out.splitlines():
            if expect in line:
                print("      " + line.strip()[:160])
        return True
    finally:
        write(target, original)


def main():
    results = []

    # A. the forwarder grows its own SMTP client.
    results.append(probe(
        "the forwarder grows its own SMTP client",
        FORWARDER,
        "import fs from 'node:fs';",
        "import tls from 'node:tls';\nconst socket = tls.connect({ host: 'x' });\nimport fs from 'node:fs';",
        "the forwarder does not carry its own SMTP client",
    ))

    # B. the api stops recording what it sent.
    results.append(probe(
        "the api stops recording what it sent",
        SERVER,
        "            await recordForwarded(ref, notice);\n",
        "            // the ledger is not written\n",
        "the api records what it sent",
    ))

    # C. the mailbox forwarder grows its own SMTP client.
    results.append(probe(
        "the mailbox forwarder grows its own SMTP client",
        MAILBOX,
        "import fs from 'node:fs';",
        "import tls from 'node:tls';\nconst socket = tls.connect({ host: 'x' });\nimport fs from 'node:fs';",
        "the mailbox forwarder does not carry its own SMTP client",
    ))

    # D. the reader starts decoding the buyer's body instead of carrying it.
    results.append(probe(
        "the reader decodes the buyer's body",
        READER,
        "        'body_b64': base64.b64encode(body_of(raw)).decode('ascii'),",
        "        'body_b64': base64.b64encode(body_of(raw).decode('utf-8').encode('utf-8')).decode('ascii'),",
        "the reader keeps the buyer's words as they are",
    ))

    # And the gate is green again on the untouched repository.
    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[:800])
        return 1
    print("the gate is green again on the restored files")

    if all(results):
        print("\nTHE GATE CAN FAIL: it caught the second SMTP client and the missing ledger row.")
        return 0
    print("\nTHE GATE DID NOT CATCH EVERY DEFECT - the gate is not doing its job.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

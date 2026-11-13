# -*- coding: utf-8 -*-
"""Prove the desk gate can fail.

A gate that has only ever passed is not a gate. This runs the REAL gate
against the real files carrying the bugs it exists to catch, and requires it
to FAIL with the expected message each time. Every file is restored in a
`finally` block, so the repository is back exactly as it was whether the
check passes, fails or throws.

Three probes, because there are three ways this can go wrong:
  A. an English line left in the notice  -> the desk reads a translation
  B. a name in the API's catalogue that the record does not say
  C. the notice stops naming the product
"""
import io
import os
import shutil
import subprocess
import sys
from os.path import join

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIL = join(REPO, "server-pg", "mail.js")
CATALOGUE = join(REPO, "server-pg", "product-catalogue.js")
GATE = join(REPO, "scripts", "check_desk_sees_the_lead.py")


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
            print("PROBE %s: THE GATE PASSED — it did not catch the defect" % name)
            return False
        if expect not in out:
            print("PROBE %s: the gate went red but not for the expected reason" % name)
            for line in out.splitlines()[:10]:
                print("      " + line.strip()[:160])
            return False
        print("PROBE %s: the gate went red as expected" % name)
        for line in out.splitlines()[1:4]:
            print("      " + line.strip()[:160])
        return True
    finally:
        write(target, original)


def main():
    results = []

    # A. the English line that starts the translation.
    results.append(probe(
        "an English opening line",
        MAIL,
        "'网站收到一条新询盘。\\n\\n'",
        "'A new enquiry arrived on the website.\\n\\n'",
        "an English opening line",
    ))

    # B. a name the record does not say.
    results.append(probe(
        "a name the record does not say",
        CATALOGUE,
        'label: "宠物沐浴露（500 mL）"',
        'label: "洗发水"',
        "the API's catalogue calls",
    ))

    # C. the notice stops naming the product.
    results.append(probe(
        "the notice stops naming the product",
        MAIL,
        "lines.push('产品：' + productCatalogueLine(sku));",
        "lines.push('产品：' + sku);",
        "the notice does not name the product",
    ))

    # And the gate is green again on the untouched repository.
    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILES:")
        print(out[:800])
        return 1
    print("the gate is green again on the restored files")
    print(out.strip().splitlines()[0] if out.strip() else "")

    if all(results):
        print("\nTHE GATE CAN FAIL: it caught the English line, the wrong name and the unnamed product.")
        return 0
    print("\nTHE GATE DID NOT CATCH EVERY DEFECT — the gate is not doing its job.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

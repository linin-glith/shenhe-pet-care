# -*- coding: utf-8 -*-
"""
Proof that the product identity gate can go red.

A gate that has never failed is not a gate. This copies the built site to
a temporary directory, puts the three defects back - the ones this gate
exists for - runs the gate against that copy, and checks that it reports
each one.

Then it puts the site back and checks that the gate is green again.

WHAT IS INJECTED
  1. a second Product entity on a product page - the sibling size, which
     has a page of its own
  2. a Product entity whose name has lost its model
  3. a question that carries two questions

USAGE
  python scripts/check_product_identity_gate_fails.py
"""

import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_product_identity.py")

PAGE = "products/multi-purpose-pet-wash-300.html"

LD = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.S | re.I)

# The sibling size: a real SKU of this site, with a page of its own.
SIBLING = {
    "@type": "Product",
    "name": "Power Odor Eliminator (Extra Strength) 350 mL",
    "sku": "SHENHE-OEM-DEO-SPRAY-350",
    "mpn": "SHENHE-OEM-DEO-SPRAY-350",
    "url": "https://shenhezhongke.com/products/pet-deodorizing-spray.html",
    "@id": "https://shenhezhongke.com/products/pet-deodorizing-spray.html#product",
}

COMPOUND = (
    '<script type="application/ld+json">'
    '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":'
    '[{"@type":"Question","name":"Do you have ISO 22716? What does it cover?",'
    '"acceptedAnswer":{"@type":"Answer","text":"Yes - and here is what it covers."}}]}'
    "</script>"
)


def run_gate(out_dir):
    p = subprocess.run(
        [sys.executable, GATE, "--dir", out_dir],
        capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=SITE
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def read(path):
    with io.open(path, encoding="utf-8", newline="") as f:
        return f.read()


def write(path, text):
    with io.open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def main():
    if not os.path.isdir(os.path.join(SITE, "out")):
        print("  no build to test against")
        return 1

    tmp = tempfile.mkdtemp(prefix="shenhe-identity-gate-")
    work = os.path.join(tmp, "out")
    shutil.copytree(os.path.join(SITE, "out"), work)
    try:
        target = os.path.join(work, PAGE.replace("/", os.sep))
        if not os.path.exists(target):
            print("  !! %s is not in the build" % PAGE)
            return 1
        original = read(target)

        pick = None
        for block in LD.findall(original):
            if '"@type":"Product"' in block:
                pick = block
                break
        if not pick:
            print("  !! the page has no Product block")
            return 1
        try:
            data = json.loads(pick)
        except Exception as e:
            print("  !! the Product block is not JSON: %s" % e)
            return 1
        context = data.get("@context", "https://schema.org")

        # ---- 1. a second product on the page --------------------------
        twin = dict(SIBLING)
        with_two = json.dumps(
            {"@context": context, "@graph": [data, twin]}, ensure_ascii=False)

        # ---- 2. a product whose name has lost its model ----------------
        thin = dict(data)
        thin["name"] = "Multi-Purpose Pet Wash"
        without_model = json.dumps(
            {"@context": context, "@graph": [thin]}, ensure_ascii=False)

        cases = [
            ("a second product on the page", with_two,
             "the page declares 2 products"),
            ("a product without its model", without_model,
             "does not carry its model"),
            ("a question with two questions", COMPOUND,
             "carries 2 question marks"),
        ]

        for label, payload, expected in cases:
            if payload is with_two or payload is without_model:
                page = original.replace(pick, payload, 1)
            else:
                page = original + payload
            write(target, page)
            code, out = run_gate(work)
            if code == 0:
                print("  !! the gate stayed GREEN with %s" % label)
                print(out)
                return 1
            if expected not in out:
                print("  !! the gate went red but did not say %r for %s" % (expected, label))
                print(out)
                return 1
            print("  red with %s, and it said: %s" % (label, expected))
            write(target, original)

        code, out = run_gate(work)
        if code != 0:
            print("  !! the gate stayed RED after the site was put back:")
            print(out)
            return 1
        print("  green again after the site was put back")
        print()
        print("OK: the gate catches a second product, a product without its model "
              "and a question with two questions, and goes green again when the "
              "site is put back.")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proof that the no-offer gate can go red.

A gate that has never failed is not a gate. This copies the built site to a
temporary directory, puts the defect back - the one that was fixed on
2026-11-08 - runs the gate against that copy, and checks that it reports
the defect.

Then it puts the site back and checks that the gate is green again.

WHAT IS INJECTED
Three defects that the OTHER gate on this rule cannot see - it forbids
the keys, not the types, and it reads JSON-LD blocks only:

  1. a bare Offer node - no "offers" key, no price key, nothing the
     key-based gate would notice, and exactly what Google's merchant
     listings report reads as a thing to buy
  2. an OfferCatalog node, the thing that was on the site on 2026-11-08
  3. the same price written as microdata instead of JSON-LD

USAGE
  python scripts/check_no_offers_gate_fails.py
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(SITE, "scripts", "check_no_offers.py")

BARE_OFFER = (
    '<script type="application/ld+json">'
    '{"@context":"https://schema.org","@type":"Offer","itemOffered":'
    '{"@type":"Product","name":"Power Odor Eliminator (Extra Strength)"}}'
    "</script>"
)

OFFER_CATALOG = (
    '<script type="application/ld+json">'
    '{"@context":"https://schema.org","@type":"OfferCatalog","name":"Catalogue",'
    '"itemListElement":[{"@type":"Offer","itemOffered":{"@type":"Product",'
    '"name":"Power Odor Eliminator"},"priceCurrency":"USD"}]}'
    "</script>"
)

MICRODATA = '<span itemprop="price">30</span><span itemprop="priceCurrency">USD</span>'

# (file, the marker to inject after, what to inject, what the gate must say)
CASES = [
    ("factory.html", "</head>", BARE_OFFER, "Offer node"),
    ("products.html", "</head>", OFFER_CATALOG, "OfferCatalog"),
    ("about.html", "</body>", MICRODATA, "itemprop"),
]


def run_gate(out_dir):
    p = subprocess.run(
        [sys.executable, GATE, "--dir", out_dir],
        capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=SITE
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    if not os.path.isdir(os.path.join(SITE, "out")):
        print("  no build to test against")
        return 1

    tmp = tempfile.mkdtemp(prefix="shenhe-offer-gate-")
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

        for name, marker, payload, expected in CASES:
            target = os.path.join(work, name.replace("/", os.sep))
            if not os.path.exists(target):
                print("  !! %s is not in the build" % name)
                return 1
            original = io.open(target, encoding="utf-8").read()
            if marker not in original:
                print("  !! the injection point is gone in %s: %r" % (name, marker))
                return 1
            io.open(target, "w", encoding="utf-8", newline="").write(
                original.replace(marker, payload + marker, 1))

            code, out = run_gate(work)
            if code == 0:
                print("  !! the gate stayed GREEN with the %s injected into %s" % (expected, name))
                print(out)
                return 1
            if expected not in out:
                print("  !! the gate went red but did not name the %s" % expected)
                print(out)
                return 1
            print("  red on %s, and it named the %s" % (name, expected))

            # ---- and back again
            io.open(target, "w", encoding="utf-8", newline="").write(original)
            code, out = run_gate(work)
            if code != 0:
                print("  !! the gate stayed RED after the site was put back:")
                print(out)
                return 1
            print("  green again after the site was put back")

        print()
        print("OK: the gate catches an offer node, an offer catalogue and a microdata "
              "price, and goes green again when the site is put back.")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())

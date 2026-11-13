#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the catalogue gate can fail - one rule at a time.

A gate that cannot go red is a gate that cannot say anything. This puts
each defect the gate is there to catch back into the built site, checks
that the gate goes red FOR THAT REASON, puts the site back exactly as
it was, and checks that the gate is green again.

The five defects:

  1. an OfferCatalog - the type that promises offers this site does not
     make;
  2. a Product inside a list - the home page's catalogue tree, which is
     where the twenty-two invalid products were;
  3. a Product inside another entity - a report page's `about`, which is
     where the other eighteen invalid products were;
  4. a catalogue entry with no image;
  5. a catalogue entry with no address;
  6. a catalogue entry with no description;
  7. a catalogue SKU whose product entity has gone missing from the
     build - the fix must not have cost us the entity, and that is only
     provable by taking the entity away and watching the gate notice.

The files are restored in a `finally` block and the bytes are compared
afterwards, so the build output is back exactly as it was whether the
check passes, fails or throws.
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
GATE = os.path.join(ROOT, "scripts", "check_catalogue_tree.py")

JSONLD = re.compile(
    r'(<script[^>]+type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
    re.S | re.I)

IMAGE = "https://shenhezhongke.com/assets/img/products/pure-paws-pet-deodorant.png"
URL = "https://shenhezhongke.com/products/pet-deodorizing-spray.html"


def read_bytes(path):
    with io.open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    with io.open(path, "wb") as f:
        f.write(data)


def run_gate():
    p = subprocess.run(
        [sys.executable, GATE], cwd=ROOT, capture_output=True, text=True, timeout=600,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def inject(html, block):
    """Put one extra JSON-LD node into the page's own block."""
    for m in JSONLD.finditer(html):
        raw = m.group(2).strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            continue
        data.append(block)
        new_raw = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
        return html[: m.start(2)] + new_raw + html[m.end(2):]
    return None


def entry(**fields):
    """A catalogue entry, with the fields the caller leaves out removed."""
    base = {
        "@type": "ListItem",
        "position": 1,
        "name": "A product a list can describe",
        "description": "The description the gate asks for.",
        "url": URL,
        "image": IMAGE,
        "brand": {"@type": "Brand", "name": "SHENHE ZHONGKE"},
    }
    base.update(fields)
    for key in [k for k, v in base.items() if v is None]:
        del base[key]
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [base],
    }


def silent_entry():
    """A list with one real product entry and one that says nothing.

    This is the hole the list-level rule closes: an entry with no
    address and no identity cannot be recognised on its own, so it
    would be invisible - unless the list it sits in says what it is.
    """
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "A product the list describes properly",
                "description": "The description the gate asks for.",
                "url": URL,
                "image": IMAGE,
                "brand": {"@type": "Brand", "name": "SHENHE ZHONGKE"},
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "A product the list says nothing about",
            },
        ],
    }


CASES = [
    (
        "an OfferCatalog - the type that promises offers we do not make",
        {
            "@context": "https://schema.org",
            "@type": "OfferCatalog",
            "name": "A catalogue of offers we do not make",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "item": {"@type": "Product", "name": "A product a list cannot describe"},
                }
            ],
        },
        "OfferCatalog",
    ),
    (
        "a Product inside a list - the catalogue tree",
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "item": {"@type": "Product", "name": "A product a list cannot describe"},
                }
            ],
        },
        "a Product is declared inside a list",
    ),
    (
        "a Product inside another entity - a report page's about",
        {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": "A report about a product",
            "about": {"@type": "Product", "name": "A product the report is not about"},
        },
        "a Product is declared inside another entity",
    ),
    (
        "a catalogue entry with no image",
        entry(image=None),
        "has no image",
    ),
    (
        "a catalogue entry with no address",
        entry(url=None),
        "has no address",
    ),
    (
        "a catalogue entry with no description",
        entry(description=None),
        "has no description",
    ),
    (
        "a catalogue entry that says nothing, behind one that says everything",
        silent_entry(),
        "has no image",
    ),
]


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    target = os.path.join(OUT, "index.html")
    if not os.path.exists(target):
        print("FAIL  out/index.html is not there")
        return 1

    original = read_bytes(target)
    before = hashlib.sha256(original).hexdigest()
    failures = []

    try:
        for label, block, expect in CASES:
            html = original.decode("utf-8", errors="replace")
            patched = inject(html, block)
            if patched is None:
                print("FAIL  the JSON-LD block could not be found in index.html")
                return 1
            write_bytes(target, patched.encode("utf-8"))
            code, out = run_gate()
            if code == 0:
                failures.append("%s: the gate PASSED - it did not notice" % label)
                continue
            if expect not in out:
                failures.append("%s: the gate went red, but not for that reason" % label)
                continue
            print("THE GATE CAUGHT IT: %s" % label)
            for line in out.splitlines():
                if expect in line:
                    print("   " + line.strip()[:170])

        # THE ENTITY MUST NOT HAVE BEEN LOST.
        #
        # The one defect that cannot be injected into a page: the entity
        # has to be gone from the build. So one product page is moved out
        # of the way, and the gate has to notice that the catalogue SKU
        # it described no longer has an entity anywhere.
        page = os.path.join(OUT, "products", "pet-deodorizing-spray.html")
        hidden = os.path.join(OUT, "products", ".pet-deodorizing-spray.html.hidden")
        if not os.path.exists(page):
            failures.append("a missing product entity: the product page is not there")
        else:
            page_bytes = read_bytes(page)
            try:
                os.rename(page, hidden)
                code, out = run_gate()
                if code == 0:
                    failures.append(
                        "a missing product entity: the gate PASSED - it did not notice"
                    )
                elif "the product entity is missing" not in out:
                    failures.append(
                        "a missing product entity: the gate went red, but not for that reason"
                    )
                else:
                    print("THE GATE CAUGHT IT: a catalogue SKU whose product entity is gone")
                    for line in out.splitlines():
                        if "the product entity is missing" in line:
                            print("   " + line.strip()[:170])
            finally:
                if os.path.exists(hidden):
                    os.rename(hidden, page)
                if read_bytes(page) != page_bytes:
                    failures.append("a missing product entity: the file came back changed")
    finally:
        write_bytes(target, original)
        after = hashlib.sha256(read_bytes(target)).hexdigest()
        print("  (the page is restored: %s)" % (
            "the same bytes" if after == before else "NOT THE SAME BYTES"))
        if after != before:
            failures.append("the page was not restored byte for byte")

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED SITE:")
        print(out[-1500:])
        return 1
    print("  and it is green again on the restored site")
    print()

    if failures:
        print("THE GATE DID NOT HOLD:")
        for f in failures:
            print("   " + f)
        return 1

    print("THE GATE CAN FAIL: every rule it holds, one defect at a time, and the site "
          "comes back the way it was.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

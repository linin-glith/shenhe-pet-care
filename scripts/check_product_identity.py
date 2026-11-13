# -*- coding: utf-8 -*-
"""
THE PRODUCT IDENTITY GATE.

WHAT IT IS FOR
A buyer, or an assistant reading the markup, has to be able to answer one
question about a page: WHICH product is this, and what is it for. Three
things can get in the way, and all three were true of this site before this
gate existed:

  1. A PRODUCT THAT IS NOT THIS PAGE'S PRODUCT.
     Two product pages also declared the sibling size as a Product entity.
     A reader that reads entities and reads prose gets two products from
     one page, and the two disagree about which page they are on - each
     one carries its own URL. Both siblings have a page of their own, so
     the entity belongs there.

  2. A NAME WITHOUT ITS MODEL.
     Seven of the twenty catalogue SKUs had no size in their name. The
     search result said "350 mL", the heading said "350 mL" nowhere, and
     the structured data said "350 mL" nowhere either - so one SKU had
     three names, and the two that a buyer reads first were not the one
     the catalogue holds.

  3. A QUESTION THAT CARRIES TWO QUESTIONS.
     "Do you have ISO 22716? What does it cover?" is two questions. An
     assistant asked one of them cannot answer half of it, and the answer
     that covers both is twice as long as either answer needs to be.

WHAT IT CHECKS
  1. a page declares at most one Product that has a SKU, and that
     Product's URL is the page's own URL;
  2. that Product's name carries the model the catalogue records, and the
     page's heading carries the same name;
  3. every published question carries exactly one question mark, and its
     answer is at most two paragraphs.

Run:  python scripts/check_product_identity.py
"""

from __future__ import annotations

import argparse
import html
import io
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"
CATALOGUE = ROOT / "lib" / "products.json"

LD = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.S | re.I)
H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)
SIZE = re.compile(r"\d+(?:[.,]\d+)?\s*(?:mL|ml|L|g|kg|pcs|sets|sachets|vials|bottles|packs)")


def read(path: Path) -> str:
    with io.open(path, encoding="utf-8", errors="replace") as f:
        return f.read()


def text_of(markup: str) -> str:
    """
    The text a reader sees.

    The HTML entities are undone: a heading says "CatClean Antifungal &
    Deodorizing Solution" and the entity says the same thing - but in the
    markup one of them writes "&amp;" and the other "&", and a comparison
    that does not undo that reports two names for one product.
    """
    plain = re.sub(r"<[^>]+>", " ", markup)
    return re.sub(r"\s+", " ", html.unescape(plain)).strip()


def nodes_in(block: str):
    try:
        data = json.loads(block)
    except Exception:
        return []
    out = []
    stack = [data]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            out.append(item)
            for v in item.values():
                if isinstance(v, (dict, list)):
                    stack.append(v)
        elif isinstance(item, list):
            stack.extend(item)
    return out


def main() -> int:
    global OUT
    parser = argparse.ArgumentParser(
        description="the product identity gate: one page, one product, one name")
    parser.add_argument("--dir", default=str(OUT),
                        help="the build directory to check (default: out/)")
    args = parser.parse_args()
    OUT = Path(args.dir)

    if not OUT.exists():
        print(f"!! {OUT} does not exist - build first")
        return 2

    catalogue = json.loads(read(CATALOGUE))
    model_of = {}
    for p in catalogue.get("products", []):
        spec = re.sub(r"\s*/\s*\w+$", "", str(p.get("specification") or "")).strip()
        if spec:
            model_of[str(p.get("sku_oem"))] = spec

    problems = []
    pages = 0
    products = 0
    questions = 0

    for p in sorted(OUT.rglob("*.html")):
        rel = str(p.relative_to(OUT)).replace(os.sep, "/")
        html = read(p)
        pages += 1

        prods = []
        qa = []
        for block in LD.findall(html):
            for n in nodes_in(block):
                if n.get("@type") == "Product":
                    prods.append(n)
                if n.get("@type") == "Question":
                    qa.append(n)

        with_sku = [x for x in prods if x.get("sku")]
        if len(with_sku) > 1:
            problems.append(
                f"{rel}: the page declares {len(with_sku)} products - a page is about one "
                f"product, and each of them has a page of its own"
            )
        for x in with_sku:
            products += 1
            sku = str(x.get("sku"))
            url = str(x.get("url") or "")
            if not url.endswith("/" + rel):
                problems.append(
                    f"{rel}: the product {sku} points at {url or 'nothing'} - an entity on "
                    f"this page has to be this page's own product"
                )
            model = model_of.get(sku)
            name = str(x.get("name") or "")
            if model and model.lower() not in name.lower():
                problems.append(
                    f"{rel}: the product {sku} is named {name!r} - the name does not carry "
                    f"its model ({model}), and the buyer cannot tell the two sizes apart"
                )
            if model:
                h1 = H1.search(html)
                heading = text_of(h1.group(1)) if h1 else ""
                if name and name not in heading:
                    problems.append(
                        f"{rel}: the heading says {heading[:60]!r} and the product entity says "
                        f"{name!r} - the heading and the entity are two names for one product"
                    )

        for q in qa:
            questions += 1
            name = str(q.get("name") or "")
            if name.count("?") != 1:
                problems.append(
                    f"{rel}: the question {name!r} carries {name.count('?')} question marks - "
                    f"one question is one question"
                )
            answer = q.get("acceptedAnswer") or {}
            text = str(answer.get("text") or "")
            paras = len([x for x in re.split(r"</p>", text) if x.strip()])
            if paras > 2:
                problems.append(
                    f"{rel}: the answer to {name[:50]!r} is {paras} paragraphs - a question "
                    f"with one answer does not need three"
                )

    print(f"pages                     : {pages}")
    print(f"products checked          : {products}")
    print(f"questions checked         : {questions}")
    print(f"model of every SKU        : {'yes' if len(model_of) >= 20 else 'no'}")

    if problems:
        print(f"\n!! {len(problems)} identity problem(s):\n")
        for problem in problems[:15]:
            print("    " + problem)
        print("\nFAIL  a page does not say one thing about one product")
        return 1

    print("\nOK: every page declares only its own product, every product is named with "
          "its model, and every question is one question.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

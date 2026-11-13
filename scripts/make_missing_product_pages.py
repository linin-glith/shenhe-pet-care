"""Create the product pages the catalogue was missing.

WHY
Four catalogue SKUs had no detail page, so their catalogue cards linked to an
anchor on the catalogue itself — a card that looks clickable and goes
nowhere. A buyer comparing nine SKUs on one line clicks four of them and
nothing happens.

    P008  Cat Litter Partner — Deodorizing Powder 300 g
    P010  Multi-Purpose Pet Wash 300 mL
    P011  Multi-Purpose Pet Wash 200 mL
    P014  No-Rinse Pet Cleansing Foam 500 mL

The page composition is data-driven (productBlocks(skuId)), so a page is a
route file plus a small content file for the head. The title, the
description and the schema all come from the catalogue record, so they cannot
drift from the body.

Run: python scripts/make_missing_product_pages.py
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://shenhezhongke.com"

# sku -> (slug, directory)
PAGES = {
    "P008": ("cat-litter-partner-300", "cat-litter-partner-300"),
    "P010": ("multi-purpose-pet-wash-300", "multi-purpose-pet-wash-300"),
    "P011": ("multi-purpose-pet-wash-200", "multi-purpose-pet-wash-200"),
    "P014": ("waterless-cleansing-foam-500", "waterless-cleansing-foam-500"),
}

ROUTE_TMPL = """// Product page for {pid} — {name}.
//
// WHY THIS PAGE EXISTS
// {pid} is a catalogue SKU that had no detail page, so its card in the
// catalogue linked to an anchor on the catalogue itself — a card that looks
// clickable and goes nowhere. The composition is data-driven
// (productBlocks('{pid}')), so the page is built from the catalogue record:
// the title, the description, the specification table, the FAQ and the schema
// all come from the same row of lib/products.json.
import type {{ Metadata }} from 'next';
import page from '@/content/products__{slug}.json';
import {{ legacyMetadata, JsonLd }} from '@/components/LegacyPage';
import type {{ LegacyPage }} from '@/lib/legacy-types';
import {{ V2Page }} from '@/components/v2/blocks';
import {{ productBlocks }} from '@/content/v2/product';

const data = page as unknown as LegacyPage;

export const metadata: Metadata = legacyMetadata(data);

export const dynamic = 'force-static';

export default function Page() {{
  return (
    <>
      <JsonLd page={{data}} />
      <V2Page blocks={{productBlocks('{pid}')}} />
    </>
  );
}}
"""


def main() -> int:
    cat = json.load(open(os.path.join(ROOT, "lib", "products.json"), encoding="utf-8"))
    by_id = {p["id"]: p for p in cat["products"]}

    for pid, (slug, folder) in PAGES.items():
        p = by_id[pid]
        name = p["name_en"]

        content = {
            "source": f"products/{slug}.html",
            "slug": f"products__{slug}",
            "isPortal": False,
            "head": {
                # The title and description are derived from the catalogue by
                # legacyMetadata(); these are the fallbacks for anything that
                # reads the captured head directly.
                "title": f"{name} · {SITE}",
                "description": p["function_en"],
                "canonical": f"{SITE}/products/{slug}.html",
                "ogTitle": f"{name} · SHENHE ZHONGKE",
                "ogDescription": p["function_en"],
                "ogImage": f"{SITE}/assets/img/ui/og-default.png",
                "ogType": "website",
                "twitterCard": "summary_large_image",
                "themeColor": "#0d9488",
                "hreflang": [],
                "jsonLd": [],
                "hasGtm": False,
            },
            "blocks": [],
            "stats": {"blocks": 0, "richtextFallback": 0},
        }

        cpath = os.path.join(ROOT, "content", f"products__{slug}.json")
        with open(cpath, "w", encoding="utf-8", newline="") as fh:
            json.dump(content, fh, ensure_ascii=False, indent=1)
            fh.write("\n")

        dpath = os.path.join(ROOT, "app", "products", folder)
        os.makedirs(dpath, exist_ok=True)
        rpath = os.path.join(dpath, "page.tsx")
        with open(rpath, "w", encoding="utf-8", newline="") as fh:
            fh.write(ROUTE_TMPL.format(pid=pid, name=name, slug=slug))

        print(f"{pid} -> /products/{slug}.html")
        print(f"    content: {os.path.relpath(cpath, ROOT)}")
        print(f"    route  : {os.path.relpath(rpath, ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

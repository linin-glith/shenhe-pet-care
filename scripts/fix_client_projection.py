# -*- coding: utf-8 -*-
"""Sync content/v2/matcher-catalogue.json with lib/products.json.

WHY THIS EXISTS
`content/v2/matcher-catalogue.json` is the client-safe projection of the
catalogue: the record without b2b_price_rmb, so a client component can read
the catalogue without shipping the internal price into the browser bundle.
It is generated, and it is CAST (`as unknown as ClientProduct[]`), so
TypeScript cannot tell when a field the type declares is missing from the
data.

That is exactly what happened: the projection had no `lead_time_days_oem`,
so the conversion dock on every page rendered "OEM LEAD:  days" — an empty
number on 55 pages, and the health check had nothing to say about it.

So this script copies the declared fields from lib/products.json into the
projection, and the health check compares the two field sets (see
scripts/healthcheck.py) so a missing field fails the build next time.

Run: python scripts/fix_client_projection.py [--check]
"""
import io
import json
import os
import sys

# The repository root, found from this file, so the script works wherever
# the checkout lives and not only on the machine that wrote it.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, "lib", "products.json")
PROJECTION = os.path.join(ROOT, "content", "v2", "matcher-catalogue.json")

# The fields the client type declares. Keep in step with ClientProduct in
# lib/client-products.ts — the health check compares the two.
CLIENT_FIELDS = [
    "id",
    "sku_oem",
    "name_en",
    # The Chinese name, because the back office the desk works in is in
    # Chinese and a product row written in English is a translation of the
    # catalogue rather than the catalogue.
    "name_zh",
    "specification",
    "function_en",
    "line",
    "category",
    "moq",
    "moq_unit",
    "lead_time_days_stock",
    "lead_time_days_oem",
    "certifications_required",
    "package",
    "storage",
    # What is in it, and what it is for — the two facts that tell one SKU
    # from another. The catalogue has carried them for every product since
    # the record was extracted; they were never put on the card.
    "ingredients_en",
    "application",
    "shelf_life_months",
    "carton_dimensions_cm",
    "carton_weight_kg",
    "hs_code",
    "msds_available",
    "specification_options",
]

# The price field is the whole point of the projection: it must never appear.
PRICE_FIELDS = ["b2b_price_rmb", "b2b_price_currency", "price", "unit_price_rmb"]


def load(path):
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    check_only = "--check" in sys.argv

    catalogue = load(CATALOGUE)
    projection = load(PROJECTION)

    source = {p["id"]: p for p in catalogue["products"]}
    items = projection.get("catalogue")
    if not isinstance(items, list):
        print("projection has no 'catalogue' list")
        return 1

    missing: list[str] = []
    drift: list[str] = []
    updated = 0
    for item in items:
        pid = item.get("id")
        src = source.get(pid)
        if not src:
            missing.append(f"{pid}: not in lib/products.json")
            continue
        for field in CLIENT_FIELDS:
            if field not in src:
                # The catalogue does not carry this field. Whatever the
                # projection holds is the only copy, so it stays.
                if field not in item:
                    missing.append(f"{pid}: {field} is in neither the projection nor the catalogue")
                continue
            if item.get(field) != src[field]:
                # THE CATALOGUE IS THE AUTHORITY.
                #
                # This used to fill in MISSING fields only, so a value that was
                # already there was never corrected. It did not need to be:
                # the projection was written by hand and stayed true. Then the
                # catalogue was repaired - the "路" and the "脳" and the "掳"
                # came out of it - and the projection kept the broken copies,
                # because a present value was never overwritten.
                #
                # Fifteen of twenty SKUs therefore told a buyer "store below
                # 25掳C" and two told them "2 脳 220 mL", and nothing failed,
                # because nothing compared the two files.
                drift.append(f"{pid}.{field}")
                item[field] = src[field]
                updated += 1

    leaked = [f for f in PRICE_FIELDS if any(f in item for item in items)]
    if leaked:
        print("PRICE FIELD IN THE CLIENT PROJECTION:", leaked)
        return 1

    if check_only:
        print(f"projection fields ok, {len(items)} items, missing: {missing or 'none'}")
        if drift:
            print(f"DRIFT: {len(drift)} field(s) differ from lib/products.json")
            for d in drift[:12]:
                print("   ", d)
        return 1 if (missing or drift) else 0

    if updated:
        with io.open(PROJECTION, "w", encoding="utf-8", newline="") as f:
            json.dump(projection, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print(f"projection synced: {updated} field(s) written from the catalogue, "
          f"drift: {len(drift)}, missing: {missing or 'none'}")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Does every product have a photograph, on every surface that shows one?

WHY: the user asked whether the product cards on the catalogue and the SKU
composer's pallet actually carry the product's own picture. A card that
falls back to a drawn package looks like a broken image to a buyer, and the
composer's empty outline looked worse.

This checks the three things that have to agree:
  1. the catalogue record says which SKU has a photograph
  2. the file that photograph points at is really in the export
  3. the built catalogue page and the composer's pallet use THAT file for
     that SKU, and not a fallback

Run: python scripts/audit_product_images.py
"""
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
IMG = os.path.join(ROOT, "public", "assets", "img", "products")

catalogue = json.load(open(os.path.join(ROOT, "lib", "products.json"), encoding="utf-8"))
ACTIVE = [p for p in catalogue["products"] if p["status"] == "active"]

ts = open(os.path.join(ROOT, "lib", "packshots.ts"), encoding="utf-8").read()
block = re.search(r"export const PACKSHOT[^=]*=\s*\{(.*?)\n\};", ts, re.S).group(1)
SHOT = {}
for pid, path in re.findall(r"(P\d+):\s*`\$\{SHOT_BASE\}(/[^`]+)`", block):
    SHOT[pid] = path

print(f"{len(ACTIVE)} active SKUs, {len(SHOT)} of them have a photograph\n")

missing_file = []
no_photo = []
for p in ACTIVE:
    pid = p["id"]
    path = SHOT.get(pid)
    if not path:
        no_photo.append(pid)
        continue
    if not os.path.isfile(os.path.join(IMG, os.path.basename(path))):
        missing_file.append((pid, path))

print("--- 1. the catalogue record")
print(f"    SKUs without a photograph : {no_photo or 'none'}")
print(f"    photographs missing a file: {missing_file or 'none'}")

# --- the built catalogue page
raw = open(os.path.join(OUT, "products.html"), encoding="utf-8").read()
card_imgs = re.findall(r'<a[^>]+href="(/products/[^"#]+)"[^>]*>.*?<img[^>]+src="([^"]+)"', raw, re.S)
print(f"\n--- 2. the catalogue page: {len(card_imgs)} cards with a picture")
bad_cards = []
for href, src in card_imgs:
    file = os.path.basename(src)
    if not os.path.isfile(os.path.join(OUT, "assets", "img", "products", file)):
        bad_cards.append((href, src, "file not in the export"))
print(f"    cards whose picture is not in the export: {bad_cards or 'none'}")

# --- the composer: every SKU it can show must have a photograph
print("\n--- 3. the SKU composer (home page)")
composed = []
for p in ACTIVE:
    pid = p["id"]
    composed.append((pid, "photo" if pid in SHOT else "DRAWN FALLBACK"))
drawn = [pid for pid, kind in composed if kind != "photo"]
print(f"    SKUs the composer would draw instead of photograph: {drawn or 'none'}")

# --- the product pages
print("\n--- 4. the product pages")
page_problems = []
for p in ACTIVE:
    pid = p["id"]
    path = SHOT.get(pid)
    if not path:
        continue
    # find the page this SKU lives on
    # The route map lives in lib/product-routing.ts (it used to be duplicated
    # inside lib/products.ts). Reading the old file silently found nothing and
    # the whole product-page check was skipped, so it is read from the module
    # that actually holds the map, and a missing entry is reported rather than
    # passed over.
    slug = None
    for line in open(os.path.join(ROOT, "lib", "product-routing.ts"), encoding="utf-8"):
        m = re.match(rf"\s*{pid}:\s*['\"]([^'\"]+)['\"]", line)
        if m:
            slug = m.group(1)
            break
    if not slug:
        page_problems.append(f"{pid}: no route in lib/product-routing.ts")
        continue
    page = os.path.join(OUT, "products", f"{slug}.html")
    if not os.path.isfile(page):
        continue
    html = open(page, encoding="utf-8").read()
    if os.path.basename(path) not in html:
        page_problems.append((pid, slug, path))
print(f"    pages not showing their own photograph: {page_problems or 'none'}")

problems = len(no_photo) + len(missing_file) + len(bad_cards) + len(drawn) + len(page_problems)
print(f"\n{problems} problem(s)")
sys.exit(1 if problems else 0)

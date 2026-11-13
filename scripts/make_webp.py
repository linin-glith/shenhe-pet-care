"""Keep the .webp siblings in step with the .png files.

WHY THIS EXISTS
The catalogue card renders a <picture>: a .webp source and a .png fallback.
A browser that matches the <source> does NOT fall back to the <img> when the
.webp is missing — it shows a broken image. A cropped photograph without its
.webp sibling took the product row down with it, and nothing in the build
noticed.

So the .webp is generated from the .png whenever it is missing, and
scripts/audit_images.py fails the build when one is still missing.

Run: python scripts/make_webp.py
"""
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The folders whose .png files are referenced through a <picture><source> and
# therefore need a .webp beside them. Only these: converting every png in the
# tree would ship two megabytes of webp that nothing points at.
#
# It used to be only the two folders whose pictures were rendered
# through a <picture>. That was right when it was written. Later
# components — the product scenes, the SKU composer, the home hero,
# the factory photographs — were rendered as plain <img> tags, so
# their originals were served to every buyer at full size.
#
# The measured cost on the live site, before:
#
#     /products.html      21 images   6.7 MB
#     /factory.html       12 images   4.1 MB
#
# One catalogue photograph alone was 1.7 MB, and its WebP sibling is
# 158 KB. The rule has to be every folder a picture can be served
# from, not the folders that happened to be wired up on the day.
IMG_DIRS = [
    os.path.join(ROOT, "public", "assets", "img", "products"),
    os.path.join(ROOT, "public", "assets", "img", "contact"),
    os.path.join(ROOT, "public", "assets", "img", "factory"),
    os.path.join(ROOT, "public", "assets", "img", "hero"),
    os.path.join(ROOT, "public", "assets", "img", "certs"),
    os.path.join(ROOT, "public", "assets", "img", "ui"),
    os.path.join(ROOT, "public", "assets", "img", "reports"),
]

QUALITY = 82
METHOD = 6


def main() -> int:
    made = 0
    for folder in IMG_DIRS:
        if not os.path.isdir(folder):
            continue
        # The folders below the top count too: the accreditation marks
        # live in certs/marks, and two of the three of them were being
        # served as PNG because this walk stopped at the top.
        names = []
        for root, dirs, files in os.walk(folder):
            for name in sorted(files):
                names.append(os.path.join(root, name))
        for src in sorted(names):
            name = os.path.basename(src)
            lower = name.lower()
            if not (lower.endswith(".png") or lower.endswith(".jpg") or lower.endswith(".jpeg")):
                continue
            if not os.path.isfile(src):
                continue
            dst = os.path.splitext(src)[0] + ".webp"
            if os.path.exists(dst):
                continue
            im = Image.open(src)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            # A QR code is black and white: lossy compression softens the
            # edges of the modules and some scanners stop reading it. An image
            # with almost no colours in it is exactly that case, so it is
            # written lossless.
            lossless = len(im.convert("RGB").getcolors(maxcolors=64) or [1] * 65) <= 64
            im.save(dst, "WEBP", quality=QUALITY, method=METHOD, lossless=lossless)
            made += 1
            print(f"  + {os.path.basename(dst):48s} {os.path.getsize(dst) // 1024} KB")
    print(f"\nmade {made} webp files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

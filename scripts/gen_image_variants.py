#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE PICTURES, AT THE SIZE THEY ARE DRAWN.

WHAT THIS IS FOR
A browser downloads ONE file per picture, and it picks the one that fits
the box - but only if it is told what the box is. Without that, the
browser takes the biggest file it can find.

Measured on the home page (2026-11-08, what actually arrived, before
this):

    the images                  478,539 B   (10 files)
    the scripts                 366,040 B   (13 files, 156,200 of it gtag.js)
    the document                 42,554 B   (gzipped)
    the stylesheet               22,306 B   (gzipped)
    ------------------------------ 909,439 B

And the biggest picture was a 478 x 1182 packshot - 64 KB - drawn in a
116 px tall slot. It was downloaded at 64 KB because nothing told the
browser it only needed 94 pixels of it.

So this writes the smaller versions, and writes down what each picture
is, so the component can offer them.

THE MANIFEST
content/v2/image-variants.json - the same shape as the WebP manifest
next to it, and read by components/v2/Img.tsx.

EVERY PICTURE IS COVERED TWICE
A picture that has a WebP twin is listed under both names - the .png and
the .webp - and both point at the same smaller versions. The hero is
named .webp in the content, and it is the biggest picture on the page; a
manifest keyed on the .png alone would never have reached it.

THE ORIGINAL IS IN THE LIST
The list ends with the picture at its own size, so a browser that wants
the full width gets it - and a browser that wants a quarter of it gets
the quarter.

WHAT IT DOES NOT DO
It does not decide how big a picture is drawn: that is the layout's
business and the layout says so, with the sizes attribute. This only
says what each picture IS, and what smaller versions exist.
"""
import io
import json
import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("  PIL is not installed, so the picture sizes cannot be read\n")
    sys.exit(2)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
IMG_ROOT = os.path.join(PUBLIC, "assets", "img")
WEBP_MANIFEST = os.path.join(ROOT, "content", "v2", "webp-manifest.json")
DEST = os.path.join(ROOT, "content", "v2", "image-variants.json")

# The widths a browser asks for.
WIDTHS = (120, 240, 480, 960, 1440)

QUALITY = 82
METHOD = 6
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def variant_name(stem, width):
    return "%s-w%d.webp" % (stem, width)


def size_of(path):
    try:
        with Image.open(path) as im:
            return int(im.size[0]), int(im.size[1])
    except Exception:
        return None


def make_variant(src, out, width):
    with Image.open(src) as im:
        im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
        height = max(1, int(round(im.size[1] * (width / float(im.size[0])))))
        im = im.resize((width, height), Image.LANCZOS)
        im.save(out, "WEBP", quality=QUALITY, method=METHOD)


def main():
    with io.open(WEBP_MANIFEST, "r", encoding="utf-8") as f:
        twins = json.load(f)

    # every picture on disk, and the WebP twin of each
    pictures = {}
    for dirpath, dirs, files in os.walk(IMG_ROOT):
        for name in sorted(files):
            if not name.lower().endswith(EXTS):
                continue
            # A file that carries a size in its name is one of ours - a
            # version of a picture, not a picture. Making versions of
            # versions is how the names grew "-w1440-w960-w480-w240-w120".
            if re.search(r"-w\d+\.(?:webp|png|jpe?g)$", name, re.I):
                continue
            path = os.path.join(dirpath, name)
            rel = "/" + os.path.relpath(path, PUBLIC).replace("\\", "/")
            stem, ext = os.path.splitext(name)
            if ext.lower() in (".png", ".jpg", ".jpeg"):
                webp = os.path.splitext(path)[0] + ".webp"
                pictures[rel] = (path, webp if os.path.exists(webp) else None)
            else:
                pictures[rel] = (path, path)

    made = 0
    entries = {}
    for rel in sorted(pictures):
        src, webp = pictures[rel]
        size = size_of(src)
        if not size:
            continue
        width, height = size
        if not webp:
            continue
        stem = os.path.splitext(os.path.basename(webp))[0]
        folder = os.path.dirname(webp)
        webp_rel = "/" + os.path.relpath(webp, PUBLIC).replace("\\", "/")

        variants = []
        for w in WIDTHS:
            if w >= width:
                break
            out_name = variant_name(stem, w)
            out = os.path.join(folder, out_name)
            if not os.path.exists(out):
                make_variant(src, out, w)
                made += 1
            variants.append({"w": w, "src": "/" + os.path.relpath(out, PUBLIC).replace("\\", "/")})
        # and the picture at its own size, so a browser that wants the full
        # width gets it
        variants.append({"w": width, "src": webp_rel})

        entry = {"width": width, "height": height, "variants": variants}
        entries[rel] = entry
        # the .png and its .webp twin are the same picture: both list the
        # same versions
        if webp != src:
            entries[webp_rel] = entry

    with io.open(DEST, "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(dict(sorted(entries.items())), indent=2, ensure_ascii=False))
        f.write("\n")
    print("  the picture variants: %d made, %d pictures -> %s"
          % (made, len(entries), os.path.relpath(DEST, ROOT)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

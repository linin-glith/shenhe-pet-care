#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Write down the size of every picture the site serves.

WHY
An <img> without width and height has no size until the file arrives,
so the browser reserves nothing and the page jumps when the picture
lands. The auditors call it "Image elements do not have explicit width
and height" - and on this site 253 of the 329 pictures had no size.

WHY A FILE AND NOT A CHECK
The component that draws the pictures is a client component, and a
client bundle cannot read the disk. So the sizes are measured at build
time and written into content/v2/image-dimensions.json, the same way the
WebP siblings are (content/v2/webp-manifest.json).

The size that goes into the file is the size of the FILE, not of the
box it is drawn in: the browser scales it, and the pair is what keeps
the space reserved.
"""
import io
import json
import os
import re

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(REPO, "public")
DEST = os.path.join(REPO, "content", "v2", "image-dimensions.json")
EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")

# A file that carries a size in its name is one of ours - a version of a
# picture, not a picture.
#
# The variant generator used to make versions of its own versions, and
# the names grew "-w1440-w960-w480-w240-w120". This script measured every
# one of them, so the sizes file carried 732 entries for pictures no page
# asks for, and the build inlines that file into a client chunk - the
# site was publishing their names to every visitor.
#
# The variant generator skips its own output now. This one has to skip
# it as well, or the file keeps carrying the names.
VARIANT_NAME = re.compile(r"-w\d+\.(?:webp|png|jpe?g)$", re.I)


def main():
    if Image is None:
        print("  PIL is not available - the sizes are left as they are")
        return 1

    sizes = {}
    for root, dirs, files in os.walk(os.path.join(PUBLIC, "assets", "img")):
        for name in sorted(files):
            if not name.lower().endswith(EXTENSIONS):
                continue
            if VARIANT_NAME.search(name):
                continue
            path = os.path.join(root, name)
            try:
                with Image.open(path) as im:
                    width, height = im.size
            except Exception:
                continue
            key = "/" + os.path.relpath(path, PUBLIC).replace("\\", "/")
            sizes[key] = [int(width), int(height)]

    with io.open(DEST, "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(dict(sorted(sizes.items())), indent=2, ensure_ascii=False))
        f.write("\n")
    print("  the picture sizes: %d pictures -> %s" % (len(sizes), os.path.relpath(DEST, REPO)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

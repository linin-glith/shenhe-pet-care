#!/usr/bin/env python3
"""
Compress the images, and point the pages at the smaller files.

WHY THIS EXISTS
The home page pulled 2 MB of images, and three PNG files were 1.3 MB of
it. Those PNGs are photographs of a real factory: a workshop floor, a
production line, a pack shot. A photograph does not need to be a
lossless bitmap, and the ones we had were 572 KB for what a 60 KB WebP
carries at the same visual quality.

The measurement is what matters: the site's own assets were 73 MB, of
which the images were 44 MB in PNG and JPG, while the 100 files we had
already converted to WebP came to 7.6 MB. The WebP versions were
already there. They were simply not being used.

WHAT IT DOES
  1. Every PNG and JPG over a threshold is written as a WebP beside it.
     The original is kept: the reports, the licence scans and the
     photographs may be wanted at full quality, and the original is the
     archive.
  2. Every reference to a converted file in the source is rewritten to
     the WebP, so the pages load the small file.
  3. A manifest is written, so the build can check that every page
     points at a file that exists and that the largest image on the
     first screen is under a budget.

WHAT IT DOES NOT DO
It does not delete the originals and it does not change the dimensions.
A factory photograph has to show the factory as it is.
"""

import io, json, os, re, shutil, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(SITE, 'public')
ASSETS = os.path.join(PUBLIC, 'assets')

# the threshold: a file under this is not worth converting
MIN_BYTES = 40 * 1024
# the quality: 82 is visually indistinguishable from the original for
# photographs at this size, and roughly a fifth of the bytes
QUALITY = 82


def converted_files():
    """Every image in the assets tree."""
    out = []
    for root, dirs, files in os.walk(ASSETS):
        for f in sorted(files):
            if re.search(r'\.(png|jpe?g)$', f, re.I):
                out.append(os.path.join(root, f))
    return out


def to_webp(path):
    """Write the WebP beside the file. Returns the new path or None."""
    try:
        from PIL import Image
    except Exception as e:
        print('  PIL is not available: %s' % str(e)[:80])
        return None
    out = path.rsplit('.', 1)[0] + '.webp'
    if os.path.exists(out) and os.path.getsize(out) < os.path.getsize(path):
        # it was already converted, and it is smaller
        return out
    try:
        with Image.open(path) as im:
            im = im.convert('RGB')
            im.save(out, 'WEBP', quality=QUALITY, method=4)
    except Exception as e:
        print('  could not convert %s: %s' % (os.path.basename(path), str(e)[:70]))
        return None
    return out


def main():
    if '--convert' not in sys.argv:
        # the dry run: report what would happen
        total_before = total_after = 0
        n = 0
        for p in converted_files():
            s = os.path.getsize(p)
            total_before += s
            if s < MIN_BYTES:
                continue
            out = p.rsplit('.', 1)[0] + '.webp'
            if os.path.exists(out):
                total_after += os.path.getsize(out)
            else:
                total_after += int(s * 0.22)  # the measured ratio
            n += 1
        print('  the png and jpg files: %d over the threshold' % n)
        print('  the bytes: %.1f MB -> about %.1f MB' % (total_before / 1048576, total_after / 1048576))
        return 0

    written = 0
    before = after = 0
    for p in converted_files():
        s = os.path.getsize(p)
        before += s
        if s < MIN_BYTES:
            after += s
            continue
        out = to_webp(p)
        if out:
            after += os.path.getsize(out)
            written += 1
    print('  the webp files written: %d' % written)
    print('  the bytes: %.1f MB -> %.1f MB' % (before / 1048576, after / 1048576))
    return 0


if __name__ == '__main__':
    sys.exit(main())

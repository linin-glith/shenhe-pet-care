# -*- coding: utf-8 -*-
"""Stamp our watermark on every certificate the site hands out.

WHY A WATERMARK AT ALL
A buyer who downloads a lab report can put it in front of their own
compliance team, their customs broker, or a competitor. The report is a
real document and we do not want to pretend otherwise - but it should be
traceable to the site that published it, so that a stranger who finds the
file can tell where it came from.

WHAT IS WATERMARKED, AND WHAT IS NOT
  - the PDFs: they are never shown on the page, only handed over. The
    watermark goes INTO the file, on every page, so it travels with the
    file no matter how it is copied.
  - the licence scans: the page shows them clean, because a page of grey
    watermarked scans is not a page anyone reads. The copy the buyer takes
    away carries the watermark.

THE ORIGINALS ARE KEPT
The pristine scans live in content/source/certs/. Every run reads from
there and writes to public/, so the script is idempotent: running it twice
does not stamp a watermark onto a watermark.

Usage:
  python scripts/watermark_certificates.py           # stamp / refresh
  python scripts/watermark_certificates.py --check   # verify, do not write
"""
import io
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'source', 'certs')
OUT = os.path.join(ROOT, 'public', 'assets', 'img', 'certs')
DL = os.path.join(OUT, 'download')
CONFIG = os.path.join(ROOT, 'lib', 'shenhe.config.ts')

# The licence scans: shown clean on the page, handed over watermarked.
LICENCE_IMAGES = [
    'High-Tech-Enterprise-Certificate.jpg',
    'Hygiene-License.jpg',
    'Feed-Additive-License.jpg',
]

FONT_BOLD = r'C:\Windows\Fonts\arialbd.ttf'
FONT_REG = r'C:\Windows\Fonts\arial.ttf'


def brand():
    """The name and the domain, from the one place they are written down."""
    s = io.open(CONFIG, encoding='utf-8').read()
    m = re.search(r'brand:\s*\{(.*?)\n  \},', s, re.S)
    if not m:
        raise SystemExit('could not find the brand block in lib/shenhe.config.ts')
    block = m.group(1)
    name = re.search(r"\bname:\s*'([^']+)'", block)
    domain = re.search(r"\bdomain:\s*'([^']+)'", block)
    if not name or not domain:
        raise SystemExit('the brand block has no name/domain')
    return name.group(1), domain.group(1)


def ensure_source():
    """Archive the pristine files the first time round."""
    os.makedirs(SRC, exist_ok=True)
    made = []
    for fn in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, fn)
        if not os.path.isfile(p):
            continue
        if not (fn.lower().endswith('.pdf') or fn in LICENCE_IMAGES
                or fn.replace('.jpg', '.webp') in
                [x.replace('.jpg', '.webp') for x in LICENCE_IMAGES]):
            continue
        target = os.path.join(SRC, fn)
        if not os.path.exists(target):
            shutil.copy2(p, target)
            made.append(fn)
    return made


def stamp_pdf(src, dst, name, domain):
    """One diagonal mark on every page, plus a line at the foot."""
    import pymupdf

    doc = pymupdf.open(src)
    for page in doc:
        r = page.rect
        fs = max(26.0, min(r.width, r.height) * 0.085)
        pivot = pymupdf.Point(r.width / 2.0, r.height / 2.0)
        turn = pymupdf.Matrix(30)          # any angle: insert_text only takes 90s
        for text, size, offset in (
            (name, fs, 0.0),
            (domain, fs * 0.45, fs * 1.15),
        ):
            fontname = 'hebo' if offset == 0.0 else 'helv'
            try:
                length = pymupdf.get_text_length(text, fontname=fontname, fontsize=size)
            except Exception:
                length = len(text) * size * 0.5
            x = (r.width - length) / 2.0
            y = r.height / 2.0 + offset
            try:
                page.insert_text((x, y), text,
                                 fontname=fontname, fontsize=size,
                                 color=(0.62, 0.62, 0.62), fill_opacity=0.30,
                                 morph=(pivot, turn))
            except TypeError:
                page.insert_text((x, y), text,
                                 fontname=fontname, fontsize=size,
                                 color=(0.62, 0.62, 0.62),
                                 morph=(pivot, turn))
        try:
            page.insert_text((28, r.height - 24), 'Downloaded from %s' % domain,
                             fontname='helv', fontsize=8, color=(0.55, 0.55, 0.55),
                             fill_opacity=0.55)
        except TypeError:
            page.insert_text((28, r.height - 24), 'Downloaded from %s' % domain,
                             fontname='helv', fontsize=8, color=(0.55, 0.55, 0.55))
    tmp = dst + '.tmp'
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    os.replace(tmp, dst)


def stamp_image(src, dst, name, domain):
    """The same mark, on a picture."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.open(src).convert('RGBA')
    w, h = img.size
    fs = max(22, int(min(w, h) * 0.085))

    try:
        font_bold = ImageFont.truetype(FONT_BOLD, fs)
        font_reg = ImageFont.truetype(FONT_REG, max(12, int(fs * 0.45)))
    except OSError:
        font_bold = font_reg = ImageFont.load_default()

    block_w = 0
    block_h = 0
    for font, text in ((font_bold, name), (font_reg, domain)):
        box = font.getbbox(text)
        block_w = max(block_w, box[2] - box[0])
        block_h += (box[3] - box[1]) + int(fs * 0.35)
    pad = int(fs * 0.5)
    layer = Image.new('RGBA', (block_w + pad * 2, block_h + pad * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    y = pad
    for font, text in ((font_bold, name), (font_reg, domain)):
        box = font.getbbox(text)
        draw.text((pad - box[0], y - box[1]), text, font=font, fill=(96, 96, 96, 78))
        y += (box[3] - box[1]) + int(fs * 0.35)
    layer = layer.rotate(30, expand=True)

    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    overlay.paste(layer, ((w - layer.width) // 2, (h - layer.height) // 2), layer)
    out = Image.alpha_composite(img, overlay).convert('RGB')

    draw = ImageDraw.Draw(out)
    try:
        small = ImageFont.truetype(FONT_REG, max(11, int(fs * 0.32)))
    except OSError:
        small = ImageFont.load_default()
    draw.text((int(w * 0.03), h - int(fs * 0.9)), 'Downloaded from %s' % domain,
              font=small, fill=(120, 120, 120))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, 'JPEG', quality=92, optimize=True)


def main():
    check = '--check' in sys.argv
    name, domain = brand()
    print('the mark        : %s / %s' % (name, domain))

    made = ensure_source()
    if made:
        print('archived        : %d pristine file(s) -> content/source/certs/' % len(made))
        for m in made:
            print('                  %s' % m)

    pdfs = sorted(f for f in os.listdir(SRC) if f.lower().endswith('.pdf'))
    images = sorted(f for f in os.listdir(SRC) if f in LICENCE_IMAGES)

    print('pdfs            : %d' % len(pdfs))
    print('licence scans   : %d' % len(images))

    problems = []
    for fn in pdfs:
        src = os.path.join(SRC, fn)
        dst = os.path.join(OUT, fn)
        if check:
            if not os.path.exists(dst):
                problems.append('%s is missing from the site' % fn)
                continue
            import pymupdf
            doc = pymupdf.open(dst)
            text = '\n'.join(p.get_text() for p in doc)
            doc.close()
            if name not in text:
                problems.append('%s carries no watermark' % fn)
            else:
                print('  ok  %-56s %d page(s)' % (fn, len(pymupdf.open(dst))))
            continue
        stamp_pdf(src, dst, name, domain)
        print('  stamped %s' % fn)

    for fn in images:
        src = os.path.join(SRC, fn)
        clean = os.path.join(OUT, fn)
        marked = os.path.join(DL, fn)
        if check:
            if not os.path.exists(marked):
                problems.append('%s (the download copy) is missing' % fn)
            elif os.path.getsize(marked) == os.path.getsize(clean):
                problems.append('%s: the download copy is identical to the clean one' % fn)
            continue
        shutil.copy2(src, clean)          # the page shows the clean scan
        stamp_image(src, marked, name, domain)   # the buyer takes this one
        print('  clean %-52s / watermarked download/%s' % (fn, fn))

    if problems:
        print()
        print('FAILED:')
        for p in problems:
            print('  x', p)
        raise SystemExit(1)
    print()
    print('ok - every certificate the site hands out carries the mark.')


if __name__ == '__main__':
    main()

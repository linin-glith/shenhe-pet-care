# -*- coding: utf-8 -*-
"""Measure every live page's meta description and title length.

WHY
Bing's Webmaster Tools flagged one page - /products/outdoor-insect-repellent-spray.html -
under "Meta descriptions on many of your pages are too short". Its description
reads 158 characters, which is inside Bing's own 70-300 range, so either
Bing is reading a stale copy or the length is not what it looks like.

The only way to tell is to measure every page and see where this one sits
in the distribution. If it is an outlier, Bing is right and it gets
lengthened. If it is in the middle of the pack, Bing crawled an older
version of the page and the flag is stale.

WHAT IT READS
The sitemap, then every URL in it, from the live site - not from the
build, because the build is what Bing crawled two weeks ago.

Usage:
    python scripts/audit_meta_descriptions.py
    python scripts/audit_meta_descriptions.py --min 100
"""
import argparse
import re
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://shenhezhongke.com"

META_RE = re.compile(r'<meta\s+name="description"\s+content="([^"]*)"', re.I)
TITLE_RE = re.compile(r"<title>([^<]*)</title>", re.I)


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; shenhe-audit)"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def sitemap_urls():
    """Every page URL, from the sitemap index and the sitemaps it names."""
    index = fetch(BASE + "/sitemap-index.xml")
    maps = re.findall(r"<loc>([^<]+)</loc>", index)
    urls = []
    for m in maps:
        urls.extend(re.findall(r"<loc>([^<]+)</loc>", fetch(m)))
    return sorted(set(urls))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--min", type=int, default=70,
                    help="below this many characters a description is short (Bing's own floor)")
    ap.add_argument("--flag", type=int, default=150,
                    help="below this many characters a description is thin")
    args = ap.parse_args()

    urls = sitemap_urls()
    rows = []
    for u in urls:
        try:
            html = fetch(u)
        except urllib.error.HTTPError as e:
            print("  %-70s HTTP %s" % (u, e.code))
            continue
        m = META_RE.search(html)
        t = TITLE_RE.search(html)
        desc = m.group(1) if m else ""
        title = t.group(1) if t else ""
        rows.append((len(desc), len(title), u, desc))

    print("  the pages measured: %d" % len(rows))
    if not rows:
        print("  nothing was measured")
        return 1

    lengths = sorted(r[0] for r in rows)
    print("  the description length: shortest %d · median %d · longest %d"
          % (lengths[0], lengths[len(lengths) // 2], lengths[-1]))
    titles = sorted(r[1] for r in rows)
    print("  the title length:       shortest %d · median %d · longest %d"
          % (titles[0], titles[len(titles) // 2], titles[-1]))

    short = [r for r in rows if r[0] < args.min]
    thin = [r for r in rows if args.min <= r[0] < args.flag]
    missing = [r for r in rows if r[0] == 0]

    print()
    print("  no description at all: %d" % len(missing))
    for n, _, u, _ in missing:
        print("    %s" % u)
    print("  shorter than %d characters (Bing's floor): %d" % (args.min, len(short)))
    for n, _, u, d in sorted(short):
        print("    %3d  %s" % (n, u))
    print("  between %d and %d characters: %d" % (args.min, args.flag, len(thin)))
    for n, _, u, _ in sorted(thin):
        print("    %3d  %s" % (n, u))

    print()
    print("  the ten shortest:")
    for n, t, u, d in sorted(rows)[:10]:
        print("    %3d chars / %3d title  %s" % (n, t, u))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE DELIVERY GATE.

WHAT IT IS FOR
The build gates measure what the site IS. This one measures what the
server DOES with it, on the live site, because that is another machine's
decision and it can drift without anybody noticing.

THE POLICY, AND WHY EACH PART IS DIFFERENT
The four kinds of file on this site want opposite things from the cache,
and a rule that treats them alike is a rule that gets one of them wrong:

  a PAGE            revalidated every visit. A page that is cached for a
                    month cannot be corrected, and a correction is the
                    whole point of a site that changes.

  a HASHED FILE     kept for a year. The name carries the content, so a
                    new build brings a new name and the old one can stay
                    in the browser for good.

  the site's OWN    kept for a month. These are not hashed, so a change
  files             to one of them is invisible to the browser - but a
                    month's cache is still far better than none.

  the machine files the contract, and a contract must never be stale. The
  catalogue, the feed and the openapi document are read by agents that
  will act on them, so they are NOT given a long lifetime. A short one,
  or none at all, is the point.

COMPRESSION
Text is served gzipped: the markup is 327 kB and the page on the wire is
38 kB because of it. Pictures are NOT gzipped, because they are already
compressed and gzipping them buys nothing but CPU.

USAGE
  python scripts/check_delivery_headers.py --live
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.request

SITE = "https://shenhezhongke.com"
UA = {"User-Agent": "Mozilla/5.0 (compatible; shenhe-delivery-gate)"}

TEXT = (".html", ".css", ".js", ".json", ".txt", ".xml", ".svg")
PICTURES = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".ico")

MIN_SITE_ASSET_MAX_AGE = 7 * 24 * 3600
MAX_MACHINE_MAX_AGE = 3600


def fetch(url, method="GET", attempts=3):
    """
    The headers as the browser sees them, with compression asked for.

    A gate that stops a deploy because one request timed out is a gate that
    gets switched off. The network hiccup is retried, and only a real
    answer - or three failed tries - is a failure.
    """
    last = None
    for attempt in range(attempts):
        try:
            headers = dict(UA)
            headers["Accept-Encoding"] = "gzip" if method == "HEAD" else "identity"
            req = urllib.request.Request(url, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=45) as r:
                body = r.read() if method != "HEAD" else b""
                return body, [(k.lower(), v) for k, v in r.headers.items()]
        except Exception as e:
            last = e
            print("   (attempt %d: %s)" % (attempt + 1, e))
    raise last


def head(url):
    """The headers of a file, with compression asked for."""
    _, headers = fetch(url, method="HEAD")
    return headers


def get(url):
    """The page as it is, uncompressed, so it can be read."""
    body, headers = fetch(url, method="GET")
    return body.decode("utf-8", "replace"), headers
def one(headers, name):
    for k, v in headers:
        if k == name:
            return v
    return ""


def all_of(headers, name):
    return [v for k, v in headers if k == name]


def cache_policy(headers):
    """Every Cache-Control the server sent, joined - nginx sends more than one."""
    return " ".join(all_of(headers, "cache-control")).lower()


def max_age(headers):
    m = re.search(r"max-age=(\d+)", cache_policy(headers))
    return int(m.group(1)) if m else 0


def check_compression(label, url, headers, problems):
    enc = one(headers, "content-encoding").lower()
    if url.lower().endswith(PICTURES):
        if "gzip" in enc:
            problems.append(
                "%s is a picture and is served gzipped - it is already compressed, "
                "and gzipping it costs the server CPU and the browser bytes" % label)
        return
    if "gzip" not in enc:
        problems.append(
            "%s is served without compression (Content-Encoding: %s) - the buyer "
            "downloads about four times the bytes for the same page"
            % (label, enc or "none"))


def check_cache(label, kind, headers, problems):
    cc = cache_policy(headers)
    age = max_age(headers)
    if kind == "page":
        if "no-cache" not in cc and "must-revalidate" not in cc:
            problems.append(
                "%s is cached by the browser (%s) - a corrected page would not "
                "reach the buyer" % (label, cc or "no Cache-Control"))
    elif kind == "hashed":
        if age < 24 * 3600 and "immutable" not in cc:
            problems.append(
                "%s is a hashed file and is cached for %d seconds - the name "
                "carries the content, so it can be kept for a year"
                % (label, age))
    elif kind == "site asset":
        if age < MIN_SITE_ASSET_MAX_AGE:
            problems.append(
                "%s is cached for %d seconds - these files are not hashed, so a "
                "month is the right answer and none is a waste"
                % (label, age))
    elif kind == "machine file":
        if age > MAX_MACHINE_MAX_AGE:
            problems.append(
                "%s is cached for %d seconds - it is the contract an agent acts "
                "on, and a stale contract is worse than a download"
                % (label, age))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true",
                        help="check the live site (the only mode there is)")
    parser.parse_args()

    problems = []
    page_url = SITE + "/products.html"
    html, page_headers = get(page_url)
    raw = len(html.encode("utf-8"))
    wire_headers = head(page_url)
    wire = int(one(wire_headers, "content-length") or 0)
    check_compression("a page", page_url, wire_headers, problems)
    check_cache("a page", "page", wire_headers, problems)
    print("   a page        : %d bytes raw, %d on the wire (%.1fx)"
          % (raw, wire, (raw / wire) if wire else 0))

    script = re.search(r'<script\b[^>]*?\bsrc="([^"]+)"', html)
    style = re.search(r'<link\b[^>]*?\brel="stylesheet"[^>]*?\bhref="([^"]+)"', html)
    picture = re.search(r'<img\b[^>]*?\bsrc="([^"]+)"', html)

    targets = []
    if script:
        targets.append(("a hashed script", script.group(1), "hashed"))
    if style:
        targets.append(("a hashed stylesheet", style.group(1), "hashed"))
    targets.append(("a site file", "/assets/css/base.css", "site asset"))
    if picture:
        targets.append(("a picture", picture.group(1), "site asset"))
    targets.append(("the product feed", "/product-feed.json", "machine file"))

    for label, path, kind in targets:
        url = path if path.startswith("http") else SITE + path
        headers = head(url)
        check_compression(label, url, headers, problems)
        check_cache(label, kind, headers, problems)
        print("   %-14s: %s" % (label, cache_policy(headers) or "no Cache-Control"))

    if problems:
        print("\n!! %d delivery problem(s):\n" % len(problems))
        for p in problems:
            print("    " + p)
        print("\nFAIL  the server is not delivering the site the way it should")
        return 1

    print("\nOK: text is served compressed, pictures are not, a page is "
          "revalidated every visit, the hashed files are kept for a year, the "
          "site's own files for a month, and the machine files are not held "
          "long enough to go stale.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

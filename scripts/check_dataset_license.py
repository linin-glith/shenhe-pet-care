#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EVERY DATASET SAYS WHAT MAY BE DONE WITH IT.

Google's rich result test named the missing field on 2026-11-08:
"未填写字段 license" on /attestation.html. A Dataset's license is defined
as "a URL to a page that describes the license governing the dataset's
use" - so the terms have to be written down somewhere, and every Dataset
has to point at that somewhere.

This reads the BUILT site, because that is what a crawler sees:

  1. every Dataset node carries a license;
  2. the license is a URL on our own domain - a license that points
     somewhere else is somebody else's promise, and a page we do not
     control cannot be the terms for our records;
  3. the page it points at is a page we publish - a license URL that 404s
     is worse than no license, because it looks like an answer.

A Dataset without a license is not a broken page. It is a question the
search engine will keep asking, and the answer belongs on the site.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
OWN_DOMAIN = "shenhezhongke.com"

JSONLD = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.S | re.I,
)


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def nodes_of(data):
    """Every node in a JSON-LD document, including the ones inside @graph."""
    out = []
    if isinstance(data, list):
        for item in data:
            out.extend(nodes_of(item))
        return out
    if not isinstance(data, dict):
        return out
    out.append(data)
    graph = data.get("@graph")
    if isinstance(graph, list):
        for item in graph:
            out.extend(nodes_of(item))
    return out


def datasets_in(html):
    found = []
    for m in JSONLD.finditer(html):
        raw = m.group(1).strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        for node in nodes_of(data):
            if not isinstance(node, dict):
                continue
            if node.get("@type") == "Dataset":
                found.append(node)
    return found


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    problems = []
    count = 0
    pages = 0

    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in names:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            rel = os.path.relpath(path, OUT).replace("\\", "/")
            html = read(path)
            found = datasets_in(html)
            if not found:
                continue
            pages += 1
            for node in found:
                count += 1
                label = node.get("name") or "(unnamed)"
                license_url = node.get("license")
                if not isinstance(license_url, str) or not license_url.strip():
                    problems.append("%s: the dataset %r has no license" % (rel, label))
                    continue
                license_url = license_url.strip()
                if OWN_DOMAIN not in license_url:
                    problems.append(
                        "%s: the dataset %r points its license at %s, which is not our own domain"
                        % (rel, label, license_url)
                    )
                    continue
                target = license_url.split(OWN_DOMAIN, 1)[-1].split("?")[0].split("#")[0]
                if not target:
                    target = "/"
                local = os.path.join(OUT, target.strip("/").replace("/", os.sep))
                if os.path.isdir(local):
                    local = os.path.join(local, "index.html")
                if not os.path.exists(local):
                    problems.append(
                        "%s: the dataset %r points its license at %s, and that page is not published"
                        % (rel, label, license_url)
                    )

    if problems:
        print("FAIL  every dataset says what may be done with it")
        for p in problems[:12]:
            print("    " + p)
        return 1

    if count == 0:
        print("FAIL  no Dataset was found in the built site - the check cannot see anything")
        return 1

    print(
        "ok    every dataset says what may be done with it (%d dataset(s) on %d page(s), "
        "each with a license that points at a page we publish)" % (count, pages)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

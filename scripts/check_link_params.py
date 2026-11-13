# -*- coding: utf-8 -*-
"""The parameters the site's own links carry, and a gate that keeps them alive.

WHAT WENT WRONG
The rule that answers a request with an argument it does not name was
written for tracking tags, and it was extended to the pages. The site's
own links carry eight parameters - the range the buyer selected, the line
they are looking at, the product and the mode, the SKU an "about this"
link is about, the cache-buster on a picture, and the interest that
brings somebody to the sheets. Six of the eight became 404s, because
nobody had asked the server what it answers for the links the site
itself makes.

So the list is written down here, and a gate reads the built pages and
checks that every parameter they carry is on it.

WHAT THE SERVER HAS TO ANSWER
The nginx map that answers the request has to carry the same names:
    /etc/nginx/conf.d/shenhe-args.conf
"""
import io
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
LIST = os.path.join(ROOT, "lib", "link-params.json")

LINK = re.compile(r'(?:href|src)="([^"]*\?[^"]*)"')
PARAM = re.compile(r"[?&]([a-zA-Z_][a-zA-Z0-9_]*)=")
# the hosts that are not ours - their parameters are their business
FOREIGN = ("wa.me", "whatsapp", "google-analytics", "googletagmanager",
           "clarity.ms", "bing.com", "t.me", "mailto:", "tel:")


def main():
    with io.open(LIST, "r", encoding="utf-8") as f:
        allowed = json.load(f)

    params = Counter()
    where = {}
    for root, dirs, files in os.walk(OUT):
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(root, f)
            with io.open(p, "r", encoding="utf-8", errors="replace") as fh:
                html = fh.read()
            for link in LINK.findall(html):
                if any(x in link for x in FOREIGN):
                    continue
                for name in PARAM.findall(link):
                    params[name] += 1
                    where.setdefault(name, os.path.relpath(p, OUT))

    missing = sorted(n for n in params if n not in allowed)
    print("the parameters the site's own links carry: %d" % len(params))
    for name, n in sorted(params.items(), key=lambda kv: -kv[1]):
        mark = "ok  " if name in allowed else "MISSING"
        print("  %-8s %-16s %4d  %s" % (mark, name, n, where[name][:40]))

    if missing:
        print()
        print("FAIL  the server answers these with a 404, so the links are dead:")
        for name in missing:
            print("    ?%s" % name)
        print("  add them to lib/link-params.json AND to the map on the server:")
        print("    /etc/nginx/conf.d/shenhe-args.conf")
        return 1
    print()
    print("ok    every parameter the site's own links carry is answered")
    return 0


if __name__ == "__main__":
    sys.exit(main())

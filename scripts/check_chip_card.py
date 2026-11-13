#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE TAP CARD AGREES WITH THE SITE.

A card with an NFC tag is printed once and sits in a warehouse for
months, and the address on it has to be the address the site serves. If
the address is typed into a design file, it is a second copy of a fact
that lives in lib/shenhe.config.ts, and the two drift the first time
the domain or the scheme changes.

So the artwork is generated from the configuration on every build, and
this asks the two whether they still agree:

  1. the artwork exists;
  2. every address printed on it is the site's address - not just that
     the right one is there, but that no other one is;
  3. the site says what the card is, so a buyer holding one knows what
     to do with it.

WHAT THIS DOES NOT CHECK
  That the tag itself carries the address. The tag is written by hand,
  at the factory, from the address the build prints - and the only
  proof that the write was right is a phone tapping it.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "lib", "shenhe.config.ts")
ARTWORK = os.path.join(ROOT, "public", "chip-card.svg")
HOME = os.path.join(ROOT, "out", "index.html")

URL_RE = re.compile(r"https?://[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+")

# The XML namespaces are identifiers, not addresses a buyer could follow.
# The first version of this check called the SVG namespace a printed
# address, and the gate failed on the artwork it had just drawn.
NOT_AN_ADDRESS = ("www.w3.org",)


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def main():
    problems = []

    config = read(CONFIG)
    m = re.search(r"siteUrl:\s*'([^']+)'", config)
    if not m:
        print("FAIL  the tap card agrees with the site")
        print("    the site address is not in lib/shenhe.config.ts")
        return 1
    site = m.group(1).rstrip("/")
    wanted = site + "/"

    if not os.path.exists(ARTWORK):
        print("FAIL  the tap card agrees with the site")
        print("    public/chip-card.svg is not there - run the build")
        return 1
    artwork = read(ARTWORK)

    found = sorted(set(
        u.rstrip("/.,)") for u in URL_RE.findall(artwork)
        if not any(host in u for host in NOT_AN_ADDRESS)
    ))
    if not found:
        problems.append("the card prints no address at all")
    for u in found:
        if u.rstrip("/") != site:
            problems.append("the card prints %s, and the site is %s" % (u, site))
    if wanted not in artwork:
        problems.append("the card does not print %s" % wanted)

    if not os.path.exists(HOME):
        problems.append("out/index.html is not there - build the site first")
    else:
        home = read(HOME)
        if "tap card" not in home:
            problems.append(
                "the site does not tell the buyer what the tap card is"
            )

    if problems:
        print("FAIL  the tap card agrees with the site")
        for p in problems:
            print("    " + p)
        return 1

    print(
        "ok    the tap card agrees with the site (%s on the card, and the site says "
        "what the card is)" % wanted
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

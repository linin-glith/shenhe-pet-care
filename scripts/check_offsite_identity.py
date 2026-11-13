#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE OFF-SITE IDENTITY HAS TO BE THERE, AND THE SITE HAS TO CLAIM IT.

WHY
`sameAs` is how an assistant decides that two mentions are one company:
it finds the same entity at more than one address. The company has had
marketplace listings for years - 1688 and JD - and the site named none
of them, so the fact that they existed did nothing.

The gate that checks the identity list ("the identity list is whole")
resolved every address in the list against the BUILD. An off-site
address was skipped entirely, because it is not in the build. So a
profile that had been deleted stayed in the identity list forever,
claiming a page that is not there.

WHAT IT CHECKS
  1. every address in the sameAs list that is not on our own domain
     answers - a definite 404 or 410 fails the build, because that is
     a page that is not there. A refused request does not: the page
     may be up and the request turned away;
  2. every off-site address in the list is in the register
     (public/company-identity.json) - a record the site does not claim
     is a record the site does not believe in;
  3. every live entry in the register is in the list - a profile that
     nothing points at is a profile that does nothing.

WHY THE REGISTER IS CHECKED AGAINST THE LIST AND NOT ONLY ITSELF
The register says what exists; the list says what the site claims. The
two have to say the same thing, or one of them is lying, and the
difference between "we are listed there" and "we are not" is the whole
value of a third-party record.

Run:  python scripts/check_offsite_identity.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "lib", "shenhe.config.ts")
REGISTER = os.path.join(ROOT, "public", "company-identity.json")
OURS = "https://shenhezhongke.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"


def read(path: str) -> str:
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def same_as_urls() -> list[str]:
    """The list, read out of the configuration as text."""
    text = read(CONFIG)
    i = text.find("sameAs: [")
    if i == -1:
        return []
    start = text.find("[", i)
    depth = 0
    end = -1
    in_str = False
    in_line = False
    in_block = False
    k = start
    while k < len(text):
        c = text[k]
        nx = text[k + 1] if k + 1 < len(text) else ""
        if in_line:
            if c == "\n":
                in_line = False
            k += 1
            continue
        if in_block:
            if c == "*" and nx == "/":
                in_block = False
                k += 2
                continue
            k += 1
            continue
        if in_str:
            if c == "'" and text[k - 1] != "\\":
                in_str = False
            k += 1
            continue
        if c == "/" and nx == "/":
            in_line = True
            k += 2
            continue
        if c == "/" and nx == "*":
            in_block = True
            k += 2
            continue
        if c == "'":
            in_str = True
            k += 1
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                end = k
                break
        k += 1
    if end == -1:
        return []
    block = text[start:end + 1]
    block = re.sub(r"/\*[\s\S]*?\*/", "", block)
    block = "\n".join(l for l in block.split("\n") if not l.strip().startswith("//"))
    out: list[str] = []
    for m in re.finditer(r"'([^']+)'", block):
        u = m.group(1)
        if u.startswith("http") and u not in out:
            out.append(u)
    return out


def answers(url: str) -> tuple[str, str]:
    """(verdict, detail) for one address.

    "gone"  - a definite 404 or 410: the page is not there.
    "here"  - it answered.
    "unknown" - the request was refused or timed out, which says
                 nothing about whether the page exists.
    """
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return ("here", str(r.status))
    except urllib.error.HTTPError as e:
        if e.code in (404, 410):
            return ("gone", str(e.code))
        return ("unknown", str(e.code))
    except Exception as e:
        return ("unknown", type(e).__name__)


def main() -> int:
    urls = same_as_urls()
    if not urls:
        print("FAIL  the sameAs list could not be read out of lib/shenhe.config.ts")
        return 1
    external = [u for u in urls if not u.startswith(OURS)]
    print("  the identity list: %d address(es), %d of them off-site" % (len(urls), len(external)))

    problems: list[str] = []

    # 1. every off-site address has to answer
    for u in external:
        verdict, detail = answers(u)
        if verdict == "gone":
            problems.append("the off-site address is gone (%s): %s" % (detail, u))
        elif verdict == "unknown":
            print("  could not check %s (%s) - the page may be up and the request turned away"
                  % (u[:70], detail))

    # 2 and 3. the register and the list have to agree
    register = {}
    if os.path.exists(REGISTER):
        try:
            with io.open(REGISTER, "r", encoding="utf-8") as f:
                data = json.load(f)
            for name, entry in (data.get("offSite") or {}).items():
                if name.startswith("_") or not isinstance(entry, dict):
                    continue
                register[name] = entry
        except (OSError, ValueError) as e:
            problems.append("the identity register cannot be read: %s" % e)
    else:
        problems.append("public/company-identity.json is missing")

    listed = {u.rstrip("/") for u in external}
    for name, entry in register.items():
        url = (entry.get("url") or "").strip()
        status = (entry.get("status") or "").strip()
        if status == "live":
            if not url:
                problems.append("the register says %s is live and gives no address" % name)
            elif url.rstrip("/") not in listed:
                problems.append(
                    "the register says %s is live (%s) but the sameAs list does not claim it"
                    % (name, url[:60])
                )
            elif not entry.get("inSameAs"):
                problems.append("the register entry for %s does not say it is in sameAs" % name)
    for u in external:
        if u.rstrip("/") not in {(e.get("url") or "").rstrip("/") for e in register.values()}:
            problems.append("the sameAs list claims %s and the register does not have it" % u[:70])

    if problems:
        print("FAIL  the off-site identity is not what the site says it is")
        for p in problems[:12]:
            print("    " + p)
        return 1

    print("ok    %d off-site address(es) answer, and the register and the list agree" % len(external))
    return 0


if __name__ == "__main__":
    sys.exit(main())

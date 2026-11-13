#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE OPENING HOURS IN THE MARKUP MUST BE THE HOURS ON THE PAGE.

WHY
The factory page's markup said the factory opens at 08:30 on weekdays
and closes at 12:00 on Saturday. The footer of every page says "Mon-Sat,
09:00-18:00 China Standard Time", lib/shenhe.config.ts holds that as the
one truth, and lib/response-deadline.ts judges the desk by it - the
comment there says "Saturday is a working day for the people answering".

So the markup said one thing and the page said another, on the same
page. A buyer reading the visible page and an assistant reading the
markup get two different answers about when the factory answers.

This is the third time the site has said two different things about one
fact - the reply promise (48 hours, then one business day, then one
business hour), the SKU count (16, then 20), and now the hours. The
reply promise and the SKU count were both fixed by putting the fact in
one place and checking the other places against it. This is the same
move, for the same reason.

WHAT IT CHECKS
  1. every opening-hours statement in the markup equals the hours in
     lib/shenhe.config.ts - the same days, the same opening time, the
     same closing time;
  2. the pages that carry an opening-hours statement also print them,
     so the markup never says something the visitor cannot see.

Run:  python scripts/check_opening_hours.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
CONFIG = os.path.join(ROOT, "lib", "shenhe.config.ts")

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
ABBR = {
    "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday",
    "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
}


def read(path: str) -> str:
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def day_name(word: str) -> str:
    return ABBR.get(word.strip()[:3].lower(), word.strip())


def published_hours() -> tuple[list[str], str, str]:
    """The hours the site publishes, read out of the configuration."""
    text = read(CONFIG)
    m = re.search(r"hours:\s*'([^']+)'", text)
    if not m:
        raise SystemExit("FAIL  lib/shenhe.config.ts has no response.hours to check against")
    m2 = re.search(r"(\w+)[–-](\w+),\s*(\d{2}:\d{2})[–-](\d{2}:\d{2})", m.group(1))
    if not m2:
        raise SystemExit("FAIL  the published hours cannot be read: %s" % m.group(1))
    first, last = day_name(m2.group(1)), day_name(m2.group(2))
    days = DAYS[DAYS.index(first):DAYS.index(last) + 1]
    return days, m2.group(3), m2.group(4)


def main() -> int:
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    expected_days, opens, closes = published_hours()
    print("  the published hours: %s, %s-%s" % (", ".join(expected_days), opens, closes))

    problems: list[str] = []
    statements = 0
    pages_with_hours: list[str] = []

    for dirpath, _dirs, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith(".html"):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, OUT).replace("\\", "/")
            html = read(path)

            def walk(node) -> None:
                nonlocal statements
                if isinstance(node, dict):
                    oh = node.get("openingHoursSpecification")
                    if isinstance(oh, list):
                        for entry in oh:
                            days = entry.get("dayOfWeek") or []
                            if isinstance(days, str):
                                days = [days]
                            statements += 1
                            if days != expected_days:
                                problems.append(
                                    "%s: the markup says the days are %s, the site says %s"
                                    % (rel, ", ".join(days), ", ".join(expected_days))
                                )
                            if entry.get("opens") != opens or entry.get("closes") != closes:
                                problems.append(
                                    "%s: the markup says %s-%s, the site says %s-%s"
                                    % (rel, entry.get("opens"), entry.get("closes"), opens, closes)
                                )
                    for value in node.values():
                        walk(value)
                elif isinstance(node, list):
                    for value in node:
                        walk(value)

            for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
                try:
                    walk(json.loads(block))
                except Exception:
                    continue

            if "openingHoursSpecification" in html:
                pages_with_hours.append(rel)
                text = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
                text = re.sub(r"<[^>]+>", " ", text)
                if opens not in text or closes not in text:
                    problems.append(
                        "%s: the markup states the opening hours and the page does not print them"
                        % rel
                    )

    if problems:
        print("FAIL  the opening hours are not one fact")
        for p in problems[:12]:
            print("    " + p)
        return 1

    if statements == 0:
        print("FAIL  no opening-hours statement was found - the check cannot see anything")
        return 1

    print("ok    the markup opens and closes when the site says it does (%d statement(s), on %d page(s))"
          % (statements, len(pages_with_hours)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

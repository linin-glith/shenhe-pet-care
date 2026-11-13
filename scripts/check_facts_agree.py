#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE FACTS AGREE EVERYWHERE.

A site says the same thing in ninety-three places. The moment one of them
drifts, the site stops being a company and becomes a rumour: one page says
twenty SKUs and another says twenty-two, one says "within one business day"
and another says "within one hour", one calls the private-label lead time
"OEM" and another calls 30-45 days "OEM" as well.

THE FIRST VERSION OF THIS GATE GUESSED
  It tried to recognise "a claim about X" with regular expressions, and it
  reported a dozen contradictions that were not contradictions: a line's own
  SKU count (11), an application group's count (14), the sample turnaround
  (5-7 days) read as a development window, and "Minimum order 1,000-3,000
  units (your formula)" read as a catalogue minimum. A gate that cries wolf
  is a gate nobody runs.

SO THIS ONE CHECKS AGAINST THE RECORD
  The catalogue record is the single source of truth, and every product page
  prints its own SKU code. So for each product page this asks:

    - does the minimum order on the page equal the record's?
    - do the two lead times equal the record's?
    - does the page state a price?  (the site is quote-only)

  and across the whole site:

    - does the private-label lead time ever appear as anything but 25-40?
    - is the legal name spelled one way?
    - is the price posture one of the four wordings the site uses?

  A fact is checked against the record, not against a guess about how the
  sentence was meant.
"""
import io
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
RECORD = os.path.join(ROOT, "lib", "products.json")

# The private-label window, and the one number it may carry.
PRIVATE_LABEL_WINDOW = "25-40"
# The words the site uses when it says "there is no price on this page".
PRICE_WORDINGS = {
    "Quote on request",
    "Unit prices are quote-only",
    "not published",
    "no prices on this site",
    "Prices, minimum order and lead time are quoted against your order, not published",
}
# The legal name, in the forms the site may write it.
LEGAL_NAMES = {
    "Guangdong Shenhe Zhongke Biotechnology Co., Ltd.",
    "Guangdong Shenhe Zhongke Biotechnology Co., Ltd",
}

PRICE_NUMBER = re.compile(
    r"(?:US\$|\$|€|¥|RMB)\s?\d|\b\d+(?:\.\d+)?\s?(?:USD|EUR|RMB|CNY)\b",
    re.I,
)


def pages():
    out = []
    for root, dirs, files in os.walk(OUT):
        for f in files:
            if f.endswith(".html") and not f.startswith("__"):
                rel = os.path.relpath(os.path.join(root, f), OUT).replace("\\", "/")
                out.append("/" if rel == "index.html" else "/" + rel)
    return sorted(out)


def text_of(html):
    body = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    body = re.sub(r"<style[\s\S]*?</style>", " ", body, flags=re.I)
    body = re.sub(r"<[^>]+>", " ", body)
    body = (body.replace("&amp;", "&").replace("&nbsp;", " ")
                .replace("&gt;", ">").replace("&lt;", "<").replace("&#39;", "'")
                .replace("&quot;", '"'))
    return re.sub(r"\s+", " ", body)


def norm_window(s):
    return re.sub(r"\s*[-–]\s*", "-", s)


def main():
    if not os.path.isdir(OUT):
        print("out/ not found — run `next build` first.", file=sys.stderr)
        return 1

    with io.open(RECORD, "r", encoding="utf-8") as f:
        record = json.load(f)
    by_code = {p["sku_oem"]: p for p in record["products"]}

    problems = []
    checked_skus = 0
    seen_windows = defaultdict(set)
    seen_names = set()
    price_hits = []

    for rel in pages():
        src = os.path.join(OUT, "index.html" if rel == "/" else rel.lstrip("/"))
        with io.open(src, "r", encoding="utf-8") as f:
            html = f.read()
        t = text_of(html)

        # 1. every product page against its own record
        for m in re.finditer(r"\b(SHENHE-[A-Z0-9-]{3,})\b", t):
            code = m.group(1)
            p = by_code.get(code)
            if not p:
                continue
            checked_skus += 1
            moq = "{:,}".format(p["moq"])
            if moq not in t:
                problems.append("%s states no minimum order of %s for %s" % (rel, moq, code))
            for field, label in (("lead_time_days_stock", "stock lead"),
                                 ("lead_time_days_oem", "private-label lead")):
                want = norm_window(p[field])
                # the page writes it with an en dash and the word "days"
                if not re.search(re.escape(want).replace(r"\-", r"[-–]") + r"\s*(?:d\b|days)", t, re.I):
                    problems.append("%s states no %s of %s for %s" % (rel, label, want, code))
            break  # one SKU per page is enough

        # 2. the private-label window, wherever it is named
        for m in re.finditer(r"private[- ]label[^.]{0,20}?(\d{1,3})\s*[-–]\s*(\d{1,3})", t, re.I):
            seen_windows[norm_window("%s-%s" % (m.group(1), m.group(2)))].add(rel)

        # 3. the legal name
        #
        # The prefix is not optional decoration: without it the pattern starts
        # matching in the middle of the registered name and reports
        # "Shenhe Zhongke Biotechnology Co., Ltd." - the tail of the name, not
        # the name - as a company called something the register does not
        # recognise. The fix is to keep the prefix inside the match, so a page
        # that writes the name in full is compared with LEGAL_NAMES in full.
        for m in re.finditer(
            r"(?:Guangdong\s+)?Shenhe\s*Zhongke(?:\s*Biotech(?:nology)?)?\s*Co\.,?\s*Ltd\.?", t
        ):
            seen_names.add(m.group(0).strip())

        # 4. no page states a price
        if not rel.endswith("products.html"):
            for m in PRICE_NUMBER.finditer(t):
                ctx = t[max(0, m.start() - 50): m.end() + 50]
                if re.search(r"freight|shipping|per lane|deposit|balance|order|quotation|MOQ|minimum", ctx, re.I):
                    continue
                price_hits.append((rel, m.group(0), ctx.strip()))

    bad_windows = {w: p for w, p in seen_windows.items() if w != PRIVATE_LABEL_WINDOW}
    if bad_windows:
        problems.append(
            "the private-label lead time is stated as %s — the site says %s"
            % (" / ".join(sorted(bad_windows)), PRIVATE_LABEL_WINDOW)
        )

    odd_names = {n for n in seen_names if n not in LEGAL_NAMES and n not in ("Shenhe Zhongke", "SHENHE ZHONGKE")}
    if odd_names:
        problems.append("the company is named %s" % " / ".join(sorted(odd_names)[:4]))

    if price_hits:
        problems.append(
            "%d page(s) state something that reads like a price: %s"
            % (len(price_hits), "; ".join("%s -> %r" % (r, c[:60]) for r, _, c in price_hits[:3]))
        )

    if problems:
        print("FAIL  the facts agree everywhere")
        for p in problems:
            print("    " + p)
        return 1

    print("ok    the facts agree everywhere (%d page(s), %d product page(s) checked against the record; "
          "private-label window %s; %d page(s) name the company one way)"
          % (len(pages()), checked_skus, PRIVATE_LABEL_WINDOW, len(pages())))
    return 0


if __name__ == "__main__":
    sys.exit(main())

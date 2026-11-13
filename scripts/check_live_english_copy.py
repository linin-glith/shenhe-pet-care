# -*- coding: utf-8 -*-
"""Measure the LIVE site, not the build.

The rule this round learned the hard way: the repository can be right, the
build can be right, and the live site can still be the old one. So the
last step is always to measure what a buyer actually gets.

This fetches the published pages and applies the same four rules the build
gate applies, plus it looks for the strings the round was supposed to
introduce.

USAGE
  python check_live_english_copy.py
"""
import io
import re
import sys
import urllib.request
from html.parser import HTMLParser

SITE = "https://shenhezhongke.com"

PAGES = [
    "/", "/products.html", "/oem-odm.html", "/capabilities.html",
    "/certifications.html", "/global-compliance.html", "/sourcing-guides.html",
    "/contact.html", "/privacy.html", "/terms.html", "/trade-compliance.html",
    "/ai-customize.html", "/factory.html", "/why-us.html", "/standards.html",
    "/products/pet-deodorizing-spray.html",
    "/products/pet-disinfectant-deodorizing-solution.html",
    "/products/multi-purpose-pet-wash-300.html",
    "/products/cat-ringworm-spray.html",
    "/portal/track.html", "/portal/login.html", "/portal/register.html",
]

# the machine-readable layer an AI agent reads
FILES = ["/llms.txt", "/llms-full.txt", "/llms-full.json", "/ai.json",
         "/TRADE-COMPLIANCE.md"]

ALLOWED_CJK = {
    "深圳市永盛环境工程有限公司", "广东深河中科生物科技有限公司",
    "粤卫消证字", "粤饲添", "第", "号",
    "广东省河源市源城区高埔岗龙腾大道", "广东省", "河源市", "源城区", "高埔岗",
    "高德地图", "深河中科",
}

CJK = re.compile(r"[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+")
INQUIRY = re.compile(r"(?<![\w-])inquir(?:y|ies)(?![\w-])", re.I)
ZHONGWEN = re.compile(r"中文")
TYPO = re.compile(r"programmem+e", re.I)
API_PATH = re.compile(r"/api/")

# the house style, and the promises with no report behind them
HOUSE = [
    (re.compile(r"\bdeodoris\w*\b", re.I), "deodorizer / deodorizing is the house style"),
    (re.compile(r"\bodour\w*\b", re.I), "odor is the house style"),
    (re.compile(r"(?<![\w/-])catalog(?![\w-])", re.I), "catalogue is the house style"),
    (re.compile(r"pet-safe if licked", re.I), "an unconditional safety promise"),
    (re.compile(r"\bsafe if licked\b", re.I), "an unconditional safety promise"),
    (re.compile(r"kill rate against common pathogens", re.I), "no strain, no contact time, no report"),
    (re.compile(r">\s*94\.2\s*%", re.I), "the report says 94.2%"),
    (re.compile(r"\bfree samples?\b", re.I), "the samples are chargeable"),
    (re.compile(r"\b500 units\b", re.I), "the catalogue's lowest minimum is 1,000 sets"),
    (re.compile(r"\b48[- ]hour (?:response|quote|reply)\b", re.I), "the reply is within one business day"),
    (re.compile(r"response guaranteed", re.I), "the site does not promise a guaranteed response"),
]

SKIP_TEXT = ("script", "style", "noscript", "template", "svg")


class Visible(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.skip = 0
        self.buf = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TEXT:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in SKIP_TEXT and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data)

    def text(self):
        return " ".join(self.buf)


def get(path):
    req = urllib.request.Request(SITE + path, headers={"User-Agent": "shenhe-copy-check/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")


def main():
    failures = []
    ok = 0
    for path in PAGES:
        try:
            status, raw = get(path)
        except Exception as e:
            failures.append("%s: could not be fetched (%s)" % (path, e))
            continue
        if status != 200:
            failures.append("%s: HTTP %s" % (path, status))
            continue
        ok += 1
        v = Visible()
        v.feed(raw)
        text = v.text()

        for m in TYPO.finditer(raw):
            failures.append("%s: 'programmeme' is live" % path)
        for r in sorted(set(CJK.findall(text))):
            if r not in ALLOWED_CJK:
                failures.append("%s: Chinese in the English text: %r" % (path, r))
        for m in INQUIRY.finditer(text):
            if API_PATH.search(text[max(0, m.start() - 12):m.start()]):
                continue
            failures.append("%s: 'inquiry' is live  ...%s..." %
                            (path, " ".join(text[max(0, m.start() - 50):m.start() + 30].split())))
        for pat, why in HOUSE:
            for m in pat.finditer(text):
                failures.append("%s: %r - %s" % (path, m.group(0), why))

    for path in FILES:
        try:
            status, raw = get(path)
        except Exception as e:
            failures.append("%s: could not be fetched (%s)" % (path, e))
            continue
        if status != 200:
            failures.append("%s: HTTP %s" % (path, status))
            continue
        ok += 1
        for m in TYPO.finditer(raw):
            failures.append("%s: 'programmeme' is live" % path)
        for m in INQUIRY.finditer(raw):
            if API_PATH.search(raw[max(0, m.start() - 12):m.start()]):
                continue
            failures.append("%s: 'inquiry' is live" % path)
        for pat, why in HOUSE:
            for m in pat.finditer(raw):
                failures.append("%s: %r - %s" % (path, m.group(0), why))
        for m in ZHONGWEN.finditer(raw):
            failures.append("%s: '中文' is live" % path)

    # ---- the strings this round was supposed to introduce
    import html as _html
    _, cert = get("/certifications.html")
    cert = _html.unescape(cert)
    for good in ("Power Odor Eliminator (Extra Strength) sample",
                 "Disinfectant & Deodorizing Solution (sodium hypochlorite) sample",
                 "CatClean Antifungal & Deodorizing Solution sample"):
        if good not in cert:
            failures.append("/certifications.html: missing %r" % good)
    _, gc = get("/global-compliance.html")
    if "EN and Chinese label compliance" not in _html.unescape(gc):
        failures.append("/global-compliance.html: missing 'EN and Chinese label compliance'")
    _, home = get("/")
    if "Track enquiry" not in _html.unescape(home):
        failures.append("/: the footer still says 'Track inquiry'")

    if failures:
        print("  the live site is not the site we built:")
        for f in failures[:40]:
            print("    !! %s" % f)
        if len(failures) > 40:
            print("    ... and %d more" % (len(failures) - 40))
        return 1
    print("  the live site is the site we built: %d pages and files checked" % ok)
    return 0


if __name__ == "__main__":
    sys.exit(main())

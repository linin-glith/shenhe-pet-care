#!/usr/bin/env python3
"""
The English copy has to be English.

WHY THIS IS A GATE AND NOT A NOTE
Three of the four issues this round found were invisible in the source
review: a Chinese product name inside an English sentence (the
certifications page read "measured on the 净味小子 sample"), "inquiry" next
to "enquiry" on the same page, and a word that is not a word
("programmeme"). None of them break a build. A buyer notices all three.

So the check runs on the BUILT output, not the source: the built output is
what a buyer reads and what a crawler reads.

WHAT IT ASKS
  1. The visible English pages may not contain Chinese, except where a
     Chinese legal name, licence number or address is quoted on purpose.
  2. The word "inquiry" must not appear in the English pages, nor in the
     files an AI agent reads (llms.txt, llms-full.txt, ai.txt). The site
     says "enquiry" everywhere else (catalogue 196 : catalog 0), and two
     spellings of one word on one page is what a native reader notices
     before they can say what it is.
  3. The word "中文" must not appear in the machine-readable layer: in
     English copy, the label language is written "Chinese".
  4. The word "programmeme" must not appear anywhere.

WHAT IS EXCLUDED, AND WHY
  - the console (/admin, /admin/*, admin.txt): it is the staff tool and it
    is in Chinese. A Chinese console is not a defect.
  - the RSC payload files (out/*.txt that start with 1:"$Sreact.fragment"):
    they are the same pages in a machine format, and they carry route
    segments and api paths. The .html of the same page is checked.
  - JSON-LD product fields such as "name_zh": a bilingual catalogue is a
    feature. The gate looks at what a reader SEES.

USAGE
  python scripts/check_english_copy_consistency.py [--dir out]
"""

import io
import json
import os
import re
import sys
from html.parser import HTMLParser

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# the Chinese that is allowed to be seen on a page, and why
#
# Each entry is a CJK run as it appears in the page. A run that is not in
# this list is a defect.
# ---------------------------------------------------------------------------
ALLOWED_CJK = {
    # the legal entity behind the factory page
    "深圳市永盛环境工程有限公司",
    "广东深河中科生物科技有限公司",
    # the licence numbers, which only exist in Chinese
    "粤卫消证字",
    "粤饲添",
    "第",
    "号",
    # the factory address, printed in both languages on purpose
    #
    # The spelling here is the one on the two production licences, checked
    # against the scans on 2026-11-09: 高埔岗龙腾路 141 号-1. The site said
    # 龙腾大道 141-1 号 until that check, and that spelling is what was in
    # this list - an allowlist that agrees with the site instead of with the
    # document is how an error survives a gate.
    "广东省河源市源城区高埔岗龙腾路",
    "广东省",
    "河源市",
    "源城区",
    "高埔岗",
    # the map credit
    "高德地图",
    # the brand, printed as "SHENHE ZHONGKE (深河中科)"
    "深河中科",
    # the registered trademark on the for-ai profile. The mark IS these
    # characters - a romanisation would be a different mark, and the
    # registration number alone does not say what was registered. It sits
    # next to that number and the CNIPA register, so a reader can check it.
    "贝洛宠",
    # the registered names on the intellectual-property page. The same
    # reasoning as the mark above: a patent and an enterprise standard are
    # filed under the Chinese name the register prints, so a romanisation
    # would name a registration that does not exist. Each one sits next to
    # its number and the register it is checked in.
    "空间喷雾除臭设备",
    "企业标准《宠物洁齿水》",
}

CJK = re.compile(r"[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+")
# "inquiry" as a word. The hyphens matter: the privacy policy prints the
# browser key "shenhe:inquiry-queue:v1", and that key is a technical
# identifier a buyer sees. It cannot be renamed - renaming it would throw
# away the drafts buyers have already typed. So the identifier is not the
# word.
INQUIRY = re.compile(r"(?<![\w-])inquir(?:y|ies)(?![\w-])", re.I)
# the label language, written in Chinese inside English copy
ZHONGWEN = re.compile(r"中文")
TYPO = re.compile(r"programmem+e", re.I)

# the console is the staff tool and it is in Chinese
CONSOLE = re.compile(r"^admin(?:[./]|\.html)")
# the machine format of a page
RSC = '1:"$Sreact.fragment"'
# the RSC internals: __next._full.txt, __next._tree.txt, __next.!<hash>/...
RSC_NAME = re.compile(r"__next[.!]")
# an api path is an address, not a word
API_PATH = re.compile(r"/api/")

# the whole html file is never worth reading as prose
SKIP_TEXT = ("script", "style", "noscript", "template", "svg")


class Visible(HTMLParser):
    """The text a reader sees."""

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


def read(path):
    return io.open(path, encoding="utf-8", errors="replace").read()


def english_values(obj, out):
    """The values of the 'en' keys of a bilingual document.

    The FAQ carries every answer twice: 'en' for the buyer and 'zh' for the
    Chinese reader. Only the 'en' half is English copy, so only that half
    is checked. The 'kw' half is a search vocabulary, where "inquiry" is a
    word a buyer types and belongs there.
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "en" and isinstance(v, str):
                out.append(v)
            elif isinstance(v, (dict, list)):
                english_values(v, out)
    elif isinstance(obj, list):
        for v in obj:
            english_values(v, out)


def is_api_path(raw, start):
    """True when the word sits inside an api path, which is an address."""
    return bool(API_PATH.search(raw[max(0, start - 12):start]))


def main():
    argv = sys.argv[1:]
    out_dir = os.path.join(SITE, "out")
    if "--dir" in argv:
        out_dir = argv[argv.index("--dir") + 1]
        if not os.path.isabs(out_dir):
            out_dir = os.path.join(SITE, out_dir)

    if not os.path.isdir(out_dir):
        print("  the build output is not there: %s" % out_dir)
        return 1

    failures = []
    pages = 0

    for dirpath, dirnames, filenames in os.walk(out_dir):
        dirnames[:] = [d for d in dirnames if d != ".next"]
        for fn in sorted(filenames):
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, out_dir).replace("\\", "/")

            if not fn.endswith((".html", ".txt", ".json", ".xml", ".md")):
                continue

            raw = read(path)

            # ---- the typo, anywhere, in any file
            for m in TYPO.finditer(raw):
                failures.append("%s: the word 'programmeme' (%r)"
                                % (rel, raw[max(0, m.start() - 40):m.start() + 30]))

            if CONSOLE.match(rel):
                continue

            if fn.endswith(".html"):
                pages += 1
                v = Visible()
                v.feed(raw)
                text = v.text()
                for r in sorted(set(CJK.findall(text))):
                    if r not in ALLOWED_CJK:
                        i = text.find(r)
                        failures.append("%s: Chinese in the English text: %r  ...%s..."
                                        % (rel, r, " ".join(text[max(0, i - 60):i + 40].split())))
                for m in INQUIRY.finditer(text):
                    failures.append("%s: 'inquiry' in the visible text  ...%s..."
                                    % (rel, " ".join(text[max(0, m.start() - 60):m.start() + 40].split())))
                continue

            if raw.startswith(RSC) or RSC_NAME.search(rel):
                # the machine copy of a page that is checked as .html
                continue

            # ---- a file an AI agent reads
            checked = raw
            if fn.endswith(".json"):
                try:
                    vals = []
                    english_values(json.loads(raw), vals)
                    if vals:
                        checked = "\n".join(vals)
                except Exception:
                    checked = raw

            for m in INQUIRY.finditer(checked):
                if is_api_path(checked, m.start()):
                    continue
                failures.append("%s: 'inquiry' in the reading list  ...%s..."
                                % (rel, " ".join(checked[max(0, m.start() - 60):m.start() + 40].split())))
            for m in ZHONGWEN.finditer(checked):
                failures.append("%s: '中文' in the reading list  ...%s..."
                                % (rel, " ".join(checked[max(0, m.start() - 60):m.start() + 40].split())))

    if failures:
        print("  the English copy is not English:")
        for f in failures[:60]:
            print("    !! %s" % f)
        if len(failures) > 60:
            print("    ... and %d more" % (len(failures) - 60))
        return 1

    print("  the English copy is English: %d pages checked, no stray Chinese, "
          "no 'inquiry', no '中文', no 'programmeme'" % pages)
    return 0


if __name__ == "__main__":
    sys.exit(main())

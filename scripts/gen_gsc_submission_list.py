#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把"要提交给 GSC 的全部链接"整理成一份清单文件。

三类东西，作用完全不同，混在一起会让人以为都要手动点：
  A. 要**提交**给 GSC 的 sitemap（3 个 + 1 个索引）
  B. 要**手动请求收录**的 URL（3 个——首页、目录页、FAQ 页）
  C. sitemap 里已经覆盖的 64 个页面 URL（不用手动点，sitemap 会带）
"""
import io
import os
import re
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
BASE = "https://shenhezhongke.com"


def fetch(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def locs(xml):
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def main():
    index = fetch("/sitemap-index.xml")
    sitemaps = locs(index)
    pages = locs(fetch("/sitemap.xml"))
    ai = locs(fetch("/sitemap-ai.xml"))
    images = locs(fetch("/sitemap-images.xml"))

    manual = [
        "https://shenhezhongke.com/",
        "https://shenhezhongke.com/products.html",
        "https://shenhezhongke.com/faq.html",
    ]
    optional = [
        "https://shenhezhongke.com/oem-odm.html",
        "https://shenhezhongke.com/certifications.html",
    ]

    out = []
    out.append("# 要提交给 GSC 的全部链接（2026-11-03）\n")
    out.append("## A. 要「提交」的 sitemap（GSC → 网址映射 → 输入框）\n")
    out.append("提交这 4 条，每条一次：\n")
    out.append("```")
    out.append(BASE + "/sitemap-index.xml")
    out.extend(sitemaps)
    out.append("```\n")
    out.append("第一条 `sitemap-index.xml` 是索引，它自己会带出下面三个；")
    out.append("如果 GSC 只接受一个，就先提交索引，再单独补 `sitemap.xml`（页面那一份）。\n")
    out.append("| 提交的地址 | 它是什么 | 里面有多少条 |")
    out.append("|---|---|---|")
    out.append("| %s/sitemap-index.xml | 索引（下面三个的总目录） | 3 |" % BASE)
    for s in sitemaps:
        if s.endswith("sitemap.xml"):
            out.append("| %s | 公开页面 | %d |" % (s, len(pages)))
        elif s.endswith("sitemap-ai.xml"):
            out.append("| %s | 机器阅读清单（llms/ai 四个文件） | %d |" % (s, len(ai)))
        elif s.endswith("sitemap-images.xml"):
            out.append("| %s | 图片 | %d |" % (s, len(images)))
        else:
            out.append("| %s | 索引（上面三个的总目录） | 3 |")
    out.append("")
    out.append("## B. 要「手动请求收录」的 URL（GSC → 网址检查 → 逐个粘贴）\n")
    out.append("```")
    out.extend(manual)
    out.append("```\n")
    out.append("只有这 3 个。**其余 61 个页面不需要手动点**——sitemap 一提交，")
    out.append("引擎会自己去抓；手动请求收录是逐个 URL 的操作，65 个点不现实也没有必要。\n")
    out.append("有余力再加这两个（不是必需的）：\n")
    out.append("```")
    out.extend(optional)
    out.append("```\n")
    out.append("## C. sitemap.xml 里已经覆盖的全部 64 个页面 URL\n")
    out.append("```")
    out.extend(pages)
    out.append("```\n")
    out.append("（这是 C 类：给「网址检查」里的报告用，也是核对 GSC 覆盖率时的对照表。）\n")

    p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "docs", "GSC-要提交的链接清单.md")
    io.open(p, "w", encoding="utf-8", newline="").write("\n".join(out))
    print("written: %s" % p)
    print("  sitemaps: %d, pages: %d, ai: %d, images: %d" % (
        len(sitemaps), len(pages), len(ai), len(images)))
    print()
    print("\n".join(out[:34]))


if __name__ == "__main__":
    main()

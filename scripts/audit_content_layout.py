#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""我们的内容布局：内部链接图、入口页、转化接线。

对标问的是"别人有几页、怎么连"。这里问的是**我们自己的**：
  1. 谁是枢纽（被内链最多）、谁是孤岛（一张内链都没有）
  2. 每页的"下一步"是什么（转化接线：有没有一条通向询盘的线）
  3. 询盘入口到底被哪些页面接住了
  4. 首页那 16 个模块，每个模块点下去是去哪里
"""
import collections
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

HREF = re.compile(r'<a\b[^>]*href="([^"]+)"', re.I)
CONV = ("/contact.html", "#rfq", "wa.me", "mailto:")


def pages():
    out = []
    for dp, _d, fs in os.walk(OUT):
        for f in fs:
            if f.endswith(".html"):
                p = os.path.join(dp, f)
                rel = "/" + os.path.relpath(p, OUT).replace("\\", "/")
                if rel == "/index.html":
                    rel = "/"
                out.append(rel)
    return sorted(out)


def main():
    ps = pages()
    raw = {}
    for rel in ps:
        disk = "index.html" if rel == "/" else rel.lstrip("/")
        raw[rel] = io.open(os.path.join(OUT, disk), encoding="utf-8", errors="replace").read()

    inbound = collections.Counter()
    outbound = collections.Counter()
    conv_from = collections.defaultdict(set)
    for rel, html in raw.items():
        for href in HREF.findall(html):
            if href.startswith(("http", "mailto:", "tel:", "javascript:")):
                continue
            target = href.split("#")[0].split("?")[0]
            if not target or target.startswith("/_next"):
                continue
            if target == "/":
                target = "/"
            else:
                if not target.endswith(".html") and "." not in os.path.basename(target):
                    continue
                if target not in raw:
                    continue
            outbound[rel] += 1
            inbound[target] += 1
            if any(c in href for c in CONV):
                conv_from[rel].add(href.split("#")[0] or href)

    print("=" * 72)
    print("我们自己的内容布局：%d 个公开页" % len(ps))
    print("=" * 72)

    print()
    print("【1】枢纽页（被内链最多）—— 这几个是真正在承重的")
    for p, n in inbound.most_common(15):
        print("  %4d 入链  %s" % (n, p))

    print()
    print("【2】孤岛（没有任何一页链到它）—— 造了但没人找得到")
    islands = [p for p in ps if inbound[p] == 0]
    print("  %d 个" % len(islands))
    for p in islands:
        print("      %s" % p)

    print()
    print("【3】转化接线：哪些页面把买家送到了询盘入口")
    conv = [p for p in ps if conv_from[p]]
    print("  有转化的页面 %d / %d（%.0f%%）" % (len(conv), len(ps), 100.0 * len(conv) / len(ps)))
    for p in sorted(conv):
        print("  %-46s → %s" % (p, ", ".join(sorted(conv_from[p])[:3])))
    dead = [p for p in ps if not conv_from[p] and not p.startswith(("/portal", "/admin"))]
    print()
    print("  没有转化出口的公开页 %d 个：" % len(dead))
    for p in sorted(dead):
        print("      %s" % p)

    print()
    print("【4】首页的模块都点去哪里（首页是 16 个模块，链出去落在哪）")
    home = raw.get("/")
    if home:
        c = collections.Counter()
        for href in HREF.findall(home):
            t = href.split("#")[0].split("?")[0]
            if t and t not in ("#", ""):
                c[t] += 1
        for t, n in c.most_common(30):
            print("  %3d  %s" % (n, t))

    print()
    print("【5】每页的出链数（= 一个页面把买家递给谁）")
    dist = collections.Counter(outbound[p] for p in ps)
    for n in sorted(dist):
        if n <= 3:
            print("  出链 %d 条的页面：%d 个" % (n, dist[n]))
    print("  出链最多的：")
    for p, n in outbound.most_common(8):
        print("  %4d 出链  %s" % (n, p))


if __name__ == "__main__":
    main()

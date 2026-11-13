# -*- coding: utf-8 -*-
"""核对首页存证表里的"covers"链接是否指向正确的商品页。"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

h = io.open(os.path.join(ROOT, "out", "index.html"), encoding="utf-8", errors="replace").read()
m = re.search(r"Every report on this site carries a hash[\s\S]{0,12000}", h)
table = m.group(0) if m else ""

rows = re.findall(r"NACCYH\d+|XJ\d+|2024FM\d+R\d+D", table)
print("存证表里出现的报告编号：", sorted(set(rows)))
print()
for mm in re.finditer(r"Covers([\s\S]{0,1200}?)</span>", table):
    links = re.findall(r'href="(/products/[^"]+)"[^>]*>\s*([^<]+)', mm.group(1))
    print("covers ->", [(u.strip(), n.strip()) for u, n in links])

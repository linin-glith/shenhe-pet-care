#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""P0 七项的逐项验收。"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

def read(p):
    return io.open(os.path.join(OUT, p), encoding="utf-8").read()

def jsonld(raw):
    out = []
    for m in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', raw, re.S):
        try:
            out.append(json.loads(m.group(1)))
        except Exception as e:
            out.append({"__parse_error__": str(e)})
    return out

ok = []
bad = []

def check(label, cond, detail=""):
    (ok if cond else bad).append("%s %s%s" % ("PASS" if cond else "FAIL", label,
                                              ("  — " + detail) if detail else ""))

home = read("index.html")
faq = read("faq.html")
hld = jsonld(home)
fld = jsonld(faq)

# ---- P0-2 结构化数据 -------------------------------------------------------
def find_type(blocks, t):
    found = []
    for b in blocks:
        if b.get("@type") == t:
            found.append(b)
        for n in (b.get("@graph") or []) if isinstance(b, dict) else []:
            if isinstance(n, dict) and n.get("@type") == t:
                found.append(n)
    return found

cat = find_type(hld, "OfferCatalog")
lst = find_type(hld, "ItemList")
crumbs = find_type(fld, "BreadcrumbList")
faqpage = find_type(fld, "FAQPage")

check("P0-2 首页 OfferCatalog", len(cat) == 1,
      ("lines=%d, items=%d" % (len(cat[0].get("itemListElement", [])),
                               len(cat[0].get("itemListElement", [{}])[0].get("itemListElement", [])))) if cat else "none")
if cat:
    c = cat[0]
    urls = []
    for line in c["itemListElement"]:
        if line.get("url"):
            urls.append(line["url"])
        for it in line["itemListElement"]:
            urls.append(it["item"]["url"])
    missing = []
    for u in urls:
        rel = u.replace("https://shenhezhongke.com", "").lstrip("/")
        if not os.path.exists(os.path.join(OUT, rel.replace("/", os.sep))):
            missing.append(u)
    check("P0-2 OfferCatalog 每个 URL 都指向真实页面", not missing,
          ("%d 个 URL, 缺 %s" % (len(urls), missing[:3])) if missing else "%d 个 URL" % len(urls))
    check("P0-2 OfferCatalog 是四条产品线",
          len(c["itemListElement"]) == 4, "实际 %d" % len(c["itemListElement"]))
    check("P0-2 OfferCatalog 不带价格",
          "offers" not in json.dumps(c) and "price" not in json.dumps(c).lower())

check("P0-2 首页 ItemList", len(lst) == 1,
      ("items=%d" % lst[0].get("numberOfItems", 0)) if lst else "none")
check("P0-2 /faq.html 有 BreadcrumbList", len(crumbs) == 1)

# ---- P0-3 链上存证 ----------------------------------------------------------check("P0-3 首页有存证区块", "Every report on this site carries a hash you can check" in home)
check("P0-3 首页链到 /report-hashes.json", "/report-hashes.json" in home)
check("P0-3 首页链到 /attestation.html", "/attestation.html" in home)
hashes = json.load(io.open(os.path.join(OUT, "report-hashes.json"), encoding="utf-8"))
shown = re.findall(r'([0-9a-f]{64})', home)
check("P0-3 首页印出的哈希与清单一致",
      all(h in [r["sha256"] for r in hashes["reports"]] for h in shown) and len(shown) >= 3,
      "%d 个哈希" % len(shown))

# ---- P0-4 合规清单 ----------------------------------------------------------
check("P0-4 首页有合规文件清单区块", "The paperwork that travels with the order" in home)
shipping = json.load(io.open(os.path.join(ROOT, "content", "v2", "shipping.json"), encoding="utf-8"))
docs = shipping["documents"]
missing = [d for d in docs if d not in home]
check("P0-4 随货单证全部来自 lib/shipping", not missing, "缺: %s" % missing if missing else "%d 份" % len(docs))
for p in ("/msds.html", "/standards.html", "/global-compliance.html", "/trade-compliance.html", "/certifications.html"):
    check("P0-4 首页链到 %s" % p, p in home)

# ---- P0-5 独立 FAQ 页 -------------------------------------------------------
check("P0-5 /faq.html 存在", os.path.exists(os.path.join(OUT, "faq.html")))
# The questions are counted inside the FAQ section: the data bar and the
# footer also carry <dt> elements, and they are not questions.
faq_section = re.search(r'<section[^>]*id="faq"[\s\S]*?</section>', faq)
dt = len(re.findall(r"<dt[\s>]", faq_section.group(0))) if faq_section else 0
check("P0-5 可见问答数 = 16", dt == 16, "实际 %d" % dt)
check("P0-5 FAQPage schema 存在且问数 = 16",
      len(faqpage) == 1 and len(faqpage[0].get("mainEntity", [])) == 16,
      "schema %d 条" % (len(faqpage[0].get("mainEntity", [])) if faqpage else 0))
h1 = len(re.findall(r"<h1[\s>]", faq))
check("P0-5 恰好 1 个 h1", h1 == 1, "实际 %d" % h1)
check("P0-5 canonical 指向 /faq.html", 'rel="canonical"' in faq and "/faq.html" in
      re.search(r'<link rel="canonical" href="([^"]+)"', faq).group(1))
check("P0-5 /faq.html 进 sitemap", "/faq.html" in read("sitemap.xml"))
check("P0-5 导航里能到 FAQ", "/faq.html" in home)
groups = re.findall(r"<h3[^>]*>([^<]{3,60})</h3>", faq_section.group(0)) if faq_section else []
check("P0-5 六个主题分组", len(groups) == 6, "实际 %d" % len(groups))

# ---- P0-6 响应口径 ----------------------------------------------------------
promise = []
for dp, _d, fs in os.walk(OUT):
    for f in fs:
        if f.endswith((".html", ".json", ".txt", ".xml", ".md")):
            p = os.path.join(dp, f)
            raw = io.open(p, encoding="utf-8", errors="replace").read()
            for m in re.finditer(r"business[ -]hour", raw, re.I):
                line = raw[:m.start()].count("\n") + 1
                snippet = raw.splitlines()[line - 1].strip()
                # "business hours" = 工作时间，是另一个意思
                if re.search(r"business hours", snippet, re.I):
                    continue
                promise.append("%s:%d %s" % (os.path.relpath(p, OUT), line, snippet[:110]))
check("P0-6 产物里没有 'business hour' 承诺", not promise, "; ".join(promise[:3]))
day = sum(io.open(os.path.join(dp, f), encoding="utf-8", errors="replace").read().count("business day")
          for dp, _d, fs in os.walk(OUT) for f in fs
          if f.endswith((".html", ".json", ".txt")))
check("P0-6 产物里出现 'business day'", day > 0, "%d 处" % day)

# ---- P0-7 agent skills ------------------------------------------------------
idx = json.load(io.open(os.path.join(OUT, ".well-known", "agent-skills", "index.json"), encoding="utf-8"))
check("P0-7 index.json 存在且带 $schema", idx.get("$schema", "").startswith("https://schemas.agentskills.io/"))
check("P0-7 四个 skill", len(idx.get("skills", [])) == 4)
for s in idx["skills"]:
    p = os.path.join(OUT, s["url"].lstrip("/").replace("/", os.sep))
    check("P0-7 %s 的 SKILL.md 在产物里" % s["name"], os.path.exists(p))
    import hashlib
    digest = "sha256:" + hashlib.sha256(io.open(p, "rb").read()).hexdigest()
    check("P0-7 %s 的 digest 对得上" % s["name"], digest == s["digest"])
cat_links = json.load(io.open(os.path.join(OUT, ".well-known", "api-catalog"), encoding="utf-8"))
check("P0-7 api-catalog 是 linkset", "linkset" in cat_links and len(cat_links["linkset"]) >= 1)
for link in cat_links.get("linkset", []):
    for key in ("service-desc", "service-doc", "status"):
        for e in link.get(key, []):
            u = e["href"]
            if u.startswith("https://shenhezhongke.com"):
                rel = u.replace("https://shenhezhongke.com", "").lstrip("/")
                check("P0-7 api-catalog 指向的 %s 在产物里" % rel,
                      os.path.exists(os.path.join(OUT, rel)))
check("P0-7 openapi.json 可解析且有路径",
      len(json.load(io.open(os.path.join(OUT, ".well-known", "openapi.json"), encoding="utf-8")).get("paths", {})) >= 3)

print("\n".join(ok))
if bad:
    print()
    print("\n".join(bad))
print("\n%d PASS / %d FAIL" % (len(ok), len(bad)))
sys.exit(1 if bad else 0)

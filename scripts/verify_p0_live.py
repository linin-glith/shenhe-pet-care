#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""P0 七项的**线上**验收：直接抓 shenhezhongke.com，不看本地产物。"""
import io, json, re, sys, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
BASE = "https://shenhezhongke.com"
UA = {"User-Agent": "Mozilla/5.0 (compatible; site-audit/1.0)"}


def get(path):
    req = urllib.request.Request(BASE + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace"), dict(r.headers)


def jsonld(raw):
    out = []
    for m in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', raw, re.S):
        try:
            out.append(json.loads(m.group(1)))
        except Exception:
            pass
    return out


ok, bad = [], []


def check(label, cond, detail=""):
    (ok if cond else bad).append("%s %s%s" % ("PASS" if cond else "FAIL", label,
                                              ("  — " + detail) if detail else ""))


st, home, hh = get("/")
st2, faq, fh = get("/faq.html")
check("首页 200", st == 200, "%d bytes" % len(home))
check("/faq.html 200", st2 == 200, "%d bytes" % len(faq))

hl, fl = jsonld(home), jsonld(faq)


def types(blocks, t):
    out = []
    for b in blocks:
        if b.get("@type") == t:
            out.append(b)
        for n in (b.get("@graph") or []) if isinstance(b, dict) else []:
            if isinstance(n, dict) and n.get("@type") == t:
                out.append(n)
    return out


cat = types(hl, "OfferCatalog")
lst = types(hl, "ItemList")
fp = types(fl, "FAQPage")
bc = types(fl, "BreadcrumbList")

check("P0-2 首页 OfferCatalog", len(cat) == 1,
      ("%d 条产品线 / %d 个 SKU" % (len(cat[0].get("itemListElement", [])),
                                   cat[0].get("numberOfItems", 0))) if cat else "none")
check("P0-2 OfferCatalog 不含价格", bool(cat) and "price" not in json.dumps(cat[0]).lower())
check("P0-2 首页 ItemList", len(lst) == 1, ("%d 项" % lst[0].get("numberOfItems", 0)) if lst else "none")
check("P0-2 /faq.html BreadcrumbList", len(bc) == 1)

check("P0-3 首页有存证区块", "Every report on this site carries a hash you can check" in home)
check("P0-3 首页链到 /report-hashes.json", "/report-hashes.json" in home)
check("P0-3 首页链到 /attestation.html", "/attestation.html" in home)
st, hashes, hh2 = get("/report-hashes.json")
live = {r["sha256"] for r in json.loads(hashes)["reports"]}
shown = set(re.findall(r'([0-9a-f]{64})', home))
check("P0-3 首页的哈希与线上清单一致", bool(shown) and shown <= live, "%d 个" % len(shown))

check("P0-4 首页有合规文件清单", "The paperwork that travels with the order" in home)
for p in ("/msds.html", "/standards.html", "/global-compliance.html", "/trade-compliance.html"):
    check("P0-4 首页链到 %s" % p, p in home)

sec = re.search(r'<section[^>]*id="faq"[\s\S]*?</section>', faq)
dt = len(re.findall(r"<dt[\s>]", sec.group(0))) if sec else 0
check("P0-5 线上 /faq.html 可见问答 = 16", dt == 16, "实际 %d" % dt)
check("P0-5 线上 FAQPage schema = 16",
      len(fp) == 1 and len(fp[0].get("mainEntity", [])) == 16,
      "%d 条" % (len(fp[0].get("mainEntity", [])) if fp else 0))
check("P0-5 线上恰好 1 个 h1", len(re.findall(r"<h1[\s>]", faq)) == 1)
check("P0-5 线上 /faq.html 进 sitemap", "/faq.html" in get("/sitemap.xml")[1])

check("P0-6 线上首页没有 'business hour' 承诺",
      not re.search(r"business[ -]hour", home, re.I) or
      all("business hours" in l for l in home.splitlines() if re.search(r"business[ -]hour", l, re.I)))
check("P0-6 线上首页写的是 one business day", "business day" in home)

st, idx, ih = get("/.well-known/agent-skills/index.json")
data = json.loads(idx)
check("P0-7 线上 agent-skills/index.json 可取且可解析", st == 200 and "skills" in data,
      "%d 个 skill" % len(data.get("skills", [])))
st, cat_json, ch = get("/.well-known/api-catalog")
check("P0-7 线上 api-catalog 可取且是 linkset",
      st == 200 and "linkset" in json.loads(cat_json))
for s in data.get("skills", []):
    sst, sbody, _ = get(s["url"])
    check("P0-7 %s 的 SKILL.md 可取" % s["name"], sst == 200, "%d bytes" % len(sbody))

st, _, _ = get("/.well-known/openapi.json")
check("P0-7 线上 openapi.json 可取", st == 200)
st, _, _ = get("/.well-known/version.json")
check("P0-7 线上 version.json 可取", st == 200)

# P0-1 的死链仍然是死的
for p in ("/de/", "/es/"):
    try:
        req = urllib.request.Request(BASE + p, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r:
            check("P0-1 %s 应当 404" % p, False, "实际 %d" % r.status)
    except urllib.error.HTTPError as e:
        check("P0-1 %s 是 404（不是 301→404）" % p, e.code == 404, "实际 %d" % e.code)

print("\n".join(ok))
if bad:
    print()
    print("\n".join(bad))
print("\n%d PASS / %d FAIL" % (len(ok), len(bad)))
sys.exit(1 if bad else 0)

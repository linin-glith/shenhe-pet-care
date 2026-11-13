"""Audit the SEO / GEO surface of the built site.

Per page: the title and description, the schema.org types it ships, its
canonical, and its hreflang alternates (do the alternates actually exist?).

Across the site: which pages the AI-facing files mention, and which
machine-readable files are published at all.
"""
import html
import json, os, re, sys
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

TITLE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
DESC = re.compile(r'<meta\s+name="description"\s+content="([^"]*)"', re.I)
CANON = re.compile(r'<link\s+rel="canonical"\s+href="([^"]*)"', re.I)
HREFLANG = re.compile(r'<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"', re.I)
LD = re.compile(r'(?s)<script type="application/ld\+json">(.*?)</script>')
H1 = re.compile(r"<h1[\s>]", re.I)
ROBOTS = re.compile(r'<meta\s+name="robots"\s+content="([^"]*)"', re.I)


def types_of(obj):
    out = []
    if isinstance(obj, list):
        for x in obj:
            out += types_of(x)
        return out
    if not isinstance(obj, dict):
        return out
    t = obj.get("@type")
    if isinstance(t, str):
        out.append(t)
    elif isinstance(t, list):
        out += t
    g = obj.get("@graph")
    if isinstance(g, list):
        for x in g:
            out += types_of(x)
    return out


rows = []
type_counter = Counter()
hreflang_missing = []
for base, _, files in os.walk(OUT):
    for f in sorted(files):
        if not f.endswith(".html"):
            continue
        p = os.path.join(base, f)
        rel = "/" + os.path.relpath(p, OUT).replace("\\", "/")
        if rel == "/index.html":
            rel = "/"   # the home page is served at "/", not at "/index.html"
        raw = open(p, encoding="utf-8").read()

        tm = TITLE.search(raw)
        dm = DESC.search(raw)
        cm = CANON.search(raw)
        # A search result shows the DECODED text. "Disinfectant & Deodorizing"
        # is 59 characters as the buyer reads it and 63 in the HTML, so the
        # length has to be measured on the decoded string or every title with
        # an ampersand in it is reported as over budget.
        title = html.unescape(tm.group(1).strip()) if tm else ""
        desc = html.unescape(dm.group(1)) if dm else ""
        types = []
        for b in LD.findall(raw):
            try:
                types += types_of(json.loads(b))
            except Exception:
                types.append("INVALID-JSON")
        types = sorted(set(types))
        type_counter.update(types)

        alts = HREFLANG.findall(raw)
        for lang, href in alts:
            path = href.replace("https://shenhezhongke.com", "").split("#")[0]
            fs = os.path.join(OUT, path.lstrip("/")) if path.strip("/") else os.path.join(OUT, "index.html")
            if not os.path.isfile(fs) and not os.path.isfile(fs + ".html"):
                hreflang_missing.append((rel, lang, path))

        rows.append({
            "page": rel,
            "title": title,
            "titleLen": len(title),
            "descLen": len(desc),
            "canonical": cm.group(1) if cm else None,
            "types": types,
            "h1": len(H1.findall(raw)),
            "hreflang": [a[0] for a in alts],
        })

print("=" * 76)
print(f"页面 {len(rows)}")
print("\n【schema.org 类型分布】")
for t, n in type_counter.most_common():
    print(f"   {t:26s} {n:3d} 页")

print("\n【缺 Product schema 的产品页】")
prod = [r for r in rows if r["page"].startswith("/products/") and "cat-litter" not in r["page"]
        and r["page"] not in ("/products/pet-nutrition.html", "/products/grooming-care.html",
                              "/products/deodorizing-disinfecting.html", "/products/outdoor-protection.html")]
missing_product = [r["page"] for r in prod if "Product" not in r["types"]]
print(f"   {len(missing_product)} / {len(prod)}: {missing_product}")

print("\n【缺 FAQPage schema 的页】")
no_faq = [r["page"] for r in rows if "FAQPage" not in r["types"]]
print(f"   {len(no_faq)} 页: {no_faq}")

print("\n【缺 BreadcrumbList 的页】")
no_bc = [r["page"] for r in rows if "BreadcrumbList" not in r["types"] and r["page"] != "/"]
print(f"   {len(no_bc)} / {len(rows)}")

print("\n【title / description 长度越界的页】")
for r in rows:
    bad = []
    if r["titleLen"] > 62:
        bad.append(f"title {r['titleLen']}")
    if r["titleLen"] < 15:
        bad.append(f"title 短 {r['titleLen']}")
    if r["descLen"] > 160:
        bad.append(f"desc {r['descLen']}")
    if r["descLen"] < 60:
        bad.append(f"desc 短 {r['descLen']}")
    if r["h1"] != 1:
        bad.append(f"h1={r['h1']}")
    if bad:
        print(f"   {r['page']:46s} {', '.join(bad)}")

print("\n【hreflang 指向不存在的页】")
print(f"   {len(hreflang_missing)}")
for rel, lang, path in hreflang_missing[:12]:
    print(f"      {rel:40s} {lang} -> {path}")

print("\n【AI 面向的文件覆盖】")
for name in ("llms.txt", "llms-full.txt", "llms-full.json", "ai.txt", "sitemap-ai.xml", "llms-sitemap.xml",
             ".well-known/ai-manifest.json", "topic-cluster.json", "citation-graph.json"):
    p = os.path.join(OUT, name)
    if not os.path.isfile(p):
        print(f"   {name:20s} 缺失")
        continue
    raw = open(p, encoding="utf-8", errors="replace").read()
    # "*" not "+": the site root is "https://shenhezhongke.com/", and a
    # pattern that needs one character after the slash never matches it.
    pages = set(re.findall(r"https://shenhezhongke\.com(/[^\s\"'<>()]*)", raw))
    pages = {x.split("#")[0] for x in pages if x.endswith(".html") or x == "/"}
    print(f"   {name:20s} {len(raw)//1024:4d} KB  提到 {len(pages):3d} 个页面")
    if name == "ai.txt":
        # ai.txt is a PERMISSION file — what an assistant may fetch and how it
        # must cite. The map of the site lives in llms.txt, which it points at.
        print("        （权限文件，不承担页面地图职责；页面清单在 llms.txt）")
        continue
    if name == "sitemap-ai.xml":
        # a sitemap of the AI files themselves, not of the pages
        print("        （AI 文件自身的站点地图）")
        continue
    missing = [r["page"] for r in rows
               if r["page"] not in pages and not r["page"].endswith(("404.html", "_not-found.html"))
               # The internal screens — the buyer portal under /portal/ and the
               # factory desk under /admin/ — are noindex and behind a
               # sign-in. The AI files must NOT list them: telling a crawler
               # to go and look at pages that answer with a login screen is
               # the opposite of helpful. build_ai_files.py leaves them out
               # for the same reason.
               and not r["page"].startswith(("/portal/", "/admin/"))
               and r["page"] != "/admin.html"]
    print(f"        未提到的公开页 {len(missing)}: {missing[:12]}")

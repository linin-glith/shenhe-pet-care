"""Audit the whole link graph of the built site.

The health check answers "does every link resolve". This answers the other
half: "is the site actually navigable" —

  * which pages exist, and which of them a crawler or a buyer can reach
  * pages nothing links to (orphans: they survive only if a sitemap names them)
  * pages named in a sitemap that do not exist
  * in-page anchors (#section) that point at nothing
  * how many clicks every page is from the home page
  * pages that are linked publicly but ask not to be indexed, and the reverse
  * public pages that no sitemap lists

Usage: python scripts/audit_links.py [--out out]
"""
import argparse, os, re, sys, json
from collections import defaultdict, deque

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HREF = re.compile(r'<a\b[^>]*?href="([^"]*)"', re.I)
ID = re.compile(r'\bid="([^"]+)"', re.I)
ROBOTS = re.compile(r'<meta\s+name="robots"\s+content="([^"]*)"', re.I)
CANON = re.compile(r'<link\s+rel="canonical"\s+href="([^"]*)"', re.I)
TITLE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
LOC = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>", re.I)


SITE_HOSTS = ("shenhezhongke.com", "www.shenhezhongke.com", "localhost:3000", "127.0.0.1:3000")


def norm(href, base="/"):
    """A site URL -> the path we key pages by, or None for off-site."""
    if not href:
        return None
    h = href.strip()
    if h.startswith(("mailto:", "tel:", "data:", "javascript:")):
        return None
    if h.startswith(("http://", "https://", "//")):
        rest = h.split("://", 1)[-1]
        host, _, path = rest.partition("/")
        if host.lower() not in SITE_HOSTS:
            return None
        h = "/" + path
    if h.startswith("#"):
        return None
    if h.startswith("/"):
        p = h
    else:
        # relative to the directory the current page sits in
        d = base.rsplit("/", 1)[0]
        p = (d + "/" + h) if d else ("/" + h)
    p = p.split("#")[0].split("?")[0]
    # THE ROOT IS THE HOME PAGE.
    #
    # The export holds it as index.html and the page table keys it as
    # "/index.html", but every link to it is written as "/". A path that
    # ends in "/" is a directory, so it does not get the .html suffix -
    # and then it is not in the page table, and every link to the home
    # page is reported as "the page does not exist".
    #
    # That was 190 false alarms on a site with nothing wrong with it.
    if p == "/":
        p = "/index.html"
    # only a path that really is a page gets the .html suffix; a .txt, .xml,
    # .pdf or .md link is a file and must keep its own name
    if not p.endswith("/") and "." not in p.rsplit("/", 1)[-1]:
        p += ".html"
    return p


def is_page_link(href):
    """A link that is meant to be a page, not a file."""
    if not href or href.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return False
    path = href.split("#")[0].split("?")[0]
    if path.startswith(("http://", "https://", "//")):
        path = "/" + path.split("://", 1)[-1].partition("/")[2]
    return path.endswith(".html") or ("." not in path.rsplit("/", 1)[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "out"))
    args = ap.parse_args()
    OUT = args.out

    # ---- inventory -------------------------------------------------------
    pages = {}
    for base, _, files in os.walk(OUT):
        for f in files:
            if f.endswith(".html"):
                p = os.path.join(base, f)
                rel = "/" + os.path.relpath(p, OUT).replace("\\", "/")
                raw = open(p, encoding="utf-8").read()
                ids = set(ID.findall(raw))
                rob = ROBOTS.search(raw)
                can = CANON.search(raw)
                tm = TITLE.search(raw)
                pages[rel] = {
                    "raw": raw,
                    "ids": ids,
                    "noindex": bool(rob and "noindex" in rob.group(1).lower()),
                    "canonical": can.group(1) if can else None,
                    "title": (tm.group(1).strip() if tm else "")[:60],
                    "out": set(),
                    "frag": set(),
                }

    # ---- edges -----------------------------------------------------------
    external = defaultdict(set)
    bad_fragments = []
    missing_files = []
    for rel, meta in pages.items():
        for href in HREF.findall(meta["raw"]):
            if href.startswith(("http://", "https://", "//")):
                host = re.sub(r"^https?://", "", href).split("/")[0]
                if host.lower() not in SITE_HOSTS:
                    external[host].add(rel)
                continue
            if href.startswith("#"):
                frag = href[1:]
                if frag and frag not in meta["ids"]:
                    bad_fragments.append((rel, href, "同页锚点不存在"))
                continue
            target = norm(href, rel)
            if not target:
                continue
            frag = href.split("#")[1] if "#" in href else None
            if frag and target in pages and frag not in pages[target]["ids"]:
                bad_fragments.append((rel, href, "跨页锚点不存在"))
            if target in pages:
                meta["out"].add(target)
                pages[target].setdefault("in", set()).add(rel)
            elif is_page_link(href):
                bad_fragments.append((rel, href, "页面不存在"))
            else:
                # a file link: it has to exist in the export
                fp = os.path.join(OUT, target.lstrip("/").replace(".html", ""))
                if not os.path.isfile(fp) and not os.path.isfile(fp + ".html"):
                    missing_files.append((rel, href))

    for p in pages.values():
        p.setdefault("in", set())

    # ---- sitemaps --------------------------------------------------------
    sm_urls = set()
    sm_files = []
    for base, _, files in os.walk(OUT):
        for f in files:
            if f.endswith(".xml") and "sitemap" in f:
                p = os.path.join(base, f)
                sm_files.append("/" + os.path.relpath(p, OUT).replace("\\", "/"))
                raw = open(p, encoding="utf-8", errors="replace").read()
                for loc in LOC.findall(raw):
                    sp = norm(loc)
                    if sp:
                        sm_urls.add(sp)

    # ---- click depth from home ------------------------------------------
    depth = {"/index.html": 0}
    q = deque(["/index.html"])
    while q:
        cur = q.popleft()
        for nxt in pages[cur]["out"]:
            if nxt not in depth:
                depth[nxt] = depth[cur] + 1
                q.append(nxt)

    # ---- report ----------------------------------------------------------
    print("=" * 78)
    print(f"页面总数 {len(pages)}   站内链接 {sum(len(p['out']) for p in pages.values())}   外部域名 {len(external)}")
    print("=" * 78)

    orphans = [p for p in pages if p not in depth and p != "/index.html"]
    print(f"\n【孤儿页】从首页点不到（只能靠 sitemap / 直接输网址）: {len(orphans)}")
    for p in sorted(orphans):
        m = pages[p]
        print(f"   {p:46s} 入链 {len(m['in'])}  sitemap={'Y' if p in sm_urls else 'N'}  {m['title'][:30]}")

    print(f"\n【点击深度】")
    buckets = defaultdict(list)
    for p, d in depth.items():
        buckets[d].append(p)
    for d in sorted(buckets):
        print(f"   {d} 跳: {len(buckets[d])} 页")

    deep = [(p, depth[p]) for p in pages if p in depth and depth[p] >= 4]
    if deep:
        print(f"   ≥4 跳才到的页面 {len(deep)}:")
        for p, d in sorted(deep, key=lambda x: -x[1]):
            print(f"      {d} 跳  {p}")

    print(f"\n【sitemap】{len(sm_files)} 个文件, {len(sm_urls)} 条 URL")
    miss_sitemap = [p for p in sorted(pages) if p not in sm_urls and not pages[p]["noindex"] and p != "/index.html"]
    print(f"   公开页但不在任何 sitemap: {len(miss_sitemap)}")
    for p in miss_sitemap:
        print(f"      {p:46s} 入链 {len(pages[p]['in'])}  {pages[p]['title'][:30]}")
    ghost = [u for u in sorted(sm_urls) if u not in pages and u.endswith(".html")]
    print(f"   sitemap 指向不存在的页: {len(ghost)} {ghost}")

    print(f"\n【锚点】失效的 # 链接: {len(bad_fragments)}")
    for rel, h, why in bad_fragments[:25]:
        print(f"      {rel:40s} -> {h}   [{why}]")
    print(f"\n【文件链接】指向不存在的文件: {len(missing_files)}")
    for rel, h in missing_files[:25]:
        print(f"      {rel:40s} -> {h}")

    print(f"\n【索引一致性】")
    for p in sorted(pages):
        m = pages[p]
        linked_publicly = any(not pages[src]["noindex"] for src in m["in"])
        if m["noindex"] and linked_publicly:
            print(f"      noindex 但被公开页链入: {p}")
        if not m["noindex"] and p not in sm_urls and p != "/index.html":
            print(f"      可索引但无 sitemap 入口: {p} (入链 {len(m['in'])})")
    print(f"   缺 canonical: {[p for p in pages if not pages[p]['canonical'] and not pages[p]['noindex']]}")

    print(f"\n【外部链接域名】")
    for host, srcs in sorted(external.items()):
        print(f"      {host:44s} {len(srcs)} 页")

    print(f"\n【入链最少的页面】")
    low = sorted(pages.items(), key=lambda kv: len(kv[1]["in"]))[:10]
    for p, m in low:
        print(f"      {len(m['in']):3d} 入链  {p:46s} {m['title'][:28]}")

    print(f"\n【转化路径】每个公开页能不能到达询盘表单")
    no_rfq = []
    for p in sorted(pages):
        m = pages[p]
        if m["noindex"]:
            continue
        # on-page form, a link to the contact page, or the WhatsApp hand-off
        has_form = 'id="rfq"' in m["raw"]
        reaches = any(
            t in m["out"] for t in ("/contact.html", "/ai-customize.html")
        ) or has_form or "wa.me" in m["raw"]
        if not reaches:
            no_rfq.append(p)
    print(f"   走不到询盘的公开页: {len(no_rfq)} {no_rfq}")

    print(f"\n【2 跳才到的页】")
    for p in sorted(pages):
        if depth.get(p) == 2:
            print(f"      {p}")

    out_json = os.path.join(ROOT, "scripts", "link-audit.json")
    with open(out_json, "w", encoding="utf-8", newline="") as f:
        json.dump({
            "pages": {p: {"in": sorted(m["in"]), "out": sorted(m["out"]),
                          "depth": depth.get(p), "noindex": m["noindex"],
                          "inSitemap": p in sm_urls, "title": m["title"]}
                      for p, m in pages.items()},
            "orphans": sorted(orphans),
            "badFragments": bad_fragments,
            "missingFiles": missing_files,
            "notInSitemap": miss_sitemap,
            "sitemapGhosts": ghost,
            "external": {h: sorted(s) for h, s in external.items()},
        }, f, ensure_ascii=False, indent=1)
    print(f"\n-> {out_json}")


if __name__ == "__main__":
    main()

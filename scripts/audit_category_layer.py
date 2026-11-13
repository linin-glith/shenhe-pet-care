"""品类层现状审计：品类是不是真的贯穿了三层，还是只贴在页面的一个参数上。

链条：枢纽页 --链接--> SKU 页 slug --内容JSON里的 sku_oem--> 产品记录 id --> category

输出：
  1. 产品记录里的品类 → SKU 清单
  2. 每个品类枢纽页实际链出去的 SKU 及其真实品类
  3. 缺口：绑错品类 / 有 SKU 没页面 / 品类无枢纽页 / 枢纽页无 SKU
  4. 每个品类在枢纽页上有没有 ItemList 标记（品类能不能被引擎当成"一个集合"）

用法：
    python scripts/audit_category_layer.py
"""
import io
import json
import os
import re
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HUB_BINDING = {
    'deodorizing-disinfecting': 'deodorizing_disinfection',
    'grooming-care': 'grooming_care',
    'pet-nutrition': 'pet_nutrition',
    'outdoor-protection': 'outdoor_protection',
}

# 判据用 line，不用 category。
#
# 枢纽页是按 line 组织的（`legacyToV2` 的第二个参数先注入品类块，页面成员则来自
# line 分组）。用 category 去判 line 页，会把 P005/P006 判成"绑错"——它们
# `line = grooming_care` 而 `category = disinfection_odor_control`，
# 页面展示它们其实是对的。category 是合规分组（目录/许可标签用），
# 不该拿来当 SEO 品类的判据。

LINK = re.compile(r'products/([a-z0-9-]+)\.html')


def load_products():
    raw = io.open(os.path.join(ROOT, 'lib', 'products.json'), encoding='utf-8').read()
    d = json.loads(raw)
    return d if isinstance(d, list) else d.get('products', [])


def content_json(slug):
    path = os.path.join(ROOT, 'content', 'products__%s.json' % slug)
    if not os.path.exists(path):
        return None
    return io.open(path, encoding='utf-8').read()


def page_html(slug):
    """The built page. This is the truth for SKU identity.

    The v2 pages render their body from components, so the content JSON is a
    stub with no sku_oem in it. Reading the stub made six pages look like they
    had no SKU at all — the same mistake audit_page_identity.py made first
    time round. Judge by what actually ships.
    """
    path = os.path.join(ROOT, 'out', 'products', '%s.html' % slug)
    if not os.path.exists(path):
        return None
    return io.open(path, encoding='utf-8', errors='replace').read()


def page_source(slug):
    """Built page if it exists, otherwise the stub (for pages not yet built)."""
    return page_html(slug) or content_json(slug)


MAIN = re.compile(r'<main[\s>].*?</main>', re.S)
H1 = re.compile(r'<h1[^>]*>(.*?)</h1>', re.S)
TAG = re.compile(r'<[^>]+>')


def page_h1(slug):
    """The H1 as plain text — the page's own statement of which product it is.

    Grepping for an sku_oem was wrong: a product page also lists its neighbours
    in a card block, so their codes appear too. pet-waterless-cleaning-foam (300
    mL) carries both -300 and -500 and got read as the 500 mL SKU. The H1 is the
    page's declared identity, and it matches name_en exactly for all 20 SKUs.
    """
    raw = page_html(slug)
    if not raw:
        return None
    m = H1.search(raw)
    if not m:
        return None
    return unescape(' '.join(TAG.sub(' ', m.group(1)).split()))


def link_source(slug):
    """Only the body, for counting members.

    The full page also carries the header and footer navigation, which links
    every other category hub. Counting those as "members of this category"
    turns nav into false positives — grooming-care looked like it showed P001
    because the footer links to cat-care, not because the page lists it.
    """
    raw = page_html(slug) or content_json(slug) or ''
    m = MAIN.search(raw)
    return m.group(0) if m else raw


def has_category_block(slug):
    """Whether the page actually renders the category layer.

    The binding is not readable from the content stub: whether `legacyToV2` got
    a category argument shows up only as the rendered block. outdoor-protection
    is the case in point — it was bound on paper and never rendered.
    """
    return 'Ordering the' in (page_html(slug) or '')


def main():
    products = load_products()
    by_id = {(r.get('id') or r.get('sku')): r for r in products}
    by_oem = {(r.get('sku_oem') or '').strip(): (r.get('id') or r.get('sku')) for r in products}
    by_name = {(r.get('name_en') or '').strip(): (r.get('id') or r.get('sku')) for r in products}
    by_cat = {}
    for r in products:
        by_cat.setdefault(r.get('category') or '(none)', []).append(r)

    def slug_to_sku(slug):
        h1 = page_h1(slug)
        if not h1:
            return None
        if h1 in by_name:
            return by_name[h1]
        for name, pid in by_name.items():
            if name and (name in h1 or h1 in name):
                return pid
        return None

    print('=== 1. 产品记录里的品类 ===')
    for cat, rows in sorted(by_cat.items(), key=lambda kv: -len(kv[1])):
        ids = sorted(r.get('id') or r.get('sku') for r in rows)
        print('%-28s %2d  %s' % (cat, len(ids), ', '.join(ids)))

    print()
    print('=== 2. 枢纽页链出去的 SKU ===')
    shown = {}
    for slug, bound in HUB_BINDING.items():
        raw = link_source(slug)
        if not raw:
            print('%-28s (no content json)' % slug)
            shown[slug] = set()
            continue
        # 品类页互链不算"成员"：它们是兄弟品类的入口，不是本页展示的产品。
        slugs = sorted({m for m in LINK.findall(raw) if m != slug and m not in HUB_BINDING})
        skus = {}
        for s in slugs:
            pid = slug_to_sku(s)
            if pid:
                skus[s] = pid
        shown[slug] = set(skus.values())
        print('%-28s line=%-26s 品类块=%-3s 链出 %d 个 SKU'
              % (slug, bound, 'yes' if has_category_block(slug) else 'NO', len(skus)))
        for s, pid in skus.items():
            ln = by_id.get(pid, {}).get('line') or '(none)'
            mark = '' if ln == bound else '   <-- 不属于本线'
            print('     %-40s %s line=%-24s%s' % (s, pid, ln, mark))
        no_sku = [s for s in slugs if s not in skus]
        if no_sku:
            print('     [无 SKU 记录] %s' % ', '.join(no_sku))

    print()
    print('=== 3. 缺口（按 line 判，因为枢纽页按 line 组织）===')
    by_line = {}
    for r in products:
        by_line.setdefault(r.get('line') or '(none)', []).append(r)

    all_shown = set()
    for v in shown.values():
        all_shown |= v
    for ln, rows in sorted(by_line.items()):
        ids = sorted(r.get('id') or r.get('sku') for r in rows)
        orphans = [i for i in ids if i not in all_shown]
        if orphans:
            print('[本线 SKU 没被任何枢纽页链到] %-26s %s' % (ln, ', '.join(orphans)))

    for slug, ln in HUB_BINDING.items():
        if not has_category_block(slug):
            print('[品类块未启用] %-28s line=%s —— 文案写好了，页面没渲染' % (slug, ln))
        wrong = ['%s(line=%s)' % (s, by_id.get(s, {}).get('line'))
                 for s in sorted(shown.get(slug, set()))
                 if by_id.get(s, {}).get('line') not in (None, ln)]
        if wrong:
            print('[跨线展示] %-28s line=%-24s 展示 %s' % (slug, ln, ', '.join(wrong)))

    for ln in sorted(by_line):
        if ln not in set(HUB_BINDING.values()):
            print('[这条线没有枢纽页] %s' % ln)
    for slug, ln in HUB_BINDING.items():
        if ln not in by_line:
            print('[枢纽页对应的线没有 catalogue SKU] %-28s line=%s' % (slug, ln))

    print()
    print('=== 4. category 与 line 的交叉（合规分组 vs 页面分组）===')
    cat_to_line = {
        'disinfection_odor_control': 'deodorizing_disinfection',
        'cleansing_grooming': 'grooming_care',
        'outdoor_protection': 'outdoor_protection',
    }
    cross = [r for r in products
             if cat_to_line.get(r.get('category') or '') != (r.get('line') or '')]
    if cross:
        for r in cross:
            print('  %-6s category=%-26s line=%-24s  ← 两条轴不一致'
                  % (r.get('id'), r.get('category'), r.get('line')))
    else:
        print('  (none)')

    print()
    print('=== 5. 枢纽页的集合标记 ===')
    for slug in HUB_BINDING:
        html = os.path.join(ROOT, 'out', 'products', '%s.html' % slug)
        if not os.path.exists(html):
            print('%-28s (not built)' % slug)
            continue
        h = io.open(html, encoding='utf-8', errors='ignore').read()
        has = [t for t in ('CollectionPage', 'ItemList', 'ProductGroup', 'FAQPage')
               if ('"%s"' % t) in h]
        print('%-28s %s' % (slug, ', '.join(has) or '(none)'))

    print()
    print('=== 一句话 ===')
    print('产品记录 %d 个 SKU / %d 个 category / %d 条 line；枢纽页 %d 个，其中品类块真正启用的 %d 个'
          % (len(products), len(by_cat), len(by_line), len(HUB_BINDING),
             sum(1 for s in HUB_BINDING if has_category_block(s))))


if __name__ == '__main__':
    main()

"""每个产品页能不能被机器认回具体 SKU，以及品类枢纽页的问答厚度。

判据以【构建产物 out/products/*.html】为准，不看 content/*.json 源文件——
v2 渲染的页面正文来自组件，源 JSON 里可能只有 stub，扫源文件会误报"断链"。

用法：
    python scripts/audit_page_identity.py
"""
import glob
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HUB = {
    'deodorizing-disinfecting': 'Odor control & disinfection',
    'grooming-care': 'Cleansing & grooming',
    'pet-nutrition': 'Pet nutrition',
    'outdoor-protection': 'Outdoor protection',
}


def load_products():
    raw = io.open(os.path.join(ROOT, 'lib', 'products.json'), encoding='utf-8').read()
    d = json.loads(raw)
    return d if isinstance(d, list) else d.get('products', [])


def main():
    products = load_products()
    pages = sorted(glob.glob(os.path.join(ROOT, 'out', 'products', '*.html')))
    if not pages:
        raise SystemExit('out/products/*.html not found — build first')

    claimed = {}
    for path in pages:
        name = os.path.basename(path)[:-5]
        h = io.open(path, encoding='utf-8', errors='ignore').read()
        for r in products:
            oem = (r.get('sku_oem') or '').strip()
            if oem and oem in h:
                claimed.setdefault(name, []).append(r.get('id'))

    print('=== 页面 → SKU（以构建产物为准）===')
    for path in pages:
        name = os.path.basename(path)[:-5]
        ids = claimed.get(name)
        if ids:
            print('  %-42s %s' % (name, ', '.join(ids)))
        else:
            print('  %-42s (no SKU — hub or non-catalogue page)' % name)

    print()
    print('=== 有记录但没有页面认领的 SKU ===')
    got = {i for v in claimed.values() for i in v}
    orphans = [r['id'] for r in products if r.get('id') not in got]
    if orphans:
        for pid in orphans:
            r = [x for x in products if x.get('id') == pid][0]
            print('  %s  %s  [line=%s]' % (pid, (r.get('name_en') or '')[:46], r.get('line')))
    else:
        print('  (none)')

    print()
    print('=== 问答厚度：SKU 页 vs 品类枢纽页 ===')
    rows = []
    for path in pages:
        name = os.path.basename(path)[:-5]
        h = io.open(path, encoding='utf-8', errors='ignore').read()
        q = len(re.findall(r'"@type":"Question"', h))
        rows.append((name, q, bool(claimed.get(name)), name in HUB))

    sku_pages = [r for r in rows if r[2] and not r[3]]
    hub_pages = [r for r in rows if r[3]]
    other = [r for r in rows if not r[2] and not r[3]]

    print('  SKU 页   %2d 个，问答中位数 %s，最少 %d，最多 %d'
          % (len(sku_pages),
             sorted(r[1] for r in sku_pages)[len(sku_pages) // 2] if sku_pages else '-',
             min((r[1] for r in sku_pages), default=0),
             max((r[1] for r in sku_pages), default=0)))
    print('  枢纽页   %2d 个，问答 %s'
          % (len(hub_pages), ', '.join('%s=%d' % (r[0][:22], r[1]) for r in hub_pages)))
    if other:
        print('  其他页   %s' % ', '.join('%s=%d' % (r[0][:22], r[1]) for r in other))

    print()
    gap = sum(1 for r in hub_pages if r[1] < 10)
    print('品类枢纽页问答 < 10 条的：%d / %d' % (gap, len(hub_pages)))
    print('页面 %d 个，认回 SKU 的 %d 个；记录 %d 个 SKU，未认领 %d 个'
          % (len(pages), len(claimed), len(products), len(orphans)))


if __name__ == '__main__':
    main()

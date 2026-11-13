import json, re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

src = open(os.path.join(ROOT, 'lib', 'product-routing.ts'), encoding='utf-8').read()
m = re.search(r'PRODUCT_ROUTE[^=]*=\s*\{(.*?)\n\}', src, re.S)
pairs = re.findall(r'"(P\d+)"\s*:\s*"([^"]+)"', m.group(1))
print('routes in PRODUCT_ROUTE:', len(pairs))

cat = json.load(open(os.path.join(ROOT, 'lib', 'products.json'), encoding='utf-8'))
ids = [p['id'] for p in cat['products'] if p.get('status') == 'active']
have = {i for i, _ in pairs}
print('catalogue active SKUs:', len(ids))
missing = [i for i in ids if i not in have]
print('SKU with NO route:', missing)
for i in missing:
    p = [x for x in cat['products'] if x['id'] == i][0]
    print('    ', i, p['name_en'], '|', p['specification'], '| line=', p.get('line'))
print('routes with no catalogue SKU:', [(i, s) for i, s in pairs if i not in ids])

built = set(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, 'out', 'products', '*.html')))
slugs = {s for i, s in pairs}
print('route slugs with NO built page:', sorted(slugs - built))
print('built pages that are not a SKU route:',
      sorted(built - slugs))
print()
print('--- all routes ---')
for i, s in pairs:
    p = [x for x in cat['products'] if x['id'] == i]
    print('  %-5s %-38s %s' % (i, s, (p[0]['name_en'][:44] if p else 'NO CATALOGUE RECORD')))

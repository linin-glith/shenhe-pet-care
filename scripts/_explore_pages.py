import json, re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

cat = json.load(open(os.path.join(ROOT, 'lib', 'products.json'), encoding='utf-8'))
prods = cat['products'] if isinstance(cat, dict) else cat
print('catalogue SKUs:', len(prods))
slugs = {}
for p in prods:
    s = p.get('slug')
    slugs[s] = p
    print('  %s %-42s slug=%-38s status=%-8s moq=%s' % (
        p.get('id'), (p.get('name_en') or '')[:42], s, p.get('status'), p.get('moq')))

print()
built = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, 'out', 'products', '*.html')))
print('built product pages:', len(built))
for b in built:
    tag = 'OK ' if b in slugs else '**NOT IN CATALOGUE**'
    print('  %-40s %s' % (b, tag))
print()
print('catalogue slugs with no page:')
for s in slugs:
    if s not in built:
        print('  ', s)

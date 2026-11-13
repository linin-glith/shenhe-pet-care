import re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def vis(h):
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
    h = re.sub(r'<[^>]+>', ' ', h)
    for a, b in [('&nbsp;', ' '), ('&amp;', '&'), ('&middot;', ' '), ('&ndash;', '-'),
                 ('&mdash;', '-'), ('&#x27;', "'"), ('&quot;', '"')]:
        h = h.replace(a, b)
    return re.sub(r'\s+', ' ', h)

for f in sorted(glob.glob(os.path.join(ROOT, 'docs', '_audit', '**', 'products__outdoor-protection.html'), recursive=True)):
    raw = open(f, encoding='utf-8').read()
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', raw, re.S)
    title = re.search(r'<title>(.*?)</title>', raw, re.S)
    t = vis(raw)
    print('===', os.path.relpath(f, ROOT))
    print('  title:', title.group(1).strip() if title else '(none)')
    print('  h1   :', vis(h1.group(1)).strip() if h1 else '(none)')
    m = re.search(r'.{70}\b\d+\s+SKUs?\b.{70}', t)
    print('  badge:', m.group(0) if m else '(none)')
    print()

# the legacy catalogue: was there an "Outdoor Protection" group?
for f in sorted(glob.glob(os.path.join(ROOT, 'docs', '_audit', '**', 'products.html'), recursive=True))[:1]:
    t = vis(open(f, encoding='utf-8').read())
    print('=== legacy products.html — Outdoor Protection mentions')
    for m in list(re.finditer(r'.{110}Outdoor Protection.{110}', t))[:6]:
        print('  ...%s...' % m.group(0))
        print()

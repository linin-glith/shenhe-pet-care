import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = open(os.path.join(ROOT, 'out', 'products', 'pet-nutrition.html'), encoding='utf-8').read()
body = re.sub(r'<head\b.*?</head>', ' ', raw, flags=re.S | re.I)
body = re.sub(r'<(script|style)\b.*?</\1>', ' ', body, flags=re.S | re.I)
body = re.sub(r'<[^>]+>', '\n', body)
for a, b in [('&nbsp;', ' '), ('&amp;', '&'), ('&middot;', ' '), ('&ndash;', '-'), ('&mdash;', '-'),
             ('&#x27;', "'"), ('&quot;', '"')]:
    body = body.replace(a, b)
lines = [re.sub(r'\s+', ' ', l).strip() for l in body.split('\n')]
lines = [l for l in lines if l]
seen = set()
for l in lines:
    if l in seen:
        continue
    seen.add(l)
    if any(k in l for k in ['SKU', 'product', 'Product', 'quote', 'Quote', 'MOQ', 'line', 'Line']):
        print('  ', l[:220])

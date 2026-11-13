import re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

def parts(p):
    raw = open(p, encoding='utf-8').read()
    body = re.sub(r'<head\b.*?</head>', ' ', raw, flags=re.S | re.I)
    head = re.search(r'<head\b.*?</head>', raw, flags=re.S | re.I)
    def vis(h):
        h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
        h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
        h = re.sub(r'<[^>]+>', ' ', h)
        for a, b in [('&nbsp;', ' '), ('&amp;', '&'), ('&middot;', ' '), ('&ndash;', '-'),
                     ('&mdash;', '-'), ('&#x27;', "'"), ('&quot;', '"')]:
            h = h.replace(a, b)
        return re.sub(r'\s+', ' ', h)
    return vis(head.group(0) if head else ''), vis(body)

for page in ['products/pet-nutrition.html', 'products/deodorizing-disinfecting.html',
             'products/grooming-care.html']:
    head, body = parts(os.path.join(OUT, page))
    print('===', page)
    for m in re.finditer(r'.{90}\b\d+\s+SKUs?\b.{90}', body):
        print('   BODY ...%s...' % m.group(0))
    for m in re.finditer(r'.{60}\b\d+\s+SKUs?\b.{60}', head):
        print('   HEAD ...%s...' % m.group(0))
    print()

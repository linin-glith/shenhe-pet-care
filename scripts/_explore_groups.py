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

for label, path in [('CURRENT out/products.html', os.path.join(ROOT, 'out', 'products.html')),
                    ('LEGACY docs/_audit/raw/pages/products.html',
                     os.path.join(ROOT, 'docs', '_audit', 'raw', 'pages', 'products.html'))]:
    if not os.path.exists(path):
        print('missing', path)
        continue
    raw = open(path, encoding='utf-8').read()
    print('===', label)
    # the group card: the link whose text is the line name
    for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(?:(?!</a>).){0,200}?</a>', raw, re.S):
        href, inner = m.group(1), vis(m.group(0))
        for line in ['Deodorizing', 'Grooming & Care', 'Outdoor Protection', 'Pet Nutrition']:
            if line in inner and len(inner) < 400:
                print('   %-24s -> %s   [%s]' % (line, href, inner[:110]))
                break
    print()

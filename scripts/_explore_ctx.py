import re, sys, os
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def visible(p):
    h = open(p, encoding='utf-8').read()
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
    h = re.sub(r'<[^>]+>', ' ', h)
    for a, b in [('&nbsp;', ' '), ('&amp;', '&'), ('&middot;', ' '), ('&ndash;', '-'),
                 ('&mdash;', '-'), ('&#x27;', "'"), ('&quot;', '"')]:
        h = h.replace(a, b)
    return re.sub(r'\s+', ' ', h)

for f, pat in [('out/certifications.html', r'.{160}2014 employees.{100}'),
               ('out/capabilities.html', r'.{160}2014 production lines.{100}')]:
    t = visible(os.path.join(ROOT, f))
    m = re.search(pat, t)
    print('---', f)
    print(m.group(0) if m else 'NOT FOUND')
    print()

# what does each page say about the production window?
print('=== 30-45 days context ===')
for dirpath, _, files in os.walk(os.path.join(ROOT, 'out')):
    for fn in files:
        if not fn.endswith('.html'):
            continue
        p = os.path.join(dirpath, fn)
        rel = os.path.relpath(p, os.path.join(ROOT, 'out')).replace('\\', '/')
        t = visible(p)
        for m in re.finditer(r'.{110}30[-–]45 days.{110}', t):
            print('[%s] ...%s...' % (rel, m.group(0)))
            print()

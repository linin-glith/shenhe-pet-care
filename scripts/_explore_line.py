import re, os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

def visible(p):
    h = open(p, encoding='utf-8').read()
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
    h = re.sub(r'<[^>]+>', ' ', h)
    for a, b in [('&nbsp;', ' '), ('&amp;', '&'), ('&middot;', ' '), ('&ndash;', '-'),
                 ('&mdash;', '-'), ('&#x27;', "'"), ('&quot;', '"'), ('&lt;', '<'), ('&gt;', '>')]:
        h = h.replace(a, b)
    return re.sub(r'\s+', ' ', h)

for slug in ['outdoor-protection', 'deodorizing-disinfecting', 'grooming-care', 'pet-nutrition',
             'outdoor-insect-repellent-spray']:
    p = os.path.join(OUT, 'products', slug + '.html')
    raw = open(p, encoding='utf-8').read()
    t = visible(p)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', raw, re.S)
    h1t = visible_str = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else '(no h1)'
    title = re.search(r'<title>(.*?)</title>', raw, re.S)
    print('--- /products/%s.html' % slug)
    print('  title: %s' % (title.group(1).strip() if title else '(none)'))
    print('  h1   : %s' % h1t)
    print('  body : %s' % t[:260])
    print()

# which pages link to an Outdoor Protection line page?
print('=== links containing outdoor-protection ===')
import glob
for f in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    raw = open(f, encoding='utf-8').read()
    rel = os.path.relpath(f, OUT).replace('\\', '/')
    for m in re.finditer(r'href="([^"]*outdoor-protection[^"]*)"', raw):
        print('  %-42s -> %s' % (rel, m.group(1)))

print()
print('=== sitemap entries with products/ ===')
sm = open(os.path.join(OUT, 'sitemap.xml'), encoding='utf-8').read()
for m in re.finditer(r'<loc>([^<]*)</loc>', sm):
    if '/products/' in m.group(1):
        print('  ', m.group(1))

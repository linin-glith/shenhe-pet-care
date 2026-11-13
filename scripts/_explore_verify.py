import re, os, sys, glob, json, collections
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

print('=== 1. the footer Products column (index.html) ===')
raw = open(os.path.join(OUT, 'index.html'), encoding='utf-8').read()
foot = re.search(r'<footer\b.*?</footer>', raw, re.S).group(0)
for listm in re.finditer(r'<ul\b[\s\S]*?</ul>', foot):
    labels = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', a.group(1))).strip()
              for a in re.finditer(r'<a\b[^>]*>([\s\S]*?)</a>', listm.group(0))]
    labels = [l for l in labels if l]
    if labels:
        print('   column: %s' % ' | '.join(labels[:8]))

print()
print('=== 2. the line pages: "What is in the ... line" ===')
for slug in ['deodorizing-disinfecting', 'grooming-care', 'pet-nutrition']:
    p = os.path.join(OUT, 'products', slug + '.html')
    t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', open(p, encoding='utf-8').read()))
    m = re.search(r'What is in the .{0,60}? line', t)
    print('   %-26s %s' % (slug, m.group(0) if m else '(not found)'))

print()
print('=== 3. inLanguage in the built pages ===')
hits = collections.Counter()
for f in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'"inLanguage"\s*:\s*(\[[^\]]*\]|"[^"]*")', s):
        hits[m.group(1)] += 1
for v, n in hits.items():
    print('   %-24s %d page(s)' % (v, n))

print()
print('=== 4. the pet-nutrition badge + SKU wording ===')
t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', open(os.path.join(OUT, 'products', 'pet-nutrition.html'), encoding='utf-8').read()))
for pat in [r'\d+ (?:SKUs|products)', r'Looking for a specific \w+ in this line', r'Tell us the \w+, target market']:
    for m in list(re.finditer(pat, t))[:3]:
        print('   %r' % m.group(0))
print('   "2 SKUs" still present:', '2 SKUs' in t)

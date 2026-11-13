import re, os, sys, glob, collections
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

pages = {}
for f in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    rel = os.path.relpath(f, OUT).replace('\\', '/')
    pages[rel] = visible(f)

probes = {
    'line label: Grooming & Care': r'Grooming & Care',
    'line label: Cleansing & Grooming': r'Cleansing & Grooming',
    'line label: Deodorizing & Disinfecting': r'Deodorizing & Disinfecting',
    'line label: Deodorizing & Disinfection (no ing)': r'Deodorizing & Disinfection(?!g)',
    'raw snake_case id in visible text': r'\b(?:Disinfection_odor_control|Cleansing_grooming|Outdoor_protection|Pet_nutrition|deodorizing_disinfection|grooming_care|outdoor_protection|pet_nutrition)\b',
    '"the X line" phrasing': r'What is in the [A-Za-z_ ]+ line',
}
for label, pat in probes.items():
    print('=== %s ===' % label)
    hits = collections.defaultdict(list)
    for rel, t in pages.items():
        for m in re.finditer(pat, t):
            hits[m.group(0).strip()].append(rel)
    if not hits:
        print('  (none)')
    for val, rels in sorted(hits.items(), key=lambda kv: -len(kv[1])):
        print('  %-42s %3d page(s): %s' % (val, len(rels), ', '.join(sorted(set(rels))[:8])))
    print()

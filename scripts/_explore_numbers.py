"""Exploratory sweep: every number on the built pages, grouped by what it claims."""
import json, re, os, io, sys, collections

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

TAG = re.compile(r'<[^>]+>')
SCRIPT = re.compile(r'<(script|style)\b.*?</\1>', re.S | re.I)

def visible(html):
    html = SCRIPT.sub(' ', html)
    html = re.sub(r'<!--.*?-->', ' ', html, flags=re.S)
    t = TAG.sub(' ', html)
    t = (t.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&middot;', ' ')
          .replace('&ndash;', '-').replace('&mdash;', '-').replace('&#x27;', "'")
          .replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>'))
    return re.sub(r'\s+', ' ', t)

pages = {}
for dirpath, _, files in os.walk(OUT):
    for f in files:
        if f.endswith('.html'):
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, OUT).replace('\\', '/')
            pages[rel] = visible(open(p, encoding='utf-8').read())

print('pages:', len(pages))

def fact(pattern, label):
    print('\n=== %s ===' % label)
    agg = collections.defaultdict(set)
    for rel, txt in pages.items():
        for m in re.finditer(pattern, txt, re.I):
            agg[m.group(0)].add(rel)
    for val, rels in sorted(agg.items(), key=lambda kv: -len(kv[1])):
        sample = sorted(rels)[:6]
        print('  %-34s %2d page(s)  %s' % (val, len(rels), ', '.join(sample)))
        if len(rels) > 6:
            print('       ... +%d more' % (len(rels) - 6))

fact(r'\b\d{1,3}(?:,\d{3})+\s*(?:m²|m2|square meters|square metres)\b', 'park / area')
fact(r'\b\d{1,3}(?:,\d{3})*\s*(?:bottles|cartons|packs)\s*(?:/|per\s+)?(?:month|day|week|year)\b', 'capacity')
fact(r'\b\d{2,4}\+?\s*(?:employees|staff|people|workers)\b', 'employees')
fact(r'\b\d+\s*(?:production lines|manufacturing lines|workshop lines)\b', 'production lines')
fact(r'\b\d+\s*(?:export markets|markets|countries|destinations)\b', 'markets')
fact(r'\b\d+\s*(?:major )?(?:export )?regions\b', 'regions')
fact(r'\b\d{1,3}\s*[-–]\s*\d{1,3}\s*(?:days?|working days?)\b', 'delivery windows')
fact(r'\b(?:exporting|trading|operating|manufacturing) since\s*(\d{4})\b', 'founded year')
fact(r'\b\d+\s*years?\s+(?:of\s+)?(?:exporting|manufacturing|trading|in business)\b', 'years in business')

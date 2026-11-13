import re, os, sys, glob, json
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print('=== G: inLanguage claims in the built pages ===')
hits = {}
for f in glob.glob(os.path.join(ROOT, 'out', '**', '*.html'), recursive=True):
    raw = open(f, encoding='utf-8').read()
    rel = os.path.relpath(f, os.path.join(ROOT, 'out')).replace('\\', '/')
    for m in re.finditer(r'"inLanguage"\s*:\s*(\[[^\]]*\]|"[^"]*")', raw):
        hits.setdefault(m.group(1), set()).add(rel)
for v, pages in hits.items():
    print('   %-28s %d page(s)  e.g. %s' % (v, len(pages), sorted(pages)[:4]))
print()

print('=== H: the capabilities timeline vs its body ===')
src = open(os.path.join(ROOT, 'content', 'capabilities.json'), encoding='utf-8').read()
for m in re.finditer(r'[^"]{0,150}\b(?:1[05]|2[05]|3[05]|4[05])\s*[-–]\s*\d{1,2}\s*(?:days|day)[^"]{0,120}', src):
    print('   ...%s...' % re.sub(r'\s+', ' ', m.group(0)))
print()

print('=== is content/capabilities.json even rendered? ===')
raw = open(os.path.join(ROOT, 'out', 'capabilities.html'), encoding='utf-8').read()
for pat in [r'15\s*[-–]\s*25', r'25\s*[-–]\s*40', r'stability']:
    found = re.findall(r'.{60}' + pat + r'.{60}', re.sub(r'<[^>]+>', ' ', raw))
    print('   %-14s %d hit(s)' % (pat, len(found)))
    for x in found[:2]:
        print('       ...%s...' % re.sub(r'\s+', ' ', x))

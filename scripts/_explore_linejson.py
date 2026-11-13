import json, os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

d = json.load(open(os.path.join(ROOT, 'content', 'products__grooming-care.json'), encoding='utf-8'))
print('top-level keys:', list(d.keys()))
print('blocks:', len(d.get('blocks', [])))
for i, b in enumerate(d.get('blocks', [])):
    c = b.get('content', {}) if isinstance(b.get('content'), dict) else {}
    html = c.get('html', '')
    print('\n--- block %d: type=%s  title=%r  html=%d chars' % (i, b.get('type'), c.get('title'), len(html)))
    # what does the html contain structurally?
    for m in re.finditer(r'<(section|h1|h2|h3|article|a)\b([^>]*)>(.{0,90})', html):
        attrs = m.group(2)
        href = re.search(r'href="([^"]*)"', attrs)
        txt = re.sub(r'<[^>]+>', ' ', m.group(3))
        txt = re.sub(r'\s+', ' ', txt).strip()
        print('      <%s%s> %s' % (m.group(1), (' href=%s' % href.group(1)) if href else '', txt[:80]))

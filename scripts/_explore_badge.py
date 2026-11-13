import json, os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, 'content', 'products__pet-nutrition.json')
d = json.load(open(p, encoding='utf-8'))
for b in d.get('blocks', []):
    c = b.get('content', {}) if isinstance(b.get('content'), dict) else {}
    html = c.get('html', '')
    m = re.search(r'<div class="pp-trust-row".*?</div>\s*</div>', html, re.S)
    if m:
        print(m.group(0))
        break
print()
print('--- the pet-nutrition lead / trust text ---')
print(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html))[:700])

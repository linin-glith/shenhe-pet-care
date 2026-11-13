import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

raw = open(os.path.join(ROOT, 'out', 'index.html'), encoding='utf-8').read()
foot = re.search(r'<footer\b.*?</footer>', raw, re.S)
f = foot.group(0)
# each link with its text
print('=== footer links ===')
for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', f, re.S):
    href = m.group(1)
    txt = re.sub(r'<[^>]+>', '', m.group(2)).strip()
    txt = re.sub(r'\s+', ' ', txt)
    if '/products/' in href or 'products.html' in href:
        print('   %-46s %s' % (href, txt[:70]))
print()
print('=== footer column headings ===')
for m in re.finditer(r'<h2[^>]*>(.*?)</h2>', f, re.S):
    print('   ', re.sub(r'<[^>]+>', '', m.group(1)).strip())

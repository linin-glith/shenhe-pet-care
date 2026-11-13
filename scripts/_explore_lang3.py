import re, glob, os, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
for f in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'"@type"\s*:\s*"WebSite"[\s\S]{0,400}?"inLanguage"\s*:\s*\[[^\]]*\]', s):
        arr = re.search(r'"inLanguage"\s*:\s*\[([^\]]*)\]', m.group(0)).group(1)
        if ',' in arr:
            print('PAGE:', os.path.relpath(f, OUT).replace('\\', '/'))
            print('   ', re.sub(r'\s+', ' ', m.group(0))[:400])
print()
print('=== where do content/index.json and _livejsonld.json feed in? ===')
import subprocess
for f in ['content/index.json', 'content/_livejsonld.json']:
    s = open(os.path.join(ROOT, f), encoding='utf-8').read()
    i = s.find('"es"')
    print('---', f)
    print(re.sub(r'\s+', ' ', s[max(0, i - 400):i + 120]))
    print()

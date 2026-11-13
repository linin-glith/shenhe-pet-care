import re, glob, os, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in glob.glob(os.path.join(ROOT, 'out', '**', '*.html'), recursive=True):
    s = open(f, encoding='utf-8').read()
    if '"en","es","de"' in s.replace(' ', ''):
        i = s.find('"inLanguage"')
        print('FILE:', os.path.relpath(f, os.path.join(ROOT, 'out')).replace('\\', '/'))
        print(repr(s[max(0, i - 420):i + 220]))
        print()
# and in the source content files
for f in ['content/index.json', 'content/_livejsonld.json']:
    p = os.path.join(ROOT, f)
    if os.path.exists(p):
        s = open(p, encoding='utf-8').read()
        if '"es"' in s:
            print('SOURCE still claims es/de:', f)

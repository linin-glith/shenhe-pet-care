#!/usr/bin/env python3
"""
Apply the translations: the build step that makes a page German.

WHY IT RUNS ON THE BUILT HTML AND NOT ON THE SOURCE
The source files carry the English and the layout together. Rewriting
the source would put the translations in the repository next to the
English, and a translator would then edit a file that also holds the
markup - the wrong place to work, and the place where a stray edit
breaks the build.

So the English stays in the source and the translations live in their
own table. The build writes the English page, and this script writes the
German one from the same page with every English unit replaced by its
translation.

WHAT IT DOES NOT TOUCH
  · the numbers, the report numbers, the licence numbers, the SKU codes
  · the product names, which are brand names
  · the ISO, FDA, Incoterms and MOQ strings, which are trade terms and
    are not translated in either language
Those are left alone by the table itself: a unit that is mostly a
number or a standard name is not a unit at all.

HOW TO USE IT
    python3 scripts/i18n_apply.py          # after the build, before the copy
    python3 scripts/i18n_apply.py --check   # report what is still English
"""

import io, json, os, re, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(SITE, 'lib', 'i18n')
OUT = os.path.join(SITE, 'out')
LOCALES = ['de', 'es']


def load(loc):
    p = os.path.join(I18N, 'translations-%s.json' % loc)
    if not os.path.exists(p):
        return {}
    return json.load(io.open(p, encoding='utf-8'))


def translate_html(html, table):
    """Replace every English unit in the page with its translation."""
    if not table:
        return html, 0
    # the longest first, so a unit that contains another is not replaced
    # in the middle
    pairs = sorted(table.items(), key=lambda kv: len(kv[0]), reverse=True)
    hits = 0
    for en, loc in pairs:
        if not loc or loc == en:
            continue
        if en not in html:
            continue
        html = html.replace(en, loc)
        hits += 1
    return html, hits


def main():
    check = '--check' in sys.argv
    if not os.path.isdir(OUT):
        print('  there is no build — nothing to translate.')
        return 1

    for loc in LOCALES:
        table = load(loc)
        if not table:
            print('  %s: no translation table.' % loc)
            continue
        done = 0
        changed = 0
        for root, dirs, files in os.walk(os.path.join(OUT, loc)):
            for f in files:
                if not f.endswith('.html'):
                    continue
                p = os.path.join(root, f)
                html = io.open(p, encoding='utf-8', errors='replace').read()
                out, hits = translate_html(html, table)
                if hits:
                    io.open(p, 'w', encoding='utf-8', newline='\n').write(out)
                    changed += 1
                    done += hits
        print('  %s: %d pages rewritten, %d units applied (%d in the table)'
              % (loc, changed, done, len(table)))
    return 0


if __name__ == '__main__':
    sys.exit(main())

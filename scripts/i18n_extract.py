#!/usr/bin/env python3
"""
The translation pipeline: extract, translate, apply.

WHY A PIPELINE AND NOT A TRANSLATOR WIDGET
A widget in the browser translates what the visitor sees. The crawler
reads the HTML, not the page after the widget has run, so the search
engine sees the English underneath. The page then says "German" in its
hreflang and in its metadata and serves English, which is a false
signal - and it is worse than having no German page at all, because the
English page's own ranking is diluted by a hundred pages that repeat
it.

So the translation happens before the page is written. The output is
static HTML that a crawler reads exactly as a visitor does.

THE THREE STEPS
  1. extract  the prose out of the source files into a translation table
  2. translate  the table is filled in, by a person or by a translation
                service, and it is committed to the repository
  3. apply   the build replaces each unit with its translation

WHAT THE TABLE IS
One JSON file per language, keyed by the unit's text. The key is the
English, so a changed English string is a missing translation and the
build says so - the same rule the dictionaries follow.

HOW TO USE IT
    python3 scripts/i18n_extract.py            # write the empty table
    python3 scripts/i18n_extract.py --check     # report what is missing
"""

import io, json, os, re, sys, unicodedata

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(SITE, 'lib', 'i18n')
LOCALES = ['de', 'es']

# the source files that carry the prose the buyer reads
#
# The pages live under app/(site)/<route>/page.tsx. They used to be mirrored
# in app/(site)/__shared/ as parallel copies; those copies were removed as
# dead code, so the paths below point at the real pages. The extracted prose
# is the same: 13 of the 14 pairs extract an identical unit set, and
# app/(site)/standards/page.tsx extracts two units MORE than the copy did
# (the copy was stale).
FILES = [
    'app/(site)/page.tsx',
    'app/(site)/factory/page.tsx',
    'app/(site)/contact/page.tsx',
    'app/(site)/products/page.tsx',
    'app/(site)/capabilities/page.tsx',
    'app/(site)/certifications/page.tsx',
    'app/(site)/global-compliance/page.tsx',
    'app/(site)/trade-compliance/page.tsx',
    'app/(site)/standards/page.tsx',
    'app/(site)/sourcing-guides/page.tsx',
    'app/(site)/blog/page.tsx',
    'app/(site)/msds/page.tsx',
    'app/(site)/oem-odm/page.tsx',
    'app/(site)/about/page.tsx',
    'app/(site)/why-us/page.tsx',
    'app/(site)/standards/page.tsx',
    'content/v2/home.ts',
    'content/v2/capabilities.ts',
    'content/v2/product-copy.ts',
]

# a string is code, not prose
#
# The CSS is the trap. A Tailwind class list is quoted like a sentence,
# has spaces in it, and looks like prose to anything that only checks
# the length. "pointer-events-none absolute inset-y-0 left-0 w-full" is
# not a sentence, and translating it would break the page.
IDENT = re.compile(
    r'[{}<>]|=>|className|import |export |const |function |return |'
    r'@apply|px-|text-|bg-|grid-|flex-|rounded|hover:|focus:|\$\{|`'
)
# the CSS class names: a hyphenated token that is not a word
CSS_TOKEN = re.compile(
    r'\b(?:[a-z]+-){1,6}[a-z]+\b|'
    r'\b(?:sm|md|lg|xl|2xl):[a-z-]+|'
    r'\b(?:w|h|min-w|max-w|min-h|max-h|gap|gap-x|gap-y|p[trblxy]?|m[trblxy]?|'
    r'px|py|pt|pb|pl|pr|mt|mb|ml|mr|space-[xy]|grid-cols-[\d]+|'
    r'rounded(?:-[a-z]+)?|border(?:-[a-z]+)?|shadow(?:-[a-z]+)?|'
    r'text-(?:\w+)?|bg-(?:\w+)?|font-(?:\w+)?|leading-(?:\w+)?|'
    r'col-span-[\d]+|row-span-[\d]+|aspect-[\w-]+|'
    r'pointer-events-none|overflow-hidden|inset-y-0|inset-x-0|'
    r'sr-only|whitespace-nowrap|break-words|truncate)\b'
)
SKIP = re.compile(r'^(https?://|[a-z-]+/|/|\w+@|[A-Z_]{3,}$|#[0-9a-f]{3,8}$)')
# the things that must never be translated: the facts
KEEP = re.compile(
    r'(ISO \d+|FDA|GDDCM|NACC|CPNP|APVMA|Incoterms?\b|FOB|CIF|EXW|DDP|'
    r'INQ-|MOQ|HS\b|GMP|GPP|REACH|CPSIA|SCoS|T/T|L/C|'
    r'\b\d[\d,\.]*\s*(?:m²|m2|ml|mL|kg|g|%|°C|days?|bottles?|sets?|packs?)\b)',
    re.I,
)


def prose_units(path):
    """The quoted prose in a source file."""
    text = io.open(path, encoding='utf-8', errors='replace').read()
    found = []
    for m in re.finditer(r"(?<![A-Za-z0-9_])'((?:[^'\\\n]|\\.){30,900})'", text):
        s = m.group(1)
        if IDENT.search(s) or SKIP.match(s.strip()):
            continue
        if CSS_TOKEN.search(s):
            continue
        if s.count(' ') < 5:
            continue
        # a sentence has capital letters and ordinary words; a class list
        # does not
        if not re.search(r'[a-z]{3,}[ ,.]', s):
            continue
        found.append(s)
    for m in re.finditer(r'"((?:[^"\\\n]|\\.){30,900})"', text):
        s = m.group(1)
        if IDENT.search(s) or SKIP.match(s.strip()):
            continue
        if s.count(' ') < 5:
            continue
        found.append(s)
    return found


def main():
    check = '--check' in sys.argv
    units = {}

    for rel in FILES:
        path = os.path.join(SITE, rel.replace('/', os.sep))
        if not os.path.exists(path):
            continue
        for s in prose_units(path):
            units.setdefault(s, []).append(rel)

    # the articles: the body of each one, split into its paragraphs
    art_dir = os.path.join(SITE, 'content', 'articles')
    articles = {}
    if os.path.isdir(art_dir):
        for f in sorted(os.listdir(art_dir)):
            if not f.endswith('.json'):
                continue
            d = json.load(io.open(os.path.join(art_dir, f), encoding='utf-8'))
            blocks = []
            for b in d.get('body', []):
                for k in ('html', 'text', 'title'):
                    if b.get(k):
                        blocks.append(b[k])
                        break
            articles[f] = blocks
            for s in blocks:
                units.setdefault(s, []).append('content/articles/' + f)

    # a unit that is mostly numbers and standard names is a fact
    def is_fact(s):
        letters = re.sub(r'[^A-Za-z]', '', s)
        if len(letters) < len(s.replace(' ', '')) * 0.55:
            return True
        if len(letters) < 12:
            return True
        return False

    prose = {k: v for k, v in units.items() if not is_fact(k)}

    if check:
        for loc in LOCALES:
            p = os.path.join(I18N, 'translations-%s.json' % loc)
            table = {}
            if os.path.exists(p):
                table = json.load(io.open(p, encoding='utf-8'))
            missing = [k for k in prose if k not in table]
            stale = [k for k in table if k not in prose]
            print('  %s: %d units, %d translated, %d missing, %d stale'
                  % (loc, len(prose), len(prose) - len(missing), len(missing), len(stale)))
            for k in missing[:3]:
                print('     missing: %s' % k[:90])
        return 0

    # the empty tables
    for loc in LOCALES:
        p = os.path.join(I18N, 'translations-%s.json' % loc)
        table = {}
        if os.path.exists(p):
            table = json.load(io.open(p, encoding='utf-8'))
        # the units that are already translated stay
        kept = {k: v for k, v in table.items() if k in prose}
        # the new ones are written with the English text as the value, so
        # the table can be read and edited as a plain list of sentences
        for k in prose:
            kept.setdefault(k, k)
        io.open(p, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(kept, ensure_ascii=False, indent=2) + '\n')
        print('  %s: %d units -> lib/i18n/translations-%s.json' % (loc, len(kept), loc))

    print('')
    print('  the units: %d prose strings and %d article blocks'
          % (len(prose), sum(len(v) for v in articles.values())))
    words = (sum(len(s.split()) for s in prose)
             + sum(len(re.sub(r'<[^>]+>', ' ', s).split()) for v in articles.values() for s in v))
    print('  the words: %d per language' % words)
    return 0


if __name__ == '__main__':
    sys.exit(main())

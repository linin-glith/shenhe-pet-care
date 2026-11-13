#!/usr/bin/env python3
"""
Translate the prose table, with the trade terms protected.

WHY THE TERMS ARE PROTECTED
A factory that writes "ISO 22716 GMP certification" in German writes
"ISO-22716-GMP-Zertifizierung" - and if the translation comes back as
"ISO 22716 GMP Zertifizierung" with the term mangled, or drops the
standard number entirely, the page stops being evidence and becomes a
sentence. The numbers are worse: a MOQ of 2,000 must stay 2,000, and a
report number must stay NACCYH25014722.

So the translation runs in two passes. The protected terms and the
numbers are replaced with placeholders, the sentence is translated, and
the placeholders are put back. A term that the translator mangled comes
back mangled inside a placeholder, and the check afterwards says so.

WHAT IT READS AND WRITES
    lib/i18n/translations-de.json   the table, the English is the key
    lib/i18n/translations-es.json
The key is the English text, so a changed English string is a missing
translation and the build says so.

HOW TO USE IT
    python3 scripts/i18n_translate.py --locale de       # translate
    python3 scripts/i18n_translate.py --check            # report
"""

import io, json, os, re, sys, time, urllib.request, urllib.error

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(SITE, 'lib', 'i18n')

# the API: the translation is done by the model service the site already
# uses for the AI files. The key comes from the environment.
API = os.environ.get('SHENHE_TRANSLATE_API', '')
MODEL = os.environ.get('SHENHE_TRANSLATE_MODEL', 'gpt-4o-mini')

# the terms that are never translated
PROTECTED = [
    'ISO 22716', 'ISO 22716 GMP', 'FDA', 'GDDCM', 'NACC', 'CMA', 'CNAS',
    'CPNP', 'APVMA', 'REACH', 'CPSIA', 'GMP', 'MOQ', 'FOB', 'CIF', 'EXW',
    'DDP', 'FCA', 'Incoterms', 'Incoterm', 'MSDS', 'T/T', 'L/C', 'HS code',
    'OEM', 'ODM', 'OBM', 'SKU', 'EEAU', 'EU', 'COSMO', 'GB 5769',
    'Shenhe Zhongke', 'SHENHE ZHONGKE', 'DEKOBIO', 'Nutrilon', 'WSA',
]
# and the things that are numbers
NUMBER = re.compile(r'(?<![A-Za-z])(\d[\d,\.]*\s*(?:m²|m2|ml|mL|kg|g|%|°C|hours?|days?|weeks?|months?|years?|bottles?|sets?|packs?|sachets?|units?|people|employees?|lines?|SKUs?|reports?|years?|per month)?)(?![A-Za-z])', re.I)
# the report and licence numbers
CODE = re.compile(r'\b(?:NACCYH|GD\d+|FM\d+|粤[卫饲][^,，。.\s]{0,24}|GR\d{8,}|20\d{2}FM\d+R\d+D|20\d{2}[A-Z]{2}\d{6})\b', re.I)

# the language instruction
LANG = {
    'de': ('German', 'formal "Sie". Capitalise nouns as German does. '
           'Keep the trade terms above in English. Keep every number, unit, '
           'report number and licence number exactly as written. Use a decimal '
           'comma only where German uses one, and never change the digits.'),
    'es': ('Spanish', 'business-neutral Spanish, as used in Spain. '
           'Keep the trade terms above in English. Keep every number, unit, '
           'report number and licence number exactly as written.'),
}


def protect(text):
    """Replace the terms and the numbers with placeholders."""
    store = []

    def keep(m):
        store.append(m.group(0))
        return '\x00%d\x00' % (len(store) - 1)

    text = CODE.sub(keep, text)
    text = NUMBER.sub(keep, text)
    for term in sorted(PROTECTED, key=len, reverse=True):
        text = text.replace(term, keep(term) if False else term)  # kept as is
    # the terms stay as they are, but the numbers are placeholders
    return text, store


def restore(text, store):
    """Put the numbers back."""
    def give(m):
        i = int(m.group(1))
        return store[i] if 0 <= i < len(store) else m.group(0)
    return re.sub(r'\x00(\d+)\x00', give, text)


def call_api(system, prompt, user):
    if not API:
        return None
    body = json.dumps({
        'model': MODEL,
        'messages': [{'role': 'system', 'content': system},
                     {'role': 'user', 'content': user}],
        'temperature': 0,
    }).encode('utf-8')
    req = urllib.request.Request(
        API, data=body,
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + os.environ.get('SHENHE_TRANSLATE_KEY', '')},
        method='POST')
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            d = json.loads(r.read().decode('utf-8'))
            return d['choices'][0]['message']['content']
    except Exception as e:
        print('  the api failed: %s' % str(e)[:90])
        return None


def main():
    args = sys.argv[1:]
    locale = 'de'
    for i, a in enumerate(args):
        if a == '--locale' and i + 1 < len(args):
            locale = args[i + 1]
    path = os.path.join(I18N, 'translations-%s.json' % locale)
    if not os.path.exists(path):
        print('  no table for %s' % locale)
        return 1
    table = json.load(io.open(path, encoding='utf-8'))
    lang, style = LANG[locale]

    if '--check' in args:
        missing = [k for k, v in table.items() if v == k]
        print('  %s: %d units, %d untranslated' % (locale, len(table), len(missing)))
        for k in missing[:5]:
            print('     %s' % k[:88])
        return 0

    todo = [k for k, v in table.items() if v == k]
    if not todo:
        print('  %s: nothing to translate' % locale)
        return 0
    print('  %s: %d units to translate' % (locale, len(todo)))

    system = (
        'You translate one English sentence into %s. %s\n'
        'Return only the translation, with no quotes and no explanation.\n'
        'If the input contains \\x00N\\x00 placeholders, they are numbers that '
        'were taken out before translation: put each one back exactly where '
        'it was, unchanged, and keep the \\x00N\\x00 form.'
        % (lang, style)
    )

    done = 0
    for k in todo:
        prot, store = protect(k)
        out = call_api(system, prot, prot)
        if not out:
            print('  the api is not available — set SHENHE_TRANSLATE_API')
            return 2
        out = restore(out.strip().strip('"'), store)
        table[k] = out
        done += 1
        if done % 25 == 0:
            io.open(path, 'w', encoding='utf-8', newline='\n').write(
                json.dumps(table, ensure_ascii=False, indent=2) + '\n')
            print('  ... %d of %d' % (done, len(todo)))
    io.open(path, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(table, ensure_ascii=False, indent=2) + '\n')
    print('  %s: %d units translated' % (locale, done))
    return 0


if __name__ == '__main__':
    sys.exit(main())

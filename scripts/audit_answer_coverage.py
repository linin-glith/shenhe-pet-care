#!/usr/bin/env python3
"""Does each product page answer the intents the keyword board says it serves?

THE QUESTION THIS ANSWERS
    `scripts/keyword_board.py` declares every SKU page a fruit for seven
    intents: MOQ, lead time, price, specification, private label,
    certification and samples. That declaration is how a cell on the board
    gets counted as planted. Until this script existed, nothing checked
    whether the page actually answered them - the board said "planted",
    the page said nothing about price or samples, and both were "true"
    because they were measured differently.

WHAT IT READS
    content/v2/product-copy.ts - the same file the pages render from, so
    this cannot drift from what ships. It parses the family blocks and the
    SKU->family map, then matches each intent against the text of the
    answers. Text matching is blunt on purpose: this is an audit, not a
    gate, and a keyword in an answer is evidence that the question is
    addressed, not proof that it is answered well.

WHAT IT DOES NOT DO
    It does not decide whether an answer is good, whether it is honest,
    or whether the numbers in it are right. Those need a human.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COPY = os.path.join(ROOT, 'content', 'v2', 'product-copy.ts')
products_json = os.path.join(ROOT, 'lib', 'products.json')

# The seven intents a SKU page is declared for, and what an answer about
# that intent looks like.
#
# THE PATTERNS ARE NARROW ON PURPOSE, AND THE FIRST DRAFT WAS TOO WIDE.
# It matched "quoted separately" (a clause inside the MOQ answer) as
# evidence that price was answered, "after the sample is approved" as
# evidence that samples were answered, and "a private-label variation
# changes the MOQ" as evidence that private label was answered. Every one
# of those is a passing mention inside an answer about something else.
# An audit that counts mentions reports 90% coverage on pages a buyer
# would find silent, so each pattern now requires the intent's own
# vocabulary rather than a word that can appear in any answer.
INTENTS = [
    ('moq',            r'\bMOQ\b|minimum order'),
    ('lead_time',      r'lead time|production take|days after payment|production runs \{OEM_LEAD\}'),
    ('price',          r'\bprice\b|tiered pricing|\bRFQ\b'),
    ('specs',          r'What is in it|shelf life|formulation|ingredients|texture'),
    ('customization',  r'artwork|\bprivate[- ]label (?:production|covers)|\bprivate[- ]labell(ed|ing)'),
    ('certification',  r'certificat|\bCOA\b|\bSDS\b|laborator|report NACC'),
    ('sample',         r'physical sample|a sample before|sample cost|sample plus'),
]


def read(path):
    return io.open(path, encoding='utf-8', errors='replace').read()


def family_blocks(text):
    """Split the BY_FAMILY object into {name: text}."""
    start = text.index('const BY_FAMILY')
    body = text[start:]
    # A family block opens with two spaces, a name, a colon and a brace.
    heads = [(m.group(1), m.start())
             for m in re.finditer(r'\n  ([A-Za-z][A-Za-z0-9_]*):\s*\{', body)]
    out = {}
    for i, (name, pos) in enumerate(heads):
        end = heads[i + 1][1] if i + 1 < len(heads) else len(body)
        out[name] = body[pos:end]
    return out


def sku_map(text):
    """BY_SKU and CATEGORY_FAMILY, as plain dicts."""
    def pairs(block_name):
        start = text.index('const ' + block_name)
        seg = text[start:start + 4000]
        return dict(re.findall(r"\n  ([\w:]+):\s*'([\w_]+)'", seg))
    return pairs('BY_SKU'), pairs('CATEGORY_FAMILY')


def commercial_block(text):
    """The shared intent answers, if they exist."""
    for name in ('const SHARED_FAQ', 'const COMMERCIAL_FAQ'):
        try:
            start = text.index(name)
        except ValueError:
            continue
        end = text.index('];', start)
        return text[start:end]
    return ''


def main():
    include_commercial = '--before' not in sys.argv
    copy_text = read(COPY)
    families = family_blocks(copy_text)
    by_sku, by_category = sku_map(copy_text)
    extra = commercial_block(copy_text) if include_commercial else ''

    import json
    catalogue = json.load(io.open(products_json, encoding='utf-8'))
    records = catalogue if isinstance(catalogue, list) else catalogue.get('products', [])

    rows = []
    for rec in records:
        sku = rec.get('id') or rec.get('sku')
        if not sku:
            continue
        family = by_sku.get(sku) or by_category.get(rec.get('category', ''), 'litter')
        text = families.get(family, '') + '\n' + extra
        covered, missing = [], []
        for intent, pattern in INTENTS:
            if re.search(pattern, text, re.I):
                covered.append(intent)
            else:
                missing.append(intent)
        rows.append((sku, family, rec.get('line') or '-', covered, missing))

    total = len(rows)
    print('SOURCE: content/v2/product-copy.ts (%s)' %
          ('with COMMERCIAL_FAQ' if include_commercial else 'family answers only'))
    print('SKUs scanned: %d' % total)
    print()
    print('%-6s %-20s %-26s %s' % ('SKU', 'FAMILY', 'LINE', 'MISSING INTENTS'))
    print('-' * 92)
    gap_counts = {}
    for sku, family, line, covered, missing in rows:
        print('%-6s %-20s %-26s %s' % (sku, family, line[:26],
                                        ', '.join(missing) if missing else 'none'))
        for m in missing:
            gap_counts[m] = gap_counts.get(m, 0) + 1
    print('-' * 92)
    print()
    print('INTENT COVERAGE ACROSS %d SKU PAGES' % total)
    for intent, _ in INTENTS:
        have = total - gap_counts.get(intent, 0)
        pct = (100.0 * have / total) if total else 0
        print('  %-14s %2d/%2d  %5.1f%%' % (intent, have, total, pct))
    print()
    worst = sorted(gap_counts.items(), key=lambda kv: -kv[1])
    if worst:
        print('biggest gaps: ' + ', '.join('%s (%d pages)' % (k, v) for k, v in worst[:5]))
    else:
        print('every declared intent is addressed on every SKU page')
    any_missing = sum(1 for r in rows if r[4])
    print('pages with at least one gap: %d/%d' % (any_missing, total))


if __name__ == '__main__':
    main()

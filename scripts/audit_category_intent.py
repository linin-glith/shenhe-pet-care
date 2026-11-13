"""品类层意图覆盖审计：把"品类是核心主体"落到可测的数字上。

真相来源是 content/v2/category-copy.ts —— CategoryDepth 组件渲染它，
FAQPage schema 也由同一个数组生成。所以量它，量到的就是买家看到的。

判据沿用 audit_answer_coverage.py 收紧后的 7 个 SKU 意图：
品类页如果答不出 SKU 页答得出的问题，买家从品类落地就没有答案可读。

用法：
    python scripts/audit_category_intent.py
    python scripts/audit_category_intent.py --verbose   # 把每条问答打出来
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INTENTS = [
    ('moq',           r'\bMOQ\b|minimum order'),
    ('lead_time',     r'lead time|production take|days after payment'),
    ('price',         r'\bprice\b|tiered pricing|\bRFQ\b|quote'),
    ('specs',         r'What is in it|shelf life|formulation|ingredients|texture|format'),
    ('customization', r'artwork|\bprivate[- ]label (?:production|covers)|\bprivate[- ]labell(ed|ing)|\bprivate[- ]label'),
    ('certification', r'certificat|\bCOA\b|\bSDS\b|laborator|report NACC|regulatory'),
    ('sample',        r'physical sample|a sample before|sample cost|sample plus|samples'),
]

# 品类 → 枢纽页 slug（用于核对构建产物里的 schema 条数）
HUB = {
    'deodorizing_disinfection': 'deodorizing-disinfecting',
    'grooming_care': 'grooming-care',
    'outdoor_protection': 'outdoor-protection',
    'pet_nutrition': 'pet-nutrition',
}

# CATEGORY_COPY 的键 → 枢纽页
KEYS = {
    'disinfection_odor_control': 'deodorizing-disinfecting',
    'cleansing_grooming': 'grooming-care',
    'outdoor_protection': 'outdoor-protection',
    'pet_nutrition': 'pet-nutrition',
}


def read(path):
    return io.open(path, encoding='utf-8', errors='replace').read()


def category_blocks(text):
    """Split CATEGORY_COPY into {key: text}."""
    start = text.index('export const CATEGORY_COPY')
    end = text.index('export const GENERIC_CATEGORY')
    body = text[start:end]
    heads = [(m.group(1), m.start())
             for m in re.finditer(r'\n  ([A-Za-z][A-Za-z0-9_]*):\s*\{', body)]
    out = {}
    for i, (name, pos) in enumerate(heads):
        stop = heads[i + 1][1] if i + 1 < len(heads) else len(body)
        out[name] = body[pos:stop]
    return out


def qa_pairs(block):
    """Every q/a pair in the block, in source order.

    The commercial answers are written as concatenated string literals across
    several lines ('...' + '...'). A regex that takes only the literal right
    after `a:` captures the first fragment and drops the rest, which makes
    every long answer look like it answers nothing. So: find each `q:`, then
    take every literal between it and the next `q:` and join them.
    """
    lit = r"'((?:[^'\\]|\\.)*)'"
    qs = list(re.finditer(r"q:\s*" + lit, block))
    pairs = []
    for i, m in enumerate(qs):
        q = m.group(1)
        stop = qs[i + 1].start() if i + 1 < len(qs) else len(block)
        a = ''.join(x.group(1) for x in re.finditer(lit, block[m.end():stop]))
        pairs.append((q, a))
    return pairs


def main():
    import sys
    verbose = '--verbose' in sys.argv
    text = read(os.path.join(ROOT, 'content', 'v2', 'category-copy.ts'))
    blocks = category_blocks(text)
    generic = text[text.index('export const GENERIC_CATEGORY'):]

    # 商务层由 CategoryDepth 追加到每个品类页，判定必须把它算进来，
    # 否则"可见 6 条"会把页面实际展示的 12 条说少一半。
    shared = read(os.path.join(ROOT, 'content', 'v2', 'category-faq.ts'))
    cbody = shared[shared.index('export const COMMERCIAL_FAQ'):shared.index('export function categoryFaq')]
    commercial = qa_pairs(cbody)

    print('SOURCE: content/v2/category-copy.ts + content/v2/category-faq.ts')
    print()
    print('%-28s %-6s %-6s %s' % ('CATEGORY', 'Q&A', 'SCHEMA', 'MISSING INTENTS'))
    print('-' * 100)

    rows = []
    for key, block in blocks.items():
        pairs = qa_pairs(block)
        visible = pairs + commercial
        joined = ' '.join(q + ' ' + a for q, a in visible)
        covered, missing = [], []
        for intent, pattern in INTENTS:
            (covered if re.search(pattern, joined, re.I) else missing).append(intent)

        hub = KEYS.get(key)
        schema_n = '-'
        if hub:
            html = os.path.join(ROOT, 'out', 'products', '%s.html' % hub)
            if os.path.exists(html):
                schema_n = str(len(re.findall(r'"@type":"Question"', read(html))))

        print('%-28s %-6d %-6s %s' % (key, len(visible), schema_n, ', '.join(missing) or '(all covered)'))
        rows.append((key, visible, covered, missing, schema_n))

        if verbose:
            for q, a in visible:
                print('    Q: %s' % q)
                print('    A: %s' % a[:150])
            print()

    print()
    print('=== 覆盖率 ===')
    for key, visible, covered, missing, _ in rows:
        pct = 100.0 * len(covered) / len(INTENTS)
        print('%-28s %d/%d  %.0f%%' % (key, len(covered), len(INTENTS), pct))

    print()
    print('=== 跨品类共同的缺口 ===')
    common = set.intersection(*[set(r[3]) for r in rows]) if rows else set()
    print('  每个品类都缺：%s' % (', '.join(sorted(common)) or '(none)'))

    print()
    print('=== 可见问答 vs schema 声明 ===')
    for key, visible, _, _, schema_n in rows:
        if schema_n == '-':
            print('%-28s 可见 %d 条 / schema -' % (key, len(visible)))
            continue
        n = int(schema_n)
        flag = '' if n >= len(visible) else '  <-- schema 少于可见'
        print('%-28s 可见 %d 条 / schema %d 条%s' % (key, len(visible), n, flag))

    print()
    print('=== GENERIC 兜底（品类没写文案时它会顶上）===')
    gpairs = qa_pairs(generic)
    gvisible = gpairs + commercial
    gjoined = ' '.join(q + ' ' + a for q, a in gvisible)
    gmissing = [i for i, p in INTENTS if not re.search(p, gjoined, re.I)]
    print('  %d 条问答，缺：%s' % (len(gvisible), ', '.join(gmissing) or '(all covered)'))


if __name__ == '__main__':
    main()

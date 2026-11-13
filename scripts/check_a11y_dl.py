"""THE ACCESSIBILITY TREE, AS IT IS SERVED.

WHAT THIS IS FOR

A definition list may only hold term-and-value groups: <dt> with its
<dd>, and each group may be wrapped in a <div>. Anything else in the
list breaks it.

On 2026-11-03 the performance report said so about the site:

  <dl> elements must only directly contain properly-ordered <dt> and
  <dd> groups, <script>, <template> or <div> elements

and the audit it failed was "the accessibility tree is not correct" -
which is the audit that decides whether an assistant reading the page
can tell a term from its value, or a fact from a decoration.

The cause was one mark. The dock that follows a buyer down the page
carries a badge - "ISO 22716 GMP" - and the badge sat inside the
definition list as a bare div with a line of text in it. It was on 53
pages.

So the check reads the BUILT pages, because the built html is what
the browser and the auditor see. It is the same rule, applied to
what is actually served.

Exit code 0 when every definition list is well formed, 1 when one is
not.
"""
import io
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

TAG = re.compile(r'<(/?)(\w+)([^>]*?)(/?)>', re.S)
SKIP = ('br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col')


def direct_children(fragment):
    """The direct children of an HTML fragment, as (kind, name, start, end).

    "Direct" is the whole point: a description may hold a span, an SVG or
    a chip, and none of those is a defect. What may not sit in a group is
    anything that is not a term or a value.
    """
    kids = []
    d = 0
    j = 0
    while j < len(fragment):
        cm = TAG.search(fragment, j)
        if not cm:
            break
        closing, name, attrs, sc = cm.group(1), cm.group(2).lower(), cm.group(3), cm.group(4)
        if name in SKIP:
            j = cm.end()
            continue
        if closing:
            if d == 0:
                kids.append(('close', name, cm.start(), cm.end()))
            else:
                d -= 1
            j = cm.end()
            continue
        if sc:
            if d == 0:
                kids.append(('self', name, cm.start(), cm.end()))
            j = cm.end()
            continue
        if d == 0:
            kids.append(('open', name, cm.start(), cm.end()))
        d += 1
        j = cm.end()
    return kids


def find_dl_problems(text):
    """The definition lists in the text that are not well formed."""
    problems = []
    for m in re.finditer(r'<dl[^>]*>', text):
        # the matching close
        depth = 1
        i = m.end()
        end = -1
        while i < len(text) and depth > 0:
            c = text.find('<', i)
            if c == -1:
                break
            e = text.find('>', c)
            if e == -1:
                break
            tag = text[c:e + 1]
            if tag.startswith('</'):
                if tag[2:-1].strip().lower() == 'dl':
                    depth -= 1
                    if depth == 0:
                        end = c
            elif tag.startswith('<dl'):
                depth += 1
            i = e + 1
        if end == -1:
            continue
        body = text[m.end():end]

        # the direct children
        kids = direct_children(body)

        for k in kids:
            if k[0] == 'close':
                continue
            name = k[1]
            if k[0] == 'self':
                if name not in ('dt', 'dd', 'script', 'template'):
                    problems.append('a <%s> stands alone in a definition list' % name)
                continue
            if name in ('dt', 'dd', 'script', 'template'):
                continue
            if name == 'div':
                # the div must hold a term and its value
                dd = 1
                ii = k[3]
                seg_end = len(body)
                while ii < len(body):
                    c2 = body.find('</div>', ii)
                    if c2 == -1:
                        break
                    dd -= 1
                    if dd == 0:
                        seg_end = c2
                        break
                    ii = c2 + 6
                inner = body[k[3]:seg_end]
                if '<dt' not in inner and '<dd' not in inner:
                    problems.append('a <div> in a definition list holds no term and value')
                else:
                    # The order, and what else is in the group.
                    #
                    # A group is one or more terms followed by one or more
                    # values. A value before its term is a description with
                    # nothing to describe, and anything that is not a term
                    # or a value - a note, an icon - is not part of the
                    # group at all.
                    #
                    # Only the group's DIRECT children are looked at: the
                    # content inside a value may be anything.
                    seen_term = False
                    for gk in direct_children(inner):
                        if gk[0] == 'close':
                            continue
                        gname = gk[1]
                        if gname == 'dt':
                            seen_term = True
                            continue
                        if gname == 'dd':
                            if not seen_term:
                                problems.append(
                                    'a <dd> comes before any <dt> in a definition list group')
                            continue
                        if gname in ('script', 'template'):
                            continue
                        problems.append(
                            'a <%s> is inside a definition list group, which may only '
                            'hold terms and values' % gname)
                continue
            problems.append('a <%s> is directly in a definition list' % name)
    return problems


def main():
    if not os.path.isdir(OUT):
        sys.stderr.write('  the build output is not there\n')
        return 2

    pages = sorted(glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True))
    if not pages:
        sys.stderr.write('  the build output has no pages\n')
        return 2

    problems = []
    dls = 0
    for p in pages:
        rel = os.path.relpath(p, OUT).replace(os.sep, '/')
        t = io.open(p, encoding='utf-8', errors='replace').read()
        dls += len(re.findall(r'<dl[ >]', t))
        for x in find_dl_problems(t):
            problems.append('%s: %s' % (rel, x))

    if problems:
        seen = set()
        for x in problems:
            if x not in seen:
                seen.add(x)
                sys.stderr.write('    %s\n' % x)
        sys.stderr.write('  %d problem(s) in %d pages\n' % (len(problems), len(pages)))
        return 1

    print('  %d definition lists in %d pages - every one holds only term and value groups'
          % (dls, len(pages)))
    return 0


if __name__ == '__main__':
    sys.exit(main())

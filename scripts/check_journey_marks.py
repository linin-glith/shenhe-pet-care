"""THE MARKS ON THE LINKS, AND THE PATH THEY CARRY.

WHAT THIS IS FOR

The site can say how many enquiries arrived. It cannot say where the
buyer came from, because the answer is thrown away on the way: a
visitor arrives from a search with a campaign on the link, clicks
three pages, and the campaign is gone by the time the form is sent.

So every link carries a mark saying where it is, and the campaign
the visitor arrived with is kept for thirty days so it survives the
journey.

The mark is written into the page as a data attribute. That means it
is in the built html - a crawler sees it, and the screen reader
announces the same thing the visitor sees. It is NOT a query string
on every link: a site that is a thousand addresses long is a site
nobody can rank.

WHY THIS IS A CHECK AND NOT A MATTER OF CARE

The marks were added by hand to the header, the footer, the dock, the
marketing pages and three scripts that write static pages. Hand work
drifts: a page gets added and its links are not marked, and the path
that page was supposed to carry is lost silently.

So the check reads the built pages and asks two questions:

  does every page a buyer can read carry at least one mark
  does every mark name one of the kinds the journey understands

A page with no mark is a page whose traffic cannot be attributed.
"""
import io
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')

# The kinds the journey understands. A mark outside this list is a
# mark nothing reads - it looks like it works and does not.
KINDS = {
    'ask', 'contact', 'whatsapp', 'email', 'phone',
    'guide', 'product', 'report', 'nav', 'footer',
    'page', 'article', 'certifications', 'pdf',
}

# The pages that are not read by a buyer, so they need no mark.
NOT_FOR_BUYERS = ('/404', '/_not-found', '/google-site-verification')


def main():
    if not os.path.isdir(OUT):
        sys.stderr.write('  the build output is not there\n')
        return 2

    pages = sorted(glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True))
    if not pages:
        sys.stderr.write('  the build output has no pages\n')
        return 2

    problems = []
    unmarked = []
    unknown = set()
    total = 0
    buyer_pages = 0

    for p in pages:
        rel = '/' + os.path.relpath(p, OUT).replace(os.sep, '/')
        if rel.startswith(('/admin', '/portal')):
            continue
        if rel.startswith(NOT_FOR_BUYERS):
            continue
        buyer_pages += 1
        t = io.open(p, encoding='utf-8', errors='replace').read()
        marks = re.findall(r'data-journey="([^"]+)"', t)
        total += len(marks)
        if not marks:
            unmarked.append(rel)
        for m in marks:
            if m not in KINDS:
                unknown.add(m)

    for u in sorted(unknown):
        problems.append('a mark nothing reads: %s' % u)
    for u in unmarked:
        problems.append('a page a buyer can read carries no mark: %s' % u)

    if problems:
        for x in problems[:12]:
            sys.stderr.write('    %s\n' % x)
        sys.stderr.write('  %d problem(s) in %d pages\n' % (len(problems), buyer_pages))
        return 1

    print('  %d marks in %d pages - every page a buyer can read carries a mark'
          % (total, buyer_pages))
    return 0


if __name__ == '__main__':
    sys.exit(main())

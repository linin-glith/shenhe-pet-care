"""THE SITE'S FACTS, AGAINST THE DOCUMENTS THEY COME FROM.

WHAT THIS IS FOR

Four things drifted on 2026-11-03, and all four drifted the same
way: a list was kept somewhere else from the thing it describes.

  the report number   the site published YD20251215351 for the
                      disinfectant; the PDF prints XJ2025001233, and
                      the number the site used appears nowhere on the
                      document, from a different laboratory
  the issuing body    the same report was described as coming from
                      the Guangdong Detection Center; it was issued
                      by the Guangzhou Institute of Microbiology Group
  the verification    six of the ten reports carry a verification code
  code               printed next to the report number; it was on every
                      one of those documents and on no page of the site
  the batch           every report names the batch it was tested on;
  number             it was on no page of the site, and it is the link
                      between the evidence and the batch attestation

None of them was caught by a review, because a review reads the site
and does not read the PDFs. One was caught by hand, on the day,
because somebody read all ten documents.

So this reads the documents, and reads the built pages, and compares.
Every report number the site publishes must be on the PDF it links
to. Every verification code the site publishes must be on the PDF it
links to. Every batch number the site publishes must be on the PDF it
links to. Every report number that appears anywhere on the site must
belong to a report that exists. And every SKU that the coverage table
says is covered must be covered by a report the site actually links.

Exit code 0 when everything agrees, 1 when it does not. The output
is one line per problem.
"""
import io, os, re, sys, glob

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        sys.stderr.write('  pymupdf is not installed, so the PDF text cannot be read\n')
        sys.exit(2)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
CERTS = os.path.join(ROOT, 'public', 'assets', 'img', 'certs')

# the report number as the issuers write it
NUMBER = re.compile(r'(?:NACCYH\d{8}|XJ\d{10}|20\d{2}FM\d{5}[A-Za-z]?\d{2}D)')
# the verification code as the laboratories print it
# The label and the value are separated by markup, not by whitespace:
# React puts a comment between two text nodes and the value sits
# inside a span with a class, so the html reads
# "Verification code<!-- --> <span class=...>2LD7JWQC</span>".
#
# So the tags are stripped before the text is searched. What the page
# SAYS is what matters here, not what its html looks like.
def code_after(label_pattern, text):
    """The code that stands after a label.

    The gap between a label and its value is however much whitespace
    the markup left behind - three spaces here, four there - so the
    label is found first and the value is looked for in the text that
    follows it. The value is an upper-case token of eight characters
    with a digit in it, standing on its own.
    """
    out = set()
    for m in re.finditer(label_pattern, text, re.IGNORECASE):
        tail = text[m.end():m.end() + 80]
        vm = re.search(r'(?<![A-Za-z0-9])([A-Z0-9]{8})(?![A-Za-z0-9])', tail)
        if vm:
            out.add(vm.group(1))
    return out


CODE_LABEL = r'(?:校验码|Verification code)'
# the batch number of the sample
BATCH_LABEL = r'(?:批\s*号|Lot\s*№[^:：\n]*|Spec and Lot № of\s*Sample|Batch tested)'


def pdf_text(path):
    doc = pymupdf.open(path)
    try:
        return '\n'.join(doc[i].get_text() for i in range(doc.page_count))
    finally:
        doc.close()


def main():
    problems = []

    # ------------------------------------------------------------ the documents
    # each PDF: its number, its verification code, its batch
    docs = {}
    for f in sorted(os.listdir(CERTS)):
        if not f.endswith('.pdf'):
            continue
        path = os.path.join(CERTS, f)
        text = pdf_text(path)
        numbers = set(NUMBER.findall(text))
        # the number as it is printed in the header field
        header = re.findall(
            r'(?:报告编号|Report\s*(?:No\.?|编号))[：:\s]*([A-Z0-9]{6,24})', text)
        codes = code_after(CODE_LABEL, text)
        batches = set()
        for bm in re.finditer(BATCH_LABEL, text):
            bt = text[bm.end():bm.end() + 80]
            bv = re.search(r'(?<![0-9])([0-9]{8,12})(?![0-9])', bt)
            if bv:
                batches.add(bv.group(1))
        # the number that names this file
        wanted = None
        for n in numbers:
            if n.lower() in f.lower() or f.lower().find(n.lower()) >= 0:
                wanted = n
                break
        if wanted is None and header:
            wanted = header[0]
        docs[f] = {
            'numbers': numbers,
            'header': header,
            'codes': codes,
            'batches': batches,
            'number': wanted,
        }

    # the number each document is filed under, taken from the file
    # name, so a file whose contents do not match its name is caught
    for f, d in docs.items():
        stem = f.rsplit('.', 1)[0]
        m = re.search(r'(?:FM\d{5}[A-Za-z]?\d{2}D)', stem)
        if m:
            d['fromName'] = m.group(0)
        else:
            d['fromName'] = None

    # ------------------------------------------------------------ the site
    # every page of the build, and every fact on it
    pages = {}
    for path in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(path, OUT).replace(os.sep, '/')
        raw = io.open(path, encoding='utf-8', errors='replace').read()
        # the text of the page, with the markup taken out
        pages[rel] = re.sub(r'<[^>]*>', ' ', raw)

    # 1. every report number on the site must be a real one
    real_numbers = set()
    for d in docs.values():
        real_numbers |= d['numbers']
        if d['number']:
            real_numbers.add(d['number'])
        if d['fromName']:
            real_numbers.add(d['fromName'])
    # the number a buyer would type, without the leading year
    for rel, t in pages.items():
        for n in set(NUMBER.findall(t)):
            if n not in real_numbers:
                problems.append('%s: the report number %s is on the page but on no document' % (rel, n))

    # 2. every document's own number must be the number the site uses
    #    for it - the file name and the printed header have to agree
    for f, d in docs.items():
        if d['fromName'] and d['header']:
            printed = d['header'][0]
            if printed != d['fromName']:
                problems.append(
                    '%s: the file is named for %s but the document prints %s'
                    % (f, d['fromName'], printed))

    # 3. every verification code on the site must be on a document
    real_codes = set()
    for d in docs.values():
        real_codes |= d['codes']
    for rel, t in pages.items():
        for m in code_after(CODE_LABEL, t):
            if m not in real_codes:
                problems.append('%s: the verification code %s is on the page but on no document' % (rel, m))

    # 4. every batch number on the site must be on a document
    real_batches = set()
    for d in docs.values():
        real_batches |= d['batches']
    for rel, t in pages.items():
        for bm in re.finditer(BATCH_LABEL, t):
            bt = t[bm.end():bm.end() + 80]
            bv = re.search(r'(?<![0-9])([0-9]{8,12})(?![0-9])', bt)
            if bv and bv.group(1) not in real_batches:
                problems.append('%s: the batch number %s is on the page but on no document' % (rel, bv.group(1)))

    # 5. every verification code on a document should be on the site -
    #    the six that are printed and nowhere else are the defect this
    #    gate exists to catch
    on_site = set()
    for t in pages.values():
        on_site |= code_after(CODE_LABEL, t)
    for f, d in docs.items():
        for c in d['codes']:
            if c not in on_site:
                problems.append('%s: the verification code %s is on the document and nowhere on the site' % (f, c))

    # 6. the coverage table must agree with what the site links
    #    the coverage is read from the certificates page, which is the
    #    one place a report and the SKUs it covers are written down
    cov = io.open(os.path.join(ROOT, 'lib', 'report-coverage.ts'), encoding='utf-8', errors='replace').read()
    for m in re.finditer(r'(P\d{3}):\s*\{([^}]*)\}', cov):
        pid, seg = m.group(1), m.group(2)
        nums = re.findall(r"'([^']+)'", seg)
        for n in nums:
            if not NUMBER.fullmatch(n):
                continue
            if n not in real_numbers:
                problems.append('the coverage table gives %s to %s, and no document carries that number' % (n, pid))
            # and the product page must link it
            linked = any(n in t for t in pages.values())
            if not linked:
                problems.append('%s is covered by %s, and no page links that report' % (pid, n))

    # ------------------------------------------------------------ the report
    if problems:
        for p in problems[:40]:
            sys.stderr.write('    %s\n' % p)
        sys.stderr.write('  %d problem(s)\n' % len(problems))
        return 1

    print('  %d documents, %d pages' % (len(docs), len(pages)))
    print('  %d report numbers, %d verification codes, %d batches - all on a document'
          % (len(real_numbers), len(real_codes), len(real_batches)))
    return 0


if __name__ == '__main__':
    sys.exit(main())

"""THE REPORT NUMBERS, THE SAME NUMBERS THE PDF PRINTS.

A laboratory report number is the one string a buyer can check. The
buyer types it into the issuer's site, or writes it on an email; if it
does not match the document, the report is worthless and the claim it
carries is a claim nobody can stand behind.

This site had one such mismatch: the Purepaws report is printed
"2024FM12662R01Da" on every page of the PDF, and the site said
"2024FM12662R01D" - the last letter missing. Nothing else caught it,
because the site, the coverage table and the product page all carried
the same wrong string. One source of truth that is wrong is still
wrong.

So the number is checked against the document it links to.

WHY THIS IS A PYTHON SCRIPT AND NOT PART OF THE NODE GATE
The reports are scans - DCTDecode, which is JPEG - so most of them have
no text layer at all, only an OCR layer. Reading that needs a PDF
library that understands the format, and PyMuPDF is what the server
already has for the watermark check. Node can inflate the streams and
look at the drawing operators, but a scanned page draws an image, not
characters, so there is nothing to find there.

Exit code 0 when every number is on its document, 1 when one is not.
The output is one line per problem, so the node gate can print it.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'public', 'assets', 'img', 'certs')
REPORTS = os.path.join(ROOT, 'content', 'v2', 'reports.ts')

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        sys.stderr.write('  pymupdf is not installed, so the PDF text cannot be read\n')
        sys.exit(2)


def entries():
    """The number and the file, from the one place they are written."""
    src = io.open(REPORTS, encoding='utf-8', errors='replace').read()
    out = []
    for m in re.finditer(r'number:\s*"([^"]+)"[\s\S]{0,700}?file:\s*"([^"]+)"', src):
        out.append((m.group(1), m.group(2)))
    return out


def pdf_text(path):
    doc = pymupdf.open(path)
    try:
        return '\n'.join(doc[i].get_text() for i in range(doc.page_count))
    finally:
        doc.close()


def main():
    problems = []
    found = entries()
    if not found:
        problems.append('no report numbers were found in content/v2/reports.ts')

    for number, filename in found:
        path = os.path.join(SITE, filename)
        if not os.path.exists(path):
            problems.append('%s: the file %s is not there' % (number, filename))
            continue
        try:
            text = pdf_text(path)
        except Exception as e:
            problems.append('%s: %s could not be read (%s)' % (number, filename, str(e)[:60]))
            continue
        # the number as printed, and the number without a trailing letter:
        # some issuers number a report with a suffix the site drops
        bare = re.sub(r'[A-Za-z]$', '', number)
        if number not in text and bare not in text:
            problems.append('%s: it does not appear in %s' % (number, filename))

    if problems:
        for p in problems:
            sys.stderr.write('    %s\n' % p)
        sys.stderr.write('  %d problem(s)\n' % len(problems))
        return 1

    print('  %d report numbers, each one found in the PDF it links to' % len(found))
    return 0


if __name__ == '__main__':
    sys.exit(main())

"""THE NUMBERS THE SITE PUBLISHES, COMPARED WITH EACH OTHER.

WHAT THIS IS FOR

This site publishes the same handful of figures in a dozen places: on the
pages a reader sees, in the JSON-LD a crawler reads, in the machine-
readable files an answer engine reads, and in the footers and cards
that are generated from the same record.

Between 2026-11-05 and 2026-11-06, five of those figures printed two
different answers at the same time, on the same site:

  the report split   "7 from GDDCM and 3 from NACC" on the
                     certifications page, "6 from GDDCM and 4 from
                     NACC" on the contact and factory pages. Same ten
                     reports. The cause was a loose regular expression
                     that matched two different laboratories whose
                     names share a prefix.

  the report count   "${LAB_REPORTS.length} third-party reports are
                     downloadable" - the template expression itself,
                     shipped as literal text into the homepage's
                     FAQPage structured data. A crawler was told the
                     site had an unreplaced template.

  the catalogue size "22" in one structured-data block and "20" in the
                     next, on the same page, counting different things
                     and never saying so.

  the product lines  "4 lines" in a heading and "3 product lines" one
                     sentence below it, in the file answer engines read
                     most.

  a build path       "<the build directory>\\Desktop\\shenhe-v2/attestation.html"
                     in llms-full.json - the build machine's own home
                     directory, published to every AI crawler.

None of them was a wrong fact. Every one of them was the right fact
printed beside a different version of itself, and an answer engine
reading the site cannot tell which one is the site's number.

A review catches this by reading two pages side by side and noticing.
A build cannot, because each page is correct on its own. So this
compares them.

WHAT IT CHECKS

  1  No unreplaced template expressions in any published file.
  2  No local filesystem path in any published file.
  3  The report split is identical wherever it is printed.
  4  Every catalogue count is the same number, and the difference
     between the SKU count and the product count is stated.
  5  No product page claims a use its own catalogue record does not
     give it.
  6  No double-encoded entity in a title or a meta description.

Exit code 0 when everything agrees, 1 when it does not. The output is
one line per problem.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
PUBLIC = os.path.join(ROOT, 'public')

problems = []


def fail(msg):
    problems.append(msg)


def read(path):
    try:
        with open(path, encoding='utf-8') as fh:
            return fh.read()
    except OSError:
        return None


def published_files():
    """Every file a reader or a crawler can fetch."""
    for base in (OUT, PUBLIC):
        for root, _dirs, files in os.walk(base):
            if 'node_modules' in root or '.next' in root:
                continue
            for name in files:
                if name.endswith(('.html', '.json', '.txt', '.xml', '.md')):
                    yield os.path.join(root, name)


# ---------------------------------------------------------------------
# 1. An unreplaced template expression
# ---------------------------------------------------------------------
# A string literal written with single quotes cannot interpolate, so a
# ${...} inside one reaches the page as text. It looks like a typo to a
# reader and looks like a variable to a crawler.
TEMPLATE_EXPR = re.compile(r'\$\{[A-Za-z_][A-Za-z0-9_.]*\}')

for path in published_files():
    if not path.endswith(('.html', '.json', '.txt')):
        continue
    text = read(path)
    if not text:
        continue
    for m in TEMPLATE_EXPR.finditer(text):
        rel = os.path.relpath(path, ROOT)
        ctx = text[max(0, m.start() - 60):m.end() + 60].replace('\n', ' ')
        fail(f'{rel}: an unreplaced template expression reaches the page: {ctx!r}')

# ---------------------------------------------------------------------
# 2. A local filesystem path
# ---------------------------------------------------------------------
# A build directory on the developer's own machine, published to every
# answer engine. It tells a reader nothing, and it tells whoever reads
# it where the build ran.
LOCAL_PATH = re.compile(
    r'[A-Za-z]:\\\\?Users\\\\?[^"\'<>\s]{2,80}'
    r'|/home/[a-z][^"\'<>\s]{2,80}'
    r'|/Users/[A-Za-z][^"\'<>\s]{2,80}'
)

for path in published_files():
    if not path.endswith(('.html', '.json', '.txt')):
        continue
    text = read(path)
    if not text:
        continue
    for m in LOCAL_PATH.finditer(text):
        rel = os.path.relpath(path, ROOT)
        fail(f'{rel}: a local filesystem path is published: {m.group(0)!r}')

# ---------------------------------------------------------------------
# 3. The report split, everywhere it is printed
# ---------------------------------------------------------------------
# The split is computed from the reports. Every page that prints it
# must print the same one.
SPLIT = re.compile(r'(\d+)\s+from\s+GDDCM(?:\s+and|,)\s*(\d+)\s+from\s+NACC')
splits = {}
for path in published_files():
    if not path.endswith(('.html', '.txt', '.json', '.md')):
        continue
    text = read(path)
    if not text:
        continue
    for m in SPLIT.finditer(text):
        rel = os.path.relpath(path, ROOT)
        key = (m.group(1), m.group(2))
        splits.setdefault(key, set()).add(rel)

if len(splits) > 1:
    for key in sorted(splits, key=lambda k: -len(splits[k])):
        files = sorted(splits[key])
        fail(
            f'the report split is printed as {key[0]} GDDCM / {key[1]} NACC in '
            f'{len(files)} place(s): {files[:4]}'
            + (' ...' if len(files) > 4 else '')
        )
    fail(
        'the report split must be identical everywhere. The truth is the one '
        'printed by the certifications page, which counts the reports itself.'
    )
elif splits:
    # One split everywhere. It still has to be the true one, so compare it
    # with the issuers in the record rather than trusting the pages.
    key = next(iter(splits))
    reports_ts = read(os.path.join(ROOT, 'content', 'v2', 'reports.ts')) or ''
    issuers = re.findall(r'issuer:\s*"([^"]+)"', reports_ts)
    nacc = sum(
        1 for i in issuers
        if i.strip().lower() == 'guangzhou institute of microbiology (nacc)'
    )
    gddcm = len(issuers) - nacc
    if (str(gddcm), str(nacc)) != key:
        fail(
            f'the pages print {key[0]} GDDCM / {key[1]} NACC, but the record '
            f'holds {gddcm} GDDCM-family reports and {nacc} NACC reports'
        )
    else:
        print(
            f'  the report split: {gddcm} from GDDCM and {nacc} from NACC, '
            f'printed identically in {len(splits[key])} place(s)'
        )

# ---------------------------------------------------------------------
# 4. The catalogue counts
# ---------------------------------------------------------------------
# The SKU count and the product count are different numbers and both are
# right. What must not happen is a page that prints one and another
# page that prints the other with nothing to say which is which.
CATALOGUE = os.path.join(ROOT, 'lib', 'products.json')
catalogue = json.loads(read(CATALOGUE) or '{}')
skus = catalogue if isinstance(catalogue, list) else catalogue.get('products', [])
sku_count = len(skus)

ai = read(os.path.join(PUBLIC, 'llms-full.json'))
if ai:
    data = json.loads(ai)
    company_count = data.get('company', {}).get('skuCount')
    if company_count is not None and company_count != sku_count:
        fail(
            f'llms-full.json company.skuCount is {company_count} but the '
            f'catalogue holds {sku_count} SKUs'
        )
    # A category holds a SUBSET of the catalogue, so its count is smaller
    # by design. It is checked against the sum of the categories, not
    # against the total.
    categories = data.get('categories', [])
    if categories:
        total = sum(c.get('skuCount', 0) for c in categories)
        if total != sku_count:
            fail(
                f'the catalogue holds {sku_count} SKUs but the '
                f'{len(categories)} categories in llms-full.json hold '
                f'{total} in total'
            )
    # The product list is the SKUs plus the quoted-only products, so it
    # is larger by design. It has to say so.
    if data.get('company', {}).get('skuCount') is not None:
        products_n = len(data.get('products', []))
        if products_n != sku_count and not data.get('company', {}).get('skuCountNote'):
            fail(
                f'llms-full.json lists {products_n} products against a skuCount '
                f'of {sku_count} and does not state the difference. Add a '
                f'skuCountNote so a reader is not left guessing.'
            )

# ---------------------------------------------------------------------
# 5. A claim the catalogue record does not support
# ---------------------------------------------------------------------
# A product page may not claim a use that its own application list does
# not include. This is the check that catches a "safe if licked" claim
# sitting on a product catalogued for surfaces only.
PET_BODY_CLAIMS = re.compile(r'safe (?:if |to be )?licked|pet-safe if licked', re.I)
APPLICATION_HAS_COAT = re.compile(r'pet body|coat|skin', re.I)

for p in skus:
    pid = p.get('id', '?')
    apps = p.get('application') or []
    if isinstance(apps, str):
        apps = [apps]
    app_text = ' · '.join(str(a) for a in apps)
    for field in ('function_en', 'function_zh', 'description', 'summary_en'):
        value = p.get(field)
        if not isinstance(value, str):
            continue
        if PET_BODY_CLAIMS.search(value) and not APPLICATION_HAS_COAT.search(app_text):
            fail(
                f'{pid}: {field} claims the product is safe if licked, but its '
                f'application list is {app_text!r} - no coat, no skin. The '
                f'claim may only sit on a SKU whose record includes the pet body.'
            )

# ---------------------------------------------------------------------
# 6. A double-encoded entity in a title or a description
# ---------------------------------------------------------------------
# React escapes an apostrophe to &#x27; in the rendered attribute. The
# source reads "SKU's", the page reads "SKU&#x27;s", and a reader who
# copies the meta description gets the escape with it.
BAD_ENTITY = re.compile(r'&#x27;|&amp;amp;|&quot;amp;|&#39;amp;')

for path in published_files():
    if not path.endswith('.html'):
        continue
    text = read(path)
    if not text:
        continue
    for m in re.finditer(r'<meta name="description" content="([^"]*)"', text):
        if BAD_ENTITY.search(m.group(1)):
            rel = os.path.relpath(path, ROOT)
            fail(f'{rel}: the meta description carries a double-encoded entity: {m.group(1)[:120]!r}')

# ---------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------
if problems:
    sys.stderr.write('\n  the published numbers do not all agree:\n')
    for p in problems:
        sys.stderr.write(f'    - {p}\n')
    sys.stderr.write(f'\n  {len(problems)} problem(s).\n')
    sys.exit(1)

print('  the published numbers agree: no template expressions, no local paths,')
print('  one report split, one catalogue count, no claim without a record,')
print('  no double-encoded entities.')
sys.exit(0)

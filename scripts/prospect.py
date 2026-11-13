"""THE PROSPECTOR: buyers out of the industry lists.

WHAT THIS IS FOR

The desk had the whole chain behind a buyer - the enquiry, the
quotation, the order, the production, the quality check, the payment,
the shipment - and nothing in front of it that went out and brought a
buyer to the desk. A watch on a door is not the same as going to the
door.

This finds companies that already buy pet care products under their
own name and writes them down, with the reason attached.

WHERE THE NAMES COME FROM, AND WHY NOT FROM A SEARCH ENGINE

The search engines are not usable for this:

  DuckDuckGo answers 202 to a caller that asks too often, and the
  lists are short
  Bing answers a client from this address with unrelated results

And a search for "private label pet shampoo" mostly finds factories
- the competitors. The buyers are on lists of a different kind: the
"top N pet shampoo manufacturers" articles of the industry press,
the exhibitor lists of the trade fairs, the retail groups' own-brand
pages. Those are lists of companies that already buy.

The lists are read, not guessed at: the names come out of the
headings, and the evidence comes out of the section under each one.

HOW A BUYER IS TOLD FROM A COMPETITOR

A competitor makes the product. A buyer sells it under its own name.

  the buyer says  "our brand", "own label", "house brand", "we
                  import", "distributor", "wholesale", "our range",
                  "our products", "we supply"
  the seller says "manufacturer", "OEM", "ODM", "factory", "our
                  factory", "MOQ", "we make", "contract manufacturing",
                  "custom formulation"

A page that says both is a factory that also has a brand - which is
still a buyer for a supplier like this one, so it is kept and marked.

WHAT IT WRITES

The company, a name, a country, the website it was found on, the
email if the page gave one, and the reason: the sentence that says it
buys, the list it was found in, and the products it might want.

WHAT IT DOES NOT DO

It does not send anything. It does not write to the desk. A person
reads the list and decides. The desk's endpoint takes the rows that
are worth a sales hour - the prospector only finds them.
"""
import io
import json
import os
import re
import ssl
import sys
import time
import html
import urllib.error
import urllib.request

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36')

BUYER_WORDS = [
    'our brand', 'our brands', 'own label', 'own-label',
    'house brand', 'we import', 'importer', 'import and distribute',
    'distributor', 'distributes', 'distribution', 'wholesale',
    'wholesaler', 'our range', 'our products', 'we supply',
    'retailer', 'brand owner', 'own products', 'we sell',
    'our catalogue', 'our catalog', 'stocked in', 'we stock',
    'own label range', 'our own',
]
SELLER_WORDS = [
    'manufacturer', 'manufacturing', 'oem', 'odm', 'our factory',
    'factory', 'moq', 'we make', 'production line',
    'contract manufacturing', 'custom formulation', 'custom formula',
    'we formulate', 'private label', 'private-label',
    'factory direct', 'contract fill', 'your brand',
]

# a heading that names a company: a number, then a name
NAME_HEADING = re.compile(r'^\s*(\d{1,2})[.)]\s*(.{2,80})$')
# an address in the text
EMAIL = re.compile(r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b')
# a country: a short list of the ones a pet care buyer is in
COUNTRIES = [
    'United States', 'USA', 'United Kingdom', 'UK', 'Canada', 'Australia',
    'New Zealand', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
    'Belgium', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Poland', 'Portugal',
    'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'South Africa',
    'United Arab Emirates', 'Saudi Arabia', 'Japan', 'South Korea', 'India',
    'China', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia',
    'Philippines', 'Turkey', 'Israel', 'Egypt', 'Kenya', 'Nigeria',
]


def fetch(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
    })
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as x:
            return x.status, x.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception:
        return 0, ''


def text_of(seg):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', seg))).strip()


def companies_on(url):
    """The companies a list page names, with the section under each."""
    st, body = fetch(url)
    if st != 200:
        return st, []

    out = []
    # the headings, in the order they appear
    for m in re.finditer(r'<h([1-4])[^>]*>(.*?)</h\1>', body, re.S):
        name = text_of(m.group(2))
        if not name or len(name) > 90:
            continue
        nm = NAME_HEADING.match(name)
        if not nm:
            continue
        label = nm.group(2).strip()
        # the section under the heading, up to the next heading
        rest = body[m.end():]
        nxt = re.search(r'<h[1-4][^>]*>', rest)
        section = rest[:nxt.start()] if nxt else rest[:4000]
        out.append({'name': label, 'section': text_of(section)[:2600],
                    'url': url})
    return st, out


# A sentence about what the company makes FOR other people. These
# are the words of a competitor, whatever else the page says.
FOR_OTHERS = [
    'brand owner', 'brand owners', 'your brand', 'your own brand',
    'other brands', 'for brands', 'help brands', 'helps brands',
    'private labeling', 'private labelling', 'private label',
    'private-label', 'oem', 'odm', 'contract manufacturing',
    'contract fill', 'your formula', 'custom formula',
    'custom formulation', 'your scent', 'your product',
    'your clients', 'your customers', 'start your own',
    'launch your own', 'your label', 'your line',
    'this European partner', 'the partner',
]

# A sentence about what the company sells under its own name. These
# are the words of a buyer.
FOR_ITSELF = [
    'our brand', 'our brands', 'our own brand', 'own label',
    'house brand', 'our products', 'our range', 'our catalogue',
    'our catalog', 'we import', 'importer', 'we distribute',
    'distributor of', 'we wholesale', 'we sell', 'we supply',
    'we stock', 'our line', 'our collection', 'our selection',
]


def judge(entry):
    """Is this a buyer, and what is the evidence?"""
    text = ('%s %s' % (entry['name'], entry['section'])).lower()

    # The publisher of a list is usually in it - a factory writes a
    # list of the market and puts itself first. So the publisher's
    # own name is left out.
    host = re.sub(r'^https?://([^/]+).*', r'\1', entry['url'])
    stem = re.sub(r'\.(com|net|org|co|io|us|uk|au|ca)\..*$', '', host)
    stem = re.sub(r'^www\.', '', stem).split('.')[0]
    if stem and len(stem) > 3 and stem.lower() in entry['name'].lower():
        return None
    buyers = [w for w in BUYER_WORDS if w in text]
    sellers = [w for w in SELLER_WORDS if w in text]
    # The sentences that carry the evidence. A sentence counts when
    # it is about the company selling under its own name, and it is
    # thrown away when it is about the company making for other
    # people.
    sentences = re.split(r'(?<=[.!?])\s+', entry['section'])
    evidence = []
    its_own = []
    for s in sentences:
        low = s.lower()
        if not (20 < len(s) < 260):
            continue
        if any(w in low for w in FOR_OTHERS):
            continue
        if any(w in low for w in FOR_ITSELF):
            evidence.append(s.strip())
            its_own.extend(w for w in FOR_ITSELF if w in low)
        if len(evidence) >= 3:
            break
    if not evidence:
        return None
    return {
        'name': entry['name'],
        'kind': 'buyer',
        'why': ' '.join(evidence)[:600],
        'buyer_words': its_own[:6],
        'seller_words': sellers[:6],
    }


def contacts(entry):
    """The country and the email, if the section gave them."""
    text = entry['section']
    country = None
    for c in COUNTRIES:
        if c in text:
            country = c
            break
    emails = []
    for m in EMAIL.finditer(text):
        e = m.group(1).lower()
        if e not in emails and not e.endswith(('.png', '.jpg', '.webp')):
            emails.append(e)
    return country, emails[:3]


def main():
    urls = sys.argv[1:]
    if not urls:
        print('usage: prospect.py <list page url> [<list page url> ...]')
        return 2

    all_rows = []
    for url in urls:
        st, rows = companies_on(url)
        print('  %-64s %s  the companies: %d' % (url[:64], st, len(rows)))
        if st != 200:
            continue
        for r in rows:
            j = judge(r)
            if not j:
                continue
            country, emails = contacts(r)
            j['country'] = country
            j['emails'] = emails
            j['found_at'] = url
            all_rows.append(j)
        time.sleep(2)

    print('')
    print('  the buyers found: %d' % len(all_rows))
    for r in all_rows:
        print('    %-46s %-18s %s' % (
            r['name'][:46], r['kind'],
            (r['country'] or '-') + ' ' + (', '.join(r['emails']) or '')))

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prospects.json')
    io.open(out, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(all_rows, ensure_ascii=False, indent=2))
    print('')
    print('  the list: %s' % out)
    return 0


if __name__ == '__main__':
    sys.exit(main())

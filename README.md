# shenhe-pet-care — the source of [shenhezhongke.com](https://shenhezhongke.com)

The website of **Guangdong Shenhe Zhongke Biotechnology Co., Ltd.** — a pet care
OEM/ODM factory in Heyuan, Guangdong: deodorizing sprays, cat litter deodorizer,
shampoos, waterless cleansing foam, paw care, outdoor protection and pet nutrition.

It is a static Next.js site (105 published pages, no client-side rendering, no
cookie banner unless analytics are accepted) served from nginx, with a small
Postgres API behind it for enquiries and the buyer portal.

This repository is the published copy: the site, its machine-readable side and
the gates that hold the facts in place. The staff desk, the API service, the
company's working ledger and the internal reference prices are not in it —
see [PUBLISHING.md](PUBLISHING.md) for what was left out and why.

```
https://shenhezhongke.com/          the site
/product-feed.json                  the catalogue, as a machine-readable feed
/llms.txt, /llms-full.json          the same facts, for answer engines
/.well-known/agent-skills/          what an AI agent should know before it writes to us
```

## What makes this repository different

**The facts live in one place, and the gates hold them there.**

The catalogue is `lib/products.json`. The product pages, the machine-readable
files, the PDF catalogue, the AI matcher and the enquiry form all read it —
nobody writes a second copy. A SKU's minimum order is one number in one file.

**Nothing is published that the company does not actually hold.** There is no
price anywhere, because prices are quoted per order. There is no product
snippet rating unless a real buyer wrote it, and there is no certification
claim whose holder is not named on the scan. `npm run build` refuses the
build if any of that is violated.

**The build is a gate, not a compiler.** `npm run build` runs the site build
and then ~30 checks, and it fails on any of them:

| check | what it holds |
|---|---|
| `check_no_price_leak.py` | no currency amount anywhere in the published pages or the records, except the nine named commercial thresholds |
| `check_no_offers.py` | no offer, no `offers` property, no price key, no microdata price in the structured data |
| `check_product_feed.py` | the product feed is the catalogue, and its enquiry contract is exactly the fields the server reads |
| `check_ip_claims.py` | every registration number printed on the site is in the record, every record entry is printed, nothing refused is in it |
| `check_english_copy_consistency.py` | no Chinese on an English page, and the house spelling (`enquiry`, `deodorizing`) |
| `check_faq_schema.py` | every question shown is the question in the markup |
| `check_semantic_structure.py` | the pages declare what they are, the company is declared once, every credential is visible |
| `check_page_weight.py` | no page is over the markup ceiling |

`npm run check` is the second gate: it checks the built output — every link
resolves, every image has a file, every JSON-LD block parses, every description
fits the search-result window, every page has a canonical and a breadcrumb.

**The machine-readable side is part of the product.** `public/product-feed.json`
is the catalogue as a list an agent can act on, with the enquiry contract
inside it: the endpoint, every field, the three fields that make an enquiry
quotable, and a worked example. The same facts are published as `llms.txt`,
`llms-full.json`, `sitemap-ai.xml` and two agent skills.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # the site + every gate
npm run check      # the gates against the built output
```

Node 20+. The build needs Python 3 for the checks and the generators.

## How the site is put together

```
app/(site)/        the pages. A page is an ordered array of typed blocks.
components/v2/     the block renderer and the design system.
lib/               the record: products, the company, the routing, the copy.
content/           the copy and the page records.
public/            what is published: the machine files, the images, the reports.
scripts/           the generators and the gates.
docs/              the four documents that describe the site's own claims and methods.
```

A page does not hold HTML. It holds blocks — `hero`, `productGrid`,
`process`, `proofGrid`, `faq`, `recordCards` — and the renderer draws them.
The copy is data, so a page can be reordered or restyled without touching a
string, and the schema for a page is generated from the same blocks that draw
it, so the markup cannot describe a page the reader cannot see.

## Deploying

The site is a static export (`out/`) plus the API. The deploy builds, runs the
gates, tars `out/`, and pushes it to the nginx host; IndexNow tells the
engines what changed. There is no Vercel, and no server-side rendering.

The API service itself is not in this repository — it runs on the company's own
servers. What the outside world needs from it is published as a contract:
`public/openapi.json` describes every field the enquiry endpoint reads, and
`public/product-feed.json` carries that contract together with the catalogue.

## What is deliberately not in this repository

- **No prices.** They are quoted per order. The catalogue record here has had
  its price fields removed; every other fact about every SKU is present.
- **No database.** `server/data/` is runtime state; the seed scripts rebuild it.
- **No prospect lists.** The prospecting scripts write them, and they hold other
  companies' contact details.
- **No build archives.** The deploy makes them and throws them away.
- **No staff desk.** The internal console, the API service it runs on and the
  records it keeps stay on the company's own machines.
- **No working ledger.** The round-by-round log of the company's own work stays
  internal.
- **No working documents.** Only the four documents in `docs/` are here.

## Licence

All rights reserved. The code, the copy, the images and the laboratory report
scans belong to Guangdong Shenhe Zhongke Biotechnology Co., Ltd.

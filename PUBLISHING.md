# What is in this repository, and what is not

This is the published copy of the company's site repository. It was produced
by taking the working repository and leaving out the parts that are the
company's business rather than the site's. Nothing was rewritten except the
prices, and the build chain was adjusted where a step only makes sense
inside the company.

The copy is a snapshot. The company's own repository keeps the whole history
and keeps moving; this one is what a reader can see.

## Left out, and why

| what | why |
|---|---|
| `HEALTH-CHECK.md` — the ledger | it records the production server, the internal endpoints and the path of the production `.env` |
| `docs/` except four documents | the rest are working documents: audit runs, roadmaps, the prospecting material |
| `server/`, `server-pg/` — the API service and the staff desk | an internal tool, not the website. What the outside world needs from it is published as `public/openapi.json` |
| `app/(console)/` and the desk components | the staff console pages |
| `legacy/` — the old catalogue export | it carried the internal reference price for every SKU |
| `PROVENANCE.md` | it quotes the prices that were removed from the site |
| `content/systems.json`, `content/_livejsonld.json` | an internal dashboard, and a capture of the site from before the prices were taken out |
| `i18n-routes-parked/`, `_backup-handwritten/` | parked and backed-up work, not the site |
| the deploy archives (about 800 MB) | build output, made and thrown away by every deploy |
| `server/data/` — the local database | runtime state: staff accounts, session rows, the quote book |
| `docs/prospecting/` | 450 other companies with their email addresses and phone numbers |
| `scripts/_remove_legacy_prices.py`, `scripts/audit_kb_coverage.py` | they carry the old price list in their own text |
| 43 one-off scripts bound to one machine | they carry the folder they were written on, and one of them reads the price-list PDF from a desktop |

## Changed

- **The catalogue record.** `lib/products.json` no longer carries the internal
  reference price for each SKU: the price fields are gone, the price line in
  the claims list is gone, and the price sentence in the description is gone.
  Every other fact — MOQ, lead time, ingredients, application, HS code,
  shelf life, packaging, certifications — is unchanged. The site never
  displayed any of it; the client-side projection drops the price before the
  page is built.
- **The build chain.** Two steps were removed from `npm run build`:
  `normalize_public_email.py` (it touches addresses that are not published) and
  `check_ledger_encoding.py` (it checks the ledger, which is not here).
  Everything else — including the price gate, the offer gate, the feed gate
  and the claim gate — runs unchanged.
- **The examples.** Three comments quoted a real figure as an example of what
  the code must not print. They now say `<amount>`.

## Why the copy can be trusted

The build is the proof: `npm run build` builds the site and then runs the
gates, and it fails if a page carries a price, if the structured data
carries an offer, if a printed registration number is not in the record, if
the product feed and the catalogue disagree, or if a Chinese character ends
up on an English page. The published copy was built end to end before it was
published.

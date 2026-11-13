---
name: shenhe-rfq-helper
description: Use when an AI agent needs to help a buyer submit an enquiry, sample request or RFQ to SHENHE ZHONGKE (深河中科) — covers the fields to collect, the deep-link prefill pattern for the contact form, the enquiry API endpoint and its bot checks, and how to track an enquiry by its reference.
---

# Submitting an enquiry to SHENHE ZHONGKE

## The three things an enquiry needs

The enquiry form asks for three things and nothing else:

1. **The product** — a SKU, a product type, or a description of what they want
   made.
2. **The annual volume** — the number they buy in a year. This is what decides
   the minimum order they are quoted and the tier they are quoted at.
3. **How to reach them** — an email address or a phone number. One of the two
   is required; without one the enquiry cannot be answered and is refused.

Optional and useful: the company name, the country, and the target market.

**On the server, the three that make an enquiry QUOTABLE are `products`,
`volume` and `country`.** An enquiry carrying all three can be quoted
without a follow-up question; an enquiry missing one is a lead the desk has
to chase. If you are sending the enquiry, send those three.

## The deep-link prefill pattern

The contact form reads prefill parameters from the URL in the browser, so an
agent can hand the buyer a form that is already filled in with what is known:

```
/contact.html?about=P012              one SKU id — the product field is filled with its name
/contact.html?range=P003,P007,P010    several SKU ids, comma separated
```

The ids are SKU ids from the catalogue (`/products.html`). The form writes
them out as product names, because "P012" means nothing to the person typing.

The buyer still submits it **by hand** if they are typing it themselves.
The deep link is the way to give them a form that is already filled in; the
API is the way to send an enquiry you were asked to send. Either way, the
enquiry is a statement the buyer stands behind — do not invent one, and do
not send one nobody asked for.

## The enquiry API

`POST /api/inquiries` — JSON, described in `/.well-known/openapi.json`, and
the full contract — with a worked example — in `/product-feed.json`.

| Field | Required | Notes |
|---|---|---|
| `message` | yes | what they want made, for which market, at what volume |
| `email` | one of | must look like an address |
| `phone` / `whatsapp` | one of | the other half of the contact requirement |
| `name` | no | |
| `company` | no | |
| `country` | no | **one of the three that make it quotable** |
| `products` | no | array, at most 50 entries; the SKU ids from `/product-feed.json`. **One of the three** |
| `volume` | no | the annual volume, e.g. `100,000 - 500,000 units`. **One of the three** |
| `quantity` | no | the quantity being ordered, a whole number above zero |
| `incoterm` | no | `EXW Shenzhen (default)`, `FOB Guangzhou / Shenzhen`, `CIF`, `DDP` |
| `customerType` | no | one of the six kinds of buyer the desk answers differently |
| `source` | no | free text, at most 40 characters |
| `source_detail` | no | an object; where the enquiry came from |
| `idempotency_key` | no | send the same key when you retry, and the retry does not become a second enquiry (it can also be sent as the `Idempotency-Key` header) |

The endpoint returns `201` with a reference like `INQ-20261104-K3QW7`.

A worked example — the email is a **placeholder**: the site publishes no address
that is not a mailbox on its own domain, so the example does not carry one
either. Put the buyer's own address in that field:

```bash
curl -X POST https://shenhezhongke.com/api/inquiries \
  -H 'Content-Type: application/json' \
  -d '{
    "products": ["P001"],
    "volume": "100,000 - 500,000 units",
    "quantity": 1000,
    "country": "Germany",
    "customerType": "A brand with its own formulation to match",
    "incoterm": "FOB Guangzhou / Shenzhen",
    "name": "The buyer",
    "company": "The buyer GmbH",
    "email": "<the buyer's email address>",
    "message": "Private-label probiotic pet deodorizer, 200 mL, our label. Quote to FOB Shenzhen.",
    "source": "agent"
  }'
```

**Send an enquiry the buyer asked you to send.** The endpoint takes a JSON
body and needs no session, no token and no CSRF header. What it refuses is a
submission nobody asked for — so ask first, then send it.

**Two bot checks run on the server**, and this is why an agent should prefer
the deep link to a direct POST:

- `company_website` — a field no human sees. Any non-empty value is refused.
- `form_age_ms` — how long the form was open. Under 2,000 ms is refused.

Both are refused with the same `422` answer as a missing field, so nothing
tells a robot which rule caught it.

## Tracking an enquiry

`GET /api/inquiries/track?reference=INQ-20261104-K3QW7` — the reference format
is `INQ-<YYYYMMDD>-<5 characters>`. A buyer can check where their enquiry got
to without an account.

## What happens next

A named sales manager answers, normally within one business day, with the
quotation: the minimum order, the lead time, the packaging options and the
compliance documents the buyer's market needs.

## Do not

- Quote a unit price. There is no published price list, and a price quoted
  from this site is a price the site does not publish.
- Promise an approval in the buyer's market.
- Promise a shorter reply time than one business day.
- Promise a free sample. Samples are chargeable, and the fee is in the
  quotation.

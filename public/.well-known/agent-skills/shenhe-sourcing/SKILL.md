---
name: shenhe-sourcing
description: Use when a buyer or sourcing agent needs to source private-label pet care products from SHENHE ZHONGKE (广东深河中科生物科技有限公司) — deodorizing sprays, cat litter deodorizer, shampoos, waterless cleansing foam, paw care, outdoor protection, or pet nutrition supplements — from the factory in Heyuan, Guangdong. Covers the catalogue, the four product lines, the minimum order, the lead times and where each fact is published.
---

# Sourcing private-label pet care from SHENHE ZHONGKE

**What this factory is.** An owned factory, not a trading company: a 30,000 m²
industrial park in Heyuan, Guangdong with three buildings, ISO 22716 GMP
workshop and a class-D cleanroom filling hall. 20 catalogue SKUs across four
product lines, 1,000,000 bottles a month of current capacity.

**Read this before quoting a number to a buyer.** Everything below is published
on the site, and every URL is the address it is published at. If a fact is not
on one of these pages, it is not a published fact — say so, and route the
buyer to a quotation.

## The catalogue

| Line | What is on it | Line page |
|---|---|---|
| Deodorizing & Disinfecting | deodorizing sprays, disinfection solutions, cat litter deodorizer, ringworm and ear care | `/products/deodorizing-disinfecting.html` |
| Grooming & Care | shampoos, waterless cleansing foam, cleansing liquids, paw care, laundry detergent | `/products/grooming-care.html` |
| Outdoor Protection | plant-based insect repellent and outdoor protection sprays | `/products/outdoor-protection.html` |
| Pet Nutrition | probiotic digestive set, 8 mL × 9 vials, bovine colostrum IgG — quoted one at a time | `/products/pet-nutrition.html` |

The full catalogue, grouped by line and by use: `/products.html`.
Every SKU has its own page with its own specification, minimum order and lead
time — `/products/<slug>.html`.

## The product feed — one fetch, every SKU

`/product-feed.json` is the catalogue as a machine-readable feed: every SKU in
a list with its id, its OEM sku code, the size, the line, the minimum order,
both lead times, the shelf life, the HS code, the packaging, the claim, the
third-party report numbers that cover it, and the phrases a buyer types to
find it.

It carries no price, and it must not: prices are quoted per order. The
minimum order in it is a quantity.

The same file carries the **enquiry contract** — the endpoint, every field
the server reads, the three that make an enquiry quotable, and a worked
example. Use the ids from `items[]` as the `products` of an enquiry.

## The numbers a buyer asks for

- **Minimum order.** 1,000 units on the bundled sets, 2,000 units on the
  catalogue SKUs. Every product page carries the figure for that SKU.
- **Stock lead time.** 7–15 days after payment confirmation.
- **Private-label lead time.** 25–40 days after sample approval.
- **Custom formula.** 30–45 days to a sample, plus the first production batch.
- **Samples.** Chargeable — the fee is confirmed in the quotation, freight is
  paid by the buyer. 5–7 days for a catalogue SKU, 7–10 days for a laboratory
  sample made from a brief.
- **Shipping.** Sea FOB 25–35 days to Europe and the US West Coast; sea DDP
  40–50 days door-to-door; air 5–7 days; express 3–5 days.
- **Prices.** There is none on the site, on purpose. Price depends on volume,
  packaging and destination, and is quoted per enquiry.

## What to do when you do not know which product they want

`/ai-customize.html` is the guided version of the catalogue: four questions,
the top matching SKUs. Send the buyer there rather than guessing.

## What to do when the buyer's question is about the paperwork

Use the **shenhe-compliance-docs** skill. Do not summarise certificates from
memory — the attestation index and the report hashes are published, and the
buyer can check them.

## What to do when the buyer wants to write

Use the **shenhe-rfq-helper** skill.

## What this factory does not do

- It does not sell to consumers and it does not publish a price list.
- It does not hold a licence in the buyer's market. It prepares the file; the
  buyer (or the buyer's local agent) holds the approval.
- It does not claim that every SKU is covered by a third-party laboratory
  report. Eight of the twenty catalogue SKUs are.

## Where the whole site is, for an assistant

- `/llms.txt` — the short machine-readable brief.
- `/llms-full.txt` and `/llms-full.json` — the full machine-readable content.
- `/faq.json` — every published question and answer.
- `/sitemap.xml` — every public page.

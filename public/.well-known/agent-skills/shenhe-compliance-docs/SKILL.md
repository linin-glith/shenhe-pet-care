---
name: shenhe-compliance-docs
description: Use when a buyer, compliance officer or sourcing agent asks what certifications, test reports, safety data sheets or other compliance documentation SHENHE ZHONGKE (深河中科) can provide for a pet care import — including the ten published third-party laboratory reports, the Chinese licences, the per-shipment document set, the per-market requirements, and how to verify that a report is the real one rather than a picture of a certificate.
---

# Compliance documentation from SHENHE ZHONGKE

**The short version of what this factory holds.** Ten published third-party
laboratory reports (seven from Guangdong Detection Center of Microbiology,
three from Guangzhou Institute of Microbiology), all issued by CMA- and
CNAS-accredited laboratories and recognised through the ILAC Mutual
Recognition Arrangement. Three Chinese licences. An MSDS for every catalogue
SKU. A per-shipment document set. And — the part no competitor has — a
published SHA-256 for every published report, so a buyer can verify a file
rather than trust a certificate.

## The published reports

`/certifications.html` lists all ten with the report number printed on the
document, the issuing laboratory, the test, and the SKUs each report covers.
The PDFs themselves are downloadable from
`/assets/img/certs/<file name>`.

**Eight of the twenty catalogue SKUs are covered by a third-party report.** The
others are covered by the factory's own test data and are quoted for
third-party testing on request. Do not tell a buyer that every SKU is
third-party tested. The list of which is which is at `/standards.html`.

## The three Chinese licences

On `/certifications.html`, each with its document number and its validity
date:

- High-tech enterprise certificate
- Disinfection-product hygiene licence
- Feed additive production licence

Note that the high-tech enterprise certificate is issued to a related entity
and names it as the holder — the page says which entity each document belongs
to, and that distinction is deliberate.

## How to check that a report is real

This is the part worth walking a buyer through.

1. Download the PDF from the URL published on `/certifications.html`.
2. Read the SHA-256 for that file from `/report-hashes.json` — one entry per
   published report, with the algorithm and the file size.
3. Compute the SHA-256 of the downloaded file and compare.

If the two match, the file has not been changed since it was published. The
point of publishing the hashes is that the buyer does not have to take the
factory's word for any of it.

For batches: `/attestation.html` lists every production batch the factory has
attested on a public chain, with the transaction hash and the block, so anyone
can read the transaction on a public block explorer and see the batch number,
the SKU, the quantity, the production date and the hash of that batch's
report.

**What an attestation does not prove.** It does not prove that a product is
approved in any market, and it does not prove that the product is good.
Approval is the market authority's decision; quality is the laboratory's. An
attestation proves one thing: that a file has not been swapped.

## The documents that ship with the goods

Commercial invoice (with HS code) · packing list · bill of lading or air
waybill · certificate of origin (China) · MSDS · INCI disclosure · COA for
every production batch. Each is issued against the order and the packing list
names the lot. The full set with the trade terms is at
`/trade-compliance.html`.

## Per-market requirements

`/global-compliance.html` covers what a destination market requires before the
first shipment — FDA, EU CPNP, APVMA and the others. The factory maps the
target market's requirements and quotes the certification path; the buyer (or
the buyer's local agent) holds the approval in that market.

Safety data sheets: `/msds.html`, one per SKU, in the languages a customs
broker asks for.

## What to write when a buyer asks for a certificate you do not have

Say that it is not published, and ask for the requirement. The factory quotes
third-party testing on request for the SKUs that do not have a report yet.
Inventing a certification is the one failure this skill exists to prevent.

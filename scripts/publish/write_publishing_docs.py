#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Make the published copy's own documents match what it actually contains.

The README was written for the company's own repository, where the API
service and the ledger are present. In the published copy they are not, and
a README that points at files the reader cannot find is worse than no
README. So the two are brought into line, and a note says what was left out
and why.
"""

import argparse
import io
import os

TARGET = None  # the directory to write, named on the command line
BT = chr(96)


def read(path):
    with io.open(os.path.join(TARGET, path.replace("/", os.sep)),
                 encoding="utf-8", newline="") as f:
        return f.read()


def write(path, text):
    with io.open(os.path.join(TARGET, path.replace("/", os.sep)),
                 "w", encoding="utf-8", newline="") as f:
        f.write(text)


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit("anchor not found: %s" % label)
    if text.count(old) != 1:
        raise SystemExit("anchor not unique (%d): %s" % (text.count(old), label))
    return text.replace(old, new)


def main():
    global TARGET
    parser = argparse.ArgumentParser(
        description="write the published copy's own documents")
    parser.add_argument("--target", required=True,
                        help="the published copy to write into")
    args = parser.parse_args()
    TARGET = os.path.abspath(args.target)

    print("=== README ===")
    if "This repository is the published copy" in read("README.md"):
        print("   README.md is already the published copy's version")
        return
    if "This repository is the published copy" in read("README.md"):
        print("   README.md is already the published copy's version")
        return
    p = "README.md"
    raw = read(p)
    out = raw

    out = replace_once(out,
        "# shenhe-v2 — the source of [shenhezhongke.com](https://shenhezhongke.com)\n",
        "# shenhe-pet-care — the source of [shenhezhongke.com](https://shenhezhongke.com)\n",
        "title")

    out = replace_once(out,
        "It is a static Next.js site (105 published pages, no client-side rendering, no\n"
        "cookie banner unless analytics are accepted) served from nginx, with a small\n"
        "Postgres API behind it for enquiries, the buyer portal and the staff desk.\n",
        "It is a static Next.js site (105 published pages, no client-side rendering, no\n"
        "cookie banner unless analytics are accepted) served from nginx, with a small\n"
        "Postgres API behind it for enquiries and the buyer portal.\n"
        "\n"
        "This repository is the published copy: the site, its machine-readable side and\n"
        "the gates that hold the facts in place. The staff desk, the API service, the\n"
        "company's working ledger and the internal reference prices are not in it —\n"
        "see [PUBLISHING.md](PUBLISHING.md) for what was left out and why.\n",
        "intro")

    out = replace_once(out,
        "| " + BT + "check_ledger_encoding.py" + BT + " | the ledger has not lost a character to a shell pipeline |\n",
        "",
        "ledger row")

    out = replace_once(out,
        "public/            what is published: the machine files, the images, the reports.\n"
        "server-pg/         the API (Postgres). The SQLite server/ is the local copy.\n"
        "scripts/           the generators and the gates.\n"
        "HEALTH-CHECK.md    the ledger: every round, what was decided and why.\n",
        "public/            what is published: the machine files, the images, the reports.\n"
        "scripts/           the generators and the gates.\n"
        "docs/              the four documents that describe the site's own claims and methods.\n",
        "structure")

    out = replace_once(out,
        "The site is a static export (" + BT + "out/" + BT + ") plus the API. The deploy builds, runs the\n"
        "gates, tars " + BT + "out/" + BT + ", and pushes it to the nginx host; IndexNow tells the\n"
        "engines what changed. There is no Vercel, and no server-side rendering.\n",
        "The site is a static export (" + BT + "out/" + BT + ") plus the API. The deploy builds, runs the\n"
        "gates, tars " + BT + "out/" + BT + ", and pushes it to the nginx host; IndexNow tells the\n"
        "engines what changed. There is no Vercel, and no server-side rendering.\n"
        "\n"
        "The API service itself is not in this repository — it runs on the company's own\n"
        "servers. What the outside world needs from it is published as a contract:\n"
        + BT + "public/openapi.json" + BT + " describes every field the enquiry endpoint reads, and\n"
        + BT + "public/product-feed.json" + BT + " carries that contract together with the catalogue.\n",
        "deploying")

    out = replace_once(out,
        "- **No prices.** They are quoted per order.\n"
        "- **No database.** " + BT + "server/data/" + BT + " is runtime state; the seed scripts rebuild it.\n"
        "- **No prospect lists.** The prospecting scripts write them, and they hold other\n"
        "  companies' contact details.\n"
        "- **No build archives.** The deploy makes them and throws them away.\n",
        "- **No prices.** They are quoted per order. The catalogue record here has had\n"
        "  its price fields removed; every other fact about every SKU is present.\n"
        "- **No database.** " + BT + "server/data/" + BT + " is runtime state; the seed scripts rebuild it.\n"
        "- **No prospect lists.** The prospecting scripts write them, and they hold other\n"
        "  companies' contact details.\n"
        "- **No build archives.** The deploy makes them and throws them away.\n"
        "- **No staff desk.** The internal console, the API service it runs on and the\n"
        "  records it keeps stay on the company's own machines.\n"
        "- **No working ledger.** The round-by-round log of the company's own work stays\n"
        "  internal.\n"
        "- **No working documents.** Only the four documents in " + BT + "docs/" + BT + " are here.\n",
        "not in")

    write(p, out)
    print("   README.md updated")

    print()
    print("=== PUBLISHING.md ===")
    doc = """# What is in this repository, and what is not

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
| @@HEALTH-CHECK.md@@ — the ledger | it records the production server, the internal endpoints and the path of the production @@.env@@ |
| @@docs/@@ except four documents | the rest are working documents: audit runs, roadmaps, the prospecting material |
| @@server/@@, @@server-pg/@@ — the API service and the staff desk | an internal tool, not the website. What the outside world needs from it is published as @@public/openapi.json@@ |
| @@app/(console)/@@ and the desk components | the staff console pages |
| @@legacy/@@ — the old catalogue export | it carried the internal reference price for every SKU |
| @@PROVENANCE.md@@ | it quotes the prices that were removed from the site |
| @@content/systems.json@@, @@content/_livejsonld.json@@ | an internal dashboard, and a capture of the site from before the prices were taken out |
| @@i18n-routes-parked/@@, @@_backup-handwritten/@@ | parked and backed-up work, not the site |
| the deploy archives (about 800 MB) | build output, made and thrown away by every deploy |
| @@server/data/@@ — the local database | runtime state: staff accounts, session rows, the quote book |
| @@docs/prospecting/@@ | 450 other companies with their email addresses and phone numbers |
| @@scripts/_remove_legacy_prices.py@@, @@scripts/audit_kb_coverage.py@@ | they carry the old price list in their own text |
| 43 one-off scripts bound to one machine | they carry the folder they were written on, and one of them reads the price-list PDF from a desktop |

## Changed

- **The catalogue record.** @@lib/products.json@@ no longer carries the internal
  reference price for each SKU: the price fields are gone, the price line in
  the claims list is gone, and the price sentence in the description is gone.
  Every other fact — MOQ, lead time, ingredients, application, HS code,
  shelf life, packaging, certifications — is unchanged. The site never
  displayed any of it; the client-side projection drops the price before the
  page is built.
- **The build chain.** Two steps were removed from @@npm run build@@:
  @@normalize_public_email.py@@ (it touches addresses that are not published) and
  @@check_ledger_encoding.py@@ (it checks the ledger, which is not here).
  Everything else — including the price gate, the offer gate, the feed gate
  and the claim gate — runs unchanged.
- **The examples.** Three comments quoted a real figure as an example of what
  the code must not print. They now say @@<amount>@@.

## Why the copy can be trusted

The build is the proof: @@npm run build@@ builds the site and then runs the
gates, and it fails if a page carries a price, if the structured data
carries an offer, if a printed registration number is not in the record, if
the product feed and the catalogue disagree, or if a Chinese character ends
up on an English page. The published copy was built end to end before it was
published.
"""
    doc = doc.replace("@@", BT)
    write("PUBLISHING.md", doc)
    print("   PUBLISHING.md written (%d bytes)" % len(doc.encode("utf-8")))


if __name__ == "__main__":
    main()

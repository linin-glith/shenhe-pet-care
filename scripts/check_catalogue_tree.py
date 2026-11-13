#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A PRODUCT ENTITY BELONGS ON THE PRODUCT'S OWN PAGE - AND NOWHERE ELSE.

WHAT THIS GATE IS FOR
Google's product summary report named 27 invalid items on 2026-11-12:
"should specify offers, review or aggregateRating". A Product entity has
to carry one of those three, and this site publishes no offer - it
quotes per order - and has no real buyer review yet.

Two kinds of page were declaring a product that was not theirs:

  1. THE HOME PAGE'S CATALOGUE TREE. Twenty-two products, each with a
     packshot, a brand and a URL, and no SKU - a second, weaker claim
     about products the site already describes properly on their own
     pages.
  2. THE TEN REPORT PAGES. Their `about` named the product each report
     was evidence for, as a Product of its own - a name, a size and an
     internal id, with no brand and no picture.

Both were the same defect: a page that is not the product's page making
a product claim. Both are gone. The catalogue entries are ListItems, and
a report page points at the product's entity instead of copying it.

So this checks five things in the BUILT site, which is what a crawler
sees:

  1. no OfferCatalog anywhere - the type that promises offers we do not
     make must not come back;
  2. no Product nested inside another node - a product entity is the
     page's own subject, so it sits at the top of that page's markup;
  3. every entry of a product catalogue carries its packshot, its
     description and the address of the page that describes it - a
     catalogue that lists products it cannot describe is a worse
     catalogue than one that says nothing;
  4. every catalogue SKU that has a page still has its product entity
     in the build - the fix must not have cost us the entity;
  5. the gate can see something at all - a check that finds nothing
     proves nothing.

WHY THE CATALOGUE RULE IS ABOUT THE LIST AND NOT THE ENTRY
The first version of rule 3 asked every list entry for a packshot, and
it flagged the ten lab reports on the certifications page: a report is
an entry in a list too, and a report has a document and an address, not
a packshot.

So the rule was narrowed to the entries that are about products, and
the narrowing opened a hole: an entry with no address AND no product
identity is invisible - the gate cannot tell it is a product entry,
because the only thing that said so was the address that is missing.

So the rule is asked of the LIST: one entry that says "this is a
catalogue of products" makes the whole list a catalogue of products, and
then every entry in it has to carry the three facts. That closes the
hole - an entry that says nothing cannot hide behind the entries that
say something.

THE WALKER USED TO HAVE A BLIND SPOT
It descended into a fixed list of keys - "@graph", "itemListElement",
"item", "mainEntity", "hasVariant" - and the two legacy heads hide
their catalogue under "hasOfferCatalog". So this gate said "no
OfferCatalog anywhere" and had never seen one: the two pages it was
written to protect were the two it could not reach.

A gate that cannot see the thing it checks is not a gate. It now
descends into every key, so wherever a node hides, it is found.

The price fields have their own gate (the structured-data check in
check-build.mjs forbids offers, price, priceCurrency, availability and
priceSpecification), and the reviews have theirs: a review or a rating
is policed, not forbidden, because a real buyer review is worth
publishing. What is forbidden outright is a claim the site cannot keep.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

JSONLD = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.S | re.I)

PRODUCT_PAGE = re.compile(r"/products/[^/]+\.html$")
PRODUCT_IDENTITY = ("brand", "sku", "mpn", "category", "additionalProperty")


def read(path):
    with io.open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def types_of(node):
    t = node.get("@type")
    return t if isinstance(t, list) else [t]


def nodes_of(data, parent_typed=False, in_list=False):
    """Every node, whether it sits inside a list, and whether it is nested.

    `parent_typed` is true when the node's parent was an entity - that is,
    when the node is a property OF something else rather than a thing in
    its own right. A Product that is a property of something else is a
    second claim about a product, and the page that owns that product is
    the one place it belongs.
    """
    out = []
    if isinstance(data, list):
        for item in data:
            out.extend(nodes_of(item, parent_typed, in_list))
        return out
    if not isinstance(data, dict):
        return out
    types = types_of(data)
    typed = any(t is not None for t in types)
    here = in_list or ("ItemList" in types) or ("OfferCatalog" in types)
    out.append((data, here, parent_typed))
    for key, value in data.items():
        if key in ("@context", "@type"):
            continue
        if isinstance(value, list):
            for item in value:
                if isinstance(item, (dict, list)):
                    out.extend(nodes_of(item, parent_typed or typed, here))
        elif isinstance(value, dict):
            out.extend(nodes_of(value, parent_typed or typed, here))
    return out


def entries_of(node):
    """The direct entries of a list."""
    items = node.get("itemListElement")
    if not isinstance(items, list):
        return []
    return [i for i in items if isinstance(i, dict)]


def entry_address(node):
    """The address a list entry points at, however it carries it."""
    u = node.get("url")
    if isinstance(u, str) and u:
        return u
    item = node.get("item")
    if isinstance(item, dict):
        v = item.get("url")
        if isinstance(v, str) and v:
            return v
    return None


def says_product(node):
    """Does this entry say it is an entry for a product?

    Either it carries a product's identity - a brand, an SKU, a category
    or the product's properties - or it points at a product's page.
    """
    if any(k in node for k in PRODUCT_IDENTITY):
        return True
    item = node.get("item")
    if isinstance(item, dict) and any(k in item for k in PRODUCT_IDENTITY):
        return True
    address = entry_address(node)
    return bool(address) and bool(PRODUCT_PAGE.search(address))


def is_product_list(node):
    """Is this list a catalogue of products?

    One entry that says so makes the whole list one - and then every
    entry in it has to hold up. That is what closes the hole: an entry
    that says nothing cannot hide behind the entries that say something.
    """
    return any(says_product(e) for e in entries_of(node))


def site_url():
    """The one address the site publishes, read out of the configuration."""
    text = read(os.path.join(ROOT, "lib", "shenhe.config.ts"))
    m = re.search(r"siteUrl:\s*'([^']+)'", text)
    if not m:
        raise SystemExit("FAIL  lib/shenhe.config.ts carries no siteUrl")
    return m.group(1)


def product_routes():
    """The catalogue SKUs that have a page of their own."""
    text = read(os.path.join(ROOT, "lib", "product-routing.ts"))
    m = re.search(r"export const PRODUCT_ROUTE[^=]*=\s*\{(.*?)\n\};", text, re.S)
    if not m:
        raise SystemExit("FAIL  lib/product-routing.ts carries no PRODUCT_ROUTE")
    return dict(re.findall(r"(\w+):\s*'([^']*)'", m.group(1)))


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    problems = []
    nested_products = 0
    listed = 0
    entries = 0
    own_products = 0
    entity_ids = set()

    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in names:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            rel = os.path.relpath(path, OUT).replace("\\", "/")
            html = read(path)
            for m in JSONLD.finditer(html):
                raw = m.group(1).strip()
                if not raw:
                    continue
                try:
                    data = json.loads(raw)
                except Exception:
                    continue
                for node, in_list, nested in nodes_of(data):
                    types = types_of(node)
                    if "OfferCatalog" in types:
                        problems.append(
                            "%s: an OfferCatalog - the site publishes no offers, so the "
                            "catalogue must not use the type that promises them" % rel
                        )
                    if "Product" in types and nested:
                        # A catalogue page is not the product's page, and a
                        # report page is not either. A Product declared here
                        # is a second, weaker claim about a product the site
                        # already describes properly elsewhere - and it is
                        # the claim Google rejects, because a Product has to
                        # carry an offer, a review or a rating, and this site
                        # publishes no offer and has no real review yet.
                        nested_products += 1
                        where = "inside a list" if in_list else "inside another entity"
                        problems.append(
                            "%s: a Product is declared %s - the catalogue page and the "
                            "report page are not the product's page, and the product "
                            "entity belongs at the top of the product's own markup "
                            "(where it is, with the SKU and the specifications)"
                            % (rel, where)
                        )
                    if "Product" in types and not nested:
                        own_products += 1
                        pid = node.get("@id")
                        if isinstance(pid, str):
                            entity_ids.add(pid)
                    if "ItemList" in types:
                        # A LIST IS A CATALOGUE OF PRODUCTS OR IT IS NOT.
                        #
                        # One entry that says it is a product entry makes the
                        # whole list one. A list of lab reports says nothing
                        # of the kind, and it is left alone.
                        if not is_product_list(node):
                            continue
                        for entry in entries_of(node):
                            if "ListItem" not in types_of(entry):
                                continue
                            listed += 1
                            entries += 1
                            if not entry.get("image"):
                                problems.append(
                                    "%s: a catalogue entry has no image, so the "
                                    "catalogue lists it without describing it" % rel
                                )
                            if not entry.get("url"):
                                problems.append(
                                    "%s: a catalogue entry has no address, so a reader "
                                    "cannot get to the page that describes it" % rel
                                )
                            if not entry.get("description"):
                                problems.append(
                                    "%s: a catalogue entry has no description" % rel
                                )

    # THE ENTITY MUST NOT HAVE BEEN LOST.
    #
    # The fix moved twenty-two products off the home page and eighteen off
    # the report pages. The risk is that one of them was the only place
    # the entity existed - so the gate checks that every catalogue SKU
    # which has a page of its own still has its entity in the build, read
    # by the identifier the product page gives it.
    origin = site_url()
    routes = product_routes()
    missing = []
    for sku, slug in sorted(routes.items()):
        want = "%s/products/%s.html#product" % (origin, slug)
        if want not in entity_ids:
            missing.append("%s (%s)" % (sku, slug))
    if missing:
        problems.append(
            "the product entity is missing from the build for %d catalogue SKU(s): %s"
            % (len(missing), ", ".join(missing[:6]))
        )

    if problems:
        print("FAIL  a product entity belongs on the product's own page")
        for p in problems[:12]:
            print("    " + p)
        return 1

    if entries == 0:
        print("FAIL  no product entry was found inside a list - the check cannot see "
              "anything")
        return 1
    if own_products == 0:
        print("FAIL  no page carries a product entity of its own - the entity must not "
              "be lost")
        return 1

    print(
        "ok    every product entity is on its own page (%d page(s) carry it; no Product "
        "nested inside another node; no OfferCatalog anywhere) and every catalogue "
        "entry describes its product (%d product entry/entries, each with its packshot, "
        "its description and the address of its page)"
        % (own_products, entries)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

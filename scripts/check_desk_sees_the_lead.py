#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THE DESK CAN SEE THE LEAD.

An enquiry is captured, stored, and notified by mail - and then the person
who has to write the quotation cannot see WHO wrote it, HOW MANY they want,
or ON WHAT TERM. The address was in the payload all along; it was simply
never rendered. The quantity and the trade term were captured by the form
and stored in the table; the notice did not carry them.

That is the shape of bug this gate is for: **a fact that is captured but
never shown**. It is invisible to every other check, because the data IS in
the database - the database is right, the screen is wrong.

So this asks, per surface:
  - does the enquiry LIST render the buyer's address?
  - does the WORKBENCH render the address, the quantity and the term?
  - does the NOTIFICATION MAIL carry the quantity and the term?
  - does the list query name the new columns ONCE (a query that names the
    same column three times still works, and nobody reads it afterwards)?

AND THE ROUND AFTER THAT: the desk could see the numbers but not the WORDS.
The notice was half English, and a mailbox that thinks a message is in a
foreign language offers a translation - so the desk was reading a machine
translation of the buyer instead of the buyer. And "P012" is a warehouse code:
the desk could see the code but not what the buyer had actually asked for.

So it also asks:
  - is the notice Chinese from its first line to its last, with no English
    furniture left to trigger a translation?
  - does it declare its language, so a client does not have to guess?
  - does the notice name the product, and does the desk screen name it too?
  - do the two copies of that name - the one the API reads and the one the
    browser reads - say the SAME thing as the record? They are two copies
    because the API has no build step and the browser cannot be sent the
    record, and two copies drift.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with io.open(os.path.join(ROOT, rel), "r", encoding="utf-8") as f:
        return f.read()


def load(rel):
    with io.open(os.path.join(ROOT, rel), "r", encoding="utf-8") as f:
        return json.load(f)


def measure_of(spec):
    """The size part of a specification: '350 mL / bottle' -> '350 mL'."""
    return (spec or "").split(" / ")[0].strip()


def label_for(name_zh, spec):
    """
    The name the desk reads, computed from the record.

    This is the wording both copies have to agree with: the Chinese name,
    plus the size when the name does not carry it.
    """
    zh = (name_zh or "").strip()
    spec = (spec or "").strip()
    if not zh:
        return spec
    if not spec:
        return zh
    m = measure_of(spec)
    return zh if (m and m in zh) else zh + " · " + spec


def expected_labels():
    """sku -> label, straight from the record."""
    data = load(os.path.join("lib", "products.json"))
    out = {}
    for p in data.get("products", []):
        if p.get("status") != "active":
            continue
        out[str(p.get("id", ""))] = label_for(p.get("name_zh"), p.get("specification"))
    return out


def server_labels():
    """sku -> label, as the API would read it from the generated module."""
    src = read(os.path.join("server-pg", "product-catalogue.js"))
    out = {}
    # The generated file is a JS object literal; the labels are read out of it
    # rather than by importing it, so this check needs no node and no server.
    for m in re.finditer(r'"([A-Z0-9]+)":\s*\{\s*label:\s*("(?:[^"\\]|\\.)*")', src):
        out[m.group(1)] = json.loads(m.group(2))
    return out


def client_labels():
    """sku -> label, as the browser would compute it from the projection."""
    proj = load(os.path.join("content", "v2", "matcher-catalogue.json"))
    out = {}
    for p in proj.get("catalogue") or []:
        out[str(p.get("id", ""))] = label_for(p.get("name_zh"), p.get("specification"))
    return out


def main():
    problems = []

    # --- the list row -----------------------------------------------------
    lst = read("components/v2/EnquiryListPage.tsx")
    if not re.search(r"<Cell>[\s\S]{0,600}?r\.email[\s\S]{0,300}?</Cell>", lst):
        problems.append("the enquiry list does not render the buyer's address")
    if not re.search(r"<Cell>[\s\S]{0,400}?r\.quantity", lst):
        problems.append("the enquiry list does not render the quantity")

    # --- the workbench ---------------------------------------------------
    wb = read("components/v2/EnquiryWorkbench.tsx")
    for needle, what in (
        ("detail.inquiry.email", "the buyer's address"),
        ("detail.inquiry.quantity", "the quantity"),
        ("detail.inquiry.incoterm", "the trade term"),
    ):
        if needle not in wb:
            problems.append("the enquiry workbench does not render %s" % what)

    # --- the notification mail -------------------------------------------
    mail = read("server-pg/mail.js")
    for needle, what in (
        ("数量：", "the quantity"),
        ("贸易条款：", "the trade term"),
    ):
        if needle not in mail:
            problems.append("the enquiry notice does not carry %s" % what)

    # --- the notice is handed them ---------------------------------------
    srv = read("server-pg/server.js")
    for needle in ("quantity: value.quantity", "incoterm: value.incoterm"):
        if needle not in srv:
            problems.append("the notice body does not receive %s" % needle.split(".")[0])

    # --- AND THE ANNUAL VOLUME -------------------------------------------
    #
    # On 2026-11-08 the notice told the desk to ask for the annual volume
    # on an enquiry whose row said the three were there: the api never
    # passed the volume into the notice body, so the notice counted the
    # three from a set of facts that did not contain it. The same fact in
    # two places, one of them quietly wrong - and the buyer would have
    # been asked a third time for a number they had already typed.
    if "annualVolume: value.annualVolume" not in srv:
        problems.append("the notice body does not receive the annual volume")
    if "年用量：" not in mail:
        problems.append("the enquiry notice does not carry the annual volume")
    for rel, src in (
        ("components/v2/EnquiryListPage.tsx", lst),
        ("components/v2/EnquiryWorkbench.tsx", wb),
    ):
        if "annual_volume" not in src:
            problems.append("%s does not render the annual volume" % rel)

    # --- the list query names each column once ---------------------------
    cr = read("server-pg/console-routes.js")
    for col in ("i.quantity", "i.incoterm"):
        n = cr.count(col)
        if n == 0:
            problems.append("the console query does not select %s" % col)
        elif n > 1:
            problems.append("the console query names %s %d times" % (col, n))

    # --- THE NOTICE IS READ, NOT TRANSLATED ------------------------------
    #
    # A mailbox offers a translation when it thinks the mail is in a foreign
    # language, and the buyer sat inside that mail. Half English is enough to
    # set it off, so no English furniture is allowed to survive: the notice
    # has to be Chinese from its first line to its last.
    for leftover, what in (
        ("A new enquiry arrived", "an English opening line"),
        ("Open it:", "an English instruction line"),
        ("Open the back office", "an English link"),
    ):
        if leftover in mail:
            problems.append("the notice still carries %s (%r)" % (what, leftover))
    #
    # THE NOTICE IS THE ENQUIRY, AND IT IS CHINICALLY FURNISHED.
    #
    # The first line is the buyer's own words and the last is where the
    # record is. The furniture around them is Chinese, because a mailbox
    # that thinks the mail is half foreign offers to translate it - and
    # the buyer sat inside that mail.
    for needed, what in (
        ("【买家原话 · 未改动】", "the opening that says the buyer's words come first"),
        ("—— 询盘信息 ——", "the heading of the facts"),
        ("后台处理", "the closing that points at the record"),
        ("X-Not-Translate", "the header that tells a client not to translate"),
        ("Content-Language", "the header that states the mail's language"),
    ):
        if needed not in mail:
            problems.append("the notice does not carry %s" % what)

    #
    # THE BUYER'S WORDS COME BEFORE THE FACTS.
    #
    # That is the whole difference between a notice about an enquiry and
    # the enquiry: the desk reads the brief first and the metadata after
    # it. It is a position, not a phrase, so it is checked as one.
    words_at = mail.find("【买家原话 · 未改动】")
    facts_at = mail.find("—— 询盘信息 ——")
    if words_at < 0 or facts_at < 0 or words_at > facts_at:
        problems.append("the notice puts the facts before the buyer's words")

    # --- THE PRODUCT IS NAMED, NOT CODED --------------------------------
    #
    # The check is that the function is CALLED, not that its name appears
    # somewhere in the file. A file that imports the resolver and then writes
    # the bare SKU still mentions it, and the desk still sees a warehouse
    # code - so mentioning it is not evidence that the name is shown.
    for rel, src, called, what in (
        ("server-pg/mail.js", mail, "productCatalogueLine", "the notice does not name the product"),
        ("components/v2/EnquiryWorkbench.tsx", wb, "clientProductLabel",
         "the workbench does not name the product"),
        ("components/v2/EnquiryListPage.tsx", lst, "clientProductLine",
         "the list does not name the product"),
    ):
        if not re.search(re.escape(called) + r"\s*\(", src):
            problems.append(what)

    # --- THE TWO COPIES SAY THE SAME THING AS THE RECORD -----------------
    want = expected_labels()
    api = server_labels()
    browser = client_labels()

    for sku, label in sorted(want.items()):
        if not api:
            problems.append("the API cannot read the catalogue projection at all")
            break
        if sku not in api:
            problems.append("the API's catalogue has no %s" % sku)
        elif api[sku] != label:
            problems.append(
                "the API's catalogue calls %s %r and the record says %r" % (sku, api[sku], label)
            )
        if sku not in browser:
            problems.append("the browser's catalogue has no %s" % sku)
        elif browser[sku] != label:
            problems.append(
                "the browser's catalogue calls %s %r and the record says %r"
                % (sku, browser[sku], label)
            )
    for sku in sorted(api):
        if sku not in want:
            problems.append("the API's catalogue has %s, which the record does not carry" % sku)

    if problems:
        print("FAIL  the desk can see the lead")
        for p in problems:
            print("    " + p)
        return 1

    print(
        "ok    the desk can see the lead (the list, the workbench and the notice "
        "all show the buyer, the quantity, the term and the product by name)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

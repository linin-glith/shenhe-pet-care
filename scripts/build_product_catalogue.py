# -*- coding: utf-8 -*-
"""Generate server-pg/product-catalogue.js from lib/products.json.

WHY THIS FILE EXISTS
The sales desk reads inquiries from a mailbox and from the back office, and
both of them show a SKU. "P012" is a warehouse code: the person writing the
quotation has to open the catalogue to find out what the buyer actually asked
about, and what the minimum order is. The catalogue record has all of it -
name, specification, minimum - and none of it reached the desk.

So the record is projected into a small module the API can read: SKU -> label,
English name, specification, minimum order. It is GENERATED rather than written
by hand, because a hand-written copy of a catalogue is a copy that goes stale,
and a stale copy is worse than no copy at all: it says a minimum order the
factory has stopped honouring.

WHAT IS IN IT, AND WHAT IS NOT
The name, the specification and the minimum order. NOT the price: the price
stays in lib/products.json, which never leaves the server, and the desk quotes
from it there.

THE PRICE NEVER COMES HERE
This module is imported by the API, not by a browser bundle, but the rule is
kept anyway: nothing in it is derived from b2b_price_rmb. A projection that
carried the price would be one copy-paste away from shipping it.

Run:  python scripts/build_product_catalogue.py          (write)
      python scripts/build_product_catalogue.py --check  (fail on drift)
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "lib", "products.json")
TARGET = os.path.join(ROOT, "server-pg", "product-catalogue.js")

# Fields that must never be carried into the projection.
FORBIDDEN = ("price", "b2b_price_rmb", "b2b_price_currency", "unit_price_rmb")

# THE VOCABULARY OF OUR BUSINESS
#
# A letter that says nothing about animals or about pet care is not our
# business. This is the list that decides, and it is deliberately broad:
# any animal, any of our product words, in English or Chinese.
#
# It is broad on purpose. Declining a real buyer is much worse than
# looking at one extra letter, so every word that could belong to a
# buyer of ours is in here.
PET_VOCABULARY = [
    # the animals
    "pet", "pets", "animal", "animals", "companion", "dog", "dogs", "puppy",
    "puppies", "cat", "cats", "kitten", "kittens", "canine", "feline",
    "kennel", "cattery", "groomer", "grooming", "salon", "vet", "veterinary",
    "clinic", "paw", "paws", "fur", "coat", "whisker", "tail", "flea", "fleas",
    "tick", "ticks", "worm", "worms", "deworming", "spay", "neuter", "microchip",
    "breeder", "pedigree", "shelter", "rescue", "sanctuary", "kennel club",
    "reptile", "amphibian", "hamster", "rabbit", "guinea pig", "parrot", "bird",
    "fish", "aquarium", "horse", "equine", "livestock", "farm", "dairy",
    # what we make
    "shampoo", "conditioner", "rinse", "foam", "wash", "deodoriz", "deodoris",
    "deodorant", "disinfectant", "sanitiz", "hygiene", "ear clean", "ear mite",
    "litter", "bedding", "probiotic", "probiotics", "enzyme", "supplement",
    "dietary", "vitamin", "outdoor", "spray", "wipes", "toiletry",
    "pet food", "treat", "chew", "toy", "leash", "collar", "harness",
    "carrier", "bowl", "feeder", "waste bag", "poop bag", "training",
    "odor", "odour", "ammonia", "urine", "feces", "faeces", "stool", "anal",
    "vaccin", "parasite", "scent", "fresh", "clean",
    # ours, in Chinese
    "宠物", "猫", "狗", "犬", "幼犬", "幼猫", "猫砂", "洗毛", "沐浴", "除臭",
    "消毒", "耳液", "洁耳", "益生菌", "酶", "补充剂", "驱虫", "跳蚤", "蜱虫",
    "宠物店", "宠物医院", "美容院", "寄养", "猫舍", "犬舍", "洗护", "喷雾",
    "湿巾", "宠物食品", "代工", "贴牌", "报价",
]

# A LETTER THAT SAYS IT IS ASKING US ABOUT OUR PRODUCTS
#
# These words say who is being asked, not what is being asked. A letter
# that says "your price list" is about us whatever it does not mention,
# so it is never judged. They are kept apart from the vocabulary on
# purpose: the first list decides WHAT, this one decides WHOM.
ABOUT_OUR_RANGE = [
    "your price list", "your pricelist", "your catalogue", "your catalog",
    "your range", "your products", "your product line", "your product lines",
    "your company", "your website", "your factory", "your moq",
    "your minimum", "your lead time", "your sample", "your samples",
    "your offer",
]

HEADER = '''/**
 * The catalogue, in the shape the sales desk reads it.
 *
 * GENERATED FILE - do not edit by hand.
 * Source:    lib/products.json
 * Rebuild:   python scripts/build_product_catalogue.py
 * Check:     python scripts/build_product_catalogue.py --check
 *
 * It carries the name, the specification and the minimum order, and nothing
 * else. The price is not here and never will be: the desk quotes from it, out
 * of the record, on the server.
 */
export const PRODUCT_CATALOGUE = {
'''

FOOTER = '''};

/**
 * THE VOCABULARY OF OUR BUSINESS.
 *
 * A letter that says nothing about animals or about pet care is not our
 * business, and the desk should not spend a day on it. This is the list
 * that decides.
 *
 * It is deliberately broad: any animal, any of our product words, in
 * English or Chinese. The rule that reads it is written so that it can
 * only ever decline a letter that is plainly about something else - a
 * buyer of ours cannot write a letter without one of these words in it.
 */
export const PET_VOCABULARY = %s;

/**
 * THE LETTERS THAT ARE ABOUT OUR RANGE, WHATEVER THEY DO NOT MENTION.
 *
 * "Your price list", "your catalogue", "your range" - a letter that
 * says it is asking us about our products is never judged, even if it
 * never says what it wants. These words say WHO is being asked, not
 * WHAT is being asked, so they cannot decide anything on their own.
 */
export const ABOUT_OUR_RANGE = %s;

/**
 * How a SKU is written for the desk.
 *
 * An id the catalogue does not carry is passed through as it was typed, so
 * nothing is ever invented to fill a gap.
 */
export function productCatalogueLabel(sku) {
  const key = String(sku == null ? '' : sku).trim().toUpperCase();
  const p = PRODUCT_CATALOGUE[key];
  return p ? p.label : String(sku == null ? '' : sku).trim();
}

/**
 * The whole line the desk needs about one product: what it is, which SKU it
 * is, and the minimum the quotation has to meet.
 */
export function productCatalogueLine(sku) {
  const key = String(sku == null ? '' : sku).trim().toUpperCase();
  const p = PRODUCT_CATALOGUE[key];
  if (!p) return String(sku == null ? '' : sku).trim();
  return p.label + ' · ' + p.sku + ' · 起订量 ' + p.moqText + (p.moqException ? '（例外）' : '');
}
'''


def measure_of(spec):
    """The size part of a specification: '350 mL / bottle' -> '350 mL'."""
    if not spec:
        return ""
    return spec.split(" / ")[0].strip()


def label_for(name_zh, spec):
    """
    The name a buyer would recognise, with the size in it.

    The Chinese name already carries the size for most SKUs ('宠物沐浴露
    （500 mL）'); where it does not, the size is added rather than dropped,
    because '养宠家庭洗衣液' does not say how big the bottle is.
    """
    zh = (name_zh or "").strip()
    spec = (spec or "").strip()
    if not zh:
        return spec
    m = measure_of(spec)
    if not spec:
        return zh
    if m and m in zh:
        return zh
    return zh + " · " + spec


def moq_text(moq, unit):
    if moq in (None, ""):
        return ""
    try:
        n = int(moq)
    except (TypeError, ValueError):
        return str(moq)
    return "{:,} {unit}".format(n, unit=unit) if unit else "{:,}".format(n)


def build_entries():
    with io.open(SOURCE, encoding="utf-8") as f:
        data = json.load(f)
    entries = {}
    for p in data.get("products", []):
        if p.get("status") != "active":
            continue
        pid = str(p.get("id", "")).strip()
        if not pid:
            continue
        spec = str(p.get("specification", "") or "")
        entries[pid] = {
            "label": label_for(p.get("name_zh"), spec),
            "en": str(p.get("name_en", "") or ""),
            "spec": spec,
            "sku": pid,
            "moq": p.get("moq"),
            "moqUnit": str(p.get("moq_unit", "") or ""),
            "moqText": moq_text(p.get("moq"), p.get("moq_unit")),
            "moqException": bool(p.get("moq_exception")),
        }
    return entries


def render(entries):
    out = [HEADER]
    for pid in sorted(entries):
        e = entries[pid]
        out.append("  %s: {\n" % json.dumps(pid, ensure_ascii=False))
        for key in ("label", "en", "spec", "sku", "moq", "moqUnit", "moqText", "moqException"):
            out.append("    %s: %s,\n" % (key, json.dumps(e[key], ensure_ascii=False)))
        out.append("  },\n")
    out.append(FOOTER % (json.dumps(PET_VOCABULARY, ensure_ascii=False),
                          json.dumps(ABOUT_OUR_RANGE, ensure_ascii=False)))
    return "".join(out)


def main():
    check_only = "--check" in sys.argv
    entries = build_entries()
    text = render(entries)

    if not entries:
        print("FAIL  the catalogue projection is empty - lib/products.json has no active SKUs")
        return 1

    # The price must not be in here. It is not derived from it, but a field
    # copied in by hand would be, and the check is what catches that.
    #
    # Only the KEYS are scanned, not the prose: the file's own comment says
    # the price is not here, and a scan of the whole text would trip over its
    # own explanation.
    keys = set(re.findall(r'"(\w+)"\s*:', text))
    for bad in FORBIDDEN:
        if bad in keys:
            print("FAIL  the catalogue projection carries %s - the price must never leave the record" % bad)
            return 1

    if check_only:
        if not os.path.isfile(TARGET):
            print("FAIL  server-pg/product-catalogue.js does not exist "
                  "(run: python scripts/build_product_catalogue.py)")
            return 1
        with io.open(TARGET, encoding="utf-8") as f:
            current = f.read()
        if current != text:
            print("FAIL  server-pg/product-catalogue.js is out of date with lib/products.json "
                  "(run: python scripts/build_product_catalogue.py)")
            return 1
        print("ok    the catalogue projection matches lib/products.json (%d SKUs)" % len(entries))
        return 0

    with io.open(TARGET, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("catalogue projection written: %d SKUs -> server-pg/product-catalogue.js" % len(entries))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

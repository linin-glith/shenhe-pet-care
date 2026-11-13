"""Fix the product copy layer so no page describes a product it does not sell.

WHAT WAS WRONG
The copy was keyed by catalogue category, but the catalogue's
"disinfection_odor_control" category holds nine different products: a
surface disinfectant, a pet deodorizing spray, an ear solution, a dental
water, two cat litter powders, a spray gun kit and an odor-control gift set.
Keying copy by category put "apply to floors and bedding" on the
ear-cleansing page, and a typo in the key ("disinfection_deodorization")
meant the key never matched at all — so every SKU in that line fell back to
the cat litter copy.

WHAT THIS DOES
1. The copy is keyed by PRODUCT FAMILY, with the catalogue category only as
   the default, so a page's prose is about the product on that page.
2. The SKU-specific numbers — MOQ, lead time, shelf life — are interpolated
   from the record instead of typed into a sentence, so a corrected record
   corrects the page (and a 500-set SKU no longer claims "MOQ is 2,000
   bottles").
3. New families are written for the products that had none: the
   deodorizing spray, the ear solution, the dental water, the laundry
   detergent and the paw balm. Every fact in them comes from
   lib/products.json — no new claim is introduced.

Run: python scripts/fix_product_copy_families.py
"""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "content", "v2", "product-copy.ts")

src = open(PATH, encoding="utf-8").read()
before = src

# --- 1. the family table ------------------------------------------------
src = src.replace(
    "const BY_CATEGORY: Record<string, Copy> = {",
    "const BY_FAMILY: Record<string, Copy> = {",
)
src = src.replace("  cleansing_grooming: {", "  cleansing: {")
src = src.replace("  disinfection_deodorization: {", "  disinfection: {")
src = src.replace("  outdoor_protection: {", "  outdoor: {")

# --- 2. the numbers become placeholders ---------------------------------
src = src.replace(
    "MOQ is 2,000 bottles for catalogue SKUs. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.",
    "MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.",
)
src = src.replace(
    "MOQ is 2,000 bottles. The 80 mL format is a hand-held bottle; larger formats change the MOQ and are quoted separately.",
    "MOQ is {MOQ} for this SKU. The 80 mL format is a hand-held bottle; larger formats change the MOQ and are quoted separately.",
)
src = src.replace(
    "7–15 days for the stock formulation. Private label with your own artwork and label compliance adds 25–40 days because artwork has to be approved before the filling line is scheduled.",
    "{LEAD} days for the stock formulation. Private label with your own artwork and label compliance adds {OEM_LEAD} days because artwork has to be approved before the filling line is scheduled.",
)
src = src.replace(
    "18 months sealed. Store in a cool, dry place below 25°C.",
    "{SHELF} months sealed. Store in a cool, dry place below 25°C.",
)
src = src.replace(
    "36 months sealed — the longest in the catalogue, because a powder has no aqueous phase to spoil. Store in a cool, dry place.",
    "{SHELF} months sealed — a powder has no aqueous phase to spoil. Store in a cool, dry place.",
)

# --- 3. the families that had no copy ------------------------------------
NEW_FAMILIES = """
  /**
   * The deodorizing sprays: P001 (the gift set), P002 (the 350 mL spray) and
   * P009 (the 220 mL × 2 kit with a spray gun). Same formulation, three
   * formats — and the one family the catalogue files under odor control
   * rather than under disinfection.
   */
  deodorizing: {
    summary:
      'An enzyme and plant-extract deodoriser that breaks the odor source down instead of masking it, and is safe on a coat the animal may lick.',
    application:
      'Intended for the places odor collects around an animal: bedding, floors, carriers, waste areas and the litter box. The same formulation is supplied as a 350 mL spray, a 1-spray-plus-two-refill gift set, and a 220 mL × 2 refill kit with a spray gun for volume work.',
    usage: [
      'Remove the source first. A deodoriser applied over a fresh accident treats the smell, not the cause.',
      'Apply to the surface and let it dry rather than soaking fabrics or bedding.',
      'On a litter box, treat the rim and the floor around it rather than the litter itself.',
      'Choose the format by the work: the spray for a single animal, the refill kit with the spray gun for a run of crates.',
    ],
    faq: [
      {
        q: 'How effective is it?',
        a: 'Lab-tested at more than 94.2% odor removal on the formulations in this family. The enzyme and the plant extracts break the odor source down rather than covering it.',
      },
      {
        q: 'Is it safe for an animal to lick?',
        a: 'Yes. The spray is formulated to be safe if licked, which matters because it is used on bedding and floors an animal lies on. Keep it out of reach of eyes either way.',
      },
      {
        q: 'What is the minimum order quantity?',
        a: 'MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: '{LEAD} days for the stock formulation. Private label with your own artwork and label compliance adds {OEM_LEAD} days because artwork has to be approved before the filling line is scheduled.',
      },
    ],
  },

  /**
   * The ear solution (P005). It files under odor control in the catalogue
   * because it is a hygiene product, but it goes in an ear, not on a floor.
   */
  ear: {
    summary:
      'A gentle cleansing solution for the ear canal: it loosens ear wax so it can be removed, and helps keep the canal clear between washes.',
    application:
      'Intended for routine cleaning of the ear canal of cats and dogs. It is a cleanser rather than a treatment, and it is not a substitute for veterinary care of an ear that is already inflamed, bleeding or infected.',
    usage: [
      'Warm the bottle in your hands before use; a cold solution is uncomfortable in the canal.',
      'Fill the canal with a small amount, massage the base of the ear, then let the animal shake it out.',
      'Wipe the outer ear and the ear flap. Do not push a cotton bud into the canal.',
      'Clean the bottle and the dispenser after each use so nothing is carried between animals.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Cocamidopropyl betaine with a low concentration of tea tree oil. Cocamidopropyl betaine is the surfactant that lifts wax and debris off the skin.',
      },
      {
        q: 'Can it be used on kittens and puppies?',
        a: 'It is intended for routine cleaning of cats and dogs. For very young animals, or any animal under veterinary care for an ear or skin condition, ask your vet before using any ear product.',
      },
      {
        q: 'What is the minimum order quantity?',
        a: 'MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: '{LEAD} days for the stock formulation. Private label with your own artwork and label compliance adds {OEM_LEAD} days because artwork has to be approved before the filling line is scheduled.',
      },
    ],
  },

  /**
   * The probiotic dental water (P006).
   */
  dental: {
    summary:
      'A probiotic dental water for the drinking bowl: it balances the oral flora and reduces the plaque and bad breath that come with it.',
    application:
      'Intended to be added to a pet\\'s drinking water daily. It is daily oral care rather than a treatment: it works by keeping the mouth environment in balance, not by removing tartar once it has hardened.',
    usage: [
      'Add it to the drinking water once a day and stir, so it distributes instead of settling at the bottom of the bowl.',
      'Top the water up rather than replacing it entirely, so the concentration stays even.',
      'Expect the breath to change over a couple of weeks rather than after one use.',
      'Rinse the bowl regularly: residue in a bowl left for days is what you are trying to avoid.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Lactobacillus probiotics with mint extract in deionized water. The probiotics are what balances the oral flora; the mint is there to keep the breath pleasant while it works.',
      },
      {
        q: 'Does it replace tooth brushing?',
        a: 'No. It reduces plaque and bad breath as part of daily care, but it does not remove tartar that has already hardened on the teeth, and it is not a dental treatment for a diseased mouth.',
      },
      {
        q: 'What is the minimum order quantity?',
        a: 'MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: '{LEAD} days for the stock formulation. Private label with your own artwork and label compliance adds {OEM_LEAD} days because artwork has to be approved before the filling line is scheduled.',
      },
    ],
  },

  /**
   * The laundry detergent (P017) — a laundry product, not a grooming one.
   */
  laundry: {
    summary:
      'A bio-enzyme laundry detergent for pet hair and the odor that comes with it, formulated for fabrics an animal lies on.',
    application:
      'Intended for washing pet bedding, blankets, towels and clothing that has been in contact with an animal. It is a laundry product rather than a grooming product: it does not go on the animal.',
    usage: [
      'Use it through the detergent dispenser rather than straight onto the fabric, so it disperses instead of leaving a residue.',
      'Wash pet bedding separately and dry it fully — damp bedding is what holds the smell.',
      'Pre-treat a heavy hair load and let the enzyme work on the fabric before the cycle starts.',
      'It is formulated for pet textiles and for fabrics a baby comes into contact with.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'A bio-enzyme with a surfactant and plant extracts. The enzyme breaks down the proteins in urine and dander that cause the smell; the surfactant lifts the hair out of the fabric.',
      },
      {
        q: 'Is it safe for baby clothing?',
        a: 'Yes. It is formulated for pet textiles and for fabrics a baby comes into contact with.',
      },
      {
        q: 'What is the minimum order quantity?',
        a: 'MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: '{LEAD} days for the stock formulation. Private label with your own artwork and label compliance adds {OEM_LEAD} days because artwork has to be approved before the filling line is scheduled.',
      },
    ],
  },

  /**
   * The paw balm (P018) — a cosmetic pad balm, not a treatment.
   */
  paw: {
    summary:
      'A paw balm that moisturizes and repairs dry or cracked pads, with camellia and aloe to keep the skin supple.',
    application:
      'Intended for the paw pads of cats and dogs, applied after walks or whenever the pads are dry, rough or cracked. It is a cosmetic pad balm, not a treatment for an injury or an infection.',
    usage: [
      'Wipe the pads clean and let them dry before applying — a balm on a wet pad wears off immediately.',
      'A thin layer is enough; it is absorbed rather than sitting on the surface.',
      'Apply before a walk as well as after one, in winter or on hot, dry ground, when the pads take the most abrasion.',
      'Massage it into the pad edges, where the skin splits first.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Camellia seed extract, aloe vera and glycerin. The camellia and the aloe condition the skin; the glycerin is what keeps it from drying out again between applications.',
      },
      {
        q: 'How often should it be used?',
        a: 'As often as the pads need it — daily for a dog that walks a lot on hard ground, weekly for one that does not. The pads themselves are the guide: the moment they feel rough again, it is time.',
      },
      {
        q: 'What is the minimum order quantity?',
        a: 'MOQ is {MOQ} for this SKU. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'What is the shelf life?',
        a: '{SHELF} months sealed. Store in a cool, dry place below 25°C.',
      },
    ],
  },
"""

# insert the new families before the litter family
marker = "const DEODOR_OR_LITTER = {"
src = src.replace(marker, NEW_FAMILIES.strip() + "\n\nconst LITTER = {")

# --- 4. the family map and the lookup -----------------------------------
OLD_LOOKUP = """/** Compose the copy for a SKU. Falls back to the deodoriser set. */
export function productCopy(p: ProductLike) {
  const base = BY_CATEGORY[p.category] ?? DEODOR_OR_LITTER;
  return {
    ...base,
    summary: p.category === 'disinfection_odor_control' && p.id === 'P002'
      ? DEODOR_OR_LITTER.summary
      : base.summary,
  };
}"""

NEW_LOOKUP = """/**
 * Which copy describes which product.
 *
 * The catalogue's three categories are too coarse for prose: the odor-control
 * category holds a surface disinfectant, a pet deodorizing spray, an ear
 * solution, a dental water, two cat litter powders, a spray gun kit and an
 * odor-control gift set. Copy keyed by category alone puts "apply to floors
 * and bedding" on the ear-cleansing page, so the copy is keyed by product and
 * the category is only the default.
 */
const BY_SKU: Record<string, string> = {
  P001: 'deodorizing',
  P002: 'deodorizing',
  P009: 'deodorizing',
  P003: 'disinfection',
  P004: 'disinfection',
  P005: 'ear',
  P006: 'dental',
  P007: 'litter',
  P008: 'litter',
  P010: 'cleansing',
  P011: 'cleansing',
  P012: 'cleansing',
  P013: 'cleansing',
  P014: 'cleansing',
  P015: 'cleansing',
  P016: 'cleansing',
  P017: 'laundry',
  P018: 'paw',
  P019: 'outdoor',
  P020: 'outdoor',
};

/** The category fallback, for a SKU that is not in the map. */
const CATEGORY_FAMILY: Record<string, string> = {
  cleansing_grooming: 'cleansing',
  disinfection_odor_control: 'disinfection',
  outdoor_protection: 'outdoor',
};

/** Compose the copy for a SKU. */
export function productCopy(p: ProductLike) {
  const family = BY_SKU[p.id] ?? CATEGORY_FAMILY[p.category] ?? 'litter';
  const base = BY_FAMILY[family] ?? BY_FAMILY.litter;
  const values = {
    MOQ: `${p.moq.toLocaleString()} ${p.moq_unit}`,
    LEAD: p.lead_time_days_stock,
    OEM_LEAD: p.lead_time_days_oem,
    SHELF: String(p.shelf_life_months),
  };
  const fill = (text: string) =>
    text.replace(/\\{(MOQ|LEAD|OEM_LEAD|SHELF)\\}/g, (_m, k: keyof typeof values) => values[k]);
  return {
    ...base,
    summary: fill(base.summary),
    application: fill(base.application),
    usage: base.usage.map(fill),
    faq: base.faq.map((f) => ({ q: fill(f.q), a: fill(f.a) })),
  };
}"""

if OLD_LOOKUP not in src:
    raise SystemExit("the productCopy lookup was not found — the file changed shape")
src = src.replace(OLD_LOOKUP, NEW_LOOKUP)

if src == before:
    raise SystemExit("nothing changed")

with open(PATH, "w", encoding="utf-8", newline="") as fh:
    fh.write(src)

print("rewrote", os.path.relpath(PATH, ROOT))
for name in ("BY_FAMILY", "deodorizing:", "ear:", "dental:", "laundry:", "paw:", "BY_SKU", "{MOQ}"):
    print(f"   {name:16s} {'ok' if name in src else 'MISSING'}")
print("   old key left   ", "disinfection_deodorization" in src)
print("   old fallback   ", "DEODOR_OR_LITTER" in src)

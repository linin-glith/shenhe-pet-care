/**
 * Packshot registry — the SINGLE source of truth for product imagery.
 *
 * WHY THIS FILE EXISTS
 * Three consumers each carried their own PACKSHOT map. They drifted: the
 * catalogue rendered 19 real photographs while the composer's copy still
 * pointed at pre-migration filenames, so the same SKU showed a photo on one
 * page and a "Photo pending" placeholder on another. A visitor who scrolled
 * from the catalogue into the composer saw the product change.
 *
 * Provenance of the two sources:
 *   quote-*  recovered from 中英报价表深河中科20260825.pdf (studio shots)
 *   pet-*    recovered from 深河中科公司及产品介绍PPT.pdf      (deck shots)
 *
 * MAPPING RULE: an entry exists only when the on-pack label proves the SKU.
 * P018 (Pet Paw Moisturizing Gel 10 g) was the last one without a
 * photograph; its shot was recovered from the deck on 2026-10-22
 * (deck xref 119, page 16 — on-pack label reads 宠物润脚凝露 / 10 g,
 * i.e. the paw-conditioning gel, so the identity is proven and not inferred).
 *
 * All twenty SKUs carry a real photograph. P011 (Multi-Purpose Pet Wash
 * 200 mL) is the last one that was recovered: no studio shot of the 200 mL
 * bottle exists, so its picture was cropped out of the price list's 300/200
 * pair shot (scripts/crop_wash_200.py).
 *
 * The ILLUSTRATION map below is what a FUTURE sku without a photograph falls
 * back to. Nothing uses it today — no SKU is missing a picture — but it stays
 * so that adding a catalogue entry without a packshot shows a deliberate
 * packaging drawing instead of an empty frame.
 */

import catalogue from '@/content/v2/matcher-catalogue.json';

const SHOT_BASE = '/assets/img/products';

/**
 * The catalogue's SKU ids, read from the client-safe projection.
 *
 * Imported here so that SKUS_WITHOUT_PHOTO can be derived instead of typed.
 *
 * WHY NOT lib/products.json
 * This module is imported by client components — the SKU card and the SKU
 * composer — and lib/products.json carries b2b_price_rmb. Importing it here
 * put the internal reference price into the browser bundle for every page.
 * The projection carries the same ids without the price, and it is generated
 * from the source record, so the two cannot disagree.
 */
const CATALOGUE_SKUS: readonly string[] = (
  (catalogue as unknown as { catalogue?: { id: string }[] }).catalogue ?? []
).map((p) => p.id);

export const PACKSHOT: Record<string, string> = {
  // --- from the bilingual price list ---
  P001: `${SHOT_BASE}/quote-probiotic-core-18.png`,
  // 净味小子 PURE PAWS PET DEODORANT 350 mL — the label carries the product
  // name AND the size, so this one is proven rather than inferred.
  P002: `${SHOT_BASE}/pure-paws-pet-deodorant.png`,
  /**
   * The bottle only.
   *
   * The price-list photograph is a RANGE shot: the trigger sprayer on the left
   * is a different product (P009, the spray gun kit, which has its own page),
   * so the frame showed two products on a page selling one. The 350 mL bottle
   * stands on the right and is the thing being sold, so the gun is cropped out
   * (scripts/crop_gun_from_disinfectant.py).
   */
  P003: `${SHOT_BASE}/quote-disinfectant-spray-350-bottle.png`,
  P004: `${SHOT_BASE}/quote-catclean-antifungal.png`,
  // 猫砂伴侣 猫砂除臭粉 500 克 — the pouch states 净含量 500 克.
  P007: `${SHOT_BASE}/cat-litter-enhancer-pack.png`,
  P014: `${SHOT_BASE}/quote-no-rinse-foam-500.png`,
  // 宠物免洗泡沫 300 mL — the bottle states 300 mL. The photo that used to sit
  // here was a 200 g trigger SPRAY of a different product.
  P015: `${SHOT_BASE}/pet-waterless-cleaning-foam-300.png`,
  P017: `${SHOT_BASE}/quote-laundry-1p5kg.png`,
  P020: `${SHOT_BASE}/quote-outdoor-protection.png`,
  /*
   * P005, P006, P009 and P011 had no photograph on the site, and the reason
   * was never "the factory did not send one" — it was that the photographs
   * which exist show a DIFFERENT FORMAT from the catalogue record:
   *
   *     P005  record 100 mL            photograph: the 60 mL bottle
   *     P006  record 150 mL            photograph: the 300 mL bottle
   *     P009  record 220 mL x 2 + gun  photograph: the 200 mL spray + gun
   *     P011  record 200 mL            photograph: cropped from the price
   *                                    list's 300/200 pair shot
   *
   * The price list settles it: its own rows say 100 mL, 150 mL, 300 mL and
   * 200 mL, and the catalogue carries those numbers. The factory's PHOTOS
   * are the odd ones out — the ear solution and the dental water were
   * photographed in an older size, and the 200 mL wash was only ever
   * photographed next to the 500 mL one.
   *
   * So the photographs go back on the page (they are real pictures of these
   * products, and a card with a drawn bottle in it reads as a broken site),
   * the catalogue keeps the sizes, and PHOTO_NOTES below says plainly on the
   * product page which format the photograph shows. PROVENANCE.md §8 carries
   * the open question for the factory.
   */
  P005: `${SHOT_BASE}/quote-ear-mite-60ml.png`,
  P006: `${SHOT_BASE}/quote-pet-dental-water-300.png`,
  P009: `${SHOT_BASE}/pet-deodorizing-spray-gun-kit.png`,
  P011: `${SHOT_BASE}/pet-multi-effect-wash-200.png`,
  /*
   * P010 and P011 are the 300 mL and 200 mL Multi-Purpose Pet Wash. The
   * 300 mL bottle was photographed on its own; the 200 mL one is cropped out
   * of the price list's pair shot (scripts/crop_wash_200.py).
   */
  P010: `${SHOT_BASE}/pet-multi-effect-cleansing.png`,

  // --- from the product deck ---
  // 猫砂伙伴 猫砂除臭粉 300 克 — the bottle states 净含量 300 克.
  P008: `${SHOT_BASE}/cat-litter-enhancer-500.png`,
  P012: `${SHOT_BASE}/pet-shampoo-antibacterial-500.png`,
  P013: `${SHOT_BASE}/pet-shampoo-antibacterial-300.png`,
  P016: `${SHOT_BASE}/pet-paw-cleaning-foam.png`,
  P018: `${SHOT_BASE}/pet-paw-moisturizing-gel.png`,
  P019: `${SHOT_BASE}/outdoor-insect-repellent-spray.png`,
};

/**
 * Where the photograph shows a different format from the catalogue record.
 *
 * This is stated on the product page itself, in the specification table,
 * because the alternative is a buyer counting millilitres on a bottle and
 * finding they do not match the row above it.
 */
export const PHOTO_NOTES: Record<string, string> = {
  P005: 'the 60 mL format of this product — this SKU is 100 mL',
  P006: 'the 300 mL format of this product — this SKU is 150 mL',
  P009: 'the 200 mL spray with the trigger sprayer — this SKU is 220 mL × 2 plus a spray gun',
};

export function shotFor(id: string): string | undefined {
  return PACKSHOT[id];
}

/**
 * Technical illustrations — a drawn bottle, not a photograph.
 *
 * A SKU with no photograph falls back to one of these instead of a "Photo
 * pending" box. The illustration says exactly what it is (an alt text that
 * says "technical illustration"), so it never passes itself off as the
 * product photo, and the card grid keeps its shape.
 *
 * Only SKUs whose silhouette is actually drawn appear here — the registry is
 * an allow-list, never a filename convention, because a missing file would
 * render a broken image.
 *
 * NOTHING USES THIS TODAY. All twenty catalogue SKUs have a photograph, so
 * these drawings are dormant. They stay because the fallback is what keeps a
 * newly added SKU from shipping an empty frame: the day a SKU is added without
 * a packshot, its drawing goes in this map and it is no longer dormant.
 */
const ILLUSTRATION_BASE = `${SHOT_BASE}/illus`;

export const ILLUSTRATION: Record<string, string> = {
  P002: `${ILLUSTRATION_BASE}/p002-illus.svg`,
  P004: `${ILLUSTRATION_BASE}/p004-illus.svg`,
  // The three whose photographs carry a different size from the record.
  P005: `${ILLUSTRATION_BASE}/p005-illus.svg`,
  P006: `${ILLUSTRATION_BASE}/p006-illus.svg`,
  P009: `${ILLUSTRATION_BASE}/p009-illus.svg`,
  P011: `${ILLUSTRATION_BASE}/p011-illus.svg`,
  P014: `${ILLUSTRATION_BASE}/p014-illus.svg`,
  P018: `${ILLUSTRATION_BASE}/p018-illus.svg`,
  P020: `${ILLUSTRATION_BASE}/p020-illus.svg`,
};

/**
 * The image a card should show for a SKU: photograph first, then the drawn
 * bottle, then nothing at all. Never a wrong photograph.
 */
export function imageFor(id: string): { src: string; illustration: boolean } | undefined {
  const shot = PACKSHOT[id];
  if (shot) return { src: shot, illustration: false };
  const illus = ILLUSTRATION[id];
  if (illus) return { src: illus, illustration: true };
  return undefined;
}

/**
 * SKUs with no photograph, and which therefore render a mockup.
 *
 * DERIVED, NOT TYPED. It used to be a hand-written list holding 'P011', which
 * stopped being true the moment P011's photograph was recovered from the price
 * list's pair shot — and a stale list is worse than no list, because it reads
 * as a live gap and hides the real one. It is now computed from the catalogue,
 * so adding a SKU without a packshot shows up here by itself.
 */
export const SKUS_WITHOUT_PHOTO: readonly string[] = CATALOGUE_SKUS.filter(
  (id) => !PACKSHOT[id]
);

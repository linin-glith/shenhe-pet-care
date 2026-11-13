import productsData from "./products.json";
import { SKU_QUERIES, plainPhrase } from "@/lib/seo/keywords";
import { useSplit, spansAnimalAndSpace, reportsForSku } from "@/lib/commerce";
/*
 * The route map and the product line names live in lib/product-routing.ts,
 * which imports nothing at all so that a client component can read them
 * without dragging the catalogue record (and its price) into the browser
 * bundle. They were duplicated here as well, and the two copies drifted
 * apart — the client half of the site called the deodorizing line
 * "Deodorizing & Disinfection" while the server half called it
 * "Deodorizing & Disinfecting", so the same product was named two ways
 * on the same page.
 */
import {
  PRODUCT_ROUTE as PRODUCT_ROUTE_MAP,
  LINE_LABEL as LINE_LABEL_MAP,
} from "@/lib/product-routing";

export type ProductSpec = {
  id: string;
  sku_oem: string;
  name_en: string;
  name_zh?: string;
  category: "disinfection_odor_control" | "cleansing_grooming" | "outdoor_protection";
  /**
   * The product LINE — the group a buyer thinks in, and the one the catalogue
   * pages are organised by.
   *
   * Distinct from `category`, which is a three-value compliance/colour
   * grouping. Ear cleansing solution and dental water are both
   * `disinfection_odor_control` for permit and palette reasons, but neither is
   * a disinfection product, and printing that category over them as a hero
   * headline was wrong. The line is what the hero, the breadcrumb and the
   * catalogue navigation should say.
   */
  line: "deodorizing_disinfection" | "grooming_care" | "outdoor_protection" | "pet_nutrition";
  specification: string;
  specification_options?: string[];
  ingredients_en: string;
  function_en: string;
  /**
   * THE CONCLUSION SENTENCE - the one line an assistant can lift whole.
   *
   * Where there is a third-party report it is the figure and the report
   * number; where there is not, it is a specification value marked as
   * such. It lives in the catalogue record so that the page, the
   * machine files and the gate all read the same sentence.
   */
  conclusion?: string;
  application: string[];
  moq: number;
  moq_unit: string;
  moq_exception?: string;
  b2b_price_rmb?: number;
  b2b_price_currency?: string;
  exhibition_promo?: boolean;
  lead_time_days_stock: string;
  lead_time_days_oem: string;
  shelf_life_months: number;
  storage: string;
  package: string;
  carton_dimensions_cm: string;
  carton_weight_kg: number;
  hs_code: string;
  msds_available: boolean;
  certifications_required: string[];
  status: "active" | "inactive";
  description: string;
  tags: string[];
};

export type Category = {
  slug: string;
  en: string;
  zh?: string;
  count: number;
};

const data = productsData as unknown as {
  version: number | string;
  updated: string;
  products: ProductSpec[];
  categories: Category[];
  meta: Record<string, unknown>;
};

export const products: ProductSpec[] = data.products.filter((p) => p.status === "active");

export const categories: Category[] = data.categories;

/**
 * How many SKUs the site sells.
 *
 * THE ONE PLACE THE COUNT LIVES.
 * The number used to be typed into a dozen places ("16 SKUs" in the footer,
 * the hero, the trust bar, the OEM page, two meta descriptions and the
 * catalogue title) while the catalogue itself listed 20. A buyer comparing
 * the hero with the catalogue saw two different factories.
 *
 * The count is derived from the catalogue, so a change to products.json
 * changes every statement about it. The one exception is
 * `siteConfig.metrics.patentedSkus`, which is a claim about registered IP —
 * a different thing from "how many SKUs do you sell", and it stays where the
 * legacy site recorded it (the about page).
 */
export const activeSkuCount = products.length;

export function getProductById(id: string): ProductSpec | undefined {
  return products.find((p) => p.id === id);
}

/**
 * SKU id -> the URL its detail page actually lives at.
 *
 * WHY THIS TABLE EXISTS
 * The product pages are static routes named by SLUG (/products/pet-deodorizing-
 * spray.html), not by SKU id. Every link used to be built as
 * `/products/${p.id.toLowerCase()}.html`, which produced /products/p002.html —
 * a 404 for every SKU. The slug is a fact about the ROUTE, not about the
 * product, so it lives here rather than in products.json.
 *
 * Four SKUs (P008, P010, P011, P014) had no detail page, so their cards in
 * the catalogue linked to an anchor on the catalogue itself — a card that
 * looks clickable and goes nowhere. They have pages now.
 *
 * P001 MOVED OFF "pet-digestive-probiotics" (2026-10-22). That route is the
 * legacy page for a DIFFERENT product — "Pet Digestive Probiotics, 8 mL × 9
 * vials" — and P001 is not it: the catalogue record is a probiotic + bio-enzyme
 * ODOR-CONTROL SET (1 spray + 2 × 220 mL, 1,000 sets), and the packshot on the
 * price list shows that gift set, patent ZL 2018 1 1098435.9, "除臭率 >94%".
 * Pointing P001 at the vials page made one URL serve two products and put a
 * title on the page ("8 mL × 9 vials") that its own body denied. P001 now has
 * its own page at "odor-control-set"; the vials product keeps the legacy route
 * and is listed in LINE_PRODUCTS below.
 */
export const PRODUCT_ROUTE: Record<string, string> = PRODUCT_ROUTE_MAP;

/**
 * The canonical URL for a product.
 *
 * Always use this instead of assembling the path from the id: the id is not
 * the route, and a wrong guess here is a 404 that no test would catch
 * because the catalogue page itself still renders.
 */
export function productUrl(p: ProductSpec): string {
  const slug = PRODUCT_ROUTE[p.id];
  return slug ? `/products/${slug}.html` : `/products.html#${p.category}`;
}

/** True when this SKU has a page of its own. */
export function hasProductPage(id: string): boolean {
  return Boolean(PRODUCT_ROUTE[id]);
}

/**
 * Products that have their own page but no catalogue SKU.
 *
 * WHY THEY ARE NOT IN products.json
 * These two came off the legacy site with their own marketing pages (the
 * Pet Nutrition line page links to both). The quote sheet that the catalogue
 * was built from does not carry them as SKUs, so they are quoted one at a
 * time rather than out of the catalogue grid. They are still real products,
 * they still have pages, and an engine still reads them — so their name,
 * size, minimum order and page URL live here rather than being typed into a
 * page twice.
 *
 *   pet-digestive-probiotics  Pet Digestive Probiotics, 8 mL × 9 vials
 *   pet-immunoglobulin        Pet Immunoglobulin (IgG), 15 g × 8 sachets
 *
 * The third product on the Pet Nutrition line, P001, IS a catalogue SKU — it
 * is the probiotic + bio-enzyme odor-control set, and it has its own page at
 * /products/odor-control-set.html.
 */
/*
 * THE PET-NUTRITION PRODUCTS ARE DEFINED ONCE, IN lib/line-products.ts.
 *
 * They used to live here as well, and both copies were live: the SEO
 * modules read one and the components read the other. Two copies of a
 * record are two records, and nothing says so when only one is edited.
 *
 * lib/line-products.ts is the definition because it has no data
 * dependency: this file imports lib/products.json, which carries the
 * internal reference price, and a client component that reaches these
 * two products through here would carry that price into the browser
 * bundle for every page of the site.
 */
export { LINE_PRODUCTS, lineProductBySlug, type LineProduct } from "./line-products";

/**
 * How a SKU is written into a buyer's enquiry.
 *
 * WHY NOT THE SKU ID
 * "P003" means nothing to the person typing. The enquiry goes to a human on
 * the sales side, so it has to name the product and the size, and carry the
 * id alongside for the lookup.
 *
 * MOVED TO lib/client-products.ts
 * This function reads the product records, and the records carry
 * b2b_price_rmb. A client component that imported it from here pulled the
 * whole record — price included — into the browser bundle. The client-safe
 * version reads the generated projection instead, and this copy is kept only
 * for server-side callers. Nothing in the client bundle may import this
 * module.
 */
export function productLine(p: ProductSpec): string {
  return `${p.name_en} — ${p.specification} (${p.id})`;
}

/** The same, for a list of ids, with unknown ids passed through as typed. */
export function productLines(ids: string[]): string[] {
  return ids.map((id) => {
    const p = products.find((x) => x.id === id);
    return p ? productLine(p) : id;
  });
}

/** The SKU behind a product page slug, if there is one. */
export function productBySlug(slug: string): ProductSpec | undefined {
  const id = Object.entries(PRODUCT_ROUTE).find(([, s]) => s === slug)?.[0];
  return id ? getProductById(id) : undefined;
}

/**
 * The questions a buyer asks about ONE product, with the answers that can be
 * checked against a document.
 *
 * THIS IS THE GEO ASSET OF A PRODUCT PAGE
 * An answer engine does not quote a catalogue grid; it quotes a bounded
 * answer to a question. So the questions are the ones procurement actually
 * asks — minimum order, lead time, private label, packing, shelf life, the
 * document set, freight — and every answer carries a number, a document or
 * a named term.
 *
 * No answer here contains a price: the site is quote-only, and a citable
 * answer that leaks the price list undoes the pricing policy.
 */
/**
 * The answer to "is this for the animal or for the environment?".
 *
 * Written from the catalogue's own application words, split by where they
 * are used. It says what the record records and stops there - it does not
 * widen a use, and it does not hide one.
 */
function useAnswer(p: ProductSpec): string {
  const use = useSplit(p);
  const onAnimal = use.onAnimal.join(', ');
  const around = [...use.aroundAnimal, ...use.litter].join(', ');

  if (use.onAnimal.length && around) {
    return (
      `Both. The catalogue records it for ${onAnimal.toLowerCase()} on the animal, ` +
      `and for ${around.toLowerCase()} around it. One formulation covers both, so ` +
      `if your label has to state one use only, say so in the enquiry and we will ` +
      `confirm what the label can carry for your formula and your market.`
    );
  }
  if (use.onAnimal.length) {
    return (
      `On the animal: ${onAnimal.toLowerCase()}. The catalogue does not record this ` +
      `SKU for the surfaces around the animal.`
    );
  }
  if (around) {
    return (
      `Around the animal: ${around.toLowerCase()}. The catalogue does not record this ` +
      `SKU for use on an animal’s coat or skin.`
    );
  }
  return `${p.function_en} The catalogue records its uses as ${p.application.join(', ').toLowerCase()}.`;
}

export function productFaq(p: ProductSpec): { q: string; a: string }[] {
  const moq = `${p.moq.toLocaleString()} ${p.moq_unit}`;
  const skuReports = reportsForSku(p.id);
  /**
   * The first question is asked in the BUYER'S words.
   *
   * "What is the minimum order for Power Odor Eliminator (Extra Strength)?"
   * is a question nobody types. "What is the minimum order for pet deodorizing
   * spray?" is the one an engine is handed, and it is the one that has to
   * match for the answer to be quoted at all. The catalogue name stays in
   * the answer, where the buyer's own page says it too.
   */
  const phrase = plainPhrase(SKU_QUERIES[p.id]?.primary ?? p.name_en);

  /**
   * The ORDERING questions only.
   *
   * The use and safety questions live in the page's depth block
   * (content/v2/product-copy.ts), under their own heading, and they are added
   * to the FAQPage schema where that schema is built. They used to be
   * appended here as well, which rendered every one of them twice on the
   * page — once under the depth heading and once under the procurement
   * heading — and put the same question in the schema twice.
   */

  return [
    {
      q: `What is the minimum order for ${phrase.toLowerCase()}?`,
      a: `${moq} per SKU (${p.name_en}). A repeat run is quoted on its own volume, and the minimum for it is agreed in the quotation.`,
    },
    {
      q: 'How long does production take?',
      a: `Stock catalogue formulas: ${p.lead_time_days_stock} days after payment confirmation. Private label: ${p.lead_time_days_oem} days after the sample is approved.`,
    },
    /*
     * PRIVATE LABEL, KEYED ON THE PACKING, ASKED IN THE BUYER'S WORDS.
     *
     * Two things changed here.
     *
     * The question text. It was "Can it be private-labelled with our own
     * formula and artwork?", a phrasing nobody types; the depth block on the
     * same page already asked "Can this be private-labelled?" and answered it
     * again, so one page carried two answers to one question. The wording is
     * now the depth block's, so the question appears once and the answer is
     * the one this page renders into both the visible block and the FAQPage.
     *
     * The answer. It used to be the same sentence on all 26 pages, and an
     * answer that is identical everywhere is one answer an engine has
     * already read - not 26. The packing is the one thing a buyer comparing
     * two SKUs actually needs from this question: 24 packs to a carton and
     * 12 bottles to a carton take different artwork, a different outer
     * carton and a different line. The last sentence is the depth block's,
     * kept because it is the boundary a buyer needs before commissioning
     * artwork: a formula outside the catalogue is a development programme,
     * not a label change.
     *
     * The packing is written in brackets, not as "the {packing} format" -
     * `package` holds a carton count ("24 packs/carton"), so calling it a
     * format read as though 24 packs were a bottle size.
     */
    {
      q: 'Can this be private-labelled?',
      a: `Yes. Private label covers the formula, the packing (${p.package}), your artwork and the label itself, and EN / Chinese label compliance for your destination market. The catalogue SKU is a starting point, not a limit. A formula that is not in the catalogue is a development programme, not a private label, and is quoted separately.`,
    },
    {
      q: 'What are the packing and carton specifications?',
      a: `${p.package}; carton ${p.carton_dimensions_cm} cm at ${p.carton_weight_kg} kg; HS code ${p.hs_code}.`,
    },
    {
      q: 'What is the shelf life and how should it be stored?',
      a: `${p.shelf_life_months} months sealed. ${p.storage}.`,
    },
    /*
     * DOCUMENTS AND FREIGHT, ONE QUESTION, KEYED ON THE HS CODE.
     *
     * These were two entries and, across all 26 pages, both were word for
     * word identical. The same paragraph printed 26 times is not 26 answers.
     *
     * They are merged rather than split because freight is the one half of
     * this that carries no per-SKU figure: every SKU leaves on the same
     * lanes, so a freight-only question would be a fresh template on all
     * twenty pages, which is the defect this change exists to remove. The
     * HS code is the fact here that genuinely differs between a shampoo and
     * a litter powder, and it is the one a customs broker asks for first.
     *
     * The documentary list is the depth block's, which named a 16-language
     * SDS, an INCI disclosure and an allergen declaration that this entry
     * did not; the block asked its own "What documentation ships with this
     * product?" and answered separately, so the two lists are now one.
     */
    {
      q: 'What documentation ships with this product?',
      a: `Every batch carries a batch-specific COA, a 16-language SDS, an INCI disclosure and an allergen declaration, a commercial invoice quoting HS code ${p.hs_code}, a certificate of origin, and the bill of lading or air waybill.`,
    },
    {
      q: 'How long does the shipment take, and what does freight cost?',
      a: `Sea FOB Guangzhou or Shenzhen runs 25–35 days to Europe and the US West Coast; air freight is 5–7 days; sea DDP to your warehouse is 40–50 days. Freight is quoted per lane against destination, volume and Incoterms term, and shown separately from the product price.`,
    },
    {
      q: 'What is it for?',
      a: `${p.function_en} Applied to ${p.application.join(', ').toLowerCase()}. Ingredients: ${p.ingredients_en}.`,
    },
    /*
     * WHERE IT GOES, AND WHERE IT DOES NOT.
     *
     * A buyer comparing this catalogue with one that sells a "pet spray" and
     * an "environment deodorizer" as separate products needs one question
     * answered without guessing: does this go on the animal, or on the
     * surfaces around it?
     *
     * The answer is taken from the catalogue's own application words and
     * split by where they are used, so it cannot say one thing while the
     * specification table says another.
     */
    {
      q: 'Is it used on the animal, or on the environment around it?',
      a: useAnswer(p),
    },
    /*
     * WHICH REPORTS COVER THIS SKU.
     *
     * The reports are the evidence a procurement team asks for, and they
     * name the SKUs they cover. Saying which ones cover THIS SKU - with the
     * number, the test and the issuer - is the answer that lets a buyer
     * check the claim instead of taking it on trust.
     */
    ...(skuReports.length
      ? [{
          q: 'Which lab reports cover this SKU?',
          a: skuReports
            .map((r) => `${r.number} — ${r.test}, issued by ${r.issuer}.`)
            .join(' ') +
            ' Each report page carries the finding and the laboratory’s own ' +
            'verification route.',
        }]
      : []),
  ];
}

export function getProductsByCategory(slug: Category["slug"]): ProductSpec[] {
  return products.filter((p) => p.category === slug);
}

export function getCategoryLabel(slug: Category["slug"]): string {
  return categories.find((c) => c.slug === slug)?.en ?? slug;
}

/**
 * The display name of a product line.
 *
 * Kept beside getCategoryLabel rather than beside the category data because
 * a line is not a Category record: the categories array is the three-way
 * compliance grouping that the catalogue and the palette are built on, while
 * the lines are what the catalogue PAGES are organised by. Adding a fourth
 * value to that array would have repainted the catalogue and changed which
 * SKUs the permit chip attaches to.
 */
const LINE_LABEL: Record<ProductSpec["line"], string> = LINE_LABEL_MAP as Record<
  ProductSpec["line"],
  string
>;

export function getLineLabel(slug: ProductSpec["line"]): string {
  return LINE_LABEL[slug] ?? slug;
}

export function getProductsByLine(slug: ProductSpec["line"]): ProductSpec[] {
  return products.filter((p) => p.line === slug);
}

/**
 * THE SKUs THE CATALOGUE RECORD ITSELF DESCRIBES IN CAT OR LITTER TERMS.
 *
 * WHY A RULE AND NOT A LIST
 *
 * A hand-written list of "the cat SKUs" goes stale the day a SKU is added,
 * and a stale list is worse than no list: it quietly stops being true and
 * nobody notices. So the cut is DERIVED from the record — a SKU belongs to
 * the cat page when its own name, its function or its declared
 * applications mention a cat, a feline, or a litter box.
 *
 * Six of the twenty SKUs qualify today. Two of them (the odor-control
 * spray and the bio-enzyme set) are cat SKUs by application rather than by
 * name: both are made for litter boxes, which is where a cat brand needs
 * odor control. The ear cleanser is NOT on the page, because the record
 * describes it for "pet ear canal" and says nothing about cats — putting
 * it there would be a claim the record does not carry.
 */
export function getCatProducts(): ProductSpec[] {
  return products.filter((p) => {
    const hay = [p.name_en, p.function_en, ...(p.application ?? [])].join(' | ');
    return /\bcat\b|\bfeline\b|\blitter\b/i.test(hay);
  });
}

export function getFeaturedProducts(limit = 4): ProductSpec[] {
  // 4 bestsellers for homepage hero strip — picked by exhibition_promo + lowest MOQ
  return [...products]
    .filter((p) => p.exhibition_promo)
    .sort((a, b) => a.moq - b.moq)
    .slice(0, limit);
}
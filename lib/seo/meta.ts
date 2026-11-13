/**
 * The title and description a page carries in search.
 *
 * WHY THIS IS ITS OWN MODULE
 * The metadata of a page is a claim about the page, and it has to agree with
 * what the page actually shows. Two families of page were getting it wrong:
 *
 *   - PRODUCT PAGES. The body renders from lib/products.json, but the title
 *     came from the legacy <head> captured off the live site — and that
 *     title still carried the sizes the catalogue had before it was
 *     corrected. "Ear Mite Cleaning Solution · 250 mL" for a 100 mL bottle;
 *     "Probiotic Pet Tooth Cleaner · 300 mL" for a 150 mL one. A search
 *     result that disagrees with the page it links to is the one thing an
 *     answer engine cannot check and a buyer always can.
 *
 *   - LINE PAGES. Their descriptions were marketing fragments of 44 to 49
 *     characters, which Google renders as a stub: "All Clean, Soft, Healthy
 *     products" says nothing a buyer can act on.
 *
 * Both are derived here, from the same records the page renders from, so
 * they cannot drift apart from the body.
 *
 * AND THE THIRD THING: THE PHRASE
 * A correct title about the wrong subject is still the wrong title. The
 * catalogue name is what the pack says — "Power Odor Eliminator (Extra
 * Strength)" — and it is not what a buyer types. The title is built from the
 * phrase in lib/seo/keywords.ts instead, and the catalogue name goes into
 * the description, where it belongs: the pack name is a fact, the phrase is
 * the door.
 *
 * THE BRAND SUFFIX
 * It is kept only where the whole title still fits inside the 62 characters
 * Google renders. Where it does not, the size — the part that tells one SKU
 * from another — is what must survive.
 */

import { siteConfig } from '@/lib/shenhe.config';
import type { ProductSpec } from '@/lib/products';
import { LINE_PRODUCTS, type LineProduct } from '@/lib/line-products';
import { LINE_PRODUCT_QUERIES, LINE_QUERIES, PAGE_QUERIES, SKU_QUERIES } from '@/lib/seo/keywords';
import { clientProducts } from '@/lib/client-products';
import { lineMoqSentence, shortLineMoqSentence } from '@/lib/commerce';
import { moqUnit } from '@/lib/i18n/sku';

/** The budget a search result shows before it truncates. */
export const TITLE_BUDGET = 62;

/**
 * The description budget.
 *
 * A search engine shows about 155 characters of a description before it
 * truncates, and a truncated description ends mid-fact. The budget is
 * therefore below the truncation point.
 *
 * AND IT IS THE SAME NUMBER THE GATE ALLOWS.
 *
 * The gate checks 70 to 155. The fitter used to cut at 150, so a
 * description written to 155 was cut back by the fitter - and a
 * description with a comma at 143 lost everything after the comma.
 * Two rules that disagree produce a description that no length can
 * satisfy, so they are one number now.
 */
export const DESCRIPTION_BUDGET = 155;

/**
 * Fit a description into the budget without ending mid-fact.
 *
 * WHY A HELPER AND NOT A RULE PER PAGE
 * The descriptions come from eight different places: the legacy catalogue,
 * the line pages, the localised copies, the blog articles, the report
 * pages and the product records. Each of them was written by hand, and a
 * hand-written description is a description that is too long or too
 * short on about a fifth of the pages. Trimming them one at a time
 * means the next hand-written description breaks it again.
 *
 * So the rule lives in one place: every description goes through here.
 * The text is cut at a sentence or a clause boundary, never mid-word,
 * and the facts at the front are kept — a truncated description that
 * loses the minimum order is worse than a shorter description that
 * keeps it.
 */
export function fitDescription(text: string, budget: number = DESCRIPTION_BUDGET): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= budget) return clean;

  /*
   * THE CUT IS AT A CLAUSE BOUNDARY, NOT AT THE FIRST SENTENCE.
   * Taking the first sentence was the wrong rule: a description written
   * as one long sentence with clauses came back as a fragment of forty
   * characters, which is worse than the long one — a truncated
   * description is still a sentence, and a fragment is not.
   *
   * So the text is cut where the writer put a boundary, and only if that
   * boundary leaves enough of the text to be worth reading. If the
   * boundaries are all too early, the text is cut at the last space
   * before the budget instead.
   */
  const clause = clean.slice(0, budget + 1);
  const cuts = [
    clause.lastIndexOf(', '),
    clause.lastIndexOf('; '),
    clause.lastIndexOf(' — '),
    clause.lastIndexOf(' - '),
    clause.lastIndexOf(': '),
  ];
  const cut = Math.max(...cuts);
  const MIN = 90; // below this a description is a fragment, not a sentence
  if (cut >= MIN) {
    return clause.slice(0, cut).replace(/[\s,;:\u2014-]+$/, '') + '.';
  }

  // the boundaries are all too early: cut at the last space
  const space = clean.slice(0, budget).lastIndexOf(' ');
  if (space >= MIN) return clean.slice(0, space).replace(/[\s,;:\u2014-]+$/, '') + '.';

  return clean.slice(0, budget).replace(/[\s,;:\u2014-]+$/, '') + '.';
}


function withBrand(base: string): string {
  const withBrand = `${base} | ${siteConfig.brand.name}`;
  return withBrand.length <= TITLE_BUDGET ? withBrand : base;
}

/** The size, without the "/ bottle" packaging suffix the catalogue carries. */
export function cleanSize(p: ProductSpec): string {
  return p.specification.replace(/\s*\/\s*\w+$/, '').trim();
}

/**
 * The name of a product as it appears on the page and in a breadcrumb —
 * without the brand, which the breadcrumb does not repeat.
 */
export function productName(p: ProductSpec): string {
  const size = cleanSize(p);
  return size && p.name_en.toLowerCase().includes(size.toLowerCase())
    ? p.name_en
    : `${p.name_en} ${size}`;
}

/** The phrase a buyer types for this SKU. */
export function productQuery(p: ProductSpec): string {
  return SKU_QUERIES[p.id]?.primary ?? p.name_en;
}

/**
 * The filter a B2B buyer types: OEM, private label, manufacturer, supplier,
 * wholesale, bulk. A title without one of these reads as a consumer product
 * listing, and the buyer who is looking for a factory never sees it.
 */
const SOURCING_TERM = /\b(?:oem|odm|private[-\s]?label|manufacturer|manufacturers|supplier|wholesale|bulk)\b/i;

/**
 * The high-priority sourcing terms — the ones Google Autocomplete returns
 * as the first suggestion when a buyer types a product + sourcing intent.
 *
 * "manufacturers" (plural) is the Autocomplete first suggestion for nearly
 * every pet-care product query. "manufacturer" (singular) returns empty.
 * "OEM" returns empty on its own. So a title that starts with the product
 * name followed by "manufacturers" matches the buyer's actual query, while
 * one that starts with "OEM" pushes the real product word to position three
 * — behind a word nobody types.
 *
 * The order below is the priority: the first phrase in `also[]` that
 * matches the highest-priority term is the one chosen.
 */
const SOURCING_PRIORITY = [
  // 1. "manufacturers" (plural) — the Autocomplete winner
  /\bmanufacturers\b/i,
  // 2. "manufacturer" (singular) — still better than OEM
  /\bmanufacturer\b/i,
  // 3. "supplier" / "wholesale" / "bulk" — commercial intent terms
  /\b(?:supplier|wholesale|bulk)\b/i,
  // 4. "private label" — a service description, not an Autocomplete term
  /\bprivate[-\s]?label\b/i,
  // 5. "OEM" / "ODM" — last resort; the buyer's autocomplete does not return it
  /\b(?:oem|odm)\b/i,
];

/**
 * The phrase a title is built from, with the best sourcing term chosen.
 *
 * PRIORITY (changed 2026-11-10):
 * Google Autocomplete for pet-care product + sourcing intent returns
 * "manufacturers" (plural) as the first suggestion. "OEM" returns empty.
 * A title that starts with "OEM" pushes the real product word to position
 * three, behind a word nobody types. So the phrase is now chosen by
 * sourcing-term priority — manufacturers > manufacturer > supplier >
 * private label > OEM — and the product word lands first in the title.
 */
export function sourcingOf(
  entry: { primary: string; also: string[] } | undefined,
  fallback = '',
): string {
  if (!entry) return fallback;

  // Try each priority tier in order; the first phrase that matches wins.
  for (const tier of SOURCING_PRIORITY) {
    // Check the primary first — if it already carries a high-priority term,
    // it is the best phrase.
    if (tier.test(entry.primary)) return entry.primary;
    // Then check the alternatives, in order.
    const found = entry.also.find((phrase) => tier.test(phrase));
    if (found) return found;
  }

  // No sourcing term at all — return the primary as-is.
  return entry.primary;
}

/**
 * The phrase a product title is built from.
 *
 * `primary` names the product ("Pet Deodorizing Spray"); the sourcing term
 * lives in `also` ("OEM pet odor eliminator spray"). The title takes the
 * first sourcing variant, so a buyer searching for a manufacturer lands here.
 * `primary` is left untouched everywhere else - the page body, the AI files
 * and the FAQ still speak in the plain product name.
 */
export function titlePhrase(p: ProductSpec): string {
  return sourcingOf(SKU_QUERIES[p.id], productName(p));
}

/**
 * The title once the phrase is chosen.
 *
 * WHAT FALLS OFF, AND IN WHAT ORDER. A truncated title cuts the END of the
 * string, so the end is where the brand sits. The brand is new and carries no
 * search volume; the sourcing term and the size are the parts that identify
 * the product and are what a buyer scans for. So the order of sacrifice is
 * brand first, then the detail of the size, and never the sourcing term.
 */
export function fitTitle(phrase: string, size = ''): string {
  const base =
    size && !phrase.toLowerCase().includes(size.toLowerCase())
      ? `${phrase} ${size}`
      : phrase;

  if (`${base} | ${siteConfig.brand.name}`.length <= TITLE_BUDGET) {
    return `${base} | ${siteConfig.brand.name}`;
  }
  if (base.length <= TITLE_BUDGET) return base;

  const m = size.match(/\d+(?:[.,]\d+)?\s*(?:mL|ml|L|l|g|kg)/);
  const short = m ? `${phrase} ${m[0]}` : phrase;
  return short.length <= TITLE_BUDGET ? short : phrase;
}

/**
 * The size reduced to what identifies the SKU, for a title that runs long.
 * "220 mL × 2 bottles + 1 spray gun" becomes "220 mL".
 */
export function shortSize(p: ProductSpec): string {
  const size = cleanSize(p);
  const m = size.match(/\d+(?:[.,]\d+)?\s*(?:mL|ml|L|l|g|kg)/);
  return m ? m[0] : size;
}

/**
 * The SERP title of a product page: the sourcing phrase and the size.
 *
 * "Cat Litter Partner — Deodorizing Powder 500 g" already carries its size,
 * so the specification is not appended again — printing "500 g 500 g" reads
 * like a typo and wastes the characters that are left.
 *
 * WHAT FALLS OFF, AND IN WHAT ORDER. A truncated title cuts the END of the
 * string, so the end is where the brand sits. The brand is new and carries no
 * search volume; the sourcing term and the size are the parts that identify
 * the product and are what a buyer scans for. So the order of sacrifice is
 * brand first, then the detail of the size, and never the sourcing term.
 */
export function productTitle(p: ProductSpec): string {
  return fitTitle(titlePhrase(p), cleanSize(p));
}

/**
 * The SERP description of a product page.
 *
 * It carries four things a buyer screens for — what it is (the phrase), what
 * it is called (the catalogue name), how big, the minimum order and when it
 * ships — and no price, because the site is quote-only.
 *
 * The size is the first thing to go when the description runs long, for the
 * same reason as in the title: the size is already in the title, and the
 * catalogue name is not.
 */
export function productDescription(p: ProductSpec): string {
  const query = SKU_QUERIES[p.id]?.primary ?? p.name_en;
  const size = cleanSize(p);
  const queryHasSize = size && query.toLowerCase().includes(size.toLowerCase());

  /*
   * WHAT THE PRODUCT DOES, IN THE WORDS A BUYER USES.
   *
   * The function line is written in the buyer's language - "odor
   * removal rate", "antifungal", "99.9% kill rate against common
   * pathogens". Those are the words somebody types when they are
   * looking for this, and they are the right thing to put in a
   * description that runs short: a description that is only a
   * minimum order and a lead time tells a search engine nothing and
   * tells a buyer less.
   */
  const does = (p.function_en ?? '')
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  /*
   * EVERY SENTENCE STARTS WITH A CAPITAL.
   *
   * The function line is written in the catalogue in lower case
   * after the first word - "Absorbs and decomposes litter box odor;
   * accelerates clumping" - because it is a list of clauses, not
   * sentences. Put into a search result as it stands, the second
   * clause starts with a lower-case letter and the description reads
   * like it was assembled rather than written.
   */
  const sentences = does
    .split(/(?<=\.)\s+/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');

  /*
   * THE WINDOW.
   *
   * The gate allows 70 to 155 characters and the fitter cuts at 150,
   * so a description has to land between 150 and 155 to survive
   * whole. A description below 150 is a stub; one above 155 comes
   * back out of the fitter shortened.
   *
   * So the description is assembled from its pieces until it lands
   * in the window. The pieces, and what goes when it sentences not fit:
   *
   *   1. the identifier - the SKU query, with the size if the query
   *      sentences not carry it
   *   2. the function line - what the product sentences
   *   3. the application - where it is used, whole, one item at a
   *      time, so the sentence reads
   *   4. the minimum order - never cut
   *   5. the lead times - the private label one first, then the
   *      stock one; both are on the page anyway
   */
  const WINDOW = 155;

  /*
   * THE LENGTH AS THE GATE MEASURES IT.
   *
   * The gate reads the built html, and the html escapes "&" as
   * "&amp;" and ">" as "&gt;". A description of 155 characters in the
   * source is 158 in the page, and it is over the line.
   *
   * So the length that matters is the escaped one - the length the
   * browser and the search engine see.
   */
  const htmlLen = (s: string): number =>
    s.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').length;

  const moq = ` MOQ ${p.moq.toLocaleString()} ${p.moq_unit}.`;
  const stock = ` Stock ${p.lead_time_days_stock} days.`;
  const oem = ` Private label ${p.lead_time_days_oem} days.`;

  /*
   * THE IDENTIFIERS.
   *
   * From the shortest to the longest, because the shortest is the one
   * that leaves room for the function. The name is a fallback: the
   * SKU query already carries it, and the size is in the title.
   */
  /*
   * THE IDENTIFIERS, AND THE NAME APPEARS ONCE.
   *
   * The SKU query already carries the product name - "OEM
   * Multi-Purpose Pet Wash" - so putting the catalogue name in as
   * well repeats it, and a search result that says the same thing
   * twice reads like a mistake.
   *
   * So the catalogue name is added only when the query does not carry
   * it, and the size only when the size is not already there.
   */
  const nameWords = p.name_en
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const queryHasName =
    nameWords.filter((w) => w && query.toLowerCase().includes(w)).length >= 2;

  const idents: string[] = [];
  if (!queryHasName) {
    idents.push(queryHasSize ? `${query}. ${p.name_en}` : `${query}. ${p.name_en}, ${size}`);
  }
  idents.push(queryHasSize ? query : `${query}, ${size}`);
  idents.push(query);
  idents.sort((a, b) => a.length - b.length);

  // the tails, from the fullest to the shortest
  const tails = [`${moq}${stock}${oem}`, `${moq}${stock}`, `${moq}${oem}`, `${moq}`];

  /*
   * THE BODIES, AND THE SIZE IS ONE OF THEM.
   *
   * The function line is the first choice, because it is what a buyer
   * searches for. The application is the second - where it is used is
   * a word somebody types as well. The size is the third, because
   * "200 mL" is a word somebody types.
   *
   * The application is used whole - one item, two items, three items
   * - so the sentence is never cut in the middle of a list.
   */
  const apps = (p.application ?? []).map((a) => String(a).toLowerCase());
  const appBodies: string[] = [];
  for (let n = apps.length; n >= 1; n--) {
    appBodies.push(`For ${apps.slice(0, n).join(' and ')}`);
  }
  /*
   * THE APPLICATION IN MORE LENGTHS.
   *
   * The laundry detergent's description lands at 149 or 156 - one
   * character either side of the window - and the application is what
   * decides which. So the application comes in more lengths: one
   * item, two items, three - and each item with the "pet " dropped,
   * because that is what a buyer types ("pet bedding", not "pet pet
   * bedding").
   *
   * So the description can land in the window without a word being
   * cut in half.
   */
  for (let n = apps.length; n >= 1; n--) {
    const short = apps
      .slice(0, n)
      .map((a) => a.replace(/^pet\s+/, ''))
      .join(' and ');
    if (short !== apps.slice(0, n).join(' and ')) appBodies.push(`For ${short}`);
  }

  const sizeText = size ? `${size}` : '';
  /*
   * THE SIZE THE DESCRIPTION MUST CARRY.
   *
   * Empty when the query already says it, and the size is then already
   * in the result line.
   */
  const sizeMustAppear = size && !queryHasSize ? size.toLowerCase() : null;
  const bodies: string[] = [];
  if (sentences) {
    bodies.push(sentences);
    if (size) bodies.push(`${sentences}. ${sizeText}`);
    for (const a of appBodies) {
      bodies.push(`${sentences}. ${a}`);
      if (size) bodies.push(`${sentences}. ${a}. ${sizeText}`);
    }
  } else {
    bodies.push(...appBodies);
  }
  /*
   * THE NAME IS NOT A BODY.
   *
   * It is already in the identifier - it is either the SKU query
   * or it is added beside it. So the body list holds the three
   * things a buyer types and none of them is the name: what the
   * product does, where it is used, and how big it is.
   */
  /*
   * THE BODIES, FROM THE LONGEST TO THE SHORTEST.
   *
   * A body that repeats the function is not dropped: it may be the
   * one that carries the size, and the size is what fills the window
   * for a product whose function line is short. The repetition is
   * caught at the reading, not at the building.
   */
  const orderedBodies = [...bodies].sort((a, b) => b.length - a.length);

  for (const tail of tails) {
    for (const body of orderedBodies) {
      for (const ident of idents) {
        const head = `${ident}. `;
        const room = WINDOW - htmlLen(head) - htmlLen(tail);
        if (room < 12) continue;
        // the body is cut at a clause, so the sentence that survives
        // is a sentence
        const cut = body.lastIndexOf('. ', room);
        const candidates: string[] = [];
        if (cut >= 20) candidates.push(body.slice(0, cut));
        candidates.push(body.slice(0, room));
        for (const raw of candidates) {
          const part = raw.replace(/[,;+\s]+$/, '');
          if (part.length < 12) continue;
          const cand = `${head}${part}.${tail}`;
          // THE SIZE IS NOT OPTIONAL.
          //
          // Two pairs of product pages ended up with the same description
          // because the size was optional and the shorter form won: the
          // cat litter powder in 300 g and in 500 g, and the multi-purpose
          // wash in 200 mL and in 300 mL. A buyer searching either size
          // wants the one in their hand, and a search engine cannot tell
          // two pages apart if they read the same.
          if (sizeMustAppear && !cand.toLowerCase().includes(sizeMustAppear)) continue;
          if (htmlLen(cand) >= 150 && htmlLen(cand) <= WINDOW) return cand;
        }
      }
    }
  }

  // the longest form: the identifier, the body and the minimum order
  for (const tail of [moq, `${moq}${stock}`]) {
    for (const body of orderedBodies) {
      for (const ident of idents) {
        const head = `${ident}. `;
        const room = WINDOW - htmlLen(head) - htmlLen(tail);
        if (room < 15) continue;
        const part = body.slice(0, room).replace(/[,;+\s]+$/, '');
        if (part.length < 12) continue;
        const cand = `${head}${part}.${tail}`;
        if (htmlLen(cand) >= 150 && htmlLen(cand) <= WINDOW) return cand;
      }
    }
  }

  // The last form still says which size it is.
  const fallbackSize = sizeMustAppear ? `, ${size}` : '';
  return `${query}${fallbackSize}.${moq}${stock}${oem}`;
}

/**
 * The four line pages, with the one line each says under its title.
 *
 * The Pet Nutrition line is not a catalogue group — its two products are
 * quoted one at a time — so it says so rather than claiming a SKU count.
 */
export const LINE_PAGES: Record<string, { label: string; title: string; description: string }> = {
  /*
   * THE LABEL IS THE LINE PAGE'S OWN NAME.
   *
   * It is what the breadcrumb says one line above the page's <h1>, so the two
   * have to be the same string — a trail that calls the page "Cleansing &
   * Grooming" directly above a heading that says "Grooming & Care" reads as
   * two pages. It is also the name the catalogue groups the SKUs under and the
   * name the footer links to, so one string covers all four.
   */
  'deodorizing-disinfecting': {
    label: 'Deodorizing & Disinfecting',
    title: withBrand(sourcingOf(LINE_QUERIES['deodorizing-disinfecting'])),
    description:
      'Private label and white label pet odor eliminator and disinfectant manufacturers: enzyme deodorizers, chlorine-dioxide disinfectants, cat litter powder, ear care and antifungal spray for ringworm.',
  },
  'grooming-care': {
    label: 'Grooming & Care',
    title: withBrand(sourcingOf(LINE_QUERIES['grooming-care'])),
    description:
      'Private label and white label dog shampoo and pet grooming products manufacturers: shampoo, waterless cleansing foam, paw wash, paw gel, laundry detergent.',
  },
  'outdoor-protection': {
    label: 'Outdoor Protection',
    title: withBrand(sourcingOf(LINE_QUERIES['outdoor-protection'])),
    description:
      'Private label pet outdoor protection products manufacturers: plant-based insect repellent and outdoor protection spray, nano-silver boosted, for dogs and cats on walks and hikes.',
  },
  'pet-nutrition': {
    label: 'Pet Nutrition',
    title: withBrand(sourcingOf(LINE_QUERIES['pet-nutrition'])),
    description:
      'Private label pet supplement manufacturers, quoted one at a time: probiotic digestive set, 8 mL × 9 vials, and bovine colostrum IgG, 15 g × 8 sachets.',
  },
};

/** The line page a slug belongs to, if it is one. */
/**
 * The line pages, in the buyer's language.
 *
 * The line pages are the four catalogue groups. A German buyer arrives at
 * "Pflege & Schönheit" and not at "Grooming & Care", and the page that
 * explains the group has to say the same thing.
 */
const LINE_PAGES_LOCALISED: Record<string, Record<'de' | 'es', { label: string; title: string; description: string }>> = {
  'deodorizing-disinfecting': {
    de: {
      label: 'Geruchsneutralisierung & Desinfektion',
      title: 'Geruchsneutralisierung & Desinfektion | Tierpflege OEM',
      description: 'Tierpflege-Produkte zur Geruchsneutralisierung und Desinfektion aus unserem ISO-22716-GMP-Werk in Heyuan, Guangdong. Private Label ab MOQ 1.000.',
    },
    es: {
      label: 'Desodorización y Desinfección',
      title: 'Desodorización y Desinfección | OEM productos mascotas',
      description: 'Productos para mascotas desodorizantes y desinfectantes de nuestro taller GMP ISO 22716 en Heyuan, Guangdong. Private label desde 1.000 unidades.',
    },
  },
  'grooming-care': {
    de: {
      label: 'Pflege & Schönheit',
      title: 'Pflege & Schönheit | Tierpflege OEM | SHENHE ZHONGKE',
      description: 'Shampoos, Reinigungsschaum, Pfoten- und Ohrenpflege für Haustiere, private label aus China. ISO 22716 GMP, MOQ ab 1.000.',
    },
    es: {
      label: 'Peluquería y Cuidado',
      title: 'Peluquería y Cuidado | OEM productos mascotas | SHENHE ZHONGKE',
      description: 'Champus, espumas limpiadoras y cuidado de patas y oídos para mascotas con private label desde China. GMP ISO 22716, pedido mínimo 1.000.',
    },
  },
  'outdoor-protection': {
    de: {
      label: 'Outdoorschutz',
      title: 'Outdoorschutz für Tiere | Tierpflege OEM | SHENHE ZHONGKE',
      description: 'Outdoorschutz-Sprays gegen Zecken und Insekten für Haustiere, private label aus China. ISO 22716 GMP, MOQ ab 1.000.',
    },
    es: {
      label: 'Protección Exterior',
      title: 'Protección exterior para mascotas | OEM productos mascotas | SHENHE ZHONGKE',
      description: 'Sprays de protección exterior contra garrapatas e insectos para mascotas con private label desde China. GMP ISO 22716, pedido mínimo 1.000.',
    },
  },
  'pet-nutrition': {
    de: {
      label: 'Tiernahrung',
      title: 'Tiernahrung Private Label | Tierpflege OEM | SHENHE ZHONGKE',
      description: 'Tiernahrung und Verdauungsprodukte als Private Label, auftragsbezogen entwickelt und produziert. MOQ und Lieferzeit auf Anfrage.',
    },
    es: {
      label: 'Nutrición Animal',
      title: 'Nutrición animal con private label | OEM mascotas',
      description: 'Alimentación animal y productos digestivos con private label, desarrollados y fabricados bajo pedido. Pedido mínimo y plazo bajo solicitud.',
    },
  },
};

export function linePageMeta(
  slug: string,
  locale: 'de' | 'es' | 'en' = 'en',
): { label: string; title: string; description: string } | undefined {
  const page = LINE_PAGES[slug];
  if (!page) return undefined;
  if (locale === 'en') return page;
  const byLocale = LINE_PAGES_LOCALISED[slug];
  if (!byLocale) return page;
  const localised = byLocale[locale];
  if (!localised) return page;
  return {
    label: localised.label ?? page.label,
    title: localised.title ?? page.title,
    description: localised.description ?? page.description,
  };
}

/**
 * The title of a line product — a product with a page but no catalogue SKU.
 *
 * Same rule as the catalogue products: the buyer's phrase first, the size
 * when it fits, the brand only when it fits.
 */
export function lineProductTitle(lp: LineProduct): string {
  return fitTitle(sourcingOf(LINE_PRODUCT_QUERIES[lp.slug], lp.name), lp.size);
}

/** The description of a line product, in the buyer's words. */
export function lineProductDescription(lp: LineProduct): string {
  const query = LINE_PRODUCT_QUERIES[lp.slug]?.primary ?? lp.name;
  const desc =
    `${query}. ${lp.name} ${lp.size} — ${lp.lead.toLowerCase()}. ` +
    `MOQ ${lp.moq}, quoted on request.`;
  return desc.length <= DESCRIPTION_BUDGET ? desc : lp.description;
}

/**
 * The two line products, in the buyer's language.
 *
 * Same rule as the catalogue products: each language gets its own query, its
 * own name and its own unit word. "MOQ 1,000 vials" on a German page is an
 * English measurement - the number is a fact, but "vials" and "sachets" are
 * words the buyer reads in their own language, and "Beutel" is not "sachets".
 */
const LINE_PRODUCT_LOCALISED: Record<
  string,
  Record<'de' | 'es', { query: string; name: string; size: string; lead: string; moq: string }>
> = {
  'pet-digestive-probiotics': {
    de: {
      query: 'OEM Probiotika Tier Verdauungs-Supplement',
      name: 'Tier Verdauungs-Probiotik',
      size: '8 mL × 9 Fläschchen',
      lead: 'dreifach mikroverkapseltes Lactobacillus acidophilus für den Darm von Hund und Katze',
      moq: '1.000 Fläschchen',
    },
    es: {
      query: 'OEM probióticos digestivos para mascotas',
      name: 'Probióticos digestivos para mascotas',
      size: '8 mL × 9 vials',
      lead: 'Lactobacillus acidophilus microencapsulado triple para el intestino de perros y gatos',
      moq: '1.000 vials',
    },
  },
  'pet-immunoglobulin': {
    de: {
      query: 'OEM Kolostrum IgG Tier Supplement',
      name: 'Tier Immunoglobulin (IgG)',
      size: '15 g × 8 Beutel',
      lead: 'Rindercolostrum-IgG mit den Vitaminen A und E',
      moq: '1.000 Beutel',
    },
    es: {
      query: 'OEM inmunoglobulina IgG de colostro para mascotas',
      name: 'Inmunoglobulina (IgG) para mascotas',
      size: '15 g × 8 sobres',
      lead: 'IgG de calostro bovino con vitaminas A y E',
      moq: '1.000 sobres',
    },
  },
};

const LOCALISED_LINE_TAIL: Record<'de' | 'es', (moq: string) => string> = {
  de: (moq) => ` MOQ ${moq}. Angebot auf Anfrage.`,
  es: (moq) => ` Pedido mínimo ${moq}. Solicite precio.`,
};

/** The SEO title of a line product, in the buyer's language. */
export function lineProductTitleLocalized(lp: LineProduct, locale: 'de' | 'es'): string {
  const loc = LINE_PRODUCT_LOCALISED[lp.slug]?.[locale];
  const query = loc?.query ?? LINE_PRODUCT_QUERIES[lp.slug]?.primary ?? lp.name;
  const size = loc?.size ?? lp.size;
  const base = `${query} ${size}`;
  return withBrand(base.length <= TITLE_BUDGET ? base : query);
}

/**
 * The SEO description of a line product, in the buyer's language.
 *
 * The lead line is the first thing to go when the description runs long: the
 * size is already in the title, and the minimum order is what a buyer screens
 * for. The English version used to be the fallback, so a German page that ran
 * long fell back to English text - the same defect as a page that has no
 * translation at all.
 */
export function lineProductDescriptionLocalized(lp: LineProduct, locale: 'de' | 'es'): string {
  const loc = LINE_PRODUCT_LOCALISED[lp.slug]?.[locale];
  const query = loc?.query ?? LINE_PRODUCT_QUERIES[lp.slug]?.primary ?? lp.name;
  const name = loc?.name ?? lp.name;
  const size = loc?.size ?? lp.size;
  const lead = loc?.lead ?? lp.lead;
  const moq = loc?.moq ?? lp.moq;
  const tail = LOCALISED_LINE_TAIL[locale](moq);
  const withSize = `${name} ${size}`;
  const withLead = `${withSize} — ${lead}`;
  for (const body of [withLead, withSize, name]) {
    const desc = `${query}. ${body}.${tail}`;
    if (desc.length <= DESCRIPTION_BUDGET) return desc;
  }
  return `${query}.${tail}`;
}

/** The phrase a buyer types for one of the pages without a product record. */

/**
 * The SEO strings of a product, in the buyer's language.
 *
 * WHY THIS IS NOT A TRANSLATION OF THE ENGLISH TITLE
 * The English title is a query: "Odor Eliminating Pet Spray" is what a
 * buyer types. A German buyer types "Geruchsneutralisierendes Tier Spray".
 * Translating the English word by word produces a title nobody searches
 * for, and a title nobody searches for is a page nobody reaches.
 *
 * So each language gets its own query, written the way that language's
 * buyers search. The description follows the same rule: the facts (MOQ,
 * lead time) are the same, the words around them are not.
 *
 * The budget is the same in every language, because the SERP truncates
 * at the same width.
 */
const LOCALISED_SKU_QUERIES: Record<string, Record<'de' | 'es', string>> = {
  P001: { de: 'Geruchsneutralisierung Set Probiotik Bio-Enzym', es: 'Set control de olores probióticos bioenzimas' },
  P002: { de: 'Geruchsneutralisierer Tier Spray Extra stark', es: 'Eliminador de olores mascotas extra fuerte' },
  P003: { de: 'Desinfektionslösung Tier Desinfektion Geruch', es: 'Solución desinfectante mascotas olor' },
  P004: { de: 'Anti Pilz Katzen Solution Geruchsneutralisierung', es: 'Solución antifúngica gatos neutralizadora de olores' },
  P005: { de: 'Ohrreinigung Tier Ohrsolution', es: 'Limpiador de oídos mascotas solución' },
  P006: { de: 'Zahnwasser Tier Probiotik', es: 'Agua dental probiótica mascotas' },
  P007: { de: 'Katzenstreu Geruchsneutralisierendes Pulver', es: 'Polvo neutralizador de olores para arena de gatos' },
  P008: { de: 'Katzenstreu Geruchsneutralisierendes Pulver', es: 'Polvo neutralizador de olores para arena de gatos' },
  P009: { de: 'Geruchsneutralisierende Sprühpistole Tier', es: 'Pistola spray neutralizadora de olores mascotas' },
  P010: { de: 'Hundeshampoo Katzen Shampoo Mehrfunktion', es: 'Champú multifuncional perros gatos' },
  P011: { de: 'Hundeshampoo Katzen Shampoo Mehrfunktion', es: 'Champú multifuncional perros gatos' },
  P012: { de: 'Hundeshampoo Katzen Shampoo 500 mL', es: 'Champú para perros y gatos 500 mL' },
  P013: { de: 'Hundeshampoo Antibakteriell Milbenbekämpfung', es: 'Champú antibacteriano ácaros perros gatos' },
  P014: { de: 'Tierpflege Schaum Ohne Abspülen', es: 'Espuma limpiadora mascotas sin enjuagar' },
  P015: { de: 'Tierpflege Schaum Ohne Abspülen', es: 'Espuma limpiadora mascotas sin enjuagar' },
  P016: { de: 'Pfotenschaum Reinigung Tierpfoten', es: 'Espuma limpiadora patas mascotas' },
  P017: { de: 'Waschmittel Haustiere Tierhaushalt', es: 'Detergente para ropa de mascotas hogar' },
  P018: { de: 'Pfoten Gel Feuchtigkeit Tierpflege', es: 'Gel hidratante patas mascotas' },
  P019: { de: 'Outdoorspray Tier Zecken Schutz', es: 'Spray protección exterior mascotas garrapatas' },
  P020: { de: 'Insektenspray Outdoor Zecken Mücken', es: 'Spray repelente de insectos exterior garrapatas mosquitos' },
};

const LOCALISED_MOQ_TAIL: Record<'de' | 'es', (moq: string, unit: string, stock: string, oem: string) => string> = {
  de: (moq, unit, stock, oem) =>
    ` MOQ ${moq} ${unit}, Lagerbestand ${stock} Tage, Private Label ${oem} Tage. Angebot auf Anfrage.`,
  es: (moq, unit, stock, oem) =>
    ` Pedido mínimo ${moq} ${unit}, stock ${stock} días, private label ${oem} días. Solicite precio.`,
};

/**
 * The SEO title of a product, in the buyer's language.
 */
export function productTitleLocalized(p: ProductSpec, locale: 'de' | 'es'): string {
  const query = LOCALISED_SKU_QUERIES[p.id]?.[locale];
  if (!query) return productTitle(p);
  const base = `${query} ${cleanSize(p)}`;
  return withBrand(base.length <= TITLE_BUDGET ? base : query);
}

/**
 * The SEO description of a product, in the buyer's language.
 */
export function productDescriptionLocalized(p: ProductSpec, locale: 'de' | 'es'): string {
  const query = LOCALISED_SKU_QUERIES[p.id]?.[locale];
  if (!query) return productDescription(p);
  const name = productName(p);
  const size = cleanSize(p);
  const withSize = name.toLowerCase().includes(size.toLowerCase()) ? name : `${name}, ${size}`;
  const moq = p.moq.toLocaleString(locale === 'de' ? 'de-DE' : 'es-ES');
  const unit = moqUnit(p.moq_unit, locale);
  const tail = LOCALISED_MOQ_TAIL[locale](moq, unit, p.lead_time_days_stock, p.lead_time_days_oem);
  for (const n of [withSize, name]) {
    const desc = `${query}. ${n}.${tail}`;
    if (desc.length <= DESCRIPTION_BUDGET) return desc;
  }
  return `${query}.${tail}`;
}

export function pageQuery(slug: string): { primary: string; also: string[] } | undefined {
  return PAGE_QUERIES[slug];
}

/** The line product behind a page slug, if there is one. */
export { LINE_PRODUCTS };

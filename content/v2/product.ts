import type { V2Block } from '@/lib/v2/block-types';
import { siteConfig } from '@/lib/shenhe.config';
import {
  getProductById,
  getLineLabel,
  productUrl,
  products,
  productFaq,
  type ProductSpec,
} from '@/lib/products';
import { faqPageSchema } from '@/lib/seo/schema';
import { reviewsForSku, ratingSummary } from '@/lib/reviews';
import { productCopy, lineIntro } from '@/content/v2/product-copy';
import { useSplit, spansAnimalAndSpace, reportsForSku } from '@/lib/commerce';
import { PACKSHOT as PACKSHOT_REGISTRY, ILLUSTRATION, imageFor, PHOTO_NOTES } from '@/lib/packshots';
import { moqUnit, applicationName, productName, productFunction } from '@/lib/i18n/sku';
import { PRODUCT_CHIPS } from '@/lib/product-chips';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

/**
 * Product detail —v2 composition.
 *
 * WHY THIS PAGE EARNS ITS OWN COMPOSITION
 * The catalogue grid gets a click; this page has to survive a procurement
 * team's checklist and produce an enquiry. A buyer arriving here is past
 * "what do you make" and into "prove this one specifically". The order below
 * mirrors that scrutiny:
 *
 *   hero        What is it, at what size
 *   proofBar    Can I trust this supplier at all
 *   split       What is actually IN it (ingredients + function)
 *   specTable   The numbers logistics and customs need
 *   proofGrid   Lab paperwork for THIS product family
 *   ctaBand     Start the conversation
 *
 * PRICING POLICY: `ProductSpec.description` embeds literal wholesale figures
 * ("Pricing: B2B EXW RMB <amount> per set"). This module never reads it. It uses
 * function_en for prose, moq and lead_time_* for qualification, and states the
 * quote-only policy in the CTA.
 */

/**
 * Real packshots recovered from the product PPT.
 *
 * AUDITED AGAINST lib/products.json ON 2026-10-21.
 *
 * Three assignments made during recovery were WRONG and have been corrected
 * or removed rather than left in place:
 *   P018 —there is no Pet Immunoglobulin SKU. P018 is "Pet Paw Moisturizing
 *          Gel 10 g" and the packshot in question was an immune-support box,
 *          so it was unmapped entirely.
 *   P019 —the packshot is labelled "Outdoor Protection Spray", which is
 *          P019. It was previously attached to P020 ("Outdoor Insect
 *          Repellent"), a different claim.
 *   P014 —the only no-rinse foam packshot available is 300 mL, which is P015.
 *
 * An absent entry is not a defect: ProductCard renders a "Photo pending"
 * placeholder. A WRONG photo on a procurement page is far worse than none.
 */
/**
 * Scene assignment — product line -> the photograph that actually fits.
 *
 * AUDITED AGAINST THE IMAGES, NOT THEIR FILENAMES.
 * `cat-outdoor.webp` is a GOLDEN RETRIEVER in a flower field, not a cat. An
 * earlier draft mapped scenes by filename and would have put a dog on every
 * outdoor-protection page and called it a cat. Filenames are not evidence.
 *
 * The mapping below was chosen by looking at each photograph:
 *   cat-indoor   — a cat asleep in a cat bed          -> litter, bedding, odor
 *   five-cats    — several clean cats on a sofa       -> grooming, multi-cat homes
 *   cat-outdoor  — a golden retriever outdoors in flowers -> insect repellent
 */
/**
 * The wallpaper set.
 *
 * Every product page takes its pictures from here, and the two picture slots
 * on a page never get the same one. Sixteen product pages over thirteen
 * photographs cannot each own a picture, so the assignment rotates: page 1
 * takes 1 and 2, page 2 takes 2 and 3, and when the set runs out it starts
 * again on a different pairing. What the buyer sees is a different product
 * page every time, and no page shows the same photograph twice.
 *
 * SPLIT BY SPECIES ON PURPOSE
 * The chip in the scene says who the product is for. A dog next to "for
 * cats" is a small lie a buyer can catch, so the cat pages draw from the
 * cat photographs and the outdoor line from the dog photographs.
 */
type Wallpaper = { src: string; alt: string };

const CAT_WALLPAPERS: Wallpaper[] = [
  { src: '/assets/img/wallpapers/cat-fluffy.webp', alt: 'A long-haired cat sitting by a window' },
  { src: '/assets/img/wallpapers/cat-five-on-sofa.webp', alt: 'Five cats on a sofa in a living room' },
  { src: '/assets/img/wallpapers/cat-tabby.webp', alt: 'A tabby cat in close-up against a dark background' },
  { src: '/assets/img/wallpapers/cat-in-bed.webp', alt: 'A white cat resting in a striped cat bed' },
  { src: '/assets/img/wallpapers/cat-sunglasses.webp', alt: 'A cat in sunglasses in the snow' },
  { src: '/assets/img/wallpapers/cat-hairless.webp', alt: 'A hairless cat and a hairless dog against a dark background' },
];

const DOG_WALLPAPERS: Wallpaper[] = [
  { src: '/assets/img/wallpapers/dog-golden-flowers.webp', alt: 'A golden retriever in a field of yellow flowers' },
  { src: '/assets/img/wallpapers/dog-three-corgis.webp', alt: 'Three corgis running across a field' },
  { src: '/assets/img/wallpapers/dog-corgi-chair.webp', alt: 'A corgi sitting on a pink fluffy chair' },
  { src: '/assets/img/wallpapers/dog-poodles.webp', alt: 'Two poodles sitting on a wooden step' },
  { src: '/assets/img/wallpapers/dog-golden-swimming.webp', alt: 'A golden retriever swimming in a pool' },
  { src: '/assets/img/wallpapers/dog-golden-rose.webp', alt: 'A golden retriever carrying a red rose' },
  { src: '/assets/img/wallpapers/dog-bichon.webp', alt: 'A white fluffy dog looking straight at the camera' },
];

/**
 * Per-page overrides for the rotation.
 *
 * The rotation gives every product page a different pair, but a specific
 * page can still be wrong for it — a picture that is right on one product
 * reads wrong on another. The override names the file; the rule that the two
 * slots never show the same photograph still holds.
 */
const PAGE_PHOTOS: Record<string, { hero?: string; scene?: string }> = {
  // P007 猫砂伙伴（500 g）: the scene used to be a cat asleep in its own bed,
  // which says nothing about a litter box. A living room with several cats is
  // where the odor problem actually lives — that is the picture this product
  // belongs in.
  P007: { scene: 'cat-five-on-sofa' },
};

const SCENE_BY_LINE: Record<
  ProductSpec['category'],
  { pet: string; hero: string; petAlt: string; audience: 'Cats' | 'Dogs' }
> = {
  // Odor and disinfection: the problem is a home that has several pets in
  // it. A room with five cats on a sofa says "where the smell comes from";
  // one cat asleep in a bed says "a clean bedroom", which is the wrong
  // argument for this line.
  disinfection_odor_control: {
    pet: '/assets/img/pets/five-cats-card.webp',
    hero: '/assets/img/pets/five-cats-1280.webp',
    petAlt: 'Five cats on a sofa — the multi-pet home where odor control matters',
    audience: 'Cats',
  },
  // Shampoo, foam, paw care, laundry: the result is a clean, well-groomed
  // animal. One clean cat is the picture of the outcome.
  cleansing_grooming: {
    pet: '/assets/img/pets/cat-indoor-card.webp',
    hero: '/assets/img/pets/cat-indoor-1280.webp',
    petAlt: 'A clean cat resting in its bed after grooming',
    audience: 'Cats',
  },
  // Insect repellent: the animal is outside, which is the entire use case.
  outdoor_protection: {
    pet: '/assets/img/pets/cat-outdoor-card.webp',
    hero: '/assets/img/pets/cat-outdoor-1280.webp',
    petAlt: 'A dog outdoors — where insect repellent is actually applied',
    audience: 'Dogs',
  },
};
const PACKSHOT = PACKSHOT_REGISTRY;

/** Products in the same line, so a buyer who liked this one keeps moving. */
function relatedTo(id: string, n = 4) {
  const p = getProductById(id);
  if (!p) return [];
  const same = products.filter((x) => x.line === p.line && x.id !== p.id);
  const rest = products.filter((x) => x.line !== p.line);
  return [...same, ...rest].slice(0, n);
}

/**
 * The labels of the specification table, in the buyer's language.
 *
 * These are the words a procurement officer reads down the left-hand
 * column: "Minimum order", "Stock lead time", "Private-label lead time",
 * "Shelf life". They are the
 * vocabulary of the order, so they are translated as the vocabulary of
 * the order — not as the vocabulary of the marketing page.
 *
 * HS code is not translated because it is a customs code, and a
 * translated customs code is a wrong customs code. The label is
 * translated; the number is not touched.
 */
const SPEC_LABELS: Record<'en' | 'de' | 'es', {
  specification: string; sku: string; ingredients: string; function: string;
  whereUsed: string; applications: string; minimumOrder: string;
  leadStock: string; leadOem: string; shelfLife: string; storage: string;
  packaging: string; carton: string; hsCode: string; msds: string;
  certifications: string; days: string; months: string; yes: string;
  onRequest: string; standard: string;
  /* The private-label table's own rows. */
  formula: string; labelArtwork: string; fixedSpec: string;
  shipsWith: string; privateLabelEffect: string;
}> = {
  en: {
    specification: 'Specification', sku: 'OEM SKU code', ingredients: 'Ingredients',
    function: 'Function', whereUsed: 'Where it is used', applications: 'Applications',
    minimumOrder: 'Minimum order', leadStock: 'Stock lead time', leadOem: 'Private-label lead time',
    shelfLife: 'Shelf life', storage: 'Storage', packaging: 'Packaging', carton: 'Carton',
    hsCode: 'HS code', msds: 'MSDS available', certifications: 'Certifications required',
    days: 'days', months: 'months', yes: 'Yes', onRequest: 'On request', standard: 'Standard',
    formula: 'Formula', labelArtwork: 'Label artwork',
    fixedSpec: 'Fixed specification', shipsWith: 'What ships with it',
    privateLabelEffect: 'What private label changes',
  },
  de: {
    specification: 'Spezifikation', sku: 'OEM-SKU-Code', ingredients: 'Inhaltsstoffe',
    function: 'Funktion', whereUsed: 'Anwendungsbereich', applications: 'Anwendungen',
    minimumOrder: 'Mindestbestellmenge', leadStock: 'Lieferzeit · Lagerbestand',
    leadOem: 'Lieferzeit · OEM', shelfLife: 'Haltbarkeit', storage: 'Lagerung',
    packaging: 'Verpackung', carton: 'Umkarton', hsCode: 'HS-Code', msds: 'SDB verfügbar',
    certifications: 'Erforderliche Zertifizierungen', days: 'Tage', months: 'Monate',
    yes: 'Ja', onRequest: 'Auf Anfrage', standard: 'Standard',
    formula: 'Formel', labelArtwork: 'Etikettengestaltung',
    fixedSpec: 'Feste Spezifikation', shipsWith: 'Lieferumfang',
    privateLabelEffect: 'Was die Eigenmarke verändert',
  },
  es: {
    specification: 'Especificación', sku: 'Código SKU OEM', ingredients: 'Ingredientes',
    function: 'Función', whereUsed: 'Dónde se usa', applications: 'Aplicaciones',
    minimumOrder: 'Pedido mínimo', leadStock: 'Plazo de entrega · stock',
    leadOem: 'Plazo de entrega · OEM', shelfLife: 'Vida útil', storage: 'Almacenamiento',
    packaging: 'Envasado', carton: 'Caja', hsCode: 'Código HS', msds: 'FDS disponible',
    certifications: 'Certificaciones requeridas', days: 'días', months: 'meses',
    yes: 'Sí', onRequest: 'Bajo solicitud', standard: 'Estándar',
    formula: 'Fórmula', labelArtwork: 'Diseño de la etiqueta',
    fixedSpec: 'Especificación fija', shipsWith: 'Qué se envía con el producto',
    privateLabelEffect: 'Qué cambia la marca propia',
  },
};

/** The three ways a product is used, in the buyer's language. */
const USE_BUCKETS: Record<'en' | 'de' | 'es', { animal: string; environment: string; litter: string }> = {
  en: { animal: 'On the animal', environment: 'Around the animal', litter: 'Cat litter' },
  de: { animal: 'Am Tier', environment: 'In der Umgebung des Tieres', litter: 'Katzenstreu' },
  es: { animal: 'Sobre la mascota', environment: 'Alrededor de la mascota', litter: 'Arena para gatos' },
};

/**
 * The words of a product page, in the buyer's language.
 *
 * A product page is read in three passes: the name, the lead, and then
 * the table. The name and the table are facts and are translated as
 * facts. The lead and the buttons are the page's own words, and they
 * are translated as the words of a German or Spanish buyer would use
 * them.
 */
const PAGE_WORDS: Record<'en' | 'de' | 'es', {
  requestPricing: string; allProducts: string; seeAll: string; talkWhatsApp: string;
  chatWhatsApp: string; minimumOrder: string; stockLead: string; oemLead: string;
  shelfLife: string; gmpFacility: string; msdsOnRequest: string; labReports: string;
  labsAccredited: string; tradeCompliance: string; quoteRequest: string;
  lines: Record<string, string>;
}> = {
  en: {
    requestPricing: 'Request pricing', allProducts: 'All products', seeAll: 'See all',
    talkWhatsApp: 'Talk on WhatsApp', chatWhatsApp: 'Chat on WhatsApp',
    minimumOrder: 'Minimum order', stockLead: 'Stock lead time',
    // 'Private-label lead time': OEM is the buyer's own formula (30-45 days)
    // and is not a per-product window. See content/v2/product-copy.ts.
    oemLead: 'Private-label lead time',
    shelfLife: 'Shelf life', gmpFacility: 'GMP facility', msdsOnRequest: 'MSDS on request',
    labReports: 'Lab reports', labsAccredited: 'CMA / CNAS accredited labs',
    tradeCompliance: 'Trade compliance', quoteRequest: 'Request pricing for this SKU.',
    lines: {
      deodorizing_disinfection: 'Deodorizing & Disinfecting',
      grooming_care: 'Grooming & Care',
      outdoor_protection: 'Outdoor Protection',
      pet_nutrition: 'Pet Nutrition',
    },
  },
  de: {
    requestPricing: 'Preis anfragen', allProducts: 'Alle Produkte', seeAll: 'Alle ansehen',
    talkWhatsApp: 'Per WhatsApp sprechen', chatWhatsApp: 'Per WhatsApp chatten',
    minimumOrder: 'Mindestbestellmenge', stockLead: 'Lieferzeit ab Lager',
    oemLead: 'Lieferzeit OEM', shelfLife: 'Haltbarkeit', gmpFacility: 'GMP-Produktion',
    msdsOnRequest: 'SDB auf Anfrage', labReports: 'Laborberichte',
    labsAccredited: 'CMA / CNAS-akkreditierte Labore', tradeCompliance: 'Handelskonformität',
    quoteRequest: 'Preis für diese Artikelnummer anfragen.',
    lines: {
      deodorizing_disinfection: 'Geruchsneutralisierung & Desinfektion',
      grooming_care: 'Pflege & Schönheit',
      outdoor_protection: 'Outdoorschutz',
      pet_nutrition: 'Tiernahrung',
    },
  },
  es: {
    requestPricing: 'Solicitar precio', allProducts: 'Todos los productos', seeAll: 'Ver todo',
    talkWhatsApp: 'Hablar por WhatsApp', chatWhatsApp: 'Chatear por WhatsApp',
    minimumOrder: 'Pedido mínimo', stockLead: 'Plazo de entrega · stock',
    oemLead: 'Plazo de entrega · OEM', shelfLife: 'Vida útil', gmpFacility: 'Instalación GMP',
    msdsOnRequest: 'FDS bajo solicitud', labReports: 'Informes de laboratorio',
    labsAccredited: 'Laboratorios acreditados CMA / CNAS', tradeCompliance: 'Cumplimiento comercial',
    quoteRequest: 'Solicite el precio de esta referencia.',
    lines: {
      deodorizing_disinfection: 'Desodorización y Desinfección',
      grooming_care: 'Peluquería y Cuidado',
      outdoor_protection: 'Protección Exterior',
      pet_nutrition: 'Nutricion Animal',
    },
  },
};

/**
 * THE MEASURED NUMBER, WITH THE REPORT IT RESTS ON.
 *
 * The subtitle carries one measured number, and a number without the
 * report behind it is a claim a buyer has to take on trust. These are
 * the same determinations as the answers below, cut to the figure and
 * the report number.
 */
/**
 * THE CONCLUSION SENTENCE, READ FROM THE CATALOGUE.
 *
 * It used to be written out here, one line per SKU, while the machine
 * files derived their claim from the catalogue's function line - so the
 * sentence an assistant quoted and the sentence on the page were two
 * copies of one fact, and they drifted.
 *
 * The catalogue holds it now, once, and both read it: this page for the
 * first screen, and build_ai_files.py for llms.txt and llms-full.json.
 */
const measuredHeadline = (p: ProductSpec): string | undefined => p.conclusion;


export function productBlocks(id: string, locale: Locale = DEFAULT_LOCALE): V2Block[] {
  const p = getProductById(id);
  if (!p) return [];

  /* The product's name and its function, in the buyer's language. */
  const L = locale as 'en' | 'de' | 'es';
  const name = productName(p.id, p.name_en, L);
  const fn = productFunction(p.id, p.function_en, L);

  const shot = PACKSHOT[p.id];
  const scene = SCENE_BY_LINE[p.category] ?? SCENE_BY_LINE.cleansing_grooming;
  const related = relatedTo(p.id);

  /**
   * The picture of the product in the scene.
   *
   * It is the PRICE-LIST PHOTOGRAPH, not the transparent cut-out: the
   * cut-outs are not all equal (one of them is a cropped blob), and the
   * photograph is the picture the buyer will recognise. The white background
   * it carries is sunk into the surface with mix-blend-mode in the scene
   * component, so the product still stands on the surface.
   *
   * A SKU with no photograph at all falls back to its derived illustration.
   */
  const sceneProduct = shot ?? ILLUSTRATION[p.id];

  /**
   * The two picture slots on this page, taken from the wallpaper set.
   *
   * The hero takes one, the scene takes another, and the two are never the
   * same file. The offset advances by one every page and by an extra step
   * each time the set wraps, so consecutive product pages do not land on the
   * same picture either.
   */
  const pool = p.category === 'outdoor_protection' ? DOG_WALLPAPERS : CAT_WALLPAPERS;
  const slot = products.findIndex((x) => x.id === p.id);
  let heroWall = pool[slot % pool.length];
  let sceneWall = pool[(slot + 1 + Math.floor(slot / pool.length)) % pool.length];

  /*
   * THE BUYERS' REVIEWS, for this SKU.
   *
   * One list, read by the block on the page and by the structured data
   * next to it, so the count a buyer can see and the count a search
   * result shows are the same number.
   */
  const reviews = reviewsForSku(p.id);
  const summary = ratingSummary(reviews);

  // A page may overrule the rotation. The rule is that the two slots never
  // show the same photograph, so an override that collides with the hero
  // falls through to the next one in the pool.
  const pick = (name: string | undefined, fallback: Wallpaper): Wallpaper =>
    name ? pool.find((w) => w.src.endsWith(`/${name}.webp`)) ?? fallback : fallback;
  const override = PAGE_PHOTOS[p.id];
  if (override?.hero) heroWall = pick(override.hero, heroWall);
  if (override?.scene) sceneWall = pick(override.scene, sceneWall);
  if (sceneWall.src === heroWall.src) {
    sceneWall = pool[(pool.indexOf(heroWall) + 1) % pool.length];
  }

  /**
   * WHERE THIS PRODUCT GOES.
   *
   * The catalogue's `application` words are printed flat, which is how a
   * buyer ends up not knowing whether a spray goes on the animal or on the
   * floor. A competitor's catalogue separates the two, so this one does too:
   * the words are grouped by where they are used, and the grouping is a
   * grouping of what the factory already wrote.
   */
  const use = useSplit(p);
  const useLines: string[] = [];
  const onAnimal = use.onAnimal.map((a) => applicationName(a, L));
  const aroundAnimal = use.aroundAnimal.map((a) => applicationName(a, L));
  const litter = use.litter.map((a) => applicationName(a, L));
  if (onAnimal.length) {
    useLines.push(`${USE_BUCKETS[L].animal} — ${onAnimal.join(', ')}`);
  }
  if (aroundAnimal.length) {
    useLines.push(`${USE_BUCKETS[L].environment} — ${aroundAnimal.join(', ')}`);
  }
  if (litter.length) {
    useLines.push(`${USE_BUCKETS[L].litter} — ${litter.join(', ')}`);
  }

  /** The third-party reports that cover THIS SKU, not the catalogue. */
  const skuReports = reportsForSku(p.id);

  const S = SPEC_LABELS[L];
  const W = PAGE_WORDS[L];

  /**
   * THE SUBTITLE UNDER THE NAME.
   *
   * {Function} — {one measured number with report no.} · MOQ {n} {unit} ·
   * private label {d} days
   *
   * The function is the record's own words, cut to its first clause.
   * The full function stays in the specification table, in the
   * composition block and in the answers further down the page, where
   * a buyer reads it next to the record it came from. The hero has one
   * job and it is to be scannable.
   *
   * The measured number is added only for a SKU that has one, and it
   * always travels with the report number it rests on. The minimum
   * order is written out the first time the page says MOQ.
   */
  const fnHead = fn.split(';')[0].trim();
  const measured = measuredHeadline(p);
  const subtitle = `${fnHead}${measured ? ` — ${measured}` : ''} · MOQ (minimum order quantity) ${p.moq.toLocaleString(L === 'de' ? 'de-DE' : L === 'es' ? 'es-ES' : 'en-US')} ${moqUnit(p.moq_unit, L)} · private label ${p.lead_time_days_oem} days`;

  /**
   * THE LINE THIS PRODUCT BELONGS TO.
   *
   * Four lines, four openings. The same paragraph on every product
   * page read as a template, and a buyer who opened three pages
   * before the fourth had learned nothing the second time.
   */
  const lineName = W.lines[p.line] ?? getLineLabel(p.line);
  const intro = lineIntro(p.line);

  const specs: { key: string; val: string }[] = [
    { key: S.specification, val: p.specification },    { key: S.sku, val: p.sku_oem },
    { key: S.ingredients, val: p.ingredients_en },
    { key: S.function, val: fn },
    { key: S.whereUsed, val: useLines.map((l) => l.split(' — ')[0]).join(' · ') },
    { key: S.applications, val: p.application.map((a) => applicationName(a, L)).join(' · ') },
    { key: S.minimumOrder, val: `${p.moq.toLocaleString(L === 'de' ? 'de-DE' : L === 'es' ? 'es-ES' : 'en-US')} ${moqUnit(p.moq_unit, L)}` },
    { key: S.leadStock, val: `${p.lead_time_days_stock} ${S.days}` },
    { key: S.leadOem, val: `${p.lead_time_days_oem} ${S.days}` },
    { key: S.shelfLife, val: `${p.shelf_life_months} ${S.months}` },
    { key: S.storage, val: p.storage },
    { key: S.packaging, val: p.package },
    { key: S.carton, val: `${p.carton_dimensions_cm} · ${p.carton_weight_kg} kg` },
    { key: S.hsCode, val: p.hs_code },
    { key: S.msds, val: p.msds_available ? S.yes : S.onRequest },
    { key: S.certifications, val: p.certifications_required.length ? p.certifications_required.join(' · ') : S.standard },
    /*
     * The photograph note.
     *
     * Three SKUs are photographed in a different format from the one they
     * are sold in — the factory shot the ear solution at 60 mL and the dental
     * water at 300 mL, and the catalogue carries the price list's sizes. The
     * picture is real and it is of the right product, so it stays on the
     * page; this row is where the buyer learns which format they are
     * looking at.
     */
    ...(PHOTO_NOTES[p.id]
      ? [{ key: 'Photograph', val: PHOTO_NOTES[p.id] }]
      : []),
  ];

  /**
   * The ordering questions for THIS SKU — and the single source of both the
   * visible Q&A and the FAQPage schema.
   */

/**
 * THE MEASURED RESULT, AT THE TOP OF THE PAGE.
 *
 * The hero carries the name, the function and the commercial terms.
 * It did not carry the measured result - the number a buyer is
 * checking, which was on the report and below the fold on the
 * product's own page.
 *
 * The answer goes in the hero, where the design system already has a
 * place for it: the answer, and the limit of the answer. The answer
 * is what the independent laboratory measured on this formula; the
 * limit says which sample the measurement belongs to, because a
 * report run on one batch is not a report on every batch.
 *
 * Every sentence here is read out of the report's own note, so the
 * page cannot say something the document does not say. A SKU with no
 * report of its own gets no answer here - it gets the honest
 * sentence further down the page.
 */
const MEASURED: Record<string, { answer: string; boundary: string }> = {
  'P001': {
    answer:
      'Independent laboratory determination: ammonia 1.53 → 0.088 mg/m³ and hydrogen sulfide 0.15 → <0.010 mg/m³, on the Power Odor Eliminator (Extra Strength) sample.',
    boundary:
      'Both determinations were run on the pet deodorant sample; the report numbers are on the page below.',
  },
  'P009': {
    answer:
      'Independent laboratory determination: ammonia 1.53 → 0.088 mg/m³ and hydrogen sulfide 0.15 → <0.010 mg/m³, on the Power Odor Eliminator (Extra Strength) sample.',
    boundary:
      'Both determinations were run on the 350 mL bottle of this formula; this kit is the 220 mL bottle with a spray gun.',
  },
  'P002': {
    answer:
      'Independent laboratory determination: ammonia 1.53 → 0.088 mg/m³ and hydrogen sulfide 0.15 → <0.010 mg/m³, with a safety assessment on the same sample.',
    boundary:
      'The two determinations were run on the Power Odor Eliminator (Extra Strength) sample; the report numbers are on the page below.',
  },
  'P003': {
    answer:
      'Measured for this line: pH 6.96 at 25 °C, available chlorine 130 mg/L before storage and 111 mg/L after 14 days at 54 °C — a 14.6% fall, inside the ≤15% that GB/T 38499-2020 sets for a one-year shelf life — and an acute oral toxicity test on the same batch.',
    boundary:
      'The chlorine stability and the toxicity test were run on the Disinfectant & Deodorizing Solution (sodium hypochlorite) sample; the report numbers are on the page below.',
  },
  'P007': {
    answer:
      'Independent laboratory determination on the cat litter deodorizer: ammonia 1.53 → 0.052 mg/m³, a 96.6% removal.',
    boundary:
      'The determination was run on the cat litter deodorizer sample; the report number is on the page below.',
  },
  'P008': {
    answer:
      'Independent laboratory determination on the cat litter deodorizer: ammonia 1.53 → 0.052 mg/m³, a 96.6% removal.',
    boundary:
      'The determination was run on the cat litter deodorizer sample; the report number is on the page below.',
  },
  'P004': {
    answer:
      'Measured by an accredited laboratory: fungicidal kill rates above 99.999% against Trichophyton mentagrophytes and Microsporum canis, under GB/T 27404.1.1.9.',
    boundary:
      'The test was run on the CatClean Antifungal & Deodorizing Solution sample; the report number is on the page below.',
  },
  'P010': {
    answer:
      'Measured for this line: inhibition rate above 99.97%, where the standard reads ≥90% as a strong antibacterial action; a 100% mite kill rate at 48 hours against Dermatophagoides farinae; and a microbiological and quality test — aerobic bacterial count below 10 CFU/g, thermotolerant coliforms absent, meeting QB/T 4524-2013.',
    boundary:
      'All three were run on batch 2024061102 of the Multi-Purpose Pet Wash; the report numbers are on the page below.',
  },
  'P011': {
    answer:
      'Measured for this line: inhibition rate above 99.97%, where the standard reads ≥90% as a strong antibacterial action; a 100% mite kill rate at 48 hours against Dermatophagoides farinae; and a microbiological and quality test — aerobic bacterial count below 10 CFU/g, thermotolerant coliforms absent, meeting QB/T 4524-2013.',
    boundary:
      'All three were run on batch 2024061102 of the Multi-Purpose Pet Wash; the report numbers are on the page below.',
  },
};

  const faqItems = productFaq(p);

  const blocks: V2Block[] = [
    {
      kind: 'hero',
      eyebrow: `${siteConfig.brand.name} · ${p.sku_oem}`,
      title: name,
      // `name_en` already carries the size ("... 500 mL"), so repeating the
      // specification here just printed the number twice. The line name adds
      // information the title does not carry.
      accent: lineName,
      lead: subtitle,
      /*
       * The measured result, when this formula has one. It goes above
       * the fold because it is the thing a buyer came for.
       */
      answer: MEASURED[p.id]?.answer ?? (p.conclusion ? `${p.function_en} — ${p.conclusion}` : undefined),
      boundary:
        MEASURED[p.id]?.boundary ??
        (p.conclusion && !/report [A-Za-z0-9]/.test(p.conclusion)
          ? 'This is our specification, not a third-party test result. Testing can be arranged, and we will confirm the sample, the method and the cost in writing before anything is ordered.'
          : undefined),
      // Mechanism, surface, form - the three answers a buyer comparing
      // pages inside one line actually makes.
      chips: PRODUCT_CHIPS[p.id],
      primaryCta: { label: W.requestPricing, href: '#rfq', note: 'quote < 1 business day' },
      secondaryCta: { label: W.allProducts, href: '/products.html', variant: 'secondary' },
      // The hero half is a PHOTOGRAPH, never the packshot.
      //
      // A cut-out standing on the ink band read as a sticker: the packshot is
      // a studio object and the band is a dark room, and no amount of glow
      // makes that pair feel like one picture. A photograph of the animal the
      // formulation is made for carries the same promise the home page makes
      // with its factory gate.
      //
      // The product itself is not lost: it is the subject of the scene block
      // further down, where it stands on a lit surface beside the claim.
      image: {
        src: heroWall.src,
        alt: heroWall.alt,
        priority: true,
        fit: 'cover',
      },
      metrics: [
        { value: `${p.moq.toLocaleString(L === 'de' ? 'de-DE' : L === 'es' ? 'es-ES' : 'en-US')}`, label: W.minimumOrder, note: moqUnit(p.moq_unit, L) },
        { value: `${p.lead_time_days_stock} d`, label: W.stockLead, note: 'ready to ship' },
        { value: `${p.lead_time_days_oem} d`, label: W.oemLead, note: 'private label' },
        { value: `${p.shelf_life_months} mo`, label: W.shelfLife, note: 'sealed' },
      ],
    },

    /*
     * THE LINE, IN THE BUYER'S WORDS.
     *
     * Four lines, four openings. The same paragraph on every product
     * page read as a template, and a buyer who opened three pages
     * before the fourth had learned nothing the second time.
     */
    ...(intro
      ? [
          {
            kind: 'callout' as const,
            title: `About the ${lineName} line`,
            body: intro,
          },
        ]
      : []),

    {
      kind: 'proofBar',
      items: [
        { label: siteConfig.metrics.gmpStandard, detail: W.gmpFacility, href: '/certifications.html' },
        ...(p.msds_available ? [{ label: W.msdsOnRequest, href: '/msds.html' as string }] : []),
        /*
         * The reports that cover THIS SKU.
         *
         * It used to be one link to the certifications page, which lists every
         * report the factory holds - so a buyer on the spray's own page had to
         * go and find which of the ten reports were about the spray. The
         * reports carry the SKU they cover; this links them directly.
         */
        ...skuReports.map((r) => ({
          label: `Report ${r.number}`,
          // What the report tested, and then the two things printed on
          // the document that a buyer uses to check it: the
          // verification code and the batch the sample came from.
          detail: [
            r.test,
            r.verificationCode ? `code ${r.verificationCode}` : null,
            r.lot ? `batch ${r.lot}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          href: `/reports/${r.slug}.html`,
        })),
        ...(skuReports.length === 0
          ? [{ label: W.labReports, detail: W.labsAccredited, href: '/certifications.html' }]
          : []),
        { label: W.tradeCompliance, href: '/trade-compliance.html' },
      ],
    },

    {
      kind: 'scene',
      eyebrow: 'In use',
      /*
       * The scene says where the product goes, so it must not say something
       * the product is not for. It used to read "What it looks like on the
       * animal it is made for" on every page — including the deodorizing
       * spray, whose own usage notes say "apply to the surface and let it
       * dry". A buyer comparing this against a catalogue that separates a
       * pet spray from an environment spray would read that line and reach
       * the wrong conclusion about a product we sell on both.
       *
       * So the line follows the catalogue: on the animal, around the animal,
       * or both.
       */
      title: spansAnimalAndSpace(p)
        ? 'One formulation, two kinds of surface.'
        : use.onAnimal.length
          ? 'What it looks like on the animal it is made for.'
          : 'What it looks like where it is used.',
      lead: spansAnimalAndSpace(p)
        ? 'The same formula is made for an animal’s coat and for the surfaces around it — bedding, floors, carriers, waste areas and the litter box. Tell us which use your label has to carry and we will confirm it against your formula and your market.'
        : use.onAnimal.length
          ? 'The formulation below is specified for this use. Packaging and label artwork are yours.'
          : 'The formulation below is specified for surfaces around the animal. Packaging and label artwork are yours.',
      product: sceneProduct,
      productAlt: name + ' — ' + p.specification,
      pet: sceneWall.src,
      petAlt: sceneWall.alt,
      /*
       * The caption on the animal photograph, which used to be one fixed
       * sentence on every product page. For a SKU whose record is about the
       * environment, a photograph of a cat captioned "the animal this
       * formulation is specified for" is the exact confusion the use
       * grouping exists to remove.
       */
      petCaption: spansAnimalAndSpace(p)
        ? 'The animal this formulation is made for — and the surfaces around it.'
        : use.onAnimal.length
          ? 'The animal this formulation is specified for.'
          : 'The animal this formulation is made for.',
      audience: scene.audience,
      claim: fn,
      claimIcon: 'check',
      tone: 'light',
    },

    {
      kind: 'split',
      eyebrow: 'Composition',      title: 'What is in it.',
      body: fn,
      bullets: [
        `Ingredients: ${p.ingredients_en}`,
        /*
         * The applications, grouped by where they are used.
         *
         * Printed flat, "Pet body, Pet waste, Bedding, Floors, Litter boxes,
         * Living areas" is a list a buyer has to interpret. Grouped, it says
         * what it means: this goes on the animal AND around it.
         */
        ...useLines,
        `Shelf life ${p.shelf_life_months} months · storage ${p.storage.toLowerCase()}`,
        `${p.moq.toLocaleString()} ${p.moq_unit} minimum · ${p.lead_time_days_oem} days for private label`,
      ],
      image: (() => {
        /*
         * The picture in this block is the PRODUCT, so it has to be a picture
         * of the right thing. When no photograph proves this SKU (P005, P006,
         * P009, P011 — the photographs that exist for them carry a different
         * size), the derived technical illustration stands in: it is generated
         * from the catalogue record, so its size cannot disagree with the
         * specification table underneath it.
         */
        const img = imageFor(p.id);
        if (!img) return undefined;
        return {
          src: img.src,
          alt: img.illustration ? `${name} — technical illustration` : `${name} packshot`,
          fit: 'contain' as const,
        };
      })(),
      mediaSide: 'right',
      background: 'soft',
    },

    { kind: 'specTable', eyebrow: 'Full specification', title: 'Everything your ops team will ask for.', specs },
    /*
     * THE THREE THINGS A BUYER ASKS NEXT, ON THE PAGE THEY ASK THEM.
     *
     * The round 112 audit measured what the site answered where: the
     * factory on 11 of 99 pages, the capacity on 6, the trade terms on
     * 33. A sourcing manager asks those at the product, not at the
     * factory page - and the block that answers exactly that question,
     * metricBand, was not on a single product page.
     *
     * The two numbers that belong to this SKU lead: its minimum order
     * and its stock lead time. The factory lines are the same on every
     * product page, because the factory is the same.
     *
     * Every figure comes from lib/shenhe.config.ts. Nothing here is
     * typed twice, so the capacity cannot drift away from the factory
     * page or from the catalogue pdf.
     */
    {
      kind: 'metricBand' as const,
      eyebrow: 'Factory, capacity and how we work',
      title: 'The numbers behind the quotation',
      metrics: [
        {
          value: `${p.moq.toLocaleString(L === 'de' ? 'de-DE' : L === 'es' ? 'es-ES' : 'en-US')} ${moqUnit(p.moq_unit, L)}`,
          label: 'Minimum order',
          note: `Private label ${p.lead_time_days_oem} days`,
        },
        {
          value: `${p.lead_time_days_stock} days`,
          label: 'Stock formula, ready to ship',
        },
        {
          value: `${(siteConfig.metrics.monthlyCapacityBottles / 1000000).toFixed(0)}M bottles / month`,
          label: 'Monthly capacity',
        },
        {
          value: `${siteConfig.metrics.parkAreaM2.toLocaleString(L === 'de' ? 'de-DE' : L === 'es' ? 'es-ES' : 'en-US')} m² · ${siteConfig.metrics.gmpStandard} GMP`,
          label: `Heyuan, Guangdong · ${siteConfig.metrics.employees} people`,
        },
      ],
      note: siteConfig.pricing.policy,
    },

    /*
     * MARKET FIT — the two markets, on the page the buyer is already reading.
     *
     * WHY IT SITS HERE, NOT IN THE FAQ
     * The FAQ answers procurement questions: MOQ, lead time, terms. Whether the
     * claim on the pack survives a US or EU customs broker is not a procurement
     * question, and burying it in an accordion under "lead time" would be the
     * same mistake as printing it nowhere. It goes immediately after the
     * specification, where the buyer has just read what the product is.
     *
     * The content comes from lib/market-claims.ts, keyed by this SKU, so this
     * page and /usa and /europe cannot disagree.
     */
    { kind: 'marketFit', productId: p.id },

    /*
     * THE PRIVATE-LABEL SPECIFICATION.
     *
     * ONE SKU FOR NOW: P012, the shampoo this project is about.
     *
     * WHY A SEPARATE TABLE AND NOT MORE PROSE
     * The page already answers "what is in it" and "what ships with it"
     * in prose. What a private-label buyer asks NEXT is narrower and
     * more practical: on THIS product, what can be changed, and what is
     * fixed. That is a question with a short answer, and a short answer
     * belongs in a table, next to the full specification above it.
     *
     * AND ONLY WHAT WE CAN ALREADY COMMIT TO
     * Every row here is read out of lib/products.json or out of copy the
     * site already publishes. Nothing here is a new promise: the
     * benchmark study's asks that are not in our records - a dog/cat
     * split, a custom scent, a pump bottle, a 5 L bulk pack, an
     * ingredient exclusion list, exclusive formula ownership - are NOT
     * here, because confirming them is work we have not done. The gate
     * "the site's facts match the documents" exists to keep it that way.
     */
    ...(p.id === 'P012'
      ? [
          {
            kind: 'specTable' as const,
            eyebrow: 'Private-label customisation',
            title: 'What you can change, and what stays.',
            specs: [
              {
                key: S.formula,
                val: `${p.ingredients_en} — this one, or yours under NDA`,
              },
              {
                key: S.labelArtwork,
                val: 'Yours. Packaging print and label artwork are your files.',
              },
              {
                key: S.fixedSpec,
                val: `${p.specification} · ${p.package} · carton ${p.carton_dimensions_cm} · ${p.carton_weight_kg} kg`,
              },
              {
                key: S.shelfLife,
                val: `${p.shelf_life_months} ${S.months} from manufacture, unopened`,
              },
              {
                key: S.storage,
                val: p.storage,
              },
              {
                key: S.shipsWith,
                val: 'A batch-specific certificate of analysis, a 16-language safety data sheet, and an ingredient and allergen declaration.',
              },
              {
                key: S.privateLabelEffect,
                val: 'Private label changes the MOQ and the lead time, not the specification.',
              },
            ],
          },
        ]
      : []),

    /*
     * The prose layer, placed between the scene and the spec table.
     *
     * Order matters here and it is the buyer's order, not the layout's: a
     * visitor arrives knowing what the product is for, wants to know how to
     * use it and whether it is safe, and only then wants the spec table and
     * the cross-sell. Putting the depth block before the table means the
     * page answers the question that brought the visitor in before it asks
     * them to read a specification.
     */
    { kind: 'productDepth', productId: p.id },

    /*
     * THE BUYERS' WORDS.
     *
     * The section is here, between the product's own depth and the
     * products next to it, because that is where a buyer who has just
     * read the facts wants the confirmation: what somebody else said
     * after they ordered it.
     *
     * It is emitted only when there IS a published review. An empty
     * review section on twenty product pages is worse than no section:
     * it says "nobody has bought this" in a heading.
     */
    ...(reviews.length
      ? [
          {
            kind: 'reviews' as const,
            eyebrow: 'What buyers said',
            title: 'In their own words.',
            summary: { count: summary.count, value: summary.value },
            items: reviews.map((r) => ({
              author: r.author,
              company: r.company,
              rating: r.rating,
              body: r.body,
              date: r.date,
            })),
          },
        ]
      : []),

    {
      kind: 'related',
      eyebrow: 'Same shelf',
      title: 'Buyers often combine these.',
      items: related.map((r) => {
        // Photograph, else the drawn bottle, else nothing. The "Photo pending"
        // box used to surface on every page that shared a shelf with P011 —
        // a manufacturing gap printed on a sales page.
        const img = imageFor(r.id);
        return {
          slug: r.id,
          name: productName(r.id, r.name_en, L),
          line: r.specification,
          image: img
            ? {
                src: img.src,
                alt: img.illustration ? `${productName(r.id, r.name_en, L)} — technical illustration` : productName(r.id, r.name_en, L),
                fit: 'contain' as const,
              }
            : undefined,
          href: productUrl(r),
        };
      }),
      cta: { label: `${W.seeAll} ${products.length}`, href: '/products.html' },
    },

    {
      kind: 'ctaBand',
      eyebrow: 'Next step',
      title: `Request a quotation on ${p.sku_oem}.`,
      text: siteConfig.pricing.policy,
      note: `Private-label lead time ${p.lead_time_days_oem} days after the sample is approved.`,
      primaryCta: { label: W.requestPricing, href: '#rfq' },
      secondaryCta: { label: W.talkWhatsApp, href: `https://wa.me/${siteConfig.brand.whatsapp}`, external: true, variant: 'ghost' },
    },

    /*
     * The ordering questions, and the schema that quotes them.
     *
     * A product page without a FAQPage tells an answer engine nothing that
     * the specification table does not already say in a form it cannot lift.
     * With it, the eight answers below — minimum order, lead time, private
     * label, packing, shelf life, documents, freight, application — are
     * quotable as bounded answers with checkable numbers.
     *
     * The schema is a BLOCK, so it travels with the questions it describes: a
     * page generator that rewrites the route file cannot separate the two, and
     * the visible Q&A and the JSON-LD come out of the same array.
     */
    {
      kind: 'faq',
      eyebrow: 'Ordering',
      title: 'What procurement asks before the order.',
      items: faqItems,
    },
    {
      kind: 'seo',
      graph: [
        /*
         * Both sets of questions, in one FAQPage.
         *
         * A page can only have one FAQPage schema, and it has to describe the
         * questions the page actually shows: the eight procurement questions
         * below and the four use-and-safety questions in the depth block.
         * Google will not credit a schema that disagrees with the page.
         */
        /*
         * One question, one answer, even when two arrays both carry it.
         *
         * The two sets overlap on purpose - the procurement block and the
         * depth block were written independently and the question strings
         * were kept identical where they asked the same thing. Concatenating
         * them put "How long does production take?" into the FAQPage twice,
         * and a page that answers one question twice is a page an engine
         * has to choose from. Keep the first, which is the procurement
         * block's, because the visible #faq section shows that one.
         */
        faqPageSchema(
          [...faqItems, ...productCopy(p).faq].filter(
            (f, i, all) => all.findIndex((g) => g.q === f.q) === i,
          ),
        ),
        /*
         * The BreadcrumbList is NOT here.
         *
         * It used to be, hand-written next to the questions — and it named
         * the product as "p.name_en" while the page's own title and body
         * carried the size. It now comes from the layout's BreadcrumbTrail,
         * which draws the visible trail and the schema from one array: a
         * hierarchy the page does not show is a claim the page cannot back
         * up, and two trails that disagree are worse than none.
         */
      ],
    },

    {
      kind: 'rfq',
      eyebrow: 'Request a quotation',
      title: W.quoteRequest,
      presetProducts: [p.id],
      whatsappCta: {
        label: W.chatWhatsApp,
        href: `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(`Hi, I'd like pricing for ${p.sku_oem} (${p.specification})`)}`,
        external: true,
        variant: 'secondary',
      },
    },
  ];

  return blocks;
}
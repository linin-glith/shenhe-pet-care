/**
 * Shenhe Zhongke —v2 Block Model
 *
 * WHY THIS FILE EXISTS
 * The legacy pipeline stores page bodies as raw HTML strings
 * (`BlockRenderer` default branch -> `RichText` -> dangerouslySetInnerHTML).
 * That freezes layout inside markup: to change a section's position or
 * emphasis you must edit an HTML blob, and there is no way to state
 * "this is a proof section" in a form a renderer can reason about.
 *
 * The v2 model inverts that. A page is an ORDERED ARRAY OF TYPED BLOCKS.
 * Layout lives in the component, content lives in data, and reordering or
 * restyling a page never means touching a string.
 *
 * The block taxonomy is derived from the buyer's decision sequence, not
 * from the legacy markup's shape. A sourcing manager asks, in order:
 *
 *   1. Is this factory real?          -> hero, proofBar, proofGrid, split
 *   2. What exactly do they make?     -> productGrid
 *   3. Can they ship volume, on time? -> metricBand
 *   4. How does working together go?  -> process
 *   5. How do I start?                -> ctaBand, rfq
 *
 * Every block answers exactly one of those. A section that answers none of
 * them does not belong on the page.
 *
 * MIGRATION NOTE
 * `RichBlock` is a deliberate, marked escape hatch —some long-form copy
 * (MSDS prose, trade-compliance text) is legitimately prose and forcing it
 * into atoms would cost more than it returns. It is kept VISIBLE in the
 * type so that "how much of the site is still legacy HTML" stays a
 * measurable number rather than a vague feeling.
 */

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

import type { IconName } from '@/components/v2/Icon';

export type CtaVariant = 'primary' | 'secondary' | 'ghost' | 'light';

export interface Cta {
  label: string;
  href: string;
  variant?: CtaVariant;
  /** Renders as an outbound <a> with rel/target handling. */
  external?: boolean;
  /** Small qualifier shown beside the label, e.g. "reply < 1 day". */
  note?: string;
}

export interface MediaRef {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /**
   * True only for the single LCP image on a page. Maps to fetchpriority=high
   * + eager loading; every other image stays lazy. Misusing this is how a
   * 4 MB hero ends up lazily loaded —which is exactly the bug Phase 0 fixed.
   */
  priority?: boolean;
  /**
   * How the image fills its frame.
   *
   * DEFAULT IS NOT SAFE FOR PRODUCT SHOTS. Bottle photography is portrait
   * (541x1200); dropping it into a landscape frame with `cover` crops away
   * the cap and the base and leaves a strip of label that communicates
   * nothing. Packshots must use `contain` on a light plate.
   */
  fit?: 'cover' | 'contain';
}

export interface Metric {
  /** Pre-formatted for display: "1,000,000", "94.2%", "25–40 days". */
  value: string;
  label: string;
  /** Optional qualifier: "Lab report NACCYH25014722". */
  note?: string;
}

export type ProofKind = 'cert' | 'lab' | 'audit' | 'compliance';

export interface ProofItem {
  label: string;
  detail?: string;
  /** Link to the downloadable certificate / lab report PDF. */
  href?: string;
  kind?: ProofKind;
}

/* ------------------------------------------------------------------ */
/* Blocks                                                              */
/* ------------------------------------------------------------------ */

/** Q1 —Are you real? Opening statement + immediate proof + capability. */
export interface HeroBlock {
  kind: 'hero';
  eyebrow?: string;
  title: string;
  /** Rendered in accent colour directly after the title. */
  accent?: string;
  lead?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  image?: MediaRef;
  /** Hard capability numbers rendered server-side beneath the hero. */
  metrics?: Metric[];
  /**
   * The answer, and the limit of the answer.
   *
   * The headline is a claim; the paragraph under it should be the
   * answer a buyer can act on. An answer without a limit is a sales
   * line, so both sentences travel together.
   */
  answer?: string;
  boundary?: string;
  /**
   * THE CHARACTERISTICS, AS PILLS.
   *
   * The hero states what the thing is in one line; three short labels state
   * what it is made of, where it is used and what it was measured at, so a
   * buyer scanning a category can tell two SKUs apart without reading the
   * specification. Every label is a phrase the page already supports - the
   * ingredient, the surface, the report figure - never a benefit nobody
   * measured.
   */
  chips?: string[];
}

/** Q1 —A single scannable strip of verifiable credentials. */
export interface ProofBarBlock {
  kind: 'proofBar';
  items: ProofItem[];
}

/** Q3 —Can they ship volume, on time, at what capacity? */
export interface MetricBandBlock {
  kind: 'metricBand';
  eyebrow?: string;
  title?: string;
  metrics: Metric[];
  note?: string;
}

/** Q2 —What exactly do they make? */
export interface ProductGridBlock {
  kind: 'productGrid';
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: ProductCard[];
  cta?: Cta;
}

export interface ProductCard {
  slug: string;
  name: string;
  /** Product line, e.g. "Deodorizing & Disinfecting". */
  line: string;
  size?: string;
  blurb?: string;
  image?: MediaRef;
  /** Short proof chips, e.g. "ISO 22716", "Lab tested". */
  badges?: string[];
  href: string;
}

/** Q1/Q3 —Image beside copy. Used for factory, lab, equipment proof. */
export interface SplitBlock {
  kind: 'split';
  eyebrow?: string;
  title?: string;
  body?: string;
  bullets?: string[];
  image?: MediaRef;
  /** Which side the media sits on. */
  mediaSide?: 'left' | 'right';
  background?: 'plain' | 'soft' | 'dark';
  cta?: Cta;
}

/** Q1 —Downloadable certificates and lab reports. */
export interface ProofGridBlock {
  kind: 'proofGrid';
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: ProofItem[];
  /**
   * Accreditation marks of the ISSUING LABORATORIES, shown above the grid.
   *
   * These belong to the labs, not to our products — they say "this report
   * came from an accredited laboratory", not "our product is certified".
   * Rendering them next to the reports is what makes the download list
   * credible to a compliance reviewer, and they are the real marks printed
   * on the report letterheads.
   */
  marks?: { src: string; alt: string }[];
  /** Caption under the marks — what the accreditation actually means. */
  marksNote?: string;
  /** Link to the full list, when the grid shows only a selection. */
  cta?: Cta;
}

/** Q4 —How does an OEM project actually run? */
export interface ProcessBlock {
  kind: 'process';
  eyebrow?: string;
  title?: string;
  lead?: string;
  steps: ProcessStep[];
}

export interface ProcessStep {
  /** Short ordinal shown as "01", "02". */
  no?: string;
  title: string;
  desc?: string;
}

/** Q5 —Closing conversion band. */
export interface CtaBandBlock {
  kind: 'ctaBand';
  eyebrow?: string;
  /**
   * THE ONE BIG NUMBER, and the line under it.
   *
   * A closing band that is only a sentence asks the reader to take the
   * action on trust. A closing band that leads with a figure gives them
   * the reason to: "1 business day" is the promise the whole site is built on, and
   * it is the thing a buyer is deciding about when they reach the bottom
   * of the page. The figure is real — it comes from siteConfig, and it is
   * the same number the header states.
   */
  figure?: string;
  figureNote?: string;
  title?: string;
  text?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  /** Reassurance line under the buttons: "Reply within 1 business day". */
  note?: string;
}

/**
 * Q2 —Interactive range builder.
 *
 * This is the one block that cannot be expressed as static markup, which is
 * exactly why it earns its own type. Buyers order ranges, not single SKUs, so
 * the composer lets them assemble a combination and watch MOQ / lead time
 * respond before they ever fill in a form.
 *
 * SEO NOTE: the composer is a client island. It is accompanied by a plain
 * `<ul>` of every SKU so crawlers —and buyers with JS disabled —still get
 * real, crawlable catalogue links. Never ship the composer alone.
 */
export interface ComposerBlock {
  kind: 'composer';
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Cap on simultaneous selections. */
  maxPick?: number;
  /** Flat crawlable SKU list rendered beneath the composer. */
  skuIndex?: { id: string; name: string; href: string }[];
}

/**
 * Q5 —Inline RFQ capture.
 *
 * B2B buyers overwhelmingly hate forms that ask for everything. This block
 * asks only for what is needed to quote: what you want, how much, and how
 * to reply. Everything else is negotiated on the first call.
 */
export interface RfqBlock {
  kind: 'rfq';
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Product ids to pre-select; empty means "not specified yet". */
  presetProducts?: string[];
  whatsappCta?: Cta;
}

/**
 * Q1 — A grid of titled items, each with an optional number, tag and footnote.
 *
 * This is the shape most of the legacy "feature card" grids actually are:
 * a tag, an optional figure, a title, a paragraph and sometimes a source
 * line. The legacy markup kept all of that inside an HTML string, so the
 * renderer had no way to lay it out. Carrying it as data is what lets the
 * grid become a real grid instead of a stack of full-width boxes.
 */
export interface FeatureGridBlock {
  kind: 'featureGrid';
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Column count at the widest breakpoint. */
  cols?: 2 | 3 | 4;
  items: {
    /** Small tag above the title, e.g. "Formula" / "MSDS". */
    pill?: string;
    /** Ordinal or short figure, e.g. "01" or "Registered formula composition". */
    no?: string;
    title: string;
    body?: string;
    /** Source line, e.g. "Per SKU · Updated 2024". */
    meta?: string;
    icon?: IconName;
  }[];
  /** Closing line below the grid — a caveat or a next step. */
  note?: string;
  /** Link embedded in the closing line. */
  noteCta?: { label: string; href: string };
}

/**
 * Q1 — A registration, one card, with its facts in rows.
 *
 * WHY THIS IS NOT A FEATURE GRID
 * A feature card carries a title and a paragraph. A registration is not a
 * paragraph: it is a number, a holder, dates, a status, a class, a limit
 * and a place to check it. Piled into one run of text, a reader has to
 * read all of it to find the number - and the number is the reason they
 * are on the page.
 *
 * So each card carries the number on its own, the facts in rows, the limit
 * on its own line, and a link to the register where the fact is checked.
 * The card is a LINK card: the place to verify is part of the card, not a
 * sentence the reader has to act on.
 */
export interface RecordCardsBlock {
  kind: 'recordCards';
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: {
    /** Small tag above the title: "Granted patent". */
    pill?: string;
    title: string;
    /** The name in the register's own language, under the English one. */
    subtitle?: string;
    /** The registration number, set large - it is why the card exists. */
    number?: string;
    /** The facts, in rows. */
    rows: { label: string; val: string }[];
    /** What this registration does NOT cover. Never buried in a row. */
    limit?: string;
    /** Where it is checked. */
    link?: { label: string; href: string };
  }[];
  /** Closing line below the grid. */
  note?: string;
  noteCta?: { label: string; href: string };
}

/**
 * Q1 — A dated sequence with a narrative column beside it.
 *
 * Milestones are the one place where a list of years carries the argument on
 * its own; a card grid would flatten them. The intro column holds the prose
 * that frames the sequence.
 */
export interface TimelineBlock {
  kind: 'timeline';
  eyebrow?: string;
  title?: string;
  /** Paragraphs that frame the sequence, in order. */
  intro?: string[];
  /** Short tags shown under the intro (e.g. "2020 founded"). */
  pills?: string[];
  items: { year: string; title: string; desc?: string }[];
}

/* ------------------------------------------------------------------ */
/* Escape hatch                                                        */
/* ------------------------------------------------------------------ */

/**
 * Legitimate long-form prose, explicitly marked.
 *
 * Kept as a first-class variant (rather than deleted) so the ratio
 * `count(block.kind === 'rich') / total` stays measurable. Migrating a
 * page means that number going DOWN, visibly.
 */
export interface RichBlock {
  kind: 'rich';
  eyebrow?: string;
  title?: string;
  /** Lead paragraph, lifted out of the legacy markup so it sits under the title. */
  lead?: string;
  /** Raw HTML. Injected through the vetted legacy-prose stylesheet. */
  html: string;
  width?: 'normal' | 'narrow';
}

/** Q3 —The specification table a procurement or logistics team needs. */
export interface SpecTableBlock {
  kind: 'specTable';
  eyebrow?: string;
  title?: string;
  specs: { key: string; val: string }[];
}

/** Q2 —Continue-the-shelf rail beneath a product detail page. */
export interface RelatedBlock {
  kind: 'related';
  eyebrow?: string;
  title?: string;
  items: {
    slug: string;
    name: string;
    line?: string;
    image?: MediaRef;
    href: string;
  }[];
  cta?: Cta;
}

/**
 * Q2 —What the product actually DOES to the animal.
 *
 * THE PROBLEM THIS SOLVES
 * Every other block on this site argues from the factory's side: capacity,
 * certifications, MOQ, lead time. All true, all necessary, and none of it
 * persuasive to the person who is actually buying. The end customer is not
 * buying 1,000,000 bottles a month —they are buying "my cat stops smelling".
 *
 * This block is the only one that speaks the pet's language. Each line pairs
 * real pet photography with the specific outcome the product delivers, and
 * names the SKUs that deliver it. Proof first, specification second.
 */
export interface PetLine {
  slug: string;
  title: string;
  /** The outcome, in the buyer's words, not ours. */
  effect: string;
  /** Supporting evidence —a lab figure, a test name. */
  proof?: string;
  which: 'cat' | 'dog' | 'both';
  image: string;
  /** SKU names in this line, shown as chips under the card. */
  skus?: string[];
}

export interface PetLinesBlock {
  kind: 'petLines';
  eyebrow?: string;
  title?: string;
  lead?: string;
  lines: PetLine[];
}

/* ------------------------------------------------------------------ */

/**
 * Q2 — Product composed with the animal it serves.
 *
 * The composition is authored, not photographed: the animal photo is the
 * ground, the cut-out packshot floats above it, and a connector links the two
 * with the claim. This is the only block that answers "what does this look
 * like on my animal", which is the question behind every inquiry.
 */
export interface SceneBlock {
  kind: 'scene';
  eyebrow?: string;
  title?: string;
  lead?: string;
  product: string;
  productAlt: string;
  pet: string;
  petAlt: string;
  audience: string;
  claim: string;
  claimIcon?: 'check' | 'sparkle' | 'shield' | 'leaf';
  tone?: 'light' | 'dark';
  /**
   * The caption on the animal photograph.
   *
   * It used to be one fixed sentence - "The animal this formulation is
   * specified for" - on every product page, including the ones whose
   * catalogue record is for the environment rather than the animal. A
   * deodorizer made for bedding and litter boxes was captioned as if it
   * were a coat product. It follows the catalogue now.
   */
  petCaption?: string;
}
/** Q1 — A remark that must not blend into the paragraph it follows. */
export interface CalloutBlock {
  kind: 'callout';
  title?: string;
  body: string;
  icon?: 'sparkle' | 'shield' | 'check' | 'leaf';
}

/** Q1 — A photographic plate set, used for factory and facility pages. */
export interface GalleryBlock {
  kind: 'gallery';
  title?: string;
  items: { label: string; caption?: string; src: string }[];
}

/**
 * What the buyers said.
 *
 * WHY THE REVIEWS ARE A BLOCK AND NOT A BLOB OF HTML
 * The review and the rating in the structured data have to be the same
 * review. A blob of HTML cannot be counted, so the count in the markup
 * would be a second, hand-kept number - and a hand-kept number next to a
 * generated one is how a product ends up claiming five reviews on a page
 * that shows one.
 *
 * So the block carries the reviews themselves, and the markup is derived
 * from the same list (lib/reviews.ts). One list, one count, three places
 * that read it.
 *
 * NOTHING HERE IS WRITTEN BY US
 * Every word in `body` is the buyer's. A review is only in this block
 * after the buyer agreed to be quoted.
 */
export interface ReviewsBlock {
  kind: 'reviews';
  eyebrow?: string;
  title?: string;
  /** The number of reviews, and their average - the same pair the markup carries. */
  summary: { count: number; value: number };
  items: {
    author: string;
    company?: string;
    rating: number;
    body: string;
    date: string;
  }[];
}

/** Q5 - Extractable Q&A.
 *
 * Written for GEO: an AI answer engine quotes bounded answers with checkable
 * specifics, not marketing adjectives. Each `a` must contain a number, a
 * document, a named standard, or an honest boundary. Never a price.
 */
export interface FaqBlock {
  kind: 'faq';
  eyebrow?: string;
  title?: string;
  items: { q: string; a: string }[];
}

/**
 * A schema.org block that renders nothing but its JSON-LD.
 *
 * WHY IT EXISTS
 * The schema has to be server-rendered — a crawler that does not run
 * JavaScript must still see it — and it has to be derived from the same data
 * the page renders. Carrying it as a BLOCK means a page's structured data
 * travels with its content: the composition declares the FAQPage next to the
 * FAQ it describes, and a page generator that rewrites the route file cannot
 * separate the two.
 */
export interface SeoBlock {
  kind: 'seo';
  /** One or more schema.org nodes. Rendered as a single @graph. */
  graph: Record<string, unknown>[];
}

/**
 * The product page's prose layer.
 *
 * A SKU page used to carry a specification table and nothing else a crawler
 * could read: 583 words of visible text, against 800–1,500 on comparable
 * supplier pages. This block carries the prose that closes that gap — what the
 * product does, where it is used, how to use it, and the questions a buyer
 * asks before buying. It is a block rather than a component so it sits in the
 * page's ordered sequence and can be placed between the scene and the spec
 * table, which is where a buyer actually reads it.
 *
 * The copy is derived from the product record, not typed per SKU. Nothing in
 * it states a fact that is not already in lib/products.json.
 */
export interface ProductDepthBlock {
  kind: 'productDepth';
  /** The SKU this page is about. */
  productId: string;
}

/**
 * The category page's prose layer.
 *
 * A category page lists the SKUs in a line. On its own that is a thin page:
 * 217–307 words with no FAQ and nothing for a crawler beyond the product
 * cards, which are already linked from the catalogue. What a category page
 * should answer is the question a buyer has BEFORE they know which SKU they
 * want — what is in this line, what differs between the products in it, how
 * do I choose. That is a different question from the one the SKU pages answer.
 */
export interface CategoryDepthBlock {
  kind: 'categoryDepth';
  /** Product-line slug, e.g. 'grooming-care'. */
  category: string;
}

/**
 * WHERE THIS SKU STANDS, MARKET BY MARKET.
 *
 * A buyer reading a product page is one step from asking "can I actually sell
 * this at home". The answer exists on /usa and /europe as a twenty-row table;
 * this block puts the two rows that concern THIS SKU on the page the buyer is
 * already reading, and links to the full table for the rest.
 *
 * The position comes from lib/market-claims.ts, so the product page cannot
 * disagree with the market page about the same SKU.
 */
export interface MarketFitBlock {
  kind: 'marketFit';
  productId: string;
}

export type V2Block =  | HeroBlock
  | ProofBarBlock
  | MetricBandBlock
  | ProductGridBlock
  | ComposerBlock
  | SceneBlock
  | CalloutBlock
  | GalleryBlock
  | PetLinesBlock
  | SpecTableBlock
  | RelatedBlock
  | SplitBlock
  | ProofGridBlock
  | ProcessBlock
  | FeatureGridBlock
  | RecordCardsBlock
  | TimelineBlock
  | CtaBandBlock
  | RfqBlock
  | FaqBlock
  | ReviewsBlock
  | SeoBlock
  | RichBlock
  | ProductDepthBlock
  | CategoryDepthBlock
  | MarketFitBlock;

export type V2BlockKind = V2Block['kind'];

/* ------------------------------------------------------------------ */
/* Guards                                                               */
/* ------------------------------------------------------------------ */

/**
 * Runtime narrowing for data authored outside TypeScript.
 *
 * Blocks will eventually be loaded from JSON. `Array.isArray` alone cannot
 * tell a block array from arbitrary data, so the discriminator is checked
 * explicitly —an unrecognised shape must degrade to RichBlock rather than
 * crash the static export.
 */
const KNOWN_KINDS: ReadonlySet<string> = new Set([
  'hero',
  'proofBar',
  'metricBand',
  'productGrid',
  'composer',
  'scene',
  'petLines',
  'specTable',
  'related',
  'split',
  'proofGrid',
  'process',
  'featureGrid',
  'recordCards',
  'timeline',
  'ctaBand',
  'rfq',
  'callout',
  'gallery',
  'faq',
  'reviews',
  'rich',
]);

export function isV2Block(x: unknown): x is V2Block {
  return (
    typeof x === 'object' &&
    x !== null &&
    KNOWN_KINDS.has((x as { kind?: unknown }).kind as string)
  );
}

export function hasV2BlockKind<K extends V2BlockKind>(block: V2Block, kind: K): block is Extract<V2Block, { kind: K }> {
  return block.kind === kind;
}
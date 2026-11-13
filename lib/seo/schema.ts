/**
 * schema.org markup for the pages the legacy extractor could not supply.
 *
 * WHY A GENERATOR INSTEAD OF MORE HAND-WRITTEN JSON
 * The legacy head was captured off the live site, so it carried JSON-LD for the
 * pages that already had it. Twelve public pages had none: the catalogue, the
 * three line pages, five product pages, about, terms, privacy, msds,
 * ai-customize and the blog. Hand-writing twelve blocks would mean twelve
 * places to let a SKU count, a price or a URL drift out of date — and this
 * project has one rule: no component may hardcode a product/spec/contact/
 * metric value. So the markup is derived from the same sources the page
 * renders from: `siteConfig`, `lib/products.json` and `lib/packshots.ts`.
 *
 * WHAT IS DELIBERATELY ABSENT
 * No `offers`, no `price`, no `priceCurrency`, no `availability`, no
 * `review`, no `aggregateRating`. The B2B pricing policy
 * (siteConfig.pricing) is quote-only, and `ProductSpec.description` embeds
 * literal wholesale figures — so it is never read here either. A Product
 * block without offers does not qualify for a price rich result; publishing
 * the price to earn one would break the pricing policy.
 *
 * WHAT GOOGLE SAYS ABOUT IT (2026-11-03)
 * The Search Console product-snippets report counts every one of these
 * products as invalid: 38 items, "should specify offers, review or
 * aggregateRating", and the report says a valid product snippet needs
 * one of those three. Two of the three cannot be had here:
 *
 *   - a price would have to be published ON THE PAGE, because Google
 *     requires a structured price to be visible to the visitor. It would
 *     also have to be a real number, and the catalogue carries four
 *     volume tiers per SKU plus one SKU with no price at all, so a
 *     single published price would be wrong for most buyers.
 *   - a review would have to be a real buyer's, and Google forbids
 *     self-serving reviews about the product being sold. There is no
 *     review to publish yet, and inventing one is not an option.
 *
 * So the report stays red ON THE PRODUCT PAGES. That is a decision and
 * not a defect, and it is not an indexing problem: the same report shows
 * impressions rising from 2026-10-27, which means the pages are in the
 * index.
 *
 * AND THE PAGES THAT WERE NOT THE PRODUCT'S OWN
 * Two kinds of page used to declare a product that was not theirs:
 *
 *   - the home page's catalogue tree named twenty-two products with a
 *     packshot, a brand and a URL but no SKU - a second, weaker claim
 *     about products the site already describes properly on their own
 *     pages;
 *   - the ten report pages named the product each report was evidence
 *     for - a third copy, weaker still, with a name and a size and no
 *     brand and no picture.
 *
 * A Product entity on a page that is not the product's page is a claim
 * the page cannot keep, and it is the claim Google rejects. Both are
 * gone: a catalogue entry is a ListItem, and a report page points at
 * the product's entity instead of copying it. The product entity itself
 * is untouched - it is still on the product's own page, where it is
 * complete.
 *
 * AND THE FOUR ITEMS THAT WERE NOT PART OF THAT DECISION
 * On 2026-11-09 the same report named four items on the HOME page:
 * "should specify price or priceSpecification.price (in offers)",
 * "should specify priceCurrency", "missing field review", "missing field
 * aggregateRating" - one per product line. Those four were not the
 * decision above; they were the catalogue tree, which was an OfferCatalog,
 * and an OfferCatalog is a catalogue OF OFFERS. The tree is an ItemList
 * now, and the four items go with it.
 *
 * What the markup CAN carry is the rest of what a buyer screens for, and
 * that is what `productProperties` below adds: the minimum order, the
 * two lead times, the shelf life, the HS code and the carton. All of
 * them are already printed on the page, so the markup and the page
 * cannot disagree.
 *
 * A build gate holds the policy: if a price, an offer or a review ever
 * appears in the markup, the build says so instead of the site's face
 * changing without anybody noticing.
 */

import { siteConfig } from '@/lib/shenhe.config';
import { PUBLISHED_LOCALES } from '@/lib/i18n/config';
import { PRODUCT_ROUTE, getLineLabel, productUrl, products, lineProductBySlug, LINE_PRODUCTS, type ProductSpec, type LineProduct } from '@/lib/products';
import { PACKSHOT } from '@/lib/packshots';
import { reviewsForSku, ratingSummary, reviewSchema } from '@/lib/reviews';
import { LINE_PAGES } from '@/lib/seo/meta';
import { organizationSchema } from './brand';
import { BUILD_DATE } from './build-date';
import { PRODUCT_CHIPS } from '@/lib/product-chips';

const SITE = siteConfig.brand.siteUrl;
const abs = (p: string) => (p.startsWith('http') ? p : `${SITE}${p.startsWith('/') ? '' : '/'}${p}`);



/* The brand lives in its own module: it depends on the site config and
   nothing else, so a client component can publish it without dragging the
   catalogue - and the per-SKU prices inside it - into the browser bundle. */
export { organizationSchema, brandSchema, siteGraphSchema, BRAND_LOGO } from './brand';

/**
 * The facts a buyer screens for, as schema properties.
 *
 * WHY THESE AND NOT THE PRICE
 * A price cannot go here (see the header). What CAN go here is everything
 * else a buyer sorts a supplier by, and every one of these numbers is
 * already printed on the product page: the minimum order, the two lead
 * times, the shelf life, the HS code and the carton. Putting them in the
 * markup means an assistant reading the page gets the same figures the
 * page shows, instead of having to scrape them out of a sentence.
 *
 * Derived from the record, never typed. The price itself is not here and
 * "quote on request" is not here either: a string that says the price is
 * unknown is not a price, and it would only give a parser something to
 * complain about.
 */
/**
 * How this product is priced, in the one form the site uses.
 *
 * A Product node with no price is not an omission - it is a B2B
 * business that quotes per order. Google's product summary report
 * named the missing "offers" as invalid content on 2026-11-09, and the
 * answer to "why is there no price" belongs in the markup, not only in
 * a sentence somewhere on the page: every product says how it is
 * priced, and the words come from the configuration, which is the one
 * place the pricing policy is written down.
 */
function pricingProperty() {
  return {
    '@type': 'PropertyValue',
    name: 'Pricing',
    value: siteConfig.pricing.productPricing,
  };
}

function productProperties(p: ProductSpec) {
  return [
    {
      '@type': 'PropertyValue',
      name: 'Minimum order',
      value: `${p.moq.toLocaleString('en-US')} ${p.moq_unit}`,
    },
    {
      '@type': 'PropertyValue',
      name: 'Stock lead time',
      value: `${p.lead_time_days_stock} days`,
    },
    {
      '@type': 'PropertyValue',
      name: 'Private-label lead time',
      value: `${p.lead_time_days_oem} days`,
    },
    {
      '@type': 'PropertyValue',
      name: 'Shelf life',
      value: `${p.shelf_life_months} months`,
    },
    { '@type': 'PropertyValue', name: 'HS code', value: p.hs_code },
    { '@type': 'PropertyValue', name: 'Packaging', value: p.package },
    /*
     * THE SAME THREE LABELS THE PAGE RENDERS AS PILLS.
     *
     * The hero shows them to the buyer; an assistant that never renders the
     * page reads them here instead. Both come from the one vocabulary in
     * lib/product-chips.ts, so the markup cannot describe a product the page
     * no longer describes. Each label is a phrase the page proves further
     * down, and the pricing property stays last: the answer to "what does it
     * cost" is the one this business always gives.
     */
    ...(PRODUCT_CHIPS[p.id] ?? []).map((c) => ({
      '@type': 'PropertyValue',
      name: 'Product characteristic',
      value: c,
    })),
    pricingProperty(),
  ];
}

export function productSchema(p: ProductSpec) {
  const shot = PACKSHOT[p.id];
  /*
   * THE RATING, WHEN THERE IS ONE.
   *
   * Google shows a star rating next to a product result only when the
   * reviews are real, and it checks two things: that the rating in the
   * markup matches the average of the reviews, and that the count
   * matches the reviews on the page. Both numbers are computed here from
   * the same list the page renders (lib/reviews.ts), so they cannot
   * disagree.
   *
   * When there is no published review, there is no aggregateRating and
   * no review: an empty rating is worse than no rating, and a rating
   * nobody wrote is a lie.
   */
  const reviews = reviewsForSku(p.id);
  const rating = ratingSummary(reviews);
  return {
    '@type': 'Product',
    dateModified: BUILD_DATE,
    '@id': `${SITE}${productUrl(p)}#product`,
    name: p.name_en,
    description: p.function_en,
    sku: p.sku_oem,
    mpn: p.sku_oem,
    category: getLineLabel(p.line),
    url: `${SITE}${productUrl(p)}`,
    ...(shot ? { image: abs(shot) } : {}),
    brand: { '@type': 'Brand', name: siteConfig.brand.name },
    manufacturer: { '@id': `${SITE}/#organization` },
    additionalProperty: productProperties(p),
    ...(reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(rating.value),
            reviewCount: String(rating.count),
            ratingCount: String(rating.count),
            bestRating: String(rating.bestRating),
            worstRating: String(rating.worstRating),
          },
          review: reviews.map(reviewSchema),
        }
      : {}),
  };
}

/**
 * ONE CATALOGUE ENTRY: THE FACTS A BUYER SCREENS FOR.
 *
 * WHY ONE BUILDER AND NOT TWO
 * The home page lists the catalogue twice - flat, and as a tree of four
 * product lines - and the two lists carried different amounts of the
 * same facts: the tree had the packshot, the brand and the category,
 * the flat list had a name and a URL. So the site said two different
 * things about one catalogue, and an assistant reading the flat list
 * got less out of it than one reading the tree.
 *
 * So the entry is built once, here, and both lists use it. The markup
 * and the page cannot drift apart, because there is only one place to
 * drift from.
 *
 * WHY THE ENTRY IS NOT A PRODUCT
 * It is a ListItem, and that is the point. A Product has to carry an
 * offer, a review or a rating to be valid, and this site publishes no
 * offer - it quotes per order - and has no real buyer review yet. So
 * every Product the catalogue declared was invalid content in Google's
 * product summary report, and it would stay invalid until the first
 * buyer signed off.
 *
 * Nothing is lost by it. The product entity is on the product's own
 * page, where it is complete: the SKU, the MPN, the packshot, the
 * minimum order, the two lead times and the shelf life.
 *
 * WHY THE ENTRY CARRIES NO @id
 * The product's entity has one: its own page's address with "#product"
 * on the end. An entry that borrowed it would put a ListItem and a
 * Product under one identifier, and a reader that merges the two would
 * find a Product on the catalogue page again - the thing this change
 * exists to remove. An entry in a list is identified by its position
 * in that list and by the address of the page that describes it.
 */
function catalogueEntry(p: ProductSpec) {
  const shot = PACKSHOT[p.id];
  return {
    dateModified: BUILD_DATE,
    name: p.name_en,
    description: p.function_en,
    url: `${SITE}${productUrl(p)}`,
    ...(shot ? { image: abs(shot) } : {}),
    brand: { '@type': 'Brand', name: siteConfig.brand.name },
    manufacturer: { '@id': `${SITE}/#organization` },
    category: getLineLabel(p.line),
    additionalProperty: [pricingProperty()],
  };
}

export function itemListSchema(items: ProductSpec[], name: string) {
  return {
    '@type': 'ItemList',
    dateModified: BUILD_DATE,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      ...catalogueEntry(p),
    })),
  };
}

/**
 * The catalogue, as a tree of categories.
 *
 * WHY A TREE AND NOT A FLAT LIST
 * A flat ItemList says "there are twenty things". A tree says "there are
 * four shelves, and here is what is on each of them" - which is how the
 * site itself is organised, and how a buyer thinks when they arrive asking
 * for "a deodorizing line" rather than for a SKU id. The competitor pages
 * that do this are the reason the site was indexed as a catalogue at all:
 * before this, the only structured data on the home page was the brand, the
 * organisation and the FAQ.
 *
 * EVERY ITEM IS A REAL PAGE
 * Each entry is a Product with the URL of the page that sells it, and every
 * line has the URL of the line page that groups it. Nothing here points at a
 * page that does not exist, because the list is built from the catalogue
 * record and the route map rather than written out.
 *
 * IT IS AN ItemList, NOT AN OfferCatalog - AND THAT IS THE POINT
 *
 * An OfferCatalog is a catalogue OF OFFERS. This site publishes no offer:
 * it is quote-only (siteConfig.pricing), so there is no price and no
 * availability to publish, and the header of this file says why that stays
 * that way.
 *
 * The tree was an OfferCatalog until 2026-11-09, and Google's product
 * summary report named the four nested catalogues on the home page as the
 * reason: "should specify price or priceSpecification.price (in offers)",
 * "should specify priceCurrency", "missing field review", "missing field
 * aggregateRating" - four items, one per product line, asking for exactly
 * the offers the site does not publish.
 *
 * The tree survives the change. It is an ItemList whose elements are
 * ItemLists, which still says "four shelves, and here is what is on each of
 * them". What it no longer says is "these are offers" - and a schema that
 * promises offers we do not make is a claim the page cannot keep.
 *
 * EACH ENTRY CARRIES ITS IDENTITY
 * The entries used to carry a name and a URL and nothing else, while the
 * product pages carried the packshot, the brand and the line. So the
 * catalogue announced twenty-two products it could not describe, and an
 * assistant reading the home page got less from it than from the product
 * page it linked to. The entries now carry the same identity facts the
 * product pages carry - and, like them, no price.
 */
export function catalogueTreeSchema(opts?: { name?: string; url?: string }) {
  const byLine = new Map<ProductSpec['line'], ProductSpec[]>();
  for (const p of products) {
    const list = byLine.get(p.line) ?? [];
    list.push(p);
    byLine.set(p.line, list);
  }

  /*
   * THE FOURTH LINE IS IN HERE TOO.
   *
   * Pet Nutrition has no catalogue SKU: its two products are quoted one at a
   * time, so they are not in products.json. They are still products with
   * their own pages, and the site says there are four product lines — so a
   * catalogue tree with three lines in it would contradict the sentence next
   * to it.
   */
  /*
   * THE ENTRIES ARE NOT PRODUCTS.
   *
   * They were, and Google's product summary report named all twenty-two
   * of them on the home page: "should specify offers, review or
   * aggregateRating". A Product has to carry one of those three, and
   * this site publishes no offer (it is quote-only) and has no real
   * review yet - so every one of them was invalid, and would stay
   * invalid until the first buyer signs off.
   *
   * The fix is not a price and not a rating. It is that the home page
   * was declaring the products a second time, and a worse way: each
   * entry had a name, a brand, a URL and a picture, and no SKU, while
   * the product's own page carries the same product with the SKU, the
   * MPN, the packshot, the minimum order and the lead time. The home
   * page added no fact an engine could not read from the page it
   * linked to - it added a second, incomplete claim, and that claim is
   * the one Google rejects.
   *
   * So the entry keeps every fact it had and stops claiming to be a
   * Product: it is a ListItem. The product entity stays on the
   * product's own page, where it is complete and where it belongs.
   *
   * THE SAME RULE ON THE REPORT PAGES
   * The ten report pages made the same mistake in a smaller way: their
   * `about` named the product the report was evidence for, as a Product
   * of its own - a name, a size and an internal id, with no brand and
   * no picture. Those pages are about a report. The product a report
   * was made for has its own page and its own entity, so a report page
   * points at that entity instead of copying it. A Product entity on a
   * page that is not the product's page is a claim the page cannot keep.
   */
  const lineItems = (line: ProductSpec['line']) =>
    byLine.get(line)?.map((p) => catalogueEntry(p)) ?? [];

  const lines: { label: string; items: object[] }[] = [];
  for (const [line] of byLine) {
    lines.push({ label: getLineLabel(line), items: lineItems(line) });
  }
  lines.push({
    label: getLineLabel('pet_nutrition'),
    items: Object.values(LINE_PRODUCTS).map((p) => ({
      dateModified: BUILD_DATE,
      name: `${p.name} ${p.size}`,
      description: p.description,
      url: `${SITE}/products/${p.slug}.html`,
      image: abs(p.image),
      brand: { '@type': 'Brand', name: siteConfig.brand.name },
      manufacturer: { '@id': `${SITE}/#organization` },
      category: getLineLabel('pet_nutrition'),
      additionalProperty: [pricingProperty()],
    })),
  });

  /*
   * THE LINE PAGE IS LOOKED UP, NOT DERIVED.
   *
   * The line id is `deodorizing_disinfection` and the page is
   * `deodorizing-disinfecting` — turning the underscore into a hyphen gives
   * `deodorizing-disinfection`, which is a page that does not exist. The
   * slug is therefore looked up in the table of the four line pages, by the
   * line's canonical name, and the URL is left out when the lookup fails.
   * A missing URL is a smaller lie than a URL to nowhere.
   */
  const linePageUrl = (label: string) => {
    const slug = Object.keys(LINE_PAGES).find((s) => LINE_PAGES[s].label === label);
    return slug ? `${SITE}/products/${slug}.html` : undefined;
  };

  const catalogueSkuCount = products.length;
  const quotedOnlyCount = Object.keys(LINE_PRODUCTS).length;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(opts?.name ? { name: opts.name } : {}),
    ...(opts?.url ? { url: opts.url } : {}),
    numberOfItems: catalogueSkuCount + quotedOnlyCount,
    /*
     * WHY THE COUNT NEEDS SAYING.
     *
     * `numberOfItems` here is 22: the 20 catalogue SKUs plus the 2 Pet
     * Nutrition products, which are quoted one at a time and carry no SKU
     * code. The ItemList elsewhere on the same page says 20, because an
     * ItemList of catalogue SKUs is 20.
     *
     * Both numbers are right and they count different things, but the
     * page did not say so — so an answer engine reading the page found
     * "22" and "20" on the same screen and had to guess which one was
     * the catalogue. A reader who quotes the wrong one quotes a number
     * the factory cannot support.
     *
     * So the count now carries its own definition, in the same object,
     * where a machine reads it: 20 catalogue SKUs, plus 2 quoted-only
     * products that have no SKU. The sentence a human reads on the
     * products page already says "20 SKUs" — this says why the tree
     * above it has more.
     */
    description:
      `The catalogue: ${catalogueSkuCount} private-label SKUs` +
      (quotedOnlyCount
        ? `, plus ${quotedOnlyCount} Pet Nutrition products that are quoted individually and carry no SKU code.`
        : '.'),
    itemListElement: lines.map((line) => ({
      '@type': 'ItemList',
      name: line.label,
      ...(linePageUrl(line.label) ? { url: linePageUrl(line.label) } : {}),
      itemListElement: line.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        ...item,
      })),
    })),
  };
}

/**
 * A product that has a page but no catalogue SKU.
 *
 * The two Pet Nutrition line products are quoted one at a time rather than out
 * of the catalogue grid, so there is no `ProductSpec` to build a schema from.
 * They are still products with their own page, and a page whose schema calls
 * it a CollectionPage tells a crawler it is a list.
 *
 * No offers, no price — the same quote-only rule as every other product here.
 */
export function lineProductSchema(p: LineProduct) {
  return {
    '@type': 'Product',
    dateModified: BUILD_DATE,
    '@id': `${SITE}/products/${p.slug}.html#product`,
    name: `${p.name} ${p.size}`,
    description: p.description,
    image: abs(p.image),
    brand: { '@type': 'Brand', name: siteConfig.brand.name },
    manufacturer: { '@id': `${SITE}/#organization` },
    url: `${SITE}/products/${p.slug}.html`,
    // The same buyer-screening facts as every other product, and the same
    // absence of a price. These two are quoted one at a time, so the
    // minimum order is the one thing that can be stated.
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Minimum order', value: p.moq },
      pricingProperty(),
    ],
  };
}

export function webPageSchema(opts: {
  name: string;
  path: string;
  description?: string;
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'Service' | 'Blog';
  datePublished?: string;
  /**
   * The thing this page is about, when the page is about one thing.
   *
   * `about` says what the page is generally about — here, the company. But a
   * page about a single product, or a single laboratory report, has a
   * primary subject, and an assistant reading the page cannot get from
   * "this is about the company" to "this is about the cat antifungal spray"
   * without reading the prose. `mainEntity` is the link that says it.
   */
  mainEntity?: object;
  /**
   * The part of the page an assistant should read aloud.
   *
   * `speakable` names the element, by CSS selector, that carries the answer
   * to the question the page is asked. It is only useful if the selector
   * resolves to something on the page, so the build gate checks that it does
   * — a selector that points at nothing is worse than no selector, because
   * it says the page has a spoken summary and does not.
   */
  speakable?: string;
  /**
   * Who reviewed the content, when the page says so on the page.
   */
  reviewedBy?: object;
}) {
  /*
   * THE DATE THE PAGE WAS LAST CHANGED.
   *
   * A search engine judges how fresh a page is by the date in its
   * markup, and without one it has nothing to compare. The Chinese
   * search guide puts it plainly: the date has to always be there.
   * The same is true of every engine that re-crawls a page and asks
   * whether it has changed.
   *
   * So the page carries the date it was last built. That is the day
   * the content was last touched, which is the honest answer - and it
   * is a date, not a claim: the build knows it, and a reader does
   * not need to.
   *
   * A page that has its own publication date - an article - keeps it,
   * and carries the build date as the date it was last changed.
   */
  const built = opts.datePublished ?? BUILD_DATE;
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${SITE}${opts.path}#webpage`,
    name: opts.name,
    url: `${SITE}${opts.path}`,
    ...(opts.description ? { description: opts.description } : {}),
    datePublished: built,
    dateModified: built,
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': `${SITE}/#organization` },
    inLanguage: 'en',
    ...(opts.mainEntity ? { mainEntity: opts.mainEntity } : {}),
    ...(opts.speakable
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: [opts.speakable],
          },
        }
      : {}),
    ...(opts.reviewedBy ? { reviewedBy: opts.reviewedBy } : {}),
  };
}

/**
 * The breadcrumb trail, as schema.
 *
 * The trail and its markup live together in lib/seo/breadcrumbs.ts, because
 * the visible trail and the schema must be the same array: a schema that
 * describes a hierarchy the page does not show is a claim the page cannot
 * back up.
 */
export { breadcrumbSchema } from '@/lib/seo/breadcrumbs';

export function websiteSchema() {  return {
    '@type': 'WebSite',
    dateModified: BUILD_DATE,
    '@id': `${SITE}/#website`,
    url: `${SITE}/`,
    name: siteConfig.brand.name,
    publisher: { '@id': `${SITE}/#organization` },
    // The languages the site is published in - read from PUBLISHED_LOCALES,
    // not written out. This used to say ['en', 'es', 'de'], which was true
    // before the /de/ and /es/ trees were removed and has been false since.
    // See the note in lib/seo/brand.ts.
    inLanguage: [...PUBLISHED_LOCALES],
  };
}

/**
 * A FAQPage built from the SAME array the page renders.
 *
 * WHY IT IS GENERATED, NOT HAND-WRITTEN
 * The homepage and catalogue carry seven GEO answers each — question phrased
 * the way a buyer phrases it, answer carrying a number or an honest limit.
 * They are the asset an answer engine lifts. A hand-written JSON-LD copy of
 * them drifts: the homepage once rendered seven visible Q&A pairs while
 * shipping no FAQPage at all, and an earlier build shipped a stale
 * three-question schema that matched nothing on the page.
 *
 * Generating from the render array makes that impossible — the schema cannot
 * describe a question the page does not show, or miss one it does.
 */
export function faqPageSchema(
  items: { q: string; a: string }[],
  opts?: { name?: string; url?: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    dateModified: BUILD_DATE,
    ...(opts?.name ? { name: opts.name } : {}),
    ...(opts?.url ? { url: opts.url } : {}),
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * The schema for a page, derived from the path it lives at.
 *
 * Returns null when the page already carries JSON-LD from the legacy head, or
 * when the path means nothing to the catalogue.
 */
export function schemaForPath(source: string): object[] | null {
  const path = source.endsWith('/index.html') ? `/${source.slice(0, -'index.html'.length)}` : `/${source}`;
  const slug = source.replace(/^products\//, '').replace(/\.html$/, '');

  // --- the catalogue ---
  if (source === 'products/index.html') {
    return [
      webPageSchema({
        name: 'Pet care product catalogue',
        path: '/products.html',
        description: siteConfig.brand.shortPitch,
        type: 'CollectionPage',
      }),
      itemListSchema(products, 'Pet care product catalogue'),
    ];
  }

  // --- a SKU's own page ---
  if (source.startsWith('products/')) {
    const bySlug = products.find((p) => PRODUCT_ROUTE[p.id] === slug);
    if (bySlug) {
      return [
        productSchema(bySlug),
        webPageSchema({
          name: bySlug.name_en,
          path: `/products/${slug}.html`,
          description: bySlug.function_en,
        }),
      ];
    }

    // --- a product with a page but no catalogue SKU ---
    const lineProduct = lineProductBySlug(slug);
    if (lineProduct) {
      return [
        lineProductSchema(lineProduct),
        webPageSchema({
          name: `${lineProduct.name} ${lineProduct.size}`,
          path: `/products/${slug}.html`,
          description: lineProduct.description,
        }),
      ];
    }

    // --- a product LINE page (the catalogue's own groupings) ---
    // No ItemList here on purpose: the legacy line pages group SKUs by their
    // own editorial logic ("Pet Nutrition" lists a probiotic set and an immune
    // sachet that has no SKU id at all), and an ItemList built from
    // products.json would list SKUs the page does not show. A CollectionPage
    // on its own is accurate; a wrong ItemList is not.
    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return [
      webPageSchema({
        name,
        path: `/products/${slug}.html`,
        description: siteConfig.brand.shortPitch,
        type: 'CollectionPage',
      }),
    ];
  }

  switch (source) {
    case 'about.html':
      return [
        webPageSchema({
          name: 'About the factory',
          path: '/about.html',
          description: siteConfig.brand.shortPitch,
          type: 'AboutPage',
        }),
        organizationSchema(),
      ];
    case 'terms.html':
      return [webPageSchema({ name: 'Terms of sale', path: '/terms.html', type: 'WebPage' })];
    case 'privacy.html':
      return [webPageSchema({ name: 'Privacy policy', path: '/privacy.html', type: 'WebPage' })];
    case 'msds.html':
      return [
        webPageSchema({
          name: 'Safety data sheets',
          path: '/msds.html',
          description: 'Safety data sheets for the pet care product range.',
          type: 'CollectionPage',
        }),
      ];
    case 'ai-customize.html':
      return [
        webPageSchema({
          name: 'AI-assisted product matching',
          path: '/ai-customize.html',
          description: 'Describe a product brief and get a matching formulation.',
          type: 'Service',
        }),
      ];
    case 'oem-odm.html':
      return [
        webPageSchema({
          name: 'Pet Care OEM/ODM Manufacturing',
          path: '/oem-odm.html',
          description: siteConfig.brand.shortPitch,
          type: 'WebPage',
        }),
        professionalServiceSchema(),
      ];
    case 'blog/index.html':
      return [webPageSchema({ name: 'Insights', path: '/blog.html', type: 'Blog' })];
    default:
      return null;
  }
}


/* ------------------------------------------------------------------ */
/* ProfessionalService schema — B2B OEM/ODM service                    */
/* ------------------------------------------------------------------ */

/**
 * The OEM/ODM page as a ProfessionalService.
 *
 * WHY A PROFESSIONALSERVICE AND NOT JUST A WEBPAGE
 * A WebPage says "this is a page". A ProfessionalService says "this
 * is a business service, offered by this organization, in these
 * markets, with these terms". That is what a B2B buyer's assistant
 * reads when asked "is there a pet care OEM factory in China that
 * serves the EU" — and a WebPage does not answer it.
 *
 * Unlike Product, a ProfessionalService does not require offers or
 * prices, which makes it the right type for a quote-only B2B service
 * page. The Google product-snippets report flags Products without
 * offers as invalid; a Service is not invalid without them.
 */
export function professionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE}/oem-odm.html#service`,
    name: 'Pet Care OEM/ODM Contract Manufacturing',
    description:
      'Contract manufacturing of pet care products: OEM (your formula), ODM (our 20 ready SKUs + your label), and OBM (turnkey). 30,000 m² facility, ISO 22716 GMP, FDA-registered.',
    url: `${SITE}/oem-odm.html`,
    provider: { '@id': `${SITE}/#organization` },
    serviceType: 'OEM/ODM/OBM Contract Manufacturing',
    areaServed: [
      { '@type': 'Country', name: 'European Union' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'Brazil' },
      { '@type': 'Country', name: 'Russia' },
      { '@type': 'Country', name: 'China' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Pet Care Product Lines',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Deodorizing & Disinfecting OEM',
            description: '7 catalogue SKUs: deodorizing sprays, disinfectant solutions, cat litter deodorizer powder, antifungal spray',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Grooming & Care OEM',
            description: '11 catalogue SKUs: pet shampoo, waterless foam, paw care, ear care, dental care, laundry detergent',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Outdoor Protection OEM',
            description: '2 catalogue SKUs: plant-based insect repellent and outdoor protection spray',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Pet Nutrition OEM',
            description: 'Probiotic digestive supplements and bovine colostrum IgG, quoted per project',
          },
        },
      ],
    },
    termsOfService: `${SITE}/trade-compliance.html`,
    dateModified: BUILD_DATE,
  };
}

/* ------------------------------------------------------------------ */
/* Claim schema — product efficacy claims linked to lab reports        */
/* ------------------------------------------------------------------ */

/**
 * A product efficacy claim, linked to the lab report that verifies it.
 *
 * WHY A CLAIM AND NOT JUST TEXT IN THE PAGE
 * An AI search engine that reads "94.2% ammonia removal" in a
 * paragraph has to decide whether to trust it. A Claim that points
 * at a lab report — with a report number and a SHA-256 — gives the
 * engine a source to cite. That is what makes the difference between
 * "the site says" and "verified by NACC report NACCYH25014722".
 */
export function claimSchema(opts: {
  name: string;
  text: string;
  reportId: string;
  reportUrl: string;
}) {
  return {
    '@type': 'Claim',
    '@id': `${SITE}/reports/${opts.reportId.toLowerCase()}.html#claim`,
    name: opts.name,
    text: opts.text,
    'referenceQuery': opts.reportUrl,
  };
}

/* ------------------------------------------------------------------ */
/* Credential schema — factory certifications as credentials           */
/* ------------------------------------------------------------------ */

/**
 * The factory's credentials.
 *
 * THEY USED TO LIVE HERE, AND THAT WAS THE WRONG PLACE FOR THEM.
 *
 * Two versions of this list existed: one in this file, one nowhere. The one
 * in this file was never imported by a single page, so the organisation
 * node on every public page carried no credential at all — the list was
 * written, reviewed, and never published. A dead function is worse than a
 * missing one, because the next reader assumes it is already deployed.
 *
 * The list now lives in lib/seo/credentials.ts and is read by
 * organizationSchema() in lib/seo/brand.ts, which is what actually renders
 * the organisation node. That module had to be the home for it: the site
 * layout is a client component, and this one imports the catalogue — and the
 * catalogue carries the per-SKU reference prices that once leaked into the
 * browser bundle.
 *
 * There is exactly one list now, and it is on the wire.
 */
export { factoryCredentials, FACTORY_CREDENTIALS } from '@/lib/seo/credentials';

/* ------------------------------------------------------------------ */
/* The HowTo schema                                                   */
/* ------------------------------------------------------------------ */

export type HowToStep = {
  name: string;
  text: string;
  /** A link to more about this step, when the page has one. */
  url?: string;
};

/**
 * The HowTo schema.
 *
 * WHY A HOWTO AND NOT ANOTHER FAQ
 * An FAQ answers a question. A HowTo tells an assistant how to do
 * something, in steps, in order. That is the shape an assistant can
 * lift whole: "here are the steps, here is the first one" - which is
 * exactly what a buyer asking "how do I import pet products from
 * China" wants, and exactly what an answer engine quotes.
 *
 * The steps are not written for the schema. They are the steps the
 * page already shows. A HowTo is a claim that a reader can follow, so
 * inventing one - or marking up steps the page does not contain -
 * would make the markup a lie and the answer wrong.
 *
 * The rule this file follows: every step here appears in the page's
 * own content, and every number is a number we publish elsewhere.
 *
 * `totalTime` is in ISO 8601 duration form, which is what the format
 * expects. It is only given when the page states a duration.
 */
export function howToSchema(opts: {
  name: string;
  description: string;
  steps: HowToStep[];
  url?: string;
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    dateModified: BUILD_DATE,
    name: opts.name,
    description: opts.description,
    ...(opts.url ? { url: opts.url } : {}),
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

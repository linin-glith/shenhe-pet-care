import type { Metadata } from 'next';
import Script from 'next/script';
import type { LegacyPage } from '@/lib/legacy-types';
import { siteConfig } from '@/lib/shenhe.config';
import { ARTICLES } from '@/content/v2/articles';
import { productBySlug, lineProductBySlug, products } from '@/lib/products';
import { productTitle, productDescription, linePageMeta, lineProductTitle, lineProductDescription, productTitleLocalized, productDescriptionLocalized, lineProductTitleLocalized, lineProductDescriptionLocalized, fitDescription } from '@/lib/seo/meta';
import { schemaForPath, productSchema, webPageSchema } from '@/lib/seo/schema';
import { pageCopy, pageSlug } from '@/lib/i18n/pages';
import { BlockList } from '@/components/BlockRenderer';

/**
 * Pages that are linked in the navigation but carry no content yet.
 *
 * The blog is one: it says "coming soon" and has no posts. A search engine
 * should not index a page with nothing on it, and it should not be listed in
 * a sitemap. The link stays in the navigation so the section is announced
 * before the articles exist.
 */
/**
 * Pages that are shells rather than content.
 *
 * A blog index with no articles is a "coming soon" page: noindexing it is
 * correct, because indexing an empty category costs the whole domain a thin-
 * content signal. But this used to be a hand-maintained list, which means the
 * moment the first article lands nobody remembers to remove the entry — and
 * the content hub stays invisible to search for the entire life of the site.
 *
 * The decision now reads the article registry, not the extracted legacy JSON.
 * The JSON is a snapshot of the old page and will never contain the links to
 * articles this build renders, so asking it "are there articles?" always
 * answers no. The registry is the same source the index page renders from, so
 * the two cannot disagree.
 */
function isEmptyIndex(page: LegacyPage): boolean {
  if (!/^blog\//.test(page.source)) return false;
  return ARTICLES.length === 0;
}

/**
 * Builds Next metadata from the extracted legacy `<head>`.
 *
 * This is the zero-regression mechanism: title / description / canonical /
 * OG / Twitter all come from the JSON that was captured off the live site, so
 * a rebuild reproduces the shipped SEO bytes instead of re-authoring them.
 */
export function legacyMetadata(page: LegacyPage, locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const h = page.head;
  const canonical = h.canonical ?? `${siteConfig.brand.siteUrl}/${page.source}`;

  /**
   * A product page describes itself from the catalogue record.
   *
   * The captured legacy description on those pages ran 30–60 characters, which
   * Google renders as a stub. The catalogue record has the four things a
   * buyer screens for — what it is, how big, the minimum order and when it
   * ships — and it cannot drift, because the catalogue is the same record the
   * page's specification table is built from.
   *
   * The TITLE comes from the catalogue for the same reason, and because the
   * legacy title still carried the old sizes: "Ear Mite Cleaning Solution ·
   * 250 mL" for a 100 mL bottle, "Probiotic Pet Tooth Cleaner · 300 mL" for a
   * 150 mL one. A search result that disagrees with the page it links to is
   * the one thing an answer engine cannot check and a buyer always can.
   */
  const slug = page.source.startsWith('products/')
    ? page.source.replace(/^products\//, '').replace(/\.html$/, '')
    : '';
  const product = slug && slug !== 'index' ? productBySlug(slug) : undefined;
  /**
   * A product that is not in the catalogue (the two Pet Nutrition line
   * products) still needs a description of its own: the captured legacy one
   * ran 44 characters, which Google renders as a stub.
   */
  const lineProduct = slug && slug !== 'index' ? lineProductBySlug(slug) : undefined;
  /**
   * A LINE page describes its own catalogue group. The captured legacy
   * descriptions were marketing fragments of 44–49 characters ("All Clean,
   * Soft, Healthy products") — nothing a buyer can act on.
   */
  const linePage = slug && slug !== 'index' ? linePageMeta(slug, locale) : undefined;

  /**
   * THE PAGE'S OWN WORDS, IN THE BUYER'S LANGUAGE.
   *
   * The legacy head carried one English title and one English description,
   * and every language page inherited them. A German buyer searching
   * "Tierpflege Hersteller China" was shown a result titled in English that
   * nobody had typed, and the same page appeared three times in the index -
   * once per language - with identical text.
   *
   * The translations live in lib/i18n/pages.ts, keyed by the page's slug.
   * A page without an entry keeps its English title, which is the honest
   * answer: it has not been translated yet.
   */
  const copy = locale === 'en' ? null : pageCopy(pageSlug(page.source), locale);

  const title = product
    ? (locale === 'en' ? productTitle(product) : productTitleLocalized(product, locale))
    : (lineProduct
        ? (locale === 'en'
            ? lineProductTitle(lineProduct)
            : lineProductTitleLocalized(lineProduct, locale))
        : (copy?.title || linePage?.title || h.title || siteConfig.brand.name));

  /*
   * EVERY DESCRIPTION GOES THROUGH THE BUDGET.
   * The descriptions come from seven different places, and a hand-written
   * description is the wrong length on about a fifth of the pages. The
   * rule lives in one place instead of in each source: the text is fitted
   * to the budget at a clause boundary, never mid-word.
   */
  /*
   * THE PRODUCT DESCRIPTION GETS THE TOP OF THE WINDOW.
   *
   * The fitter cuts at 150 and the gate allows 155. So a product
   * description written at 151 to 155 comes back out of the fitter at
   * 130-140, because the tail is cut at a clause boundary - and the
   * tail is where the function line is.
   *
   * So the product description is fitted to 155 and everything else
   * to the default 150. A hand-written description at 150 is fine; the
   * short ones are short for their own reasons.
   */
  const description = fitDescription(
    product
      ? (locale === 'en'
          ? productDescription(product)
          : productDescriptionLocalized(product, locale))
      : (lineProduct
          ? (locale === 'en'
              ? lineProductDescription(lineProduct)
              : lineProductDescriptionLocalized(lineProduct, locale))
          : (copy?.description || linePage?.description || (h.description ?? siteConfig.brand.shortPitch))),
    product ? 155 : undefined,
  );

  /**
   * Portal + admin pages shipped `noindex, nofollow` and had no canonical and
   * no description. Emitting a canonical/description for them would advertise
   * login and dashboard URLs as indexable content, so we honour the legacy
   * directive instead of "improving" it.
   */
  const isPrivate = page.isPortal;
  const isEmpty = isEmptyIndex(page);
  const isNoIndex = isPrivate || isEmpty;

  return {
    title,
    ...(isNoIndex ? {} : { description }),
    ...(isNoIndex ? {} : {
      alternates: {
        canonical,
        /*
         * NO hreflang ALTERNATES.
         *
         * The legacy head carried hreflang="es"/"de" pointing at the same
         * URL with a ?lang= query, and the legacy site swapped the page
         * language in the browser from assets/i18n/*.json. The v2 site loads
         * no language switcher, so those alternates point at nothing a
         * crawler can fetch: 44 hreflang declarations across the export, all
         * of them to URLs that do not exist.
         *
         * A hreflang to a missing URL is an error, not a hint, and it
         * discards the whole cluster. The alternates come back when there are
         * real /es/ and /de/ pages with their own sitemaps and reciprocal
         * links.
         */
      },
    }),
    ...(isNoIndex ? {} : {
      openGraph: {
        type: 'website',
        url: canonical,
        siteName: siteConfig.brand.name,
        // A product page's OG title comes from the catalogue too: the legacy
        // og:title carried the same stale sizes as the legacy title, and a
        // link preview that disagrees with the page is the same defect in a
        // place the buyer notices earlier.
        title: product || lineProduct || linePage ? title : (h.ogTitle ?? title),
        description: product || lineProduct || linePage
          ? description
          : (h.ogDescription ?? description),
        images: h.ogImage ? [h.ogImage] : undefined,
        locale: 'en_US',
      },
    }),
    ...(isNoIndex ? {} : {
      twitter: {
        card: (h.twitterCard as 'summary_large_image') ?? 'summary_large_image',
        title: product || lineProduct || linePage ? title : (h.ogTitle ?? title),
        description: product || lineProduct || linePage
          ? description
          : (h.ogDescription ?? description),
        images: h.ogImage ? [h.ogImage] : undefined,
      },
    }),
    other: h.themeColor ? { 'theme-color': h.themeColor } : undefined,
    robots: isPrivate
      ? { index: false, follow: false }
      : isEmpty
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

/**
 * The captured Product, replaced by the one the catalogue builds.
 *
 * WHY
 * The product pages' structured data was a snapshot of the old site, and it
 * still said the old things. The outdoor insect repellent spray page
 * announced its own URL as `/products/outdoor-repellent-80.html`, and there
 * is no such page. Sixteen product pages pointed their own entity at a URL
 * that answers 404 - in the markup, and in llms-full.json, which is the file
 * the reading assistants are pointed at. The names and descriptions in that
 * snapshot are stale in the same way: they carried the sizes the catalogue
 * has since corrected.
 *
 * The page's title, its description and its canonical had already been moved
 * to the catalogue for exactly this reason (see legacyMetadata): a search
 * result that disagrees with the page it links to is a defect a buyer checks.
 * The structured data is the same claim in the same place, so it moves too.
 *
 * The replacement is per SKU, so a page that shows two sizes keeps two
 * products - each one now carrying its own real URL.
 *
 * A captured Product the catalogue cannot name is DROPPED, not kept. There
 * is exactly one: on the deodorizing line page it carries the image
 * `/assets/img/products/deodorizing-spray-350/hero.webp`, which answers
 * 404. A Product entity with a dead image is worse than no Product entity,
 * and the line page is a collection anyway - every product on it has its
 * own page with its own Product.
 *
 * Returns null when the catalogue cannot name the product.
 */
function liveProduct(
  node: Record<string, unknown>,
  ownSku?: string,
): Record<string, unknown> | null {
  const sku = typeof node.sku === 'string' ? node.sku : '';
  if (!sku) return null;
  /*
   * A product that is not this page's own product belongs on its own page.
   *
   * Two product pages showed a second size as well, and both of those sizes
   * have a page of their own. A Product entity on a page that is not the
   * product's page tells a reader that the page is about that product, and
   * the page's own entity already says what it is about. The sibling stays
   * on the page as a card with a link; it does not stay as an entity.
   */
  if (ownSku && sku !== ownSku) return null;
  const p = products.find((x) => x.sku_oem === sku);
  return p ? (productSchema(p) as unknown as Record<string, unknown>) : null;
}

/**
 * The types that mean "this page already says what page it is".
 *
 * A page that carries one of these has a page node; a page that carries
 * none of them has nothing, and gets one built for it. `Service` and
 * `CreativeWork` are NOT in this list on purpose: the captured heads carry
 * `Service` nodes inside the old offer catalogue, and a service is not a
 * page — a page about a service still needs a page node.
 */
const PAGE_NODE_TYPES = new Set([
  'WebPage',
  'AboutPage',
  'CollectionPage',
  'ContactPage',
  'Blog',
  'ProfilePage',
  'ItemPage',
  'SearchResultsPage',
]);

/** The types that can be the subject of a page. */
const SUBJECT_TYPES = new Set(['Product', 'Article', 'CreativeWork', 'Dataset', 'Service']);

function hasPageNode(blocks: Record<string, unknown>[]): boolean {
  for (const b of blocks) {
    const graph = b['@graph'];
    const nodes = Array.isArray(graph)
      ? (graph as Record<string, unknown>[])
      : [b];
    for (const n of nodes) {
      const type = n['@type'];
      const types = Array.isArray(type) ? type.map(String) : [String(type)];
      if (types.some((t) => PAGE_NODE_TYPES.has(t))) return true;
    }
  }
  return false;
}

/**
 * The page's primary subject, if it has one.
 *
 * A page about a single product, a single laboratory report or a single
 * guide has one thing it is about, and `mainEntity` is how the markup
 * says so. `about` already names the company; without `mainEntity` a
 * reader cannot get from "this page is about the company" to "this page is
 * about the cat antifungal spray" without reading the prose.
 */
function pageSubject(blocks: Record<string, unknown>[]): object | undefined {
  for (const b of blocks) {
    const graph = b['@graph'];
    const nodes = Array.isArray(graph)
      ? (graph as Record<string, unknown>[])
      : [b];
    for (const n of nodes) {
      const type = n['@type'];
      const types = Array.isArray(type) ? type.map(String) : [String(type)];
      if (!types.some((t) => SUBJECT_TYPES.has(t))) continue;
      const id = n['@id'];
      if (typeof id === 'string' && id) return { '@id': id };
      const name = n.name;
      const url = n.url;
      return {
        '@type': types[0],
        ...(typeof name === 'string' ? { name } : {}),
        ...(typeof url === 'string' ? { url } : {}),
      };
    }
  }
  return undefined;
}

/**
 * The part of the page an assistant should read out, when there is one.
 *
 * A product page opens with a line that answers the question the page is
 * asked: what it is, what it is measured at, the minimum order and the
 * private-label lead time. That line carries the `v2-speakable` hook, and
 * the markup names it.
 *
 * Only the product pages get it. The other pages have no single summary
 * element — their leads sit in sections, several of them, and a selector
 * that matched four paragraphs would be a selector that said nothing. A
 * `speakable` that points at nothing is worse than no `speakable`, and the
 * build gate checks that every selector on the site resolves.
 */
function speakableFor(page: LegacyPage): string | undefined {
  if (!page.source.startsWith('products/')) return undefined;
  const slug = page.source.replace(/^products\//, '').replace(/\.html$/, '');
  if (!slug || slug === 'index') return undefined;
  return productBySlug(slug) ? '.v2-speakable' : undefined;
}

/** Re-emits the extracted JSON-LD verbatim (Organization / Product / FAQPage / ...).
 *
 *  Plain `<script type="application/ld+json">`, NOT next/script. Next's
 *  `<Script strategy="beforeInteractive">` is only honoured in the root layout;
 *  rendered from a page component it is dropped from the static export, which
 *  silently costs every schema.org type on the page. Verified against
 *  out/capabilities.html: 2 blocks in the content JSON, 0 in the output HTML.
 *
 *  When the legacy head carried no JSON-LD — twelve public pages had none —
 *  the markup is generated from the same data the page renders from. See
 *  lib/seo/schema.ts.
 *
 *  A captured PRODUCT is replaced by the generated one, whichever shape the
 *  capture has: a bare block, or a block wrapping an @graph. See liveProduct.
 *
 *  A captured ORGANISATION of ours is replaced by the live one. See
 *  liveOrganization.
 *
 *  AND EVERY PUBLIC PAGE GETS A PAGE NODE.
 *  The captured heads carried no WebPage at all — not one of them. So eighty
 *  pages were published with no statement of what they were: no `about`, no
 *  `isPartOf`, no `datePublished`, no `dateModified`, no `inLanguage`. A
 *  crawler reading them saw a bag of products and a company, and a page
 *  node that says "this is the page about that product, published on that
 *  date, part of that site" was missing.
 *
 *  The page node is built from the same metadata the page publishes — its
 *  title, its description, its canonical address — so it cannot describe a
 *  page the reader is not looking at.
 */
export function JsonLd({ page, except }: { page: LegacyPage; except?: string[] }) {
  const generated = schemaForPath(page.source);
  const captured = page.head.jsonLd && page.head.jsonLd.length > 0 ? page.head.jsonLd : null;

  /*
   * THE ORGANISATION IN A CAPTURED HEAD.
   *
   * The captured heads carry an organisation node for us on twenty-one
   * pages — a name, a URL and sometimes an address.
   *
   * It is DROPPED, not patched and not replaced, because the site layout
   * already publishes the organisation on every public page: the complete
   * one, with the address and its postal code, the contact point, the
   * mark, the subjects and the credentials. Before this, a page carried
   * both — the thin captured one and the live one — and a reader that
   * merged them found a second company with our name and half our facts.
   *
   * The laboratory that issued a report is named in the same markup and
   * is left alone - it is not us, and it is not a pet care factory.
   *
   * On a page that is not indexed — the signed-in portal, the staff
   * console — the layout does not publish the graph, so the organisation
   * is kept there.
   */
  const indexed = !page.isPortal && !isEmptyIndex(page);

  /*
   * THE PAGE'S OWN PRODUCT.
   *
   * A product page has one product. The captured heads sometimes named a
   * second one - the sibling size - and both of those siblings have a page
   * of their own, so the entity belongs there and not here.
   */
  const ownSku = (() => {
    if (!page.source.startsWith('products/')) return undefined;
    const slug = page.source.replace(/^products\//, '').replace(/\.html$/, '');
    return productBySlug(slug)?.sku_oem;
  })();

  const isOurOrg = (node: Record<string, unknown>): boolean => {
    const type = node['@type'];
    const types = Array.isArray(type) ? type.map(String) : [String(type)];
    if (!types.includes('Organization')) return false;
    return (
      node.name === siteConfig.brand.legalName ||
      (typeof node['@id'] === 'string' && node['@id'].endsWith('/#organization'))
    );
  };

  /*
   * THE BUSINESS MODEL, ON EVERY NODE THAT NAMES US.
   *
   * The captured heads name our organisation in places the layout's node
   * cannot reach — inside a list of reports, as the publisher of each
   * entry. Those are references, not declarations, and they are left
   * alone — except for one thing they were missing: how this business is
   * priced.
   *
   * The build gate checks every node that names us and asks it to say
   * that this is a B2B business, because that is the answer to the
   * question an assistant asks when it reads a wholesale supplier's
   * markup. The answer comes from the configuration, so it cannot be
   * wrong on one page and right on another.
   */
  const withOurModel = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withOurModel);
    if (!value || typeof value !== 'object') return value;
    const node = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      next[k] = withOurModel(v);
    }
    if (isOurOrg(next) && typeof next.description !== 'string') {
      next.description = siteConfig.pricing.declaration;
    }
    return next;
  };

  const blocks: Record<string, unknown>[] = captured
    ? (captured.flatMap((b) => {
        const block = b as unknown as Record<string, unknown>;
        if (block['@type'] === 'Product') {
          const live = liveProduct(block, ownSku);
          return live ? [live] : [];
        }
        if (Array.isArray(block['@graph'])) {
          const graph = (block['@graph'] as Record<string, unknown>[])
            .map((n) => (n['@type'] === 'Product' ? liveProduct(n, ownSku) : n))
            .filter((n): n is Record<string, unknown> => n !== null)
            .filter((n) => !(indexed && isOurOrg(n)));
          if (!graph.length) return [];
          return [withOurModel({ ...block, '@graph': graph }) as Record<string, unknown>];
        }
        if (indexed && isOurOrg(block)) return [];
        return [withOurModel(block) as Record<string, unknown>];
      }) as Record<string, unknown>[])
    : ((generated ?? []) as Record<string, unknown>[]).filter(
        (n) => !(indexed && isOurOrg(n)),
      );
  /*
   * `except` drops types the page has taken over for itself.
   *
   * A hand-built page sometimes renders a section the legacy schema also
   * describes, and wants to say it in its own words — the contact page
   * shows twelve questions and used to ship a legacy schema describing six
   * others. Emitting both would put two contradicting FAQPage blocks on one
   * page, which is worse than either one.
   */
  const kept = except?.length
    ? blocks.filter((b) => !except.includes(String((b as { '@type'?: string })['@type'])))
    : blocks;

  /*
   * THE PAGE NODE, WHEN THE PAGE HAS NONE — AND WHEN IT HAS HALF OF ONE.
   *
   * A page that is not indexed — the signed-in portal, the staff console —
   * gets nothing: a page node on a page that asks a search engine to leave
   * it alone is noise. An empty blog index is in the same position.
   *
   * A captured page node is a different problem. The captured heads carry
   * page nodes that say the name and the address and nothing else: no
   * `about`, no `isPartOf`, no `datePublished`, no `dateModified`, no
   * `inLanguage`. A page node that stops there says the page exists and
   * nothing about when it was published or what it belongs to, which is
   * most of what a page node is for.
   *
   * So the node that is there is completed with the properties it is
   * missing, taken from the same place the page's own metadata comes from.
   * The page cannot end up describing itself two ways.
   */
  const meta = legacyMetadata(page);
  const pageNode = (): Record<string, unknown> =>
    webPageSchema({
      name: typeof meta.title === 'string' ? meta.title : siteConfig.brand.name,
      path: pagePath(page),
      description: typeof meta.description === 'string' ? meta.description : undefined,
      mainEntity: pageSubject(kept),
      speakable: speakableFor(page),
    }) as unknown as Record<string, unknown>;

  const completed = kept.map((b) => {
    const graph = b['@graph'];
    const nodes = Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [b];
    const target = nodes.find((n) => {
      const type = n['@type'];
      const types = Array.isArray(type) ? type.map(String) : [String(type)];
      return types.some((t) => PAGE_NODE_TYPES.has(t));
    });
    if (!target) return b;
    const filled = { ...target } as Record<string, unknown>;
    const full = pageNode();
    for (const key of ['datePublished', 'dateModified', 'inLanguage', 'about', 'isPartOf', 'name', 'url']) {
      if (filled[key] === undefined) filled[key] = full[key];
    }
    if (filled['@id'] === undefined && full['@id'] !== undefined) filled['@id'] = full['@id'];
    return Array.isArray(graph)
      ? { ...b, '@graph': nodes.map((n) => (n === target ? filled : n)) }
      : filled;
  });

  const withPage =
    indexed && !hasPageNode(completed)
      ? [...completed, pageNode()]
      : completed;

  if (withPage.length === 0) return null;
  return (
    <>
      {withPage.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
    </>
  );
}

/**
 * The path of a legacy page, as the page itself declares it.
 *
 * The canonical address is the authority — it is what the page publishes
 * and what the sitemap lists. `index.html` at the root is the site root,
 * so its path is `/` and not `/index.html`.
 */
function pagePath(page: LegacyPage): string {
  const canonical = page.head.canonical ?? `${siteConfig.brand.siteUrl}/${page.source}`;
  const site = siteConfig.brand.siteUrl;
  if (canonical.startsWith(site)) {
    const rest = canonical.slice(site.length);
    return rest === '' ? '/' : rest;
  }
  return `/${page.source}`;
}

/** Full static page: metadata + JSON-LD + extracted legacy blocks. */
export default function LegacyPageView({ page }: { page: LegacyPage }) {
  return (
    <>
      <JsonLd page={page} />
      <BlockList blocks={page.blocks} />
    </>
  );
}
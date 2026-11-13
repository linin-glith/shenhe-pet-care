// Catalogue — v2 engine.
//
// Every SKU in the catalogue carries a photograph (lib/packshots.ts), and the
// cards are anchored on the facts a procurement lead decides on — MOQ, stock
// lead time, private-label lead time, specification. The image is the first
// thing a
// buyer looks at; the numbers are what they order on.
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file. Teach it to
// skip the catalogue route, or this work is lost on the next legacy2json run.

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import SpecTable from '@/components/v2/SpecTable';
import page from '@/content/products__index.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { activeSkuCount, LINE_PRODUCTS } from '@/lib/products';
import { clientProducts as products } from '@/lib/client-products';
import { useBuckets } from '@/lib/commerce';
import { getLineLabel } from '@/lib/product-routing';
import { productUrl } from '@/lib/product-routing';
import type { ProductSpec } from '@/lib/products';
import { LineGroupCard } from '@/components/v2/LineGroupCard';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import { FaqView } from '@/components/v2/Converted';
import { whatsappLink } from '@/lib/contact-links';
import { catalogueFaq } from '@/content/v2/catalogue-faq';
import { localisedFaq } from '@/lib/i18n/faq';
import { faqPageSchema } from '@/lib/seo/schema';
import { PACKSHOT as PACKSHOT_REGISTRY } from '@/lib/packshots';
import { pageCopy, SKU_COUNT_SUFFIX } from '@/lib/i18n/pages';

const data = page as unknown as LegacyPage;

/**
 * CATALOGUE SEO — written for search intent.
 *
 * The legacy title was a bare label ("Products"). A buyer searching a
 * catalogue is not looking for a word, they are looking for a supplier who
 * makes their category at a minimum they can live with. The title therefore
 * carries category terms and the MOQ floor, because that number is what
 * decides whether the click is worth making.
 */
const CATALOGUE_TITLE =
  `Private Label Pet Products | ${activeSkuCount} SKUs, White Label, MOQ 1,000`;

const CATALOGUE_DESCRIPTION =
  `Private label and white label pet products from a China manufacturer: ${activeSkuCount} SKUs of deodorizing ` +
  'spray, litter powder, shampoo, disinfectant, foam, paw care.';

/**
 * The metadata of the catalogue, in the buyer's language.
 *
 * The description is the sentence a buyer reads in the search result
 * before deciding to click, so it says the same three things in every
 * language: how many products, what kind of manufacturer, and that the
 * price is on request.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('products', locale);
  const title = locale === 'en'
    ? CATALOGUE_TITLE
    : `${copy.title} | ${activeSkuCount} ${SKU_COUNT_SUFFIX[locale]}`;
  const description = fitDescription(
    locale === 'en' ? CATALOGUE_DESCRIPTION : copy.description,
  );
  return buildMetadata(title, description);
}

function buildMetadata(title: string, description: string,): Metadata {
  return {
  ...legacyMetadata(data),
  title,
  description,
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/products.html`,
    siteName: siteConfig.brand.name,
    title: CATALOGUE_TITLE,
    description: CATALOGUE_DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: CATALOGUE_TITLE,
    description: CATALOGUE_DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

/**
 * Real packshots, by SKU.
 *
 * TWO SOURCES, because the first one was not enough. The product deck
 * (深河中科公司及产品介绍PPT.pdf) yielded 14 usable photographs. The bilingual
 * PRICE LIST in the same folder — never opened until the catalogue was
 * already running on mockups — carried studio shots for exactly the SKUs that
 * were missing: P002, P004, P011, P014, P020.
 *
 * All 20 SKUs now have a photograph whose identity was read off the on-pack
 * label, not inferred from a filename. P018 (Pet Paw Moisturizing Gel 10 g)
 * was recovered from the deck on 2026-10-22, and P011 (200 mL Multi-Purpose
 * Pet Wash) was cropped out of the price list's 300/200 pair shot.
 *
 * Assignment rule: a mapping exists only when the visible label proves the SKU.
 */
export const PACKSHOT = PACKSHOT_REGISTRY;

/**
 * The catalogue groups by LINE, not by the `category` field.
 *
 * The category field is a three-value compliance grouping that exists for
 * palette and permit logic. Ear cleansing solution and dental water sit in
 * `disinfection_odor_control` for those reasons, but a buyer reading
 * "Disinfection & Odor Control" over a bottle that goes into an ear canal
 * has been told something untrue about the product. The line is what the
 * catalogue pages are organised by, so grouping by it here makes the
 * directory and each product's own hero say the same thing.
 */
const LINE_ORDER: ProductSpec['line'][] = [
  'deodorizing_disinfection',
  'grooming_care',
  'outdoor_protection',
  'pet_nutrition',
];

export default function ProductsPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const faqItems = localisedFaq('catalogue', locale, catalogueFaq.items);
  const copy = pageCopy('products', locale);
  const ordered = LINE_ORDER.map((slug) => ({
    slug,
    en: getLineLabel(slug),
    items: products.filter((p) => p.line === slug),
  })).filter((g) => g.items.length > 0);

  const lowestMoq = products.reduce((m, p) => Math.min(m, p.moq), Number.MAX_SAFE_INTEGER);

  return (
    <>
      <JsonLd page={data} />

      {/* ---------------- header ---------------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">{copy.eyebrow}</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            {copy.h1.replace('{count}', String(products.length))}
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            {copy.lead}
          </p>
          <DataBar items={standardDataBar(['park', 'capacity', 'skus', 'labs', 'reject'])}  tone="dark" />


          {/*
            The AI matcher is the guided version of this page. It was in the
            sitemap and in the search index, but nothing on the site linked to
            it: a buyer could only reach it by typing the URL or by following
            a search result, which is the same as not having it.
          */}
          <a
            href="/ai-customize.html"
            className="v3-link mt-6 inline-flex items-center gap-2 text-sm font-semibold text-v2-accent-300 hover:text-v2-accent-300"
          >
            Not sure which one? Answer four questions and we will match the top five SKUs
            <span aria-hidden>&rarr;</span>
          </a>

          {/* The term first, then the figure - see the note in V3.tsx. */}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {[
              { value: String(products.length), label: 'Active SKUs' },
              { value: String(ordered.length + (Object.keys(LINE_PRODUCTS).length ? 1 : 0)), label: 'Product lines' },
              { value: lowestMoq.toLocaleString(), label: 'Lowest MOQ' },
              { value: '7–15 d', label: 'Stock lead' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col border-l-2 border-v2-accent-600 pl-4">
                <dt className="order-2 mt-2 text-xs font-medium text-white/60">{s.label}</dt>
                <dd className="order-1">
                  <span className="block font-display text-3xl font-semibold leading-none tabular-nums text-white">
                    {s.value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/*
        THE FILTER BAR.

        Twenty SKUs in one column is a list, not a catalogue. A buyer who
        wants the grooming line should not have to scroll past the
        disinfection line to find out whether it exists — and a buyer who
        wants "just the litter deodorizer" should not have to read twenty
        cards to work out that there are two.

        So the lines are named at the top, with the number of SKUs behind
        each name, and the bar stays put while the buyer scrolls. The links
        are anchors: no JavaScript, no state to lose, and they work the
        moment the page paints.
      */}
      <nav
        aria-label="Product lines"
        className="sticky top-0 z-30 border-b border-v2-ink-200 bg-v2-ink-050/95 backdrop-blur supports-[backdrop-filter]:bg-v2-ink-050/80"
      >
        <div className="v2-container flex items-center gap-2 overflow-x-auto py-3">
          <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-v2-ink-400">
            Filter
          </span>
          {ordered.map((line) => (
            <a
              key={line.slug}
              href={`#${line.slug}`}
              className="shrink-0 rounded-full border border-v2-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-v2-ink-700 transition-colors hover:border-v2-ink-400 hover:text-v2-ink-900"
            >
              {line.en}
              <span className="ml-1.5 font-mono text-[10px] tabular-nums text-v2-ink-400">
                {line.items.length}
              </span>
            </a>
          ))}
          <a
            href="#pet-nutrition"
            className="shrink-0 rounded-full border border-v2-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-v2-ink-700 transition-colors hover:border-v2-ink-400 hover:text-v2-ink-900"
          >
            Pet Nutrition
            <span className="ml-1.5 font-mono text-[10px] tabular-nums text-v2-ink-400">
              {Object.keys(LINE_PRODUCTS).length}
            </span>
          </a>
        </div>
      </nav>

      {/* ---------------- level 1 + 2: line group header, then its SKUs ---------------- */}
      {ordered.map((line) => (
        <LineGroupCard key={line.slug} line={line} />
      ))}

      {/*
        The fourth product line: Pet Nutrition.

        These two are not catalogue SKUs — they are quoted per project rather
        than per unit, which is why the SKU groups above do not contain them.
        But they ARE products the factory sells, with pages of their own, and
        a buyer who came for pet nutrition had to find them through the
        footer. This section is the catalogue telling the truth about its own
        edges — and it is where the "four product lines" the site claims
        everywhere else becomes visible.
      */}
      <section className="v2-section bg-v2-ink-050" id="pet-nutrition">
        <div className="v2-container">
          <p className="v2-eyebrow">Pet Nutrition · quoted one at a time</p>
          <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">
            The fourth line: two Inner Wellness products.
          </h2>
          <p className="v2-lead mt-4 max-w-2xl">
            These two carry no catalogue SKU, so they are quoted per project rather
            than per unit. Ask for either of them and we will quote them the same
            way we quote the rest.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {Object.values(LINE_PRODUCTS).map((p) => (
              <a
                key={p.slug}
                href={`/products/${p.slug}.html`}
                className="group rounded-v2-lg border border-v2-ink-200 bg-white p-6 transition hover:border-v2-accent-500"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-v2-accent-600">
                  {p.moq}
                </span>
                <span className="mt-3 block text-lg font-semibold text-v2-ink-900">
                  {p.name} {p.size}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-v2-ink-500">
                  {p.lead}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-v2-ink-700 group-hover:text-v2-accent-700">
                  Product page
                  <span aria-hidden>&rarr;</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- by use ---------------- */}
      {/*
        THE CATALOGUE, BY USE.

        The lines are how the factory is organised; the use is how a buyer
        thinks. A kennel buyer does not want "the deodorizing line" — they
        want "the thing I spray on the floor", and they need to be able to
        see that the disinfectant is for surfaces and not for an animal.

        So the same catalogue is indexed a second way, below the line filter.
        It is a plain list of links, not a script: it works the moment the
        page paints, a crawler can read it, and it costs the buyer one
        glance instead of twenty cards.
      */}
      <section className="v2-section bg-white" id="by-use">
        <div className="v2-container">
          <p className="v2-eyebrow">By use</p>
          <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">
            Or start from where you are going to use it.
          </h2>
          <p className="v2-lead mt-4 max-w-2xl">
            Every SKU below says on its own page where it is used, and the
            same catalogue is grouped here by that use. A product can appear
            in more than one group — the deodorizing spray is made for an
            animal’s coat and for the surfaces around it.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {useBuckets(products).map((bucket) => (
              <div key={bucket.id} className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold text-v2-ink-900">{bucket.label}</h3>
                  <span className="font-mono text-xs tabular-nums text-v2-ink-500">
                    {bucket.skus.length} SKU{bucket.skus.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">{bucket.note}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {bucket.skus.map((id) => {
                    const p = products.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <li key={id}>
                        <a
                          href={productUrl(p)}
                          className="inline-block rounded-full border border-v2-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-v2-ink-700 transition-colors hover:border-v2-accent-500 hover:text-v2-accent-700"
                        >
                          {p.name_en}
                          <span className="ml-1.5 font-mono text-[10px] text-v2-ink-400">{id}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- closing ---------------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Tell us which SKUs you want.
            </h2>
            <p className="mt-3 text-white/85">
              We reply within one business day with tiered pricing and a sample plan.{' '}
              {siteConfig.pricing.display}.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/85">
              <Icon name="shield" size={16} />
              {siteConfig.metrics.gmpStandard} GMP · FDA registered · exporting since{' '}
              {siteConfig.brand.foundedYear}
            </p>
            {/*
              还没想清楚要哪个？——真实那位就是这么开的口。

              那一条询盘来自目录页，`products` 是空的：他没选 SKU，
              要的是"配对"。所以这里给的不是另一个报价入口，
              是一条"描述用途，我们帮你选"的路——它通到 /ai-customize.html。
            */}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              Not sure which product yet?{' '}
              <a data-journey="page" href="/ai-customize.html" className="font-semibold text-white underline">
                Answer four questions
              </a>{' '}
              and we will match the closest SKUs — or just describe what you need on
              WhatsApp.
            </p>
          </div>
          {/*
            WHATSAPP 在前，表单在后。

            不是因为它更现代，是因为**它是唯一被验证过的出口**：
            全站唯一一条真实询盘就是从这个按钮进来的（来源 `whatsapp`，
            落地页 `/products.html`）。它当时是描边的次要按钮。

            消息用 whatsappLink() 预填：号码从配置取（站上只应该有一个号码），
            开头一句用买家自己的口气写的话——他要读一遍、改一遍、发出去，
            一句要重写的话往往就发不出去了。
          */}
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href={whatsappLink({ page: 'your pet care catalogue' })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900"
            >
              Message us on WhatsApp
            </a>
            <a
              href="/contact.html"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white"
            >
              Request pricing
            </a>
          </div>
        </div>

      </section>

      {/*
        * THE SPECIFICATION TABLE, OUT OF THE BAND.
        *
        * It was the last thing inside the teal call to action, and
        * its own text is grey - right on the page's light body and
        * unreadable on teal. A twenty-row table of minimums and lead
        * times is not part of a call to action anyway.
        */}
      <SpecTable />

      {/*
        The catalogue's seven GEO answers were written but never wired in —
        `catalogueFaq` was imported and never rendered, so the page shipped no
        FAQ at all and no schema. They close the objections that stop browsing
        (can I afford the minimum, will it arrive before my season, can I put
        my own brand on it), and the schema is generated from the same array so
        the two cannot drift.
      */}
      <FaqView b={{ kind: 'faq', eyebrow: catalogueFaq.eyebrow, title: catalogueFaq.title, items: faqItems }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(faqItems, {
              name: 'Pet care product catalogue — ordering questions',
              url: `${siteConfig.brand.siteUrl}/products.html`,
            }),
          ),
        }}
      />
    </>
  );
}

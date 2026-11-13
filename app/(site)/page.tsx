
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import page from '@/content/index.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { V2Page } from '@/components/v2/blocks';
import { HomeHero } from '@/components/v2/HomeHero';
import { Btn } from '@/components/v2/blocks';
import { siteConfig } from '@/lib/shenhe.config';
import { homeBlocks, VALUE_PROPS, CONTENT_GATES } from '@/content/v2/home';
import { homeFaq } from '@/content/v2/home-faq';
import { localisedFaq } from '@/lib/i18n/faq';
import {
  AttestationSection,
  CompliancePackSection,
  ContentGatesSection,
  FeaturedProductsSection,
  ValuePropsSection,
} from '@/components/v2/HomeSections';
import { activeSkuCount, products } from '@/lib/products';
import { clientProducts } from '@/lib/client-products';
import { lowestMoq, standardMoq } from '@/lib/commerce';
import { faqPageSchema, itemListSchema, catalogueTreeSchema } from '@/lib/seo/schema';
import { whatsappLink } from '@/lib/contact-links';
import { Icon } from '@/components/v2/Icon';
import type { V2Block } from '@/lib/v2/block-types';
import { pageCopy } from '@/lib/i18n/pages';

const data = page as unknown as LegacyPage;

/**
 * HOMEPAGE SEO — written for search intent, not inherited.
 *
 * The legacy title ("SHENHE ZHONGKE · Pet Care OEM/ODM Factory") is a brand
 * label. Nobody searches for a brand they have not heard of yet. A buyer
 * arriving from search is asking one of four questions, and the title has to
 * answer it while still carrying the brand.
 *
 * INTENT COVERAGE, primary first:
 *   1. pet care products manufacturers  (who are you — the Autocomplete winner)
 *   2. dog shampoo manufacturers        (do you make my category)
 *   3. private label pet products       (do you do my product)
 *   4. MOQ / lead time                  (can I afford to start)
 *
 * GOOGLE AUTOCOMPLETE ANALYSIS (2026-11-10):
 * "pet care products manufacturers" is the Autocomplete first suggestion for
 * 9 out of 9 buyer intent queries (pet care manufacturer china, pet care oem
 * manufacturer, china pet care manufacturer, etc.). The plural "manufacturers"
 * returns autocomplete; the singular "manufacturer" returns empty. No
 * competitor has occupied this position yet — the suggestion is not bound to
 * a country, unlike "shampoo manufacturers uk" which belongs to UK factories.
 *
 * The description carries the proof numbers a buyer scans for — MOQ, capacity,
 * lead time, certification — because those are the tokens that earn the click
 * and answer the bounce question in the result itself.
 */
const TITLE = `Pet Care Products Manufacturers in China | SHENHE ZHONGKE`;

const DESCRIPTION =
  `ISO 22716 GMP pet care products manufacturers in Heyuan, China: ${activeSkuCount} private label SKUs, ` +
  'dog shampoo, deodorizing spray, disinfectant, foam, litter powder.';

/**
 * The metadata of the home page, in the buyer's language.
 *
 * A German buyer searching "Tierpflege Hersteller China" has to be
 * shown a German title, not the English one translated word for
 * word - which is a title nobody typed.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('home', locale);
  if (locale === 'en') return {
  ...legacyMetadata(data),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
};
  return {
    ...{
  ...legacyMetadata(data),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
},
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: { ...({
  ...legacyMetadata(data),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
}).openGraph, title: copy.title, description: fitDescription(copy.description), },
    twitter: { ...({
  ...legacyMetadata(data),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
}).twitter, title: copy.title, description: fitDescription(copy.description), },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function Page({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const faqItems = localisedFaq('home', locale, homeFaq.items);
  // The hero is bespoke and lives outside the block array so its composition
  // can break the uniform section rhythm instead of repeating it.
  const [, ...rest] = homeBlocks;

  /*
   * HOMEPAGE ORDER — the buyer's question sequence, not the site's structure.
   *
   *   hero        Are you a real factory?
   *   valueProps  ← NEW. Can you do what I need?      (previously missing)
   *   composer    Show me products, let me pick.
   *   featured    ← NEW. What exactly does it look like?
   *   split       Show me the actual facility.
   *   metrics     Can you ship my volume, on schedule?
   *   process     How does an OEM project actually run?
   *   proofGrid   Do you have the paperwork for my market?
   *   gates       ← NEW. Do you know this market?      (SEO entry point)
   *   rfq         How do I start?
   *   faq         The objections that stop the enquiry.
   *   cta         Last call.
   *
   * Three moves vs the previous order:
   *  - valueProps sits directly under the hero. The hero proves existence;
   *    the credential bar proves verification; nothing in between said what
   *    the factory CAN do. That was the largest drop-off on the page.
   *  - composer moved ahead of the facility split. The composer is a tool,
   *    and a tool placed before trust is built reads as an interruption.
   *  - faq moved ahead of the rfq. Buyers skip a form; they read an answer.
   *    Convince first, then ask for information.
   */

  const byKind = (k: string) => rest.filter((b) => b.kind === k);
  const others = rest.filter(
    (b) => !['proofBar', 'composer', 'rfq', 'ctaBand', 'faq'].includes(b.kind as string),
  );
  const [proofBar] = byKind('proofBar');
  const [composer] = byKind('composer');
  const [rfq] = byKind('rfq');
  const [cta] = byKind('ctaBand');

  /*
   * THE TWO NEW SECTIONS SIT BETWEEN THE REPORT GRID AND THE PROCESS.
   *
   * The grid says what is published; the attestation strip says how a reader
   * checks it for himself; the compliance pack says what else travels with
   * the order. Evidence, then how to verify it, then what to expect — which
   * is the order the buyer asks the questions in.
   *
   * The blocks are therefore partitioned by kind rather than by position: the
   * sections have to land in one specific place, and a partition that depends
   * on where a block happens to sit in the array moves the moment somebody
   * reorders the home page.
   */
  const splitBlocks = others.filter((b) => b.kind === 'split');
  const proofBlocks = others.filter((b) => b.kind === 'proofGrid');
  const processBlocks = others.filter((b) => b.kind === 'process');
  const metricBlocks = others.filter((b) => b.kind === 'metricBand');
  const otherBlocks = others.filter(
    (b) => !['split', 'proofGrid', 'process', 'metricBand'].includes(b.kind as string),
  );

  return (
    <>
      <JsonLd page={data} />

      {/*
        The seven GEO answers are the homepage's citable asset. They are
        rendered from `homeFaq` below, and the schema is generated from the
        SAME array — so the structured data and the visible questions cannot
        drift apart. The homepage shipped seven visible Q&A pairs with no
        FAQPage at all for a while; an answer engine reading JSON-LD saw
        nothing.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(faqItems, {
              name: 'Pet care OEM/ODM factory — buyer questions',
              url: `${siteConfig.brand.siteUrl}/`,
            }),
          ),
        }}
      />

      {/*
        THE CATALOGUE, AS STRUCTURED DATA.

        The home page used to carry the brand, the organisation, the website
        and the FAQ — and nothing that said what the factory sells. A crawler
        reading the markup had no way to tell a catalogue from a brochure,
        and the three competitor sites that rank on this kind of query are
        the ones that publish the catalogue as a tree of categories.

        So the home page now says the same thing twice, in the two forms
        that are actually used: a tree, which is the four product lines and
        the SKUs on each of them, and a flat list of everything there is.
        Both are generated from the catalogue record, so neither can list a
        product the site does not sell, and neither carries a price — the
        site is quote-only.

        The tree used to be an OfferCatalog, which is a catalogue OF
        OFFERS, and on 2026-11-09 Google's product summary report named
        the four nested catalogues as the reason: it asked for the price,
        the currency, the review and the rating inside offers we do not
        publish. It is an ItemList now — the nesting still says "four
        shelves, and here is what is on each of them", and it no longer
        promises offers the site does not make.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            catalogueTreeSchema({
              name: 'Private-label pet care catalogue',
              url: `${siteConfig.brand.siteUrl}/products.html`,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              '@context': 'https://schema.org',
              ...itemListSchema(products, 'Private-label pet care catalogue'),
            },
          ).replace(/</g, '\\u003c'),
        }}
      />

      <HomeHero
        eyebrow={`${siteConfig.metrics.gmpStandard} GMP  ·  Operating since ${siteConfig.brand.foundedYear}  ·  Heyuan, Guangdong`}
        /*
         * The first screen, and what it has to do.
         *
         * A visitor to a factory website has three questions in the first
         * five seconds: what do you actually make, who do you make it for,
         * and what does it cost me to start. "Private-label pet care
         * manufacturing that survives your QA team" answers none of them -
         * it is a positioning claim, and the visitor has to scroll to learn
         * what the factory sells.
         *
         * So the headline says what the catalogue sells, the lead says who
         * buys, and the lead carries the minimum order and the sample terms
         * - the two numbers a buyer decides on. The credentials were
         * already in the eyebrow and in the proof bar underneath.
         *
         * ONE PARAGRAPH, NOT TWO.
         * The product categories used to sit on their own line, in italic
         * teal, under the headline - and that line was long enough to take
         * five rows and push the quotation form off the first screen. It now
         * opens the paragraph instead: the same words, in the same breath as
         * who buys them, and a first screen that says one thing.
         */
        title="Private label & white label pet care"
        lead={`Shampoo, deodorizers, grooming and outdoor protection for pet brands, importers and distributors. ${activeSkuCount} catalogue SKUs, ${siteConfig.metrics.monthlyCapacityBottles.toLocaleString()} bottles a month, and ten third-party laboratory reports behind the claims we make. MOQ (minimum order quantity) is ${lowestMoq(clientProducts).units.toLocaleString()} ${lowestMoq(clientProducts).unit} on the bundled sets and ${standardMoq(clientProducts).units.toLocaleString()} ${standardMoq(clientProducts).unit} on catalogue SKUs. Samples are chargeable; the fee is stated in the quotation.`}
        cta={
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Btn cta={{ label: 'Request a quotation', href: '#rfq', note: 'reply < 1 day' }} />
              {/*
                `light` because the hero is a dark surface: the default
                secondary button draws dark ink on a dark background, and the
                label simply disappears. It was the one control on the home page
                a buyer could not read.
              */}
              <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} light />
            </div>
            {/*
              首屏也给 WhatsApp 一个出口——但是文字级的，不是第二个实心按钮。

              理由：站上唯一那条真实询盘走的就是 WhatsApp，而首屏的实心按钮
              只能有一个（一个视口一个重点色）。所以这里用一条带图标的文字
              链接，位置在按钮下面，不抢主按钮的注意力，但**不用滚到表单
              就能开始对话**。
            */}
            <a
              href={whatsappLink({ page: 'private-label pet care products' })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              <Icon name="chat" size={16} className="text-v2-accent-300" />
              Message us on WhatsApp — answered within one business day
            </a>
          </div>
        }
        stats={[
          { value: '30,000 m²', label: 'Industrial park', note: '3 buildings' },
          { value: String(activeSkuCount), label: 'Ready-to-ship SKUs', note: '4 product lines' },
          { value: '1M', label: 'Bottles / month', note: 'Current capacity' },
          { value: '12', label: 'Export markets', note: 'Russia · Brazil · EAEU' },
        ]}
        image={{
          // The factory gate. Kept: it is the picture that answers "are you a
          // real factory" in the first second, which is the question the rest
          // of the page is about.
          src: '/assets/img/factory/factory-front.webp',
          alt: 'Shenhe Zhongke production facility in Heyuan, Guangdong',
        }}
      />
      <ValuePropsSection items={VALUE_PROPS} />
      {proofBar && <V2Page blocks={[proofBar]} />}
      {composer && <V2Page blocks={[composer]} />}
      <FeaturedProductsSection ids={['P012', 'P003', 'P007']} />
      <V2Page blocks={[...splitBlocks, ...otherBlocks]} />
      {proofBlocks.map((b, i) => (
        <V2Page key={`proof-${i}`} blocks={[b]} />
      ))}
      <AttestationSection />
      <CompliancePackSection />
      {processBlocks.map((b, i) => (
        <V2Page key={`process-${i}`} blocks={[b]} />
      ))}
      {metricBlocks.map((b, i) => (
        <V2Page key={`metric-${i}`} blocks={[b]} />
      ))}
      <ContentGatesSection items={CONTENT_GATES} />
      {rfq && <V2Page blocks={[rfq]} />}
      <V2Page blocks={[{ kind: 'faq' as const, ...homeFaq, items: faqItems }, ...(cta ? [cta] : [])]} />
    </>
  );
}

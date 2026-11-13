import type { Metadata } from 'next';
import { fitDescription } from '@/lib/seo/meta';
import { siteConfig } from '@/lib/shenhe.config';
import { HomeHero } from '@/components/v2/HomeHero';
import {
  AttestationSection,
  CompliancePackSection,
  FeaturedProductsSection,
  ValuePropsSection,
} from '@/components/v2/HomeSections';
import { Btn } from '@/components/v2/blocks';
import { activeSkuCount, getCatProducts } from '@/lib/products';
import { itemListSchema, webPageSchema } from '@/lib/seo/schema';
import { VALUE_PROPS } from '@/content/v2/home';

/**
 * THE CAT PAGE — a cut of the catalogue, for the buyer who thinks in cats.
 *
 * WHY THIS PAGE EXISTS
 *
 * A brand that makes cat products does not search for "deodorizing and
 * disinfecting". It searches for "cat". The four line pages organise the
 * catalogue the way the factory organises it; this one organises it the way
 * that buyer does — and the SKUs it lists are the ones our own record
 * describes in cat or litter terms. The rule is in lib/products.ts and it
 * reads the record, so it cannot go stale.
 *
 * WHAT IS NOT ON IT
 *
 * Ear cleanser, waterless foam, paw gel. The record describes the ear
 * cleanser for "pet ear canal" and says nothing about cats, so it is not
 * here. A cat page that quietly widened itself into "everything a cat
 * owner might like" would be a page of claims we do not make.
 */

const catProducts = getCatProducts();

/*
 * TWO DIFFERENT MINIMUM ORDERS, AND THE CARD MUST SAY WHICH IS WHICH.
 *
 * Most of the SKUs on this page are catalogue SKUs at 2,000 bottles. The
 * bio-enzyme odor-control set is a BUNDLE at 1,000 sets, and the site says
 * so everywhere: 1,000 is the floor for a bundled set, 2,000 is the
 * minimum for a catalogue SKU. Printing the lowest number under the label
 * "Minimum order" states the floor as if it were the rule - so the rule
 * and the floor are taken from the record separately.
 */
const moqCounts = new Map<number, number>();
for (const p of catProducts) moqCounts.set(p.moq, (moqCounts.get(p.moq) ?? 0) + 1);
const catalogueMoq = [...moqCounts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
const floorMoq = Math.min(...catProducts.map((p) => p.moq));

/** The lead times, from the record — they are the same for all of them. */
const stockLead = [...new Set(catProducts.map((p) => p.lead_time_days_stock))].join(' / ');
const oemLead = [...new Set(catProducts.map((p) => p.lead_time_days_oem))].join(' / ');

const TITLE = 'Cat Care Manufacturers | Shampoo, Litter Deodorizer OEM';

const DESCRIPTION = fitDescription(
  `Private-label cat care manufacturers: ${catProducts.length} SKUs our record describes in cat or litter terms`
  + ' — cat shampoo, litter deodorizer, antifungal spray, odor control.',
);

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const canonical = `${siteConfig.brand.siteUrl}/products/cat-care.html`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
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
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>

      {/*
        THE PAGE NODE.

        This page publishes its own markup — a FAQPage, a HowTo, a
        breadcrumb trail — and it never had a page node among them. So
        nothing in the markup said what page this is, when it was
        published, what it is about, or what it belongs to.

        The node is built by the shared builder, so the company, the
        website and the date all come from the one place each is
        written down.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: TITLE,
              path: '/products/cat-care.html',
              description: fitDescription(DESCRIPTION),
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

            {/*
        The catalogue of the cat SKUs, as structured data. An answer engine
        assembling a list of cat-product suppliers needs the list to be
        machine-readable, and this is the same array the page draws.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListSchema(catProducts, 'Private-label cat care manufacturing'),
          ).replace(/</g, '\\u003c'),
        }}
      />

      <HomeHero
        eyebrow={`CAT CARE OEM · ${siteConfig.metrics.gmpStandard} · Heyuan, Guangdong`}
        title="Private-label cat care manufacturing."
        lead={
          'A cat brand needs a supplier who makes cat products, not a catalogue with a cat section. '
          + `These ${catProducts.length} SKUs are the ones our own catalogue record describes in cat or litter terms — `
          + 'shampoo, litter deodorizer, antifungal spray and odor control for litter boxes. '
          + `MOQ ${catalogueMoq.toLocaleString()} bottles per catalogue SKU, ${floorMoq.toLocaleString()} sets on the bundled sets, `
          + `private label in ${oemLead} days, `
          + 'and the lab reports behind every claim.'
        }
        cta={
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Btn cta={{ label: 'Request a quotation', href: '#rfq', note: 'reply < 1 day' }} />
              <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} light />
            </div>
          </div>
        }
        stats={[
          { value: String(catProducts.length), label: 'Cat SKUs', note: `of ${activeSkuCount} in the catalogue` },
          {
            value: catalogueMoq.toLocaleString(),
            label: 'Minimum order',
            note: 'per catalogue SKU',
          },
          { value: `${stockLead} d`, label: 'Stock lead', note: 'ready to ship' },
          { value: `${oemLead} d`, label: 'Private label', note: 'your formula, artwork' },
        ]}
        image={{
          src: '/assets/img/wallpapers/cat-five-on-sofa.webp',
          alt: 'Cats on a sofa — the shelf a cat brand sells into',
        }}
      />

      <FeaturedProductsSection
        ids={catProducts.map((p) => p.id)}
        title="The six, and how we know"
        sub="Every card carries its MOQ, lead time and where it is used. The rule is in the record, not in a list somebody maintains."
      />

      <ValuePropsSection items={VALUE_PROPS} />

      <AttestationSection />
      <CompliancePackSection />

      {/*
        The ask, at the end, where a buyer who has just read six product
        cards and one attestation table is actually ready to write.
      */}
      <section className="on-dark bg-v2-accent-600 py-16 md:py-20" id="rfq">
        <div className="v2-container">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 lg:min-w-[20rem] lg:max-w-2xl lg:flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Request a quotation on your cat SKU.
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/85">
                Tell us the SKU and the volume. We reply within one business day with tiered pricing,
                a sample plan and the MOQ that applies to your order.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Btn cta={{ label: 'Request a quotation', href: '/contact.html' }} light />
              <Btn cta={{ label: 'See all products', href: '/products.html', variant: 'ghost' }} light />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

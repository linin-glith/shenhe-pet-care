// OEM/ODM — v2 engine, hand-built (逐页精做).
//
// Reads its content from content/v2/oem-odm.ts so facts stay decoupled from
// layout. Heading hierarchy is strictly H1 -> H2 -> H3 with no skipped levels.
//
// SEO: title/description are intent-driven; the FAQ is engine-readable and a
// FAQPage schema is emitted that stays in sync with the visible questions.
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file.

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import { pageCopy } from '@/lib/i18n/pages';
import page from '@/content/oem-odm.json';
import type { LegacyPage } from '@/lib/legacy-types';
import { JsonLd } from '@/components/LegacyPage';
import { siteConfig } from '@/lib/shenhe.config';
import { clientProducts } from '@/lib/client-products';
import { lowestMoq, standardMoq, REPORT_EVIDENCE_SENTENCE } from '@/lib/commerce';
import { Icon } from '@/components/v2/Icon';
import { FeatureGrid, ProcessTrack } from '@/components/v2/Type';
import { V3CardGrid, V3Head } from '@/components/v2/V3';
import { ORDER_STEPS } from '@/content/v2/how-to';
import { howToSchema } from '@/lib/seo/schema';

import {
  COOPERATION_MODELS,
  OEM_CERTS,
  OEM_DIMENSIONS,
  OEM_FAQ,
  OEM_PROCESS,
} from '@/content/v2/oem-odm';
import { Btn } from '@/components/v2/blocks';
import { BUILD_DATE } from '@/lib/seo/build-date';

const data = page as unknown as LegacyPage;

/**
 * The title and the description, with the minimum order computed.
 *
 * The title used to say "Private Label 500 Unit MOQ". The catalogue has
 * never carried 500 for anything: the bundled sets start at 1,000 sets and
 * every catalogue SKU starts at 2,000 bottles. A number in the title is the
 * first thing a buyer reads and the last thing they check, so it was the
 * worst place for a number that was wrong.
 */
  const lowest = lowestMoq(clientProducts);
  const TITLE = `Private Label & White Label Pet Products | MOQ from ${lowest.units.toLocaleString()} ${lowest.unit}`;
/* A search result shows about 160 characters, and a description cut off in
   the middle of a number is worse than a shorter one that ends cleanly. */
const DESCRIPTION =
  'Private label, white label or custom formulation for pet care: our formula and your artwork, or a formula developed with you. Private label in 25–40 days.';

/**
 * The metadata of the English page.
 *
 * It is a function so that the language pages can ask for their own
 * title and description without a second copy of the same object.
 */
function buildMeta(): Metadata {
  return {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/oem-odm.html` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/oem-odm.html`,
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

/**
 * The metadata of this page, in the buyer's language.
 *
 * The title and the description are the same sentence said to the
 * reader and to the search engine, so they change together.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const base = buildMeta();
  if (locale === 'en') return base;
  const copy = pageCopy('oem-odm', locale);
  if (!copy.title) return base;
  return {
    ...base,
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: { ...base.openGraph, title: copy.title, description: fitDescription(copy.description), },
    twitter: { ...base.twitter, title: copy.title, description: fitDescription(copy.description), },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

/** FAQPage schema, generated from the SAME array the page renders. */
function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    dateModified: BUILD_DATE,
    mainEntity: OEM_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export default function OemOdmPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      {/*
        The captured legacy blocks, minus the stale FAQPage — this page
        renders its own questions further down, and the schema for those is
        generated from the same array.

        This used to be a hand-rolled copy of what the shared JsonLd
        component does. The shared component also completes the page node
        and leaves the organisation to the layout, so this page now says
        what it is and when it was published like every other page.
      */}
      <JsonLd page={data} except={['FAQPage']} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema({
        name: 'How an order runs, from the first enquiry to the container',
        description:
          'Six stages: enquiry, sample, quote, contract, production and shipment.',
        url: '/oem-odm.html',
        
        steps: ORDER_STEPS,
      })) }}
      />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Private label / Custom formulation</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Private label, white label or custom formulation?
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Two ways to use our plant. Private label is our formula and your brand.
            Buyers outside China call the same route white label, and UK buyers write
            private labelling; your custom logo, artwork and barcode go on the label and the carton either way.
            Custom formulation is your formula or your target claim.
            Pick one and request a quotation within one business day.
            Both run on the same six production lines in our 30,000 m² park in Heyuan,
            Guangdong, inside a 5,000 m² ISO 22716 GMP workshop with a monthly capacity
            of 1,000,000 bottles.{' '}
            {REPORT_EVIDENCE_SENTENCE}
          </p>
          <DataBar items={standardDataBar(['skus', 'capacity', 'people', 'years'])}  tone="dark" />

          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'Compare the two', href: '#compare' }} light />
            <Btn cta={{ label: 'Request a quotation', href: '/contact.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- H2: 9-dimension comparison ---------- */}
      <section className="v2-section" id="compare">
        <div className="v2-container">
          <V3Head
            title="Two ways to use our plant"
            sub="The facts, side by side. Read a row and decide which column is yours."
          />
          <div className="mt-14 overflow-x-auto rounded-v2-lg border border-v2-ink-200">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-v2-ink-900 text-white">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">Dimension</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">Private label</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">Custom formulation (OEM)</th>
                </tr>
              </thead>
              <tbody>
                {OEM_DIMENSIONS.map((d, i) => (
                  <tr key={d.dimension} className={i % 2 ? 'bg-v2-ink-050' : 'bg-white'}>
                    <th scope="row" className="px-5 py-3.5 font-semibold text-v2-ink-900">{d.dimension}</th>
                    {/* The columns are the two routes, private label first. The data
                        keys stay as they are, so the order is a rendering choice only. */}
                    <td className="px-5 py-3.5 text-v2-ink-600">{d.odm}</td>
                    <td className="px-5 py-3.5 text-v2-ink-600">{d.oem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- H2: cooperation modes (decoupled from the table) ---------- */}
      <section className="v2-section bg-v2-ink-050">
        <div className="v2-container">
          <V3Head
            title="Private label or custom formulation"
            sub="Two products, each with its own lead time. The third is turnkey, quoted against the brief."
          />
          <div className="mt-14">
            <V3CardGrid
              columns={3}
              items={COOPERATION_MODELS.map((m) => ({
                icon: <Icon name={m.icon} size={20} />,
                title: m.name,
                body: m.body,
                href: '/contact.html',
              }))}
            />
          </div>
          <p className="v3-meta mt-6">
            {COOPERATION_MODELS.map((m) => m.forWho).join('  ·  ')}
          </p>
          {/*
            The line we do not cross. It is a statement about how we work, not
            a third product, so it sits under the grid rather than in it.
          */}
          <div className="mt-8">
            <h3 className="v2-display text-xl md:text-2xl">What we will not do</h3>
            <p className="mt-4 rounded-v2-md border-l-2 border-v2-accent-500 bg-white px-5 py-4 text-sm leading-relaxed text-v2-ink-600">
              We will not promise a claim we cannot substantiate in your market. If a target claim needs a registration you do not
              hold, we say so at the first call rather than after the artwork is printed.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- H2: process — dark band (service content) ---------- */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <ProcessTrack
            dark
            title="Our cooperation process"
            lead="Every step has an owner and a deliverable."
            steps={OEM_PROCESS}
          />
        </div>
      </section>

      {/* ---------- optional: certification strip (trust) ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Our qualification & certifications"
            sub="What stands behind the products you will put your name on."
          />
          <div className="mt-14">
            <V3CardGrid
              columns={4}
              items={OEM_CERTS.map((c) => ({
                icon: <Icon name={c.icon} size={20} />,
                title: c.label,
                body: c.detail,
              }))}
            />
          </div>
          <a data-journey="page" href="/certifications.html" className="v3-link mt-8 inline-flex items-center gap-1.5 text-sm font-semibold">
            Download the 10 reports <span aria-hidden>&rarr;</span>
          </a>
        </div>
      </section>

      {/* ---------- H2: FAQ (GEO) ---------- */}
      <section className="v2-section" id="faq">
        <div className="v2-container">
          <h2 className="v2-display text-3xl md:text-4xl">Frequently asked questions</h2>
          <dl className="mt-10 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
            {OEM_FAQ.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
                <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">{f.q}</dt>
                <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- closing CTA ---------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Request a quotation within one business day.</h2>
            <p className="mt-3 text-white/85">Send the brief — SKU or formula, volume, destination — and have tiered pricing with a named contact.</p>
          </div>
          <a data-journey="contact" href="/contact.html" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900">Request a quotation</a>
        </div>
      </section>
    </>
  );
}

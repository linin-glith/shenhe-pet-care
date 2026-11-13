// R&D (Capabilities) — v2 engine, hand-built.
//
// The last of the three capability pages. Together they form the triangle:
//   R&D     — what we can develop
//   OEM/ODM — how we work together
//   Factory — the hardware behind it
//
// Block skeleton is deliberately identical to Factory so the two read as one
// system: HeroA → stat badges → workflow → three H3 capabilities → FAQ → CTA.
// Heading hierarchy is 1 H1 / 4 H2 / 3 H3 with no orphan h4+.
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file.

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import { pageCopy } from '@/lib/i18n/pages';
import page from '@/content/capabilities.json';
import type { LegacyPage } from '@/lib/legacy-types';
import { JsonLd } from '@/components/LegacyPage';
import { siteConfig } from '@/lib/shenhe.config';
import { ACTIVE_SKU_COUNT, RND_TEAM_SENTENCE } from '@/lib/shenhe.config';
import { REPORT_EVIDENCE_SENTENCE } from '@/lib/commerce';
import { Btn } from '@/components/v2/blocks';
import { FaqView } from '@/components/v2/Converted';
import { MediaCardGrid } from '@/components/v2/MediaCardGrid';
import { ProcessTrack } from '@/components/v2/Type';
import { IMPORT_OBLIGATIONS, OUT_OF_SCOPE, PROGRAM_STAGES, RD_FACILITIES, RD_FAQ_EXTENDED, RD_METRICS, RD_WORKFLOW } from '@/content/v2/capabilities';
import { V3DuoGrid, V3Head } from '@/components/v2/V3';
import { Icon } from '@/components/v2/Icon';
import { CAPABILITIES_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';
import { BUILD_DATE } from '@/lib/seo/build-date';

const data = page as unknown as LegacyPage;

const TITLE = 'Pet Care R&D Capabilities | Custom Formula Development';
const DESCRIPTION =
  'Pet care R and D in China: 8 in-house chemists, two PhDs from SCUT. Custom formulas, private label, and the test reports behind them, published in full.';

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
  alternates: { canonical: `${siteConfig.brand.siteUrl}/capabilities.html` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/capabilities.html`,
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
  const copy = pageCopy('capabilities', locale);
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

/** FAQPage generated from the SAME array the page renders — never drifts. */
function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    dateModified: BUILD_DATE,
    mainEntity: RD_FAQ_EXTENDED.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * The answer and its limit are read from content/v2/answers.ts, where they
 * were split into short sentences at source. A page-level copy of them
 * would have fixed this page and left the other four pages that read the
 * same constant carrying the old 60-word sentence.
 */

export default function CapabilitiesPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      {/*
        The captured legacy blocks, minus the stale FAQPage — this page
        renders its own questions further down, and the schema for those is
        generated from the same array.

        This used to be a hand-rolled copy of what the shared JsonLd
        component does, which is how three pages ended up with three
        slightly different rules about what the captured head may say. The
        shared component also completes the page node and leaves the
        organisation to the layout, so this page now says what it is and
        when it was published like every other page.
      */}
      <JsonLd page={data} except={['FAQPage']} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }} />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">R&amp;D</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            What we can develop.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            A claim on your label has to survive someone else&apos;s QA team — and
            most suppliers cannot show you the file that proves it. Our{' '}
            {siteConfig.metrics.gmpStandard} GMP workshop in Heyuan, Guangdong runs{' '}
            {siteConfig.metrics.productionLines} production lines for {ACTIVE_SKU_COUNT}{' '}
            private-label SKUs. The team is {RND_TEAM_SENTENCE}. The batch reject rate
            so far in 2026 is 1.2%.{' '}
            {REPORT_EVIDENCE_SENTENCE}
          </p>
          <DataBar items={standardDataBar(['labs', 'people', 'years', 'lines'])}  tone="dark" />

          <PageAnswer {...CAPABILITIES_ANSWER} />
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'Share your requirement', href: '/contact.html' }} light />
            <Btn cta={{ label: 'See the factory', href: '/factory.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- V3: figures as a hairline grid (mirrors Factory) ---------- */}
      <section className="v3-section--tight border-b border-v2-ink-200">
        <div className="v2-container">
          <V3DuoGrid
            columns={4}
            items={RD_METRICS.map((m) => ({
              label: m.label,
              value: m.value,
              note: m.note,
              icon: <Icon name="flask" size={19} />,
            }))}
          />
        </div>
      </section>

      {/* ---------- H2: workflow — dark band, because process is service content ---------- */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <ProcessTrack
            dark
            title="Our R&D Workflow"
            lead="From the first brief to a documented handover to production."
            steps={RD_WORKFLOW}
          />
        </div>
      </section>

      {/* ---------- H2: lab facilities (three H3, dark — the service material) ---------- */}
      {/* ---------- H2: What you decide at each stage ----------
          RD_WORKFLOW above lists the technical stages in order. This lists
          the decision that belongs to the buyer at each one, because what
          stalls a private label project is rarely the chemistry — it is a
          formula or an artwork that was never signed off, or a minimum that
          was assumed rather than confirmed. */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="What you decide, stage by stage"
            sub="Six stages, and the one thing that has to be settled at each."
          />
          <ol className="mt-12 space-y-10">
            {PROGRAM_STAGES.map((s) => (
              <li key={s.stage} className="grid gap-4 border-t border-v2-ink-200 pt-6 md:grid-cols-[3.5rem_1fr] md:gap-8">
                <span aria-hidden className="font-mono text-sm font-semibold tabular-nums text-v2-accent-600">
                  {s.stage}
                </span>
                <div>
                  <h3 className="v2-display text-lg">{s.name}</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-v2-ink-400">
                        You decide
                      </dt>
                      <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-v2-ink-700">{s.youDecide}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-v2-ink-400">
                        We do
                      </dt>
                      <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-v2-ink-700">{s.weDo}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-v2-signal-600">
                        Where it stalls
                      </dt>
                      <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-v2-ink-600">{s.commonStall}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- H2: Importing it (dark) ----------
          "What do I need to import this" is asked more often than "what does
          the factory do", and answering it properly is a bigger part of the
          job than a capabilities page suggests. */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="What importing it actually involves"
            sub="Four obligations that decide whether a consignment clears."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-v2-ink-700 bg-v2-ink-700 md:grid-cols-2">
            {IMPORT_OBLIGATIONS.map((o) => (
              <div key={o.title} className="bg-v2-ink-900 p-6">
                <h3 className="text-sm font-semibold text-white">{o.title}</h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-v2-ink-300">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- H2: What we will not do ----------
          A page that only lists capabilities reads as a sales page. A buyer
          deciding whether a supplier is the right fit reads the limits before
          the claims, so these are stated here as plainly as the capabilities. */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="What we will not do"
            sub="Real constraints, not a disclaimer."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {OUT_OF_SCOPE.map((o) => (
              <div key={o.item} className="border-t border-v2-ink-200 pt-5">
                <h3 className="text-base font-semibold text-v2-ink-900">{o.item}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-v2-ink-600">{o.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="R&D Testing & Lab Facilities"
            sub="What we measure in-house, before we ship."
          />
          <div className="mt-14">
            <MediaCardGrid
              columns={3}
              items={RD_FACILITIES.map((f) => ({
                src: f.img,
                alt: `${f.name} at the Shenhe Zhongke R&D laboratory`,
                title: f.name,
                body: f.caption,
              }))}
            />
          </div>
        </div>
      </section>

      {/* ---------- H2: FAQ (GEO) ---------- */}
      <FaqView b={{ kind: 'faq', eyebrow: 'R&D FAQ', title: 'R&D FAQ', items: RD_FAQ_EXTENDED }} />

      {/* ---------- closing CTA ---------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Submit your R&amp;D enquiry.</h2>
            <p className="mt-3 text-white/85">Share your custom development requirement — target claim, market and volume — and get a feasibility answer, not a brochure.</p>
          </div>
          <a data-journey="contact" href="/contact.html" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900">Share Your Custom Development Requirement</a>
        </div>
      </section>
    </>
  );
}
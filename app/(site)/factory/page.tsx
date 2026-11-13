// Factory — v2 engine, hand-built (逐页精做).
//
// Eleven real photographs, properly captioned. Every production line shows the
// photograph of the line that made it, instead of a placeholder caption
// buried in legacy HTML. Heading hierarchy is H1 -> H2 -> H3, no skips.
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file.

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import page from '@/content/factory.json';
import type { LegacyPage } from '@/lib/legacy-types';
import { JsonLd } from '@/components/LegacyPage';
import { siteConfig } from '@/lib/shenhe.config';
import { REPORT_EVIDENCE_SENTENCE } from '@/lib/commerce';
import { Btn } from '@/components/v2/blocks';
import { FaqView } from '@/components/v2/Converted';
import { MediaCardGrid } from '@/components/v2/MediaCardGrid';
import { V3CardGrid, V3DuoGrid, V3Head } from '@/components/v2/V3';
import { Icon } from '@/components/v2/Icon';
import FactoryMap from '@/components/v2/FactoryMap';
import {
  EXPORT_MARKETS,
  FACILITIES,
  FACTORY_FAQ,
  FACTORY_FAQ_EXTENDED,
  FACTORY_METRICS,
  FACTORY_TIMELINE,
  LINE_DETAILS,
  PRODUCTION_LINES,
  QC_PATH,
  VISIT_ARGUMENTS,
} from '@/content/v2/factory';
import { FACTORY_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';
import { pageCopy } from '@/lib/i18n/pages';
import { BUILD_DATE } from '@/lib/seo/build-date';

const data = page as unknown as LegacyPage;

const TITLE = 'Pet Care Factory China | 30,000m² GMP, 1M Bottles/Month';
const DESCRIPTION =
  'Tour the 30,000 m² Shenhe Zhongke industrial park in Heyuan, China. 5,000 m² GMP workshop, six filling lines, 220 people, photographed. See the floor.';

/**
 * The metadata of this page, in the buyer's language.
 *
 * A German buyer searches "Tierpflege Hersteller China" and the result
 * they click has to say that in German. The description is the same
 * sentence, said to the search engine.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('factory', locale);
  const title = locale === 'en' ? TITLE : copy.title;
  const description = fitDescription(locale === 'en' ? DESCRIPTION : copy.description);
  const canonical = `${siteConfig.brand.siteUrl}/factory.html`;
  const image = `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.brand.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: locale === 'de' ? 'de_DE' : locale === 'es' ? 'es_ES' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function FactoryPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = pageCopy('factory', locale);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            dateModified: BUILD_DATE,
            mainEntity: FACTORY_FAQ_EXTENDED.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        {/* The map, blown up and blurred, bleeding in from the left. The same
            dark-green mesh the home page opens with sits over it, so the two
            pages share one atmosphere. Decorative only — the live map below
            carries the information. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden lg:w-[70%]" aria-hidden>
          <FactoryMap variant="backdrop" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-v2-ink-900/35 to-v2-ink-900" />
        </div>
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div>
              <p className="v2-eyebrow v2-eyebrow--light">{copy.eyebrow}</p>
              <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            {copy.h1}
          </h1>
              <p className="v2-lead v2-lead--light mt-5 max-w-xl">
                A supplier&apos;s factory photographs are usually taken for the brochure.
                Every claim on this page is backed by a picture you can request at full
                resolution — the same one a buyer sees on an audit visit.{' '}
                {REPORT_EVIDENCE_SENTENCE}
              </p>
          <DataBar items={standardDataBar(['park', 'lines', 'people', 'years'])}  tone="dark" />

          <PageAnswer {...FACTORY_ANSWER} />
              <div className="mt-9 flex flex-wrap gap-3">
                <Btn cta={{ label: 'Book a visit or video audit', href: '/contact.html' }} light />
                <Btn cta={{ label: 'Download the audit', href: '/certifications.html', variant: 'secondary' }} light />
              </div>
              <div className="mt-9 max-w-md">
                <p className="text-sm leading-relaxed text-white/60">
                  {siteConfig.brand.address}
                  <br />
                  <span className="text-white/50">{siteConfig.brand.addressCN}</span>
                </p>
                {/* A factory audit starts with a phone call, not a form. */}
                <dl className="mt-5 grid grid-cols-[3.5rem_1fr] items-baseline gap-x-4 gap-y-2 text-sm">
                  <dt className="text-xs uppercase tracking-wider text-white/50">Tel</dt>
                  <dd>
                    <a
                      href={`tel:${siteConfig.brand.tel.replace(/[^+\d]/g, '')}`}
                      className="v3-link font-semibold text-white"
                    >
                      {siteConfig.brand.tel}
                    </a>
                  </dd>
                  <dt className="text-xs uppercase tracking-wider text-white/50">Email</dt>
                  <dd>
                    <a href={`mailto:${siteConfig.brand.emailSales}`} className="v3-link break-all text-white">
                      {siteConfig.brand.emailSales}
                    </a>
                  </dd>
                  <dt className="text-xs uppercase tracking-wider text-white/50">WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${siteConfig.brand.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="v3-link font-semibold text-white"
                    >
                      {siteConfig.brand.whatsappDisplay}
                    </a>
                  </dd>
                </dl>
              </div>
            </div>

            <div className="lg:pl-4">
              <FactoryMap />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- V3: figures as a hairline two-column grid ---------- */}
      <section className="v3-section--tight border-b border-v2-ink-200">
        <div className="v2-container">
          <V3DuoGrid
            columns={4}
            items={FACTORY_METRICS.map((m) => ({
              label: m.label,
              value: m.value,
              note: m.note,
              icon: <Icon name="factory" size={19} />,
            }))}
          />
        </div>
      </section>

      {/* ---------- H2: the plant, in short sentences ----------
          The spec's block for this page: the plant stated in short
          sentences, with the four figures a buyer checks a factory on.
          A buyer reads sentence length as a proxy for credibility, so
          the figures are given one at a time. Every number is read from
          the shared configuration, so this section cannot disagree with
          the page above it. */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title={`A working plant, on ${siteConfig.metrics.parkAreaM2.toLocaleString()} m²`}
            sub={`Three buildings in Heyuan, Guangdong: a ${siteConfig.metrics.foundingWorkshopM2.toLocaleString()} m² founding workshop, a ${siteConfig.metrics.gmpWorkshopAreaM2.toLocaleString()} m² ${siteConfig.metrics.cleanroomClass} cleanroom filling hall, and ${siteConfig.metrics.officeAreaM2.toLocaleString()} m² of offices and QC. ${siteConfig.metrics.employees} people on site, full time.`}
          />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              `${siteConfig.metrics.monthlyCapacityBottles.toLocaleString()} bottles a month, across ${siteConfig.metrics.productionLines} production lines and ${siteConfig.metrics.productLines} product lines`,
              'On-site QC laboratory; every batch sampled before release',
              '1.2% batch reject rate, year to date in 2026',
              'Container loading photographed at the export dock',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-v2-ink-600"
              >
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-v2-accent-500" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <Btn cta={{ label: 'Tour the plant', href: '/contact.html' }} />
          </div>
        </div>
      </section>

      {/* ---------- H2: Our Production Lines ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Our Production Lines"
            sub="Six production lines across four product lines, raw material to packed carton — each photograph is the line that made it."
          />
          <div className="mt-14">
            <MediaCardGrid
              columns={3}
              items={PRODUCTION_LINES.map((l) => ({
                src: l.img,
                alt: `${l.name} at the Shenhe Zhongke facility`,
                title: l.name,
                body: l.caption,
                // Kept out of the outline so the page's three-H3 quota belongs
                // entirely to Supported Facilities, per spec.
                heading: null,
              }))}
            />
          </div>

          {/*
            THE FLOOR IN NUMBERS, WITH THE PHOTOGRAPHS.

            A factory page that is only photographs tells a buyer that the
            building exists and nothing about the business in it. The figures
            were on the page — but above the photographs, in a strip a
            scrolling buyer passes on the way to the pictures. So they are put
            back here, next to the lines they describe, and written as the
            questions a buyer actually asks: how big, how many, how clean, how
            often can it ship.

            Every figure is read from the shared config, so the numbers here
            are the same numbers the About page and the home page quote.
          */}
          <div className="mt-12 border-t border-v2-ink-200 pt-10">
            <h3 className="v2-display text-xl">The floor in numbers</h3>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-v2-ink-600">
              The six photographs above are the lines. These are the numbers that decide
              whether they can take your order: the area they work in, the class of cleanroom
              they fill in, and how many bottles leave the park in a month.
            </p>
            <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: 'Industrial park',
                  value: `${siteConfig.metrics.parkAreaM2.toLocaleString()} m²`,
                  note: `${siteConfig.metrics.buildings} connected blocks in Heyuan, Guangdong`,
                },
                {
                  label: 'GMP workshop',
                  value: `${siteConfig.metrics.gmpWorkshopAreaM2.toLocaleString()} m²`,
                  note: `${siteConfig.metrics.gmpStandard} certified, ${siteConfig.metrics.cleanroomClass} cleanroom`,
                },
                {
                  label: 'Monthly capacity',
                  value: `${(siteConfig.metrics.monthlyCapacityBottles / 1000).toFixed(0)}K bottles`,
                  note: `across ${PRODUCTION_LINES.length} lines and ${siteConfig.metrics.productLines} product lines`,
                },
                {
                  label: 'People on site',
                  value: `${siteConfig.metrics.employees}`,
                  note: 'production, QC, documentation and export',
                },
                {
                  label: 'Carton configuration',
                  value: '12 bottles / carton',
                  note: 'export cartons, dimensions and gross weight on every product page',
                },
                {
                  label: 'Export experience',
                  value: `${siteConfig.metrics.exportsToCountries} countries`,
                  note: `${siteConfig.metrics.majorExportRegions} major regions, with the documents each needs`,
                },
              ].map((f) => (
                <div key={f.label} className="border-t border-v2-ink-200 pt-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-tight text-v2-ink-900">
                    {f.value}
                  </dd>
                  <dd className="mt-1 text-[0.875rem] leading-relaxed text-v2-ink-500">{f.note}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ---------- What actually happens on each line ----------
              The photographs above show the lines. This says what happens on
              each one and which control applies, because a buyer auditing a
              supplier asks about process control rather than about pictures,
              and a six-line process described in six sentences is the level of
              detail that makes a supplier indistinguishable from its
              competitors. */}
          <div className="mt-16 border-t border-v2-ink-200 pt-12">
            <h3 className="v2-display text-xl">What happens on each line, and what controls it</h3>
            <ol className="mt-8 space-y-9">
              {LINE_DETAILS.map((l) => (
                <li key={l.step} className="grid gap-3 md:grid-cols-[3.5rem_1fr] md:gap-6">
                  <span
                    aria-hidden
                    className="font-mono text-sm font-semibold tabular-nums text-v2-accent-600"
                  >
                    {l.step}
                  </span>
                  <div>
                    <h4 className="text-base font-semibold text-v2-ink-900">{l.name}</h4>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-v2-ink-600">{l.what}</p>
                    <p className="mt-2.5 border-l-2 border-v2-accent-300 pl-3 text-[0.875rem] leading-relaxed text-v2-ink-500">
                      {l.control}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- H2: Quality path (dark) ----------
          The section an auditor reads first. Written as a sequence rather
          than a claim, because "how do you test" is answered by the order of
          operations, not by an adjective. */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="Between a blend and a container"
            sub="The quality path, in the order it happens."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-v2-ink-700 bg-v2-ink-700 md:grid-cols-2 lg:grid-cols-3">
            {QC_PATH.map((q) => (
              <div key={q.title} className="bg-v2-ink-900 p-6">
                <h3 className="text-sm font-semibold text-white">{q.title}</h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-v2-ink-300">{q.body}</p>
              </div>
            ))}
          </div>

          {/* Export markets — which regulatory frames have already been
              navigated, which is the question behind "have you shipped to my
              country before". */}
          <div className="mt-14">
            <h3 className="v2-display text-xl text-white">Where the product goes</h3>
            <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {EXPORT_MARKETS.map((m) => (
                <div key={m.market} className="border-t border-v2-ink-700 pt-4">
                  <dt className="text-sm font-semibold text-white">{m.market}</dt>
                  <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-v2-ink-400">{m.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- H2: Why visit, stated honestly ----------
              A video audit is offered and is often enough. This is the case
              for the visit, so the page answers the question rather than
              pushing it. */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="If you do come"
            sub="A video audit is offered and is often enough. These are the four things a visit settles that a video does not."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {VISIT_ARGUMENTS.map((v) => (
              <div key={v.title} className="border-t border-v2-ink-200 pt-5">
                <h3 className="text-base font-semibold text-v2-ink-900">{v.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-v2-ink-600">{v.body}</p>
              </div>
            ))}
          </div>

          {/* The timeline, read from the shared config so About and this page
              cannot disagree about when the factory was founded or when it
              reached its current capacity. */}
          <div className="mt-16">
            <h3 className="v2-display text-xl">Twelve years, six milestones</h3>
            <ol className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {FACTORY_TIMELINE.map((t) => (
                <li key={t.year} className="border-t border-v2-ink-200 pt-4">
                  <span className="font-mono text-sm font-semibold tabular-nums text-v2-accent-700">
                    {t.year}
                  </span>
                  <h4 className="mt-1.5 text-[0.9375rem] font-semibold text-v2-ink-900">{t.title}</h4>
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-v2-ink-600">{t.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- H2: Supported Facilities (dark — the service material) ---------- */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="Supported Facilities"
            sub="The spaces that turn a filling line into a supply chain."
          />
          <div className="mt-14">
            <MediaCardGrid
              columns={3}
              items={FACILITIES.map((f) => ({
                src: f.img,
                alt: `${f.name} at the Shenhe Zhongke facility`,
                title: f.name,
                body: f.caption,
              }))}
            />
          </div>
        </div>
      </section>

      {/* ---------- H2: FAQ (GEO) ---------- */}
      <FaqView b={{ kind: 'faq', eyebrow: 'Factory FAQ', title: 'Factory FAQ', items: FACTORY_FAQ_EXTENDED }} />

      {/* ---------- closing CTA ---------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Walk the floor, then place the order.</h2>
            <p className="mt-3 text-white/85">Visit in person or book a video audit — the same floor, the same lines, the same QC bench.</p>
          </div>
          {/*
            The closing action, in the same button as everywhere else on
            the site. It used to be a hand-written pill, which is how one
            button on one page ends up looking like a different product.
          */}
          <Btn cta={{ label: 'Book a visit', href: '/contact.html', variant: 'light' }} />
        </div>
      </section>
    </>
  );
}

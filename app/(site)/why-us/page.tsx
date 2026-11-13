/**
 * WHY US — the four questions a buyer asks when a second factory is already quoting.
 *
 * WHY THIS PAGE EXISTS
 *
 * A buyer comparing two Chinese pet care factories is not asking "which
 * of you is better". That question has no answer a website can give, and
 * a page that tries gives a list of adjectives. The buyer is asking four
 * questions that can be answered:
 *
 *   1. Can you make my format?
 *   2. Can you prove it?
 *   3. What goes wrong if it does?
 *   4. Who answers when it goes wrong?
 *
 * Each of the four has a checkable answer on this site, and each of the
 * four names the document behind it. That is the whole difference between
 * a factory and a claim: a claim is a sentence about a factory, and this
 * page is a set of addresses.
 *
 * WHAT IT IS NOT
 *
 * It is not a competitor comparison. Naming another factory and scoring
 * it would be a claim we cannot verify and cannot stand behind, and it
 * would make this page read like a sales brochure. What it does instead
 * is publish the gates: the checks that any factory — including this one
 * — either clears or does not. A reader can run the same checks on the
 * other quotation and compare the answers.
 *
 * The scorecard and the ten red flags are already written, in the guide
 * on how to choose a pet care OEM manufacturer in China, and they are
 * linked rather than copied: a copy is a copy that will drift.
 *
 * WHY IT IS A PAGE AND NOT A SECTION
 *
 * It is the page a buyer is most likely to open after a first
 * conversation, and it is the page an assistant is most likely to read
 * when asked "how do I know this supplier is real". Both of them need
 * the answer to stand on its own, in one place, with its own address.
 */

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import { pageCopy } from '@/lib/i18n/pages';
import { siteConfig } from '@/lib/shenhe.config';
import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { Btn } from '@/components/v2/blocks';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { activeSkuCount } from '@/lib/products';
import { skusWithoutReport } from '@/content/v2/sources';

const TITLE = 'Why Us — Four Checks, and How to Run Them | SHENHE ZHONGKE';
const DESCRIPTION =
  'Four questions decide a pet care factory: can you make my format, can you prove it, how fast can you ship, and what does it costthe buyer, in the end?';

/**
 * The four dimensions.
 *
 * Each one names the question, what the check is, what we publish, and
 * where the document is. The "where" is the point: a claim without an
 * address is not a check, it is a sentence.
 */
const DIMENSIONS = [
  {
    n: '01',
    question: 'Can you make my format?',
    lead: 'Most pet care factories can make a shampoo. Fewer can make yours — a 300 mL bottle at a viscosity you specify, or a sachet format for a dental product, is a development rather than a catalogue line.',
    checks: [
      `${activeSkuCount} catalogue SKUs across ${siteConfig.metrics.productLines} product lines, each with its own format, size, minimum order and lead time`,
      'OEM (your formula) and ODM (ours, your label) both in-house — 8 in-house chemists (5 MSc, 3 BSc), plus 2 regulatory specialists and 2 SCUT PhDs',
      'Custom formulation in 30–45 days, laboratory samples in 7–10 days',
      'Private label covers the formula, the artwork, and the label compliance for your destination market',
    ],
    proves: 'The catalogue, with every size, minimum order and lead time on the product card',
    href: '/products.html',
    linkLabel: 'Open the catalogue',
  },
  {
    n: '02',
    question: 'Can you prove it?',
    lead: 'The second factory quoting you will also send certificates. The difference is whether the certificate is a document you can check or a sentence in an email.',
    checks: [
      '10 third-party laboratory reports — 7 from GDDCM, 3 from NACC — each with its own report number',
      'Issued by CMA- and CNAS-accredited laboratories; every report page says how to verify it',
      'ISO 22716 GMP with a class-D cleanroom, and FDA establishment registration',
      '3 Chinese licences with their numbers and validity dates: disinfection production and feed additive production, issued to our own entity, and the high-tech enterprise certificate, held by another company in the same group',
      'The high-tech certificate names its holder on the scan, and so does the certifications page — you can check which entity holds which document',
      'Each production batch attested on a public blockchain: the report’s SHA-256, the transaction and the block, readable by anyone',
    ],
    proves: 'The reports themselves, downloadable, with the laboratory named on each — and, for every batch, the fingerprint recorded on a public chain',
    href: '/attestation.html',
    linkLabel: 'See the batch attestations',
  },
  {
    n: '03',
    question: 'What goes wrong if it does?',
    lead: 'A factory that has never had a failed batch cannot tell you how it handles one. This one has, and publishes the rate.',
    checks: [
      '1.2% batch reject rate year to date in 2026 — published, not rounded down',
      '6-step QC from incoming raw material to packed carton, with batch COA on every lot',
      'Every SKU has a documented 12-month shelf-life study and a stability protocol',
      'On request, we test for the claims you intend to make — in the same laboratories, with the reports issued to you',
    ],
    proves: 'The quality page, with the six steps and the batch documentation',
    href: '/capabilities.html',
    linkLabel: 'Open the quality page',
  },
  {
    n: '04',
    question: 'Who answers when it goes wrong?',
    lead: 'A quotation tells you what a factory can do. A contract tells you who picks up the phone at 2 a.m. when a container is held up.',
    checks: [
      'A named sales manager replies within one business day, on WhatsApp during China Standard Time',
      'The factory is the counterparty: the legal entity, the address and the licence numbers are published',
      'Payment terms are stated: T/T, or L/C at sight from USD 30,000',
      'Dispute resolution, Incoterms, FX and VAT policy are written down, not negotiated per order',
    ],
    proves: 'The trade terms, in full, including what happens when something goes wrong',
    href: '/trade-compliance.html',
    linkLabel: 'Read the trade terms',
  },
] as const;

/**
 * The limits, as quotable answers.
 *
 * An assistant asked "is this supplier trustworthy" should be able to lift
 * a sentence that says exactly what the documents support and what they
 * do not. Overclaiming here is what voids a page like this one.
 */
/**
 * The SKUs a third-party laboratory report covers.
 *
 * The reports name the SKUs they cover (content/v2/reports.ts), and this
 * counts them. The page used to say ten, and the standards page said
 * twelve had no report -- so the two pages contradicted each other, and
 * both were hand-typed. The truth is eight covered and twelve not.
 */
const SKUS_WITH_REPORT = activeSkuCount - skusWithoutReport().length;

const LIMITS = [
  {
    q: 'Are your products approved?',
    a: 'Not in the general sense, and we do not say so. ISO 22716 is a manufacturing standard, not a product approval. FDA establishment registration lists our facility; it does not clear any product. A product is approved in a market when that market\'s authority says so, and for most destinations the file is ours to prepare and yours to hold.',
  },
  {
    q: `Are all ${activeSkuCount} SKUs backed by a third-party report?`,
    a: `No, and we publish which ones are not. ${SKUS_WITH_REPORT} SKUs are covered by third-party laboratory reports; the remainder are covered by the site's own test data and are quoted for third-party testing on request.`,
  },
  {
    q: 'What is the price?',
    a: 'It is not on this site, on purpose. Price depends on volume tier, packaging specification and destination, so it is quoted against your brief. Minimum order and lead time are published, because they do not change with your volume.',
  },
  {
    q: 'How fast can you ship?',
    a: 'Stock catalogue formulas ship in 7–15 days. Private label runs 25–40 days including sampling and artwork approval. Both windows are on every product page, and neither is a promise made before we have seen your brief.',
  },
  {
    q: 'What do you not do?',
    a: 'We are a contract manufacturer. We do not sell direct to consumers, we do not publish a price list, and we do not hold licences in your market — we prepare the file and you hold the approval.',
  },
];

/** The scorecard, in one line: the weights a reader can reuse. */
const SCORECARD = [
  { dimension: 'Product and route fit', weight: '20%' },
  { dimension: 'Formula and packaging fit', weight: '20%' },
  { dimension: 'Quality and evidence fit', weight: '20%' },
  { dimension: 'Sampling and change control', weight: '15%' },
  { dimension: 'Commercial and operational fit', weight: '15%' },
  { dimension: 'Communication and responsibility', weight: '10%' },
] as const;

function buildMeta(): Metadata {
  return {
  title: TITLE,
  description: fitDescription(DESCRIPTION),
  alternates: { canonical: `${siteConfig.brand.siteUrl}/why-us.html` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/why-us.html`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: fitDescription(DESCRIPTION),
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: fitDescription(DESCRIPTION),
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
  };
}

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const base = buildMeta();
  if (locale === 'en') return base;
  const copy = pageCopy('why-us', locale);
  if (!copy.title) return base;
  return {
    ...base,
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: { ...base.openGraph, title: copy.title, description: fitDescription(copy.description) },
    twitter: { ...base.twitter, title: copy.title, description: fitDescription(copy.description) },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function WhyUsPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = pageCopy('why-us', locale);
  const t = locale === 'en' ? null : copy;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: TITLE,
              path: '/why-us.html',
              description: fitDescription(DESCRIPTION),
              type: 'AboutPage',
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(LIMITS, {
              name: 'What this page does and does not claim',
              url: `${siteConfig.brand.siteUrl}/why-us.html`,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Why us</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Four checks. Here is how you run them on any factory — including this one.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-2xl">
            You already have a quotation. Rather than tell you we are better, this page
            publishes the four questions that decide it, and the address of every document
            behind our answer to each one. Run the same checks on the other factory and
            compare the answers.
          </p>
          <DataBar items={standardDataBar(['park', 'capacity', 'people', 'lines'])}  tone="dark" />
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'See the reports', href: '/certifications.html' }} light />
            <Btn cta={{ label: 'Read the guide', href: '/blog/sourcing/how-to-choose-a-pet-care-oem-manufacturer-in-china.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- the four dimensions ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="The four dimensions"
            sub="Each one has a check, and each check has a document behind it. The link at the end of each is where the document is."
          />
          <div className="mt-14 space-y-6">
            {DIMENSIONS.map((d) => (
              <article key={d.n} className="v3-card v3-rise p-7 md:p-9">
                <div className="grid gap-8 md:grid-cols-[1fr_1.15fr]">
                  <div>
                    <p className="font-mono text-xs tracking-[0.16em] text-v2-accent-700">{d.n}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-v2-ink-900 md:text-3xl">
                      {d.question}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-v2-ink-600">{d.lead}</p>
                    <p className="mt-5 text-sm text-v2-ink-500">
                      <span className="font-semibold text-v2-ink-900">What proves it:</span> {d.proves}
                    </p>
                    <a href={d.href} className="v3-link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                      {d.linkLabel} <span aria-hidden>&rarr;</span>
                    </a>
                  </div>
                  <ul className="space-y-3">
                    {d.checks.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-700">
                        <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the scorecard ---------- */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <V3Head
            title="The scorecard, with the weights"
            sub="Score the suppliers that cleared the checks, not the ones that failed them. These are the weights — they are yours to reuse on any quotation."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCORECARD.map((s) => (
              <div key={s.dimension} className="rounded-v2-lg border border-v2-ink-200 bg-white p-6">
                <p className="font-mono text-2xl font-semibold tracking-tight text-v2-accent-700">{s.weight}</p>
                <p className="mt-2 text-sm font-semibold text-v2-ink-900">{s.dimension}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-v2-ink-600">
            Grade each dimension from 1 to 5, write the evidence and the open question next to
            the number, and multiply the weight by the grade over five. One rule matters more
            than the weights: a supplier that failed a critical check does not get a passing
            score, however well it scores elsewhere.{' '}
            <a
              href="/blog/sourcing/how-to-choose-a-pet-care-oem-manufacturer-in-china.html"
              className="v3-link font-semibold"
            >
              The full guide, with the ten red flags <span aria-hidden>&rarr;</span>
            </a>
          </p>
        </div>
      </section>

      {/* ---------- what we do not claim ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="What we do not claim"
            sub="The limits are the part a buyer would otherwise discover late, in a qualification meeting, at their own cost."
          />
          <dl className="mt-14 space-y-6">
            {LIMITS.map((l) => (
              <div key={l.q} className="border-l-2 border-v2-accent-600 pl-5">
                <dt className="text-base font-semibold text-v2-ink-900">{l.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-v2-ink-600">{l.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- the counterparty ---------- */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <V3Head
                title="The counterparty you are contracting with"
                sub="Not a trading company, not an agent. The factory, with the licences that make it responsible for what it ships."
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  `${siteConfig.brand.legalName}, established ${siteConfig.brand.foundedYear}`,
                  `${siteConfig.metrics.employees} employees on site`,
                  `${siteConfig.metrics.parkAreaM2.toLocaleString()} m² park, ${siteConfig.metrics.gmpWorkshopAreaM2.toLocaleString()} m² GMP workshop`,
                  `6 production lines, ${siteConfig.metrics.monthlyCapacityBottles.toLocaleString()} bottles a month`,
                  'ISO 22716 GMP, FDA establishment registration',
                  'Ten third-party laboratory reports, all downloadable',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-700">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
                The legal entity behind all of it
              </p>
              <p className="mt-3 text-lg font-semibold text-v2-ink-900">{siteConfig.brand.legalName}</p>
              <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">{siteConfig.brand.address}</p>
              <p className="mt-4 text-sm text-v2-ink-600">
                <a data-journey="contact" href="/contact.html" className="v3-link font-semibold">
                  Ask us the four questions yourself
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

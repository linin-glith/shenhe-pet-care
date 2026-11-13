/**
 * HOW WE VERIFY — the site's sources, in one place.
 *
 * WHY THIS PAGE EXISTS
 *
 * A buyer has to decide whether to trust a factory before they can decide
 * whether to order from it, and the decision needs one question answered:
 * where does any of this come from?
 *
 * The site had the answers scattered across it — the catalogue behind the
 * product pages, the reports behind the certifications page, the licences
 * printed on that same page, the byline at the top of every guide — but no
 * page said so. An assistant reading the site could not connect a guide to
 * the document behind it, and a buyer had to assemble the picture by
 * themselves from five pages.
 *
 * So this page is that answer, in one place, and every guide links to it.
 *
 * WHAT IT IS NOT
 *
 * It is not a certificate wall. Every figure on it points at a document that
 * can be checked: a report number that identifies a document, a laboratory
 * that can confirm it, a licence with a number and a validity date. And it
 * says plainly where the company's authority stops — because an E-E-A-T page
 * that oversells is worse than no E-E-A-T page at all.
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
import { LIMITS, SOURCE_FAMILIES, reportTable, skusWithoutReport } from '@/content/v2/sources';

const TITLE = 'How We Verify Pet Care Claims | SHENHE ZHONGKE';
const DESCRIPTION =
  'Where every figure on this site comes from: the product catalogue, ten third-party reports, and the factory records behind them. Every figure checked.';

/**
 * The metadata of the English page.
 *
 * It is a function so that the language pages can ask for their own
 * title and description without a second copy of the same object.
 */
function buildMeta(): Metadata {
  return {
  title: TITLE,
  description: fitDescription(DESCRIPTION),
  alternates: { canonical: `${siteConfig.brand.siteUrl}/standards.html` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/standards.html`,
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

/**
 * The metadata of this page, in the buyer's language.
 *
 * The title and the description are the same sentence said to the
 * reader and to the search engine, so they change together.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const base = buildMeta();
  if (locale === 'en') return base;
  const copy = pageCopy('standards', locale);
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

export default function StandardsPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const reports = reportTable();
  const uncovered = skusWithoutReport();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: TITLE,
              path: '/standards.html',
              description: fitDescription(DESCRIPTION),
              type: 'AboutPage',
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      {/* The limits, as a quotable answer. An assistant asked "is this product
          approved?" should be able to lift a sentence that says exactly what
          the documents do and do not support. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(LIMITS, {
              name: 'What this site does and does not claim',
              url: `${siteConfig.brand.siteUrl}/standards.html`,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">How we verify</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Every number here has a source you can check.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-2xl">
            The catalogue behind the product pages. Ten laboratory reports with their
            numbers on them. The permits we hold, with their validity dates. And the
            team that reads them before a guide goes out.
          </p>
          <DataBar items={standardDataBar(['labs', 'years', 'people', 'markets'])}  tone="dark" />
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'See the certificates', href: '/certifications.html' }} light />
            <Btn cta={{ label: 'Read a guide', href: '/sourcing-guides.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- where each claim comes from ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Four places a claim can come from"
            sub="If a figure on this site is not one of these four, ask us for it and we will tell you where it came from."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {SOURCE_FAMILIES.map((s) => (
              <section key={s.id} className="v3-card v3-rise p-7">
                <h3 className="text-lg font-semibold tracking-tight text-v2-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm font-medium text-v2-accent-700">{s.what}</p>
                <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">{s.detail}</p>
                <a href={s.href} className="v3-link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  {s.linkLabel} <span aria-hidden>&rarr;</span>
                </a>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the reports ---------- */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <V3Head
            title="The reports, and the SKUs each one covers"
            sub="Each row opens the report itself, which carries the laboratory, the report number and the laboratory’s own way of confirming it."
          />
          <div className="mt-14 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-v2-ink-200 text-[11px] uppercase tracking-[0.12em] text-v2-ink-500">
                  <th className="py-3 pr-4 font-semibold">Report</th>
                  <th className="py-3 pr-4 font-semibold">Test</th>
                  <th className="py-3 pr-4 font-semibold">Issuer</th>
                  <th className="py-3 pr-4 font-semibold">SKUs</th>
                  <th className="py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.number} className="border-b border-v2-ink-100 align-top">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-v2-ink-900">{r.number}</span>
                      <span className="mt-0.5 block text-xs text-v2-ink-500">{r.title}</span>
                    </td>
                    <td className="py-3 pr-4 text-v2-ink-700">{r.test}</td>
                    <td className="py-3 pr-4 text-v2-ink-600">{r.issuer}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-v2-ink-700">{r.skus}</td>
                    <td className="py-3">
                      <a href={r.href} className="v3-link whitespace-nowrap text-sm font-semibold">
                        Open <span aria-hidden>&rarr;</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uncovered.length > 0 && (
            <p className="mt-6 text-sm leading-relaxed text-v2-ink-600">
              <span className="font-semibold text-v2-ink-900">
                {uncovered.length} of our SKUs have no third-party report of their own.
              </span>{' '}
              We publish that rather than leave you to find it during qualification:
              those are {uncovered.join(', ')}, and testing for them is quoted on request.
            </p>
          )}
        </div>
      </section>

      {/* ---------- the batch attestations ---------- */}
      {/*
        THE FOURTH PLACE A CLAIM CAN COME FROM.

        A report is a document. A batch attestation is a fact about that
        document at a point in time, recorded somewhere the factory does
        not control. The section says exactly what it proves and exactly
        what it does not, because an attestation that is read as an
        approval is the same overclaiming as a certificate wall.
      */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Batch attestations: the report, recorded on a public chain"
            sub="Every production batch carries the fingerprint of its laboratory report, written to a public blockchain. Anyone can read it, including someone who does not trust us."
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div>
              <p className="text-base leading-relaxed text-v2-ink-700">
                A PDF on a website is a claim: the factory uploaded it, and the
                factory could replace it. An attestation is not. When a batch
                passes its quality checks, we compute the SHA-256 of its laboratory
                report and write that hash to the Base chain, together with the
                batch number, the SKU, the quantity and the production date.
              </p>
              <p className="mt-5 text-base leading-relaxed text-v2-ink-700">
                The transaction is on a public chain, which means it is not our
                record and not ours to edit. You can read it on a block explorer,
                and you can download the same report from this site, compute its
                hash yourself and check that the two agree. The hash of every
                published report is published too, so you do not have to take
                our number for it.
              </p>
              <p className="mt-8 flex flex-wrap gap-4">
                <a data-journey="page" href="/attestation.html" className="v3-link text-sm font-semibold">
                  See the batch attestations <span aria-hidden>&rarr;</span>
                </a>
                <a href="/report-hashes.json" className="v3-link text-sm font-semibold">
                  The report hashes, as data <span aria-hidden>&rarr;</span>
                </a>
              </p>
            </div>
            <div className="border-l-2 border-v2-accent-600 pl-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                What an attestation proves
              </p>
              <p className="mt-3 text-sm leading-relaxed text-v2-ink-700">
                That the laboratory report for that batch existed at the recorded
                time and has not been changed since. The fingerprint in the
                transaction is of the exact file this site serves.
              </p>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                What it does not prove
              </p>
              <p className="mt-3 text-sm leading-relaxed text-v2-ink-700">
                It does not prove that the product is approved for any market, and
                it does not prove that the product is good. Approval is the market
                authority&rsquo;s decision and quality is the laboratory&rsquo;s. An
                attestation proves one thing only: that a file has not been
                swapped.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- what we do not claim ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="What this site does not claim"
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

      {/* ---------- the people ---------- */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <V3Head
                title="Who reads it before you do"
                sub="A guide is written by our R&D team and reviewed by our compliance team. Both are on the byline, with the date."
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  'The R&D team writes the formulation detail.',
                  'The compliance team reviews every guide before it is published.',
                  'A guide carries its publication date and its review.',
                  'The catalogue is the single record the figures come from.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-700">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                    {t}
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
                Established {siteConfig.brand.foundedYear} ·{' '}
                <a data-journey="contact" href="/contact.html" className="v3-link font-semibold">
                  Contact the factory
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

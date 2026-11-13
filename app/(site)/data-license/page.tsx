/**
 * THE DATA USE PAGE.
 *
 * WHY THIS PAGE EXISTS
 * The batch attestations and the laboratory reports are published so that
 * anyone can check them without taking our word for it. A search engine's
 * rich result test asks a Dataset for one more thing: a license — "a URL
 * to a page that describes the license governing the dataset's use". On
 * 2026-11-08 it named the field as missing on the attestation index.
 *
 * So the terms under which the published records may be used are written
 * down, on a page of their own, and every Dataset on the site points at
 * it. One path, one place: a second copy of this would be a second
 * answer, and two answers is how this project keeps getting things wrong.
 *
 * WHAT IT SAYS, AND WHAT IT DOES NOT
 * It says what a buyer may do with the records — read, quote, verify — and
 * what stays with the issuing laboratory, because the reports are theirs.
 * It does not grant anything we do not hold: the trademarks are ours, but
 * a licence to reuse a third party's document is not ours to give.
 *
 * The point of writing it down is the same as the point of publishing the
 * attestations: a buyer who has to write to ask whether they may quote a
 * number has already lost an afternoon, and a file that says what is
 * allowed costs nothing to publish.
 */

import type { Metadata } from 'next';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import { siteConfig } from '@/lib/shenhe.config';
import { webPageSchema } from '@/lib/seo/schema';
import { V3Head } from '@/components/v2/V3';
import { Icon } from '@/components/v2/Icon';

const TITLE = 'Data Use: Batch Attestations and Laboratory Reports';

const DESCRIPTION =
  'What you may do with the batch attestations and the laboratory reports published here: read, quote and verify them freely, and with the laboratory named.';

/** The sections, in the order a reader needs them. */
const SECTIONS = [
  {
    id: 'attestations',
    title: 'The batch attestation records — ours, and yours to use',
    body: [
      'Every batch attestation on this site is ours: the SHA-256 of the report file, the time it was recorded, and the transaction on the public chain it was written to. You may read it, copy it, quote it, check it against the report in your hand and put it in your own records. No permission, no fee, no asking us first.',
      'What an attestation proves is narrow and exact: that the report file existed at the recorded time and has not changed since. It does not prove that a product is approved in any market, and it is not a judgement on whether the product is good.',
    ],
  },
  {
    id: 'reports',
    title: 'The laboratory reports — theirs, and published as issued',
    body: [
      'The reports themselves are the issuing laboratory’s documents. We publish them unaltered, with the laboratory named on each one, and you may read them, download them, print them and quote from them for your own verification and due diligence. Please name the laboratory and the report number when you do.',
      'What we do not grant is what is not ours to grant: you may not re-issue a report as your own document, sell one, or change one. The copyright and the issuing laboratory’s own terms remain theirs, and where they and this page differ, theirs are the ones that bind.',
    ],
  },
  {
    id: 'not-granted',
    title: 'What this page does not grant',
    body: [
      'No trademark rights: SHENHE ZHONGKE, DEKOBIO and the factory’s name are ours, and nothing here lets you use them as your own brand or imply that a laboratory endorses you.',
      'No warranty beyond what each document says for itself. We do not warrant fitness for a purpose, and we do not warrant that any market authority will accept a product on the strength of a report published here.',
    ],
  },
  {
    id: 'machine-readable',
    title: 'Where the machine-readable form is',
    body: [
      'The structured data on the attestation index, on each batch page and on each report page carries this page’s address in its “license” field, so a machine that reads the records finds the same terms without having to guess them.',
      'The fingerprints of every published report are in report-hashes.json, and the attestations themselves are on the attestation page, with the transaction and the block for each one.',
    ],
  },
];

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const url = `${siteConfig.brand.siteUrl}/data-license.html`;
  return {
    title: TITLE,
    description: fitDescription(DESCRIPTION),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
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

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function DataLicensePage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      {/*
        THE MARKUP.
        One WebPage. The page is a statement about data, and the statement
        is on the page itself — a Dataset node here would need a license of
        its own, and the only honest one would be this page.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Data use: batch attestations and laboratory reports',
              path: '/data-license.html',
              description: fitDescription(DESCRIPTION),
              type: 'WebPage',
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

      {/* ---------------- header ---------------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="v2-container py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Data use</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            What you may do with the records we publish.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-2xl">
            The batch attestations and the laboratory reports are published so that a buyer can
            check them without trusting us. Here is what may be done with them, and what stays
            with the laboratory that issued them.
          </p>
        </div>
      </section>

      {/* ---------------- the terms ---------------- */}
      <section className="v2-section bg-v2-ink-050">
        <div className="v2-container">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="v2-eyebrow">The terms</p>
              <h2 className="v2-display mt-4 text-3xl md:text-4xl">
                Published so that nobody has to write to ask.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-v2-ink-500">
                A file that says what is allowed costs nothing to publish. A buyer who has to
                write to ask whether they may quote a number has already lost an afternoon.
              </p>
            </div>

            <div>
              {SECTIONS.map((s) => (
                <div key={s.id} id={s.id} className="mb-12 last:mb-0">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
                    {s.title}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {s.body.map((p, i) => (
                      <p key={i} className="text-[0.9375rem] leading-relaxed text-v2-ink-600">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- the short form ---------------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="The short form"
            sub="If you need something this page does not cover, write and we will tell you plainly."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Attestations',
                body: 'Read, copy, quote and check them. No permission needed.',
                href: '/attestation.html',
                cta: 'Open the attestations',
              },
              {
                title: 'The reports',
                body: 'The documents themselves, each with the laboratory named on it.',
                href: '/certifications.html',
                cta: 'See the reports',
              },
              {
                title: 'The fingerprints',
                body: 'The SHA-256 of every published report, in one machine-readable file.',
                href: '/report-hashes.json',
                cta: 'Open the hash list',
              },
              {
                title: 'Ask us',
                body: 'A use that is not covered here is a question, not a refusal.',
                href: '/contact.html',
                cta: 'Write to us',
              },
            ].map((x) => (
              <a
                key={x.href}
                href={x.href}
                className="v3-card v3-card--interactive v3-rise flex flex-col p-6"
              >
                <span className="text-base font-semibold text-v2-ink-900">{x.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-v2-ink-600">{x.body}</span>
                <span className="v3-link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  {x.cta} <span aria-hidden>&rarr;</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-12 rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-v2-ink-900">
                  One thing this page does not do
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">
                  It does not make the records more trustworthy than they are. An attestation is
                  a fingerprint written to a public chain: it says a file existed at a time and
                  has not changed since. The judgement on the product is the laboratory’s, and the
                  acceptance in your market is the authority’s.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  'The reports are published as issued, with the laboratory named',
                  'Every published file has its SHA-256 on the site',
                  'A question about your own use gets a plain answer',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-700">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

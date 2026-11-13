/**
 * THE BUYER FAQ — the page that answers the questions before the enquiry.
 *
 * WHY THIS PAGE EXISTS
 * The homepage carries eight answers, chosen to be the ones an answer engine
 * lifts and the objections that stop a buyer writing. The other questions —
 * the ones about the document set, about how a test report is checked, about
 * the difference between a factory and a trading company — had no address.
 * A buyer who wanted them had to write to ask, which is exactly the cost the
 * site exists to remove.
 *
 * WHY SIXTEEN, AND WHY GROUPED
 * Sixteen is not a target; it is what the honest questions add up to. Each
 * one carries a number, a document, a named standard or a limit, and the
 * limits are the useful half: "we do not hold a licence in your market" saves
 * a buyer a month of work.
 *
 * The groups are the buyer's own questions, in the order a buyer asks them:
 * what can I order, how do I get a sample, does the paperwork hold, how long
 * does it take, how does it arrive, and who are you.
 *
 * THE SCHEMA IS BUILT FROM THE SAME ARRAY
 * The visible questions and the FAQPage markup come from one array, so the
 * markup cannot describe a question the page does not show. That is not a
 * style preference: a FAQPage that names a question the reader cannot find is
 * a false claim, and the health check fails the build for exactly that.
 */

import type { Metadata } from 'next';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import { siteConfig } from '@/lib/shenhe.config';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { faqGroups, faqPage } from '@/content/v2/faq-page';
import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { Btn } from '@/components/v2/blocks';
import DataBar, { standardDataBar } from '@/components/v2/DataBar';
const TITLE = 'Pet Care Manufacturers FAQ: MOQ, Samples, Lead Time, Shipping';

const DESCRIPTION =
  'The sixteen questions a pet care buyer asks before writing: minimum order, changeover, samples, packaging, documents, payment, shipping. Sixteen of them.';

/** The pages a buyer is sent to when the answer is not here. */
const ELSEWHERE = [
  {
    title: 'The catalogue',
    body: 'Every SKU with its minimum order, lead time and packaging.',
    href: '/products.html',
    cta: 'Open the catalogue',
  },
  {
    title: 'Certifications & lab reports',
    body: 'The reports themselves, with the laboratory named on each.',
    href: '/certifications.html',
    cta: 'See the certificates',
  },
  {
    title: 'Trade terms',
    body: 'Payment, Incoterms, the document set and how disputes are handled.',
    href: '/trade-compliance.html',
    cta: 'Read the trade terms',
  },
  {
    title: 'Batch attestations',
    body: 'Every batch attested on a public chain, with its transaction.',
    href: '/attestation.html',
    cta: 'Read the attestations',
  },
];

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const base: Metadata = {
    title: TITLE,
    description: fitDescription(DESCRIPTION),
    alternates: { canonical: `${siteConfig.brand.siteUrl}/faq.html` },
    openGraph: {
      type: 'website',
      url: `${siteConfig.brand.siteUrl}/faq.html`,
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
  return base;
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function FaqPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      {/*
        THE MARKUP.
        Two blocks, and both are claims: this page is a FAQ page, and it is a
        page of this site. The FAQ block is built from the same array the
        questions are rendered from, so it cannot name a question the reader
        cannot find.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(faqPage.items, {
              name: 'Pet care OEM/ODM — the buyer questions',
              url: `${siteConfig.brand.siteUrl}/faq.html`,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Pet care OEM buyer FAQ',
              path: '/faq.html',
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
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">{faqPage.eyebrow}</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            The questions that decide whether an order is possible.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-2xl">{faqPage.lead}</p>
          <DataBar items={standardDataBar(['park', 'capacity', 'skus', 'labs'])}  tone="dark" />
        </div>
      </section>

      {/*
        THE QUESTIONS.

        The section carries the id "faq" because that is the anchor the
        homepage's own FAQ section uses and the one a buyer follows from a
        search result. Every pair is rendered as a heading and a paragraph,
        not behind a click: the answers have to be in the served HTML for a
        crawler and an answer engine to be able to lift them.
      */}
      <section className="v2-section bg-v2-ink-050" id="faq">
        <div className="v2-container">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="v2-eyebrow">Straight answers</p>
              <h2 className="v2-display mt-4 text-3xl md:text-4xl">{faqPage.title}</h2>
              <p className="mt-5 text-sm leading-relaxed text-v2-ink-500">
                Where the honest answer is a limit, we state the limit. A buyer who
                finds out in a qualification meeting has already spent a month.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Btn cta={{ label: 'Request a quotation', href: '/contact.html' }} />
                <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} />
              </div>
            </div>

            <div>
              {faqGroups.map((group) => (
                <div key={group.topic} className="mb-12 last:mb-0">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
                    {group.topic}
                  </h3>
                  <dl className="mt-4 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
                    {group.items.map((f, i) => (
                      <div key={i} className="grid gap-2 py-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
                        <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                          {f.q}
                        </dt>
                        <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- what this page does not answer ---------------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Where the rest of the answer is"
            sub="Some questions are answered by a document rather than by a sentence, and those live on their own pages."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ELSEWHERE.map((x) => (
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
                  The question this page cannot answer for you
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">
                  Whether your order is possible depends on three things we cannot read from a
                  website: your formula or product, your target market and your volume. Send
                  those three and the quotation comes back with the minimum order, the lead time,
                  the packaging options and the documents your market needs.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  'The reply is from a named sales manager, not a form',
                  'The sample fee and the freight are quoted, not assumed',
                  'If we cannot make it, we say so on the first answer',
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

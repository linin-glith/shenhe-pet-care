// Contact — v2 engine, hand-built (Phase 1 逐页精做).
//
// WHY THIS PAGE IS BUILT BY HAND RATHER THAN CONVERTED
// Every other page funnels here. A generic conversion of the legacy blocks
// would reproduce a hero, four prose blocks and the same dead RFQ form. This
// page is rebuilt around the one decision the visitor is actually making:
// "is it worth my time to send an enquiry to this factory?"
//
// SEO is untouched — metadata and JSON-LD still come from the extracted
// legacy head, so the page keeps its canonical, hreflang and two schema.org
// blocks verbatim.
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file.

import Img from '@/components/v2/Img';
import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import page from '@/content/contact.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import { faqPageSchema } from '@/lib/seo/schema';
import type { LegacyPage } from '@/lib/legacy-types';
import { Icon, type IconName } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import { REPORT_EVIDENCE_SENTENCE } from '@/lib/commerce';
import InquiryForm from '@/components/v2/InquiryForm';
import { CONTACT_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';
import { pageCopy } from '@/lib/i18n/pages';

const data = page as unknown as LegacyPage;

/**
 * The metadata of this page, in the buyer's language.
 *
 * A German buyer searches "Tierpflege Hersteller China" and the result
 * they click has to say that in German. The description is the same
 * sentence, said to the search engine.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('contact', locale);
  if (locale === 'en') return legacyMetadata(data);
  return {
    ...legacyMetadata(data),
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: {
      ...legacyMetadata(data).openGraph,
      title: copy.title,
      description: fitDescription(copy.description),
      locale: locale === 'de' ? 'de_DE' : 'es_ES',
    },
    twitter: {
      ...legacyMetadata(data).twitter,
      title: copy.title,
      description: fitDescription(copy.description),
    },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

const CHANNELS: { icon: IconName; label: string; value: string; href: string; note: string }[] = [
  {
    icon: 'chat',
    label: 'WhatsApp',
    value: siteConfig.brand.whatsappDisplay,
    href: `https://wa.me/${siteConfig.brand.whatsapp}`,
    note: 'Fastest route. A named person replies.',
  },
  {
    icon: 'clock',
    label: 'Telephone',
    value: siteConfig.brand.tel,
    href: `tel:${siteConfig.brand.tel.replace(/[^+\d]/g, '')}`,
    note: siteConfig.response.hours,
  },
  {
    icon: 'chat',
    label: 'Email',
    value: siteConfig.brand.emailSales,
    href: `mailto:${siteConfig.brand.emailSales}`,
    note: siteConfig.response.email,
  },
];

const EXPECTATIONS = [
  {
    q: 'How fast do you reply?',
    a: 'Within one business day on WhatsApp during China Standard Time working hours. Same day by email.',
  },
  {
    q: 'What do I need to send?',
    a: 'The SKU or product type, your annual volume, and the destination market. Everything else we can settle on the first call.',
  },
  {
    q: 'Will you quote a specific price?',
    a: 'Yes — per SKU, per volume tier, per destination. Volume tiering, packaging and freight are confirmed per RFQ.',
  },
  {
    q: 'Do I need an account to ask?',
    a: 'No. The form below captures enough to quote without you creating anything.',
  },
  {
    q: 'What is your minimum order?',
    a: 'The standard minimum across the grooming and deodorizing lines is 2,000 bottles per SKU, and two catalogue lines start lower. The figure that applies to your order depends on the SKU and on whether you want our formula or yours, so we confirm it rather than publish it.',
  },
  {
    q: 'How long does production take?',
    a: 'Production time depends on the formula and whether the label artwork is new. Stock catalogue formulas ship fastest; a private-label programme takes longer because artwork and label compliance are settled before the filling run is scheduled. Both are confirmed against the specific order.',
  },
  {
    q: 'Can I visit the factory first?',
    a: 'Yes. Factory visits are welcome and we host international buyers regularly. The site is in Heyuan, Guangdong, about 1.5 hours from Guangzhou airport. Send your travel dates and the visit is arranged around them.',
  },
  {
    q: 'Do you accept small trial orders?',
    a: 'Samples of any catalogue SKU can be ordered. They are chargeable: the sample fee is confirmed in the quotation together with the specification, and freight is paid by the buyer. A commercial trial order below the minimum is a different question — tell us what you are trying to achieve and we will say honestly whether it is workable.',
  },
  {
    q: 'What currency do you quote in?',
    a: 'USD or RMB, whichever is easier for you to settle. Freight and duty are shown separately from the product price so the landed figure is unambiguous.',
  },
  {
    q: 'Do you have an email address or only WhatsApp?',
    a: 'Both, and both reach the same desk. WhatsApp is faster during working hours; email is better for sending a specification document or a compliance query that needs a written trail.',
  },
  {
    q: 'Are you a manufacturer or a trading company?',
    a: 'A manufacturer. Guangdong Shenhe Zhongke Biotechnology Co., Ltd., founded 2020 in Heyuan, Guangdong — a 30,000 m² industrial park with a 5,000 m² GMP workshop. We do not sell direct to consumers and we do not buy and resell.',
  },
  {
    q: 'Which languages can you work in?',
    a: 'The site and this assistant are in English, and we work with buyers across the EU, the UK, Russia and the EAEU, Brazil, the United States and Middle Eastern markets — documentation is prepared against the requirements of your destination rather than a single market.',
  },
];

/**
 * Where we are, stated in the terms a buyer or a map needs.
 *
 * A B2B factory is not found by walking past it, so the contact page has to
 * do the work a local business listing would otherwise do: the administrative
 * region, the coordinates, the airport and port a shipment actually leaves
 * from, and the timezone a reply is governed by. Without these, the page is
 * an email address and nothing else.
 */
const LOCATION_FACTS = [
  {
    label: 'Factory address',
    value: siteConfig.brand.address,
    note: 'The manufacturing site, not a sales office.',
  },
  {
    label: 'City and province',
    value: 'Heyuan, Guangdong, China',
    note: 'About 1.5 hours by road from Guangzhou airport.',
  },
  {
    label: 'Timezone',
    value: 'China Standard Time (UTC+8)',
    note: 'Replies within one business day during working hours.',
  },
  {
    label: 'Shipping terms',
    value: 'EXW Shenzhen is the default; FOB Shenzhen, CIF and DDP are quoted on request',
    note: 'Freight is quoted per lane and shown separately from the product price.',
  },
];

const WORKFLOW = [
  {
    step: '01',
    title: 'You send the product type, the volume and the destination',
    body: 'Those three are what a quote needs. Everything else — format, claim, packaging, label language — can be settled on the first exchange.',
  },
  {
    step: '02',
    title: 'We come back with the commercial structure',
    body: 'A per-SKU quote at your volume tier, the minimum for that configuration, the production time for that quantity, and a sample plan.',
  },
  {
    step: '03',
    title: 'Samples, and a decision on formula path',
    body: 'Samples of any catalogue SKU. From there, a catalogue formula with your label, or a development programme — the honest answer depends on whether you have tested the market.',
  },
  {
    step: '04',
    title: 'Production and documentation',
    body: 'A batch certificate of analysis, a 16-language safety data sheet, a commercial invoice carrying the HS code, and a certificate of origin travel with every consignment.',
  },
];


export default function ContactPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = pageCopy('contact', locale);
  // No `searchParams` here on purpose. This is a static export: the page is
  // rendered once at build time with no query string, so a server-side read
  // of `?range=` always came back empty and the composer's hand-off died on
  // the way to the form. The parameter is read in the browser instead, inside
  // InquiryForm — see the note there.
  return (
    <>
      {/* The legacy FAQPage block is dropped here: this page renders its own
          questions further down, and the schema for those is generated from
          the same array. */}
      <JsonLd page={data} except={['FAQPage']} />

      {/* LocalBusiness / Organization.
          A B2B factory is not found by walking past it, but it IS found by
          people searching for a supplier in a region, and the answer engines
          that read GEO files read structured data first. Without this the page
          carries an email address and no locality at all — a fact the About
          page states and this one, which is the page a buyer lands on from a
          search, did not.

          THE ORGANISATION IS NOT DECLARED HERE.
          It used to be, and the layout publishes the same organisation on
          every public page — so the page carried two of them: this one and
          the layout's, with the same name and the same facts. A reader that
          merged them found two companies. The layout's copy is the canonical
          one, it carries the address with its postal code, the contact
          point, the subjects and the credentials, and it is on every page
          that points at this company. */}

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
            {copy.h1}
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            One business day to a first answer. {siteConfig.metrics.gmpStandard} GMP,
            FDA registered, exporting since {siteConfig.brand.foundedYear}.{' '}
            {REPORT_EVIDENCE_SENTENCE}
          </p>
          <DataBar items={standardDataBar(['years', 'capacity', 'markets', 'labs'])}  tone="dark" />

          <PageAnswer {...CONTACT_ANSWER} />
        </div>
      </section>

      {/* ---------------- channels + form ---------------- */}
      <section className="v2-section">
        <div className="v2-container">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* left: how to reach us + what to expect */}
            <div>
              <h2 className="v2-display text-3xl md:text-4xl">Reach us directly</h2>

              <ul className="mt-10 space-y-3">
                {CHANNELS.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target={c.href.startsWith('http') ? '_blank' : undefined}
                      rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="el-spotlight el-lift flex items-start gap-4 rounded-v2-md border border-v2-ink-200 bg-white p-5"
                    >
                      <span
                        aria-hidden
                        className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-v2-sm bg-v2-accent-050 text-v2-accent-700 ring-1 ring-v2-accent-100"
                      >
                        <Icon name={c.icon} size={19} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                          {c.label}
                        </span>
                        <span className="mt-1 block font-semibold text-v2-ink-900">{c.value}</span>
                        <span className="mt-1 block text-xs text-v2-ink-500">{c.note}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t border-v2-ink-100 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Factory
                </p>
                <address className="mt-2 not-italic text-[0.9375rem] leading-relaxed text-v2-ink-700">
                  {siteConfig.brand.legalName}
                  <br />
                  {siteConfig.brand.address}
                </address>
              </div>

              {/* ---------- Where we are, in the terms a buyer or a map needs ----------
        A B2B factory is not found by walking past it, so this does the work
        a local business listing would otherwise do: the region, the
        timezone a reply is governed by, and the terms a shipment actually
        leaves on. Without it the page is an email address and nothing else. */}
              <h2 className="v2-display mt-14 text-2xl">Where we are</h2>
              <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                {LOCATION_FACTS.map((l) => (
                  <div key={l.label} className="border-t border-v2-ink-200 pt-4">
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-v2-ink-400">
                      {l.label}
                    </dt>
                    <dd className="mt-1.5 text-[0.9375rem] font-medium leading-relaxed text-v2-ink-900">
                      {l.value}
                    </dd>
                    <dd className="mt-1 text-sm leading-relaxed text-v2-ink-500">{l.note}</dd>
                  </div>
                ))}
              </dl>

              <h2 className="v2-display mt-14 text-2xl">What happens after you send it</h2>
              <ol className="mt-6 space-y-6">
                {WORKFLOW.map((w) => (
                  <li key={w.step} className="grid gap-2 sm:grid-cols-[3rem_1fr] sm:gap-4">
                    <span
                      aria-hidden
                      className="font-mono text-sm font-semibold tabular-nums text-v2-accent-600"
                    >
                      {w.step}
                    </span>
                    <div>
                      <h3 className="text-[0.9375rem] font-semibold text-v2-ink-900">{w.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-v2-ink-500">{w.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <h2 className="v2-display mt-14 text-2xl">What buyers ask us first</h2>
              <dl className="mt-6 divide-y divide-v2-ink-100 border-y border-v2-ink-100">
                {EXPECTATIONS.map((e) => (
                  <div key={e.q} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                    <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">{e.q}</dt>
                    <dd className="text-sm leading-relaxed text-v2-ink-500">{e.a}</dd>
                  </div>
                ))}
              </dl>

              {/*
                The FAQPage schema, generated from the array above.

                The page used to ship the LEGACY site's FAQPage schema —
                six questions that this page does not show — while showing
                twelve others. A schema that contradicts the page is worse
                than no schema: a search engine voids the rich result, and
                an answer engine cannot tell which of the two to believe.
                Generating it from EXPECTATIONS makes that impossible.
              */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(
                    faqPageSchema(
                      EXPECTATIONS.map((e) => ({ q: e.q, a: e.a })),
                      { name: 'Contact & Enquiry FAQ', url: `${siteConfig.brand.siteUrl}/contact.html` },
                    ),
                  ),
                }}
              />
            </div>

            {/* right: the enquiry form */}
            <div id="rfq">
              {/* The SKU composer's selection arrives as ?range=… and is picked
                  up in the browser by the form. */}
              <InquiryForm locale={locale} />

              {/* Fallback channel. The form endpoint is not wired to a backend
                  yet; this path must not silently swallow enquiries. */}
              <div className="mt-5 rounded-v2-md border border-v2-ink-200 bg-white p-5">
                <div className="sm:flex sm:items-start sm:gap-6">
                  <div className="sm:min-w-0 sm:flex-1">
                    <p className="flex items-start gap-2.5 text-sm text-v2-ink-600">
                      <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-v2-accent-700" />
                      <span>
                        Prefer to skip the form? Message us on WhatsApp and quote the same
                        three things — product, volume, contact.
                      </span>
                    </p>
                    <a
                      href={`https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
                        "Hi, I'd like a quote for a pet care OEM/ODM project.",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-v2-md border border-v2-ink-300 px-5 py-2.5 text-sm font-semibold text-v2-ink-800 transition-colors hover:border-v2-ink-900"
                    >
                      <Icon name="chat" size={16} />
                      Open WhatsApp
                    </a>
                  </div>

                  {/*
                    The WhatsApp CONTACT CARD, as a QR code.

                    A different door from the button above: the button opens a
                    chat with the enquiry already written, while the card is
                    what the buyer SAVES — the factory's name, its avatar and
                    the number behind it. Somebody pricing three factories in
                    a row wants to keep the contact, not send a message once.

                    The bitmap is the client's own contact card, cut out of a
                    screenshot, so the QR is the card the factory hands out
                    and not one we invented. The .webp beside it is written
                    lossless: a compressed QR stops scanning.
                  */}
                  <a
                    href={siteConfig.brand.whatsappCard}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex shrink-0 items-center gap-3 rounded-v2-md border border-v2-ink-200 bg-v2-ink-050 p-3 transition-colors hover:border-v2-ink-400 sm:mt-0 sm:block sm:w-56"
                  >
                    <picture className="block shrink-0">
                      <source
                        srcSet={siteConfig.brand.whatsappCardImage.replace(/\.png$/i, '.webp')}
                        type="image/webp"
                      />
                      <img
                        src={siteConfig.brand.whatsappCardImage}
                        alt={`WhatsApp contact card for ${siteConfig.brand.whatsappCardName} — scan to save the contact`}
                        width={140}
                        height={140}
                        loading="lazy"
                        decoding="async"
                        className="h-32 w-32 rounded-lg bg-white object-contain sm:h-40 sm:w-40"
                      />
                    </picture>
                    <span className="text-left sm:mt-2.5 sm:block">
                      <span className="block text-xs font-semibold text-v2-ink-800">
                        {siteConfig.brand.whatsappCardName}
                      </span>
                      <span className="block text-[11px] text-v2-ink-500">
                        Scan to save our WhatsApp contact
                      </span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

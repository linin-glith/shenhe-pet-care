/**
 * TRADE PROGRAMME — the page the trust strip's reseller link lands on.
 *
 * WHY THIS PAGE EXISTS
 *
 * The header's only entry for a buyer is "Get a Quote", which is written for
 * a brand owner describing a project. A distributor does not have a project;
 * they have a territory, a shelf and a reorder cycle, and the questions they
 * ask on arrival are different: carton and pallet maths, documents on
 * arrival, lead time, whether a territory can be discussed. Until now the
 * site answered none of them on a page of their own — the word "reseller"
 * appeared only inside articles.
 *
 * WHAT IT DOES NOT DO
 *
 * It states no price and no MOQ figure. `siteConfig.pricing` is a hard
 * constraint: this is a wholesale enquiry site, and a unit price or a
 * minimum written on a page reads as a price list to everyone who is not
 * the buyer it was computed for. Both are stated in the quote, together
 * with the carton maths they depend on.
 *
 * The form is the standard enquiry form, so a distributor's submission lands
 * in the same inbox as every other lead and carries its page in
 * `source_detail.page` — that is what lets the desk separate a reseller lead
 * from a brand lead without asking the buyer to label themselves.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { fitDescription } from '@/lib/seo/meta';
import { V2Page } from '@/components/v2/blocks';
import { Icon } from '@/components/v2/Icon';
import InquiryForm from '@/components/v2/InquiryForm';
import PageFaq from '@/components/v2/PageFaq';
import type { V2Block } from '@/lib/v2/block-types';
import { webPageSchema } from '@/lib/seo/schema';

const TITLE = 'Wholesale Pet Products | Trade Programme for Distributors';

const DESCRIPTION =
  'Wholesale pet products for importers, distributors and resellers: carton and pallet maths per SKU, 25–40 day private label, quote in one business day.';

const FAQ = [
  {
    q: 'What is the minimum order for a trade account?',
    a: 'The minimum is set per SKU and stated in the quote, because it follows the format you order rather than a number we can put on a page. What is fixed and published is the carton: bottles per carton, cartons per layer, layers per pallet, and a mixed-carton option that lets a distributor carry several SKUs without a full carton run of each.',
  },
  {
    q: 'Which documents arrive with the first shipment?',
    a: 'A certificate of analysis for the batch, the safety data sheet for each SKU, copies of the two production licences (粤卫消证字[2023]-07-第0002号 and 粤饲添(2023)H07002), the HS code for each SKU, and the packing list and invoice. Every report on this site is a third-party laboratory report with a number a buyer can quote back to the laboratory that issued it.',
  },
  {
    q: 'How long from order to dispatch?',
    a: '25–40 days for private label, counted from artwork approval and the deposit, across six production lines and four product lines. Samples are quoted per SKU and confirmed before dispatch, so a sample is never a surprise line on an invoice.',
  },
  {
    q: 'Can a territory be discussed?',
    a: 'Yes, after a first order and with a volume we can plan production around. Territory, term and reorder cadence are commercial arrangements, so they are discussed on the first call rather than written into a web page — the answer depends on the market and the quantity.',
  },
  {
    q: 'Do you sell wholesale pet products to a distributor?',
    a: 'Yes — the trade account is the wholesale route, across four product lines on one set of documents. A first order can be a single SKU; the programme (territory, reorder cadence, mixed cartons) is discussed once there is a cycle to plan around rather than published as a promise.',
  },
  {
    q: 'Do you ship to my country?',
    a: 'We export to more than 12 countries, mainly Russia, Brazil, the EAEU and the EU. The destination decides the documents and the trade term, so the quote states both rather than assuming an incoterm.',
  },
];

function buildMeta(): Metadata {
  const canonical = `${siteConfig.brand.siteUrl}/trade-programme.html`;
  return {
    title: TITLE,
    description: fitDescription(DESCRIPTION),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.brand.name,
      title: TITLE,
      description: fitDescription(DESCRIPTION),
      images: [
        {
          url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`,
          width: 1200,
          height: 630,
        },
      ],
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

export const metadata: Metadata = buildMeta();

export const dynamic = 'force-static';

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Trade programme',
    title: 'Wholesale pet products, on a reorder cycle',
    lead: 'For importers, regional distributors and marketplace sellers: pick one SKU, sample it, then run a programme with carton maths, documents and a lead time you can plan a shelf around.',
    primaryCta: { label: 'Apply for a trade account', href: '#apply', variant: 'primary' },
    secondaryCta: { label: 'See the catalogue', href: '/products.html', variant: 'ghost' },
    metrics: [
      { value: '4 lines', label: 'to range with', note: '20 SKUs, one supplier' },
      { value: '25–40 days', label: 'private label', note: 'from artwork and deposit' },
      { value: '1 business day', label: 'to a quote', note: 'destination and volume stated' },
      { value: '12+', label: 'countries', note: 'Russia · Brazil · EAEU · EU' },
    ],
    answer:
      'A distributor buying from us gets the same plant a brand owner does: the lines, the laboratory and the documents are the same, and what changes is how the order is packed for resale.',
    boundary:
      'Prices and minimums are quoted per order, not published: both depend on destination, volume and trade term, and a number on this page would be wrong for most of the people reading it.',
  },
  {
    kind: 'featureGrid',
    eyebrow: 'Who it suits',
    title: 'Four kinds of buyer, one route in',
    cols: 4,
    items: [
      {
        pill: 'Importer',
        title: 'Importers and regional distributors',
        body: 'A range rather than a project: several SKUs, consistent cartons, documents that clear customs without a second email.',
      },
      {
        pill: 'Marketplace',
        title: 'Amazon, eBay and Ozon sellers',
        body: 'Private label on a reorder cycle, with artwork, barcode and carton marks handled in the same run as the formula.',
      },
      {
        pill: 'Brand',
        title: 'Brand owners with their own formula',
        body: 'OEM or ODM with a formula you own or one we develop with you, plus the lab reports a marketplace listing asks for.',
      },
      {
        pill: 'Institutional',
        title: 'Shelters, rescues and NGO buyers',
        body: 'Consolidated orders through a distributor or a framework buyer, in the format mix that fills a pallet rather than half of one.',
      },
    ],
    note: 'Not sure which one you are? The form asks what you sell and where it ships; the answer decides the rest.',
  },
  {
    kind: 'process',
    eyebrow: 'How it starts',
    title: 'Four steps from an enquiry to a container',
    lead: 'No account, no credit file and no commitment to get a first quote — a product, a quantity and a destination is enough.',
    steps: [
      {
        no: '01',
        title: 'Tell us what you sell and where',
        desc: 'Category, target market and the volume you would reorder at. That is what a quote is computed from.',
      },
      {
        no: '02',
        title: 'A quote with the cost structure',
        desc: 'Within one business day: price for the quantity and term, minimum per SKU, lead time, carton and pallet maths, and the documents the destination needs.',
      },
      {
        no: '03',
        title: 'Sample, then artwork',
        desc: 'A paid sample of the SKUs you shortlisted, then artwork and barcode on the format you actually order.',
      },
      {
        no: '04',
        title: 'First order, then a programme',
        desc: 'Production, a certificate of analysis per batch, documents with the shipment. Territory and reorder cadence are discussed once there is a first order to plan around.',
      },
    ],
  },
  {
    kind: 'featureGrid',
    eyebrow: 'What a trade account includes',
    title: 'The parts a distributor has to plan around',
    cols: 3,
    items: [
      {
        pill: 'Cartons',
        title: 'Carton and pallet maths',
        body: 'Bottles per carton, cartons per layer, layers per pallet and the mixed-carton option — published per SKU, so a landed cost can be built before an order exists.',
      },
      {
        pill: 'Documents',
        title: 'The document pack',
        body: 'Certificate of analysis per batch, safety data sheet per SKU, both production licences, HS code per SKU, packing list and invoice.',
      },
      {
        pill: 'Private label',
        title: 'Artwork and barcode in the same run',
        body: 'Label, barcode and carton marks are set up alongside the formula rather than bolted on after production — which is why the lead time is 25–40 days and not a season.',
      },
      {
        pill: 'Range',
        title: 'One supplier across four lines',
        body: 'Odor control and disinfection, grooming and care, outdoor protection, and pet nutrition: 20 SKUs on one set of documents and one reorder cycle.',
      },
      {
        pill: 'Territory',
        title: 'A territory conversation, not a promise',
        body: 'Exclusivity depends on market and volume, so it is discussed after a first order rather than advertised on a page.',
      },
      {
        pill: 'After-sales',
        title: 'The same desk after the sale',
        body: 'A batch that fails a check is reworked or replaced, and the certificate of analysis for the replacement travels with it.',
      },
    ],
  },
];

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
              path: '/trade-programme.html',
              description: fitDescription(DESCRIPTION),
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

            <V2Page blocks={blocks} />

      {/* The application sits on the page rather than behind a link: a
          distributor who has read this far has already decided, and the
          fewest steps between that decision and an enquiry is zero. */}
      <section id="apply" className="border-y border-v2-ink-200 bg-[#F7FAFA] py-14">
        <div className="v2-container">
          <div className="mx-auto max-w-[760px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-v2-ink-500">
              Apply
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-v2-ink-900 sm:text-3xl">
              Open a trade account
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-v2-ink-700">
              Three things are enough to start: what you sell, where it ships, and roughly how much
              you would reorder. Everything else — price for that quantity, minimum per SKU, carton
              maths, lead time — comes back in one reply.
            </p>
            <div className="mt-8 rounded-2xl border border-v2-ink-200 bg-white p-5 sm:p-7">
              <InquiryForm />
            </div>
            <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-v2-ink-500">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                Prefer to talk? The same desk answers on WhatsApp, and a quotation sent from there
                carries the same reference as one sent from this form.
              </span>
            </p>
          </div>
        </div>
      </section>

      <PageFaq
        items={FAQ}
        title="Trade programme questions"
        lead="The five questions that decide whether a trade account is worth opening."
        url={`${siteConfig.brand.siteUrl}/trade-programme.html`}
        name="Trade programme FAQ"
      />
    </>
  );
}

/**
 * QUOTATION AND TERMS — the first stage of an order.
 *
 * WHY THIS PAGE EXISTS
 *
 * Everything a buyer needs to price an order was on the site, and none of it
 * was on one page. The payment terms were in the trade compliance policies.
 * The Incoterms were in a table on the same page. The volume tiering was
 * named in the pricing policy. The lead times were on every product card.
 * The quote turnaround was in the header.
 *
 * A buyer does not read a site by topic. They arrive from a search with one
 * question — what will this cost me — and they want the answer on one page,
 * with the terms attached to it, because a number without its terms is not a
 * number they can act on.
 *
 * WHY THERE IS NO UNIT PRICE ON IT
 *
 * The site is quote-only, and that is a policy the owner set: unit prices
 * are confirmed per RFQ, because the price of a private-label run depends on
 * the volume, the label, the packaging and the destination, and a price
 * published for one of those is wrong for almost every reader of the page.
 *
 * So this page publishes the STRUCTURE of the price — what goes into it, what
 * moves it, which term carries the risk and when, and what the payment
 * conditions are — and the unit price itself stays in the quotation, where it
 * is correct for one buyer instead of wrong for all of them.
 *
 * Every number here is read out of the configuration, the catalogue or the
 * shipping record. None of it is typed here, so none of it can drift.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { standardMoq } from '@/lib/commerce';
import { products } from '@/lib/products';
import { incoterms } from '@/lib/shipping';

const PATH = '/quotation.html';

const TITLE = 'Pet Care Quotation & Trade Terms | MOQ, Lead Time, Incoterms';

const DESCRIPTION =
  'How a pet care factory quotation is calculated: volume tiering, label and packaging, Incoterms 2020, payment terms, lead times, and a quote in one day.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

/** The minimum every catalogue SKU carries — read out of the catalogue. */
const MOQ = standardMoq(products);

const FAQ = [
  {
    q: 'How long does a quotation take?',
    a: `One business day, from a named sales manager, during China Standard Time working hours. The quote carries the minimum order, the two lead times, the trade term, the payment conditions and the inputs the price is calculated from, so you can see what moved the number rather than being handed one.`,
  },
  {
    q: 'Why is there no price list on this site?',
    a: 'Because a published unit price is wrong for most buyers who read it: the same SKU is priced against your volume, your label, your packaging and your destination, and a price published for one of those combinations is wrong for the rest. The quotation is per RFQ, and the terms that make it comparable are published instead.',
  },
  {
    q: 'What is the minimum order?',
    a: `${MOQ.units.toLocaleString('en-US')} ${MOQ.unit} on the catalogue SKUs, and 1,000 sets on the two bundled sets. The minimum follows the format you order rather than the product, so the figure for the SKU you want is on that product's page and in the quotation.`,
  },
  {
    q: 'Which Incoterms do you quote against?',
    a: `${incoterms.default} by default, with ${incoterms.available.join(', ')} available on request. ${incoterms.note} The quote states which term applies, because the term decides what the price includes.`,
  },
  {
    q: 'What are the payment terms?',
    a: '35% by wire transfer (SWIFT T/T) as a deposit when the order is confirmed, and the balance before the goods leave. An L/C at sight from USD 30,000. Name the quotation number in the transfer reference so the payment can be matched to the order.',
  },
  {
    q: 'How long does production take once the order is confirmed?',
    a: 'Private label — our formula on your label — runs 25–40 days from artwork approval. A formula developed for you runs 30–45 days from formula approval. A catalogue formula held in stock ships 7–15 days after payment is confirmed. The window is named on the quote, and the quote says which window it is.',
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Quotation and terms',
    title: 'What will my order cost, and what am I agreeing to?',
    lead:
      'One business day, a named sales manager, and every input the price is calculated from — the volume, the label and packaging, the destination and term, the formula, and the payment. The unit price is in the quotation rather than on this page, because it is the one number that is wrong for almost every buyer who reads it.',
    primaryCta: { label: 'Ask for a quotation', href: '/contact.html' },
    secondaryCta: { label: 'See the samples first', href: '/samples.html' },
    metrics: [
      {
        value: '1 business day',
        label: 'to a quote',
        note: 'from a named sales manager',
      },
      {
        value: `${MOQ.units.toLocaleString('en-US')} ${MOQ.unit}`,
        label: 'minimum order',
        note: 'on catalogue SKUs',
      },
      { value: '25–40 days', label: 'private label', note: 'from artwork approval' },
      { value: 'USD 30,000', label: 'L/C at sight', note: 'wire transfer below that' },
    ],
    answer:
      'Five things decide what you pay: the volume you order, the label and packaging specification, the destination and the trade term, whether the formula is ours or was developed for you, and the payment terms. A quotation states all five, so the number can be checked instead of taken on trust.',
    boundary:
      'No unit price is published on this site, and none appears in the structured data either. That is deliberate, and it is the reason the quotation is per enquiry rather than a page you can read and leave.',
  },
  {
    kind: 'featureGrid',
    eyebrow: 'How the price is calculated',
    title: 'The five inputs, and which one moved your number',
    lead:
      'A quotation is not a discount off a list. It is a calculation from five inputs, and the only way to compare two factories fairly is to compare the same five inputs.',
    cols: 3,
    items: [
      {
        pill: 'Volume',
        title: 'The quantity, and the term',
        body:
          'Volume tiering is confirmed against the annual quantity you give us, and it is the input that moves the number most. A one-off order and a scheduled reorder programme are priced on different terms, and the quote says which one it is.',
      },
      {
        pill: 'Label and packaging',
        title: 'Bottle, carton and artwork',
        body:
          'Your label, your carton and your colour are part of the specification, and moulding or printing costs land here. Packaging changes the unit cost more often than buyers expect, and it is the input most often left out of a first enquiry.',
      },
      {
        pill: 'Destination and term',
        title: 'Where it goes, and who carries the risk',
        body:
          'The trade term decides what the price includes and when the risk passes. The default is FOB Guangzhou or Shenzhen; every other term is quoted per lane against your destination and your volume.',
      },
      {
        pill: 'The formula',
        title: 'Ours, or made for you',
        body:
          'A catalogue formula, a private-label version of one, or a formula developed for you. The third adds development time and a development cost, and it is the reason the two lead-time windows on this site are different lengths.',
      },
      {
        pill: 'Payment',
        title: 'How and when',
        body:
          'Wire transfer with a deposit at order confirmation and the balance before the goods leave, or a letter of credit at sight from USD 30,000. The deposit split is written into the quotation.',
      },
      {
        pill: 'What is not in it',
        title: 'Freight, duty and tax',
        body:
          'Freight is quoted per lane and shown separately from the goods, so two suppliers can be compared on the same basis. Duty and tax are the importer’s, unless the term is DDP, in which case they are inside the quote.',
      },
    ],
    note:
      'Two more figures belong in the quotation rather than on a page: the quote’s validity, and the tools or artwork charges that depend on your own files.',
    noteCta: { label: 'The full trade terms', href: '/trade-compliance.html' },
  },
  {
    kind: 'specTable',
    eyebrow: 'The terms',
    title: 'What we quote against',
    specs: [
      { key: 'Default term', val: incoterms.default },
      { key: 'Other terms', val: incoterms.available.join(', ') },
      { key: 'Risk transfers', val: incoterms.note },
      { key: 'Payment', val: '35% T/T deposit on confirmation, balance before shipment' },
      { key: 'Letter of credit', val: 'L/C at sight from USD 30,000' },
      { key: 'Private label', val: '25–40 days from artwork approval' },
      { key: 'Custom formula', val: '30–45 days from formula approval' },
      { key: 'Stock catalogue formula', val: '7–15 days after payment is confirmed' },
      { key: 'Minimum order', val: `${MOQ.units.toLocaleString('en-US')} ${MOQ.unit} on catalogue SKUs` },
      { key: 'Quotation', val: 'One business day, from a named sales manager' },
      { key: 'Reply', val: siteConfig.response.headline },
      { key: 'Governing law', val: 'The laws of the People’s Republic of China' },
    ],
  },
  {
    kind: 'callout',
    icon: 'check',
    title: 'A binding agreement is a signed quotation and an NDA',
    body:
      'The figures on this site are indicative — the minimum order, the lead times and the payment terms are the factory’s published ones, and the price is per enquiry. The agreement that binds is the signed quotation and the NDA, which carry the formula, the artwork and the payment terms for one order.',
  },
  {
    kind: 'faq',
    eyebrow: 'Before you ask',
    title: 'The questions a first quotation raises',
    items: FAQ,
  },
  {
    kind: 'seo',
    graph: [
      webPageSchema({
        name: TITLE,
        path: PATH,
        description: DESCRIPTION,
        speakable: '.v2-speakable',
      }),
      faqPageSchema(FAQ, { name: 'Quotation and terms — buyer questions', url: `${siteConfig.brand.siteUrl}${PATH}` }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: '1 business day',
    figureNote: 'to a quotation, from a named sales manager',
    title: 'Send the brief and the volume',
    text:
      'The product, the quantity, the destination and the target market are enough for a quotation. Everything else — the formula, the label, the term — is worked out in the reply, against those four things.',
    primaryCta: { label: 'Request a quotation', href: '/contact.html' },
    secondaryCta: { label: 'How samples work', href: '/samples.html' },
    note: siteConfig.response.headline,
  },
];

export default function QuotationPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

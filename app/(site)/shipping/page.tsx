/**
 * SHIPPING AND CUSTOMS — the fourth stage of an order.
 *
 * WHY THIS PAGE EXISTS
 *
 * The shipping record on this site is good: four channels with their transit
 * times, seven documents that travel with the goods, the order of the payment
 * and the tracking document, the rule for when the bill of lading is issued.
 * All of it was true, and most of it was on a policies page that a buyer
 * reaches only after they have decided to order.
 *
 * The question a buyer asks before that is narrower and more practical: how
 * does my order leave the factory, what do I have to do at my end, and how
 * long until it is on my shelf. That is a page of its own here.
 *
 * WHAT IS A FACT AND WHAT IS A VARIABLE
 * The channels, the transit windows and the document set are fixed and are
 * read out of the shipping record. The freight is not: it is quoted per lane
 * against the destination, the volume and the trade term, and it is shown
 * separately from the goods so two suppliers can be compared on the same
 * basis. Nothing on this page is a price, because the site does not publish
 * prices.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { documents, freight, incoterms, shippingChannels, tracking } from '@/lib/shipping';

const PATH = '/shipping.html';

const TITLE = 'Pet Care Shipping & Customs | Transit Times, Incoterms';

const DESCRIPTION =
  'How a pet care order leaves the factory and clears customs: sea, air and express lanes with their transit times, the seven documents, and Incoterms 2020.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

const sea = shippingChannels.find((c) => c.id === 'sea-fob');
const seaDdp = shippingChannels.find((c) => c.id === 'sea-ddp');
const air = shippingChannels.find((c) => c.id === 'air');
const express = shippingChannels.find((c) => c.id === 'express');

const FAQ = [
  {
    q: 'When do I get a tracking number?',
    /*
     * The tracking sentence is the one the record already carries:
     * it says when the document is issued and what it is on each
     * channel. It used to be followed here by a second version of
     * the same fact, so the answer said "the bill of lading is the
     * title document" twice in one paragraph.
     */
    a: `${tracking.issuance} Samples are the exception: ${tracking.samples.toLowerCase()}`,
  },
  {
    q: 'Which documents travel with the goods?',
    a: `${documents.join(', ')}. The certificate of analysis for the production batch travels with the consignment as well, and it names the batch the packing list names.`,
  },
  {
    q: 'Who clears customs — you or me?',
    a: 'On the default term, FOB Guangzhou or Shenzhen, we handle export clearance and you arrange import clearance, ocean freight and insurance from the loading point onward. On a DDP lane we handle export clearance, ocean freight, import clearance and the final mile, and duty and tax are inside the quote.',
  },
  {
    q: 'How is the freight calculated?',
    a: `${freight.basis} ${freight.ddp}`,
  },
  {
    q: 'How long does a sea shipment take?',
    a: `${sea?.transit ?? ''} That is the default lane for bulk palletised orders: the cheapest per unit and the slowest to arrive.`,
  },
  {
    q: 'What if the goods need to move faster than a ship?',
    a: `${air?.transit ?? ''} by air, or ${express?.transit ?? ''} by express courier. Freight on an express lane is paid by the buyer. Air is the usual answer for a launch or a restock where the shelf date matters more than the freight bill.`,
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Shipping and customs',
    title: 'How does my order leave the factory and clear customs?',
    lead:
      'Four lanes with their transit times, seven documents that travel with the goods, and a clear statement of who clears customs under which term — because the term decides who carries the risk and what the price includes.',
    primaryCta: { label: 'Ask about a destination', href: '/contact.html' },
    secondaryCta: { label: 'See the trade terms', href: '/trade-compliance.html' },
    metrics: [
      { value: '25–35 days', label: 'sea, FOB', note: 'to Europe and the US West Coast' },
      { value: '40–50 days', label: 'sea, DDP', note: 'door to door, duty included' },
      { value: '5–7 days', label: 'by air', note: 'door to door' },
      { value: '3–5 days', label: 'express', note: 'samples and urgent top-ups' },
    ],
    answer:
      'The bill of lading or air waybill is issued when production is complete and confirmed with you before the balance is settled — so you have the tracking number before the goods move, and the balance is never paid against a number you have not seen.',
    boundary:
      'Freight is quoted per lane against your destination, your volume and the trade term, and it is shown separately from the product price. Duty and tax are the importer’s, unless the term is DDP.',
  },
  {
    kind: 'featureGrid',
    eyebrow: 'The lanes',
    title: 'Four ways out, and what each one is for',
    lead:
      'The lane is a decision about the shelf date and the freight bill, and the quote states the transit time for the lane you choose.',
    cols: 2,
    items: [
      {
        pill: 'Default',
        title: sea?.label ?? 'Sea freight',
        body: `${sea?.transit ?? ''} ${sea?.note ?? ''}`,
        icon: 'truck',
      },
      {
        pill: 'Door to door',
        title: seaDdp?.label ?? 'Sea freight, DDP',
        body: `${seaDdp?.transit ?? ''} ${seaDdp?.note ?? ''}`,
        icon: 'globe',
      },
      {
        pill: 'Fast',
        title: air?.label ?? 'Air freight',
        body: `${air?.transit ?? ''} ${air?.note ?? ''}`,
        icon: 'truck',
      },
      {
        pill: 'Fastest',
        title: express?.label ?? 'Express courier',
        body: `${express?.transit ?? ''} ${express?.note ?? ''}`,
        icon: 'cart',
      },
    ],
    note:
      'The trade term decides what the price includes. The default is FOB Guangzhou / Shenzhen (ICC Publication 723E), where risk transfers when the goods cross the ship’s rail at the named port of loading.',
    noteCta: { label: 'The Incoterms, in full', href: '/trade-compliance.html' },
  },
  {
    kind: 'process',
    eyebrow: 'The order of events',
    title: 'From the deposit to the container',
    lead: 'The tracking document is issued at the second step, which is deliberate: you see the number before you settle the balance.',
    steps: [
      {
        no: '01',
        title: 'Deposit',
        desc: '35% by wire transfer when the order is placed, or a letter of credit at sight from USD 30,000. Name the quotation number in the transfer reference.',
      },
      {
        no: '02',
        title: 'Production completed',
        desc: 'The batch is finished, sampled and released, and the certificate of analysis is written against the batch number.',
      },
      {
        no: '03',
        title: 'The logistics order number is issued',
        desc: 'The bill of lading or air waybill is issued, and it is confirmed with you before the balance is collected. On sea the B/L is the title document.',
      },
      {
        no: '04',
        title: 'The balance is settled',
        desc: 'With the tracking document already in your hands.',
      },
      {
        no: '05',
        title: 'The goods ship',
        desc: `The consignment carries ${documents.length} documents: ${documents.join(', ')}.`,
      },
    ],
  },
  {
    kind: 'specTable',
    eyebrow: 'The paperwork',
    title: 'What travels with the goods',
    specs: [
      ...documents.map((d) => ({ key: d, val: 'Travels with every consignment' })),
      { key: 'Tracking document', val: tracking.document },
      { key: 'When it is issued', val: 'When production is complete, confirmed with the buyer before the balance is settled' },
      { key: 'How to use it', val: tracking.howToUse },
      { key: 'Default term', val: incoterms.default },
      { key: 'Other terms', val: incoterms.available.join(', ') },
      { key: 'Freight', val: freight.basis },
      { key: 'Sample freight', val: freight.samples },
      { key: 'On a DDP lane', val: freight.ddp },
      { key: 'Wooden packaging', val: 'Fumigation certificate where an ISPM-15 pallet is used' },
    ],
  },
  {
    kind: 'faq',
    eyebrow: 'On the water',
    title: 'The questions a logistics team asks',
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
      faqPageSchema(FAQ, {
        name: 'Shipping and customs — buyer questions',
        url: `${siteConfig.brand.siteUrl}${PATH}`,
      }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: '7 documents',
    figureNote: 'travel with every consignment',
    title: 'Tell us the destination and we will name the lane',
    text:
      'The destination, the volume and the term decide the lane, the transit time and the freight. All three can be stated in the quotation.',
    primaryCta: { label: 'Ask about shipping', href: '/contact.html' },
    secondaryCta: { label: 'What if something is wrong', href: '/after-sales.html' },
    note: siteConfig.response.headline,
  },
];

export default function ShippingPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

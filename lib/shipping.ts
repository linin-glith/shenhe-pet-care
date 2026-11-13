/**
 * Shipment & logistics — what happens AFTER the order number.
 *
 * WHY THIS FILE EXISTS
 * A buyer does not lose the deal on the product page. They lose it on the
 * question that comes next: when do I get a tracking number, which channel
 * should I use, and what will the freight cost. The site answered none of
 * those three, even though the factory's own knowledge base had all of them
 * — transit times per channel, the rule for issuing the B/L or air waybill,
 * and the document set that ships with the goods. It simply never made it
 * onto a page.
 *
 * WHERE THE FACTS COME FROM
 *   - content/v2/shipping.json holds them, so the web page and the
 *     downloadable TRADE-COMPLIANCE.md read the same file and cannot drift.
 *   - The production lead times are derived from lib/products.json here, not
 *     typed, so a catalogue change moves them.
 *   - Nothing is a price. Freight is quote-per-lane, the same rule as the
 *     unit price (siteConfig.pricing).
 *
 * THE MARKER FOR THE NEXT BUILD
 * The buyer is supposed to CHOOSE the channel and the Incoterm. On a static
 * site that choice can only be offered as information plus an RFQ. When the
 * front-end / back-end order system is built, `channels` and
 * `incoterms.available` become the selectable options, and each option has
 * to carry its own transit time and a freight estimate.
 * SHIPPING-SELECTION-SPEC.md spells that out; the `TODO(client-input)`
 * markers below name the numbers the factory still has to supply per lane.
 */

import { products } from './products';
import facts from '@/content/v2/shipping.json';

export type ShippingChannel = {
  id: string;
  label: string;
  transit: string;
  note: string;
  /** Whether the factory carries customs clearance and duty on this lane. */
  doorToDoor: boolean;
};

export const shippingChannels: ShippingChannel[] = facts.channels;

/** The Incoterms the factory quotes against. */
export const incoterms = facts.incoterms;

/** When the tracking number arrives, and what it is. */
export const tracking = facts.tracking;

/** The per-shipment document set. */
export const documents: string[] = facts.documents;

/** How freight is charged. */
export const freight = facts.freight;

/** The production window, derived from the catalogue rather than typed. */
const stockLead = [...new Set(products.map((p) => p.lead_time_days_stock))].sort();
const oemLead = [...new Set(products.map((p) => p.lead_time_days_oem))].sort();
const asRange = (v: string[]) =>
  (v.length === 1 ? v[0] : `${v[0]}-${v[v.length - 1]}`).replace(/-/g, '–');

export const productionLead = {
  /** Stock catalogue formulas: counted from payment confirmation. */
  stock: `${asRange(stockLead)} days after payment is confirmed`,
  /** Private label: counted from sample approval. */
  oem: `${asRange(oemLead)} days after the sample is approved`,
};

/**
 * THE SENTENCES, READ FROM THE SAME RECORD THE PAGE IS BUILT ON.
 *
 * The document set and the transit times live in content/v2/shipping.json,
 * so they are read here rather than typed: a lane that changes in the
 * record changes on the page with it. The list keeps the capitalisation
 * the record gives it, so the seven documents read as one list.
 *
 * The list is cut in two so that neither sentence is a long one: the
 * documents that travel with the goods, then the certificate that
 * travels with the batch.
 */
const documentLine = documents.slice(0, -1).join(', ');

/** The batch certificate, which travels with every consignment. */
const batchCertificate = documents[documents.length - 1];

/** The transit time of one channel, as the record states it. */
const transitOf = (id: string) =>
  shippingChannels.find((c) => c.id === id)?.transit ?? '';

/**
 * The answer a buyer actually asks, in one paragraph.
 *
 * Used by the GEO answers on the home and catalogue pages and by the
 * shipment section on the trade-compliance page, so the wording is identical
 * everywhere an engine might lift it.
 */
export const shippingAnswer = [
  `Production: stock catalogue formulas ship ${productionLead.stock}. Private-label orders ship ${productionLead.oem}.`,
  `Payment: 35% is prepaid when the order is placed, and the balance is settled before the goods leave. Wire transfer (SWIFT T/T) or L/C at sight.`,
  `Tracking document: the bill of lading (B/L) by sea, the air waybill (AWB) by air or courier. It is issued when production is complete, and confirmed with you before the balance is settled. Samples are the exception: they leave with a courier tracking number within 48 hours.`,
  `Documents per shipment: ${documentLine}. ${batchCertificate} travels with the consignment.`,
  `Channels and transit: sea FOB ${transitOf('sea-fob')}. Sea DDP ${transitOf('sea-ddp')}, with duty and tax inside the quote. Air ${transitOf('air')}. Express ${transitOf('express')}.`,
  `Freight is quoted per lane against your destination, the volume and the Incoterms term, and shown separately from the product price so you can compare on the same basis.`,
].join(' ');

/*
 * THE SAME FACTS, ASKED ONE AT A TIME.
 *
 * The paragraph above answers six questions in one passage of eleven
 * hundred characters. An answer engine lifts a passage, and a passage
 * that long gets cut - and the cut lands in the middle of a number,
 * which is the one thing a buyer cannot read half.
 *
 * So the six paragraphs become four questions with four answers, each
 * answer saying one thing and carrying the number a buyer needs.
 */
export const shippingAnswers: { q: string; a: string }[] = [
  {
    q: 'How long does production take?',
    a: `Stock catalogue formulas ship ${productionLead.stock}. Private-label orders ship ${productionLead.oem}.`,
  },
  {
    q: 'How do I pay, and when is the balance due?',
    a: `35% is prepaid when the order is placed, and the balance is settled before the goods leave. Payment is by wire transfer (SWIFT T/T) or L/C at sight.`,
  },
  {
    q: 'What document tracks the shipment, and what travels with it?',
    a: `The bill of lading (B/L) by sea, the air waybill (AWB) by air or courier, issued when production is complete. ${documentLine}. ${batchCertificate} travels with the consignment.`,
  },
  {
    q: 'Which channel should I choose, and what does freight cost?',
    a: `Sea FOB ${transitOf('sea-fob')}. Sea DDP ${transitOf('sea-ddp')}, with duty and tax inside the quote. Air ${transitOf('air')}. Express ${transitOf('express')}. Freight is quoted per lane against destination, volume and Incoterms term, and shown separately from the product price.`,
  },
];

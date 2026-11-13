/**
 * PRODUCTION AND INSPECTION — the third stage of an order.
 *
 * WHY THIS PAGE EXISTS
 *
 * The site published the factory: 30,000 m², six production lines, a
 * class-D cleanroom, an on-site QC laboratory, a published batch reject rate.
 * And it published the six QC steps, in the trade terms.
 *
 * What it did not publish, on one page, was the thing a buyer's quality
 * manager actually asks: what happens to my order between the deposit and
 * the container, what is checked, against what, by whom, and what I get as
 * proof. The answer was spread across a photograph page, a policies page and
 * a certificate of analysis that nobody had been told they would receive.
 *
 * So this page puts the run of one order in order, and says which acceptance
 * criteria the goods are measured against.
 *
 * THE NUMBER THAT IS HARDEST TO PUBLISH
 *
 * The batch reject rate is on this page because a factory that has never
 * rejected a batch cannot tell you how it handles one. It is published and
 * not rounded down, and it is read out of the configuration so it is the
 * same figure the factory page and the why-us page carry.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';

const PATH = '/production.html';

const TITLE = 'Pet Care Production & QC | Six Steps, Batch COA, Inspection';

const DESCRIPTION =
  'How a pet care order is made: six QC steps from raw material to carton, the acceptance criteria the goods are measured against, and the batch certificate.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

const M = siteConfig.metrics;

const FAQ = [
  {
    q: 'How many QC steps does an order go through?',
    a: `${M.qcStepCount}: incoming quality control, batching, in-process control, filling, out-going quality control, and third-party claim verification. A certificate of analysis is issued for every production batch and travels with the consignment, and a safety data sheet exists for every active SKU.`,
  },
  {
    q: 'What is the batch reject rate?',
    a: `${M.batchRejectRatePct}% year to date in 2026, published rather than rounded down. A factory that has never rejected a batch cannot tell you how it handles one, so the rate is stated on this page, on the factory page and on the why-us page — all three read it from the same configuration.`,
  },
  {
    q: 'What are the goods accepted against?',
    a: 'The proforma invoice specification: formula, packaging, dimensions and labelling. Active-ingredient content within ±5% of the declared value, pH within ±0.5, microbial load within the EU/ISO 17516 cosmetic limits, and appearance, colour and fragrance matching the approved reference sample.',
  },
  {
    q: 'Can a third party inspect my order before it ships?',
    a: 'Yes. The claim procedure accepts a buyer-side laboratory report and may request a counter-sample, and where the parties disagree the goods are tested at a third-party laboratory — SGS, Intertek or Bureau Veritas — at your nominated destination. Container loading is photographed at the export dock.',
  },
  {
    q: 'How long does production take?',
    a: 'A private-label run of a catalogue formula takes 25–40 days from artwork approval, and a formula developed for you takes 30–45 days from formula approval. The factory runs 1,000,000 bottles a month across six production lines, so the window is a scheduling question rather than a capacity one.',
  },
  {
    q: 'What proof do I get that the batch is what you say it is?',
    a: 'A certificate of analysis for the batch, the safety data sheet for the SKU, and the batch attestation: each batch is recorded on a public chain with its SHA-256, the transaction and the block, so anyone can read that the laboratory report file existed at the recorded time and has not changed since.',
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Production and inspection',
    title: 'How do you make my order, and who checks it before it ships?',
    lead:
      'Six steps from the raw material to the carton, on six production lines in a class-D cleanroom, with a certificate of analysis for every batch and a published rate of how many batches are rejected.',
    primaryCta: { label: 'Ask about your order', href: '/contact.html' },
    secondaryCta: { label: 'How it ships', href: '/shipping.html' },
    metrics: [
      { value: `${M.qcStepCount} QC steps`, label: 'raw material to carton', note: 'IQC → OQC → third-party claim check' },
      { value: `${M.monthlyCapacityBottles.toLocaleString('en-US')}`, label: 'bottles a month', note: `across ${M.productionLines} production lines` },
      { value: `${M.gmpWorkshopAreaM2.toLocaleString('en-US')} m²`, label: 'GMP workshop', note: `${M.gmpStandard}, ${M.cleanroomClass} cleanroom` },
      { value: `${M.batchRejectRatePct}%`, label: 'batch reject rate', note: 'year to date in 2026, published' },
    ],
    answer:
      'Every batch is sampled before release, and every batch leaves with a certificate of analysis that states what was measured and what it came out at. The acceptance criteria are written down before the order, not argued about after it.',
    boundary:
      'The acceptance window is 7 days for visible and packaging defects and 30 days for active-ingredient or efficacy claims that need laboratory verification. Outside those windows the claim is not accepted — and the window is on the next page, not buried here.',
  },
  {
    kind: 'process',
    eyebrow: 'The run of one order',
    title: `${M.qcStepCount} steps between the raw material and the carton`,
    lead:
      'The same path every order takes. The batch COA is issued at the end of it, and the attestation is written at the same moment.',
    steps: [
      {
        no: '01',
        title: 'Incoming quality control',
        desc: 'Raw material is checked on arrival against the specification it was bought against, before it is opened. A material that does not match does not enter the line.',
      },
      {
        no: '02',
        title: 'Batching',
        desc: 'The formula is batched to the specification, and the batch number is recorded. That number is what the certificate of analysis, the packing list and the attestation all point at.',
      },
      {
        no: '03',
        title: 'In-process control',
        desc: 'The batch is checked while it is being made, not only at the end. A batch that drifts is caught before it becomes a problem.',
      },
      {
        no: '04',
        title: 'Filling',
        desc: `The filling run happens in the ${M.gmpStandard} workshop with a ${M.cleanroomClass} cleanroom filling scope, on ${M.productionLines} production lines.`,
      },
      {
        no: '05',
        title: 'Out-going quality control',
        desc: 'The packed goods are sampled against the batch before release, and the certificate of analysis is written from the result.',
      },
      {
        no: '06',
        title: 'Third-party claim verification',
        desc: 'The claim on the label is checked against what the batch was measured at — which is the step that keeps a label from saying more than the report supports.',
      },
    ],
  },
  {
    kind: 'featureGrid',
    eyebrow: 'What you can check',
    title: 'The proof that comes with the goods',
    lead:
      'Four things, and each of them is something a buyer can verify without taking our word for it.',
    cols: 2,
    items: [
      {
        pill: 'Per batch',
        title: 'A certificate of analysis',
        body:
          'Issued for every production batch and attached to the shipment. It states what was measured on this batch and what it came out at, and it points at the batch number that appears on the packing list.',
        icon: 'flask',
      },
      {
        pill: 'Per SKU',
        title: 'A safety data sheet',
        body:
          'A safety data sheet exists for every active SKU and is issued with the consignment, in the EU 16-section format. The published set is on the safety data sheets page.',
        icon: 'shield',
      },
      {
        pill: 'Public',
        title: 'A batch attestation',
        body:
          'Each batch is recorded on a public chain with the SHA-256 of the report file, the transaction and the block. Anyone can read that the file existed at the recorded time and has not changed since.',
        icon: 'check',
      },
      {
        pill: 'Documented',
        title: 'A 12-month shelf-life study',
        body:
          'Every SKU has a documented 12-month shelf-life study and a stability protocol. The shelf life on the product page is the studied figure, not a guess.',
        icon: 'clock',
      },
    ],
    note:
      'Container loading is photographed at the export dock, so the photograph of a loaded container is one a buyer can ask for against a shipment.',
    noteCta: { label: 'The batch attestations', href: '/attestation.html' },
  },
  {
    kind: 'specTable',
    eyebrow: 'Acceptance',
    title: 'What the goods are accepted against',
    specs: [
      { key: 'Specification', val: 'The proforma invoice: formula, packaging, dimensions and labelling' },
      { key: 'Active ingredient', val: 'Within ±5% of the declared value' },
      { key: 'pH', val: 'Within ±0.5 of the declared value' },
      { key: 'Microbial load', val: 'Within the EU/ISO 17516 cosmetic limits' },
      { key: 'Appearance', val: 'Colour and fragrance must match the approved reference sample' },
      { key: 'Visible defects', val: '7 days from arrival at the destination port' },
      { key: 'Claims needing laboratory verification', val: '30 days from arrival at the destination port' },
      { key: 'Force majeure', val: 'Tolls the acceptance window' },
      { key: 'Certificate of analysis', val: 'For every production batch, attached to the shipment' },
      { key: 'Safety data sheet', val: `For every active SKU — ${M.catalogueSkuCount} SKUs` },
    ],
  },
  {
    kind: 'faq',
    eyebrow: 'On the floor',
    title: 'The questions a quality manager asks',
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
        name: 'Production and inspection — buyer questions',
        url: `${siteConfig.brand.siteUrl}${PATH}`,
      }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: `${M.batchRejectRatePct}%`,
    figureNote: 'batch reject rate, year to date in 2026',
    title: 'Ask us what the line does with your specification',
    text:
      'Send the product, the volume and the claims you intend to make. The reply names the specification, the QC path and the certificate you will receive with the goods.',
    primaryCta: { label: 'Ask about production', href: '/contact.html' },
    secondaryCta: { label: 'How it ships', href: '/shipping.html' },
    note: siteConfig.response.headline,
  },
];

export default function ProductionPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

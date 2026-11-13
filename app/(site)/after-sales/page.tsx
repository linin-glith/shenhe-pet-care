/**
 * AFTER-SALES AND REORDERS — the fifth stage, and the one that repeats.
 *
 * WHY THIS PAGE EXISTS
 *
 * Every other page on this site is about the first order. The buyer who has
 * already ordered once is a different reader with different questions: what
 * happens if a batch is wrong, how long do I have to say so, who pays, what
 * do I do when I want the same thing again.
 *
 * The answers existed — the acceptance criteria, the acceptance window, the
 * claims procedure, the product liability insurance and the arbitration
 * clause are all in the trade terms, and the reorder cadence is on the trade
 * programme page. But they were written as policies, addressed to a contract
 * that may not exist yet, and a buyer with a pallet in a warehouse does not
 * read policies.
 *
 * So this page states the procedure as a procedure: the window, the claim,
 * the review, the two possible outcomes, and what a reorder looks like.
 *
 * THE TWO THINGS A BUYER WANTS FROM THIS PAGE
 * The window, because a claim made after it is not a claim. And the refund
 * or replacement, because "we will look into it" is not an answer.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';

const PATH = '/after-sales.html';

const TITLE = 'Pet Care Claims & Reorders | Acceptance, Replacement';

const DESCRIPTION =
  'What happens if a pet care batch fails: the acceptance window, the claim procedure, replacement or refund, the insurance behind it, and how a reorder runs.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

const FAQ = [
  {
    q: 'How long do I have to report a problem?',
    a: '7 days from arrival at the destination port for visible or packaging defects, and 30 days for active-ingredient or efficacy claims that need laboratory verification. Force majeure events toll the window. The window is counted from arrival, not from discovery, so it is worth checking the goods on arrival.',
  },
  {
    q: 'What should a claim contain?',
    a: 'A photograph and a laboratory report. A buyer-side laboratory report is acceptable, and we may request a counter-sample. If the claim is confirmed, the replacement is shipped at our cost within 15 days, or the refund is proportional to the defective quantity. If the parties disagree, the goods are tested at a third-party laboratory — SGS, Intertek or Bureau Veritas — at your nominated destination.',
  },
  {
    q: 'What if we disagree?',
    a: 'Then it is tested rather than argued. The claim is reviewed within 5 business days, and a dispute goes to a third-party laboratory at your nominated destination. The arbitration clause sits behind that: CIETAC arbitration in Shanghai, in English, with three arbitrators, and the award is final and binding in 170+ jurisdictions.',
  },
  {
    q: 'Are you insured?',
    a: 'Yes. Product liability insurance of USD 1,000,000 per occurrence and USD 5,000,000 aggregate, underwritten by PICC Property and Casualty Company Limited, with worldwide coverage. For EU buyers we can add you as an additional insured on orders from USD 30,000. Your own importer liability cover is still required in the EU.',
  },
  {
    q: 'How do I reorder?',
    a: 'Send the quotation number and the batch or SKU you want repeated. A reorder runs against the specification that was approved the first time, so no new sample is needed unless the formula, the artwork or the packaging has changed — and if it has, the changed part is what gets sampled.',
  },
  {
    q: 'Who do I talk to when something goes wrong?',
    a: 'A named sales manager, on the same channel as your first enquiry. The quality manager handles quality and dispute questions, and the legal contact handles the NDA and the IP. A dispute is escalated in order: good-faith negotiation for 30 days from written notice, then CCPIT mediation, then arbitration.',
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'After-sales and reorders',
    title: 'What happens if a batch fails, and how do I reorder?',
    lead:
      'Two windows, one claim procedure and two possible outcomes — replacement or refund — plus what a second order looks like. The windows are the part to read: a claim made after them is not a claim.',
    primaryCta: { label: 'Raise a question on an order', href: '/contact.html' },
    secondaryCta: { label: 'The trade programme', href: '/trade-programme.html' },
    metrics: [
      { value: '7 days', label: 'visible defects', note: 'from arrival at the destination port' },
      { value: '30 days', label: 'claims needing lab verification', note: 'from arrival' },
      { value: '5 business days', label: 'for the claim review', note: 'after the claim is filed' },
      { value: '15 days', label: 'to ship a replacement', note: 'at our cost, once confirmed' },
    ],
    answer:
      'File the claim with a photograph and a laboratory report inside the window. We review it within five business days. If it is confirmed, the replacement is shipped at our cost within fifteen days, or the refund is proportional to the defective quantity — and if we disagree, a third-party laboratory decides at your nominated destination.',
    boundary:
      'Force majeure tolls the acceptance window. A claim for an active ingredient or an efficacy claim needs laboratory verification and has 30 days rather than 7, because that is how long the verification takes.',
  },
  {
    kind: 'process',
    eyebrow: 'A claim, in order',
    title: 'Five steps, and the one that decides the outcome',
    lead:
      'The claim is the step that matters: it has to be inside the window, and it has to carry the evidence.',
    steps: [
      {
        no: '01',
        title: 'Check the goods on arrival',
        desc: 'The acceptance window runs from arrival at the destination port, not from the day a problem is noticed. A claim raised after the window is not a claim, and that is why the first step is checking on arrival.',
      },
      {
        no: '02',
        title: 'File the claim',
        desc: 'A photograph and a laboratory report, inside the window. A buyer-side laboratory report is acceptable, and we may request a counter-sample from the batch.',
      },
      {
        no: '03',
        title: 'We review it',
        desc: 'Within five business days. If the claim is confirmed, the outcome is a replacement at our cost or a refund proportional to the defective quantity. If it is not confirmed, you are told why.',
      },
      {
        no: '04',
        title: 'If we disagree',
        desc: 'The goods are tested at a third-party laboratory — SGS, Intertek or Bureau Veritas — at your nominated destination, and the result settles it.',
      },
      {
        no: '05',
        title: 'If it still cannot be settled',
        desc: 'Escalation in order: good-faith negotiation for 30 days from written notice, then CCPIT mediation, then CIETAC arbitration in Shanghai, in English, with three arbitrators.',
      },
    ],
  },
  {
    kind: 'featureGrid',
    eyebrow: 'The terms behind it',
    title: 'What holds the other end of the promise',
    lead:
      'A replacement promise is worth what is behind it. Three things are behind this one.',
    cols: 3,
    items: [
      {
        pill: 'Insurance',
        title: 'Product liability cover',
        body:
          'USD 1,000,000 per occurrence and USD 5,000,000 aggregate, underwritten by PICC Property and Casualty Company Limited, covering the USA, Canada and the EU in the first instance. For EU buyers we can add you as an additional insured on orders from USD 30,000.',
        icon: 'shield',
      },
      {
        pill: 'Law',
        title: 'An award that is enforceable',
        body:
          'CIETAC arbitration in Shanghai, in English, three arbitrators, under the CIETAC Arbitration Rules. The award is final and binding on both parties and enforceable in 170+ jurisdictions under the New York Convention.',
        icon: 'globe',
      },
      {
        pill: 'Evidence',
        title: 'Proof of what was shipped',
        body:
          'The batch number on the packing list, the certificate of analysis for that batch, and the attestation on the public chain. Three records pointing at one batch, which is what makes a claim answerable instead of arguable.',
        icon: 'check',
      },
    ],
    note:
      'Your own importer liability cover is still required in the EU, and our indemnity does not cover claims that arise from your own modifications, relabelling or downstream marketing claims.',
    noteCta: { label: 'The trade terms in full', href: '/trade-compliance.html' },
  },
  {
    kind: 'process',
    eyebrow: 'The second order',
    title: 'How a reorder runs',
    lead:
      'A reorder is the same order with the specification already settled, so most of the first order’s work does not repeat.',
    steps: [
      {
        no: '01',
        title: 'Send the quotation number',
        desc: 'And the batch or SKU you want repeated. The specification, the artwork and the packaging are on the record, so they do not have to be re-sent.',
      },
      {
        no: '02',
        title: 'Nothing to re-approve, unless it changed',
        desc: 'The approved sample and the approved artwork stand. If the formula, the artwork or the packaging has changed, the changed part is what gets sampled again — not the whole product.',
      },
      {
        no: '03',
        title: 'Production runs to the same window',
        desc: '25–40 days for a private-label run of a catalogue formula, counted from artwork approval, and the same six QC steps, because the specification is the same.',
      },
      {
        no: '04',
        title: 'A new batch number, a new certificate',
        desc: 'A new batch is a new batch: a new batch number, a new certificate of analysis and a new attestation. The old ones stay on the record and stay readable.',
      },
    ],
  },
  {
    kind: 'faq',
    eyebrow: 'After the first order',
    title: 'The questions a repeat buyer asks',
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
        name: 'After-sales and reorders — buyer questions',
        url: `${siteConfig.brand.siteUrl}${PATH}`,
      }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: '7 days',
    figureNote: 'to report a visible or packaging defect',
    title: 'Check the goods on arrival',
    text:
      'The acceptance window runs from arrival, not from discovery. If something is wrong, send the photograph and the report, and you will have an answer within five business days.',
    primaryCta: { label: 'Raise a question', href: '/contact.html' },
    secondaryCta: { label: 'Start again from the quotation', href: '/quotation.html' },
    note: siteConfig.response.headline,
  },
];

export default function AfterSalesPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

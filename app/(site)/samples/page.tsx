/**
 * SAMPLES AND APPROVAL — the second stage of an order.
 *
 * WHY THIS PAGE EXISTS
 *
 * The sample was the most-asked question on the site and it had no page of
 * its own. The product pages said a sample was the first stage. The trade
 * programme page said samples are quoted per SKU. The terms of service said
 * the sample cost is credited against the first production order.
 *
 * Three sentences, on three pages, none of which answered the question a
 * buyer actually has: how long, what does it cost, and what am I signing off
 * when I say "approved". That last one is the one that matters — approval
 * starts the production clock, so a buyer who approves without knowing what
 * they are approving has started a 25–40 day window on a specification they
 * did not check.
 *
 * THE FOUR KINDS OF SAMPLE
 * They are not four versions of the same thing, and they cost different
 * amounts and take different times:
 *
 *   - a sample of an existing catalogue SKU, filled from the line;
 *   - a laboratory sample, made in the laboratory for a reference SKU;
 *   - a sample of a formula made for you;
 *   - a third-party safety report, which is made by an outside laboratory
 *     and is not a physical sample at all.
 *
 * Every window on this page comes from the same record the rest of the site
 * reads, so a sample quoted here and a sample quoted in an email are the
 * same window.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { LABORATORY_WINDOWS, LEAD_TIMES } from '@/lib/commerce';
import { freight } from '@/lib/shipping';

const PATH = '/samples.html';

const TITLE = 'Pet Care Samples | Lead Time, Cost and What You Approve';

const DESCRIPTION =
  'How a pet care sample works: the four kinds there are, how long each one takes, what a sample and its freight cost, and what your approval actually starts.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

const FAQ = [
  {
    q: 'Does a sample cost anything?',
    a: 'Yes. A sample is chargeable, and the fee is confirmed in the quotation before anything is made, so a sample is never a surprise line on an invoice. The sample cost is credited against the first production order.',
  },
  {
    q: 'How much is the sample freight?',
    a: `Sample freight is paid by the buyer: ${freight.samples.replace('Sample freight is paid by the buyer: ', '')} The courier is DHL, FedEx or UPS, and the sample leaves with a tracking number within 48 hours of dispatch.`,
  },
  {
    q: 'How long does a sample take?',
    a: `${LEAD_TIMES.sample.label} for a sample of an existing catalogue SKU, ${LEAD_TIMES.labSample.label} for a laboratory sample, and ${LEAD_TIMES.customSample.label} for a sample of a formula made for you. A third-party cosmetic product safety report is an outside laboratory’s window, ${LABORATORY_WINDOWS.cpsr.label}, and is not a physical sample.`,
  },
  {
    q: 'What does my approval actually start?',
    a: 'Your approval starts the production clock. A private-label run runs 25–40 days from the point the sample is approved, so what you sign off is the specification the factory makes against: the formula, the scent or colour, the packaging, and the label artwork.',
  },
  {
    q: 'Can I get a sample before placing an order?',
    a: 'Yes — a physical sample plus a written specification sheet is the first stage of any project, and the sample cost is credited against the first production order. A sample can be drawn from any SKU in the line you are comparing, so the comparison between two formats is made on the product rather than on a description.',
  },
  {
    q: 'What should I check on the sample?',
    a: 'Four things, in this order: that the product does what you are buying it for on the animal and around it; that the texture, scent and colour are what you expect against your approved reference; that the packaging and the label artwork print the way you approved them; and that the specification sheet matches what you were told. Anything you want changed is cheaper to change here than after the first batch.',
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Samples and approval',
    title: 'How long does a sample take, what does it cost, and what am I signing off?',
    lead:
      'A sample is chargeable, the fee is in the quotation before anything is made, and the sample cost comes back against your first order. What you approve starts the production clock — so this page is about the sample, and about the four things worth checking on it.',
    primaryCta: { label: 'Ask for a sample', href: '/contact.html' },
    secondaryCta: { label: 'See how production runs', href: '/production.html' },
    metrics: [
      { value: LEAD_TIMES.sample.label, label: 'catalogue sample', note: 'filled from the line' },
      { value: LEAD_TIMES.labSample.label, label: 'laboratory sample', note: 'made in the laboratory' },
      { value: LEAD_TIMES.customSample.label, label: 'custom formula sample', note: 'made for you' },
      { value: 'Within 48 hours', label: 'to a tracking number', note: 'courier, DHL or FedEx' },
    ],
    answer:
      'The sample fee is quoted before the sample is made, and it is credited against your first production order. The freight is yours, quoted per destination, and the sample leaves with a tracking number within 48 hours of dispatch.',
    boundary:
      'A sample is chargeable and it is not a gift: it is the first stage of an order, and the fee is part of the order’s commercial terms. That is why it is quoted rather than listed.',
  },
  {
    kind: 'featureGrid',
    eyebrow: 'Four kinds',
    title: 'Which sample you need, and what each one answers',
    lead:
      'They cost different amounts, take different times and answer different questions. Asking for the wrong one costs a week.',
    cols: 2,
    items: [
      {
        pill: 'Existing SKU',
        no: '01',
        title: 'A catalogue sample',
        body: `A physical sample of one of the ${siteConfig.metrics.catalogueSkuCount} catalogue SKUs, filled from the line and sent with a written specification sheet. ${LEAD_TIMES.sample.label}. This is the one to order when you are comparing two formats of the same product.`,
        icon: 'leaf',
      },
      {
        pill: 'Existing SKU',
        no: '02',
        title: 'A laboratory sample',
        body: `Made in the laboratory rather than filled on the line, and used where the line would not represent the product — a new scent, a viscosity, a colour. ${LEAD_TIMES.labSample.label}.`,
        icon: 'flask',
      },
      {
        pill: 'Your formula',
        no: '03',
        title: 'A sample of a formula made for you',
        body: `The first physical sample of a formulation developed for your brief. ${LEAD_TIMES.customSample.label}, and it is the sample that settles the specification the production run is measured against.`,
        icon: 'sparkle',
      },
      {
        pill: 'Third party',
        no: '04',
        title: 'A safety report, which is not a sample',
        body: `A third-party cosmetic product safety report is made by an outside laboratory and is a document rather than a bottle. ${LABORATORY_WINDOWS.cpsr.label}, and the fee is quoted on request. It is what a buyer’s own compliance file usually asks for first.`,
        icon: 'shield',
      },
    ],
    note:
      'If you are not sure which one you need, ask for the catalogue sample — it is the cheapest way to find out whether the product is right before you spend anything on development.',
  },
  {
    kind: 'process',
    eyebrow: 'From brief to approval',
    title: 'How a sample round actually runs',
    lead:
      'Five steps, and the clock starts at the last one. Nothing here happens without your say-so.',
    steps: [
      {
        no: '01',
        title: 'The brief',
        desc: 'The product, the quantity you are working towards, the destination market and the claims you intend to make. Four things, and the sample fee is confirmed against them.',
      },
      {
        no: '02',
        title: 'The sample fee is quoted',
        desc: 'Before the sample is made, not after. A sample is chargeable, and the quote says what it costs so it is never a surprise line on an invoice.',
      },
      {
        no: '03',
        title: 'The sample is made and sent',
        desc: `Within ${LEAD_TIMES.sample.label} for a catalogue SKU. It leaves with a courier tracking number within 48 hours of dispatch, and the freight is quoted per destination and paid by the buyer.`,
      },
      {
        no: '04',
        title: 'You check it',
        desc: 'Against the written specification sheet and against the reference you were shown. Four checks: what it does, how it looks and smells, how the pack and label print, and whether the sheet matches what you were told.',
      },
      {
        no: '05',
        title: 'Your approval starts production',
        desc: 'A private-label run runs 25–40 days from the approval. The sample fee is credited against that first order, and the specification you approved is the one the factory makes against.',
      },
    ],
  },
  {
    kind: 'specTable',
    eyebrow: 'The numbers',
    title: 'What the sample round costs and how long it takes',
    specs: [
      { key: 'Catalogue sample', val: `${LEAD_TIMES.sample.label} — ${LEAD_TIMES.sample.note}` },
      { key: 'Laboratory sample', val: `${LEAD_TIMES.labSample.label} — ${LEAD_TIMES.labSample.note}` },
      { key: 'Custom formula sample', val: `${LEAD_TIMES.customSample.label} — ${LEAD_TIMES.customSample.note}` },
      { key: 'Third-party safety report', val: `${LABORATORY_WINDOWS.cpsr.label} — ${LABORATORY_WINDOWS.cpsr.note}` },
      { key: 'Sample fee', val: 'Chargeable, confirmed in the quotation before the sample is made' },
      { key: 'Credited against', val: 'The first production order' },
      { key: 'Sample freight', val: freight.samples },
      { key: 'Dispatch', val: 'Courier tracking number within 48 hours of dispatch' },
      { key: 'What it ships with', val: 'A written specification sheet for the sample' },
      { key: 'Production after approval', val: '25–40 days for private label, from the approval' },
    ],
  },
  {
    kind: 'faq',
    eyebrow: 'About samples',
    title: 'The questions buyers ask before the first sample',
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
        name: 'Samples and approval — buyer questions',
        url: `${siteConfig.brand.siteUrl}${PATH}`,
      }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: 'Within 48 hours',
    figureNote: 'from dispatch to a courier tracking number',
    title: 'Ask for the sample that answers your question',
    text:
      'Tell us the product, the volume, the destination and the claims you intend to make. The quotation carries the sample fee, and the sample leaves with a tracking number.',
    primaryCta: { label: 'Ask for a sample', href: '/contact.html' },
    secondaryCta: { label: 'How production runs', href: '/production.html' },
    note: siteConfig.response.headline,
  },
];

export default function SamplesPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

import { activeSkuCount, getLineLabel, products } from '@/lib/products';
import { siteConfig } from '@/lib/shenhe.config';
import { clientProducts } from '@/lib/client-products';
import { lowestMoq, standardMoq } from '@/lib/commerce';
import { documents, productionLead, shippingChannels } from '@/lib/shipping';
import { LAB_REPORTS } from '@/content/v2/reports';

/**
 * The standalone buyer FAQ.
 *
 * WHY A SEPARATE PAGE, AND NOT MORE HOMEPAGE QUESTIONS
 * The homepage carries eight answers, written to be lifted by an answer engine
 * and to answer the objections that stop an enquiry. It is not the place for
 * the other questions a buyer asks before they write: the ones about the
 * documents that ship with the goods, the difference between a factory and a
 * trading company, and how a test report is checked. Those belong on their own
 * page, where the person looking for them can find them.
 *
 * THE RULES THIS FILE FOLLOWS
 *   1. Every answer carries something checkable: a number, a document, a named
 *      standard, or an honest limit. "High quality" is worthless in a citation.
 *   2. Where the honest answer is a boundary, say the boundary. "We cannot do
 *      X" saves the buyer a month.
 *   3. No prices. The site is quote-only (siteConfig.pricing).
 *   4. Every number is read from the same source the rest of the site reads,
 *      so this page cannot disagree with the catalogue.
 *   5. Every question is asked the way a buyer asks it, and every answer is
 *      written so it can be quoted on its own.
 *
 * THE TOPIC ON EACH ITEM
 * A flat list of sixteen questions is a list, not a page: the buyer has to
 * read all of it to find the one they came for. The topic is what lets the
 * page be scanned — and it is what an answer engine can be pointed at when
 * the question is about ordering rather than about certification.
 */
export type FaqTopic =
  | 'Ordering & minimums'
  | 'Samples & development'
  | 'Quality & certification'
  | 'Production & lead time'
  | 'Shipping & payment'
  | 'The factory';

export type FaqEntry = {
  topic: FaqTopic;
  q: string;
  a: string;
};

/*
 * THE FOUR LINES, BY NAME.
 *
 * `categories` in the catalogue record is the three-way COMPLIANCE grouping
 * (which permit and which palette applies), not the product lines the site
 * is organised by. Counting those would print "3 product lines" on a site
 * that says four everywhere else — so the lines are taken from the records
 * themselves and named with the one module allowed to name a line.
 */
const lineNames = [...new Set(products.map((p) => p.line))].map((l) => getLineLabel(l)).join(', ');
const lowest = lowestMoq(clientProducts).units.toLocaleString();
const standard = standardMoq(clientProducts).units.toLocaleString();
const seaLane = shippingChannels.find((c) => c.id === 'sea-fob');
const airLane = shippingChannels.find((c) => c.id === 'air');

export const faqPage = {
  eyebrow: 'Before you write',
  title: 'The questions that decide whether an order is possible',
  lead:
    'Sixteen answers, grouped the way a buyer asks them. Every answer carries a number, a ' +
    'document or an honest limit — and where the honest answer is a boundary, it says so.',
  items: [
    {
      topic: 'Ordering & minimums' as FaqTopic,
      q: 'What is your minimum order quantity?',
      a:
        `The bundled sets start at ${lowest} sets and the catalogue SKUs at ${standard} bottles. ` +
        `Each product page carries the figure for that SKU, and the quotation confirms the one for your order.`,
    },
    {
      topic: 'Ordering & minimums' as FaqTopic,
      q: 'Which documents ship with the goods?',
      a: `${documents.join('; ')}. Each is issued against the order, and the packing list names the lot.`,
    },
    {
      topic: 'Ordering & minimums' as FaqTopic,
      q: 'How do I start?',
      a:
        'Send the product type, the target market and the quantity. The quotation comes back with the MOQ, the lead ' +
        'time, the packaging options and the compliance documents your market needs — normally within one business day.',
    },
    {
      topic: 'Ordering & minimums' as FaqTopic,
      q: 'Why are there no prices on this site?',
      a:
        siteConfig.pricing.policy +
        ' The same rule applies to the samples, the freight and the packaging.',
    },
    {
      topic: 'Samples & development' as FaqTopic,
      q: 'Are samples chargeable?',
      a:
        'Yes. The sample fee covers the formulation work and the sample run, and we quote it before you order. ' +
        'A sample is the only way to know whether the formula behaves the way the report says it does.',
    },
    {
      topic: 'Samples & development' as FaqTopic,
      q: 'Can you develop a formula that is not in the catalogue?',
      a:
        'Yes — that is most of the work. Send the brief and the target market and the R&D team works from a reference ' +
        'SKU, a pre-developed base, or a new formulation, with the sample round decided before the quotation.',
    },
    {
      topic: 'Samples & development' as FaqTopic,
      q: 'Do you sell under my brand or your own?',
      a:
        'Under yours. We are a contract manufacturer: your label, your artwork, your carton, and the compliance file ' +
        'carrying your company as the holder of the report.',
    },
    {
      topic: 'Quality & certification' as FaqTopic,
      q: 'How can I check the test reports are real?',
      a:
        `Every one of the ${LAB_REPORTS.length} published reports is listed in the attestation index with its SHA-256, ` +
        'and the hash is also published as a machine-readable file. Download the PDF, recompute the hash, compare it. ' +
        'The point of publishing the hashes is that you do not have to take our word for any of it.',
    },
    {
      topic: 'Quality & certification' as FaqTopic,
      q: 'Which certifications do you hold?',
      a:
        `The workshop runs to ${siteConfig.metrics.gmpStandard}, and the full certificate set — with the audit reports — ` +
        'is published on the certifications page and the market-by-market paperwork on the global compliance page.',
    },
    {
      topic: 'Production & lead time' as FaqTopic,
      q: 'How long does production take?',
      a:
        `A stocked catalogue formula ships ${productionLead.stock}; a private-label order runs ${productionLead.oem}. ` +
        'The sample round is counted separately, because what you approve is what gets made.',
    },
    {
      topic: 'Production & lead time' as FaqTopic,
      q: 'Can I visit the factory?',
      a:
        'The factory page carries photographs of the workshop, the cleanroom and the production lines, so you can ' +
        'assess the site before you travel. If you want to see it in person, say so in the enquiry and we will confirm ' +
        'what is possible.',
    },
    {
      topic: 'Shipping & payment' as FaqTopic,
      q: 'Which shipping channels do you work on?',
      a:
        (seaLane ? `Sea: ${seaLane.transit}. ` : '') +
        (airLane ? `Air: ${airLane.transit}. ` : '') +
        'Freight is quoted per lane against your destination, volume and Incoterms, and is shown separately from the product price.',
    },
    {
      topic: 'Shipping & payment' as FaqTopic,
      q: 'Which Incoterms do you work on?',
      a:
        'FOB and DDP by sea, and air freight with the documents your courier asks for. The term is part of the ' +
        'quotation, not a separate negotiation, and the freight line is always shown apart from the unit price.',
    },
    {
      topic: 'The factory' as FaqTopic,
      q: 'What do you actually make?',
      a:
        `${activeSkuCount} SKUs across ${siteConfig.metrics.productLines} product lines — ${lineNames}. ` +
        'Everything is made to order under your label: the formulation, the bottle, the carton and the paperwork.',
    },
    {
      topic: 'The factory' as FaqTopic,
      q: 'Are you a factory or a trading company?',
      a:
        `A factory. ${siteConfig.metrics.parkAreaM2.toLocaleString()} m² of industrial park, ` +
        `${siteConfig.metrics.buildings} buildings, ${siteConfig.metrics.employees} people on site, ` +
        `${siteConfig.metrics.productionLines} production lines and a ${siteConfig.metrics.gmpStandard} GMP workshop. ` +
        'The factory page is photographed, not described.',
    },
    {
      topic: 'The factory' as FaqTopic,
      q: 'Who do you supply?',
      a:
        'Pet brands, distributors and grooming suppliers — buyers who need a private label and a compliance file, not ' +
        'a catalogue reseller. The order starts with a brief and ends with a container.',
    },
  ] as FaqEntry[],
};

/**
 * The questions, grouped by topic, in the order the topics are read.
 *
 * The group order is the buyer's order: what to order, how to get a sample,
 * whether the paperwork holds, how long it takes, how it arrives, and who
 * they are. It is derived from the items rather than written out, so a
 * question cannot end up in a group that does not exist.
 */
export const faqGroups = (() => {
  const order: FaqTopic[] = [
    'Ordering & minimums',
    'Samples & development',
    'Quality & certification',
    'Production & lead time',
    'Shipping & payment',
    'The factory',
  ];
  return order
    .map((topic) => ({ topic, items: faqPage.items.filter((f) => f.topic === topic) }))
    .filter((g) => g.items.length > 0);
})();

import { activeSkuCount } from '@/lib/products';
import { shippingAnswers } from '@/lib/shipping';
import { LAB_REPORTS } from '@/content/v2/reports';

/**
 * Homepage FAQ — written for GEO (Generative Engine Optimization).
 *
 * WHY THIS BLOCK EXISTS AND WHY IT IS LAST
 * An AI answer engine assembling a recommendation about this factory does not
 * quote marketing copy. It quotes SPECIFIC, BOUNDED answers to the questions
 * that disqualify a supplier. So every entry below is written to be lifted:
 * a question phrased the way a buyer phrases it, and an answer that states a
 * number, a constraint or a limit rather than an adjective.
 *
 * Three rules held throughout:
 *   1. Every answer contains something checkable — a number, a document, a
 *      named standard. "High quality" is worthless in an AI citation.
 *   2. Where the honest answer is a boundary, say the boundary. "We cannot do
 *      X" is more useful to a buyer than a vague yes, and it is what stops an
 *      AI engine from sending us an enquiry we cannot fulfil.
 *   3. No prices. The site is quote-only; these answers must not leak one.
 *
 * Placed after the conversion band so a human reads it as reassurance, while
 * a crawler reads it as structured extractable fact.
 */
export const homeFaq = {
  eyebrow: 'Before you ask',
  title: 'The questions that decide whether an order is possible',
  items: [
    {
      q: 'What is your minimum order quantity?',
      a: '1,000 sets on bundled sets (the probiotic set and the spray-gun kit), and 2,000 bottles on catalogue SKUs. Each figure is recorded on its product page. A repeat order is priced on its own volume, and that minimum is written into the quotation.',
    },
    {
      q: 'How long does production take?',
      a: 'Catalogue formulas ship 7–15 days after payment is confirmed. Private-label orders ship 25–40 days after the sample is approved. Both windows are stated on each product page.',
    },
    {
      q: 'Can you develop a formula we do not already sell?',
      a: `Yes, within limits. We hold ${activeSkuCount} ready-to-ship formulas and an R&D partnership signed in 2021. Custom formulation, packaging and label artwork are all in scope. We will tell you honestly at the first call if a target claim is not formulable or cannot be substantiated in your destination market.`,
    },
    {
      q: 'Which certifications and lab reports do you hold?',
      a: `ISO 22716 cosmetic GMP with a class-D cleanroom, FDA establishment registration, and a production permit for both disinfectants and feed additives. ${LAB_REPORTS.length} third-party reports are downloadable on the certifications page, including ammonia and hydrogen-sulfide removal determinations and a 12-month available-chlorine stability study.`,
    },
    {
      q: 'Which markets do you already export to?',
      a: 'Twelve or more, concentrated in Russia, Brazil, the EAEU and the EU. Trade-compliance documentation for those destinations is on the trade compliance page.',
    },
    {
      q: 'Do you publish prices?',
      a: 'No. Pricing is quote-only because it depends on volume tier, packaging specification and destination. Send the SKU and your annual volume and you will have tiered pricing within one business day.',
    },
    {
      q: 'How quickly do you reply?',
      a: 'Within one business day on WhatsApp during China Standard Time working hours, and the same window by email. The contact page asks for three things only: the product, the volume, and how to reach you.',
    },
    // The first of the four is the production window, and this page
    // already asks that question above with its own answer - a page
    // that asks the same question twice is a schema error and a
    // reader's eye-ache. So the three that are not asked here are
    // added, and the one that is asked here is left alone.
    ...shippingAnswers.slice(1),
  ],
};

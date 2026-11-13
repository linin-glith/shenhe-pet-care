/**
 * THE BUYER'S JOURNEY, IN FIVE STAGES.
 *
 * WHY THESE FIVE PAGES EXIST
 *
 * The site answered every one of these questions — somewhere. The trade terms
 * page carried the payment terms, the trade programme page carried the
 * reorder cadence, the capabilities page carried the QC steps, the shipping
 * record carried the channels and the transit times, the terms of service
 * carried the acceptance window.
 *
 * But a buyer does not read the site by topic. They read it by stage:
 *
 *   1. what will it cost me, and what am I agreeing to   -> /quotation.html
 *   2. how do I get a sample, and what does that cost      -> /samples.html
 *   3. how is it made, and who checks it                    -> /production.html
 *   4. how does it get to me, and what clears customs      -> /shipping.html
 *   5. what happens if it is wrong, and how do I reorder   -> /after-sales.html
 *
 * Each of those five answers was on the site, scattered. A buyer who has
 * decided to order does not go looking through the footer for the paragraph
 * about the bill of lading — they arrive from a search with one question.
 *
 * So the five pages put one stage each on a page of its own, with the
 * question the buyer actually typed as the H1.
 *
 * WHY THE ORDER IS WRITTEN DOWN HERE
 *
 * The footer links all five on every page, and the build gate checks that
 * they are there, that each has exactly one H1 in the buyer's question
 * form, and that none of them publishes a unit price. A list that lives in
 * one place and is checked by one gate cannot lose a page.
 */

export type JourneyStage = {
  /** The path the page is published at. */
  href: string;
  /** The label the footer and the journey rail use. */
  label: string;
  /** The buyer's question, which is the H1 of the page. */
  question: string;
};

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    href: '/quotation.html',
    label: 'Quotation and terms',
    question: 'What will my order cost, and what am I agreeing to?',
  },
  {
    href: '/samples.html',
    label: 'Samples and approval',
    question: 'How long does a sample take, what does it cost, and what am I signing off?',
  },
  {
    href: '/production.html',
    label: 'Production and inspection',
    question: 'How do you make my order, and who checks it before it ships?',
  },
  {
    href: '/shipping.html',
    label: 'Shipping and customs',
    question: 'How does my order leave the factory and clear customs?',
  },
  {
    href: '/after-sales.html',
    label: 'After-sales and reorders',
    question: 'What happens if a batch fails, and how do I reorder?',
  },
];

/** One stage, by its path. */
export const stageByHref = (href: string): JourneyStage | undefined =>
  JOURNEY_STAGES.find((s) => s.href === href);

/**
 * What buyers said.
 *
 * WHY THIS FILE EXISTS, AND WHY THE LIST IS EMPTY
 *
 * A search engine shows a price and a star rating next to a product
 * result. Google will only show a star rating when the reviews are real:
 * "Self-serving reviews are not allowed for products or services" - a
 * factory that writes its own praise about its own products is exactly
 * what that rule forbids, and a site that does it can be penalised for
 * the whole product set, not just for the page.
 *
 * So the reviews here are the BUYERS' words, recorded after a real order,
 * with the buyer's permission to publish them. There is none yet, because
 * no buyer has agreed to one. **An empty list is the honest state**, and
 * it is not a gap to be filled with something plausible.
 *
 * WHY THE DATA IS A JSON FILE
 * The build gate has to be able to read it without running TypeScript,
 * because the gate is what stands between a real review and a review
 * that was never given. So the records live in reviews.json and this file
 * types them.
 *
 * WHAT A RECORD IS
 *
 * Every field is something only the buyer can supply. There is no default
 * and no fallback: a record that is missing a field is not published, and
 * the gate says so by name.
 *
 *   sku        the catalogue SKU the buyer bought
 *   author     the buyer's own name, or their company
 *   rating     the buyer's own number, 1 to 5
 *   body       the buyer's own words
 *   date       when the buyer said it
 *   permission 'published' once the buyer has agreed, 'pending' until then
 *
 * WHY permission IS A FIELD AND NOT A STEP
 * A review that has arrived but has not been cleared is a real thing that
 * happens, and losing it because there was nowhere to put it is how
 * reviews go missing. A 'pending' record is kept, never shown, and never
 * in the structured data.
 *
 * WHERE A RECORD COMES FROM
 * The buyer is asked, in writing, after a delivery. The factory asks; it
 * does not write. The template is in docs/买家评价接入流程.md.
 *
 * WHAT MUST NOT HAPPEN HERE
 * - no review is written, drafted or polished by us
 * - no review is edited after the buyer wrote it (a typo stays a typo)
 * - no review is attributed to anyone who did not write it
 * - a rating is never averaged with anything, and never rounded up
 */

import records from '@/content/v2/reviews.json';

export type ReviewPermission = 'published' | 'pending';

export type BuyerReview = {
  /** The catalogue SKU the buyer bought. */
  sku: string;
  /** The buyer's own name, or the company they bought for. */
  author: string;
  /** The company, when the buyer agreed to name it. */
  company?: string;
  /** The buyer's own number: 1 to 5. */
  rating: number;
  /** The buyer's own words. Not edited, not translated silently. */
  body: string;
  /** When the buyer said it. ISO date (YYYY-MM-DD). */
  date: string;
  /** The order or enquiry it came from. How the review is traced back. */
  orderRef?: string;
  /** 'published' once the buyer has agreed to be quoted. */
  permission: ReviewPermission;
};

/**
 * The reviews.
 *
 * Empty until a buyer agrees to be quoted. The publishing order is
 * decided by the date, not by the order here.
 */
export const REVIEWS: BuyerReview[] = records as BuyerReview[];

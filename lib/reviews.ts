/**
 * The buyers' reviews, and the one number that comes out of them.
 *
 * WHY THE LOGIC IS IN ONE PLACE
 * A review can end up in three places: the visible block on the product
 * page, the structured data next to it, and the machine-readable record
 * the reading assistants are pointed at. If those three counted the
 * reviews separately, they would disagree — and Google compares the
 * rating in the markup with the reviews on the page. A count that is one
 * too high is a rich result that gets thrown away, and one that is one
 * too low is a rating the page does not support.
 *
 * So there is one list, one filter and one arithmetic, and everything
 * else reads them.
 *
 * THE RULE THAT MATTERS MOST
 * A review that has not been cleared is kept and not shown. It is not in
 * the block, not in the markup, and not in the count. That is the whole
 * difference between "we have a review waiting for the buyer's yes" and
 * "we published a review the buyer never agreed to".
 */

import { REVIEWS, type BuyerReview } from '@/content/v2/reviews';

/** The reviews of one SKU that the buyers agreed to be quoted. */
export function reviewsForSku(sku: string): BuyerReview[] {
  return REVIEWS.filter((r) => r.sku === sku && r.permission === 'published').sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

/** Every published review, across the catalogue. */
export function allPublishedReviews(): BuyerReview[] {
  return REVIEWS.filter((r) => r.permission === 'published');
}

/**
 * The rating summary, the way a search result shows it.
 *
 * THE AVERAGE IS THE AVERAGE
 * It is computed from the ratings that are published, and rounded to one
 * decimal place - never up. Google checks this number against the
 * individual reviews, and a factory that rounds 4.4 up to 4.5 is doing
 * the one thing a rating must never do.
 */
export function ratingSummary(reviews: BuyerReview[]): {
  count: number;
  value: number;
  bestRating: number;
  worstRating: number;
} {
  if (!reviews.length) {
    return { count: 0, value: 0, bestRating: 5, worstRating: 1 };
  }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const value = Math.round((total / reviews.length) * 10) / 10;
  return { count: reviews.length, value, bestRating: 5, worstRating: 1 };
}

/**
 * The review as the structured data needs it.
 *
 * The author's name is the buyer's own. A review with no name is not
 * published: Google's review guidelines want a real person or company
 * behind every review, and an anonymous one is not something the engine
 * will show.
 */
export function reviewSchema(review: BuyerReview) {
  return {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(review.rating),
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': review.company ? 'Organization' : 'Person',
      name: review.company ?? review.author,
    },
    datePublished: review.date,
    reviewBody: review.body,
  };
}

import { activeSkuCount } from '@/lib/products';
import { shippingAnswers } from '@/lib/shipping';

/**
 * Catalogue FAQ — GEO layer for the products page.
 *
 * The catalogue is where a buyer decides whether to continue, so these
 * answers target the objections that stop browsing: can I afford the minimum,
 * will it arrive before my season, and can I put my own brand on it.
 *
 * Same discipline as the homepage FAQ: every answer carries a number, a
 * document or an honest boundary, and none carries a price.
 */
export const catalogueFaq = {
  eyebrow: 'Ordering',
  title: 'What you need to know before ordering',
  items: [
    {
      q: 'How many products are active?',
      a: `${activeSkuCount} active SKUs: disinfection and odor control, cleansing and grooming, and outdoor protection. Every SKU carries its own minimum order, lead time and full specification, and every one of them is on this page.`,
    },
    {
      q: 'What is the smallest order I can place?',
      a: '1,000 sets for the two bundled sets — the probiotic odor-control set and the spray-gun kit. Every other catalogue SKU starts at 2,000 bottles, packs or sachets. Both the figure and the unit are shown on each product card.',
    },
    {
      q: 'Can these be private-labelled?',
      a: 'Yes, across all three lines. Private label covers the formula, the bottle or carton artwork, and the EN / Chinese label compliance for your destination market. Custom formulation is also available for claims not already in the catalogue.',
    },
    {
      q: 'How quickly can you ship?',
      a: 'Stock catalogue formulas ship in 7–15 days. Private label runs 25–40 days including sampling and artwork approval. Both lead times are recorded per SKU on the product page.',
    },
    {
      q: 'Which certifications cover these products?',
      a: 'ISO 22716 cosmetic GMP with a class-D cleanroom covers the cleansing and pet-care lines. The disinfection line is additionally covered by a disinfectant production permit. Ten third-party lab reports and the factory audit are downloadable on the certifications page.',
    },
    {
      q: 'Do you publish unit prices?',
      a: 'No. Price depends on volume tier, packaging specification and destination, so it is quoted per RFQ rather than listed. Send a SKU and an annual volume and you will have tiered pricing within one business day.',
    },
    {
      q: 'Can I get samples before committing?',
      a: 'Yes. A physical sample plus a written specification sheet is the first stage of any project, and the sample cost is credited against the first production order.',
    },
    ...shippingAnswers,
  ],
};

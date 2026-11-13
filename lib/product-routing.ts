/**
 * Product routing — zero data dependencies.
 *
 * WHY THIS IS A SEPARATE FILE
 * `lib/products.ts` imports lib/products.json, and that record carries
 * b2b_price_rmb, the internal reference price. The site never displays a
 * price — the policy is quote-on-request — so that field must not reach the
 * browser.
 *
 * It reached the browser because three components are client components
 * ('use client'): the SKU card, the SKU composer and the enquiry form. A
 * client component importing anything from lib/products drags the whole
 * module graph — and therefore the whole record — into the client bundle,
 * even when the function it wants only reads a static route map. That is
 * what the price leak was.
 *
 * So the pure functions moved here. This module imports nothing, so
 * importing it costs a client bundle exactly nothing.
 */
export const PRODUCT_ROUTE: Record<string, string> = {
  P001: 'odor-control-set',
  P002: 'pet-deodorizing-spray',
  P003: 'pet-disinfectant-deodorizing-solution',
  P004: 'cat-ringworm-spray',
  P005: 'ear-mite-cleaning-solution',
  P006: 'probiotic-pet-tooth-cleaner',
  P007: 'cat-litter-companion',
  P008: 'cat-litter-partner-300',
  P009: 'pet-deodorizing-spray-gun-kit',
  P010: 'multi-purpose-pet-wash-300',
  P011: 'multi-purpose-pet-wash-200',
  P012: 'pet-shampoo-antibacterial-500',
  P013: 'pet-shampoo-antibacterial-300',
  P014: 'waterless-cleansing-foam-500',
  P015: 'pet-waterless-cleaning-foam',
  P016: 'pet-paw-cleaning-foam',
  P017: 'pet-household-laundry-detergent',
  P018: 'pet-paw-moisturizing-gel',
  P019: 'outdoor-protection',
  P020: 'outdoor-insect-repellent-spray',
};

/**
 * The display name of a product line.
 *
 * THIS MAP IS THE ONLY PLACE A LINE IS NAMED.
 *
 * It was duplicated: this module had one copy and lib/products.ts had
 * another, and they disagreed — "Deodorizing & Disinfection" here and
 * "Deodorizing & Disinfecting" there. The client components read this one and
 * the server components read that one, so the same product was called two
 * different things depending on which half of the page rendered it.
 *
 * The name is the product line page's own <h1>, which is also what the footer
 * links to. The SEO title of that page keeps its keyword phrasing
 * ("OEM Pet Deodorizing & Disinfection"); a title is a search phrase, a line
 * name is a product name, and the two are allowed to differ.
 */
export const LINE_LABEL: Record<string, string> = {
  deodorizing_disinfection: 'Deodorizing & Disinfecting',
  grooming_care: 'Grooming & Care',
  outdoor_protection: 'Outdoor Protection',
  pet_nutrition: 'Pet Nutrition',
};

/** The smallest shape these helpers need. */
export type RoutableProduct = {
  id: string;
  category?: string;
  line?: string;
};

/** The URL of a product page, or the catalogue anchor when it has none. */
export function productUrl(p: RoutableProduct): string {
  const slug = PRODUCT_ROUTE[p.id];
  return slug ? `/products/${slug}.html` : `/products.html#${p.category ?? ''}`;
}

/** True when this SKU has a page of its own. */
export function hasProductPage(id: string): boolean {
  return Boolean(PRODUCT_ROUTE[id]);
}

export function getLineLabel(slug: string): string {
  return LINE_LABEL[slug] ?? slug;
}

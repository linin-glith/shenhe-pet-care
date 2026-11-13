/**
 * The Inner Wellness line products — zero data dependencies.
 *
 * WHY THIS IS A SEPARATE FILE
 * These two records used to live in lib/products.ts, which imports
 * lib/products.json — the record carrying b2b_price_rmb. The breadcrumb
 * trail is a client component and needs these two products for the Pet
 * Nutrition branch of its trail, so reaching them through lib/products.ts
 * put the internal reference price into the browser bundle for every page of
 * the site.
 *
 * These records carry no price: they are quoted per project, not per unit.
 * Moving them here breaks the chain without losing anything.
 */
export type LineProduct = {
  slug: string;
  name: string;
  size: string;
  lead: string;
  moq: string;
  image: string;
  description: string;
};

export const LINE_PRODUCTS: Record<string, LineProduct> = {
  'pet-digestive-probiotics': {
    slug: 'pet-digestive-probiotics',
    name: 'Pet Digestive Probiotics',
    size: '8 mL × 9 vials',
    lead: 'Triple-encapsulated Lactobacillus acidophilus for the canine and feline gut; 90%+ live arrival through stomach acid against about 30% for standard encapsulation, per COA — specification value, not third-party tested',
    moq: '1,000 vials',
    image: '/assets/img/products/pet-digestive-probiotics.png',
    description:
      'Pet Digestive Probiotics, 8 mL × 9 vials — triple-encapsulated Lactobacillus ' +
      'acidophilus for the canine and feline gut. MOQ 1,000 vials, quoted on request.',
  },
  'pet-immunoglobulin': {
    slug: 'pet-immunoglobulin',
    name: 'Pet Immunoglobulin (IgG)',
    size: '15 g × 8 sachets',
    lead: 'Bovine colostrum IgG with vitamins A and E; IgG ≥49 g/kg, vitamin A ≥200,000 IU/kg and vitamin E ≥2,520 mg/kg per COA — specification value, not third-party tested',
    moq: '1,000 sachets',
    image: '/assets/img/products/pet-immunoglobulin.png',
    description:
      'Pet Immunoglobulin (IgG), 15 g × 8 sachets — bovine colostrum IgG ≥49 g/kg ' +
      'with vitamins A and E, per batch COA. MOQ 1,000 sachets, quoted on request.',
  },
};

/** The line product behind a page slug, if there is one. */
export function lineProductBySlug(slug: string): LineProduct | undefined {
  return LINE_PRODUCTS[slug];
}

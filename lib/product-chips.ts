/*
 * THE THREE PILLS ON EVERY SKU PAGE.
 *
 * A distributor scanning a line opens four pages of the same product in
 * different sizes and has to read a specification table on each to tell them
 * apart. These three labels are the answer to "what is this, in one look":
 * what it is made of, where it is meant to go, and what it was measured at.
 *
 * They live here rather than in the page template because two readers want
 * them: the hero renders them as pills for the buyer, and lib/seo/schema.ts
 * emits them as `additionalProperty` for the assistant that will never see
 * the pill row. Two copies of this vocabulary would drift within a month.
 *
 * WHERE THE WORDS COME FROM
 *
 * Every label is a phrase the record already carries and the page already
 * proves further down - `function_en`, `application`, `specification`, or the
 * report figure in the page's own measured line. None of them states a number
 * that is not on the page, a quantity that is not published, or a benefit
 * nobody measured: a pill that says "kills 99.9%" when the report says
 * something else would be the cheapest way to lose the whole page's
 * credibility.
 *
 * The order is the same on every page - mechanism, surface, form - so the
 * third pill is where a reader looks for the size, and the first is where
 * they look for the reason to care.
 *
 * A page whose lead already carries the measured figure names the surface in
 * the second pill instead. The number twice in four lines is the tell of a
 * template, and the reader's second question is not "what else did it
 * measure" but "where do I put it".
 */
export const PRODUCT_CHIPS: Record<string, string[]> = {
  P001: ['probiotic + enzyme', 'waste, litter & bedding', '1 spray + 2 refills'],
  P002: ['bio-enzyme', 'coats, floors & bedding', 'safety-assessed for licking'],
  P003: ['cleans + deodorizes', 'surfaces & equipment', 'claims where registered'],
  P004: ['antifungal', 'ringworm fungi', 'cat bedding & litter'],
  P005: ['dissolves ear wax', 'ear-mite care', 'gentle on the canal'],
  P006: ['probiotic', 'in the drinking water', 'plaque & breath'],
  P007: ['absorbs + decomposes', 'faster clumping', 'extends litter life'],
  P008: ['absorbs + decomposes', 'faster clumping', 'extends litter life'],
  P009: ['retail bundle', 'refill + spray gun', '220 mL × 2'],
  P010: ['gentle wash', 'antibacterial', 'routine bath'],
  P011: ['gentle wash', 'antibacterial', 'routine bath'],
  P012: ['cleansing + conditioning', 'cats & dogs', '500 mL'],
  P013: ['antibacterial', 'mite control', 'skin-problem relief'],
  P014: ['waterless', 'spot clean', 'paws & travel'],
  P015: ['waterless', 'spot clean', 'paws & travel'],
  P016: ['paw wash', 'before & after walks', '200 mL'],
  P017: ['pet hair + odor', 'bedding & clothing', '1.5 kg'],
  P018: ['moisturizes + repairs', 'cracked pads', '10 g sachet'],
  P019: ['insect repellent', 'walks & hiking', '80 mL'],
  P020: ['mosquito & insect', 'walks & hiking', '80 mL'],
};

/**
 * What a buyer actually types.
 *
 * WHY THIS FILE EXISTS
 * The catalogue names are the names on the packs: "Power Odor Eliminator
 * (Extra Strength)", "Cat Litter Partner — Deodorizing Powder 500 g". They
 * are correct, they are what the label says, and they are what a buyer
 * cannot type — nobody searches for "Power Odor Eliminator". A buyer types
 * "OEM pet deodorizing spray 350 mL", "private label cat litter deodorizer",
 * "pet shampoo manufacturer china".
 *
 * So the catalogue name stays where it belongs — the H1, the Product schema,
 * the specification table, the AI files — and the PHRASE goes where the buyer
 * is looking: the page title, the meta description and the first question of
 * the FAQ.
 *
 * WHAT IS IN HERE
 *   primary — the phrase the page title is built from. It always carries the
 *             sourcing term (OEM / private label) and the product category,
 *             because that is what a B2B buyer filters on.
 *   also    — the other ways the same product is asked for. These are not
 *             stuffed into the page; they are published in llms.txt as the
 *             buyer vocabulary, which is what lets an answer engine connect
 *             the question it was asked to the SKU that answers it.
 *
 * THE RULES
 *   - No claim the catalogue does not carry. "Anti-mite" is there because the
 *     formula says mite control; "flea" is not there because nothing on the
 *     label says flea.
 *   - The phrase never replaces the product name. It sits beside it.
 *   - One SKU, one phrase. Two SKUs of the same family (300 g / 500 g litter
 *     powder) share a phrase and differ by size, which is how a buyer asks
 *     for them anyway.
 */

export type QueryEntry = {
  /** The phrase the page title is built from. */
  primary: string;
  /** The other ways a buyer asks for the same thing. */
  also: string[];
};

/** SKU id -> the phrase a buyer types for it. */
export const SKU_QUERIES: Record<string, QueryEntry> = {
  P001: {
    primary: 'Probiotic Bio-Enzyme Pet Odor Control Set',
    also: [
      'pet odor eliminator manufacturers',
      'pet odor control set manufacturers',
      'OEM bio-enzyme deodorizer set',
      'OEM pet odor control set','private label pet deodorizing gift set', 'probiotic deodorizing spray set', 'pet odor control set bulk'],
  },
  P002: {
    primary: 'Pet Deodorizing Spray',
    also: [
      'pet odor eliminator manufacturers',
      'pet deodorizer manufacturers',
      'OEM pet odor eliminator spray',
      'OEM pet deodorizing spray',
      'dog deodorizing spray',
      'cat urine odor spray private label',
      'pet odor eliminator bulk',
      /* The brand asked for. A buyer who has heard of us and wants the
         deodorizer types the brand in front of the product - these are the
         highest-intent words on the site, and until now they were in no
         vocabulary at all. */
      'shenhe zhongke pet deodorizing spray',
      'shenhe zhongke odor eliminator 350 mL',
      '净味小子 除臭喷雾',
      'cat litter odor control set',
      'private label pet odor control for cats',
      'cat litter deodorizing set bulk',
      'cat litter box deodorizer spray bulk',
      'private label cat deodorizing spray manufacturers'
    ],
  },
  P003: {
    primary: 'Pet Disinfectant Spray',
    also: [
      'pet disinfectant manufacturers',
      'OEM pet disinfectant manufacturers',
      'OEM pet disinfectant spray','pet disinfectant manufacturers', 'chlorine dioxide pet disinfectant', 'kennel disinfectant bulk'],
  },
  P004: {
    primary: 'Cat Ringworm Antifungal Spray',
    also: [
      'pet antifungal spray manufacturers',
      'OEM pet antifungal spray',
      'OEM cat ringworm antifungal spray','pet antifungal spray', 'feline ringworm treatment private label', 'cat fungus spray bulk', 'cat ringworm spray manufacturers', 'private label cat antifungal spray china'],
  },
  P005: {
    primary: 'Pet Ear Cleansing Solution',
    also: [
      'pet ear cleaner manufacturers',
      'OEM pet ear cleaner',
      'OEM pet ear cleansing solution','dog ear cleaner', 'pet ear mite drops', 'ear cleansing solution bulk'],
  },
  P006: {
    primary: 'Probiotic Pet Dental Water',
    also: [
      'pet mouthwash manufacturers',
      'OEM pet mouthwash',
      'OEM probiotic pet dental water','pet mouthwash', 'dog dental water private label', 'probiotic dental care bulk'],
  },
  P007: {
    primary: 'Cat Litter Deodorizer Powder',
    also: [
      'cat litter deodorizer manufacturers',
      'OEM cat litter deodorizer powder','cat litter deodorizer bulk', 'litter box odor powder private label', 'cat litter deodorizing powder', 'cat litter deodorizer manufacturers', 'private label cat litter deodorizer powder'],
  },
  P008: {
    primary: 'Cat Litter Deodorizer Powder',
    also: [
      'cat litter deodorizer manufacturers',
      'OEM small pack cat litter deodorizer',
      'OEM cat litter deodorizer powder 300 g','cat litter deodorizer 300 g', 'litter deodorizer powder bulk', 'small pack cat litter deodorizer', 'cat litter deodorizer 300 g private label', 'small pack cat litter deodorizer suppliers'],
  },
  P009: {
    primary: 'Pet Deodorizing Spray Gun Kit',
    also: [
      'pet deodorizing sprayer manufacturers',
      'OEM pet odor eliminator sprayer',
      'OEM pet deodorizing spray gun kit','professional pet deodorizing sprayer', 'pet deodorizing spray gun bulk', 'refillable odor control sprayer'],
  },
  P010: {
    primary: 'Multi-Purpose Pet Wash',
    also: [
      'pet shampoo manufacturers',
      'OEM pet shampoo manufacturers',
      'OEM multi-purpose pet wash','pet shampoo manufacturers', 'dog wash bulk', 'pet body wash private label'],
  },
  P011: {
    primary: 'Multi-Purpose Pet Wash',
    also: [
      'pet shampoo manufacturers',
      'OEM small size pet shampoo bulk',
      'OEM multi-purpose pet wash 200 mL','pet wash 200 mL', 'small size pet shampoo bulk', 'travel pet wash private label'],
  },
  P012: {
    primary: 'Pet Shampoo for Cats and Dogs',
    also: [
      'pet shampoo manufacturers',
      'dog shampoo manufacturers',
      'cat shampoo manufacturers',
      'pet shampoo OEM suppliers',
      'OEM private label pet shampoo',
      'OEM pet shampoo','cat and dog shampoo bulk', 'pet shampoo manufacturers china', 'conditioning pet shampoo private label', 'cat shampoo manufacturers', 'private label cat shampoo', 'cat shampoo suppliers china'],
  },
  P013: {
    primary: 'Antibacterial Pet Shampoo with Mite Control',
    also: [
      'pet shampoo manufacturers',
      'medicated pet shampoo manufacturers',
      'OEM anti mite pet shampoo',
      'OEM antibacterial pet shampoo','anti mite pet shampoo', 'pet shampoo 300 mL bulk', 'medicated pet shampoo private label'],
  },
  P014: {
    primary: 'Waterless Pet Shampoo Foam',
    also: [
      'waterless pet shampoo manufacturers',
      'OEM dry pet shampoo',
      'OEM waterless pet shampoo foam','dry pet shampoo', 'no rinse pet cleanser', 'waterless pet shampoo 500 mL'],
  },
  P015: {
    primary: 'Waterless Pet Shampoo Foam',
    also: [
      'waterless pet shampoo manufacturers',
      'OEM no rinse pet cleanser',
      'OEM waterless pet shampoo foam 300 mL','waterless pet shampoo 300 mL', 'dry bath for dogs', 'no rinse pet foam bulk'],
  },
  P016: {
    primary: 'Pet Paw Cleansing Foam',
    also: [
      'pet paw cleaner manufacturers',
      'OEM dog paw cleaner',
      'OEM pet paw cleansing foam','dog paw cleaner', 'paw wash private label', 'paw foam bulk'],
  },
  P017: {
    primary: 'Pet Laundry Detergent',
    also: [
      'pet laundry detergent manufacturers',
      'OEM pet safe laundry detergent',
      'OEM pet laundry detergent','pet safe laundry detergent', 'pet hair laundry powder', 'laundry detergent bulk private label'],
  },
  P018: {
    primary: 'Pet Paw Moisturizing Gel',
    also: [
      'dog paw balm manufacturers',
      'pet paw balm manufacturers',
      'OEM dog paw balm',
      'OEM pet paw moisturizing gel','dog paw balm', 'paw pad repair gel', 'pet paw moisturizer bulk'],
  },
  P019: {
    primary: 'Pet Outdoor Protection Spray',
    also: [
      'pet outdoor protection manufacturers',
      'OEM dog outdoor spray',
      'OEM pet outdoor protection spray','dog outdoor spray', 'plant based insect repellent for pets', 'outdoor pet spray bulk'],
  },
  P020: {
    primary: 'Pet Insect Repellent Spray',
    also: [
      'mosquito repellent for dogs manufacturers',
      'pet insect repellent manufacturers',
      'OEM mosquito repellent for dogs',
      'OEM pet insect repellent spray','mosquito repellent for dogs', 'citronella pet repellent', 'pet insect repellent bulk'],
  },
};

/**
 * The brand itself, as a thing people search for.
 *
 * WHY THIS EXISTS
 *
 * Every other record on this page is a product or a page. The brand was
 * nowhere, so a buyer who had heard of us - or who wanted to check whether
 * we are real before writing - had nothing on the site written for them.
 * The words they would use are the company name, in the spellings people
 * actually type, and the brand's Chinese name.
 *
 * The page that answers them is the about page, which is the company's own
 * page: what it is, how it works, what it makes.
 */
export const BRAND_QUERIES: QueryEntry = {
  primary: 'Shenhe Zhongke Pet Care Manufacturers',
  also: [
    'shenhe zhongke',
    'shenhe zhongke pet care manufacturers',
    'shenhe zhongke pet care OEM factory',
    'shenhe zhongke factory',
    'shenhe zhongke reviews',
    'shenhezhongke',
    '深河中科',
    '深河中科 宠物用品',
    '广东深河中科生物科技',
  ],
};

/** The four line pages, by slug. */
export const LINE_QUERIES: Record<string, QueryEntry> = {
  'deodorizing-disinfecting': {
    primary: 'Pet Deodorizing & Disinfection Products',
    also: [
      'pet odor eliminator manufacturers',
      'pet deodorizer manufacturers',
      'pet disinfectant manufacturers',
      'OEM pet odor control manufacturers',
      'OEM pet deodorizing products','pet odor control manufacturers', 'pet disinfectant suppliers', 'pet hygiene products bulk',
      /* The same route, in the words buyers outside China use. White label
         autocompletes with uk and australia attached, and the UK spelling of
         private label is private labelling — neither word was on the site. */
      'private label pet deodorizer manufacturers', 'white label pet deodorizer', 'private labelling pet products'],
  },
  'grooming-care': {
    primary: 'Pet Grooming & Cleansing Products',
    also: [
      'dog shampoo manufacturers',
      'pet shampoo manufacturers',
      'pet grooming products manufacturers',
      'OEM pet shampoo manufacturers',
      'OEM pet grooming products','pet shampoo manufacturers', 'pet grooming products bulk', 'pet cleansing suppliers',
      'private label pet shampoo manufacturers', 'white label pet shampoo', 'private labelling pet shampoo'],
  },
  'outdoor-protection': {
    primary: 'Pet Outdoor Protection Products',
    also: [
      'pet insect repellent manufacturers',
      'pet outdoor protection manufacturers',
      'OEM pet insect repellent manufacturers',
      'OEM pet outdoor protection','pet insect repellent manufacturers', 'outdoor pet products bulk', 'natural repellent suppliers'],
  },
  'pet-nutrition': {
    primary: 'Pet Nutrition & Supplement Products',
    also: [
      'pet supplement manufacturers',
      'pet nutrition products manufacturers',
      'OEM pet supplement manufacturers',
      'OEM pet nutrition products','pet supplement manufacturers', 'pet probiotics bulk', 'pet nutrition products suppliers',
      'private label pet supplement manufacturers', 'white label pet supplements'],
  },
};

/**
 * The pages that carry no buyer vocabulary at all, by page slug.
 *
 * A page a buyer lands on from a search has to say what it is in the words
 * the buyer used. "Contact · SHENHE ZHONGKE" says nothing to anyone; "Get a
 * pet care OEM quote" says what the page is for.
 */
export const PAGE_QUERIES: Record<string, QueryEntry> = {
  'cat-care': {
    primary: 'Cat Care Manufacturers',
    also: [
      'cat care manufacturers',
      'cat supplies manufacturers',
      'private label cat products',
      'cat litter deodorizer bulk',
      'cat shampoo manufacturers',
      'pet care OEM for cat brands',
    ],
  },
  certifications: {
    primary: 'Pet Care Lab Reports & Certifications',
    also: [
      'pet care OEM certifications','pet product testing reports', 'ISO 22716 GMP certificate', 'third party pet product testing'],
  },
  contact: {
    primary: 'Contact the Pet Care Manufacturers',
    also: [
      'contact pet care OEM factory','request a pet care quote', 'pet product suppliers contact', 'pet care manufacturers enquiry'],
  },
  msds: {
    primary: 'Pet Product MSDS & SDS Sheets',
    also: [
      'pet care OEM safety data sheet','pet care safety data sheet', 'MSDS download pet products', 'pet product SDS request'],
  },
  'trade-compliance': {
    primary: 'Pet Product Export & Trade Terms',
    also: ['pet products incoterms', 'OEM payment terms pet care', 'pet supplier trade policy'],
  },
  'global-compliance': {
    primary: 'Pet Product Regulatory Compliance Support',
    also: [
      'pet product OEM compliance','FDA registration for pet products', 'EU CPNP pet cosmetics', 'pet product regulatory support'],
  },
  'sourcing-guides': {
    primary: 'Pet Product Sourcing Guides',
    also: [
      'pet care OEM sourcing guides','how to import pet products', 'pet care buyer guide', 'pet product import compliance'],
  },
  'ai-customize': {
    primary: 'AI Product Match for Pet Care Sourcing',
    also: [
      'pet care OEM product match','find the right pet care SKU', 'pet product matcher', 'which pet product should I source'],
  },
  blog: {
    primary: 'Pet Care Sourcing Guides & Insights',
    also: [
      'OEM pet care insights','pet care industry guide', 'pet product sourcing blog'],
  },
};

/**
 * The two products that have a page but no catalogue SKU, by page slug.
 *
 * They are quoted one at a time rather than out of the catalogue grid, but
 * they are still products a buyer searches for.
 */
export const LINE_PRODUCT_QUERIES: Record<string, QueryEntry> = {
  'pet-digestive-probiotics': {
    primary: 'Probiotic Pet Digestive Supplements',
    also: [
      'pet probiotics manufacturers',
      'pet digestive supplement manufacturers',
      'OEM probiotic pet powder private label',
      'OEM pet probiotics bulk','pet probiotics bulk', 'pet digestive supplement manufacturers', 'probiotic pet powder private label'],
  },
  'pet-immunoglobulin': {
    primary: 'Pet Colostrum IgG Supplements',
    also: [
      'pet immune support supplement manufacturers',
      'pet colostrum IgG manufacturers',
      'OEM pet immune support supplement manufacturers',
      'OEM pet colostrum IgG','pet immunoglobulin bulk', 'pet immune support supplement manufacturers', 'bovine colostrum IgG private label'],
  },
};

/**
 * The phrase without the sourcing term.
 *
 * "OEM Pet Deodorizing Spray" is what a page title needs. "Pet Deodorizing
 * Spray" is what a question needs — nobody asks "what is the MOQ for OEM pet
 * deodorizing spray".
 */
export function plainPhrase(primary: string): string {
  return primary.replace(/^OEM\s+/i, '');
}

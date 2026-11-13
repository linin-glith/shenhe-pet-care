import catLitterOdor from '../articles/why-does-cat-litter-smell.json';
import chooseShampoo from '../articles/how-to-choose-a-pet-shampoo.json';
import shampooIngredients from '../articles/pet-shampoo-ingredients-to-avoid.json';
import salonWholesale from '../articles/pet-salon-shampoo-wholesale.json';
import groomerBulk from '../articles/pet-groomer-bulk-supply.json';
import shelterWash from '../articles/shelter-and-rescue-pet-wash.json';
import waterlessVsWet from '../articles/waterless-foam-or-wet-shampoo.json';
import washCatAtHome from '../articles/washing-a-cat-at-home.json';
import oemChina from '../articles/how-to-choose-a-pet-care-oem-manufacturer-in-china.json';

/**
 * Article registry.
 *
 * A single typed array rather than a filesystem scan, because a static export
 * has to know every route at build time and a scan of an imported JSON folder
 * is not something the bundler can enumerate. Adding an article means adding
 * one import and one entry here — the alternative, a crawl of content/articles/,
 * silently omits anything the glob misses and that page never enters the
 * sitemap.
 *
 * The blog index reads this to decide whether it has content, and
 * `isEmptyIndex` in LegacyPage reads it too: an index with no entries is a
 * "coming soon" shell and stays noindex.
 *
 * ORDER IS THE READING ORDER — the index lists articles in this order. The
 * buying-decision and wholesale guides sit ahead of the general how-to because
 * they answer the questions closest to an order; the pain-point guides that
 * require laboratory evidence are deliberately absent until that evidence
 * exists, because a claim without a report is worse than no claim.
 */

export type ArticleCategory = 'sourcing' | 'compliance' | 'howto' | 'pet-care-notes';

export type ArticleMeta = {
  slug: string;
  category: ArticleCategory;
  title: string;
  summary: string;
  date: string;
};

/**
 * Where each guide's claims come from.
 *
 * A guide that states a specification, a minimum order or an efficacy figure
 * is making a claim, and a claim without a source is the thing an assistant
 * will not quote and a buyer will not trust. Each guide therefore names the
 * documents behind it, and links them.
 *
 * The links are real: a report number that identifies a document, the
 * catalogue record the figures come from, the page that says how we verify.
 * A guide that has no document behind a claim does not get one invented here
 * - it gets the sources it actually has.
 */
export const ARTICLE_SOURCES: Record<string, { label: string; href: string; note: string }[]> = {
  'why-does-cat-litter-smell': [
    { label: 'Report NACCYH25007027', href: '/reports/naccyh25007027.html', note: 'Ammonia removal, cat litter deodorizer (P007–P008)' },
    { label: 'Cat litter deodorizer, 300 g', href: '/products/cat-litter-partner-300.html', note: 'the formulation this guide describes' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'how-to-choose-a-pet-shampoo': [
    { label: 'Report 2024FM11612R01D', href: '/reports/2024fm11612r01d.html', note: 'Antibacterial performance of the wash family (P010–P011)' },
    { label: 'Multi-purpose pet wash, 300 mL', href: '/products/multi-purpose-pet-wash-300.html', note: 'the specification the guide reads from' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'pet-shampoo-ingredients-to-avoid': [
    { label: 'Report 2024FM11612R02D', href: '/reports/2024fm11612r02d.html', note: 'Ingredient disclosure for the wash family (P010–P011)' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'waterless-foam-or-wet-shampoo': [
    { label: 'Report 2024FM11612R01D', href: '/reports/2024fm11612r01d.html', note: 'Antibacterial performance of the wash family (P010–P011)' },
    { label: 'Waterless cleansing foam, 500 mL', href: '/products/waterless-cleansing-foam-500.html', note: 'the format the guide compares' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'washing-a-cat-at-home': [
    { label: 'Report 2024FM11612R01D', href: '/reports/2024fm11612r01d.html', note: 'Antibacterial performance of the wash family (P010–P011)' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'pet-salon-shampoo-wholesale': [
    { label: 'Report 2024FM11612R02D', href: '/reports/2024fm11612r02d.html', note: 'Ingredient disclosure for the wash family (P010–P011)' },
    { label: 'Sourcing guides', href: '/sourcing-guides.html', note: 'MOQ, sampling and lead time, explained' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'pet-groomer-bulk-supply': [
    { label: 'Report 2024FM11612R01D', href: '/reports/2024fm11612r01d.html', note: 'Antibacterial performance of the wash family (P010–P011)' },
    { label: 'Sourcing guides', href: '/sourcing-guides.html', note: 'MOQ, sampling and lead time, explained' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'shelter-and-rescue-pet-wash': [
    { label: 'Report 2024FM11612R01D', href: '/reports/2024fm11612r01d.html', note: 'Antibacterial performance of the wash family (P010–P011)' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
  'how-to-choose-a-pet-care-oem-manufacturer-in-china': [
    { label: 'Certifications and licences on file', href: '/certifications.html', note: 'the permits, with their numbers and validity dates' },
    { label: 'Trade compliance', href: '/trade-compliance.html', note: 'payment terms, incoterms and the shipping documents' },
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ],
};

/** The sources of a guide, or the one general source every guide carries. */
export function articleSources(slug: string): { label: string; href: string; note: string }[] {
  const specific = ARTICLE_SOURCES[slug] ?? [];
  if (specific.some((s) => s.href === '/standards.html')) return specific;
  return [
    ...specific,
    { label: 'How we verify', href: '/standards.html', note: 'every figure on this site, and where it comes from' },
  ];
}

type ArticleDoc = {
  slug: string;
  category: ArticleCategory;
  date: string;
  reviewedBy?: string;
  seo: { title: string; description: string };
  faq: { q: string; a: string }[];
  body: { type: string; html?: string; text?: string; items?: { title: string; body: string }[] }[];
  relatedProducts: { id: string; note: string }[];
};

const DOCS: ArticleDoc[] = [
  catLitterOdor as ArticleDoc,
  chooseShampoo as ArticleDoc,
  shampooIngredients as ArticleDoc,
  salonWholesale as ArticleDoc,
  groomerBulk as ArticleDoc,
  shelterWash as ArticleDoc,
  waterlessVsWet as ArticleDoc,
  washCatAtHome as ArticleDoc,
  oemChina as ArticleDoc,
];

export const ARTICLE_DOCS: Record<string, ArticleDoc> = Object.fromEntries(
  DOCS.map((d) => [d.slug, d]),
);

export const ARTICLES: ArticleMeta[] = DOCS.map((d) => ({
  slug: d.slug,
  category: d.category,
  date: d.date,
  title: d.seo.title,
  summary: d.seo.description,
}));

export function articleDoc(slug: string): ArticleDoc | undefined {
  return ARTICLE_DOCS[slug];
}
/**
 * Search intent to page mapping — the reverse of SKU_QUERIES.
 *
 * WHY THIS FILE EXISTS
 *
 * lib/seo/keywords.ts maps SKU → query (from the product outward).
 * This file maps intent → page (from the buyer's search inward).
 *
 * A buyer's journey has four stages, and each stage has a different
 * search pattern. Mapping the intent to the right landing page means
 * a buyer at any stage of the funnel lands on a page that matches
 * where they are — not on a product page when they are still
 * researching, and not on a blog post when they are ready to buy.
 *
 * This mapping is consumed by:
 *   - the topic cluster map (public/topic-cluster.json)
 *   - the AI manifest (public/.well-known/ai-manifest.json)
 *   - future internal-linking logic that connects intent to pages
 *   - the build-time check that every intent has a live landing page
 */

export type SearchIntent =
  | 'informational'    // 了解阶段：买家在研究"怎么做/怎么选"
  | 'commercial'       // 比较阶段：买家在比较"哪个产品/哪个供应商"
  | 'transactional'    // 询盘阶段：买家准备联系/报价
  | 'navigational';    // 品牌搜索：买家直接搜索公司名

export type FunnelStage = 'top' | 'middle' | 'bottom';

export type IntentMapping = {
  /** The search intent category. */
  intent: SearchIntent;
  /** The query phrase a buyer types. */
  query: string;
  /** The page that should serve this intent. */
  landingPage: string;
  /** The topic cluster this intent belongs to. */
  cluster: string;
  /** Where in the purchase funnel this sits. */
  funnelStage: FunnelStage;
  /** Whether the landing page currently exists. */
  exists: boolean;
};

/**
 * The full intent-to-page mapping.
 *
 * RULES:
 *   - Every query must have exactly one landing page.
 *   - The landing page must exist in the build output.
 *   - Informational intent → blog article or guide page (never a product page).
 *   - Commercial intent → product page or product line page.
 *   - Transactional intent → contact, AI customize, or quote page.
 *   - Navigational intent → about page or homepage.
 *   - A query that maps to a non-existent page is a gap to fill, not an
 *     error to hide. `exists: false` marks it so the build can report it.
 */
export const INTENT_MAP: IntentMapping[] = [
  // === Informational — 了解阶段 ===
  // 买家在研究"怎么选/怎么做"，承接搜索意图到博客和指南页面
  {
    intent: 'informational',
    query: 'how to choose a pet care OEM manufacturer in China',
    landingPage: '/blog/sourcing/how-to-choose-a-pet-care-oem-manufacturer-in-china.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'how to choose a pet shampoo',
    landingPage: '/blog/howto/how-to-choose-a-pet-shampoo.html',
    cluster: 'pet-grooming',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'pet shampoo ingredients to avoid',
    landingPage: '/blog/howto/pet-shampoo-ingredients-to-avoid.html',
    cluster: 'pet-grooming',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'how to wash a cat at home',
    landingPage: '/blog/howto/washing-a-cat-at-home.html',
    cluster: 'pet-grooming',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'waterless foam or wet shampoo for pets',
    landingPage: '/blog/howto/waterless-foam-or-wet-shampoo.html',
    cluster: 'pet-grooming',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'why does cat litter smell',
    landingPage: '/blog/pet-care-notes/why-does-cat-litter-smell.html',
    cluster: 'pet-deodorizing',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'pet groomer bulk supply guide',
    landingPage: '/blog/sourcing/pet-groomer-bulk-supply.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'pet salon shampoo wholesale',
    landingPage: '/blog/sourcing/pet-salon-shampoo-wholesale.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'shelter and rescue pet wash products',
    landingPage: '/blog/sourcing/shelter-and-rescue-pet-wash.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'what certifications should a pet care factory have',
    landingPage: '/certifications.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },
  {
    intent: 'informational',
    query: 'how does pet product OEM manufacturing work',
    landingPage: '/oem-odm.html',
    cluster: 'pet-care-oem',
    funnelStage: 'top',
    exists: true,
  },

  // === Commercial — 比较阶段 ===
  // 买家在比较产品和供应商，命中产品页面和产品线页面
  {
    intent: 'commercial',
    query: 'OEM pet deodorizing spray 350 mL',
    landingPage: '/products/pet-deodorizing-spray.html',
    cluster: 'pet-deodorizing',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'private label pet shampoo manufacturer China',
    landingPage: '/products/grooming-care.html',
    cluster: 'pet-grooming',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'OEM cat litter deodorizer powder bulk',
    landingPage: '/products/cat-litter-companion.html',
    cluster: 'pet-deodorizing',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'OEM pet disinfectant spray manufacturer',
    landingPage: '/products/pet-disinfectant-deodorizing-solution.html',
    cluster: 'pet-deodorizing',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'antibacterial pet shampoo OEM supplier',
    landingPage: '/products/pet-shampoo-antibacterial-500.html',
    cluster: 'pet-grooming',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'waterless pet shampoo foam manufacturer',
    landingPage: '/products/waterless-cleansing-foam-500.html',
    cluster: 'pet-grooming',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'OEM cat ringworm antifungal spray',
    landingPage: '/products/cat-ringworm-spray.html',
    cluster: 'pet-deodorizing',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'pet ear cleansing solution OEM supplier',
    landingPage: '/products/ear-mite-cleaning-solution.html',
    cluster: 'pet-grooming',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'OEM pet insect repellent spray',
    landingPage: '/products/outdoor-insect-repellent-spray.html',
    cluster: 'pet-outdoor-protection',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'OEM probiotic pet dental water',
    landingPage: '/products/probiotic-pet-tooth-cleaner.html',
    cluster: 'pet-grooming',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'pet care OEM manufacturer China',
    landingPage: '/oem-odm.html',
    cluster: 'pet-care-oem',
    funnelStage: 'middle',
    exists: true,
  },
  {
    intent: 'commercial',
    query: 'ISO 22716 GMP pet care factory',
    landingPage: '/factory.html',
    cluster: 'pet-care-oem',
    funnelStage: 'middle',
    exists: true,
  },

  // === Transactional — 询盘阶段 ===
  // 买家准备联系/报价，引导到转化页面
  {
    intent: 'transactional',
    query: 'request OEM pet care quote China',
    landingPage: '/contact.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'transactional',
    query: 'pet care OEM factory inquiry',
    landingPage: '/contact.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'transactional',
    query: 'pet product matching AI tool',
    landingPage: '/ai-customize.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'transactional',
    query: 'contact pet care OEM factory Heyuan',
    landingPage: '/contact.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },

  // === Navigational — 品牌搜索 ===
  // 买家直接搜索公司名
  {
    intent: 'navigational',
    query: 'shenhe zhongke pet care manufacturer',
    landingPage: '/about.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'navigational',
    query: 'shenhezhongke',
    landingPage: '/about.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'navigational',
    query: '深河中科',
    landingPage: '/about.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'navigational',
    query: 'shenhe zhongke factory Heyuan',
    landingPage: '/factory.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
  {
    intent: 'navigational',
    query: 'DEKOBIO pet care',
    landingPage: '/about.html',
    cluster: 'pet-care-oem',
    funnelStage: 'bottom',
    exists: true,
  },
];

/**
 * All queries for a given intent.
 */
export function queriesByIntent(intent: SearchIntent): IntentMapping[] {
  return INTENT_MAP.filter((m) => m.intent === intent);
}

/**
 * The landing page for a query, if one is mapped.
 */
export function landingPageForQuery(query: string): string | undefined {
  const mapping = INTENT_MAP.find(
    (m) => m.query.toLowerCase() === query.toLowerCase(),
  );
  return mapping?.landingPage;
}

/**
 * All queries that should land on a given page.
 *
 * This is used by the internal-linking logic: a page that is the
 * landing page for multiple queries is a high-priority page, and
 * should receive more internal links.
 */
export function queriesForPage(page: string): IntentMapping[] {
  const normalized = page.startsWith('/') ? page : `/${page}`;
  return INTENT_MAP.filter((m) => m.landingPage === normalized);
}

/**
 * The funnel stage of a page, based on the intents that target it.
 *
 * A page targeted by 'bottom' intents is a conversion page and gets
 * the highest internal-link priority. A page targeted by 'top'
 * intents is an educational page that should link down to commercial
 * and transactional pages.
 */
export function pageFunnelStage(page: string): FunnelStage | undefined {
  const queries = queriesForPage(page);
  if (queries.length === 0) return undefined;
  if (queries.some((q) => q.funnelStage === 'bottom')) return 'bottom';
  if (queries.some((q) => q.funnelStage === 'middle')) return 'middle';
  return 'top';
}

/**
 * Gaps in the intent map: queries whose landing page does not exist.
 *
 * These are content opportunities, not errors. The build reports them
 * so they are visible, but does not fail.
 */
export function intentGaps(): IntentMapping[] {
  return INTENT_MAP.filter((m) => !m.exists);
}

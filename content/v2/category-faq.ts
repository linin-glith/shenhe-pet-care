/**
 * 品类级的商务口径 —— "这一条产品线怎么下单"。
 *
 * 为什么需要这一层
 * 产品页已经 7/7 回答了 7 个采购意图，但买家不是从产品页开始看的：他先搜
 * "pet shampoo manufacturer"、"odor eliminator supplier"，落在品类页上。
 * 品类页此前只答 2–5 个意图（实测：cleansing 3/7、disinfection 2/7、
 * outdoor 4/7、pet_nutrition 5/7），并且四个品类**都**没有"样品"这一条。
 * 买家在品类页问不出样品，就不会走到产品页去问第二次。
 *
 * 这里不放任何一个新事实
 * 每条答案都是已经在别处发布过的口径的重述，出处写在各条注释里：
 *   - MOQ / 交期 / 报价 / 样品  → content/v2/catalogue-faq.ts
 *   - 文档清单                  → content/v2/category-copy.ts 的 outdoor 段
 *   - 成分与规格的位置          → 产品页的 productFacts() 六项事实
 * 品类级的差异只有一点：这些数字是"每个 SKU"的，不是"整条线"的，
 * 所以答案里必须把 per-SKU 说清楚，否则就是把 2,000 说成了整条线的门槛。
 *
 * 为什么不写价格
 * 全站 quote-only（siteConfig.pricing）。品类页更不该出现单价：
 * 一个品类里四个 SKU 有四个量档，任何一个单价在品类层面都是错的。
 */

export type FaqPair = { q: string; a: string };

export const COMMERCIAL_FAQ: FaqPair[] = [
  {
    // 出处：catalogue-faq "What is the smallest order I can place?" +
    // category-copy 的 "ordering two SKUs does not halve either minimum"
    q: 'What is the smallest order I can place from this line?',
    a:
      'The minimum order (MOQ) applies per SKU, not per shipment: 2,000 bottles, packs or sachets for a ' +
      'catalogue SKU, and 1,000 sets for the two bundled sets. Ordering two SKUs from this line does not ' +
      'halve either minimum, because each formulation needs its own production run and its own ' +
      'documentation. The exact figure and its unit are printed on every product page in this line.',
  },
  {
    // 出处：catalogue-faq "How quickly can you ship?"
    q: 'How long does production take for this line?',
    a:
      'Stock catalogue formulas in this line ship in 7–15 days. A private-label run takes 25–40 days ' +
      'measured from sample approval, because the artwork and the label compliance for your destination ' +
      'market have to be settled before the filling run is scheduled. Both figures are recorded per SKU ' +
      'on the product page.',
  },
  {
    // 出处：catalogue-faq "Do you publish unit prices?"
    q: 'Do you publish prices for this line?',
    a:
      'No. Price depends on volume tier, packaging specification and destination, so it is quoted per RFQ ' +
      'rather than listed. Send the SKUs you are considering and an annual volume, and you will have ' +
      'tiered pricing within one business day.',
  },
  {
    // 出处：catalogue-faq "Can I get samples before committing?"
    q: 'Can I get a sample from this line before ordering?',
    a:
      'Yes. A physical sample plus a written specification sheet is the first stage of any project, and ' +
      'the sample cost is credited against the first production order. A sample can be drawn from any ' +
      'SKU in this line, so the comparison between two formats is made on the product itself rather than ' +
      'on a description.',
  },
  {
    // 出处：category-copy outdoor 段的文档清单 + catalogue-faq 的十份报告
    q: 'What documentation ships with an order from this line?',
    a:
      'A batch-specific certificate of analysis, a 16-language safety data sheet, an ingredient and ' +
      'allergen declaration, and the commercial invoice with the HS code. The ten third-party laboratory ' +
      'reports covering the range are downloadable on the certifications page, and each report names the ' +
      'SKUs it covers so the claim can be checked rather than taken on trust.',
  },
  {
    // 出处：产品页 productFacts() 的六项事实（成分 / 规格 / MOQ / 交期 / 保质期 / 储存）
    q: 'Where do I find the ingredients and specification of a product in this line?',
    a:
      'Every product page in this line prints its full ingredient list, its pack size, its shelf life and ' +
      'its storage condition, read from the same catalogue record the quotation is built from. If a ' +
      'figure you need is not printed there, ask for it with the RFQ and it is answered from that record ' +
      'rather than estimated.',
  },
];

/**
 * 合并：品类自己的问答在前（它们带具体语境），商务口径补在后面。
 * 按问题文本去重，避免同一个问题在页面上出现两次 —— 重复的 Question
 * 会让 FAQPage 声明一个页面并没有更充分回答的问题。
 */
export function categoryFaq(existing: FaqPair[]): FaqPair[] {
  const seen = new Set(existing.map((x) => x.q));
  return [...existing, ...COMMERCIAL_FAQ.filter((x) => !seen.has(x.q))];
}

/** 商务口径里、品类自己的文案还没覆盖的那些（用于单独渲染成一块）。 */
export function commercialOnly(existing: FaqPair[]): FaqPair[] {
  const seen = new Set(existing.map((x) => x.q));
  return COMMERCIAL_FAQ.filter((x) => !seen.has(x.q));
}

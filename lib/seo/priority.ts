/**
 * WHAT THIS SITE IS PUSHING RIGHT NOW.
 *
 * WHY THIS IS A SEPARATE FILE
 *
 * Everything else in lib/seo/ is a fact: the catalogue says what the products
 * are, the routing says which page serves which SKU, the i18n config says
 * which languages exist. This file is a DECISION - what the factory wants
 * the market to remember - and a decision has to be written down in one
 * place, with a reason, so that nobody has to guess it from a diff.
 *
 * It is read by the keyword board (scripts/keyword_board.py), which marks
 * the cells that belong to the priority, and by the board's gate, which
 * refuses a build in which a priority cell has no fruit behind it.
 *
 * That is the point: a priority that is not enforced is a wish.
 *
 * 2026-10-28 — the decision:
 *   1. 深河中科, the brand itself. A factory that is unknown gets judged on
 *      its catalogue; a factory that is known gets judged on whether it can
 *      deliver. The brand is the first thing a buyer looks up.
 *   2. 喷雾除臭剂, the deodorizing spray (P002, SHENHE-OEM-DEO-SPRAY-350).
 *      It is the strongest product on the catalogue - enzyme and plant
 *      extracts, 94.2% ammonia removal (report NACCYH25014722), safety assessment 2024FM11611R02D - and it is the one a
 *      buyer can smell before they can read a certificate.
 *
 * A decision like this expires. When the next one is made, this file is
 * where it goes, and the board's numbers follow it.
 */
export type PriorityItem = {
  /** What the surface is, in the board's words. */
  surface: 'brand' | 'sku' | 'line' | 'line-product' | 'page';
  /** The SKU id, line slug or page slug. */
  ref: string;
  /** The name a person would use. */
  label: string;
  /** Why it is being pushed. */
  why: string;
};

export const PRIORITY: PriorityItem[] = [
  {
    surface: 'brand',
    ref: 'brand',
    label: '深河中科 / SHENHE ZHONGKE (the brand)',
    why: 'The brand is the first thing a buyer looks up, and the only thing ' +
      'a buyer remembers after the quote. Brand queries land on the about ' +
      'page, which has to carry the mark, the story and the proof.',
  },
  {
    surface: 'sku',
    ref: 'P002',
    label: '喷雾除臭剂 · Power Odor Eliminator (Extra Strength) 350 mL',
    why: 'The strongest product on the catalogue and the one a buyer can ' +
      'smell before they read a certificate. Its page is the flagship of ' +
      'the deodorizing line, and the brand-prefixed searches for it are ' +
      'the highest-intent words the site has.',
  },
];

/** The priority item for a surface, if it has one. */
export function priorityFor(surface: string, ref: string): PriorityItem | undefined {
  return PRIORITY.find((p) => p.surface === surface && p.ref === ref);
}

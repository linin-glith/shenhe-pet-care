/**
 * What each SKU has behind it, in the buyer's terms.
 *
 * WHY THIS FILE EXISTS
 * The catalogue has twenty SKUs and the laboratory has published ten
 * reports. The ten reports cover nine of the twenty. The other
 * eleven were, until this file existed, silently indistinguishable
 * from the nine - they simply had no report on their page, and a
 * buyer reading that could not tell "we have a report for this" from
 * "we have not had this tested".
 *
 * That is the difference a buyer is asked to act on, so it has to be
 * said out loud, on the product's own page.
 *
 * THE THREE CASES, AND WHY THEY ARE NOT ONE CASE
 *
 *   1. THE SAME FORMULA, A DIFFERENT SIZE.
 *      A laboratory report tests a formula. A 500 mL bottle and a
 *      300 mL bottle of the same formula are the same formula, and
 *      the report applies. But the report says which size was
 *      submitted, so the page says that too - the buyer is told the
 *      report is for the 300 mL sample, and that their 500 mL is the
 *      same formula in a different pack. Anything else would be
 *      claiming the test was run on something it was not.
 *
 *      WHICH SIZES QUALIFY IS DECIDED BY THE INGREDIENTS, NOT BY
 *      THE NAME. "Pet shampoo" and "multi-purpose pet wash" sound
 *      like the same product and are not: one adds silk protein to a
 *      surfactant base, the other carries nano silver ions, and a
 *      third is a botanical blend with no surfactant base at all.
 *      A report that was run on one of them says nothing about the
 *      others, and a buyer who asks us about it would find nothing in
 *      the document.
 *
 *   2. A DIFFERENT FORMULA THAT HAS NOT BEEN SUBMITTED.
 *      These get no report. Saying "the same report covers our
 *      range" would be false, and a buyer who asks us about it would
 *      find nothing in the document. They are told what testing can
 *      be arranged and what it takes.
 *
 *   3. NO REPORT EXISTS FOR THIS PRODUCT.
 *      Stated plainly. A buyer who is told "this one has not been
 *      tested, and here is how to get it tested" can act on it; a
 *      buyer who is told nothing cannot.
 *
 * WHAT IS NOT HERE
 * No claim that a report proves something it does not. A report that
 * tests antibacterial performance does not test shelf life, and the
 * wording says what the report is about, not what the product is.
 *
 * THE COUNTS
 * The number of SKUs with a report and the number without are
 * computed from the catalogue and this table, so they cannot drift
 * from each other. The build gate checks them.
 */

import { products } from '@/lib/products';

/** How a report relates to a SKU. */
export type Coverage = {
  /**
   * The report numbers for this exact SKU, in the order they should
   * be listed. Absent when the SKU has no report of its own.
   */
  reports?: string[];
  /**
   * The wording for a report that was run on another size of the
   * same formula. It names the size that was tested, so the buyer
   * knows what was submitted.
   */
  sameFormulaAs?: { reports: string[]; testedSize: string; sku: string };
  /** The wording when this SKU has no report. */
  noReport?: string;
  /** Whether testing can be arranged, and what it involves. */
  canBeTested?: boolean;
};

/**
 * THE COVERAGE, SKU BY SKU.
 *
 * The sizes come from the catalogue: P010 is 300 mL and P011 is
 * 500 mL of the same wash, so the report for P010 covers P011 as the
 * same formula in a different pack.
 */
export const COVERAGE: Record<string, Coverage> = {
  /* --- the eight with a report on this exact SKU --- */
  P001: { reports: ['NACCYH25014722', 'NACCYH25014721'] },
  P002: { reports: ['NACCYH25014722', 'NACCYH25014721', '2024FM11611R02D'] },
  P003: { reports: ['XJ2025001233', '2024FM11610R01D'] },
  P007: { reports: ['NACCYH25007027'] },
  P008: { reports: ['NACCYH25007027'] },
  P009: { reports: ['NACCYH25014722', 'NACCYH25014721'] },
  P010: { reports: ['2024FM11612R01D', '2024FM11612R03D', '2024FM11612R02D'] },
  P011: { reports: ['2024FM11612R01D', '2024FM11612R03D', '2024FM11612R02D'] },

  /* --- a formula of its own, not submitted --- */
  P012: {
    noReport:
      'This shampoo is a different formulation from our multi-purpose wash, which is the product the published reports were run on. It has not been submitted for testing. Testing can be arranged; we will confirm the sample, the method and the cost before anything is ordered.',
    canBeTested: true,
  },
  P013: {
    noReport:
      'This antibacterial, mite-control shampoo is a botanical formulation of its own and is not the product the published reports were run on. It has not been submitted for testing. Testing can be arranged; we will confirm the sample, the method and the cost before anything is ordered.',
    canBeTested: true,
  },
  P004: { reports: ['2024FM12662R01Da'] },
  P005: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P006: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P014: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P015: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P018: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },

  /* --- products with no report and none of their own to offer --- */
  P016: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P017: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P019: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
  P020: {
    noReport:
      'This formula has not been submitted for testing, and we will not put another product\'s report next to it. Testing can be arranged; we will confirm the sample, the method and the cost in writing before anything is ordered.',
    canBeTested: true,
  },
};

/** The coverage of one SKU, or null when the catalogue has none. */
export function coverageOf(skuId: string): Coverage | null {
  return COVERAGE[skuId] ?? null;
}

/** The SKUs that have a report for this exact SKU. */
export function coveredSkus(): string[] {
  return products
    .filter((p) => p.status !== 'inactive')
    .filter((p) => (COVERAGE[p.id]?.reports?.length ?? 0) > 0)
    .map((p) => p.id);
}

/** The SKUs that do not. */
export function uncoveredSkus(): string[] {
  return products
    .filter((p) => p.status !== 'inactive')
    .filter((p) => (COVERAGE[p.id]?.reports?.length ?? 0) === 0)
    .map((p) => p.id);
}

/** How many active SKUs have a report, and how many do not. */
export function coverageCounts(): { covered: number; uncovered: number; total: number } {
  const all = products.filter((p) => p.status !== 'inactive');
  const covered = all.filter((p) => (COVERAGE[p.id]?.reports?.length ?? 0) > 0).length;
  return { covered, uncovered: all.length - covered, total: all.length };
}

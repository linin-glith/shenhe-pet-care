/**
 * The product series: one product, several sizes.
 *
 * WHY THIS FILE EXISTS
 * The catalogue carries twenty SKUs. Three of them are the same product
 * in different sizes - Cat Litter Partner in 300 g and 500 g, Multi-
 * Purpose Pet Wash in 200 mL and 300 mL, No-Rinse Cleansing Foam in
 * 300 mL and 500 mL. A crawler that reads the fifteen product pages
 * without a declared relationship sees fifteen near-copies: ninety-six
 * to ninety-nine per cent of the words are the same, and only the size,
 * the carton and the weight differ.
 *
 * Google files that as duplicate content, and one page in a group is
 * picked to represent the rest. The pages are not duplicates, so the
 * fix is to say what the relationship is rather than to delete the
 * pages.
 *
 * WHY IT IS COMPUTED AND NOT TYPED
 * A series is a fact about the catalogue: two SKUs are the same product
 * when their names are the same once the size is taken off. If that is
 * computed from lib/products.json, then a new size of an existing
 * product joins its series by itself, and a series cannot be left out
 * of the site because somebody forgot to add it here.
 *
 * WHAT IT DOES NOT DO
 * It does not merge the pages and it does not hide anything. Each size
 * keeps its own page, its own minimum order and its own carton. The
 * series tells a reader - and a crawler - that they are looking at
 * sizes of one thing, so a buyer who came for 300 mL can see that
 * 500 mL exists and what changes between them.
 */

import { products } from '@/lib/products';

export type SeriesEntry = {
  name: string;
  name_zh: string | null;
  ids: string[];
};

type RawSeries = {
  name: string;
  name_zh: string | null;
  ids: string[];
};

/**
 * The names with the size taken off.
 *
 * "Cat Litter Partner - Deodorizing Powder 500 g" and the 300 g one
 * become the same string, and they are the same product. "Pet Shampoo
 * 500 mL" and "No-Rinse Cleansing Foam 500 mL" do not, because the
 * words in front of the size are different.
 */
const STEM_SIZE = /\s*\d+(\.\d+)?\s*(mL|ml|g|kg|grams?)\b/;

function stemOf(name: string): string {
  return name
    .replace(STEM_SIZE, '')
    .replace(/[\s\u2014\u2013-]+$/, '')
    .trim();
}

/** The series, read from the catalogue. */
export const PRODUCT_SERIES: SeriesEntry[] = (() => {
  const groups = new Map<string, string[]>();
  for (const p of products) {
    const stem = stemOf(String(p.name_en ?? ''));
    if (!stem) continue;
    const list = groups.get(stem) ?? [];
    list.push(p.id);
    groups.set(stem, list);
  }
  const out: SeriesEntry[] = [];
  for (const [stem, ids] of groups) {
    if (ids.length < 2) continue;
    const first = products.find((p) => p.id === ids[0]);
    out.push({
      name: first?.name_en ?? stem,
      name_zh: first?.name_zh ?? null,
      ids,
    });
  }
  return out;
})();

/** The other sizes of the series a SKU belongs to. */
export function seriesOf(skuId: string): { name: string; others: string[] } | null {
  for (const s of PRODUCT_SERIES) {
    if (!s.ids.includes(skuId)) continue;
    return { name: s.name, others: s.ids.filter((i) => i !== skuId) };
  }
  return null;
}

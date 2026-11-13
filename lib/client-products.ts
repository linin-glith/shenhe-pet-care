import catalogue from '@/content/v2/matcher-catalogue.json';

/**
 * Client-safe product helpers.
 *
 * WHY THIS FILE EXISTS
 * `lib/products.ts` imports lib/products.json, and that record carries
 * b2b_price_rmb — the internal reference price. The site is quote-on-request
 * and no price is displayed anywhere, but two components are client
 * components: the conversion dock and the enquiry form. A client component
 * that imports lib/products pulls the whole record — including the price —
 * into the browser bundle, where anyone can read it in the page source.
 *
 * The fix is not to remove the price from the data (the sales team quotes
 * from it) but to stop shipping it to the browser. This module exposes the
 * two things the client components need — a SKU's display name and the
 * catalogue's product list for the composer's line filter — and reads them
 * from the client-safe projection generated from lib/products.json.
 *
 * The projection is generated from lib/products.json by
 * scripts/fix_client_projection.py, and the build compares the two field by
 * field, so it cannot drift from the source record. It did once: the sync
 * only filled in MISSING fields, so a stale value was never corrected.
 */
export type ClientProduct = {
  id: string;
  sku_oem: string;
  name_en: string;
  /** The Chinese name, for the Chinese back office the desk works in. */
  name_zh: string;
  specification: string;
  function_en: string;
  line: string;
  category: string;
  moq: number;
  moq_unit: string;
  lead_time_days_stock: string;
  lead_time_days_oem: string;
  certifications_required: string[];
  package: string;
  storage: string;
  /**
   * WHAT IS IN IT, and WHERE IT IS USED.
   *
   * A buyer comparing twenty cards cannot tell two ordinary shampoos apart
   * from the card copy alone — every factory writes "gentle, for cats and
   * dogs". The two fields that DO differentiate a formula are the actives it
   * is built on and the situation it is built for, and the catalogue has
   * carried both for every SKU since the record was extracted. They were
   * simply never put on the card.
   *
   * They are here now, which is why the projection carries them: a client
   * component cannot read lib/products.json without shipping the price.
   */
  ingredients_en: string;
  application: string[];
  shelf_life_months: number;
  carton_dimensions_cm: string;
  carton_weight_kg: number;
  hs_code: string;
  msds_available: boolean;
  specification_options: string[];
};

const RAW = catalogue.catalogue as unknown as ClientProduct[];

export const clientProducts: ClientProduct[] = RAW;

export const productsById: Record<string, ClientProduct> = Object.fromEntries(
  RAW.map((p) => [p.id, p]),
);

/**
 * How a SKU is written into a buyer's enquiry.
 *
 * "P003" means nothing to the person typing. The enquiry goes to a human on
 * the sales side, so it has to name the product and the size, and carry the
 * id alongside for the lookup.
 */
export function productLine(id: string): string {
  const p = productsById[id];
  return p ? `${p.name_en} — ${p.specification} (${p.id})` : id;
}

/** The same, for a list of ids, with unknown ids passed through as typed. */
export function productLines(ids: string[]): string[] {
  return ids.map(productLine);
}

/**
 * How a SKU is written for the desk.
 *
 * "P012" is a warehouse code: the person answering the enquiry has to
 * open the catalogue to find out what the buyer asked about. So the desk
 * writes the name - the Chinese name, because the desk is Chinese - and
 * keeps the SKU beside it for the lookup.
 *
 * The size is added when the name does not carry it. "养宠家庭洗衣液" does
 * not say how big the bottle is, and the size decides which of the three
 * laundry bottles the buyer meant.
 *
 * An id the catalogue does not know is passed through as it was typed: a
 * name is never invented to fill a gap.
 */
export function clientProductLabel(id: string): string {
  const p = productsById[id];
  if (!p) return id;
  const zh = (p.name_zh || '').trim();
  const spec = (p.specification || '').trim();
  if (!zh) return spec ? `${spec} (${p.id})` : p.id;
  if (!spec) return zh;
  const measure = spec.split(' / ')[0].trim();
  return measure && zh.includes(measure) ? zh : `${zh} · ${spec}`;
}

/** The same, with the SKU kept alongside the name. */
export function clientProductLine(id: string): string {
  const p = productsById[id];
  if (!p) return id;
  return `${clientProductLabel(p.id)} · ${p.id}`;
}

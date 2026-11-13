import catalogue from '@/content/v2/matcher-catalogue.json';
import { PRODUCT_ROUTE } from '@/lib/product-routing';

/**
 * Breadcrumb data — client-safe.
 *
 * WHY THIS FILE EXISTS
 * The breadcrumb trail is a client component, and it used to reach its data
 * through lib/seo/meta.ts, which reaches lib/products.ts, which imports
 * lib/products.json — the record carrying b2b_price_rmb. That chain put the
 * internal reference price into the browser bundle for every page of the
 * site.
 *
 * The trail needs three things: the product name and size behind a slug, the
 * two Inner Wellness products, and a way to decide whether a name already
 * carries its size. All three are available from the client-safe projection,
 * so this module provides them without touching the priced record.
 */
export type CrumbProduct = {
  id: string;
  name_en: string;
  specification: string;
};

const RAW = catalogue.catalogue as unknown as CrumbProduct[];

const BY_SLUG: Record<string, CrumbProduct> = Object.fromEntries(
  Object.entries(PRODUCT_ROUTE).flatMap(([id, slug]) => {
    const p = RAW.find((x) => x.id === id);
    return p ? [[slug, p] as const] : [];
  }),
);

/** The SKU behind a product page slug, from the client-safe projection. */
export function productBySlug(slug: string): CrumbProduct | undefined {
  return BY_SLUG[slug];
}

/**
 * The name a breadcrumb should show.
 *
 * A product whose name already carries its size is shown as it is; one that
 * does not gets the size appended, so the trail reads "Pet Shampoo for Cats
 * or Dogs 500 mL" rather than repeating itself.
 */
export function productName(p: CrumbProduct): string {
  const size = (p.specification ?? '').split('/')[0].trim();
  if (!size) return p.name_en;
  return p.name_en.toLowerCase().includes(size.toLowerCase())
    ? p.name_en
    : `${p.name_en} ${size}`;
}

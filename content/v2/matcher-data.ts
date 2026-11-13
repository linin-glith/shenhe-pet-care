import catalogue from '@/content/v2/matcher-catalogue.json';
import { PRODUCT_ROUTE, LINE_LABEL } from '@/lib/product-routing';

/**
 * The catalogue, compiled for the matcher.
 *
 * WHY THIS IS A SEPARATE FILE
 * The matcher runs in the browser and needs a flat, small shape: id, name,
 * line, function text, MOQ, lead time, certifications. Importing the full
 * ProductSpec into a client component would pull the whole product record —
 * including the internal reference pricing the site never displays — into
 * the client bundle.
 *
 * So this file derives a narrow type from the same records and exposes only
 * the fields the matcher actually reads. The data cannot drift from
 * lib/products.json because it is built from it.
 *
 * The internal price field is deliberately NOT carried across. The site is
 * quote-only, and the matcher's output is shown to a buyer.
 */
export type MatcherProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  line: string;
  lineLabel: string;
  function: string;
  application: string[];
  moq: number;
  moqUnit: string;
  lead: string;
  certs: string[];
  permit: boolean;
};

/*
 * The line names are NOT copied here. lib/product-routing.ts holds the one
 * map; this file used to hold a second copy of it, and the two copies
 * disagreed — this one said "Deodorizing & Disinfection" where the
 * canonical says "Deodorizing & Disinfecting", so the AI Product Match page
 * named a line in a way nothing else on the site did. A copied fact is a
 * fact that will drift; the import is the fix.
 */

type Raw = {
  id: string;
  name_en: string;
  sku_oem: string;
  category: string;
  line?: string;
  function_en: string;
  application: string[];
  moq: number;
  moq_unit: string;
  lead_time_days_stock: string;
  certifications_required: string[];
  msds_available: boolean;
};

const RAW = catalogue.catalogue as unknown as Raw[];

export const PRODUCTS: MatcherProduct[] = RAW.map((p) => {
  const line = p.line ?? 'grooming_care';
  const certs = [...p.certifications_required];
  if (p.msds_available) certs.push('MSDS');
  // The facility certifications apply to every SKU the factory makes.
  certs.push('ISO 22716 GMP', 'FDA registered facility');
  return {
    id: p.id,
    slug: PRODUCT_ROUTE[p.id] ?? p.id.toLowerCase(),
    name: p.name_en,
    sku: p.sku_oem,
    line,
    lineLabel: LINE_LABEL[line] ?? line,
    function: p.function_en,
    application: p.application ?? [],
    moq: p.moq,
    moqUnit: p.moq_unit,
    lead: `${p.lead_time_days_stock} d stock`,
    certs,
    permit: p.certifications_required.some((c) => /permit|licen/i.test(c)),
  };
});

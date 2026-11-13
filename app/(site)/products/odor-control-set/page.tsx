// Product page for P001 — Probiotic + Bio-Enzyme Odor Control Set.
//
// WHY THIS PAGE EXISTS
// P001 used to point at /products/pet-digestive-probiotics.html, and that URL
// serves a DIFFERENT product: "Pet Digestive Probiotics, 8 mL × 9 vials". The
// catalogue record for P001 is a probiotic + bio-enzyme odor-control SET (1
// spray + 2 × 220 mL, MOQ 1,000 sets) and the price-list photograph shows that
// gift set — patent ZL 2018 1 1098435.9, "除臭率 >94%". So one URL was
// serving two products, and the <title> on it ("8 mL × 9 vials") contradicted
// the body it was attached to.
//
// The vials product keeps its own legacy page and its own legacy content
// (see app/products/pet-digestive-probiotics/page.tsx). P001 gets this one.
//
// The BODY is rendered from the catalogue record by productBlocks('P001'), so
// the specification table, the FAQ, the schema and this page's title all come
// from the same row of lib/products.json and cannot drift apart.
//
// Hand-maintained: this route is not produced by a legacy extractor, because
// no legacy page for this product ever existed.

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import page from '@/content/products__odor-control-set.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { V2Page } from '@/components/v2/blocks';
import { productBlocks } from '@/content/v2/product';

const data = page as unknown as LegacyPage;

/*
 * The metadata of a product page, in the buyer's language.
 *
 * The title is the query the buyer typed, in their own language — a
 * German buyer searches "Geruchsneutralisierer Tier Spray Extra stark",
 * and a translated English title is a title nobody searched for.
 */
/**
 * The metadata of this page, in the buyer's language.
 *
 * The English page builds its metadata from the catalogue record. A
 * German buyer searches "Geruchsneutralisierer Tier Spray Extra stark",
 * and the English title translated word by word is a title nobody typed.
 * So each language asks for its own query.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  return legacyMetadata(data, locale);
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

export default function Page({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      <JsonLd page={data} />
      <V2Page blocks={productBlocks('P001', locale)} />
    </>
  );
}

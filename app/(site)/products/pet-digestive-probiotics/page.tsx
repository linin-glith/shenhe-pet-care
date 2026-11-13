// Pet Digestive Probiotics — 8 mL × 9 vials.
//
// WHY THIS PAGE RENDERS THE LEGACY CONTENT AGAIN (2026-10-22)
// This route used to render productBlocks('P001'), which put the CATALOGUE
// record for P001 on it — and P001 is not this product. The catalogue record
// is the probiotic + bio-enzyme odor-control set (1 spray + 2 × 220 mL, MOQ
// 1,000 sets); the product this URL has always been about is the probiotic
// vial course. One URL, two products, and a <title> ("8 mL × 9 vials") that
// contradicted the body attached to it.
//
// So: P001 moved to its own page, /products/odor-control-set.html, and this
// URL goes back to being the product its title, its breadcrumb, the Pet
// Nutrition line page card and its photograph all describe.
//
// The metadata is the legacy head (same title, same canonical) with the
// description taken from the line-product registry, because the captured
// legacy description ran 44 characters and rendered as a stub in search.

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import page from '@/content/products__pet-digestive-probiotics.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { V2Page } from '@/components/v2/blocks';
import { LineProductDepth } from '@/components/v2/LineProductDepth';
import { legacyToV2 } from '@/lib/v2/legacy-to-v2';

const data = page as unknown as LegacyPage;
const blocks = legacyToV2(data.blocks ?? []);

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
      <V2Page blocks={blocks} />
      <LineProductDepth slug="pet-digestive-probiotics" />
    </>
  );
}

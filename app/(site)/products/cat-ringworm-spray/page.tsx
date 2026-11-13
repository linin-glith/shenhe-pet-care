// AUTO-GENERATED. Source: products/cat-ringworm-spray.html
// Regenerate with: node shenhe-tools/gen-product-pages.mjs <projectRoot> --write
//
// v2 engine: metadata and JSON-LD still come from the extracted legacy JSON so
// the SEO surface is untouched; only the BODY is rendered by the v2 blocks.
// Product id P004 resolved via: curated (hand-reviewed).

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import page from '@/content/products__cat-ringworm-spray.json';
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
      <V2Page blocks={productBlocks('P004', locale)} />
    </>
  );
}

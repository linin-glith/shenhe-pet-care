/**
 * AI Product Match — the four-question matcher.
 *
 * WHY THIS PAGE IS HAND-BUILT
 * The legacy page promised the visitor that answering four questions would
 * return the top five matching SKUs, and it did not: it was a static form
 * with no logic behind it. The page had been linked from every page of the
 * site and listed in the sitemap since it was built, so a buyer who arrived
 * from a search result and spent two minutes on the questions got nothing.
 *
 * The matcher is a client component (the scoring runs in the browser against
 * a catalogue compiled into the bundle), so this page owns the layout and
 * hands the questions to it.
 *
 * The metadata and JSON-LD still come from the extracted legacy head, so the
 * SEO surface is unchanged: same title, same description, same canonical.
 */

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import page from '@/content/ai-customize.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { V2Page } from '@/components/v2/blocks';
import { legacyToV2 } from '@/lib/v2/legacy-to-v2';
import { AiMatcher } from '@/components/v2/AiMatcher';

const data = page as unknown as LegacyPage;

// The legacy body is kept for the parts that are still good — the closing
// "already know what you want" block — but the question form itself is
// replaced by the working matcher, so the first prose block is dropped.
const blocks = legacyToV2(data.blocks ?? []).filter((b) => {
  if (b.kind !== 'rich') return true;
  const html = b.html ?? '';

  /*
   * The legacy hero block goes too.
   *
   * It carried the eyebrow ("AI Match"), the <h1> ("AI Customization
   * Wizard") and the lead ("Answer 4 questions. We'll match the top 5 SKUs
   * from our 20-product library for your market.") — all three of which the
   * v2 header above already says, in better copy. Rendering it put a SECOND
   * <h1> on the page, which the heading check calls an error: a page with two
   * h1s tells a crawler which one is the page title, and it is not both.
   */
  if (/<h1[\s>]/i.test(html)) return false;

  // The legacy question form is replaced by the working matcher.
  return !/STEP 1 OF 4|Which product line\?/i.test(html);
});

/**
 * The metadata of this page, in the buyer's language.
 *
 * The English page builds its metadata from the captured legacy head.
 * A language page needs the same thing said in that language, and
 * `legacyMetadata` already knows how: the page table in
 * lib/i18n/pages.ts carries the translated title and description,
 * and a page without an entry keeps its English title - which is
 * the honest answer for a page that has not been translated yet.
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

      {/* ---------------- header ---------------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">AI Match</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Four questions. Your top five SKUs.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Answer four questions about your target product and we will match you to the five
            catalogue SKUs that fit — with the reason for each, the minimum order, and the
            private-label option. No account, no upload, nothing sent anywhere.
          </p>
        </div>
      </section>

      {/* ---------------- the mat
          <DataBar items={standardDataBar(['skus', 'labs', 'years', 'capacity'])} />
cher ---------------- */}
      <section className="v3-section">
        <div className="v2-container">
          <AiMatcher />
        </div>
      </section>

      {/* ---------------- the legacy closing block ---------------- */}
      <V2Page blocks={blocks} />
    </>
  );
}

// The body comes from the extracted legacy content (content/msds.json), and
// two sections are hand-built on top of it: the list of the SKUs we hold a
// sheet for, and the three steps the page declares in its HowTo schema.
//
// WHY THE LIST IS HERE
// The page used to say "MSDS available for all 20 SKUs. Click any product to
// download" - and there was nothing to click: no product names, no links,
// and no PDF anywhere in the site. The sheets are issued with the consignment.
// So the sentence now says that, and the twenty SKUs are listed from the
// catalogue, each with the way to ask for its sheet.
//
// WHY THE STEPS ARE HERE
// The page declared three HowTo steps in its schema and two of them were
// only in the prose. The steps are now shown as steps, so the structured
// data and the page say the same thing.
//
// Metadata and JSON-LD still come from the extracted legacy head, so the SEO
// surface is unchanged: same title, same description, same canonical.

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import page from '@/content/msds.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { V2Page } from '@/components/v2/blocks';
import { V3Head } from '@/components/v2/V3';
import { MSDS_STEPS } from '@/content/v2/how-to';
import { howToSchema } from '@/lib/seo/schema';
import { legacyToV2 } from '@/lib/v2/legacy-to-v2';
import { clientProducts } from '@/lib/client-products';


const data = page as unknown as LegacyPage;
const blocks = legacyToV2(data.blocks ?? []);

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
      <JsonLd page={data}  />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema({
        name: 'How to get and use the safety data sheets',
        description:
          'MSDS and SDS for private-label pet care: deodorizing sprays, disinfectants, shampoo and foam. One request, one sheet, per SKU. Per SKU. Free of charge.',
        url: '/msds.html',
        
        steps: MSDS_STEPS,
      })) }}
      />
      <V2Page blocks={blocks} />

      {/* ---------------- the sheets, one row per SKU ---------------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="A sheet for every SKU we sell"
            sub="We hold a safety data sheet for each of them. They are not published here - a sheet belongs to the consignment it describes - so tell us the SKU and we send it with the goods, or on its own."
          />
          <ul className="mt-10 grid gap-x-10 gap-y-3 md:grid-cols-2">
            {clientProducts.map((p) => (
              <li
                key={p.id}
                className="flex items-baseline justify-between gap-4 border-t border-v2-ink-200 pt-3"
              >
                <span className="text-sm text-v2-ink-800">
                  {p.name_en}
                  <span className="ml-2 font-mono text-[11px] text-v2-ink-500">{p.specification}</span>
                </span>
                <a
                  href={`/contact.html?range=${p.id}`}
                  className="v3-link shrink-0 text-sm font-semibold"
                >
                  Request the sheet
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- the steps the schema already promised ---------------- */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="How to get and use the sheet"
            sub="Three steps. The third one is the one buyers forget: a safety data sheet is a record of the consignment, not an approval of a label."
          />
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {MSDS_STEPS.map((step, i) => (
              <li key={step.name}>
                <p className="font-mono text-[11px] tracking-[0.16em] text-white/60">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-2 text-base font-semibold text-white">{step.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{step.text}</p>
                {step.url && (
                  <a
                    href={step.url}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white underline underline-offset-4"
                  >
                    More on this <span aria-hidden>&rarr;</span>
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

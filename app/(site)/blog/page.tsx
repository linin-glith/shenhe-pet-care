/**
 * Blog index — the content hub.
 *
 * WHY NOINDEX IS NOW DERIVED, NOT LISTED
 * This page was previously excluded with a hand-maintained set
 * (`EMPTY_PAGES = new Set(['blog/index.html'])`). Correct while the hub was
 * empty — an empty category is a thin-content page and indexing it costs the
 * domain a quality signal. Wrong the moment the first article lands, because
 * nothing reminded anyone to remove the entry, so the hub stayed invisible to
 * search for the rest of the site's life.
 *
 * The exclusion is now derived from the articles themselves (see
 * `isEmptyIndex` in LegacyPage). Empty hub: noindex, and therefore dropped
 * from the sitemap by gen-seo-files.mjs. First article published: the hub
 * becomes indexable on the next build — no list to maintain, nothing to forget.
 */

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import page from '@/content/blog__index.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { siteConfig } from '@/lib/shenhe.config';
import { Icon, type IconName } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { ARTICLES, type ArticleMeta } from '@/content/v2/articles';

const data = page as unknown as LegacyPage;

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

const ICON: Record<string, IconName> = {
  compliance: 'globe',
  howto: 'flask',
  sourcing: 'cart',
  'pet-care-notes': 'paw',
};

export default function BlogIndexPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      <JsonLd page={data} />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Guides</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Sourcing &amp; technical guides.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Written by our R&amp;D and compliance team for importers — the questions
            they actually answer on the first call.
          </p>
        </div>
      </section>

      <section className="v3-section">
        <div className="v2-container">
          {ARTICLES.length ? (
            <>
              <V3Head
                title={`${ARTICLES.length} guide${ARTICLES.length === 1 ? '' : 's'}`}
                sub="Every guide is written to be useful on its own, whether or not you ever order from us."
              />
              <ul className="mt-14 grid gap-px sm:grid-cols-2 bg-[rgb(0_0_0/0.08)]">
                {ARTICLES.map((a) => (
                  <li key={a.slug} className="bg-white">
                    <a
                      href={`/blog/${a.category}/${a.slug}.html`}
                      className="v3-card v3-card--interactive v3-rise block p-7"
                    >
                      <div className="flex items-center gap-3">
                        <span className="v3-icon-plate v3-icon" aria-hidden>
                          <Icon name={ICON[a.category] ?? 'paw'} size={18} />
                        </span>
                        <p className="font-mono text-[11px] tracking-[0.12em] text-v2-ink-400">
                          {a.category.replace(/-/g, ' ')}
                        </p>
                      </div>
                      <h2 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-v2-ink-900">
                        {a.title}
                      </h2>
                      <p className="mt-2.5 text-sm leading-relaxed text-v2-ink-500">{a.summary}</p>
                      <p className="v3-link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                        Read <span aria-hidden>&rarr;</span>
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <V3Head
                title="Guides are being written"
                sub="The first ones are in progress. The people writing them are the same ones who answer your enquiry."
              />
              <p className="mx-auto mt-10 max-w-2xl text-center text-[0.9375rem] leading-relaxed text-v2-ink-500">
                In the meantime the <a data-journey="contact" href="/contact.html" className="v3-link font-semibold">contact page</a>{' '}
                reaches the same people directly — ask, and you will get an answer in writing.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
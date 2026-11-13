import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { categoryCopy } from '@/content/v2/category-copy';
import { categoryFaq, commercialOnly } from '@/content/v2/category-faq';
import { faqPageSchema } from '@/lib/seo/schema';
import { siteConfig } from '@/lib/shenhe.config';

/**
 * CategoryDepth — the indexable prose layer on a product-line page.
 *
 * WHY THIS IS SEPARATE FROM ProductDepth
 * A SKU page answers "what is this product and how do I use it". A line page
 * answers a different question: "what is in this line, what differs between
 * the products in it, and how do I choose". Those are different questions for
 * different moments in the buyer's path, and a line page that repeats its
 * SKUs in prose is padding — the SKUs are already linked from the catalogue.
 *
 * INDEXING NOTES
 *  - one H1 above (the hero); every heading here is H2 or H3, no level skips
 *  - the FAQ answers carry the same figures the product pages quote
 *  - FAQPage schema is generated from the SAME array this component renders,
 *    so the structured data and the visible questions cannot disagree
 *  - no price anywhere: the site is quote-only
 */
export function CategoryDepth({ category, lineName }: { category: string; lineName: string }) {
  const copy = categoryCopy(category);

  /*
   * WHICH QUESTIONS THE SCHEMA DECLARES.
   *
   * Before 2026-11-09 the schema was built from `copy.faq` alone — three
   * questions — while the page visibly asked six. The three in `choosing`
   * ("Shampoo or waterless foam?", "Which one for sensitive skin?") are
   * real buyer questions with real answers printed right there, and they
   * were the only part of the page a machine could not see. The schema now
   * covers every question the page shows, so a crawler reading the markup
   * gets the same set a visitor reads on screen.
   *
   * The commercial layer is appended here rather than written into each
   * category block: it is the same six answers for every line, and six
   * copies of one answer is how they drift apart.
   */
  const faq = categoryFaq([...copy.choosing, ...copy.faq]);
  const commercial = commercialOnly([...copy.choosing, ...copy.faq]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faq)) }}
      />

      {/* ---------- what this line is ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
            <div>
              <V3Head title={`What is in the ${lineName} line`} />

              <p className="mt-8 max-w-2xl text-[1.0625rem] leading-relaxed text-v2-ink-700">
                {copy.intro}
              </p>

              {/* ---------- how to choose ---------- */}
              <h3 className="mt-14 text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
                How to choose within the line
              </h3>
              <dl className="mt-5 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
                {copy.choosing.map((c) => (
                  <div key={c.q} className="grid gap-2 py-5 sm:grid-cols-[15rem_1fr] sm:gap-8">
                    <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                      {c.q}
                    </dt>
                    <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{c.a}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ---------- line FAQ ---------- */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
                About this line
              </h3>
              <dl className="mt-5 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
                {copy.faq.map((f) => (
                  <div key={f.q} className="py-5">
                    <dt className="flex items-start gap-2 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                      <Icon name="chat" size={15} className="mt-1 shrink-0 text-v2-ink-300" />
                      {f.q}
                    </dt>
                    <dd className="mt-2 pl-[23px] text-[0.9375rem] leading-relaxed text-v2-ink-600">
                      {f.a}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 rounded-v2-lg border border-v2-accent-300 bg-v2-accent-050 p-6">
                <p className="text-[0.9375rem] font-semibold text-v2-ink-900">
                  Need a specific formulation?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-v2-ink-500">
                  Every SKU on this page is available under private label — your formula, your
                  artwork, your market’s label compliance.
                </p>
                <a
                  href="/contact.html"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-accent-700"
                >
                  Request a custom quote <span aria-hidden>&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ordering this line ---------- */}
      {commercial.length > 0 && (
        <section className="v3-section border-t border-v2-ink-200">
          <div className="v2-container">
            <V3Head title={`Ordering the ${lineName} line`} />
            <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-v2-ink-600">
              The commercial terms are the same across the catalogue, but they apply per SKU rather than
              per line — so they are stated once here and repeated with the exact figure on each product
              page.
            </p>
            <dl className="mt-8 grid gap-x-16 gap-y-0 md:grid-cols-2">
              {commercial.map((f) => (
                <div key={f.q} className="border-t border-v2-ink-200 py-6">
                  <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">{f.q}</dt>
                  <dd className="mt-2 text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </>
  );
}

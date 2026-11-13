import type { ProductSpec } from '@/lib/products';
import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { productCopy, productFacts } from '@/content/v2/product-depth';
import { seriesOf } from '@/lib/product-series';
import { coverageOf } from '@/lib/report-coverage';
import { LAB_REPORTS } from '@/content/v2/reports';
import { products, productUrl } from '@/lib/products';
import { PRODUCT_ROUTE } from '@/lib/product-routing';

/**
 * ProductDepth — the indexable prose layer on a SKU page.
 *
 * WHAT THIS IS FOR
 * A spec table tells a buyer what to order. It does not tell a crawler what
 * the page is about, and it does not give a reader anything to weigh before
 * they decide whether to send an enquiry. This block supplies both: plain
 * sentences that name the product, its use and its limits, plus an FAQ whose
 * answers are specific enough to be quoted.
 *
 * INDEXING NOTES
 *  - one H1 already exists above (the hero); every heading here is H2/H3 so
 *    the outline stays flat and every section is separately extractable
 *  - the FAQ is rendered by the caller into FAQPage schema from the same
 *    array, so structured data and visible questions cannot disagree
 *  - no price appears here. MOQ and lead time are the decision facts and are
 *    already public; unit pricing is quoted per RFQ by policy
 */
export function ProductDepth({ p }: { p: ProductSpec }) {
  const copy = productCopy(p);
  const facts = productFacts(p);

  return (
    <>
      {/* ---------- what it does ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head title="What this product is" sub={`${p.name_en} — ${p.specification}`} />

          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-[1.0625rem] leading-relaxed text-v2-ink-700">{copy.summary}</p>

            {/* Spec facts, restated as sentences. A crawler reads prose; a
                buyer skims numbers. Both are here, neither is redundant. */}
            <dl className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="border-l-2 border-v2-accent-600 pl-4">
                  <dt className="text-xs font-medium text-v2-ink-400">{f.label}</dt>
                  <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-v2-ink-800">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
              Ingredients
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-v2-ink-600">{p.ingredients_en}</p>
          </div>
        </div>
      </section>

      {/* ---------- application + usage ---------- */}
            {/* ---------- the other sizes of this product ---------- */}
      {seriesOf(p.id) && (
        <section className="v3-section">
          <div className="v2-container">
            <V3Head
              title="The other sizes of this product"
              sub="The same formula in a different pack. The minimum order, the carton and the weight are below."
            />
            <div className="mx-auto mt-10 max-w-3xl">
              <ul className="grid gap-4 sm:grid-cols-2">
                {seriesOf(p.id)!.others.map((id) => {
                  const other = products.find((x) => x.id === id);
                  if (!other) return null;
                  return (
                    <li key={id} className="rounded-v2-md border border-v2-ink-200 bg-white p-5">
                      <a
                        href={productUrl(other)}
                        className="text-base font-semibold text-v2-ink-900 underline underline-offset-4 hover:text-v2-accent-600"
                      >
                        {other.name_en}
                      </a>
                      <p className="mt-1 text-sm text-v2-ink-600">{other.specification}</p>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div className="flex gap-2">
                          <dt className="text-v2-ink-500">Minimum</dt>
                          <dd className="font-medium tabular-nums text-v2-ink-900">
                            {other.moq.toLocaleString('en-US')} {other.moq_unit}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-v2-ink-500">Carton</dt>
                          <dd className="font-medium text-v2-ink-900">{other.package}</dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

<section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <h2 className="v2-display text-3xl md:text-4xl">Where it is used</h2>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-v2-ink-600">{copy.application}</p>

              <ul className="mt-8 flex flex-wrap gap-2">
                {p.application.map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-v2-ink-200 bg-white px-3 py-1 text-xs font-medium text-v2-ink-600"
                  >
                    {a}
                  </li>
                ))}
              </ul>

              {/* ---------- handling and limits ---------- */}
              <h3 className="mt-12 text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
                Handling and limits
              </h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">Storage</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                    {p.storage}. Shelf life {p.shelf_life_months} months from the date of
                    manufacture, unopened.
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">What ships with it</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                    A batch-specific certificate of analysis, a 16-language safety data sheet, an
                    ingredient and allergen declaration, and the commercial invoice with HS code{' '}
                    {p.hs_code}. Third-party laboratory determinations are available on the
                    certifications page.
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">What it is not</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                    This is a catalogue formulation. Your own formula, artwork and label compliance
                    are available under private label, which changes the MOQ and the lead time
                    rather than the specification.
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="v2-display text-3xl md:text-4xl">How to use it</h2>
              <ol className="mt-6 space-y-4">
                {copy.usage.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-v2-accent-050 font-mono text-[11px] font-bold text-v2-accent-700 ring-1 ring-v2-accent-100"
                    >
                      {i + 1}
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{s}</span>
                  </li>
                ))}
              </ol>

              {/*
                THE LABORATORY REPORTS FOR THIS SKU.
                *
                * Every catalogue SKU says what it is and what it
                * costs to make. What it says about testing is the
                * part a buyer acts on, so it is said here rather than
                * left to the certifications page.
                *
                * There are three answers, and they are kept apart on
                * purpose:
                *
                *   - this SKU has a report, and here it is;
                *   - this SKU is the same formula as one that was
                *     tested, in a different pack - the report applies
                *     and the page says which size was submitted;
                *   - this SKU has no report, and we say so, and say
                *     what can be arranged.
                *
                * A SKU with no report is not a weakness to hide. It
                * is a fact a buyer needs, and a buyer who is told
                * "not tested, and here is how to get it tested" can
                * decide. A buyer who is told nothing cannot.
                */}
              {(() => {
                const coverage = coverageOf(p.id);
                if (!coverage) return null;
                const reportByNumber = new Map(LAB_REPORTS.map((r) => [r.number, r]));
                const direct = (coverage.reports ?? [])
                  .map((n) => reportByNumber.get(n))
                  .filter((r): r is NonNullable<typeof r> => Boolean(r));
                const same = coverage.sameFormulaAs
                  ? {
                      reports: coverage.sameFormulaAs.reports
                        .map((n) => reportByNumber.get(n))
                        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
                      testedSize: coverage.sameFormulaAs.testedSize,
                      sku: coverage.sameFormulaAs.sku,
                    }
                  : null;

                return (
                  <div className="mt-12 border-t border-v2-ink-200 pt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
                      Laboratory reports
                    </h3>

                    {direct.length > 0 && (
                      <>
                        <p className="mt-4 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                          {direct.length === 1 ? 'This SKU has' : 'This SKU has'}{' '}
                          {direct.length === 1 ? 'a published third-party laboratory report' : `${direct.length} published third-party laboratory reports`}.
                          Each one can be downloaded, and each carries the laboratory&apos;s own
                          number so it can be checked with the issuer.
                        </p>
                        <ul className="mt-4 space-y-3">
                          {direct.map((r) => (
                            <li key={r.number} className="rounded border border-v2-ink-200 p-4">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                <span className="font-mono text-xs font-semibold text-v2-ink-700">
                                  {r.number}
                                </span>
                                <span className="text-[11px] text-v2-ink-500">{r.issuer}</span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-v2-ink-900">{r.title}</p>
                              <p className="mt-1 text-[0.8125rem] leading-relaxed text-v2-ink-600">{r.note}</p>
                              {(r.verificationCode || r.lot) && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-v2-ink-500">
                                  {r.verificationCode && (
                                    <span className="mr-3">
                                      Verification code{' '}
                                      <span className="font-mono text-v2-ink-600">
                                        {r.verificationCode}
                                      </span>
                                    </span>
                                  )}
                                  {r.lot && (
                                    <span>
                                      Batch tested{' '}
                                      <span className="font-mono text-v2-ink-600">{r.lot}</span>
                                    </span>
                                  )}
                                </p>
                              )}
                              <a
                                href={`/assets/img/certs/${r.file}`}
                                className="mt-2 inline-block text-xs font-semibold text-v2-accent-700 underline underline-offset-2"
                              >
                                Download the report
                              </a>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {same && same.reports.length > 0 && (
                      <>
                        <p className="mt-4 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                          This SKU is the same formula as{' '}
                          <a
                            href={`/products/${PRODUCT_ROUTE[same.sku] ?? ''}.html`}
                            className="font-semibold text-v2-accent-700 underline underline-offset-2"
                          >
                            {same.sku}
                          </a>
                          , packed in a different size. The reports below were run on the{' '}
                          <strong className="font-semibold text-v2-ink-900">{same.testedSize}</strong>{' '}
                          sample of that formula; this pack is the same formula in a different
                          container, not a separate formulation. If you need the reports
                          re-issued against this exact pack, ask and we will arrange it.
                        </p>
                        <ul className="mt-4 space-y-3">
                          {same.reports.map((r) => (
                            <li key={r.number} className="rounded border border-v2-ink-200 p-4">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                <span className="font-mono text-xs font-semibold text-v2-ink-700">
                                  {r.number}
                                </span>
                                <span className="text-[11px] text-v2-ink-500">
                                  {r.issuer} · tested on the {same.testedSize} sample
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-v2-ink-900">{r.title}</p>
                              <p className="mt-1 text-[0.8125rem] leading-relaxed text-v2-ink-600">{r.note}</p>
                              <a
                                href={`/assets/img/certs/${r.file}`}
                                className="mt-2 inline-block text-xs font-semibold text-v2-accent-700 underline underline-offset-2"
                              >
                                Download the report
                              </a>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {coverage.noReport && (
                      <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-900">
                          No third-party report for this SKU yet
                        </p>
                        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-amber-900/90">
                          {coverage.noReport}
                        </p>
                        {coverage.canBeTested && (
                          <p className="mt-2 text-xs text-amber-800">
                            Tell us the market and the claim you need substantiated and we will
                            come back with the method, the laboratory and the cost.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ---------- ordering facts as prose ---------- */}
              <h3 className="mt-12 text-sm font-semibold uppercase tracking-[0.12em] text-v2-ink-400">
                Ordering
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                The catalogue MOQ (minimum order quantity) for this SKU is{' '}
                <strong className="font-semibold text-v2-ink-900">
                  {p.moq.toLocaleString()} {p.moq_unit}
                </strong>
                . Stock lead time is {p.lead_time_days_stock} days after payment is confirmed;
                private-label lead time is {p.lead_time_days_oem} days after the sample is
                approved. A repeat order is priced on its own volume, and that minimum is written
                into the quotation. Unit pricing is quoted per enquiry against your volume and
                destination, because freight and Incoterms change the landed figure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** The FAQ block, exported so the page can feed the same array to schema. */
export function ProductFAQ({ p }: { p: ProductSpec }) {
  const copy = productCopy(p);
  return (
    /*
     * The id is NOT "faq".
     *
     * The product page has two question blocks: the use and safety questions
     * below, and the procurement questions further down. Two sections with the
     * same id is invalid HTML and makes the #faq anchor ambiguous, so this one
     * is addressed as "product-questions" and the procurement block keeps
     * "faq" — the anchor a search result and an answer engine point at.
     */
    <section className="v3-section" id="product-questions">
      <div className="v2-container">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <V3Head title="Questions buyers ask" sub="Answered with the same figures we quote." />
          </div>
          <dl className="divide-y divide-v2-ink-200 border-y border-v2-ink-200">
            {copy.faq.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 sm:grid-cols-[15rem_1fr] sm:gap-8">
                <dt className="flex items-start gap-2 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                  <Icon name="chat" size={15} className="mt-1 shrink-0 text-v2-ink-300" />
                  {f.q}
                </dt>
                <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export { productCopy };
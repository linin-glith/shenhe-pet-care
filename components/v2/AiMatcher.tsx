'use client';

/**
 * AiMatcher — the four-question product matcher.
 *
 * WHY THIS EXISTS
 * The AI Product Match page has been linked from every page of the site and
 * listed in the sitemap since it was built, and it promised the visitor that
 * answering four questions would return the top five matching SKUs. It did
 * not: the page was a static form with no logic behind it. A page that
 * advertises a result and never produces one is worse than no page at all —
 * a buyer who spent two minutes answering questions deserves an answer.
 *
 * HOW IT MATCHES
 * The scoring is deliberately explainable rather than clever. Each SKU
 * accumulates a score from the four answers:
 *
 *   line      the product line the buyer picked (decisive — a buyer who says
 *             "grooming" does not want a disinfectant)
 *   function  the function the buyer picked, matched against the SKU's
 *             function and application text
 *   market    the destination market, matched against the certifications a
 *             SKU carries, so a SKU that cannot be cleared in the destination
 *             is penalised rather than silently recommended
 *   volume    the volume band, matched against the SKU's MOQ: an SKU whose
 *             minimum is above what the buyer can order is not a match
 *
 * The result lists the score's reasons underneath each SKU. A buyer who is
 * about to place a real order deserves to see why they were told what they
 * were told, and a sales team receiving the enquiry can read the same
 * reasons.
 *
 * NO DATA LEAVES THE BROWSER. The catalogue is compiled into the bundle at
 * build time; nothing is sent anywhere, and no API is called.
 */
import { useMemo, useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { PRODUCTS, type MatcherProduct } from '@/content/v2/matcher-data';
import { LINE_LABEL } from '@/lib/product-routing';

type Option = { value: string; label: string; hint?: string };

/*
 * The labels are read from the one map in lib/product-routing.ts. This file
 * used to spell "Deodorizing & Disinfection" where the catalogue spells
 * "Deodorizing & Disinfecting", so the picker offered a line name that
 * appears nowhere else on the site.
 */
const LINE_OPTIONS: Option[] = [
  { value: 'deodorizing_disinfection', label: LINE_LABEL.deodorizing_disinfection, hint: 'Environment and odor' },
  { value: 'grooming_care', label: LINE_LABEL.grooming_care, hint: 'On the animal' },
  { value: 'outdoor_protection', label: LINE_LABEL.outdoor_protection, hint: 'Before and during walks' },
  { value: 'pet_nutrition', label: LINE_LABEL.pet_nutrition, hint: 'Supplements' },
];

const FUNCTION_OPTIONS: Option[] = [
  { value: 'deodorize', label: 'Deodorize', hint: 'Remove odor at source' },
  { value: 'disinfect', label: 'Disinfect', hint: 'Kill pathogens on surfaces' },
  { value: 'cleanse', label: 'Cleanse and condition', hint: 'Wash the coat' },
  { value: 'protect', label: 'Repel insects', hint: 'Outdoor protection' },
  { value: 'support', label: 'Digestive or immune support', hint: 'Oral supplements' },
  { value: 'control', label: 'Control mites and fungus', hint: 'Targeted treatment' },
];

const MARKET_OPTIONS: Option[] = [
  { value: 'us', label: 'United States', hint: 'FDA registration' },
  { value: 'eu', label: 'European Union', hint: 'GPSR, REACH' },
  { value: 'au', label: 'Australia & New Zealand', hint: 'APVMA, ARTG' },
  { value: 'other', label: 'Other / not sure yet', hint: 'We will confirm' },
];

const VOLUME_OPTIONS: Option[] = [
  { value: '500', label: '500 – 2,000 bottles', hint: 'First production run' },
  { value: '2000', label: '2,000 – 10,000 units', hint: 'Line launch' },
  { value: '10000', label: '10,000 – 50,000 units', hint: 'Scaling' },
  { value: '50000', label: '50,000+ units', hint: 'Programme volume' },
];

/** Which certifications a SKU carries, as market keys. */
function marketsFor(p: MatcherProduct): string[] {
  const out: string[] = [];
  const certs = p.certs.join(' ').toLowerCase();
  if (certs.includes('fda')) out.push('us');
  if (certs.includes('gmp') || certs.includes('iso')) out.push('eu', 'au', 'other');
  if (p.permit) out.push('eu', 'au');
  return out;
}

/** Which functions a SKU plausibly covers, from its own record text. */
function functionsFor(p: MatcherProduct): string[] {
  const text = `${p.function} ${p.application.join(' ')} ${p.name}`.toLowerCase();
  const out: string[] = [];
  if (/deodor|odor|odour|ammonia|odor control/.test(text)) out.push('deodorize');
  if (/disinfect|kill rate|pathogen|antifungal|fung|sterilis/.test(text)) out.push('disinfect', 'control');
  if (/wash|cleans|shampoo|foam|cleanse|bath/.test(text)) out.push('cleanse');
  if (/repel|insect|mosquito|mugwort|citronella/.test(text)) out.push('protect');
  if (/probiotic|immunoglob|IgG|colostrum|digestive|nutrition/.test(text)) out.push('support');
  if (/mite|ringworm|fung/.test(text)) out.push('control');
  return [...new Set(out)];
}

function scoreProduct(
  p: MatcherProduct,
  answers: { line: string; fn: string; market: string; volume: string },
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // The line is decisive. A buyer who named the line gets the line.
  if (p.line === answers.line) {
    score += 50;
    reasons.push(`In the ${p.lineLabel} line you selected`);
  } else {
    // Off-line SKUs are not excluded — a buyer often does not know which
    // line their product belongs to — but they rank far below.
    score -= 20;
  }

  // Function.
  const fns = functionsFor(p);
  if (fns.includes(answers.fn)) {
    score += 30;
    reasons.push(`Covers the function you need: ${p.function.split(';')[0]}`);
  }

  // Market. A SKU that cannot be cleared in the destination is a poor
  // recommendation, so the mismatch is penalised rather than hidden.
  const mk = marketsFor(p);
  if (answers.market !== 'other' && mk.length && !mk.includes(answers.market)) {
    score -= 15;
    reasons.push(`Check the market paperwork for ${answers.market.toUpperCase()} — this SKU's certifications cover ${mk.join(', ').toUpperCase()}`);
  } else if (answers.market !== 'other') {
    score += 15;
    reasons.push(`Certifications cover ${answers.market.toUpperCase()}`);
  }

  // Volume. An SKU whose minimum is above the order size is not sellable.
  const vol = Number(answers.volume);
  if (Number.isFinite(vol) && Number.isFinite(p.moq)) {
    if (p.moq <= vol) {
      score += 15;
      reasons.push(`MOQ ${p.moq.toLocaleString()} fits your order size`);
    } else {
      score -= 25;
      reasons.push(`MOQ is ${p.moq.toLocaleString()} — above the order size you entered`);
    }
  }

  // A lower minimum is a tiebreaker among equally good matches.
  score -= Math.min(p.moq / 1000, 12);

  return { score, reasons };
}

export function AiMatcher() {
  const [answers, setAnswers] = useState({ line: '', fn: '', market: '', volume: '' });
  const [done, setDone] = useState(false);

  const steps: { key: keyof typeof answers; title: string; options: Option[] }[] = [
    { key: 'line', title: 'Which product line?', options: LINE_OPTIONS },
    { key: 'fn', title: 'What function do you need?', options: FUNCTION_OPTIONS },
    { key: 'market', title: 'Where will you sell?', options: MARKET_OPTIONS },
    { key: 'volume', title: 'Order volume for the first PO?', options: VOLUME_OPTIONS },
  ];

  const answered = steps.filter((s) => answers[s.key]).length;
  const complete = answered === steps.length;

  const results = useMemo(() => {
    if (!complete) return [];
    return PRODUCTS.map((p) => ({ p, ...scoreProduct(p, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [answers, complete]);

  const pick = (key: keyof typeof answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
  };

  return (
    <div>
      {/* ---------- steps ---------- */}
      <ol className="grid gap-8">
        {steps.map((s, i) => {
          const picked = answers[s.key];
          return (
            <li key={s.key}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-v2-accent-700">
                  Step {i + 1} of {steps.length}
                </span>
                {/*
                  * h2, not h3.
                  *
                  * The page's title is the v2 header's <h1>, so the four steps
                  * are its top-level sections. As h3 they skipped a level
                  * (h1 -> h3), which the heading check flags. The visual is
                  * unchanged: globals.css gives h1-h4 the same display font,
                  * and the size, weight and colour are set by the classes
                  * below, not by the tag.
                  */}
                <h2 className="text-base font-semibold text-v2-ink-900">{s.title}</h2>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {s.options.map((o) => {
                  const on = picked === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => pick(s.key, o.value)}
                      aria-pressed={on}
                      className={`v3-card flex flex-col items-start gap-1 p-4 text-left transition ${
                        on
                          ? 'v3-card--interactive border-v2-accent-500 bg-v2-accent-050'
                          : 'hover:border-v2-ink-300'
                      }`}
                    >
                      <span className="flex w-full items-center gap-2">
                        {on && <Icon name="check" size={15} className="shrink-0 text-v2-accent-700" />}
                        <span className="text-sm font-semibold text-v2-ink-900">{o.label}</span>
                      </span>
                      {o.hint && (
                        <span className="pl-[23px] text-xs text-v2-ink-500">{o.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ---------- action ---------- */}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setDone(true)}
          disabled={!complete}
          className={`inline-flex items-center gap-2 rounded-v2-md px-6 py-3 text-sm font-semibold transition ${
            complete
              ? 'bg-v2-accent-600 text-white hover:bg-v2-accent-700'
              : 'cursor-not-allowed bg-v2-ink-100 text-v2-ink-400'
          }`}
        >
          {complete ? 'Show my top 5 matches' : `${answered} of ${steps.length} answered`}
          {complete && <span aria-hidden>&rarr;</span>}
        </button>
        {answered > 0 && (
          <button
            type="button"
            onClick={() => {
              setAnswers({ line: '', fn: '', market: '', volume: '' });
              setDone(false);
            }}
            className="text-sm font-semibold text-v2-ink-500 underline underline-offset-4 hover:text-v2-ink-800"
          >
            Start over
          </button>
        )}
      </div>

      {/* ---------- results ---------- */}
      {done && complete && (
        <section className="mt-14" aria-live="polite">
          <V3Head
            title="Your top 5 matches"
            sub="Ranked against your four answers, with the reason for each."
          />

          <ol className="mt-10 grid gap-5">
            {results.map((r, i) => (
              <li key={r.p.id}>
                <a
                  href={`/products/${r.p.slug}.html`}
                  className="v3-card v3-card--interactive v3-rise flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6"
                >
                  <span
                    aria-hidden
                    className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-v2-accent-050 font-mono text-sm font-bold text-v2-accent-700 ring-1 ring-v2-accent-100"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold tracking-tight text-v2-ink-900">
                      {r.p.name}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] tabular-nums text-v2-ink-400">
                      {r.p.sku} · MOQ {r.p.moq.toLocaleString()} {r.p.moqUnit} · {r.p.lead}
                    </span>
                    <span className="mt-3 block text-sm leading-relaxed text-v2-ink-600">
                      {r.p.function}
                    </span>
                    <ul className="mt-4 space-y-1.5">
                      {r.reasons.slice(0, 3).map((reason) => (
                        <li key={reason} className="flex items-start gap-2 text-xs text-v2-ink-500">
                          <Icon
                            name={reason.startsWith('Check') ? 'shield' : 'check'}
                            size={13}
                            className={`mt-0.5 shrink-0 ${
                              reason.startsWith('Check') ? 'text-v2-ink-400' : 'text-v2-accent-600'
                            }`}
                          />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-v2-accent-700">
                    View <span aria-hidden>&rarr;</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-v2-lg border border-v2-accent-300 bg-v2-accent-050 p-6">
            <p className="text-[0.9375rem] font-semibold text-v2-ink-900">
              Not quite right?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-v2-ink-500">
              Send the target market and the spec you need. A named sales manager replies within
              one business day — and the quote carries the landed cost, not just the unit price.
            </p>
            <a
              href="/contact.html"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-accent-700"
            >
              Get a custom quote <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

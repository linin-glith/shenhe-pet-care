/**
 * The data bar: the numbers under the opening sentence.
 *
 * WHY IT EXISTS
 * The opening sentence on every landing page says the thing the page
 * is for. It is a conclusion, and it is the right one. What it was
 * missing is the evidence, and a conclusion without evidence reads as
 * a claim — the same claim every competitor makes.
 *
 * So the conclusion stays exactly as it is, and the numbers go under
 * it. A buyer who scans three seconds sees the conclusion and the
 * figures that back it.
 *
 * WHY THE FIGURES COME FROM THE CONFIGURATION
 * siteConfig.metrics is the authority for every number on this site.
 * Reading it here means the data bar cannot disagree with the factory
 * page, the certifications page or the catalogue — the numbers are
 * one set of numbers, in one place, and a change to the factory's
 * capacity changes every page that says it.
 *
 * WHY IT IS NOT A CLAIM
 * Each figure says what it is. "30,000 m² industrial park" is a
 * measurement. "20 SKUs" is a count. None of them is an adjective.
 */

import { siteConfig } from '@/lib/shenhe.config';

export type DataBarItem = {
  /** The figure itself. */
  value: string;
  /** What the figure is. */
  label: string;
  /** The long form, for a screen reader and for a reader who wants it. */
  detail?: string;
};

export type DataBarProps = {
  items: DataBarItem[];
  /** The heading above the row. */
  caption?: string;
  /** The class of the wrapper, so a page can put it on a dark ground. */
  tone?: 'light' | 'dark';
  className?: string;
};

/** The figures every page can carry, read from the configuration. */
export function standardDataBar(picks: ('park' | 'capacity' | 'skus' | 'people' | 'labs' | 'years' | 'markets' | 'lines' | 'reject')[]): DataBarItem[] {
  const m = siteConfig.metrics;
  const all: Record<string, DataBarItem> = {
    park: { value: `${m.parkAreaM2.toLocaleString('en-US')} m²`, label: 'industrial park', detail: `${m.parkAreaM2.toLocaleString('en-US')} m² industrial park in Heyuan, Guangdong` },
    capacity: { value: `${m.monthlyCapacityBottles.toLocaleString('en-US')} bottles`, label: 'a month', detail: `${m.monthlyCapacityBottles.toLocaleString('en-US')} bottles a month` },
    skus: { value: String(m.catalogueSkuCount), label: 'catalogue SKUs', detail: `${m.catalogueSkuCount} SKUs on ${m.productLines} product lines, all private label` },
    people: { value: String(m.employees), label: 'employees', detail: `${m.employees} employees, including 8 in-house chemists` },
    labs: { value: String(m.reportCount), label: 'third-party reports', detail: `${m.reportCount} laboratory reports from GDDCM and NACC` },
    years: { value: `${m.yearsInBusiness}`, label: 'years exporting', detail: `exporting since ${siteConfig.brand.foundedYear}` },
    markets: { value: String(m.exportsToCountries), label: 'export markets', detail: `shipping to ${m.exportsToCountries} countries` },
    lines: { value: String(m.productionLines), label: 'production lines', detail: `${m.productionLines} production lines` },
    /*
     * THE RATE NOBODY ELSE PUBLISHES.
     *
     * A certificate is a ticket the buyer checks and moves past. A
     * reject rate is the answer to the question every buyer asks
     * and no factory publishes: what happens to a batch that fails.
     * So it goes in the bar a buyer reads on the way to the
     * catalogue, read from the configuration the production and
     * factory pages read.
     */
    reject: { value: `${m.batchRejectRatePct}%`, label: 'batch reject rate', detail: `${m.batchRejectRatePct}% batch reject rate, year to date in 2026, published rather than rounded down` },
  };
  return picks.map((p) => all[p]).filter(Boolean);
}

export default function DataBar({ items, caption, tone = 'light', className = '' }: DataBarProps) {
  if (!items.length) return null;
  const dark = tone === 'dark';
  return (
    <dl
      className={
        'mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-6 sm:grid-cols-3 lg:grid-cols-4 ' +
        (dark ? 'border-v2-ink-700' : 'border-v2-ink-200') +
        ' ' +
        className
      }
    >
      {items.map((it) => (
        <div key={it.label}>
          <dt className={'text-[11px] font-semibold uppercase tracking-[0.12em] ' + (dark ? 'text-v2-ink-300' : 'text-v2-ink-500')}>
            {it.label}
          </dt>
          {/* The note lives inside the description: a group may only hold
              terms and descriptions, and a <p> in one is what PageSpeed
              calls a malformed accessibility tree. */}
          <dd>
            <span className={'block mt-1 font-mono text-xl font-semibold tabular-nums ' + (dark ? 'text-v2-ink-100' : 'text-v2-ink-900')}>
              {it.value}
            </span>
            {it.detail && (
              <span className={'mt-0.5 block text-[11px] leading-snug ' + (dark ? 'text-v2-ink-300' : 'text-v2-ink-500')}>
                {it.detail}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The fit table — the same twenty SKUs against one market's rules.
 *
 * WHY IT IS A COMPONENT AND NOT PAGE CODE
 * The US page grew this table first, inline. The EU page needs the same table
 * with different citations, and the product pages need the verdict per SKU. One
 * component reads lib/market-claims.ts, so a change to a judgement lands in all
 * three places instead of in whichever copy someone remembered to edit.
 *
 * WHY THE TABLE IS DUPLICATED AS CARDS
 * Four columns are what makes the table worth reading, and at 390 px the fourth
 * — the verdict — sits outside the viewport behind a horizontal scroll a reader
 * does not perform. The small screen gets the same four facts stacked.
 *
 * THE DOCUMENT COLUMN CARRIES OUR OWN EVIDENCE, NOT A REGULATOR'S WORD
 * A safety data sheet exists for all twenty SKUs, and two of them carry a test
 * report number. That is a claim about what we can hand over, which is the
 * question a buyer is actually asking.
 */
import { products, productUrl } from '@/lib/products';
import { MARKET_LABEL, SKU_MARKET, type MarketPosition } from '@/lib/market-claims';

const US_LABEL: Partial<Record<MarketPosition, string>> = {
  authorisation: 'needs your EPA registration',
};

const EU_LABEL: Partial<Record<MarketPosition, string>> = {
  authorisation: 'needs an authorisation',
};

const TONE: Record<MarketPosition, string> = {
  ships: 'text-v2-accent-700',
  off: 'text-v2-ink-900',
  authorisation: 'text-v2-ink-900',
  check: 'text-v2-ink-600',
};

export function MarketFitTable({ market }: { market: 'us' | 'eu' }) {
  const rows = products
    .filter((p) => SKU_MARKET[p.id])
    .map((p) => ({
      id: p.id,
      name: p.name_en,
      url: productUrl(p),
      claim: SKU_MARKET[p.id].claim,
      ...SKU_MARKET[p.id][market],
      hasSds: Boolean(p.msds_available),
      report: /NACCYH\d+/.exec(SKU_MARKET[p.id].claim)?.[0] ?? null,
    }));

  const label = (pos: MarketPosition) =>
    (market === 'us' ? US_LABEL[pos] : EU_LABEL[pos]) ?? MARKET_LABEL[pos];

  return (
    <>
      <div className="mt-10 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-v2-ink-200 text-left">
              <th className="py-3 pr-6 font-semibold text-v2-ink-900">SKU</th>
              <th className="py-3 pr-6 font-semibold text-v2-ink-900">What our page says today</th>
              <th className="py-3 pr-6 font-semibold text-v2-ink-900">Position</th>
              <th className="py-3 pr-6 font-semibold text-v2-ink-900">Decided by</th>
              <th className="py-3 font-semibold text-v2-ink-900">Why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-v2-ink-200 align-top">
                <td className="py-4 pr-6">
                  <a
                    href={row.url}
                    className="font-semibold text-v2-ink-900 underline decoration-v2-ink-300 underline-offset-2 hover:decoration-v2-ink-900"
                  >
                    {row.id}
                  </a>
                  <span className="mt-1 block text-xs leading-snug text-v2-ink-600">{row.name}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-v2-ink-500">
                    {row.hasSds ? 'SDS on file' : 'SDS pending'}
                    {row.report ? ` · report ${row.report}` : ''}
                  </span>
                </td>
                <td className="py-4 pr-6 text-v2-ink-700">&ldquo;{row.claim}&rdquo;</td>
                <td className={`py-4 pr-6 font-semibold ${TONE[row.position]}`}>{label(row.position)}</td>
                <td className="py-4 pr-6 text-xs leading-snug text-v2-ink-600">{row.basis}</td>
                <td className="py-4 text-v2-ink-600">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-v2-lg border border-v2-ink-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-3">
              <a
                href={row.url}
                className="font-semibold text-v2-ink-900 underline decoration-v2-ink-300 underline-offset-2"
              >
                {row.id}
              </a>
              <span className={`shrink-0 text-right text-xs font-semibold ${TONE[row.position]}`}>
                {label(row.position)}
              </span>
            </div>
            <p className="mt-1 text-sm text-v2-ink-600">{row.name}</p>
            <p className="mt-2 text-sm text-v2-ink-700">&ldquo;{row.claim}&rdquo;</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-v2-ink-500">{row.basis}</p>
            <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">{row.note}</p>
            <p className="mt-2 text-[11px] text-v2-ink-500">
              {row.hasSds ? 'SDS on file' : 'SDS pending'}
              {row.report ? ` · report ${row.report}` : ''}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

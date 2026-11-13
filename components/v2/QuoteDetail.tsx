'use client';

/**
 * One quotation, in full.
 *
 * WHY THE PRICE IS HERE AND NOT ON THE LIST
 * A buyer who signs in, opens their own quotation and reads it is
 * asking for the price. The list is the screen that gets glanced at,
 * shared, or left open on a desk; this is opened deliberately, by the
 * person the quotation is for. The boundary is the action, not the page.
 *
 * So the list endpoint carries no money and this one does. They are two
 * separate calls on purpose: if the price were a field on the list, it
 * would be one line of code away from appearing on a screen nobody
 * meant to show it on.
 */

import { useSearchParams } from 'next/navigation';
import { Chip, Failed, PageHead, formatDate, usePortalData } from './portal-shared';

type QuoteLine = {
  id: number;
  sku: string;
  product_name: string | null;
  spec: string | null;
  tier_label: string | null;
  min_qty: number | null;
  max_qty: number | null;
  qty: number | null;
  unit_price: string | number | null;
  lead_time_note: string | null;
};

type Quote = {
  id: number;
  quote_no: string;
  status: string;
  currency: string;
  incoterm: string | null;
  validity_days: number | null;
  valid_until: string | null;
  lead_time_days: number | null;
  subtotal: string | number | null;
  freight: string | number | null;
  total: string | number | null;
  terms_note: string | null;
  sent_at: string | null;
  created_at: string;
  inquiry_reference: string | null;
  lines: QuoteLine[];
};

type Payload = { quote: Quote };

const STAGE: Record<string, { label: string; note: string; tone: string }> = {
  draft: { label: 'Being prepared', note: 'Your sales manager is preparing this offer.', tone: 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200' },
  sent: { label: 'Sent', note: 'This offer is with you. It holds to the date below.', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  revised: { label: 'Revised', note: 'This offer has been revised. The figures below are the current ones.', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  accepted: { label: 'Accepted', note: 'Thank you — this offer is confirmed and becomes an order.', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Closed', note: 'This offer was not taken up. You are welcome to come back.', tone: 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200' },
  expired: { label: 'Expired', note: 'This offer passed its validity date. Ask for a fresh one.', tone: 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200' },
};

function money(value: string | number | null, currency: string) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'CNY' ? '¥' : '';
  return symbol
    ? `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function QuoteDetail() {
  // The quotation is chosen with a query parameter rather than a route
  // segment: the quotation numbers live in the database and are made at
  // runtime, and a static export cannot know them at build time.
  const params = useSearchParams();
  const id = params?.get('id') ?? '';
  const { state } = usePortalData<Payload>(`/api/portal/quotes/${id}`);

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const q = state.data.quote;
  const stage = STAGE[q.status] ?? {
    label: q.status,
    note: '',
    tone: 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200',
  };

  return (
    <>
      <PageHead
        title="Quotation"
        lead={`${q.quote_no}${q.inquiry_reference ? ` · for enquiry ${q.inquiry_reference}` : ''}`}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Chip tone={stage.tone}>{stage.label}</Chip>
        <a
          href="/portal/quotes.html"
          className="text-sm font-medium text-v2-accent-600 underline underline-offset-4"
        >
          All quotations
        </a>
      </div>

      {stage.note && (
        <p className="mt-4 text-sm leading-relaxed text-v2-ink-600">{stage.note}</p>
      )}

      <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">Valid until</dt>
          <dd className="mt-1 text-v2-ink-900">
            {q.valid_until ? formatDate(q.valid_until) : '—'}
            {q.validity_days ? <span className="text-v2-ink-500"> · {q.validity_days} days</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">Delivery</dt>
          <dd className="mt-1 text-v2-ink-900">
            {q.lead_time_days ? `${q.lead_time_days} days` : '—'}
            {q.incoterm ? <span className="text-v2-ink-500"> · {q.incoterm}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">Currency</dt>
          <dd className="mt-1 text-v2-ink-900">{q.currency}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">Sent</dt>
          <dd className="mt-1 text-v2-ink-900">{q.sent_at ? formatDate(q.sent_at) : '—'}</dd>
        </div>
      </dl>

      <div className="mt-8 overflow-x-auto rounded-v2-md border border-v2-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-v2-ink-200 text-left text-xs font-semibold uppercase tracking-[0.1em] text-v2-ink-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3 text-right">Unit price</th>
              <th className="px-4 py-3 text-right">Line</th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l) => {
              const qty = Number(l.qty ?? 0);
              const unit = Number(l.unit_price ?? 0);
              const line = qty * unit;
              return (
                <tr key={l.id} className="border-b border-v2-ink-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-v2-ink-500">{l.sku}</span>
                    <span className="ml-2 font-medium text-v2-ink-900">
                      {l.product_name ?? 'Product'}
                    </span>
                    {l.spec ? <span className="ml-2 text-v2-ink-500">{l.spec}</span> : null}
                    {l.tier_label ? (
                      <span className="ml-2 text-xs text-v2-ink-500">{l.tier_label}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-v2-ink-700">
                    {qty ? qty.toLocaleString('en-US') : '—'}
                    {l.min_qty ? (
                      <span className="ml-1 text-xs text-v2-ink-500">(min {l.min_qty.toLocaleString('en-US')})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-v2-ink-700">
                    {money(l.unit_price, q.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-v2-ink-900">
                    {money(line, q.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-v2-ink-200">
              <td className="px-4 py-2.5 text-sm text-v2-ink-600" colSpan={3}>
                Subtotal
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-v2-ink-700">
                {money(q.subtotal, q.currency)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-sm text-v2-ink-600" colSpan={3}>
                Freight
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-v2-ink-700">
                {money(q.freight, q.currency)}
              </td>
            </tr>
            <tr className="border-t border-v2-ink-200">
              <td className="px-4 py-3 text-sm font-semibold text-v2-ink-900" colSpan={3}>
                Total
              </td>
              <td className="px-4 py-3 text-right font-mono text-base font-semibold tabular-nums text-v2-ink-900">
                {money(q.total, q.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {q.terms_note && (
        <div className="mt-6 rounded-v2-md border-l-2 border-v2-accent-500 bg-v2-accent-050 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
            Terms
          </p>
          <p className="mt-2 text-sm leading-relaxed text-v2-ink-700">{q.terms_note}</p>
        </div>
      )}
    </>
  );
}

'use client';

/**
 * The buyer's quotations.
 *
 * WHAT IS DELIBERATELY ABSENT
 * The unit price, the subtotal, the total and the freight. The API does
 * not select those columns, so there is nothing here to strip - and
 * nothing for a later change to forget to strip. What a buyer sees is
 * that an offer exists, what it covers, how long it holds and when the
 * goods would ship.
 *
 * WHY THE MONEY IS NOT HERE
 * The site's rule is that a price is given when the buyer asks for one,
 * in a conversation, with a specification behind it. A quotation page
 * behind a sign-in is still a published place, and the unit price on it
 * would be a price published against an order nobody has placed. The
 * quotation number, the validity date and the delivery are the parts a
 * buyer needs to decide whether to ask.
 */

import {
  Chip, Empty, Failed, PageHead, formatDate, usePortalData,
} from './portal-shared';

type QuoteLine = {
  id: number;
  sku: string;
  product_name: string | null;
  spec: string | null;
  tier_label: string | null;
  min_qty: number | null;
  max_qty: number | null;
  qty: number | null;
  lead_time_note: string | null;
};

type Quote = {
  id: number;
  quote_no: string;
  status: string;
  incoterm: string | null;
  validity_days: number | null;
  valid_until: string | null;
  lead_time_days: number | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
  line_count: number;
  total_qty: number;
  lines: QuoteLine[];
};

type Payload = { quotes: Quote[] };

/** What the buyer is told about each stage of an offer. */
const STAGE: Record<string, { label: string; note: string; tone: 'neutral' | 'good' | 'warn' }> = {
  draft: { label: 'Being prepared', note: 'Your sales manager is preparing this offer.', tone: 'neutral' },
  sent: { label: 'Sent', note: 'This offer is with you. The price is in the email that carried it.', tone: 'good' },
  accepted: { label: 'Accepted', note: 'Thank you — this offer is confirmed and becomes an order.', tone: 'good' },
  declined: { label: 'Closed', note: 'This offer was not taken up. You are welcome to come back.', tone: 'neutral' },
  expired: { label: 'Expired', note: 'This offer passed its validity date. Ask for a fresh one.', tone: 'warn' },
};

function stageOf(q: Quote) {
  return STAGE[q.status] ?? { label: q.status, note: '', tone: 'neutral' as const };
}

export default function QuoteList() {
  const { state } = usePortalData<Payload>('/api/portal/quotes');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const list = state.data.quotes ?? [];

  if (list.length === 0) {
    return (
      <>
        <PageHead
          title="Quotations"
          lead="Every offer we have sent you, with the date it holds to and the delivery it covers."
        />
        <Empty
          title="No quotations yet"
          body="Once a sales manager has sent you an offer it appears here, with what it covers, how long it is good for and when the goods would ship. The price itself is in the email that carried it."
          action={{ href: '/portal/inquiry.html', label: 'See your enquiries' }}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Quotations"
        lead="Every offer we have sent you, with the date it holds to and the delivery it covers."
      />

      <ul className="mt-8 space-y-5">
        {list.map((q) => {
          const stage = stageOf(q);
          return (
            <li key={q.id} className="rounded-v2-md border border-v2-ink-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-v2-ink-900">{q.quote_no}</span>
                <Chip tone={stage.tone}>{stage.label}</Chip>
              </div>

              {stage.note && (
                <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">{stage.note}</p>
              )}

              <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
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
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">Covers</dt>
                  <dd className="mt-1 text-v2-ink-900">
                    {q.line_count} {q.line_count === 1 ? 'product' : 'products'}
                    {q.total_qty ? <span className="text-v2-ink-500"> · {q.total_qty.toLocaleString('en-US')} units</span> : null}
                  </dd>
                </div>
              </dl>

              {q.lines.length > 0 && (
                <ul className="mt-5 divide-y divide-v2-ink-200 border-t border-v2-ink-200">
                  {q.lines.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                      <div>
                        <span className="font-mono text-xs text-v2-ink-500">{l.sku}</span>
                        <span className="ml-2 text-sm font-medium text-v2-ink-900">
                          {l.product_name ?? 'Product'}
                        </span>
                        {l.spec ? <span className="ml-2 text-sm text-v2-ink-500">{l.spec}</span> : null}
                        {l.lead_time_note ? (
                          <span className="mt-1 block text-xs text-v2-ink-500">{l.lead_time_note}</span>
                        ) : null}
                      </div>
                      <span className="font-mono text-sm tabular-nums text-v2-ink-700">
                        {l.qty ? `${l.qty.toLocaleString('en-US')} units` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {q.sent_at && (
                <p className="mt-4 text-xs text-v2-ink-500">Sent {formatDate(q.sent_at)}</p>
              )}

              <a
                href={`/portal/quotes/detail.html?id=${q.id}`}
                className="mt-4 inline-block text-sm font-medium text-v2-accent-600 underline underline-offset-4"
              >
                Open this quotation
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

'use client';

/**
 * The enquiries, with the thread.
 *
 * WHY EACH ENQUIRY CARRIES ITS REPLIES
 * A buyer sends an enquiry and then hears nothing, which is indistinguishable
 * from an enquiry that was lost. Showing the number of replies and the note
 * our desk last wrote for them removes that doubt.
 *
 * WHY THE QUOTATION STATE IS SHOWN BUT NOT ITS PRICE
 * A buyer needs to know a quotation exists, whether it is still open and
 * when it expires. The price is a matter between the buyer and the sales
 * manager, and the API does not select it.
 */

import { useEffect, useState } from 'react';
import {
  Chip, Empty, Failed, PageHead, enquiryTone, formatDate, usePortalData,
  type Inquiry,
} from './portal-shared';

type Enquiry = {
  id: number; reference: string; company: string | null; country: string | null;
  name: string | null; email: string | null; status: string; source: string | null;
  created_at: string; updated_at: string; message: string | null; products: string[] | null;
  reply_count: number; last_reply_at: string | null; last_reply: string | null;
  quote_count: number; quote_status: string | null; quote_valid_until: string | null;
  quote_no: string | null; quote_id: number | null;
  order_no: string | null; order_id: number | null;
  stage: { label: string; note: string };
};

/**
 * WHERE THE ENQUIRY IS, AS A PATH.
 *
 * The stage label says where it is. What it does not say is how far
 * along that is, and whether the step it reached took a day or three
 * weeks - which is the question a buyer actually has when they cannot
 * tell whether something is moving.
 *
 * So the path is shown: the steps are the ones that exist, the ones
 * that have been reached are filled, and the ones that have not are
 * not. A buyer can see whether they are waiting on us (before the
 * quotation) or on themselves (after it).
 */
const PATH = [
  { key: 'new', label: 'Received' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'won', label: 'Accepted' },
  { key: 'production', label: 'In production' },
  { key: 'shipped', label: 'Shipped' },
];

/** How far along the path a status is. The order is the order of the
 *  steps, so it is a matter of where the status sits in the list. */
const STEP_OF: Record<string, number> = {
  new: 0, assigned: 0,
  quoted: 1, sampling: 1, negotiating: 1,
  won: 2, production: 3, shipped: 4,
};

type Payload = { enquiries: Enquiry[] };

const QUOTE_LABEL: Record<string, string> = {
  draft: 'being prepared',
  sent: 'sent, awaiting your decision',
  revised: 'revised',
  accepted: 'accepted',
  rejected: 'not taken up',
  expired: 'expired',
};

export default function InquiryList() {
  const { state } = usePortalData<Payload>('/api/portal/enquiries');

  /*
   * The reference the reply notice pointed at.
   *
   * The notice says "we have replied" and gives a link. A link that
   * lands on a list of six enquiries, with the one that was answered
   * somewhere in the middle, is a link that does not answer the
   * question the buyer clicked it with. So the enquiry that was
   * answered is brought to the top and marked, and the page says
   * which one it is.
   */
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setFocus(ref);
      // The list is rendered after this, so the scroll waits a tick.
      window.setTimeout(() => {
        const el = document.getElementById(ref);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, []);

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const all = state.data.enquiries ?? [];
  // The enquiry the notice was about comes first.
  const list = focus
    ? [...all].sort((a, b) => (a.reference === focus ? -1 : b.reference === focus ? 1 : 0))
    : all;

  if (list.length === 0) {
    return (
      <>
        <PageHead
          title="Your enquiries"
          lead="Every enquiry you have sent, the stage it has reached, and every reply we have written for you."
        />
        <Empty
          title="No enquiries yet"
          body="You do not need an account to ask for a price — send an enquiry and we will quote you. Once you have one, its progress appears here."
          action={{ href: '/contact.html', label: 'Send an enquiry' }}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Your enquiries"
        lead="Every enquiry you have sent, the stage it has reached, and every reply we have written for you. The reference is the one we quote in our emails — keep it for your records."
      />

      {focus && list.some((e) => e.reference === focus) && (
        <p className="mt-6 rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 px-4 py-3 text-sm text-v2-accent-800">
          Showing the enquiry we replied to first. The others are below.
        </p>
      )}

      <ul className="mt-8 space-y-5">
        {list.map((e) => (
          <li
            key={e.id}
            id={e.reference}
            className={
              'scroll-mt-8 rounded-v2-md border bg-white p-6 ' +
              (e.reference === focus
                ? 'border-v2-accent-500 ring-2 ring-v2-accent-100'
                : 'border-v2-ink-200')
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-v2-ink-900">
                {e.reference}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {e.quote_count > 0 && e.quote_status && (
                  <Chip tone="accent">
                    Quotation {QUOTE_LABEL[e.quote_status] ?? e.quote_status}
                    {e.quote_valid_until ? ` · until ${formatDate(e.quote_valid_until)}` : ''}
                  </Chip>
                )}
                <Chip tone={enquiryTone(e.status)}>{e.stage.label}</Chip>
              </div>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">{e.stage.note}</p>

            {/*
              THE PATH, AND WHERE IT HAS GOT TO.
              *
              * Six steps is a lot of chrome for a list of enquiries, so
              * the path is a row of marks rather than a diagram. What
              * the buyer takes from it is the answer to "is this
              * moving, and am I the one it is waiting on".
              */}
            {(() => {
              const at = STEP_OF[e.status];
              if (at === undefined) return null;
              return (
                <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {PATH.map((s, i) => {
                    const done = i <= at;
                    const here = i === at;
                    return (
                      <li key={s.key} className="flex items-center gap-1.5">
                        <span
                          className={
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                            (here
                              ? 'bg-v2-accent-600 text-white'
                              : done
                                ? 'bg-v2-accent-100 text-v2-accent-800'
                                : 'bg-v2-ink-050 text-v2-ink-400')
                          }
                        >
                          {s.label}
                        </span>
                        {i < PATH.length - 1 && (
                          <span
                            className={
                              'h-px w-4 ' + (i < at ? 'bg-v2-accent-300' : 'bg-v2-ink-200')
                            }
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              );
            })()}

            {/*
              THE QUOTATION AND THE ORDER.
              *
              * The chip above says that a quotation exists. This says
              * which one, and lets the buyer open it, and says what
              * came out of it.
              */}
            {(e.quote_no || e.order_no) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {e.quote_no && (
                  <a
                    href={`/portal/quotes/detail.html?id=${e.quote_id}`}
                    className="rounded border border-v2-accent-500 px-2.5 py-1 text-[11px] font-semibold text-v2-accent-700 transition-colors hover:bg-v2-accent-050"
                  >
                    Open the quotation {e.quote_no}
                  </a>
                )}
                {e.order_no && (
                  <a
                    href="/portal/orders.html"
                    className="rounded border border-v2-ink-300 px-2.5 py-1 text-[11px] font-semibold text-v2-ink-700 transition-colors hover:border-v2-ink-500"
                  >
                    The order {e.order_no} is in your orders
                  </a>
                )}
              </div>
            )}

            <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Sent
                </dt>
                <dd className="mt-1 text-v2-ink-800">{formatDate(e.created_at)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Company
                </dt>
                <dd className="mt-1 text-v2-ink-800">{e.company ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Country
                </dt>
                <dd className="mt-1 text-v2-ink-800">{e.country ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Replies
                </dt>
                <dd className="mt-1 text-v2-ink-800">
                  {e.reply_count > 0
                    ? `${e.reply_count} · last ${formatDate(e.last_reply_at)}`
                    : 'none yet'}
                </dd>
              </div>
            </dl>

            {e.products && e.products.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Products
                </span>
                {e.products.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-v2-ink-050 px-2 py-0.5 font-mono text-[11px] text-v2-ink-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {e.message && (
              <div className="mt-5 border-t border-v2-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  What you asked
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-v2-ink-700">
                  {e.message}
                </p>
              </div>
            )}

            {e.last_reply && (
              <div className="mt-5 rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-accent-700">
                  Our last reply · {formatDate(e.last_reply_at)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-v2-ink-800">
                  {e.last_reply}
                </p>
              </div>
            )}

            {e.reply_count === 0 && !e.quote_count && (
              <p className="mt-5 border-t border-v2-ink-100 pt-4 text-sm text-v2-ink-500">
                We have not written back on this one yet. If it is urgent, message us on
                WhatsApp and quote the reference.
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

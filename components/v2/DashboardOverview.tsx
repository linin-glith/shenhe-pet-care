'use client';

/**
 * The buyer's overview.
 *
 * WHAT THIS SCREEN IS FOR
 * Three questions, in this order: what is happening on my account, what do
 * I need to do, and what can I download. A row of counters answers none of
 * them on its own, so the counters are followed by the one sentence that
 * matters, the timeline of what has happened, and the compliance files.
 *
 * WHY THE NEXT ACTION IS COMPUTED RATHER THAN SHOWN
 * Four counters leave the reader to work out what they mean. "Your enquiry
 * INQ-20261024-DE01A has been sent and is with our sales desk" is not
 * ambiguous and not a number the reader has to interpret.
 */

import {
  Empty, Failed, PageHead, Stat, usePortalData,
} from './portal-shared';

type Overview = {
  stats: {
    inquiries: { total: number; open: number };
    orders: { total: number; active: number };
    shipments: { total: number; in_transit: number };
    documents: { total: number };
    quotes: { total: number; awaiting: number };
    replies: { total: number; last_at: string | null };
  };
  account: {
    email: string; name: string | null; company: string | null;
    country: string | null; member_since: string | null;
  };
};

type Enquiry = {
  id: number; reference: string; company: string | null; country: string | null;
  status: string; created_at: string; message: string | null;
  /** Where it came from. A lead we found says so here. */
  source: string | null;
  reply_count: number; last_reply_at: string | null; last_reply: string | null;
  quote_count: number; quote_status: string | null; quote_valid_until: string | null;
  stage: { label: string; note: string };
};

type Activity = { kind: string; title: string; detail: string; at: string };

type Resource = { title: string; href: string; kind: string; description: string };

const KIND_LABEL: Record<string, string> = {
  enquiry: 'Enquiry',
  reply: 'Message',
  quote: 'Quotation',
  order: 'Order',
  shipment: 'Shipment',
  document: 'Document',
};

const KIND_TONE: Record<string, string> = {
  enquiry: 'bg-v2-ink-100 text-v2-ink-700',
  reply: 'bg-v2-accent-050 text-v2-accent-800',
  quote: 'bg-amber-50 text-amber-800',
  order: 'bg-emerald-50 text-emerald-800',
  shipment: 'bg-sky-50 text-sky-800',
  document: 'bg-violet-50 text-violet-800',
};

function ago(iso?: string | null): string {
  if (!iso) return '—';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'just now';
  if (h < 24) return `${Math.floor(h)} hours ago`;
  if (h < 48) return 'yesterday';
  if (h < 30 * 24) return `${Math.floor(h / 24)} days ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

export default function DashboardOverview() {
  const { state } = usePortalData<Overview>('/api/portal/overview');
  const enquiries = usePortalData<{ enquiries: Enquiry[] }>('/api/portal/enquiries');
  const activity = usePortalData<{ activity: Activity[] }>('/api/portal/activity');
  const resources = usePortalData<{ resources: Resource[] }>('/api/portal/resources');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const s = state.data.stats;
  const rows = enquiries.state.kind === 'ready' ? enquiries.state.data.enquiries : [];
  const activityRows = activity.state.kind === 'ready' ? activity.state.data.activity : [];

  /* ---- the one sentence that matters ---- */
  const openEnquiries = rows.filter((e) =>
    ['new', 'assigned', 'quoted', 'sampling', 'negotiating'].includes(e.status)
    // A lead is a company we went and found, not an enquiry that
    // came to us. Counting it here would make the funnel say that
    // we won enquiries we never received.
    && e.source !== 'ai-prospecting');
  const waitingOnUs = openEnquiries.find((e) => e.reply_count === 0);
  const awaitingReply = openEnquiries.find((e) => e.reply_count > 0);
  const orderInProgress = s.orders.active;

  let nextAction: { tone: 'accent' | 'amber' | 'plain'; title: string; body: string; href?: string } | null = null;
  if (waitingOnUs) {
    nextAction = {
      tone: 'amber',
      title: `Your enquiry ${waitingOnUs.reference} is with our sales desk`,
      body: 'We have received it and a sales manager is reviewing the specification. You will get a quotation here, and by email, once it is ready.',
      href: '/portal/inquiry.html',
    };
  } else if (awaitingReply) {
    nextAction = {
      tone: 'accent',
      title: `We have replied on ${awaitingReply.reference}`,
      body: 'Our reply is on your enquiries page. If the quotation does not cover what you need, message us and we will revise it.',
      href: '/portal/inquiry.html',
    };
  } else if (orderInProgress > 0) {
    nextAction = {
      tone: 'accent',
      title: `${orderInProgress} order${orderInProgress > 1 ? 's are' : ' is'} in production`,
      body: 'Your order page shows the stage and the date we have promised to ship.',
      href: '/portal/orders.html',
    };
  } else if (s.quotes.awaiting > 0) {
    nextAction = {
      tone: 'accent',
      title: `${s.quotes.awaiting} quotation${s.quotes.awaiting > 1 ? 's' : ''} awaiting your decision`,
      body: 'A quotation is valid for the date shown on it. Message us if you need it extended.',
      href: '/portal/inquiry.html',
    };
  }

  return (
    <>
      <PageHead
        title={`Good to see you${state.data.account.name ? ', ' + state.data.account.name.split(' ')[0] : ''}`}
        lead={
          state.data.account.company
            ? `${state.data.account.company}${state.data.account.country ? ' · ' + state.data.account.country : ''} — everything we have on your account, in one place.`
            : 'Everything we have on your account, in one place.'
        }
      />

      {/* ---- the counters ---- */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Open enquiries"
          value={s.inquiries.open}
          hint={`${s.inquiries.total} sent in total`}
        />
        <Stat
          label="Replies from us"
          value={s.replies.total}
          hint={s.replies.last_at ? `last one ${ago(s.replies.last_at)}` : 'none yet'}
        />
        <Stat
          label="Orders in progress"
          value={s.orders.active}
          hint={`${s.orders.total} in total`}
        />
        <Stat
          label="Your documents"
          value={s.documents.total}
          hint={`${s.shipments.in_transit} shipment${s.shipments.in_transit === 1 ? '' : 's'} moving`}
        />
      </div>

      {/* ---- the one sentence ---- */}
      {nextAction && (
        <div
          className={`mt-6 rounded-v2-md border p-6 ${
            nextAction.tone === 'amber'
              ? 'border-amber-300 bg-amber-50'
              : 'border-v2-accent-300 bg-v2-accent-050'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              nextAction.tone === 'amber' ? 'text-amber-900' : 'text-v2-ink-900'
            }`}
          >
            {nextAction.title}
          </p>
          <p
            className={`mt-1.5 max-w-3xl text-sm leading-relaxed ${
              nextAction.tone === 'amber' ? 'text-amber-800' : 'text-v2-ink-700'
            }`}
          >
            {nextAction.body}
          </p>
          {nextAction.href && (
            <a
              href={nextAction.href}
              className="mt-4 inline-block text-sm font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Go there →
            </a>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---- the activity ---- */}
        <section className="rounded-v2-md border border-v2-ink-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-v2-ink-900">Recent activity</h2>
          <p className="mt-0.5 text-xs text-v2-ink-500">
            Everything that has happened on your account, most recent first.
          </p>

          {activity.state.kind === 'loading' && (
            <p className="py-10 text-center text-sm text-v2-ink-400">Loading…</p>
          )}
          {activity.state.kind === 'error' && (
            <p className="py-10 text-center text-sm text-amber-700">
              {activity.state.message}
            </p>
          )}
          {activityRows.length === 0 && activity.state.kind === 'ready' && (
            <p className="py-10 text-center text-sm text-v2-ink-400">
              Nothing yet. Your enquiries and our replies will appear here.
            </p>
          )}
          {activityRows.length > 0 && (
            <ol className="mt-5 space-y-0">
              {activityRows.map((a, i) => (
                <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < activityRows.length - 1 && (
                    <span className="absolute left-[0.4375rem] top-5 h-full w-px bg-v2-ink-100" aria-hidden />
                  )}
                  <span
                    className={`relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${
                      KIND_TONE[a.kind] ?? 'bg-v2-ink-200'
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-mono text-xs font-semibold text-v2-ink-900">
                        {a.title}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-v2-ink-400">
                        {KIND_LABEL[a.kind] ?? a.kind}
                      </span>
                      <span className="text-xs text-v2-ink-400">{ago(a.at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-v2-ink-700">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---- the compliance files ---- */}
        <section className="rounded-v2-md border border-v2-ink-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-v2-ink-900">Certificates and data sheets</h2>
          <p className="mt-0.5 text-xs text-v2-ink-500">
            The paperwork your compliance team asks for.
          </p>

          {resources.state.kind === 'ready' && (
            <ul className="mt-5 space-y-3">
              {resources.state.data.resources.map((r) => (
                <li key={r.title}>
                  <a
                    href={r.href}
                    className="group block rounded-v2-md border border-v2-ink-100 p-3 transition-colors hover:border-v2-accent-300 hover:bg-v2-accent-050"
                  >
                    <p className="text-sm font-semibold text-v2-ink-900 group-hover:text-v2-accent-700">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-v2-ink-500">{r.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {resources.state.kind === 'loading' && (
            <p className="py-8 text-center text-sm text-v2-ink-400">Loading…</p>
          )}
        </section>
      </div>

      {/* ---- the enquiries, in brief ---- */}
      <section className="mt-6 rounded-v2-md border border-v2-ink-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-v2-ink-900">Your enquiries</h2>
            <p className="mt-0.5 text-xs text-v2-ink-500">
              Where each one stands, and whether we have replied.
            </p>
          </div>
          <a href="/portal/inquiry.html" className="text-xs font-semibold text-v2-accent-700 hover:underline">
            See all →
          </a>
        </div>

        {rows.length === 0 ? (
          <Empty
            title="No enquiries yet"
            body="When you send us a question about a product, a price or a lead time, it appears here with its progress."
          />
        ) : (
          <ul className="mt-5 divide-y divide-v2-ink-100">
            {rows.slice(0, 5).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 first:pt-0">
                <span className="font-mono text-xs font-semibold text-v2-ink-900">{e.reference}</span>
                <span className="text-sm text-v2-ink-800">{e.stage.label}</span>
                <span className="text-xs text-v2-ink-500">{ago(e.created_at)}</span>
                {e.reply_count > 0 && (
                  <span className="rounded bg-v2-accent-050 px-2 py-0.5 text-[11px] font-semibold text-v2-accent-800">
                    {e.reply_count} repl{e.reply_count === 1 ? 'y' : 'ies'}
                  </span>
                )}
                {e.quote_status && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Quotation {e.quote_status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

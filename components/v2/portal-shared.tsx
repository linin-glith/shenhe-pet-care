'use client';

/**
 * The shared pieces of the buyer portal.
 *
 * WHY THESE ARE IN ONE FILE
 * Eight pages that say "nothing here yet" in eight slightly different ways
 * looks like eight different products. The empty state, the failure state
 * and the count card are the same on every screen, so they are written once.
 *
 * WHAT THE PORTAL NEVER SHOWS
 * Prices, order totals, deposits. The API does not select those columns, so
 * there is nothing for this file to strip and nothing for a future change to
 * forget to strip.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePortal } from '@/components/v2/PortalShell';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Inquiry = {
  reference: string;
  company?: string | null;
  country?: string | null;
  status: string;
  created_at: string;
  source?: string | null;
  message?: string | null;
};

export type OrderLine = {
  id: number;
  sku: string;
  product_name: string | null;
  spec: string | null;
  qty_ordered: number;
  qty_shipped: number;
  lead_time_note: string | null;
  /**
   * The same quantity under the older name.
   *
   * Two backends are in flight for this site: the one in this repository
   * sends `qty_ordered`, and a deployed one may still send `qty`. The
   * pages read whichever is there, so a field name can never take a page
   * down.
   */
  qty?: number;
};

/**
 * How many units were ordered on a line.
 *
 * This used to be `line.qty_ordered.toLocaleString()` straight out of the
 * response. Against a backend that sends `qty`, that is
 * undefined.toLocaleString() — a crash, not a blank line, and the buyer's
 * order page went down with it.
 */
export function orderedQty(line: { qty_ordered?: number; qty?: number } | null | undefined): number {
  const n = Number(line?.qty_ordered ?? line?.qty ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** How many units of a line have actually gone out. */
export function shippedQty(line: { qty_shipped?: number } | null | undefined): number {
  const n = Number(line?.qty_shipped ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * A production batch, and the chain proof on it.
 *
 * The proof is a claim that the laboratory report for this batch has not
 * been changed since it was recorded. The buyer can check it: the
 * transaction is on a public chain and anyone can read it.
 */
export type Batch = {
  id: number;
  order_id: number;
  batch_no: string;
  sku: string;
  product_name: string | null;
  qty: number;
  status: string;
  produced_at: string | null;
  expiry_at: string | null;
  onchain_status: string | null;
  onchain_chain: string | null;
  onchain_tx_hash: string | null;
  onchain_block: number | null;
  report_sha256: string | null;
};

export type Order = {
  id: number;
  order_no: string;
  status: string;
  currency: string;
  incoterm: string | null;
  promised_ship_date: string | null;
  created_at: string;
  total_qty: number;
  shipped_qty: number;
  line_count: number;
  stage: { label: string; note: string };
  lines: OrderLine[];
  batches: Batch[];
};

export type Shipment = {
  id: number;
  shipment_no: string;
  order_no: string;
  carrier: string | null;
  tracking_no: string | null;
  incoterm: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  etd: string | null;
  eta: string | null;
  status: string;
  created_at: string;
  stage: { label: string; note: string };
  items: { id: number; sku: string; product_name: string | null; qty: number }[];
};

export type DocumentRow = {
  id: number;
  doc_type: string;
  label: string;
  title: string;
  original_name: string | null;
  issued_at: string | null;
  created_at: string;
  order_no: string | null;
  /**
   * Where the file is, or null when it has not been issued yet.
   *
   * It used to be a string that always had something in it: a row with no
   * file fell back to /portal/documents/<id>, a page that has never
   * existed, so the link was a 404 wearing a link's clothes.
   */
  download_url: string | null;
  has_file?: boolean;
};

export type PortalStats = {
  inquiries: { total: number; open: number };
  orders: { total: number; active: number };
  shipments: { total: number; in_transit: number };
  documents: { total: number };
};

/* ------------------------------------------------------------------ */
/* The fetch                                                           */
/* ------------------------------------------------------------------ */

async function get<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; message: string; status: number }> {
  try {
    const res = await fetch(path, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (data as { error?: string } | null)?.error || `Could not load (${res.status}).`;
      return { ok: false, message: msg, status: res.status };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return { ok: false, message: 'Could not reach the server.', status: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/*
 * The lead under the page's name.
 *
 * This used to draw the name too, as a heading. The shell draws the
 * name now — it is the thing that owns the page, and the name has to
 * be in the page before the script runs. So this draws the lead, and
 * the page has one heading.
 *
 * The title is still accepted, and still used for the empty state:
 * an empty state is a different thing from a page with rows in it,
 * and it says so in its own words.
 */
export function PageHead({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="border-b border-v2-ink-100 pb-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-v2-ink-400">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-v2-ink-600">{lead}</p>
    </header>
  );
}

export function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-v2-md border border-v2-ink-200 bg-white px-5 py-4">
      <p className="text-2xl font-semibold tabular-nums text-v2-ink-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-v2-ink-400">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-v2-ink-500">{hint}</p>}
    </div>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-8 rounded-v2-md border border-dashed border-v2-ink-300 bg-white p-10 text-center">
      <p className="text-base font-semibold text-v2-ink-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-v2-ink-600">{body}</p>
      {action && (
        <a
          href={action.href}
          className="mt-5 inline-block rounded-v2-md bg-v2-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

/**
 * The failure box.
 *
 * WHY IT IS THIS CAREFUL
 * Three different things end up here and they need three different
 * responses. A person who is not signed in needs to sign in. A person whose
 * requests are being throttled needs to wait. A member of staff who opened
 * the buyer's portal by mistake needs to be told where the desk is — and
 * retrying will not help them, because the refusal is correct.
 *
 * The old box said "this area is for buyers" and offered "Try again". For a
 * member of staff that was true, unhelpful, and would have sent them round
 * the same circle.
 */
export function Failed({
  message,
  status,
}: {
  message: string;
  status?: number;
}) {
  const isStaff = status === 403;
  const isThrottled = status === 429;

  if (isStaff) {
    return (
      <div className="mt-8 rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 p-6">
        <p className="text-sm font-semibold text-v2-ink-900">
          This is the buyer&apos;s portal
        </p>
        <p className="mt-1 text-sm leading-relaxed text-v2-ink-700">
          You are signed in with an internal account. The factory desk, where the enquiries,
          orders, production schedule and files are, is at{' '}
          <a href="/admin.html" className="font-semibold text-v2-accent-700 underline underline-offset-4">
            /admin.html
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="/admin.html"
            className="rounded-v2-md bg-v2-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
          >
            Go to the factory desk
          </a>
          <a
            href="/portal/login.html"
            className="text-sm font-semibold text-v2-ink-600 underline underline-offset-4"
          >
            Sign in with a buyer account
          </a>
        </div>
      </div>
    );
  }

  if (isThrottled) {
    return (
      <div className="mt-8 rounded-v2-md border border-amber-300 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-900">Too many requests</p>
        <p className="mt-1 text-sm text-amber-800">
          The site is rate-limiting this connection. Wait a few seconds before trying again —
          the account is fine and nothing has been lost.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-semibold text-amber-900 underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-v2-md border border-amber-300 bg-amber-50 p-6">
      <p className="text-sm font-semibold text-amber-900">This did not load</p>
      <p className="mt-1 text-sm text-amber-800">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 text-sm font-semibold text-amber-900 underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  new: 'bg-v2-accent-050 text-v2-accent-800 ring-v2-accent-200',
  assigned: 'bg-v2-ink-050 text-v2-ink-700 ring-v2-ink-200',
  quoted: 'bg-v2-ink-050 text-v2-ink-700 ring-v2-ink-200',
  sampling: 'bg-v2-ink-050 text-v2-ink-700 ring-v2-ink-200',
  negotiating: 'bg-v2-ink-050 text-v2-ink-700 ring-v2-ink-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  production: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  shipped: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-v2-ink-100 text-v2-ink-500 ring-v2-ink-200',
  invalid: 'bg-v2-ink-100 text-v2-ink-500 ring-v2-ink-200',
};

const STAGE_TONE: Record<string, string> = {
  confirmed: 'bg-v2-ink-050 text-v2-ink-700 ring-v2-ink-200',
  in_production: 'bg-v2-accent-050 text-v2-accent-800 ring-v2-accent-200',
  partially_shipped: 'bg-v2-accent-050 text-v2-accent-800 ring-v2-accent-200',
  shipped: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-v2-ink-100 text-v2-ink-500 ring-v2-ink-200',
};

export function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
    >
      {children}
    </span>
  );
}

export function enquiryTone(status: string) {
  return STATUS_TONE[status] ?? 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200';
}

export function stageTone(status: string) {
  return STAGE_TONE[status] ?? 'bg-v2-ink-100 text-v2-ink-600 ring-v2-ink-200';
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* A hook for the shared fetch-and-render pattern                      */
/* ------------------------------------------------------------------ */

export function usePortalData<T>(path: string) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string; status: number }
    | { kind: 'ready'; data: T }
  >({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    const res = await get<T>(path);
    setState(
      res.ok
        ? { kind: 'ready', data: res.data }
        : { kind: 'error', message: res.message, status: res.status },
    );
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}

export { usePortal };

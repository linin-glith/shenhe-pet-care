'use client';

/**
 * Track an enquiry by its reference.
 *
 * WHY THIS DOES NOT REQUIRE SIGNING IN
 * A buyer who has just sent an enquiry has a reference and no account. Making
 * them register before they can see the answer would lose the one moment where
 * they are most likely to engage. The reference is a random string that the
 * server generated, so it is not guessable and not sequential.
 *
 * WHAT IT DELIBERATELY DOES NOT SHOW
 * No company name, no email, no products, no price. A reference alone returns
 * the stage and the date, which is enough to answer "did you get my enquiry"
 * and nothing that would help someone walking through references.
 *
 * THE REFERENCE FORMAT, AND WHY THE CHECK IS LOOSE
 * The server issues INQ-YYYYMMDD-NNNN-XXXX: the date, the day's sequence,
 * and a random suffix so /track/ cannot be walked one number at a time. The
 * check below accepts that shape and the shorter one that preceded it, and
 * nothing else — a check that rejects a real reference is worse than no
 * check, because the buyer is told their reference is wrong when it is not.
 */

import { useState } from 'react';
import { apiTrackInquiry } from '@/lib/api-client';
import { siteConfig } from '@/lib/shenhe.config';

/** Each stage, in the buyer's words. */
const STATUS_COPY: Record<string, { label: string; body: string; tone: string }> = {
  new: {
    label: 'Received',
    body: 'Your enquiry reached us. A sales manager replies within one business day.',
    tone: 'text-v2-accent-700 bg-v2-accent-050',
  },
  assigned: {
    label: 'With a sales manager',
    body: 'A named manager is reviewing your products and volume.',
    tone: 'text-v2-ink-700 bg-v2-ink-100',
  },
  quoted: {
    label: 'Quote sent',
    body: 'A quotation has been emailed to you. Check spam if it has not arrived.',
    tone: 'text-v2-ink-700 bg-v2-ink-100',
  },
  sampling: {
    label: 'Samples sent',
    body: 'Samples are on their way. Tracking details follow by email.',
    tone: 'text-v2-ink-700 bg-v2-ink-100',
  },
  negotiating: {
    label: 'Negotiating',
    body: 'We are confirming the last terms with you.',
    tone: 'text-v2-ink-700 bg-v2-ink-100',
  },
  won: {
    label: 'Order confirmed',
    body: 'Your order is confirmed and goes into production shortly.',
    tone: 'text-emerald-800 bg-emerald-50',
  },
  production: {
    label: 'In production',
    body: 'Your order is being made against the agreed specification.',
    tone: 'text-emerald-800 bg-emerald-50',
  },
  shipped: {
    label: 'Shipped',
    body: 'Your order has shipped. Shipping documents are on the way.',
    tone: 'text-emerald-800 bg-emerald-50',
  },
  lost: {
    label: 'Closed',
    body: 'This enquiry is closed. Message us if you would like to reopen it.',
    tone: 'text-v2-ink-500 bg-v2-ink-100',
  },
  invalid: {
    label: 'Closed',
    body: 'This enquiry is closed. Message us if you would like to reopen it.',
    tone: 'text-v2-ink-500 bg-v2-ink-100',
  },
};

/**
 * INQ-20261023-0001-K3F9 — and the shorter INQ-20260115-A7K2M that came
 * before it. The random tail is what makes the reference unguessable, so the
 * pattern insists on at least four characters of it.
 */
const REF_RE = /^INQ-[0-9]{8}(?:-[0-9]{4})?-[A-Z0-9]{4,6}$/;

const EXAMPLE = 'INQ-20260115-0007-K3F9';

export default function TrackEnquiry() {
  const [ref, setRef] = useState('');
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'busy' }
    | { kind: 'error'; message: string }
    | {
        kind: 'found';
        reference: string;
        status: string;
        created_at: string;
      }
  >({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = ref.trim().toUpperCase();

    if (!REF_RE.test(value)) {
      setState({
        kind: 'error',
        message: 'That does not look like an enquiry reference. It reads INQ-YYYYMMDD-NNNN-XXXX.',
      });
      return;
    }

    setState({ kind: 'busy' });
    const res = await apiTrackInquiry(value);
    if (!res.ok) {
      setState({ kind: 'error', message: res.message });
      return;
    }
    setState({ kind: 'found', ...res.data });
  }

  const info = state.kind === 'found' ? STATUS_COPY[state.status] : undefined;

  return (
    <div className="min-h-[60vh] bg-v2-ink-050">
      <div className="v2-container py-14 md:py-20">
        <div className="mx-auto max-w-xl">
          <p className="v2-eyebrow">Enquiry tracking</p>
          <h1 className="v2-display mt-4 text-3xl md:text-4xl">Track an enquiry</h1>
          <p className="mt-4 text-sm leading-relaxed text-v2-ink-600">
            Enter the reference we sent you. It reads like{' '}
            <span className="font-mono font-semibold text-v2-ink-900">{EXAMPLE}</span> and is in
            the first line of our reply and in your browser history right after you submit the
            form.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="reference" className="block text-sm font-semibold text-v2-ink-800">
                Enquiry reference
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={EXAMPLE}
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-3 font-mono text-sm outline-none transition focus:border-v2-accent-500 focus:ring-2 focus:ring-v2-accent-100"
              />
            </div>

            <button
              type="submit"
              disabled={state.kind === 'busy'}
              className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
            >
              {state.kind === 'busy' ? 'Looking…' : 'Track it'}
            </button>
          </form>

          {state.kind === 'error' && (
            <p role="alert" className="mt-6 rounded-v2-md bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.message}
            </p>
          )}

          {state.kind === 'found' && (
            <div className="mt-8 rounded-v2-md border border-v2-ink-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-v2-ink-900">
                  {state.reference}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    info?.tone ?? 'text-v2-ink-600 bg-v2-ink-100'
                  }`}
                >
                  {info?.label ?? state.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-v2-ink-700">
                {info?.body ?? 'This enquiry is with us.'}
              </p>
              <p className="mt-4 border-t border-v2-ink-100 pt-4 text-xs text-v2-ink-500">
                Sent {new Date(state.created_at).toISOString().slice(0, 10)}
              </p>
            </div>
          )}

          <p className="mt-10 border-t border-v2-ink-100 pt-6 text-sm leading-relaxed text-v2-ink-600">
            Have an account?{' '}
            <a href="/portal/dashboard.html" className="font-semibold text-v2-accent-700 underline underline-offset-4">
              Sign in
            </a>{' '}
            to see every enquiry at once with the documents behind them. Lost the reference? Message
            us on WhatsApp at{' '}
            <span className="font-semibold text-v2-ink-900">{siteConfig.brand.whatsappDisplay}</span>{' '}
            and we will find it.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * The account details, and the way out of a forgotten password.
 *
 * WHY THERE IS NO PASSWORD FORM HERE
 * Changing a password means sending the current one, which means the page
 * would need a field that invites a mistake with a stale password. The
 * change is done from a link that arrives by email, so the only thing this
 * page needs to say is that it exists.
 */

import { useState } from 'react';
import { Failed, PageHead, usePortalData } from './portal-shared';

type Payload = { user: { email: string; name?: string | null; company?: string | null; country?: string | null; role: string; created_at?: string; email_verified?: boolean } };

export default function AccountPanel() {
  const { state } = usePortalData<Payload>('/api/auth/me');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const u = state.data.user;

  /*
   * Asking for the confirmation again.
   *
   * The route answers the same way for every address, so the page
   * cannot know whether the message went. It says what it did, and
   * it does not claim the message arrived.
   */
  const [asking, setAsking] = useState(false);
  const [sentNote, setSentNote] = useState('');

  async function askAgain() {
    setAsking(true);
    setSentNote('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: u.email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSentNote((data as { error?: string } | null)?.error ?? 'Something went wrong. Try again shortly.');
      } else {
        setSentNote(
          (data as { message?: string } | null)?.message ??
            'If that address has an account that is not confirmed yet, a confirmation link is on its way.',
        );
      }
    } catch {
      setSentNote('The server could not be reached. Check your connection and try again.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <PageHead
        title="Account"
        lead="Your details as we hold them. If something is wrong, message us and we will correct it."
      />

      <dl className="mt-8 divide-y divide-v2-ink-100 rounded-v2-md border border-v2-ink-200 bg-white">
        <Row label="Email" value={u.email} />
        <Row label="Name" value={u.name ?? '—'} />
        <Row label="Company" value={u.company ?? '—'} />
        <Row label="Country" value={u.country ?? '—'} />
        <Row
          label="Address"
          value={u.email_verified ? 'Confirmed' : 'Not confirmed yet'}
        />
      </dl>

      {!u.email_verified && (
        <section className="mt-6 rounded-v2-md border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-sm font-semibold text-v2-ink-900">Confirm your email address</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-v2-ink-700">
            We send a confirmation link to the address you signed up with, so that an account
            cannot be made with an address that belongs to somebody else. The link works once.
            If the message did not arrive, ask for another one here.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={askAgain}
              disabled={asking}
              className="rounded-v2-md bg-v2-accent-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-v2-accent-700 disabled:opacity-60"
            >
              {asking ? 'Sending…' : 'Send the confirmation again'}
            </button>
            {sentNote && (
              <span role="status" className="text-sm text-v2-ink-700">
                {sentNote}
              </span>
            )}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-v2-md border border-v2-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-v2-ink-900">Password</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-v2-ink-600">
          To change your password, ask us on WhatsApp and we will send a link to your email
          address. The link works once and expires after an hour. If someone else has access to
          your mailbox, tell us and we will close the account instead.
        </p>
        <a
          href="/portal/forgot-password.html"
          className="mt-4 inline-block text-sm font-semibold text-v2-accent-700 underline underline-offset-4"
        >
          Request a password reset
        </a>
      </section>

      <section className="mt-6 rounded-v2-md border border-v2-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-v2-ink-900">What we hold about you</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-v2-ink-600">
          Your email address, the enquiries you have sent us, and the orders and shipments that
          belong to your company. We use this to answer your enquiries and to ship what you order.
          We do not sell it, and we do not share it with anyone outside the parties needed to
          deliver your goods.
        </p>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4">
      <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm text-v2-ink-800">{value}</dd>
    </div>
  );
}

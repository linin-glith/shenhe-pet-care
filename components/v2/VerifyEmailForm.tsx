'use client';

/**
 * Confirming an address.
 *
 * WHY THIS EXISTS
 * A buyer could register, set a password, and be signed in — with an
 * address that was not theirs. Nothing tied the account to the
 * address. The one thing that would have caught it is this: a message
 * to the address saying "this is your account, here is the link", and
 * a link that only works once.
 *
 * WHY THE PAGE CHECKS THE TOKEN BEFORE IT SAYS ANYTHING
 * A link that has expired is a link the buyer cannot use. Finding
 * that out when the page opens, in one sentence, is better than
 * finding it out after they have waited for a message that will not
 * come.
 *
 * WHY THERE ARE TWO STATES
 * The buyer arrives from a message, with a token. The buyer who
 * thinks the account needs confirming arrives without one. Both are
 * here, because the second is the one who has no message yet.
 */

import { useEffect, useState } from 'react';
import Link from '@/components/SiteLink';
import { whatsappLink } from '@/lib/contact-links';

type Ask = 'idle' | 'working' | 'sent' | 'failed';

async function post<T>(path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: (data as { error?: string } | null)?.error ?? `Something went wrong (${res.status})` };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return { ok: false, message: 'The server could not be reached. Check your connection and try again.' };
  }
}

async function get<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: (data as { error?: string } | null)?.error ?? `Something went wrong (${res.status})` };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return { ok: false, message: 'The server could not be reached. Check your connection and try again.' };
  }
}

function Frame({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
      <h1 className="text-2xl font-semibold tracking-tight text-v2-ink-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{lead}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'good' | 'bad' | 'info'; children: React.ReactNode }) {
  const cls =
    tone === 'good'
      ? 'rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 px-4 py-3 text-sm text-v2-accent-800'
      : tone === 'bad'
        ? 'rounded-v2-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
        : 'rounded-v2-md border border-v2-ink-200 bg-v2-ink-050 px-4 py-3 text-sm text-v2-ink-600';
  return (
    <p role="status" className={cls}>
      {children}
    </p>
  );
}

export default function VerifyEmailForm() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'checking' | 'verified' | 'invalid' | 'idle'>('checking');
  const [ask, setAsk] = useState<Ask>('idle');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (!t) {
      setState('idle');
      return;
    }
    setToken(t);
    let alive = true;
    get<{ email?: string; message?: string }>(`/api/auth/verify-email?token=${encodeURIComponent(t)}`).then((r) => {
      if (!alive) return;
      if (r.ok) {
        setState('verified');
        setMessage(r.data.message ?? 'Your address is confirmed.');
      } else {
        setState('invalid');
        setMessage(r.message);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setAsk('failed');
      setMessage('Enter the address you used to sign up.');
      return;
    }
    setAsk('working');
    setMessage('');

    const r = await post<{ message?: string; delivered?: boolean; whatsapp?: string; contact?: string }>(
      '/api/auth/verify-email',
      { email: value },
    );
    if (r.ok) {
      setAsk('sent');
      setSent(r.data.delivered !== false);
      setMessage(r.data.message ?? 'If that address has an account, a confirmation link is on its way.');
    } else {
      setAsk('failed');
      setMessage(r.message);
    }
  }

  if (state === 'checking') {
    return (
      <Frame title="Checking your link" lead="One moment.">
        <Notice tone="info">Checking the confirmation link…</Notice>
      </Frame>
    );
  }

  if (state === 'verified') {
    return (
      <Frame title="Your address is confirmed" lead={message}>
        <Notice tone="good">{message}</Notice>
        <Link
          href="/portal/login.html"
          className="mt-6 flex w-full items-center justify-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white hover:bg-v2-accent-700"
        >
          Sign in
        </Link>
      </Frame>
    );
  }

  if (state === 'invalid') {
    return (
      <Frame title="That link did not work" lead={message}>
        <Notice tone="bad">{message}</Notice>
        <p className="mt-6 text-sm leading-relaxed text-v2-ink-500">
          A confirmation link works once and expires. Ask for a new one below.
        </p>
        <AskForm email={email} setEmail={setEmail} ask={ask} message={message} setAsk={setAsk} setMessage={setMessage} onSubmit={onSubmit} />
      </Frame>
    );
  }

  return (
    <Frame
      title="Confirm your address"
      lead="We send a link to the address you signed up with. Open it and the account is confirmed."
    >
      <AskForm email={email} setEmail={setEmail} ask={ask} message={message} setAsk={setAsk} setMessage={setMessage} onSubmit={onSubmit} sent={sent} />
    </Frame>
  );
}

function AskForm({
  email,
  setEmail,
  ask,
  message,
  setAsk,
  setMessage,
  onSubmit,
  sent,
}: {
  email: string;
  setEmail: (v: string) => void;
  ask: Ask;
  message: string;
  setAsk: (v: Ask) => void;
  setMessage: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  sent?: boolean;
}) {
  if (ask === 'sent') {
    return (
      <>
        <Notice tone="good">{message}</Notice>
        <div className="mt-6 space-y-3">
          <a
            href={whatsappLink({ page: 'my account' })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-v2-md border border-v2-ink-200 px-5 py-3 text-sm font-semibold text-v2-ink-800 hover:bg-v2-ink-050"
          >
            Message us on WhatsApp
          </a>
          <a
            href="/contact.html"
            className="flex w-full items-center justify-center rounded-v2-md border border-v2-ink-200 px-5 py-3 text-sm font-semibold text-v2-ink-800 hover:bg-v2-ink-050"
          >
            Write through the enquiry form
          </a>
          <Link
            href="/portal/login.html"
            className="flex w-full items-center justify-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white hover:bg-v2-accent-700"
          >
            Sign in
          </Link>
        </div>
        {sent === false && (
          <p className="mt-4 text-xs leading-relaxed text-v2-ink-500">
            If no message arrives within a few minutes, it is usually because the address is not
            confirmed on our side yet — a sales manager can confirm it for you.
          </p>
        )}
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="verify-email" className="mb-1.5 block text-sm font-medium text-v2-ink-700">
          Email address
        </label>
        <input
          id="verify-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-v2-md border border-v2-ink-200 px-4 py-3 text-sm outline-none focus:border-v2-accent-500 focus:ring-2 focus:ring-v2-accent-100"
        />
      </div>
      <button
        type="submit"
        disabled={ask === 'working'}
        className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white hover:bg-v2-accent-700 disabled:opacity-60"
      >
        {ask === 'working' ? 'Sending…' : 'Send the confirmation link'}
      </button>
      {ask === 'failed' && <Notice tone="bad">{message}</Notice>}
    </form>
  );
}

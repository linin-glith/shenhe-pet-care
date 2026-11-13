'use client';

/**
 * The three password forms.
 *
 * WHY THEY ARE HERE AND NOT ON THE PAGE FILES
 * The page files for these three are generated from the legacy site's
 * markup, and the legacy markup for them was empty — a heading and a
 * paragraph. Converted, they rendered a page that said nothing and did
 * nothing, which is the worst shape a password page can have: a buyer
 * who cannot get into their own account, on a page that promised to
 * help.
 *
 * WHY THE FORGOT FORM ANSWERS THE SAME WAY EITHER WAY
 * A route that says "we sent a link" for an address that is registered
 * and "we could not find that address" for one that is not is a route
 * that tells a stranger which addresses have accounts on this site.
 * The form says the same thing either way.
 *
 * WHY THE TOKEN IS CHECKED BEFORE THE FORM IS SHOWN
 * A link that has expired is a link the buyer cannot use, and finding
 * that out after they have typed a new password is worse than finding
 * it out first. The token is checked when the page opens.
 */

import { useEffect, useState } from 'react';
import PasswordField from '@/components/v2/PasswordField';
import { whatsappLink } from '@/lib/contact-links';

type Status = 'idle' | 'working' | 'done' | 'failed';

/** The API answers with a body; the body may or may not carry an error. */
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
      return {
        ok: false,
        message: (data as { error?: string } | null)?.error ?? `Something went wrong (${res.status})`,
      };
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
      return {
        ok: false,
        message: (data as { error?: string } | null)?.error ?? `Something went wrong (${res.status})`,
      };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return { ok: false, message: 'The server could not be reached. Check your connection and try again.' };
  }
}

/* ====================================================================== */
/* The shared shell                                                      */
/* ====================================================================== */

function Frame({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
      <h1 className="text-2xl font-semibold tracking-tight text-v2-ink-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{lead}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'good' | 'bad'; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={
        tone === 'good'
          ? 'rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 px-4 py-3 text-sm text-v2-accent-800'
          : 'rounded-v2-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
      }
    >
      {children}
    </p>
  );
}

/* ====================================================================== */
/* The forgot form                                                       */
/* ====================================================================== */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  /**
   * Whether the desk handed back the link, which only happens when a
   * member of staff is asking.
   *
   * The server answers every address the same way on purpose: a route
   * that says "we sent a link" for one address and "we could not find
   * that one" for another tells a stranger which addresses have
   * accounts on this factory. So the page cannot know whether the
   * address was registered, and it must not pretend to.
   *
   * That is why the ways to reach a person are always on this page
   * and not only on one branch of it. A reset mail that does not
   * arrive is a common and real thing; a page that only says "check
   * your inbox" leaves a buyer waiting. The buyer who got the mail
   * clicks the link. The buyer who did not asks, and a manager sets
   * the password by hand.
   */
  const [deskLink, setDeskLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setStatus('failed');
      setMessage('Enter the address you used to sign up.');
      return;
    }
    setStatus('working');
    setMessage('');

    const r = await post<{
      message?: string;
      reset_link?: string;
    }>('/api/auth/forgot-password', { email: value });

    if (r.ok) {
      setStatus('done');
      setDeskLink(r.data.reset_link ?? null);
      setMessage(
        r.data.message ??
          'If that address has an account, a reset link is on its way. It is valid for one hour.',
      );
    } else {
      setStatus('failed');
      setMessage(r.message);
    }
  }

  if (status === 'done') {
    /*
     * One answer, and the ways to reach a person are always on it.
     *
     * The link is on its way if the address has an account. The page
     * does not say it has arrived, because the page cannot know, and a
     * page that promises a message is coming when it may not is worse
     * than one that gives a buyer something to do about it.
     */
    return (
      <Frame
        title="Check your inbox"
        lead="If that address has an account, a reset link is on its way. It is valid for one hour."
      >
        <Notice tone="good">{message}</Notice>

        {deskLink && (
          <a
            href={deskLink}
            className="mt-6 flex w-full items-center justify-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
          >
            Choose a new password now
          </a>
        )}

        <div className="mt-6 space-y-3">
          <a
            href={whatsappLink({ page: 'my account' })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-v2-md border border-v2-ink-200 px-5 py-3 text-sm font-semibold text-v2-ink-800 transition-colors hover:border-v2-ink-300"
          >
            Message us on WhatsApp
          </a>
          <a
            href="/contact.html"
            className="flex w-full items-center justify-center rounded-v2-md border border-v2-ink-200 px-5 py-3 text-sm font-semibold text-v2-ink-800 transition-colors hover:border-v2-ink-300"
          >
            Write through the enquiry form
          </a>
        </div>
        <p className="mt-4 text-center text-sm text-v2-ink-500">
          If the message has not arrived in a few minutes, a sales manager can set a
          new password for you. One business day.
        </p>

        <a
          href="/portal/login.html"
          className="mt-6 inline-flex items-center text-sm font-semibold text-v2-accent-700 underline underline-offset-4"
        >
          Back to sign in
        </a>
      </Frame>
    );
  }

  return (
    <Frame
      title="Reset your password"
      lead="Give us the address on your account and we will send you a link to choose a new password. The link is valid for one hour."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-v2-ink-800">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-v2-accent-500"
          />
        </div>

        {status === 'failed' && message && <Notice tone="bad">{message}</Notice>}

        <button
          type="submit"
          disabled={status === 'working'}
          className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
        >
          {status === 'working' ? 'Sending…' : 'Send the reset link'}
        </button>

        <p className="text-center text-sm text-v2-ink-500">
          Remembered it?{' '}
          <a href="/portal/login.html" className="font-semibold text-v2-accent-700 underline underline-offset-4">
            Sign in
          </a>
        </p>
      </form>
    </Frame>
  );
}

/* ====================================================================== */
/* The reset form                                                        */
/* ====================================================================== */

export function ResetPasswordForm() {
  const [token, setToken] = useState('');
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') ?? '';
    setToken(t);
    if (!t) {
      setChecking(false);
      setValid(false);
      setError('This link is missing its token. Ask for a new one.');
      return;
    }
    get<{ valid?: boolean; error?: string }>(
      `/api/auth/password-status?token=${encodeURIComponent(t)}`,
    ).then((r) => {
      setChecking(false);
      if (r.ok && r.data.valid) {
        setValid(true);
      } else {
        setValid(false);
        setError(r.ok ? 'This link has expired. Ask for a new one.' : r.message);
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('failed');
      setMessage('The two passwords are not the same.');
      return;
    }
    setStatus('working');
    setMessage('');

    const r = await post<{ message?: string }>('/api/auth/reset-password', {
      token,
      password,
    });
    if (r.ok) {
      setStatus('done');
      setMessage(r.data.message ?? 'Your password has been changed.');
    } else {
      setStatus('failed');
      setMessage(r.message);
    }
  }

  if (checking) {
    return (
      <Frame title="Checking your link" lead="One moment.">
        <p className="text-sm text-v2-ink-500">Checking the link…</p>
      </Frame>
    );
  }

  if (!valid) {
    return (
      <Frame title="This link cannot be used" lead="It may have expired, or it may already have been used.">
        <Notice tone="bad">{error}</Notice>
        <a
          href="/portal/forgot-password.html"
          className="mt-6 inline-flex items-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
        >
          Ask for a new link
        </a>
      </Frame>
    );
  }

  if (status === 'done') {
    return (
      <Frame title="Your password is changed" lead={message}>
        <Notice tone="good">{message}</Notice>
        <a
          href="/portal/login.html"
          className="mt-6 inline-flex items-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
        >
          Sign in
        </a>
      </Frame>
    );
  }

  return (
    <Frame title="Choose a new password" lead="Eight characters or more. A phrase you will remember is better than a word you will not.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Type it again"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        {status === 'failed' && message && <Notice tone="bad">{message}</Notice>}

        <button
          type="submit"
          disabled={status === 'working'}
          className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
        >
          {status === 'working' ? 'Saving…' : 'Set the new password'}
        </button>
      </form>
    </Frame>
  );
}

/* ====================================================================== */
/* The set form, for an account made by the desk                         */
/* ====================================================================== */

export function SetPasswordForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') ?? '');
    setCode(params.get('code') ?? '');
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setMessage('');

    const r = await post<{ message?: string }>('/api/auth/set-password', {
      email: email.trim(),
      token: code.trim(),
      password,
    });
    if (r.ok) {
      setStatus('done');
      setMessage(r.data.message ?? 'Your password is set.');
    } else {
      setStatus('failed');
      setMessage(r.message);
    }
  }

  if (status === 'done') {
    return (
      <Frame title="Your password is set" lead={message}>
        <Notice tone="good">{message}</Notice>
        <a
          href="/portal/login.html"
          className="mt-6 inline-flex items-center rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
        >
          Sign in
        </a>
      </Frame>
    );
  }

  return (
    <Frame
      title="Set your password"
      lead="The factory has made an account for you. Use the invitation code they gave you to choose a password."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="set-email" className="block text-sm font-medium text-v2-ink-800">
            Email address
          </label>
          <input
            id="set-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-v2-accent-500"
          />
        </div>

        <div>
          <label htmlFor="set-code" className="block text-sm font-medium text-v2-ink-800">
            Invitation code
          </label>
          <input
            id="set-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="INV-XXXXXX"
            className="mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-3 text-sm uppercase outline-none transition-colors focus:border-v2-accent-500"
          />
        </div>

        <PasswordField
          id="set-password"
          label="Choose a password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        {status === 'failed' && message && <Notice tone="bad">{message}</Notice>}

        <button
          type="submit"
          disabled={status === 'working'}
          className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
        >
          {status === 'working' ? 'Saving…' : 'Set the password'}
        </button>
      </form>
    </Frame>
  );
}

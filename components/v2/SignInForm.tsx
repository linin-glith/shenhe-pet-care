'use client';

/**
 * The sign-in form.
 *
 * WHY IT IS BUILT HERE RATHER THAN CONVERTED
 * The old page shipped raw legacy markup with a form whose handler was inline
 * in the original HTML. That handler was never captured with the content
 * extraction, so the form had no working submit path at all.
 *
 * This one is built against the API the server actually runs (see
 * lib/auth-client.ts for the protocol), and it is honest about the three
 * things that can happen:
 *
 *   - the credentials are wrong        -> say so, point at "forgot password"
 *   - the service is not there         -> say so, and give a channel that
 *                                         reaches a person (this is the state
 *                                         of a static preview)
 *   - the visitor is already signed in -> show them their account instead of
 *                                         a form they do not need
 *
 * A form that spins forever, or that blames the password for a server being
 * down, is the failure this replaces.
 */

import { useEffect, useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import {
  AFTER_LOGIN,
  AuthError,
  currentSession,
  signIn,
} from '@/lib/auth-client';
import type { ApiUser } from '@/lib/api-client';

type Values = { email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;
type Status = 'idle' | 'checking' | 'submitting' | 'signed-in' | 'error';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The same rules the old form declared: a real address, at least 8 chars. */
function validate(v: Values): Errors {
  const e: Errors = {};
  const email = v.email.trim();
  const password = v.password;

  if (!email) e.email = 'Enter the email address you used for your account';
  else if (!EMAIL.test(email)) e.email = 'That does not look like an email address';

  if (!password) e.password = 'Enter your password';
  else if (password.length < 8) e.password = 'Passwords are at least 8 characters';

  return e;
}

export default function SignInForm() {
  const [values, setValues] = useState<Values>({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  /**
   * Which fields the visitor has actually touched.
   *
   * A field counts as touched only after the visitor has typed in it AND
   * left it, or after a submit attempt. It does not count on load: the email
   * box takes focus automatically, and the first blur that comes with
   * hydration would otherwise greet the visitor with "enter your email
   * address" before they have typed anything. A form that scolds you before
   * you start is a form people stop using.
   */
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<Status>('checking');
  const [problem, setProblem] = useState<{ kind: string; message: string } | null>(null);
  const [session, setSession] = useState<ApiUser | null>(null);

  /* Is somebody already signed in? On a static preview there is no API, and
     the answer is "no" — which is the right thing to show. */
  useEffect(() => {
    let alive = true;
    currentSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setStatus(s ? 'signed-in' : 'idle');
    });
    return () => {
      alive = false;
    };
  }, []);

  const set =
    (k: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [k]: e.target.value };
      setValues(next);
      setDirty((d) => ({ ...d, [k]: true }));
      if (touched[k]) setErrors(validate(next));
    };

  const blur =
    (k: keyof Values) => () => {
      if (!dirty[k]) return;
      setTouched((t) => ({ ...t, [k]: true }));
      setErrors(validate(values));
    };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ email: true, password: true });
    if (Object.keys(found).length) return;

    setStatus('submitting');
    setProblem(null);
    try {
      await signIn(values.email.trim(), values.password);
      // The session cookie is set; hand the visitor to their inquiries.
      window.location.assign(AFTER_LOGIN);
    } catch (err) {
      const e = err as AuthError;
      setProblem({
        kind: e instanceof AuthError ? e.kind : 'unknown',
        message: e instanceof AuthError ? e.message : 'Sign-in failed. Please try again.',
      });
      setStatus('error');
    }
  }

  /* ---- already signed in ---- */
  if (status === 'signed-in' && session) {
    return (
      <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
        <h2 className="text-xl font-semibold tracking-tight text-v2-ink-900">You are signed in</h2>
        <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">
          {session.email ? (
            <>
              Signed in as <span className="font-semibold text-v2-ink-900">{session.email}</span>.
            </>
          ) : (
            'This device already holds a valid session.'
          )}{' '}
          Your enquiries, messages and shipping updates are where you left them.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={AFTER_LOGIN}
            className="inline-flex items-center gap-2 rounded-v2-md bg-v2-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
          >
            Go to my enquiries
          </a>
          <a href="/contact.html" className="text-sm font-semibold text-v2-accent-700 underline underline-offset-4">
            Or ask the sales desk
          </a>
        </div>
      </div>
    );
  }

  const busy = status === 'submitting';

  return (
    <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
      <h2 className="text-xl font-semibold tracking-tight text-v2-ink-900">Sign in</h2>
      <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">
        The email address you used for your account, and your password.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-6">
        {/* One live region: a screen reader announces the first problem once. */}
        <p role="alert" aria-live="polite" className="sr-only">
          {Object.values(errors).filter(Boolean)[0] ?? problem?.message ?? ''}
        </p>

        {problem && (
          <div
            className={`rounded-v2-md border p-4 text-sm leading-relaxed ${
              problem.kind === 'invalid'
                ? 'border-v2-signal-600 bg-v2-signal-050 text-v2-signal-700'
                : 'border-v2-ink-200 bg-v2-ink-050 text-v2-ink-700'
            }`}
          >
            <p className="flex items-start gap-2.5">
              <Icon
                name={problem.kind === 'invalid' ? 'shield' : 'chat'}
                size={17}
                className="mt-0.5 shrink-0"
              />
              <span>
                {problem.message}
                {problem.kind === 'unreachable' && (
                  <>
                    {' '}
                    You can reach us instead —{' '}
                    <a
                      className="font-semibold underline underline-offset-4"
                      href={`https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
                        `Hello, I am trying to sign in to my account (${values.email.trim() || 'my email'}).`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      message us on WhatsApp
                    </a>{' '}
                    and we will confirm your account.
                  </>
                )}
                {problem.kind === 'invalid' && (
                  <>
                    {' '}
                    <a
                      className="font-semibold underline underline-offset-4"
                      href="/portal/forgot-password.html"
                    >
                      Forgot your password?
                    </a>
                  </>
                )}
              </span>
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="signin-email"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500"
          >
            Email <span className="text-v2-signal-600">*</span>
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'err-signin-email' : undefined}
            placeholder="you@company.com"
            className={`v2-input ${errors.email ? 'v2-input--error' : ''}`}
          />
          {errors.email && (
            <p id="err-signin-email" className="mt-2 text-xs font-medium text-v2-signal-700">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signin-password"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500"
          >
            Password <span className="text-v2-signal-600">*</span>
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={set('password')}
            onBlur={blur('password')}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'err-signin-password' : undefined}
            placeholder="At least 8 characters"
            className={`v2-input ${errors.password ? 'v2-input--error' : ''}`}
          />
          {errors.password && (
            <p id="err-signin-password" className="mt-2 text-xs font-medium text-v2-signal-700">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-v2-md bg-v2-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-v2-sm transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Log in'}
        </button>

        <div className="space-y-2 text-center text-sm">
          <p className="text-v2-ink-500">
            No account yet?{' '}
            <a
              href="/portal/register.html"
              className="font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Create one
            </a>
          </p>
          <p className="text-v2-ink-500">
            <a
              href="/portal/forgot-password.html"
              className="font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Forgot password?
            </a>
            <span className="mx-2 text-v2-ink-400">·</span>
            <a
              href="/portal/track.html"
              className="font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Track without signing in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

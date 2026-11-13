'use client';

/**
 * The registration form.
 *
 * WHY IT HAD TO BE BUILT
 * The old portal register page was a conversion of the legacy markup: the
 * labels and the boxes were there, but the form had no submit path, no
 * validation and no error state — the same hole the sign-in page had, and
 * the reason it rendered as a stack of plain text instead of a form.
 *
 * WHAT AN ACCOUNT DOES HERE, HONESTLY
 * It ties an email address to the inquiries we already hold for that address.
 * The page says "use the email you sent your enquiry from" because that is
 * exactly what the server does with it: a customer row that already exists
 * for that address is reused, so the inquiries under it are already waiting.
 * A new address with no inquiry behind it gets an account that is empty —
 * which is why the form says so, instead of implying a history.
 *
 * THE THREE FAILURES, HANDLED DIFFERENTLY
 *   - the address is already registered -> say that, and send them to sign in
 *   - the service is not running         -> say that, and offer WhatsApp
 *   - the account was created             -> sign them in and hand them over
 */

import { useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { apiRegister } from '@/lib/api-client';
import { siteConfig } from '@/lib/shenhe.config';

type Values = {
  email: string;
  password: string;
  company: string;
  name: string;
  country: string;
};
type Errors = Partial<Record<keyof Values, string>>;
type Status = 'idle' | 'submitting' | 'error';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: Values = { email: '', password: '', company: '', name: '', country: '' };

function validate(v: Values): Errors {
  const e: Errors = {};
  const email = v.email.trim();

  if (!email) e.email = 'Enter your email address';
  else if (!EMAIL.test(email)) e.email = 'That does not look like an email address';

  if (!v.password) e.password = 'Choose a password';
  else if (v.password.length < 8) e.password = 'Passwords are at least 8 characters';

  return e;
}

export default function RegisterForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [problem, setProblem] = useState<{ kind: string; message: string } | null>(null);

  const set =
    (k: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [k]: e.target.value };
      setValues(next);
      if (touched[k]) setErrors(validate(next));
    };

  const blur =
    (k: keyof Values) => () => {
      setTouched((t) => ({ ...t, [k]: true }));
      setErrors(validate(values));
    };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ email: true, password: true, company: true, name: true, country: true });
    if (Object.keys(found).length) return;

    setStatus('submitting');
    setProblem(null);
    try {
      const res = await apiRegister({
        email: values.email.trim(),
        password: values.password,
        company: values.company.trim() || undefined,
        name: values.name.trim() || undefined,
        country: values.country.trim() || undefined,
      });
      if (!res.ok) {
        const kind = res.status === 409 ? 'exists' : res.status === 0 ? 'unreachable' : 'invalid';
        setProblem({ kind, message: res.message });
        setStatus('error');
        return;
      }
      // The server signs the new account in as it creates it, so the session
      // cookie is already set. There is nothing to ask the buyer to do.
      window.location.assign('/portal/dashboard.html');
    } catch {
      setProblem({
        kind: 'unknown',
        message: 'The account could not be created. Please try again in a moment.',
      });
      setStatus('error');
    }
  }

  const busy = status === 'submitting';

  const field = (
    k: keyof Values,
    label: string,
    opts: { type?: string; placeholder?: string; autoComplete?: string; required?: boolean } = {},
  ) => (
    <div>
      <label
        htmlFor={`reg-${k}`}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500"
      >
        {label} {opts.required && <span className="text-v2-signal-600">*</span>}
      </label>
      <input
        id={`reg-${k}`}
        name={k}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        value={values[k]}
        onChange={set(k)}
        onBlur={blur(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `err-reg-${k}` : undefined}
        placeholder={opts.placeholder}
        className={`v2-input ${errors[k] ? 'v2-input--error' : ''}`}
      />
      {errors[k] && (
        <p id={`err-reg-${k}`} className="mt-2 text-xs font-medium text-v2-signal-700">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-7 md:p-9">
      <h2 className="text-xl font-semibold tracking-tight text-v2-ink-900">Create your account</h2>
      <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">
        Use the email you sent your enquiry from — we will link it automatically.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-6">
        <p role="alert" aria-live="polite" className="sr-only">
          {Object.values(errors).filter(Boolean)[0] ?? problem?.message ?? ''}
        </p>

        {problem && (
          <div
            className={`rounded-v2-md border p-4 text-sm leading-relaxed ${
              problem.kind === 'invalid' || problem.kind === 'exists'
                ? 'border-v2-signal-600 bg-v2-signal-050 text-v2-signal-700'
                : 'border-v2-ink-200 bg-v2-ink-050 text-v2-ink-700'
            }`}
          >
            <p className="flex items-start gap-2.5">
              <Icon
                name={problem.kind === 'unreachable' ? 'chat' : 'shield'}
                size={17}
                className="mt-0.5 shrink-0"
              />
              <span>
                {problem.message}
                {problem.kind === 'exists' && (
                  <>
                    {' '}
                    <a
                      className="font-semibold underline underline-offset-4"
                      href="/portal/login.html"
                    >
                      Sign in instead
                    </a>
                    , or{' '}
                    <a
                      className="font-semibold underline underline-offset-4"
                      href={`https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
                        `Hello, I already sent an enquiry from ${values.email.trim()} and I cannot sign in.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      message us
                    </a>
                    .
                  </>
                )}
                {problem.kind === 'unreachable' && (
                  <>
                    {' '}
                    The account service is not running right now. Reach us on{' '}
                    <a
                      className="font-semibold underline underline-offset-4"
                      href={`https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
                        `Hello, I would like to create an account (${values.email.trim() || 'my email'}).`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>{' '}
                    and we will set it up for you.
                  </>
                )}
              </span>
            </p>
          </div>
        )}

        {field('email', 'Email', {
          type: 'email',
          autoComplete: 'email',
          placeholder: 'you@company.com',
          required: true,
        })}

        {field('password', 'Password', {
          type: 'password',
          autoComplete: 'new-password',
          placeholder: 'At least 8 characters',
          required: true,
        })}

        {field('company', 'Company', {
          autoComplete: 'organization',
          placeholder: 'Your company name',
        })}

        {field('name', 'Contact name', {
          autoComplete: 'name',
          placeholder: 'Who should we ask for?',
        })}

        {field('country', 'Country / Region', {
          autoComplete: 'country-name',
          placeholder: 'Where do we ship to?',
        })}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-v2-md bg-v2-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-v2-sm transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
        >
          {busy ? 'Creating your account…' : 'Create account'}
        </button>

        <div className="space-y-2 text-center text-sm">
          <p className="text-v2-ink-500">
            Already have an account?{' '}
            <a
              href="/portal/login.html"
              className="font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Sign in
            </a>
          </p>
          <p className="text-v2-ink-500">
            <a
              href="/portal/track.html"
              className="font-semibold text-v2-accent-700 underline underline-offset-4"
            >
              Track an enquiry without an account
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

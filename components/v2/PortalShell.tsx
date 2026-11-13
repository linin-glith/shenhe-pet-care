'use client';

/**
 * The buyer's account shell.
 *
 * WHY ENGLISH
 * The buyers are in Germany, the Netherlands, Spain and further afield. A
 * portal that greets them in Chinese is a portal they leave. The back office
 * is Chinese because the people who read it are in Heyuan; this is the other
 * half of the same system and it speaks the buyer's language.
 *
 * WHY A SIDEBAR AND NOT A ROW OF LINKS
 * A portal a buyer returns to is one they navigate, not one they scan. The
 * sidebar holds six destinations that stay in the same place, so a buyer who
 * has learned where "Documents" is does not look for it again. The link row
 * of the previous version put everything on one line and made the
 * destinations compete with each other for attention.
 *
 * WHY THE DATA COMES THROUGH CONTEXT
 * The shell asks the server who is signed in once and publishes the result,
 * so a page does not fetch it again. A render prop — passing a function down
 * as children — cannot cross the server/client boundary: a function is not a
 * serialisable value, and passing one fails at prerender time. Context
 * carries plain data, which is what the boundary allows.
 *
 * WHAT IT DOES NOT SHOW
 * No price, no order total, no deposit. The API does not select those
 * columns, so there is nothing here to hide.
 */

import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import Link from '@/components/SiteLink';
import { signIn } from '@/lib/auth-client';
import { apiMe, apiSignOut, type ApiUser } from '@/lib/api-client';
import { siteConfig } from '@/lib/shenhe.config';
import PasswordField from '@/components/v2/PasswordField';

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type PortalData = { user: ApiUser };

const PortalContext = createContext<PortalData | null>(null);

/** The signed-in buyer. Only valid inside PortalShell. */
export function usePortal(): PortalData {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalShell');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

const NAV = [
  { href: '/portal/dashboard.html', label: 'Overview' },
  { href: '/portal/inquiry.html', label: 'Enquiries' },
  { href: '/portal/quotes.html', label: 'Quotations' },
  { href: '/portal/orders.html', label: 'Orders' },
  { href: '/portal/shipments.html', label: 'Shipments' },
  { href: '/portal/documents.html', label: 'Documents' },
  { href: '/portal/account.html', label: 'Account' },
] as const;

type State =
  | { kind: 'checking' }
  | { kind: 'signed-out' }
  | { kind: 'signed-in'; user: ApiUser };

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

/*
 * The page's name and its lead.
 *
 * The shell used to show one line of text while it checked the
 * session, and because the whole portal is built at export time, that
 * line was the published page: no heading, no lead, nothing that said
 * what the page is. A reader who opened the portal saw a sentence
 * about a session and nothing else.
 *
 * The data has to wait for the session. The name of the page does not,
 * so it is given to the shell and shown in every state, and it is a
 * heading in every state.
 */
export default function PortalShell({
  children,
  title,
  lead,
}: {
  children: ReactNode;
  title: string;
  lead: string;
}) {
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await apiMe();
      if (!alive) return;
      if (res.ok) {
        if (res.data.user) {
          setState({ kind: 'signed-in', user: res.data.user });
        } else {
          setState({ kind: 'signed-out' });
        }
        return;
      }
      // Three different reasons for not seeing a session, and they need
      // three different messages. Being throttled is not the same as being
      // signed out, and neither is the same as being a staff member in the
      // wrong place.
      if (res.status === 429) {
        setNotice('Too many requests in a row. Wait a few seconds and reload.');
      } else if (res.status === 403) {
        setNotice('This account is an internal one. The factory desk is at /admin.html.');
      }
      setState({ kind: 'signed-out' });
    })();
    return () => { alive = false; };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password, 'portal');
      window.location.href = '/portal/dashboard.html';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  }

  /* ---- checking ---- */
  if (state.kind === 'checking') {
    return (
      <div className="min-h-[70vh] bg-v2-ink-050">
        <div className="v2-container py-16">
          <h1 className="v2-display text-3xl md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-v2-ink-600">{lead}</p>
          <p className="mt-8 text-sm text-v2-ink-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  /* ---- signed out ---- */
  if (state.kind === 'signed-out') {
    return (
      <div className="min-h-[70vh] bg-v2-ink-050">
        <div className="v2-container py-16">
          <div className="mx-auto max-w-md">
            <p className="v2-eyebrow">Customer account</p>
            <h1 className="v2-display mt-4 text-3xl md:text-4xl">Sign in</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-v2-ink-600">{lead}</p>
            {notice && (
              <p role="status" className="mt-4 rounded-v2-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {notice}
              </p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-v2-ink-600">
              Your enquiries, our replies, your orders and their shipping documents — in one
              place. If you have not been given an account yet, message us on WhatsApp at{' '}
              <span className="font-semibold text-v2-ink-900">{siteConfig.brand.whatsappDisplay}</span>{' '}
              and we will confirm your details by hand.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-v2-ink-800">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-v2-md border border-v2-ink-200 px-4 py-2.5 text-sm outline-none transition focus:border-v2-accent-500 focus:ring-2 focus:ring-v2-accent-100"
                />
              </div>
              <PasswordField
                id="password"
                name="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                hint="Use Show to see what you typed, or Copy to paste it."
              />

              {error && (
                <p role="alert" className="rounded-v2-md bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-v2-md bg-v2-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 border-t border-v2-ink-100 pt-6 text-sm leading-relaxed text-v2-ink-600">
              You do not need an account to ask for a price —{' '}
              <a href="/contact.html" className="font-semibold text-v2-accent-700 underline underline-offset-4">
                send an enquiry
              </a>{' '}
              and we will quote you. Already sent one?{' '}
              <a href="/portal/track.html" className="font-semibold text-v2-accent-700 underline underline-offset-4">
                Track it by reference
              </a>{' '}
              without signing in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---- signed in ---- */
  const ctx: PortalData = { user: state.user };

  return (
    <div className="min-h-[80vh] bg-v2-ink-050">
      <div className="v2-container py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          {/* ---------------- sidebar ---------------- */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-v2-md border border-v2-ink-200 bg-white p-5">
              <p className="v2-eyebrow">Account</p>
              <p className="mt-2 truncate text-sm font-semibold text-v2-ink-900">
                {state.user.company || state.user.name || state.user.email}
              </p>
              <p className="mt-0.5 truncate text-xs text-v2-ink-500">{state.user.email}</p>
            </div>

            <nav
              aria-label="Account sections"
              className="mt-4 rounded-v2-md border border-v2-ink-200 bg-white p-2"
            >
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-3 rounded-v2-sm px-3 py-2.5 text-sm font-medium text-v2-ink-700 transition-colors hover:bg-v2-ink-050 hover:text-v2-ink-900"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-v2-accent-500"
                    aria-hidden
                  />
                  {n.label}
                </Link>
              ))}
            </nav>

            <button
              onClick={async () => {
                await apiSignOut();
                window.location.href = '/portal/login.html';
              }}
              className="mt-4 w-full rounded-v2-md border border-v2-ink-200 px-4 py-2.5 text-sm font-semibold text-v2-ink-600 transition-colors hover:border-v2-ink-400 hover:text-v2-ink-900"
            >
              Sign out
            </button>
          </aside>

          {/* ---------------- content ---------------- */}
          <main className="min-w-0">
            <h1 className="v2-display text-3xl md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-v2-ink-600">{lead}</p>
            <div className="mt-8">
              <PortalContext.Provider value={ctx}>{children}</PortalContext.Provider>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

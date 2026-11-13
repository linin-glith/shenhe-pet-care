'use client';

/**
 * The browser-side client for the API.
 *
 * WHAT CHANGED AND WHY
 * This file was written against an API that was planned rather than built: it
 * spoke a CSRF handshake, carried a bearer token in sessionStorage, and used
 * two separate login paths for customers and staff. The API that is actually
 * running does none of that. It has no CSRF token, it authenticates with an
 * HttpOnly cookie that JavaScript cannot read, and it has one login route for
 * every role.
 *
 * Keeping the old shape would have meant a second implementation of the server,
 * or a page that reports a service error the operator cannot act on. So this
 * client is rewritten to match what is deployed:
 *
 *   - one origin, always. No local API on a second port.
 *   - session in an HttpOnly cookie. There is no token to keep or refresh, and
 *     a bug in this file cannot leak a session.
 *   - one login, one logout, one /me.
 *
 * Every call still returns a result object rather than throwing, so a page
 * built with it shows something sensible when the API is down instead of an
 * error boundary.
 *
 * ERROR MESSAGE FIELD
 * The server answers errors as { error: "..." }. It used to be { message: ... },
 * so both are read here; a page written against either will show the server's
 * own words.
 */

export function apiBase(): string {
  // The site and the API are always the same origin in production: nginx
  // reverse-proxies /api/* to the Node service. In local development Next.js
  // serves the pages on :3000 and the API is not running, which is not a
  // configuration to support — the API is a server-side component here.
  return '';
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

type Envelope = { error?: string; message?: string } & Record<string, unknown>;

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      // The session cookie is HttpOnly, so this is the only way it travels.
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as Envelope | null;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: data?.error || data?.message || `Request failed (${res.status}).`,
      };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'The service could not be reached. Check your connection and try again.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ApiUser = {
  id: number;
  email: string;
  role: 'customer' | 'sales' | 'production' | 'warehouse' | 'finance' | 'admin';
  customer_id: number | null;
  name?: string | null;
  company?: string | null;
  country?: string | null;
};

export type ApiInquiry = {
  reference: string;
  company?: string | null;
  country?: string | null;
  status: string;
  created_at: string;
  source?: string;
  message?: string | null;
};

export type ApiChat = {
  id: number;
  sku: string | null;
  name: string | null;
  spec: string | null;
  message: string | null;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

/**
 * The two areas, and the session each one keeps.
 *
 * The buyer's portal and the factory desk used to share one session
 * cookie, so signing in to one signed the other out: a member of
 * staff could be signed out of the desk, mid-quote, by a colleague
 * checking a buyer's order. Each area now has its own cookie, and the
 * page that posts the form says which area it is for.
 */
export type AuthScope = 'portal' | 'desk';

export function apiSignIn(email: string, password: string, scope: AuthScope = 'portal') {
  return request<{ user: ApiUser; expires_at?: string }>(
    'POST',
    '/api/auth/login',
    { email, password, scope },
  );
}

/**
 * Create an account.
 *
 * The account is tied to the buyer we already know: the server reuses the
 * customer row that holds this email address, so the inquiries filed under it
 * are already behind the new login. An address with no inquiries behind it
 * gets an empty account, which is what the page says will happen.
 *
 * `invite_code` is accepted and optional. Staff-issued codes are not in use
 * yet — the link is made by the email address instead — so the field is here
 * for the day they are, and sending one today does not break anything.
 */
export function apiRegister(payload: {
  email: string;
  password: string;
  invite_code?: string;
  name?: string;
  company?: string;
  country?: string;
}) {
  return request<{ user: ApiUser }>('POST', '/api/auth/register', payload);
}

export function apiMe() {
  return request<{ user: ApiUser }>('GET', '/api/auth/me');
}

export function apiSignOut(scope: AuthScope = 'portal') {
  return request<{ ok: boolean }>('POST', '/api/auth/logout', { scope });
}

/* ------------------------------------------------------------------ */
/* The signed-in buyer's own enquiries                                 */
/* ------------------------------------------------------------------ */

export function apiMyInquiries() {
  return request<{ inquiries: ApiInquiry[]; scope: 'own' | 'all' }>(
    'GET',
    '/api/auth/inquiries',
  );
}

/** Track an enquiry by its reference, without signing in. */
export function apiTrackInquiry(reference: string) {
  return request<{
    reference: string;
    status: string;
    created_at: string;
    updated_at?: string;
  }>('GET', `/api/inquiries/track?reference=${encodeURIComponent(reference)}`);
}

/* ------------------------------------------------------------------ */
/* Public writes                                                       */
/* ------------------------------------------------------------------ */

/**
 * Send an enquiry.
 *
 * The server decides the reference, stores it, and answers with it. It never
 * returns a price, a minimum order or a lead time — those are confirmed by a
 * person against a specific enquiry, not by a form.
 */
export function apiRecordInquiry(payload: {
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  name?: string;
  message: string;
  products?: string[];
  /** How many units the buyer asked for. */
  quantity?: number;
  /** The trade term the buyer has in mind. */
  incoterm?: string;
  /**
   * WHAT KIND OF BUYER THIS IS.
   *
   * The form asks it once, at the top, because it decides what the
   * answer is: a first order and a repeat order are answered
   * differently, and a distributor is answered differently again.
   * The desk reads it in the notice, so the quotation does not have to
   * ask what the form already knew.
   */
  customerType?: string;
  /**
   * The buyer's estimated annual volume - the band they picked on the
   * form. The form blocks the submission without it, so it is always
   * there; it used to be dropped before it left the browser.
   */
  volume?: string;
  source?: string;
  /**
   * WHERE THE ENQUIRY CAME FROM, IN DETAIL.
   *
   * The server has had this column since the inquiry table was made -
   * it stores the page, the referrer, the campaign parameters and the
   * chat id - and it validates and keeps whatever it is sent. Nothing
   * was ever sent, so the column sat empty.
   *
   * That matters more than it looks. With it empty there is no way to
   * tell an enquiry that arrived from a search engine from one that
   * arrived from a link somebody sent, and "did the SEO work" is a
   * question without an answer. The page and the referrer are the two
   * fields that answer it, and they cost nothing to record.
   */
  source_detail?: Record<string, unknown>;
  /**
   * THE KEY THAT MAKES A REPEAT A REPEAT.
   *
   * The server decides whether two requests are the same enquiry by the
   * fingerprint of the content, so this key is not what makes the
   * protection work - it is what lets the two sides name the same
   * enquiry. It is a digest of what the buyer wrote, so it is the same
   * for the same enquiry and different for a different one.
   */
  idempotency_key?: string;
  /**
   * The bot signals, sent so the server's own check is live.
   *
   * `company_website` is a field no human sees, and `form_age_ms` is how
   * long the form was open. The browser checks both before it sends;
   * sending them means the api can judge a request that did not come
   * from this form.
   */
  company_website?: string;
  form_age_ms?: number;
}) {
  return request<{
    reference: string;
    created_at: string;
    message: string;
    /** True when the server recognised this as an enquiry it already holds. */
    duplicate?: boolean;
  }>(
    'POST',
    '/api/inquiries',
    payload,
  );
}

/* ------------------------------------------------------------------ */
/* Reachability                                                        */
/* ------------------------------------------------------------------ */

/** Is the API there? Used to decide whether to show a fallback or a form. */
export async function apiAlive(): Promise<boolean> {
  const res = await request<{ ok: boolean }>('GET', '/api/health');
  return res.ok;
}
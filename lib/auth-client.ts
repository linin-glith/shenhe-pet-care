/**
 * The sign-in protocol, restated.
 *
 * WHY THE ENDPOINTS CHANGED
 * The constants here used to name routes the server does not have
 * (/api/csrf, /api/auth/customer/login, /api/auth/customer/me). They were
 * written against a planned API. The deployed API has one login route for
 * every role and no CSRF handshake, so the constants are the only thing that
 * needed to move; the error handling below it already matched what the server
 * actually returns, including the 423 an account lock produces.
 *
 * THE ERROR KINDS ARE THE CONTRACT
 * The server answers with specific statuses and the page turns each into a
 * sentence a buyer can act on. 401 is wrong credentials, 423 is a lock, 429 is
 * rate limiting, 0 is the service being unreachable. Each is mapped here rather
 * than in the page, so two pages cannot describe the same failure differently.
 */

import { apiMe, apiSignIn, type ApiUser } from './api-client';

/** Where a sign-in POST goes. One line, if the server says otherwise. */
export const LOGIN_ENDPOINT = '/api/auth/login';
/** The session check. Used to notice a visitor who is already signed in. */
export const ME_ENDPOINT = '/api/auth/me';
/** Where to land after a successful sign-in. */
export const AFTER_LOGIN = '/portal/dashboard.html';

export type AuthErrorKind =
  | 'invalid'
  | 'locked'
  | 'rate-limited'
  | 'unreachable'
  | 'inactive'
  | 'unknown';

export class AuthError extends Error {
  kind: AuthErrorKind;
  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'AuthError';
  }
}

/**
 * Sign a customer in. Throws AuthError with a kind the page can explain.
 *
 * The area is said out loud, because the portal and the desk keep
 * separate sessions: signing in to one used to sign the other out, so
 * a member of staff could be signed out of the desk mid-quote by a
 * colleague checking a buyer's order.
 */
export async function signIn(
  email: string,
  password: string,
  scope: 'portal' | 'desk' = 'portal',
): Promise<void> {
  const res = await apiSignIn(email, password, scope);
  if (res.ok) return;

  const status = res.status;
  if (status === 401 || status === 403) {
    throw new AuthError('invalid', res.message || 'That email and password do not match an account.');
  }
  if (status === 423) {
    throw new AuthError('locked', res.message || 'Too many attempts. Wait a few minutes and try again.');
  }
  if (status === 429) {
    throw new AuthError('rate-limited', res.message || 'Too many attempts. Wait a few minutes and try again.');
  }
  if (status === 0) {
    throw new AuthError('unreachable', 'The sign-in service could not be reached.');
  }
  throw new AuthError('unknown', res.message || 'Sign-in failed.');
}

/**
 * The current session, or null.
 *
 * A missing API is NOT an error here: on a static preview there is no API, so
 * the answer is "nobody is signed in" and the page shows the form. The visitor
 * never sees a complaint about a service they did not know existed.
 */
export async function currentSession(): Promise<ApiUser | null> {
  const res = await apiMe();
  if (!res.ok) return null;
  return res.data.user ?? null;
}
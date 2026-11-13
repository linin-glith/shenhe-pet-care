/**
 * What this visitor looked at, in the order they looked at it.
 *
 * WHY THIS EXISTS
 * A form tells us what someone wants. It does not tell us what they had
 * already looked at, which is the difference between "they want a 500 mL
 * shampoo" and "they spent four minutes comparing our three 5 L jugs and then
 * asked about the smallest one". A sales manager reading the second enquiry
 * knows where to start; reading the first they start from scratch.
 *
 * WHAT IS RECORDED, AND WHAT IS NOT
 * The URL and the timestamp, in the browser, in sessionStorage. No identifier,
 * no fingerprint, nothing that follows the person from one visit to the next —
 * a new browser session starts an empty list. Nothing here leaves the device
 * unless the visitor submits the enquiry form, and then only the path they
 * already saw, as part of that enquiry.
 *
 * WHY SESSIONSTORAGE AND NOT LOCALSTORAGE
 * localStorage would carry yesterday's reading list into today's enquiry, and
 * the back office would attribute pages the buyer never opened this time. The
 * mistake would be invisible and it would look like a genuine interest signal.
 *
 * THE CAP
 * Twenty entries. A real buyer session is a handful of pages; twenty is enough
 * to see a comparison and short enough that nobody's whole browsing history
 * ends up in a sales record.
 */

const KEY = 'shenhe:viewpath:v1';
const MAX = 20;

/** Pages worth remembering: not every asset request and not the portal. */
function isInteresting(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('/_next/')) return false;
  if (path.startsWith('/portal/')) return false;
  if (path.startsWith('/admin')) return false;
  return path.endsWith('.html') || path === '/';
}

function read(): Array<{ path: string; at: string }> {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX) : [];
  } catch {
    return [];
  }
}

function write(list: Array<{ path: string; at: string }>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* private mode or quota — the enquiry is still worth recording */
  }
}

/** Record the page just loaded. Called once per route change. */
export function recordPageView(path?: string) {
  if (typeof window === 'undefined') return;
  const p = path ?? window.location.pathname;
  if (!isInteresting(p)) return;

  const list = read();
  const last = list[list.length - 1];
  // A re-render on the same page is not a second view. Without this, a client
  // component that re-mounts on a state change would fill the list with one
  // page and hide everything the visitor actually looked at.
  if (last && last.path === p) return;

  list.push({ path: p, at: new Date().toISOString() });
  write(list);
}

/** The path so far, for the enquiry that carries it. */
export function viewPath(): Array<{ path: string; at: string }> {
  if (typeof window === 'undefined') return [];
  return read();
}

/** A one-line summary, so the back office shows something readable first. */
export function viewSummary(): string {
  const list = read();
  if (list.length === 0) return '';
  return list
    .map((e) => e.path.replace(/^\//, '').replace(/\.html$/, '') || 'home')
    .join(' → ');
}

/** Clear it after a successful submit, so the next enquiry starts clean. */
export function clearViewPath() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
'use client';

/**
 * Analytics, and the consent that has to come before it.
 *
 * WHY THIS IS NOT GOOGLE TAG MANAGER
 * Tag Manager is the right tool when one snippet has to drive several tools —
 * analytics, advertising pixels, a conversion tag, a heat map. Here there is
 * one measurement ID to install and one heat map, and Tag Manager adds a
 * container that must be configured and published before anything is sent.
 * An empty container sends nothing, which looks exactly like a broken site.
 * Two tags do not need a container between them and the browser.
 *
 * WHY THE CONSENT BANNER IS NOT OPTIONAL
 * The buyers are in Germany, the Netherlands, Spain and elsewhere in the
 * European Economic Area. Google Analytics sets cookies, and a member-state
 * visitor has to be able to refuse before that happens. Consent Mode v2 is
 * Google's mechanism for this: the tag loads, but no measurement cookie is
 * set and no identifying information is sent until consent is given.
 *
 * WHAT IS SENT BEFORE CONSENT
 * Under Consent Mode, a cookieless ping is sent so that aggregate counts stay
 * accurate — a visitor who refuses is counted, but not identified, and no
 * cross-site or cross-visit trail exists. That is the difference between
 * Consent Mode and simply not loading the tag: without the tag, the refusals
 * disappear from the numbers and the report flatters itself.
 *
 * THE TWO LEVELS
 *   necessary   — strictly required for the site to work. Nothing here.
 *   analytics   — Google Analytics 4 and Microsoft Clarity, and the chat
 *                 assistant's own state.
 *   marketing  — nothing currently, but the slot exists so that enabling a
 *                 marketing tag later is a configuration change rather than a
 *                 code change and a legal review from scratch.
 *
 * WHY THE CHAT STATE IS "ANALYTICS" AND NOT "NECESSARY"
 * The chat assistant's knowledge base is a static file. The only state is the
 * open/closed flag and the current draft, both of which stay in the browser
 * and are never sent anywhere. It is filed under analytics anyway, because
 * refusing analytics should leave the assistant exactly as usable as
 * consenting to it — a site that breaks a feature for a refusal is a site
 * that teaches people to refuse everything.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/shenhe.config';
import { getT } from '@/lib/i18n';
import { localeOfPath } from '@/lib/i18n/config';
import { OPEN_CONSENT_EVENT } from '@/lib/consent';

type ConsentState = 'unknown' | 'necessary' | 'analytics' | 'marketing';

const STORAGE_KEY = 'shenhe:consent:v1';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    /** Clarity's loader, and the queue it drains before it loads. */
    clarity?: ClarityLoader;
  }
}

/** The Clarity loader function, with the queue it keeps until it arrives. */
type ClarityLoader = ((...args: unknown[]) => void) & { q?: unknown[] };

/**
 * The Clarity project id, from the same place the tag reads it.
 *
 * The tag reads the configuration. The consent call used to read an
 * environment variable that was never set, so the two could disagree —
 * and the branch that tells Clarity that consent was given never ran.
 */
const CLARITY_ID = siteConfig.analytics.clarityId;

function readConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'necessary' || v === 'analytics' || v === 'marketing') return v;
  } catch {
    /* private mode */
  }
  return 'unknown';
}

function writeConsent(state: ConsentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    /* private mode: the choice holds for this page view only */
  }
}

/**
 * The consent default. Everything is denied until the visitor decides.
 *
 * The order matters: `ad_storage`, `ad_user_data` and `ad_personalization`
 * are the signals Google uses to decide whether a request may carry
 * advertising identifiers at all, and `wait_for_update` keeps the tag from
 * firing a first, un-consented ping before the banner has been answered.
 */
function applyConsent(state: ConsentState) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    (window.dataLayer as unknown[]).push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: state === 'analytics' || state === 'marketing' ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
  });

  window.gtag('consent', 'update', {
    analytics_storage: state === 'analytics' || state === 'marketing' ? 'granted' : 'denied',
    ad_storage: state === 'marketing' ? 'granted' : 'denied',
    ad_user_data: state === 'marketing' ? 'granted' : 'denied',
    ad_personalization: state === 'marketing' ? 'granted' : 'denied',
    personalization_storage: state === 'marketing' ? 'granted' : 'denied',
  });
}

/**
 * Clarity's own consent signal.
 *
 * WHAT THIS USED TO BE, AND WHY IT DID NOTHING
 * The old call pushed `['consent', 'v2', { analytics, ad }]` into
 * `window.clarity.q`. No Clarity API has that shape: the command is
 * `consentv2`, and the two parameters are `ad_Storage` and
 * `analytics_Storage` — names that are case sensitive, with an
 * underscore and a plural. It was also placed behind
 * `next === 'marketing'`, and the banner has never offered a marketing
 * button, so the branch could not run at all.
 *
 * The consequence was not cosmetic. Since 31 October 2025 Clarity
 * enforces the consent signal for visits from the EEA, the UK and
 * Switzerland. A visitor who never receives a valid signal is counted
 * in no-consent mode: no session recording, no heat map, no journey
 * across pages. The buyers this site is written for are in exactly
 * those three places, so the recordings were being paid for and never
 * seen.
 *
 * WHAT THE CALL LOOKS LIKE NOW
 * One call, with the two documented parameters, in every state:
 *
 *   necessary   analytics_Storage denied   ad_Storage denied
 *   analytics   analytics_Storage granted  ad_Storage denied
 *   marketing   analytics_Storage granted  ad_Storage granted
 *
 * The advertising permission stays denied because the banner has no
 * marketing button and the site runs no advertising tag. Granting it
 * would be a consent the visitor never gave.
 */
function applyClarityConsent(state: ConsentState) {
  if (typeof window === 'undefined' || !CLARITY_ID) return;

  const analytics = state === 'analytics' || state === 'marketing' ? 'granted' : 'denied';
  const ad = state === 'marketing' ? 'granted' : 'denied';

  /*
   * The queue.
   *
   * The tag may not have loaded when the visitor answers the banner —
   * the banner is on the page before an after-interactive script runs —
   * and a call made into a missing function is a call that never
   * happens. Microsoft asks every consent platform to install this
   * shim first, so the decision is recorded now and replayed when the
   * tag arrives.
   */
  if (!window.clarity) {
    window.clarity = function () {
      const self = window.clarity as ClarityLoader;
      self.q = self.q || [];
      self.q.push(Array.prototype.slice.call(arguments));
    };
  }

  window.clarity('consentv2', {
    ad_Storage: ad,
    analytics_Storage: analytics,
  });
}

export default function ConsentGate() {
  /*
   * The language of the banner is the language of the page.
   *
   * The consent banner lives in the root layout, because it has to be on
   * every page including the ones that are not public. The root layout
   * is above every route and cannot see the locale, so this component
   * reads it from the path — the same place the page reads it from.
   */
  const pathname = usePathname();
  const locale = localeOfPath(pathname ?? '/');
  const t = getT(locale);
  /* A JSX attribute holds a string, not a function. */
  const tr = (key: Parameters<typeof t>[0]) => t(key);
  const [state, setState] = useState<ConsentState>('unknown');
  const [ready, setReady] = useState(false);
  /*
   * Whether the panel is on screen.
   *
   * This is NOT the same thing as the decision, and keeping them apart is
   * what makes withdrawal possible. The decision is what the visitor
   * chose and what is stored; the panel is whether they are being asked
   * right now. When the footer's cookie-settings control asks for the
   * panel, the decision stays exactly as it was — so the banner can say
   * what the current choice is, and the visitor can change it or leave
   * it alone.
   */
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const existing = readConsent();

    // The default has to be set before the tag fires anything, so it is
    // applied first and the stored decision follows immediately after. If the
    // decision is loaded first there is a window in which the tag has run
    // with no default at all, which is the window a consent claim cannot
    // survive.
    applyConsent('necessary');
    if (existing !== 'unknown') {
      applyConsent(existing);
      setState(existing);
    }

    /*
     * Clarity gets ONE call, carrying the decision that is actually in force.
     *
     * Microsoft asks a consent platform not to send a default and then the
     * stored value as two separate calls. One call with the final state is
     * what they ask for, and a visitor who already agreed is tracked from
     * their first page view instead of their second. A visitor who has not
     * decided yet is told both permissions are denied, which is the honest
     * answer and the one that keeps Clarity in its no-consent mode.
     */
    applyClarityConsent(existing === 'unknown' ? 'necessary' : existing);

    // The banner is up when nobody has decided yet, and down when they have.
    setPanelOpen(existing === 'unknown');
    setReady(true);
  }, []);

  /*
   * The footer's withdrawal route.
   *
   * The event carries no state: the gate reads the decision it already
   * holds. Nothing is stored and nothing is sent — opening the panel
   * changes nothing until the visitor presses a button.
   */
  useEffect(() => {
    function reopen() {
      setPanelOpen(true);
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function choose(next: ConsentState) {
    writeConsent(next);
    applyConsent(next);
    setState(next);
    setPanelOpen(false);

    if (next === 'analytics' || next === 'marketing') {
      // The measurement event is sent only now. Under Consent Mode a
      // cookieless ping already counted the visit; this is the first one that
      // can be attributed to a person.
      window.gtag?.('event', 'consent_update', { consent_state: next });
    }

    // Clarity's own consent API. It is separate from Google's: the tag
    // loads either way, but this call is what lets it record a session —
    // and it is the call that tells Clarity the advertising permission is
    // still denied, because no marketing button was ever pressed.
    applyClarityConsent(next);
  }

  if (!ready || !panelOpen) return null;

  /*
   * What the visitor chose last time.
   *
   * Only shown when there IS a previous choice — that is, when the panel
   * was re-opened from the footer rather than shown for the first time.
   * Without it the panel would look like a first-time question and the
   * visitor would have to guess which of the two buttons is the one they
   * already pressed.
   */
  const currentChoice =
    state === 'unknown' ? null : state === 'necessary' ? t('cookie.necessary') : t('cookie.accept');

  return (
    <div
      role="dialog"
      aria-label={tr('cookie.title')}
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-v2-ink-200 bg-white px-5 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-v2-ink-900">
            {t('cookie.title')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-v2-ink-600">
            {t('cookie.lead')}
          </p>
          {currentChoice && (
            <p className="mt-1 text-xs font-medium text-v2-ink-900">
              {t('cookie.current', { choice: currentChoice })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => choose('necessary')}
            className="rounded-v2-md border border-v2-ink-200 px-4 py-2 text-sm font-semibold text-v2-ink-700 transition-colors hover:border-v2-ink-900"
          >
{t('cookie.necessary')}
          </button>
          <button
            type="button"
            onClick={() => choose('analytics')}
            className="rounded-v2-md bg-v2-ink-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-v2-ink-800"
          >
{t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Read the current state, for anything that needs it outside this file. */
export function currentConsent(): ConsentState {
  return readConsent();
}

export { applyConsent };

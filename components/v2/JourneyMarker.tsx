'use client';

/**
 * THE MARK ON EVERY LINK, AND THE PATH THAT SURVIVES THE CLICK.
 *
 * WHAT THIS IS FOR
 *
 * The site can say how many enquiries arrived. It cannot say where the
 * buyer came from, because the answer is thrown away on the way: a
 * visitor arrives from a search with a campaign on the link, clicks
 * three pages, and the campaign is gone by the time the form is sent.
 *
 * So two things are done:
 *
 *   every link carries a mark saying where it is - which product,
 *   which guide, which button - so the path can be read afterwards
 *   the campaign the visitor arrived with is kept for thirty days, so
 *   it survives the journey from the first page to the form
 *
 * WHY IT IS DONE IN THE BROWSER AND NOT ON THE SERVER
 *
 * The mark is on the link the visitor clicks, and the campaign is in
 * the link they arrived on. Neither is visible to the server - the
 * server only sees the page that was requested. So the work is done
 * where the information is.
 *
 * WHY THE MARK IS NOT A QUERY STRING ON EVERY LINK
 *
 * A query string on every link would make every address in the
 * search console a different address, and a site that is a thousand
 * addresses long is a site nobody can rank. The mark goes on the
 * links the visitor clicks, in the browser, and it is recorded as an
 * event - not as a different address.
 *
 * WHAT IS AND IS NOT RECORDED
 *
 * The page the visitor was on, the mark on the link they clicked,
 * and the campaign they arrived with. Nothing about who they are.
 * The enquiry form does not read any of this - it reads the
 * campaign cookie and writes it into the enquiry's source detail,
 * which is what the desk reads.
 *
 * THE COOKIE
 *
 * One cookie, thirty days, first-party, same site. It holds the
 * campaign and the last page. It is not a tracking cookie: it does
 * not follow the visitor to another site, and it does not identify
 * them. The consent gate covers the analytics; this cookie is read
 * by the site itself to write down where the enquiry came from.
 */

import { useEffect } from 'react';

const CAMPAIGN_COOKIE = 'shenhe_journey';
const CAMPAIGN_DAYS = 30;

/** The marks the site uses, so nothing invents a new one by accident. */
export const JOURNEY_MARKS = {
  ask: 'ask',
  contact: 'contact',
  whatsapp: 'whatsapp',
  email: 'email',
  phone: 'phone',
  guide: 'guide',
  product: 'product',
  report: 'report',
  nav: 'nav',
  footer: 'footer',
} as const;

type Journey = {
  /** The campaign the visitor arrived with, if any. */
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  /** The page they were on when they clicked. */
  from?: string;
  /** The marks they have clicked, most recent last. */
  steps?: string[];
  /** When the journey started. */
  first?: string;
};

/* ------------------------------------------------------------------ */
/* The cookie                                                          */
/* ------------------------------------------------------------------ */

function readJourney(): Journey | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + CAMPAIGN_COOKIE + '=([^;]*)'),
  );
  if (!m || !m[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as Journey;
  } catch {
    return null;
  }
}

function writeJourney(j: Journey): void {
  if (typeof document === 'undefined') return;
  const until = new Date(Date.now() + CAMPAIGN_DAYS * 86400000).toUTCString();
  const value = encodeURIComponent(JSON.stringify(j));
  document.cookie = `${CAMPAIGN_COOKIE}=${value}; expires=${until}; path=/; SameSite=Lax`;
}

/* ------------------------------------------------------------------ */
/* The mark on a link                                                  */
/* ------------------------------------------------------------------ */

/**
 * The mark for a link, read from the element itself.
 *
 * The mark is written into the page as a data attribute, so it is
 * there in the built html - a crawler sees it, and the screen reader
 * announces the same button the visitor sees.
 */
function markOf(el: Element): string | null {
  const own = el.getAttribute('data-journey');
  if (own) return own;
  const host = el.closest('[data-journey]');
  if (host && host !== el) {
    const h = host.getAttribute('data-journey');
    if (h) return h;
  }
  return null;
}

/** A short, readable name for where the click came from. */
function describe(el: Element): string {
  const href = el.getAttribute('href') ?? '';
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (href.startsWith('mailto:')) return `email:${text || href.slice(7)}`;
  if (href.startsWith('tel:')) return `phone:${text || href.slice(4)}`;
  if (href.includes('wa.me')) return `whatsapp:${text || href}`;
  if (href.startsWith('http')) {
    try {
      const u = new URL(href);
      if (u.hostname.includes('shenhezhongke')) return u.pathname;
      return `${u.hostname}${u.pathname}`;
    } catch {
      return href.slice(0, 60);
    }
  }
  return href || text || 'link';
}

/* ------------------------------------------------------------------ */
/* The component                                                       */
/* ------------------------------------------------------------------ */

export default function JourneyMarker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* 1. the campaign the visitor arrived with, kept for thirty days */
    const params = new URLSearchParams(window.location.search);
    const arriving = {
      source: params.get('utm_source') ?? undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
      term: params.get('utm_term') ?? undefined,
    };

    const existing = readJourney();
    const journey: Journey = existing ?? {};

    // a new campaign replaces the old one: the newest visit is the
    // visit that matters, and an old campaign from three weeks ago
    // would be a lie about where this visit came from
    if (arriving.source) {
      journey.source = arriving.source;
      journey.medium = arriving.medium;
      journey.campaign = arriving.campaign;
      journey.term = arriving.term;
      journey.first = new Date().toISOString();
      journey.steps = [];
    }
    if (!journey.steps) journey.steps = [];
    if (!journey.first) journey.first = new Date().toISOString();
    journey.from = window.location.pathname;
    writeJourney(journey);

    /* 2. every click on a marked link is recorded */
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      const el = target.closest('a');
      if (!el) return;

      const mark = markOf(el);
      const where = describe(el);

      // the journey: the mark, then the page it leads to
      const steps = (journey.steps ?? []).slice(-19);
      steps.push(mark ? `${mark}:${where}` : where);
      journey.steps = steps;
      journey.from = window.location.pathname;
      writeJourney(journey);

      // and the analytics: an event, not a different address
      const gtag = (window as unknown as {
        gtag?: (...args: unknown[]) => void;
      }).gtag;
      if (typeof gtag === 'function') {
        try {
          gtag('event', 'journey_click', {
            link_mark: mark ?? 'none',
            link_where: where,
            link_text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
            page_path: window.location.pathname,
            journey_source: journey.source ?? 'direct',
          });
        } catch {
          /* the analytics is not worth breaking a click for */
        }
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

/* ------------------------------------------------------------------ */
/* What the enquiry form reads                                         */
/* ------------------------------------------------------------------ */

/**
 * The journey, as the form writes it into the enquiry.
 *
 * The form calls this when the visitor sends the enquiry. It returns
 * the campaign they arrived with and the pages they were on - the
 * two things the desk cannot get any other way.
 */
export function journeyForEnquiry(): {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  steps?: string[];
  first_seen?: string;
} {
  const j = readJourney();
  if (!j) return {};
  return {
    source: j.source,
    medium: j.medium,
    campaign: j.campaign,
    term: j.term,
    steps: (j.steps ?? []).slice(-20),
    first_seen: j.first,
  };
}

export const JOURNEY_COOKIE_NAME = CAMPAIGN_COOKIE;
export const JOURNEY_COOKIE_DAYS = CAMPAIGN_DAYS;

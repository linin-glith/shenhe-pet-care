'use client';

/**
 * Back to top.
 *
 * WHY IT EXISTS
 * The catalogue and the long pages are tall: a buyer comparing nine SKUs on
 * one line scrolls a long way, and then has to scroll all the way back to
 * reach the header, the quote form or the next line. The header is sticky, so
 * the navigation is never more than one flick away — but the QUOTE form is at
 * the bottom of a product page, and the way to it is down, not up.
 *
 * THE RULES
 *   - It appears only once the buyer has actually scrolled. A control that is
 *     there on arrival is a control nobody looks at.
 *   - It sits ON the conversion dock rather than under it. Two floating
 *     things fighting for the same corner is how the footer ends up covered.
 *   - It yields to the footer. The footer carries the contact details, the
 *     legal links and the address; a round button parked on top of them is a
 *     button that hides a phone number.
 *   - It is a real button, in the tab order, with a label a screen reader can
 *     read, and it scrolls smoothly unless the visitor asked for less motion.
 */

import { useEffect, useState } from 'react';
import { getT } from '@/lib/i18n';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

export default function BackToTop({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const t = getT(locale);
  /* A JSX attribute holds a string, not a function. */
  const tr = (key: Parameters<typeof t>[0]) => t(key);
  const [shown, setShown] = useState(false);
  const [overDock, setOverDock] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      // After one screen: the buyer has committed to reading the page.
      setShown(y > vh * 0.9);

      // The dock is a fixed strip on the bottom edge. When it is up, the
      // whole floating stack moves up by one slot - the rail announces that
      // on <body>, so this button does not measure anything itself. It used
      // to, and the two answers did not always agree.
      setOverDock(false);

      // The footer is the last thing on the page and it carries the contact
      // details. The button yields to it.
      const footer = document.querySelector('footer');
      if (!footer) {
        setAtFooter(false);
        return;
      }
      const r = footer.getBoundingClientRect();
      setAtFooter(r.top < vh * 0.6);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const visible = shown && !atFooter;

  const toTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={`to-top${visible ? ' to-top--in' : ''}${overDock && visible ? ' to-top--over-dock' : ''}`}
      onClick={toTop}
      aria-label={tr('action.back')}
      title={tr('action.back')}
      /* Hidden means unreachable: a button that cannot be seen must not sit in
         the tab order either. */
      inert={!visible}
      aria-hidden={!visible}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

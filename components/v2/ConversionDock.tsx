'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/shenhe.config';
import { whatsappLink } from '@/lib/contact-links';
import { clientProducts as products } from '@/lib/client-products';
import { getT } from '@/lib/i18n';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

/**
 * Conversion Dock — the persistent buying rail.
 *
 * THE PROBLEM IT SOLVES
 * On the legacy site the only way to contact the factory was to scroll to the
 * footer or the contact page. A buyer comparing four suppliers has to keep four
 * tabs open and re-navigate to ask a single question. Every extra click between
 * "I'm interested" and "I'm in touch" is a competitor's quote winning instead.
 *
 * THE RULE
 * The dock stays out of the way until the buyer has actually read the hero —
 * a rail that is present on arrival reads as pressure, not service — then
 * docks to the bottom edge with the three facts a procurement lead needs
 * (commitment, responsiveness, certification) and two ways to start.
 *
 * IT IS NOT A MODAL
 * No overlay, no dismissal trap, no email gate. It occupies one strip, never
 * covers content, and disappears the moment the RFQ form is on screen.
 *
 * THE FACTS ARE DERIVED, NOT TYPED
 * The minimum order and the private-label lead time used to be literal strings
 * in this file, which meant a catalogue change could leave the rail quoting a
 * number the product pages no longer show. They are read from the same
 * products.json the catalogue renders.
 */

export default function ConversionDock({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const t = getT(locale);
  const [shown, setShown] = useState(false);
  const [atForm, setAtForm] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [hasForm, setHasForm] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      // Appear once the hero has scrolled past ~70% of a viewport, so the dock
      // signals "you have seen what we are" before it asks for anything.
      setShown(y > vh * 0.7);

      /*
       * YIELD TO THE FOOTER.
       *
       * The dock is a strip over the bottom edge of the screen, and the
       * footer's legal row is the last thing on the page - so when the
       * footer is on screen the dock is sitting on top of it. The legal
       * links, and the cookie settings control that lets a visitor take
       * their consent back, were under the dock and could not be
       * clicked. The dock disappears instead: the footer carries its own
       * links and its own contact buttons.
       */
      const footer = document.querySelector('footer');
      if (footer) {
        const fr = footer.getBoundingClientRect();
        setAtFooter(fr.top < vh * 0.9);
      }

      // Yield to the RFQ form: if it is on screen, the dock is redundant and
      // two competing CTAs is worse than one.
      const form = document.getElementById('rfq');
      setHasForm(Boolean(form));
      if (!form) {
        setAtForm(false);
        return;
      }
      const r = form.getBoundingClientRect();
      setAtForm(r.top < vh * 0.8 && r.bottom > 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };  }, []);

  const visible = shown && !atForm && !atFooter;

  /*
   * THE RAIL ANNOUNCES ITSELF.
   *
   * Three floating controls share the bottom-right corner: the back-to-top
   * button, the product-chat entry and the RAG assistant. Each of them used
   * to work out for itself whether the rail was on screen, and they did not
   * agree - when the rail came up, the assistant and the chat entry landed
   * on the same spot and the buyer saw two circles on top of each other.
   *
   * The rail is the one widget that knows whether it is on screen, so it is
   * the one that says so: a class on <body> shifts the whole stack up by
   * one slot. The other two no longer measure anything.
   */
  useEffect(() => {
    document.body.classList.toggle('v2-dock-up', visible);
    return () => document.body.classList.remove('v2-dock-up');
  }, [visible]);

  const wa = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
    'Hi, I would like a quote for a pet care OEM/ODM project'
  )}`;

  /** The lowest minimum order across the live catalogue. */
  const lowestMoq = products.reduce((min, p) => Math.min(min, p.moq), Number.POSITIVE_INFINITY);

  /** The private-label lead time, as a range when the SKUs disagree. */
  const oemLeads = [...new Set(products.map((p) => p.lead_time_days_oem))].sort();
  const oemLead =
    oemLeads.length === 1
      ? oemLeads[0]
      : `${oemLeads[0]}-${oemLeads[oemLeads.length - 1]}`.replace(/-/g, '–');

  return (
    <div
      className={`dock${visible ? ' dock--in' : ''}`}
      aria-hidden={!visible}
      /* A hidden rail must not be reachable by keyboard: aria-hidden on a
         container that still holds focusable links is an accessibility
         failure (WCAG: aria-hidden-focus). `inert` takes it out of the tab
         order entirely while it is off screen. */
      inert={!visible}
    >
      <div className="v2-container dock__inner">
        {/* facts — the three questions a buyer asks before contacting anyone */}
        <dl className="dock__facts">
          <div>
            <dt>MOQ</dt>
            <dd>from {lowestMoq.toLocaleString()}</dd>
          </div>
          <div>
            <dt>{t('products.leadtime')}</dt>
            <dd>{oemLead} days</dd>
          </div>
          <div>
            <dt>{t('action.learnmore')}</dt>
            <dd>{siteConfig.response.headline}</dd>
          </div>
        </dl>

        {/*
          The badge is not a term and its value - it is a mark, not an
          entry in the list - so it sits beside the list rather than
          inside it. A <dl> may only hold dt/dd groups, and a bare div
          in one breaks the definition list for anything that reads the
          page as a structure: a screen reader, and an assistant
          reading the page for the facts.
        */}
        <div className="dock__badge">{siteConfig.metrics.gmpStandard} GMP</div>

        <div className="dock__actions">
          <a data-journey="whatsapp" className="dock__btn dock__btn--ghost" href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          {/* When the page carries its own RFQ form, send the buyer to it
              instead of navigating them off the page they are reading. */}
          <a className="dock__btn dock__btn--solid" href={hasForm ? '#rfq' : '/contact.html'}>
{t('nav.quote')}
          </a>
        </div>
      </div>
    </div>
  );
}
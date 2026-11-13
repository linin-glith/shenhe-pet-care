'use client';

/**
 * The chat entry —a detailed enquiry about ONE product, from anywhere.
 *
 * WHY IT EXISTS
 * The buyer is looking at a product and wants to ask something specific:
 * can you do 5,000 units, is the 500 mL the same formula as the 300 mL, what
 * is the price. Today the only routes to a human are the conversion dock
 * (which says nothing about WHICH product) and the enquiry form (which starts
 * blank). So the question gets asked in a way that loses the context, or not
 * asked at all.
 *
 * This entry keeps the context: the product, its size, its minimum and its
 * line travel with the message. That is the "basic information" the back
 * office will need when there is one.
 *
 * WHY IT IS IN THE BROWSER FOR NOW
 * The site is a static export: there is no endpoint to post to. The same
 * rule the enquiry form and the question board follow applies here —the
 * payload is written to this browser, and the message is handed to WhatsApp,
 * which is the channel the factory already watches. When the order system is
 * built, this component swaps its local store for the API; the SHAPE of the
 * data does not change (see lib/chat-context.ts).
 *
 * THE RULES
 *   - It sits in the same corner as the back-to-top button, stacked ABOVE
 *     it, and lifts when the conversion dock slides up, so the three
 *     floating things never cover each other.
 *   - It is always available. Unlike the back-to-top button, a chat entry
 *     that only appears after a scroll is an entry that half the buyers
 *     never see.
 *   - The buyer can see what will be sent before it is sent.
 */

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import { whatsappLink } from '@/lib/contact-links';
import { getT } from '@/lib/i18n';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

/**
 * Record the question with the API.
 *
 * The failure is swallowed on purpose: the WhatsApp hand-off below carries the
 * same message, so a visitor who cannot reach the API still reaches a person.
 * A chat that visibly breaks because a background record failed would be a
 * worse outcome than a question that was not logged.
 */
function recordQuestion(payload: {
  sku?: string;
  name?: string;
  spec?: string;
  line?: string;
  message: string;
  page?: string;
  phone?: string;
  email?: string;
  company?: string;
  country?: string;
}): Promise<{ reference?: string | null; track_url?: string | null }> {
  /*
   * The answer carries the reference.
   *
   * The server writes the message and the enquiry together, and answers
   * with the reference the enquiry was given. It is the buyer's handle
   * on the enquiry, so it is put in front of them.
   *
   * A failure is not shown: the WhatsApp hand-off carries the same
   * message, and a chat that visibly breaks because a background
   * record failed is worse than a question that was not logged.
   */
  return fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => ({ reference: d?.reference ?? null, track_url: d?.track_url ?? null }))
    .catch(() => ({ reference: null, track_url: null }));
}
import {
  type ChatSubject,
  chatMessage,
  currentSubject,
  draftMessage,
  logChat,
  rememberSubject,
} from '@/lib/chat-context';

export default function ProductChat({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const t = getT(locale);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<ChatSubject | null>(null);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [overDock, setOverDock] = useState(false);
  /**
   * The reference the enquiry was given, and the link to follow it.
   *
   * It is shown to the buyer because we can receive a WhatsApp message
   * but cannot send one: the buyer carries the number back to us.
   */
  const [reference, setReference] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [contact, setContact] = useState({ phone: '', email: '' });

  const panelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ---- what the visitor is looking at -------------------------------- */
  useEffect(() => {
    const found = currentSubject(window.location.pathname);
    setSubject(found);
    if (found) rememberSubject(found);
  }, []);

  /* ---- the dock slides up at the bottom edge; lift out of its way ----
   *
   * The rail announces that on <body> and the whole floating stack moves up
   * by one slot. This component used to measure the rail itself, and the
   * RAG assistant - which cannot be told - placed itself by a different
   * rule, so the two landed on the same spot when the rail came up. */
  useEffect(() => {
    setOverDock(false);
  }, []);

  /* ---- open: prefill the draft, focus the field, move the caret ------ */
  useEffect(() => {
    if (!open) return;
    setText((cur) => cur || draftMessage(subject));
    setSent(false);
    const t = window.setTimeout(() => textRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, subject]);

  /* ---- escape closes, outside click closes ---------------------------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  function send() {
    const ctx = {
      subject,
      page: window.location.href,
      at: new Date().toISOString(),
      message: text,
    };
    logChat(ctx);
    /*
     * Record it, so the back office can see what was asked and about which
     * product. If the API is not running, the WhatsApp hand-off below still
     * carries everything —the message is the same either way.
     */
    /*
     * A way to reply, or there is no enquiry.
     *
     * The number the buyer writes from is the phone; an email address
     * works too. Without one of the two there is nothing to attach a
     * reference to, and the WhatsApp hand-off below still carries the
     * message.
     */
    const phone = contact.phone.trim();
    const email = contact.email.trim();

    void recordQuestion({
      sku: subject?.sku,
      name: subject?.name,
      spec: subject?.spec,
      line: subject?.line,
      message: text,
      page: window.location.href,
      phone: phone || undefined,
      email: email || undefined,
    }).then((r) => {
      if (r.reference) {
        setReference(r.reference);
        setTrackUrl(r.track_url ?? null);
      }
    });
    const wa = whatsappLink({
      product: subject?.name,
      sku: subject?.sku,
      note: text.trim() || undefined,
      page: 'a pet care product',
    });
    window.open(wa, '_blank', 'noopener');
    setSent(true);
  }

  const enquiryHref = subject ? `/contact.html?about=${subject.sku}` : '/contact.html';

  return (
    <div className={`chat-dock${overDock ? ' chat-dock--over-dock' : ''}`}>
      {open && (
        <div
          className="chat-panel"
          role="dialog"
          aria-label="Ask about this product"
          ref={panelRef}
          data-clarity-mask
        >
          <div className="chat-panel__head">
            <div>
              <p className="chat-panel__title">{t('products.ask')}</p>
              <p className="chat-panel__sub">
                {subject ? (
                  <>
                    {subject.name} —{subject.spec}
                    <span className="chat-panel__meta">
                      SKU {subject.sku} · MOQ {subject.moq.toLocaleString()}
                    </span>
                  </>
                ) : (
                  'No product selected —your question goes to the sales desk as a general enquiry.'
                )}
              </p>
            </div>
            <button
              type="button"
              className="chat-panel__close"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
{t('action.hide')}
            </button>
          </div>

          {sent ? (
            <div className="chat-panel__sent">
              <span aria-hidden className="chat-panel__sent-icon">
                <Icon name="check" size={16} />
              </span>
              <p>
                Your message is open in WhatsApp with the product details filled in. If the
                window did not open, use the enquiry form instead —it carries the same
                context.
              </p>
              <a className="chat-panel__link" href={enquiryHref}>
{t('nav.quote')}
              </a>
              {reference && (
                <div className="chat-panel__reference">
                  <p className="chat-panel__reference-head">{t('portal.stat.inquiries')}</p>
                  <div className="chat-panel__reference-row">
                    <code className="chat-panel__reference-code">{reference}</code>
                    <button
                      type="button"
                      className="chat-panel__reference-copy"
                      onClick={() => {
                        void navigator.clipboard?.writeText(
                          trackUrl
                            ? `${reference}\n${trackUrl}`
                            : reference,
                        );
                      }}
                    >
{t('action.copy')}
                    </button>
                  </div>
                  <p className="chat-panel__reference-note">
                    Send this to us on WhatsApp so we can match it to your enquiry, and keep
                    it — you can use it to follow up at any time.
                  </p>
                  {trackUrl && (
                    <a className="chat-panel__link" href={trackUrl}>
{t('portal.track')}
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <label className="chat-panel__label" htmlFor="chat-message">
{t('form.message')}
              </label>
              <textarea
                id="chat-message"
                className="chat-panel__input"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Can you do 5,000 units with our label?"
                ref={textRef}
              />
              <p className="chat-panel__note">
                We reply within 1 business day (CST). Nothing is sent until you press
                send.
              </p>
              <div className="chat-panel__reply">
                <p className="chat-panel__reply-head">
                  Where should we reply? One of these is enough.
                </p>
                <div className="chat-panel__reply-fields">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="WhatsApp number or phone"
                    className="chat-panel__reply-input"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="Email address"
                    className="chat-panel__reply-input"
                  />
                </div>
                <p className="chat-panel__reply-note">
                  With one of these you get an enquiry number you can use to follow it up
                  at any time.
                </p>
              </div>
              <div className="chat-panel__actions">
                <button type="button" className="chat-panel__send" onClick={send}>
{t('action.contact')}
                </button>
                <a className="chat-panel__link" href={enquiryHref}>
                  Enquiry form
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/*
        WHY THIS BUTTON HAS A LABEL AND THE OTHER ONE DOES NOT

        There are two chat entry points on a product page: this one, which
        asks a question about the product on screen, and the inquiry
        assistant, which answers general questions. They used to be two
        identical round icons in the same corner of the screen, so a visitor
        could not tell which was which until they had already clicked.

        The distinction is now made in three ways:

          - this one is a labelled pill, not a bare icon, so it says what it
            does before it is clicked
          - it sits ABOVE the assistant's floating button rather than beside
            it, so the two are never adjacent
          - its icon is a speech bubble with a product tag; the assistant's
            is a plain bubble

        A visitor who wants to know whether a product suits their animal
        should not have to guess which of two identical buttons to press.
      */}
      <button
        type="button"
        className="chat-entry chat-entry--labelled"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'Close the product enquiry' : 'Ask about this product'}
        title="Ask about this product"
        ref={buttonRef}
      >
        <Icon name="chat" size={16} />
        <span className="chat-entry__label">
          {subject ? `Ask about ${subject.name.split(' ').slice(0, 3).join(' ')}` : 'Ask a question'}
        </span>
      </button>
    </div>
  );
}

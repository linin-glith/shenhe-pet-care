'use client';

/**
 * The "reach a human" card.
 *
 * WHY IT EXISTS, AND WHY IT IS A COMPONENT
 * The portal is the part of the site a buyer uses when something has already
 * gone wrong: the password does not work, the account was not created, the
 * inquiry reference is not recognised. Every one of those pages used to end
 * with a line of grey text saying "message us on WhatsApp" — which is the
 * opposite of an instruction. A buyer who cannot get in and cannot find a
 * way to reach a person leaves.
 *
 * So the fallback gets a card, and the card gets the QR code: a phone number
 * a buyer has to type is a phone number a buyer will mistype, and the
 * contact card is the one thing that cannot be mistyped — they point a
 * camera at it.
 *
 * The card is a component because three pages need it (sign in, register,
 * track) and three copies of a hand-written fallback will drift apart within
 * a month, each with its own phone number typed slightly differently.
 */

import Img from '@/components/v2/Img';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';

export type WhatsAppHelpProps = {
  /** The heading. Different on each page: the trouble is different. */
  title: string;
  /** One or two sentences. What happens if they message us. */
  body: string;
  /** A short line under the buttons, e.g. "We reply in one business day". */
  note?: string;
  /** The message pre-filled in the WhatsApp chat. */
  prefilled?: string;
  /** Makes the card sit on a dark background. */
  tone?: 'light' | 'dark';
};

export default function WhatsAppHelp({
  title,
  body,
  note,
  prefilled,
  tone = 'light',
}: WhatsAppHelpProps) {
  const dark = tone === 'dark';
  const href = `https://wa.me/${siteConfig.brand.whatsapp}${
    prefilled ? `?text=${encodeURIComponent(prefilled)}` : ''
  }`;

  return (
    <div
      className={`overflow-hidden rounded-v2-lg border ${
        dark ? 'border-white/15 bg-white/5' : 'border-v2-ink-200 bg-white'
      }`}
    >
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center md:p-7">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.13em] ${
              dark ? 'text-white/55' : 'text-v2-ink-400'
            }`}
          >
            A person, not a form
          </p>
          <h3
            className={`mt-2 font-display text-xl font-semibold tracking-tight ${
              dark ? 'text-white' : 'text-v2-ink-900'
            }`}
          >
            {title}
          </h3>
          <p
            className={`mt-2 max-w-md text-sm leading-relaxed ${
              dark ? 'text-white/85' : 'text-v2-ink-600'
            }`}
          >
            {body}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-v2-md bg-v2-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
            >
              <Icon name="chat" size={16} />
              Open WhatsApp
            </a>
            <a
              href={`tel:${siteConfig.brand.whatsapp}`}
              className={`inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 ${
                dark ? 'text-white/85' : 'text-v2-ink-800'
              }`}
            >
              {siteConfig.brand.whatsappDisplay}
            </a>
          </div>

          {note && (
            <p
              className={`mt-4 text-xs leading-relaxed ${
                dark ? 'text-white/50' : 'text-v2-ink-500'
              }`}
            >
              {note}
            </p>
          )}
        </div>

        {/*
          The contact card as a QR code.

          The bitmap is our own contact card, cut out of the picture of it we
          were sent, so the code is the card the factory hands out rather than
          one we invented. The .webp beside it is written lossless: a QR code
          that has been through a lossy compressor stops scanning, and a
          broken QR is worse than no QR.
        */}
        <a
          href={siteConfig.brand.whatsappCard}
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex w-full shrink-0 items-center gap-3 rounded-v2-md border p-3 transition-colors sm:w-56 sm:flex-col sm:items-stretch ${
            dark
              ? 'border-white/15 bg-white/5 hover:border-white/30'
              : 'border-v2-ink-200 bg-v2-ink-050 hover:border-v2-ink-400'
          }`}
        >
          {/* One <picture>: the one <Img> builds, out of the manifest. */}
          <Img
            src={siteConfig.brand.whatsappCardImage}
            alt={`WhatsApp contact card for ${siteConfig.brand.whatsappCardName} — scan to save the contact`}
            width={140}
            height={140}
            loading="lazy"
            decoding="async"
            className="h-28 w-28 shrink-0 rounded-lg bg-white object-contain sm:h-40 sm:w-40"
          />
          <span className="min-w-0 sm:mt-3 sm:block sm:text-center">
            <span
              className={`block text-xs font-semibold ${
                dark ? 'text-white' : 'text-v2-ink-800'
              }`}
            >
              {siteConfig.brand.whatsappCardName}
            </span>
            <span
              className={`mt-0.5 block text-[11px] leading-snug ${
                dark ? 'text-white/55' : 'text-v2-ink-500'
              }`}
            >
              Scan to save our WhatsApp contact
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}

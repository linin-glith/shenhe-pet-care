/**
 * The contact links, built from the context.
 *
 * WHY THIS FILE HAS NO 'use client'
 * The header is a server component and it needs the WhatsApp link. A
 * function that lives in a file marked 'use client' cannot be called from
 * the server: the boundary only allows components and serialisable props to
 * cross it, not functions.
 *
 * So the link builders live here, in a plain module with no directive at
 * all, and the client component that also needs them imports them from
 * here. The builders are pure — they take a context and return a string —
 * so there is nothing in them that needs a browser.
 *
 * WHY THE CONTEXT IS A PLAIN OBJECT AND NOT REACT STATE
 * A React context value cannot cross the server/client boundary either, and
 * it would make these builders unusable from a server component. A plain
 * object with a type is passed by value, which is exactly what the boundary
 * allows.
 */

import { siteConfig } from '@/lib/shenhe.config';

/**
 * What the buyer is looking at, in terms a message can use.
 */
export type ContactContext = {
  /** The product the buyer is looking at, if any. */
  product?: string;
  /** Its SKU. */
  sku?: string;
  /** The page the buyer is on, in words. */
  page?: string;
  /** A quantity the buyer has mentioned. */
  quantity?: string;
  /** The market the goods would go to. */
  market?: string;
  /** An additional line the buyer typed. */
  note?: string;
  /** Where the buyer came from. */
  source?: string;
};

/**
 * The pre-filled WhatsApp message.
 *
 * It is written as the buyer would write it, in their own voice, because
 * the buyer is going to read it and edit it. A message that reads like the
 * factory's own marketing copy would have to be rewritten before it was
 * worth sending, and a message that has to be rewritten is often not sent.
 */
export function buildWhatsAppMessage(ctx: ContactContext = {}): string {
  const lines: string[] = [];

  if (ctx.product) {
    lines.push(
      `Hello, I would like a quotation for ${ctx.product}${ctx.sku ? ` (${ctx.sku})` : ''}.`,
    );
  } else if (ctx.page) {
    lines.push(`Hello, I am interested in ${ctx.page}.`);
  } else {
    lines.push('Hello, I would like a quotation for a pet care product.');
  }

  if (ctx.quantity) lines.push(`Quantity: ${ctx.quantity}`);
  if (ctx.market) lines.push(`Destination market: ${ctx.market}`);
  if (ctx.note) lines.push(ctx.note);

  lines.push('');
  lines.push(
    'Please send me the price, the minimum order quantity and the production lead time.',
  );

  return lines.join('\n');
}

/** The WhatsApp link, with the message pre-filled. */
export function whatsappLink(ctx: ContactContext = {}): string {
  const number = siteConfig.brand.whatsapp.replace(/[^\d]/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(ctx))}`;
}

/** The mail link, with the same information in the body. */
export function mailLink(ctx: ContactContext = {}): string {
  const subject = ctx.product
    ? `Quotation request — ${ctx.product}${ctx.sku ? ` (${ctx.sku})` : ''}`
    : 'Quotation request';

  const body: string[] = [];
  body.push('Hello,');
  body.push('');
  body.push(
    ctx.product
      ? `I would like a quotation for ${ctx.product}${ctx.sku ? ` (${ctx.sku})` : ''}.`
      : 'I would like a quotation for a pet care product.',
  );
  if (ctx.quantity) body.push(`Quantity: ${ctx.quantity}`);
  if (ctx.market) body.push(`Destination market: ${ctx.market}`);
  if (ctx.note) {
    body.push('');
    body.push(ctx.note);
  }
  body.push('');
  body.push(
    'Please send me the price, the minimum order quantity and the production lead time.',
  );
  body.push('');
  body.push('Company:');
  body.push('Your name:');
  body.push('Delivery country:');
  body.push('');
  body.push('Kind regards,');

  // The quotation request goes to the sales mailbox. It is the address a
  // buyer is told to write to about products, and it reaches the same
  // person as the brand mailbox.
  return `mailto:${siteConfig.brand.emailSales}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.join('\n'))}`;
}

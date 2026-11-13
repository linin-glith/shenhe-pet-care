/**
 * The chat entry's context — the "basic information" a back office needs.
 *
 * WHY THIS FILE EXISTS
 * The buyer opens a chat from a product page and asks "what does this cost,
 * can you do 5,000 units". Whoever answers needs to know WHICH product they
 * are talking about, at what size, at what minimum, without asking again.
 * So the entry point collects that and carries it with the message.
 *
 * THE SHAPE IS THE CONTRACT
 * `ChatContext` is deliberately the same shape an API would accept, so when
 * the back office is built the entry point does not have to change — only
 * where the payload goes. Today it is:
 *
 *   - written into the WhatsApp message the buyer sends (they see it),
 *   - written into the enquiry form's hand-off (the form already queues
 *     locally and hands off to WhatsApp),
 *   - appended to a local log, so the site itself can show what a visitor
 *     was looking at even before a server exists.
 *
 * WHY NOTHING IS SENT TO A SERVER
 * This is a static export: there is no endpoint to POST to. Pretending
 * otherwise would be worse than saying so — a chat that silently drops the
 * message is the same failure the old form had when it posted to an
 * /api/inquiries that did not exist.
 */

import { clientProducts, productsById } from '@/lib/client-products';
import { PRODUCT_ROUTE } from '@/lib/product-routing';

/** The product a conversation is about. */
export type ChatSubject = {
  /** The internal id (P012). A lookup key, never shown alone to a buyer. */
  sku: string;
  /** The catalogue name. */
  name: string;
  /** The catalogue specification ("500 mL / bottle"). */
  spec: string;
  /** Minimum order, in units. */
  moq: number;
  /** The product line. */
  line: string;
};

/** Everything a back office needs to make sense of one conversation. */
export type ChatContext = {
  /** The product, when the conversation is about one. */
  subject: ChatSubject | null;
  /** The page the conversation started from. */
  page: string;
  /** ISO timestamp. */
  at: string;
  /** What the buyer wrote. */
  message: string;
};

/** The last product the visitor looked at, so the entry follows them around. */
export const LAST_SUBJECT_KEY = 'shenhe:chat-subject:v1';
/** A local log of conversations, for the day there is a server to send them to. */
export const CHAT_LOG_KEY = 'shenhe:chat-log:v1';

/**
 * slug -> SKU, from the route map.
 *
 * The route map is the one place a product's URL is written down, so the
 * entry point reads the URL through it rather than guessing.
 */
const SLUG_TO_SKU: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_ROUTE).map(([sku, slug]) => [slug, sku])
);

/** The subject for a SKU id, from the client-safe catalogue. */
export function subjectFromSku(sku: string): ChatSubject | null {
  const p = productsById[sku];
  if (!p) return null;
  return { sku: p.id, name: p.name_en, spec: p.specification, moq: p.moq, line: p.line };
}

/**
 * The subject for the page the visitor is on.
 *
 * A product page is /products/<slug>.html (the export serves .html), and
 * the slug is the route map's key. Anything else — the catalogue, a line
 * page, the home page — is not about one product, and says so.
 */
export function subjectFromPath(pathname: string): ChatSubject | null {
  const m = /\/products\/([a-z0-9-]+?)(?:\.html)?\/?$/.exec(pathname);
  if (!m) return null;
  const sku = SLUG_TO_SKU[m[1]];
  return sku ? subjectFromSku(sku) : null;
}

/** Remember the product, so the entry still knows it on the next page. */
export function rememberSubject(subject: ChatSubject | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (subject) window.localStorage.setItem(LAST_SUBJECT_KEY, JSON.stringify(subject));
  } catch {
    /* Private mode, or storage full. The entry still works without it. */
  }
}

/** The last product the visitor looked at, if any. */
export function lastSubject(): ChatSubject | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_SUBJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatSubject;
    return parsed && parsed.sku ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The subject for right now: the product on this page, or the last one seen.
 */
export function currentSubject(pathname: string): ChatSubject | null {
  return subjectFromPath(pathname) ?? lastSubject();
}

/** Append a conversation to the local log. */
export function logChat(ctx: ChatContext): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = JSON.parse(window.localStorage.getItem(CHAT_LOG_KEY) ?? '[]') as ChatContext[];
    prev.push(ctx);
    // Keep the last 50. This is a convenience log, not a database.
    window.localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(prev.slice(-50)));
  } catch {
    /* Nothing to do: the message still goes to WhatsApp. */
  }
}

/**
 * The message the buyer sends.
 *
 * It shows them the context, so they can see what the factory will see, and
 * it carries the ids the back office needs.
 */
export function chatMessage(ctx: ChatContext): string {
  const lines = ['Hello Shenhe Zhongke,'];
  if (ctx.subject) {
    lines.push(
      '',
      `I am asking about: ${ctx.subject.name} — ${ctx.subject.spec}`,
      `SKU: ${ctx.subject.sku} · MOQ: ${ctx.subject.moq.toLocaleString()} · Line: ${ctx.subject.line}`,
    );
  } else {
    lines.push('', 'I am asking about your pet care products.');
  }
  if (ctx.message.trim()) {
    lines.push('', ctx.message.trim());
  }
  lines.push('', `Page: ${ctx.page}`);
  return lines.join('\n');
}

/** The first draft of the buyer's message, with the context already in it. */
export function draftMessage(subject: ChatSubject | null): string {
  if (!subject) return '';
  return `I would like a quote for ${subject.name} — ${subject.spec} (MOQ ${subject.moq.toLocaleString()}).`;
}

/** The catalogue, for a picker that needs every product. */
export const catalogue = clientProducts;

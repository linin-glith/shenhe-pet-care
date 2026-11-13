/**
 * Legacy HTML → v2 data.
 *
 * WHY THIS EXISTS
 * The legacy extractor stored section bodies as opaque HTML strings. A
 * renderer cannot lay out a string: it can only paste it. That is why the
 * migrated pages ended up with full-width stacked cards, duplicated headings
 * and a blank section where a stat grid used to be — the markup was there,
 * the STRUCTURE was not.
 *
 * These helpers recover the structure from the markup that already exists,
 * without re-typing the content and without touching the extracted JSON.
 * Everything is best-effort: a pattern that does not match returns null and
 * the caller falls back to the raw-markup path, so a new legacy shape
 * degrades to "old styling" rather than to "content lost".
 *
 * The HTML here is machine-generated and regular, which is what makes a
 * scanner viable. The element extractor balances tags rather than using a
 * non-greedy regex, because the cards contain nested <div>s and a lazy match
 * would cut them in half.
 */

import type { IconName } from '@/components/v2/Icon';
import type { FeatureGridBlock, Metric, TimelineBlock } from '@/lib/v2/block-types';

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&middot;': '·',
  '&rarr;': '→',
  '&larr;': '←',
  '&mdash;': '—',
  '&ndash;': '–',
  '&times;': '×',
  '&ge;': '≥',
  '&le;': '≤',
  '&sup2;': '²',
  '&sup3;': '³',
};

/** Tags whose content is never part of the readable text. */
const VOIDISH = /<(script|style|svg)[\s\S]*?<\/\1>/gi;

export function textOf(html: string): string {
  return html
    .replace(VOIDISH, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Element extraction                                                  */
/* ------------------------------------------------------------------ */

/**
 * Inner HTML of every element whose class list contains `cls`.
 *
 * Walks the tag stream with a depth counter instead of a lazy regex: a card
 * is <div class="pp-feature-card"><div>..</div><div>..</div></div>, and a
 * lazy match would stop at the first inner </div>.
 *
 * `tag` matters — the legacy markup is not consistent about it. A card is a
 * div, but an eyebrow, a pill and a badge are spans, and a parser that only
 * looks for divs silently finds nothing.
 */
export function extractElements(html: string, cls: string, tag = 'div'): string[] {
  const out: string[] = [];
  const open = new RegExp(`<${tag}\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = open.exec(html))) {
    const start = m.index + m[0].length;
    let depth = 1;
    const token = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
    token.lastIndex = start;
    let t: RegExpExecArray | null;
    let end = -1;
    while ((t = token.exec(html))) {
      if (t[0].startsWith('</')) {
        depth--;
        if (depth === 0) {
          end = t.index;
          break;
        }
      } else {
        depth++;
      }
    }
    out.push(end === -1 ? html.slice(start) : html.slice(start, end));
    open.lastIndex = end === -1 ? html.length : end;
  }
  return out;
}

/** Inner HTML of the first <tag> in the string. */
export function firstElement(html: string, tag: string): string | undefined {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(html);
  return m ? m[1] : undefined;
}

/** Text of the first <tag>, or undefined. */
export function firstText(html: string, tag: string): string | undefined {
  const inner = firstElement(html, tag);
  if (inner === undefined) return undefined;
  const t = textOf(inner);
  return t || undefined;
}

/** Text of the first element carrying `cls`. */
export function classText(html: string, cls: string, tag = 'div'): string | undefined {
  const inner = extractElements(html, cls, tag)[0];
  if (inner === undefined) return undefined;
  const t = textOf(inner);
  return t || undefined;
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

/**
 * Legacy sprite id → v2 icon name.
 *
 * The legacy markup pointed at a sprite file; the v2 set draws its icons
 * inline. The two share a vocabulary for most marks, so a converted card
 * keeps its icon instead of losing it to a generic bullet.
 */
const SPRITE_ICON: Record<string, IconName> = {
  'icon-clock': 'clock',
  'icon-eye': 'eye',
  'icon-heart': 'heart',
  'icon-target': 'target',
  'icon-check-circle': 'check',
  'icon-check': 'check',
  'icon-shield': 'shield',
  'icon-zap': 'sparkle',
  'icon-sparkles': 'sparkle',
  'icon-beaker': 'flask',
  'icon-building': 'factory',
  'icon-truck': 'truck',
  'icon-package': 'jar',
  'icon-cube': 'jar',
  'icon-briefcase': 'jar',
  'icon-leaf': 'leaf',
  // icon-globe / icon-file / icon-clipboard have no counterpart in the v2 set
  // and are deliberately NOT mapped: `P[name]` would be undefined and the
  // icon would throw at render. A card without an icon is better than a
  // broken one.
};

/**
 * Inline legacy SVG path → v2 icon name.
 *
 * Some legacy cards drew the mark inline instead of pointing at the sprite.
 * The path data is identical to the sprite's, so the shape can be matched
 * directly and the card keeps its icon.
 */
const PATH_ICON: { d: string; icon: IconName }[] = [
  { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', icon: 'eye' },
  { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67', icon: 'heart' },
  { d: 'M20 7L9 18l-5-5', icon: 'check' },
  { d: 'M12 2.5l2.1 6.1 6.1 2.1-6.1 2.1L12 18.9', icon: 'sparkle' },
  { d: 'M12 2L2 7l10 5 10-5-10-5z', icon: 'jar' },
];

export function iconOf(html: string): IconName | undefined {
  const sprite = /sprite\.svg#(icon-[a-z-]+)/i.exec(html);
  if (sprite) return SPRITE_ICON[sprite[1].toLowerCase()];

  const path = /<path[^>]*\sd="([^"]+)"/i.exec(html);
  if (path) {
    for (const cand of PATH_ICON) {
      if (path[1].startsWith(cand.d)) return cand.icon;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Headings                                                            */
/* ------------------------------------------------------------------ */

/**
 * Close the gaps in a legacy heading sequence.
 *
 * The legacy markup was written for its own page: a section was an h2 and a
 * clause inside it an h4, because h3 was never used there. Rendered inside a
 * v2 page that reads as an outline that skips a level (h2 -> h4). And on a
 * product page whose hero is an h1, the card titles came out as h3, so the
 * outline went h1 -> h3 and then back up to h2.
 *
 * This only ever lowers a level that skips. It never promotes a heading, so
 * the visual weight of the copy stays as authored.
 *
 * `startLevel` is the level of the heading that precedes this markup. A block
 * whose title is rendered by the v2 block renderer (an <h2>) starts at 2 even
 * when the legacy markup's own section heading was removed as a duplicate —
 * without this the first heading in the block kept its own level and the
 * page read h2 -> h4.
 */
export function normalizeHeadingLevels(html: string, startLevel = 0): string {
  let prev = startLevel;
  return html.replace(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (whole, lvl, attrs, inner) => {
    let n = Number(lvl);
    if (n === 1) {
      prev = 1;
      return whole;
    }
    if (prev === 0) {
      // The first heading of the block keeps its own level.
      prev = n;
      return whole;
    }
    if (prev === 1) {
      // Right after the page title, nothing may skip to h3.
      n = Math.min(n, 2);
    } else if (n > prev + 1) {
      n = prev + 1;
    }
    prev = n;
    return `<h${n}${attrs}>${inner}</h${n}>`;
  });
}

/** The level of the LAST heading in a fragment, or 0 when it has none. */
export function lastHeadingLevel(html: string): number {
  let level = 0;
  for (const m of html.matchAll(/<h([1-6])\b/gi)) {
    level = Number(m[1]);
  }
  return level;
}

/* ------------------------------------------------------------------ */
/* Feature grids                                                       */
/* ------------------------------------------------------------------ */

/**
 * A legacy `pp-grid` of feature cards → a v2 featureGrid.
 *
 * Returns null when the markup is not that shape, which is the signal for the
 * caller to keep the raw markup.
 *
 * TWO REFUSALS, both of them load-bearing:
 *
 *  1. A block that carries its own `<h1>` is a product hero, not a grid.
 *     Converting it to a featureGrid drops the h1 — and with it the page's
 *     only `<h1>`. The product page lost its H1 this way.
 *
 *  2. A card whose body is a list or a table cannot be represented by a v2
 *     feature card (title + one paragraph). Converting it silently deleted
 *     the copy: the four IgG bullet points and the six-row ingredients table
 *     on the product page simply vanished from the rendered page. The
 *     converter promises "no content is dropped" — that promise has to hold
 *     here too, so a card with unrepresentable body refuses the conversion
 *     and the caller keeps the raw markup.
 */
export function parseFeatureGrid(html: string): FeatureGridBlock | null {
  // (1) A hero block is not a grid.
  if (/<h1[\s>]/i.test(html)) return null;

  // The card class varies with the section: the "feature card" grid, the
  // "card" grid used for the certification tiles, and the accent variant.
  const cardClasses = ['pp-feature-card', 'pp-card'];
  let cards: string[] = [];
  for (const cls of cardClasses) {
    cards = extractElements(html, cls);
    if (cards.length) break;
  }
  if (cards.length < 2) return null;

  // A card must actually look like a card: it carries a title.
  const items = cards
    .map((card) => {
      const title = firstText(card, 'h3') ?? firstText(card, 'h4');
      if (!title) return null;
      const body = firstText(card, 'p');
      const pill = classText(card, 'pp-pill', 'span') ?? classText(card, 'pp-badge', 'span');
      const no =
        classText(card, 'pp-feature-card__no') ??
        classText(card, 'pp-feature-card__num') ??
        classText(card, 'pp-card__num');
      const meta = classText(card, 'pp-doc-meta') ?? classText(card, 'pp-feature-card__meta');
      const icon = iconOf(card);

      // (2) Everything the card says that a v2 feature card cannot hold.
      const residue = textOf(card)
        .replace(title, '')
        .replace(body ?? '', '')
        .replace(pill ?? '', '')
        .replace(no ?? '', '')
        .replace(meta ?? '', '')
        .trim();
      if (residue) return null;

      return { ...(pill ? { pill } : {}), ...(no ? { no } : {}), title, ...(body ? { body } : {}), ...(meta ? { meta } : {}), ...(icon ? { icon } : {}) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length < 2) return null;

  const eyebrow = classText(html, 'pp-eyebrow', 'span');
  const title = firstText(html, 'h2');
  const lead = classText(html, 'pp-lead-narrow') ?? classText(html, 'pp-lead');

  // The closing line under the grid, with its link.
  const noteMatch = /<p[^>]*>([\s\S]*?)<\/p>\s*(?:<\/div>\s*)?<\/div>/.exec(html);
  let note: string | undefined;
  let noteCta: { label: string; href: string } | undefined;
  const anchor = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(html);
  if (anchor) {
    const label = textOf(anchor[2]);
    if (label) {
      noteCta = { label, href: anchor[1] };
      // Everything before the link in that paragraph is the note.
      const before = html.slice(0, html.indexOf(anchor[0]));
      const lastP = before.lastIndexOf('<p');
      if (lastP >= 0) {
        const t = textOf(before.slice(lastP));
        if (t) note = t;
      }
    }
  }
  void noteMatch;

  const cols = cards.length % 3 === 0 ? 3 : cards.length % 4 === 0 ? 4 : 2;

  return {
    kind: 'featureGrid',
    ...(eyebrow ? { eyebrow } : {}),
    ...(title ? { title } : {}),
    ...(lead ? { lead } : {}),
    cols: cols as 2 | 3 | 4,
    items,
    ...(note ? { note } : {}),
    ...(noteCta ? { noteCta } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Timelines                                                           */
/* ------------------------------------------------------------------ */

/** A legacy `pp-timeline` → a v2 timeline, with the framing column. */
export function parseTimeline(html: string): TimelineBlock | null {
  const items = extractElements(html, 'pp-timeline-item');
  if (items.length < 2) return null;

  const parsed = items
    .map((it) => {
      const year = classText(it, 'pp-timeline-year');
      const title = classText(it, 'pp-timeline-title');
      if (!year || !title) return null;
      const desc = classText(it, 'pp-timeline-desc');
      return { year, title, ...(desc ? { desc } : {}) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (parsed.length < 2) return null;

  const eyebrow = classText(html, 'pp-eyebrow', 'span');
  const title = firstText(html, 'h2');

  // The framing column: the paragraphs that are not inside a timeline item.
  const outside = html.replace(/<div class="pp-timeline">[\s\S]*?<\/div>\s*<\/div>/, '');
  const intro = Array.from(outside.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g))
    .map((m) => textOf(m[1]))
    .filter(Boolean);
  const pills = extractElements(outside, 'pp-pill', 'span').map((p) => textOf(p)).filter(Boolean);

  return {
    kind: 'timeline',
    ...(eyebrow ? { eyebrow } : {}),
    ...(title ? { title } : {}),
    ...(intro.length ? { intro } : {}),
    ...(pills.length ? { pills } : {}),
    items: parsed,
  };
}

/* ------------------------------------------------------------------ */
/* Stat cards                                                          */
/* ------------------------------------------------------------------ */

/**
 * A legacy stat card (`pp-stat-big` + `pp-small-text`) → a metric.
 *
 * The certification and export sections are built from these. They carry no
 * title or description fields at all — the two numbers live in the HTML —
 * so a converter that reads only the structured fields renders them blank.
 */
export function parseStatCard(cardHtml: string): Metric | undefined {
  const value = classText(cardHtml, 'pp-stat-big');
  const label = classText(cardHtml, 'pp-small-text') ?? classText(cardHtml, 'pp-stat__lbl');
  if (!value || !label) return undefined;
  return { value, label };
}

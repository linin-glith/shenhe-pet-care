import type { Block, Card, HeroContent, TableData, TimelineItem, PhotoSlot } from '@/lib/legacy-types';
import type {
  Cta,
  FeatureGridBlock,
  MediaRef,
  Metric,
  ProofItem,
  V2Block,
} from '@/lib/v2/block-types';
import { siteConfig } from '@/lib/shenhe.config';
import {
  classText,
  extractElements,
  lastHeadingLevel,
  normalizeHeadingLevels,
  parseFeatureGrid,
  parseStatCard,
  parseTimeline,
  textOf,
} from '@/lib/v2/legacy-html';

/**
 * Legacy -> v2 block converter.
 *
 * WHY A CONVERTER
 * Twenty-seven pages still render raw migrated HTML through `RichText`. Hand
 * rewriting each one is twenty-seven chances to drift. The legacy extractor
 * already classified every section into a block type — so the presentation
 * upgrade is a mapping problem, not a re-authoring problem.
 *
 * WHAT IT GUARANTEES
 *  - No content is dropped. Anything with no v2 equivalent degrades to a
 *    `rich` block carrying the original markup through the vetted prose
 *    stylesheet. A page can look upgraded and still be complete.
 *  - No price leakage. `priceTableFlagged` keeps its quote-only panel.
 *  - SEO is untouched: metadata and JSON-LD are handled by the page route,
 *    not by this mapping.
 *
 * WHAT IT DOES NOT DO
 * It does not invent layout. A page converted this way inherits the legacy
 * section order. Re-sequencing remains a per-page editorial decision.
 */

const asImg = (src?: string | null, alt?: string | null): MediaRef | undefined =>
  src ? { src, alt: alt ?? '', fit: src.endsWith('.svg') ? 'contain' : 'cover' } : undefined;

const metricsFrom = (raw: unknown): Metric[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === 'string') {
        // legacy stat strings look like "94.2% — Lab tested"
        const [head, ...rest] = s.split(/\s+[—–-]\s+/);
        const num = head?.trim();
        if (!num) return null;
        return { value: num, label: rest.join(' ').trim() || num } satisfies Metric;
      }
      return null;
    })
    .filter((m): m is Metric => m !== null);
};

/* ------------------------------------------------------------------ */
/* Legacy card shapes                                                  */
/* ------------------------------------------------------------------ */

/**
 * The extractor flattened a legacy feature card into one string.
 *
 * A card's `num` field came out as "1 <title> <body…> <TAG>" — the number,
 * the heading, the paragraph and the badge, run together. The heading and
 * the badge survived as their own fields, so the body is what remains once
 * those are peeled off.
 */
function splitFlattenedCard(card: Card): { no?: string; body?: string } {
  const flat = (card.num ?? '').trim();
  if (!flat) return {};
  let rest = flat;

  const num = /^(\d+)\s+/.exec(rest);
  if (num) rest = rest.slice(num[0].length);

  if (card.title && rest.startsWith(card.title)) {
    rest = rest.slice(card.title.length).trim();
  }
  if (card.tag && rest.endsWith(card.tag)) {
    rest = rest.slice(0, rest.length - card.tag.length).trim();
  }
  return {
    ...(num ? { no: num[1] } : {}),
    ...(rest ? { body: rest } : {}),
  };
}

/**
 * The legacy extractor split one card into two entries: one carrying the
 * text, one carrying only the number. Merge them back into one item.
 */
function mergeFeatureCards(cards: Card[]): FeatureGridBlock['items'] {
  const items: FeatureGridBlock['items'] = [];
  for (const card of cards) {
    const orphanNo = card.html ? classText(card.html, 'pp-feature-card__num') : undefined;
    if (card.title) {
      const { no, body } = splitFlattenedCard(card);
      items.push({
        title: card.title,
        ...(no ? { no } : {}),
        ...(body ? { body } : {}),
        ...(card.tag ? { meta: card.tag } : {}),
      });
    } else if (orphanNo && items.length) {
      const prev = items[items.length - 1];
      if (!prev.no) items[items.length - 1] = { ...prev, no: orphanNo };
    }
  }
  return items;
}

/* ------------------------------------------------------------------ */
/* Legacy HTML tidy-up                                                 */
/* ------------------------------------------------------------------ */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Column headers that mean "this table is a price list".
 *
 * Matched against the table's own header row, case-insensitively. A table that
 * carries any of these is a pricing table and is replaced by the quote-only
 * callout — see the `table` case below.
 */
const PRICE_HEAD = /\b(unit\s*price|price|discount|tier|per\s*unit|fob|exw|rmb|usd|cny)\b/i;

/** Remove the heading that repeats the block title. */
function dropDuplicateHeading(html: string, title?: string): string {
  if (!title) return html;
  return html.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (whole, inner) =>
    textOf(inner) === title ? '' : whole,
  );
}

/**
 * Strip the legacy section chrome.
 *
 * The legacy markup wrapped every section in `<section class="pp-section">`
 * with its own `<div class="pp-container">`. The v2 renderer already supplies
 * a section and a container, so keeping them nests a page inside a page:
 * double padding, and a background band that fights the v2 rhythm.
 */
function stripLegacyChrome(html: string): string {
  return html
    .replace(/^\s*<section\b[^>]*>/, '')
    .replace(/<\/section>\s*$/, '')
    .replace(/<div class="pp-container[^"]*">/, '')
    .replace(/<\/div>\s*$/, '');
}

/**
 * Remove the inline event handlers from the legacy markup.
 *
 * The old site rendered a broken image as an emoji by attaching an onerror
 * attribute that rewrote the element's innerHTML:
 *
 *   onerror="this.parentElement.innerHTML='<div style=&quot;...&quot;>🐾</div>'"
 *
 * The nested single quotes terminate the attribute early, so the parser keeps
 * the rest of the string as text and the page prints a literal `🐾 '">` where
 * the image should be. Two product pages carried it.
 *
 * The handler is also unnecessary here: the images on these pages either
 * load or do not, and a missing image is better shown as a missing image than
 * as a paw emoji pretending to be one. Removing the attribute fixes the
 * markup and the visual at once.
 */
function stripEventHandlers(html: string): string {
  return html.replace(/\s+on(error|load|click|mouseover)\s*=\s*"[^"]*"/gi, '');
}

/**
 * Pull the eyebrow and the lead out of the markup.
 *
 * The v2 block renders eyebrow → title → lead, in that order. The legacy
 * markup carries the same three things inside the section, so leaving them
 * in the HTML puts the eyebrow BELOW the title and the lead after the copy.
 */
function liftHeadingBits(html: string): {
  html: string;
  eyebrow?: string;
  lead?: string;
} {
  let out = html;
  let eyebrow: string | undefined;
  let lead: string | undefined;

  const eyebrowEls = extractElements(out, 'pp-eyebrow', 'span');
  if (eyebrowEls.length) {
    eyebrow = textOf(eyebrowEls[0]) || undefined;
    out = out.replace(eyebrowEls[0], '');
  }

  for (const cls of ['pp-lead-narrow', 'pp-lead']) {
    const el = extractElements(out, cls)[0];
    if (!el) continue;
    const t = textOf(el);
    if (!t) continue;
    lead = t;
    out = out.replace(el, '');
    break;
  }

  return { html: out, ...(eyebrow ? { eyebrow } : {}), ...(lead ? { lead } : {}) };
}

/* ------------------------------------------------------------------ */

export function legacyToV2(blocks: Block[], category?: string): V2Block[] {
  const out: V2Block[] = [];

  /**
   * The heading level in effect at the end of the last block.
   *
   * The heading outline is a PAGE property, not a block property: a block
   * that follows a page title must not start at h4, and a block that follows
   * a hero (h1) must not skip to h3. Tracking it across the blocks is what
   * makes the two agree.
   */
  let lastLevel = 0;

  for (const b of blocks) {
    switch (b.type) {
      /* ---------------- credibility ---------------- */
      case 'hero':
      case 'heroSimple': {
        const c = b.content as HeroContent & { html?: string };
        if (c?.html) {
          out.push({ kind: 'rich', html: c.html });
          const l = lastHeadingLevel(c.html);
          if (l) lastLevel = l;
          break;
        }
        if (!c) break;
        out.push({
          kind: 'hero',
          eyebrow: siteConfig.brand.name,
          title: c.title ?? siteConfig.brand.name,
          accent: c.titleAccent ?? undefined,
          lead: c.lead ?? undefined,
          // The answer and the limit of the answer. They live on the
          // legacy hero and are copied across here; without this line
          // the conversion silently drops them, because the converter
          // names every field it copies and this one was missing.
          answer: c.answer ?? undefined,
          boundary: c.boundary ?? undefined,
          primaryCta: c.actions?.[0]
            ? { label: c.actions[0].label, href: c.actions[0].href }
            : { label: 'Request a quotation', href: '/contact.html' },
          secondaryCta: c.actions?.[1]
            ? { label: c.actions[1].label, href: c.actions[1].href }
            : undefined,
          image: asImg(c.image?.src, c.image?.alt),
          metrics: (c.stats ?? []).slice(0, 4).map((s) => ({
            value: formatRing(s as { value?: string | null; unit?: string | null }),
            label: s.label ?? '',
          })),
        });
        // A v2 hero renders the page title as an <h1>.
        lastLevel = 1;
        break;
      }

      /* ---------------- data ---------------- */
      case 'table': {
        const t = b.content as TableData;
        /**
         * A pricing table never reaches the page.
         *
         * B2B pricing policy (siteConfig.pricing): unit price, MOQ and tier
         * price are quote-only. The legacy pages carried a `pp-price-table`
         * with real figures; the extractor filed it as a plain `table`, and
         * the generic spec-table mapping turned it into nonsense on screen —
         * "Unit Price (USD): Small Run 2,000–2,999 units" — a price list
         * that published no price and read like a mistake. It is replaced by
         * the same quote-only callout the flagged-price block uses.
         */
        const head = t?.head ?? [];
        const isPricing = head.some((h) => PRICE_HEAD.test(String(h ?? '')));
        if (isPricing) {
          out.push({
            kind: 'callout',
            title: siteConfig.pricing.label,
            body: siteConfig.pricing.policy,
          });
          break;
        }
        if (t?.head?.length) {
          const specs = t.head.map((k, i) => ({ key: k, val: t.rows?.[i]?.cells?.[0] ?? '' }));
          if (specs.every((s) => s.val)) out.push({ kind: 'specTable', specs });
        }
        break;
      }

      case 'statGrid': {
        const m = metricsFrom((b.content as { items?: unknown })?.items);
        if (m.length) out.push({ kind: 'metricBand', metrics: m });
        break;
      }

      case 'priceTableFlagged':
        // B2B quote-only policy — never render legacy tier numbers.
        out.push({
          kind: 'callout',
          title: 'Pricing',
          body: siteConfig.pricing.policy,
        });
        break;

      /* ---------------- sequence ---------------- */
      case 'timeline': {
        const items = (b.content as TimelineItem[]) ?? [];
        if (items.length) {
          out.push({
            kind: 'process',
            steps: items.map((t) => ({ no: t.year, title: t.title, desc: t.desc })),
          });
        }
        break;
      }

      case 'process': {
        const html = (b.content as { html?: string })?.html;
        if (html) out.push({ kind: 'rich', html });
        break;
      }

      /* ---------------- galleries & grids ---------------- */
      case 'photoSlots': {
        const slots = (b.content as PhotoSlot[]) ?? [];
        const items = slots
          .filter((s) => s.img)
          .map((s) => ({ label: s.label, caption: s.caption, src: s.img as string }));
        if (items.length) out.push({ kind: 'gallery', items });
        break;
      }

      case 'cardGrid': {
        const c = b.content as { cards?: Card[]; cols?: number };
        const cards = c?.cards ?? [];
        const products = cards.filter((x) => x.kind === 'productCard');
        if (products.length) {
          out.push({
            kind: 'productGrid',
            items: products.map((x) => ({
              slug: x.no ?? x.title ?? '',
              name: x.title ?? '',
              line: x.category ?? '',
              size: x.size,
              blurb: x.desc,
              image: asImg(x.image?.src, x.image?.alt ?? x.title),
              href: x.href ?? '#',
            })),
          });
        }

        const rest = cards.filter((x) => x.kind !== 'productCard');

        // Stat tiles: the figure and its label live ONLY in the HTML. Reading
        // the structured fields produced four empty cells — the blank band.
        const stats = rest
          .map((x) => (x.html ? parseStatCard(x.html) : undefined))
          .filter((m): m is Metric => m !== undefined);
        if (stats.length && stats.length === rest.length) {
          out.push({ kind: 'metricBand', metrics: stats });
          break;
        }

        // Feature cards: one card split across two entries, or a card with a
        // number in its own entry.
        const featureItems = mergeFeatureCards(rest);
        if (featureItems.length >= 2) {
          out.push({
            kind: 'featureGrid',
            items: featureItems,
            cols: featureItems.length % 3 === 0 ? 3 : featureItems.length % 4 === 0 ? 4 : 2,
          });
          break;
        }

        if (rest.length) {
          const items = rest.map((x) => ({
            label: x.title ?? '',
            detail: [x.desc, x.meta].filter(Boolean).join(' '),
            href: x.href,
          }));
          /**
           * A card with neither a title nor a body has nothing to put in a
           * proof tile. Rather than draw an empty box, keep the original
           * markup — the card's own paragraph is real content (the document
           * owner line on the trade page).
           */
          if (items.every((i) => !i.label && !i.detail)) {
            const html = rest.map((x) => x.html ?? '').filter(Boolean).join('\n');
            if (html) out.push({ kind: 'rich', html, width: 'narrow' });
          } else {
            out.push({ kind: 'proofGrid', items });
          }
        }
        break;
      }

      /* ---------------- conversion ---------------- */
      case 'cta': {
        const c = (b.content ?? {}) as {
          eyebrow?: string;
          title?: string;
          text?: string;
          html?: string;
          actions?: { label: string; href: string }[];
        };
        if (!c.html) {
          out.push({
            kind: 'ctaBand',
            eyebrow: c.eyebrow,
            title: c.title,
            text: c.text,
            primaryCta: c.actions?.[0] as Cta | undefined,
            secondaryCta: c.actions?.[1] as Cta | undefined,
          });
        } else {
          out.push({ kind: 'rich', html: c.html });
        }
        break;
      }

      /* ---------------- prose fallback ---------------- */
      case 'wizard':
      case 'richtext':
      case 'prose':
      default: {
        const c = (b.content ?? {}) as { title?: string; sub?: string; html?: string; raw?: string };
        const html = c.html ?? c.raw;
        if (!html) break;

        // A dated sequence is not prose: give it the timeline treatment.
        const timeline = parseTimeline(html);
        if (timeline) {
          out.push({ ...timeline, title: timeline.title ?? c.title });
          break;
        }

        // A grid of titled cards is not prose either.
        const grid = parseFeatureGrid(html);
        if (grid) {
          out.push({ ...grid, title: grid.title ?? c.title });
          break;
        }

        // Otherwise it really is prose. Give it the v2 heading rhythm and
        // take the legacy chrome with it.
        const lifted = liftHeadingBits(html);
        const body = normalizeHeadingLevels(
          dropDuplicateHeading(stripLegacyChrome(stripEventHandlers(lifted.html)), c.title),
          // The v2 block renders `c.title` as an <h2> above this markup, so the
          // first heading inside the block must not be an h4. A block with no
          // title continues from whatever level the page is at.
          c.title ? 2 : lastLevel,
        );
        const bodyLevel = lastHeadingLevel(body);
        if (bodyLevel) lastLevel = bodyLevel;
        else if (c.title) lastLevel = 2;
        out.push({
          kind: 'rich',
          title: c.title,
          ...(lifted.eyebrow ? { eyebrow: lifted.eyebrow } : {}),
          ...(lifted.lead ? { lead: lifted.lead } : {}),
          html: body,
          width: String(b.classes ?? '').includes('container--narrow') ? 'narrow' : 'normal',
        });
        break;
      }
    }
  }

  // A page must end with a way to act. If the legacy content never provided
  // one, the v2 renderer would leave the buyer with no next step.
  const hasCta = out.some((b) => b.kind === 'ctaBand' || b.kind === 'rfq');
  if (out.length > 0 && !hasCta) {
    out.push({
      kind: 'ctaBand',
      eyebrow: 'Next step',
      title: 'Tell us what you need made.',
      text: 'Three fields, no account, no obligation. If it is not something we can make, we say so on the first call rather than after three rounds.',
      primaryCta: { label: 'Request a quotation', href: '/contact.html' },
      secondaryCta: {
        label: 'WhatsApp',
        href: `https://wa.me/${siteConfig.brand.whatsapp}`,
        external: true,
        variant: 'ghost',
      },
    });
  }

  /*
   * The category prose layer.
   *
   * A product-line page that only lists its SKUs is a thin page: 217–307
   * words, no FAQ, and nothing a crawler can rank on beyond the cards it
   * already links from the catalogue. The block is inserted here rather than
   * in each route file because the category pages are generated from the
   * extracted legacy content, and a hand edit in a route file would be
   * overwritten by the next regeneration.
   *
   * Placement: AFTER the hero and BEFORE the product grid. A visitor arrives
   * wanting to understand the line, reads what is in it and how to choose,
   * and only then looks at the individual SKUs. Putting it at the end would
   * put the explanation after the answer.
   */
  if (category) {
    const heroIdx = out.findIndex((b) => b.kind === 'hero');
    const at = heroIdx >= 0 ? heroIdx + 1 : 0;
    out.splice(at, 0, { kind: 'categoryDepth', category });
  }

  return out;
}

function formatRing(s: { value?: string | null; unit?: string | null }): string {
  const v = Number(s?.value);
  if (!Number.isFinite(v)) return String(s?.value ?? '');
  const label = v >= 99.99 ? `>${v}` : v;
  return `${label}${s?.unit ?? '%'}`;
}

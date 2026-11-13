'use client';

import { useMemo, useState } from 'react';
import Img from '@/components/v2/Img';
import IMAGE_VARIANTS from '@/content/v2/image-variants.json';

type VariantEntry = { width: number; height: number; variants: { w: number; src: string }[] };
import { clientProducts as products } from '@/lib/client-products';
import { getLineLabel } from '@/lib/product-routing';
import type { ClientProduct } from '@/lib/client-products';
import { PACKSHOT as PACKSHOT_REGISTRY, ILLUSTRATION } from '@/lib/packshots';
import { siteConfig } from '@/lib/shenhe.config';

/**
 * SKU Composer — "build the line you actually want to order".
 *
 * WHY THIS EXISTS
 * The legacy catalogue is a flat grid of 20 SKUs. For an OEM/ODM buyer that
 * is the wrong abstraction: nobody orders one SKU, they order a RANGE and
 * they ask "what does it look like together, and what does it commit me to?"
 *
 * This component answers that directly. Select SKUs, watch them assemble into
 * a pallet view, and see MOQ / lead time / carton count update live. It is
 * the one interaction on the site that cannot be replaced by a PDF.
 *
 * PRODUCT VISUALS COME FROM THE PACKSHOT REGISTRY
 * Every SKU in the catalogue has a photograph now (lib/packshots.ts), so the
 * pallet shows the product the buyer is about to order rather than a drawing
 * of one. The drawn package below is only the fallback for a catalogue entry
 * that has no photograph yet.
 *
 * PRICING POLICY: this component never renders a price. MOQ and lead time are
 * qualification signals, not price. See the policy note in content/v2/home.ts.
 */

/* ------------------------------------------------------------------ */
/* Vessel geometry — derived from the spec string                       */
/* ------------------------------------------------------------------ */

type VesselKind = 'sachet' | 'tub' | 'jug' | 'bottle' | 'trigger' | 'atomiser';

function classify(p: ClientProduct): VesselKind {
  const s = `${p.specification} ${p.name_en}`.toLowerCase();
  if (s.includes('sachet')) return 'sachet';
  if (s.includes('kg')) return 'jug';
  if (/^\s*\d+\s*g\b/.test(p.specification.toLowerCase())) return 'tub';
  if (s.includes('gun') || s.includes('kit')) return 'trigger';
  if (/10\s*ml|15\s*ml/.test(p.specification.toLowerCase())) return 'atomiser';
  return 'bottle';
}

/** Every SKU is rendered at ONE height on the pallet. */
/*
 * The photos used to be scaled by volume (a 1.5 kg jug drew taller than a
 * 10 g sachet), which read as a size ranking the buyer never asked for and
 * made the lineup look like unrelated products. The size is already on the
 * label under each slot; the picture just needs to be the same picture.
 */
const SHOT_HEIGHT = 116;

/**
 * HOW WIDE THE SLOT IS.
 *
 * The packshot stands in a slot of a fixed height and an automatic
 * width, so the width the browser has to cover is that height times the
 * shape of the picture. Without it the browser takes the biggest file it
 * can find - which is how a 64 KB packshot was downloaded for a 47 px
 * slot.
 */
function shotSizes(src: string): string | undefined {
  const entry = (IMAGE_VARIANTS as Record<string, VariantEntry>)[src];
  if (!entry || !entry.height) return undefined;
  const width = Math.round((SHOT_HEIGHT * entry.width) / entry.height);
  return width + 'px';
}

/**
 * One tint per product LINE.
 *
 * Keyed by `line` — the grouping a buyer thinks in — so the fallback drawing
 * is coloured like the section it sits in. (It used to be keyed by `category`,
 * the three-way compliance grouping, which put an ear-care product in the
 * disinfection colour.)
 */
const LINE_COLOR: Record<string, string> = {
  deodorizing_disinfection: '#0d9488',
  grooming_care: '#3a7ca8',
  outdoor_protection: '#a8763e',
  pet_nutrition: '#7c5ca8',
};

/**
 * Real packshots recovered from the product PPT.
 *
 * When an entry exists we render the actual product; otherwise the SVG vessel
 * below stands in. That fallback is not decoration — it is what lets the page
 * stay complete while the remaining catalogue photos are being sourced.
 */
const PACKSHOT = PACKSHOT_REGISTRY;

function Vessel({ p, i }: { p: ClientProduct; i: number }) {
  const kind = classify(p);
  const tint = LINE_COLOR[p.line] ?? '#5a666e';
  const shot = PACKSHOT[p.id];

  // Staggered lift-in: each vessel rises and settles, so the pallet reads as
  // being loaded rather than appearing all at once.
  const delay = i * 70;

  if (shot) {
    return (
      <Img
        src={shot}
        alt={`${p.name_en} — ${p.specification}`}
        className="sku-shot"
        style={{ animationDelay: `${delay}ms`, height: `${SHOT_HEIGHT}px` }}
        /* the slot is a fixed height and an automatic width, so the
           width the browser has to cover is the height times the shape
           of the picture - which the variant manifest knows */
        sizes={shotSizes(shot)}
        loading={i < 4 ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }

  /*
   * No photograph for this SKU: draw the package rather than a wireframe.
   *
   * The empty outline used here read as an image that failed to load, which
   * is a different message from "we have a drawing of this product". The
   * drawing in lib/packshots.ts is generated from the catalogue record, so it
   * carries the right size.
   */
  const illustration = ILLUSTRATION[p.id];
  if (illustration) {
    return (
      <Img
        src={illustration}
        alt={`${p.name_en} — ${p.specification} — packaging design, not a photograph`}
        className="sku-shot"
        style={{ animationDelay: `${delay}ms`, height: `${SHOT_HEIGHT}px` }}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 120"
      className="sku-vessel"
      style={{ animationDelay: `${delay}ms`, height: `${SHOT_HEIGHT}px` }}
      role="img"
      aria-label={`${p.name_en} — ${p.specification} — packaging design, not a photograph`}
    >
      {/*
        A PACKAGE, not a wireframe.

        This used to draw an empty outline, which read as a broken image the
        moment it sat next to nineteen real photographs: the buyer could not
        tell a placeholder from a fault. So the fallback now draws the same
        thing the catalogue card draws — a filled vessel with a real label
        plate on it — so it reads as a deliberate packaging design rather than
        something that failed to load. The size is on the slot label below it,
        so nothing has to be legible inside the drawing.
      */}
      {kind === 'sachet' && (
        <>
          <path d="M12 14 h40 v88 a4 4 0 0 1 -4 4 H16 a4 4 0 0 1 -4 -4 Z" fill={tint} opacity="0.26" />
          <path d="M12 14 h40 v88 a4 4 0 0 1 -4 4 H16 a4 4 0 0 1 -4 -4 Z" fill="none" stroke={tint} strokeWidth="2.5" />
          <rect x="18" y="34" width="28" height="44" rx="3" fill="#ffffff" opacity="0.95" />
          <rect x="18" y="34" width="28" height="8" rx="3" fill={tint} opacity="0.9" />
        </>
      )}

      {kind === 'tub' && (
        <>
          <path d="M14 44 h36 a4 4 0 0 1 4 4 v48 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 V48 a4 4 0 0 1 4 -4 Z" fill={tint} opacity="0.26" />
          <path d="M14 44 h36 a4 4 0 0 1 4 4 v48 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 V48 a4 4 0 0 1 4 -4 Z" fill="none" stroke={tint} strokeWidth="2.5" />
          <rect x="10" y="30" width="44" height="16" rx="4" fill={tint} opacity="0.85" />
          <rect x="21" y="62" width="22" height="30" rx="3" fill="#ffffff" opacity="0.95" />
          <rect x="21" y="62" width="22" height="7" rx="3" fill={tint} opacity="0.9" />
        </>
      )}

      {kind === 'jug' && (
        <>
          <path d="M18 40 h28 a4 4 0 0 1 4 4 v52 a6 6 0 0 1 -6 6 H20 a6 6 0 0 1 -6 -6 V44 a4 4 0 0 1 4 -4 Z" fill={tint} opacity="0.26" />
          <path d="M18 40 h28 a4 4 0 0 1 4 4 v52 a6 6 0 0 1 -6 6 H20 a6 6 0 0 1 -6 -6 V44 a4 4 0 0 1 4 -4 Z" fill="none" stroke={tint} strokeWidth="2.5" />
          <path d="M46 52 q12 6 12 20" fill="none" stroke={tint} strokeWidth="2.5" />
          <rect x="16" y="26" width="32" height="16" rx="3" fill={tint} opacity="0.85" />
          <rect x="23" y="58" width="18" height="32" rx="3" fill="#ffffff" opacity="0.95" />
          <rect x="23" y="58" width="18" height="7" rx="3" fill={tint} opacity="0.9" />
        </>
      )}

      {(kind === 'bottle' || kind === 'atomiser' || kind === 'trigger') && (
        <>
          <path
            d="M24 44 h16 a4 4 0 0 1 4 4 v48 a6 6 0 0 1 -6 6 H26 a6 6 0 0 1 -6 -6 V48 a4 4 0 0 1 4 -4 Z"
            fill={tint}
            opacity="0.26"
          />
          <path
            d="M24 44 h16 a4 4 0 0 1 4 4 v48 a6 6 0 0 1 -6 6 H26 a6 6 0 0 1 -6 -6 V48 a4 4 0 0 1 4 -4 Z"
            fill="none"
            stroke={tint}
            strokeWidth="2.5"
          />
          {kind === 'trigger' && (
            <>
              <rect x="26" y="24" width="12" height="22" rx="2" fill={tint} opacity="0.85" />
              <path d="M38 26 h10 v8 h-6 l-4 6" fill="none" stroke={tint} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {kind === 'atomiser' && (
            <>
              <rect x="28" y="22" width="8" height="24" rx="2" fill={tint} opacity="0.85" />
              <circle cx="32" cy="18" r="4" fill={tint} />
            </>
          )}
          {kind === 'bottle' && (
            <>
              <rect x="26" y="30" width="12" height="16" rx="2" fill={tint} opacity="0.85" />
              <rect x="30" y="14" width="4" height="18" rx="1.5" fill={tint} />
            </>
          )}
          <rect x="26.5" y="62" width="11" height="30" rx="2.5" fill="#ffffff" opacity="0.95" />
          <rect x="26.5" y="62" width="11" height="7" rx="2.5" fill={tint} opacity="0.9" />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Chip labels                                                         */
/* ------------------------------------------------------------------ */

/**
 * The product name without its size.
 *
 * The size pattern allows a decimal ("1.5 kg") and requires the unit, so it
 * cannot start in the middle of a number: without the decimal the 1.5 kg
 * laundry detergent lost its "5 kg" and was left as "...Households 1.".
 */
function baseName(p: ClientProduct): string {
  return p.name_en.replace(/\s*\d+(?:\.\d+)?\s*(mL|ml|g|kg)\b.*$/, '').trim();
}

/**
 * The size on its own, for telling two same-named SKUs apart.
 *
 * "500 g / pack" -> "500 g". It is the part before the packaging word, which
 * is the part a buyer quotes back to us.
 */
function sizeTag(p: ClientProduct): string {
  const m = p.specification.match(/^([^/]+)/);
  return (m ? m[1] : p.specification).trim();
}

/**
 * How many SKUs share each product name.
 *
 * Six of the twenty SKUs come in pairs of the same product in two sizes: Cat
 * Litter Partner 500 g and 300 g, Multi-Purpose Pet Wash 300 mL and 200 mL,
 * No-Rinse Pet Cleansing Foam 500 mL and 300 mL. With the size stripped from
 * the chip, each pair rendered as two buttons with identical text, so the
 * picker showed six chips and a buyer could not tell which was which. A name
 * that is not unique keeps its size; the other fourteen stay short.
 */
function nameCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of products) {
    const key = baseName(p);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

export default function SkuComposer({ maxPick = 6 }: { maxPick?: number }) {
  // Default selection tells a story instead of showing an empty machine:
  // one SKU from each line is the shape of a first OEM order.
  const [picked, setPicked] = useState<string[]>(['P003', 'P007', 'P012', 'P019']);

  /*
   * The picker is grouped by LINE, the same grouping the catalogue page and
   * each product's own hero use.
   *
   * It used to group by `category`, the three-way compliance grouping. That
   * put the ear cleansing solution and the dental water under "Disinfection &
   * Odor Control" — a label that is untrue of a bottle that goes into an ear
   * canal or a cat's mouth — and it gave the buyer two vocabularies for one
   * set of products depending on which page they were looking at.
   */
  const catalogue = useMemo(() => {
    const byLine = new Map<string, ClientProduct[]>();
    for (const p of products) {
      const arr = byLine.get(p.line) ?? [];
      arr.push(p);
      byLine.set(p.line, arr);
    }
    return [...byLine.entries()];
  }, []);

  const selected = useMemo(
    () => picked.map((id) => products.find((p) => p.id === id)).filter((p): p is ClientProduct => !!p),
    [picked]
  );

  const counts = useMemo(() => nameCounts(), []);

  function chipLabel(p: ClientProduct): string {
    const base = baseName(p);
    return (counts.get(base) ?? 1) > 1 ? `${base} · ${sizeTag(p)}` : base;
  }

  const totals = useMemo(() => {
    if (selected.length === 0) return { moq: 0, stock: '—', oem: '—', cartons: 0 };
    const moq = selected.reduce((m, p) => Math.max(m, p.moq), 0);
    const cartons = selected.reduce((c, p) => {
      const per = p.package.match(/([\d.]+)\s*(?:sets|bottles|packs|sachets)/i);
      return c + (p.moq / (per ? parseFloat(per[1]) : 1));
    }, 0);
    const stock = [...new Set(selected.map((p) => p.lead_time_days_stock))].join(' / ');
    const oem = [...new Set(selected.map((p) => p.lead_time_days_oem))].join(' / ');
    return { moq, stock, oem, cartons: Math.ceil(cartons) };
  }, [selected]);

  function toggle(id: string) {
    setPicked((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= maxPick ? [...cur.slice(1), id] : [...cur, id]
    );
  }

  return (
    <div className="composer">
      {/* ---- picker ---- */}
      <div className="composer__picker">
        <div className="composer__picker-head">
          {/* No eyebrow here: the enclosing `composer` Block owns it. Printing
              the same line twice is the kind of detail that makes a page feel
              assembled rather than designed. */}
          <h3 className="v2-display text-2xl md:text-3xl">
            Pick up to {maxPick} SKUs
          </h3>
          <p className="mt-3 text-sm text-v2-ink-500">
            A working OEM order usually spans {catalogue.length} lines. Mix them here
            and the commitments update live.
          </p>
        </div>

        {catalogue.map(([line, list]) => (
          <div key={line} className="composer__line">
            <p className="composer__line-name">{getLineLabel(line as ClientProduct['line'])}</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {list.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={on}
                      className={`sku-chip el-lift${on ? ' sku-chip--on' : ''}`}
                      data-ptr="magnet"
                      title={`${p.name_en} — ${p.specification}`}
                    >
                      <span className="sku-chip__dot" aria-hidden />
                      {chipLabel(p)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ---- stage ---- */}
      <div className="composer__stage">
        <div className="composer__pallet">
          {selected.length === 0 ? (
            <p className="composer__empty">Select a SKU to load the pallet.</p>
          ) : (
            selected.map((p, i) => (
              <div key={p.id} className="composer__slot">
                <Vessel p={p} i={i} />
                <span className="composer__slot-label">{p.specification}</span>
              </div>
            ))
          )}
        </div>

        <dl className="composer__totals">
          <div>
            <dt>SKUs</dt>
            <dd>{selected.length}</dd>
          </div>
          <div>
            <dt>Min MOQ</dt>
            <dd>{totals.moq.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Stock lead time</dt>
            <dd>{totals.stock} d</dd>
          </div>
          <div>
            <dt>Private-label lead time</dt>
            <dd>{totals.oem} d</dd>
          </div>
        </dl>

        <a
          className="composer__cta"
          href={`/contact.html?range=${encodeURIComponent(selected.map((p) => p.id).join(','))}`}
        >
          Request this combination
          <span aria-hidden>→</span>
        </a>

        <p className="mt-3 text-xs text-v2-ink-400">
          {siteConfig.pricing.display}. MOQ and lead times are indicative per SKU and are
          confirmed on the quotation.
        </p>
      </div>
    </div>
  );
}
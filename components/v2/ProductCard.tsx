'use client';

import Img from '@/components/v2/Img';
import IMAGE_VARIANTS from '@/content/v2/image-variants.json';

type VariantEntry = { width: number; height: number; variants: { w: number; src: string }[] };

/**
 * HOW WIDE THE PLATE IS.
 *
 * The packshot stands in a plate of a fixed height and an automatic
 * width, so the width the browser has to cover is that height times
 * the shape of the picture.
 */
const PLATE_HEIGHT = 160;
function plateSizes(src: string): string | undefined {
  const entry = (IMAGE_VARIANTS as Record<string, VariantEntry>)[src];
  if (!entry || !entry.height) return undefined;
  const width = Math.round((PLATE_HEIGHT * entry.width) / entry.height);
  return width + 'px';
}
import type { ClientProduct } from '@/lib/client-products';
import { productUrl, getLineLabel } from '@/lib/product-routing';

import { Icon, type IconName } from '@/components/v2/Icon';
import { PackageMock } from '@/components/v2/PackageMock';
import { V3Head } from '@/components/v2/V3';

/**
 * CATALOGUE STRUCTURE — three levels of increasing commitment.
 *
 *   1. Group card   — the line as a whole: SKU count, MOQ band, stock and OEM
 *                     lead, and which certifications cover it. Answers "is this
 *                     line even worth reading?"
 *   2. SKU card     — one product: packshot, MOQ, both lead times, OEM support
 *                     and its certification badges. Answers "can I order this?"
 *   3. Detail page  — the full record. Answers "can I ship it?"
 *
 * WHY MOQ SITS ABOVE THE NAME
 * A buyer scanning twenty cards is not shopping, they are filtering. MOQ is the
 * gate: below it the SKU is not possible at all, above it everything else is
 * negotiable. So MOQ is the first thing rendered, and the product name is the
 * second — the reverse of a retail card, deliberately.
 *
 * GREEN DISCIPLINE (v3 rule)
 * Green marks a number and a clickable. Nothing else on the card is green, which
 * is why the certification chips stay neutral: they are reassurance, not action.
 */

/* ------------------------------------------------------------------ */
/* Certification coverage, derived — never hand-typed per SKU          */
/* ------------------------------------------------------------------ */

export type CertKey = 'gmp' | 'disinfectant' | 'feed' | 'fda';

const CERT_META: Record<CertKey, { label: string; icon: IconName }> = {
  gmp: { label: 'ISO 22716 GMP', icon: 'shield' },
  fda: { label: 'FDA registered', icon: 'check' },
  disinfectant: { label: 'Disinfectant permit', icon: 'flask' },
  feed: { label: 'Feed additive permit', icon: 'leaf' },
};

/**
 * Which permits cover a line. Derived from the category so a new SKU inherits
 * the right badges automatically — a hand-maintained badge list would drift.
 */
function certsFor(p: ClientProduct): CertKey[] {
  const out: CertKey[] = ['gmp', 'fda'];
  // The disinfection line additionally runs under the disinfectant production
  // permit; the cleansing and outdoor lines do not, and must not imply it.
  if (p.category === 'disinfection_odor_control') out.push('disinfectant');
  return out;
}

function CertChip({ k }: { k: CertKey }) {
  const m = CERT_META[k];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-v2-ink-200 px-2 py-0.5 text-[10px] font-medium text-v2-ink-500">
      <Icon name={m.icon} size={11} />
      {m.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Level 2 — SKU card                                                  */
/* ------------------------------------------------------------------ */

export function ProductCard({
  p,
  href,
  image,
  showCategory = true,
}: {
  p: ClientProduct;
  href: string;
  /** Optional. The card is designed to be complete without it. */
  image?: string;
  showCategory?: boolean;
}) {
  const certs = certsFor(p);

  return (
    <a
      href={href}
      className="v3-card group flex h-full flex-col overflow-hidden !rounded-v2-lg"
    >
      {/* ---------- plate ---------- */}
      {/*
        One <picture>, and it is the one that knows which pictures have a
        WebP sibling. This used to wrap <Img> in a second <picture> of its
        own, with the WebP address written by hand - so the browser was
        offered a file that might not exist, and a <picture> inside a
        <picture> is not a thing a parser can honour.
      */}
      <div className="relative flex h-40 items-center justify-center border-b border-v2-ink-100 bg-v2-ink-050 px-5">
        {image ? (
          <Img
            src={image}
            alt={p.name_en}
            loading="lazy"
            decoding="async"
            sizes={plateSizes(image)}
            className="h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:-translate-y-1"
          />
        ) : (
          <>
            <PackageMock
              name={p.name_en}
              spec={p.specification}
              category={p.category}
              moq={p.moq}
              compact
              className="h-full w-auto max-w-full"
            />
            {/*
              The honesty marker.

              It used to read "mock" in 9px monospace, which looked like a
              debug label rather than a statement — the buyer could not tell
              whether the picture was a placeholder or a mistake. It now says
              what it is in words a procurement lead will read: this is a
              drawing of the package, and the real photograph is not on the
              site yet.
            */}
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-v2-ink-600 ring-1 ring-v2-ink-200">
              Package mockup
            </span>
          </>
        )}
      </div>

      {/* ---------- the record ---------- */}
      <div className="flex flex-1 flex-col p-5">
        {/*
          The MOQ chip used to float on the photograph, top-left. It covered
          the cap of the bottle on every single card — the product is centred
          in the plate, so a chip in the corner lands on the one thing the
          card is showing. The figure is still the first thing in the record,
          because it decides the deal; it just no longer stands on the
          product.
        */}
        <div className="flex items-start justify-between gap-3">
          {showCategory ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-v2-ink-400">
              {getLineLabel(p.line)}
            </p>
          ) : (
            <span />
          )}
          {/* The gate. Green, because it is a figure and it decides the deal. */}
          <span className="v3-figure shrink-0 rounded-full bg-v2-ink-050 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums ring-1 ring-v2-ink-200">
            MOQ {p.moq.toLocaleString()}
          </span>
        </div>

        <p className="mt-2 font-display text-xl font-semibold leading-none tracking-tight tabular-nums text-v2-ink-900">
          {p.specification.replace(/\s*\/\s*.*$/, '')}
        </p>

        <h3 className="mt-2 line-clamp-2 text-[0.9375rem] font-medium leading-snug text-v2-ink-600">
          {p.name_en}
        </h3>

        <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-v2-ink-400">
          {p.function_en}
        </p>

        {/*
          WHAT IS IN IT, AND WHAT IT IS FOR.

          Twenty cards all saying "gentle, for cats and dogs" cannot be told
          apart, so the buyer reads the same sentence twenty times and learns
          nothing. The two facts that actually separate one formula from
          another are the actives it is built on and the situation it is built
          for — and the catalogue has carried both for every SKU since the
          record was extracted. They were simply never on the card.

          So they are here now, as a spec strip rather than as prose: this is
          a data table pretending to be a product card, and the buyer is
          filtering, not browsing.
        */}
        <dl className="mt-4 space-y-2.5 border-t border-v2-ink-100 pt-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
              Formula
            </dt>
            <dd className="mt-1 line-clamp-2 text-xs leading-relaxed text-v2-ink-600">
              {p.ingredients_en}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
              Fits
            </dt>
            <dd className="mt-1 line-clamp-1 text-xs leading-relaxed text-v2-ink-600">
              {p.application.join(' · ')}
            </dd>
          </div>
        </dl>

        {/* ---------- terms: the four B-side gatekeepers ---------- */}
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-v2-ink-100 pt-4">
          <div>
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
              <Icon name="truck" size={12} /> Stock
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-v2-ink-800">
              {p.lead_time_days_stock} d
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
              <Icon name="clock" size={12} /> OEM
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-v2-ink-800">
              {p.lead_time_days_oem} d
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
              <Icon name="sparkle" size={12} /> Label
            </dt>
            <dd className="mt-1 text-sm font-semibold text-v2-ink-800">OEM/ODM</dd>
          </div>
        </dl>

        {/* ---------- certification coverage ---------- */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-v2-ink-100 pt-4">
          {certs.map((k) => (
            <CertChip key={k} k={k} />
          ))}
        </div>

        <p className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-v2-ink-400">
          <span>{p.sku_oem}</span>
          {/* The link text carries the destination's words, not an arrow. */}
          <span className="v3-link opacity-0 transition-opacity group-hover:opacity-100">
            Full specification &rarr;
          </span>
        </p>
      </div>
    </a>
  );
}

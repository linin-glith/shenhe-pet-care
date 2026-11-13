/**
 * LineGroupCard and ProductGrid — the SERVER-side catalogue views.
 *
 * WHY THEY LIVE IN THEIR OWN FILE
 * ProductCard.tsx carries 'use client', because the card has a hover
 * transition and a tap response. A 'use client' directive applies to the
 * whole module, so every export in that file became a client module — and
 * LineGroupCard needs the full product record to draw a line's MOQ band and
 * its lead-time union. Pulling lib/products.ts into the client bundle put
 * b2b_price_rmb — the internal reference price — into the browser for every
 * page of the site.
 *
 * So the server-side views live here, in a module with no client directive,
 * and the client card stays client-side. Neither drags the other across the
 * boundary.
 */
import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { ProductCard } from '@/components/v2/ProductCard';
import type { ClientProduct } from '@/lib/client-products';
import { imageFor } from '@/lib/packshots';
import { productUrl } from '@/lib/product-routing';

/* ------------------------------------------------------------------ */
/* Level 1 — group card                                                */
/* ------------------------------------------------------------------ */

export type ProductLine = {
  slug: string;
  en: string;
  zh?: string;
  items: ClientProduct[];
};

/**
 * The line, summarised. MOQ is given as a BAND rather than a single number,
 * because a buyer committing to a line wants to know its floor and its spread,
 * not one representative value.
 */
/**
 * Lead times are stored as range STRINGS ("7-15"), not numbers. Coercing them
 * with Number() yields NaN, which is how a group header once rendered
 * "NaN–NaN d" to a buyer. Parse the range explicitly and fail visibly rather
 * than silently: a card with a blank lead time is better than a wrong one.
 */
function parseRange(v: string): [number, number] | null {
  const m = String(v).match(/(\d+)\s*[–\-—~]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const n = Number(v);
  return Number.isFinite(n) ? [n, n] : null;
}

export function LineGroupCard({ line }: { line: ProductLine }) {
  const moqs = line.items.map((p) => p.moq);
  const lo = Math.min(...moqs);
  const hi = Math.max(...moqs);

  // Union the parsed ranges across the line: the floor is the earliest any SKU
  // can ship, the ceiling the slowest.
  const stocks = line.items.map((p) => parseRange(p.lead_time_days_stock)).filter(Boolean) as [number, number][];
  const oems = line.items.map((p) => parseRange(p.lead_time_days_oem)).filter(Boolean) as [number, number][];
  const stock: [number, number] = stocks.length
    ? [Math.min(...stocks.map((s) => s[0])), Math.max(...stocks.map((s) => s[1]))]
    : [0, 0];
  const oem: [number, number] = oems.length
    ? [Math.min(...oems.map((s) => s[0])), Math.max(...oems.map((s) => s[1]))]
    : [0, 0];

  // Union of the line's permits, so a group never advertises less than a SKU.
  const certs = [...new Set(line.items.flatMap(certsFor))] as CertKey[];

  const band = (v: [number, number]) => {
    if (!v[0]) return 'on request';
    return v[0] === v[1] ? `${v[0]} d` : `${v[0]}–${v[1]} d`;
  };

  return (
    <section className="v3-section--tight" id={line.slug}>
      <div className="v2-container">
        {/* v3 header: green dot, centred title, grey subtitle */}
        <V3Head
          title={line.en}
          sub={`${line.items.length} active SKU${line.items.length === 1 ? '' : 's'} · private label across the line`}
        />

        {/* group-level terms — the four gatekeepers, at group scale */}
        <dl className="v3-hairgrid v3-hairgrid--4 mt-12">
          {/* The term first, then the figure — see the note in V3.tsx. */}
          <div className="v3-rise flex flex-col">
            <dt className="order-2 mt-3 text-sm font-medium text-v2-ink-700">MOQ band</dt>
            <dd className="order-1">
              <span className="v3-figure block text-3xl">
                {lo === hi ? lo.toLocaleString() : `${(lo / 1000).toFixed(0)}k–${(hi / 1000).toFixed(0)}k`}
              </span>
              <span className="mt-1 block text-xs text-v2-ink-400">per SKU</span>
            </dd>
          </div>
          <div className="v3-rise flex flex-col">
            <dt className="order-2 mt-3 text-sm font-medium text-v2-ink-700">Stock lead</dt>
            <dd className="order-1">
              <span className="v3-figure block text-3xl">{band(stock)}</span>
              <span className="mt-1 block text-xs text-v2-ink-400">ready to ship</span>
            </dd>
          </div>
          <div className="v3-rise flex flex-col">
            <dt className="order-2 mt-3 text-sm font-medium text-v2-ink-700">Private label</dt>
            <dd className="order-1">
              <span className="v3-figure block text-3xl">{band(oem)}</span>
              <span className="mt-1 block text-xs text-v2-ink-400">your label, our formula</span>
            </dd>
          </div>
          <div className="v3-rise flex flex-col">
            <dt className="order-2 mt-3 text-sm font-medium text-v2-ink-700">Certification</dt>
            <dd className="order-1">
              <span className="flex flex-wrap gap-1.5">
                {certs.map((k) => (
                  <CertChip key={k} k={k} />
                ))}
              </span>
              <span className="mt-1 block text-xs text-v2-ink-400">covers the whole line</span>
            </dd>
          </div>
        </dl>

        {/* level 2 — the SKUs in this line */}
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {line.items.map((p) => (
            <li key={p.id}>
              <ProductCard
                p={p}
                image={imageFor(p.id)?.src}
                href={productUrl(p)}
                showCategory={false}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The catalogue grid, kept for pages that render one flat list.        */
/* ------------------------------------------------------------------ */

export function ProductGrid({
  items,
  columns = 4,
}: {
  items: { p: ClientProduct; href: string; image?: string }[];
  columns?: 3 | 4;
}) {
  const cols = columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
  return (
    <ul className={`grid gap-5 ${cols}`}>
      {items.map((it) => (
        <li key={it.p.id}>
          <ProductCard p={it.p} href={it.href} image={it.image} />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Certification chips                                                  */
/* ------------------------------------------------------------------ */

type CertKey = 'gmp' | 'disinfectant' | 'feed' | 'fda';

const CERT_META: Record<CertKey, { label: string; icon: 'shield' | 'flask' | 'check' }> = {
  gmp: { label: 'ISO 22716 GMP', icon: 'shield' },
  fda: { label: 'FDA registered', icon: 'shield' },
  disinfectant: { label: 'Disinfectant permit', icon: 'flask' },
  feed: { label: 'Feed additive', icon: 'check' },
};

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
    <span className="inline-flex items-center gap-1 rounded-full border border-v2-ink-200 bg-white px-2.5 py-1 text-[10px] font-medium text-v2-ink-500">
      <Icon name={m.icon} size={11} />
      {m.label}
    </span>
  );
}

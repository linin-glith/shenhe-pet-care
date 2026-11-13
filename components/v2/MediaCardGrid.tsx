import Img from '@/components/v2/Img';
import type { MediaRef } from '@/lib/v2/block-types';

/**
 * MediaCardGrid — image + caption cards, the shared "image besides claim"
 * primitive for Factory facilities and R&D lab equipment.
 *
 * THE PICTURE CONTRACT
 * Every image is emitted as a <picture> with a WebP source and a JPEG/PNG
 * fallback, plus a srcSet for dense displays. That is why an audit sees 2–3
 * resource entries per card: it is format/密度 incremental, NOT duplicate
 * content. The card serves only ONE semantic image.
 */

export type MediaCard = {
  /** Primary path. A sibling `.webp` is derived automatically. */
  src: string;
  alt: string;
  title: string;
  body?: string;
  /**
   * Heading level for the card title.
   *
   * 'h3' (default) puts the card in the document outline. `null` keeps it out
   * of the outline, which is what the production-line grid uses so the page can
   * reserve its three-H3 quota for the Supported Facilities section, per spec.
   */
  heading?: 'h3' | null;
};

export function MediaCardGrid({ items, columns = 3 }: { items: MediaCard[]; columns?: 2 | 3 | 4 }) {
  const cols =
    columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <ul className={`grid gap-5 ${cols}`}>
      {items.map((it, i) => (
        <li key={i} className="el-lift overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-white">
          <figure className="group">
            <div className="aspect-[4/3] overflow-hidden bg-v2-ink-050">
              {/* One <picture>: the one <Img> builds, out of the manifest. */}
              <Img
                src={it.src}
                alt={it.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            </div>
            <figcaption className="border-t border-v2-ink-100 p-5">
              {it.heading === null ? (
                <p className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">{it.title}</p>
              ) : (
                <h3 className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">{it.title}</h3>
              )}
              {it.body && <p className="mt-1.5 text-sm leading-relaxed text-v2-ink-500">{it.body}</p>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

/**
 * Hero media helper: reuses the same picture contract so the LCP image also
 * gets a WebP source instead of a single heavyweight raster.
 */
export function HeroMedia({ media }: { media?: MediaRef }) {
  if (!media?.src) return null;
  return (
    <div className="overflow-hidden rounded-v2-lg border border-white/10 shadow-v2-lg">
      {/* One <picture>: the one <Img> builds, out of the manifest. */}
      <Img
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={media.priority ? 'eager' : 'lazy'}
        fetchPriority={media.priority ? 'high' : 'auto'}
        decoding={media.priority ? 'sync' : 'async'}
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  );
}

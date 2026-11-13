import type { CalloutBlock, FaqBlock, GalleryBlock, ReviewsBlock } from '@/lib/v2/block-types';
import Img from '@/components/v2/Img';
import { Callout } from '@/components/v2/Type';

/**
 * Callout — a remark with its own voice.
 * Emitted by the converter in place of a legacy price table, because the site
 * is quote-only and must never render tier numbers.
 */
function CalloutView({ b }: { b: CalloutBlock }) {
  return (
    <section className="v2-section--tight py-10">
      <div className="v2-container">
        <div className="mx-auto max-w-3xl">
          <Callout icon={b.icon ?? 'shield'}>
            {b.title && (
              <strong className="mb-1 block text-[0.9375rem] font-semibold">{b.title}</strong>
            )}
            {b.body}
          </Callout>
        </div>
      </div>
    </section>
  );
}

/**
 * Gallery — photographic plates with real captions.
 * Facility pages are the one place where an unlabelled photo stream does not
 * help; the label is what turns a picture into evidence.
 */
function GalleryView({ b }: { b: GalleryBlock }) {
  return (
    <section className="v2-section">
      <div className="v2-container">
        {b.title && <h2 className="v2-display mb-10 text-3xl md:text-4xl">{b.title}</h2>}
        <ul
          className={`grid gap-5 ${b.items.length % 3 === 1 ? 'lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
        >
          {b.items.map((it, i) => (
            <li key={i} className="el-lift overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-white">
              <figure className="group">
                <div className="aspect-[4/3] overflow-hidden bg-v2-ink-050">
                  <Img
                    src={it.src}
                    alt={it.label}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                </div>
                <figcaption className="border-t border-v2-ink-100 p-5">
                  <p className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                    {it.label}
                  </p>
                  {it.caption && (
                    <p className="mt-1.5 text-sm leading-relaxed text-v2-ink-500">{it.caption}</p>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * FAQ — the GEO surface.
 *
 * Each pair renders as a heading + paragraph rather than a scripted
 * accordion: the answers must exist in server-rendered HTML for both
 * crawlers and answer engines. Nothing here hides behind a click.
 */
function FaqView({ b }: { b: FaqBlock }) {
  return (
    <section className="v2-section bg-v2-ink-050" id="faq">
      <div className="v2-container">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
            {b.title && <h2 className="v2-display mt-4 text-3xl md:text-4xl">{b.title}</h2>}
            <p className="mt-5 text-sm leading-relaxed text-v2-ink-500">
              Straight answers. Where the honest answer is a limit, we state the limit.
            </p>
          </div>

          <dl className="divide-y divide-v2-ink-200 border-y border-v2-ink-200">
            {b.items.map((f, i) => (
              <div key={i} className="grid gap-2 py-6 sm:grid-cols-[15rem_1fr] sm:gap-8">
                <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                  {f.q}
                </dt>
                <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/**
 * Reviews — the buyers' own words.
 *
 * WHY THIS IS A SECTION AND NOT A QUOTE IN THE HERO
 * A rating in the structured data has to be visible on the page. Google
 * compares the number in the markup with what the page shows, and a
 * rating that lives only in the markup is a rating the page does not
 * support. So the reviews are rendered here, in full, with the buyer's
 * name, the number they gave and the date they gave it.
 *
 * WHY THE STARS ARE TEXT AND NOT AN IMAGE
 * A reader that cannot see the image still has to be able to read the
 * rating. The stars are the buyer's number, written out, next to the
 * words they wrote.
 *
 * WHY THE NUMBER IS SHOWN NEXT TO THE REVIEWS
 * The average on the page is the same number the markup carries, from
 * the same list. A buyer who counts the reviews on the page must get
 * the same count the search result will show.
 */
function ReviewsView({ b }: { b: ReviewsBlock }) {
  return (
    <section className="v2-section" id="reviews">
      <div className="v2-container">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
            {b.title && <h2 className="v2-display mt-4 text-3xl md:text-4xl">{b.title}</h2>}
            {b.summary.count > 0 && (
              <p className="mt-5 text-sm leading-relaxed text-v2-ink-500">
                <span className="font-semibold text-v2-ink-900">
                  {b.summary.value.toFixed(1)} out of 5
                </span>{' '}
                from {b.summary.count} {b.summary.count === 1 ? 'buyer' : 'buyers'}, quoted with their
                permission.
              </p>
            )}
          </div>

          <div className="divide-y divide-v2-ink-200 border-y border-v2-ink-200">
            {b.items.map((r, i) => (
              <article key={i} className="py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[0.9375rem] font-semibold text-v2-ink-900">
                    {r.author}
                    {r.company ? <span className="font-normal text-v2-ink-500"> · {r.company}</span> : null}
                  </p>
                  <p className="text-xs text-v2-ink-500">
                    <span aria-hidden="true">{'★'.repeat(r.rating)}</span>
                    <span className="sr-only">
                      {r.rating} out of 5{', '}
                    </span>
                    <span aria-hidden="true">{'☆'.repeat(5 - r.rating)}</span>
                    <span className="ml-2">{r.date}</span>
                  </p>
                </div>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-v2-ink-600">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { CalloutView, GalleryView, FaqView, ReviewsView };

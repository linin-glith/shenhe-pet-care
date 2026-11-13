import type { ReactNode } from 'react';
import { PawField } from '@/components/v2/PetArt';
import Img from '@/components/v2/Img';

/**
 * Homepage hero —a designed composition, not a template.
 *
 * WHAT WAS WRONG WITH THE FIRST VERSION
 * It was the same shape as every other block on the site: two equal columns,
 * a heading in the left one, a rectangle in the right one, centred padding.
 * Because EVERYTHING had that shape, nothing had shape. The page had no
 * protagonist, no rhythm, and no reason to look twice —which is the actual
 * definition of "looks generated".
 *
 * THE COMPOSITION HERE
 *   - Asymmetry on purpose. Text occupies roughly a third; the photograph runs
 *     off the right edge. The eye lands on the picture first, then travels
 *     back left into the claim. A centred 50/50 split would destroy that.
 *   - One real protagonist. The display line is the largest type on the site
 *     by a wide margin, not merely the first one in the DOM.
 *   - The pet sits IN the composition, not beside it —a paw trail runs along
 *     the baseline and the cat figure anchors the bottom-left corner, so the
 *     product category is legible before a single word is read.
 *   - Full-bleed. The photo touches three edges. A floating rounded rectangle
 *     on a white page always reads as a component; a bleeding edge reads as
 *     a layout decision.
 */

export function HomeHero({
  eyebrow,
  title,
  lead,
  cta,
  stats,
  image,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  cta?: ReactNode;
  stats: { value: string; label: string; note?: string }[];
  image?: { src: string; alt: string };
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-v2-ink-900">
      {/* ambient colour —three soft pools, no visible loop */}
      <div className="v2-mesh" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="relative">
        {/* ---------- full-bleed image, anchored right ---------- */}
        {image && (
          <div className="absolute inset-y-0 right-0 w-full max-w-full lg:w-[62%]" aria-hidden={false}>
            <Img
              src={image.src}
              alt={image.alt}
              priority
              className="h-full w-full object-cover opacity-70 lg:opacity-100"
              /* the single LCP image on the page */
              fetchPriority="high"
              decoding="sync"
              /* it fills the width of the screen, so that is the width the
                 browser has to cover - and it is what makes it take the
                 640 px file on a phone instead of the 1344 px one */
              sizes="100vw"
            />
            {/* Two gradients, not one: a horizontal scrim to protect the text
                column and a bottom scrim to seat the photo against the fold. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, #0b0f12 0%, rgba(11,15,18,0.92) 22%, rgba(11,15,18,0.35) 52%, rgba(11,15,18,0) 78%)',
              }}
            />

            {/* A second scrim, and it exists for phones.
                On a wide screen the photo sits to the right and the
                horizontal scrim protects the text column. On a phone the
                photo is the whole background and the words sit ON it, so
                without a vertical scrim they are unreadable. */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(11,15,18,0.94) 0%, rgba(11,15,18,0.88) 45%, rgba(11,15,18,0.75) 100%)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: 'linear-gradient(180deg, transparent, #0b0f12)' }}
            />
          </div>
        )}

        {/* ---------- text column ---------- */}
        <div className="v2-container relative">
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-7 xl:col-span-6">
              {eyebrow && (
                <p className="v2-eyebrow v2-eyebrow--light el-enter mt-14 md:mt-20 flex items-center gap-2.5">
                  <span aria-hidden className="inline-block h-px w-8 bg-v2-accent-500" />
                  {eyebrow}
                </p>
              )}

              {/* A fluid scale, not three fixed sizes.
                  A fixed 3.1rem is 49.6px, and "Private-label" alone
                  overflows a 390px screen at that size. The clamp() floor
                  is the size that fits the longest single word on the
                  narrowest phone this site is read on; the ceiling is the
                  size the desktop composition was designed around.

                  ONE HEADLINE, ONE PARAGRAPH.
                  The headline used to carry a second line - the product
                  categories, in italic teal - and it was set as large as the
                  line above it, so it took five rows and pushed the
                  quotation form off the first screen. Those words now open
                  the paragraph instead, and the hero says one thing. */}
              <h1 className="mt-6 font-display font-semibold text-white tracking-[-0.04em] leading-[1.04] text-[clamp(1.75rem,5.8vw,4rem)]">
                <span className="el-enter el-enter-1 block">{title}</span>
              </h1>

              {lead && (
                <p className="el-enter el-enter-3 mt-6 max-w-[36rem] text-[0.98rem] leading-relaxed text-white/85 sm:text-[1.0625rem]">{lead}</p>
              )}

              {/* On a phone two full-width buttons side by side is how a
                  call to action gets clipped off the right edge. They
                  stack, and the primary one goes first. */}
              {cta && (
                <div className="el-enter el-enter-4 mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
                  {cta}
                </div>
              )}
            </div>
          </div>

          {/* ---------- stat rail, sitting ON the photo edge ----------
              The term first, then the figure — see the note in V3.tsx.
              This is the list Google's PageSpeed named. */}
          <dl className="relative mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-v2-md bg-white/10 md:mt-20 md:grid-cols-4 lg:max-w-3xl">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col bg-v2-ink-900/85 px-5 py-5 backdrop-blur-md">
                <dt className="order-2 mt-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/55">
                  {s.label}
                </dt>
                <dd className="order-1">
                  <span className="block font-display text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-white">
                    {s.value}
                  </span>
                  {s.note && <span className="mt-1 block text-[11px] text-white/50">{s.note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---------- paw trail along the baseline ---------- */}
        <PawField
          width={900}
          height={92}
          opacity={0.14}
          className="pointer-events-none absolute bottom-0 right-0 hidden lg:block"
        />

        {/* vertical rhythm break: the photo bleeds under this bar */}
        <div className="h-10 bg-v2-ink-900" />
      </div>
    </section>
  );
}

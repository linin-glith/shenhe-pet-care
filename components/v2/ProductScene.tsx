import type { ReactNode } from 'react';
import Img from '@/components/v2/Img';
import { Icon } from '@/components/v2/Icon';

/**
 * ProductScene — the product, and the animal it is made for.
 *
 * WHY THE COMPOSITION CHANGED
 * The first version laid the animal photograph full-bleed and floated the
 * packshot on top of it, joined by a dotted line. It looked like a sticker on
 * a photograph, and three things were plainly wrong on screen:
 *
 *   1. the product was cropped by the frame — a bottle with its label cut in
 *      half is the first thing a buyer sees and the worst thing to see;
 *   2. the ground was blurred until the animal stopped being an animal, so
 *      the section lost the thing it was about;
 *   3. the dotted connector and its two dots floated over the animal's face
 *      and read as an artefact rather than a relationship.
 *
 * So the hierarchy is now explicit: the PRODUCT is the subject, on its own
 * clean surface, complete and legible, with the claim underneath it. The
 * ANIMAL is the context, in its own frame at full contrast, so the buyer can
 * see the animal the formulation is specified for.
 *
 * Two panels, but not two equals: one is 55% of the width, holds the light
 * and the only sharp edges, and everything else is support.
 *
 * Nothing here fakes a photo. The product image is the real packshot cut
 * out; the animal image is real photography. Only the spatial relationship
 * is authored, and it is authored from what the product actually does.
 */

export function ProductScene({
  product,
  productAlt,
  pet,
  petAlt,
  audience,
  claim,
  claimIcon = 'check',
  tone = 'light',
  petCaption = 'The animal this formulation is specified for.',
}: {
  /** Cut-out product image (transparent or plain white background works best). */
  product: string;
  productAlt: string;
  /** Animal photograph. */
  pet: string;
  petAlt: string;
  audience: string;
  claim: string;
  claimIcon?: 'check' | 'sparkle' | 'shield' | 'leaf';
  tone?: 'light' | 'dark';
  /**
   * The caption on the animal photograph.
   *
   * One sentence for every product page said "The animal this formulation
   * is specified for" — including the deodorizer whose own catalogue
   * record is for bedding, floors and litter boxes. The caption follows the
   * catalogue now.
   */
  petCaption?: string;
}) {
  const dark = tone === 'dark';

  /*
   * A PHOTOGRAPH, not a cut-out.
   *
   * The scene used to composite the transparent cut-out PNG on the surface.
   * That meant the picture on the page was never the picture the price list
   * carries, and the cut-outs are not all equal — some of them are a soft
   * blob, some are cropped at the frame. The price-list photograph has a white
   * background, and on a light surface a white background disappears into
   * the surface with one property: mix-blend-mode: multiply. The product
   * stands on the surface exactly as it did, but the picture on the page is
   * the real one.
   *
   * An illustration (no photograph exists for that SKU) and the dark
   * surface keep the cut-out treatment, because multiply on a dark surface
   * would swallow the light parts of the product.
   */
  const isPhoto = !product.includes('/cutout/') && !product.includes('/illus/');
  const blend = isPhoto && !dark;

  // The product stands on its own surface: a soft light pool, warmer and
  // brighter than the animal frame, so the eye lands on the thing being sold.
  const surface = dark
    ? 'radial-gradient(115% 95% at 50% 14%, #1d2f36 0%, #101f25 52%, #081217 100%)'
    : 'radial-gradient(115% 95% at 50% 14%, #ffffff 0%, #eef1f2 50%, #dde3e5 100%)';

  return (
    /* `min-w-0` on the figure, the grid and both cells keeps the phone honest.

       Without it the two cells are grid items with `min-width: auto`, so their
       min-content width wins over the column: one cell measured 661 px inside a
       342 px column on a 390 px screen, and the packshot and the claim plate
       were both cropped down the right edge. The photograph is the cause —
       `max-w-[70%]` is a percentage against a width the grid is still deciding,
       so it resolves to nothing and the image's intrinsic width becomes the
       floor. With the floor removed the cells take the column width and the
       percentage resolves normally. */
    <figure className="min-w-0 overflow-hidden rounded-v2-lg">
      <div className="grid min-w-0 md:grid-cols-[1.12fr_0.88fr]">
        {/* ---------- subject: the product ---------- */}
        {/*
          The bottom padding is the CLAIM PLATE's room.

          The plate is an absolutely positioned overlay at the foot of this
          panel, and the product used to be centred in the whole panel — so the
          plate sat across the foot of the bottle. On a tall bottle (a 350 mL
          spray, a 500 mL jug) the product's base disappeared behind the text.
          Reserving the plate's height at the bottom lifts the product clear
          of it, and the product now always reads as a whole object.

          ON A PHONE THE PLATE STOPS OVERLAYING.

          The reservation is a fixed 84 px because on a wide panel the claim
          wraps to one line or two. On a 390 px screen the same claim wraps to
          five and the plate grows to ~150 px, so it covered the foot of the
          bottle again — the reserve was calibrated for desktop text. Below
          640 px the panel becomes a column and the plate sits under the
          product as an ordinary child: no overlap to calibrate, and the claim
          still sits with the picture it describes.
        */}
        <div
          className="relative flex min-w-0 flex-col aspect-[5/4] items-center justify-center p-6 pb-0 sm:flex-row sm:p-10 sm:pb-[92px]"
          style={{ background: surface }}
        >
          {/* The plinth: a soft contact shadow so the product is standing on
              something rather than hovering. A photograph brings its own
              shadow, so the plinth is only for the cut-out. */}
          {!blend && (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-[17%] h-7 w-[52%] rounded-[50%] blur-xl"
              style={{
                background: dark
                  ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.75), rgba(0,0,0,0) 70%)'
                  : 'radial-gradient(ellipse at center, rgba(6,14,18,0.38), rgba(6,14,18,0) 70%)',
              }}
            />
          )}

          <Img
            src={product}
            alt={productAlt}
            className="relative max-h-full max-w-[70%] object-contain"
            style={{
              // A tight rim shadow reads as form; the wide one grounds it.
              filter: blend
                ? 'none'
                : dark
                  ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 22px 34px rgba(0,0,0,0.6))'
                  : 'drop-shadow(0 2px 2px rgba(6,14,18,0.30)) drop-shadow(0 18px 26px rgba(6,14,18,0.32))',
              // The white background of the price-list photograph sinks into
              // the surface instead of sitting on it as a rectangle.
              mixBlendMode: blend ? 'multiply' : undefined,
            }}
            loading="lazy"
            decoding="async"
          />

          {/* ---------- audience chip ---------- */}
          <span
            className={`absolute left-5 top-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] backdrop-blur ${
              dark ? 'bg-white/10 text-white ring-1 ring-white/20' : 'bg-white/92 text-v2-ink-700 ring-1 ring-v2-ink-200/80'
            }`}
          >
            <Icon name={audience === 'Dogs' ? 'dog' : 'cat'} size={15} className="text-v2-accent-700" />
            For {audience.toLowerCase()}
          </span>

          {/* ---------- claim plate ----------
              Overlay from 640 px up; an ordinary child of the column below it,
              so on a phone the claim sits under the packet instead of across
              it. */}
          <figcaption className="w-full pt-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-6 sm:pt-6">
            <p
              className={`inline-flex max-w-[26rem] items-start gap-2.5 rounded-v2-md px-4 py-3 text-sm font-semibold leading-snug backdrop-blur-md ${
                dark ? 'bg-white/10 text-white ring-1 ring-white/15' : 'bg-white/92 text-v2-ink-900 ring-1 ring-v2-ink-200/70'
              }`}
            >
              <Icon name={claimIcon} size={18} className="mt-0.5 shrink-0 text-v2-accent-500" />
              {claim}
            </p>
          </figcaption>
        </div>

        {/* ---------- context: the animal ---------- */}
        <div className="relative min-w-0 aspect-[5/4] overflow-hidden md:h-full">
          <Img
            src={pet}
            alt={petAlt}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* A short gradient at the foot so the caption has something to sit
              on without dimming the animal. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-32"
            style={{
              background: 'linear-gradient(180deg, rgba(8,18,22,0) 0%, rgba(8,18,22,0.72) 100%)',
            }}
          />
          <p className="absolute inset-x-0 bottom-0 p-5 text-xs leading-relaxed text-white/85">
            {petCaption}
          </p>
        </div>
      </div>
    </figure>
  );
}

/**
 * Three scenes side by side —the "range at a glance" view.
 * Uses the same authored relationship, so the row reads as one idea repeated
 * rather than three unrelated pictures.
 */
export function ProductSceneRow({ scenes }: { scenes: ReactNode[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {scenes.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

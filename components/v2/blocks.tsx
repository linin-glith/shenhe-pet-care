import dynamic from 'next/dynamic';
import type {
  ComposerBlock,
  Cta,
  CtaBandBlock,
  FeatureGridBlock,
  HeroBlock,
  MediaRef,
  Metric,
  MetricBandBlock,
  ProcessBlock,
  ProductGridBlock,
  ProofBarBlock,
  ProofGridBlock,
  ProofItem,
  RelatedBlock,
  SceneBlock,
  SeoBlock,
  SpecTableBlock,
  RfqBlock,
  RichBlock,
  ProductDepthBlock,
  CategoryDepthBlock,
  MarketFitBlock,
  SplitBlock,
  TimelineBlock,
  RecordCardsBlock,
  V2Block,
} from '@/lib/v2/block-types';
import { imageSize } from '@/components/v2/imageSize';
import IMAGE_VARIANTS from '@/content/v2/image-variants.json';
import WebpImg from '@/components/v2/Img';
import { siteConfig } from '@/lib/shenhe.config';
import { productLines } from '@/lib/client-products';
import { getProductById } from '@/lib/products';
import { LINE_LABEL } from '@/lib/product-routing';
import { ProductDepth, ProductFAQ } from '@/components/v2/ProductDepth';
import { CategoryDepth } from '@/components/v2/CategoryDepth';
import { MARKET_LABEL, MARKET_PAGE, SKU_MARKET } from '@/lib/market-claims';
import SkuComposer from '@/components/v2/SkuComposer';
import InquiryForm from '@/components/v2/InquiryForm';
import { StatRow, ProcessTrack, SpecList } from '@/components/v2/Type';
import { CalloutView, GalleryView, FaqView, ReviewsView } from '@/components/v2/Converted';
import { V3DuoGrid, V3Head } from '@/components/v2/V3';
import { Icon } from '@/components/v2/Icon';

/**
 * v2 Block renderers.
 *
 * Contract with the data layer: these components NEVER mutate their props and
 * NEVER reach for a global. Everything they draw comes from the block object,
 * so a page can be restyled or reordered without touching content.
 */

/* ------------------------------------------------------------------ */
/* The product scene, loaded behind a lazy boundary                   */
/* ------------------------------------------------------------------ */

/*
 * THE SCENE IS NOT A STATIC IMPORT.
 *
 * The scene is the one block on a product page that can grow without
 * warning: a canvas, a viewer, a model loader. For as long as it is a
 * static import of the block renderer, whatever it grows into becomes part
 * of the blocking bundle of every route that renders a block list. The
 * dynamic import is the boundary that keeps that cost out of the first
 * paint.
 *
 * `ssr: false` is deliberately NOT used here, for two reasons.
 *
 * One: it is not allowed. `ssr: false` inside a Server Component is a
 * build error ("`ssr: false` is not allowed with `next/dynamic` in Server
 * Components"), and this file is a Server Component.
 *
 * Two: it would be wrong. The scene carries real copy -- the audience
 * chip, the claim, the caption on the animal photograph -- and the
 * packshot itself. With `ssr: false` all of it is absent from the static
 * HTML until the bundle arrives, which is the opposite of the point: the
 * copy and the picture belong in the first paint, and only the CODE is
 * deferred.
 */
const ProductScene = dynamic(() => import('@/components/v2/ProductScene').then((m) => m.ProductScene), {
  loading: () => <SceneFallback />,
});

/**
 * The box the scene occupies while its module is still on its way.
 *
 * Same figure, same grid, same two aspect-[5/4] cells, and the same
 * surface the scene paints for its light tone -- so the slot is already the
 * right size when the scene replaces it, and nothing moves. It carries no
 * copy and no images: it is a placeholder for a slot, not a second version
 * of the scene. The real copy is in the HTML already, because the scene
 * itself is server-rendered.
 */
function SceneFallback() {
  return (
    <figure className="overflow-hidden rounded-v2-lg" aria-hidden>
      <div className="grid md:grid-cols-[1.12fr_0.88fr]">
        <div
          className="relative aspect-[5/4]"
          style={{
            background: 'radial-gradient(115% 95% at 50% 14%, #ffffff 0%, #eef1f2 50%, #dde3e5 100%)',
          }}
        />
        <div className="relative aspect-[5/4] overflow-hidden bg-v2-ink-100 md:h-full" />
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

export function whatsappHref(text: string): string {
  return `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(text)}`;
}

/**
 * One button implementation for the whole system.
 *
 * Note on weight: `primary` is the only variant that gets the accent fill.
 * Everything else is an outline on the same colour, which is what keeps the
 * "one accent block per viewport" rule from collapsing under button spam.
 */
export function Btn({ cta, light = false }: { cta: Cta; light?: boolean }) {
  const variant = cta.variant ?? 'primary';
  const isExternal = cta.external || /^(https?:|mailto:|tel:)/.test(cta.href);

  const base =
    'group inline-flex items-center justify-center gap-2 rounded-v2-md px-6 py-3 text-sm font-semibold tracking-tight transition-all duration-200';

  const styles: Record<string, string> = {
    primary: 'bg-v2-accent-600 text-white hover:bg-v2-accent-700 shadow-v2-sm hover:shadow-v2-md',
    secondary: light
      ? 'border border-white/30 text-white hover:bg-white hover:text-v2-ink-900'
      : 'border border-v2-ink-300 text-v2-ink-800 hover:border-v2-ink-900 hover:bg-v2-ink-900 hover:text-white',
    ghost: light
      ? 'text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white'
      : 'text-v2-accent-700 underline decoration-v2-accent-300 underline-offset-4 hover:text-v2-accent-800',
    light: 'bg-white text-v2-ink-900 hover:bg-v2-ink-100',
  };

  const cls = `${base} ${styles[variant] ?? styles.primary}`;

  // `primary` is the one action per view worth spending motion on, so it
  // carries the glow + magnet. Everything else stays a flat outline —a
  // glowing button on every element is the same as no glowing button.
  const decorated =
    variant === 'primary'
      ? 'el-glow el-magnetic'
      : '';

  const inner = (
    <>
      <span>{cta.label}</span>
      {/* Explicit margin rather than relying on the flex `gap`: the note is
          the qualifier ("quote < 1 business day") and it must never touch the label. */}
      {cta.note && (
        <span className="ml-2.5 border-l border-current/25 pl-2.5 text-[11px] font-medium opacity-90">
          {cta.note}
        </span>
      )}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={cta.href}
        className={`${cls} ${decorated}`}
        data-ptr={variant === 'primary' ? 'magnet' : undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  return (
    <a
      href={cta.href}
      className={`${cls} ${decorated}`}
      data-ptr={variant === 'primary' ? 'magnet' : undefined}
    >
      {inner}
    </a>
  );
}

/**
 * The single image primitive.
 *
 * `priority` is the ONLY thing that switches off lazy loading, and it is
 * asserted to be used once per page. Every other image must stay lazy — * that rule is what stops a 4 MB hero from blocking first paint.
 */
function Img({
  media,
  className = '',
  sizes,
  seated = false,
}: {
  media?: MediaRef;
  className?: string;
  sizes?: string;
  /**
   * `seated` renders a transparent cut-out standing on the surface instead of
   * a flat photograph inside a white plate.
   *
   * The white plate was the problem: a studio packshot is shot against white,
   * so `fit: 'contain'` was given a white background to fill the letterbox.
   * On a dark hero that produces a literal white rectangle floating on the
   * ink — the most visible flaw on any product page. Seated mode drops the
   * plate, keeps full contrast on the product, and adds a contact shadow so
   * the object rests on the surface instead of hovering over it.
   */
  seated?: boolean;
}) {
  if (!media?.src) return null;
  const fit = media.fit ?? 'cover';
  /*
   * THE SMALLER VERSIONS.
   *
   * This component draws a bare <img>, so it cannot use the picture
   * component - but it can still offer the smaller files. The list comes
   * from the manifest the build writes, and the width of the box is the
   * layout's business (the caller passes it).
   */
  const variants = ((IMAGE_VARIANTS as Record<string, { variants: { w: number; src: string }[] }>)[
    media.src
  ]?.variants) ?? [];
  const srcSet = variants.length
    ? variants.map((v) => `${v.src} ${v.w}w`).join(', ')
    : undefined;
  const boxSizes = sizes ?? '(min-width:1024px) 50vw, 100vw';

  if (seated) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.src}
        alt={media.alt}
        srcSet={srcSet}
        sizes={boxSizes}
        width={media.width ?? imageSize(media.src).width}
        height={media.height ?? imageSize(media.src).height}
        loading={media.priority ? 'eager' : 'lazy'}
        fetchPriority={media.priority ? 'high' : 'auto'}
        decoding={media.priority ? 'sync' : 'async'}
        className={`${className} object-contain`}
        style={{
          filter:
            'drop-shadow(0 2px 2px rgba(0,0,0,0.5)) drop-shadow(0 26px 40px rgba(0,0,0,0.55))',
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.src}
      alt={media.alt}
      srcSet={srcSet}
      sizes={boxSizes}
      width={media.width ?? imageSize(media.src).width}
      height={media.height ?? imageSize(media.src).height}
      loading={media.priority ? 'eager' : 'lazy'}
      fetchPriority={media.priority ? 'high' : 'auto'}
      decoding={media.priority ? 'sync' : 'async'}
      className={`${className} ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
      style={fit === 'contain' ? { background: '#fff' } : undefined}
    />
  );
}

function MetricRow({ metrics, light = false }: { metrics: Metric[]; light?: boolean }) {
  return (
    <StatRow
      items={metrics.map((m) => ({ value: m.value, label: m.label, note: m.note }))}
      tone={light ? 'light' : 'default'}
      size="lg"
    />
  );
}
/* ------------------------------------------------------------------ */
/* Q1 —Credibility                                                    */
/* ------------------------------------------------------------------ */

function HeroView({ b }: { b: HeroBlock }) {
  return (
    <section className="v2-grain-fine relative overflow-hidden bg-v2-ink-900 text-white">
      {/* Mesh gradient plate —2026's answer to a flat brand colour.
          Three pools drift on coprime periods so the composite never
          visibly loops. Pure transform + gradient: no main-thread cost. */}
      <div className="v2-mesh" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="v2-container relative">
        <div
          className={`grid min-w-0 items-center gap-10 py-12 sm:py-14 md:py-20 lg:gap-14 ${
            b.image ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'lg:grid-cols-[1.15fr_0.85fr]'
          }`}
        >
          {/* The right gutter below 640 px is for the floating controls.

              Two 44 px circles sit fixed in the bottom-right corner (the
              product chat and the assistant), and on a 390 px screen the hero's
              answer paragraph ran under them — the buyer lost the end of three
              lines of the one paragraph that carries the measured result. The
              gutter stops the text before the circles instead of moving the
              circles, which are where a thumb expects them. */}
          <div className="pr-10 sm:pr-0">
            {b.eyebrow && <p className="v2-eyebrow v2-eyebrow--light v2-scroll-wipe">{b.eyebrow}</p>}

            {/* Kinetic type: each line tightens and resolves as it is read.
                Driven by the native view() timeline —no scroll listener.

                The base size steps down for phones: at 41.6 px the product
                name alone took four lines and pushed the pill row to 681 px on
                a 844 px screen, with the CTA below the fold. 33.6 px keeps the
                display weight and buys back a line. `sm:` restores the old size
                from 640 px up, so nothing above a phone changes. */}
            <h1 className="v2-display v2-display--light mt-5 text-[2.1rem] leading-[1.04] sm:text-[2.6rem] md:text-5xl lg:text-[3.75rem]">
              <span className="v2-kinetic-line block">{b.title}</span>
              {b.accent && (
                <span className="v2-kinetic-line block text-v2-accent-500"> {b.accent}</span>
              )}
            </h1>

            {b.lead && (
              /*
               * `v2-speakable` IS A HOOK, NOT A STYLE.
               *
               * The lead under the heading is the one paragraph on a product
               * page that answers the question the page is asked — it carries
               * the measured conclusion, the minimum order and the private
               * label lead time in one line. The `speakable` property in the
               * markup points at it by this class, so an assistant reads that
               * line rather than the whole page.
               *
               * The class has to exist on exactly the element the selector
               * names, and the build gate checks that the selector resolves.
               * A speakable selector that points at nothing says the page has
               * a spoken summary and does not, which is worse than saying
               * nothing at all.
               */
              <p className="v2-lead v2-lead--light v2-speakable mt-5 max-w-xl v2-scroll-rise">
                {b.lead}
              </p>
            )}

            {/* THE CHARACTERISTICS, BEFORE THE ARGUMENT.
                A buyer comparing four SKUs in the same line reads these
                three pills and decides which page to stay on; the spec table
                is what they read after they have already stayed. Marked up as
                a list so a machine reads three attributes rather than a
                sentence, and so one chip can carry a report figure the page
                proves further down. */}
            {b.chips && b.chips.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2 v2-scroll-rise">
                {b.chips.slice(0, 5).map((chip, i) => (
                  <li
                    key={i}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[12.5px] font-medium leading-tight text-white/85"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            )}

            {/* The answer, and the limit of the answer. The same frame
                the hand-built pages use through PageAnswer, so all eight
                read as one site. */}
            {b.answer && (
              <div className="mt-6 max-w-2xl border-l-2 border-v2-accent-500/70 pl-5 v2-scroll-rise">
                <p className="text-[1.05rem] leading-relaxed text-white/90">{b.answer}</p>
                {b.boundary && <p className="mt-3 text-sm leading-relaxed text-white/60">{b.boundary}</p>}
              </div>
            )}

            {(b.primaryCta || b.secondaryCta) && (
              <div className="mt-8 flex flex-wrap items-center gap-3 v2-scroll-rise">
                {b.primaryCta && <Btn cta={b.primaryCta} light />}
                {b.secondaryCta && <Btn cta={b.secondaryCta} light />}
              </div>
            )}
          </div>

          {b.image ? (
            <div className="relative v2-scroll-rise">
              {/* A product packshot on a product page is a cut-out standing on
                  a surface, not a photograph in a frame. The frame (a white
                  plate filling the letterbox) was producing a literal white
                  rectangle on the ink hero. Now: a soft glow behind the object
                  to separate it from the dark ground, and a contact shadow
                  beneath it so it sits on the floor rather than floating. */}
              {b.image.fit === 'contain' ? (
                <div className="relative flex aspect-[4/5] items-center justify-center sm:aspect-square">
                  {/* Ground separation: a wide, low glow. This is what keeps a
                      pale bottle legible on a near-black hero. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(15,157,132,0.20), rgba(15,157,132,0) 68%)',
                    }}
                  />
                  {/* Contact shadow at the base. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-[8%] left-1/2 h-5 w-[54%] -translate-x-1/2 rounded-[50%] blur-lg"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(0,0,0,0.72), rgba(0,0,0,0) 70%)',
                    }}
                  />
                  <Img media={b.image} seated className="relative max-h-full max-w-full p-6" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-v2-lg border border-white/10 shadow-v2-lg">
                  <Img media={b.image} className="aspect-[4/3] w-full" />
                </div>
              )}
            </div>
          ) : (
            /*
              NO IMAGE IS NOT AN EXCUSE FOR A HOLE.
              A two-column hero with an absent second column rendered as a
              half-empty screen —the single most obvious flaw on any SKU
              without verified photography. When there is no packshot we keep
              the column and fill it with the commitment panel, which is
              information the buyer wants anyway.
            */
            <div className="v2-scroll-rise">
              {/* Only when there are facts to show. An empty <ul> is a hole in
                  the layout that says nothing. */}
              {b.metrics?.length ? (
                <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {(b.metrics ?? []).slice(0, 4).map((m, i) => (
                    <li
                      key={i}
                      className="rounded-v2-md border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                    >
                      <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">{m.value}</div>
                      <div className="mt-1 text-xs font-medium text-white/85">{m.label}</div>
                      {m.note && <div className="mt-0.5 text-[11px] text-white/50">{m.note}</div>}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>

        {b.image && b.metrics && b.metrics.length > 0 && (
          <div className="border-t border-white/10 py-8 v2-scroll-rise">
            <MetricRow metrics={b.metrics} light />
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * A proof strip, not a logo wall.
 *
 * Each item is something the buyer can independently verify —a certificate
 * number, an audit report, a lab figure. Decorative trust badges do not
 * survive a procurement checklist.
 */
function ProofBarView({ b }: { b: ProofBarBlock }) {
  return (
    <section className="border-y border-v2-ink-200 bg-v2-ink-050">
      <div className="v2-container">
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-4 py-5">
          {b.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm font-medium text-v2-ink-600">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-v2-accent-600" />
              {it.href ? (
                <a href={it.href} className="underline decoration-v2-ink-300 underline-offset-4 hover:text-v2-ink-900">
                  {it.label}
                </a>
              ) : (
                <span>{it.label}</span>
              )}
              {it.detail && <span className="text-v2-ink-400">{it.detail}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProofGridView({ b }: { b: ProofGridBlock }) {
  return (
    <section className="v2-section">
      <div className="v2-container">
        {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
        {b.title && <h2 className="v2-display mt-4 max-w-3xl text-4xl md:text-5xl">{b.title}</h2>}
        {b.lead && <p className="v2-lead mt-5">{b.lead}</p>}

        {/* Accreditation marks of the issuing laboratories. They are the real
            marks printed on the report letterheads, lifted from the PDFs
            themselves — CMA (China Metrology Accreditation), CNAS and the
            ILAC Mutual Recognition Arrangement, which is the mechanism
            through which an accredited lab's result is accepted outside
            China, including by EU importers. */}
        {b.marks && b.marks.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            {b.marks.map((m) => (
              <WebpImg
                key={m.src}
                src={m.src}
                alt={m.alt}
                loading="lazy"
                decoding="async"
                className="h-12 w-auto object-contain opacity-90"
              />
            ))}
            {b.marksNote && (
              <p className="max-w-md text-xs leading-relaxed text-v2-ink-500">{b.marksNote}</p>
            )}
          </div>
        )}

        <ul className="mt-12 grid gap-px overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-v2-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((it, i) => (
            <ProofCell key={i} item={it} />
          ))}
        </ul>

        {b.cta && (
          <div className="mt-8">
            <Btn cta={b.cta} />
          </div>
        )}
      </div>
    </section>
  );
}

function ProofCell({ item }: { item: ProofItem }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        {item.label ? (
          <h3 className="text-base font-semibold text-v2-ink-900">{item.label}</h3>
        ) : (
          <span className="text-base font-semibold text-v2-ink-900" />
        )}
        {item.href && (
          <span aria-hidden className="mt-0.5 shrink-0 text-v2-ink-400 transition-transform duration-200 group-hover:translate-x-0.5">
            &rarr;
          </span>
        )}
      </div>
      {item.detail && <p className="mt-2.5 text-sm leading-relaxed text-v2-ink-500">{item.detail}</p>}
      {item.href && <p className="mt-4 text-xs font-medium text-v2-accent-700">Download report</p>}
    </>
  );

  if (item.href) {
    return (
      <li className="el-spotlight el-lift" data-ptr="tilt">
        <a href={item.href} className="block p-6">
          {inner}
        </a>
      </li>
    );
  }
  return <li className="el-spotlight bg-white p-6">{inner}</li>;
}

function SplitView({ b }: { b: SplitBlock }) {
  const dark = b.background === 'dark';
  const soft = b.background === 'soft';
  const mediaFirst = b.mediaSide !== 'right';

  return (
    <section className={`v3-section ${dark ? 'v3-band-dark' : soft ? 'bg-v2-ink-050' : ''}`}>
      <div className="v2-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {mediaFirst ? (
            <>
              <MediaPane b={b} dark={dark} />
              <CopyPane b={b} dark={dark} />
            </>
          ) : (
            <>
              <CopyPane b={b} dark={dark} />
              <MediaPane b={b} dark={dark} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function MediaPane({ b, dark }: { b: SplitBlock; dark: boolean }) {
  if (!b.image) return <div className={dark ? '' : ''} />;
  return (
    <div className={`overflow-hidden rounded-v2-lg ${dark ? 'border border-white/10' : 'border border-v2-ink-200'}`}>
      <Img media={b.image} className="aspect-[4/3] w-full" />
    </div>
  );
}

function CopyPane({ b, dark }: { b: SplitBlock; dark: boolean }) {
  return (
    <div>
      {b.eyebrow && <p className={`v2-eyebrow ${dark ? 'v2-eyebrow--light' : ''}`}>{b.eyebrow}</p>}
      {b.title && (
        <h2 className={`v2-display mt-4 text-3xl md:text-[2.75rem] ${dark ? 'v2-display--light' : ''}`}>{b.title}</h2>
      )}
      {b.body && (
        <p className={`mt-5 text-[1.0625rem] leading-[1.7] ${dark ? 'text-white/85' : 'text-v2-ink-500'}`}>{b.body}</p>
      )}
      {b.bullets && b.bullets.length > 0 && (
        <ul className="mt-7 space-y-3">
          {b.bullets.map((x, i) => (
            <li key={i} className={`flex gap-3 text-[0.9375rem] ${dark ? 'text-white/85' : 'text-v2-ink-600'}`}>
              <span
                aria-hidden
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dark ? 'bg-v2-accent-500' : 'bg-v2-accent-600'}`}
              />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      )}
      {b.cta && (
        <div className="mt-9">
          <Btn cta={b.cta} light={dark} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Q2 —Catalogue                                                      */
/* ------------------------------------------------------------------ */

function ProductGridView({ b }: { b: ProductGridBlock }) {
  return (
    <section className="v2-section bg-v2-ink-050">
      <div className="v2-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
            {b.title && <h2 className="v2-display mt-4 text-4xl md:text-5xl">{b.title}</h2>}
            {b.lead && <p className="v2-lead mt-5">{b.lead}</p>}
          </div>
          {b.cta && <Btn cta={b.cta} />}
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {b.items.map((p) => (
            <li key={p.slug}>
              <a
                href={p.href}
                className="group flex h-full flex-col overflow-hidden rounded-v2-md border border-v2-ink-200 bg-white transition-all duration-200 hover:border-v2-ink-900 hover:shadow-v2-md"
              >
                <div className="aspect-square overflow-hidden bg-v2-ink-050">
                  {p.image ? (
                    <Img
                      media={p.image}
                      className="h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    // Placeholder reserves the box so the grid never reflows
                    // while the real product photography is being sourced.
                    <div className="flex h-full w-full items-center justify-center p-7">
                      <span className="text-center text-xs leading-relaxed text-v2-ink-300">
                        Photo pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col border-t border-v2-ink-100 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-v2-accent-700">
                    {p.line}
                  </p>
                  <h3 className="mt-2 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">{p.name}</h3>
                  {p.size && <p className="mt-1 text-xs text-v2-ink-400">{p.size}</p>}
                  {p.blurb && <p className="mt-3 flex-1 text-sm leading-relaxed text-v2-ink-500">{p.blurb}</p>}
                  {p.badges && p.badges.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.badges.map((x, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-v2-accent-100 bg-v2-accent-050 px-2.5 py-0.5 text-[11px] font-medium text-v2-accent-800"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-ink-900">
                    View spec
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Q3 —Capacity                                                       */
/* ------------------------------------------------------------------ */

function MetricBandView({ b }: { b: MetricBandBlock }) {
  // v3: figures read as a hairline table rather than a row of loose stats, and
  // the green is spent on the numbers only — the labels stay neutral.
  return (
    <section className="v3-section v3-band-dark">
      <div className="v2-container">
        {b.eyebrow || b.title ? (
          <V3Head dark title={b.title ?? ''} sub={b.eyebrow} />
        ) : null}
        <div className="mt-14">
          <V3DuoGrid dark columns={4} items={b.metrics.map((m) => ({ label: m.label, value: m.value, note: m.note }))} />
        </div>
        {b.note && <p className="v3-meta mt-10">{b.note}</p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Q4 —Process                                                        */
/* ------------------------------------------------------------------ */

function ProcessView({ b }: { b: ProcessBlock }) {
  // Process is service content — it takes the dark band under the v3 rule.
  return (
    <section className="v3-section v3-band-dark">
      <div className="v2-container">
        <ProcessTrack
          dark
          eyebrow={b.eyebrow}
          title={b.title}
          lead={b.lead}
          steps={b.steps}
        />
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Q5 —Conversion                                                     */
/* ------------------------------------------------------------------ */

function CtaBandView({ b }: { b: CtaBandBlock }) {
  return (
    /* `on-dark` — the band is a dark surface and the title inside it is a
       plain <h2>. globals.css carries an UNLAYERED `h1,h2,h3,h4 { color: … }`
       rule, and unlayered declarations outrank every cascade layer, so
       `text-white` on a heading lost and the title rendered ink-deep on
       teal. `.on-dark` restores white without touching the legacy sheets. */
    <section className="on-dark bg-v2-accent-600 py-16 md:py-20">
      <div className="v2-container">
        {/*
          THE ROW — three parts, and it has to survive every width.

          WHAT WAS BROKEN. The figure block and the button group were both
          `shrink-0`, and the figure was set at `clamp(3.5rem, 9vw, 6.5rem)`
          — 104px at 1280. "1 business day" at 104px is 707px wide, so the
          row needed 955 + 32 + 99 + 32 + 282 = 1400px inside a 1169px
          container. The middle text column was squeezed to its min-content
          width — 99px, two or three letters a line — and the buttons were
          pushed to x=1158..1440, which is what drew the horizontal
          scrollbar on the home page. The figure itself was still on screen,
          but centred in a 668px-tall row, so it sat far below the fold.

          WHAT IT IS NOW.
            - the figure gets a fixed column, so it can never eat the row;
            - the text column may shrink, but never below a readable floor,
              and it takes whatever room is left over;
            - the row WRAPS, so when the buttons do not fit they move to a
              line of their own instead of off the edge of the page.
        */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-10">
          {/*
            The one big number, on the left, with the band around it.

            It is the only place on the page where a figure is allowed to be
            this large, and that is the point: the rest of the site states
            the same numbers in the size a reader scans past. Here, at the
            end of the page, the reader is deciding.

            The size is set so that the longest figure the site actually
            uses — "1 business day" — fits the column on one line at every
            desktop width. A number that has to wrap is not a number.
          */}
          {b.figure && (
            <div className="flex min-w-0 flex-col items-start gap-2 lg:w-[30rem] lg:shrink-0 lg:pr-6">
              <span className="font-display text-[clamp(2.5rem,4.5vw,3.75rem)] font-semibold leading-[1.02] tracking-tight text-white">
                {b.figure}
              </span>
              {b.figureNote && (
                <span className="max-w-[18rem] text-sm leading-snug text-white/85">
                  {b.figureNote}
                </span>
              )}
            </div>
          )}
          <div className="min-w-0 lg:min-w-[20rem] lg:max-w-2xl lg:flex-1">
            {b.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">{b.eyebrow}</p>
            )}
            {b.title && <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{b.title}</h2>}
            {b.text && <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/85">{b.text}</p>}
            {b.note && <p className="mt-5 text-sm text-white/85">{b.note}</p>}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {b.primaryCta && <Btn cta={{ ...b.primaryCta, variant: 'light' }} light />}
            {b.secondaryCta && <Btn cta={b.secondaryCta} light />}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * RFQ capture.
 *
 * Three fields only. A B2B form that asks for company, country, phone,
 * annual volume and a message box gets abandoned —the buyer will talk on
 * WhatsApp instead, which is fine, but then we capture nothing.
 *
 * `action` is a real endpoint so the block degrades to a working native
 * form if the React island fails to hydrate.
 */
function RfqView({ b }: { b: RfqBlock }) {
  return (
    <section className="v2-section" id="rfq">
      <div className="v2-container">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
            {b.title && <h2 className="v2-display mt-4 text-4xl md:text-[2.75rem]">{b.title}</h2>}
            {b.lead && <p className="v2-lead mt-5">{b.lead}</p>}

            <div className="mt-8 space-y-3 border-t border-v2-ink-200 pt-8">
              {[
                { k: 'Response time', v: siteConfig.response.headline },
                { k: 'What you get back', v: 'Tiered pricing + sample plan' },
                { k: 'No obligation', v: 'No account required to ask' },
              ].map((x) => (
                <div key={x.k} className="flex justify-between gap-6 text-sm">
                  <span className="text-v2-ink-400">{x.k}</span>
                  <span className="text-right font-medium text-v2-ink-900">{x.v}</span>
                </div>
              ))}
            </div>

            {b.whatsappCta && (
              <div className="mt-8">
                <Btn cta={b.whatsappCta} />
              </div>
            )}
          </div>

          <form
            className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-7 md:p-9"
            method="POST"
            action={siteConfig.api.inquiryEndpoint}
          >
            <div className="space-y-6">
              <Field label="Product / project" required>
                <input
                  name="product"
                  required
                  placeholder="e.g. Pet deodorizing spray 350 mL, private label"
                  className="v2-input"
                  defaultValue={productLines(b.presetProducts ?? []).join(', ')}
                />
              </Field>

              <Field label="Estimated annual volume" required>
                <select name="volume" required defaultValue="" className="v2-input">
                  <option value="" disabled>
                    Select a range
                  </option>
                  <option>Under 50,000 units</option>
                  <option>50,000 –200,000 units</option>
                  <option>200,000 –500,000 units</option>
                  <option>Above 500,000 units</option>
                  <option>Not sure yet</option>
                </select>
              </Field>

              <Field label="How should we reply?" required>
                <input name="contact" required placeholder="Work email or WhatsApp number" className="v2-input" />
              </Field>

              <button
                type="submit"
                className="w-full rounded-v2-md bg-v2-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-v2-sm transition-colors hover:bg-v2-accent-700"
              >
                Request a quotation
              </button>

              <p className="text-center text-xs leading-relaxed text-v2-ink-400">
                We reply within one business day. Your details are used only to answer this enquiry.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
        {label}
        {required && <span className="ml-1 text-v2-signal-600">*</span>}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Escape hatch                                                        */
/* ------------------------------------------------------------------ */

/**
 * The SKU page prose layer.
 *
 * Rendered as a block so it can sit between the scene and the spec table —
 * where a buyer actually reads it — rather than being bolted to the end of
 * the page. The copy is derived from the product record; see
 * content/v2/product-copy.ts.
 */
/**
 * The name of the product line, in the buyer's words.
 *
 * WHY IT IS NOT THE CATEGORY, TITLE-CASED
 * This used to build the heading by title-casing the block's `category`, and
 * the category is the three-way COMPLIANCE grouping (`disinfection_odor_control`,
 * `cleansing_grooming`, `pet_nutrition`) - not the product line. So three line
 * pages printed a developer identifier at the reader:
 *
 *   "What is in the Disinfection_odor_control line"
 *   "What is in the Cleansing_grooming line"
 *   "What is in the Pet_nutrition line"
 *
 * Two things were wrong with it. The identifier is not English, and it names
 * the wrong thing: the line a buyer thinks in is "Deodorizing & Disinfecting",
 * which is a different grouping from the permit/colour grouping.
 *
 * The canonical name of a line lives in lib/product-routing.ts, which is the
 * one place a line is named - and which imports nothing, so this costs a
 * client bundle nothing.
 */
const LINE_NAME_BY_CATEGORY: Record<string, string> = {
  disinfection_odor_control: LINE_LABEL.deodorizing_disinfection,
  cleansing_grooming: LINE_LABEL.grooming_care,
  outdoor_protection: LINE_LABEL.outdoor_protection,
  pet_nutrition: LINE_LABEL.pet_nutrition,
};

function CategoryDepthView({ b }: { b: CategoryDepthBlock }) {
  const lineName = LINE_NAME_BY_CATEGORY[b.category] ?? b.category;
  return <CategoryDepth category={b.category} lineName={lineName} />;
}
/**
 * The two rows that concern THIS SKU, taken from the same file the market pages
 * render. If the judgement ever changes, it changes in one place.
 *
 * Rendered as a definition list rather than prose so a buyer can quote the
 * verdict and the instrument behind it without editing anything out.
 */
function MarketFitView({ b }: { b: MarketFitBlock }) {
  const p = getProductById(b.productId);
  const row = SKU_MARKET[b.productId];
  if (!p || !row) return null;

  const markets: { key: 'us' | 'eu'; entry: (typeof row)['us'] }[] = [
    { key: 'us', entry: row.us },
    { key: 'eu', entry: row.eu },
  ];

  return (
    <section className="bg-white py-12 md:py-16" id="market-fit">
      <div className="v2-container">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">Before you buy</p>
        <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-v2-ink-900 md:text-3xl">
          What this SKU may say, in the two markets that matter most.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-v2-ink-600">
          Our own page above says &ldquo;{row.claim}&rdquo;. That wording decides which regime the product falls under.
          The answer is recorded per SKU, and it is the same answer the two market pages carry.
        </p>

        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          {markets.map(({ key, entry }) => (
            <div key={key} className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-5">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-v2-ink-900">{MARKET_PAGE[key].name}</span>
                <span className="shrink-0 text-xs font-semibold text-v2-accent-700">{MARKET_LABEL[entry.position]}</span>
              </dt>
              <dd className="mt-3 text-xs uppercase tracking-[0.12em] text-v2-ink-500">{entry.basis}</dd>
              <dd className="mt-2 text-sm leading-relaxed text-v2-ink-700">{entry.note}</dd>
              <dd className="mt-3">
                <a
                  href={MARKET_PAGE[key].href}
                  className="text-xs font-medium text-v2-ink-900 underline decoration-v2-ink-300 underline-offset-2"
                >
                  All twenty SKUs for {MARKET_PAGE[key].name} ↗
                </a>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-v2-ink-500">
          The safety data sheet for this formula is on file and travels with the consignment. The classification and
          the label remain the job of the party placing the product on the market — normally you, or your EU
          economic operator.
        </p>
      </div>
    </section>
  );
}

function ProductDepthView({ b }: { b: ProductDepthBlock }) {
  const p = getProductById(b.productId);
  if (!p) return null;
  // Only the prose layer. The FAQ below is the page's existing faq block,
  // which already feeds the FAQPage schema — rendering a second set here
  // would double every question on the page.
  // The prose layer, then the use-and-safety questions as their own block.
  // They are separate from the procurement FAQ further down the page:
  // different questions, different audience moment, different anchor id.
  return (
    <>
      <ProductDepth p={p} />
      <ProductFAQ p={p} />
    </>
  );
}
function RichView({ b }: { b: RichBlock }) {
  return (
    <section className="v2-section">
      <div className={b.width === 'narrow' ? 'v2-container-narrow' : 'v2-container'}>
        {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
        {b.title && (
          <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">{b.title}</h2>
        )}
        {b.lead && <p className="v2-lead mt-4 max-w-2xl">{b.lead}</p>}
        {/* Reuses the vetted legacy-prose stylesheet from globals.css so
            migrated copy keeps identical typography to the shipped site. */}
        <div
          className={`legacy-prose${b.title || b.lead || b.eyebrow ? ' mt-10' : ''}`}
          dangerouslySetInnerHTML={{ __html: b.html }}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Q1 — feature grid and timeline                                      */
/* ------------------------------------------------------------------ */

/**
 * THE REGISTRATIONS, ONE CARD EACH.
 *
 * The number is the reason the reader is here, so it is set on its own and
 * the facts are in rows under it. The limit - what the registration does
 * NOT cover - gets its own line in the accent colour, because that is the
 * line a buyer is actually checking, and it is the one that must not be
 * buried in a paragraph.
 *
 * The link at the foot of the card is the register itself: the card is a
 * link card, and the place where the fact can be checked is part of it.
 */
function RecordCardsView({ b }: { b: RecordCardsBlock }) {
  return (
    <section className="v2-section">
      <div className="v2-container">
        {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
        {b.title && (
          <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">{b.title}</h2>
        )}
        {b.lead && <p className="v2-lead mt-4 max-w-2xl">{b.lead}</p>}

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((it, i) => (
            <li
              key={i}
              className="el-spotlight el-lift flex flex-col rounded-v2-lg border border-v2-ink-200 bg-white p-6"
            >
              {it.pill && (
                <span className="inline-flex w-fit items-center rounded-full bg-v2-accent-050 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-v2-accent-700 ring-1 ring-v2-accent-100">
                  {it.pill}
                </span>
              )}

              <h3 className="mt-4 text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                {it.title}
              </h3>
              {it.subtitle && (
                <p className="mt-1 text-sm leading-snug text-v2-ink-500">{it.subtitle}</p>
              )}

              {it.number && (
                <p className="mt-4 break-words font-mono text-[0.9375rem] font-semibold tracking-tight text-v2-accent-700">
                  {it.number}
                </p>
              )}

              <dl className="mt-5 space-y-3 border-t border-v2-ink-100 pt-5">
                {it.rows.map((r, j) => (
                  <div key={j} className="grid gap-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
                      {r.label}
                    </dt>
                    <dd className="text-xs leading-relaxed text-v2-ink-700">{r.val}</dd>
                  </div>
                ))}
              </dl>

              {it.limit && (
                <p className="mt-5 border-l-2 border-v2-accent-300 pl-3 text-xs leading-relaxed text-v2-ink-600">
                  {it.limit}
                </p>
              )}

              {it.link && (
                <a
                  href={it.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 text-xs font-semibold tracking-tight text-v2-accent-700 underline decoration-v2-accent-300 underline-offset-4 hover:text-v2-accent-800"
                >
                  {it.link.label}
                  <span aria-hidden>&rarr;</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        {b.note && (
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-v2-ink-500">{b.note}</p>
        )}
        {b.noteCta && (
          <p className="mt-3 text-xs font-semibold text-v2-accent-700">
            <a href={b.noteCta.href} className="underline underline-offset-4">
              {b.noteCta.label} &rarr;
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * A grid of titled items.
 *
 * The legacy equivalent was a `pp-grid` of feature cards, which arrived as
 * one HTML string and therefore rendered as a stack of full-width boxes.
 * Carrying the items as data is what makes it a grid again.
 */
function FeatureGridView({ b }: { b: FeatureGridBlock }) {
  const cols =
    b.cols === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : b.cols === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="v2-section">
      <div className="v2-container">
        {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
        {b.title && (
          <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">{b.title}</h2>
        )}
        {b.lead && <p className="v2-lead mt-4 max-w-2xl">{b.lead}</p>}

        <ul className={`mt-12 grid gap-5 ${cols}`}>
          {b.items.map((it, i) => (
            <li
              key={i}
              className="el-spotlight el-lift flex flex-col rounded-v2-lg border border-v2-ink-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-3">
                {it.pill ? (
                  <span className="inline-flex items-center rounded-full bg-v2-accent-050 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-v2-accent-700 ring-1 ring-v2-accent-100">
                    {it.pill}
                  </span>
                ) : it.no ? (
                  <span className="font-mono text-xs font-semibold tracking-wide text-v2-accent-700">
                    {it.no}
                  </span>
                ) : (
                  <span />
                )}
                {it.icon && (
                  <span
                    aria-hidden
                    className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-v2-md bg-v2-ink-050 text-v2-ink-600 ring-1 ring-v2-ink-200"
                  >
                    <Icon name={it.icon} size={19} />
                  </span>
                )}
              </div>

              {it.no && it.pill && (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-v2-ink-500">
                  {it.no}
                </p>
              )}

              <h3 className="mt-4 text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                {it.title}
              </h3>
              {it.body && (
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-v2-ink-500">{it.body}</p>
              )}
              {it.meta && (
                <p className="mt-4 border-t border-v2-ink-100 pt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-v2-ink-400">
                  {it.meta}
                </p>
              )}
            </li>
          ))}
        </ul>

        {b.note && (
          <p className="mt-10 text-center text-sm leading-relaxed text-v2-ink-500">
            {b.note}
            {b.noteCta && (
              <>
                {' '}
                <a href={b.noteCta.href} className="v3-link font-semibold text-v2-accent-700">
                  {b.noteCta.label} <span aria-hidden>&rarr;</span>
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * A dated sequence beside the narrative that frames it.
 *
 * Years carry the argument on a milestones section, so they get a rail and
 * a marker rather than a card. The framing column stays on the left because
 * that is how the legacy page read, and the order is what a reader expects.
 */
function TimelineView({ b }: { b: TimelineBlock }) {
  return (
    <section className="v2-section">
      <div className="v2-container">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
            {b.title && (
              <h2 className="v2-display mt-4 text-3xl md:text-4xl">{b.title}</h2>
            )}
            {b.intro?.map((p, i) => (
              <p
                key={i}
                className="mt-5 text-[1.0625rem] leading-relaxed text-v2-ink-600"
              >
                {p}
              </p>
            ))}
            {b.pills && b.pills.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {b.pills.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-v2-ink-200 bg-white px-3 py-1 text-xs font-medium text-v2-ink-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <ol className="relative border-l border-v2-ink-200 pl-9">
            {b.items.map((it, i) => (
              <li key={i} className="relative pb-9 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[2.4375rem] top-1.5 h-2.5 w-2.5 rounded-full bg-v2-accent-600 ring-4 ring-white"
                />
                <p className="font-mono text-xs font-semibold tracking-[0.12em] text-v2-accent-700">
                  {it.year}
                </p>
                <p className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                  {it.title}
                </p>
                {it.desc && (
                  <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{it.desc}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Q2 —Range builder (the one genuinely interactive block)            */
/* ------------------------------------------------------------------ */

function ComposerView({ b }: { b: ComposerBlock }) {
  return (
    <section className="v2-section bg-v2-ink-050" id="composer">
      <div className="v2-container">
        {b.eyebrow && <p className="v2-eyebrow">{b.eyebrow}</p>}
        {b.title && <h2 className="v2-display mt-4 max-w-3xl text-4xl md:text-5xl">{b.title}</h2>}
        {b.lead && <p className="v2-lead mt-5">{b.lead}</p>}

        <div className="mt-12">
          <SkuComposer maxPick={b.maxPick ?? 6} />
        </div>

        {/*
          Crawlable catalogue. The composer above is a client island; without
          this list a crawler —or a buyer with JS disabled —sees no SKU links
          at all. Two elements, one source of truth, both must ship.
        */}
        {b.skuIndex && b.skuIndex.length > 0 && (
          <details className="mt-12 border-t border-v2-ink-200 pt-8">
            <summary className="cursor-pointer text-sm font-semibold text-v2-ink-600">
              Full SKU index ({b.skuIndex.length} products)
            </summary>
            <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {b.skuIndex.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    className="text-sm text-v2-ink-500 underline decoration-v2-ink-200 underline-offset-4 hover:text-v2-accent-700"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Spec + related rail                                                 */
/* ------------------------------------------------------------------ */

function SceneView({ b }: { b: SceneBlock }) {
  // v3: the product/pet composition is the emotional argument on this page —
  // it takes the dark band so the photo and the pet read as one scene rather
  // than as two panels floating on white.
  return (
    <section className="v3-section v3-band-dark">
      <div className="v2-container">
        <V3Head dark title={b.title ?? ''} sub={b.lead ?? b.eyebrow} />
        <div className="mt-14">
          {/* No product image means no scene: an <img> with an empty src is a
              broken-image icon on a product page. */}
          {b.product ? (
            <ProductScene
              product={b.product}
              productAlt={b.productAlt}
              pet={b.pet}
              petAlt={b.petAlt}
              audience={b.audience}
              claim={b.claim}
              claimIcon={b.claimIcon ?? 'check'}
              tone={b.tone ?? 'light'}
              petCaption={b.petCaption}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SpecTableView({ b }: { b: SpecTableBlock }) {
  // v3: the specification is a table of facts, so it renders as one — hairline
  // rows rather than floating cards. A buyer scanning for HS code or carton
  // dimensions reads it as a document, which is what it is.
  return (
    <section className="v3-section">
      <div className="v2-container">
        <V3Head title={b.title ?? ''} sub={b.eyebrow} />
        <dl className="mt-14 border-t border-v2-ink-100">
          {b.specs.map((s) => (
            <div
              key={s.key}
              className="grid grid-cols-1 gap-1 border-b border-v2-ink-100 py-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8"
            >
              <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
                {s.key}
              </dt>
              <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-800">{s.val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function RelatedView({ b }: { b: RelatedBlock }) {
  return (
    <section className="v3-section bg-v2-ink-050">
      <div className="v2-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <V3Head start title={b.title ?? ''} sub={b.eyebrow} />
          {b.cta && <Btn cta={b.cta} />}
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {b.items.map((it) => (
            <li key={it.slug} className="el-spotlight el-lift" data-ptr="tilt">
              <a
                href={it.href}
                className="group flex h-full flex-col overflow-hidden rounded-v2-md border border-v2-ink-200 bg-white"
              >
                <div className="aspect-square overflow-hidden bg-white">
                  {it.image ? (
                    <Img
                      media={it.image}
                      className="h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-7">
                      <span className="text-center text-xs text-v2-ink-300">Photo pending</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col border-t border-v2-ink-100 p-5">
                  {it.line && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-v2-accent-700">
                      {it.line}
                    </p>
                  )}
                  <h3 className="mt-2 flex-1 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                    {it.name}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-ink-900">
                    View spec <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

/**
 * A schema.org graph that renders nothing but its JSON-LD.
 *
 * The script is server-rendered, so a crawler that never runs JavaScript
 * still reads it. The nodes travel with the content that produced them —
 * a page cannot end up describing a question it does not show.
 */
function SeoView({ b }: { b: SeoBlock }) {
  if (!b.graph.length) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': b.graph }),
      }}
    />
  );
}

export function V2BlockView({ block }: { block: V2Block }) {
  switch (block.kind) {
    case 'hero':
      return <HeroView b={block} />;
    case 'proofBar':
      return <ProofBarView b={block} />;
    case 'proofGrid':
      return <ProofGridView b={block} />;
    case 'metricBand':
      return <MetricBandView b={block} />;
    case 'productGrid':
      return <ProductGridView b={block} />;
    case 'composer':
      return <ComposerView b={block} />;
    case 'scene':
      return <SceneView b={block} />;
    case 'callout':
      return <CalloutView b={block} />;
    case 'faq':
      return <FaqView b={block} />;
    case 'reviews':
      return <ReviewsView b={block} />;
    case 'seo':
      return <SeoView b={block} />;
    case 'gallery':
      return <GalleryView b={block} />;
    case 'specTable':
      return <SpecTableView b={block} />;
    case 'related':
      return <RelatedView b={block} />;
    case 'split':
      return <SplitView b={block} />;
    case 'process':
      return <ProcessView b={block} />;
    case 'featureGrid':
      return <FeatureGridView b={block} />;
    case 'recordCards':
      return <RecordCardsView b={block} />;
    case 'timeline':
      return <TimelineView b={block} />;
    case 'ctaBand':
      return <CtaBandView b={block} />;
    case 'rfq':
      return <RfqView b={block} />;
    case 'rich':
      return <RichView b={block} />
    case 'productDepth':
      return <ProductDepthView b={block} />;
    case 'categoryDepth':
      return <CategoryDepthView b={block} />;
    case 'marketFit':
      return <MarketFitView b={block} />;
    default:
      return null;
  }
}

export function V2Page({ blocks }: { blocks: V2Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <V2BlockView key={i} block={b} />
      ))}
    </>
  );
}
import { imageSize } from '@/components/v2/imageSize';
import type { Block, Card, HeroContent, Action, TableData, TimelineItem, PhotoSlot } from '@/lib/legacy-types';
import { siteConfig } from '@/lib/shenhe.config';
import {
  Button,
  CardShell,
  Container,
  DataTable,
  Eyebrow,
  Pill,
  RichText,
  Section,
  SectionTitle,
  StatNumber,
} from '@/components/ui';

const waHref = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
  "Hi, I'd like to discuss an OEM/ODM project"
)}`;

/**
 * Renders one extracted legacy block.
 *
 * Block types come from `legacy2json.py`. Anything unrecognised degrades to
 * `richtext` (render the original markup) rather than disappearing — a silent
 * drop would be an SEO/content regression, which is the one thing this
 * migration must not do.
 */
export function BlockRenderer({ block }: { block: Block }) {
  const bg = block.bg === 'bg' ? 'bg' : block.bg === 'soft' ? 'soft' : 'plain';
  const cls = block.classes ?? '';

  switch (block.type) {
    case 'hero':
      return (
        <Section bg="soft" tight>
          <Hero c={block.content as HeroContent} />
        </Section>
      );

    case 'heroSimple':
      return (
        <Section bg="soft" tight>
          <Hero c={block.content as HeroContent} simple />
        </Section>
      );

    case 'timeline':
      return (
        <Section bg={bg}>
          <Container>
            <Timeline items={(block.content as TimelineItem[]) ?? []} />
          </Container>
        </Section>
      );

    case 'process':
      return (
        <Section bg={bg}>
          <Container>
            <RichText html={(block.content as any)?.html ?? ''} />
          </Container>
        </Section>
      );

    case 'photoSlots':
      return (
        <Section bg={bg}>
          <Container>
            <PhotoSlots slots={(block.content as PhotoSlot[]) ?? []} />
          </Container>
        </Section>
      );

    case 'cta':
      return <Cta c={block.content as any} />;

    case 'priceTableFlagged':
      // B2B quote-only policy: legacy leaked tier prices here. Rendered as an
      // explicit "quote on request" panel instead of the numbers.
      return (
        <Section bg="soft">
          <Container>
            <CardShell featured>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{siteConfig.pricing.display}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{siteConfig.pricing.policy}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/contact.html" variant="primary">
                  Request a quotation
                </Button>
                <Button href={waHref} variant="ghost" external>
                  WhatsApp us
                </Button>
              </div>
            </CardShell>
          </Container>
        </Section>
      );

    case 'table':
      return (
        <Section bg={bg}>
          <Container>
            <TableBlock b={block} />
          </Container>
        </Section>
      );

    case 'cardGrid': {
      const cards = (block.content as any)?.cards as Card[];
      const cols = (block.content as any)?.cols ?? 3;
      const gridCols =
        cols >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
      return (
        <Section bg={bg}>
          <Container>
            {/* section title may live inside the first card's markup on legacy */}
            <div className={`grid gap-6 ${gridCols}`}>
              {(cards ?? []).map((c, i) => (
                <CardView key={i} c={c} />
              ))}
            </div>
          </Container>
        </Section>
      );
    }

    case 'statGrid':
      return null;

    case 'prose': {
      const c = block.content as any;
      return (
        <Section bg={bg}>
          <Container>
            {c?.title && <SectionTitle title={c.title} sub={c?.sub} align="center" />}
            <RichText html={c?.html ?? ''} className="mt-8" />
          </Container>
        </Section>
      );
    }

    case 'wizard':
    case 'richtext':
    default:
      return (
        <Section bg={bg}>
          <Container narrow={cls.includes('container--narrow')}>
            <RichText html={(block.content as any)?.html ?? (block.content as any)?.raw ?? ''} />
          </Container>
        </Section>
      );
  }
}

function Hero({ c, simple }: { c: HeroContent; simple?: boolean }) {
  if (c?.html) {
    return <RichText html={c.html} />;
  }
  return (
    <div className="grid items-center gap-10 py-8 md:grid-cols-2 md:py-12">
      <div>
        {c.eyebrow && <Eyebrow>{c.eyebrow}</Eyebrow>}
        {c.title && (
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            {c.title}
            {c.titleAccent && <span className="text-brand"> {c.titleAccent}</span>}
          </h1>
        )}
        {c.lead && <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{c.lead}</p>}
        {(c.answer || c.boundary) && (
          <div className="mt-6 max-w-2xl border-l-2 border-brand/60 pl-5">
            {c.answer && <p className="text-[1.05rem] leading-relaxed text-ink">{c.answer}</p>}
            {c.boundary && <p className="mt-3 text-sm leading-relaxed text-muted">{c.boundary}</p>}
          </div>
        )}
        {c.actions.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {c.actions.map((a: Action, i) => (
              <Button key={i} href={a.href} variant={a.variant}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className={simple ? 'hidden' : ''}>
        {c.image?.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image.src}
            alt={c.image.alt ?? ''}
            width={imageSize(c.image.src).width}
            height={imageSize(c.image.src).height}
            className="w-full rounded-2xl object-cover"
          />
        )}
      </div>

      {c.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-6 border-t border-line pt-8 md:col-span-2 md:grid-cols-5">
          {c.stats.map((s, i) => {
            // data-value stats (ring metrics) must render the REAL number
            // server-side — legacy shipped a literal "0%" and animated it
            // client-side, so no-JS crawlers read 0%.
            const value = s.value != null && !/^\d+(\.\d+)?$/.test(String(s.value)) ? String(s.value) : formatRing(s);
            return (
              <div key={i} className="text-center">
                <div className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">{value}</div>
                {s.label && <div className="mt-1 text-xs text-muted">{s.label}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRing(s: { value?: string | null; unit?: string | null }): string {
  const v = Number(s.value);
  if (!Number.isFinite(v)) return '';
  const label = v >= 99.99 ? `>${v}` : v;
  return `${label}${s.unit ?? '%'}`;
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative border-l border-line">
      {items.map((t, i) => (
        <li key={i} className="relative pb-10 pl-8 last:pb-0">
          <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-brand" />
          <div className="text-sm font-semibold tracking-wide text-brand">{t.year}</div>
          <h3 className="mt-1 text-lg font-semibold text-ink">{t.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.desc}</p>
        </li>
      ))}
    </ol>
  );
}

function PhotoSlots({ slots }: { slots: PhotoSlot[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((s, i) => (
        <figure key={i} className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="relative aspect-[3/2] bg-ink">
            {s.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.img}
                alt={s.label}
                width={imageSize(s.img).width}
                height={imageSize(s.img).height}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
            {/* Solid dark band, not a gradient — the UI-5 fix: captions must stay
                readable regardless of how bright the photo is. */}
            <div className="absolute inset-x-0 bottom-0 bg-[rgba(15,23,42,0.94)] px-4 py-3">
              <p className="text-sm font-semibold leading-tight text-white">{s.label}</p>
              {s.caption && <p className="mt-1 text-xs leading-relaxed text-white/80">{s.caption}</p>}
            </div>
          </div>
          {s.filename && (
            <figcaption className="flex items-center justify-between gap-2 px-4 py-2 text-[11px] text-muted">
              <span className="truncate">{s.filename}</span>
              <span className="shrink-0">{s.size}</span>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function Cta({ c }: { c: any }) {
  if (c?.html) return <RichText html={c.html} />;
  return (
    <Section bg="dark">
      <Container>
        <div className="text-center">
          {c?.eyebrow && <Eyebrow light>{c.eyebrow}</Eyebrow>}
          {c?.title && <h2 className="mt-3 text-3xl font-semibold text-white">{c.title}</h2>}
          {c?.text && <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">{c.text}</p>}
          {c?.actions?.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {c.actions.map((a: Action, i: number) => (
                <Button key={i} href={a.href} variant={a.variant}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

function TableBlock({ b }: { b: Block }) {
  const c = b.content as TableData;
  if (c?.head || c?.rows) return <DataTable head={c.head ?? []} rows={c.rows ?? []} />;
  return <RichText html={(c as any)?.html ?? ''} />;
}

function CardView({ c }: { c: Card }) {
  if (c.kind === 'productCard') {
    return (
      <a href={c.href ?? '#'} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
        <div className="aspect-[4/3] bg-surface-soft">
          {c.image?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image.src}
              alt={c.image.alt ?? c.title ?? ''}
              width={imageSize(c.image.src).width}
              height={imageSize(c.image.src).height}
              className="h-full w-full object-contain p-6"
              loading="lazy"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          {c.category && <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">{c.category}</div>}
          <h3 className="mt-2 text-base font-semibold text-ink">{c.title}</h3>
          {c.size && <div className="mt-1 text-xs text-muted">{c.size}</div>}
          {c.desc && <p className="mt-3 flex-1 text-sm text-muted">{c.desc}</p>}
          <div className="mt-4 text-sm font-semibold text-brand">{c.cta ?? 'View details'} →</div>
        </div>
      </a>
    );
  }

  if (c.html) {
    return <RichText html={c.html} />;
  }

  return (
    <CardShell featured={c.tag != null}>
      {(c.no || c.num) && (
        <div className="mb-3 text-sm font-semibold text-brand">{c.no ?? c.num}</div>
      )}
      {c.tag && <Pill>{c.tag}</Pill>}
      {c.stat && <div className="text-3xl font-semibold tracking-tight text-brand">{c.stat}</div>}
      {c.title && <h3 className="mt-3 text-lg font-semibold text-ink">{c.title}</h3>}
      {c.desc && <p className="mt-3 text-sm leading-relaxed text-muted">{c.desc}</p>}
      {c.meta && <p className="mt-3 text-xs text-muted">{c.meta}</p>}
      {c.count && <div className="mt-2 text-xs font-semibold text-brand">{c.count}</div>}
      {c.metaRows && c.metaRows.length > 0 && (
        <dl className="mt-4 space-y-2 border-t border-line pt-4">
          {c.metaRows.map((r, i) => (
            <div key={i} className="flex justify-between gap-4 text-xs">
              <dt className="text-muted">{r.key}</dt>
              <dd className="text-right font-medium text-ink">{r.val}</dd>
            </div>
          ))}
        </dl>
      )}
    </CardShell>
  );
}

export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} />
      ))}
    </>
  );
}

export { StatNumber, waHref };
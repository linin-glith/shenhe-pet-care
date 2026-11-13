import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/v2/Icon';

/**
 * Typographic component layer.
 *
 * THE PROBLEM THIS SOLVES
 * Every piece of copy on the site was set as bare text inside a div. A metric
 * was a number and a label with no relationship drawn between them; a feature
 * was a paragraph in a bordered box; a process step was a numbered paragraph.
 * The result scans as a wall of words — legible, but structured like a
 * document rather than an interface.
 *
 * WHAT A COMPONENT ADDS
 * Each of these draws a relationship that bare type cannot:
 *   StatBlock   — a baseline rule ties the figure to its unit and qualifier,
 *                 so the number reads as a MEASUREMENT rather than a caption
 *   FeatureCard — an icon gives the reader a visual anchor before they read
 *   ProcessTrack— a connector line makes sequence obvious without "step 1"
 *   SpecList    — a two-column rhythm makes 15 rows scannable in seconds
 *   Callout     — an aside gets its own voice instead of blending into prose
 *
 * All of them stay text-first: no component hides information behind an
 * interaction, and every value is present in the DOM for crawlers.
 */

/* ------------------------------------------------------------------ */
/* StatBlock                                                           */
/* ------------------------------------------------------------------ */

/**
 * A single measurement, designed.
 *
 * The baseline rule is doing the real work: it anchors the figure to its unit
 * and note, so a reader's eye travels figure -> rule -> qualifier as one
 * object. Without it, a number floating above two lines of small grey type is
 * just decoration with a number in it.
 */
export function StatBlock({
  value,
  unit,
  label,
  note,
  tone = 'default',
  size = 'md',
}: {
  value: string;
  /** Unit suffix set smaller and tighter than the figure, e.g. "m²", "%". */
  unit?: string;
  label: string;
  note?: string;
  tone?: 'default' | 'accent' | 'light';
  size?: 'sm' | 'md' | 'lg';
}) {
  /*
   * The figure steps down below 640 px.
   *
   * Two columns on a 390 px screen leave about 159 px each, and at 36 px the
   * value "25–40 d" broke after the dash: the unit ended up alone on a second
   * line, which reads as a typo rather than a figure. The same size was fine on
   * desktop, so the step is mobile-only and the desktop rendering is untouched.
   */
  const figure =
    size === 'lg'
      ? 'text-[2.25rem] sm:text-[3.25rem]'
      : size === 'sm'
        ? 'text-xl sm:text-2xl'
        : 'text-[1.75rem] sm:text-[2.25rem]';

  const toneCls =
    tone === 'light'
      ? 'text-white'
      : tone === 'accent'
        ? 'text-v2-accent-700'
        : 'text-v2-ink-900';

  const rule = tone === 'light' ? 'bg-white/25' : 'bg-v2-ink-900';

  return (
    <div className="relative pl-4">
      {/* the anchor rule */}
      <span
        aria-hidden
        className={`absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[2px] ${rule}`}
      />
      <div className={`font-display font-semibold leading-none tracking-[-0.04em] tabular-nums ${figure} ${toneCls}`}>
        {value}
        {unit && <span className="ml-1 text-[0.42em] font-medium tracking-normal">{unit}</span>}
      </div>
      <div
        className={`mt-3 text-[0.8125rem] font-semibold ${
          tone === 'light' ? 'text-white/80' : 'text-v2-ink-700'
        }`}
      >
        {label}
      </div>
      {note && (
        <div className={`mt-1 text-xs ${tone === 'light' ? 'text-white/50' : 'text-v2-ink-400'}`}>
          {note}
        </div>
      )}
    </div>
  );
}

/** Grid wrapper so a row of stats shares one rhythm. */
export function StatRow({
  items,
  tone = 'default',
  size = 'md',
  className = '',
}: {
  items: { value: string; unit?: string; label: string; note?: string }[];
  tone?: 'default' | 'accent' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {items.map((s, i) => (
        <div key={i}>
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <StatBlock {...s} tone={tone} size={size} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* FeatureCard                                                         */
/* ------------------------------------------------------------------ */

/**
 * Icon + claim + supporting line.
 *
 * The icon is not an ornament: it lets a buyer triage six claims in one pass
 * instead of reading all six. That only works if the icons differ
 * meaningfully, so `icon` is required rather than optional.
 */
export function FeatureCard({
  icon,
  title,
  body,
  meta,
  href,
}: {
  icon: IconName;
  title: string;
  body?: string;
  meta?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span
        aria-hidden
        className="inline-grid h-11 w-11 place-items-center rounded-v2-md bg-v2-accent-050 text-v2-accent-700 ring-1 ring-v2-accent-100 transition-colors duration-300 group-hover:bg-v2-accent-600 group-hover:text-white group-hover:ring-v2-accent-600"
      >
        <Icon name={icon} size={21} />
      </span>

      <h3 className="mt-5 text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">{title}</h3>

      {body && <p className="mt-2.5 text-sm leading-relaxed text-v2-ink-500">{body}</p>}

      {meta && (
        <p className="mt-4 border-t border-v2-ink-100 pt-3 text-xs font-medium text-v2-ink-400">{meta}</p>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="group block h-full rounded-v2-lg border border-v2-ink-200 bg-white p-6 transition-all duration-300 hover:border-v2-ink-900 hover:shadow-v2-md"
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="group h-full rounded-v2-lg border border-v2-ink-200 bg-white p-6">{inner}</div>
  );
}

/** Section wrapper that gives a card grid its own heading rhythm. */
export function FeatureGrid({
  eyebrow,
  title,
  lead,
  items,
  columns = 3,
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: { icon: IconName; title: string; body?: string; meta?: string; href?: string }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = columns === 4 ? 'lg:grid-cols-4' : columns === 2 ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div>
      {(eyebrow || title) && (
        <div className="max-w-2xl">
          {eyebrow && <p className="v2-eyebrow">{eyebrow}</p>}
          {title && <h2 className="v2-display mt-4 text-3xl md:text-4xl">{title}</h2>}
          {lead && <p className="v2-lead mt-4">{lead}</p>}
        </div>
      )}
      <ul className={`mt-12 grid gap-5 ${cols}`}>
        {items.map((f, i) => (
          <li key={i}>
            <FeatureCard {...f} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProcessTrack                                                        */
/* ------------------------------------------------------------------ */

/**
 * A sequence, drawn as a sequence.
 *
 * The connector removes the need for "Step 1 / Step 2" words — the line and
 * the ordinal already encode order, so the copy can be about the work instead
 * of about the numbering.
 */
export function ProcessTrack({
  eyebrow,
  title,
  lead,
  steps,
  dark = false,
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  steps: { no?: string; title: string; desc?: string }[];
  /**
   * Set on the dark service band. This is an explicit prop, not the `dark:`
   * Tailwind variant: that variant follows the OPERATING SYSTEM, and a band
   * that is dark on a light desktop is still dark on a dark desktop. Using
   * `dark:` here would make the step titles readable on one machine and
   * invisible on another.
   */
  dark?: boolean;
}) {
  const rule = dark ? 'bg-white/25' : 'bg-v2-ink-200';
  return (
    <div className="v3-track">
      {(eyebrow || title) && (
        <div className="max-w-2xl">
          {eyebrow && <p className={`v2-eyebrow ${dark ? 'v2-eyebrow--light' : ''}`}>{eyebrow}</p>}
          {title && (
            <h2 className={`v2-display mt-4 text-3xl md:text-4xl ${dark ? 'v2-display--light' : ''}`}>
              {title}
            </h2>
          )}
          {lead && <p className={`v2-lead mt-4 ${dark ? 'v2-lead--light' : ''}`}>{lead}</p>}
        </div>
      )}

      <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            {/* Connector: a rule to the right of the step, but ONLY when the
                next step is on the same row. Which row a step ends on depends
                on the column count (1 / 2 / 4), so the hiding is done in CSS
                per breakpoint — see `.v3-track__line` in v3.css. Drawing it
                unconditionally leaves a line hanging into the gutter after the
                last step of every row. */}
            <span
              aria-hidden
              className={`v3-track__line absolute left-0 right-[-2rem] top-[13px] h-px ${rule}`}
            />
            <div className="flex items-center gap-3">
              <span
                className={`relative z-10 inline-grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold ${
                  dark ? 'bg-white text-v2-ink-900' : 'bg-v2-ink-900 text-white'
                }`}
                aria-hidden
              >
                {s.no ?? String(i + 1).padStart(2, '0')}
              </span>
              {/* One column: a short rule trailing the badge instead of a
                  connector that would run into the next step below. */}
              <span className={`h-px flex-1 sm:hidden ${rule}`} aria-hidden />
            </div>

            {/* Step titles stay out of the document outline: a ProcessTrack is
                a sequence inside an H2 section, not a set of subsections. This
                keeps the Factory / R&D pages at exactly three H3 each — the
                three capability or facility cards. */}
            <p
              className={`mt-5 text-[1.0625rem] font-semibold leading-snug ${
                dark ? 'text-white' : 'text-v2-ink-900'
              }`}
            >
              {s.title}
            </p>
            {s.desc && (
              <p className={`mt-2.5 text-sm leading-relaxed ${dark ? 'text-white/85' : 'text-v2-ink-500'}`}>
                {s.desc}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SpecList                                                            */
/* ------------------------------------------------------------------ */

/**
 * Key/value rows with alternating weight.
 *
 * Fifteen spec rows set as prose is a wall. Alternating the label weight and
 * ruling the rows turns it into a scannable table that a logistics lead can
 * read down in one pass — which is the only reason it is on the page.
 */
export function SpecList({
  eyebrow,
  title,
  specs,
}: {
  eyebrow?: string;
  title?: string;
  specs: { key: string; val: string }[];
}) {
  return (
    <div>
      {eyebrow && <p className="v2-eyebrow">{eyebrow}</p>}
      {title && <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">{title}</h2>}

      <dl className="mt-11 divide-y divide-v2-ink-100 border-y border-v2-ink-100">
        {specs.map((s, i) => (
          <div
            key={i}
            className="grid gap-1 py-4 transition-colors hover:bg-v2-ink-050 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6 sm:px-2"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400 sm:pt-0.5">
              {s.key}
            </dt>
            <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-800">{s.val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Callout                                                             */
/* ------------------------------------------------------------------ */

/** A remark that must not blend into the paragraph it follows. */
export function Callout({
  icon = 'sparkle',
  children,
  tone = 'accent',
}: {
  icon?: IconName;
  children: ReactNode;
  tone?: 'accent' | 'neutral' | 'dark';
}) {
  const tones = {
    accent: 'border-v2-accent-100 bg-v2-accent-050 text-v2-accent-800',
    neutral: 'border-v2-ink-200 bg-v2-ink-050 text-v2-ink-700',
    dark: 'border-white/12 bg-white/[0.05] text-white/80',
  } as const;

  return (
    <aside
      className={`flex gap-3 rounded-v2-md border p-4 text-sm leading-relaxed ${tones[tone]}`}
    >
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* PullQuote                                                           */
/* ------------------------------------------------------------------ */

/** A buyer's words, given room to differ from our own voice. */
export function PullQuote({
  quote,
  who,
  role,
}: {
  quote: string;
  who?: string;
  role?: string;
}) {
  return (
    <figure className="relative">
      <span
        aria-hidden
        className="absolute -left-1 -top-6 font-display text-[5rem] leading-none text-v2-accent-100"
      >
        &ldquo;
      </span>
      <blockquote className="relative text-xl font-medium leading-snug tracking-[-0.02em] text-v2-ink-900 md:text-2xl">
        {quote}
      </blockquote>
      {(who || role) && (
        <figcaption className="mt-6 flex items-center gap-3 text-sm">
          <span aria-hidden className="h-px w-8 bg-v2-ink-300" />
          <span className="font-semibold text-v2-ink-900">{who}</span>
          {role && <span className="text-v2-ink-400">{role}</span>}
        </figcaption>
      )}
    </figure>
  );
}

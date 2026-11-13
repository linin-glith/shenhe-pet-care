import type { ReactNode } from 'react';
import Link from '@/components/SiteLink';

/**
 * Presentational primitives for the legacy block renderer.
 * All styling comes from the v2 design tokens in globals.css so migrated pages
 * match the new pages instead of importing the legacy `pp-*` stylesheet.
 */

export function Container({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <div className={narrow ? 'mx-auto w-full max-w-3xl px-5' : 'mx-auto w-full max-w-6xl px-5'}>{children}</div>;
}

export function Section({
  children,
  bg = 'plain',
  id,
  tight,
  className = '',
}: {
  children: ReactNode;
  bg?: 'plain' | 'soft' | 'bg' | 'dark';
  id?: string;
  tight?: boolean;
  className?: string;
}) {
  const bgClass =
    bg === 'soft' ? 'bg-surface-soft' : bg === 'bg' ? 'bg-surface' : bg === 'dark' ? 'bg-ink text-white' : '';
  return (
    <section id={id} className={`${tight ? 'py-10' : 'py-16 md:py-24'} ${bgClass} ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${light ? 'text-white/85' : 'text-brand'}`}>
      {children}
    </p>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  align = 'center',
  light,
}: {
  eyebrow?: string | null;
  title?: string | null;
  sub?: string | null;
  align?: 'center' | 'left';
  light?: boolean;
}) {
  if (!eyebrow && !title && !sub) return null;
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      {title && (
        <h2 className={`mt-3 text-3xl font-semibold tracking-tight md:text-4xl ${light ? 'text-white' : 'text-ink'}`}>
          {title}
        </h2>
      )}
      {sub && <p className={`mt-4 text-base leading-relaxed ${light ? 'text-white/80' : 'text-muted'}`}>{sub}</p>}
    </div>
  );
}

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors';

const BTN_VARIANT: Record<string, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-brand text-brand hover:bg-brand hover:text-white',
  outlineWhite: 'border border-white/70 text-white hover:bg-white hover:text-ink',
  ghost: 'border border-ink/20 text-ink hover:border-brand hover:text-brand',
  textLink: 'px-0 py-1 text-brand underline underline-offset-4 hover:text-brand-dark',
  default: 'border border-ink/20 text-ink hover:border-brand hover:text-brand',
};

export function Button({
  href,
  children,
  variant = 'default',
  block,
  size = 'md',
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: string;
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
}) {
  const cls = `${BTN_BASE} ${BTN_VARIANT[variant] ?? BTN_VARIANT.default} ${block ? 'w-full' : ''} ${
    size === 'lg' ? 'px-6 py-3.5 text-base' : size === 'sm' ? 'px-4 py-2 text-xs' : ''
  }`;
  if (external || /^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} className={cls} rel={external ? 'noopener noreferrer' : undefined} target={external ? '_blank' : undefined}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function CardShell({
  children,
  className = '',
  featured,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 transition-shadow ${
        featured ? 'border-brand bg-brand-soft/40 shadow-sm' : 'border-line bg-white'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-semibold tracking-tight text-brand md:text-4xl">{value}</div>
      <div className="mt-2 text-sm text-muted">{label}</div>
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    default: 'border-brand/30 text-brand bg-brand-soft/50',
    amber: 'border-amber-400/40 text-amber-700 bg-amber-50',
    pending: 'border-line text-muted bg-surface',
    partial: 'border-amber-400/40 text-amber-700 bg-amber-50',
    infra: 'border-slate-300 text-slate-600 bg-slate-50',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.default}`}>
      {children}
    </span>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <Pill tone={tone}>{children}</Pill>;
}

/**
 * Table renderer for extracted `table` blocks.
 * Legacy tables carried `pp-price-table` (tier pricing) — those are blocked
 * upstream by `priceTableFlagged` because shenhe is quote-only (B2B policy).
 */
export function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: { cells: string[]; highlight: boolean }[];
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        {head.length > 0 && (
          <thead>
            <tr className="border-b border-line">
              {head.map((h, i) => (
                <th key={i} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={`border-b border-line/70 ${r.highlight ? 'bg-brand-soft/40' : ''}`}>
              {r.cells.map((c, ci) => (
                <td key={ci} className="px-3 py-3 align-top text-ink/85">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Escapes legacy HTML entities that survived extraction, for safe rich text. */
export function RichText({ html, className = '' }: { html: string; className?: string }) {
  return (
    <div
      className={`legacy-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
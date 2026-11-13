'use client';

/**
 * The pieces the console pages share.
 *
 * WHY THEY ARE IN ONE FILE
 * Six pages that each spell a KPI card slightly differently look like six
 * products. The panel, the tile, the table and the empty state are written
 * once here so that a number always looks like a number.
 *
 * WHY THE DEMONSTRATION MARK IS LOUD
 * A demonstration order is real data in a real table. If it were not marked,
 * the operator could quote against it. The badge is on every row that
 * carries one, and the count of them is on the page, so the distinction is
 * impossible to miss.
 */

import type { ReactNode } from 'react';

export function Panel({
  title, hint, children, action,
}: {
  title: string; hint?: string; children: ReactNode; action?: { href: string; label: string };
}) {
  return (
    <section className="rounded-lg border border-v2-ink-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-v2-ink-900">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-v2-ink-300">{hint}</p>}
        </div>
        {action && (
          <a href={action.href} className="text-xs font-semibold text-v2-accent-700 hover:underline">
            {action.label} →
          </a>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Tile({
  label, value, tone = 'plain', hint,
}: {
  label: string; value: number | string;
  tone?: 'plain' | 'warn' | 'good' | 'accent';
  hint?: string;
}) {
  const ring =
    tone === 'warn' ? 'border-amber-300' :
    tone === 'good' ? 'border-emerald-300' :
    tone === 'accent' ? 'border-v2-accent-300' : 'border-v2-ink-200';
  const value2 =
    tone === 'warn' ? 'text-amber-700' :
    tone === 'good' ? 'text-emerald-700' :
    tone === 'accent' ? 'text-v2-accent-700' : 'text-v2-ink-900';
  return (
    <div className={`rounded-lg border bg-white p-5 ${ring}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-300">{label}</p>
        <span
          className={`h-2 w-2 rounded-full ${
            tone === 'warn' ? 'bg-amber-500' :
            tone === 'good' ? 'bg-emerald-500' :
            tone === 'accent' ? 'bg-v2-accent-500' : 'bg-v2-ink-300'
          }`}
          aria-hidden
        />
      </div>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${value2}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-v2-ink-300">{hint}</p>}
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
      演示
    </span>
  );
}

export function Empty({ what }: { what: string }) {
  return (
    <div className="grid h-36 place-items-center rounded-lg border border-dashed border-v2-ink-300">
      <p className="text-sm text-v2-ink-300">还没有{what}</p>
    </div>
  );
}

export function Table({
  head, children, empty,
}: {
  head: string[];
  children: ReactNode;
  empty?: string;
}) {
  if (empty) return <Empty what={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-v2-ink-200 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-300">
            {head.map((h) => (
              <th key={h} className="pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-v2-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Cell({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td className={`py-2.5 pr-4 ${mono ? 'font-mono text-xs font-semibold text-v2-ink-900' : 'text-v2-ink-800'}`}>
      {children}
    </td>
  );
}

export function Pill({ children, tone = 'plain' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    plain: 'bg-v2-ink-100 text-v2-ink-700',
    good: 'bg-emerald-50 text-emerald-800',
    warn: 'bg-amber-50 text-amber-800',
    accent: 'bg-v2-accent-050 text-v2-accent-800',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone] ?? tones.plain}`}>
      {children}
    </span>
  );
}

/** Fetch a JSON endpoint, with the error text the server sent. */
export async function getJson<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: (data as { error?: string } | null)?.error ?? `加载失败 (${res.status})` };
    }
    return { ok: true, data: (data ?? {}) as T };
  } catch {
    return { ok: false, message: '无法连接到服务器' };
  }
}

/** The palette, shared by every chart on every page. */
export const PALETTE = ['#0f766e', '#0891b2', '#7c3aed', '#ea580c', '#be123c', '#4d7c0f', '#475569', '#a16207'];

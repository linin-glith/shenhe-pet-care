'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/v2/Icon';

/**
 * MarketComplianceCard — an expanding card, not a link.
 *
 * WHY THIS IS NOT AN ANCHOR LINK
 * The first version of this card linked to `/sourcing-guides.html#us`. Three of
 * the four anchors did not exist, so every one of those cards was a dead end:
 * a promise of an answer followed by silence. Even once the anchors existed, a
 * link that scrolls the reader away from the page loses the comparison they
 * were in the middle of.
 *
 * So the answer lives here. A buyer comparing four markets does not want to
 * leave the comparison — they want the detail under the market they are looking
 * at. The disclosure is client-side, keyboard accessible, and the card remains
 * a single unit.
 *
 * ACCESSIBILITY
 * The trigger is a real <button> with aria-expanded and aria-controls, so the
 * state is announced rather than inferred. The panel is not hidden with
 * opacity or height tricks that strand content when motion is off.
 */
export function MarketComplianceCard({
  flag,
  name,
  icon,
  items,
  detail,
}: {
  flag: string;
  name: string;
  icon: IconName;
  items: string[];
  detail: string[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = `mkt-${flag.toLowerCase()}-panel`;

  return (
    <article className="v3-card v3-card--interactive p-7">
      <div className="flex items-center gap-3">
        <span className="v3-icon-plate v3-icon" aria-hidden>
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.14em] text-v2-ink-400">{flag}</p>
          <h3 className="text-lg font-semibold tracking-tight text-v2-ink-900">{name}</h3>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-v2-ink-100 border-y border-v2-ink-100">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 py-2.5 text-sm text-v2-ink-600">
            <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
            {it}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-accent-700"
      >
        {open ? 'Hide the detail' : 'What this means for you'}
        <span
          aria-hidden
          className={`inline-block transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {/* Rendered, not merely hidden: when motion is unavailable the detail is
          simply present, and a crawler indexing this page reads it either way. */}
      <div
        id={panelId}
        hidden={!open}
        className="mt-5 border-t border-v2-ink-100 pt-5"
      >
        <ul className="space-y-2.5">
          {detail.map((d) => (
            <li key={d} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-500">
              <span aria-hidden className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-v2-ink-300" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
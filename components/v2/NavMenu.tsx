'use client';

/**
 * The navigation, behind a button.
 *
 * WHY THERE IS A BUTTON AT ALL
 * The header is one row, and the row carries the logo, the navigation, the
 * language and the account actions. Measured on the built site, those
 * groups together needed about 1490px - more than the 1200px the header
 * container has inside it - so the row ran off the right edge of the
 * screen instead of scrolling to the left.
 *
 * The language became one button, the container was widened to the same
 * 1280px the page body uses, the navigation labels were shortened to the
 * forms that fit in a navigation, and the account links moved in here.
 * What is left fits, with room to spare.
 *
 * BEFORE THIS THERE WAS NO NAVIGATION AT ALL BELOW 1280px.
 * The inline navigation was hidden below that width and nothing replaced
 * it, so a tablet reader could not reach the catalogue from the header at
 * all - the only way there was the footer.
 *
 * WHAT IS IN THE PANEL
 * - the pages the inline row carries, on the widths where the row has no
 *   room for them;
 * - the account link, which every language but English does not need in
 *   the row;
 * - the two pages the site configuration calls "secondary navigation" -
 *   Trade Compliance and AI Customize. They had no entry in the header at
 *   all before, so a reader had to find them in the footer.
 */
import { useEffect, useRef, useState } from 'react';
import Link from '@/components/SiteLink';
import { Icon } from '@/components/v2/Icon';

export type MenuItem = {
  href: string;
  label: string;
  external?: boolean;
};

export default function NavMenu({
  navItems = [],
  items,
  label,
  closeLabel,
  navItemsClassName = 'xl:hidden',
  className = '',
}: {
  navItems?: MenuItem[];
  items: MenuItem[];
  label: string;
  closeLabel: string;
  navItemsClassName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="site-menu-panel"
        aria-label={open ? closeLabel : label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-600 transition-colors hover:bg-surface-soft hover:text-ink"
      >
        <Icon name={open ? 'close' : 'menu'} size={18} />
      </button>

      {open && (
        <nav
          id="site-menu-panel"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-xl"
        >
          {navItems.length > 0 && (
            <ul className={navItemsClassName}>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && (
            <ul className={navItems.length > 0 ? 'mt-1 border-t border-line pt-1' : ''}>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </div>
  );
}

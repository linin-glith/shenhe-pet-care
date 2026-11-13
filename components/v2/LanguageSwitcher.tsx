'use client';

/**
 * The language switcher.
 *
 * WHY IT IS A CLIENT COMPONENT
 * It has to know which page it is on, so that switching from
 * /de/products/pet-shampoo gives /es/products/pet-shampoo and not
 * /es/de/products/pet-shampoo. The path is read from the router.
 *
 * WHY IT IS ONE BUTTON IN THE HEADER AND THREE WORDS IN THE FOOTER
 * The header has one row and four things competing for it: the logo, the
 * main navigation, the language and the account actions. Laid out flat, the
 * three language words took 178px of that row, and the row was already
 * wider than the container it sat in - so the header ran off the right
 * edge of the screen instead of scrolling to the left. In the header the
 * three languages are one button.
 *
 * In the footer the opposite is true: the legal row has nothing else in
 * it, three words fit, and a reader looking for their own language at the
 * bottom of the page finds them at once instead of hunting for a button.
 *
 * That footer list is also what keeps the language links in the HTML: a
 * crawler reads the page as it is served, and a menu that is closed on
 * arrival is a menu it never sees. The alternates in the head say the
 * same thing to the engines that read that.
 *
 * WHAT IT SHOWS
 * Only the languages that are PUBLISHED. A locale whose dictionary is
 * finished but whose pages do not exist yet is not offered, because
 * pointing a reader at /ru/products.html when that page is still
 * English teaches a search engine that this site's alternates are
 * unreliable - which is worse than having no Russian version at all.
 *
 * The current language is named in its own language ("Deutsch",
 * "Espanol"), because a reader who cannot read the current language
 * still recognises their own.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from '@/components/SiteLink';
import { Icon } from '@/components/v2/Icon';
import { getT } from '@/lib/i18n';
import {
  LOCALE_NATIVE,
  PUBLISHED_LOCALES,
  pageAddress,
  localeOfPath,
} from '@/lib/i18n/config';

export default function LanguageSwitcher({
  className = '',
  variant = 'light',
  mode = 'dropdown',
}: {
  className?: string;
  variant?: 'light' | 'dark';
  mode?: 'dropdown' | 'inline';
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  /** Which end of the menu the keyboard asked for when it opened it. */
  const focusTarget = useRef<'first' | 'last' | null>(null);

  const current = localeOfPath(pathname ?? '/index.html');
  const t = getT(current);

  /** Move the focus to one of the menu items, wrapping around the ends. */
  const focusItem = useCallback((index: number) => {
    const items = itemRefs.current.filter((el): el is HTMLAnchorElement => el !== null);
    if (items.length === 0) return;
    items[(index + items.length) % items.length]?.focus();
  }, []);

  /* Close on a click elsewhere, or on Escape. */
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

  /* The keyboard opened the menu: put the focus on the end it asked for. */
  useEffect(() => {
    if (!open) return;
    if (focusTarget.current === 'first') {
      focusTarget.current = null;
      focusItem(0);
    } else if (focusTarget.current === 'last') {
      focusTarget.current = null;
      focusItem(-1);
    }
  }, [open, focusItem]);

  if (PUBLISHED_LOCALES.length < 2) return null;

  // The buyer portal is English only. It is an account surface: the
  // buyer signs in with the address they signed up with, the documents
  // in it are the ones we issued, and a German page inside it would be
  // a page whose content we do not actually have in German. A language
  // switcher there would be a promise the site cannot keep.
  if (pathname && pathname.startsWith('/portal')) return null;

  const links = PUBLISHED_LOCALES.map((locale) => ({
    locale,
    href: pageAddress(pathname ?? '/', locale),
    active: locale === current,
  }));

  /* ------------------------------------------------------------ inline ---- */
  if (mode === 'inline') {
    const shell =
      variant === 'dark'
        ? 'flex items-center gap-1 text-xs font-medium text-white/85'
        : 'flex items-center gap-1 text-xs font-medium text-ink-600';
    return (
      <nav aria-label={t('nav.language')} className={`${shell} ${className}`}>
        {links.map((link) => (
          <Link
            key={link.locale}
            href={link.href}
            hrefLang={link.locale}
            aria-current={link.active ? 'true' : undefined}
            className={
              link.active
                ? 'rounded px-1.5 py-0.5 underline underline-offset-4'
                : 'rounded px-1.5 py-0.5 hover:underline hover:underline-offset-4'
            }
          >
            {LOCALE_NATIVE[link.locale]}
          </Link>
        ))}
      </nav>
    );
  }

  /* ---------------------------------------------------------- dropdown ---- */
  const onButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusTarget.current = event.key === 'ArrowDown' ? 'first' : 'last';
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const items = itemRefs.current.filter((el): el is HTMLAnchorElement => el !== null);
    const at = items.indexOf(document.activeElement as HTMLAnchorElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(at + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(at <= 0 ? items.length - 1 : at - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const buttonTone =
    variant === 'dark'
      ? 'border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
      : 'border-line text-ink-600 hover:bg-surface-soft hover:text-ink';
  const menuTone =
    variant === 'dark'
      ? 'border-white/15 bg-ink-deep text-white'
      : 'border-line bg-white text-ink';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('nav.language')}: ${LOCALE_NATIVE[current]}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonTone}`}
      >
        <Icon name="globe" size={15} />
        <span>{LOCALE_NATIVE[current]}</span>
        <Icon
          name="chevron"
          size={13}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open && (
        <ul
          role="menu"
          aria-label={t('nav.language')}
          onKeyDown={onMenuKeyDown}
          className={`absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-lg border py-1 shadow-lg ${menuTone}`}
        >
          {links.map((link, index) => (
            <li key={link.locale} role="none">
              <Link
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                role="menuitem"
                href={link.href}
                hrefLang={link.locale}
                aria-current={link.active ? 'true' : undefined}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm transition-colors ${
                  link.active
                    ? 'font-semibold text-brand hover:bg-surface-soft'
                    : 'text-ink-600 hover:bg-surface-soft hover:text-ink'
                }`}
              >
                {LOCALE_NATIVE[link.locale]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

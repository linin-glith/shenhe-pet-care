import type { SVGProps } from 'react';

/**
 * Icon set — the site's drawing vocabulary.
 *
 * WHY INLINE AND NOT A SPRITE FILE
 * A sprite.svg request means an extra round trip before any icon paints, and
 * the existing legacy sprite already fails on <use> fragments in some
 * browsers. These are ~300 bytes each, tree-shaken, and colour-currentColor,
 * so an icon inherits the text colour of whatever it sits inside.
 *
 * The set is deliberately small and semantic: pet silhouettes for the
 * audience cues, and process/manufacture marks for the trust claims. Nothing
 * decorative — an icon that does not label or orient is noise.
 */
export type IconName =
  | 'paw'
  | 'cat'
  | 'dog'
  | 'bottle'
  | 'spray'
  | 'jar'
  | 'shield'
  | 'flask'
  | 'factory'
  | 'truck'
  | 'leaf'
  | 'clock'
  | 'chat'
  | 'check'
  | 'sparkle'
  | 'cart'
  | 'eye'
  | 'heart'
  | 'target'
  | 'globe'
  | 'chevron'
  | 'menu'
  | 'close';

const P: Record<IconName, string> = {
  // Paw: one pad + four toes. Drawn on a 24 grid with 1.7 stroke.
  paw: 'M12 13.4c-2.6 0-5.1 1.8-5.1 3.6 0 1.2 1 2 2.2 2 .8 0 1.4-.4 2.9-.4s2.1.4 2.9.4c1.2 0 2.2-.8 2.2-2 0-1.8-2.5-3.6-5.1-3.6Z M7.6 11.2a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M11.1 8.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M15.2 8.8a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M18.6 11.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z',
  // Cat: head with ears and whiskers.
  cat: 'M4.2 9.6 3.4 4.2c-.1-.7.6-1.2 1.2-.8l4.1 2.6a8.6 8.6 0 0 1 6.6 0l4.1-2.6c.6-.4 1.3.1 1.2.8l-.8 5.4a7.4 7.4 0 0 1 1.4 4.2c0 3.4-3.6 5.8-8.2 5.8s-8.2-2.4-8.2-5.8c0-1.5.6-2.9 1.4-4.2Z M8.6 13.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z M15.4 13.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z M12 16.4l-1.2-1h2.4l-1.2 1Z',
  // Dog: head with floppy ears.
  dog: 'M5.4 7.2c1-1.1 2.4-1.8 3.9-2a6.7 6.7 0 0 1 5.4 0c1.5.2 2.9.9 3.9 2 .8 1 1.2 2.2 1.1 3.6-.1 1.9-.9 3.4-1.6 4.9-.7 1.4-1.6 2.7-3.3 2.7-1 0-1.6-.4-3.5-.4s-2.5.4-3.5.4c-1.7 0-2.6-1.3-3.3-2.7-.7-1.5-1.5-3-1.6-4.9-.1-1.4.3-2.6 1.1-3.6Z M9.6 12.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z M14.4 12.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z M12 16.8c1 0 1.8-.4 1.8-1s-.8-.7-.8-.7-.7.1-1 .1-1-.1-1-.1-.8.1-.8.7.8 1 1.8 1Z',
  bottle: 'M9.5 2.5h5v2.8l1.6 3.2a4 4 0 0 1 .4 1.7v9.3a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2v-9.3c0-.6.1-1.2.4-1.7l1.6-3.2V2.5Z M7.5 12h9',
  spray: 'M8 9.5h6.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z M11 9.5V6.2h5.4a1.4 1.4 0 0 0 0-2.8H11 M14.5 3.4 12 1.9',
  jar: 'M6 8h12a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1Z M7.5 8V5.6c0-.9.7-1.6 1.6-1.6h5.8c.9 0 1.6.7 1.6 1.6V8 M7 13h10',
  shield: 'M12 2.5 4.5 5.4v6c0 4.4 3.1 8.5 7.5 9.6 4.4-1.1 7.5-5.2 7.5-9.6v-6L12 2.5Z M9 11.8l2.2 2.2 4-4.4',
  flask: 'M9.5 2.5h5 M10.5 2.5v6.1L4.9 18a2 2 0 0 0 1.7 3h10.8a2 2 0 0 0 1.7-3l-5.6-9.4V2.5 M7.4 14.5h9.2',
  factory: 'M2.5 20.5V10l6 3.5V10l6 3.5V10l6 3.5v7H2.5Z M2.5 20.5h19 M17.5 10V4.5h3V10 M6 17.2h1.6 M11 17.2h1.6 M16 17.2h1.6',
  truck: 'M2.5 6.5h11v10h-11z M13.5 10h4l3 3.2v3.3h-7 M6.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M17.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  leaf: 'M4.5 19.5C3 15 4.5 8.5 9.5 5.5c3-1.8 7-2 10-1.5.5 3 .3 7-1.5 10-3 5-9.5 6.5-13.5 5.5Z M4.5 19.5c2-5 5.5-8.5 10.5-10.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5.2l3.2 2',
  chevron: 'M6 9.5 12 15.5l6-6',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3.2 9.5h17.6 M3.2 14.5h17.6 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18',
  chat: 'M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20.5v-4H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M8 12.2l2.8 2.8L16.4 9',
  sparkle: 'M12 2.5l2.1 6.1 6.1 2.1-6.1 2.1L12 18.9l-2.1-6.1-6.1-2.1 6.1-2.1L12 2.5Z M19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  cart: 'M2.5 3.5h2.6l2.3 11.2h10.1l2-7.4H6 M9.5 20a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z M17.5 20a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z',
  // Eye — the vision cue. The iris is a second subpath so the whole mark
  // stays one stroked path, matching the rest of the set.
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  // Heart — the values cue.
  heart:
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 0A5.5 5.5 0 0 0 2 12.28l10 10 10-10a5.5 5.5 0 0 0 0-7.67Z',
  // Target — the aim/goal cue.
  target:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  // Menu — three lines. The mark that says "the navigation is behind this".
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  // Close — the same mark in its other state, so the button that opened
  // the panel is the button that closes it.
  close: 'M6 6l12 12 M18 6L6 18',
};

const FILLED = new Set<IconName>(['paw']);

export function Icon({
  name,
  size = 24,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={P[name]} />
    </svg>
  );
}

/**
 * Pet audience badge — the one place a pet silhouette does real work.
 *
 * It answers "is this for my animal?" in under a second, which is the
 * question a pet owner asks first and the factory brochure never answers.
 */
export function PetBadge({ which, className = '' }: { which: 'cat' | 'dog' | 'both'; className?: string }) {
  const label = which === 'both' ? 'Cats & dogs' : which === 'cat' ? 'Cats' : 'Dogs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-v2-ink-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-v2-ink-600 ${className}`}
    >
      {which === 'both' ? (
        <>
          <Icon name="cat" size={15} />
          <Icon name="dog" size={15} className="-ml-2.5" />
        </>
      ) : (
        <Icon name={which} size={15} />
      )}
      {label}
    </span>
  );
}

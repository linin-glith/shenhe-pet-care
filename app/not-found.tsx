import type { Metadata } from 'next';
import NotFound from './(site)/not-found';

/**
 * The GLOBAL 404 page.
 *
 * WHY THIS FILE EXISTS ALONGSIDE app/(site)/not-found.tsx
 * A not-found.tsx inside a route group only handles the URLs inside that
 * group. The page Next exports as 404.html — the one a static host serves for
 * any URL that matches no file — comes from the root app/not-found.tsx. When
 * the site was reorganised into route groups and this file moved into
 * (site), the exported 404.html fell back to Next's built-in page: no
 * design, and no robots directive, so a crawler was free to index it.
 *
 * So the root file exists again and renders the same page, with the same
 * metadata — one directive, noindex, nofollow.
 */
export const metadata: Metadata = {
  title: 'Page not found — SHENHE ZHONGKE',
  description: 'The page you asked for is not here. Browse the catalogue or ask for a quote.',
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return <NotFound />;
}

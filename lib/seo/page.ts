import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { fitDescription } from '@/lib/seo/meta';

/**
 * THE METADATA OF A PAGE, BUILT ONCE.
 *
 * WHY THIS FILE EXISTS
 * Five journey pages were added in one round, and each of them needed the
 * same canonical, the same Open Graph block, the same Twitter card and the
 * same description fitter. Written out five times, that is five places for
 * the canonical to be typed slightly differently, and a page whose canonical
 * disagrees with its sitemap entry is a page Google is told to ignore.
 *
 * So the shape of a page's metadata is written down once, here, and the
 * pages pass their own facts into it.
 *
 * THE DESCRIPTION IS FITTED, NOT TYPED
 * Every description goes through `fitDescription`, which cuts it at a clause
 * boundary and keeps the facts at the front. The build checks that every
 * indexed description lands between 150 and 155 characters, so a description
 * written by hand at 210 characters cannot ship.
 */
export function pageMetadata(opts: {
  /** The path the page is published at, with its extension. */
  path: string;
  title: string;
  description: string;
  /** The social card image; the site's default card when it is not given. */
  image?: string;
}): Metadata {
  const canonical = `${siteConfig.brand.siteUrl}${opts.path}`;
  const description = fitDescription(opts.description);
  const image = opts.image ?? `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`;

  return {
    title: opts.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.brand.name,
      title: opts.title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: [image],
    },
  };
}

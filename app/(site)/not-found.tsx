import type { Metadata } from 'next';
import { Btn } from '@/components/v2/blocks';
import { siteConfig } from '@/lib/shenhe.config';
import { products } from '@/lib/products';

/**
 * 404 page.
 *
 * WHY THIS FILE EXISTS
 * Next.js shipped its built-in not-found page, which meant two things went
 * wrong on a public site:
 *
 *  1. It rendered unstyled — an inline-styled "404 / This page could not be
 *     found." block in the middle of a designed page, with its own font stack.
 *  2. It emitted a SECOND robots meta tag. The root layout declares
 *     `robots: index, follow` plus the googlebot directives; Next's built-in
 *     not-found adds its own `noindex`. The exported HTML therefore carried
 *     two contradictory directives on one page, and the layout's
 *     `index, follow` was the one a crawler could read as permission to
 *     index the 404.
 *
 * Declaring robots here replaces the layout's block for this route, so the
 * page ships exactly one directive: noindex, nofollow.
 */
export const metadata: Metadata = {
  title: `Page not found — ${siteConfig.brand.name}`,
  description: 'The page you asked for is not here. Browse the catalogue or ask for a quote.',
  robots: { index: false, follow: false },
};

const LINKS = [
  { label: 'Product catalogue', href: '/products.html' },
  { label: 'OEM / ODM services', href: '/oem-odm.html' },
  { label: 'Factory & capability', href: '/factory.html' },
];

export default function NotFound() {  return (
    <section className="v2-grain-fine relative overflow-hidden bg-v2-ink-900 text-white">
      <div className="v2-mesh" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="v2-container relative py-20 md:py-28">
        <p className="v2-eyebrow v2-eyebrow--light">Error 404</p>
        <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
          This page is not on the shelf.
        </h1>
        <p className="v2-lead v2-lead--light mt-5 max-w-xl">
          The address may be out of date, or the product may have been renamed. Both
          are easy to fix — start from the catalogue.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Btn cta={{ label: `Browse ${products.length} SKUs`, href: '/products.html' }} />
          <Btn
            cta={{ label: 'Ask for a quotation', href: '/contact.html', variant: 'secondary' }}
            light
          />
        </div>
      </div>

      {/* The footer headings are h3, so the page needs an h2 between them and
          the h1 above or the document outline skips a level. */}
      <div className="v2-container relative pb-20 md:pb-28">
        <h2 className="v2-display v2-display--light mt-12 max-w-2xl text-2xl md:text-3xl">
          Where buyers usually want to go
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="block rounded-v2-md border border-white/15 px-5 py-4 text-sm text-white/85 transition-colors hover:border-white/40 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

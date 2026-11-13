'use client';

/**
 * The breadcrumb trail, and the schema that describes it.
 *
 * WHY IT LIVES IN THE LAYOUT
 * The trail is a property of where a page sits, not of what a page contains,
 * so it is derived from the path once and applied everywhere. A page that
 * forgets to draw its own trail is a page with no hierarchy; a page that
 * draws one and forgets the schema is a page whose markup disagrees with it.
 *
 * WHY IT IS A CLIENT COMPONENT
 * usePathname() resolves during prerendering for static routes, so the
 * markup is in the exported HTML — the crawler sees the trail and the
 * JSON-LD without running any JavaScript.
 *
 * WHAT IT DOES NOT SHOW
 * The home page, the account surfaces (portal/*, admin) and the error pages.
 * A trail that says "Home » Home" is noise, and an account surface has no
 * place in a public hierarchy.
 */

import { usePathname } from 'next/navigation';
import { breadcrumbSchema, breadcrumbTrail } from '@/lib/seo/breadcrumbs';
import { getT } from '@/lib/i18n';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

export default function BreadcrumbTrail({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const t = getT(locale);
  /* A JSX attribute holds a string, not a function. */
  const tr = (k: Parameters<typeof t>[0]) => t(k);
  const pathname = usePathname() ?? '/';
  const trail = breadcrumbTrail(pathname, locale);

  if (!trail) return null;

  return (
    <>
      <nav aria-label={tr('nav.sourcing')} className="border-b border-v2-ink-200 bg-white">
        <div className="v2-container">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2.5 text-[13px] text-v2-ink-500">
            {trail.map((crumb, i) => {
              const last = i === trail.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-2">
                  {last ? (
                    <span aria-current="page" className="text-v2-ink-700">
                      {crumb.name}
                    </span>
                  ) : (
                    <a href={crumb.href} className="hover:text-v2-ink-900 hover:underline">
                      {crumb.name}
                    </a>
                  )}
                  {!last && (
                    <span aria-hidden className="text-v2-ink-400">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // "<" is escaped so a product name can never close the script tag.
          __html: JSON.stringify(breadcrumbSchema(trail)).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}

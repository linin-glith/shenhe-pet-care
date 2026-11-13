'use client';

/**
 * The public site's layout.
 *
 * WHAT IT HOLDS
 * The header, the breadcrumb trail and the footer — the chrome that makes a
 * page feel like part of the site rather than a document. It lives in the
 * site route group so that the back office, which is a tool rather than a
 * page of the website, does not carry it.
 *
 * WHY THE CHAT WIDGETS ARE HERE AND NOT IN THE ROOT
 * The assistant, the product chat, the conversion dock and the back-to-top
 * button are buyer-facing conveniences. The console is not a buyer
 * surface, and a chat bubble over a staff tool is a widget in the way.
 */

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import BreadcrumbTrail from '@/components/v2/BreadcrumbTrail';
import ConversionDock from '@/components/v2/ConversionDock';
import BackToTop from '@/components/v2/BackToTop';
import ProductChat from '@/components/v2/ProductChat';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import AnalyticsTags from '@/components/v2/AnalyticsTags';
import { siteGraphSchema } from '@/lib/seo/brand';
import { localeOfPath, alternateLinks, DEFAULT_LOCALE } from '@/lib/i18n/config';

/**
 * The surfaces where the buyer-facing widgets do not belong.
 *
 * The portal is a signed-in buyer's own area: their orders, their
 * documents, their shipments. A chat bubble asking "need a quote?"
 * over that is a sales prompt on a screen where the buyer is already
 * a customer, and the conversion dock is built to interrupt someone
 * on a marketing page. The console is a staff tool.
 *
 * The measurement tags are excluded from the same two surfaces, by
 * the same spelling of the rule: the first path segment.
 */
function isSignedInSurface(pathname: string | null): boolean {
  if (!pathname) return false;
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  return first === 'admin' || first === 'portal';
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicSurface = !isSignedInSurface(pathname);

  /*
   * The language of the page, read from the path.
   *
   * The locale is part of the ADDRESS, not a preference stored in a
   * cookie — that is what lets a crawler reach a German page by
   * following a link, and what lets one page serve two languages
   * without a cache key. So the chrome reads it from where it already
   * is.
   */
  const locale = localeOfPath(pathname ?? '/');

  return (
    <>
      {/* The measurement tags. They are here and not in the root
          layout so that the console and the buyer portal never load
          them: Clarity records the screen and keeps the text on it,
          and those two surfaces hold buyer names, enquiry states and
          a buyer's own orders. */}
      <AnalyticsTags />

      {/* The company, the website and the brand mark, on every public page.
          Published from the layout so that the entity a product page points
          at with `manufacturer: {"@id": ".../#organization"}` is actually
          defined on that page - and so the mark travels with the page into
          any answer that quotes it. The console and the buyer portal do not
          get it: they are not public surfaces. */}
      {publicSurface && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteGraphSchema()).replace(/</g, '\\u003c'),
          }}
        />
      )}

      <Header locale={locale} />

      {/*
        THE ALTERNATE LANGUAGES OF THIS PAGE.

        The site answers in three languages, and a page that exists in three
        languages has to say so - otherwise the search engine sees three
        copies of the same English text, and a reader who asks for the
        German version has no way to be told that one exists.

        The English pages carry this here, because their own metadata only
        declares a canonical address. The language pages already declare
        their own alternates in their generateMetadata, so they are left
        alone - otherwise every German page would say the same thing twice.

        The helper that builds the addresses is the one the language
        switcher uses, so a link here and a link there can never disagree
        about where the German page lives.
      */}
      {publicSurface &&
        locale === DEFAULT_LOCALE &&
        alternateLinks(pathname ?? '/').map((a) => (
          <link
            key={a.locale}
            rel="alternate"
            hrefLang={a.locale}
            href={a.href}
          />
        ))}

      {/* The trail and its BreadcrumbList schema, from one array. Rendered
          by the layout so that every page has both, and they cannot
          disagree. */}
      <BreadcrumbTrail locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />

      {/* The buyer-facing widgets, on the public pages only. */}
      {publicSurface && (
        <>
          <ConversionDock locale={locale} />
          <BackToTop locale={locale} />
          <ProductChat locale={locale} />
        </>
      )}

      {/* The inquiry assistant, mounted on every page of the site. */}
      {publicSurface && (
        <Script src="/assets/js/chatbot.js" strategy="afterInteractive" />
      )}
    </>
  );
}

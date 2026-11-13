/**
 * The breadcrumb trail of a page.
 *
 * WHY IT IS DERIVED FROM THE PATH
 * The legacy site drew a trail on every page ("Home » Products » Pet
 * Nutrition » Pet Digestive Probiotics") and the v2 conversion dropped it, so
 * the site lost the one navigation aid that tells a buyer where they are and
 * the one hierarchy a crawler reads. Putting it back as a single derived
 * function means the visible trail and the BreadcrumbList schema come from
 * the same array — a schema that describes a trail the page does not show is
 * a claim the page cannot back up.
 *
 * The hrefs are the site's own .html URLs, because that is what the rest of
 * the site links to and what the static export serves.
 */

import { LINE_PRODUCTS } from '@/lib/line-products';
import { productBySlug, productName } from '@/lib/seo/breadcrumb-data';
import { LINE_PAGES } from '@/lib/seo/meta';

export type Crumb = { name: string; href: string };

const SITE = 'https://shenhezhongke.com';

const HOME: Crumb = { name: 'Home', href: '/' };
const CATALOGUE: Crumb = { name: 'Products', href: '/products.html' };

/** The pages that are not products, and what the trail calls them. */
const PAGES: Record<string, string> = {
  '/about': 'About',
  '/ai-customize': 'AI Product Match',
  '/blog': 'Insights',
  '/capabilities': 'R&D & Quality',
  '/certifications': 'Certifications & Lab Reports',
  '/contact': 'Contact',
  '/data-license': 'Data Use',
  '/europe': 'Europe',
  '/factory': 'Factory',
  '/faq': 'FAQ',
  '/for-ai': 'For AI',
  '/global-compliance': 'Global Compliance',
  '/msds': 'MSDS',
  '/oem-odm': 'OEM & ODM',
  '/privacy': 'Privacy',
  '/sourcing-guides': 'Sourcing Guides',
  '/standards': 'Standards & Sources',
  '/terms': 'Terms',
  '/trade-compliance': 'Trade Compliance',
  '/trade-programme': 'Trade Programme',
  '/usa': 'United States',
  '/why-us': 'Why Us',
  '/quotation': 'Quotation & Terms',
  '/samples': 'Samples & Approval',
  '/production': 'Production & Inspection',
  '/shipping': 'Shipping & Customs',
  '/after-sales': 'After-Sales & Reorders',
  '/intellectual-property': 'Patents & Trademarks',
};


/**
 * The trail, in the buyer's language.
 *
 * A German page that carries the English trail says two things at once:
 * that the page is German, and that the hierarchy around it is not. The
 * hrefs change with the language — the German catalogue is at /de/... —
 * and so do the names, because "Products" on a German page is a
 * sentence in the wrong language.
 *
 * The names are the ones the navigation itself uses, so the trail and
 * the menu cannot disagree.
 */
const PAGE_NAMES_LOCALISED: Record<string, Record<'de' | 'es', string>> = {
  '/about': { de: 'Über uns', es: 'Sobre nosotros' },
  '/ai-customize': { de: 'KI-Produktmatch', es: 'Selector de producto con IA' },
  '/blog': { de: 'Ratgeber', es: 'Guías' },
  '/capabilities': { de: 'F&E & Qualität', es: 'I+D y calidad' },
  '/certifications': { de: 'Zertifikate & Laborberichte', es: 'Certificados e informes' },
  '/contact': { de: 'Kontakt', es: 'Contacto' },
  '/factory': { de: 'Werk', es: 'Fábrica' },
  '/global-compliance': { de: 'Globale Konformität', es: 'Cumplimiento global' },
  '/msds': { de: 'Sicherheitsdatenblatt', es: 'Ficha de seguridad' },
  '/oem-odm': { de: 'OEM & ODM', es: 'OEM y ODM' },
  '/privacy': { de: 'Datenschutz', es: 'Privacidad' },
  '/sourcing-guides': { de: 'Einkaufsleitfäden', es: 'Guías de compra' },
  '/standards': { de: 'Standards & Quellen', es: 'Normas y fuentes' },
  '/terms': { de: 'AGB', es: 'Términos' },
  '/trade-compliance': { de: 'Handelskonformität', es: 'Cumplimiento comercial' },
};

const HOME_LOCALISED: Record<'de' | 'es', string> = {
  de: 'Startseite',
  es: 'Inicio',
};

const CATALOGUE_LOCALISED: Record<'de' | 'es', string> = {
  de: 'Produkte',
  es: 'Productos',
};

/** "/products/x.html", "/products/x/" and "/products/x" are the same page. */
function normalise(pathname: string): string {
  let p = pathname.split('#')[0].split('?')[0];
  if (p.endsWith('/')) p = p.slice(0, -1);
  if (p.endsWith('.html')) p = p.slice(0, -'.html'.length);
  return p || '/';
}

/**
 * The trail for a path, or null when the page has no hierarchy worth
 * showing: the home page, the account surfaces and the error pages.
 */
export function breadcrumbTrail(pathname: string, locale: string = 'en'): Crumb[] | null {
  const full = normalise(pathname);

  if (full === '/') return null;
  if (full.startsWith('/portal') || full.startsWith('/admin') || full.startsWith('/_')) {
    return null;
  }

  /*
   * THE LOCALE PREFIX IS PART OF THE PATH, NOT PART OF THE HIERARCHY.
   * A German page sits at /de/products.html, and the hierarchy under it
   * is the same one the English page has, one level up. So the prefix is
   * stripped for the lookup and put back on the href — otherwise every
   * language page has no trail at all, and the language pages are the
   * ones a German buyer lands on from a search.
   */
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const path = full.startsWith(prefix) ? full.slice(prefix.length) || '/' : full;
  const at = (href: string) => (prefix ? `${prefix}${href}` : href);
  const localised = locale === 'de' || locale === 'es';

  /*
   * THE HOME CRUMB POINTS AT A FILE, NOT A DIRECTORY.
   * The static export writes the language home page as /de.html, not as
   * /de/index.html. A link to /de/index.html is a link to a page that
   * was never built, and the build gate says so: eighty-two broken
   * links, one per German and Spanish page, all of them the home crumb.
   */
  const home: Crumb = {
    name: localised ? HOME_LOCALISED[locale as 'de' | 'es'] : HOME.name,
    href: localised ? `/${locale}.html` : HOME.href,
  };
  const catalogue: Crumb = {
    name: localised ? CATALOGUE_LOCALISED[locale as 'de' | 'es'] : CATALOGUE.name,
    href: at(CATALOGUE.href),
  };

  if (path === '/products') return [home, catalogue];

  if (path.startsWith('/products/')) {
    const slug = path.slice('/products/'.length);
    const href = at(`/products/${slug}.html`);

    const line = LINE_PAGES[slug];
    if (line) return [home, catalogue, { name: line.label, href }];

    /*
     * THE CAT PAGE IS A CUT OF THE CATALOGUE, NOT A LINE OF ITS OWN.
     * It sits under the catalogue in the trail because that is what it is:
     * the SKUs of the catalogue, listed the way a cat brand looks for them.
     */
    if (slug === 'cat-care') return [home, catalogue, { name: 'Cat Care', href }];

    const lineProduct = LINE_PRODUCTS[slug];
    if (lineProduct) {
      // The two Pet Nutrition products sit on the Pet Nutrition line page, so
      // the trail says so — the legacy trail on those pages did, and a buyer
      // arriving from search should see the same hierarchy the site has.
      return [
        home,
        catalogue,
        { name: 'Pet Nutrition', href: at('/products/pet-nutrition.html') },
        { name: `${lineProduct.name} ${lineProduct.size}`, href },
      ];
    }

    const product = productBySlug(slug);
    if (product) return [home, catalogue, { name: productName(product), href }];

    return null;
  }

  /*
   * THE REPORT PAGES SIT UNDER THE CERTIFICATIONS PAGE.
   * A report is the evidence behind a certification claim, and a buyer
   * who lands on one from a search needs to be able to climb back up to
   * the page that lists them all — so the trail says where the report
   * came from rather than leaving the page at the top of a hierarchy of
   * one.
   */
  if (path.startsWith('/reports/')) {
    const slug = path.slice('/reports/'.length);
    const certs: Crumb = {
      name: localised ? PAGE_NAMES_LOCALISED['/certifications'][locale as 'de' | 'es'] : PAGES['/certifications'],
      href: at('/certifications.html'),
    };
    return [home, certs, { name: slug.toUpperCase(), href: at(`/reports/${slug}.html`) }];
  }

  const name = PAGES[path];
  if (!name) return null;
  const label = localised ? PAGE_NAMES_LOCALISED[path]?.[locale as 'de' | 'es'] : undefined;
  return [home, { name: label ?? name, href: at(`${path}.html`) }];
}

/**
 * The trail, as schema.org.
 *
 * Built from the SAME array the page draws, so the markup cannot describe a
 * hierarchy the visitor cannot see. Positions are 1-based and the last item
 * is the page itself.
 */
export function breadcrumbSchema(trail: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.href}`,
    })),
  };
}

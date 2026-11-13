/**
 * THE BRAND, as a machine can read it.
 *
 * WHY THIS IS ITS OWN FILE
 *
 * The brand is not a product list. It used to live inside lib/seo/schema.ts
 * beside the product schemas, and that module reads the catalogue - which
 * carries the 20 per-SKU reference prices. The site layout is a client
 * component (it reads the current path), so when the layout started
 * publishing the brand graph, the whole catalogue went with it into the
 * browser bundle: forty "EXW RMB <amount>" strings in a published .js file,
 * caught by the price-leak gate.
 *
 * So the brand lives here, and it depends on one thing only: the site
 * config. A brand is a name, a mark, an address and a way to be reached.
 * Nothing about a SKU belongs in it.
 *
 * WHY THE MARK MATTERS
 *
 * An answer engine that lifts a sentence off this site and quotes it has to
 * decide who is speaking. The name in the text is one half of that; the
 * mark is the other half, and it is the half that was missing: the
 * Organization carried a name, an address and a telephone number, and no
 * logo. A reader - human or assistant - was given a company with no face.
 *
 * The dimensions are the real ones (271 x 68), read out of the PNG: a
 * search engine that fetches the image should not have to guess its shape.
 */
import { siteConfig } from '@/lib/shenhe.config';
import { PUBLISHED_LOCALES } from '@/lib/i18n/config';
import { BUILD_DATE } from './build-date';
import { factoryCredentials } from './credentials';

const SITE = siteConfig.brand.siteUrl;

/**
 * The languages the site is actually published in.
 *
 * WHY THIS IS NOT A LIST OF THREE
 * The WebSite block used to say `inLanguage: ['en', 'es', 'de']`, which was
 * true of the legacy site and stopped being true when the /de/ and /es/ trees
 * were removed. The llms.txt files were corrected at the time ("English only,
 * and the unreferenced assets/i18n dictionaries are deleted rather than left
 * as a promise") but the schema kept the old claim, on all 52 pages that
 * publish the graph.
 *
 * `inLanguage` is read by search engines and answer engines to decide what a
 * page is in and whether a translated version exists. Claiming two languages
 * that have no pages routes a Spanish- or German-language buyer to a page
 * they cannot read.
 *
 * So it is read from the one list that says which languages exist:
 * PUBLISHED_LOCALES, whose own rule is "a language joins this list when its
 * routes exist AND its body is in that language. Not before."
 *
 * The ContactPoint's `availableLanguage` below is deliberately NOT derived
 * from this: that one says which languages a person can be answered in, which
 * is a fact about the sales desk, not about the website.
 */
const SITE_LANGUAGES = [...PUBLISHED_LOCALES];

export const BRAND_LOGO = {
  '@type': 'ImageObject',
  url: `${SITE}/assets/img/ui/logo.png`,
  contentUrl: `${SITE}/assets/img/ui/logo.png`,
  width: 271,
  height: 68,
  caption: `${siteConfig.brand.name} - ${siteConfig.brand.nameCN}`,
  inLanguage: 'en',
};

export function brandSchema() {
  return {
    '@type': 'Brand',
    dateModified: BUILD_DATE,
    '@id': `${SITE}/#brand`,
    name: siteConfig.brand.name,
    alternateName: siteConfig.brand.nameTitle,
    logo: BRAND_LOGO,
  };
}

/**
 * THE NAMES THIS COMPANY GOES BY.
 *
 * WHY A LIST AND NOT ONE NAME
 *
 * A search engine does not read a brand name; it resolves one. When
 * Bing was asked for "shenhezhongke" on 2026-11-07 it answered
 * "Including results for shenzhen zhongke. Do you want results only
 * for shenhezhongke?" - and the results were two other companies:
 * Shenzhen Zhongke Green Energy Technology and Shenzhen Zhongke Ai
 * Shen Pharmaceutical.
 *
 * That is an entity problem, not a ranking problem. The name alone
 * does not tell an engine which company it is, because two other
 * companies answer to something very close. So the entity has to
 * carry the things that make it unique: the province, the city, the
 * legal name and the Chinese name.
 *
 * The list is the standard field for exactly this - the names a
 * company is known by - and it is the field an engine reads when it
 * tries to put a string onto a company.
 */
const ALTERNATE_NAMES = [
  'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
  'Shenhe Zhongke Biotechnology',
  'Shenhe Zhongke',
  '深河中科',
  '广东深河中科生物科技有限公司',
  'Heyuan Shenhe Zhongke',
] as const;

export function organizationSchema() {
  return {
    '@type': 'Organization',
    dateModified: BUILD_DATE,
    '@id': `${SITE}/#organization`,
    name: siteConfig.brand.legalName,
    alternateName: [...ALTERNATE_NAMES],
    legalName: siteConfig.brand.legalName,
    url: `${SITE}/`,
    foundingDate: String(siteConfig.brand.foundedYear),
    /*
     * THE BUSINESS MODEL, IN THE ORGANISATION'S OWN DESCRIPTION.
     *
     * The product summary report reads the site as a merchant catalogue
     * and asks for the price. The answer - this is a B2B factory that
     * quotes per order and publishes no unit price - belongs in the
     * markup that the report is reading, and not only in a sentence on
     * the trade page. The words come from the pricing policy in the
     * configuration, so the site cannot say one thing here and another
     * there.
     */
    description: `${siteConfig.brand.shortPitch} ${siteConfig.pricing.declaration}`,
    email: siteConfig.brand.email,
    telephone: siteConfig.brand.tel,
    /* The mark. */
    logo: BRAND_LOGO,
    image: BRAND_LOGO,
    brand: {
      '@type': 'Brand',
      '@id': `${SITE}/#brand`,
      name: siteConfig.brand.name,
      alternateName: siteConfig.brand.nameTitle,
      logo: BRAND_LOGO,
    },
    /* The markets the factory sells into. */
    areaServed: [
      { '@type': 'Country', name: 'European Union' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'Russia' },
      { '@type': 'Country', name: 'Brazil' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'China' },
    ],
    knowsAbout: [
      'pet care OEM manufacturing',
      'pet care ODM contract manufacturing',
      /* The buyer's own words for the same route. White label autocompletes
         with uk and australia attached, private labelling is the UK spelling
         of private label, and wholesale pet products is what a distributor
         types. Naming them is how an engine connects the pages to those
         queries instead of leaving the site to OEM alone. */
      'private label pet products',
      'white label pet products',
      'private labelling pet products',
      'wholesale pet products',
      'custom logo pet products',
      'bio-enzyme deodorizing technology',
      'probiotic pet care formulations',
      'chlorine dioxide disinfection systems',
      'plant-based insect repellent for pets',
      'GMP cosmetic manufacturing (ISO 22716)',
      'pet product export compliance (FDA, EU, REACH)',
      'pet shampoo formulation chemistry',
      'pet dermatology and antifungal treatments',
      'B2B pet product trade (Incoterms, L/C, T/T)',
    ],
    /*
     * THE DOCUMENTS THIS COMPANY ACTUALLY HOLDS.
     *
     * The organisation node had a name, an address, a telephone number and a
     * list of subjects, and no credential at all. A buyer asking "can this
     * factory be trusted with my market" got nothing back, and an assistant
     * reading the same node could not tell a company with papers from one
     * without.
     *
     * `hasCredential` is the property that says it: each document is its own
     * entity, with the number on it and the body that granted it. The list
     * comes from lib/seo/credentials.ts, which is the single place the
     * credentials are written down — and which deliberately holds only the
     * four issued in this company's own name. The high-tech enterprise
     * certificate belongs to a related company and is published on the
     * certifications page with its holder named; it is not claimed here.
     */
    hasCredential: factoryCredentials(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.brand.address,
      addressCountry: 'CN',
      addressLocality: 'Heyuan',
      addressRegion: 'Guangdong',
      /* The postal code, which the graph entity was missing. Google's rich
         result test named it on 2026-11-04: "postalCode 未填写". The number
         is the one the site has always published on its contact and factory
         pages - it was simply not written down anywhere the graph could
         read it. */
      postalCode: siteConfig.brand.postalCode,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: siteConfig.brand.emailSales,
        telephone: siteConfig.brand.tel,
        availableLanguage: ['en', 'es', 'de'],
        areaServed: 'Worldwide',
      },
    ],
    /* The other places this company appears, so an assistant reads them as
       one company rather than several. */
    sameAs: siteConfig.brand.entity.sameAs,
  };
}

/**
 * THE WHOLE GRAPH, published on every public page.
 *
 * WHY IT IS SITE-WIDE AND NOT PER PAGE
 *
 * A product page says `manufacturer: { "@id": ".../#organization" }` - it
 * points at the company. But the company was only ever defined on the about
 * page and the contact page, so on every other page that reference pointed
 * at nothing. An assistant reading a product page was told who made the
 * product and then given no way to look the company up.
 *
 * Publishing the graph from the layout means the entity, the website and
 * the brand are on every page a buyer or a crawler can reach, and the mark
 * travels with the page wherever it is quoted.
 */
export function siteGraphSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema(),
      brandSchema(),
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: siteConfig.brand.name,
        inLanguage: SITE_LANGUAGES,
        publisher: { '@id': `${SITE}/#organization` },
      },
    ],
  };
}

/**
 * THE SOURCES, as data.
 *
 * WHY THIS FILE EXISTS
 *
 * Every number on this site comes from somewhere: the catalogue, a report
 * from a named laboratory, a licence with a number on it, or a person who
 * checked it. That was true before this file, but it was true only inside
 * the heads of the people who wrote the pages — nothing on the site said so,
 * so a buyer (or an assistant) asking "where does this come from?" had
 * nowhere to be sent, and had no reason to believe the answer.
 *
 * So the sources are written down, and they are written down ONCE. The
 * reports here are the same records the certifications page and the report
 * pages use; the licences are the same ones printed on that page. This file
 * does not restate them - it points at them.
 *
 * WHAT THE PAGE MUST NOT DO
 *
 * It must not claim more than the documents support. The ISO certificate is
 * a quality-management certificate for a factory; it is not an approval of
 * any product. The FDA registration is a facility registration; it is not a
 * product approval either. The laboratory reports document our own
 * formulations; a private-label version of the same formula is a different
 * product and needs its own testing. Those limits are stated on the page,
 * because an E-E-A-T page that oversells is worse than no E-E-A-T page.
 */
import { LAB_REPORTS } from '@/content/v2/reports';
import { products } from '@/lib/products';

export type SourceFamily = {
  id: string;
  title: string;
  what: string;
  detail: string;
  href: string;
  linkLabel: string;
};

/** The four places a claim on this site can come from. */
export const SOURCE_FAMILIES: SourceFamily[] = [
  {
    id: 'catalogue',
    title: 'The product catalogue',
    what: 'Every SKU, its specification and its commercial terms.',
    detail:
      'One record per SKU holds the name on the pack, the size, the ingredients, ' +
      'the applications, the minimum order, the lead times, the shelf life, the ' +
      'carton and the HS code. Every figure quoted on a product page is read ' +
      'out of that record rather than typed, so the page and the catalogue ' +
      'cannot disagree.',
    href: '/products.html',
    linkLabel: 'Open the catalogue',
  },
  {
    id: 'reports',
    title: 'Third-party laboratory reports',
    what: 'Named institutes, report numbers, the test, and the SKUs covered.',
    detail:
      'Each report names the laboratory that issued it, the report number, the ' +
      'test performed and the SKUs it covers, and carries the laboratory’s own ' +
      'route to confirm it. The report number is what identifies the document.',
    href: '/certifications.html',
    linkLabel: 'See the certifications page',
  },
  {
    id: 'licences',
    title: 'The permits on file',
    what: 'The issuing entity named exactly as it is printed on the document.',
    detail:
      'The high-tech enterprise certificate, the disinfection-product hygiene ' +
      'licence and the feed-additive production licence are published with ' +
      'their numbers and their validity dates. The ISO 22716 certificate and ' +
      'the FDA registration are handed over during qualification, the ISO one ' +
      'under NDA.',
    href: '/certifications.html',
    linkLabel: 'See the licences on file',
  },
  {
    id: 'people',
    title: 'The people who check it',
    what: 'Our R&D and compliance team, and the date each guide was reviewed.',
    detail:
      'Every guide on this site carries a byline, a publication date and a ' +
      'compliance review. We publish the team rather than an individual ' +
      'name: this company does not publish who wrote a guide, and inventing a ' +
      'person would be a claim nobody could check.',
    href: '/about.html',
    linkLabel: 'About the factory',
  },
];

/**
 * What this site does NOT claim.
 *
 * The most trusted page on a manufacturer's site is the one that says where
 * its authority stops. Each of these is a real limit that a buyer would
 * otherwise discover late, in a qualification meeting, at their cost.
 */
export const LIMITS: { q: string; a: string }[] = [
  {
    q: 'Does the ISO 22716 certificate mean my product is approved?',
    a: 'No. It is a quality-management certificate for the factory. It says the ' +
      'site manufactures to a cosmetic GMP standard; it approves no product. The ' +
      'certificate is handed over during qualification, under NDA.',
  },
  {
    q: 'Does the FDA registration mean my product can be sold in the United States?',
    a: 'No. It is a registration of the establishment, not an approval of any ' +
      'product, and it is not a substitute for the listing or notification your ' +
      'market requires. Which obligations sit with you and which sit with us is ' +
      'written down per destination before the first sample.',
  },
  {
    q: 'Do the laboratory reports cover the formula I will order?',
    a: 'They cover the formulations we hold, and each report names the SKUs it ' +
      'applies to. A private-label version of the same formula is a different ' +
      'product and needs its own testing; we quote that testing separately ' +
      'rather than borrowing a report that does not cover it.',
  },
  {
    q: 'Who wrote the guides, and are they independent?',
    a: 'They are written by our own R&D and compliance team and reviewed by our ' +
      'compliance team. We do not publish guest posts or bought reviews, and ' +
      'the byline says so rather than implying an outside authority we do not ' +
      'have.',
  },
  {
    q: 'Is the price on this site?',
    a: 'No, and that is a policy rather than an omission. Minimum orders, lead ' +
      'times, specifications and the documents are published because they do ' +
      'not change with your volume. The price does, so it is quoted against ' +
      'your brief.',
  },
];

/**
 * The reports, with the SKUs each one covers.
 *
 * Read out of the same records the report pages use, so the table here and
 * the documents behind it cannot drift apart.
 */
export function reportTable(): {
  number: string;
  title: string;
  issuer: string;
  test: string;
  skus: string;
  href: string;
}[] {
  return LAB_REPORTS.map((r) => ({
    number: r.number,
    title: r.title,
    issuer: r.issuer,
    test: r.test,
    skus: r.skus,
    href: `/reports/${r.slug}.html`,
  }));
}

/**
 * The SKUs with no report of their own.
 *
 * Published rather than hidden: a buyer who is told "these eight SKUs are
 * covered and these twelve are not" can plan their testing. A buyer who
 * finds out during qualification cannot.
 */
export function skusWithoutReport(): string[] {
  const covered = new Set<string>();
  for (const r of LAB_REPORTS) {
    for (const part of r.skus.split(',')) {
      const p = part.trim();
      const range = p.match(/^(P\d+)\s*-\s*(P\d+)$/i);
      if (range) {
        for (let i = Number(range[1].slice(1)); i <= Number(range[2].slice(1)); i++) {
          covered.add('P' + String(i).padStart(3, '0'));
        }
      } else if (/^P\d+$/i.test(p)) {
        covered.add(p.toUpperCase());
      }
    }
  }
  return products.filter((p) => !covered.has(p.id)).map((p) => p.id);
}

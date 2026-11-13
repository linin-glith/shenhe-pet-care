import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { HomeHero } from '@/components/v2/HomeHero';
import { Btn } from '@/components/v2/blocks';
import PageFaq from '@/components/v2/PageFaq';
import { activeSkuCount } from '@/lib/products';
import { MarketFitTable } from '@/components/v2/MarketFitTable';
import { marketCounts } from '@/lib/market-claims';
import { webPageSchema } from '@/lib/seo/schema';

const COUNTS = marketCounts('eu');

/**
 * THE EUROPEAN MARKET PAGE.
 *
 * WHY THIS PAGE EXISTS AT ALL
 *
 * The site declared `areaServed: European Union` in its Organization graph
 * while publishing nothing a European buyer could act on: no page named the
 * market, no page answered the one question an EU importer asks first, and
 * /de/ and /es/ redirected to the English home page. A declared market with
 * no page behind it is a claim, not a service.
 *
 * WHAT IT DOES THAT THE OTHER PAGES DO NOT
 *
 * It does not argue that the quality is good. Every other page on this site
 * already makes that argument, and a buyer in Hamburg or Utrecht has heard it
 * from six suppliers this week. What an EU buyer cannot get from those six is
 * a supplier who will state, in writing and in the right regulation numbers,
 * which obligations sit with the factory and which sit with them.
 *
 * So the boundary is drawn in public. Under Regulation (EU) 2023/988 (GPSR),
 * a product may not be placed on the EU market unless an economic operator
 * established in the Union is responsible for it — normally the importer or
 * the EU-established brand owner, not the factory in Guangdong. This company
 * has no such operator today. That is a fact about us, and it is printed on
 * this page rather than discovered by the buyer three emails later, because a
 * supplier who overstates this is one the buyer has to audit.
 *
 * NOTHING HERE IS A COMPLIANCE CLAIM. Every line is either a document we hand
 * over or an obligation that is not ours. The moment this page says "we are
 * EU compliant", it becomes the thing it was written to replace.
 */

const TITLE = 'Pet Care Manufacturing for Europe | GPSR, REACH, Detergents';

const DESCRIPTION =
  'Private label pet care from Guangdong for EU importers: SDS, COA, composition, ISO 22716 on file, '
  + 'plus the GPSR, REACH and CLP duties the importer carries.';

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const canonical = `${siteConfig.brand.siteUrl}/europe.html`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.brand.name,
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
    },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

/** The documents that travel with a shipment, and who issues each. */
const DOCUMENTS: { doc: string; issuer: string; when: string }[] = [
  {
    doc: 'Safety Data Sheet (SDS), 16-section, EU format',
    issuer: 'Us, per batch family',
    when: 'Before the first order, again if the formula changes',
  },
  {
    doc: 'Certificate of Analysis (COA)',
    issuer: 'Us, per batch',
    when: 'With every shipment',
  },
  {
    doc: 'Full ingredient declaration (INCI / IUPAC names, CAS where applicable)',
    issuer: 'Us',
    when: 'With the quotation, so you can classify the SKU before you commit',
  },
  {
    doc: 'GMP / ISO 22716 certificate and the audit report behind it',
    issuer: 'Our certification body',
    when: 'With the quotation',
  },
  {
    doc: 'Third-party laboratory reports (microbiology, heavy metals, stability)',
    issuer: 'Accredited laboratories, report numbers published on this site',
    when: 'With the quotation; verifiable by the report number',
  },
  {
    doc: 'REACH statement on SVHC and the substances we do not use',
    issuer: 'Us, on our own letterhead',
    when: 'With the quotation',
  },
];

/**
 * WHICH REGULATION A SKU FALLS UNDER — AND WHY WE DO NOT ANSWER THIS FOR YOU.
 *
 * The classification decides the label, the dossier and who may sell it. It is
 * made by the party placing the product on the market, on the basis of the full
 * formula and the claims on the pack — neither of which exists until artwork
 * does. A factory that hands out a classification with the quotation is
 * guessing about a product it has not formulated.
 *
 * What the factory can do is name the candidates, so the buyer knows which
 * dossier to start.
 */
const REGIMES: { regime: string; applies: string; whoFiles: string }[] = [
  {
    regime: 'GPSR — Regulation (EU) 2023/988',
    applies: 'Every consumer product placed on the EU market, since 13 December 2024, '
      + 'unless it is already covered by a harmonisation directive.',
    whoFiles: 'An EU-established economic operator must be named as responsible. '
      + 'Normally the importer or the EU brand owner.',
  },
  {
    regime: 'Detergents Regulation — (EC) No 648/2004',
    applies: 'Shampoos, foams and cleaners built on surfactants — most of the grooming line.',
    whoFiles: 'The party placing it on the market: ingredient data sheet, allergen declaration, '
      + 'and biodegradability documentation for the surfactants.',
  },
  {
    regime: 'Biocidal Products Regulation — (EU) 528/2012',
    applies: 'Only where the product or its claims make it a biocidal product — '
      + 'a disinfectant claiming to kill or inhibit micro-organisms on surfaces or animals.',
    whoFiles: 'The applicant, through an EU-authorised product authorisation. '
      + 'The heaviest dossier of the four; it decides whether the SKU is sellable at all.',
  },
  {
    regime: 'REACH — (EC) No 1907/2006',
    applies: 'All of them. Registration duties sit with the EU importer; '
      + 'SVHC communication runs the length of the chain.',
    whoFiles: 'The EU importer registers; we supply composition and the SVHC statement.',
  },
  {
    regime: 'Cosmetics Regulation — (EC) No 1223/2009',
    applies: 'Human cosmetics only. It does NOT cover products for animals — '
      + 'a common mis-filing that surfaces at the customs broker.',
    whoFiles: 'Not applicable to pet care. Named here because it is the one buyers ask about.',
  },
  {
    regime: 'CLP — (EC) No 1272/2008, with REACH Art. 31',
    applies: 'Every mixture that is classified for a health or physical hazard: '
      + 'classification, pictograms, hazard statements, and a safety data sheet in the 16-section format.',
    whoFiles: 'The party placing it on the market. A hazardous mixture for consumer use also needs '
      + 'a UFI on the label, and a poison-centre notification (PCN) before it is placed on the market.',
  },
  {
    regime: 'Veterinary Medicinal Products — (EU) 2019/6',
    applies: 'Any SKU whose claim treats, prevents or cures a disease, or acts on the physiology of the animal: '
      + 'ear-mite prevention, antifungal treatment, dental disease claims.',
    whoFiles: 'The applicant, for a marketing authorisation. We hold none, so those claims come off the pack '
      + 'for the EU — the same position we take for the US, under a different statute.',
  },
  {
    regime: 'Feed additives — (EC) 1831/2003, with labelling under (EC) 767/2009',
    applies: 'Anything eaten: the oral supplements, the drinking-water products, and any additive in them.',
    whoFiles: 'The applicant, for the additive authorisation; then the feed business operator, for the '
      + 'labelling and the feed hygiene registration under (EC) 183/2005.',
  },
  {
    regime: 'Packaging — (EU) 2025/40 (PPWR)',
    applies: 'The pack itself, from 12 August 2026: recyclability, minimum recycled content, '
      + 'and the EPR registration in each member state of sale.',
    whoFiles: 'The producer of the packaging, normally the brand owner or the importer. '
      + 'We supply pack weights, materials and the artwork data your EPR filing needs.',
  },
];

const FAQ = [
  {
    q: 'Do you have an EU responsible person under GPSR?',
    a: 'No, not today. Under Regulation (EU) 2023/988 a product needs an economic operator established in the Union '
      + 'responsible for it, and that operator is normally the importer or the brand owner established in the EU. '
      + 'We supply the technical file that operator needs; we cannot be that operator ourselves, because we are not '
      + 'established in the Union. Any Chinese factory that tells you it is your GPSR responsible person is either '
      + 'misdescribing its role or naming a third party you should verify independently.',
  },
  {
    q: 'What can you give me before I commit to an order?',
    a: 'The full ingredient declaration with INCI and CAS names, the SDS in the 16-section EU format, the COA format, '
      + 'the GMP and ISO 22716 certificates with the audit report, the REACH/SVHC statement, and the third-party '
      + 'laboratory reports with their report numbers. Send the report number to the issuing laboratory and it will '
      + 'confirm the document — that is the point of publishing the numbers.',
  },
  {
    q: 'Which regulation applies to a pet shampoo?',
    a: 'Typically the Detergents Regulation (EC) No 648/2004 for the surfactant base, REACH for the substances, '
      + 'and GPSR for the general safety duty and the responsible operator. If the product or its claims make it '
      + 'biocidal — "kills bacteria", "disinfects" — BPR (EU) 528/2012 joins them, and it is a far heavier dossier. '
      + 'The hazard label itself follows CLP (EC) No 1272/2008: pictograms, signal word and hazard statements, and '
      + 'the classification they come from is section 2 of the SDS we issue for that formula. '
      + 'We will tell you which candidates apply to your formula; the classification itself is made by the party '
      + 'placing the product on the market.',
  },
  {
    q: 'Can you print my EU label and my EU address on the pack?',
    a: 'Yes. We print the artwork you supply, including your EU-established entity and its address, the batch number, '
      + 'the PAO or the "use by" marking, and the warnings your classification requires. We do not draft the label: '
      + 'the wording follows from the classification, which follows from the formula and the claims, and those are '
      + 'yours to own.',
  },
  {
    q: 'Who handles EPR and packaging registration?',
    a: 'The importer or the brand owner established in the EU. Packaging EPR, and WEEE where a device is involved, '
      + 'are registered by the entity placing the product on the market in that member state. We supply pack weight '
      + 'and material data in the format your EPR filing needs.',
  },
  {
    q: 'What are the minimum order and the lead time for an EU shipment?',
    a: `2,000 bottles per catalogue SKU, and 1,000 sets on the bundled sets. Private label runs `
      + '25 days after artwork approval. Catalogue SKUs ship from stock, and the lead time for the quantity '
      + 'you need is stated on the quotation. Terms are FOB or CIF against a named European port, quoted per order — '
      + 'this site publishes no unit price, because freight and volume move the number.',
  },
  {
    q: 'Can you ship to a member state where I am not yet established?',
    a: 'We can ship to the port or the warehouse you nominate. What we cannot do is make the goods lawful there '
      + 'before an EU operator takes responsibility for them — that is the importer\'s act, not the factory\'s.',
  },
  {
    q: 'Will you quote in EUR?',
    a: 'Yes, on request. The quotation is issued in USD by default and converted at the rate on the day it is issued; '
      + 'ask for EUR and the rate and the date are printed on the document.',
  },
];

export default function Page() {
  return (
    <>

      {/*
        THE PAGE NODE.

        This page publishes its own markup — a FAQPage, a HowTo, a
        breadcrumb trail — and it never had a page node among them. So
        nothing in the markup said what page this is, when it was
        published, what it is about, or what it belongs to.

        The node is built by the shared builder, so the company, the
        website and the date all come from the one place each is
        written down.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: TITLE,
              path: '/europe.html',
              description: DESCRIPTION,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

            <HomeHero
        eyebrow={`EUROPEAN MARKET · GPSR · REACH · Heyuan, Guangdong`}
        title="Selling into Europe starts with who is responsible."
        lead={
          'Under Regulation (EU) 2023/988 no product may be placed on the EU market without an economic operator '
          + 'established in the Union responsible for it. That operator is your importer or your EU entity — not the '
          + 'factory. This page states which obligations are ours, which are yours, and which documents we hand over '
          + `for the ${activeSkuCount} SKUs we make. It does not claim a compliance status we do not hold.`
        }
        cta={
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <Btn cta={{ label: 'Ask for the technical file', href: '#rfq', note: 'reply < 1 day' }} />
              <Btn cta={{ label: 'See the catalogue', href: '/products.html', variant: 'secondary' }} light />
            </div>
          </div>
        }
        stats={[
          { value: String(activeSkuCount), label: 'SKUs', note: 'catalogue, quote-only' },
          { value: '2,000', label: 'Minimum order', note: 'bottles per SKU' },
          { value: '25 d', label: 'Private label', note: 'after artwork approval' },
          { value: 'ISO 22716', label: 'GMP', note: 'certificate + audit report' },
        ]}
        image={{
          src: '/assets/img/wallpapers/cat-five-on-sofa.webp',
          alt: 'Pet care products made for European brand owners',
        }}
      />

      {/* ---------- who does what ---------- */}
      <section className="bg-white py-16 md:py-20">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">The boundary</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            What the factory carries, and what stays with you.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            European buyers ask this in the first call and most suppliers answer it vaguely. Here it is as a table,
            because a table is what your compliance consultant will ask for anyway.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-6">
              <h3 className="text-lg font-semibold text-v2-ink-900">We supply</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-v2-ink-700">
                <li>— The formula, with INCI names, CAS numbers and function of each ingredient.</li>
                <li>— A 16-section SDS in the EU format, per formula family.</li>
                <li>— A COA per batch, and the retained sample behind it.</li>
                <li>— GMP / ISO 22716 certificate and the audit report it rests on.</li>
                <li>— Third-party laboratory reports, each with its number, published on this site.</li>
                <li>— A REACH/SVHC statement on our letterhead, and a declaration of what we do not use.</li>
                <li>— Pack weight and material data for your EPR filing.</li>
                <li>— Artwork printing, including your EU entity and address on the pack.</li>
              </ul>
            </div>

            <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-v2-ink-900">You, or your EU operator, carry</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-v2-ink-700">
                <li>— Naming an EU-established economic operator responsible under GPSR Art. 16.</li>
                <li>— The product classification: which regulation governs this SKU, on this formula, with these claims.</li>
                <li>— The label wording that follows from that classification.</li>
                <li>— REACH registration as the importer, and the SVHC communication down the chain.</li>
                <li>— Packaging EPR and, where applicable, WEEE registration in the member state of sale.</li>
                <li>— Import VAT, duty and the customs declaration.</li>
                <li>— Any product authorisation, where the SKU turns out to be biocidal.</li>
              </ul>
              <p className="mt-4 border-t border-v2-ink-200 pt-4 text-xs leading-relaxed text-v2-ink-500">
                This split is the ordinary one for a non-EU manufacturer. It is printed here so you can check it
                against your own adviser before the first call rather than after.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- documents ---------- */}
      <section className="bg-v2-ink-050 py-16 md:py-20">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">The file</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            Six documents, and who issues each.
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-v2-ink-200 text-left">
                  <th className="py-3 pr-6 font-semibold text-v2-ink-900">Document</th>
                  <th className="py-3 pr-6 font-semibold text-v2-ink-900">Issued by</th>
                  <th className="py-3 font-semibold text-v2-ink-900">When you get it</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENTS.map((d) => (
                  <tr key={d.doc} className="border-b border-v2-ink-200 align-top">
                    <td className="py-3 pr-6 text-v2-ink-800">{d.doc}</td>
                    <td className="py-3 pr-6 text-v2-ink-600">{d.issuer}</td>
                    <td className="py-3 text-v2-ink-600">{d.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- which regulation ---------- */}
      <section className="bg-white py-16 md:py-20" id="regimes">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">Classification</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            Eight regimes a pet care SKU can fall under.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            The classification is made by the party placing the product on the market, from the full formula and the
            claims on the pack. What we can do is name the candidates, so you know which dossier to open first.
            Instruments are cited by number and article rather than by link: EUR-Lex answers an automated reader with
            an empty page, so a link here could not be checked before it shipped, and an unverified legal link is a
            dead end waiting for a buyer to find it.
          </p>

          <div className="mt-10 space-y-4">
            {REGIMES.map((r) => {
              // The first sentence of whoFiles is the headline filed-by label;
              // the rest, when there is any, is the detail under the card.
              // Printing the whole thing in both places made every card say
              // the same sentence twice.
              const filedBy = r.whoFiles.split('. ')[0].replace(/\.$/, '');
              const detail = r.whoFiles.slice(filedBy.length).replace(/^\.\s*/, '').trim();
              return (
                <div key={r.regime} className="rounded-v2-lg border border-v2-ink-200 p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                    <h3 className="text-base font-semibold text-v2-ink-900">{r.regime}</h3>
                    <span className="text-xs font-medium uppercase tracking-wider text-v2-ink-500">
                      filed by: {filedBy}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-v2-ink-700">{r.applies}</p>
                  {detail && <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{detail}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- the fit table: each SKU against each rule ---------- */}
      <section className="bg-v2-ink-050 py-16 md:py-20" id="sku-map">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">Fit, SKU by SKU</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            Twenty SKUs, and what each one may say in the EU.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            The regimes above are the general case. This table is the specific one: every SKU we list, the claim our
            own product page makes today, and where that claim lands once the product enters the Union.
          </p>
          <p className="mt-3 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-700">
            <strong className="font-semibold text-v2-ink-900">Ten of the twenty need nothing changed at all.</strong>{' '}
            Where a row says the claim comes off, that is a sentence on the pack and on the listing, not a rejected
            product: the formula still ships, and the label says what the classification allows. Two SKUs are a
            different case — the authorisation is the product, and no wording gets around it.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-v2-ink-600">
            Almost every European buyer asks for a CPSR on the shampoo SKUs. The row for P012 says why there is no such
            document to hand over, and what replaces it.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-v2-ink-500">
            The plant behind these SKUs: 220 employees, a 30,000 m² site and a 5,000 m² ISO 22716 GMP workshop in
            Heyuan, Guangdong.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-v2-ink-600">
            <span><strong className="font-semibold text-v2-accent-700">{COUNTS.ships}</strong> ship as written</span>
            <span><strong className="font-semibold text-v2-ink-900">{COUNTS.off}</strong> need the claim removed</span>
            <span><strong className="font-semibold text-v2-ink-900">{COUNTS.authorisation}</strong> need an authorisation</span>
            <span><strong className="font-semibold text-v2-ink-600">{COUNTS.check}</strong> depend on the wording</span>
          </div>

          <MarketFitTable market="eu" />

          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-v2-ink-500">
            Two notes on scope. The three nutrition pages — immunoglobulin, digestive probiotics, nutrition — have no
            catalogue record, so they are absent from this table; on this market they would be feed under (EC)
            767/2009, with the additive authorisation question on top, and we do not table a SKU we cannot yet
            describe. And every row above still carries the two duties that apply regardless of claim: a safety data
            sheet for the mixture, and a named economic operator inside the Union once the product is placed on the
            market.
          </p>
        </div>
      </section>

      <PageFaq
        items={FAQ}
        title="Questions an EU importer asks us"
        lead="The eight that come up before the first order, answered without rounding anything off."
        url={`${siteConfig.brand.siteUrl}/europe.html`}
        name="European Market FAQ"
      />

      {/* ---------- the ask ---------- */}
      <section className="on-dark bg-v2-accent-600 py-16 md:py-20" id="rfq">
        <div className="v2-container">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 lg:min-w-[20rem] lg:max-w-2xl lg:flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Send one SKU, get the technical file back.
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/85">
                Name the product and the volume. The reply carries the ingredient declaration, the SDS, the
                certificate and the report numbers — enough for your consultant to say whether the SKU is worth
                pursuing before you spend anything on artwork.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Btn cta={{ label: 'Ask for the technical file', href: '/contact.html', variant: 'light' }} />
              <Btn cta={{ label: 'Trade terms', href: '/trade-compliance.html', variant: 'ghost' }} light />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { HomeHero } from '@/components/v2/HomeHero';
import { Btn } from '@/components/v2/blocks';
import PageFaq from '@/components/v2/PageFaq';
import { activeSkuCount } from '@/lib/products';
import { MarketFitTable } from '@/components/v2/MarketFitTable';
import { marketCounts } from '@/lib/market-claims';
import { webPageSchema } from '@/lib/seo/schema';

const COUNTS = marketCounts('us');

/**
 * THE US MARKET PAGE.
 *
 * WHY THIS PAGE EXISTS
 *
 * North America is the largest market this company sells into, and it was the
 * one market with no page. A US buyer arrives with a different question from a
 * European one: not "who is my responsible operator" but "is any of this
 * actually allowed here, and what happens if I claim it". The two markets look
 * similar from Guangdong and are not similar at all.
 *
 * THE ONE THING THIS PAGE DOES
 *
 * It kills the phrase "FDA approved" on sight. That phrase is what a US
 * procurement manager is trained to distrust, and most Chinese suppliers lead
 * with it. FDA does not approve cosmetics, does not approve facilities, and
 * does not approve a pet shampoo. What exists is a facility registration with a
 * number, and it covers less than the buyer assumes. Saying that out loud costs
 * this company a headline and buys it the only thing that matters in a first
 * call: not being caught overstating.
 *
 * NOTHING HERE IS A REGISTRATION CLAIM WE DO NOT HOLD. The EPA registrations
 * are named as things a US importer or brand must hold, not as ours. If a
 * customer asks us to make a disinfecting claim for the US market, the honest
 * answer is that we cannot make that claim lawful — the registrant can.
 */

const TITLE = 'Pet Care Manufacturing for the US Market | FDA, EPA, Prop 65';

const DESCRIPTION =
  'Private label pet care from Guangdong for US importers: SDS, COA and lab reports on file, '
  + 'plus the FDA, EPA/FIFRA and Prop 65 duties that stay with you.';

export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const canonical = `${siteConfig.brand.siteUrl}/usa.html`;
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
      locale: 'en_US',
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

/** The documents that travel with a US-bound shipment, and who issues each. */
const DOCUMENTS: { doc: string; issuer: string; when: string }[] = [
  {
    doc: 'Safety Data Sheet, 16-section, OSHA hazard-communication format',
    issuer: 'Us, per formula family',
    when: 'Before the first order, again if the formula changes',
  },
  {
    doc: 'Certificate of Analysis (COA)',
    issuer: 'Us, per batch',
    when: 'With every shipment',
  },
  {
    doc: 'Full ingredient declaration with INCI names and CAS numbers',
    issuer: 'Us',
    when: 'With the quotation, so your consultant can run the classification',
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
    doc: 'Facility registration details, for your own check on the FDA register',
    issuer: 'Us',
    when: 'On request, with the registration number your compliance file cites',
  },
];

/**
 * WHICH US REGIME A SKU FALLS UNDER — AND WHO MAY CLAIM WHAT.
 *
 * The distinction that decides money is not "is it legal to import" but "what
 * may the label say". A deodorizing spray crosses the border without trouble;
 * the same formula labelled "kills bacteria" is a pesticide, needs an
 * EPA registration held by a registrant, and state registrations on top.
 */
const REGIMES: {
  regime: string;
  filedBy: string;
  source: { label: string; href: string }[];
  applies: string;
  whoFiles: string;
}[] = [
  {
    regime: 'FD&C Act — cosmetics (and why your pet shampoo is not one)',
    filedBy: 'nobody',
    source: [{ label: '21 CFR 700 — cosmetics', href: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-G/part-700' }],
    applies: 'US cosmetics law, including MoCRA facility registration and product listing, '
      + 'covers products for humans. A shampoo for a dog is not a cosmetic, so the cosmetic '
      + 'dossier a European buyer expects has no US counterpart.',
    whoFiles: 'Nobody files a cosmetic dossier for a pet product. What applies instead is '
      + 'general consumer-product safety (CPSC) and truthful advertising (FTC).',
  },
  {
    regime: 'FD&C Act — animal drug',
    filedBy: 'the applicant',
    source: [{ label: '21 CFR 514 — animal drug applications', href: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-514' }],
    applies: 'A therapeutic claim turns the product into an animal drug: treats, cures, '
      + 'prevents a disease, or affects the structure or function of the animal.',
    whoFiles: 'An approved application (NADA) or a listed new animal drug. We do not formulate '
      + 'or label therapeutic claims for the US, and we will tell you when a claim crosses that line.',
  },
  {
    regime: 'FIFRA — EPA pesticide registration',
    filedBy: 'the registrant',
    source: [
      { label: '40 CFR 152 — pesticide registration', href: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-152' },
      { label: 'EPA — FIFRA summary', href: 'https://www.epa.gov/laws-regulations/summary-federal-insecticide-fungicide-and-rodenticide-act' },
    ],
    applies: 'Any antimicrobial claim — "kills bacteria", "disinfects", "sanitises" — and every '
      + 'insect repellent. Both are pesticides under US law regardless of how the pack is designed.',
    whoFiles: 'The registrant: an EPA registration number, an EPA establishment number for the '
      + 'producing plant, and registration in each state of sale. We hold no EPA registration, '
      + 'so US-bound disinfecting SKUs ship with cleaning and odor claims only.',
  },
  {
    regime: 'FDA CVM + state feed law (AAFCO) — pet supplements',
    filedBy: 'shared',
    source: [{ label: '21 CFR 507 — animal food', href: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-E/part-507' }],
    applies: 'A supplement sold as a pet food or feed ingredient is animal food: facility '
      + 'registration, guaranteed analysis, ingredient definitions, and state feed registration.',
    whoFiles: 'The facility registration is ours to hold and show; the state feed registration in '
      + 'the state of sale is the seller\'s, and most states require it before the product is offered.',
  },
  {
    regime: 'California Prop 65 and CARB',
    filedBy: 'the seller',
    source: [
      { label: 'OEHHA — Prop 65', href: 'https://oehha.ca.gov/proposition-65' },
      { label: 'CARB — consumer products', href: 'https://ww2.arb.ca.gov/our-work/programs/consumer-products-program' },
    ],
    applies: 'Prop 65 warnings for listed substances above the safe-harbour exposure level; '
      + 'CARB volatile-organic-compound limits on consumer products, which bind aerosol formats '
      + 'sold in California.',
    whoFiles: 'The seller established in California runs the exposure assessment and prints the '
      + 'warning. We supply full composition and CAS numbers so the assessment can be run before artwork.',
  },
  {
    regime: 'FTC — advertising substantiation and "Made in USA"',
    filedBy: 'the seller',
    source: [{ label: '16 CFR 323 — Made in USA labeling', href: 'https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-323' }],
    applies: 'Every claim on the pack and in the listing must be substantiated before it is made. '
      + '"Made in USA" is a regulated claim with its own standard.',
    whoFiles: 'The seller who publishes the claim. Goods made in Guangdong cannot carry a '
      + '"Made in USA" claim, and this page exists partly so nobody assumes otherwise.',
  },
];

const FAQ = [
  {
    q: 'Are you FDA approved?',
    a: 'No, and no factory is. The FDA does not approve cosmetics, does not approve facilities and '
      + 'does not approve a pet shampoo; it approves drug applications. What a factory can hold is a '
      + 'facility registration, which is a listing, not an approval. Ask any supplier who says '
      + '"FDA approved" for the application number — for a pet grooming product there is not one.',
  },
  {
    q: 'Is a pet shampoo a cosmetic in the US?',
    a: 'No. US cosmetics law, including the registration duties introduced by MoCRA, covers products '
      + 'for humans. A pet grooming product falls under general consumer-product safety and FTC '
      + 'advertising instead. The European habit of asking for a CPSR does not carry over; there is '
      + 'no US equivalent for an animal product.',
  },
  {
    q: 'Can you make a "kills bacteria" claim for the US?',
    a: 'Not lawfully, and not for us to decide. An antimicrobial claim makes the product a pesticide '
      + 'under FIFRA: it needs an EPA registration number held by a registrant, an EPA establishment '
      + 'number for the plant that makes it, and registration in each state where it is sold. We hold '
      + 'no EPA registration. US-bound disinfecting SKUs therefore ship with cleaning and odor '
      + 'claims; if you hold or acquire the registration, we can make the formula to your dossier.',
  },
  {
    q: 'Does the insect repellent line need EPA registration in the US?',
    a: 'Yes. A repellent is a pesticide under US law. Until an EPA-registered product exists, that '
      + 'SKU cannot be sold in the US with a repellency claim. We can supply the formula, the SDS and '
      + 'the efficacy data a registrant needs to file, and we can manufacture once the registration exists.',
  },
  {
    q: 'Are your pet supplements animal food in the US?',
    a: 'Yes. A supplement sold as a pet food or feed ingredient is animal food: the facility has to be '
      + 'registered with the FDA, the label carries a guaranteed analysis, and the state of sale may '
      + 'require its own feed registration. We supply the analysis and the facility registration; the '
      + 'state registration belongs to the seller.',
  },
  {
    q: 'Who handles California Prop 65 warnings?',
    a: 'The party selling into California. Prop 65 is an exposure assessment against a published '
      + 'substance list, and it is run on the full formula, not on a summary. We hand over composition '
      + 'with CAS numbers and the SDS, which is what the assessment needs, and we do not print a '
      + 'warning we cannot justify.',
  },
  {
    q: 'What do I get with the quotation?',
    a: 'The full ingredient declaration with INCI and CAS names, the SDS in the 16-section format, '
      + 'the COA format, the GMP and ISO 22716 certificates with the audit report, the third-party '
      + 'laboratory reports by report number, and the facility registration details. That is enough '
      + 'for your own adviser to say whether the SKU can be sold with the claims you want, before '
      + 'you spend anything on artwork.',
  },
  {
    q: 'Which of your SKUs can ship to the US with no change at all?',
    a: `${COUNTS.ships} of the ${activeSkuCount}: the two odor-control products backed by report NACCYH25014722, `
      + 'both litter deodorizing powders, the spray-gun bundle, the plain pet shampoo, the three no-rinse and paw '
      + `foams, and the household laundry detergent. ${COUNTS.off} more ship once the claim on our page is `
      + `removed for your market — that is a wording change, not a formula change. ${COUNTS.authorisation} need an EPA `
      + 'registration before any repellency claim can be made, and one paw gel depends on how you word '
      + '&ldquo;repairs&rdquo;. The table above names every one, with the reason.',
  },
  {
    q: 'What are the minimum, the lead time and the terms for a US shipment?',
    a: `2,000 bottles per catalogue SKU, and 1,000 sets on the bundled sets. Private label runs `
      + '25 days after artwork approval, catalogue SKUs ship from stock. Terms are FOB or CIF against '
      + 'a named US port, quoted per order; this site publishes no unit price, because volume, '
      + 'packaging and freight move the number more than anything else does.',
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
              path: '/usa.html',
              description: DESCRIPTION,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />

            <HomeHero
        eyebrow={'US MARKET · FDA · EPA / FIFRA · PROP 65 · Heyuan, Guangdong'}
        title="In the US, “FDA approved” is the phrase to be suspicious of."
        lead={
          'The FDA does not approve cosmetics, facilities or pet shampoos — it approves drug applications. '
          + 'What a factory holds is a facility registration, and it does not cover the claims that decide '
          + `whether your SKU is sellable. This page states which US duties are ours, which are yours, and `
          + `which documents travel with the ${activeSkuCount} SKUs we make.`
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
          { value: '0', label: 'EPA registrations', note: 'held by us — see below' },
        ]}
        image={{
          src: '/assets/img/wallpapers/dog-bichon.webp',
          alt: 'Pet care products made for US importers and brand owners',
        }}
      />

      {/* ---------- what a registration is ---------- */}
      <section className="bg-white py-16 md:py-20">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">The boundary</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            A registration is a listing. It is not an approval.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            This split is the ordinary one for a factory outside the United States. It is written down here
            because the alternative is finding it out in a first call, or worse, on a customs broker&apos;s desk.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-6">
              <h3 className="text-lg font-semibold text-v2-ink-900">We supply</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-v2-ink-700">
                <li>— The formula, with INCI names, CAS numbers and the function of each ingredient.</li>
                <li>— A 16-section SDS in the OSHA hazard-communication format, per formula family.</li>
                <li>— A COA per batch, and the retained sample behind it.</li>
                <li>— GMP / ISO 22716 certificate and the audit report it rests on.</li>
                <li>— Third-party laboratory reports, each with its number, published on this site.</li>
                <li>— The facility registration details, so your file cites a number you can check.</li>
                <li>— Artwork printing, including your entity, your address and the warnings you require.</li>
              </ul>
            </div>

            <div className="rounded-v2-lg border border-v2-ink-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-v2-ink-900">You, or your US brand, carry</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-v2-ink-700">
                <li>— Every claim on the pack and the listing, and the substantiation behind it.</li>
                <li>— Any EPA registration, if the SKU makes an antimicrobial or repellency claim.</li>
                <li>— State feed registration, for a supplement sold in that state.</li>
                <li>— The California Prop 65 exposure assessment, and any warning it requires.</li>
                <li>— Import entry, duty, and the HTS classification under your own broker.</li>
                <li>— Retailer compliance packs, which is where most US listings actually stall.</li>
              </ul>
              <p className="mt-4 border-t border-v2-ink-200 pt-4 text-xs leading-relaxed text-v2-ink-500">
                None of this is a compliance status we claim. It is the split that applies to a non-US
                manufacturer, printed so you can check it before the first call rather than after.
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

      {/* ---------- which regime ---------- */}
      <section className="bg-white py-16 md:py-20">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">Classification</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            Six US rules, and what each one actually decides.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            What decides money here is not whether the goods clear customs — most do — but what the label may
            say once they are on a shelf in Ohio or Texas.
          </p>

          <div className="mt-10 space-y-4">
            {REGIMES.map((r) => (
              <div key={r.regime} className="rounded-v2-lg border border-v2-ink-200 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                  <h3 className="text-base font-semibold text-v2-ink-900">{r.regime}</h3>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-v2-ink-500">
                    filed by: {r.filedBy}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-v2-ink-700">{r.applies}</p>
                <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{r.whoFiles}</p>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] text-v2-ink-500">
                  <span className="uppercase tracking-[0.14em]">Source</span>
                  {r.source.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      className="underline decoration-v2-ink-300 underline-offset-2 hover:text-v2-ink-900"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the fit table: each SKU against each rule ---------- */}
      <section className="bg-v2-ink-050 py-16 md:py-20" id="sku-map">
        <div className="v2-container">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-v2-accent-600">Fit, SKU by SKU</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-v2-ink-900 md:text-4xl">
            Twenty SKUs, and what each one may say in the US.
          </h2>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-v2-ink-600">
            The six rules above are the general case. This table is the specific one: every SKU we list, the claim
            our own product page makes today, and what that claim is in the United States. Where the position is
            &ldquo;claim comes off&rdquo;, it means we would change the label and the listing for your market — the
            product itself still ships.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-v2-ink-500">
            The plant behind these SKUs: 220 employees, a 30,000 m² site and a 5,000 m² GMP workshop in Heyuan,
            Guangdong.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-v2-ink-600">
            <span><strong className="font-semibold text-v2-accent-700">{COUNTS.ships}</strong> ship as written</span>
            <span><strong className="font-semibold text-v2-ink-900">{COUNTS.off}</strong> need the claim removed</span>
            <span><strong className="font-semibold text-v2-ink-900">{COUNTS.authorisation}</strong> need your EPA registration</span>
            <span><strong className="font-semibold text-v2-ink-600">{COUNTS.check}</strong> depend on the wording</span>
          </div>

          <MarketFitTable market="us" />

          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-v2-ink-500">
            Two notes on scope. The pet nutrition pages — immunoglobulin, digestive probiotics, nutrition — have no
            catalogue record, so they are deliberately absent from this table; in the US they would be animal food
            under 21 CFR 507, not cosmetics, and we do not table a SKU we cannot yet describe. And where a SKU is
            marked as shipping as written, that is a statement about its claims, not about your label: the pack still
            has to carry your entity, your warnings and whatever your own adviser requires.
          </p>
        </div>
      </section>

      <PageFaq
        items={FAQ}
        title="Questions a US importer asks us"
        lead="The ones that decide whether the SKU is worth pursuing, answered without rounding anything off."
        url={`${siteConfig.brand.siteUrl}/usa.html`}
        name="US Market FAQ"
      />

      {/* ---------- the ask ---------- */}
      <section className="on-dark bg-v2-accent-600 py-16 md:py-20" id="rfq">
        <div className="v2-container">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 lg:min-w-[20rem] lg:max-w-2xl lg:flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Name one SKU and one claim. Get an answer on both.
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/85">
                The reply carries the ingredient declaration, the SDS, the certificate and the report numbers —
                plus a straight answer on whether the claim you want is one this factory can make lawful for
                the US, or one only a registrant can.
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

/**
 * Global Compliance — the differentiator page.
 *
 * WHY THIS PAGE EXISTS AS ITS OWN THING
 * Most pet-care suppliers treat compliance as a certificate wall: a row of
 * logos and a download link. That answers "do you have a certificate" but not
 * the question a compliance officer actually arrives with — "what do I need
 * before I can ship into MY market".
 *
 * This page is organised by DESTINATION MARKET instead. A buyer entering from
 * a search for `CPNP pet cosmetics` or `APVMA registration` lands on the
 * answer, not on a certificate. Each market card links forward to the guide
 * that expands on it, which is where the SEO programme feeds this page.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It does not give legal advice, does not cite specific regulation paragraph
 * numbers, and does not promise that any product will clear any market. It
 * states what we handle and what the buyer must still do. Overclaiming here
 * would be both wrong and, for a compliance audience, immediately discredited.
 */

import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import MarketTable from '@/components/v2/MarketTable';
import { siteConfig } from '@/lib/shenhe.config';
import { REPORT_EVIDENCE_SENTENCE } from '@/lib/commerce';
import { Icon, type IconName } from '@/components/v2/Icon';
import { V3CardGrid, V3Head } from '@/components/v2/V3';
import { FaqView } from '@/components/v2/Converted';
import { Btn } from '@/components/v2/blocks';
import { COMPLIANCE_STEPS } from '@/content/v2/how-to';
import { howToSchema, webPageSchema } from '@/lib/seo/schema';
import { MarketComplianceCard } from '@/components/v2/MarketComplianceCard';
import { COMPLIANCE_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';
import { pageCopy } from '@/lib/i18n/pages';
import { BUILD_DATE } from '@/lib/seo/build-date';


const TITLE = 'Pet Product Compliance Support | FDA, CPNP, APVMA';
const DESCRIPTION =
  'For pet product exporters: FDA registration, EU CPNP notification support, ' +
  'APVMA, MSDS/SDS in 16 languages, testing coordination. ISO 22716 GMP factory.';

/**
 * The metadata of this page, in the buyer's language.
 *
 * A German buyer searches "Tierpflege Hersteller China" and the result
 * they click has to say that in German. The description is the same
 * sentence, said to the search engine.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('global-compliance', locale);
  const title = locale === 'en' ? TITLE : copy.title;
  const description = locale === 'en' ? DESCRIPTION : copy.description;
  const canonical = `${siteConfig.brand.siteUrl}/global-compliance.html`;
  const image = `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.brand.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: locale === 'de' ? 'de_DE' : locale === 'es' ? 'es_ES' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

type Market = {
  flag: string;
  name: string;
  icon: IconName;
  items: string[];
  detail: string[];
};

const MARKETS: Market[] = [
  {
    flag: 'US',
    name: 'United States',
    icon: 'shield',
    items: [
      'FDA establishment registration — a facility listing, not a product clearance',
      'Cosmetic Good Manufacturing Practice',
      'State-level requirements on request',
      'CPSC guidance where a product falls in scope',
    ],
    /*
     * THE DISINFECTANT LINE, IN THE UNITED STATES.
     *
     * There are three possible positions for a Chinese factory here, and
     * they were written as a choice: (A) we do not sell disinfectants to the
     * United States, (B) we hold an EPA registration, (C) the importer of
     * record holds it. Only B needs a number we do not have, and only A
     * gives up a market.
     *
     * So the sentence below is written to be true under all three: it
     * states the rule (a disinfecting claim is a FIFRA pesticide, not an
     * FDA clearance), says what we supply (the formulation record and the
     * label artwork), and says who signs (the party that sells the product
     * in the United States - that is what the law says, not a claim about
     * us).
     *
     * If the factory ever holds its own EPA registration number, one clause
     * is added and nothing else changes.
     */
    detail: [
      'Our facility is FDA-registered and the registration is verifiable through the FDA database. What we cannot do is register YOUR brand or product — a product listing attaches to your company, so that step stays yours.',
      'A product that claims to disinfect or to kill pathogens is a pesticide under FIFRA in the United States, and needs an EPA registration number printed on its label. That is a different route from FDA establishment registration, and we do not present one as the other. We supply the formulation record and the label artwork for that submission; the registration itself is held by the party that sells the product in the United States, because the registrant carries the claims on the label. Tell us the destination and the claims you intend to make, and we will confirm in writing what is ours to do and what is yours.',
      'We hold the GMP and batch records that support a cosmetic-product listing, and package them into a dossier rather than leaving you to request them one by one.',
      'State rules vary and some are stricter than the federal rule. We quote per destination state rather than claiming one national answer.',
      'Whether a product falls under CPSC depends entirely on what it claims to do. We tell you which side of that line it sits on before the label is printed, not after.',
    ],
  },
  {
    flag: 'EU',
    name: 'European Union',
    icon: 'globe',
    items: [
      'GPSR and the EU responsible-person handover',
      'REACH, CLP and BPR documentation',
      'Responsible Person coordination',
      'EN and Chinese label compliance',
    ],
    detail: [
      'A pet-only product is not a cosmetic: Regulation (EC) 1223/2009 Article 2(1)(a) covers products for the human body, so there is no CPNP notification and no cosmetic safety report for a pet line -- filing a pet product under CPNP is the mis-filing that surfaces at the customs broker. If the same formula is also sold for human use, that is a separate cosmetic project and we prepare the dossier for it. Either way you appoint a Responsible Person inside the EU -- that person is legally your company, so we document the handover rather than pretending to be them.',
      'REACH and BPR documentation is assembled from the exact ingredient list on the formula you are buying, not from a generic template.',
      'Label artwork is produced bilingual (EN / Chinese) with the responsible-person address block and the mandated product-information panel in place.',
      'A compliant label is only half the requirement: the Responsible Person file has to match what is on the packaging. We check the two against each other before production.',
    ],
  },
  {
    flag: 'AU',
    name: 'Australia & New Zealand',
    icon: 'leaf',
    items: [
      'APVMA registration support',
      'NICCAS / AICIS ingredient disclosure',
      'ARTG listing coordination where in scope',
      'English-language dossier assembly',
    ],
    detail: [
      'APVMA registration support depends on the claim on the label. A deodorizer and an insect repellent are treated differently, and we will tell you which one your product is.',
      'NICCAS / AICIS disclosure is generated from our formula records, so the ingredient list in the dossier is the one actually in the bottle.',
      'Where a product is a therapeutic good, ARTG listing coordination is a separate process with its own timeline — we scope it separately rather than folding it into the standard lead time.',
      'The dossier is assembled in English end to end, with no translation step between the formula and the submission.',
    ],
  },
  {
    flag: 'Global',
    name: 'Every destination',
    icon: 'truck',
    items: [
      'MSDS / SDS in 16 languages',
      'SGS and Intertek test coordination',
      'Batch-specific COA on every shipment',
      'Free Sale Certificate and origin documents',
    ],
    detail: [
      'An SDS in 16 languages ships with every consignment. For the US market specifically we hold standing relationships with AMA Labs (New Hampshire) and Eurofins (USA).',
      'Test coordination runs through SGS, Intertek or Pony Testing. If a claim on your label needs substantiation, the test is booked before the artwork is locked.',
      'A batch-specific COA travels with every shipment, so the certificate a retailer asks for three years later is retrievable by batch number.',
      'Every document is digitally signed and archived for ten years. Files for products you ordered years ago are still retrievable on request.',
    ],
  },
];
const SERVICES = [
  'Compliance document preparation handled in-house by two regulatory specialists',
  'Third-party laboratory coordination — SGS, Intertek, Pony Testing, AMA Labs, Eurofins',
  'Dossier assembly in the destination market’s language',
  'Ten-year digital archive of every issued document, retrievable per batch',
];

const FAQ = [
  {
    q: 'Do you handle compliance for my destination market?',
    a: 'For the United States, European Union, Australia/New Zealand and the major EAEU and Latin American markets, yes — we prepare the documentation and coordinate third-party testing. For a market we have not shipped to before, tell us the destination and we will confirm in writing what we can and cannot cover before you commit.',
  },
  {
    q: 'Can you provide an MSDS or SDS?',
    a: 'Yes. An SDS in 16 languages ships with every consignment, alongside a batch-specific COA, INCI disclosure, allergen declaration, animal-testing statement and Certificate of Free Sale where applicable. All documents are digitally signed and archived for ten years.',
  },
  {
    q: 'Who has to do the regulatory filing — you or us?',
    a: 'We prepare and assemble everything the destination requires. A market-specific registration still has to be made in your company’s name, because it attaches to your brand rather than to ours. We will tell you exactly which steps are ours and which are yours before the first sample.',
  },
  {
    q: 'What if my product makes a claim we have not tested?',
    a: 'We will say so, and we will tell you what testing would be required to substantiate it. An unsupported claim is a customs and liability risk in every market, and we do not put one on a label. This is the same answer we give in writing during development.',
  },
];

function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    dateModified: BUILD_DATE,
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export default function GlobalCompliancePage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const copy = pageCopy('global-compliance', locale);
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
                    path: '/global-compliance.html',
                    description: fitDescription(DESCRIPTION),
                  }),
                ).replace(/</g, '\\u003c'),
              }}
            />

                  <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />

      {/* The steps, in the markup an assistant can lift. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(
          howToSchema({
        name: 'How to work out the compliance route for your market',
        description:
          'Four steps: pick the market, decide what you will claim, get the file list and the lead time, and put the label wording through the same route.',
        url: '/global-compliance.html',
        
        steps: COMPLIANCE_STEPS,
      })
        ) }}
      />

      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">{copy.eyebrow}</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            {copy.h1}
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Tell us the destination market and we will tell you — in writing —
            what has to be filed, what we prepare, and what stays yours.{' '}
            {REPORT_EVIDENCE_SENTENCE}{' '}
            The park covers 30,000 m², of which 5,000 m² is the ISO 22716 GMP workshop; 220 people work
            here, and the monthly capacity is 1,000,000 bottles.
          </p>
          <DataBar items={standardDataBar(['markets', 'years', 'labs', 'people'])}  tone="dark" />

          <PageAnswer {...COMPLIANCE_ANSWER} />
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'Check my market', href: '/contact.html' }} light />
            <Btn cta={{ label: 'Download the reports', href: '/certifications.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- H2: markets ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Coverage by destination market"
            sub="Four markets we ship to regularly. Anything else — ask, and we will confirm before you commit."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {MARKETS.map((m) => (
              <MarketComplianceCard
                key={m.name}
                flag={m.flag}
                name={m.name}
                icon={m.icon}
                items={m.items}
                detail={m.detail}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- H2: what we actually do (service band) ---------- */}
      <section className="v3-section v3-band-dark">
        <div className="v2-container">
          <V3Head
            dark
            title="What the service actually covers"
            sub="Not a certificate wall — the work between your formula and a cleared shipment."
          />
          <ul className="mt-14 grid gap-px sm:grid-cols-2" style={{ background: 'rgb(255 255 255 / 0.12)' }}>
            {SERVICES.map((s) => (
              <li key={s} className="flex items-start gap-3 p-7" style={{ background: '#0f1a1f' }}>
                <Icon name="check" size={17} className="mt-0.5 shrink-0 text-v2-accent-300" />
                <p className="text-[0.9375rem] leading-relaxed text-v2-ink-100">{s}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- H2: FAQ ---------- */}
      <FaqView b={{ kind: 'faq', eyebrow: 'Compliance FAQ', title: 'Compliance FAQ', items: FAQ }} />

      {/* ---------- CTA ---------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Check compliance for your target market.
            </h2>
            <p className="mt-3 text-white/85">
              Send the destination and the product type. You get a written answer on
              what is required and who owns each step — before any sample is made.
            </p>
          </div>
          <a data-journey="contact" href="/contact.html" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900">
            Check my market
          </a>
        </div>

      </section>

      {/*
        * THE MARKET TABLE, OUT OF THE BAND.
        *
        * It renders its own section and was nested inside the teal
        * call to action anyway, so its grey text had nothing behind it
        * but teal.
        */}
      <MarketTable />
    </>
  );
}
// Certifications — v2 engine.
//
// Rebuilt around DOCUMENTS rather than badges. A procurement lead does not
// need another row of trust logos; they need to open the actual third-party
// report. Every item below is a real file in /public/assets/img/certs/.
//
// WHAT THE PAGE SHOWS, AND WHY
//
//   1. LICENCES ON FILE — the three licence scans that exist, rendered as
//      the documents themselves. Each is captioned with the entity printed
//      on it, the number and the validity, because a licence belonging to a
//      different legal entity must say so rather than be implied away.
//
//      The first file was long called "Production-License.jpg" and was
//      described here as a business licence. It is neither: read off the
//      scan it is a 高新技术企业证书 (high-tech enterprise certificate), and
//      it was scanned lying on its side. It has been rotated back and
//      renamed to what it actually is.
//
//   2. THIRD-PARTY REPORTS — ten distinct lab reports, each card showing the
//      real cover page of the PDF, the report number and the issuing
//      institute. The cover is the proof: a report number a buyer can quote
//      back to us is worth more than a description of one.
//
//   3. ALSO HELD — the two credentials we hold but do not publish (ISO 22716
//      GMP certificate, FDA establishment registration). They are statements
//      with no public scan, so they are presented as statements.
//
// HONESTY RULES THAT SHAPED THIS PAGE
//   - Only files that exist are listed. The count is the number of DISTINCT
//     documents: two pairs in the folder are byte-identical duplicates
//     (sha256 verified), so "12 reports" was always 10.
//   - Every title states what the document actually is. The file called
//     "Factory-Audit-Report-FM12662R01Da.pdf" is NOT a factory audit — it is
//     an entrustment analysis report (2024FM12662R01Da) on the Purepaws cat
//     spray. It is listed as what it is.
//   - The headline figures are quoted from the reports themselves: 94.2%
//     ammonia removal (NACCYH25014722), >93.3% hydrogen sulfide removal
//     (NACCYH25014721), 96.6% ammonia removal for the litter line
//     (NACCYH25007027).
//
// ACTION REQUIRED: geo-build/gen-routes.py overwrites this file.

import Img from '@/components/v2/Img';
import DataBar, { standardDataBar } from '@/components/v2/DataBar';
import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import { pageCopy } from '@/lib/i18n/pages';
import page from '@/content/certifications.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { Icon, type IconName } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import PageFaq from '@/components/v2/PageFaq';
import { CERTIFICATION_STEPS } from '@/content/v2/how-to';
import { howToSchema } from '@/lib/seo/schema';
import { CERTIFICATIONS_FAQ } from '@/content/v2/certifications-faq';
import { localisedFaq } from '@/lib/i18n/faq';
import { CERTIFICATIONS_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';
import { REPORT_HASHES } from '@/lib/report-hashes';
import { coverageCounts, coveredSkus, uncoveredSkus, COVERAGE } from '@/lib/report-coverage';
import { products } from '@/lib/products';
import { productUrl } from '@/lib/products';


const data = page as unknown as LegacyPage;

/**
 * The metadata of this page, in the buyer's language.
 *
 * A German buyer searches "Tierpflege Hersteller China" and the result
 * they click has to say that in German. The description is the same
 * sentence, said to the search engine.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const copy = pageCopy('certifications', locale);
  if (locale === 'en') return legacyMetadata(data);
  return {
    ...legacyMetadata(data),
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: {
      ...legacyMetadata(data).openGraph,
      title: copy.title,
      description: fitDescription(copy.description),
      locale: locale === 'de' ? 'de_DE' : 'es_ES',
    },
    twitter: {
      ...legacyMetadata(data).twitter,
      title: copy.title,
      description: fitDescription(copy.description),
    },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

const CERT_BASE = '/assets/img/certs';

/*
 * The fingerprint of each published report, by report number.
 *
 * It is a fact about the file, not about the company, so it is published
 * whether or not a batch has been attested. A buyer who downloads the
 * PDF can compute the same hash and compare it with the one on the chain.
 */
const REPORT_HASH_BY_NUMBER: Record<string, string> = Object.fromEntries(
  REPORT_HASHES.reports.map((r) => [r.reportNumber, r.sha256]),
);

/** A licence we can actually show. */
type Licence = {
  file: string;
  title: string;
  /** The entity exactly as it is printed on the document. */
  entity: string;
  /** Document number as printed. */
  number: string;
  validity: string;
  icon: IconName;
};

const LICENCES: Licence[] = [
  {
    file: 'High-Tech-Enterprise-Certificate.jpg',
    title: 'High-tech enterprise certificate',
    // English first. The Chinese legal name stays on the line — it is what
    // the document says, and a buyer matching the licence needs to see it —
    // but the page and the image alt read English-first, because the site
    // speaks to buyers in English and an alt that opens in Chinese is read
    // by nobody outside China.
    entity: 'Shenzhen Yongsheng Environmental Engineering Co., Ltd. · 深圳市永盛环境工程有限公司',
    number: 'GR202544200988',
    validity: 'Issued 2025-12-25 · valid 3 years',
    icon: 'sparkle',
  },
  {
    file: 'Hygiene-License.jpg',
    title: 'Disinfection-product hygiene licence',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    number: '粤卫消证字[2023]-07-第0002号',
    validity: 'Valid to 2027-05-21',
    icon: 'shield',
  },
  {
    file: 'Feed-Additive-License.jpg',
    title: 'Feed additive production licence',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    number: '粤饲添(2023)H07002',
    validity: 'Valid to 2028-04-23',
    icon: 'leaf',
  },
];

/** A lab report we can actually hand over. */
type Report = {
  file: string;
  title: string;
  /** The issuing body, as printed on the report. */
  issuer: string;
  /** Report number as printed — the part a buyer quotes back. */
  number: string;
  note: string;
  /** The claim the report supports, with the number in it. */
  finding?: string;
  /** The same claim, with the sample and the context left off. */
  findingShort?: string;
  icon: IconName;
  /**
   * THE VERIFICATION CODE PRINTED ON THE REPORT.
   *
   * Six of the ten reports carry one. It is the code the laboratory
   * prints next to the report number so that the two can be checked
   * together, and it is the one thing on the document that a buyer can
   * use to ask the laboratory "is this real" without relying on us.
   *
   * It was on every one of those documents and on no page of this
   * site. A buyer asking whether a report is genuine was told to ask
   * for the number — and the number alone is the easier thing to
   * misprint, which is exactly what happened to the disinfectant
   * report.
   */
  verificationCode?: string;
  /**
   * THE BATCH NUMBER ON THE SAMPLE THE REPORT WAS RUN ON.
   *
   * Every report names the batch it was tested on: 2024061101 for
   * the pet deodorant, 2024061102 for the multi-effect wash,
   * 2024061103 for the disinfectant and the neutralising spray.
   *
   * That is the link between this site's evidence and the batch
   * attestations: the hash that goes on the chain is the hash of the
   * report for a named batch, and the batch is named here. It was
   * never on the page.
   */
  lot?: string;
};

const GDDCM = 'Guangdong Detection Center of Microbiology';
const NACC = 'Guangzhou Institute of Microbiology (NACC)';
const GIM =
  'Guangzhou Institute of Microbiology Group Co., Ltd.';

/**
 * The address of a report's own page.
 *
 * The PDF is the document a customs reviewer asks for; the report page
 * is the part a reader can actually read -- what was tested, what the
 * method was, what the number came out as, and which SKUs it covers.
 *
 * A buyer who downloads the PDF gets the proof. A buyer who reads the
 * page gets the proof in a form they can quote back to their QA team --
 * and, for an assistant reading this site, the only form it can read at
 * all. The numbers inside a PDF are invisible to a crawler.
 *
 * The slug is the report number in lower case, which is what the
 * generated report pages are addressed by.
 */
function reportSlug(number: string): string {
  return number.toLowerCase();
}

const REPORTS: Report[] = [
  {
    file: 'Test-Ammonia-Removal-Efficiency.pdf',
    title: 'Pet deodorant — ammonia removal',
    issuer: NACC,
    number: 'NACCYH25014722',
    note: 'The determination behind the 94.2% ammonia figure quoted on every deodorizing SKU. 1.53 → 0.088 mg/m³, measured on the Power Odor Eliminator (Extra Strength) / PURE PAWS PET DEODORANT sample.',
    finding: 'Ammonia 1.53 → 0.088 mg/m³, a 94.2% removal, on the pet deodorant sample.',
    findingShort: 'Ammonia 1.53 → 0.088 mg/m³, a 94.2% removal.',
    icon: 'flask',
  },
  {
    file: 'Test-Hydrogen-Sulfide-Removal-Efficiency.pdf',
    title: 'Pet deodorant — hydrogen sulfide removal',
    issuer: NACC,
    number: 'NACCYH25014721',
    note: 'Independent H₂S determination for the same product family. 0.15 → <0.010 mg/m³, >93.3% removal, on the same Power Odor Eliminator (Extra Strength) sample.',
    finding: 'Hydrogen sulfide 0.15 → <0.010 mg/m³, a 93.3% removal, on the same sample.',
    findingShort: 'Hydrogen sulfide 0.15 → <0.010 mg/m³, a 93.3% removal.',
    icon: 'flask',
  },
  {
    file: 'Cat-Litter-Deodorizer-Ammonia-Removal-Test.pdf',
    title: 'Cat litter deodorizer — ammonia removal',
    issuer: NACC,
    number: 'NACCYH25007027',
    note: 'Litter-line performance: 96.6% ammonia removal, 1.53 → 0.052 mg/m³.',
    finding: 'Ammonia 1.53 → 0.052 mg/m³, a 96.6% removal, on the cat litter deodorizer.',
    findingShort: 'Ammonia 1.53 → 0.052 mg/m³, a 96.6% removal.',
    icon: 'leaf',
  },
  {
    file: 'Test-Available-Chlorine-Stability-1Year.pdf',
    title: 'Disinfectant — available chlorine stability and acute oral toxicity',
    issuer: GIM,
    number: 'XJ2025001233',
    note: 'Three determinations on the Disinfectant & Deodorizing Solution (sodium hypochlorite) sample: pH 6.96 at 25 °C; available chlorine 130 mg/L before storage against 111 mg/L after 14 days at 54 °C — a 14.6% fall, inside the ≤15% that GB/T 38499-2020 sets for a one-year shelf life; and an acute oral toxicity test on 20 mice.',
    finding: 'Available chlorine 130 mg/L, and 111 mg/L after 14 days at 54 °C — a 14.6% fall.',
    findingShort: 'Available chlorine 130 mg/L, 111 mg/L after 14 days at 54 °C.',
    icon: 'shield',
  },
  {
    file: 'Factory-Audit-Report-FM12662R01Da.pdf',
    title: 'Purepaws neutralising spray — full analysis',
    issuer: GDDCM,
    number: '2024FM12662R01Da',
    note: 'Fungicidal experiment under GB/T 27404.1.1.9 on the CatClean Antifungal & Deodorizing Solution sample: kill rates above 99.999% against Trichophyton mentagrophytes CMCC(F)T5b and Microsporum canis ATCC 10214. An entrustment analysis report — not a factory audit.',
    finding: 'Kill rates above 99.999% against Trichophyton mentagrophytes and Microsporum canis.',
    findingShort: 'Kill rates above 99.999% against two test fungi.',
    verificationCode: 'GUL4MJQ5',
    lot: '2024061103',
    icon: 'flask',
  },
  {
    file: 'Disinfectant-Solution-Bilingual-Spec.pdf',
    title: 'Disinfectant & deodorizing liquid — analysis',
    issuer: GDDCM,
    number: '2024FM11610R01D',
    note: 'Suspension quantitative bactericidal test (GB/T 27404.1.1.7.4) and fungicidal experiment (GB/T 27404.1.1.9) on the Disinfectant & Deodorizing Solution line: kill rates above 99.9999%.',
    finding: 'Kill rates above 99.9999% in the suspension bactericidal and fungicidal tests.',
    findingShort: 'Kill rates above 99.9999% in the bactericidal and fungicidal tests.',
    verificationCode: '8WGX5LT7',
    lot: '2024061103',
    icon: 'factory',
  },
  {
    file: 'Multi-Effect-Wash-Antibacterial-Test.pdf',
    title: 'Multi-effect wash — antibacterial',
    issuer: GDDCM,
    number: '2024FM11612R01D',
    note: 'Inhibition rate above 99.97% under GB/T 27404.1.11.3.2. The standard reads ≥90% as a strong antibacterial action, so the sample is well past it.',
    finding: 'Inhibition rate above 99.97% under GB/T 27404.1.11.3.2.',
    findingShort: 'Inhibition rate above 99.97% under GB/T 27404.1.11.3.2.',
    verificationCode: '2LD7JWQC',
    lot: '2024061102',
    icon: 'flask',
  },
  {
    file: 'Multi-Effect-Wash-Mite-Control-Test.pdf',
    title: 'Multi-effect wash — mite control',
    issuer: GDDCM,
    number: '2024FM11612R03D',
    note: 'Mite control: 100% kill rate at 48 hours against the dust mite Dermatophagoides farinae (adults and nymphs). The standard reads ≥90% as having a mite-removal effect.',
    finding: 'Mite control: 100% kill rate at 48 hours against Dermatophagoides farinae.',
    findingShort: 'Mite control: 100% kill rate at 48 hours.',
    verificationCode: 'YMC4E3AS',
    lot: '2024061102',
    icon: 'shield',
  },
  /*
   * THE FILE NAME IS NOT WHAT THE DOCUMENT IS.
   *
   * The PDF is called Multi-Effect-Wash-Ingredient-Report.pdf, and the
   * document inside it is a microbiological and quality test: an aerobic
   * bacterial count, thermotolerant coliforms, a total effective
   * substance and a pH, against QB/T 4524-2013. It carries no ingredient
   * list - the record said it did, and the document says otherwise.
   *
   * The address stays as it is. It is published, it is linked from the
   * site, it is in the report-hash file and it has been indexed; a
   * rename would 404 every link to it and buy a buyer nothing. The
   * words are corrected. The URL is not.
   */
  {
    file: 'Multi-Effect-Wash-Ingredient-Report.pdf',
    title: 'Multi-effect wash — microbiological and quality test',
    issuer: GDDCM,
    number: '2024FM11612R02D',
    note: 'Microbiological and quality test on the multi-effect cleansing line: aerobic bacterial count below 10 CFU/g, thermotolerant coliforms absent, total effective substance 18.9% and pH 6.36, on batch 2024061102 (500 mL, emulsion). The results meet QB/T 4524-2013.',
    finding: 'Aerobic bacterial count below 10 CFU/g, thermotolerant coliforms absent; meets QB/T 4524-2013.',
    findingShort: 'Aerobic bacterial count below 10 CFU/g; meets QB/T 4524-2013.',
    verificationCode: 'L2XB63B9',
    lot: '2024061102',
    icon: 'flask',
  },
  {
    file: 'Pet-Deodorizing-Spray-Non-Toxic-Cert.pdf',
    title: 'Pet deodorant — safety assessment',
    issuer: GDDCM,
    number: '2024FM11611R02D',
    note: 'Safety assessment of the Power Odor Eliminator (Extra Strength) pet deodorant: an acute oral toxicity test on the sample from batch 2024061101.',
    finding: 'An acute oral toxicity test on the pet deodorant sample, batch 2024061101.',
    findingShort: 'An acute oral toxicity test on the sample, batch 2024061101.',
    verificationCode: 'TY5CLUAC',
    lot: '2024061101',
    icon: 'check',
  },
];

/** Credentials we hold but do not publish — stated, not illustrated. */
const ALSO_HELD: { label: string; detail: string; icon: IconName }[] = [
  {
    label: `${siteConfig.metrics.gmpStandard} GMP`,
    detail: 'Cosmetic GMP scope, class-D cleanroom filling lines. Certificate and audit report available under NDA.',
    icon: 'shield',
  },
  {
    label: 'FDA Registered',
    detail: 'US establishment registration. Facility ID and product listings shared on request during qualification.',
    icon: 'check',
  },
];

export default function CertificationsPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const faqItems = localisedFaq('certifications', locale, CERTIFICATIONS_FAQ);
  const copy = pageCopy('certifications', locale);
  return (
    <>
      <JsonLd page={data}  />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema({
        name: 'How to plan the certification for your target market',
        description:
          'Four steps: tell us the market and the claims, get the certification route quoted, decide what is held and what is published, and run the testing on your own formula.',
        url: '/certifications.html',
        
        steps: CERTIFICATION_STEPS,
      })) }}
      />

      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">{copy.eyebrow}</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            {copy.h1}
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Every report below is a real file, issued by a named third-party
            institute, with a report number you can quote back to us. If your
            compliance team needs something that is not here, ask and we will
            send it.
            Ten third-party lab reports in total: 7 from GDDCM and 3 from NACC,
            issued by CMA- and CNAS-accredited labs. Three Chinese licences sit
            beside them — a hygiene licence, a feed additive licence and a
            high-tech enterprise certificate.
            The park covers 30,000 m², of which 5,000 m² is the ISO 22716 GMP
            workshop. 220 people work here, and the monthly capacity is 1,000,000
            bottles.
          </p>
          <DataBar items={standardDataBar(['labs', 'years', 'people', 'markets'])}  tone="dark" />

          <PageAnswer {...CERTIFICATIONS_ANSWER} />
        </div>
      </section>

      {/* ---------- licences on file ---------- */}
      <section className="v2-section">
        <div className="v2-container">
          <p className="v2-eyebrow">Licences on file</p>
          <h2 className="v2-display mt-4 text-3xl md:text-4xl">The permits, scanned</h2>
          <p className="v2-lead mt-4 max-w-2xl">
            These are the documents themselves, not descriptions of them. The
            issuing entity is printed on each one and is named here exactly as
            it appears.
          </p>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LICENCES.map((l) => (
              <li
                key={l.file}
                className="el-spotlight el-lift flex flex-col overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-white"
              >
                <div className="flex aspect-[4/3] items-center justify-center border-b border-v2-ink-100 bg-v2-ink-050 p-4">
                  <Img
                    src={`${CERT_BASE}/${l.file}`}
                    alt={`${l.title} — ${l.entity}`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain shadow-sm ring-1 ring-v2-ink-200"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                      {l.title}
                    </h3>
                    <span
                      aria-hidden
                      className="mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-v2-md bg-v2-accent-050 text-v2-accent-700 ring-1 ring-v2-accent-100"
                    >
                      <Icon name={l.icon} size={18} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-v2-ink-500">{l.entity}</p>
                  <p className="mt-3 font-mono text-[11px] tracking-wide text-v2-ink-700">{l.number}</p>
                  <p className="mt-1 text-xs text-v2-ink-400">{l.validity}</p>
                  {/*
                    The page shows the clean scan; the file the buyer takes
                    away carries the mark.

                    Two copies of every licence, on purpose. The card above
                    is a preview - a page of watermarked scans is a page
                    nobody reads, and the watermark would sit on top of the
                    very document a buyer is trying to check. The copy under
                    "View full document" is the one that leaves the site,
                    so that is the one that is marked: anyone who finds the
                    file afterwards can see where it came from.
                  */}
                  <a
                    href={`${CERT_BASE}/download/${l.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v3-link mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold"
                  >
                    View full document <span aria-hidden>&rarr;</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>

          {/*
            WHICH SKU EACH REPORT COVERS, AND WHICH HAVE NONE.
            *
            * The ten reports above are the documents. This is the
            * index of them against the catalogue: which product each
            * one was run on, and - the part that matters - which
            * products have no report at all.
            *
            * A buyer who reads "ten third-party reports" and then
            * cannot tell whether the product they are asking about is
            * one of the ten has learned nothing. So it is said here:
            * the eight that have one, and the twelve that do not.
            *
            * The twelve are not an embarrassment and not a gap to be
            * hidden. They are a list of work that can be done, and a
            * buyer who needs one of them tested can say so.
            */}
          <div className="mt-16 border-t border-v2-ink-200 pt-10">
            <p className="v2-eyebrow">Coverage</p>
            <h3 className="v2-display mt-4 max-w-3xl text-2xl md:text-3xl">
              Which product each report covers
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-v2-ink-600">
              {coverageCounts().covered} of our {coverageCounts().total} catalogue products
              have a published report behind them. The other {coverageCounts().uncovered}{' '}
              have not been submitted for testing yet — we say which ones they are rather than
              leave a buyer to assume. Where a report exists for a product, its number is on
              that product&apos;s own page as well as here.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-v2-ink-900">
                  Covered by a published report ({coveredSkus().length})
                </h4>
                <ul className="mt-3 space-y-1.5">
                  {coveredSkus().map((id) => {
                    const p = products.find((x) => x.id === id);
                    const cov = COVERAGE[id];
                    const nums = (cov?.reports ?? []).join(' · ');
                    return (
                      <li key={id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <a
                          href={productUrl(p!)}
                          className="font-semibold text-v2-accent-700 underline underline-offset-2"
                        >
                          {id}
                        </a>
                        <span className="text-v2-ink-700">{p?.name_en}</span>
                        <span className="font-mono text-[11px] text-v2-ink-400">{nums}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-v2-ink-900">
                  No published report yet ({uncoveredSkus().length})
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-v2-ink-500">
                  Each of these is a formulation of its own. We have not submitted it, and we
                  will not put another product&apos;s report next to it.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {uncoveredSkus().map((id) => {
                    const p = products.find((x) => x.id === id);
                    return (
                      <li key={id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <a
                          href={productUrl(p!)}
                          className="font-mono font-semibold text-v2-ink-600 underline underline-offset-2"
                        >
                          {id}
                        </a>
                        <span className="text-v2-ink-700">{p?.name_en}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 rounded border border-v2-ink-200 bg-white p-4 text-xs leading-relaxed text-v2-ink-600">
                  If you need one of these tested — a claim, a market, a specification — tell us
                  which product and which claim, and we will come back with the laboratory, the
                  method, the sample size and the cost before anything is ordered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- third-party reports ---------- */}
      <section className="v2-section bg-v2-ink-050">
        <div className="v2-container">
          <p className="v2-eyebrow">Downloadable</p>
          <h2 className="v2-display mt-4 max-w-2xl text-3xl md:text-4xl">
            {REPORTS.length} third-party reports
          </h2>
          <p className="v2-lead mt-4">
            Lab determinations and analyses, each with the issuing institute and
            the report number printed on the cover. These are the documents a
            customs or retail-compliance reviewer will actually ask for.
          </p>

          {/* The accreditation marks of the ISSUING LABORATORIES — the real
              marks printed on the report letterheads, lifted from the PDFs.
              They say "accredited lab", not "certified product". */}
          <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
            {[
              { src: 'cma.png', alt: 'CMA — China Metrology Accreditation' },
              { src: 'cnas.png', alt: 'CNAS — China National Accreditation Service' },
              {
                src: 'ilac-mra.png',
                alt: 'ILAC-MRA — International Laboratory Accreditation Cooperation Mutual Recognition Arrangement',
              },
            ].map((m) => (
              <Img
                key={m.src}
                src={`${CERT_BASE}/marks/${m.src}`}
                alt={m.alt}
                loading="lazy"
                decoding="async"
                className="h-12 w-auto object-contain opacity-90"
              />
            ))}
            <p className="max-w-md text-xs leading-relaxed text-v2-ink-500">
              Ten laboratory reports, issued by laboratories accredited under CMA
              and CNAS and recognised through the ILAC Mutual Recognition
              Arrangement. That is the basis on which importers and authorities
              outside China accept them.
            </p>
          </div>

          <p className="mt-8 max-w-3xl text-[0.9375rem] leading-relaxed text-v2-ink-600">
            Each report is published with the SHA-256 of the exact file this site
            serves. Download the PDF, compute the hash, compare it. A hash proves
            one thing: the file in your hands is the file that was filed. It does
            not approve a product for any market.
          </p>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REPORTS.map((d) => (
              <li
                key={d.file}
                className="el-spotlight el-lift flex flex-col overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-white"
              >
                {/* The real cover page of the PDF. If a report is missing from
                    this folder, there is no cover to show — and no card. */}
                <a
                  href={`${CERT_BASE}/${d.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-v2-ink-100 bg-white p-3"
                  aria-label={`Open ${d.title} report`}
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-v2-ink-050">
                    <Img
                      src={`${CERT_BASE}/thumbs/${d.file.replace(/\.pdf$/i, '.webp')}`}
                      alt={`${d.title} — report ${d.number}, cover page`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain ring-1 ring-v2-ink-200"
                    />
                  </div>
                </a>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                    {d.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-medium text-v2-ink-400">{d.issuer}</p>
                  <p className="mt-1 font-mono text-[11px] tracking-wide text-v2-ink-600">{d.number}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-v2-ink-500">{d.note}</p>
                  {/*
                    THE FINGERPRINT.
                    The hash of this exact file, so a buyer can compute it
                    from the PDF they downloaded and compare it with the
                    one recorded on the chain. It is a fact about the file,
                    not about the company, so it is published whether or
                    not a batch has been attested yet.
                  */}
                  {(d.verificationCode || d.lot) && (
                    <p className="mt-3 text-[11px] leading-relaxed text-v2-ink-500">
                      <span className="font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
                        As printed on the report
                      </span>
                      {d.verificationCode && (
                        <span className="mt-1 block">
                          Verification code{' '}
                          <span className="font-mono text-[10.5px] text-v2-ink-600">
                            {d.verificationCode}
                          </span>
                        </span>
                      )}
                      {d.lot && (
                        <span className="mt-0.5 block">
                          Batch tested{' '}
                          <span className="font-mono text-[10.5px] text-v2-ink-600">
                            {d.lot}
                          </span>
                        </span>
                      )}
                    </p>
                  )}
                  {REPORT_HASH_BY_NUMBER[d.number] && (
                    <p className="mt-4 border-t border-v2-ink-100 pt-3 text-[11px] leading-relaxed text-v2-ink-500">
                      <span className="font-semibold uppercase tracking-[0.1em] text-v2-ink-400">
                        File fingerprint
                      </span>
                      <span className="mt-1 block font-mono text-[10.5px] break-all text-v2-ink-600">
                        SHA-256 {REPORT_HASH_BY_NUMBER[d.number]}
                      </span>
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <a
                      href={`/reports/${reportSlug(d.number)}.html`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-v2-ink-900 underline underline-offset-4 hover:decoration-v2-accent-500"
                    >
                      Read the report <span aria-hidden>&rarr;</span>
                    </a>
                    <a
                      href={`${CERT_BASE}/${d.file}`}
                      download
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-v2-accent-700 underline underline-offset-4 hover:text-v2-accent-800"
                    >
                      Download PDF <span aria-hidden>&darr;</span>
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- also held ---------- */}
      <section className="v2-section">
        <div className="v2-container">
          <p className="v2-eyebrow">Also held</p>
          <h2 className="v2-display mt-4 max-w-2xl text-3xl md:text-4xl">
            Held, shared on request
          </h2>
          <p className="v2-lead mt-4 max-w-2xl">
            These two we do not publish on the open web. The certificate and the
            registration record are handed over during qualification.
          </p>
          {/*
            THE ICON IS PART OF THE TERM.
            A group may only hold a term and a value, and the icon was the
            group's first child - so it was neither. The icon decorates the
            term, so it goes inside the term, and the term spans the icon's
            column and the label's column so the row still reads
            icon | label | detail.
          */}
          <dl className="mt-10 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
            {ALSO_HELD.map((r) => (
              <div
                key={r.label}
                className="grid gap-3 py-6 sm:grid-cols-[auto_16rem_1fr] sm:items-start sm:gap-6"
              >
                <dt className="grid grid-cols-1 items-start gap-4 sm:col-span-2 sm:grid-cols-[auto_16rem] sm:gap-6">
                  <span
                    aria-hidden
                    className="inline-grid h-10 w-10 place-items-center rounded-v2-md bg-v2-accent-050 text-v2-accent-700 ring-1 ring-v2-accent-100"
                  >
                    <Icon name={r.icon} size={19} />
                  </span>
                  <span className="text-[1.0625rem] font-semibold text-v2-ink-900">{r.label}</span>
                </dt>
                <dd className="text-sm leading-relaxed text-v2-ink-500">{r.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/*
        The questions, and the schema that says so.

        The page above is documents: scans and report numbers. It had
        almost no questions, and a page of documents with no questions
        is a page an assistant can read but cannot answer. These ten
        are the questions a buyer asks — and every answer carries the
        limit of the thing it names, because that is the one that gets
        answered wrongly.
      */}
      <PageFaq
        items={faqItems}
        title="Questions about our certifications"
        lead="The answers below say what each certificate covers, and what it does not. A certificate read as a product approval is a claim we have never made."
        url="/certifications.html"
        name="Certifications and lab reports"
      />
    </>
  );
}

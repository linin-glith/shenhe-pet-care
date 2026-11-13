import { siteConfig } from '@/lib/shenhe.config';

/**
 * Factory page — structured content.
 *
 * The legacy page had eleven real photographs (six production lines, the
 * cleanroom, the QC lab, the export dock, the park exterior) buried inside
 * HTML blobs with placeholder captions like "save each JPEG at the target
 * path". This file names them properly so each line's photograph sits beside
 * the line that made it.
 */

export type ProductionLine = {
  img: string;
  name: string;
  caption: string;
};

/** Six production lines across four product lines, each with its real photo. */
export const PRODUCTION_LINES: ProductionLine[] = [
  { img: '/assets/img/factory/line-1-purified-water.jpg', name: 'Purified water system', caption: 'Every formula starts from controlled water.' },
  { img: '/assets/img/factory/line-2-mixing-blending.jpg', name: 'Mixing & blending', caption: 'High-shear blending for consistent batches.' },
  { img: '/assets/img/factory/line-3-cleanroom-filling.jpg', name: 'Cleanroom filling', caption: 'Class-D cleanroom filling line.' },
  { img: '/assets/img/factory/line-4-capping-sealing.jpg', name: 'Capping & sealing', caption: 'Automated capping and sealing.' },
  { img: '/assets/img/factory/line-5-labeling-coding.jpg', name: 'Labeling & coding', caption: 'Label application and batch coding.' },
  { img: '/assets/img/factory/line-6-carton-packing.jpg', name: 'Carton packing', caption: 'Carton packing for export.' },
];

export type Facility = { img: string; name: string; caption: string };

/**
 * Supporting facilities — three named H3 sections, symmetric with R&D.
 * MediaCardGrid / Bento small cards use these; each has a real photograph.
 */
export const FACILITIES: Facility[] = [
  { img: '/assets/img/factory/gmp-cleanroom-interior.jpg', name: 'Cleanroom Interior', caption: '5,000 m² class-D cleanroom filling hall.' },
  { img: '/assets/img/factory/qc-lab-bench.jpg', name: 'QC & Testing Laboratory', caption: 'On-site lab; every batch sampled before release.' },
  { img: '/assets/img/factory/warehouse-export-dock.jpg', name: 'Export Logistics & Wharf Support', caption: 'Container loading photographed at the export dock.' },
];

export type FactoryMetric = { value: string; label: string; note?: string };

export const FACTORY_METRICS: FactoryMetric[] = [
  { value: '30,000 m²', label: 'Industrial park', note: '3 connected blocks' },
  { value: '5,000 m²', label: 'GMP workshop', note: 'class-D cleanroom' },
  { value: '1M', label: 'Bottles / month', note: 'current capacity' },
  { value: '220+', label: 'Employees', note: 'on-site' },
];

/**
 * Factory FAQ — GEO layer. Answers carry a number, a document or a boundary.
 * The four questions match the mandated sequence exactly.
 */
export const FACTORY_FAQ = [
  {
    q: 'Can I visit your factory?',
    a: 'Yes. On-site visits are welcomed, and a video audit can be arranged for buyers who cannot travel. Both are scheduled through the contact page.',
  },
  {
    q: 'What is your monthly production capacity?',
    a: '1,000,000 bottles a month across six production lines and four product lines, inside a 30,000 m² park with a 5,000 m² GMP workshop and a class-D cleanroom.',
  },
  {
    q: 'Do you support third-party factory audit?',
    a: 'Yes. A full third-party factory audit is downloadable on the certifications page under reference FM12662R01Da, alongside eleven laboratory reports.',
  },
  {
    q: 'What certifications do you hold?',
    a: 'ISO 22716 cosmetic GMP for the cleanroom lines, FDA establishment registration, and production permits for disinfectants and feed additives.',
  },
];

/**
 * What each line actually does, in the order a batch passes through.
 *
 * The six photographs above show the lines; this says what happens on each
 * one and which control applies. A buyer auditing a supplier asks about
 * process control, not about photographs, and this is the part that answers
 * it without inventing a number.
 */
export type LineDetail = {
  step: string;
  name: string;
  what: string;
  control: string;
};

export const LINE_DETAILS: LineDetail[] = [
  {
    step: '01',
    name: 'Purified water system',
    what:
      'Every formula starts from water produced on site rather than bought in. ' +
      'A municipal or tanker supply introduces a variable that no finished-product ' +
      'test can correct for afterwards, because a batch made from the wrong water ' +
      'has already been through the whole line.',
    control:
      'Treated in house and sampled before it enters a tank. The water is a raw ' +
      'material here, not a utility.',
  },
  {
    step: '02',
    name: 'Mixing & blending',
    what:
      'High-shear blending brings a surfactant formula to a uniform batch. The ' +
      'failure mode here is not a wrong recipe but an inconsistent one — a batch ' +
      'that is correct at the top of the tank and not at the bottom.',
    control:
      'Batch records per blend, so a finished-product complaint can be traced back ' +
      'to the blend rather than only to the release test.',
  },
  {
    step: '03',
    name: 'Cleanroom filling',
    what:
      'Filling happens in a class-D cleanroom inside the 5,000 m² GMP workshop. ' +
      'This is the step that determines whether the rest of the process mattered, ' +
      'because it is the last point at which the product is still protected.',
    control:
      'ISO 22716 governs the workshop. Environmental monitoring covers the filling ' +
      'room rather than being assumed.',
  },
  {
    step: '04',
    name: 'Capping & sealing',
    what:
      'Automated capping and induction sealing. Seal integrity matters more than it ' +
      'sounds: a shampoo that loses a percent of its volatile content in transit is ' +
      'a different product from the one that passed the release test.',
    control:
      'Seal checks at the line, recorded per batch.',
  },
  {
    step: '05',
    name: 'Labeling & coding',
    what:
      'Label application and batch coding. The code is what ties a bottle back to ' +
      'its certificate of analysis, so a buyer can trace any unit to the batch it ' +
      'came from.',
    control:
      'Every batch carries a code that resolves to the batch certificate shipped ' +
      'with the consignment.',
  },
  {
    step: '06',
    name: 'Carton packing & export',
    what:
      'Carton packing for export, at the loading dock. Carton count and gross weight ' +
      'are specified per SKU because they are what the freight quote is built on — ' +
      'a 12-bottle carton and a 24-bottle carton of the same product are not the ' +
      'same landed cost.',
    control:
      'Carton specifications published per SKU. Loading is photographed at the dock.',
  },
];

/**
 * The quality path — what happens between a blend and a container.
 *
 * Written as a sequence rather than a claim, because a buyer who asks "how do
 * you test" wants the order of operations, not the adjective.
 */
export const QC_PATH = [
  {
    title: 'Raw material acceptance',
    body:
      'Incoming materials are checked against specification before they enter ' +
      'production. A material that fails acceptance does not get blended and ' +
      'tested afterwards; it is rejected at the door, which is cheaper than ' +
      'discarding a finished batch.',
  },
  {
    title: 'In-process checks',
    body:
      'Blends and fills are sampled during production rather than only at the end, ' +
      'so a drift is caught while it is still correctable.',
  },
  {
    title: 'Finished product release',
    body:
      'Each batch is sampled before release, and the result becomes the batch ' +
      'certificate of analysis that ships with the consignment. The certificate is ' +
      'batch-specific — a generic one would tell a buyer nothing they could use.',
  },
  {
    title: 'Traceability',
    body:
      'The batch code on the container resolves to the blend and to the certificate. ' +
      'This is what makes a complaint investigable rather than arguable.',
  },
  {
    title: 'Documents that travel with the order',
    body:
      'A batch certificate of analysis, a 16-language safety data sheet, the ' +
      'commercial invoice carrying the HS code, and a certificate of origin, ' +
      'alongside the bill of lading or air waybill.',
  },
];

/**
 * Where the product goes.
 *
 * The destination list matters commercially: it tells a buyer that the
 * regulatory frames they need have already been navigated, and it tells an
 * AI system which markets this factory actually serves.
 */
export const EXPORT_MARKETS = [
  { market: 'European Union', note: 'GPSR technical file and Responsible Person coordination prepared per product; a CPNP notification only where the formula is also sold for human use' },
  { market: 'United Kingdom', note: 'Separate market from the EU; documentation prepared against UK requirements' },
  { market: 'Russia & EAEU', note: 'EAC conformity route, the largest single destination group' },
  { market: 'Brazil', note: 'ANVISA notification route for cosmetics' },
  { market: 'United States', note: 'FDA establishment registration held; MoCRA requirements considered for the destination' },
  { market: 'Middle East', note: 'GCC markets; documentation prepared per destination' },
];

/**
 * The company timeline, read from the shared config so the About page and
 * this one cannot disagree about when the factory was founded or when it
 * reached its current capacity.
 */
export const FACTORY_TIMELINE = siteConfig.timeline;

/**
 * Factory FAQ — extended for GEO.
 *
 * The first four are the questions every factory audit begins with. The rest
 * are the ones buyers ask after the first enquiry comes back, and they are
 * answered here because a buyer who has to ask them is a buyer who has not yet
 * decided.
 */
export const FACTORY_FAQ_EXTENDED = [
  ...FACTORY_FAQ,
  {
    q: 'Do you exhibit at pet industry trade shows?',
    a: 'Yes. We exhibited at the 2025 Global Pet Supplies Supply Chain Conference and the Shenchong Zhenxuan Pet Supplies Supply Chain Exhibition, held at the Shenzhen Convention & Exhibition Center (Futian) on 10 July 2025, booth Brand 42.',
  },
  {
    q: 'Are you a manufacturer or a trading company?',
    a: 'A manufacturer. Guangdong Shenhe Zhongke Biotechnology Co., Ltd. was founded in 2020 in Heyuan, Guangdong, and the site is a 30,000 m² industrial park with a 5,000 m² GMP workshop. We do not buy and resell, and we do not sell direct to consumers.',
  },
  {
    q: 'How long have you been producing pet care products?',
    a: 'Since 2020. ISO 22716 GMP certified, all four product lines reached commercial production in 2021, and monthly capacity reached 300,000 bottles in 2025 and 1,000,000 bottles in 2026.',
  },
  {
    q: 'Which countries do you export to?',
    a: 'Russia and the EAEU, Brazil, the European Union, the United Kingdom, the United States and Middle Eastern markets. Documentation is prepared against the requirements of the destination rather than against a single market.',
  },
  {
    q: 'What is the difference between your stock formulas and a private label programme?',
    a: 'A stock formula uses our formulation with your label, bottle and box. A private label programme can use your own formula developed through formulation, sampling, stability and filling. Both are confirmed against a specific enquiry because the lead time and the minimum depend on which one it is.',
  },
  {
    q: 'Can you provide a sample before we order?',
    a: 'Samples of any catalogue SKU are available with the shipping covered by the buyer. Custom-formula samples are scoped against the development brief. Tell us the SKU and the destination and we will send the sample plan.',
  },
  {
    q: 'Do you hold third-party laboratory reports for the products?',
    a: 'Yes. Laboratory determinations for efficacy and safety are published on the certifications page, including ammonia removal efficiency, pathogen kill rate and available chlorine stability. A full third-party factory audit report is available under its reference number.',
  },
];

/**
 * Why a buyer visits rather than audits remotely.
 *
 * A video audit is offered and is often enough. This is the case for the
 * visit, so the page answers the question honestly rather than pushing it.
 */
export const VISIT_ARGUMENTS = [
  {
    title: 'You can see the water plant',
    body:
      'The purified water system is the first thing on the walk, because it is the ' +
      'first thing on every batch. A buyer who has asked about raw materials once ' +
      'usually wants to see where they come in.',
  },
  {
    title: 'You can watch a fill running',
    body:
      'The class-D cleanroom can be visited during production rather than shown ' +
      'emptied for a visit. What matters about a cleanroom is what it does in use.',
  },
  {
    title: 'You can inspect a carton',
    body:
      'Carton count, gross weight and dimensions decide the freight bill, and they ' +
      'are the figures most often quoted approximately. Measuring one is faster ' +
      'than reconciling a landed-cost error later.',
  },
  {
    title: 'You can meet the people who will answer your email',
    body:
      'The sales manager who replies to your enquiry is in the building. For a ' +
      'relationship that is worth several round trips of clarification, it is worth ' +
      'a day.',
  },
];
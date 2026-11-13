/**
 * R&D (Capabilities) page — structured content.
 *
 * SYMMETRY WITH FACTORY (deliberate)
 * Factory proves the hardware; this page proves the thinking. Both use the
 * same block skeleton so a buyer moving between them reads one system:
 *
 *   Factory : HeroA → StatBadgeGroup → H2 Our Production Lines (6 cards)
 *             → H2 Supported Facilities (3 H3) → H2 Factory FAQ → CtaBand
 *   R&D     : HeroA → StatBadgeGroup → H2 Our R&D Workflow (6 steps)
 *             → H2 R&D Testing & Lab Facilities (3 H3) → H2 R&D FAQ → CtaBand
 *
 * DATA INTEGRITY
 * Every figure below is lifted verbatim from the extracted legacy FAQPage
 * JSON-LD and page body — 8 in-house chemists (5 MSc, 3 BSc), 2 regulatory
 * specialists, 2 SCUT PhDs, 1.2% batch reject rate YTD 2026, 30–40 buyer audits
 * per year. Nothing here is invented. Where a number did not exist in the
 * source, no number was written.
 */

export type ProcessStep = { no: string; title: string; desc: string };

/** Six steps, visually symmetric with the Factory six-line grid. */
export const RD_WORKFLOW: ProcessStep[] = [
  { no: '01', title: 'Requirement intake', desc: 'Target claim, market, packaging and constraint set with the buyer.' },
  { no: '02', title: 'Formula design', desc: 'In-house formulation work in the joint labs.' },
  { no: '03', title: 'Bench sampling', desc: 'Lab samples ship within 7–10 days of brief confirmation.' },
  { no: '04', title: 'Stability & safety', desc: 'Stability and compatibility testing before anything is quoted as final.' },
  { no: '05', title: 'Sample confirmation', desc: 'Buyer signs off on the sample, or we iterate.' },
  { no: '06', title: 'Tech transfer', desc: 'Documented handover to production under NDA.' },
];

export type LabFacility = { img: string; name: string; caption: string };

/**
 * Three H3 lab capabilities, mirroring Factory's three facility H3s.
 * Reuses the on-site lab and QC bench photography already in the asset set —
 * no new photography is claimed.
 */
export const RD_FACILITIES: LabFacility[] = [
  { img: '/assets/img/factory/qc-lab-bench.jpg', name: 'Formula & Ingredient Testing', caption: 'Bench work for active content, pH and viscosity.' },
  { img: '/assets/img/factory/gmp-cleanroom-interior.jpg', name: 'Safety & Stability Test Chamber', caption: 'Stability and compatibility held before release.' },
  { img: '/assets/img/factory/warehouse-export-dock.jpg', name: 'Packaging Compatibility Validation', caption: 'Compatibility checked against the final pack.' },
];

export type RdMetric = { value: string; label: string; note?: string };

export const RD_METRICS: RdMetric[] = [
  { value: '8', label: 'In-house chemists', note: '5 MSc · 3 BSc' },
  { value: '2', label: 'SCUT PhDs', note: 'cosmetic science' },
  { value: '6', label: 'QC steps', note: 'IQC → OQC' },
  { value: '1.2%', label: 'Batch reject rate', note: 'YTD 2026' },
];

export type RdFaq = { q: string; a: string };

/**
 * Verbatim from the extracted legacy FAQPage. Kept in the same four-question
 * shape as Factory where the questions align, and extended where the R&D
 * page genuinely needs its own.
 */
export const RD_FAQ: RdFaq[] = [
  {
    q: 'Can you develop custom formulas for pet care products?',
    a: 'Yes. Full custom OEM formulation and a lab sample run 30–45 days; stability and compatibility testing is scheduled per product and quoted separately, because it takes months rather than weeks, developed in-house, with two of our chemists holding doctorates from South China University of Technology and joint laboratories with SCUT and Guangdong University of Technology.',
  },
  {
    q: 'How long does a new formula development take?',
    a: '30–45 days for a full custom formula and a lab sample; stability and compatibility testing is a scheduled programme that runs in months and is quoted separately. Lab samples ship within 7–10 days of brief confirmation, so you see the first result before the full cycle closes.',
  },
  {
    q: 'Are all lab reports available for audit?',
    a: 'Yes. Every shipment carries a batch-specific COA, a 16-language MSDS, INCI disclosure, allergen declaration, animal-testing statement and a Certificate of Free Sale. All are digitally signed and archived for ten years.',
  },
  {
    q: 'Can you help with regulatory document preparation?',
    a: 'Yes. Two in-house regulatory specialists prepare the destination-market document set, and we hold standing partnerships with SGS (Guangzhou), Intertek (Shenzhen), Pony Testing (Beijing), AMA Labs (New Hampshire) and Eurofins (USA) for export certification.',
  },
];
/**
 * What a private label programme actually involves, stage by stage.
 *
 * RD_WORKFLOW lists the technical stages. This lists the DECISIONS a buyer
 * has to make at each one, because the thing that stalls a private label
 * project is rarely the chemistry — it is a formula or an artwork that was
 * never signed off, or a minimum that was assumed rather than confirmed.
 */
export type ProgramStage = {
  stage: string;
  name: string;
  youDecide: string;
  weDo: string;
  commonStall: string;
};

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    stage: '01',
    name: 'Brief and feasibility',
    youDecide: 'Which products, which destination market, and roughly what volume you are planning for.',
    weDo:
      'Tell you which of the existing catalogue formulas is closest to what you want, ' +
      'and which parts would need development. A custom formula is not automatically the ' +
      'better choice — for a buyer who has not tested a market, a proven catalogue ' +
      'formula with your label is usually the faster and cheaper way to find out.',
    commonStall:
      'Sending a target retail price without a volume, because the minimum and the price ' +
      'depend on each other and neither can be settled first.',
  },
  {
    stage: '02',
    name: 'Formula path',
    youDecide:
      'Ours or yours. A catalogue formula with your packaging, or a formula developed for you.',
    weDo:
      'For a catalogue formula, quote against the existing base. For a development ' +
      'programme, scope the work: formulation, sample, stability and the filling run, ' +
      'with the cost and time confirmed against the brief.',
    commonStall:
      'Expecting a development programme to cost the same as a private label on a stock ' +
      'formula. They are different projects with different risk.',
  },
  {
    stage: '03',
    name: 'Packaging and artwork',
    youDecide:
      'Bottle, label, box, colour, and the copy in every language the destination requires.',
    weDo:
      'Supply or recommend the format, produce 3D renders before tooling, and check the ' +
      'artwork against the destination market requirements before it goes to print.',
    commonStall:
      'Artwork arriving after the tooling is ordered, which is the most common cause of a ' +
      'slipped launch date.',
  },
  {
    stage: '04',
    name: 'Sample and approval',
    youDecide: 'Whether the sample matches what you expected.',
    weDo: 'Produce samples against the agreed brief and iterate on what does not.',
    commonStall:
      'Approving a sample and then changing the formula afterwards. Approval is the point ' +
      'at which the specification is fixed; changes after it are a new project.',
  },
  {
    stage: '05',
    name: 'Production',
    youDecide: 'The quantity, which must meet the confirmed minimum for that configuration.',
    weDo:
      'Schedule the filling run, produce against the approved sample, and sample each ' +
      'batch for release.',
    commonStall:
      'A quantity that meets the minimum spread across many SKUs rather than concentrated ' +
      'in fewer. Twenty-five hundred units across ten SKUs is a different order from the ' +
      'same total in three.',
  },
  {
    stage: '06',
    name: 'Documentation and shipment',
    youDecide: 'The destination, the freight method and the payment terms.',
    weDo:
      'Ship with a batch certificate of analysis, a 16-language safety data sheet, a ' +
      'commercial invoice carrying the HS code, a certificate of origin, and the bill of ' +
      'lading or air waybill.',
    commonStall:
      'Finding out the documentation requirement after the goods are packed. Destination ' +
      'requirements differ by market and should be settled at the brief stage.',
  },
];

/**
 * The four obligations that decide whether an import clears.
 *
 * Written because "what do I need to import this" is asked far more often
 * than "what does the factory do", and answering it properly is a bigger part
 * of the job than a factory brochure suggests.
 */
export const IMPORT_OBLIGATIONS = [
  {
    title: 'Classification',
    body:
      'The HS code follows the product, and it decides duty rate, licensing and which ' +
      'regulatory body applies. Across the grooming line three codes cover the whole ' +
      'catalogue, but a claim-bearing product and a cosmetic product can classify ' +
      'differently. This is settled before labelling, not after.',
  },
  {
    title: 'Label compliance',
    body:
      'The destination market decides the label language, the required declarations and ' +
      'the responsible-party arrangement. The European Union and the United Kingdom are ' +
      'treated as separate markets. Artwork is checked against the destination before ' +
      'tooling, not after.',
  },
  {
    title: 'Product registration',
    body:
      'Most cosmetic markets require a notification or registration before sale, and ' +
      'the route differs: GPSR, CLP and REACH for a pet line, CPNP and a cosmetic ' + 'safety report only for a human-use line, ANVISA notification ' +
      'for Brazil, EAC conformity for the EAEU. Preparation starts at the brief stage ' +
      'because registration takes calendar time the factory does not control.',
  },
  {
    title: 'Shipping documents',
    body:
      'The commercial invoice, packing list, certificate of origin and the transport ' +
      'document are what actually move the goods. A certificate of analysis and a safety ' +
      'data sheet ship alongside them for the buyer who will need them on file.',
  },
];

/**
 * What we will not do — stated plainly.
 *
 * A page that only lists capabilities reads as a sales page, and a buyer who is ' +
 * * deciding whether a supplier is the right fit reads the limits before the claims.
 * These are real constraints, not a disclaimer.
 */
export const OUT_OF_SCOPE = [
  {
    item: 'Retail and single-unit sales',
    why:
      'The business is B2B. There is no retail price and no consumer channel, so a ' +
      'buyer planning to resell is planning on the right footing and a shopper is not.',
  },
  {
    item: 'Claims without evidence',
    why:
      'A product that makes a health claim needs supporting laboratory data before it ' +
      'ships. A claim that cannot be substantiated is not something we put on a label, ' +
      'regardless of how competitive the market is.',
  },
  {
    item: 'Formulation for a regulated drug claim',
    why:
      'The plant operates under cosmetic GMP. Anything that would make the product a ' +
      'medicinal product is outside what ISO 22716 covers, and we would say so rather ' +
      'than attempt it.',
  },
  {
    item: 'Very small trial quantities',
    why:
      'A full production run is what the plant is set up for. Sample quantities are ' +
      'available for evaluation; a commercial trial order at a fraction of the minimum ' +
      'is not, because the changeover cost is the same either way.',
  },
];

/**
 * R&D FAQ, extended.
 *
 * The first four are the technical questions. The rest are the commercial ones
 * that arrive once a buyer is seriously interested, and they are answered here
 * because a buyer who has to ask them is a buyer who has not yet decided.
 */
export const RD_FAQ_EXTENDED = [
  ...RD_FAQ,
  {
    q: 'Can you develop a formula from scratch?',
    a: 'Yes, through formulation, sampling, stability and filling. The cost and timeline depend on how far the brief is from an existing catalogue formula, so both are confirmed against the development brief rather than quoted in advance.',
  },
  {
    q: 'What is the difference between ODM and OEM?',
    a: 'ODM is our formula with your label, packaging and colour. OEM can be a formula developed for you. They are different projects with different timelines and different risk, and the right one depends on whether you have already tested the market.',
  },
  {
    q: 'Do you sign an NDA?',
    a: 'Yes. An NDA is provided for OEM work. If a formula is developed for you and you want it registered as your IP, that is arranged as part of the project rather than afterwards.',
  },
  {
    q: 'How long does stability testing take?',
    a: 'It depends on the claim and the shelf life being sought, and it runs on a calendar the factory does not compress. This is the stage most often underestimated in a launch plan, which is why it is scoped at the brief stage rather than discovered during production.',
  },
  {
    q: 'Can you match an existing competitor formula?',
    a: 'We can work to a specification you provide. Whether a given formula can be replicated exactly depends on the raw materials available to us, and we will tell you at the feasibility stage rather than after development has started.',
  },
  {
    q: 'What do you need from me to start?',
    a: 'The product types, the destination market, an indicative annual volume, and your preferred format. With those four, we can say which catalogue formula is closest, what would need developing, and what the commercial structure looks like.',
  },
];
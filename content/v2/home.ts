import type { V2Block } from '@/lib/v2/block-types';
import { siteConfig } from '@/lib/shenhe.config';
import { productUrl, products, activeSkuCount } from '@/lib/products';
import { clientProducts } from '@/lib/client-products';
import { whatsappLink } from '@/lib/contact-links';
import { lowestMoq, standardMoq } from '@/lib/commerce';

/*
 * THE HOME PRODUCT GRID IS BUILT IN components/v2/HomeSections.tsx.
 *
 * It used to be built here, from a hand-written table of legacy image
 * filenames (LEGACY_IMAGE). That table drifted: one of the files it named,
 * outdoor-protection.png, is no longer in the repo, so the card would have
 * rendered a broken image, and the rest pointed at pre-migration assets
 * rather than at the photograph of the product being sold. It also went
 * unused - the grid moved to the component and the table stayed behind as a
 * trap for whoever re-wired it.
 *
 * The image for a card now comes from the packshot registry (lib/packshots.ts)
 * through imageFor(), the same source the catalogue and the product pages
 * use, so a card cannot show a different picture from its own page.
 *
 * PRICING POLICY - read before editing this file:
 * `ProductSpec.description` embeds literal wholesale figures
 * ("Pricing: B2B EXW RMB <amount> per set"). The site is quote-only, so read
 * `function_en` for copy and `moq` for qualification. Never reach for
 * `description` or `b2b_price_rmb` in a render path.
 */

/* ------------------------------------------------------------------ */
/* VALUE PROPS — the four differentiators, answered before proof       */
/* ------------------------------------------------------------------ */

/**
 * WHY THESE FOUR AND WHY HERE
 * The hero establishes that the factory is real. It does not say what the
 * factory CAN do for the buyer. That gap is the single largest drop-off on a
 * B2B homepage: a visitor who arrives from search does not yet know whether
 * this supplier can develop a formula, handle their market's paperwork, accept
 * a small first order, or move fast.
 *
 * These four cards sit directly under the hero, above the credential bar, so
 * the first screen after the promise is a capability answer rather than an
 * assurance. Every claim is one a buyer can immediately test against the
 * product and OEM pages.
 */
export const VALUE_PROPS = [
  {
    icon: 'flask' as const,
    title: 'Custom formulation',
    body:
      'Eight chemists in house, two of them doctorates. A custom formula plus a lab sample ' +
      'takes 30–45 days. Stability and compatibility testing is scheduled per product and ' +
      'quoted separately, because it runs in months, not weeks.',
    href: '/oem-odm.html',
  },
  {
    icon: 'shield' as const,
    title: 'Export compliance, handled in house',
    body:
      `FDA establishment registration, ${siteConfig.metrics.gmpStandard} GMP, and the documents ` +
      'your customs broker asks for. Ten third-party reports are downloadable today. ' +
      "Registration in your market is yours or your agent's; we tell you exactly what that takes.",
    href: '/certifications.html',
  },
  {
    icon: 'check' as const,
    title: 'Stated minimums',
    body:
      `${lowestMoq(clientProducts).units.toLocaleString()} ${lowestMoq(clientProducts).unit} on bundled sets, ` +
      `${standardMoq(clientProducts).units.toLocaleString()} ${standardMoq(clientProducts).unit} on catalogue SKUs. ` +
      'A repeat run is quoted on its own volume, and that minimum is written into the quotation.',
    href: '/products.html',
  },
  {
    icon: 'clock' as const,
    title: 'Samples out in days',
    body:
      'Chargeable, fee stated in the quotation, freight paid by the buyer. Catalogue SKUs ' +
      'ship in 5–7 days; custom-formula samples in 7–10 days after the brief is confirmed.',
    href: '/contact.html',
  },
];

/* ------------------------------------------------------------------ */
/* CONTENT GATE — the SEO entry point, placed before the ask           */
/* ------------------------------------------------------------------ */

export const CONTENT_GATES = [
  {
    icon: 'leaf' as const,
    title: 'Sourcing Handbook for Buyers',
    body: 'How MOQ, lead time and packaging specifications actually work when you import pet products from China.',
    href: '/sourcing-guides.html',
    cta: 'Read the guides',
  },
  {
    icon: 'globe' as const,
    title: 'Global Regulatory Library',
    body: 'Per-market compliance requirements — FDA, CPNP, APVMA — and the documents you need before your first shipment.',
    href: '/global-compliance.html',
    cta: 'Check your market',
  },
];

/**
 * The compliance pack — the pages a compliance officer is sent to.
 *
 * WHY THE PAGES ARE NAMED HERE AND THE DOCUMENTS LIVE ELSEWHERE
 * The document set that ships with the goods is a fact about a shipment, and
 * it lives in lib/shipping, which the trade-compliance page and the
 * downloadable trade file read too. What that list cannot give a buyer is the
 * ADDRESS of the page that answers the question they were sent to ask — and
 * that is what this list is. Five pages, five questions.
 *
 * NOTHING HERE STATES A FACT THE PAGE DOES NOT
 * Every line says what the page holds and nothing more. A compliance index
 * that overstates what is behind the link is worse than no index, because
 * the buyer discovers the difference in an audit.
 */
export const COMPLIANCE_PACK = [
  {
    title: 'Certificates & lab reports',
    body: 'Every third-party laboratory report, with the number printed on it, plus the Chinese licences with their numbers and validity dates.',
    href: '/certifications.html',
    cta: 'Open the certificates',
  },
  {
    title: 'Safety data sheets',
    body: 'A safety data sheet for every SKU in the catalogue, in the languages your customs broker asks for.',
    href: '/msds.html',
    cta: 'Open the MSDS index',
  },
  {
    title: 'Standards & sources',
    body: 'Which standard each published number rests on, and where the number itself came from.',
    href: '/standards.html',
    cta: 'See the sources',
  },
  {
    title: 'Global compliance',
    body: 'What your destination market requires before the first shipment, market by market.',
    href: '/global-compliance.html',
    cta: 'Check your market',
  },
  {
    title: 'Trade terms',
    body: 'Payment, Incoterms, the document set that ships with the goods, and how a dispute is handled.',
    href: '/trade-compliance.html',
    cta: 'Read the trade terms',
  },
];

/**
 * Homepage — v2 composition.
 *
 * This file is CONTENT, not layout. The order below is the buyer's decision
 * sequence, and every block exists to answer exactly one question:
 *
 *   hero         Are you a real factory?
 *   proofBar     Can I verify that in one click?
 *   split        Show me the actual facility.
 *   productGrid  What exactly do you make?
 *   metricBand   Can you ship my volume, on schedule?
 *   proofGrid    Do you have the paperwork to ship into my market?
 *   process      How does an OEM project actually run?
 *   rfq          How do I start?
 *   ctaBand      Last call to action.
 *
 * Numbers come from siteConfig — the SSOT rule in shenhe.config.ts still
 * applies. Nothing here hardcodes a metric, a contact or a product fact.
 *
 * Regenerating this from legacy2json would DESTROY it. gen-routes.py must be
 * taught to leave app/page.tsx alone, or given a v2 branch.
 */
export const homeBlocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: `ISO 22716 GMP · Operating since ${siteConfig.brand.foundedYear} · Heyuan, Guangdong`,
    /*
     * The first sentence, and what it has to do.
     *
     * A visitor to a factory website has three questions in the first five
     * seconds: what do you actually make, who do you make it for, and how
     * do I get a price. "Pet care manufacturing that survives your QA team"
     * answers none of them - it is a positioning claim, and the visitor has
     * to scroll to learn what the factory sells.
     *
     * So the headline says what the catalogue sells, in the order the lines
     * are grouped, and the lead answers the other two: who buys, and what
     * it costs them to start. The credentials were already in the eyebrow
     * and in the proof bar underneath; this is what was missing.
     */
    title: 'Private label & white label pet care',
    accent: 'formulated, filled and shipped from one plant.',
    lead:
      'Shampoo, deodorizers, grooming and outdoor protection for pet brands, importers and ' +
      'distributors. ' +
      `${activeSkuCount} catalogue SKUs, ` +
      `${siteConfig.metrics.monthlyCapacityBottles.toLocaleString()} bottles a month, and ten ` +
      'third-party laboratory reports behind the claims we make. MOQ (minimum order quantity) ' +
      `is ${lowestMoq(clientProducts).units.toLocaleString()} ${lowestMoq(clientProducts).unit} on the bundled sets and ` +
      `${standardMoq(clientProducts).units.toLocaleString()} ${standardMoq(clientProducts).unit} on catalogue SKUs. ` +
      'Samples are chargeable; the fee is stated in the quotation.',
    primaryCta: {
      label: 'Request a quotation',
      href: '#rfq',
      note: 'reply < 1 day',
    },
    secondaryCta: {
      label: 'See the catalogue',
      href: '/products.html',
      variant: 'secondary',
    },
    image: {
      src: '/assets/img/hero/hero-oem-factory-floor.webp',
      alt: 'Production floor at the Shenhe Zhongke pet care plant in Heyuan, Guangdong',
      width: 1200,
      height: 900,
      // The single LCP image on this page. Everything else stays lazy.
      priority: true,
    },
    metrics: [
      { value: `${(siteConfig.metrics.parkAreaM2 / 1000).toFixed(0)},000 m²`, label: 'Industrial park', note: '3 buildings' },
      { value: String(activeSkuCount), label: 'Ready-to-ship SKUs', note: `${siteConfig.metrics.productLines} product lines` },
      { value: `${(siteConfig.metrics.monthlyCapacityBottles / 1000).toFixed(0)}K`, label: 'Bottles / month', note: 'Current capacity' },
      { value: String(siteConfig.metrics.exportsToCountries), label: 'Export markets', note: siteConfig.metrics.targetMarkets.slice(0, 3).join(' · ') },
    ],
  },

  {
    kind: 'proofBar',
    /*
     * THE BAR UNDER THE HERO, IN ORDER OF WHAT A BUYER CAN DO WITH IT.
     *
     * A certificate is a ticket: the buyer checks it and moves on.
     * A reject rate is the thing nobody else publishes - a factory
     * that has never rejected a batch cannot tell you how it handles
     * one - so it earns its place before the ticket items, and it
     * reads the same configuration the factory and production pages
     * read, so the three cannot disagree.
     */
    items: [
      {
        label: `${siteConfig.metrics.batchRejectRatePct}% batch reject rate`,
        detail: 'Year to date in 2026, published',
        href: '/production.html',
      },
      { label: siteConfig.metrics.gmpStandard, detail: 'GMP certified', href: '/certifications.html' },
      { label: 'FDA Registered', detail: 'US establishment', href: '/certifications.html' },
      // Not SGS: the reports are issued by Guangdong Detection Center of
      // Microbiology and Guangzhou Institute of Microbiology (NACC). Ten
      // distinct documents, not nine.
      { label: 'Third-party lab reports', detail: '10 documents', href: '/certifications.html' },
      { label: 'MSDS on request', href: '/msds.html' },
      { label: 'Trade compliance docs', href: '/trade-compliance.html' },
    ],
  },

  {
    kind: 'split',
    eyebrow: 'The facility',
    title: 'A working factory, photographed.',
    body:
      'The 30,000 m² park in Heyuan runs three buildings: a 1,000 m² founding workshop, a 5,000 m² class-D cleanroom filling hall, and 3,000 m² of offices and QC. Every claim on this page is backed by a photograph you can request at full resolution.',
    bullets: [
      'Class-D cleanroom filling and capping lines',
      'On-site QC lab — every batch sampled before release',
      'Independent export station replacing marketplace listings',
      'Container loading photographed at the export dock',
    ],
    image: {
      src: '/assets/img/factory/factory-exterior-1344x768.webp',
      alt: 'Aerial view of the Shenhe Zhongke industrial park',
      width: 1344,
      height: 768,
    },
    cta: { label: 'Tour the factory', href: '/factory.html', variant: 'secondary' },
    mediaSide: 'right',
  },

  {
    kind: 'composer',
    eyebrow: 'Range builder',
    title: 'Build the range you will quote',
    lead:
      'Buyers order a range, not a single SKU. Pick up to six and the MOQ, stock lead time and private-label lead time update as you go — read from each product record, not estimated.',
    maxPick: 6,
    skuIndex: products.map((p) => ({
      id: p.id,
      name: `${p.name_en} — ${p.specification}`,
      // The SKU index has to point at the product's own page: an anchor on the
      // catalogue does not exist, so /products.html#p001 went nowhere.
      href: productUrl(p),
    })),
  },

  {
    kind: 'metricBand',
    eyebrow: 'Capacity & terms',
    title: 'The numbers your logistics team will ask for.',
    /*
     * THE FOUR NUMBERS, READ FROM THE CONFIGURATION.
     *
     * They were written out here: 1,000,000 bottles, 220+ employees,
     * six years, since 2020. That is a copy of the configuration
     * sitting in a second place, and a copy drifts - the capacity was
     * upgraded and this band would have kept the old number while
     * the hero showed the new one, on the same page.
     *
     * So they are read. The band and the hero cannot disagree,
     * because there is only one number.
     */
    metrics: [
      {
        value: siteConfig.metrics.monthlyCapacityBottles.toLocaleString(),
        label: 'Bottles per month',
        note: `Across ${siteConfig.metrics.productLines} lines`,
      },
      { value: '25–40 days', label: 'Concept to shelf', note: 'Standard timeline' },
      {
        value: `${siteConfig.metrics.employees}+`,
        label: 'Employees',
        note: 'On-site, full time',
      },
      {
        value: String(siteConfig.metrics.yearsInBusiness),
        label: 'Years trading',
        note: `Since ${siteConfig.brand.foundedYear}`,
      },
    ],
    note: siteConfig.pricing.policy,
  },

  {
    kind: 'proofGrid',
    eyebrow: 'Verifiable',
    title: 'The documents your compliance team will ask for.',
    lead: 'Ten downloadable reports, current and issued by accredited third-party laboratories.',
    /*
     * The accreditation marks belong to the ISSUING LABS, not to our
     * products. CMA and CNAS are the Chinese accreditation schemes the two
     * laboratories hold; ILAC-MRA is the arrangement through which a
     * CNAS-accredited result is recognised by accreditation bodies outside
     * China, EU national bodies included. That is the chain of trust a
     * European importer is actually looking for.
     *
     * There is deliberately no CE mark here: pet cosmetics fall under
     * EC 1223/2009 and the disinfectant under the EU Biocidal Products
     * Regulation, neither of which is a CE conformity assessment. Putting
     * an unearned CE mark on the page would be a false claim, and a buyer
     * who checked it would distrust every other number on the site.
     */
    marks: [
      { src: '/assets/img/certs/marks/cma.png', alt: 'CMA — China Metrology Accreditation' },
      { src: '/assets/img/certs/marks/cnas.png', alt: 'CNAS — China National Accreditation Service' },
      {
        src: '/assets/img/certs/marks/ilac-mra.png',
        alt: 'ILAC-MRA — International Laboratory Accreditation Cooperation Mutual Recognition Arrangement',
      },
    ],
    marksNote:
      'Issued by laboratories accredited under CMA and CNAS, and recognised through the ILAC Mutual Recognition Arrangement — the basis on which these reports are accepted by importers and authorities outside China, the EU included.',
    items: [
      { label: 'Ammonia removal — 94.2%', detail: 'Pet deodorant, report NACCYH25014722.', kind: 'lab', href: '/assets/img/certs/Test-Ammonia-Removal-Efficiency.pdf' },
      { label: 'Hydrogen sulfide — >93.3%', detail: 'Pet deodorant, report NACCYH25014721.', kind: 'lab', href: '/assets/img/certs/Test-Hydrogen-Sulfide-Removal-Efficiency.pdf' },
      { label: 'Cat litter ammonia — 96.6%', detail: 'Litter deodorizer, report NACCYH25007027.', kind: 'lab', href: '/assets/img/certs/Cat-Litter-Deodorizer-Ammonia-Removal-Test.pdf' },
      { label: 'Antibacterial performance', detail: 'Multi-effect wash, report 2024FM11612R01D.', kind: 'lab', href: '/assets/img/certs/Multi-Effect-Wash-Antibacterial-Test.pdf' },
      { label: 'Mite control', detail: 'Multi-effect wash, report 2024FM11612R03D.', kind: 'lab', href: '/assets/img/certs/Multi-Effect-Wash-Mite-Control-Test.pdf' },
      { label: 'Pet safety assessment', detail: 'Pet deodorant, report 2024FM11611R02D.', kind: 'cert', href: '/assets/img/certs/Pet-Deodorizing-Spray-Non-Toxic-Cert.pdf' },
    ],
    cta: { label: 'See all 10 reports', href: '/certifications.html' },
  },

  {
    kind: 'split',
    eyebrow: 'R&D',
    title: 'We can build the formula you cannot buy off the shelf.',
    body:
      'Sixteen registered formulas and designs, plus joint laboratories with South China University of Technology and Guangdong University of Technology. Send a target claim and we will tell you honestly whether it is formulable, what it costs, and how long it takes to substantiate.',
    bullets: [
      'Custom formulation from a target claim or competitor sample',
      'Stability, efficacy and safety substantiation',
      'Packaging design and regulatory artwork for 3 target markets',
    ],
    image: {
      src: '/assets/img/factory/qc-lab-bench.jpg',
      alt: 'QC laboratory bench at Shenhe Zhongke',
      width: 1200,
      height: 900,
    },
    cta: { label: 'Talk to R&D', href: '/capabilities.html', variant: 'secondary' },
    background: 'soft',
    mediaSide: 'left',
  },

  {
    kind: 'process',
    eyebrow: 'How it runs',
    title: 'From first email to first container',
    lead: 'Four stages. A named contact and a written answer at each one.',
    steps: [
      { no: '01', title: 'Enquiry', desc: 'Send the SKU and the volume. Tiered pricing and a sample plan within one business day.' },
      { no: '02', title: 'Sample and specification', desc: 'Physical sample plus a full specification sheet. We iterate until the formula is signed off.' },
      { no: '03', title: 'Regulatory pack', desc: 'MSDS, laboratory reports and artwork compliance for your destination market.' },
      { no: '04', title: 'Production and QC', desc: 'Batch production with on-site sampling. Photographs and QC records before release.' },
    ],
  },

  {
    kind: 'rfq',
    eyebrow: 'Start here',
    title: 'Tell us what you need made.',
    lead: 'Three fields, no account, no obligation. If it is not something we can make, we say so on the first call rather than after three rounds.',
    whatsappCta: {
      label: 'Chat on WhatsApp',
      /*
       * 号码从配置取，消息预填。
       *
       * 原来这里写死了 'https://wa.me/8617266659928'——站上的号码只应该有一个
       * 地方说了算，而这个块是内容文件，号码是配置。
       *
       * 它是主按钮（不再是 secondary）：站上唯一那条真实询盘走的就是 WhatsApp，
       * 而 WhatsApp 是买家**在对话里**就能得到答复的通道——一个在华的采购
       * 代理要的是即时回应，不是一张他还要再等一天的表单。
       */
      href: whatsappLink({ page: 'private-label pet care products' }),
      external: true,
      note: 'answered within one business day',
    },
  },

  {
    kind: 'ctaBand',
    eyebrow: 'Next step',
    figure: '1 business day',
    figureNote: 'to a first answer, from a named sales manager',
    title: 'Request a quotation on your SKU.',
    text: 'Tell us the product and the volume. We reply within one business day with tiered pricing and a sample plan.',
    note: 'ISO 22716 GMP · FDA registered · Exporting since 2020',
    primaryCta: { label: 'Request a quotation', href: '#rfq' },
    secondaryCta: { label: 'Contact us', href: '/contact.html', variant: 'ghost' },
  },
];
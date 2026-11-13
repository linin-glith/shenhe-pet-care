/**
 * OEM/ODM page — structured content, decoupled from presentation.
 *
 * WHY A SEPARATE DATA FILE
 * The legacy page stored the 9-dimension comparison, 3 cooperation models and
 * 6-step process as HTML blobs inside content/oem-odm.json. That meant the
 * heading hierarchy lived inside strings, a h4 appeared under a h2 with no h3
 * between them, and the FAQPage schema could not stay in sync with the visible
 * questions. This file is the single source of truth the renderer reads.
 *
 * DECOUPLING RULE
 * The 9-dimension table answers "which mode fits me"; the three cooperation
 * cards answer "here is the choice". They used to overlap (the cards repeated
 * table rows). They stay separate here: the table holds FACTS, the cards hold
 * the DECISION. No fact appears twice.
 *
 * THE TWO ROUTES ARE TWO NAMED PRODUCTS
 * The page used to hang the 25-40 day window on the word "OEM", while the
 * trade page uses OEM for the buyer's own formula - a 30-45 day job. A buyer
 * who read both was told two different things about when the goods arrive.
 *
 * So each route is named and carries its own window: private label (our
 * formula, your brand) is 25-40 days, and custom formulation - which is what
 * OEM means here - is 30-45 days. The third card is not a third route: it is
 * the line we do not cross.
 */

import type { IconName } from '@/components/v2/Icon';
import { activeSkuCount } from '@/lib/products';
import { clientProducts } from '@/lib/client-products';
import { lowestMoq, standardMoq } from '@/lib/commerce';

/**
 * The ODM minimum, computed from the catalogue.
 *
 * It used to be typed here as "1,000 sets" - and the page's own title said
 * "500 Unit MOQ", which is a number the catalogue has never carried. The
 * buyer who read the title and then opened the spray's page found 2,000
 * bottles. One source, computed: the bundled sets start at 1,000 sets and
 * every catalogue SKU starts at 2,000 bottles.
 */
const LOW = lowestMoq(clientProducts);
const HIGH = standardMoq(clientProducts);
/*
 * The unit comes from the record, not from a habit. "2,000 units" was
 * true on the page and useless to the buyer: the catalogue SKUs are
 * bottled, packed and bagged, and the minimum is the same number of
 * packs as it is of bottles. The unit is what tells the two apart.
 */
const ODM_MOQ =
  `${LOW.units.toLocaleString()} ${LOW.unit} on the bundled sets, ` +
  `${HIGH.units.toLocaleString()} ${HIGH.unit} on the catalogue SKUs`;

export type OemDimension = { dimension: string; oem: string; odm: string };

/** The comparison table — facts, one row per decision-relevant axis. */
export const OEM_DIMENSIONS: OemDimension[] = [
  { dimension: 'Formula source', oem: 'You provide the formula or the target claim', odm: 'We provide the formula, the specification and the reports' },
  { dimension: 'Best for', oem: 'Brands with R&D or an in-house lab', odm: 'Startups and fast-market launches' },
  { dimension: 'Lead time', oem: '30–45 days (custom formulation, formula and sample)', odm: '25–40 days (private label, after the sample is approved)' },
  { dimension: 'Minimum order', oem: '1,000–3,000 bottles (your formula)', odm: `${ODM_MOQ}` },
  { dimension: 'IP ownership', oem: 'You own the formula', odm: 'Factory owns the formula; you own the label' },
  { dimension: 'Sample', oem: 'Formula sample after development', odm: 'Chargeable sample in 5–7 days, fee in the quotation' },
  { dimension: 'Documentation', oem: 'Full disclosure, under NDA', odm: 'MSDS and lab reports already on file' },
  { dimension: 'Route to market', oem: 'Slower: the formula is developed and tested first', odm: 'Faster: our formula needs labelling and packaging' },
  { dimension: 'Price basis', oem: 'Quoted per your specification', odm: 'Quoted per SKU and volume tier' },
];

export type CooperationModel = {
  slug: 'oem' | 'odm' | 'obm';
  icon: IconName;
  name: string;
  tagline: string;
  body: string;
  forWho: string;
};

/** The decision — two products and one boundary, one per card. */
export const COOPERATION_MODELS: CooperationModel[] = [
  {
    slug: 'odm',
    icon: 'bottle',
    name: 'Private label',
    tagline: `Our ${activeSkuCount} catalogue SKUs, your label`,
    body: 'Our formula, your brand. Artwork, carton and label are yours. The formulation, the specification and the reports stay ours. Private-label lead time is 25–40 days after the sample is approved.',
    forWho: 'For startups and fast-market launches',
  },
  {
    slug: 'oem',
    icon: 'factory',
    name: 'Custom formulation (OEM)',
    tagline: 'Your formula, developed in house',
    body: 'Your formula or your target claim. Eight in-house chemists develop and test the formula. Our joint laboratories with South China University of Technology and Guangdong University of Technology handle advanced formulation work. A custom formula plus a lab sample takes 30–45 days. Stability and compatibility testing is scheduled per product and quoted separately — it takes months, not weeks.',
    forWho: 'For brands with R&D or an in-house lab',
  },
  {
    // The third service is turnkey: formula, packaging and compliance under
    // one owner. It carries no lead time on purpose - a turnkey project is
    // quoted per brief, so a window next to it would be a number we cannot
    // show. The line we do not cross is a separate statement, below the grid.
    slug: 'obm',
    icon: 'sparkle',
    name: 'Full service (OBM)',
    tagline: 'From concept to shelf',
    body: 'Formula, packaging and compliance handled end to end under one owner. The scope and the schedule are quoted against the brief.',
    forWho: 'For brands that want a single partner',
  },
];

export type ProcessStep = { no: string; title: string; desc: string };

export const OEM_PROCESS: ProcessStep[] = [
  { no: '01', title: 'Enquiry', desc: 'Brief, target market, MOQ and timeline.' },
  { no: '02', title: 'Sample', desc: 'Chargeable sample in 5–7 days, fee in the quotation, or formula development.' },
  { no: '03', title: 'Quote', desc: 'A quote with a named contact, within one business day.' },
  { no: '04', title: 'Contract', desc: 'NDA, formula agreement and payment terms.' },
  { no: '05', title: 'Production', desc: 'Batch production with on-site QC sampling.' },
  { no: '06', title: 'Shipment', desc: 'Export packing, documentation and dispatch.' },
];

export type OemFaq = { q: string; a: string };

/** Answers must carry a number, a document or an honest boundary. No prices. */
export const OEM_FAQ: OemFaq[] = [
  {
    q: 'What is the MOQ (minimum order quantity) for private label and for a custom formula?',
    a: `Private label starts at ${ODM_MOQ}. A fully custom OEM formula starts at 1,000–3,000 bottles. Both are quoted per SKU on enquiry.`,
  },
  {
    q: 'How long does it take from enquiry to shipment?',
    a: 'A private-label order ships 25–40 days after the sample is approved. A custom formulation takes 30–45 days to a lab sample. Both windows are lead times, not estimates.',
  },
  {
    q: 'Who owns the formula?',
    a: 'On a custom formulation project you own the formula and receive full disclosure under NDA. On a private-label project the factory owns the formula and you own the label and packaging rights.',
  },
  {
    q: 'Can I get a sample before committing?',
    a: 'Samples are chargeable. The sample fee is confirmed in the quotation together with the specification, and freight is paid by the buyer. An existing-SKU sample ships within 5–7 days of that confirmation.',
  },
  {
    q: 'Is white label the same as private label?',
    a: 'Yes, in this plant. Private label and white label both mean our formula with your brand on it, and UK buyers write private labelling. The distinction some buyers draw — a stock formula sold to many brands versus a formula packed for one — does not change what you order here: your artwork, your custom logo and your barcode go on the label and the carton. If the formula itself has to be yours, that is custom formulation, a different route with its own 30–45 day window.',
  },
  {
    q: 'What certification are the products covered by?',
    a: 'ISO 22716 cosmetic GMP with a class-D cleanroom and FDA establishment registration, plus production permits for disinfectants and feed additives. The 10 third-party laboratory reports are downloadable on the certifications page.',
  },
  {
    q: 'Do you publish prices for a custom formula or for private label?',
    a: 'No. A custom formulation is priced per your specification and private label per SKU and volume tier, so both are quoted per RFQ. Send the brief and you will have tiered pricing within one business day.',
  },
];

/** Certifications strip (optional module, placed between process and FAQ). */
export const OEM_CERTS: { icon: IconName; label: string; detail: string }[] = [
  { icon: 'shield', label: 'ISO 22716 GMP', detail: 'Cosmetic GMP, class-D cleanroom' },
  { icon: 'check', label: 'FDA Registered', detail: 'US establishment' },
  { icon: 'flask', label: 'Third-party lab reports', detail: '10 downloadable PDFs' },
  { icon: 'factory', label: 'Disinfectant licence', detail: 'Production permit' },
];

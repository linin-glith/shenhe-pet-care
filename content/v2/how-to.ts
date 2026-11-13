/**
 * The steps the pages already show, marked up so an assistant can lift
 * them.
 *
 * WHY A SEPARATE FILE
 * The steps are read out of the pages' own content. A HowTo is a
 * claim that a reader can follow, so the steps here and the steps on
 * the page have to be the same steps. Keeping them together means
 * one edit changes both, and the markup cannot drift away from what
 * the reader sees.
 *
 * WHY THESE SIX PAGES
 * These are the pages where a buyer has a procedure in mind rather
 * than a fact in mind: how to import, how to export, how to get a
 * certification for their market, how to get the safety data sheets,
 * what compliance looks like per market, and how an order runs from
 * the first enquiry to the container. Every one of them already has
 * the steps written out in prose or in a list on the page. The markup
 * is what was missing.
 *
 * NOTHING HERE IS NEW
 * Every step is a restatement of something the page says. No figure
 * appears in this file that does not appear on the page it belongs
 * to. A HowTo that says more than the page is a HowTo that sends a
 * buyer to a step we do not perform.
 */
import type { HowToStep } from '@/lib/seo/schema';

/* ------------------------------------------------------------------ */
/* 1. Importing pet products from China                                */
/* ------------------------------------------------------------------ */

export const IMPORT_STEPS: HowToStep[] = [
  {
    name: 'Define the product and the market',
    text: 'Decide which SKU or formula you want, the market it will sell into, and the claims you intend to make. Everything after this depends on those three things.',
  },
  {
    name: 'Ask for a quotation against a brief',
    text: 'Send the product type, the destination market and the annual volume. A named sales manager replies within one business day with a tiered quotation and a sample plan.',
    url: '/contact.html',
  },
  {
    name: 'Confirm the sample',
    text: 'Samples are chargeable: the sample fee is confirmed in the quotation, and freight is paid by the buyer. An existing-SKU sample ships in 5–7 days; a custom formula takes 7–10 days of bench work after the brief is confirmed. A custom formula takes 30–45 days to a lab sample, and stability and compatibility testing is a separate scheduled programme that runs in months.',
    url: '/oem-odm.html',
  },
  {
    name: 'Agree the formula and the documentation',
    text: 'On an OEM project you own the formula and receive full disclosure under NDA; on an ODM project the factory owns the formula and you own the label and packaging rights. The certificate of analysis and the 16-language MSDS are agreed at this point.',
    url: '/oem-odm.html',
  },
  {
    name: 'Pay and produce',
    text: 'A first order is normally T/T in advance; L/C at sight is accepted from USD 30,000. Each batch is sampled on site before it is packed.',
    url: '/trade-compliance.html',
  },
  {
    name: 'Ship',
    text: 'Every consignment leaves with a batch-specific certificate of analysis, the 16-language MSDS, a commercial invoice carrying the HS code, and a certificate of origin. Incoterms default to EXW Shenzhen; FOB, CIF and DDP are quoted per lane against your destination.',
    url: '/trade-compliance.html',
  },
];

/* ------------------------------------------------------------------ */
/* 2. The documents an export needs, and in what order                */
/* ------------------------------------------------------------------ */

export const EXPORT_STEPS: HowToStep[] = [
  {
    name: 'Confirm the destination and the trade term',
    text: 'The term decides what the price includes. EXW Shenzhen is the default; FOB Shenzhen, CIF and DDP to your warehouse are quoted per lane against your destination, volume and term.',
    url: '/trade-compliance.html',
  },
  {
    name: 'Have the shipment documents issued',
    text: 'Each consignment carries a batch-specific certificate of analysis, a 16-language safety data sheet, a commercial invoice with the HS code, and a certificate of origin.',
    url: '/msds.html',
  },
  {
    name: 'Pay on the agreed terms',
    text: 'A first order is normally T/T in advance; L/C at sight is accepted from USD 30,000. The terms are written into the quotation rather than advertised, because they are agreed per order alongside the price and the delivery basis.',
    url: '/trade-compliance.html',
  },
  {
    name: 'Pack and dispatch',
    text: 'Export packing is carton-level with the carton dimensions and weight stated per SKU. The order of documents at the customs desk follows the term, so it is confirmed before dispatch rather than after.',
  },
];

/* ------------------------------------------------------------------ */
/* 3. Planning the certification for your market                      */
/* ------------------------------------------------------------------ */

export const CERTIFICATION_STEPS: HowToStep[] = [
  {
    name: 'Tell us the market and the claims',
    text: 'The certification route follows from the market you sell into and the claims you intend to make. Those two things decide everything after this.',
    url: '/contact.html',
  },
  {
    name: 'Get the certification route quoted',
    text: 'For FDA, EU CPNP and ISO 22716 we map the regulations of your target market and quote the certification path within 48 hours of the brief.',
    url: '/certifications.html',
  },
  {
    name: 'Decide what is held and what is published',
    text: 'ISO 22716 GMP and the FDA establishment registration are held but not published on the open web: the certificate and the registration record are handed over during qualification, the ISO one under NDA.',
    url: '/certifications.html',
  },
  {
    name: 'Run the testing on your own formula',
    text: 'The reports on this site document the products we made. A private-label version of the same formula needs its own testing for the claims you intend to make; we run that inside the same laboratories and issue the reports under your name where the arrangement allows.',
    url: '/certifications.html',
  },
];

/* ------------------------------------------------------------------ */
/* 4. Getting the safety data sheets                                  */
/* ------------------------------------------------------------------ */

export const MSDS_STEPS: HowToStep[] = [
  {
    name: 'Ask for the sheet for the SKU you ordered',
    text: 'A safety data sheet exists for every active SKU and is issued with the consignment. One published sample is on the downloads page.',
    url: '/msds.html',
  },
  {
    name: 'Use it as a shipping document',
    text: 'It travels with the goods and states the handling, storage and transport information for that shipment.',
  },
  {
    name: 'Do not read it as a label approval',
    text: 'It is a record of the consignment. It is not an approval of the wording on a label for any market — label approval is a separate exercise, and we will help you map it for your target market.',
    url: '/global-compliance.html',
  },
];

/* ------------------------------------------------------------------ */
/* 5. What compliance looks like per market                           */
/* ------------------------------------------------------------------ */

export const COMPLIANCE_STEPS: HowToStep[] = [
  {
    name: 'Pick the market first',
    text: 'Each market has its own route: FDA for the United States, GPSR and CLP for the European Union — CPNP only where a formula is also sold for human use — and APVMA for Australia. They are not interchangeable, and the route for one is not evidence for another.',
    url: '/global-compliance.html',
  },
  {
    name: 'Decide what you will claim',
    text: 'A biocidal claim needs a different evidence route from a cosmetic claim. We hold a disinfection-product hygiene licence for the products that make biocidal claims, and the licence belongs to the entity that manufactures for you.',
    url: '/certifications.html',
  },
  {
    name: 'Get the file list and the lead time',
    text: 'For the documents the route needs, we quote the certification path and the time it takes within 48 hours of the brief.',
    url: '/contact.html',
  },
  {
    name: 'Put the label wording through the same route',
    text: 'The MSDS and the certificate of analysis travel with the goods; the wording on the label is a separate approval. We map it for your market rather than assume a wording will pass.',
    url: '/msds.html',
  },
];

/* ------------------------------------------------------------------ */
/* 6. How an order runs, from the first enquiry to the container      */
/* ------------------------------------------------------------------ */

export const ORDER_STEPS: HowToStep[] = [
  { name: 'Enquiry', text: 'Brief, target market, MOQ and timeline.', url: '/contact.html' },
  { name: 'Sample', text: 'Chargeable sample, fee confirmed in the quotation, 5–7 days for an existing SKU.', url: '/oem-odm.html' },
  { name: 'Quote', text: 'A quote with a named contact, within one business day.', url: '/products.html' },
  { name: 'Contract', text: 'NDA, formula agreement and payment terms.', url: '/trade-compliance.html' },
  { name: 'Production', text: 'Batch production with on-site QC sampling.', url: '/factory.html' },
  { name: 'Shipment', text: 'Export packing, documentation and dispatch.', url: '/trade-compliance.html' },
];

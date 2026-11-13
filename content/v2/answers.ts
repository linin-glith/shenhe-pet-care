/**
 * The answer that sits under the headline.
 *
 * WHY A SECOND PARAGRAPH AND NOT A NEW HEADLINE
 * The headlines on this site are claims: "Documents, not badges.", "A
 * 30,000 m² park, photographed.", "What we can develop." They are
 * what a buyer remembers, and replacing them with a question would
 * cost the page its voice.
 *
 * So the headline stays and a second paragraph goes under it, and
 * that paragraph is written to be quoted: the first sentence is the
 * answer, the sentences after it are the limits of that answer.
 *
 * WHY IT IS IN THE BODY AND NOT ONLY IN THE MARKUP
 * A buyer reads it, and so does an assistant. If the answer only
 * existed in a schema block it would be a claim nobody could check.
 *
 * THE RULE
 * Every sentence here is a claim the site already makes elsewhere.
 * No new figure, no new promise, no new limit. The first sentence is
 * the shortest true answer; the second and third say what it does not
 * cover, because an answer without a limit is a sales line.
 */

export type PageAnswer = {
  /** The answer, in one or two sentences. The first one is the answer. */
  answer: string;
  /** What the answer does not cover, and what to do about it. */
  boundary: string;
};

/** The certification page. */
export const CERTIFICATIONS_ANSWER: PageAnswer = {
  answer:
    'We hold ISO 22716 GMP and an FDA establishment registration, and ten third-party lab reports are downloadable on this page with their report numbers on them.',
  boundary:
    'Neither of the first two is a product approval, and the reports document our own products — a private-label version of the same formula needs its own testing. The certificate and the registration record are handed over during qualification, the ISO one under NDA.',
};

/** The per-market compliance page. */
export const COMPLIANCE_ANSWER: PageAnswer = {
  answer:
    'Send us the destination market and the claims you intend to make, and we tell you in writing what has to be filed, what we prepare, and what stays yours — usually within 48 hours of the brief.',
  boundary:
    'The routes are not interchangeable: FDA for the United States, GPSR and CLP for the European Union — CPNP only where a formula is also sold for human use — and APVMA for Australia. A registration in one market is not evidence in another, and we will not present it as such.',
};

/** The factory page. */
export const FACTORY_ANSWER: PageAnswer = {
  answer:
    'The factory runs on a 30,000 m² park in Heyuan, Guangdong, with six filling lines and a QC lab on site, and every claim on this page is backed by a photograph you can take away at full resolution.',
  boundary:
    'Monthly capacity is 1,000,000 bottles, which is a floor for planning and not a promise of allocation — a month can be full. Capacity, lead time and the delivery date are confirmed against your order.',
};

/**
 * The capability page.
 *
 * SPLIT AT SOURCE, NOT AT THE PAGE
 * The answer used to be one 60-word sentence with two dash insertions:
 * "Eight in-house chemists - two of them doctorates from South China
 * University of Technology - develop and test the formula, and our joint
 * laboratories with SCUT and Guangdong University of Technology sit behind
 * the hard cases, and a six-step QC process stands behind it - so a claim
 * on your label is a claim we can defend with a document."
 *
 * A B2B buyer reads sentence length as a proxy for credibility, so the
 * same facts are written as short sentences here. The facts are unchanged;
 * only the shape is. This constant is read by the factory, capability,
 * certification, contact and sourcing-guide pages, so splitting it here
 * fixes all five at once - a page-level override would have fixed one and
 * left the other four.
 */
export const CAPABILITIES_ANSWER: PageAnswer = {
  answer:
    'The formula is developed and tested by eight in-house chemists, two of whom ' +
    'hold doctorates from South China University of Technology. Our joint ' +
    'laboratories with SCUT and Guangdong University of Technology sit behind the ' +
    'hard cases. A six-step QC process stands behind the formula, so a claim on ' +
    'your label is a claim we can defend with a document.',
  boundary:
    'A full custom formula and a lab sample take 30–45 days. Stability and ' +
    'compatibility testing is a scheduled programme that runs in months, not ' +
    'weeks, and it is quoted separately. It is not something a calendar can ' +
    'shorten, and it needs at least 1,000 sets to be worth running. Samples are ' +
    'chargeable: the fee is confirmed in the quotation and freight is paid by the ' +
    'buyer. A sample of a catalogue SKU ships in 5–7 days.',
};

/** The sourcing guides page. */
export const GUIDES_ANSWER: PageAnswer = {
  answer:
    'These guides answer the questions importers actually ask on the first call — how minimum order really works, how to read a safety data sheet, and what compliance costs per destination market.',
  boundary:
    'Nothing here is a price, a lead time or a specification for your order; those are confirmed against the order itself. Ask for a quotation and a named contact replies within one business day.',
};

/** The contact page. */
export const CONTACT_ANSWER: PageAnswer = {
  answer:
    'Send the product type, the target market and the volume. A named sales manager replies within one business day with a tiered quotation and a sample plan — no account needed.',
  boundary:
    'If we cannot make it, we say so on the first call rather than after three rounds. Prices, minimum order and lead time are quoted against your order, not published.',
};

/** The export terms page. */
export const EXPORT_ANSWER: PageAnswer = {
  answer:
    'EXW Shenzhen is the default term; FOB Shenzhen, CIF and DDP to your warehouse are quoted per lane against your destination, volume and term. Every consignment leaves with a batch-specific certificate of analysis, the 16-language safety data sheet, a commercial invoice carrying the HS code, and a certificate of origin.',
  boundary:
    'The freight is quoted per lane and always shown separately from the product price, so the landed cost is never ambiguous. Payment terms are written into the quotation rather than advertised, because they are agreed per order.',
};

/** The safety data sheet page. */
export const MSDS_ANSWER: PageAnswer = {
  answer:
    'A safety data sheet exists for every active SKU, in 16 languages, and is issued with the consignment — ask for the sheet for the SKU you ordered.',
  boundary:
    'It is a record of the consignment, not an approval of the wording on a label for any market. Label approval is a separate exercise, and we help you map it for your target market.',
};

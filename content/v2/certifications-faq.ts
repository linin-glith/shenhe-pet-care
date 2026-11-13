/**
 * The questions a buyer asks about the certifications, in the words a
 * buyer uses.
 *
 * WHY THIS FILE EXISTS
 * The certifications page shows the documents: three licence scans and
 * ten third-party reports, each with the number on it. It had almost no
 * questions, and a page of documents with no questions is a page an
 * assistant can read but cannot answer.
 *
 * The questions a buyer actually asks are not "what reports do you
 * have". They are "is this good enough for my market", "can you put
 * my name on it", "what does this certificate cover" — and the last
 * one is the one that gets answered wrongly, because a certificate
 * read as a product approval is a claim the factory never made.
 *
 * So every answer here carries the limit of the thing it names. That
 * is the same rule the AI reading list follows, written where a buyer
 * meets it.
 *
 * EVERY ANSWER IS TRUE OF US
 * Nothing here is a claim we have not made elsewhere on this site. The
 * report numbers, the licence numbers and the validity dates are the
 * ones printed on the scans in /public/assets/img/certs/. Where a
 * document is held but not published, the answer says it is shared on
 * request and under what terms, because that is the truth.
 */
import type { FaqItem } from '@/components/v2/PageFaq';

export const CERTIFICATIONS_FAQ: FaqItem[] = [
  {
    q: 'Do you have ISO 22716?',
    a: 'Yes — ISO 22716 good manufacturing practice for cosmetics, with a class-D cleanroom filling scope. The certificate and the audit report are available under NDA.',
  },
  {
    q: 'What does the ISO 22716 certificate cover?',
    a: 'Our manufacturing site and the cosmetic product made there. It is a guideline, not a product approval, and it does not cover a biocidal claim.',
  },
  {
    q: 'Are you FDA registered?',
    a: 'Our establishment is registered with the US FDA. The facility ID and product listings are shared on request during qualification.',
  },
  {
    q: 'Does your FDA registration mean my product is approved in the US?',
    a: 'No. It is a listing of the facility, not a clearance of any product, and it does not by itself permit a claim in any market.',
  },
  {
    q: 'Which tests can I actually read?',
    a: 'Ten third-party reports, each with the real cover page, the report number and the issuing institute. They cover ammonia and hydrogen-sulphide removal for the pet deodorants, ammonia removal for the cat litter deodorizer, 12-month available-chlorine stability for the disinfectant, antibacterial performance and mite control for the multi-effect wash, a microbiological and quality test for the multi-effect wash (aerobic bacterial count, thermotolerant coliforms, total active substance and pH, against QB/T 4524-2013), a safety assessment for the pet deodorant, and two full analyses. Each report number is printed on the document, so you can quote it back to us.',
  },
  {
    q: 'What are the >94% ammonia removal figures based on?',
    a: 'On an independent determination, NACCYH25014722 for the pet deodorant and NACCYH25007027 for the cat litter deodorizer. Ammonia fell from 1.53 mg/m³ to 0.088 mg/m³ on the pet deodorant and to 0.052 mg/m³ on the litter deodorizer, measured by method CJ/T 516-2015. Hydrogen sulphide was determined separately, 0.15 mg/m³ down to below 0.010 mg/m³.',
  },
  {
    q: 'Do you hold disinfection and feed-additive licences?',
    a: 'Yes, both are on file and published as scans. The disinfection-product hygiene licence, 粤卫消证字[2023]-07-第0002号, is valid to 2027-05-21. The feed additive production licence, 粤饲添(2023)H07002, is valid to 2028-04-23. Both are issued to Guangdong Shenhe Zhongke Biotechnology Co., Ltd. — the entity that manufactures for you.',
  },
  {
    q: 'Who holds the high-tech enterprise certificate?',
    a: 'The high-tech enterprise certificate GR202544200988, issued 2025-12-25 and valid for three years, is issued to 深圳市永盛环境工程有限公司 · Shenzhen Yongsheng Environmental Engineering Co., Ltd. — another company in the same group as this one, so it is ours as a group and the document says who holds it. The disinfection and feed-additive licences are issued to Guangdong Shenhe Zhongke Biotechnology Co., Ltd. directly, and you can see which is which on the scans.',
  },
  {
    q: 'What does the MSDS cover?',
    a: 'All 20 active SKUs, in 16 languages, as a safety data sheet for the consignment. It is a record of the goods being shipped. It is not an approval of the wording on a label for any market — label approval is a separate exercise, and we will help you map it for your target market.',
  },
  {
    q: 'Can you get a certification for my target market?',
    a: 'Usually, and we quote the path rather than promise it. For FDA, GPSR, CLP and BPR, and for ISO 22716, we map the requirements of your target market and quote the route within 48 hours of the brief. Tell us the market and the claims you intend to make, and what you need proven is where we start.',
  },
  {
    q: 'Are the reports transferable to my brand?',
    a: 'The reports document the product we made and the process it went through. A private-label version of the same formula needs its own testing for the claims you intend to make — we run that inside the same labs and issue the reports under your name where the arrangement allows. Ask us for the test plan before you commit to the claims.',
  },
  {
    q: 'Is the product cruelty-free?',
    a: 'Yes — no animal testing, and the formulation and testing work is done on bench chemistry and cell or instrumental methods rather than on animals. This is a statement about how the products and their testing are made. It is not a certification against a third-party standard, and we do not present it as one.',
  },
];

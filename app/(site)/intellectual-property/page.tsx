/**
 * INTELLECTUAL PROPERTY — what this company holds, and what the buyer keeps.
 *
 * WHY THIS PAGE EXISTS
 *
 * A private-label buyer has one question that no certificate answers:
 * if you help me develop this formula, will you sell it to somebody else?
 * And the factory's side of the same question is whether it is a real
 * manufacturer with its own registrations, or a trading agent holding
 * somebody else's certificates.
 *
 * The site answered neither. The patents, the enterprise standard and the
 * trademark registrations existed in the company's own records and appeared
 * on no page — and `lib/market-claims.ts` sells "the formulator owns the
 * IP" as a reason to buy from us. A claim about owning something, on a
 * page that never says what it owns.
 *
 * So this page says what we hold, with the number and the register, and
 * says what the buyer keeps.
 *
 * WHAT IS NOT ON THIS PAGE
 *
 * A patent on a formula. The patent we hold is on a device, and the page
 * says so in the sentence that describes it. We hold no formula patent and
 * the page does not claim one.
 *
 * AND WHY THE TRADEMARK NOW CARRIES A NUMBER
 *
 * The first version of this page said it published no trademark number,
 * because a trademark moves and a number printed here can be wrong by the
 * time a buyer reads it. That was true of the filing we could not verify
 * and wrong about the one we can: 贝洛宠 is registered, and its number is
 * the one this site already publishes on /for-ai.html. A page that says
 * "here is our number" on one address and "we publish no number" on
 * another is one fact written twice and drifting — so the number is
 * printed here as well, with the register to check it in.
 *
 * EVERYTHING ON THIS PAGE IS READ OUT OF content/v2/ip-assets.ts, and the
 * build gate checks that what is printed here is the record, and that the
 * record is printed here.
 */

import type { Metadata } from 'next';
import { siteConfig } from '@/lib/shenhe.config';
import { pageMetadata } from '@/lib/seo/page';
import { V2Page } from '@/components/v2/blocks';
import type { V2Block } from '@/lib/v2/block-types';
import { faqPageSchema, webPageSchema } from '@/lib/seo/schema';
import { IP_ASSETS } from '@/content/v2/ip-assets';

const PATH = '/intellectual-property.html';

const TITLE = 'Patents, Trademarks & Standards | Who Owns Your Formula';

const DESCRIPTION =
  'Our pet care factory’s registrations: a granted utility model patent, our own enterprise standard and our trademark registrations, each with the register.';

export const metadata: Metadata = pageMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
});

export const dynamic = 'force-static';

const patent = IP_ASSETS.find((a) => a.kind === 'patent')!;
const standard = IP_ASSETS.find((a) => a.kind === 'standard')!;
const trademark = IP_ASSETS.find((a) => a.kind === 'trademark')!;

const FAQ = [
  {
    q: 'If you develop my formula, do you keep it?',
    a: 'No. A formula developed for you stays your property: we sign an NDA before we discuss a custom formula, we do not reproduce it, sell it or disclose it to a third party, and the confidentiality terms are in the trade terms. What we keep is the manufacturing knowledge — the process, the tooling and the workshop — not your formula and not your brand.',
  },
  {
    q: 'Do you have patents?',
    a: `Yes, one we can name: ${patent.title} (${patent.titleLocal}), application ${patent.identifier}, granted ${patent.dates.replace('Filed ', '').split('·')[1].replace('granted and published ', '').trim()}. ${patent.limit}`,
  },
  {
    q: 'Is that patent on the formula?',
    a: 'No, and the page says so rather than leaving it to be assumed. It is a device patent — it covers how the deodorizing liquid is delivered across a space. We hold no patent on a pet care formula, and we do not claim one anywhere on this site.',
  },
  {
    q: 'Which trademarks do you hold?',
    a: `One we can name: ${trademark.title}, registration ${trademark.identifier}, class 3, registered 2026-08-13 and in force to 2036-08-13. ${trademark.limit} ${trademark.howToVerify}`,
  },
  {
    q: 'Do you have certifications?',
    a: 'Yes, and they are on their own page with the scans: ISO 22716 good manufacturing practice with a class-D cleanroom filling scope, an FDA establishment registration, and the two Chinese production licences. What is on this page is different — these are the registrations WE hold, not the ones other bodies issued to us.',
  },
  {
    q: 'Who owns the compliance file for my product?',
    a: 'You do. The report, the certificate of analysis and the specification sheet for your product are issued in your name, and the file travels with the goods. The reports on this site were made on samples belonging to customers whose brands are their own — we publish them as evidence of the work, and we do not claim their brands.',
  },
];

const blocks: V2Block[] = [
  {
    kind: 'hero',
    eyebrow: 'Intellectual property',
    title: 'Who owns the formula and the trademark when the project is finished?',
    lead:
      'Two questions, one page: what this factory holds in its own name — with the number and the register, so you can check it — and what stays yours when we develop a formula with you.',
    primaryCta: { label: 'Ask about IP on your project', href: '/contact.html' },
    secondaryCta: { label: 'See the certifications', href: '/certifications.html' },
    metrics: [
      {
        value: patent.identifier ?? '—',
        label: 'granted utility model',
        note: patent.status,
      },
      {
        value: standard.identifier ?? '—',
        label: 'our own enterprise standard',
        note: 'in force since 2026-05-23',
      },
      {
        value: trademark.identifier ?? '—',
        label: 'our registered trademark',
        note: '贝洛宠, class 3 · in force to 2036-08-13',
      },
      {
        value: '100%',
        label: 'of your formula stays yours',
        note: 'after the NDA, not before',
      },
    ],
    answer:
      'We hold registrations in this company’s own name, and they are printed below with the number and the register they are checked in. What you develop with us is yours: a customer formula stays the customer’s property, and the NDA comes before the discussion, not after it.',
    boundary:
      'One of the three entries is a patent on a device, not on a formula, and the page says which. The trademark is printed with its number because it can be checked in the register today; the other filings we hold are checked by applicant name in the same register.',
  },
  {
    kind: 'recordCards',
    eyebrow: 'What this company holds',
    title: 'Three registrations, and how you check each one',
    lead:
      'Each card carries the number, the holder, the dates, the class and the register. A registration you cannot check is not worth printing, and a registration printed without its limit is not worth having.',
    items: IP_ASSETS.map((a) => ({
      pill:
        a.kind === 'patent'
          ? 'Granted patent'
          : a.kind === 'standard'
            ? 'Our own standard'
            : 'Registered trademark',
      title: a.title,
      subtitle: a.titleLocal,
      number: a.identifier,
      rows: [
        { label: 'Holder', val: a.holder },
        { label: 'Dates', val: a.dates },
        { label: 'Status', val: a.status },
        ...(a.classification
          ? [
              {
                label: a.kind === 'patent' ? 'Classification' : 'Class',
                val: a.classification,
              },
            ]
          : []),
        { label: 'Covers', val: a.scope },
        { label: 'How to check', val: a.howToVerify },
        { label: 'Register', val: a.source },
      ],
      limit: a.limit,
      link: { label: a.verifyLabel ?? 'Open the register', href: a.verifyUrl ?? '#' },
    })),
    note:
      'Each card says what it does not cover: the patent is on a device, the standard is one we wrote ourselves, and the trademark is the mark we have registered in this company’s own name.',
    noteCta: { label: 'The lab reports behind the claims', href: '/certifications.html' },
  },
  {
    kind: 'process',
    eyebrow: 'Your side of it',
    title: 'How a formula stays yours',
    lead:
      'Four steps, and the order is the point: the confidentiality comes before the disclosure.',
    steps: [
      {
        no: '01',
        title: 'The NDA, before the brief',
        desc: 'We sign a confidentiality agreement before a custom formula is discussed. The trade terms say the customer’s formula remains their property and that we do not reproduce, sell or disclose it to a third party.',
      },
      {
        no: '02',
        title: 'The specification, written down',
        desc: 'What the product is, what it is tested against and what the limits are — the same specification sheet that travels with the goods. It is yours, and it is the document the batch certificate is measured against.',
      },
      {
        no: '03',
        title: 'The report in your name',
        desc: 'The laboratory report, the certificate of analysis and the specification sheet are issued for your product and in your name. We keep the manufacturing record; the file is yours.',
      },
      {
        no: '04',
        title: 'Your brand on the label',
        desc: 'Private label means your artwork, your carton and your trademark. Where a client has asked us to develop a formula for a brand they own, that development is recorded as their intellectual property.',
      },
    ],
  },
  {
    kind: 'callout',
    icon: 'shield',
    title: 'The reports on this site carry a customer’s brand, and that is the point',
    body:
      'Several of the laboratory reports published here were made on samples belonging to customers, on their own brands — the sample name is printed on the report and on our page, because the report is the evidence. A contract manufacturer publishes its clients’ samples as proof of the work; it does not claim the brand. If you want the same evidence for your product, ask for it by name and we will run the same tests on your sample.',
  },
  {
    kind: 'faq',
    eyebrow: 'On ownership',
    title: 'The questions an ownership clause raises',
    items: FAQ,
  },
  {
    kind: 'seo',
    graph: [
      webPageSchema({
        name: TITLE,
        path: PATH,
        description: DESCRIPTION,
        speakable: '.v2-speakable',
      }),
      faqPageSchema(FAQ, {
        name: 'Intellectual property — buyer questions',
        url: `${siteConfig.brand.siteUrl}${PATH}`,
      }),
    ],
  },
  {
    kind: 'ctaBand',
    eyebrow: 'Next',
    figure: patent.identifier ?? '—',
    figureNote: patent.status,
    title: 'Ask what applies to your project',
    text:
      'Send the product, the market and what you intend to claim. The reply states the route, the documents and who holds what — and we sign the NDA before we discuss a formula.',
    primaryCta: { label: 'Ask about your project', href: '/contact.html' },
    secondaryCta: { label: 'How the order runs', href: '/production.html' },
    note: siteConfig.response.headline,
  },
];

export default function IntellectualPropertyPage() {
  return (
    <>
      <V2Page blocks={blocks} />
    </>
  );
}

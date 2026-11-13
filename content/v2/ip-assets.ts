/**
 * WHAT THIS COMPANY HOLDS — and what it does not.
 *
 * WHY THIS IS ONE FILE
 *
 * A number the site publishes has to be checkable. If the patent number is
 * written on one page and the trademark number on another, one of them
 * drifts, and the buyer who checks finds a number that leads nowhere.
 *
 * So the registrations live here, once, and the page and the machine-readable
 * files both read them. The build gate checks that every registration
 * number printed anywhere on the site is one of these, and that every one of
 * these is printed somewhere.
 *
 * WHAT IS IN HERE, AND WHY
 *
 * The patent is in here because two independent sources carry it: the
 * national patent gazette (announcement CN223311460U, 2025-09-09) and the
 * patent databases that mirror it. The holder is named because a patent
 * granted to a company you are not is not your asset — and this one is
 * held jointly by this company and another company in the same group.
 *
 * The enterprise standard is in here because it is ours: we wrote it, and
 * it says exactly what our dental-care product is and how it is tested.
 * It is a standard we authored, NOT a third-party certification, and the
 * page says so.
 *
 * THE TRADEMARK, AND WHY IT CARRIES A NUMBER NOW
 *
 * The first version of this record carried no trademark number at all: a
 * trademark moves - it is applied for, it can be refused, it can go into
 * opposition, it can lapse - and a number printed here can be wrong by the
 * time a buyer reads it.
 *
 * That was right about the filing we could not verify and wrong about the
 * one we can. 贝洛宠 was registered on 2026-08-13, and its number 89702457
 * is the one this company already publishes on /for-ai.html. So the number
 * is printed here too, with the register to check it in, and the other
 * filings we hold are still looked up by applicant name.
 *
 * THE FILING THAT IS NOT IN HERE
 *
 * The trademark this record first named was refused on 2026-06-15 and is
 * dead. Two public sources disagreed about it - one said refused, the other
 * said still in application - so neither could be published. That is why
 * the record carries one trademark and not two, and why the build gate
 * bans the refused number from every page.
 */

export type IpKind = 'patent' | 'standard' | 'trademark';

export type IpAsset = {
  kind: IpKind;
  /** The name of the thing, in the language the register uses. */
  title: string;
  titleLocal?: string;
  /**
   * The registration number, exactly as the register prints it.
   * Absent when there is no single number the buyer can check.
   */
  identifier?: string;
  /** Who holds it. */
  holder: string;
  /** The dates: filed, and granted or published. */
  dates: string;
  /** The current status, in the register's own words. */
  status: string;
  /**
   * WHAT IT COVERS, AND WHAT IT DOES NOT.
   *
   * A registration is only worth publishing with its limit attached. A
   * patent on a device is not a patent on a formula, and a standard we
   * wrote is not a certificate somebody else issued.
   */
  scope: string;
  /**
   * WHAT IT DOES NOT COVER.
   *
   * A registration is only worth publishing with its limit attached, and
   * the limit is the line a buyer is actually checking. It is carried
   * separately so the page can set it apart instead of burying it at the
   * end of a paragraph.
   */
  limit?: string;
  /** Where the buyer checks it, in one step. */
  howToVerify: string;
  /** The register itself - the place the card links to. */
  verifyUrl?: string;
  /** What the link says. */
  verifyLabel?: string;
  /** The register the record comes from. */
  source: string;
  /** The class or subject classification, when the register gives one. */
  classification?: string;
};

export const IP_ASSETS: IpAsset[] = [
  {
    kind: 'patent',
    title: 'Space spray deodorizing device',
    titleLocal: '空间喷雾除臭设备',
    identifier: 'CN202422485591.8',
    holder:
      'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. and Shenzhen Yongsheng Environmental Engineering Co., Ltd. — held jointly',
    dates: 'Filed 2024-10-14 · granted and published 2025-09-09 as CN223311460U',
    status: 'Active · anticipated expiry 2034-10-14',
    scope:
      'A mobile deodorizing unit with an adjustable spray range: a trolley, a spray assembly and a reservoir, with the spray head traveling across the top of the trolley so the range can be set.',
    limit:
      'This is a DEVICE patent, not a formula patent — it protects how the deodorizing liquid is delivered to the space, not what is in the bottle. We do not hold a patent on a pet care formula, and this page does not claim one.',
    howToVerify:
      'Search the application number CN202422485591.8, or the publication CN223311460U. The holder, the inventors and the legal status are on the record.',
    verifyUrl: 'https://pss-system.cponline.cnipa.gov.cn/',
    verifyLabel: 'Open the national patent search',
    source: 'National patent gazette, announcement CN223311460U, 2025-09-09',
    classification: 'IPC A61L9/14 — the class for disinfecting, sterilizing or deodorizing air',
  },
  {
    kind: 'standard',
    title: 'Enterprise standard for the dental-care product',
    titleLocal: '企业标准《宠物洁齿水》',
    identifier: 'Q/SHZK 12-2026',
    holder: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. — the drafting company',
    dates: 'Published 2026-05-23',
    status: 'In force',
    scope:
      'The enterprise standard we wrote for our dental-care product: what the product is, what it is tested for, and what the limits are.',
    limit:
      'This is a standard WE authored and published, not a certificate another body issued to us — its value is that we have written down and committed to what the product is, and that anyone can read it.',
    howToVerify:
      'Search the standard number Q/SHZK 12-2026. The drafting company and the effective date are on the record.',
    verifyUrl: 'https://std.samr.gov.cn/',
    verifyLabel: 'Open the enterprise standard platform',
    source: 'National enterprise standard information platform',
  },
  {
    kind: 'trademark',
    title: '贝洛宠',
    identifier: '89702457',
    holder: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
    dates: 'Registered 2026-08-13 · term 14 Aug 2026 to 13 Aug 2036',
    status: 'In force',
    scope:
      'The trademark we have registered in this company’s own name: 贝洛宠, class 3, for pet products.',
    limit:
      'It is printed with its number because it can be checked in the register today. We file other marks under the same company name as well, and those are looked up by applicant name rather than by number, because a trademark status changes and a number printed here can be wrong by the time a buyer reads it.',
    howToVerify:
      'Search the registration number 89702457, or the applicant name "广东深河中科生物科技有限公司". The mark, the class and the current status are on the record.',
    verifyUrl: 'https://sbj.cnipa.gov.cn/',
    verifyLabel: 'Open the trademark register',
    source: 'National Intellectual Property Administration, trademark office',
    classification: 'Class 3 — pet products',
  },
];

/** The registrations that carry a number the buyer can type in. */
export const IP_WITH_NUMBERS = IP_ASSETS.filter((a) => Boolean(a.identifier));

/** One line per asset, for the machine-readable files. */
export function ipLines(): string[] {
  return IP_ASSETS.map(
    (a) =>
      `${a.title}${a.titleLocal ? ` (${a.titleLocal})` : ''}: ${a.identifier ?? 'no single number — check by applicant name'}; ${a.status}; verify at ${a.source}.`,
  );
}

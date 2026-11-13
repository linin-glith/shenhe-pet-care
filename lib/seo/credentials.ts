/**
 * THE CREDENTIALS THIS FACTORY HOLDS.
 *
 * WHY THIS IS ITS OWN FILE
 * The organisation node is published from the site layout, which is a client
 * component, and the layout publishes it so that the entity a product page
 * points at with `manufacturer: {"@id": ".../#organization"}` is actually
 * defined on that page. That client bundle already cost the site once: the
 * brand used to live beside the product schemas, and the twenty per-SKU
 * reference prices went with it into the browser, where the price-leak gate
 * caught them.
 *
 * So this module depends on the site config and nothing else. It must not
 * import the catalogue, the pricing rules or anything else that carries a
 * number the site does not publish. A credential is a public document number
 * and an issuing body; that is all it is allowed to be.
 *
 * WHY THE HIGH-TECH ENTERPRISE CERTIFICATE IS HERE, AND WHO IT IS ISSUED TO
 * The certificate GR202544200988 is issued to 深圳市永盛环境工程有限公司 ·
 * Shenzhen Yongsheng Environmental Engineering Co., Ltd. — a company in the
 * same group as this one, not a third party.
 *
 * That relationship was corrected by the owner on 2026-11-12: it is the same
 * company, a different legal entity of it. The group holds the
 * certificate, the group works under one name, and a buyer checking
 * certificates is checking the supplier. So the certificate is carried here
 * as a credential of this company — and the credential says, in its own text,
 * which entity the document names. The holder is named rather than hidden,
 * because the scan says so, and a buyer who reads the scan has to be able to
 * reconcile the two without guessing.
 *
 * The two Chinese production licences below are issued to THIS entity
 * directly. That difference is stated on the certifications page, in the FAQ,
 * and in the credential texts, so nobody has to work out which is which.
 *
 * WHY NO `award`
 * `award` is a recognition, and the recognition the group holds is already
 * carried here as a credential with its holder named. Putting it in two
 * places would mean one of them could drift.
 *
 * WHY `recognizedBy` IS SOMETIMES ABSENT
 * `recognizedBy` names the body that granted the credential. For the FDA
 * registration and the two Chinese production licences, the site names the
 * granting body, so the name goes in. For the ISO 22716 certificate it does
 * not: the certificate and the audit report are available under NDA, and the
 * certification body is not published anywhere on this site. Naming one would
 * be inventing an issuer. A credential without `recognizedBy` is still a
 * credential; a credential with a made-up issuer is not.
 */

import { siteConfig } from '@/lib/shenhe.config';

const SITE = siteConfig.brand.siteUrl;

/** The body that granted a credential, as this site names it. */
export type CredentialIssuer = {
  '@type': 'GovernmentOrganization' | 'Organization';
  name: string;
  sameAs?: string;
};

/**
 * One credential.
 *
 * The fields are the ones both the markup and the certifications page need,
 * so the document is written down once. `file` is the scan on this domain;
 * a credential whose document is not published has no `file`, and is
 * presented on the page in words instead of as an image.
 */
export type FactoryCredential = {
  /** The name the site gives the credential. */
  title: string;
  /** The document number exactly as it is printed, when it has one. */
  identifier?: string;
  /** The entity the document is issued to, exactly as it is printed. */
  entity: string;
  /** The validity line, exactly as the site prints it. */
  validity: string;
  /**
   * What the credential covers, and — as importantly — what it does not.
   * This is the sentence that keeps the markup from being read as a product
   * approval, which is the misreading the site spends whole pages correcting.
   */
  scope: string;
  /** The body that granted it, when the site names one. */
  recognizedBy?: CredentialIssuer;
  /** Where a buyer checks it without taking this site's word for it. */
  howToCheck?: { register: string; href: string };
  /** The scan on this domain, when the document is published. */
  file?: string;
  /** The icon the certifications page draws it with. */
  icon?: 'shield' | 'leaf' | 'sparkle' | 'flask' | 'factory';
};

/**
 * THE CREDENTIALS, IN THE ORDER A BUYER READS THEM.
 *
 * The manufacturing system first, then the two production licences that say
 * what may be made, then the registration that says where the goods may be
 * sold, then the group's high-tech enterprise recognition.
 */
export const FACTORY_CREDENTIALS: FactoryCredential[] = [
  {
    title: 'ISO 22716 GMP certificate (cosmetics)',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    validity: 'Current',
    scope:
      'Good manufacturing practice for cosmetics, with a class-D cleanroom filling scope. It covers the ' +
      'manufacturing site and the cosmetic product made there. It is a manufacturing guideline, not a ' +
      'product approval, and it does not cover a biocidal claim. The certificate and the audit report ' +
      'behind it are available under NDA.',
    /*
     * NO `recognizedBy` ON PURPOSE.
     * The certification body is not published on this site — the certificate
     * is handed over under NDA, and naming an issuer the site has never
     * printed would be inventing one. The comment at the top of this file
     * says why.
     */
    howToCheck: undefined,
    icon: 'factory',
  },
  {
    title: 'Disinfection-product hygiene licence',
    identifier: '粤卫消证字[2023]-07-第0002号',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    validity: 'Valid to 2027-05-21',
    scope:
      'Permission to produce disinfection products in this province. It covers the disinfection line and ' +
      'the claims that line may make in a market where the product is registered.',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'Guangdong Provincial Health Commission',
    },
    howToCheck: {
      register: 'National disinfection product filing platform',
      href: 'https://credit.jdzx.net.cn:5110/xdcp/loginPage.do',
    },
    file: 'Hygiene-License.jpg',
    icon: 'shield',
  },
  {
    title: 'Feed additive production licence',
    identifier: '粤饲添(2023)H07002',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    validity: 'Valid to 2028-04-23',
    scope:
      'Permission to produce feed additives in this province. It covers the nutrition line — the probiotic ' +
      'and immunoglobulin products.',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'Guangdong Provincial Department of Agriculture',
    },
    howToCheck: {
      register: 'Feed and feed-additive licence register · National Animal Husbandry Station',
      href: 'https://slxkcx.nahs.org.cn/inquire.html',
    },
    file: 'Feed-Additive-License.jpg',
    icon: 'leaf',
  },
  {
    title: 'FDA establishment registration',
    entity: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · 广东深河中科生物科技有限公司',
    validity: 'Current',
    scope:
      'The establishment is listed with the US Food and Drug Administration. A listing, not a product ' +
      'clearance: it does not by itself permit a claim in any market.',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'U.S. Food and Drug Administration',
      sameAs: 'https://www.fda.gov/',
    },
    howToCheck: undefined,
    icon: 'flask',
  },
  {
    title: 'Granted utility model patent',
    identifier: 'CN202422485591.8',
    entity:
      'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. and Shenzhen Yongsheng ' +
      'Environmental Engineering Co., Ltd. \u2014 held jointly',
    validity: 'Granted 2025-09-09 \u00b7 in force to 2034-10-14',
    scope:
      'A mobile deodorizing device with an adjustable spray range \u2014 announcement ' +
      'CN223311460U, IPC A61L9/14. A DEVICE patent, not a formula patent: it protects ' +
      'how the liquid is delivered across a space, not what is in the bottle. We hold no ' +
      'patent on a pet care formula and claim none.',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'China National Intellectual Property Administration',
    },
    howToCheck: {
      register: 'National patent search system \u2014 search CN202422485591.8',
      href: 'https://pss-system.cponline.cnipa.gov.cn/',
    },
    icon: 'factory',
  },
  {
    title: 'High-tech enterprise certificate',
    identifier: 'GR202544200988',
    entity:
      'Shenzhen Yongsheng Environmental Engineering Co., Ltd. · 深圳市永盛环境工程有限公司 ' +
      '— a company in the same group as this one',
    validity: 'Issued 2025-12-25 · valid 3 years',
    scope:
      'The high-tech enterprise recognition held by the group this company belongs to. The document ' +
      'names the entity that holds it, and that entity is named here rather than left for a reader to ' +
      'work out from a scan.',
    howToCheck: undefined,
    file: 'High-Tech-Enterprise-Certificate.jpg',
    icon: 'sparkle',
  },
];

/**
 * THE CREDENTIALS, AS SCHEMA.
 *
 * `EducationalOccupationalCredential` is the right type: it is the one
 * schema.org type that says "this organisation holds this document", and it
 * takes the granting body, the document number and a description. It is
 * what a reader — human or assistant — is looking for when they ask whether
 * the factory can be trusted with a market that needs paperwork.
 *
 * The description carries the scope sentence from the registry rather than a
 * second, shorter version of it. A credential whose markup says "ISO 22716"
 * and whose page says "a guideline, not a product approval" is the same
 * misreading in two places; one sentence, written once, goes in both.
 */
export function factoryCredentials() {
  return FACTORY_CREDENTIALS.map((c) => ({
    '@type': 'EducationalOccupationalCredential' as const,
    name: c.title,
    ...(c.identifier ? { identifier: c.identifier } : {}),
    /*
     * THE HOLDER GOES IN THE DESCRIPTION, NOT IN A FIELD OF ITS OWN.
     *
     * A credential is a document, and a document names the entity it was
     * issued to. That name is the first thing a buyer checks, and on one
     * of these documents it is not the same legal entity as the company
     * publishing the site — so it has to be in the markup, not only in the
     * page. `EducationalOccupationalCredential` has no property for it, so
     * it goes in the description, which is where a reader of the schema
     * will look.
     */
    description: `Issued to ${c.entity}. ${c.scope}`,
    ...(c.recognizedBy ? { recognizedBy: c.recognizedBy } : {}),
    url: `${SITE}/certifications.html`,
    ...(c.howToCheck
      ? {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'How to check this document',
            value: `${c.howToCheck.register} — ${c.howToCheck.href}`,
          },
        }
      : {}),
  }));
}

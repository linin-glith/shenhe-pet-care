/**
 * Shenhe Zhongke — Single Source of Truth for site-wide constants.
 *
 * PROVENANCE: every value below was extracted from the live legacy site
 * (`_legacy/*.html` pulled from /www/wwwroot/www.shenhezhongke.com on
 * 2026-10-20), NOT invented. See `PROVENANCE.md` for the per-field citation.
 *
 * RULE: no component may hardcode a product/spec/contact/metric value.
 * If a number appears on two pages it must come from here.
 *
 * Verified against legacy footers + about.html + index.html + capabilities.html.
 */

/**
 * The names of the product lines.
 *
 * This file is imported by every client component on the site, so everything
 * it imports must be free of the catalogue and of the reference price.
 * lib/product-routing.ts is exactly that: it imports nothing at all, and it
 * is the one module allowed to name a product line. Reading the names from
 * it here means the footer's four line names cannot drift from the line names
 * on the pages those links lead to.
 */
import { LINE_LABEL } from '@/lib/product-routing';

/**
 * The number of active SKUs the site publishes.
 *
 * A CONSTANT, NOT A DERIVATION.
 *
 * This file is imported by every client component on the site, and
 * lib/products.ts imports the product record carrying b2b_price_rmb — the
 * internal reference price. Deriving the count here would put that price
 * into the browser bundle for every page, which is exactly what the
 * quote-on-request policy forbids.
 *
 * shenhe-tools/gen_matcher_catalogue.py rewrites this number from the record
 * on every run, so it cannot drift from the catalogue.
 */
export const ACTIVE_SKU_COUNT = 20;

/**
 * The number of published third-party laboratory reports.
 *
 * A CONSTANT, FOR THE SAME REASON AS THE SKU COUNT ABOVE: this file is
 * imported by every client component, and the reports live in a module that
 * is not safe to pull into the browser bundle.
 *
 * It is checked against content/v2/reports.ts by the build gate ("the counts
 * agree"), so it cannot drift from the reports that are actually published.
 */
export const REPORT_COUNT = 10;

const activeSkuCount = ACTIVE_SKU_COUNT;

/*
 * THE TWO PUBLIC ADDRESSES.
 *
 * There are three accounts on this domain, and they have three jobs:
 *
 * sales@shenhezhongke.com      the buyer's inbox. The form's notices land
 *                               here, the buyer's own letters land here,
 *                               and a reply to a quotation lands here. It
 *                               is a REAL account: until 2026-11-07 it was
 *                               a mail group, which takes mail from the
 *                               company but not from the outside world -
 *                               and that is why the site published mail@
 *                               for months, and why the desk never saw the
 *                               letters buyers wrote to sales@.
 * mail@shenhezhongke.com       the machine's identity: it sends as itself,
 *                               it holds the system's notices and the
 *                               bounces, and it is not published anywhere
 *                               on the site.
 * postmaster@shenhezhongke.com the administrator's account, for the domain
 *                               console and the alerts. Not published
 *                               either.
 *
 * They are declared here, before the configuration, because the footer
 * uses them and the configuration cannot refer to itself: the object is
 * still being built while its own fields are being read.
 *
 * The brand block keeps its own literal, because the catalogue PDF
 * script reads the address out of it with a regex. A constant there
 * would break that reader - and the reader's own check is what
 * stopped the build, which is the reader doing its job. The build
 * gate checks that both constants are mailboxes on our own domain.
 *
 * WHY THE SITE PUBLISHES THE ONE ADDRESS THAT IS READ
 *
 * Three probes were sent on 2026-11-07, one to each address. The
 * letter to mail@ arrived. The letters to sales@ and to postmaster@
 * arrived nowhere, and both of those addresses refuse a login as
 * well. A mail group on an enterprise mailbox takes mail from the
 * company; it does not take mail from the outside world.
 *
 * So the site published an address a buyer's letter could not reach -
 * on 370 places. A buyer who wrote to it wrote into a hole, and the
 * site never found out because no buyer had written yet.
 *
 * That was true for sales@ on 2026-11-07. It is not true now: sales@
 * is a real account, a letter to it arrives, and the reader on the
 * server opens it and writes the letter into the back office as a lead
 * with a reference.
 *
 * THE ONE RULE THIS FILE EXISTS TO KEEP
 *
 * An address the site publishes has to be one somebody READS - not one
 * that merely accepts mail. A mailbox nobody opens turns a lead into a
 * piece of mail: the desk never learns the lead existed, and the
 * statistics say the site got nothing. This project got that wrong
 * three times - a mail group published on hundreds of pages, an
 * administrator account published as the company address, and a
 * personal address published as the sales manager. So both published
 * addresses here are the same account, and that account is one the
 * desk reads.
 */
const PUBLIC_EMAIL = 'sales@shenhezhongke.com';

/*
 * THE SALES MAILBOX.
 *
 * The same account, under the name an importer looks for. It is a real
 * account, not an alias: a letter written to it from a buyer's own
 * mailbox arrives, and the reader on the server picks it up and writes
 * it into the back office as a lead.
 *
 * The reply still comes from the machine's account. The site says where
 * to write, and does not claim the reply will come from sales@.
 */
const PUBLIC_SALES_EMAIL = 'sales@shenhezhongke.com';

/*
 * THE DATA USE PAGE.
 *
 * The batch attestations and the laboratory reports are published so that
 * anyone can check them without taking our word for it. A search engine's
 * rich result test asks a Dataset for one more thing - a license, which
 * it defines as "a URL to a page that describes the license governing
 * the dataset's use" - and on 2026-11-08 it named the field as missing
 * on the attestation index.
 *
 * So the terms under which the published records may be used are written
 * down, on a page of their own, and every Dataset on the site points at
 * that page. One path, one place: a second copy would be a second answer.
 */
const DATA_LICENSE_PATH = '/data-license.html';

export const siteConfig = {
  brand: {
    /** Display name used in <title> and nav. Legacy: "SHENHE ZHONGKE" */
    name: 'SHENHE ZHONGKE',
    nameTitle: 'Shenhe Zhongke',
    nameCN: '深河中科',
    /** Footer copyright, verbatim from all 47 legacy pages */
    legalName: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
    /** index.html hero eyebrow */
    positioning: 'Pet Care Products Manufacturers',
    /** Legacy: "20 ready-to-ship SKUs across 4 product lines" — the count now
     *  comes from the catalogue (lib/products.ts), the line count is the
     *  legacy marketing taxonomy. */
    shortPitch:
      `30,000m² industrial park. ${activeSkuCount} SKUs. 4 product lines. Serving global pet brands since 2020.`,
    domain: 'shenhezhongke.com',
    siteUrl: 'https://shenhezhongke.com',
    /** index.html: "EST. 2020 · Heyuan, Guangdong · FDA Registered" */
    foundedYear: 2020,
    /**
     * Where the plant is, in the form a strip can carry.
     *
     * The full postal address is in `address`; this is the short form a
     * buyer reads when deciding whether a supplier is in the right part of
     * the world. It is a separate field and not a slice of `address`
     * because the slice of a postal address reads "Yuancheng District,
     * Heyuan, Guangdong, China" — the district first, which is how a
     * Chinese address is written and not how an English reader scans it.
     */
    location: 'Heyuan, Guangdong, China',
    /** footer address, verbatim */
    address: 'No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China',
    /*
     * THE REGISTERED ADDRESS, SPELLED THE WAY THE LICENCES SPELL IT.
     *
     * It read 龙腾大道 141-1 号 — "Avenue" and a hyphenated house number.
     * Both licences on file (粤卫消证字[2023]-07-第0002号 and
     * 粤饲添(2023)H07002) print 高埔岗龙腾路 141 号-1: "Road", and the
     * wing number after the house number, not inside it. The address in
     * the footer is the one a buyer reads, and the one on a business
     * licence is the one a buyer checks — they cannot be two spellings
     * of the same street. Corrected to the document on 2026-11-09.
     */
    addressCN: '广东省河源市源城区高埔岗龙腾路 141 号-1',
    /**
     * The postal code, for the structured data.
     *
     * It was missing from the Organization graph, and Google's rich
     * result test said so on 2026-11-04: "postalCode 未填写" on the
     * PostalAddress. It is not a new fact - the site's own markup has
     * carried it on the contact and factory pages since the old site,
     * and it is in the identity register. It simply had no place in
     * the configuration, so the graph entity could not name it.
     *
     * The visible footer address is left as the legacy wrote it. The
     * postcode belongs to the postal address, which is what the
     * structured data is for.
     */
    postalCode: '517000',
    /** footer: "Tel: +86-762-3909998" — landline, sales line */
    tel: '+86-762-3909998',
    /** footer: "Email: postmaster@shenhezhongke.com" - the domain mailbox.
     *  It was a Gmail address until 2026-11-05, when the company mailbox
     *  was set up and the public address moved onto our own domain. */
    email: PUBLIC_EMAIL,
    /**
     * THE SALES MAILBOX: sales@shenhezhongke.com
     *
     * A real account on our own domain, and the address a buyer is told
     * to write to. It was a mail group until 2026-11-07, and a mail
     * group cannot take a letter from the outside world - which is why
     * the site published mail@ for months, and why the desk never saw
     * the letters buyers wrote to sales@.
     *
     * Now it can, and the reader on the server reads it: a buyer's own
     * letter becomes a lead with a reference, the same way a form
     * submission does. The reply still comes from the machine's
     * account. The site says where to write, and does not claim the
     * reply will come from sales@.
     */
    emailSales: PUBLIC_SALES_EMAIL,
    /**
     * The WhatsApp number, in the two forms it is needed in.
     *
     * `whatsapp` is the bare number a wa.me link needs — country code, no
     * punctuation. `whatsappDisplay` is the ONE form a visitor ever sees:
     * **+86 172 6665 9928**.
     *
     * The site used to show both spellings of the same account (+1 726 665
     * 9928 in the footer, +86 172 6665 9928 on the contact page), so one
     * number appeared two ways on one site. The client settled on the +86
     * form only (2026-10-23), and the US rendering was removed everywhere —
     * including the chatbot's knowledge base, which quotes this number to
     * buyers.
     */
    whatsapp: '8617266659928',
    whatsappDisplay: '+86 172 6665 9928',
    /**
     * The WhatsApp CONTACT CARD, and the QR that carries it.
     *
     * Two different doors to the same conversation:
     *   - `whatsapp` is a phone number. It opens a chat straight away, which
     *     is what the enquiry hand-off uses, because the message has to arrive
     *     with the product already in it.
     *   - the contact card is the profile a buyer can SAVE — name, avatar,
     *     and the number behind it. A buyer who wants to talk to the factory
     *     next week, rather than answer a quote right now, saves the card.
     *
     * The QR was taken from the client's own WhatsApp contact card, so it is
     * the card the factory actually hands out. The bitmap is
     * public/assets/img/contact/whatsapp-qr.png (and its .webp).
     */
    whatsappCard: 'https://wa.me/qr/M72HMIMOMBMWP1',
    whatsappCardImage: '/assets/img/contact/whatsapp-qr.png',
    /** The name WhatsApp shows on the card. */
    whatsappCardName: 'Shenhezhongke',

    /**
     * THE ENTITY, for the machine-readable layer.
     *
     * An assistant decides whether two mentions are the same company by
     * looking for the same entity in more than one place. The `sameAs`
     * list is what does that: it names the other places this company
     * appears, so the website, the B2B directory and the trade listing
     * are read as one company rather than three.
     *
     * `businessScope` is the registered business, in plain words, so an
     * assistant does not have to infer it from the product pages. It is
     * what the company does, not what it sells on this site.
     *
     * The values that also appear on the pages — the legal name, the
     * address, the year — are written once, in `brand`, and are read
     * from there. A fact that is written twice is a fact that will be
     * correct in one place and stale in the other, and a machine
     * reading both will believe the one that disagrees.
     */
    entity: {
      /** The registered business, in plain words. */
      businessScope:
        'Contract manufacturing of pet care products — shampoos, deodorizing and disinfecting sprays, grooming and outdoor protection lines — developed to a buyer\'s formula and filled under the buyer\'s own label, exported from Guangdong, China.',
      /**
       * The other places this company appears.
       *
       * These are the URLs that identify the company rather than
       * describe something about it. A page about the factory
       * describes the factory; the company itself is identified by the
       * site it lives on and the places where it is listed. So the
       * list holds the home page and the listing pages — and not the
       * pages that describe it, which would tell an assistant that
       * the company is a different company from itself.
       *
       * The company has been listed on the Chinese marketplaces for
       * years - on 1688 and on JD - and a search on 2026-11-08 found
       * those pages, plus the business-registry entries, before it
       * found the ones this list names. So the records were there and
       * the site was not pointing at them, which is the half of the
       * job that does nothing: a third-party record only counts if
       * the company is seen in it AND the record is claimed.
       *
       * Each address here has to be a page that could be opened and
       * read on its own, and that carried the name and the address.
       * The registry entries (爱企查, 企查查), the 1688 storefront and
       * the BOSS直聘 company page are real - a search quotes the name
       * and the address on them - but the pages need JavaScript or
       * refuse a plain request, so they are not claimed yet. A claim
       * about somebody else's page has to be checkable.
       */
      sameAs: [
        'https://shenhezhongke.com',
        /*
         * THE MARKETPLACE LISTINGS - CHECKED ON THEIR OWN PAGES.
         *
         * The 1688 factory page carries the legal name and the address
         * (源城区高埔岗, 河源) in its own body. The JD flagship store's
         * title is the Chinese brand name.
         */
        'https://www.1688.com/factory/b2b-221729763086058196.html',
        'https://mall.jd.com/index-146676108.html',
        /*
         * THE THIRD-PARTY IDENTIFIERS.
         *
         * `sameAs` means "the same entity, at another address". The
         * report pages are documents this company published and a
         * laboratory issued, and each carries that report's own number —
         * which is the part a buyer quotes back. They are the addresses
         * where the company's own evidence lives under its own name, and
         * they are the addresses an assistant can check.
         *
         * And then the places where the company appears in someone
         * ELSE's record: the marketplace listings it has held for
         * years. Those are the ones that turn a self-published claim
         * into a third-party record, and they were the ones missing -
         * a search on 2026-11-08 found the 1688 factory page and the
         * JD flagship store before it found anything on this site.
         *
         * Every address here has to be a page that can be opened and
         * read on its own, and that carries the name and the address.
         * The registry entries (爱企查, 企查查), the 1688 storefront
         * and the BOSS直聘 company page are real - a search quotes the
         * name and the address on them - but the pages need JavaScript
         * or refuse a plain request, so they are not claimed yet. A
         * claim about somebody else's page has to be checkable.
         *
         * The register in docs/站外身份执行清单.md has the exact form
         * each one takes and what has to be identical across the
         * platforms for an assistant to read them as one company.
         */
        /*
         * THE TEN REPORT PAGES WERE HERE, AND WERE REMOVED ON 2026-11-10.
         *
         * They were laboratory reports this company published on this same
         * domain, and each carried its own report number. They were removed
         * because `sameAs` does not mean "every page about us": it means
         * "the same entity, at ANOTHER address" — the field a machine reads
         * to join two records it found in two different places. A subpage of
         * this site is not another place. What the list said, in effect, was
         * that of twelve addresses nine were self-published and three were
         * anybody else's, and a machine that reads self-references as
         * corroboration learns nothing.
         *
         * Nothing was lost on the evidence side: all ten report pages are
         * still built, still linked from /reports.html and from the products
         * that cite them, and still resolvable by their own numbers. What
         * changed is only where the site claims to BE, which is a different
         * question from where its evidence lives.
         *
         * The registry is content/v2/reports.ts. The build gate "the identity
         * list is whole" still resolves every address in this list.
         */
      ],
      /** The channels the company is reachable on. */
      social: {
        website: 'https://shenhezhongke.com',
        whatsapp: 'https://wa.me/8617266659928',
        email: PUBLIC_EMAIL,
        telephone: '+86-762-3909998',
      },
    },
  },

  /**
   * METRICS — legacy verbatim. Do NOT "upgrade" these.
   * about.html: 30,000m² park / 220+ employees / 20 active SKUs / ISO 22716 / 2025 1M bottles per month
   */
  /**
   * The legal pages, and the one that says what may be done with the
   * records this site publishes.
   */
  legal: {
    /**
     * The data use page: the terms for the batch attestations and the
     * laboratory reports. Every Dataset node's "license" points here,
     * and the footer's legal row links it.
     */
    dataLicensePath: DATA_LICENSE_PATH,
  },

  metrics: {
    parkAreaM2: 30000,
    officeAreaM2: 3000,
    gmpWorkshopAreaM2: 5000,
    buildings: 3,
    employees: 220,
    productLines: 4,
    monthlyCapacityBottles: 1000000,
    cleanroomClass: 'class-D',
    gmpStandard: 'ISO 22716',
    foundingWorkshopM2: 1000,
    yearsInBusiness: 6, // 2026 - 2020
    /** index.html trustbar */
    exportsToCountries: 12,
    /** The SKUs the catalogue publishes (ACTIVE_SKU_COUNT, see above). */
    catalogueSkuCount: ACTIVE_SKU_COUNT,
    /** The third-party laboratory reports that are published (REPORT_COUNT). */
    reportCount: REPORT_COUNT,
    /** The production lines in the workshop — the factory page names them. */
    productionLines: 6,
    /**
     * THE STEPS BETWEEN THE RAW MATERIAL AND THE CARTON.
     *
     * This number was written into four places by hand — the factory page,
     * the capabilities page, the why-us page and the trade terms — and each
     * copy could say a different number without anything noticing. It is
     * here now, and the pages read it.
     */
    qcStepCount: 6,
    /**
     * THE BATCH REJECT RATE, YEAR TO DATE IN 2026.
     *
     * A factory that has never rejected a batch cannot tell you how it
     * handles one. This number is published rather than rounded down, and it
     * was written into four places by hand until it was moved here.
     */
    batchRejectRatePct: 1.2,
    /** about.html "Global reach" */
    majorExportRegions: 5,
    /** trade-compliance.html / index.html */
    targetMarkets: ['Russia', 'Brazil', 'EAEU', 'EU'],
  },

  /**
   * THE R&D TEAM, COUNTED.
   *
   * The source is the legacy capabilities page: "8 in-house chemists
   * (5 MSc, 3 BSc) plus 2 regulatory specialists. Two of our chemists hold
   * PhDs in cosmetic science from South China University of Technology."
   *
   * THE COUNT THAT HAS TO STAY TRUE
   *
   * Two of the EIGHT chemists hold the doctorates — the PhDs are a
   * qualification held inside the team, not a third group of people
   * alongside it. The two regulatory specialists are two more people, and
   * they are not chemists.
   *
   * A rewrite once read "eight in-house chemists (five MSc, three BSc, two
   * SCUT PhDs)", which adds up to ten people inside the word "eight" and
   * drops the regulatory specialists on the way. The why-us page said it
   * correctly on the same site, which is how the two disagreed.
   *
   * So the numbers live here, once, and both pages read them.
   */
  team: {
    /** In-house chemists. */
    chemists: 8,
    /** Of those chemists, how many hold an MSc. */
    msc: 5,
    /** Of those chemists, how many hold a BSc. */
    bsc: 3,
    /** Regulatory specialists — staff who are not chemists. */
    regulatorySpecialists: 2,
    /** Of the chemists, how many hold a PhD. */
    phd: 2,
    /** The field those doctorates are in. */
    phdField: 'cosmetic science',
    /** Where those doctorates are from. */
    phdFrom: 'South China University of Technology',
    /** The short name the site uses for that university. */
    phdFromShort: 'SCUT',
  },

  /** about.html "Global reach" pins — verbatim region list */
  regions: [
    { name: 'North America', slug: 'north-america' },
    { name: 'Europe', slug: 'europe' },
    { name: 'Middle East', slug: 'middle-east' },
    { name: 'Asia-Pacific', slug: 'asia-pacific' },
    { name: 'Latin America', slug: 'latin-america' },
  ],

  /** about.html timeline — verbatim */
  timeline: [
    {
      year: '2020',
      title: 'Incorporation & first GMP-ready workshop',
      desc: 'Registered as Guangdong Shenhe Zhongke Biotechnology Co., Ltd. First 1,000m² GMP-aligned workshop commissioned in Heyuan, Guangdong.',
    },
    {
      year: '2021',
      title: 'Four product lines live',
      desc: 'Deodorizing, grooming, outdoor protection, and pet nutrition lines all in commercial production. First university R&D partnership signed.',
    },
    {
      year: '2024',
      title: 'Formula IP registered · independent export company',
      desc: 'Formulas carry registered formula or design IP. Independent export station launched to replace marketplace listings.',
    },
    {
      year: '2026',
      title: '1M bottles / month',
      desc: 'Monthly production capacity reached 1,000,000 bottles across six production lines and four product lines.',
    },
  ],

  /**
   * THE TWO PRODUCTION LICENCES ISSUED TO THIS ENTITY.
   *
   * WHY THEY BELONG HERE AND NOT IN A PAGE COMPONENT
   * These are the only credentials on the site that are (a) issued to
   * Guangdong Shenhe Zhongke Biotechnology Co., Ltd. itself and (b) published
   * as a scan a buyer can read. A number and an expiry date are the two facts
   * a buyer can check without asking us, which is why the strip at the top of
   * every page quotes them instead of an adjective like "certified".
   *
   * They appear twice on purpose: here, in the strip, and in the licence
   * tables on /certifications.html and the FAQ. The same string in three
   * places is what makes it checkable — a different string in any of them
   * would make all three worthless.
   *
   * NOT the high-tech certificate: that one is issued to Shenzhen Yongsheng
   * Environmental Engineering, a related company, and is displayed as such.
   * A strip that led with it would be claiming another entity's credential.
   */
  licences: [
    {
      id: 'hygiene',
      /** As printed on the licence. */
      name: 'Disinfection-product hygiene licence',
      number: '粤卫消证字[2023]-07-第0002号',
      validTo: '2027-05-21',
      /** Spelled out, so the strip does not depend on a locale at build time. */
      validToLabel: '21 May 2027',
      file: '/assets/img/certs/Hygiene-License.jpg',
    },
    {
      id: 'feed',
      name: 'Feed additive production licence',
      number: '粤饲添(2023)H07002',
      validTo: '2028-04-23',
      validToLabel: '23 April 2028',
      file: '/assets/img/certs/Feed-Additive-License.jpg',
    },
  ],

  /**
   * THE REGISTRATION FACTS — from the business licence.
   *
   * NOT the legal representative. The licences print one; the site does not
   * publish it. That is a decision, not an omission: a buyer verifying the
   * company uses the credit code and the registered name, and a named
   * individual on a public page is a person exposed for no commercial gain.
   *
   * `businessScopeShort` is the scope compressed to the lines a buyer of pet
   * care actually needs to match against a purchase order. The long form is
   * the licence verbatim and is reproduced in docs/公司经营范围英文译本.
   * It deliberately does NOT claim manufacture of daily chemical products:
   * the scope lists 日用化学产品销售 (sale) and no 制造 (manufacture), so the
   * plant's pet-care lines are described as plant capability on the about
   * page, never as this entity's licensed scope.
   */
  registration: {
    creditCode: '91441602MA54FNBG55',
    establishedOn: '2020-03-31',
    businessScopeShort:
      'Production of disinfectants, feed and feed additives; manufacture of environmental protection equipment and eco-materials; bio-fertiliser R&D; import and export. Licensed items per the business licence.',
  },

  /** index.html trustbar (5 items, verbatim) */
  trustbar: [
    { value: '6 years in business', label: 'Since 2020' },
    { value: '30,000 m² factory', label: 'Heyuan, Guangdong' },
    { value: `${activeSkuCount} SKUs · 4 lines`, label: 'Ready to ship' },
    { value: 'ISO 22716 GMP', label: 'GMP certified' },
    { value: 'Exports to 12+ countries', label: 'Russia · Brazil · EAEU · EU' },
  ],

  /** certifications.html + index.html "Third-party verified performance" */
  certifications: [
    'ISO 22716 GMP',
    'FDA Registered',
    'Cruelty-Free',
    'Plant-based',
  ],

  /**
   * VERIFIED LAB NUMBERS — index.html data-value attributes.
   * NOTE: legacy shipped these as `<div class="pp-ring__value">0%</div>` and only
   * animated them client-side, so no-JS crawlers and screenshots saw "0%".
   * v2 renders the real number server-side and animates as enhancement.
   */
  labResults: [
    { value: 94.2, display: '94.2%', label: 'Ammonia removal', note: 'Report NACCYH25014722', tone: 'teal' },
    { value: 99.999, display: '>99.999%', label: 'Pathogen kill rate', note: '3 strains verified', tone: 'teal' },
    { value: 100, display: '100%', label: 'Natural formulas', note: 'Plant-based ingredients', tone: 'teal' },
  ],

  /** index.html — the two engagement paths */
  paths: [
    {
      id: 'products',
      eyebrow: 'For Brand Buyers',
      cta: 'Request a quotation',
      title: 'For Brand Buyers',
      metric: `${activeSkuCount} SKUs · 4 series · Lab tested`,
      desc: `${activeSkuCount} ready-to-market SKUs across 4 series. Deodorizing, grooming, outdoor protection & nutrition.`,
      linkLabel: 'Explore Products',
      linkSuffix: `${activeSkuCount} SKUs ready`,
      href: '/products.html',
    },
    {
      id: 'oem',
      eyebrow: 'OEM / ODM',
      cta: 'Start Your Project',
      title: 'For OEM/ODM Partners',
      metric: '5,000m² GMP · 25–40 day private label · reply in 1 business day',
      desc: 'Private label, custom formula & packaging. 5,000m² GMP workshop. From concept to shelf in 25–40 days.',
      linkLabel: 'Start Your Project',
      linkSuffix: 'reply in 1 business day',
      href: '/oem-odm.html',
    },
  ],

  nav: {
    /**
     * Nav order follows the GLOBAL BUYER'S QUESTIONS, not the org chart:
     *   what do you make → how do we work together → can you ship into my
     *   market → prove the factory → where do I read more → who are you
     *
     * "Global Compliance" is a differentiator most suppliers bury under
     * Certifications; it answers the compliance officer's question directly and
     * is the intended entry point for regulatory search traffic.
     * "Sourcing Guides" is the content hub that carries the SEO programme.
     *
     * URLs are unchanged for pre-existing routes — no redirects needed.
     */
    main: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products.html' },
      { label: 'OEM & ODM', href: '/oem-odm.html' },
      { label: 'Global Compliance', href: '/global-compliance.html' },
      { label: 'Factory', href: '/factory.html' },
      { label: 'R&D', href: '/capabilities.html' },
      { label: 'Sourcing Guides', href: '/sourcing-guides.html' },
      { label: 'About', href: '/about.html' },
    ],
    /** footer column 1 — Company */
    company: [
      { label: 'About', href: '/about.html' },
      { label: 'Factory', href: '/factory.html' },
      { label: 'R&D', href: '/capabilities.html' },
      { label: 'Certifications', href: '/certifications.html' },
      { label: 'Patents & trademarks', href: '/intellectual-property.html' },
      { label: 'Trade programme', href: '/trade-programme.html' },
      { label: 'How we verify', href: '/standards.html' },
      { label: 'Why us', href: '/why-us.html' },
      { label: 'FAQ', href: '/faq.html' },
      { label: 'Batch attestations', href: '/attestation.html' },
      { label: 'AI Product Match', href: '/ai-customize.html' },
      { label: 'Blog', href: '/blog.html' },
      { label: 'Contact', href: '/contact.html' },
    ],
    /**
     * footer column 2 — Products
     *
     * THE LABELS ARE READ, NOT WRITTEN
     * These four are the product lines, and their names are decided in
     * lib/product-routing.ts — the one module allowed to name a line. They
     * used to be written out here as a fourth hand copy, and the footer
     * column then rendered all four of them as the single word "Products"
     * (components/Footer.tsx overrode these labels with a section-level
     * translation key), so the column that is supposed to name the four
     * lines named none of them.
     *
     * The hrefs are still written here: a URL is a fact about the site's
     * shape, not about a product, and the Outdoor Protection entry is
     * currently the SKU page because the line has no page of its own.
     */
    products: [
      { label: LINE_LABEL.deodorizing_disinfection, href: '/products/deodorizing-disinfecting.html' },
      { label: LINE_LABEL.grooming_care, href: '/products/grooming-care.html' },
      { label: LINE_LABEL.outdoor_protection, href: '/products/outdoor-protection.html' },
      { label: LINE_LABEL.pet_nutrition, href: '/products/pet-nutrition.html' },
      /*
       * The cat page is a cut ACROSS the lines, not a fifth line - which is
       * why it is not in LINE_LABEL. A brand that makes cat products looks
       * for cats, and the footer is on every page, so the way in is here.
       */
      { label: 'Cat Care', href: '/products/cat-care.html' },
    ],
    /** footer column 3 — Contact */
    contact: [
      { label: 'Tel', value: '+86-762-3909998', href: 'tel:+867623909998' },
      { label: 'Email', value: PUBLIC_SALES_EMAIL, href: `mailto:${PUBLIC_SALES_EMAIL}` },
    ],
    /** footer column 4 — Account */
    account: [
      { label: 'Sign in', href: '/portal/login.html' },
      { label: 'Create account', href: '/portal/register.html' },
      { label: 'Track enquiry', href: '/portal/track.html' },
    ],
    /** footer legal row */
    legal: [
      { label: 'Privacy Policy', href: '/privacy.html' },
      { label: 'Terms of Service', href: '/terms.html' },
      { label: 'Data Use', href: DATA_LICENSE_PATH },
      { label: 'MSDS Sheets', href: '/msds.html' },
    ],
    /**
     * secondary nav not in the header row (trade-compliance / ai-customize).
     *
     * "Systems" used to live here. That page was an internal dashboard —
     * server IP, panel, database and inbox details — and it was published,
     * indexable and listed in the sitemaps. It is no longer exported; the
     * content stays in content/systems.json as an internal record.
     */
    secondary: [
      { label: 'Trade Compliance', href: '/trade-compliance.html' },
      { label: 'AI Customize', href: '/ai-customize.html' },
    ],
  },

  analytics: {
    gtmId: 'GTM-5KV9GJR2',
    ga4Id: 'G-598G7IMVZ6',
    clarityId: 'ypxh4laftl',
  },

  /**
   * THE RESPONSE PROMISE — one place, because the site used to say three
   * different things about how fast we reply.
   *
   * The dock and the inquiry form said "within one business hour", the
   * contact FAQ said "one business hour on WhatsApp, same day by email", and
   * the contact page's own email-channel note said "within one business
   * day" — on the same page as the FAQ that promised the same day. A buyer
   * reading both could not tell which was the promise.
   *
   * WHY IT IS NOW A BUSINESS DAY AND NOT A BUSINESS HOUR
   * The hour was never a promise the factory had confirmed it could keep,
   * and a promise the site cannot keep is worse than no promise at all: a
   * buyer who waits an hour and gets nothing has been told to distrust the
   * one number on the page. Until the factory confirms a shorter figure,
   * the conservative value is the one to publish — a promise that is met is
   * worth more than a promise that is fast. (2026-11-02, P0 of the
   * three-competitor review.)
   *
   * These are the values every surface states. Changing them here changes
   * them everywhere.
   */
  response: {
    /** Headline form: the dock fact and the form's "Response time" row. */
    headline: 'Within 1 business day (CST)',
    /** The email channel note on the contact page. */
    email: 'Within one business day by email during China Standard Time working hours.',
    /** Working hours, quoted by the telephone channel. */
    hours: 'Mon–Sat, 09:00–18:00 China Standard Time.',
  },

  /**
   * B2B pricing policy (hard constraint, stated 2026-09-29):
   * shenhe is a wholesale inquiry site. Never publish unit price / MOQ / tier
   * price in a form that reads as a price list. Use "Quote on request".
   * The legacy product pages DID leak tier tables (`pp-price-table`) and the
   * Product JSON-LD carried `offers.price`.
   *
   * Both artefacts of that one policy are gone (2026-11-12): the tier tables
   * in the sixteen legacy page captures, the per-SKU prices in the legacy
   * catalogue export, and the legacy tier file. The commercial thresholds
   * that are not prices stay - the L/C floor, the ICC minimum, the sample
   * and CPSR fees, the freight estimate and the product liability limits -
   * and scripts/check_no_price_leak.py names every one of them and holds the
   * line.
   */
  pricing: {
    display: 'Quote on request',
    label: 'B2B wholesale pricing',
    /**
     * THE SENTENCE THAT SAYS WHY THERE IS NO PRICE.
     *
     * Google's product summary report calls every product page invalid
     * for the missing offers, and the answer to "why is there no price"
     * belongs in the markup - on the product, and on the organisation.
     *
     * It is one string, in one place, because it is read by three
     * generators that cannot import this file: the attestation index,
     * the report pages and the batch pages each publish an organisation
     * node for the company, and each of them says the same thing.
     */
    declaration: 'B2B wholesale pricing: quote on request.',
    /**
     * The same statement, in the grammar a product's own property needs.
     * Two sentences, one policy, both written down here: the product says
     * how it is priced, and the organisation says why there is no price.
     */
    productPricing: 'Quote on request \u2014 B2B wholesale pricing.',
    policy:
      'Unit prices are quote-only. Volume tiering, label/packaging costs and shipping terms are confirmed per RFQ.',
  },

  api: {
    baseUrl: '/api',
    inquiryEndpoint: '/api/inquiries',
    whatsappWebhook: '/api/whatsapp/webhook',
  },

  i18n: {
    /** legacy lang-float.js supports these three */
    languages: [
      { code: 'en', label: 'EN' },
      { code: 'es', label: 'ES' },
      { code: 'de', label: 'DE' },
    ],
    default: 'en',
  },

  /** legacy og:image for every page */
  ogImage: '/assets/img/ui/og-default.png',
  themeColor: '#0a6e65',
} as const;

export type SiteConfig = typeof siteConfig;
export type Brand = typeof siteConfig.brand;
export type NavItem = { label: string; href: string };

/**
 * THE TEAM, IN ONE SENTENCE.
 *
 * Two pages state the size of the R&D team — the R&D page and the why-us
 * page — and they are the same fact, so it is written once here. Reading
 * it from the configuration means a page cannot be rewritten into a
 * different claim about the team.
 */
export const RND_TEAM_SENTENCE =
  `${siteConfig.team.chemists} in-house chemists ` +
  `(${siteConfig.team.msc} MSc, ${siteConfig.team.bsc} BSc), plus ` +
  `${siteConfig.team.regulatorySpecialists} regulatory specialists and ` +
  `${siteConfig.team.phd} ${siteConfig.team.phdFromShort} PhDs`;
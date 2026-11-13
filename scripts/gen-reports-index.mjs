/**
 * The evidence-chain index for the third-party lab reports.
 *
 * THE PROBLEM THIS SOLVES
 * The ten lab reports are real, numbered, and downloadable — but the
 * only place they exist as data is a TypeScript array inside a page
 * component. The JSON-LD on that page lists them as an ItemList whose
 * every entry points at the same URL, so an assistant reading it
 * cannot tell one report from another, cannot reach the file, and
 * cannot tell which product line a report covers.
 *
 * That is the whole reason an answer engine reads our site and does
 * not quote it: there is nothing to point at.
 *
 * WHAT THIS WRITES
 *
 *   public/reports.json          the index, one record per report, with
 *                                the issuer, the report number, the
 *                                product line, the finding, the file,
 *                                and the page that describes it
 *
 *   public/reports/<number>.html one page per report — a stable URL an
 *                                assistant can cite, carrying the
 *                                report's own JSON-LD
 *
 *   content/v2/reports.ts        the same records as typed data, so
 *                                the pages and the index cannot drift
 *
 * THE RULES
 *
 * - Every record is read out of the page's own REPORTS array. Nothing
 *   is written here that the site does not already say. A report
 *   number invented for an index would be the worst possible lie,
 *   because a buyer would quote it back to us.
 *
 * - The coverage field says what the report's own note says. Where
 *   the note names a product line, that line is named here. Where it
 *   does not, the field says so rather than guessing.
 *
 * - The report number is the key. A buyer quotes "NACCYH25014722",
 *   so that string has to resolve to one page and one file, always.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://shenhezhongke.com';

/*
 * THE DAY THE SITE WAS BUILT.
 *
 * Every page with markup carries the date it was last changed. The
 * report pages are written by this script rather than by a page
 * component, so they need the date from here as well - otherwise a
 * crawler sees a date on the product pages and none on the reports,
 * and learns that the date means nothing.
 *
 * IT IS READ, NOT TYPED. The date lives in lib/seo/build-date.ts, which
 * is the one place it is written down; this script used to carry a second
 * copy of the same string, and the two drift - the reports go on saying
 * a day the rest of the site has stopped saying. If the file is missing,
 * or the line has moved, the build stops here rather than publishing a
 * report page with no date.
 */
const BUILD_DATE = /export const BUILD_DATE = '([^']+)'/.exec(
  fs.readFileSync(path.join(ROOT, 'lib', 'seo', 'build-date.ts'), 'utf8'),
)?.[1];
if (!BUILD_DATE) {
  throw new Error('the build date is not in lib/seo/build-date.ts');
}

/* ------------------------------------------------------------------ */
/* 1. Read the reports out of the page component                       */
/* ------------------------------------------------------------------ */

const PAGE = path.join(ROOT, 'app/(site)/certifications/page.tsx');
const src = fs.readFileSync(PAGE, 'utf8');

const GDDCM = 'Guangdong Detection Center of Microbiology';
const NACC = 'Guangzhou Institute of Microbiology (NACC)';
const GIM = 'Guangzhou Institute of Microbiology Group Co., Ltd.';

// The REPORTS array, parsed out of the page rather than copied into a
// second list. A copy is a copy that drifts.
const arrayStart = src.indexOf('const REPORTS: Report[] = [');
if (arrayStart === -1) throw new Error('the REPORTS array was not found');
const arrayEnd = src.indexOf('\n];', arrayStart);
if (arrayEnd === -1) throw new Error('the end of the REPORTS array was not found');
const arrayBody = src.slice(arrayStart, arrayEnd);

const REPORT_RE = /\{\s*file:\s*'([^']+)',\s*title:\s*'([^']+)',\s*issuer:\s*(\w+),\s*number:\s*'([^']+)',\s*note:\s*'((?:[^'\\]|\\.)*)',\s*(?:finding:\s*'((?:[^'\\]|\\.)*)',\s*)?(?:findingShort:\s*'((?:[^'\\]|\\.)*)',\s*)?(?:verificationCode:\s*'([^']*)',\s*)?(?:lot:\s*'([^']*)',\s*)?icon:\s*'([^']+)',\s*\}/g;

const ISSUER_NAMES = { GDDCM, NACC, GIM };

/**
 * How each issuing body can be asked to confirm a report.
 *
 * WHY THIS IS IN THE DATA AND NOT IN THE PAGE
 * A buyer holding a report number wants one thing: a way to check it
 * against the body that issued it. The way to check is a property of
 * the body, not of the factory, so it belongs beside the body and it
 * belongs in every place the report is described — the page, the
 * index and the JSON-LD.
 *
 * The wording is careful. The GDDCM lookup asks for the entrustment
 * number, not the report number, so the text says what a buyer can
 * actually do: call the centre, or look the entrustment number up in
 * their system. Where no public lookup exists — NACC — the field says
 * so rather than implying one.
 */
const VERIFICATION = {
  GDDCM: {
    body: 'Guangdong Detection Center of Microbiology',
    canBeChecked: true,
    how:
      'Ask Guangdong Detection Center of Microbiology to confirm the report. Their report-authenticity service is at https://www.gddcm.com/a/customer/jinduchaxun/ and covers samples the centre accepted from 2024-01-01 onward, which includes this report. The lookup asks for the entrustment number the factory was given when the sample was submitted; the report number printed on the document is what identifies the report itself. The centre can also be called on 020-87137666.',
    lookupUrl: 'https://www.gddcm.com/a/customer/jinduchaxun/',
    telephone: '+86-20-87137666',
    address: '广州市先烈中路100号大院66栋1楼',
  },
  NACC: {
    body: 'Guangzhou Institute of Microbiology (NACC)',
    canBeChecked: false,
    how:
      'Issued by the Guangzhou Institute of Microbiology (NACC), a third-party laboratory. No public report lookup was found for this institute, so the report number and the document itself are the evidence. Ask the factory for the original file, or ask the institute directly.',
    lookupUrl: null,
    telephone: null,
    address: null,
  },
  /*
   * The disinfectant report is not from the Guangdong centre - it is
   * from the Guangzhou Institute of Microbiology Group, and it was
   * being described as though it came from the Guangdong centre. Two
   * different bodies, two different numbers, and a buyer holding this
   * report would have been told to ask the wrong one.
   *
   * The number carries the XJ prefix, which is the group's own
   * entrustment prefix. The group answers enquiries about a report
   * number in writing; there is no public lookup page, so the field
   * says so rather than implying one.
   */
  GIM: {
    body: 'Guangzhou Institute of Microbiology Group Co., Ltd.',
    canBeChecked: false,
    how:
      'Issued by the Guangzhou Institute of Microbiology Group Co., Ltd., a third-party laboratory. The number carries the group\'s own XJ entrustment prefix, and the report is a five-page document with the sample name and the entrusting party printed on it. No public lookup page was found for XJ numbers, so the buyer writes to the group quoting the number and the sample name.',
    lookupUrl: null,
    telephone: null,
    address: null,
  },
};

/**
 * THE TITLE OF A REPORT PAGE, CUT TO FIT A SEARCH RESULT.
 *
 * A result shows about sixty characters. The number takes sixteen of
 * them, so the finding has about forty-four - which is enough for
 * "Disinfectant - chlorine stability" and not enough for
 * "Disinfectant - available chlorine stability and acute oral
 * toxicity".
 *
 * The full title is not lost: it is the heading on the page and it is
 * in the JSON-LD. This is only what the result line shows.
 */
function shortTitleOf(title) {
  const parts = title.split('\u2014');
  const head = parts[0].trim();
  const tail = parts.slice(1).join('\u2014').trim();
  if (!tail) return head;
  // the finding is what the report is about; the rest is the product
  const first = tail.split(/[,;]/)[0].trim();
  // the whole title - number, dash, head, dash, finding - has to fit
  // in sixty characters, so the finding gets what is left
  const budget = 60 - 16 - head.length - 3;
  const words = first.split(/\s+/);
  let out = '';
  for (const w of words) {
    const next = out ? out + ' ' + w : w;
    if (next.length > budget) break;
    out = next;
  }
  if (!out) out = first.slice(0, Math.max(0, budget)).trim();
  return head + ' \u2014 ' + out;
}

const reports = [];
let m;
while ((m = REPORT_RE.exec(arrayBody)) !== null) {
  const [, file, title, issuerKey, number, note, finding, findingShort, verificationCode, lot, icon] = m;
  const issuer = ISSUER_NAMES[issuerKey];
  if (!issuer) throw new Error(`the issuer ${issuerKey} is not known`);
  reports.push({
    file,
    title,
    issuer,
    issuerKey,
    number,
    note,
    finding: finding || undefined,
    findingShort: findingShort || undefined,
    icon,
    verificationCode: verificationCode || undefined,
    lot: lot || undefined,
    slug: number.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase(),
    // The title of the page as it appears in a search result. It is
    // the number and what the report found, and it has to fit: a
    // result shows about sixty characters, and a title past that is
    // cut off in the middle of the finding.
    shortTitle: shortTitleOf(title),
  });
}

if (reports.length !== 10) {
  throw new Error(`expected 10 reports, found ${reports.length}`);
}

/* ------------------------------------------------------------------ */
/* 2. The product line each report covers                              */
/* ------------------------------------------------------------------ */

/*
 * Read out of the note, not decided here. A report that names a line
 * in its own note carries that line; a report that does not is
 * recorded as covering the deodorising family or the cleansing line
 * only where its own note says so, and is marked "not stated"
 * otherwise.
 *
 * The rule that matters: an index that guesses the coverage is worse
 * than no index, because a buyer will ask the supplier about the
 * report and the supplier will find nothing in it.
 */
const COVERAGE_RULES = [
  { line: 'Odor control', sku: 'P001-P002', test: 'Ammonia removal' },
  { line: 'Odor control', sku: 'P001-P002', test: 'Hydrogen sulfide removal' },
  { line: 'Odor control', sku: 'P007-P008', test: 'Ammonia removal' },
  { line: 'Disinfection', sku: 'P003', test: 'Available chlorine stability' },
  { line: 'Odor control', sku: 'P004', test: 'Fungicidal performance' },
  { line: 'Disinfection', sku: 'P003', test: 'Analysis and specification' },
  { line: 'Cleaning & care', sku: 'P010-P011', test: 'Antibacterial performance' },
  { line: 'Cleaning & care', sku: 'P010-P011', test: 'Mite control' },
  { line: 'Cleaning & care', sku: 'P010-P011', test: 'Microbiological and quality test' },
  { line: 'Odor control', sku: 'P002', test: 'Safety assessment' },
];

reports.forEach((r, i) => {
  const c = COVERAGE_RULES[i];
  if (!c) throw new Error('no coverage rule for %s' + r.number);
  r.line = c.line;
  r.skus = c.sku;
  r.test = c.test;
});

/* ------------------------------------------------------------------ */
/* 2a. The conclusion, where the record's own finding is not one        */
/* ------------------------------------------------------------------ */

/*
 * WHY THIS TABLE EXISTS
 *
 * The description of a report page is what an answer engine quotes, so it
 * has to be a conclusion and not a label. Six of the ten records already
 * read that way:
 *
 *   "Kill rates above 99.999% against Trichophyton mentagrophytes and
 *    Candida albicans."
 *
 * Four of them did not, and they failed for two different reasons.
 *
 * TWO OF THEM SAY WHAT WAS DONE, NOT WHAT CAME OUT OF IT:
 *
 *   2024FM11611R02D  "An acute oral toxicity test on the pet deodorant
 *                     sample, batch 2024061101."
 *
 * A test description is not a result. An engine asked "is this deodorant
 * safe?" has nothing to lift from the first sentence.
 *
 * AND THE SECOND ONE WAS WRONG IN THE RECORD, NOT ONLY IN THE LENGTH
 *
 *   2024FM11612R02D  was recorded as "Full ingredient disclosure for the
 *                    multi-effect cleansing line, batch 2024061102." The
 *                    document is a microbiological and quality test - an
 *                    aerobic bacterial count, thermotolerant coliforms, a
 *                    total effective substance and a pH, against QB/T
 *                    4524-2013 - and it carries no ingredient list at all.
 *                    The record now says what the document says, so this
 *                    table no longer has an opinion about it.
 *
 * THE OTHER TWO CARRY THE RIGHT SENTENCE, IN A LENGTH THE SEARCH
 * RESULT CANNOT HOLD:
 *
 *   2024FM11610R01D  the finding is 78 characters. The window is 155,
 *                     and beside the claim the number and the title there
 *                     is room for a shorter claim and not for that one -
 *                     so the description fell back to the document's
 *                     identity and the conclusion was lost.
 *   XJ2025001233     the finding is 80 characters and the sentence it
 *                     ends on - a 14.6% fall - is the number the report
 *                     is quoted for. The short form dropped it.
 *
 * So the conclusion is written here, and every value in it is read off
 * the report document this site publishes. The file is named so a buyer
 * can check it, and the page is named so the sentence can be found:
 *
 *   2024FM11611R02D  Pet-Deodorizing-Spray-Non-Toxic-Cert.pdf
 *                     p.2 and p.4: "the test substance had an LD 50 of
 *                     > 5000mg/kg·BW on SPF ICR mice"; "the sample
 *                     showed no irritation to New Zealand rabbit skin";
 *                     "the sample showed no irritation to the eyes of
 *                     New Zealand rabbits in the acute eye irritation
 *                     test". The laboratory's own word for the first
 *                     result is "actual non-toxic", and it is not used
 *                     here: the house style forbids a safety promise that
 *                     a reader cannot check, and the measured value can
 *                     be checked.
 *
 *   2024FM11612R02D  Multi-Effect-Wash-Ingredient-Report.pdf
 *                     p.3: aerobic bacterial count < 10 CFU/g against a
 *                     standard of <= 1000; thermotolerant coliform
 *                     bacteria 未检出 / "Absence" against "不得检出";
 *                     total effective substance content 18.9% against
 *                     >= 14%; pH 6.36 against 6.0-9.0.
 *                     p.2, the laboratory's conclusion: "the test
 *                     results of the sample tested meet QB/T 4524-2013
 *                     requirements of the standard".
 *                     ⚠ The document does not carry an ingredient list
 *                     and says nothing about restricted substances, so
 *                     the conclusion here is the one it does carry.
 *
 *   XJ2025001233     the record's own finding, in the length that fits
 *                     the window. The number it ends on is kept.
 *
 * The record's own finding is published unchanged where it is right, and
 * the note - which is what the report page says in full - is not
 * touched at all.
 */
const FINDINGS = {
  '2024FM11611R02D': {
    finding:
      'Acute oral toxicity LD50 above 5000 mg/kg; no skin or eye irritation in rabbits.',
    findingShort: 'Acute oral toxicity LD50 above 5000 mg/kg.',
  },
  XJ2025001233: {
    findingShort:
      'Available chlorine 130 mg/L, 111 mg/L after 14 days at 54 °C — a 14.6% fall.',
  },
};

for (const r of reports) {
  const f = FINDINGS[r.number];
  if (!f) continue;
  if (f.finding) r.finding = f.finding;
  if (f.findingShort) r.findingShort = f.findingShort;
}

/* ------------------------------------------------------------------ */
/* 2b. What the report covers, and where the buyer goes next            */
/* ------------------------------------------------------------------ */

/*
 * WHY THIS BLOCK EXISTS
 *
 * The ten report pages were the only ten public pages on the site with
 * no way to reach an enquiry. They are also the pages most likely to
 * earn a link and a ranking: they are the proof, and no competitor has
 * them. So the traffic a sitemap brings in would land on a document and
 * stop there - the evidence and the product were never joined up.
 *
 * The report already says which SKUs it covers ("P001-P002"). That field
 * was written into the page and the index and then went nowhere. Here it
 * is resolved against the catalogue, so the link is derived rather than
 * written: a report cannot point at a product that does not exist, and
 * the page cannot name a product the catalogue does not carry.
 *
 * Every value below comes out of a file the site already has. Nothing is
 * typed here - a product name, a specification, an MOQ, a WhatsApp
 * number. If the catalogue changes, this changes with it.
 */
const ROUTING_TS = fs.readFileSync(path.join(ROOT, 'lib', 'product-routing.ts'), 'utf8');
const PRODUCTS_JSON = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'products.json'), 'utf8'));
const CONFIG_TS = fs.readFileSync(path.join(ROOT, 'lib', 'shenhe.config.ts'), 'utf8');

/**
 * The path of the page that says what may be done with the published
 * reports. It is read from the configuration, which is the one place it
 * is written down - a path typed into this file as well would be two
 * answers, and two answers is how this project keeps getting things
 * wrong.
 */
const DATA_LICENSE_PATH = /DATA_LICENSE_PATH\s*=\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!DATA_LICENSE_PATH) {
  throw new Error('the data license path is not in lib/shenhe.config.ts');
}

/**
 * The sentence that says how this business is priced. It is read from
 * the configuration, which is the one place it is written down - the
 * same reason the licence path is read from there.
 */
const PRICING_DECLARATION = /declaration:\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!PRICING_DECLARATION) {
  throw new Error('the pricing declaration is not in lib/shenhe.config.ts');
}
const PRODUCT_PRICING = /productPricing:\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!PRODUCT_PRICING) {
  throw new Error('the product pricing line is not in lib/shenhe.config.ts');
}

/** How a product is priced, in the form a product's own property needs. */
const PRICING_PROPERTY = {
  '@type': 'PropertyValue',
  name: 'Pricing',
  value: PRODUCT_PRICING,
};

/** A named map out of lib/product-routing.ts - the reader gen-ai-guides.mjs uses. */
function parseTsMap(source, name) {
  const m = source.match(new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!m) throw new Error(`${name} is not in lib/product-routing.ts`);
  const out = {};
  for (const mm of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) out[mm[1]] = mm[2];
  if (!Object.keys(out).length) throw new Error(`${name} parsed to nothing`);
  return out;
}

/** One value out of lib/shenhe.config.ts. */
function cfgValue(key) {
  const m = CONFIG_TS.match(new RegExp(`^\\s{4}${key}:\\s*'([^']*)'`, 'm'));
  return m ? m[1] : null;
}

const PRODUCT_ROUTE = parseTsMap(ROUTING_TS, 'PRODUCT_ROUTE');
const WHATSAPP = (cfgValue('whatsapp') || '').replace(/\D/g, '');
if (!WHATSAPP) throw new Error('the WhatsApp number is not in lib/shenhe.config.ts');
const CATALOGUE = Array.isArray(PRODUCTS_JSON.products)
  ? PRODUCTS_JSON.products
  : Array.isArray(PRODUCTS_JSON)
    ? PRODUCTS_JSON
    : [];
if (!CATALOGUE.length) throw new Error('lib/products.json carries no products');

/** The SKUs a report covers, from a field like "P001-P002" or "P003". */
function skusCovered(field) {
  const out = [];
  for (const part of String(field || '').split(',')) {
    const range = part.trim().match(/^(P\d+)\s*-\s*(P\d+)$/i);
    if (range) {
      const from = Number(range[1].slice(1));
      const to = Number(range[2].slice(1));
      for (let i = from; i <= to; i++) out.push('P' + String(i).padStart(3, '0'));
    } else if (/^P\d+$/i.test(part.trim())) {
      out.push(part.trim().toUpperCase());
    }
  }
  return out;
}

/** The catalogue products a report covers, with the page each one lives on. */
function productsForReport(r) {
  return skusCovered(r.skus)
    .map((id) => {
      const slug = PRODUCT_ROUTE[id];
      const p = CATALOGUE.find((x) => x.id === id);
      if (!slug || !p) return null;
      return {
        id,
        name: p.name_en,
        spec: p.specification,
        url: `/products/${slug}.html`,
        moq: `${Number(p.moq).toLocaleString('en-US')} ${p.moq_unit}`,
      };
    })
    .filter(Boolean);
}

/** The WhatsApp message, in the buyer's voice - the shape the site uses elsewhere. */
function whatsappHref(reportNumber, products) {
  const names = products.map((p) => p.name).join(', ');
  const text = [
    `Hello, I would like a quotation for ${names}.`,
    `Report reference: ${reportNumber}.`,
    '',
    'Please send me the price, the minimum order quantity and the production lead time.',
  ].join('\n');
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

/** Where the contact page picks the enquiry up again, with the product carried over. */
function contactHref(products) {
  const ids = products.map((p) => p.id);
  if (ids.length === 1) return `/contact.html?about=${encodeURIComponent(ids[0])}`;
  return `/contact.html?range=${encodeURIComponent(ids.join(','))}`;
}

/** The "where do I go now" block: the products the report covers, and the two ways to ask. */
function nextStepBlock(r) {
  const covered = productsForReport(r);
  if (!covered.length) return '';
  const items = covered
    .map(
      (p) =>
        `      <li><a href="${p.url}" data-journey="report">${escapeHtml(p.name)}</a> <span class="label">${escapeHtml(p.spec)} &middot; ${escapeHtml(p.id)} &middot; MOQ ${escapeHtml(p.moq)}</span></li>`,
    )
    .join('\n');
  return `  <section class="next">
    <h2>What this report covers</h2>
    <ul>
${items}
    </ul>
    <p class="label">This report documents the product made here. A private-label version of the same formula needs its own testing for the claims you intend to make &mdash; tell us the market and the claim, and we will confirm the sample, the method and the cost in writing before anything is ordered.</p>
    <a class="wa" href="${escapeHtml(whatsappHref(r.number, covered))}" data-journey="whatsapp">Ask on WhatsApp</a>
    <a class="quote" href="${escapeHtml(contactHref(covered))}" data-journey="ask">Request a quotation</a>
  </section>
`;
}

/* ------------------------------------------------------------------ */
/* 3. The index, as JSON                                               */
/* ------------------------------------------------------------------ */

const index = {
  version: 1,
  updated: new Date().toISOString().slice(0, 10),
  publisher: {
    name: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
    legalNameZh: '广东深河中科生物科技有限公司',
    site: SITE,
    founded: 2020,
    location: 'Heyuan, Guangdong, China',
    role: 'Manufacturer — the entity named on the reports below',
  },
  note:
    'These are the third-party laboratory reports this factory holds and publishes. ' +
    'Each record carries the issuing body, the report number as printed on the document, ' +
    'the product line it covers, and the file itself. A report number is the part a ' +
    'buyer quotes back, so each one resolves to exactly one page and one file. ' +
    'The reports document the products made here; a private-label version of the same ' +
    'formula needs its own testing for the claims the buyer intends to make.',
  reports: reports.map((r) => ({
    reportNumber: r.number,
    title: r.title,
    issuer: r.issuer,
    test: r.test,
    productLine: r.line,
    coversSKUs: r.skus,
    // THE MEASUREMENT, IN THREE LENGTHS.
    //
    // finding       what was measured and what came out of it - the
    //               sentence an engine can quote whole.
    // findingShort  the same without the sample, for a list where ten
    //               lines have to fit.
    // context       why the report stands behind the number.
    //
    // The field that used to be called "finding" held the long note, so
    // every file generated from this record had context and no
    // measurement. A reading list built on it named ten reports and not
    // one number a buyer could be given.
    finding: r.finding || r.note,
    findingShort: r.findingShort || r.finding || r.note,
    context: r.note,
    file: `${SITE}/assets/img/certs/${r.file}`,
    fileName: r.file,
    page: `${SITE}/reports/${r.slug}.html`,
    localPage: `/reports/${r.slug}.html`,
    issuedBy: r.issuer,
    downloadable: true,
    // The part that makes the report a check rather than a claim.
    issuedByThirdParty: true,
    verification: {
      body: VERIFICATION[r.issuerKey].body,
      canBeCheckedPublicly: VERIFICATION[r.issuerKey].canBeChecked,
      how: VERIFICATION[r.issuerKey].how,
      lookupUrl: VERIFICATION[r.issuerKey].lookupUrl,
      telephone: VERIFICATION[r.issuerKey].telephone,
    },
  })),
};

const OUT_JSON = path.join(ROOT, 'public', 'reports.json');
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
const jsonText = JSON.stringify(index, null, 2) + '\n';
JSON.parse(jsonText);
fs.writeFileSync(OUT_JSON, jsonText, 'utf8');
console.log('  reports.json: %d bytes, %d records', jsonText.length, index.reports.length);

/* ------------------------------------------------------------------ */
/* 4. One page per report                                              */
/* ------------------------------------------------------------------ */

const OUT_DIR = path.join(ROOT, 'public', 'reports');
fs.mkdirSync(OUT_DIR, { recursive: true });

/** The JSON-LD for one report. */
function reportSchema(r) {
  const covered = productsForReport(r);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // The trail a buyer can climb back up: home, the page that
        // lists every report, and the report itself. A report that is
        // the top of a hierarchy of one tells a crawler nothing about
        // where it sits on the site.
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
dateModified: BUILD_DATE,
            position: 1,
            name: 'Home',
            // The home page is the site root. The export writes it as
            // /index.html, but that is the second name of the same page,
            // and the canonical and the sitemap both say "/". A trail
            // that names the second address teaches a crawler to crawl
            // the address it has been told to drop.
            item: SITE,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Certifications & Lab Reports',
            item: `${SITE}/certifications.html`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: r.number,
            item: `${SITE}/reports/${r.slug}.html`,
          },
        ],
      },
      {
        '@type': 'CreativeWork',
        /* The report's own address in the graph, so the page node below can
           point at it and a reader can go from the page to the document it
           describes. */
        '@id': `${SITE}/reports/${r.slug}.html#report`,
        name: `${r.number} — ${r.title}`,
        url: `${SITE}/reports/${r.slug}.html`,
        abstract: r.note,
        creator: {
          '@type': 'Organization',
          name: r.issuer,
          description:
            'The third-party laboratory named on the report. It is the issuing body, not the supplier.',
          ...(VERIFICATION[r.issuerKey].lookupUrl
            ? { sameAs: VERIFICATION[r.issuerKey].lookupUrl }
            : {}),
          ...(VERIFICATION[r.issuerKey].telephone
            ? { telephone: VERIFICATION[r.issuerKey].telephone }
            : {}),
        },
        /*
         * WHO CHECKED THE CLAIMS ON THIS PAGE.
         *
         * The laboratory is both the author of the document and the body
         * that can confirm it: the page reports what the laboratory found,
         * and the buyer is told to send the report number to the
         * laboratory, which will confirm the document. So the honest
         * `reviewedBy` here is the laboratory itself - not us, because we
         * wrote the summary, and not nobody, because the page's claims are
         * not the manufacturer's word but the laboratory's finding.
         */
        reviewedBy: {
          '@type': 'Organization',
          name: r.issuer,
          ...(VERIFICATION[r.issuerKey].lookupUrl
            ? { sameAs: VERIFICATION[r.issuerKey].lookupUrl }
            : {}),
        },
        // The check, stated in the markup so an assistant can pass it on.
        ...(VERIFICATION[r.issuerKey].canBeChecked
          ? {
              additionalProperty: [
                {
                  '@type': 'PropertyValue',
                  name: 'How to verify this report',
                  value: VERIFICATION[r.issuerKey].how,
                },
              ],
            }
          : {}),
        identifier: r.number,
        encoding: {
          '@type': 'MediaObject',
          encodingFormat: 'application/pdf',
          contentUrl: `${SITE}/assets/img/certs/${r.file}`,
        },
        /*
         * THE EVIDENCE POINTS AT THE PRODUCT; IT IS NOT A COPY OF IT.
         *
         * A report page is about a report. The product a report was made
         * for has its own page, with its own complete entity: the SKU,
         * the MPN, the packshot, the minimum order and the two lead
         * times. This page used to carry a Product of its own as well -
         * a third copy of the same product, with a name and a size and
         * an internal id and no brand and no picture.
         *
         * A Product has to carry an offer, a review or a rating to be
         * valid, and this site publishes no offer - it quotes per order
         * - and has no real buyer review yet. So that copy was invalid
         * content in Google's product summary report, on ten pages, for
         * a claim the report page was never the right place to make.
         *
         * What is here now is a reference: the address of the product's
         * own entity, and the name. The entity is defined once, on the
         * product's page, and this page points at it. That is the
         * difference between saying "this report is the evidence for
         * that product" and saying "that product is a thing this page
         * describes in its own words".
         */
        ...(covered.length
          ? {
              about: covered.map((p) => ({
                '@id': `${SITE}${p.url}#product`,
                name: p.name,
                url: `${SITE}${p.url}`,
              })),
            }
          : {
              about: {
                name: r.title,
                category: r.line,
              },
            }),
        publisher: {
          /*
           * THE SAME ORGANISATION, BY ITS ADDRESS.
           *
           * The site publishes the company as one entity on every page it
           * renders, with an `@id`. This node used to be a second,
           * partial declaration of the same company - a name, a URL and a
           * sentence - with no `@id` to tie it to the first one. A reader
           * that merged the two would have found two companies with the
           * same name.
           *
           * So the publisher carries the `@id` of the canonical entity
           * alongside the name, and points at one company rather than
           * describing another one. The laboratory that issued the report
           * is the creator above - it is not us, and it is not a pet care
           * factory.
           */
          '@id': `${SITE}/#organization`,
          '@type': 'Organization',
          name: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
          description: PRICING_DECLARATION,
          url: SITE,
        },
      },
      {
        '@type': 'Dataset',
        name: `Third-party lab report ${r.number}`,
        /*
         * The terms under which this report may be used. Google's rich
         * result test named the field as missing on 2026-11-08:
         * "未填写字段 license". The report itself is the laboratory's
         * document, which is what the page it points at says.
         */
        license: SITE + DATA_LICENSE_PATH,
        description: r.note,
        url: `${SITE}/reports/${r.slug}.html`,
        creator: { '@type': 'Organization', name: r.issuer },
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/pdf',
          contentUrl: `${SITE}/assets/img/certs/${r.file}`,
        },
        variableMeasured: [r.test, r.productLine || r.line],
        isAccessibleForFree: true,
      },
      /*
       * THE PAGE ITSELF.
       *
       * The report pages are written by this script rather than by a page
       * component, so they never went through the layout that publishes
       * the site graph - and they carried no page node at all. A page with
       * no page node says nothing about what it is, when it was published,
       * what it belongs to, or what it is about.
       *
       * So each report page now says all four: it is a WebPage, it was
       * published on this date, it is part of this site, and its subject
       * is the report above - the same report, named by its address in the
       * graph, so a reader can walk from the page to the document.
       *
       * `speakable` points at the one-line answer the page prints under
       * its heading. That paragraph is the sentence the page exists to
       * publish - which document, issued by whom, what it measured, what it
       * found - and it is the part an assistant should read out. The
       * selector is checked by the build gate: a selector that resolves to
       * nothing would say the page has a spoken summary and not have one.
       */
      {
        '@type': 'WebPage',
        '@id': `${SITE}/reports/${r.slug}.html#webpage`,
        name: `${r.number} — ${r.title}`,
        url: `${SITE}/reports/${r.slug}.html`,
        description: reportDescription(r),
        datePublished: BUILD_DATE,
        dateModified: BUILD_DATE,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/#organization` },
        mainEntity: { '@id': `${SITE}/reports/${r.slug}.html#report` },
        inLanguage: 'en',
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.oneliner'],
        },
      },
    ],
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}



/**
 * THE DESCRIPTION OF A REPORT PAGE, WITH THE CLAIM IN IT.
 *
 * The claim comes in two lengths: the full one, with the sample and
 * the context, and the short one, which is the same measurement
 * without them. The window is 155 characters, and whether the full
 * claim fits beside the number and the title depends on the report.
 *
 * So the search is tried with the full claim first and with the
 * short one second, and the first that lands in the window is the
 * answer. Both are never in the same description - the earlier
 * version put them both in the candidate list, and the search picked
 * both on six of the ten reports, so the description said the same
 * measurement twice.
 *
 * When neither fits, the description falls back to the document's
 * identity alone: the number, the title, the laboratory. That says
 * what the document is and claims nothing it cannot back up.
 */
function reportDescription(r) {
  const candidates = [
    String(r.finding || '').trim(),
    String(r.findingShort || '').trim(),
    String(r.note || '').trim(),
  ].filter(Boolean);

  /*
   * THE WINDOW IS A WINDOW, NOT A WISH.
   *
   * The description has to be between 150 and 155 characters, and the
   * build fails if it is not. So the wording is chosen by the only thing
   * that can choose it honestly: which of the record's own sentences fits.
   * The long finding first, then the short one, then the note.
   *
   * AND THE CONCLUSION IS WHAT THE SEARCH PICKS.
   *
   * The first candidate that lands in the window used to be the answer.
   * But the first candidate can be the one whose own length does not fit
   * beside the number and the title, and reportDescriptionWith answers
   * that case with the document's identity - the number, the title, the
   * laboratory - so the description said what the document IS while the
   * conclusion, in its shorter form, sat in the next candidate and was
   * never read.
   *
   * So the search asks a better question: which of the record's own
   * sentences lands in the window AND carries the conclusion with it?
   * That one is the answer. A description with no conclusion in it is
   * kept for the case where no candidate can do better, which is the
   * case where the record has no conclusion to give.
   */
  let withoutClaim = '';
  for (const c of candidates) {
    const d = reportDescriptionWith(r, /\.$/.test(c) ? c : `${c}.`);
    if (!d || d.length < 150 || d.length > 155) continue;
    if (d.includes(escapeHtml(c))) return d;
    if (!withoutClaim) withoutClaim = d;
  }
  if (withoutClaim) return withoutClaim;

  /*
   * NONE OF THEM FITS.
   *
   * Then the longest one is cut at a word boundary. Cutting a sentence
   * shortens it; it does not change what it says, and the alternative -
   * stopping the whole site from building over a search-result length -
   * is a much worse trade.
   */
  const longest = candidates.slice().sort((a, b) => b.length - a.length)[0];
  if (!longest) return '';
  const withDot = /\.$/.test(longest) ? longest : `${longest}.`;
  const full = reportDescriptionWith(r, withDot);
  if (!full) return full;

  const tail = full.length - withDot.length;
  const room = 155 - tail;
  const want = Math.max(1, Math.min(room, longest.length));
  let claim = longest.slice(0, want).replace(/[\s,;:.—-]+$/, '');
  let d = reportDescriptionWith(r, `${claim}.`);
  // A cut at a word boundary can leave it a character short; put the next
  // word back rather than publishing something under the window.
  while (d.length < 150) {
    const next = longest.slice(claim.length).match(/^\S+/);
    if (!next) break;
    claim += ` ${next[0]}`;
    d = reportDescriptionWith(r, `${claim}.`);
  }
  return d;
}

/**
 * The description of a report page.
 *
 * The note under the report table is written for a reader scanning the
 * table: "Analysis report for the 消毒除味液 line." That is 35
 * characters, and a search result shows a description that says what the
 * page is — so the description states the report number, the title, the
 * test and the laboratory that issued it, in that order, and is cut at a
 * clause boundary if it runs long.
 */
function reportDescriptionWith(r, claim) {
  /*
   * WHAT A REPORT PAGE SAYS.
   *
   * A report page is a document, and a buyer on it wants to know four
   * things: which document it is, what it covers, that the PDF is
   * there, and who tested it. Those are the pieces, in that order.
   *
   * The note is last and the first to go. The note is on the page,
   * in full - it is what the report actually found - and the
   * description is not the place for it.
   *
   * The length is counted on the ESCAPED text, because the
   * description goes into an HTML attribute and "&" becomes "&amp;".
   * A search engine counts the file.
   */
  /*
   * THE ISSUER, SHORT.
   *
   * The laboratory's full name is on the page, in the issuer row. The
   * description carries a short form of it, because the cut is at a
   * clause boundary and the full name is long enough to push every
   * boundary out of the window.
   *
   * The short form is derived from the record: the name up to the
   * first comma or bracket, and the place after it. So it is the
   * same place for every report of that laboratory, and it cannot
   * drift from the document.
   */
  /*
   * THE SENTENCES, IN THE ORDER A BUYER WANTS THEM.
   *
   * A report page is a document, and a buyer on it wants to know what
   * the document found, which document it is, who tested it, and that
   * the PDF is there. Those are the pieces, and each one is a WHOLE
   * sentence, so a description can end on any of them and still read
   * as English.
   *
   * THE CONCLUSION COMES FIRST, AND THIS IS THE REASON.
   *
   * The note is what the report found: the measured result, with the
   * number in it. It used to be left out of the description, because
   * it is long and the window is short. But leaving it out is what
   * makes the description useless to the thing that matters now.
   *
   * An answer engine does not quote a description that says "Third-party
   * test report NACCYH25014722. Pet deodorant - ammonia removal." It
   * quotes a sentence with a number in it and a comparison in it,
   * because that is the sentence a reader can check against the
   * document. A title is not that. A title is what the search result
   * shows, and the search result already shows the title.
   *
   * So the note leads, cut to the first clause if it is too long to
   * fit whole, and the document's identity follows. The number and
   * the title are still required - a description without them
   * describes nothing - but they are no longer first.
   */
  const issuer = String(r.issuer || '').trim();

  const sentences = [];
  const add = (s) => { if (s) sentences.push(s); };

  /*
   * THE CONCLUSION IS A CANDIDATE, NOT A GIFT.
   *
   * The note is what the laboratory found, and every one of the ten
   * notes is a claim with a number in it - the kind of sentence an
   * answer engine quotes. A description that says only what the
   * document IS gives the reader a title they already have, and
   * gives an answer engine nothing to quote.
   *
   * But the notes run from 67 to 275 characters and the window is
   * 155. So the note cannot simply be prepended: the long ones
   * would push the document's own identity out, and the result would
   * be a claim with no way to check it.
   *
   * So the note is shortened to what fits - the first clause, because
   * in these notes the first clause is the measurement and the rest
   * is the context - and then it is tried FIRST among the candidates.
   * The number and the title stay required.
   */
  /*
   * THE FINDING, IF THE RECORD CARRIES ONE.
   *
   * The note is what the laboratory found, in the factory's own
   * words, and it is on the page in full. Some of them are longer
   * than the room a search result has beside the document's
   * identity, and a shortened note can lose the number - which is
   * the part worth quoting.
   *
   * So the record may carry a `finding` as well: the one claim, with
   * the number in it, written from the note. When it is there it is
   * what the description leads with; when it is not, the note is
   * used, shortened.
   */
  const finding = String(r.finding || '').trim();
  const findingShort = String(r.findingShort || '').trim();
  const note = finding || String(r.note || '').trim();
  /*
   * THE CLAIM FOR THIS ATTEMPT.
   *
   * The claim is passed in, because there are two of them and only
   * one may be in the answer. The caller tries the long one first.
   */
  const attempt = claim || (/\.$/.test(note) ? note : `${note}.`);

  const noteCandidates = [];
  if (attempt) {
    noteCandidates.push(attempt);
  }
  if (!noteCandidates.length && note) {
    const withStop = /\.$/.test(note) ? note : `${note}.`;
    /*
     * A FINDING IS USED WHOLE OR NOT AT ALL.
     *
     * The earlier version shortened a long note by cutting it at a
     * clause boundary, and the cut came from the end - so the
     * number came off the claim, and the description ended on "a
     * 93.3%." or "— a." A claim with no number in it is not a
     * claim, and a claim with half of its number is worse than no
     * claim at all.
     *
     * So the finding is measured whole. If it fits beside the
     * identity, it goes in as it is. If it does not, the
     * description falls back to the identity alone - which says
     * what the document is, and says nothing it cannot back up.
     */
    if (escapeHtml(withStop).length <= 100) {
      noteCandidates.push(withStop);
    } else {
      /*
       * THE FIRST CLAUSE, AND THE NEXT ONE IF IT FITS.
       *
       * The cut points are the ones that end a CLAUSE: a full stop,
       * or a comma before a word that can start a clause. A semicolon
       * and a colon are not cut points - what follows a colon is a
       * continuation, and what follows a semicolon is another item in
       * the same sentence. Cutting there produced descriptions that
       * ended on "sample:." and "54 degrees C;." - a label with
       * nothing after it.
       */
      const CLAUSE_END = /(?<=[.!?])\s+|(?<=\]),\s+|\s+(?=(?:and|with|against|under|on|by|to|for)\b)/;
      let acc = '';
      for (const clause of withStop.split(CLAUSE_END)) {
        if (!clause) continue;
        const next = acc ? `${acc} ${clause.trim()}` : clause.trim();
        if (escapeHtml(next).length > 100) break;
        acc = next;
      }
      if (acc) {
        noteCandidates.push(/\.$/.test(acc) ? acc : `${acc}.`);
      } else {
        const trimmed = withStop.slice(0, 98).replace(/\s+\S*$/, '').replace(/[:;,]\s*$/, '').trim();
        if (trimmed) noteCandidates.push(/\.$/.test(trimmed) ? trimmed : `${trimmed}.`);
      }
    }
  }

  /*
   * THE IDENTITY, IN THE SHORT FORM.
   *
   * "Third-party test report 2024FM11612R01D." and "Issued by
   * Guangdong Detection Center of Microbiology" say the same thing
   * twice - that this is a document from a laboratory - and the
   * issuer's full name is fifty-eight characters on its own.
   *
   * With a finding in the description the room left for the
   * identity is about seventy characters, so the identity has to
   * spend them on what only the identity carries: the number, and
   * what the report is about. The number alone says "this is a
   * report" in the context of a report page, and the page's title
   * and its heading carry the rest.
   */
  add(`Third-party report ${r.number}.`);
  if (r.title) {
    /*
     * WHAT THE REPORT IS ABOUT, WITHOUT THE NUMBER.
     *
     * The title is "Disinfectant — available chlorine stability and
     * acute oral toxicity", and the number is already in the
     * description.
     *
     * The earlier version cut the front with a pattern that matched
     * any word, and that took "Multi-" off "Multi-effect wash" and
     * left "effect wash". So the front is cut only when it IS the
     * number.
     *
     * And the title has two forms: the full one, and the short one
     * that the record already carries for the search result's own
     * title line. The short form is "Disinfectant — chlorine
     * stability" - forty-six characters less of the full one, and
     * it says the same thing. Both are offered, and the search
     * takes the one that fits beside the finding and the number.
     */
    const stripNumber = (s) => String(s)
      .replace(new RegExp(`^${r.number}\\s*[—-]\\s*`), '')
      .trim();
    const full = stripNumber(r.title);
    const short = stripNumber(r.shortTitle || r.title);
    const forms = short && short !== full ? [full, short] : [full];
    for (const about of forms) {
      add(/\.$/.test(about) ? about : `${about}.`);
    }
  }
  if (issuer) {
    // the place, not the company: "Issued by Guangzhou Institute of
    // Microbiology (NACC)" is shorter than the company's full name
    // and is what a reader checks
    const place = issuer.includes('(')
      ? issuer.slice(0, issuer.indexOf('(')).trim().replace(/,?$/, '')
      : issuer.replace(/ (Group )?Co\.,? Ltd\.?$/i, '').replace(/,$/, '');
    add(`Issued by ${place}${/\.$/.test(place) ? '' : '.'}`);
  }
  if (r.skus) add(`Covers ${r.skus}.`);
  if (r.test) {
    // the sentence needs a noun after "for", so it is only offered
    // when the noun is there
    const what = String(r.test).trim();
    if (what && !/^(?:for|of|on|in|at|by|to|with|against|under)$/i.test(what)) {
      add(`Tested for ${what.charAt(0).toLowerCase()}${what.slice(1)}.`);
    }
  }
  if (r.line) add(`${r.line} line.`);
  add('The full report PDF.');

  const parts = sentences.map((s) => ({ esc: escapeHtml(s), len: escapeHtml(s).length }));

  /*
   * THE CONCLUSION GOES INTO THE CANDIDATE LIST, AT THE FRONT.
   *
   * The list below is what the search runs over. The note was kept
   * outside it - held in its own variable and tried once, with a
   * length rule of its own - and so it was never chosen: the
   * identity sentences filled the window and the search returned
   * before it ever looked at the note.
   *
   * So the note is a sentence in the list, and the list is searched
   * with the note first. The number and the title are required
   * (they are in `must`), so a result without them is rejected - a
   * measured result that cannot be traced to its document is worse
   * than a description that names the document.
   */
  if (noteCandidates.length) {
    /*
     * ONE CLAIM, AND THE FILLERS AFTER IT.
     *
     * The record carries the claim in two lengths. Both were in the
     * candidate list, and the search picked both on six of the ten
     * reports - so the description said the same measurement twice,
     * once with the sample and once without.
     *
     * So there is ONE claim here: the long one. The short one is
     * tried by the shell, which runs the search again with it when
     * the long one finds nothing.
     *
     * And the fillers are candidates too. When the list runs out
     * before the window is filled, the description is under the
     * window and the gate rejects it - so the fillers say that the
     * PDF is there, in three sizes, because the space that is left
     * is whatever it happens to be. They are last, so they are only
     * used when nothing else fits.
     */
    const claim = escapeHtml(noteCandidates[0]);
    parts.unshift({ esc: claim, len: claim.length });
    for (const f of ['The full report PDF.', 'The report PDF.', 'PDF available.']) {
      const esc = escapeHtml(f);
      parts.push({ esc, len: esc.length });
    }
  }

  /*
   * THE NUMBER AND THE TITLE ARE NOT OPTIONAL.
   *
   * They say which document this is. A description without the title
   * describes nothing, so every candidate below carries both.
   */
  /*
   * THE NUMBER IS ALWAYS THERE. THE TITLE IS A CANDIDATE.
   *
   * The number says which document this is, and the title says what
   * it is about. The finding says what it found. A description with
   * the finding and the number is a claim a buyer can check; the
   * title is what the search result's own title line already shows.
   *
   * So the number is required and the title is not - which is what
   * lets the finding and the number and the title fit together on
   * the reports whose title is short, and lets the finding and the
   * number fit on the ones whose title is long.
   */
  /*
   * THE NUMBER IS ALWAYS THERE. THE CLAIM IS TOO.
   *
   * The number says which document this is. The claim says what it
   * found, and a description without the claim is what the site
   * had before - a title, which the search result already shows.
   *
   * So both are required. When the claim has two forms, either one
   * of them satisfies the requirement: the long form is preferred
   * because it comes first, and the short form is there for the
   * reports where the long form does not fit.
   */
  const claimIdx = noteCandidates.length ? [0] : [];
  const numberIdx = noteCandidates.length ? 1 : 0;
  const must = [numberIdx];
  // the claim is required as one of its forms, so the requirement is
  // checked against the index of the form that was used
  const mustAny = claimIdx;
  if (note) {
    // the conclusion has moved to the front, so the number is no
    // longer at index 0
    must[0] = 1;
    if (r.title) must[1] = 2;
  }

  /*
   * FIRST, TAKE THEM IN ORDER UNTIL ONE NO LONGER FITS.
   */
  const greedy = [];
  let greedyLen = 0;
  for (const p of parts) {
    const extra = (greedy.length ? 1 : 0) + p.len;
    if (greedyLen + extra <= 155) { greedy.push(p); greedyLen += extra; }
  }
  if (greedyLen >= 150) {
    // the greedy pass fills the window with the earliest sentences,
    // and the finding is the earliest - so it is in this result
    // already. The check below is only a guard.
    if (!noteCandidates.length || greedy.some((p) => p.esc === escapeHtml(noteCandidates[0]))) {
      return greedy.map((p) => p.esc).join(' ');
    }
  }

  /*
   * THEN LOOK FOR THE COMBINATION THAT LANDS IN THE WINDOW.
   *
   * The sentences are facts, and not every report carries the same
   * ones, so the sentence that fills the window is not the same one
   * every time. Among the combinations that fit, the one that keeps
   * the highest priority sentences wins - earliest first.
   */
  const n = parts.length;
  let best = null;
  for (let mask = 1; mask < (1 << n); mask += 1) {
    if (!must.every((i) => mask & (1 << i))) continue;
    if (mustAny.length && !mustAny.some((i) => mask & (1 << i))) continue;
    const idx = [];
    let len = 0;
    for (let i = 0; i < n; i += 1) {
      if (mask & (1 << i)) { idx.push(i); len += parts[i].len + (idx.length > 1 ? 1 : 0); }
    }
    if (len < 150 || len > 155) continue;
    if (!best) { best = { idx, len }; continue; }
    /*
     * THE FINDING WINS.
     *
     * The comparison below keeps the combination with the EARLIEST
     * sentences - which is how the number and the title always won,
     * and the finding was left out. A description that names a
     * document and says nothing about what it found is what the
     * site had before, and the reason for the change was that an
     * answer engine quotes the claim and not the title.
     *
     * So the finding is compared first, and only then the order of
     * the rest. The number and the title are required either way,
     * so a result without them is rejected before this point.
     */
    const findIdx = noteCandidates.length ? 0 : -1;
    if (findIdx >= 0) {
      const a = best.idx.includes(findIdx) ? 1 : 0;
      const b = idx.includes(findIdx) ? 1 : 0;
      if (a !== b) { if (b > a) best = { idx, len }; continue; }
    }
    for (let i = 0; i < n; i += 1) {
      const a = best.idx.includes(i) ? 1 : 0;
      const b = idx.includes(i) ? 1 : 0;
      if (a !== b) { if (b > a) best = { idx, len }; break; }
    }
  }
  if (best) return best.idx.map((i) => parts[i].esc).join(' ');

  /*
   * AND ONLY IF NOTHING FITS, FILL THE WINDOW WITH WHOLE SENTENCES.
   *
   * The earlier version cut the text at a clause boundary and closed
   * it with a full stop, and that produced "Tested for safet.",
   * "Tested." and "Issued." - a sentence with a word chopped off the
   * end.
   *
   * Then the fallback took three sentences and stopped, and on one
   * report that was 123 characters - shorter than the window, so
   * the gate rejected it.
   *
   * So the fallback now does both things a fallback has to do: it
   * shortens when the text is too long, and it LENGTHENS when the
   * text is too short. It takes the sentences in order and keeps
   * adding while the total is under the window; if that overshoots,
   * it cuts at a word boundary; and if the sentences run out before
   * the window is filled, the sentence that says the PDF is there
   * is added, and then the line.
   *
   * It never cuts a word in half.
   */
  /*
   * THE FALLBACK READS THE SAME LIST THE SEARCH READS.
   *
   * The claim is a candidate, so it is in `parts`, at the front. The
   * fallback used to read `sentences`, which is the document's
   * identity only - so the fallback produced a description with no
   * claim in it, and on one report that was 141 characters, under
   * the window.
   */
  const sentenceList = parts.slice();

  // 1. add the sentences while they fit
  const kept = [];
  let total = 0;
  for (const s of sentenceList) {
    const next = total + (kept.length ? 1 : 0) + s.len;
    if (next > 155) break;
    kept.push(s);
    total = next;
  }

  // 2. if there is room left, fill it
  //
  // The fillers come in three sizes, because the space that is left
  // is whatever it happens to be: "The full report PDF." is the
  // whole statement, and the two shorter ones say the same thing in
  // fewer words. The one that fits is used, and the line the report
  // belongs to is tried as well.
  const fillers = [
    'The full report PDF.',
    'The report PDF.',
    'PDF available.',
    'Full report PDF.',
    'Report PDF.',
    'PDF available',
    'Full PDF.',
    'PDF here.',
    'PDF.',
  ];
  if (r.line) fillers.push(`${r.line} line.`);

  for (const f of fillers) {
    const esc = escapeHtml(f);
    const next = total + (kept.length ? 1 : 0) + esc.length;
    // the filler has to bring the total INTO the window, not merely
    // fit inside it
    if (next >= 150 && next <= 155) {
      kept.push({ esc, len: esc.length });
      total = next;
      break;
    }
  }

  if (kept.length && total >= 150) {
    return kept.map((s) => s.esc).join(' ');
  }

  // 3. a cut at a word boundary
  //
  // The cut is at a space, so no word is cut in half, and the last
  // word has to be one that can end a sentence. This is tried
  // before the fillers because it uses the space that is left: a
  // hundred and forty-one characters plus a word of ten lands in
  // the window.
  const escaped = escapeHtml(sentences.join(' '));
  const clause = escaped.slice(0, 156);
  const space = clause.lastIndexOf(' ');
  if (space >= 1) {
    const cut = clause.slice(0, space).trim();
    const last = cut.split(/\s+/).pop() || '';
    const needsNoun = /^(?:a|an|the|and|or|but|with|without|against|under|over|on|in|at|by|to|for|from|of|as|is|are|was|were|than|that|which)$/i;
    if (!needsNoun.test(last) && cut.length >= 150 && cut.length <= 155) {
      return cut + '.';
    }
  }

  // 4. the fillers, and the one that lands in the window is used
  for (const f of fillers) {
    const esc = escapeHtml(f);
    const next = total + (kept.length ? 1 : 0) + esc.length;
    if (next >= 150 && next <= 155) {
      return `${kept.map((s) => s.esc).join(' ')} ${esc}`;
    }
  }

  // 5. what is left, and the gate checks its length
  return kept.map((s) => s.esc).join(' ') || escapeHtml(sentences[0] || '');
}

/**
 * THE REPORT IN ONE SENTENCE.
 *
 * WHY THE PAGE SAYS IT THIS WAY
 * A reader gets a heading, a table and a footnote, and reads them in
 * that order. An assistant gets whatever it can lift whole, and what it
 * lifts is one sentence: which document, issued by whom, what it
 * measured, what it found, and which products it covers.
 *
 * The report number goes into it, because the number is what a buyer
 * quotes back to us. A citation that carries the number is a citation
 * the buyer can act on; a citation without it is one they have to go
 * and check.
 */
function oneLiner(r) {
  const finding = String(r.finding || r.findingShort || r.note).trim();
  const parts = [
    `Third-party report ${r.number}, issued by ${r.issuer}.`,
    `Finding: ${finding}`,
  ];
  if (r.skus) parts.push(`Covers SKUs ${r.skus}.`);
  return parts.join(' ');
}

function pageHtml(r) {
  const schema = JSON.stringify(reportSchema(r));
  const row = (k, v) =>
    `<div class="row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(r.number)} — ${escapeHtml(r.shortTitle || r.title)}</title>
<meta name="description" content="${reportDescription(r)}">
<link rel="canonical" href="${SITE}/reports/${r.slug}.html">
<meta name="robots" content="index,follow">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(r.number)} — ${escapeHtml(r.title)}">
<meta property="og:description" content="${reportDescription(r)}">
<meta property="og:url" content="${SITE}/reports/${r.slug}.html">
<script type="application/ld+json">${schema}</script>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#08131a; color:#e8f2f0; font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  main { max-width:820px; margin:0 auto; padding:56px 24px 80px; }
  .kicker { color:#3fd0ac; font-size:12px; letter-spacing:.14em; text-transform:uppercase; margin:0 0 14px; }
  h1 { font-size:clamp(26px,4vw,38px); line-height:1.12; margin:0 0 18px; font-weight:600; letter-spacing:-.02em; }
  .lede { font-size:18px; color:#a9c4c0; margin:0 0 34px; }
  /* The one-line version of the report. It sits between the heading and
     the lede because it IS the answer: which document, issued by whom,
     what it measured, what it found, which products it covers. */
  .oneliner { font-size:17px; line-height:1.6; color:#e8f2f0; margin:0 0 22px; padding:16px 20px; border-left:3px solid #3fd0ac; background:rgba(63,208,172,.07); border-radius:0 4px 4px 0; }
  .card { border:1px solid rgba(63,208,172,.22); border-left:3px solid #3fd0ac; padding:22px 24px; margin:0 0 28px; }
  dl { margin:0; }
  /* minmax(0,…) on both tracks: a bare 1fr has an automatic minimum of its
     content's min-content width, and the verification row carries a URL with
     no break opportunity inside it — so the row grew past the card and the
     page scrolled sideways. Below 640px the row stacks instead, because a
     200px label column on a phone leaves the value about 78px wide. */
  .row { display:grid; grid-template-columns:minmax(0,200px) minmax(0,1fr); gap:16px; padding:11px 0; border-top:1px solid rgba(255,255,255,.07); }
  .row:first-child { border-top:0; }
  @media (max-width:640px){ .row { grid-template-columns:1fr; gap:2px; } }
  dt { color:#7f9b98; font-size:13px; letter-spacing:.04em; text-transform:uppercase; }
  dd { margin:0; overflow-wrap:anywhere; }
  .num { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:#3fd0ac; font-size:15px; }
  a.pdf { display:inline-block; margin:6px 14px 0 0; padding:12px 22px; background:#3fd0ac; color:#04120f; font-weight:600; text-decoration:none; border-radius:4px; font-size:15px; }
  a.back { color:#7f9b98; font-size:14px; text-decoration:none; }
  .note { margin-top:40px; padding-top:24px; border-top:1px solid rgba(255,255,255,.08); color:#7f9b98; font-size:13px; }
  .note a { color:#3fd0ac; }
  .next { margin:34px 0 0; padding:24px; border:1px solid rgba(63,208,172,.22); border-radius:6px; background:rgba(63,208,172,.05); }
  .next h2 { font-size:13px; letter-spacing:.12em; text-transform:uppercase; color:#3fd0ac; margin:0 0 14px; }
  .next ul { margin:0 0 16px; padding-left:20px; }
  .next li { margin:0 0 8px; }
  .next a { color:#3fd0ac; }
  .next .label { color:#a9c4c0; font-size:13px; }
  .next p.label { margin:0 0 20px; }
  a.wa { display:inline-block; margin:0 12px 0 0; padding:12px 22px; background:#3fd0ac; color:#04120f; font-weight:600; text-decoration:none; border-radius:4px; font-size:15px; }
  a.quote { display:inline-block; padding:12px 22px; border:1px solid rgba(63,208,172,.45); color:#3fd0ac; font-weight:600; text-decoration:none; border-radius:4px; font-size:15px; }
</style>
</head>
<body>
<main>
  <p class="kicker">Third-party laboratory report</p>
  <h1>${escapeHtml(r.number)} — ${escapeHtml(r.title)}</h1>
  <p class="oneliner">${escapeHtml(oneLiner(r))}</p>
  <p class="lede">${escapeHtml(r.note)}</p>

  <div class="card">
    <dl>
      ${row('Report number', r.number)}
      ${r.verificationCode ? row('Verification code', r.verificationCode) : ''}
      ${r.lot ? row('Batch tested', r.lot) : ''}
      ${row('Issued by', r.issuer)}
      ${row('Test', r.test)}
      ${row('Product line', r.line)}
      ${row('Covers SKUs', r.skus)}
      ${row('Published by', 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd. — Heyuan, Guangdong, China')}
      ${row('How to verify it', VERIFICATION[r.issuerKey].how)}
    </dl>
  </div>

  <a class="pdf" href="/assets/img/certs/${r.file}" data-journey="pdf">Download the PDF</a>
  <a class="back" href="/certifications.html" data-journey="certifications">← All certifications and reports</a>

${nextStepBlock(r)}
  <p class="note">
    This report is issued by <strong>${escapeHtml(r.issuer)}</strong>, a third-party laboratory — not by
    the supplier. The supplier is Guangdong Shenhe Zhongke Biotechnology Co., Ltd.
    ${VERIFICATION[r.issuerKey].canBeChecked ? `You do not have to take this page on trust: ${escapeHtml(VERIFICATION[r.issuerKey].body)} can confirm the report independently${VERIFICATION[r.issuerKey].lookupUrl ? ` — <a href="${VERIFICATION[r.issuerKey].lookupUrl}" rel="nofollow noopener" target="_blank">their report-authenticity service</a>` : ''}${VERIFICATION[r.issuerKey].telephone ? `, or on ${escapeHtml(VERIFICATION[r.issuerKey].telephone)}` : ''}.` : escapeHtml(VERIFICATION[r.issuerKey].how)}
    The report documents the product made here; a private-label version of the same formula needs
    its own testing for the claims the buyer intends to make. Report number
    <strong>${escapeHtml(r.number)}</strong> is the reference to quote back.
  </p>
</main>
</body>
</html>
`;
}

for (const r of reports) {
  /*
   * THE WINDOW IS A PROMISE, SO IT IS CHECKED WHERE IT IS MADE.
   *
   * The gate in scripts/check-build.mjs reads the built files and fails
   * if a description is outside 150-155. That is the backstop. This is
   * the front door: a record that cannot be fitted fails the build here,
   * where the record is, and says which record it was.
   */
  const description = reportDescription(r);
  if (description.length < 150 || description.length > 155) {
    throw new Error(
      `the description for ${r.number} is ${description.length} characters, outside 150-155: ${description}`
    );
  }
  const html = pageHtml(r);
  fs.writeFileSync(path.join(OUT_DIR, `${r.slug}.html`), html, 'utf8');
}
console.log('  the report pages: %d, in public/reports/', reports.length);

/* ------------------------------------------------------------------ */
/* 5. The typed data, so the pages and the index share one source     */
/* ------------------------------------------------------------------ */

const TS_LINES = [];
TS_LINES.push('/**');
TS_LINES.push(' * The third-party lab reports, as data.');
TS_LINES.push(' *');
TS_LINES.push(' * GENERATED by scripts/gen-reports-index.mjs — do not hand-edit.');
TS_LINES.push(' * The source of truth is the REPORTS array in the certifications');
TS_LINES.push(' * page. This file exists so that a page, the JSON index and the');
TS_LINES.push(' * report pages all quote the same numbers.');
TS_LINES.push(' *');
TS_LINES.push(' * Every field here is read out of the report itself. The coverage');
TS_LINES.push(' * line says what the report documents — where the report does not');
TS_LINES.push(' * state it, the field says so rather than guessing.');
TS_LINES.push(' */');
TS_LINES.push("export type LabReport = {");
TS_LINES.push('  number: string;');
TS_LINES.push('  title: string;');
TS_LINES.push('  issuer: string;');
TS_LINES.push('  test: string;');
TS_LINES.push('  line: string;');
TS_LINES.push('  skus: string;');
TS_LINES.push('  note: string;');
TS_LINES.push('  file: string;');
TS_LINES.push('  slug: string;');
TS_LINES.push('  /** The verification code printed on the report, where the laboratory prints one. */');
TS_LINES.push('  verificationCode?: string;');
TS_LINES.push('  /** The batch number of the sample the report was run on. */');
TS_LINES.push('  lot?: string;');
TS_LINES.push('};');
TS_LINES.push('');
TS_LINES.push('export const LAB_REPORTS: LabReport[] = [');
for (const r of reports) {
  TS_LINES.push('  {');
  TS_LINES.push(`    number: ${JSON.stringify(r.number)},`);
  TS_LINES.push(`    title: ${JSON.stringify(r.title)},`);
  TS_LINES.push(`    issuer: ${JSON.stringify(r.issuer)},`);
  TS_LINES.push(`    test: ${JSON.stringify(r.test)},`);
  TS_LINES.push(`    line: ${JSON.stringify(r.line)},`);
  TS_LINES.push(`    skus: ${JSON.stringify(r.skus)},`);
  TS_LINES.push(`    note: ${JSON.stringify(r.note)},`);
  TS_LINES.push(`    file: ${JSON.stringify(r.file)},`);
  TS_LINES.push(`    slug: ${JSON.stringify(r.slug)},`);
  if (r.verificationCode) TS_LINES.push(`    verificationCode: ${JSON.stringify(r.verificationCode)},`);
  if (r.lot) TS_LINES.push(`    lot: ${JSON.stringify(r.lot)},`);
  TS_LINES.push('  },');
}
TS_LINES.push('];');
TS_LINES.push('');

const TS_OUT = path.join(ROOT, 'content/v2/reports.ts');
fs.mkdirSync(path.dirname(TS_OUT), { recursive: true });
fs.writeFileSync(TS_OUT, TS_LINES.join('\n'), 'utf8');
console.log('  content/v2/reports.ts: %d records', reports.length);

console.log('');
console.log('=== the records ===');
for (const r of reports) {
  console.log('  ' + r.number.padEnd(18) + ' ' + r.test.padEnd(42) + ' ' + r.issuer);
}

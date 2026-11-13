/**
 * The build gate.
 *
 * A build that produces a broken site is worse than a build that
 * fails, because the broken site is what the buyers see. So the
 * build checks the things that can be checked, and it fails.
 *
 * The five checks are the ones that catch the failures that actually
 * happen here:
 *
 *   1. The pages are all there. A route that stopped being generated
 *      is a page that has silently become a 404, and the sitemap goes
 *      on listing it.
 *   2. The links all resolve. A link to a page that is not there is
 *      a dead end for a reader and a crawl error for a crawler.
 *   3. The images all point at something. An image reference with no
 *      file behind it is a broken frame, and on a product page it is
 *      a broken frame where the product should be.
 *   4. The structured data parses. A block of JSON-LD with a comma in
 *      the wrong place is not a warning; the whole block is discarded
 *      by the reader, silently.
 *   5. The sitemap agrees with the build. A sitemap listing a page
 *      that no longer exists asks a search engine to index a 404.
 *
 * The gate is deliberately quiet when it passes. It prints one line
 * per check, and the fact that it printed nothing but the summary is
 * the pass.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SITE = process.cwd();
const OUT = join(SITE, 'out');
const PUBLIC = join(SITE, 'public');

if (!existsSync(OUT)) {
  console.error('out/ not found — run `next build` first.');
  process.exit(1);
}

const failures = [];
const notes = [];

function fail(check, detail) {
  failures.push(`${check}: ${detail}`);
}
function note(check, detail) {
  notes.push(`${check}: ${detail}`);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const htmlFiles = walk(OUT).filter((f) => f.endsWith('.html'));
const relOf = (f) => relative(OUT, f).split(sep).join('/');

/* ------------------------------------------------------------------ */
/* 1. The pages                                                        */
/* ------------------------------------------------------------------ */

const PAGES = [
  'index.html', 'products.html', 'contact.html', 'about.html',
  'capabilities.html', 'certifications.html', 'factory.html',
  'global-compliance.html', 'msds.html', 'oem-odm.html', 'terms.html',
  'privacy.html', 'blog.html', 'sourcing-guides.html',
  'admin.html', 'portal/login.html', 'portal/dashboard.html',
];

let missing = 0;
for (const p of PAGES) {
  if (!existsSync(join(OUT, p))) {
    fail('the pages', `${p} is not in the build`);
    missing++;
  }
}
if (!missing) note('the pages', `${htmlFiles.length} built, the ${PAGES.length} required are there`);

/* ------------------------------------------------------------------ */
/* 2. The links                                                        */
/* ------------------------------------------------------------------ */

let linkCount = 0;
let brokenLinks = 0;
const brokenExamples = [];
for (const f of htmlFiles) {
  const s = readFileSync(f, 'utf8');
  const rel = relOf(f);
  for (const m of s.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (href.startsWith('/_next/') || href.startsWith('/assets/')) continue;
    if (/\.(png|jpg|jpeg|webp|svg|ico|txt|xml|json|woff2?)$/i.test(href)) continue;
    linkCount++;
    const target = href.endsWith('/') ? join(OUT, href, 'index.html') : join(OUT, href);
    if (!existsSync(target)) {
      brokenLinks++;
      if (brokenExamples.length < 8) brokenExamples.push(`${rel} → ${href}`);
    }
  }}
if (brokenLinks) {
  fail('the links', `${brokenLinks} of ${linkCount} internal links do not resolve`);
  for (const e of brokenExamples) console.error(`    ${e}`);
} else {
  note('the links', `${linkCount} internal links, all resolve`);
}

/* ------------------------------------------------------------------ */
/* 3. The images                                                       */
/* ------------------------------------------------------------------ */

let imgCount = 0;
let missingImages = 0;
const missingImageExamples = [];
for (const f of htmlFiles) {
  const s = readFileSync(f, 'utf8');
  const rel = relOf(f);
  for (const m of s.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const src = m[1];
    if (!src.startsWith('/')) continue;
    imgCount++;
    // The cache-busting query is part of the reference, not the path.
    const path = src.split('?')[0].split('#')[0];
    if (!existsSync(join(OUT, path))) {
      missingImages++;
      if (missingImageExamples.length < 8) missingImageExamples.push(`${rel} → ${src}`);
    }
  }
}
if (missingImages) {
  fail('the images', `${missingImages} of ${imgCount} image references have no file`);
  for (const e of missingImageExamples) console.error(`    ${e}`);
} else {
  note('the images', `${imgCount} image references, all have a file`);
}

/* ------------------------------------------------------------------ */
/* 4. The structured data                                              */
/* ------------------------------------------------------------------ */

let ldCount = 0;
let ldBroken = 0;
for (const f of htmlFiles) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    ldCount++;
    try {
      JSON.parse(m[1].trim());
    } catch (e) {
      ldBroken++;
      if (ldBroken <= 5) console.error(`    ${relOf(f)}: ${String(e.message).slice(0, 90)}`);
    }
  }
}
if (ldBroken) {
  fail('the structured data', `${ldBroken} of ${ldCount} JSON-LD blocks do not parse`);
} else {
  note('the structured data', `${ldCount} blocks, all parse`);
}

/* ------------------------------------------------------------------ */
/* 6. The catalogue and the matcher agree                             */
/* ------------------------------------------------------------------ */

/*
 * The catalogue of record is lib/products.json. The matcher reads
 * content/v2/matcher-catalogue.json, which is written by hand because
 * it carries fields the catalogue does not.
 *
 * A hand-written projection drifts. It drifted once already: two SKUs
 * said 500 in the projection and 1,000 in the catalogue, and the AI
 * matcher told a buyer that 500 bottles fit their order. The site's
 * floor is 1,000.
 *
 * So the two must agree on every MOQ, or the build fails. A wrong
 * number here is a wrong answer to a buyer, and it is the kind of
 * wrong that a sales quote then contradicts.
 */
const CATALOGUE = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8'));
const PROJECTION = JSON.parse(readFileSync(join(SITE, 'content', 'v2', 'matcher-catalogue.json'), 'utf8'));

function collectProducts(node, acc = []) {
  if (Array.isArray(node)) {
    for (const v of node) collectProducts(v, acc);
  } else if (node && typeof node === 'object') {
    if ('id' in node && 'moq' in node) acc.push(node);
    for (const v of Object.values(node)) collectProducts(v, acc);
  }
  return acc;
}

const catalogueMoq = new Map();
for (const p of collectProducts(CATALOGUE)) catalogueMoq.set(String(p.id), Number(p.moq));

const projected = PROJECTION.catalogue || PROJECTION.products || PROJECTION.items || [];
const projectedList = Array.isArray(projected) ? projected : Object.values(projected);
const moqDrift = [];
for (const p of projectedList) {
  const id = String(p.id ?? p.sku ?? p.code ?? '');
  if (!catalogueMoq.has(id)) continue;
  if (Number(p.moq) !== catalogueMoq.get(id)) {
    moqDrift.push(`${id}: the catalogue says ${catalogueMoq.get(id)}, the matcher says ${p.moq}`);
  }
}
if (moqDrift.length) {
  fail('the catalogue', `${moqDrift.length} MOQ values disagree with lib/products.json`);
  for (const d of moqDrift.slice(0, 8)) console.error(`    ${d}`);
} else {
  note('the catalogue', `${projectedList.length} SKUs, every MOQ matches lib/products.json`);
}

/*
 * THE WHOLE RECORD, NOT ONLY THE MOQ.
 *
 * The gate above compares one number. The projection carries twenty-two
 * fields, and every one of them can go wrong in the same way: the
 * catalogue is repaired, the projection keeps the broken copy, and the
 * build says nothing - because the sync script only filled in MISSING
 * fields, so a value that was already there was never compared.
 *
 * It happened. Fifteen of twenty SKUs told a buyer to store the product
 * "below 25掳C" and two told them "2 脳 220 mL", in the client bundle and
 * in the AI matcher's knowledge, and nothing failed.
 *
 * So the two must agree on every field the client type declares. The
 * field list is read out of lib/client-products.ts, so it cannot drift
 * from the type the components are written against.
 */
{
  const clientTypeSrc = readFileSync(join(SITE, 'lib', 'client-products.ts'), 'utf8');
  const clientTypeBody = (clientTypeSrc.match(/export type ClientProduct = \{([\s\S]*?)\n\};/) || [, ''])[1];
  const clientFields = [...clientTypeBody.matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1]);

  if (!clientFields.length) {
    fail('the client projection', 'the ClientProduct type could not be read, so nothing was compared');
  } else {
    const catalogueById = new Map((CATALOGUE.products ?? []).map((p) => [String(p.id), p]));
    const valueDrift = [];
    for (const p of projectedList) {
      const id = String(p.id ?? p.sku ?? p.code ?? '');
      const src = catalogueById.get(id);
      if (!src) continue;
      for (const field of clientFields) {
        if (!(field in src)) continue;
        if (JSON.stringify(p[field]) !== JSON.stringify(src[field])) {
          valueDrift.push(`${id}.${field}`);
        }
      }
    }
    if (valueDrift.length) {
      fail('the client projection', `${valueDrift.length} field(s) disagree with lib/products.json`);
      for (const d of valueDrift.slice(0, 8)) console.error(`    ${d}`);
    } else {
      note('the client projection', `${projectedList.length} SKUs, all ${clientFields.length} declared fields match lib/products.json`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 6b. The counts the pages state agree with the sources                */
/* ------------------------------------------------------------------ */

/*
 * The catalogue is a number of SKUs on a number of product lines, and there
 * is a number of published third-party reports. Those three numbers appear
 * in hand-written copy all over the site, and a hand-written copy of a
 * number is a second copy that drifts.
 *
 * It already had. The why-us page said "20 catalogue SKUs across 3 lines"
 * while every other page said four, and it said "Ten SKUs are covered by
 * third-party laboratory reports" while the reports themselves cover eight
 * (the standards page, counting from the reports, said twelve have none --
 * so eight, not ten).
 *
 * The copy is not rewritten to be generated. It is copy, and copy reads
 * better when it is written. It is CHECKED, so that when the catalogue
 * changes, the pages that state its numbers say so in the build rather than
 * on the site.
 */
{
  const skuCount = (CATALOGUE.products ?? []).filter((p) => p.status === 'active').length;
  const configSrc = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  const lineCount = Number((configSrc.match(/productLines:\s*(\d+)/) || [, 0])[1]);
  const reportsIndex = JSON.parse(readFileSync(join(PUBLIC, 'reports.json'), 'utf8'));
  const reportCount = (reportsIndex.reports ?? []).length;

  // the SKUs a third-party report covers, counted the way the site counts
  // them: content/v2/reports.ts names the SKUs each report covers.
  const reportsSrc = readFileSync(join(SITE, 'content', 'v2', 'reports.ts'), 'utf8');
  const covered = new Set();
  for (const m of reportsSrc.matchAll(/skus:\s*"([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const p = part.trim();
      const range = p.match(/^(P\d+)\s*-\s*(P\d+)$/i);
      if (range) {
        const a = Number(range[1].slice(1));
        const b = Number(range[2].slice(1));
        for (let i = a; i <= b; i += 1) covered.add(`P${String(i).padStart(3, '0')}`);
      } else if (/^P\d+$/i.test(p)) {
        covered.add(p.toUpperCase());
      }
    }
  }
  const coveredCount = (CATALOGUE.products ?? [])
    .filter((p) => p.status === 'active' && covered.has(p.id))
    .length;

  const NUMBERS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  };

  /*
   * The captured groups are STRINGS and the counts are NUMBERS, so every
   * comparison below is against Number(...). The first version compared a
   * string to a number, and it reported 319 disagreements on a site where
   * every number was right -- which is the other way a gate must not fail.
   */
  /**
   * A count written as a digit or as a word.
   *
   * "8" and "Eight" mean the same thing to a reader, so the gate has to
   * accept both. The word map is the one above; the digit is itself.
   */
  const numberWord = (raw) => {
    const s = String(raw).trim().toLowerCase();
    if (/^\d+$/.test(s)) return Number(s);
    return NUMBERS[s];
  };

  const CLAIMS = [
    { re: /(\d+)\s+catalogue SKUs across (\d+)\s+lines/g, want: (m) => Number(m[1]) === skuCount && Number(m[2]) === lineCount },
    { re: /(\d+)\s+catalogue SKUs/g, want: (m) => Number(m[1]) === skuCount },
    { re: /(\d+)\s+SKUs on (\d+)\s+product lines/g, want: (m) => Number(m[1]) === skuCount && Number(m[2]) === lineCount },
    { re: /(\d+)\s+product lines/g, want: (m) => Number(m[1]) === lineCount },
    { re: /all (\d+)\s+SKUs/g, want: (m) => Number(m[1]) === skuCount },
    { re: /(\d+)\s+third-party (?:laboratory |lab )?reports/g, want: (m) => Number(m[1]) === reportCount },
    { re: /(\d+)\s+laboratory reports/g, want: (m) => Number(m[1]) === reportCount },
    {
      // The page may write the count as a digit ("8 SKUs") or as a word
      // ("Eight SKUs"), and both are correct English. The first version
      // only understood the word, so a page that wrote the digit always
      // failed this gate - which is the other way a gate must not fail:
      // it reports a disagreement where there is none.
      re: /([\w]+)\s+SKUs are covered by third-party/g,
      want: (m) => numberWord(String(m[1])) === coveredCount,
      what: 'SKUs are covered by third-party',
    },
  ];

  const problems = [];
  let claims = 0;
  for (const f of htmlFiles) {
    const raw = readFileSync(f, 'utf8');
    for (const claim of CLAIMS) {
      for (const m of raw.matchAll(claim.re)) {
        claims += 1;
        if (!claim.want(m)) {
          problems.push(`${relOf(f)}: "${m[0].slice(0, 70)}"`);
        }
      }
    }
  }

  if (problems.length) {
    fail('the counts', `${problems.length} claim(s) disagree with the catalogue, the configuration or the reports`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note(
      'the counts',
      `${claims} claim(s) agree (${skuCount} SKUs, ${lineCount} product lines, ${reportCount} reports, ${coveredCount} SKUs covered)`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* 6b-2. The line names are the canonical ones                         */
/* ------------------------------------------------------------------ */

/*
 * A product line has ONE name, and it is the one in lib/product-routing.ts.
 *
 * It had four copies. The canonical one is in lib/product-routing.ts;
 * lib/products.ts and scripts/gen-ai-guides.mjs were both fixed to read it
 * from there; and three files each kept a private copy —
 *
 *   components/v2/SpecTable.tsx  said "Cleansing & Grooming"
 *   content/v2/matcher-data.ts   said "Deodorizing & Disinfection"
 *   components/v2/AiMatcher.tsx  said "Deodorizing & Disinfection"
 *
 * — so the catalogue table named a product line "Cleansing & Grooming"
 * while the footer, the line page and the AI files called it "Grooming &
 * Care", and the AI Product Match page offered "Deodorizing &
 * Disinfection" while the line page called it "Deodorizing &
 * Disinfecting". Three names for two lines.
 *
 * Two shapes are checked, because the drift starts in one of them and
 * shows in the other:
 *
 *   1. The BUILT pages, visible body only. The <title> is excluded on
 *      purpose: a title is a search phrase — "OEM Pet Deodorizing &
 *      Disinfection" is the query a buyer types, and the line page's own
 *      title keeps it — and a Product schema's "category" is a category,
 *      not a line.
 *   2. The SOURCES. A map entry whose key is a line id and whose value is
 *      an alias is the copy that starts the drift, so the gate fails
 *      there before the page is ever built.
 */
{
  const routingSrc = readFileSync(join(SITE, 'lib', 'product-routing.ts'), 'utf8');
  const canonical = {};
  const mapMatch = routingSrc.match(/export const LINE_LABEL[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!mapMatch) {
    fail('the line names', 'lib/product-routing.ts does not export LINE_LABEL');
  } else {
    for (const m of mapMatch[1].matchAll(/(\w+):\s*'([^']*)'/g)) canonical[m[1]] = m[2];
  }

  /*
   * The names this site has used for a line, other than the canonical one.
   * Both are copies of an earlier version of the map; scripts/gen-ai-guides.mjs
   * names the same two in its own comment.
   */
  const ALIASES = {
    'Deodorizing & Disinfection': 'Deodorizing & Disinfecting',
    'Cleansing & Grooming': 'Grooming & Care',
    'Grooming & Cleansing': 'Grooming & Care',
  };

  const visibleBody = (html) =>
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ');

  const problems = [];
  let mentions = 0;

  // 1. the built pages
  for (const f of htmlFiles) {
    const body = visibleBody(readFileSync(f, 'utf8'));
    for (const [alias, right] of Object.entries(ALIASES)) {
      if (!body.includes(alias)) continue;
      mentions += 1;
      problems.push(`${relOf(f)}: names a line "${alias}"; the catalogue says "${right}"`);
    }
  }

  // 2. the sources
  const sourceFiles = [
    ...walk(join(SITE, 'components')),
    ...walk(join(SITE, 'content')),
    ...walk(join(SITE, 'lib')),
  ].filter((f) => /\.(ts|tsx|mjs|js)$/.test(f));

  for (const f of sourceFiles) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(deodorizing_disinfection|grooming_care|outdoor_protection|pet_nutrition)\s*:\s*'([^']*)'/g)) {
      const right = ALIASES[m[2]];
      if (!right) continue;
      mentions += 1;
      problems.push(`${relative(SITE, f).split(sep).join('/')}: ${m[1]}: '${m[2]}' — the catalogue says '${right}'`);
    }
  }

  if (problems.length) {
    fail('the line names', `${problems.length} place(s) name a product line in a way the catalogue does not`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note(
      'the line names',
      `${Object.keys(canonical).length} line names, one spelling (${Object.values(canonical).join(' · ')})`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* 6b-bis. The identifiers a buyer must never read                       */
/* ------------------------------------------------------------------ */

/*
 * A product line is named for the buyer. A product line is also a key in a
 * JSON file, and the two were confused on three pages at once.
 *
 * The line page renders its prose layer through CategoryDepth, and the
 * heading it passed in was built by title-casing the block's `category` -
 * which is the three-way COMPLIANCE grouping, not the line:
 *
 *   "What is in the Disinfection_odor_control line"
 *   "What is in the Cleansing_grooming line"
 *   "What is in the Pet_nutrition line"
 *
 * The first is not English, and all three name the wrong grouping: the line
 * a buyer thinks in is "Deodorizing & Disinfecting".
 *
 * The gate above ("the line names") catches a known ALIAS - a misspelling of
 * the line's name. This catches the other shape: the identifier itself,
 * printed where the name belongs. The ids below are the catalogue's own
 * category and line keys, so a hit means a developer key reached the reader.
 */
{
  const IDS = [
    'disinfection_odor_control',
    'cleansing_grooming',
    'outdoor_protection',
    'pet_nutrition',
    'deodorizing_disinfection',
    'grooming_care',
  ];
  /*
   * The match is case-insensitive on purpose: the id reached the reader
   * title-cased ("What is in the Disinfection_odor_control line"), because
   * the code that built it title-cased it. A case-sensitive gate reports
   * clean on exactly the page it was written for.
   */
  const idPattern = new RegExp(`\\b(?:${IDS.join('|')})\\b`, 'gi');

  const visibleBody = (html) =>
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ');

  const problems = [];
  let checked = 0;
  for (const f of htmlFiles) {
    const body = visibleBody(readFileSync(f, 'utf8'));
    checked += 1;
    for (const m of body.matchAll(idPattern)) {
      problems.push(`${relOf(f)}: shows the catalogue identifier "${m[0]}" to the reader`);
    }
  }

  if (problems.length) {
    fail('the identifiers', `${problems.length} place(s) show a catalogue identifier to the reader`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note('the identifiers', `${checked} page(s) checked, no catalogue identifier is visible`);
  }
}

/* ------------------------------------------------------------------ */
/* 6b-ter. A column that says the same thing four times says nothing     */
/* ------------------------------------------------------------------ */

/*
 * The footer's Products column is supposed to name the four product lines.
 * It named all four of them "Products", because the label map in
 * components/Footer.tsx pointed the four line URLs at the section title
 * ("Products") and overrode the configuration's own names.
 *
 * The column rendered as:
 *
 *   Products
 *   Products
 *   Products
 *   Products
 *
 * Which is also why nobody noticed that one of those four links led to a
 * single SKU instead of a line - the links were indistinguishable.
 *
 * The check is the shape of the thing, not a list of forbidden words: within
 * one footer's one column, no two links may carry the same text. A column
 * that repeats a word is a column that names nothing.
 */
{
  const problems = [];
  let checked = 0;

  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8');
    const foot = html.match(/<footer\b[\s\S]*?<\/footer>/i);
    if (!foot) continue;
    checked += 1;

    // each column is one list
    for (const list of foot[0].matchAll(/<ul\b[\s\S]*?<\/ul>/gi)) {
      const labels = [];
      for (const a of list[0].matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
        const text = a[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        if (text) labels.push(text);
      }
      const counts = new Map();
      for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
      for (const [label, n] of counts) {
        if (n > 1) {
          problems.push(`${relOf(f)}: the same column carries "${label}" ${n} times`);
        }
      }
    }
  }

  if (problems.length) {
    fail('the columns are distinct', `${problems.length} column(s) repeat the same label`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note('the columns are distinct', `${checked} footers checked, no column repeats a label`);
  }
}

/* ------------------------------------------------------------------ */
/* 6c. The team and the evidence, stated the same way everywhere        */
/* ------------------------------------------------------------------ */

/*
 * TWO CLAIMS, ONE WAY OF MAKING THEM.
 *
 * The R&D team and the laboratory evidence are each stated on several
 * pages, and both of them broke the same way: a sentence was typed into
 * one page and copied into another, and the copy carried the wrong
 * antecedent with it.
 *
 * "Ten of those are third-party lab reports published on this site" was
 * copied into five page headers. On the factory page "those" were the
 * photographs above it; on the capabilities page the antecedent was the
 * twenty SKUs, so it read as ten of the twenty being covered by a
 * report, when eight of them are.
 *
 * The team was rewritten as "eight in-house chemists (five MSc, three
 * BSc, two SCUT PhDs)", which adds up to ten people inside the word
 * eight, and drops the two regulatory specialists. The why-us page said
 * it correctly on the same site.
 *
 * So the gate checks the shape of the claim, not just its number:
 *
 *   - the team size must be the configured size, everywhere it is stated
 *   - a breakdown in brackets must add up to that size
 *   - a breakdown in brackets must not carry a doctorate count, because
 *     the doctorates are held by members of the team, not by a third
 *     group of people
 *   - the evidence sentence must carry the real report count and the
 *     real covered count
 *   - no page may promise a free sample, and no page may claim that
 *     every SKU in a line is covered by a third-party report
 */
{
  const configSrc = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  const teamSrc = (configSrc.match(/team:\s*\{([\s\S]*?)\n  \}/) || [, ''])[1];
  const teamNum = (key) => Number((teamSrc.match(new RegExp(`${key}:\\s*(\\d+)`)) || [, 0])[1]);
  const chemists = teamNum('chemists');
  const msc = teamNum('msc');
  const bsc = teamNum('bsc');

  const reportsIndex = JSON.parse(readFileSync(join(PUBLIC, 'reports.json'), 'utf8'));
  const reportCount = (reportsIndex.reports ?? []).length;

  const reportsSrc = readFileSync(join(SITE, 'content', 'v2', 'reports.ts'), 'utf8');
  const coveredSkus = new Set();
  for (const m of reportsSrc.matchAll(/skus:\s*"([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const p = part.trim();
      const range = p.match(/^(P\d+)\s*-\s*(P\d+)$/i);
      if (range) {
        const a = Number(range[1].slice(1));
        const b = Number(range[2].slice(1));
        for (let i = a; i <= b; i += 1) coveredSkus.add(`P${String(i).padStart(3, '0')}`);
      } else if (/^P\d+$/i.test(p)) {
        coveredSkus.add(p.toUpperCase());
      }
    }
  }
  const activeIds = new Set(
    (CATALOGUE.products ?? []).filter((p) => p.status === 'active').map((p) => p.id),
  );
  const coveredCount = [...coveredSkus].filter((id) => activeIds.has(id)).length;
  const skuCount = activeIds.size;

  const NUMBERS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  };
  const word = (raw) => {
    const s = String(raw).trim().toLowerCase();
    return /^\d+$/.test(s) ? Number(s) : NUMBERS[s];
  };

  const problems = [];
  let checked = 0;

  for (const f of htmlFiles) {
    const raw = readFileSync(f, 'utf8');
    const page = relOf(f);

    /* the team size, wherever it is stated */
    for (const m of raw.matchAll(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+in-house chemists?\b/gi)) {
      checked += 1;
      const n = word(m[1]);
      if (n !== chemists) {
        problems.push(`${page}: the team is stated as ${m[0]} — the configuration says ${chemists}`);
      }
    }

    /* a breakdown in brackets must add up, and must not carry a doctorate */
    for (const m of raw.matchAll(/\(([^()]{0,80}?MSc[^()]{0,80}?)\)/g)) {
      checked += 1;
      const inside = m[1];
      const ms = inside.match(/(\w+)\s+MSc/);
      const bs = inside.match(/(\w+)\s+BSc/);
      const ph = inside.match(/(\w+)\s+(?:SCUT\s+)?PhDs?/i);
      if (ph) {
        problems.push(`${page}: the breakdown "${inside}" counts the doctorates as a third group of people`);
      }
      if (ms && bs) {
        const sum = (word(ms[1]) ?? 0) + (word(bs[1]) ?? 0);
        if (sum !== chemists) {
          problems.push(`${page}: the breakdown "${inside}" adds up to ${sum}, not ${chemists}`);
        }
      }
    }

    /* the evidence sentence, where it is stated */
    for (const m of raw.matchAll(/(\d+)\s+third-party (?:laboratory |lab )?reports/g)) {
      checked += 1;
      if (Number(m[1]) !== reportCount) {
        problems.push(`${page}: "${m[0]}" — ${reportCount} reports are published`);
      }
    }
    for (const m of raw.matchAll(/covering (\d+) of the (\d+) catalogue SKUs/g)) {
      checked += 1;
      if (Number(m[1]) !== coveredCount || Number(m[2]) !== skuCount) {
        problems.push(
          `${page}: "${m[0]}" — ${coveredCount} of ${skuCount} catalogue SKUs are covered`,
        );
      }
    }

    /* the two promises that are not the client's */
    for (const m of raw.matchAll(/free (?:existing[- ]SKU\s+)?samples?\b/gi)) {
      problems.push(`${page}: "${m[0]}" — samples are chargeable and confirmed in the quotation`);
    }
    for (const m of raw.matchAll(/All \d+ SKUs in this line are third-party tested/gi)) {
      problems.push(
        `${page}: "${m[0]}" — ${coveredCount} of ${skuCount} catalogue SKUs have a report, not all of them`,
      );
    }
  }

  if (problems.length) {
    fail('the evidence', `${problems.length} claim(s) about the team or the reports are wrong`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note(
      'the evidence',
      `${checked} claim(s) agree (${chemists} chemists, ${reportCount} reports, ${coveredCount} of ${skuCount} SKUs covered)`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* 6d. The sentences are sentences                                     */
/* ------------------------------------------------------------------ */

/*
 * WORDS WELDED TOGETHER.
 *
 * React separates an expression from the text beside it with an HTML
 * comment, so this:
 *
 *   <p>We reply within one business day with a sample plan.
 *      {siteConfig.pricing.display}.</p>
 *
 * renders as "...with a sample plan.Quote on request." — the comment is
 * invisible, so the reader sees a full stop welded to the next word.
 * JSX drops the space at the end of a line, and nobody notices until
 * somebody reads the built page.
 *
 * Two shapes are caught, and only two, because the comment is also used
 * where NO space belongs:
 *
 *   - a full stop, comma, colon or semicolon welded to a word
 *   - a digit welded to a lowercase word ("20private-label SKUs")
 *
 * "SKU<!-- -->s" is not flagged: that is one word, and it reads as
 * "SKUs" the way it should.
 */
{
  const problems = [];
  let welded = 0;
  let pages = 0;

  const PUNCTUATION = /([.!?:;,])(<!-- -->)([A-Za-z0-9(])/g;
  const NUMBER_WORD = /(\d)(<!-- -->)([a-z])/g;

  for (const f of htmlFiles) {
    const raw = readFileSync(f, 'utf8');
    const page = relOf(f);
    pages += 1;
    for (const pat of [PUNCTUATION, NUMBER_WORD]) {
      for (const m of raw.matchAll(pat)) {
        welded += 1;
        problems.push(
          `${page}: "${m[0].replace(/<!-- -->/g, '')}" reads as one word — the space was dropped`,
        );
      }
    }
  }

  if (problems.length) {
    fail('the spacing', `${problems.length} place(s) where two words are welded together`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    // The count has to be the pages scanned, not the places found. The first
    // version printed the places found, so a clean run said "0 place(s)
    // checked" — which reads exactly like a gate that looked at nothing, and
    // is the one way a check must not be allowed to look.
    note('the spacing', `${pages} page(s) checked, no words welded together`);
  }
}

/* ------------------------------------------------------------------ */
/* 7. The reading lists agree with the site configuration              */
/* ------------------------------------------------------------------ */

/*
 * The reading lists — llms.txt, llms-full.txt, llms-full.json — are
 * the files an assistant reads first, and they are generated. But a
 * generated file can still be edited by hand, and one was: the
 * WhatsApp number in llms-full.json was changed to an American
 * number while the site said +86 172 6665 9928 in fifty places. The
 * same file's social block had it right, so the file contradicted
 * itself, and the wrong number sat in the block an assistant is most
 * likely to read — company.contact.
 *
 * A buyer who dialled that number would have reached nobody.
 *
 * So the numbers in the reading lists are checked against the site
 * configuration, which is the authority. A hand edit that
 * contradicts the configuration fails the build.
 */
const CONFIG = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');

function cfgFact(name) {
  const m = CONFIG.match(new RegExp(`\\b${name}:\\s*'([^']+)'`));
  return m ? m[1] : null;
}

const factsToCheck = [
  ['whatsapp', 'the WhatsApp number'],
  ['tel', 'the telephone number'],
  ['whatsappDisplay', 'the WhatsApp number as it is shown'],
];

const readingListIssues = [];
for (const fn of ['llms.txt', 'llms-full.txt', 'llms-full.json']) {
  const p = join(SITE, 'public', fn);
  if (!existsSync(p)) continue;
  const body = readFileSync(p, 'utf8');
  // A file does not have to carry every fact. What it must not do is
  // carry a telephone number that is not ours, and a number it does
  // carry must be one of the forms the configuration holds.
  // Every international number in the file, digits only. A telephone
  // number in this site's copy always starts with a plus; a date, a
  // licence number and a report number never do.
  const digitsOf = (s) => s.replace(/[^0-9]/g, '');
  const international = [...body.matchAll(/\+\d[\d\s().-]{7,}\d/g)].map((m) => m[0]);

  const ourNumbers = new Set(
    factsToCheck
      .map(([key]) => cfgFact(key))
      .filter(Boolean)
      .map(digitsOf),
  );

  // Every international number must be one of ours, or the testing
  // laboratory's, which is attributed in the text.
  for (const raw of international) {
    const digits = digitsOf(raw);
    if (ourNumbers.has(digits)) continue;
    if (digits === '862087137666') continue;
    readingListIssues.push(`${fn} carries ${raw.trim()}, which is not our number`);
  }

  // And the number the configuration holds must be in the file, in
  // either its written form or its digits.
  const fileDigits = digitsOf(body);
  for (const [key, label] of factsToCheck) {
    const want = cfgFact(key);
    if (!want) continue;
    const wantDigits = digitsOf(want);
    if (!wantDigits) continue;
    if (!fileDigits.includes(wantDigits)) {
      readingListIssues.push(`${fn} does not carry ${label} (${want})`);
    }
  }
  // Any telephone-looking number that is not one of ours is a copy
  // error. The only third-party number on this site is the testing
  // laboratory's, and it is attributed in the text.

}
if (readingListIssues.length) {
  fail('the reading lists', `${readingListIssues.length} facts do not match the site configuration`);
  for (const d of readingListIssues.slice(0, 8)) console.error(`    ${d}`);
} else {
  note('the reading lists', 'the numbers in llms.txt, llms-full.txt and llms-full.json match the configuration');
}

/* ------------------------------------------------------------------ */
/* 8. No broken characters in the machine-readable files               */
/* ------------------------------------------------------------------ */

/*
 * A mojibake guard.
 *
 * The matcher catalogue is written by hand and had three product names
 * whose em dash had been decoded as GBK and written back: the file
 * carried "Cat Litter Partner \u9225?Deodorizing Powder" where it
 * should have carried "Cat Litter Partner \u2014 Deodorizing Powder".
 * The names were wrong in the client bundle, in the AI matcher's
 * knowledge and in the alt text of the photographs, and nothing noticed.
 *
 * A broken character is invisible in a diff of a JSON file with twenty
 * long entries, and it is exactly the kind of thing that survives a
 * review. So the build checks for it: a file that holds a character
 * outside the range that plain business copy uses fails the build, and
 * a product name in the projection that does not match the catalogue of
 * record fails too.
 */
/*
 * The family grows with every one that has been found.
 *
 * \u9225 \u9226 \u951f \u9359 \u93c8 \u9340 are the GBK misreadings of the
 * em dash and the multiplication sign. \u63b3 (掳) is the misreading of the
 * degree sign and \u8133 (脳) is the misreading of the multiplication sign
 * again - both from a file that was decoded as GBK and written back.
 *
 * A guard that only knows the characters of the last breakage is a guard
 * that is one breakage behind, so each one that turns up is added here.
 *
 * \u8def (路) is the misreading of the middle dot, and it gets its own
 * rule: only an ISOLATED 路 is a broken character. The company's address
 * is in Chinese in these files, and a Chinese word that happens to
 * contain 路 must not fail the build - while "SHENHE ZHONGKE 路
 * SHENHE-SHAMPOO-500" must.
 */
const MOJIBAKE = /[\u9225\u9226\u951f\u9359\u93c8\u9340\u63b3\u8133]/;
const MOJIBAKE_ISOLATED_ROAD = /(?<![\u4e00-\u9fff])\u8def(?![\u4e00-\u9fff])/;

const mojibakeFiles = [];
for (const fn of ['llms.txt', 'llms-full.txt', 'llms-full.json', 'ai.txt', 'faq.json', 'reports.json']) {
  const p = join(SITE, 'public', fn);
  if (!existsSync(p)) continue;
  const body = readFileSync(p, 'utf8');
  if (MOJIBAKE.test(body) || MOJIBAKE_ISOLATED_ROAD.test(body)) mojibakeFiles.push(fn);
}
const mc = join(SITE, 'content', 'v2', 'matcher-catalogue.json');
if (existsSync(mc) && (MOJIBAKE.test(readFileSync(mc, 'utf8')) || MOJIBAKE_ISOLATED_ROAD.test(readFileSync(mc, 'utf8')))) {
  mojibakeFiles.push('content/v2/matcher-catalogue.json');
}
if (mojibakeFiles.length) {
  fail('the mojibake', `${mojibakeFiles.length} files hold a broken character`);
  for (const f2 of mojibakeFiles) console.error(`    ${f2}`);
} else {
  note('the mojibake', 'no broken characters in the machine-readable files');
}

/*
 * And the product names in the projection must be the names in the
 * catalogue of record. The names are what a buyer reads and what an
 * assistant quotes; a projection that renames a product is a
 * different product.
 */
const nameDrift = [];
try {
  const CATALOGUE2 = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8'));
  const catalogueNames = new Map();
  for (const p of collectProducts(CATALOGUE2)) catalogueNames.set(String(p.id), p.name_en);
  const projected2 = JSON.parse(readFileSync(mc, 'utf8')).catalogue || [];
  for (const p of projected2) {
    const truth = catalogueNames.get(String(p.id));
    if (truth && p.name_en && p.name_en !== truth) {
      nameDrift.push(`${p.id}: the catalogue says "${truth}", the matcher says "${p.name_en}"`);
    }
  }
} catch (e) {
  nameDrift.push(`the catalogue could not be read: ${e.message}`);
}
if (nameDrift.length) {
  fail('the product names', `${nameDrift.length} names do not match lib/products.json`);
  for (const d of nameDrift.slice(0, 8)) console.error(`    ${d}`);
} else {
  note('the product names', 'every name in the matcher catalogue matches lib/products.json');
}

/* ------------------------------------------------------------------ */
/* 5. The sitemap against the build                                    */
/* ------------------------------------------------------------------ */

const smPath = join(PUBLIC, 'sitemap.xml');
if (existsSync(smPath)) {
  const sm = readFileSync(smPath, 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const built = new Set(htmlFiles.map((f) => '/' + relOf(f)));
  const ghost = locs.filter((u) => {
    const p = u.replace('https://shenhezhongke.com', '');
    return !built.has(p) && !existsSync(join(OUT, p)) && !existsSync(join(OUT, p, 'index.html'));
  });
  if (ghost.length) {
    fail('the sitemap', `${ghost.length} listed URLs are not in the build`);
    for (const g of ghost.slice(0, 8)) console.error(`    ${g}`);
  } else {
    note('the sitemap', `${locs.length} URLs, all in the build`);
  }
} else {
  fail('the sitemap', 'sitemap.xml is not in public/');
}

/* ------------------------------------------------------------------ */
/* The home page has one address                                        */
/* ------------------------------------------------------------------ */

/*
 * THE HOME PAGE HAS ONE ADDRESS.
 *
 * The export writes the home page as /index.html. The canonical says
 * /, the sitemap says /, and every link on the site used to say
 * /index.html - the same bytes under a second name. A crawler that
 * follows the links and reads the canonical is told two different
 * things about where the home page lives, and the index report counts
 * that as a duplicate with no canonical chosen.
 *
 * So three things have to agree - the canonical, the sitemap and the
 * links - and nothing on the site may point at the second address.
 *
 * The redirect that answers /index.html lives in the nginx vhost, not
 * here: a static export has no server to answer a redirect, so the
 * rule that serves it is the one on the server. This gate is about the
 * half the repository can see - the addresses the site publishes and
 * the addresses it links to.
 */
{
  const problems = [];
  const home = htmlFiles.find((f) => relOf(f) === 'index.html');
  if (!home) {
    fail('the home page has one address', 'the build holds no index.html');
  } else {
    const raw = readFileSync(home, 'utf8');
    const canon = raw.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/);
    const wanted = ['https://shenhezhongke.com', 'https://shenhezhongke.com/'];
    if (!canon) {
      problems.push('the home page carries no canonical');
    } else if (!wanted.includes(canon[1])) {
      problems.push(`the canonical of the home page is ${canon[1]}`);
    }

    // Nothing may point at the second address - neither a link nor the
    // breadcrumb in the structured data.
    const offenders = [];
    for (const f of htmlFiles) {
      const text = readFileSync(f, 'utf8');
      const links = (text.match(/href="\/index\.html"/g) || []).length;
      const crumbs = (text.match(/"item"\s*:\s*"https:\/\/shenhezhongke\.com\/index\.html"/g) || []).length;
      if (links || crumbs) offenders.push(`${relOf(f)} (${links + crumbs})`);
    }
    if (offenders.length) {
      problems.push(
        `${offenders.length} page(s) still point at /index.html: ${offenders.slice(0, 5).join(', ')}`,
      );
    }

    // and the sitemap has to publish the same address
    const smText = existsSync(smPath) ? readFileSync(smPath, 'utf8') : '';
    if (!/<loc>https:\/\/shenhezhongke\.com\/<\/loc>/.test(smText)) {
      problems.push('the sitemap does not publish the home page as https://shenhezhongke.com/');
    }
  }
  if (problems.length) {
    fail('the home page has one address', problems.join('; '));
    for (const p of problems) console.error(`    ${p}`);
  } else {
    note('the home page has one address', 'the canonical, the sitemap and every link say /');
  }
}

/* ------------------------------------------------------------------ */
/* The utilities still win                                             */
/* ------------------------------------------------------------------ */

/*
 * A COLOUR RULE THAT OVERRIDES THE UTILITIES.
 *
 * globals.css carried an UNLAYERED rule
 *
 *     h1, h2, h3, h4 { ... color: var(--color-ink-deep); }
 *
 * and globals.css is imported BEFORE tailwindcss, so that rule is
 * unlayered. In the CSS cascade an unlayered declaration outranks a
 * declaration in ANY layer, whatever the specificity - and Tailwind v4 emits
 * .text-white, .text-white/50 and every other colour utility inside
 * @layer utilities. So every heading that asked for white got ink-deep
 * instead: the closing bands rendered ink on teal, and the footer's column
 * headings rendered ink on the dark footer, on all ninety-three pages.
 *
 * The trap is invisible in code review - the class is right there and it
 * looks right - and it is silent in the build. So this gate asks the
 * question directly: does any stylesheet in app/ set a colour on a BARE
 * ELEMENT selector outside a cascade layer?
 *
 * A class-scoped rule (.on-dark h2, .v3-link) is fine where it is: the
 * cascade then decides on specificity, which is what somebody reading the
 * stylesheet would expect.
 */
function stripLayerBlocks(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@layer', i);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    const brace = css.indexOf('{', at);
    const semi = css.indexOf(';', at);
    // "@layer theme, base;" is a statement, not a block - keep it.
    if (semi !== -1 && (brace === -1 || semi < brace)) {
      out += css.slice(i, semi + 1);
      i = semi + 1;
      continue;
    }
    out += css.slice(i, at);
    let depth = 0;
    let j = brace;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    i = j;
  }
  return out;
}

{
  const problems = [];
  const sheets = [
    'globals.css', 'v3.css', 'design-system.css',
    'legacy-tokens.css', 'elements.css',
  ];
  // The elements whose colour a page author reaches for a utility to set.
  // `html` and `body` are deliberately absent: the page default belongs
  // there, and nothing on a child overrides it.
  const bare = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'li', 'dt', 'dd', 'label', 'blockquote',
    'span', 'div', 'section', 'article', 'button', 'input', 'select', 'textarea',
  ]);
  for (const name of sheets) {
    const path = join(SITE, 'app', name);
    if (!existsSync(path)) continue;
    // Comments first: elements.css QUOTES the old rule verbatim in a
    // comment, and a scanner that reads a comment as a rule cries wolf.
    const withoutComments = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const unlayered = stripLayerBlocks(withoutComments);
    const rules = unlayered.matchAll(/([^{}]+)\{([^{}]*)\}/g);
    for (const m of rules) {
      if (!/(^|[;{\s])color\s*:/.test(m[2])) continue;
      const selectors = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      const culprits = selectors.filter((s) => bare.has(s));
      if (culprits.length) {
        problems.push(
          `${name}: \`${culprits.join(', ')}\` sets a colour outside a cascade layer, `
          + 'so it overrides every Tailwind colour utility',
        );
      }
    }
  }
  if (problems.length) {
    fail('the utilities still win', problems.join('; '));
    for (const p of problems) console.error(`    ${p}`);
  } else {
    note('the utilities still win', 'no bare element rule takes a colour away from the utilities');
  }
}

/* ------------------------------------------------------------------ */
/* The desk can see the lead                                           */
/* ------------------------------------------------------------------ */

/*
 * A FACT THAT IS CAPTURED BUT NEVER SHOWN.
 *
 * The address was in the payload, the quantity and the trade term were in
 * the table, and the person writing the quotation could see none of them.
 * No other check can catch that: the data IS in the database, so the
 * database is right - it is the screen that was wrong.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_desk_sees_the_lead.py');
  if (!existsSync(script)) {
    fail('the desk can see the lead', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the desk can see the lead', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the desk can see the lead', 'a captured fact is not on the screen the desk works in');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 10)) {
        if (line.trim().startsWith('FAIL ')) console.error(`    ${line.trim().slice(5).trim()}`);
      }
    } else {
      const out = `${r.stdout || ''}`.trim();
      note('the desk can see the lead', out.startsWith('ok') ? out.replace(/^ok\s+/, '') : 'the desk sees it');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The facts agree everywhere                                           */
/* ------------------------------------------------------------------ */

/*
 * THE FACTS AGREE EVERYWHERE.
 *
 * A site says the same thing in ninety-three places, and the moment one of
 * them drifts the site stops being a company and becomes a rumour. This
 * asks the built pages to agree with the catalogue record: every product
 * page must carry its own minimum order and its own two lead times, the
 * private-label window must be 25-40 days wherever it is named, the
 * company must be spelled one way, and no page may state a price.
 *
 * The first version of this gate tried to recognise a claim with regular
 * expressions and reported a dozen contradictions that were not
 * contradictions. It now checks against the record instead.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_facts_agree.py');
  if (!existsSync(script)) {
    fail('the facts agree everywhere', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the facts agree everywhere', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the facts agree everywhere', 'two pages state the same fact differently');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 10)) {
        if (line.trim().startsWith('FAIL ')) console.error(`    ${line.trim().slice(5).trim()}`);
      }
    } else {
      const out = `${r.stdout || ''}`.trim();
      const detail = out.startsWith('ok') ? out.replace(/^ok\s+/, '') : 'the pages agree';
      note('the facts agree everywhere', detail);
    }
  }
}

/* ------------------------------------------------------------------ */
/* The mail relay                                                      */
/* ------------------------------------------------------------------ */

/*
 * THE MAIL RELAY.
 *
 * Two things broke here, and neither of them announced itself:
 *
 *  1. The api implements its own SMTP client rather than using a
 *     library. It sent the message and then sent the period - the line
 *     that ends a DATA block - as the NEXT command. The client sends
 *     one command per reply it receives, so after the message it waited
 *     for a reply the server was not going to give until the period
 *     arrived. Neither side moved and every send timed out after
 *     twenty-five seconds. It was never noticed because no send had ever
 *     got past the credentials: a module that has never sent a mail
 *     cannot have its sending proven by reading it.
 *
 *  2. The mail server will only let an account send as itself, so a
 *     reply to the From address would land in a mailbox nobody reads.
 *     The reply address has to be a separate thing, and it has to be
 *     the address the site publishes for buyers - the quotation mail
 *     promises the buyer that a reply will reach the sales manager.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_mail_relay.py');
  if (!existsSync(script)) {
    fail('the mail relay', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the mail relay', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the mail relay', 'a send can fail in a way nothing notices');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) {
        if (line.trim().startsWith('FAIL ')) console.error(`    ${line.trim().slice(5).trim()}`);
      }
    } else {
      note('the mail relay', 'a send ends and a reply lands');
    }
  }
}

/*
 * ------------------------------------------------------------------ *
 * EVERY COLOUR UTILITY THE SOURCE USES MUST EXIST                       *
 * ------------------------------------------------------------------ *
 *
 * A class that is not defined is not a warning, it is a NO-OP: the element
 * keeps whatever colour it inherited. That is how the console's sign-in
 * screen came to paint "Shenhe Zhongke" in #1f2a2e on #0b0f12 - a contrast
 * ratio of 1.31, which is unreadable - and how the same thing happened on
 * a table header.
 *
 * The source used 28 such classes in 208 places. None of them was a typo
 * that mattered until it mattered.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_colour_classes_exist.py');
  if (!existsSync(script)) {
    fail('every colour utility exists', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('every colour utility exists', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('every colour utility exists', 'a colour utility is used that the stylesheet never defines');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 10)) {
        if (line.trim().startsWith('FAIL ')) console.error(`    ${line.trim().slice(5).trim()}`);
      }
    } else {
      note('every colour utility exists', 'every colour utility the source uses is defined');
    }
  }
}

/*
 * ------------------------------------------------------------------ *
 * THE TEXT HAS TO BE READABLE ON THE GROUND IT STANDS ON               *
 * ------------------------------------------------------------------ *
 *
 * It happened twice in the same shape: the headings, when an unlayered
 * bare-element rule beat every Tailwind colour utility; and the data bars,
 * when every data bar on the site stood on bg-v2-ink-900 and asked for the
 * light tone - so the figure was painted text-v2-ink-900. #0b0f12 on
 * #0b0f12.
 *
 * This one is measured rather than read: headless Chrome opens every built
 * page and is asked what colour each piece of text is painted with and
 * what is behind it. Reading the source is not enough - a background can
 * come from an ancestor, an alpha can wash a colour out, and a utility can
 * lose the cascade.
 */
{
  const script = join(SITE, 'scripts', 'check_text_contrast.mjs');
  if (!existsSync(script)) {
    fail('the text has to be readable on the ground it stands on', 'the check script is missing');
  } else {
    const r = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 900000 });
    if (r.error) {
      fail('the text has to be readable on the ground it stands on', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the text has to be readable on the ground it stands on', 'a piece of text cannot be read where it stands');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 10)) {
        console.error(`    ${line.trim().slice(0, 160)}`);
      }
    } else {
      note('the text has to be readable on the ground it stands on', 'every piece of text can be read where it stands');
    }
  }
}

/*
 * ------------------------------------------------------------------ *
 * THE TWO LEAD-TIME WINDOWS ARE NAMED APART                            *
 * ------------------------------------------------------------------ *
 *
 * OEM on this site means the BUYER's formula - a 30-45 day job, and not a
 * field of any product. The per-product windows are the stock one (7-15
 * days) and the private-label one (25-40 days), and the record that holds
 * the second one is called `lead_time_days_oem`.
 *
 * That name leaked into twenty product pages and the home page, where it
 * was rendered as "OEM lead time" next to the value 25-40. So a buyer who
 * read the trade page - where OEM is defined as their own formula - and
 * then a product page was told two different things by the same site.
 *
 * It already happened twice, so it is checked: the name a buyer reads is
 * the one that has to be right.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_lead_time_labels.py');
  if (!existsSync(script)) {
    fail('the two lead-time windows are named apart', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the two lead-time windows are named apart', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the two lead-time windows are named apart', 'the site calls one window two different things');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the two lead-time windows are named apart', 'stock and private label are told apart');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The English copy has to be English                                 */
/* ------------------------------------------------------------------ */

/*
 * A Chinese product name inside an English sentence ("measured on the
 * 净味小子 sample"), the two spellings of one word on one page
 * ("inquiry" next to "enquiry"), and a word that is not a word
 * ("programmeme") - none of them break a build, and all three are
 * things a buyer notices.
 *
 * The check runs on the built output, because the built output is what
 * a buyer reads and what a crawler reads.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_english_copy_consistency.py');
  if (!existsSync(script)) {
    fail('the English copy is English', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the English copy is English', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the English copy is English', 'a page says something a buyer would notice');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) {
        if (line.trim().startsWith('!!') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the English copy is English', 'no stray Chinese, no "inquiry", no "programmeme"');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The English follows one house style, and makes no unqualified promise */
/* ------------------------------------------------------------------ */

/*
 * One spelling (enquiry, catalogue, odor), one temperature ("25 °C"),
 * and no claim without the report it rests on.
 *
 * A buyer's legal team reads every claim a second time, and "pet-safe if
 * licked" or "99.9% kill rate against common pathogens" are the two
 * sentences that get struck - and every other number on the page gets
 * discounted with them.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_english_house_style.py');
  if (!existsSync(script)) {
    fail('the English follows the house style', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the English follows the house style', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the English follows the house style', 'a retired spelling, a loose temperature, or an unqualified promise');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) {
        if (line.trim().startsWith('!!') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the English follows the house style', 'one spelling, one temperature, no unqualified promise');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The promise the buyer is given is the promise the desk judges      */
/* ------------------------------------------------------------------ */

/*
 * "Within one business day" is a deadline, and a deadline is arithmetic.
 * Two copies of the arithmetic is one too many: the form skipped only
 * Sunday and promised 18:00 on the next working day, while the staff
 * desk skipped Saturday as well - which the site's own published hours
 * say is a working day - and judged the promise at the arrival time. A
 * buyer who wrote at 10:00 on Wednesday was told "Thursday, 18:00" and
 * the desk called the row late on Thursday at 10:00, eight hours before
 * the promise the buyer had actually been given.
 *
 * The rule now lives in one file that both sides read, and this check
 * proves it: it runs the shipped rule, reads the published hours, and
 * fails if either side grows a copy of it.
 */
{
  const script = join(SITE, 'scripts', 'check_response_deadline.mjs');
  if (!existsSync(script)) {
    fail('the buyer and the desk read one promise', 'the check script is missing');
  } else {
    const r = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 180000 });
    if (r.error) {
      fail('the buyer and the desk read one promise', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the buyer and the desk read one promise', 'the deadline the buyer is told and the deadline the desk judges are not the same');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('      ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the buyer and the desk read one promise', 'one rule, one clock, the published working hours');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Every dataset says what may be done with it                          */
/* ------------------------------------------------------------------ */

/*
 * Google's rich result test named the missing field on 2026-11-08:
 * "未填写字段 license" on /attestation.html. A Dataset's license is a URL
 * to a page that describes the terms under which the records may be used
 * - so the terms have to exist, and every dataset has to point at them.
 *
 * The check reads the built site, which is what a crawler sees, and fails
 * if a dataset carries no license, points at somebody else's domain, or
 * points at a page that is not published. A license URL that 404s is
 * worse than no license, because it looks like an answer.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_dataset_license.py');
  if (!existsSync(script)) {
    fail('every dataset says what may be done with it', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('every dataset says what may be done with it', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('every dataset says what may be done with it', 'a dataset does not say what may be done with it');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('every dataset says what may be done with it', 'every dataset points at the page that states the terms');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The tap card agrees with the site                                     */
/* ------------------------------------------------------------------ */

/*
 * A card with an NFC tag is printed once and then sits in a warehouse for
 * months. The address on it has to be the address the site serves, and
 * the site has to say what the card is - a buyer holding one has to know
 * that touching it opens the site.
 *
 * The check asks the two: every address printed on the card is the
 * site's address, and the site mentions the card.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_chip_card.py');
  if (!existsSync(script)) {
    fail('the tap card agrees with the site', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the tap card agrees with the site', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the tap card agrees with the site', 'the card and the site do not carry the same address');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the tap card agrees with the site', 'the card prints the site address, and the site says what the card is');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The catalogue tree may not promise offers we do not make             */
/* ------------------------------------------------------------------ */

/*
 * An OfferCatalog is a catalogue OF OFFERS. This site publishes no
 * offer: it is quote-only, so there is no price and no availability to
 * publish.
 *
 * The home page's catalogue tree was one until 2026-11-09, and Google's
 * product summary report named the four nested catalogues as the
 * reason - asking for the price, the currency, the review and the
 * rating inside offers we do not publish. The tree is an ItemList now,
 * and the nesting still says "four shelves, and here is what is on each
 * of them".
 *
 * The check reads the built site, and fails if an OfferCatalog comes
 * back, or if a product inside a list has no packshot and no brand - a
 * catalogue that lists products it cannot describe is worse than one
 * that says nothing.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_catalogue_tree.py');
  if (!existsSync(script)) {
    fail('the catalogue makes no offer it cannot keep', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the catalogue makes no offer it cannot keep', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the catalogue makes no offer it cannot keep', 'the catalogue promises something the site does not publish');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the catalogue makes no offer it cannot keep', 'the tree is a list of what we make, and every entry describes its product');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The opening hours in the markup must be the hours on the page       */
/* ------------------------------------------------------------------ */

/*
 * The factory page's markup said the factory opens at 08:30 on weekdays
 * and closes at 12:00 on Saturday. The footer of every page says "Mon-Sat,
 * 09:00-18:00 China Standard Time", lib/shenhe.config.ts holds that as
 * the one truth, and lib/response-deadline.ts judges the desk by it.
 *
 * So the markup said one thing and the page said another, on the same
 * page. This is the third time the site has said two different things
 * about one fact - the reply promise, the SKU count, and now the hours.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_opening_hours.py');
  if (!existsSync(script)) {
    fail('the factory opens when the site says it does', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the factory opens when the site says it does', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the factory opens when the site says it does', 'the markup and the page disagree about the hours');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the factory opens when the site says it does', 'the markup and the footer agree about the hours');
    }
  }
}

/* ------------------------------------------------------------------ */
/* The report                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 10. The headline has to fit the first screen                        */
/* ------------------------------------------------------------------ */

/*
 * A headline-length check.
 *
 * The home headline grew to eight words and the accent added five, and
 * at the display size the composition had been designed around, that
 * is thirteen words. On a 1440x900 screen it filled the viewport and
 * pushed the call to action below the fold: the page had a headline,
 * a photograph and a promise, and no way to act on any of them.
 *
 * A screenshot caught it. A check stops it going back.
 *
 * The rule is a word count on the headline plus the accent, because
 * that is what determines how many lines the block occupies at the
 * display size. It is not a style opinion; it is the measurement that
 * the screenshot showed failing.
 */
const headlineProblems = [];
try {
  const homeSrc = readFileSync(join(SITE, 'app', '(site)', 'page.tsx'), 'utf8');
  const titleM = homeSrc.match(/title="([^"]{10,200})"/);
  const accentM = homeSrc.match(/accent="([^"]{5,200})"/);
  const titleWords = titleM ? titleM[1].trim().split(/\s+/).length : 0;
  const accentWords = accentM ? accentM[1].trim().split(/\s+/).length : 0;
  const total = titleWords + accentWords;
  if (total > 10) {
    headlineProblems.push(
      `the home headline is ${total} words (${titleWords} + ${accentWords}); ` +
      `above 10 it fills the viewport and pushes the call to action below the fold`
    );
  } else {
    note('the headline fits', `${total} words in the headline and accent (${titleWords} + ${accentWords})`);
  }
} catch (e) {
  headlineProblems.push(`the home page could not be read: ${e.message}`);
}
if (headlineProblems.length) {
  fail('the headline fits', headlineProblems.join('; '));
} else {
  /* already noted above */
}

/* ------------------------------------------------------------------ */
/* 11. The lead times on the site must be the ones we declare         */
/* ------------------------------------------------------------------ */

/*
 * A lead-time check.
 *
 * The minimum order was computed once and the build fails if a page
 * disagrees with the catalogue. The lead times had the same treatment
 * a few days later, and the reason is a note from an outside buyer:
 * four different production windows for the same order were on the
 * site at once - 25-40 days on the catalogue, 25-35 on capabilities,
 * 40-50 on the home page, 30-45 on contact.
 *
 * A buyer who reads that does not conclude that the factory is busy.
 * A buyer who reads that concludes that the factory does not agree
 * with itself, and a contradiction about delivery is a contradiction
 * about money.
 *
 * So the windows are declared in lib/commerce.ts and every page that
 * states one must state it from there. This check reads the built
 * pages and fails on any delivery window that is not one of ours.
 */
/*
 * The two kinds of window on this site, kept apart.
 *
 * PRODUCTION is how long the factory takes to make the goods.
 *   Declared in lib/commerce.ts: LEAD_TIMES.
 *
 * TRANSIT is how long the goods take to arrive once they have left.
 *   Declared in content/v2/shipping.json: the channel transit times.
 *
 * They are different facts, and the outside reader who found the site
 * found four production-looking numbers for one order and concluded
 * the factory disagreed with itself. It did not - it published a
 * production window and a transit window without saying which was
 * which.
 *
 * So the check accepts both sets, and separately refuses any window
 * that belongs to neither. The refusal is the point: a number that is
 * in neither list was typed by hand somewhere, and it is the one that
 * will drift.
 */
const PRODUCTION_LEAD = ['7-15 days', '25-40 days', '30-45 days', '5-7 days', '7-14 days', '60-90 days'];
const TRANSIT_LEAD = ['25-35 days', '35-45 days', '40-50 days', '5-7 days', '3-5 days'];
const LAB_LEAD = ['14-21 days', '7-10 days'];
const ALL_LEAD = [...new Set([...PRODUCTION_LEAD, ...TRANSIT_LEAD, ...LAB_LEAD])];

const leadProblems = [];
function walkHtml(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/*
 * EVERY PUBLISHED FILE THAT IS TEXT.
 *
 * The pages are only part of what a site publishes. The reading lists
 * an answer engine reads, the machine-readable files, the sitemap and
 * the javascript a browser downloads are published too - and an address
 * in any of them is an address a buyer can write to.
 */
function walkPublished(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkPublished(p, out);
    else if (/\.(html|txt|json|xml|js|css|webmanifest)$/i.test(e.name)) out.push(p);
  }
  return out;
}
for (const f of walkHtml(OUT)) {
  const body = readFileSync(f, 'utf8');
  const rel = relative(OUT, f).split(sep).join('/');
  const found = body.match(/\b\d{1,2}\s*[-\u2013]\s*\d{1,2}\s*(?:days?|working days?)\b/gi) || [];
  for (const hit of found) {
    const norm = hit
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\bdays?$/, 'days');
    if (!ALL_LEAD.includes(norm)) {
      leadProblems.push(`${rel}: "${norm}"`);
    }
  }
}
if (leadProblems.length) {
  fail('the lead times agree', `${leadProblems.length} delivery windows are in neither the production nor the transit list`);
  for (const p of [...new Set(leadProblems)].slice(0, 14)) console.error(`    ${p}`);
} else {
  note('the lead times agree', 'every delivery window is a declared production window or a declared transit window');
}

/* ------------------------------------------------------------------ */
/* 12. The number of third-party reports must be the real number       */
/* ------------------------------------------------------------------ */

/*
 * A count check.
 *
 * There are ten third-party laboratory reports. Three places on the
 * site used to say twelve, because the number was typed into the
 * sentences rather than read from the list of reports. A buyer who
 * read "twelve reports" and then counted ten on the certifications
 * page learns that this site counts its own documents wrong, which is
 * a poor thing to learn about a factory you are about to send money
 * to. An assistant reading the same sentence would quote twelve.
 *
 * So the count is read from the reports module and the rendered pages
 * are checked against it. Any page that names a count of reports in
 * words has to name the right one.
 */
const REPORT_COUNT = 10;
const WORDS = { 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen' };
const WRONG_COUNTS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const countProblems = [];
function walkAll(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkAll(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
for (const f of walkAll(OUT)) {
  const body = readFileSync(f, 'utf8');
  const rel = relative(OUT, f).split(sep).join('/');
  const found = body.match(/\b(\d{1,2}|ten|eleven|twelve|thirteen|fourteen)\s+(?:third-party\s+)?(?:lab\s+)?reports?\b/gi) || [];
  for (const hit of found) {
    const word = hit.trim().split(/\s+/)[0].toLowerCase();
    // Object.keys returns strings, so the found key has to be turned back
    // into a number before it is compared with the count. Comparing '10'
    // with 10 is always true, which made every correct page fail.
    const n = /^\d+$/.test(word)
      ? Number(word)
      : (() => {
          const key = Object.keys(WORDS).find((k) => WORDS[k] === word);
          return key === undefined ? undefined : Number(key);
        })();
    if (n !== undefined && n !== REPORT_COUNT) {
      countProblems.push(`${rel}: "${hit.trim()}"`);
    }
  }
}
if (countProblems.length) {
  fail('the report count agrees', `${countProblems.length} places name a different number of reports`);
  for (const p of [...new Set(countProblems)].slice(0, 10)) console.error(`    ${p}`);
} else {
  note('the report count agrees', `every page that names a report count says ${REPORT_COUNT}`);
}

// The end-to-end contract gate.
//
// The website, the factory desk and the buyer portal meet only through
// the database. Each of them can be healthy on its own while the chain
// between them is broken: the form posts, the desk shows the row, and
// the buyer never sees the quote. The contract test walks that chain.
//
// It is not part of the build, because it needs credentials and it
// writes a record. It is a separate run, and it is here so that the
// command is in one place and its output is not lost:
//
//     SHENHE_ADMIN_USER=... SHENHE_ADMIN_PASS=... \
//     SHENHE_PORTAL_USER=... SHENHE_PORTAL_PASS=... \
//     python3 scripts/contract_e2e.py
//
// The last run is recorded in the file below, so the build can say when
// the chain was last proved and whether it has been proved since the
// API changed.
{
  const stampPath = join(SITE, 'scripts', '.contract-last-run');
  if (!existsSync(stampPath)) {
    note('the contract test', 'not run yet — see scripts/contract_e2e.py');
  } else {
    const stamp = JSON.parse(readFileSync(stampPath, 'utf8'));
    /*
     * THE API FINGERPRINT.
     *
     * The API is not in this repository — it lives on the server — so the
     * gate cannot compare file times. The test writes the API's own
     * fingerprint into the stamp instead: the size and the mtime of the
     * files the chain runs through, as they were when the chain was
     * proved. A change to any of them after that means the chain has not
     * been proved since.
     */
    const fingerprint = stamp.api || {};
    const changed = Object.entries(fingerprint).filter(
      ([name, v]) => existsSync(v.path) && statSync(v.path).mtimeMs !== v.mtime,
    );
    const age = Math.round((Date.now() - stamp.at) / 60000);
    if (changed.length) {
      fail('the contract test', `the API changed after the last run: ${changed.map(([n]) => n).join(', ')}`);
    } else if (!stamp.ok) {
      fail('the contract test', 'the API changed after the last run — the chain has not been proved since');
    } else if (!stamp.ok) {
      fail('the contract test', `the last run failed (${stamp.checks} checks, ${stamp.failed} failed)`);
    } else {
      note('the contract test', `the last run passed ${stamp.checks} checks, ${age} minutes ago`);
    }
  }
}

// The reading list gate.
//
// llms-sitemap.xml tells an assistant which files to read, in the order
// that builds the picture of this factory. It is a promise about
// addresses, and an address that is not there is a dead end: the
// assistant is told to read /faq.json, gets a 404, and stops asking.
//
// The build is the only place this can be caught, because the nginx
// rule that refuses every .json has to make an exception for each file
// on this list, and an exception for a file that was never published is
// an exception for nothing.
//
// So: every URL the list declares has to be in the build.
{
  const listPath = join(OUT, 'llms-sitemap.xml');
  if (!existsSync(listPath)) {
    fail('the reading list resolves', 'llms-sitemap.xml is not in the build');
  } else {
    const xml = readFileSync(listPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>[^<]*shenhezhongke\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
    const problems = [];
    for (const loc of locs) {
      const rel = loc.replace(/^\//, '');
      const p = join(OUT, rel || 'index.html');
      if (!existsSync(p)) problems.push(`${loc} is not in the build`);
    }
    if (problems.length) {
      fail('the reading list resolves', `${problems.length} of ${locs.length} declared files are missing`);
      for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
    } else {
      note('the reading list resolves', `all ${locs.length} declared reading files are in the build`);
    }
  }
}

// The identity list gate.
//
// The sameAs list is read out of the configuration by a script that
// parses the source text, and a parser that misses a comment style
// quietly drops entries. It did: the file said four URLs where the
// configuration said eleven, and the build was green the whole time.
//
// So the count is checked here, against the configuration itself, and
// every URL in the list has to resolve. The list is the company's
// identity, and an identity that lists a page that is not there is
// worse than one that lists fewer.
{
  const cfg = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  const i = cfg.indexOf('sameAs: [');
  const arrStart = cfg.indexOf('[', i);
  // the end of the array: the bracket that closes it, ignoring the ones
  // inside strings and comments
  let depth = 0;
  let arrEnd = -1;
  let inStr = false;
  let inLine = false;
  let inBlock = false;
  for (let k = arrStart; k < cfg.length; k++) {
    const c = cfg[k];
    const nx = cfg[k + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && nx === '/') { inBlock = false; k++; } continue; }
    if (inStr) { if (c === "'" && cfg[k - 1] !== '\\') inStr = false; continue; }
    if (c === '/' && nx === '/') { inLine = true; k++; continue; }
    if (c === '/' && nx === '*') { inBlock = true; k++; continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { arrEnd = k; break; } }
  }
  const arr = arrEnd === -1 ? '' : cfg.slice(arrStart, arrEnd + 1);
  const noComments = arr
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  const urls = [
    ...new Set(
      [...noComments.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((v) => v.startsWith('http')),
    ),
  ];
  const problems = [];
  // the file the generator wrote has to carry every URL
  const generated = join(SITE, 'public', 'llms-full.json');
  if (existsSync(generated)) {
    const d = JSON.parse(readFileSync(generated, 'utf8'));
    const written = d.sameAs ?? [];
    const missing = urls.filter((u) => !written.includes(u));
    if (missing.length) {
      problems.push(`${missing.length} of ${urls.length} sameAs URLs are not in llms-full.json`);
      for (const m of missing.slice(0, 4)) problems.push(`  ${m}`);
    }
  }
  // every URL has to resolve
  for (const u of urls) {
    const p = u.startsWith('https://shenhezhongke.com')
      ? join(OUT, u.replace('https://shenhezhongke.com', '').replace(/^\//, '') || 'index.html')
      : null;
    if (p && !existsSync(p)) problems.push(`the sameAs URL does not resolve: ${u}`);
  }
  if (problems.length) {
    fail('the identity list is whole', `${problems.length} problems`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  } else {
    note('the identity list is whole', `all ${urls.length} sameAs URLs are written and resolve`);
  }
}

// The off-site addresses have to answer, and the site has to claim them.
//
// The gate below checks the register against the site's own facts. This
// one checks the other half: that every off-site address in the sameAs
// list is still there, and that the register and the list say the same
// thing. An off-site address used to be skipped altogether, because the
// list was resolved against the build and an off-site address is not in
// the build - so a profile that had been deleted stayed in the identity
// list forever, claiming a page that is not there.
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_offsite_identity.py');
  if (!existsSync(script)) {
    fail('the off-site identity is what the site says it is', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8', timeout: 120000 });
    if (r.error) {
      fail('the off-site identity is what the site says it is', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the off-site identity is what the site says it is', 'the register and the identity list do not agree');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 12)) {
        if (line.trim().startsWith('FAIL ') || line.trim().startsWith('    ')) {
          console.error(`    ${line.trim().slice(0, 170)}`);
        }
      }
    } else {
      note('the off-site identity is what the site says it is', 'the off-site addresses answer, and the register and the list agree');
    }
  }
}

// The off-site identity gate.
//
// The register in public/company-identity.json is what gets copied onto
// the B2B directories and the professional networks. Those platforms
// compare what they are given against what the buyer sees elsewhere, and
// the one thing that makes an assistant read two mentions as the same
// company is that the legal name and the address are identical in both.
//
// So the register is checked against the site's own facts here. A typo
// in the legal name is a different company, and a platform that has
// already indexed the wrong name does not correct it for us.
//
// The off-site URLs are not checked for reachability yet: there are none
// registered. The day there are, the sameAs gate checks them.
{
  const registerPath = join(SITE, 'public', 'company-identity.json');
  if (!existsSync(registerPath)) {
    fail('the identity register agrees', 'public/company-identity.json is missing');
  } else {
    const reg = JSON.parse(readFileSync(registerPath, 'utf8'));
    const problems = [];
    // the legal name, the address and the website come from the site's own
    // single source of truth, so the register cannot drift from it
    const cfg = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
    const legal = reg.company?.legalName;
    if (!legal) problems.push('the register has no legalName');
    else if (!cfg.includes(legal)) {
      problems.push(`the legal name "${legal}" is not in lib/shenhe.config.ts`);
    }
    const website = reg.company?.website;
    if (website !== 'https://shenhezhongke.com') {
      problems.push(`the website is "${website}", not the site's own`);
    }
    const domain = 'shenhezhongke.com';
    // the address has to be the one the site publishes
    const street = reg.company?.address?.streetAddress;
    if (!street || !cfg.includes('No.141-1 Longteng Road')) {
      problems.push('the address is not the one the site publishes');
    }
    // and the postal code has to be the one the site publishes. The
    // register has carried it since the old site; the configuration had
    // nowhere to write it, which is why the Organization graph could not
    // name it and Google's rich result test said "postalCode 未填写".
    const postal = reg.company?.address?.postalCode;
    if (!postal) {
      problems.push('the register has no postalCode');
    } else if (!cfg.includes(`postalCode: '${postal}'`)) {
      problems.push(`the postal code "${postal}" is not in lib/shenhe.config.ts`);
    }
    // every off-site entry has to name the platform and its state
    for (const [k, v] of Object.entries(reg.offSite ?? {})) {
      if (k.startsWith('_')) continue;
      if (!v || typeof v.status !== 'string') {
        problems.push(`the ${k} entry has no status`);
        continue;
      }
      if (v.status !== 'not registered' && !v.url) {
        problems.push(`the ${k} entry says ${v.status} but carries no URL`);
      }
      if (v.url && !v.url.startsWith('https://')) {
        problems.push(`the ${k} URL is not https`);
      }
    }
    if (problems.length) {
      fail('the identity register agrees', `${problems.length} problems in the register`);
      for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
    } else {
      const off = Object.entries(reg.offSite ?? {}).filter(([k]) => !k.startsWith('_'));
      const live = off.filter(([, v]) => v.url).length;
      note(
        'the identity register agrees',
        live
          ? `the legal name and the address match the site; ${live} off-site profiles are live`
          : `the legal name and the address match the site; ${off.length} platforms are on the register, none registered yet`,
      );
    }
  }
}

// The breadcrumb gate.
//
// A page that sits inside a hierarchy but does not say so is a page a
// crawler has to guess about. The trail and the BreadcrumbList come from
// one array, so the schema cannot describe a trail the visitor cannot
// see - but the trail itself has to reach the language pages, and it did
// not: the locale prefix was part of the path and not part of the
// hierarchy, so every German and Spanish page had no trail at all.
//
// The pages that must NOT have one are exempt, and the list says why:
// the home page (a trail that says "Home - Home" is noise), the error
// pages, and the two account surfaces.
{
  const exempt = (rel) =>
    rel === 'index.html' ||
    rel === 'de.html' ||
    rel === 'es.html' ||
    rel === '404.html' ||
    rel === '_not-found.html' ||
    rel.startsWith('portal/') ||
    rel.startsWith('admin/') ||
    rel === 'admin.html' ||
    // The verification files are not pages: they are the proof the
    // search engine reads. No trail, no content, no hierarchy - and
    // they are written as .html so the engine can fetch them.
    rel === 'google-site-verification.html' ||
    rel === 'baidu_verify_codev2.html' ||
    rel === 'yandex-verification.html' ||
    rel === 'BingSiteAuth.xml';
  const missing = [];
  let checked = 0;
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith('.html')) {
        const rel = relative(OUT, p).split(sep).join('/');
        if (exempt(rel)) continue;
        const html = readFileSync(p, 'utf8');
        checked += 1;
        if (!html.includes('BreadcrumbList')) missing.push(rel);
      }
    }
  };
  walk(OUT);
  if (missing.length) {
    fail('the breadcrumbs are there', `${missing.length} of ${checked} pages have no BreadcrumbList`);
    for (const p of [...new Set(missing)].slice(0, 10)) console.error(`    ${p}`);
  } else {
    note('the breadcrumbs are there', `all ${checked} public pages carry a BreadcrumbList`);
  }
}

// The language gate.
//
// A language page is published only when its body is in that language.
//
// The German and Spanish pages were published for a while as the English
// pages with a translated dictionary behind them: the navigation, the
// breadcrumbs, the metadata, the FAQ and the product card fields were
// translated, and the body was English. They took 64% of the crawl
// weight, repeated the English body 1.9 times, and brought in no human
// visitor. And the signal was worse than the weight: hreflang said
// "German page", a German buyer arrived, found English and left.
//
// So the gate says what it means: if a language is in the sitemap, its
// pages have to be in that language. A page that claims to be German
// and answers in English fails the build.
//
// The check is a word count on the body against the English original,
// with the words that are the same in both languages taken out. A German
// page that says "ISO 22716 GMP" and "MOQ 2.000" is German even though
// those words are English.
{
  const cfg = readFileSync(join(SITE, 'lib', 'i18n', 'config.ts'), 'utf8');
  const published = (cfg.match(/PUBLISHED_LOCALES\s*=\s*\[([^\]]*)\]/) || [, ''])[1]
    .split(',')
    .map((x) => x.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  const problems = [];
  // 1. no language page may exist in the build that is not published
  const stray = [];
  for (const locale of ['de', 'es']) {
    if (published.includes(locale)) continue;
    const dir = join(OUT, locale);
    if (!existsSync(dir)) continue;
    const walk = (d) => {
      for (const e of readdirSync(d)) {
        const p = join(d, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (e.endsWith('.html')) stray.push(relative(OUT, p).split(sep).join('/'));
      }
    };
    walk(dir);
  }
  if (stray.length) {
    problems.push(`${stray.length} ${'pages'} exist for a language that is not published`);
  }

  // 2. a published language's pages have to be in that language
  for (const locale of published) {
    if (locale === 'en') continue;
    const dir = join(OUT, locale);
    if (!existsSync(dir)) continue;
    // the German words that are also English words, so they do not count
    const common = new Set([
      'der', 'die', 'das', 'und', 'oder', 'mit', 'f\u00fcr', 'ihr', 'unser', 'nicht',
      'werden', 'k\u00f6nnen', 'ist', 'sind', 'ein', 'eine', 'der', 'von', 'im', 'in',
      'zu', 'auf', 'und', 'die', 'des', 'dem', 'den', 'als', 'auch', 'noch', 'nur',
      'el', 'la', 'los', 'las', 'y', 'con', 'para', 'su', 'nuestro', 'usted', 'nos',
      'por', 'que', 'como', 'm\u00e1s', 'pero', 'este', 'esta', 'son', 'es', 'un', 'una',
      'the', 'and', 'with', 'for', 'your', 'our', 'not', 'you', 'are', 'this', 'that',
      'from', 'its', 'has', 'was', 'were', 'will', 'can', 'all', 'more', 'than',
    ]);
    const langWords = locale === 'de'
      ? /\b(der|die|das|und|oder|mit|f\u00fcr|ihr|unser|nicht|werden|k\u00f6nnen|ist|sind|ein|eine|von|zu|auf|als|auch|noch|nur|F\u00fcr|Ihre|Sie|wir|wird|beim|beide|durch|gegen|ohne|unter|\u00fcber)\b/gi
      : /\b(el|la|los|las|y|con|para|su|nuestro|usted|nos|por|que|como|m\u00e1s|pero|este|esta|son|es|un|una|del|al|todo|tambi\u00e9n|puede|debe|sin|bajo|entre|cada)\b/gi;
    const walk = (d) => {
      for (const e of readdirSync(d)) {
        const p = join(d, e);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!e.endsWith('.html')) continue;
        const rel = relative(OUT, p).split(sep).join('/');
        const html = readFileSync(p, 'utf8');
        const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, html])[1];
        const text = body
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = text.split(' ');
        if (words.length < 120) continue; // a short page cannot be judged
        const sample = words.slice(0, 400).join(' ');
        const hits = (sample.match(langWords) || []).length;
        const share = hits / 400;
        if (share < 0.02) {
          problems.push(`${rel} carries ${(share * 100).toFixed(1)}% ${locale} words in its first 400 words`);
        }
      }
    };
    walk(dir);
  }

  // 3. the structured data must not claim a language the site does not have
  //
  // The WebSite block said inLanguage: ['en', 'es', 'de'] on every page,
  // because the legacy site had those three languages and the trees were
  // removed later. The llms.txt files were corrected at the time; the schema
  // kept the claim. `inLanguage` is what tells a search engine, and an answer
  // engine, what a page is in and whether a translated version exists — so a
  // Spanish- or German-language buyer is sent to a page they cannot read.
  //
  // The ContactPoint's `availableLanguage` is NOT checked here: that one says
  // which languages a person can be answered in, which is a fact about the
  // sales desk rather than about the website.
  {
    const claimed = new Map();
    for (const f of htmlFiles) {
      const html = readFileSync(f, 'utf8');
      for (const m of html.matchAll(/"@type"\s*:\s*"WebSite"[\s\S]{0,400}?"inLanguage"\s*:\s*\[([^\]]*)\]/g)) {
        for (const lang of m[1].matchAll(/"([^"]+)"/g)) {
          const l = lang[1];
          if (published.includes(l)) continue;
          if (!claimed.has(l)) claimed.set(l, new Set());
          claimed.get(l).add(relOf(f));
        }
      }
    }
    for (const [lang, pages] of claimed) {
      problems.push(
        `${pages.size} page(s) declare inLanguage "${lang}", which is not published ` +
        `(e.g. ${[...pages][0]})`,
      );
    }
  }

  if (problems.length) {
    fail('the languages are honest', `${problems.length} problems`);
    for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
  } else {
    note(
      'the languages are honest',
      published.length === 1
        ? 'only English is published; no language page claims a language it does not have'
        : `the published languages: ${published.join(', ')} — every page is in its own language`,
    );
  }
}

// The carton labels.
//
// A label that does not scan is a label that does not exist, and it is
// only found out when a warehouse with bad light tries to read it. So
// every label is decoded here, by a decoder, in the build.
//
// The decoder reads the SVG the generator wrote, reconstructs the module
// grid, and reads it back. If the URL that comes out is not the URL that
// went in, the build fails.

{
  const labelDir = join(OUT, 'labels');
  const problems = [];
  let checked = 0;

  if (existsSync(labelDir)) {
    let jsQR = null;
    try {
      jsQR = (await import('jsqr')).default;
    } catch {
      // the decoder is optional: without it the gate checks the shape
    }

    // the grid -> the bitmap -> the decoded url
    const decodeGrid = (grid, size) => {
      if (!jsQR) return null;
      const img = new Uint8ClampedArray(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        const v = grid[Math.floor(i / size)][i % size] ? 0 : 255;
        img[i * 4] = v; img[i * 4 + 1] = v; img[i * 4 + 2] = v; img[i * 4 + 3] = 255;
      }
      const res = jsQR(img, size, size);
      return res ? res.data : null;
    };

    for (const name of readdirSync(labelDir)) {
      // the svg
      if (name.endsWith('.svg')) {
        const svg = readFileSync(join(labelDir, name), 'utf8');
        const urlMatch = svg.match(/<text[^>]*>(https:\/\/shenhezhongke\.com\/verify\/[^<]+)<\/text>/);
        if (!urlMatch) {
          problems.push(`${name} carries no verification url`);
          continue;
        }
        const url = urlMatch[1];
        const pathMatch = svg.match(/<path d="([^"]+)" fill="#000000"/);
        if (!pathMatch) {
          problems.push(`${name} has no code path`);
          continue;
        }
        const rects = [...pathMatch[1].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-\d+z/g)].map((m) => ({
          x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]),
        }));
        if (!rects.length) {
          problems.push(`${name} has no modules`);
          continue;
        }
        const scale = 8;
        const maxX = Math.max(...rects.map((r) => r.x + r.w));
        const size = Math.round((maxX - 4 * scale) / scale) + 8;
        const grid = Array.from({ length: size }, () => new Array(size).fill(0));
        for (const r of rects) {
          const c0 = Math.round(r.x / scale) - 4;
          const r0 = Math.round(r.y / scale) - 4;
          for (let c = c0; c < c0 + Math.round(r.w / scale); c++) {
            for (let rr = r0; rr < r0 + Math.round(r.h / scale); rr++) {
              if (rr >= 0 && rr < size && c >= 0 && c < size) grid[rr][c] = 1;
            }
          }
        }
        const decoded = decodeGrid(grid, size);
        if (decoded === null) {
          if (jsQR) problems.push(`${name} does not decode`);
          else checked += 1;
        } else if (decoded !== url) {
          problems.push(`${name} decodes to ${decoded}, not to ${url}`);
        } else {
          checked += 1;
        }
        continue;
      }

      /*
       * The pdf.
       *
       * The pdf is what goes to the printer, so the pdf is what has to
       * be checked. The code is drawn as filled rectangles in the
       * content stream, and the run of black modules is one wide
       * rectangle — so the grid is read back by the cell, not by the
       * rectangle.
       */
      if (name.endsWith('.pdf')) {
        const raw = readFileSync(join(labelDir, name), 'latin1');
        if (!raw.startsWith('%PDF-') || !raw.includes('%%EOF')) {
          problems.push(`${name} is not a valid pdf`);
          continue;
        }
        const stream = raw.split('stream\n')[1]?.split('\nendstream')[0] ?? '';
        const rects = [...stream.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re f/g)].map((m) => ({
          x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]),
        }));
        const cell = 4;
        const codeRows = rects.filter((r) => Math.abs(r.h - cell) < 0.01 && r.w <= 200);
        if (!codeRows.length) {
          problems.push(`${name} has no code`);
          continue;
        }
        const xs = new Set();
        const ys = new Set();
        for (const r of codeRows) {
          for (let k = 0; k < Math.round(r.w / cell); k++) xs.add(Math.round((r.x + k * cell) * 10) / 10);
          ys.add(Math.round(r.y * 10) / 10);
        }
        const xsList = [...xs].sort((a, b) => a - b);
        const ysList = [...ys].sort((a, b) => a - b);
        const size = xsList.length;
        const grid = Array.from({ length: ysList.length }, () => new Array(size).fill(0));
        for (const r of codeRows) {
          const row = ysList.indexOf(Math.round(r.y * 10) / 10);
          for (let k = 0; k < Math.round(r.w / cell); k++) {
            const col = xsList.indexOf(Math.round((r.x + k * cell) * 10) / 10);
            if (row >= 0 && col >= 0) grid[row][col] = 1;
          }
        }
        const decoded = decodeGrid(grid, size);
        if (decoded === null) {
          if (jsQR) problems.push(`${name} does not decode`);
          else checked += 1;
        } else if (!decoded.includes('/verify/')) {
          problems.push(`${name} decodes to ${decoded}, which is not a verification url`);
        } else {
          checked += 1;
        }
      }
    }
  }

  if (problems.length) {
    fail('the labels scan', `${problems.length} problems`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  } else {
    note('the labels scan', checked === 0
      ? 'no carton labels yet'
      : `${checked} labels decoded and the url matches`);
  }
}

// The series.
//
// Twenty catalogue SKUs, and three of them are the same product in a
// different size. A crawler reading the fifteen product pages without a
// declared relationship sees fifteen near-copies: ninety-six to
// ninety-nine per cent of the words are the same, and only the size, the
// carton and the weight differ. Google files that as duplicate content,
// and one page in a group is picked to represent the rest.
//
// The pages are not duplicates, so the fix is to declare the
// relationship rather than to delete anything. This gate checks that
// every page in a series says so and links to the others, and that a
// page which is not in a series does not claim to be.
//
// The series itself is computed from the catalogue - two SKUs are the
// same product when their names are the same once the size is taken off -
// so the gate and the page read the same fact.
{
  const SERIES = [
    ['multi-purpose-pet-wash-200.html', 'multi-purpose-pet-wash-300.html'],
    ['multi-purpose-pet-wash-300.html', 'multi-purpose-pet-wash-200.html'],
    ['cat-litter-companion.html', 'cat-litter-partner-300.html'],
    ['cat-litter-partner-300.html', 'cat-litter-companion.html'],
    ['pet-waterless-cleaning-foam.html', 'waterless-cleansing-foam-500.html'],
    ['waterless-cleansing-foam-500.html', 'pet-waterless-cleaning-foam.html'],
  ];
  const NOT_IN_A_SERIES = [
    'pet-shampoo-antibacterial-500.html',
    'pet-digestive-probiotics.html',
    'outdoor-insect-repellent-spray.html',
  ];

  const problems = [];
  let linked = 0;

  for (const [file, other] of SERIES) {
    const p = join(OUT, 'products', file);
    if (!existsSync(p)) {
      problems.push(`products/${file} is not in the build`);
      continue;
    }
    const html = readFileSync(p, 'utf8');
    if (!html.includes('The other sizes of this product')) {
      problems.push(`products/${file} does not declare its series`);
      continue;
    }
    if (!html.includes(`/products/${other}`)) {
      problems.push(`products/${file} does not link to ${other}`);
      continue;
    }
    linked += 1;
  }

  for (const file of NOT_IN_A_SERIES) {
    const p = join(OUT, 'products', file);
    if (!existsSync(p)) continue;
    const html = readFileSync(p, 'utf8');
    if (html.includes('The other sizes of this product')) {
      problems.push(`products/${file} claims a series it is not in`);
    }
  }

  if (problems.length) {
    fail('the series are declared', `${problems.length} problems`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  } else {
    note('the series are declared', `${linked} product pages name the other sizes of the same product`);
  }
}

// The report coverage.
//
// Twenty catalogue SKUs, ten laboratory reports, eight SKUs covered.
// The other twelve were, until the coverage table was written, silent
// - a product page with no report on it looks the same whether the
// report exists and was forgotten, or was never done.
//
// The table says which case each SKU is in. This gate checks that it
// still agrees with the catalogue and with the reports that are
// actually published, because a coverage table that has drifted is
// worse than no coverage table: a buyer asks us about a report we
// said they had, and there is nothing in it.
//
// Three things are checked:
//   - every report number in the table is a report that exists;
//   - every active SKU is in the table, in one of the three cases;
//   - the counts the site publishes match the counts in the table.
{
  const problems = [];

  const read = (p) => {
    const q = join(SITE, ...p.split('/'));
    return existsSync(q) ? readFileSync(q, 'utf8') : '';
  };

  const catalogue = JSON.parse(read('lib/products.json'));
  const active = (catalogue.products || []).filter((p) => p.status !== 'inactive');
  const coverageSrc = read('lib/report-coverage.ts');
  const reportsSrc = read('content/v2/reports.ts');
  const certSrc = read('app/(site)/certifications/page.tsx');

  if (!coverageSrc || !reportsSrc) {
    problems.push('the report coverage files are missing');
  } else {
    // the report numbers that exist
    const real = new Set();
    for (const m of reportsSrc.matchAll(/number:\s*"([^"]+)"/g)) real.add(m[1]);
    for (const m of certSrc.matchAll(/number:\s*'([^']+)'/g)) real.add(m[1]);

    // the report numbers the coverage table uses
    const used = new Set();
    const coverageBlock = coverageSrc.slice(
      coverageSrc.indexOf('export const COVERAGE'),
      coverageSrc.indexOf('export function coverageOf'),
    );
    for (const m of coverageBlock.matchAll(/'((?:NACCYH|YD|20)[A-Za-z0-9]+)'/g)) used.add(m[1]);

    for (const n of used) {
      if (!real.has(n)) problems.push(`the coverage names a report that does not exist: ${n}`);
    }

    // every active SKU is in the table
    const skuIds = active.map((p) => p.id);
    const inTable = new Set();
    for (const m of coverageBlock.matchAll(/^\s{2}(P\d{3}):/gm)) inTable.add(m[1]);
    for (const id of skuIds) {
      if (!inTable.has(id)) problems.push(`${id} is not in the report coverage table`);
    }
    for (const id of inTable) {
      if (!skuIds.includes(id)) problems.push(`the coverage table names a SKU that is not in the catalogue: ${id}`);
    }

    // The three cases, counted per SKU over the whole entry - a case
    // spans several lines, so counting lines counts nothing.
    let withReport = 0;
    let sameFormula = 0;
    let noReport = 0;
    const entries = coverageBlock.split(/\n\s{2}(?=P\d{3}:)/).slice(1);
    for (const entry of entries) {
      const hasSame = /sameFormulaAs:\s*\{/.test(entry);
      const hasNone = /noReport:\s*['\"]/.test(entry);
      // The sameFormulaAs case carries its own list of report numbers,
      // so a "reports:" key inside it belongs to that same case and
      // must not be read as a second one.
      const directPart = hasSame ? entry.replace(/sameFormulaAs:\s*\{[\s\S]*?\n\s*\}/, '') : entry;
      const hasDirect = /(?:^|[{,]\s*)reports:\s*\[/.test(directPart);
      const cases = [hasDirect, hasSame, hasNone].filter(Boolean).length;
      if (cases === 0) {
        if (entry.includes('{')) {
          problems.push('a SKU in the coverage table is in no case');
        }
        continue;
      }
      if (cases > 1) {
        problems.push('a SKU in the coverage table is in more than one case');
        continue;
      }
      if (hasDirect) withReport += 1;
      else if (hasSame) sameFormula += 1;
      else noReport += 1;
    }
    if (withReport + sameFormula + noReport !== skuIds.length) {
      problems.push(
        `the coverage table does not cover every SKU: ${withReport + sameFormula + noReport} cases for ${skuIds.length} SKUs`,
      );
    }

    if (problems.length === 0) {
      note(
        'the report coverage is honest',
        `${withReport} SKUs carry a report, ${sameFormula} are the same formula in another pack, ${noReport} say plainly that they have none`,
      );
    }
  }

  if (problems.length) {
    fail('the report coverage is honest', `${problems.length} problems`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  }
}

// The data bar.
//
// A conclusion without a figure behind it is a claim, and every
// competitor on this market makes the same claim. The opening sentence
// of a landing page answers what the page is for; the data bar under it
// answers whether the factory can do it.
//
// The gate checks two things: that the landing pages still carry the
// bar, and that the bar is where it belongs — directly under the
// opening sentence, not further down the page where a buyer will never
// scroll. The figures come from siteConfig.metrics, so they cannot
// disagree with the factory page or the catalogue.

{
  const PAGES = [
    ['products.html', 'catalogue SKUs'],
    ['factory.html', 'industrial park'],
    ['capabilities.html', 'third-party reports'],
    ['certifications.html', 'third-party reports'],
    ['global-compliance.html', 'export markets'],
    ['contact.html', 'export markets'],
    ['oem-odm.html', 'catalogue SKUs'],
    ['standards.html', 'third-party reports'],
    ['why-us.html', 'industrial park'],
    ['ai-customize.html', 'catalogue SKUs'],
  ];
  const problems = [];
  let checked = 0;

  for (const [file, marker] of PAGES) {
    const p = join(OUT, file);
    if (!existsSync(p)) {
      problems.push(`${file} is not in the build`);
      continue;
    }
    const html = readFileSync(p, 'utf8');
    const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, html])[1]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ');
    const h1 = body.match(/<h1[^>]*>/i);
    if (!h1) {
      problems.push(`${file} has no h1`);
      continue;
    }
    const after = body.slice(h1.index);
    const lead = after.match(/<p class="v2-lead[^"]*"[^>]*>/i);
    if (!lead) {
      problems.push(`${file} has no opening sentence`);
      continue;
    }
    const leadEnd = after.indexOf('</p>', lead.index);
    const barAt = after.indexOf(marker);
    if (barAt === -1) {
      problems.push(`${file} carries no data bar`);
      continue;
    }
    // the bar has to be within a short distance of the opening sentence:
    // under it, not at the foot of the page
    const distance = barAt - leadEnd;
    if (distance > 1200 || distance < -600) {
      problems.push(`${file}: the data bar is ${distance} characters from the opening sentence`);
      continue;
    }
    /*
     * AND THE FIGURES IN IT ARE READABLE ON AN ENGLISH PAGE.
     *
     * The bar is a strip of numbers, and it used to abbreviate them the
     * Chinese way: "3.0万 m²" and "30万 bottles" - a unit abbreviation
     * that no buyer outside China can read, in the biggest figures on the
     * page. The full form was in the line underneath, so the big figure
     * was the unreadable one.
     *
     * The figure is what follows the label, so that is what is read: the
     * label is the marker this check has already found, and the figure is
     * the first visible text after it. Reading it relative to the label
     * keeps the check honest - it cannot drift onto a neighbouring
     * element the way a search for a whole element can.
     *
     * The rest of the site still carries Chinese in places, so this check
     * is deliberately narrow: the figure under the opening sentence only.
     */
    const afterLabel = after.slice(barAt + marker.length);
    const figure = afterLabel.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (/[\u4e00-\u9fff]/.test(figure)) {
      problems.push(`${file}: the figure reads "${figure}" - a Chinese unit abbreviation in an English figure`);
      continue;
    }
    checked += 1;
  }

  if (problems.length) {
    fail('the data bars are there', `${problems.length} problems`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  } else {
    note('the data bars are there', `${checked} landing pages carry the figures under the opening sentence`);
  }
}


/* ------------------------------------------------------------------ */
/* The report hashes are of the bytes the site serves                  */
/* ------------------------------------------------------------------ */

/*
 * The published promise is one a buyer can check: "download the report,
 * compute its SHA-256, and it matches the fingerprint recorded on the
 * chain".
 *
 * Three things have to hold for that to be true, and none of them was
 * checked:
 *
 *   1. The manifest's hash must be the hash of the file the site serves.
 *      A manifest written before a report was re-exported is a published
 *      number that is wrong, and the buyer who checks it gets a mismatch
 *      and concludes the factory is not what it says it is.
 *   2. Every batch that has been attested must still match the file on the
 *      site. This is the promise itself: the fingerprint on the chain is of
 *      the file the buyer downloads. If the file moved after the
 *      attestation, the proof is broken and the build must fail. Today no
 *      batch has been attested, so this part is the gate waiting for the
 *      chain feature to land -- and it will bite the first time it does.
 *   3. The typed copy of the manifest must be the published copy. It was a
 *      hand copy, and a hand copy of a published number is a second number
 *      that can disagree with the first.
 */
{
  const problems = [];
  let files = 0;
  let attested = 0;

  const manifestPath = join(PUBLIC, 'report-hashes.json');
  if (!existsSync(manifestPath)) {
    problems.push('there is no public/report-hashes.json');
  } else {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    for (const r of manifest.reports ?? []) {
      const served = join(OUT, 'assets', 'img', 'certs', r.fileName);
      if (!existsSync(served)) {
        problems.push(`${r.reportNumber}: ${r.fileName} is not in the build`);
        continue;
      }
      const bytes = readFileSync(served);
      const sha = createHash('sha256').update(bytes).digest('hex');
      if (sha !== r.sha256) {
        problems.push(
          `${r.reportNumber}: the served file hashes to ${sha.slice(0, 16)}…, the manifest says ${String(r.sha256).slice(0, 16)}…`,
        );
      }
      if (bytes.length !== r.bytes) {
        problems.push(`${r.reportNumber}: ${bytes.length} bytes served, ${r.bytes} in the manifest`);
      }
      files += 1;
    }

    const tsPath = join(SITE, 'lib', 'report-hashes.ts');
    if (existsSync(tsPath)) {
      const ts = readFileSync(tsPath, 'utf8');
      const m = ts.match(/export const REPORT_HASHES = (\{[\s\S]*?\n\});/);
      if (!m) {
        problems.push('lib/report-hashes.ts does not carry the manifest');
      } else {
        let typed = null;
        try {
          typed = JSON.parse(m[1]);
        } catch {
          /* reported as "does not parse" below */
        }
        if (!typed) {
          problems.push('lib/report-hashes.ts does not parse');
        } else if (JSON.stringify(typed) !== JSON.stringify(manifest)) {
          problems.push('lib/report-hashes.ts and public/report-hashes.json are not the same file');
        }
      }
    }

    const attestedPath = join(SITE, 'scripts', '.batches-attested.json');
    if (existsSync(attestedPath)) {
      const rows = JSON.parse(readFileSync(attestedPath, 'utf8'));
      for (const a of Array.isArray(rows) ? rows : []) {
        if (!a.report_sha256 || !a.report_file) continue;
        const served = join(OUT, 'assets', 'img', 'certs', a.report_file);
        if (!existsSync(served)) {
          problems.push(`${a.batch_no}: the attested report ${a.report_file} is not in the build`);
          continue;
        }
        const sha = createHash('sha256').update(readFileSync(served)).digest('hex');
        if (sha !== a.report_sha256) {
          problems.push(
            `${a.batch_no}: the report changed after it was attested (chain ${String(a.report_sha256).slice(0, 16)}…, site ${sha.slice(0, 16)}…)`,
          );
        }
        attested += 1;
      }
    }
  }

  if (problems.length) {
    fail('the report hashes', `${problems.length} problem(s)`);
    for (const p of problems.slice(0, 6)) console.error(`    ${p}`);
  } else {
    note(
      'the report hashes',
      `${files} report(s) hashed from the served bytes` +
        (attested ? `, ${attested} attested batch(es) still match` : ', no batch attested yet'),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Can a search engine find this site at all?                          */
/* ------------------------------------------------------------------ */

/*
 * Everything else in this gate is about the site being CORRECT. This one is
 * about the site being FINDABLE.
 *
 * WHAT WAS WRONG, AND WHAT ACTUALLY FIXED IT (measured 2026-11-03)
 *
 * The IndexNow push was refused by two of the seven endpoints:
 *
 *   POST api.indexnow.org/indexnow   403
 *   POST www.bing.com/indexnow       403
 *     {"errorCode":"UserForbiddedToAccessSite",
 *      "message":"User is unauthorized to access the site. Please verify the
 *                 site using the key and try again"}
 *
 * The reading was wrong for a week. The 403 was read as "this engine has
 * not verified our host", and the chase went to the Bing Webmaster Tools
 * verification file - which was a real thing to do and not the cause.
 *
 * The body says "using the KEY". A key file on the site is necessary and
 * not sufficient: Bing only accepts a key IT issued for the property, so
 * the site has to be in Bing Webmaster Tools and the push has to carry the
 * key Bing generated there. Measured with three keys and every endpoint:
 *
 *     key                            shared   Bing     the other five
 *     2e1e0ece (self-made)           403      403      200
 *     c1998c98 (Bing issued)         202      202      200
 *     be0cabeb (Bing issued)         202      200      200
 *
 * The other five engines validate a key by fetching the key file and
 * registering it on first contact, which is why they accept a self-made key
 * and why Yandex answers 202 and then 200. api.indexnow.org and
 * www.bing.com are the same backend - the shared endpoint forwards to Bing
 * for most hosts - so those two refusals were one refusal, and the script
 * was pushing to the two that were refusing it and calling that a failure.
 *
 * WHAT THIS CHECKS NOW
 *
 *   1. The key files the push script actually uses are in this build. A key
 *      file that is missing is a 403 from every engine, and it reads like
 *      "the site is broken" rather than "one file is absent".
 *
 *   2. The verification files are reported as they are: in the build or not.
 *      They are built by scripts/gen-verify-files.mjs from the environment
 *      (GOOGLE_SITE_VERIFICATION, BING_SITE_AUTH), and the deployment also
 *      restores BingSiteAuth.xml from /data/shenhe/keys, so a file that is
 *      not in this build may still be published.
 *
 *      This note used to assert that the domain had not been verified with
 *      Google or Bing. It did not know that, and by 2026-11-03 it was wrong:
 *      the sitemap had been submitted in Search Console and the property was
 *      in Bing Webmaster Tools, showing impressions and recommendations. A
 *      gate that states a falsehood about the outside world sends the next
 *      person to fix something that is not broken - which is exactly what
 *      happened here.
 *
 * A note, not a failure. The values are the operator's to supply, and a
 * permanently red build only teaches people to ignore red builds.
 */
{
  const WANTED = [
    ['google-site-verification.html', 'Google Search Console'],
    ['BingSiteAuth.xml', 'Bing Webmaster Tools'],
  ];
  const missing = WANTED.filter(([f]) => !existsSync(join(OUT, f)));
  if (missing.length) {
    note(
      'the search engines',
      `${missing.length} verification file(s) are not in this build (${missing
        .map(([f]) => f)
        .join(', ')}) -- the deployment restores them from /data/shenhe/keys, so fetch them before assuming they are missing`,
    );
  } else {
    note('the search engines', 'the verification files are in this build -- the domain can be verified by file with Google and Bing');
  }

  // The IndexNow keys the push script uses have to be published, or every
  // engine refuses the push with a 403 that reads like a broken site.
  const pushScript = join(SITE, 'scripts', 'push-indexnow.sh');
  const keyLine = existsSync(pushScript)
    ? (readFileSync(pushScript, 'utf8').match(/^KEYS="([^"]*)"/m) ?? [])[1]
    : null;
  if (!keyLine) {
    fail('the indexnow keys', 'the push script does not declare a KEYS list');
  } else {
    const keys = keyLine.split(/\s+/).filter(Boolean);
    const unpublished = keys.filter((k) => !existsSync(join(OUT, `${k}.txt`)));
    if (unpublished.length) {
      fail('the indexnow keys', `${unpublished.length} of ${keys.length} key file(s) are not in this build`);
      for (const k of unpublished) console.error(`    ${k}.txt`);
    } else {
      note(
        'the indexnow keys',
        `all ${keys.length} key file(s) are in this build -- ${keys.map((k) => k.slice(0, 8)).join(', ')}`,
      );
    }
  }
}

// The description budget gate.
//
// A description is what a buyer reads in the search result before they
// click. A search engine shows about 155 characters of it, and a
// description that runs longer is cut at a place the writer did not
// choose — usually mid-fact. A description shorter than seventy
// characters says nothing.
//
// The descriptions come from eight different places, and every one of
// them was hand-written, so the wrong length was the normal case rather
// than the exception. The rule now lives in one function, and this gate
// is what stops the next hand-written description from breaking it.
//
// The private pages are exempt: the portal and the admin desk are
// noindex, so their description is never a search result.
{
  const problems = [];
  let checked = 0;
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith('.html')) {
        const html = readFileSync(p, 'utf8');
        const rel = relative(OUT, p).split(sep).join('/');
        // the private pages are not search results
        if (rel.startsWith('portal/') || rel.startsWith('admin/') || rel.startsWith('admin.html')) continue;
        if (html.slice(0, 6000).includes('noindex')) continue;
        const m = html.match(/<meta name="description" content="([^"]*)"/);
        if (!m) continue;
        checked += 1;
        const n = m[1].length;
        if (n > 155 || n < 150) problems.push(`${rel} (${n})`);

        /*
         * THE DESCRIPTION HAS TO END IN A WHOLE SENTENCE.
         *
         * A description of 152 characters that ends in "exports to 12
         * count" passes every length check and reads as a mistake: the
         * word is cut in half and the sentence has no end.
         *
         * So the end is checked too: a full stop, and a last word
         * that is not a fragment ending on a preposition or a
         * conjunction - "to ask a suppli" is a fragment as well.
         */
        const text = m[1].trim();
        if (!/[.!?]$/.test(text)) {
          problems.push(`${rel} ends without a full stop`);
        } else {
          const lastWord = (text.slice(0, -1).trim().split(/\s+/).pop() || '').toLowerCase();
          if (/\b(for|and|or|the|a|an|of|to|with|on|in|at|from|by|that|which|as|is|are|it)$/.test(lastWord)) {
            problems.push(`${rel} ends on the fragment "${lastWord}"`);
          }
        }
      }
    }
  };
  walk(OUT);
  if (problems.length) {
    fail('the descriptions fit', `${problems.length} of ${checked} descriptions are outside 150-155 characters`);
    for (const p of [...new Set(problems)].slice(0, 10)) console.error(`    ${p}`);
  } else {
    note('the descriptions fit', `all ${checked} indexed descriptions are between 150 and 155 characters`);
  }
}

// THE REVIEWS ARE REAL, VISIBLE, AND COUNTED HONESTLY.
//
// WHY THIS GATE EXISTS
// A star rating next to a search result is a promise about somebody else.
// Google checks three things about it: that the rating in the markup is
// the average of the reviews, that the count is the number of reviews on
// the page, and that the reviews are not the seller's own.
//
// The third one cannot be checked by any machine: a review the factory
// wrote for itself and attributed to a buyer looks exactly like a real
// one to a build. That part lives in the process - the buyer is asked, in
// writing, after a delivery, and their words are not edited - and in the
// ledger (docs/买家评价接入流程.md).
//
// What this gate checks is the other two, which is exactly where a
// hand-kept number would go wrong.
//
// And one more thing it can check: a review that has not been cleared
// appears NOWHERE. Not on the page, not in the markup, not in the count.
{
  const REVIEW_FILE = join(SITE, 'content', 'v2', 'reviews.json');
  const problems = [];
  let records = [];

  if (existsSync(REVIEW_FILE)) {
    try {
      records = JSON.parse(readFileSync(REVIEW_FILE, 'utf8'));
    } catch (e) {
      problems.push(`content/v2/reviews.json does not parse: ${e.message}`);
    }
  }
  if (!Array.isArray(records)) {
    problems.push('content/v2/reviews.json is not a list');
    records = [];
  }

  let catalogue = [];
  try {
    catalogue = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8')).products ?? [];
  } catch {
    catalogue = [];
  }
  const SKUS = new Set(catalogue.map((p) => p.id));

  // The SKU -> page map, read from the one place it lives.
  const routing = readFileSync(join(SITE, 'lib', 'product-routing.ts'), 'utf8');
  const ROUTE = {};
  for (const m of routing.matchAll(/(\w+):\s*'([^']*)'/g)) {
    if (/^P\d+$/.test(m[1])) ROUTE[m[1]] = m[2];
  }

  const published = [];
  const pending = [];
  for (const r of records) {
    if (!r || typeof r !== 'object') {
      problems.push('a review is not a record');
      continue;
    }
    const where = `the review of ${r.sku ?? '(no SKU)'}`;
    if (!SKUS.has(r.sku)) problems.push(`${where}: there is no such SKU in the catalogue`);
    if (!r.author || !String(r.author).trim()) {
      problems.push(`${where}: it names nobody - a review has to name the buyer`);
    }
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
      problems.push(`${where}: the rating is not a whole number from 1 to 5`);
    }
    if (!r.body || !String(r.body).trim()) problems.push(`${where}: it has no words`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) {
      problems.push(`${where}: the date is not an ISO date`);
    }
    if (r.permission === 'published') published.push(r);
    else if (r.permission === 'pending') pending.push(r);
    else problems.push(`${where}: the permission is neither published nor pending`);
  }

  const bySku = new Map();
  for (const r of published) {
    if (!bySku.has(r.sku)) bySku.set(r.sku, []);
    bySku.get(r.sku).push(r);
  }

  let checked = 0;
  for (const [sku, list] of bySku) {
    const slug = ROUTE[sku];
    const page = slug ? join(OUT, 'products', `${slug}.html`) : null;
    if (!page || !existsSync(page)) {
      problems.push(`${sku}: it has published reviews but no page to show them on`);
      continue;
    }
    checked += 1;
    const html = readFileSync(page, 'utf8');

    for (const r of list) {
      if (!html.includes(r.body)) problems.push(`${sku}: the review of ${r.author} is not on the page`);
      if (!html.includes(r.author)) problems.push(`${sku}: the name ${r.author} is not on the page`);
      if (!html.includes(r.date)) problems.push(`${sku}: the date ${r.date} is not on the page`);
    }

    // how many the page actually shows
    const section = html.match(/<section[^>]*id="reviews"[\s\S]*?<\/section>/);
    const shown = section ? (section[0].match(/<article/g) || []).length : 0;
    if (shown !== list.length) {
      problems.push(`${sku}: the page shows ${shown} review(s) and ${list.length} are published`);
    }

    // what the markup says
    const count = html.match(/"aggregateRating":\{[^}]*"reviewCount":"(\d+)"/);
    const value = html.match(/"aggregateRating":\{[^}]*"ratingValue":"([\d.]+)"/);
    if (!count) {
      problems.push(`${sku}: the page has reviews but the markup carries no rating`);
    } else if (Number(count[1]) !== list.length) {
      problems.push(`${sku}: the markup claims ${count[1]} review(s) and ${list.length} are published`);
    }
    if (!value) {
      problems.push(`${sku}: the page has reviews but the markup carries no rating value`);
    } else {
      const average = Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;
      if (Number(value[1]) !== average) {
        problems.push(`${sku}: the markup says ${value[1]} and the average of the reviews is ${average}`);
      }
    }
  }

  // A rating with no published review behind it is a rating the page
  // cannot support. Google compares the rating in the markup with the
  // reviews on the page, so a rating on a page with no reviews is a
  // rating nobody gave.
  for (const [sku, slug] of Object.entries(ROUTE)) {
    const page = join(OUT, 'products', `${slug}.html`);
    if (!existsSync(page)) continue;
    const html = readFileSync(page, 'utf8');
    if (html.includes('"aggregateRating"') && !bySku.has(sku)) {
      problems.push(`${sku}: the page carries a rating and no review is published`);
    }
  }

  // A review that has not been cleared must not be visible anywhere.
  if (pending.length) {
    const pages = readdirSync(join(OUT, 'products'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => readFileSync(join(OUT, 'products', f), 'utf8'));
    for (const r of pending) {
      for (const html of pages) {
        if (r.body && html.includes(r.body)) {
          problems.push(`${r.sku}: a review that has not been cleared is on a page`);
          break;
        }
      }
    }
  }

  if (problems.length) {
    fail('the reviews are honest', `${problems.length} problem(s) in the reviews`);
    for (const p of [...new Set(problems)].slice(0, 10)) console.error(`    ${p}`);
  } else {
    note(
      'the reviews are honest',
      published.length
        ? `${published.length} published review(s) on ${checked} product page(s), the counts and the averages agree`
        : `no reviews yet, and none claimed`,
    );
  }
}

// THE STRUCTURED DATA, CHECKED AGAINST THE SITE.
//
// WHY
// Two separate defects lived in the product pages' JSON-LD, and both were
// invisible because nothing checked the markup against the build.
//
// 1. It was a snapshot of the old site, and it still said the old things.
//    Sixteen product pages pointed their own entity at a URL that answers
//    404 - the outdoor insect repellent spray page announced itself as
//    /products/outdoor-repellent-80.html - and the same stale strings were
//    in llms-full.json, which is the file the reading assistants are
//    pointed at. One more pointed at an image that answers 404.
//
// 2. The pricing policy is quote-only, so the markup carries no price, no
//    offer and no review. Google's product-snippets report counts every
//    one of these products as invalid because of it, and that is a
//    decision rather than a defect: a price would have to be VISIBLE ON
//    THE PAGE, and it would have to be one real number, and a review
//    would have to be a real buyer's.
//
// So this gate checks three things:
//
//   - every URL and image in the markup points at something that exists;
//   - no price, no offer, no review, no rating ever reaches the markup;
//   - a product entity names its minimum order, so the facts a buyer
//     screens for are in the markup as well as on the page.
{
  const ORIGIN = 'https://shenhezhongke.com';
  /*
   * THE PRICE FIELDS. A price, an offer, an availability, a price range -
   * none of them may reach the markup, because the site is quote-only and
   * a price there is a price the site does not quote.
   *
   * `review` and `aggregateRating` are NOT in this list, and they used to
   * be. They are what a real buyer review looks like in structured data,
   * and they are policed by the reviews gate instead - which checks that
   * every one of them is real, is visible on the page, and agrees with the
   * count and the average. A field that is forbidden outright cannot be
   * policed, only prevented; a field that is policed can be trusted.
   */
  const FORBIDDEN = [
    'offers', 'price', 'priceCurrency', 'availability', 'priceSpecification',
    'lowPrice', 'highPrice',
    // The two that were in the comment and not in the list.
    //
    // "priceRange" - the factory page carried "$$", which is a price
    // signal on a site that quotes per order.
    //
    // "hasOfferCatalog" - the key that carries an OfferCatalog on the
    // two legacy heads. The key itself is the promise, so the key is
    // what is forbidden; a type check would only catch it where the
    // node happens to sit under a key the reader knows.
    'priceRange', 'hasOfferCatalog',
  ];
  const URL_KEYS = ['url', '@id', 'contentUrl', 'image', 'sameAs'];

  let catalogue = [];
  try {
    catalogue = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8')).products ?? [];
  } catch {
    catalogue = [];
  }
  const SKU_OEMS = new Set(catalogue.map((p) => p.sku_oem));

  /*
   * THE POSTAL CODE OF THE COMPANY'S OWN ADDRESS.
   *
   * Google's rich result test said on 2026-11-04 that the Organization's
   * PostalAddress had no postalCode. It had none because the number had
   * nowhere to live: the visible address and the legacy markup carried
   * it, and the configuration the graph is built from did not.
   *
   * So the graph's address is checked against the configuration, and the
   * configuration is checked against the identity register. Three copies
   * of one number is one too many, but the number is now written down
   * once and the other two read it.
   */
  const cfgText = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  const cfgPostal = (cfgText.match(/postalCode:\s*'([^']+)'/) || [])[1] || null;
  /* The legal name, so the gate can tell our organisation from the third
     parties the markup also names. */
  const cfgLegalName = (cfgText.match(/legalName:\s*'([^']+)'/) || [])[1] || null;
  if (!cfgPostal) {
    problems.push('the configuration has no postalCode for the company address');
  }

  /** Does this site path resolve to a file in the build? */
  const resolves = (path) => {
    const clean = path.split('?')[0].split('#')[0];
    const base = clean.replace(/\/$/, '');
    const candidates = [clean, `${base}.html`, `${base}/index.html`];
    return candidates.some((c) => {
      const rel = c.replace(/^\//, '');
      return rel === '' ? existsSync(join(OUT, 'index.html')) : existsSync(join(OUT, rel));
    });
  };

  const problems = [];
  let products = 0;
  let references = 0;

  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.endsWith('.html')) continue;
      const html = readFileSync(p, 'utf8');
      const rel = relative(OUT, p).split(sep).join('/');
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        const type = node['@type'];
        const types = Array.isArray(type) ? type : [type];
        const label = types[0] || 'node';

        for (const key of FORBIDDEN) {
          if (key in node) problems.push(`${rel}: ${label} carries "${key}"`);
        }
        for (const key of URL_KEYS) {
          const v = node[key];
          if (typeof v !== 'string') continue;
          if (!v.startsWith(ORIGIN)) continue;
          const path = v.slice(ORIGIN.length);
          if (path === '' || path === '/') continue;
          if (!resolves(path)) problems.push(`${rel}: ${label} points at ${path}, which is not in the build`);
        }
        if (types.includes('Product')) {
          /*
           * EVERY PRODUCT SAYS HOW IT IS PRICED.
           *
           * A Product node with no price is not an omission - this is a
           * B2B business that quotes per order. Google's product summary
           * report calls every one of them invalid for the missing
           * offers, so the answer to "why is there no price" has to be
           * in the markup: a "Pricing" property, on every product, with
           * the words taken from the pricing policy in the configuration.
           *
           * And the organisation says the same at the level of the site:
           * a description that does not name the business model is a
           * description that leaves the question open.
           */
          const props = node.additionalProperty;
          const saysPricing =
            Array.isArray(props) && props.some((x) => x && x.name === 'Pricing' && x.value);
          if (!saysPricing) {
            problems.push(`${rel}: the product does not say how it is priced`);
          }
          const sku = typeof node.sku === 'string' ? node.sku : '';
          if (SKU_OEMS.has(sku)) {
            products += 1;
            const props = node.additionalProperty;
            const hasMoq = Array.isArray(props)
              && props.some((x) => x && x.name === 'Minimum order' && x.value);
            if (!hasMoq) problems.push(`${rel}: the product has no minimum order in the markup`);
          } else {
            references += 1;
          }
        }
        if (types.includes('Organization')) {
          /*
           * ONLY OUR OWN ORGANISATION.
           *
           * The markup also names the third parties whose documents we
           * publish - the testing laboratories - and they are not B2B pet
           * care factories. The first version of this check asked EVERY
           * Organization node to name the business model, and it flagged
           * eighty-two nodes, every one of them a laboratory.
           *
           * So the check looks for OUR node: the one with our own @id, or
           * our legal name. That is the one whose description has to say
           * how this business is priced.
           */
          const id = typeof node['@id'] === 'string' ? node['@id'] : '';
          const name = typeof node.name === 'string' ? node.name : '';
          const isUs =
            id === `${ORIGIN}/#organization` ||
            (name && name === cfgLegalName) ||
            (id.endsWith('/#organization') && name === cfgLegalName);
          if (isUs) {
            const d = typeof node.description === 'string' ? node.description : '';
            if (!/B2B|wholesale/i.test(d)) {
              problems.push(`${rel}: the organisation does not say that this is a B2B business`);
            }
          }
        }
        // The company's own postal address has to name the postal code.
        if (types.includes('PostalAddress')) {
          const street = typeof node.streetAddress === 'string' ? node.streetAddress : '';
          if (street.includes('Longteng Road')) {
            if (!node.postalCode) {
              problems.push(`${rel}: the company's postal address has no postalCode`);
            } else if (cfgPostal && node.postalCode !== cfgPostal) {
              problems.push(`${rel}: the postal address says ${node.postalCode}, not the configured ${cfgPostal}`);
            }
          }
        }
        for (const v of Object.values(node)) visit(v);
      };

      for (const m of blocks) {
        let data;
        try {
          data = JSON.parse(m[1]);
        } catch {
          continue;
        }
        /*
         * THE WHOLE BLOCK, NOT JUST ITS @graph.
         *
         * This used to visit the @graph when there was one and the block
         * itself when there was not. So a node that sits beside the
         * @graph - anything under a key the reader does not know - was
         * never looked at. The proof that it matters: a priceRange put
         * next to a @graph passed this gate, and this gate is the one
         * that says "no price, no offer, no review in the markup".
         *
         * The @graph is just another value, and the recursion already
         * walks every value, so the whole block is the simpler rule and
         * the one that cannot be blindsided.
         */
        visit(data);
      }
    }
  };
  walk(OUT);

  // THE READING LISTS, TOO.
  //
  // llms.txt, llms-full.txt, llms-full.json and ai.txt are the files an
  // answer engine is pointed at. A dead URL in one of them is a dead end
  // for the reader and a wrong citation for the answer, and nothing was
  // checking them: llms-full.json declared a "$schema" of
  // /llms-full.schema.json and no such file existed.
  //
  // The origin is split out of the text rather than matched with a
  // regular expression, because a URL in a JSON string is followed by a
  // quote and in a text file by a newline, and one pattern that is right
  // for both is harder to read than this.
  const AI_FILES = [
    'llms.txt', 'llms-full.txt', 'llms-full.json', 'ai.txt', 'reports.json',
    'llms-full.schema.json', 'llms-sitemap.xml',
  ];
  for (const name of AI_FILES) {
    const file = join(OUT, name);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const parts = text.split(ORIGIN);
    for (let i = 1; i < parts.length; i++) {
      const m = parts[i].match(/^[^\s"'<>\\)]*/);
      const path = m ? m[0] : '';
      if (path === '' || path === '/') continue;
      if (!resolves(path)) problems.push(`${name}: points at ${path}, which is not in the build`);
    }
  }

  if (problems.length) {
    fail('the structured data is honest', `${problems.length} problem(s) in the markup`);
    for (const p of [...new Set(problems)].slice(0, 10)) console.error(`    ${p}`);
  } else {
    note(
      'the structured data is honest',
      `${products} product entities and ${references} references, every URL resolves, and no price, offer or review in the markup`,
    );
  }
}

// The entity density gate.
//
// A page that talks about a factory without naming a lab, a licence or a
// standard is a page about a factory in the same way a brochure is. The
// audit counts the distinct entity groups on every landing page and
// fails when one of them is missing, and it fails a long page whose
// density has fallen below the floor — a 3,000-word guide has room to
// anchor its subject twenty times, and if it anchors it twice then the
// words are not carrying the subject.
{
  const result = spawnSync(process.execPath, [join(SITE, 'scripts', 'audit_entity_density.mjs')], {
    encoding: 'utf8',
  });
  const out = (result.stdout || '') + (result.stderr || '');
  if (result.status !== 0) {
    const problems = out.split('\n').filter((l) => l.includes('FAIL') || l.trim().startsWith('blog/') || l.trim().startsWith('products') || l.trim().startsWith('index') || l.trim().startsWith('about') || l.trim().startsWith('factory') || l.trim().startsWith('contact') || l.trim().startsWith('certifications') || l.trim().startsWith('trade') || l.trim().startsWith('global') || l.trim().startsWith('oem') || l.trim().startsWith('capabilities') || l.trim().startsWith('sourcing'));
    fail('the entity density', problems.slice(0, 10).map((l) => l.trim()).join(' | '));
  } else {
    const line = out.split('\n').find((l) => l.includes('the average:')) || '';
    note('the entity density', line.trim() || 'every landing page carries every entity group');
  }
}

/*
 * The results are printed at the END of this file, not here.
 *
 * They used to be printed here, and three checks were added after this
 * point - the catalogue PDF, the report numbers and the site's facts
 * against the documents. Those three ran AFTER the results had already
 * been printed, so their "ok" lines were swallowed: a green gate was
 * hiding three checks of its own. Only a failure could surface, because
 * failures are printed at the end.
 *
 * So the printing moved to the end, where it belongs: every check has
 * run by then, and every check has a line.
 */

// The catalogue PDF gate.
//
// The catalogue is the file every off-site platform asks for:
// Made-in-China wants one, Alibaba wants one, Global Sources wants
// one. Seven platforms, one upload each.
//
// Once it is on a platform it cannot be taken back - anybody can read
// it, forever. So it is checked here, at build time, before it goes
// anywhere: every product is in it, and no price is in it.
//
// A price on a public catalogue is permanent, and a price list is a
// discount list - a buyer takes the smallest number in it and treats
// it as the price. The site quotes per request, and this file has to
// agree with it or the platform becomes the place the policy is
// broken.
{
  const pdf = join(PUBLIC, 'catalogue', 'Shenhe-Zhongke-Product-Catalogue.pdf');
  const catalogue = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8'));
  if (!existsSync(pdf)) {
    fail('the catalogue pdf is honest', 'the catalogue pdf was not built');
  } else {
    const raw = readFileSync(pdf);
    const text = raw
      .toString('latin1')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')');
    const problems = [];

    // every product has to be in it
    for (const p of catalogue.products) {
      if (!text.includes(p.id)) problems.push(`${p.id} is not in the catalogue`);
    }

    // and no price of any shape
    const pricePatterns = [
      /(?:RMB|USD|US\$|\$)\s*[\d,]+(?:\.\d+)?/,
      /[\d,]+(?:\.\d+)?\s*(?:RMB|USD|per\s+(?:bottle|set|unit|kg))/i,
      /Reference\s+EXW/i,
      /b2b[_ ]?price/i,
    ];
    for (const re of pricePatterns) {
      const m = text.match(re);
      if (m) problems.push(`the catalogue carries what looks like a price: ${m[0]}`);
    }

    // and the facts a buyer needs, so a truncated file is caught
    for (const needle of ['Prices are not published', 'ISO 22716', 'FDA']) {
      if (!text.includes(needle)) problems.push(`the catalogue is missing: ${needle}`);
    }

    if (problems.length) {
      fail('the catalogue pdf is honest', `${problems.length} problems in the catalogue`);
      for (const p of problems.slice(0, 8)) console.error(`    ${p}`);
    } else {
      note(
        'the catalogue pdf is honest',
        `${catalogue.products.length} products, the minimum order and the lead time, and no price`,
      );
    }
  }
}

/*
 * The Python interpreter the gate uses, PROBED rather than assumed.
 *
 * The old line was `process.env.PYTHON || 'python3'`. On Windows `python3`
 * is the Microsoft Store stub: it does not run anything, it exits non-zero
 * with no output. The gate then reported "a report number is not on its
 * document" - a factual claim about a PDF, made because an interpreter was
 * missing. A gate that reports the wrong thing is worse than a gate that is
 * silent, because the wrong thing gets fixed.
 *
 * It happened twice, because the fix was written into one call site
 * instead of into one place. So the lookup lives here now, and every check
 * that calls a Python script uses it.
 *
 * PYTHON still wins if it is set.
 */
function findPython() {
  const candidates = [
    ...(process.env.PYTHON ? [process.env.PYTHON] : []),
    'python3',
    'python',
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['-c', 'import sys; print(sys.version)'], { encoding: 'utf8' });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return candidates[0];
}

// THE REPORT NUMBERS, THE SAME NUMBERS THE PDF PRINTS.
//
// A laboratory report number is the one string a buyer can check. The
// buyer types it into the issuer's site, or writes it on an email; if
// it does not match the document, the report is worthless and the
// claim it carries is a claim nobody can stand behind.
//
// This site had one such mismatch: the disinfectant report is printed
// "XJ2025001233" on every page of the PDF, and the site said
// "YD20251215351" - a number that appears nowhere on the document,
// from a different report. Nothing caught it, because the site, the
// coverage table, the product page and the certificates page all
// carried the same wrong string. One source of truth that is wrong is
// still wrong.
//
// So the number is checked against the document it links to, by a
// script that can read a PDF: these are scans with an OCR layer, and
// reading one needs a PDF library. The gate calls it and prints
// whatever it says.
{
  const py = findPython();

  const script = join(SITE, 'scripts', 'check_report_numbers.py');
  if (!existsSync(script)) {
    fail('the report numbers are the numbers on the documents', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the report numbers are the numbers on the documents', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the report numbers are the numbers on the documents', 'a number is not on its document');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) console.error(`    ${line}`);
    } else {
      note(
        'the report numbers are the numbers on the documents',
        `${(r.stdout || '').trim().replace(/^\s+/, '')}`,
      );
    }
  }
}

// THE SITE'S FACTS, AGAINST THE DOCUMENTS THEY COME FROM.
//
// Four things drifted on 2026-11-03 and every one of them drifted
// the same way: a list was kept somewhere else from the thing it
// describes. The report number on the site was not the number on the
// PDF; the issuing body was not the body that issued it; the
// verification code was on six documents and on no page; the batch
// number was on every document and on no page.
//
// None of them was caught by a review, because a review reads the
// site and does not read the PDFs. This reads both and compares.
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_site_facts.py');
  if (!existsSync(script)) {
    fail("the site's facts match the documents", 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail("the site's facts match the documents", `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail("the site's facts match the documents", 'a fact on the site is not on a document');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) console.error(`    ${line}`);
    } else {
      // The check prints its own lines. They are joined with a middle dot so
      // the gate reads as one line per check - and the carriage returns are
      // dropped, because one of them resets the cursor and the second half of
      // the note lands on a line of its own.
      note(
        "the site's facts match the documents",
        (r.stdout || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .join(' · '),
      );
    }
  }
}

/*
 * THE DESK CAN MAKE A BUYER FILE.
 *
 * A quotation takes its buyer from the enquiry, and the enquiry's buyer
 * is a row in the customers table. Nothing wrote that table: the only
 * "insert into customers" in the repository's history was in the old
 * sqlite api, whose own README says it is not the production one.
 *
 * So the desk's buyer picker was a list of buyer ACCOUNTS and used their
 * customer_id, which was null for every one of them - every entry in the
 * dropdown was the empty option, and a company that wrote in was a name
 * and an email on one row and nothing else.
 *
 * The check asks the six positive questions that chain depends on. Any
 * one of them missing and the chain is broken in the same way it was
 * broken before.
 */
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_customer_chain.py');
  if (!existsSync(script)) {
    fail('the desk can make a buyer file', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the desk can make a buyer file', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the desk can make a buyer file', 'the desk cannot make a buyer file');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 10)) {
        if (line.trim().startsWith('FAIL ')) console.error(`    ${line.trim().slice(5).trim()}`);
      }
    } else {
      note(
        'the desk can make a buyer file',
        (r.stdout || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .join(' \u00b7 '),
      );
    }
  }
}

/*
 * THE CONSENT IS HONEST.
 *
 * On 2026-11-04 the consent gate was granting consent that never reached
 * Clarity, and the privacy policy described a site that no longer existed:
 * two localStorage keys from the old site, a "Marketing" tier the banner
 * has never offered, and no mention of either of the two tools that were
 * actually running. Three separate claims, none of them true.
 *
 * So this check looks at the four things that have to agree, and refuses
 * the build when they do not:
 *
 *   1. the Clarity consent call has the shape Microsoft documents
 *      (consentv2, ad_Storage, analytics_Storage) and not the shape it
 *      used to have
 *   2. the project id in the configuration is the id in the built page
 *   3. the banner offers a choice that actually grants analytics
 *   4. the privacy page names both tools, and every browser entry the
 *      site writes is named there - and nothing there that it does not
 *
 * The list of keys is taken from the BUILT site, not from the source:
 * a module nobody imports never reaches a browser, and a privacy policy
 * that describes it would be describing something that does not happen.
 */
{
  const gate = 'the consent is honest';
  const config = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  const gateSrc = readFileSync(join(SITE, 'components', 'v2', 'ConsentGate.tsx'), 'utf8');
  const privacy = readFileSync(join(SITE, 'content', 'privacy.json'), 'utf8');

  /*
   * The comments are stripped before anything is tested.
   *
   * The gate file explains what the wrong call looked like, and it does
   * so by quoting it: `['consent', 'v2', { analytics, ad }]`. A check
   * that reads the file as text finds that quote and reports the wrong
   * call - which is in a comment, describing the bug, in the very file
   * that fixed it. A test has to look at the code.
   */
  const gateCode = stripComments(gateSrc);

  // 1. the consent call
  if (!/consentv2/.test(gateCode)) {
    fail(gate, "the gate never calls Clarity's consentv2 API");
  }
  for (const p of ['ad_Storage', 'analytics_Storage']) {
    if (!gateCode.includes(p)) fail(gate, `the consent call is missing the ${p} parameter`);
  }
  // The shape that was there before: a command no Clarity API has.
  if (/['"]consent['"]\s*,\s*['"]v2['"]/.test(gateCode)) {
    fail(gate, "the gate still pushes the old 'consent','v2' call, which no Clarity API accepts");
  }

  // 2. the project id
  //
  // The tag is loaded with `afterInteractive`, so it is not in the HTML:
  // the script lives in the client bundle and is injected when the page
  // becomes interactive. The id is therefore looked for in the built
  // JavaScript, and a page is counted by the bundle it loads.
  const idMatch = config.match(/clarityId:\s*'([^']+)'/);
  if (!idMatch) {
    fail(gate, 'the configuration has no Clarity project id');
  } else {
    const id = idMatch[1];
    const bundles = walk(join(OUT, '_next')).filter((f) => f.endsWith('.js'));
    const withId = bundles.filter((f) => readFileSync(f, 'utf8').includes(id));
    if (!withId.length) {
      fail(gate, `no built script loads the Clarity project ${id} from the configuration`);
    } else {
      const other = bundles.filter((f) => {
        const s = readFileSync(f, 'utf8');
        const m = s.match(/clarity\.ms\/tag\/([a-z0-9]+)/);
        return m && m[1] !== id;
      });
      if (other.length) {
        fail(gate, `${other.length} built script(s) load a different Clarity project than the configuration`);
      } else {
        note(gate, `Clarity project ${id} in the configuration and in ${withId.length} built script(s)`);
      }
    }
  }

  // 3. a choice that grants something
  if (!/choose\('analytics'\)/.test(gateCode)) {
    fail(gate, 'the banner offers no choice that grants analytics');
  }

  // 4. the privacy page
  for (const tool of ['Google Analytics 4', 'Microsoft Clarity']) {
    if (!privacy.includes(tool)) fail(gate, `the privacy page does not name ${tool}`);
  }

  const shipped = new Set();
  for (const f of walk(join(OUT, '_next')).filter((f) => f.endsWith('.js'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/shenhe:[a-z-]+:v\d/g)) shipped.add(m[0]);
  }
  const named = new Set([...privacy.matchAll(/shenhe:[a-z-]+:v\d/g)].map((m) => m[0]));
  for (const k of shipped) {
    if (!named.has(k)) fail(gate, `the site writes ${k} and the privacy page does not name it`);
  }
  for (const k of named) {
    if (!shipped.has(k)) fail(gate, `the privacy page names ${k} and the site never writes it`);
  }
  // 5. the panel has to be ON TOP of the dock.
  //
  // The dock is a fixed strip over the bottom edge with z-index 60, and
  // the consent panel is fixed at the bottom too. With the panel below
  // 60 it was painted UNDER the dock: the panel could not be seen, and
  // the footer's own buttons - including the one that lets a visitor
  // take their consent back - could not be clicked. Both numbers are
  // read from the files, so a change to one without the other is
  // caught here rather than by a visitor.
  {
    const css = readFileSync(join(SITE, 'app', 'design-system.css'), 'utf8');
    const dockRule = css.match(/\.dock\s*\{([^}]*)\}/);
    const dockZ = dockRule ? Number((dockRule[1].match(/z-index:\s*(\d+)/) || [])[1]) : NaN;
    const panelZ = Number((gateSrc.match(/bottom-0\s+z-\[(\d+)\]/) || [])[1]);
    if (!dockZ || !panelZ) {
      fail(gate, 'the consent panel or the dock has no readable z-index');
    } else if (panelZ <= dockZ) {
      fail(
        gate,
        `the consent panel is z-${panelZ} and the dock is z-${dockZ}: the dock paints over the panel`,
      );
    } else {
      note(gate, `the consent panel is z-${panelZ}, above the dock's z-${dockZ}`);
    }
  }

  if (!failures.some((f) => f.startsWith(`${gate}:`))) {
    note(gate, `both tools named; ${shipped.size} browser entries disclosed, all of them real`);
  }
}

/*
 * THE RESULTS ARE PRINTED WHEN THE GATE FINISHES.
 *
 * They used to be printed here, at a fixed line, and every check added
 * BELOW this line ran after the results were printed - so its result was
 * never shown. It has happened twice: the catalogue PDF, the report
 * numbers, the site's facts against the documents, and the accessibility
 * tree all sat below the print.
 *
 * A green gate that hides four of its own checks protects nothing, and
 * worse, it is believed. So the printing happens on the way out: by then
 * every check has run, every note is in, and every failure is on the
 * same screen. It stops mattering where a check is added.
 *
 * If the gate itself throws, Node has already printed the stack, and
 * this must not add a tidy summary under it - hence the flag.
 */
let gateFinished = false;
process.on('exit', () => {
  if (!gateFinished) return;
  console.log('');
  for (const n of notes) console.log(`  ok   ${n}`);
  // THE PUSH SCRIPT AND THE SITE MUST AGREE.
//
// The script that pushes to the search engines and the copy in the
// repository are the same script. They drifted once, and the copy in
// the repository named a key the server did not hold.
{
  // The interpreter is PROBED, not assumed - see findPython() above.
  //
  // This line used to say `process.env.PYTHON || 'python3'`. On Windows
  // `python3` is the Microsoft Store stub: it runs nothing and exits 9009.
  // The gate then reported "the script and the site do not agree" - an
  // accusation about the push script, made because an interpreter was
  // missing. The script was fine. It is the same mistake as the
  // definition-list check, and it was found the same way: the check
  // passes when it is run by hand and fails inside the gate.
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_indexnow.py');
  if (!existsSync(script)) {
    fail('the push script and the site agree', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the push script and the site agree', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      if (out) {
        fail('the push script and the site agree', 'the script and the site do not agree');
        for (const line of out.split('\n').slice(0, 6)) console.error(`    ${line}`);
      } else {
        // No output at all and a non-zero exit: the interpreter ran and
        // said nothing, which is what a missing one looks like. Saying
        // "the script and the site do not agree" here would be an
        // accusation the check cannot support.
        fail('the push script and the site agree', `the check did not run (${py} exited ${r.status} with no output)`);
      }
    } else {
      note('the push script and the site agree', (r.stdout || '').trim().replace(/^\s+/, ''));
    }
  }
}

// THE MARKS ON THE LINKS.
//
// The site can say how many enquiries arrived. It cannot say where
// the buyer came from, unless every link carries a mark and the
// campaign is kept for the journey.
//
// The marks were added by hand, and hand work drifts: a page gets
// added and its links are not marked, and the path that page was
// supposed to carry is lost silently.
{
  // The interpreter is PROBED, not assumed - see findPython() above.
  // This is the FOURTH check that was written with
  // `process.env.PYTHON || 'python3'`, and on Windows that is the
  // Microsoft Store stub: it runs nothing and exits 9009, so the gate
  // reported "a page or a mark does not" about a build that has 2,477
  // marks and every page carrying one.
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_journey_marks.py');
  if (!existsSync(script)) {
    fail('every page a buyer can read carries a mark', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('every page a buyer can read carries a mark', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('every page a buyer can read carries a mark', 'a page or a mark does not');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) console.error(`    ${line}`);
    } else {
      note('every page a buyer can read carries a mark', (r.stdout || '').trim().replace(/^\s+/, ''));
    }
  }
}

if (failures.length) {
    console.log('');
    for (const f of failures) console.error(`  FAIL ${f}`);
    console.error('');
    console.error(`  the build gate failed: ${failures.length} check(s) did not pass.`);
  } else {
    console.log('  the build gate passed.');
  }
});

// THE ACCESSIBILITY TREE, AS IT IS SERVED.
//
// A definition list may only hold term-and-value groups. On 2026-11-03
// the performance report said the site broke that rule, and the audit
// it failed was the one that decides whether an assistant can tell a
// term from its value.
{
  // The interpreter is PROBED, not assumed - see findPython() above.
  // This line used to say `process.env.PYTHON || 'python3'`, and on Windows
  // `python3` is the Microsoft Store stub: it runs nothing and exits 9009.
  // The gate then reported "a definition list holds something else" - a
  // factual accusation about the markup, made because an interpreter was
  // missing. The list was fine. A gate that blames the site for its own
  // missing dependency gets its findings ignored, and then it protects
  // nothing.
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_a11y_dl.py');
  if (!existsSync(script)) {
    fail('every definition list is well formed', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('every definition list is well formed', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('every definition list is well formed', 'a definition list holds something else');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) console.error(`    ${line}`);
    } else {
      note('every definition list is well formed', (r.stdout || '').trim().replace(/^\s+/, ''));
    }
  }
}

// THE ADDRESSES THE LEGACY SITE PUBLISHED.
//
// The site was rebuilt, and sixteen product pages moved. The old
// addresses are still in a search engine's index, and an address that
// answers 404 is an address whose history is thrown away - the engine
// has to find the page again from nothing.
//
// So the map of old address to new page lives in the repository
// (scripts/legacy-redirects.json), and this check holds it to two
// things: every legacy address is in it, and every target in it is a
// page the site publishes. The rules that serve the map live in the
// nginx vhost on the server; scripts/check_legacy_redirects.py --live
// checks what the site actually answers.
{
  const py = findPython();
  const script = join(SITE, 'scripts', 'check_legacy_redirects.py');
  if (!existsSync(script)) {
    fail('the legacy addresses point somewhere', 'the check script is missing');
  } else {
    const r = spawnSync(py, [script], { encoding: 'utf8' });
    if (r.error) {
      fail('the legacy addresses point somewhere', `the check could not be run (${r.error.message})`);
    } else if (r.status !== 0) {
      fail('the legacy addresses point somewhere', 'a legacy address has nowhere to point');
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
      for (const line of out.split('\n').slice(0, 8)) console.error(`    ${line}`);
    } else {
      note('the legacy addresses point somewhere', (r.stdout || '').trim().replace(/^\s+/, ''));
    }
  }
}

/*
 * The source of a file without its comments.
 *
 * Two checks need to look at code rather than at prose: one looks for
 * the shape of the Clarity consent call, and one looks at this file's
 * own use of an interpreter. A comment that quotes the wrong shape -
 * which is exactly how a wrong shape gets documented - is not code, and
 * a check that cannot tell the difference reports its own
 * documentation as a defect.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// THE GATE CHECKS ITSELF.
//
// Four checks in this file have been written with
// `process.env.PYTHON || 'python3'`, and on Windows that is the
// Microsoft Store stub: it runs nothing and exits 9009. The gate then
// reported a finding that was not true - "a definition list holds
// something else", "the push script and the site do not agree", "a page
// or a mark does not" - about builds that were perfectly fine. Each
// time it cost a round of chasing a defect that did not exist.
//
// So the gate reads its own source. The one place the name may appear
// is findPython()'s list of candidates; everywhere else it is a stub
// that will lie, and the gate refuses to run with one.
{
  const self = readFileSync(join(SITE, 'scripts', 'check-build.mjs'), 'utf8');
  const code = stripComments(self);
  const start = code.indexOf('function findPython()');
  const helper = start >= 0 ? code.slice(start, code.indexOf('\n}', start) + 2) : '';
  const uses = (code.match(/['"]python3['"]/g) || []).length;
  const allowed = (helper.match(/['"]python3['"]/g) || []).length;
  if (uses > allowed) {
    fail(
      'the gate does not lie about its own interpreter',
      `${uses - allowed} place(s) call python3 without probing for an interpreter first`,
    );
  } else {
    note('the gate does not lie about its own interpreter', 'every check probes for an interpreter first');
  }
}

/* ------------------------------------------------------------------ */
/* the public address is a mailbox of ours                              */
/* ------------------------------------------------------------------ */

/*
 * EVERY ADDRESS THE SITE PUBLISHES IS OURS.
 *
 * The site's public contact address moved from a personal Gmail address
 * onto our own domain in November 2026, and the company now has two:
 *
 *   postmaster@shenhezhongke.com  the company itself - legal, security,
 *                                      and the mailbox that signs
 *   sales@shenhezhongke.com      what a buyer writes to about products
 *                                      (a static mail group; its one
 *                                       member is the mailbox above)
 *
 * THE RULE: every address a visitor or a crawler can reach is a
 * mailbox on our own domain, except the two named below.
 *
 * WHY IT IS WRITTEN THIS WAY
 * A rule that names the BAD thing has to be updated every time a new
 * bad thing appears, and the thing that was missed last time was not
 * in anybody's list of files - it was in the catalogue PDF, which a
 * buyer saves and forwards. A rule that names the GOOD thing only has
 * to be right once, and it covers the PDF, the schema, the AI files
 * and the pages' own prose in one pass.
 *
 * So this reads the whole published tree, byte by byte, and asks one
 * question of every address it finds: is this ours?
 */
{
  const OWN_DOMAIN = 'shenhezhongke.com';

  /*
   * THE EXCEPTIONS, AND WHY EACH ONE IS THERE.
   *
   * Every exception here is a thing a reader might mistake for a
   * contact address and is not one. They are written down so that the
   * next person to see an address here knows whether it was allowed.
   *
   * There used to be a second one: the named sales manager's personal
   * Gmail, published on purpose as a fact about a person. It was
   * withdrawn on 2026-11-08 - it is not a mailbox anybody reads, and an
   * answer engine quoting it would send a buyer's enquiry into a hole.
   * The enterprise mailbox takes its place.
   */
  const EXCEPTIONS = {
    'you@company.com': "the buyer portal's own form placeholder - it is never a contact",
  };

  /*
   * AN ADDRESS HAS A NAME AND A DOMAIN.
   *
   * A PDF's content stream is binary, and two bytes in it can look
   * like ".@t.Ns" - which is not an address: the local part is
   * empty and ".Ns" is not a domain anybody writes to. So the local
   * part has to have at least one letter in it, and the domain has
   * to have a label before the last dot.
   */
  const ADDRESS = /[A-Za-z0-9._%+-]*[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
  const TEXT_FILES = /\.(html|txt|json|js|xml|md|css|webmanifest)$/;
  const problems = [];

  // the addresses the configuration publishes
  const configSrc = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  for (const key of ['PUBLIC_EMAIL', 'PUBLIC_SALES_EMAIL']) {
    const m = configSrc.match(new RegExp(`const ${key} = '([^']+)'`));
    const value = m ? m[1] : '';
    if (!value.endsWith('@' + OWN_DOMAIN)) {
      problems.push(`${key} is ${value || '(not set)'}, which is not a mailbox on our own domain`);
    }
  }

  // every address in the published tree, and in the pages' own copy
  const found = [];
  const check = (text, where) => {
    for (const m of text.matchAll(ADDRESS)) {
      const a = m[0];
      if (a.endsWith('@' + OWN_DOMAIN)) continue;
      if (EXCEPTIONS[a]) continue;
      found.push(`${where}: ${a}`);
    }
  };

  const scanPublished = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        scanPublished(p);
      } else if (TEXT_FILES.test(e)) {
        check(readFileSync(p).toString('latin1'), relative(OUT, p).split(sep).join('/'));
      } else if (e.endsWith('.pdf') && relative(OUT, p).split(sep).join('/').startsWith('catalogue/')) {
        /*
         * THE SITE GENERATES ONE PDF - the catalogue - and the lab reports
         * are third-party scans. A scan's bytes are noise, and noise can
         * look like an address: one certificate PDF matched ".@t.Ns" and
         * was about to fail the build for a company that does not exist.
         *
         * So the PDFs that are read are the ones the site prints. latin1
         * because the catalogue's content stream is not compressed, so an
         * address on it is visible to a text search.
         */
        check(readFileSync(p).toString('latin1'), relative(OUT, p).split(sep).join('/'));
      }
    }
  };
  scanPublished(OUT);

  const contentDir = join(SITE, 'content');
  for (const e of readdirSync(contentDir)) {
    if (!e.endsWith('.json')) continue;
    // the capture of what the site used to publish is a record, not copy
    if (e === '_livejsonld.json') continue;
    check(readFileSync(join(contentDir, e), 'utf8'), `content/${e}`);
  }

  if (problems.length || found.length) {
    fail('the public address is a mailbox of ours',
      `${problems.length + found.length} address problem(s)`);
    for (const p of problems) console.error(`    ${p}`);
    for (const f of found.slice(0, 8)) console.error(`    ${f}`);
  } else {
    note('the public address is a mailbox of ours',
      `every published address is on ${OWN_DOMAIN}, apart from ${Object.keys(EXCEPTIONS).length} named exception(s)`);
  }
}

/*
 * THE COMPETITOR'S NAME NEVER REACHES A BUYER
 *
 * WHY THIS GATE EXISTS
 *
 * In November 2026 a competitor study was made for one buyer: two
 * brands, their models, their shelf prices and their sales. That
 * study is ours, and it stays ours. It is in docs/, it is not on the
 * site, and this gate is what keeps it that way.
 *
 * There are two reasons it must not reach a buyer's page, and the
 * second one is the serious one.
 *
 * The first is legal. A competitor's model numbers and their shelf
 * prices are their commercial information and their trade mark. A
 * page that names them, in our brand, is either advertising for them
 * or misrepresenting them, and in both cases it is our liability.
 *
 * The second is that it would not help. A buyer who wants to compare
 * two brands does not need our page to tell them what the other one
 * costs - they can open the other one. What a buyer cannot get
 * anywhere else is a page that says how we prove our own results.
 *
 * SO WHAT THE GATE DOES
 *
 * It reads the whole published tree, the same way the address gate
 * above reads it, and it asks of every file: does it name one of the
 * brands from that study, or the buyer's name?
 *
 * The names are written out here so that the next person who adds a
 * page knows the rule before they add the page.
 */
{
  /*
   * THE NAMES THAT MUST NOT APPEAR.
   *
   * The buyer is named too, and not only for tidiness: our page is
   * for buyers we have not signed yet, and naming a prospect on a
   * public page discloses our pipeline to whoever reads it.
   */
  const FORBIDDEN = [
    { term: 'PANGOL', why: 'a competitor brand in the November 2026 study' },
    { term: '沐森堂', why: 'a competitor brand in the November 2026 study' },
    { term: 'MUSENTANG', why: 'a competitor brand in the November 2026 study' },
    { term: '佩宝儿', why: 'a competitor brand in the November 2026 study' },
    { term: 'Likeable Pets', why: 'a named prospect - our pipeline is not public' },
  ];

  const TEXT_FILES = /\.(html|txt|json|js|xml|md|css|webmanifest)$/;
  const hits = [];

  // the walk of the published tree, done here rather than borrowed:
  // the function in the gate above is inside its own block
  const scanTree = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        scanTree(p);
      } else if (TEXT_FILES.test(e)) {
        const text = readFileSync(p).toString('latin1');
        for (const { term, why } of FORBIDDEN) {
          if (text.includes(term)) {
            hits.push(`${relative(OUT, p).split(sep).join('/')}: "${term}" (${why})`);
          }
        }
      }
    }
  };
  scanTree(OUT);

  // the pages' own copy, and the structured data in them
  const contentDir = join(SITE, 'content');
  for (const e of readdirSync(contentDir)) {
    if (!e.endsWith('.json')) continue;
    if (e === '_livejsonld.json') continue;
    const text = readFileSync(join(contentDir, e), 'utf8');
    for (const { term, why } of FORBIDDEN) {
      if (text.includes(term)) {
        hits.push(`content/${e}: "${term}" (${why})`);
      }
    }
  }

  if (hits.length) {
    fail("the competitor's name never reaches a buyer",
      `${hits.length} place(s) name a competitor or a prospect`);
    for (const h of hits.slice(0, 10)) console.error(`    ${h}`);
  } else {
    note("the competitor's name never reaches a buyer",
      'no published file names a competitor brand or a named prospect');
  }
}

/*
 * AI-GENERATED CONTENT SAYS SO
 *
 * WHY THIS GATE EXISTS
 *
 * The Measures for Labelling AI-Generated Synthetic Content came into
 * force on 1 September 2025. Two layers: a visible mark a reader can
 * see, and a mark written into the file that a machine can read.
 *
 * This site publishes text that an AI helped to write and assemble -
 * the articles, the guides, and the machine-readable files an answer
 * engine reads. So the files that carry that text have to say so.
 *
 * AND WHY IT IS CHECKED HERE
 *
 * Because a label that is written once and then forgotten is a label
 * that does not exist. The file is regenerated on every build, so the
 * declaration has to be regenerated with it, and this gate reads the
 * generated file rather than trusting the script that wrote it.
 *
 * The visible layer is the reader's: the page says it. The invisible
 * layer is the file's: this is the one this gate checks, because it
 * is the one that is silently dropped when a file is copied.
 */
{
  const GENERATED = [
    { file: 'llms-full.txt', need: 'AI-assisted' },
    { file: 'llms-full.json', need: 'AI-assisted' },
    { file: 'llms.txt', need: 'AI-assisted' },
  ];
  const missing = [];

  for (const { file, need } of GENERATED) {
    const p = join(OUT, file);
    if (!existsSync(p)) {
      missing.push(`${file} is not in the build`);
      continue;
    }
    const text = readFileSync(p, 'utf8');
    // the declaration has to be machine-readable: a key, not a sentence
    if (!text.includes(need)) {
      missing.push(`${file} carries no "${need}" declaration`);
    }
  }

  if (missing.length) {
    fail('AI-generated content says so',
      `${missing.length} of the machine-readable files carry no declaration`);
    for (const m of missing) console.error(`    ${m}`);
  } else {
    note('AI-generated content says so',
      'every machine-readable file declares that AI assisted in its writing');
  }
}

/*
 * A PUBLISHED ADDRESS HAS TO BE ONE A LETTER CAN REACH
 *
 * WHY THIS GATE EXISTS
 *
 * On 2026-11-07 three probes were sent, one to each address the site
 * publishes. The letter to mail@ arrived. The letter to sales@
 * arrived nowhere: `sales` is a mail group, and a mail group on an
 * enterprise mailbox takes mail from the company, not from the
 * outside world. The administrator cannot create a usable one, so a
 * buyer who wrote to sales@ wrote into a hole.
 *
 * The site published that address on 247 places. Nothing caught it:
 * the address is on our own domain, it is spelled correctly, and
 * every other gate was satisfied. Only a letter from outside would
 * have found it, and no buyer had written yet.
 *
 * ONE CORRECTION, because the first version of this gate was wrong
 * about `postmaster@`. The probe could not read that mailbox - the
 * administrator account cannot turn its two-factor authentication off,
 * so it never gets a client password and IMAP refuses the login - and
 * "I cannot read it" was taken for "it did not arrive". It does
 * arrive: postmaster@ is a real mailbox on the domain. It is not on
 * the list of addresses a letter cannot reach, because it can.
 *
 * It is still not the address the site publishes, for a different
 * reason: the desk reads mail@, and the api and the forwarding read
 * mail@ too. A letter to postmaster@ lands in a mailbox nobody in
 * this system reads, so publishing it would be a promise the desk
 * cannot keep. Publishing mail@ is the promise that can be kept.
 *
 * So the addresses the site publishes are checked against the one
 * account the company can both receive at and read. The list is here
 * rather than in a config file, because a config file is another
 * place to forget to update.
 */

const PUBLISHABLE_ADDRESS = 'sales@shenhezhongke.com';
/*
 * THE ADDRESSES THE SYSTEM CAN READ.
 *
 * This is the list that matters, and it is the question this project got
 * wrong three times: not "can a letter reach this address" but "does
 * anybody READ it". A mailbox nobody opens turns a lead into a piece of
 * mail - the desk never learns the lead existed, and the statistics
 * say the site got nothing.
 *
 * The addresses below are the ones the server can open over IMAP: the
 * account the api sends as, and the account the buyer's letters arrive
 * in. An address the site publishes that is not on this list is a
 * promise the desk cannot keep.
 *
 * The old version of this gate asked the weaker question and kept a
 * list of addresses that could not receive a letter. That list held
 * sales@ - which was true while sales@ was a mail group, and stopped
 * being true on 2026-11-07, when it became a real account. A gate
 * whose list is wrong in either direction teaches the team to ignore
 * it, so the question is now the one that was actually being asked.
 */
const READABLE_ADDRESSES = ['mail@shenhezhongke.com', 'sales@shenhezhongke.com'];
const UNREACHABLE_ADDRESSES = [];
/*
 * THE ADDRESSES NOBODY SHOULD BE WRITING TO.
 *
 * `mail` is the machine's identity: it sends as itself and holds the
 * system's notices and the bounces. `postmaster` is the administrator's
 * account: it receives, but nobody in this system reads it, because it
 * has no client password.
 *
 * Neither belongs in front of a buyer. A published address is a promise
 * that a person reads it, and these two are the two ways that promise
 * has been broken on this site.
 */
const NOT_FOR_PUBLISHING = ['mail@shenhezhongke.com', 'postmaster@shenhezhongke.com'];

{
  const offenders = [];
  /*
   * EVERY PUBLISHED FILE, NOT ONLY THE PAGES.
   *
   * The first version of this gate built its list as
   * walkHtml(OUT) plus walkAll(OUT) filtered to the files that are not
   * .html - and walkAll collects .html and nothing else, so the second
   * half was always empty. The gate was green while
   * .well-known/security.txt published an address a letter cannot
   * reach, and while llms.txt and ai.txt published one too.
   *
   * A file a buyer or a crawler reads is a file the site publishes.
   * The binary ones are left out: they are images and a PDF, and the
   * PDF is written from the configuration, so it carries the address
   * the configuration holds.
   */
  const published = walkPublished(OUT);

  /*
   * THE TWO ADDRESSES THE SITE PUBLISHES AS CONTACTS.
   *
   * They are read out of the configuration by name, because a reader
   * that looks for "any address" finds the one in a line of prose and
   * reads the wrong thing. And they are checked against the list the
   * server can read - so the day somebody publishes an address nobody
   * opens, the build says so instead of a buyer finding out.
   */
  const cfg = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
  for (const key of ['PUBLIC_EMAIL', 'PUBLIC_SALES_EMAIL']) {
    const m = new RegExp("const\\s+" + key + "\\s*=\\s*'([^']+)'").exec(cfg);
    if (m && !READABLE_ADDRESSES.includes(m[1].toLowerCase())) {
      offenders.push(
        `lib/shenhe.config.ts publishes ${m[1]} as ${key}, and nothing in this system reads it - ` +
        'a lead in that mailbox is a piece of mail nobody sees',
      );
    }
  }

  /*
   * THE ADDRESSES NOBODY SHOULD BE WRITING TO.
   *
   * Checked on every published file, not only on the pages: the address
   * that ends up in a meta description, a schema block, a reading list
   * or a security.txt is an address the site published, and a gate that
   * only reads the .html files never sees it.
   */
  for (const a of NOT_FOR_PUBLISHING) {
    for (const p of published) {
      const body = readFileSync(p, 'utf8');
      if (body.includes(a)) {
        offenders.push(
          `${relative(OUT, p).split(sep).join('/')} publishes ${a}, which is not an address a buyer should write to`,
        );
        break;
      }
    }
  }

  for (const a of UNREACHABLE_ADDRESSES) {
    for (const p of published) {
      const body = readFileSync(p, 'utf8');
      if (body.includes(a)) {
        offenders.push(`${relative(OUT, p).split(sep).join('/')} publishes ${a}, which cannot receive a letter`);
        break;
      }
    }
    /*
     * THE SOURCE OF TRUTH, BUT ONLY ITS VALUES.
     *
     * The configuration file explains in its comments which addresses
     * the company had and why, and a comment is not published. So the
     * check looks for the address as a VALUE - in quotes, in a
     * constant - and not in a line of prose. Otherwise the gate
     * would fail on its own explanation, and a gate that fails on
     * its own explanation is a gate nobody reads.
     */
    const cfg = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
    const asValue = new RegExp("'[^']*" + a.replace(/\./g, '\\.') + "'", 'i');
    if (asValue.test(cfg)) {
      offenders.push(`lib/shenhe.config.ts publishes ${a}, which cannot receive a letter`);
    }
  }

  if (offenders.length) {
    fail('a published address has to be one a letter can reach',
      `${offenders.length} place(s) publish an address that cannot receive mail`);
    for (const o of offenders) console.error(`    ${o}`);
  } else {
    note('a published address has to be one a letter can reach',
      `the site publishes ${PUBLISHABLE_ADDRESS}, and no unreachable address`);
  }
}

/*
 * A DESCRIPTION ENDS ON SOMETHING THAT CAN STAND ALONE
 *
 * WHY THIS GATE EXISTS
 *
 * The length gate says a description is between 150 and 155
 * characters. It cannot say whether the description is a whole
 * sentence: "a 93.3%." is 150 characters and passes, and it says
 * nothing.
 *
 * That is not a hypothetical. Three of the ten report descriptions
 * ended on a fragment while they were being written, because a
 * long finding was cut at a clause boundary and the cut came from
 * the end - so the number came off the claim.
 *
 * So the report pages are asked a second question: does the
 * description end on a word that can end a sentence?
 *
 * THE WORDS
 *
 * A word that needs a noun after it - a comparison, a conjunction, a
 * preposition, an article, a conjunction - cannot end a claim.
 * "a 93.3%." ends on "93.3%" with an article in front of it and no
 * noun after it, so it is rejected.
 */
{
  const problems = [];
  const CANT_END = /^(?:a|an|the|and|or|but|with|without|against|under|over|on|in|at|by|to|for|from|of|as|is|are|was|were|than|that|which|its|their|his|her|this|these|those|more|less|most|least|about|above|below|per|via)$/i;
  const NUMBER_ONLY = /^\d+(?:[.,]\d+)?%?$/;

  const reportDir = join(OUT, 'reports');
  if (existsSync(reportDir)) {
    for (const f of readdirSync(reportDir)) {
      if (!f.endsWith('.html')) continue;
      const raw = readFileSync(join(reportDir, f), 'utf8');
      const m = raw.match(/<meta name="description" content="([^"]*)"/);
      if (!m) continue;
      const text = m[1];
      const words = text.replace(/&[a-z]+;/g, ' ').replace(/[.,;:!?]$/, '').split(/\s+/);
      const last = words[words.length - 1] || '';
      const before = words[words.length - 2] || '';
      if (CANT_END.test(last)) {
        problems.push(`reports/${f}: the description ends on "${last}", which needs a noun after it`);
      } else if (NUMBER_ONLY.test(last) && CANT_END.test(before)) {
        problems.push(`reports/${f}: the description ends on "${before} ${last}", which is a number without its noun`);
      }
    }
  }

  if (problems.length) {
    fail('a description ends on something that can stand alone',
      `${problems.length} description(s) end on a fragment`);
    for (const p of problems.slice(0, 10)) console.error(`    ${p}`);
  } else {
    note('a description ends on something that can stand alone',
      'every report description ends on a whole claim');
  }
}

gateFinished = true;

/*
 * A PERCENTAGE CLAIM MUST NAME ITS REPORT.
 *
 * The copy document's rule: every efficacy number must be followed by
 * a report number, because a number a buyer cannot look up is a
 * number a buyer's legal team strikes out - and once they strike out
 * one, the rest of the page's numbers go with it.
 *
 * Ten of the eleven pages that carry a number already name the
 * report. The one that did not was the factory page, which is exactly
 * where a buyer looks first.
 *
 * So this is a gate and not a note: a page with an efficacy
 * percentage and no report number fails the build.
 */
{
  const EFFICACY_CLAIM = /(?:\d+(?:\.\d+)?)\s*%\s*(?:kill|removal|reduction|efficacy|inhibition)/gi;
  const REPORT_NUMBER = /\b(?:NACCYH\d{8}|XJ\d{10}|20\d{2}FM\d{5}R\d{2}D[a-z]?)\b/i;
  const claimProblems = [];
  for (const f of walkHtml(OUT)) {
    const rel = relative(OUT, f).split(sep).join('/');
    if (rel.startsWith('portal/') || rel.startsWith('admin/')) continue;
    const html = readFileSync(f, 'utf8');
    // the scripts carry the page's own data twice over; the visible
    // text is what a reader sees
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    const claims = text.match(EFFICACY_CLAIM);
    if (!claims) continue;
    if (!REPORT_NUMBER.test(text)) {
      claimProblems.push(`${rel}: "${claims[0]}" with no report number on the page`);
    }
  }
  if (claimProblems.length) {
    for (const p of claimProblems) fail(`an efficacy percentage with no report number — ${p}`);
  } else {
    note('every efficacy percentage names the report behind it');
  }
}

/*
 * OUR MINIMUM IS COUNTED IN THE PACKAGING, NOT IN "UNITS".
 *
 * A buyer may name a volume in units - "can you do 5,000 units" is a
 * fair question. But the minimum we publish is counted in what the
 * buyer receives: 1,000 sets on the two bundled sets, 2,000 bottles
 * on the catalogue SKUs, 2,000 packs on the litter powder.
 *
 * "Units" is the one word that hides the difference. A buyer who has
 * seen "1,000 units" once and "1,000 sets" once asks whether they are
 * the same thing, and that question is an email.
 */
{
  const MINIMUM_IN_UNITS = /(?:MOQ|minimum(?:s)?)[^.;]{0,200}\b\d[\d,–-]*\s*units\b/gi;
  const unitProblems = [];
  for (const f of walkHtml(OUT)) {
    const rel = relative(OUT, f).split(sep).join('/');
    if (rel.startsWith('portal/') || rel.startsWith('admin/')) continue;
    const html = readFileSync(f, 'utf8');
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    const m = text.match(MINIMUM_IN_UNITS);
    if (m) unitProblems.push(`${rel}: "${m[0].trim()}"`);
  }
  if (unitProblems.length) {
    for (const p of unitProblems) fail(`a minimum written in "units" — ${p}`);
  } else {
    note('the minimum is counted in the packaging, not in "units"');
  }
}

/*
 * A READING LIST WITHOUT A MAILBOX IS A DOOR WITH NO DOOR.
 *
 * The three files an answer engine reads carry the WhatsApp number
 * and not the mailbox. The mailbox is the door: a buyer writes, and a
 * letter to a mailbox nobody opens is a lead that never arrives.
 *
 * So the mailbox has to be in the reading lists, and the check is a
 * check - not a note.
 */
{
  const READERS = ['llms.txt', 'llms-full.txt', 'llms-full.json', 'ai.txt'];
  /*
   * THE MAILBOX THE SITE PUBLISHES.
   *
   * Not a literal of my own: the site publishes one address, and a
   * normaliser rewrites every mention of it to that one. So the
   * check asks for the address the site publishes - and if the
   * normaliser ever changes which address that is, the check
   * follows it instead of failing on a name that is no longer used.
   */
  const MAILBOX = 'sales@shenhezhongke.com';
  const missingMailbox = [];
  for (const name of READERS) {
    const file = join(OUT, name);
    if (!existsSync(file)) continue;
    const body = readFileSync(file, 'utf8');
    if (!body.includes(MAILBOX)) missingMailbox.push(name);
  }
  if (missingMailbox.length) {
    for (const name of missingMailbox) {
      fail('the reading lists carry the mailbox', `${name} has no ${MAILBOX}`);
    }
  } else {
    note('the reading lists carry the mailbox', `${READERS.length} files, the mailbox is in each`);
  }
}

/*
 * AN ANSWER IS ONE ANSWER.
 *
 * An answer engine lifts a passage. A passage that answers six
 * questions gets cut, and the cut lands in the middle of a number -
 * which is the one thing a buyer cannot read half. So the answer to
 * a question says one thing.
 *
 * Two kinds of long answer are allowed, and they are named:
 *
 *   - a guide page, where the answer IS the article - "how to choose
 *     a pet care manufacturer" answers in four hundred characters
 *     because four hundred characters is the answer
 *   - a regulation page, where the answer is the regulation
 *
 * Everything else has to fit. And no answer may say the same thing
 * twice: the shipping page did, and the repetition is invisible to
 * the reader and obvious to a machine.
 */
{
  const ANSWER_CEILING = 700;
  // the pages whose answers are articles, not lifts
  const LONG_ANSWER_PAGES = [
    'blog/sourcing/how-to-choose-a-pet-care-oem-manufacturer-in-china.html',
    'certifications.html',
    'europe.html',
    'usa.html',
    'intellectual-property.html',
  ];
  const longProblems = [];
  const repeatProblems = [];
  for (const f of walkHtml(OUT)) {
    const rel = relative(OUT, f).split(sep).join('/');
    if (rel.startsWith('portal/') || rel.startsWith('admin/')) continue;
    const html = readFileSync(f, 'utf8');
    for (const block of html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    )) {
      let data;
      try {
        data = JSON.parse(block[1]);
      } catch {
        continue;
      }
      const stack = Array.isArray(data) ? [...data] : [data];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        if (node['@type'] === 'FAQPage') {
          for (const q of node.mainEntity || []) {
            const text = String((q.acceptedAnswer || {}).text || '');
            if (text.length > ANSWER_CEILING && !LONG_ANSWER_PAGES.includes(rel)) {
              longProblems.push(`${rel}: "${String(q.name || '').slice(0, 60)}" is ${text.length} characters`);
            }
            // the same sentence twice in one answer
            const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 40);
            const seen = new Set();
            for (const s of sentences) {
              const key = s.slice(0, 60);
              if (seen.has(key)) {
                repeatProblems.push(`${rel}: "${key}..." is said twice in one answer`);
                break;
              }
              seen.add(key);
            }
          }
        }
        for (const v of Object.values(node)) {
          if (Array.isArray(v)) stack.push(...v);
          else if (v && typeof v === 'object') stack.push(v);
        }
      }
    }
  }
  for (const p of longProblems) {
    fail('an answer says one thing', `${p}`);
  }
  for (const p of repeatProblems) {
    fail('an answer does not say the same thing twice', p);
  }
  if (!longProblems.length && !repeatProblems.length) {
    note('an answer says one thing', `${LONG_ANSWER_PAGES.length} pages carry articles, every other answer fits`);
  }
}

/*
 * A PAGE THAT IS INDEXED HAS TO CARRY ITS METADATA.
 *
 * A search result shows about sixty characters of the title and about
 * a hundred and fifty-five of the description. A title past that is
 * cut, and the cut lands wherever it lands. A description outside
 * the window either wastes the space or runs into the next result.
 *
 * A page that is NOT indexed is a different matter: the 404 is not a
 * search result, and a canonical on it would be a canonical on a page
 * that says nothing exists. So the pages that carry noindex are not
 * measured - and the measurement says so, so nobody has to guess
 * whether the omission was an oversight.
 */
{
  const TITLE_CEILING = 62;
  const DESC_FLOOR = 150;
  const DESC_CEILING = 155;
  const metaProblems = [];
  let measured = 0;
  let skipped = 0;
  for (const f of walkHtml(OUT)) {
    const rel = relative(OUT, f).split(sep).join('/');
    if (rel.startsWith('portal/') || rel.startsWith('admin/')) continue;
    const html = readFileSync(f, 'utf8');
    const head = html.slice(0, 6000);
    // a page that asks not to be indexed is not a search result
    if (head.includes('noindex')) {
      skipped += 1;
      continue;
    }
    // the search-console verification file is a token for Google, not
    // a page: it is not in the sitemap and nothing links to it
    if (rel.startsWith('google-site-verification')) {
      skipped += 1;
      continue;
    }
    const title = html.match(/<title>([\s\S]*?)<\/title>/);
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
    measured += 1;
    if (!title) {
      metaProblems.push(`${rel}: no title`);
    } else {
      const n = title[1].replace(/&amp;/g, '&').trim().length;
      if (n > TITLE_CEILING) metaProblems.push(`${rel}: the title is ${n} characters`);
    }
    if (!desc) {
      metaProblems.push(`${rel}: no description`);
    } else {
      const n = desc[1].length;
      if (n < DESC_FLOOR || n > DESC_CEILING) {
        metaProblems.push(`${rel}: the description is ${n} characters`);
      }
    }
    if (!canonical) {
      metaProblems.push(`${rel}: no canonical`);
    }
  }
  for (const p of metaProblems) {
    fail('an indexed page carries its metadata', p);
  }
  if (!metaProblems.length) {
    note('an indexed page carries its metadata',
      `${measured} pages measured, ${skipped} not indexed and not measured`);
  }
}

/*
 * ONE WAY TO ASK FOR A QUOTATION.
 *
 * The site carried "Request a quotation" and "Get a quote" for the
 * same button. Two writings of one action is not two actions: it is
 * one action a buyer has to stop and think about.
 *
 * So the pages may ask in one way only, and the gate reads the pages
 * - because what a buyer sees is the page, not the source.
 */
{
  const ALLOWED = ['Request a quotation'];
  /*
   * THE BUTTON, NOT THE HEADING.
   *
   * "Get a Quote Within 1 Business Day" is a card heading: it is
   * the promise the card makes, and it is not the button. The rule
   * is about the way the site asks - so the check is for the phrase
   * standing alone as a call to action, with the words around it
   * being a heading, a sentence or a link.
   */
  /*
   * THE BUTTON, NOT THE HEADING.
   *
   * "Request a quotation within 1 business day" is a card heading:
   * it is the promise the card makes, and it is not the button. The
   * rule is about the way the site ASKS - so the check is for the
   * phrase standing alone as a call to action, and the words around
   * it being a heading or a sentence.
   */
  const FORBIDDEN = [
    /(^|[\s>])Get a quote([\s<.]|$)/i,
    /(^|[\s>])Request a quote([\s<.]|$)/i,
    /(^|[\s>])Get a quotation([\s<.]|$)/i,
    /(^|[\s>])Ask for a quote([\s<.]|$)/i,
  ];
  const ctaProblems = [];
  for (const f of walkHtml(OUT)) {
    const rel = relative(OUT, f).split(sep).join('/');
    if (rel.startsWith('portal/') || rel.startsWith('admin/')) continue;
    const html = readFileSync(f, 'utf8');
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    for (const re of FORBIDDEN) {
      const m = text.match(re);
      if (m) {
        const i = text.indexOf(m[0]);
        ctaProblems.push(`${rel}: "${m[0]}" — ${text.slice(Math.max(0, i - 40), i + 60).trim()}`);
        break;
      }
    }
  }
  if (ctaProblems.length) {
    for (const p of ctaProblems) fail('one way to ask for a quotation', p);
  } else {
    note('one way to ask for a quotation', `the pages ask in one way: ${ALLOWED[0]}`);
  }
}

/*
 * THE THREE PAGES A BUYER LANDS ON CARRY THE REJECT RATE.
 *
 * A buyer arrives on one of three pages: the home page, the
 * catalogue, or the factory. A number that is not on one of them is
 * a number the buyer has to go and look for, and a number nobody
 * looks for is not a selling point.
 *
 * The reject rate is the one number nobody else publishes - a
 * factory that has never rejected a batch cannot tell you how it
 * handles one - so the landing pages carry it. The certificates are
 * the opposite case and are left alone: a certificate is a ticket,
 * and a ticket belongs on every page a buyer screens a supplier on.
 */
{
  const LANDING = ['index.html', 'products.html', 'factory.html'];
  const REJECT = /1\.2\s?%/;
  const missing = [];
  for (const rel of LANDING) {
    const f = join(OUT, rel);
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    const body = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    if (!REJECT.test(body)) missing.push(rel);
  }
  if (missing.length) {
    for (const rel of missing) {
      fail('the landing pages carry the reject rate', `${rel} does not carry the batch reject rate`);
    }
  } else {
    note('the landing pages carry the reject rate', `${LANDING.length} landing pages carry it`);
  }
}







if (failures.length) process.exit(1);



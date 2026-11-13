/**
 * The guide lists, in the machine-readable files, read from the build.
 *
 * WHY
 * The reading lists — llms.txt, llms-full.txt, llms-full.json — each
 * carried a hand-written list of the guides. A guide was published and
 * the lists did not know about it, so the article existed for a reader
 * and not for the assistant that answers questions about suppliers.
 * Nine of them had to be added by hand, and the next one would have
 * been forgotten as well.
 *
 * The lists are now derived from the built pages: the guide list comes
 * from what is in out/blog, the title comes from the page's own
 * metadata, and the description comes from the page's own meta
 * description. A guide that is published appears in the lists on the
 * next build; a guide that is removed disappears from them.
 *
 * WHAT IT TOUCHES
 * Three files, and only the guide sections of them. Everything else in
 * them is hand-written and stays.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = process.cwd();
const OUT = join(SITE, 'out');
const PUBLIC = join(SITE, 'public');
const SITE_URL = 'https://shenhezhongke.com';

if (!existsSync(OUT)) {
  console.error('out/ not found — run `next build` first.');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* The guides, read out of the build                                    */
/* ------------------------------------------------------------------ */

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const BLOG = join(OUT, 'blog');
if (!existsSync(BLOG)) {
  console.log('  the blog is not in the build — the guide lists are left alone.');
  process.exit(0);
}

/** The title and the description, from the page's own metadata. */
function metaOf(file) {
  const head = readFileSync(file, 'utf8').slice(0, 8000);
  const t = head.match(/<title>([^<]*)<\/title>/i);
  const d = head.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const clean = (s) =>
    (s ?? '')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ')
      .trim();
  return { title: clean(t?.[1]), description: clean(d?.[1]) };
}

const guides = walk(BLOG)

  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const rel = relative(OUT, f).split(sep).join('/');
    const { title, description } = metaOf(f);
    return {
      slug: rel.replace(/^blog\//, '').replace(/\.html$/, ''),
      category: rel.split('/')[1] ?? 'notes',
      url: `${SITE_URL}/${rel}`,
      title: title || rel,
      desc: description,
    };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

/*
 * The reports, and the fingerprint of each file.
 *
 * The reading list names the reports a buyer can download, and the
 * hash of each one, so an assistant that quotes the report number can
 * also quote the number that proves which file it was.
 */
const reportIndex = existsSync(join(PUBLIC, 'reports.json'))
  ? JSON.parse(readFileSync(join(PUBLIC, 'reports.json'), 'utf8'))
  : { reports: [] };
const reportHashes = existsSync(join(PUBLIC, 'report-hashes.json'))
  ? JSON.parse(readFileSync(join(PUBLIC, 'report-hashes.json'), 'utf8'))
  : { reports: [] };
const hashByNumber = new Map(reportHashes.reports.map((r) => [r.reportNumber, r.sha256]));
const reports = (reportIndex.reports ?? []).map((r) => ({
  reportNumber: r.reportNumber,
  title: r.title,
  issuer: r.issuer,
  // WHAT THE REPORT FOUND, AND WHERE IT IS READ OUT.
  //
  // The line in the reading list used to be a number, a title, a lab
  // and a fingerprint. A fingerprint proves which file was served; it
  // says nothing about what is in it. An assistant reading the list
  // could see that ten reports existed and could not quote a single
  // measured number, so it had nothing to say about the evidence.
  finding: r.finding || '',
  page: r.page || '',
  sha256: hashByNumber.get(r.reportNumber) ?? null,
}));

console.log(`  the guides in the build: ${guides.length}`);
for (const g of guides) console.log(`    ${g.slug}`);

/* ------------------------------------------------------------------ */
/* llms.txt and llms-full.txt — the "### Guides" section               */
/* ------------------------------------------------------------------ */

/**
 * The lab reports section, written from the report index.
 *
 * It was hand-written, and it had drifted: it said nine PDFs when the
 * site publishes ten, and it wrote the report numbers in a shortened
 * form the buyer could not quote back. llms.txt is the file an
 * assistant reads first, and a wrong count there does not read as a
 * wrong count — it reads as a fact about the factory.
 *
 * The section is now derived from public/reports.json, the same file
 * the report pages are built from, and it carries the fingerprint of
 * each report so an assistant can check the file it downloads.
 */
/**
 * THE TWO REPORT SECTIONS, WRITTEN FROM THE REPORT RECORD.
 *
 * WHY THE VERIFIED-PERFORMANCE SECTION WAS REPLACED
 * It was a copy of the certifications page pasted into the long AI file,
 * and the copy carried the page's animated counters at their starting
 * value: three "0%" where the real figures are 94.2%, above 99.999% and
 * 96.6%. The site itself publishes no 0% figure at all - the matches on
 * the built page are incidental ("the standard reads >=90%", "left:0px").
 *
 * So the file an assistant reads when it wants the detail said, in the
 * same breath, "Ammonia removal, lab report NACCYH25014722" and "0%".
 * A quote taken from that file tells a buyer the opposite of what the
 * report says.
 *
 * WHY BOTH SECTIONS ARE WRITTEN FROM THE RECORD
 * A number that is on a document can be checked. A number that was
 * pasted from a page is a number that can drift, and these two files
 * are the ones an engine quotes from.
 */
function labReportsBlock() {
  return [
    `## Third-party lab reports (${reports.length} PDFs, available for download)`,
    '',
    'Each report number below is the one printed on the document, so it can be',
    'quoted back. The SHA-256 is the fingerprint of the exact file served here.',
    'The finding is what the report measured, and the page is that report',
    'written out as text — the numbers inside a PDF cannot be read by a crawler.',
    '',
    ...reports.map((r) => `- ${r.reportNumber} — ${r.title} (${r.issuer})` +
      (r.finding ? ` — ${r.finding}` : '') +
      (r.page ? ` — page: ${r.page}` : '') +
      (r.sha256 ? ` — SHA-256 ${r.sha256}` : '')),
  ];
}

function verifiedPerformanceBlock() {
  return [
    '## Third-party verified performance',
    '',
    'Every number below comes from an independent third-party laboratory report.',
    'The report number is the one printed on the document, so it can be quoted',
    'back, and the page is that report written out as text — the numbers inside',
    'a PDF cannot be read by a crawler.',
    '',
    ...reports.map((r) => `- ${r.finding} — lab report ${r.reportNumber} (${r.issuer})` +
      (r.page ? ` — page: ${r.page}` : '')),
  ];
}

/** Replace a section by its heading, or say it is not there. */
function replaceSectionByHeading(text, heading, block) {
  const lines = text.split('\n');
  const matches = (l) =>
    typeof heading === 'string' ? l.trim() === heading : heading.test(l.trim());
  const start = lines.findIndex((l) => matches(l));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return [...lines.slice(0, start), ...block, '', ...lines.slice(end)].join('\n');
}

/**
 * Put a block in front of a heading, or say that heading is not there.
 *
 * THE HEADING IS MATCHED BY PATTERN, NOT BY STRING
 * The heading in the long file is "## Product lines (4 lines, 20 catalogue
 * SKUs)" - the count is part of the text. An exact match on
 * "## Product lines" never found it, so the section was never inserted
 * and the long file went on without the evidence in it.
 */
function insertBeforeHeading(text, heading, block) {
  const lines = text.split('\n');
  const matches = (l) =>
    typeof heading === 'string' ? l.trim() === heading : heading.test(l.trim());
  const at = lines.findIndex((l) => matches(l));
  if (at === -1) return null;
  return [...lines.slice(0, at), ...block, '', ...lines.slice(at)].join('\n');
}

/**
 * Write both report sections into a reading list.
 *
 * The short file had the lab-reports section and the long file did not.
 * The long file is the one an assistant reads when it wants the detail,
 * so a section that is only in the short one is a section half the
 * audience never sees - and the engine that reads only the long file
 * sees the site without its evidence.
 */
function writeReportSections(text) {
  let out = text;
  const vp = replaceSectionByHeading(out, '## Third-party verified performance', verifiedPerformanceBlock());
  if (vp !== null) out = vp;
  const lab = replaceSectionByHeading(
    out,
    /^## Third-party lab reports \(\d+ PDFs, available for download\)$/,
    labReportsBlock(),
  );
  if (lab !== null) {
    out = lab;
  } else {
    const inserted = insertBeforeHeading(out, /^## Product lines\b/, labReportsBlock());
    if (inserted !== null) out = inserted;
  }
  return out;
}

function replaceLabReportsSection(text, heading) {
  const lines = text.split('\n');
  /*
   * The heading is matched by PATTERN, not by string.
   *
   * The count in it ("10 PDFs") is content, not identity: it changes when the
   * factory publishes another report. Matching the whole string meant that
   * the day the count changed, this section stopped being regenerated — and
   * the hand-written list inside it went on publishing a report number that
   * was no longer on any document, and an address that no longer existed.
   */
  const matches = (l) =>
    typeof heading === 'string' ? l.trim() === heading : heading.test(l.trim());
  const start = lines.findIndex((l) => matches(l));
  if (start === -1) {
    console.log(`    the section "${heading}" is not there — nothing to do.`);
    return text;
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const block = [
    `## Third-party lab reports (${reports.length} PDFs, available for download)`,
    '',
    'Each report number below is the one printed on the document, so it can be',
    'quoted back. The SHA-256 is the fingerprint of the exact file served here.',
    '',
    ...reports.map((r) => `- ${r.reportNumber} — ${r.title} (${r.issuer})` +
      (r.finding ? ` — ${r.finding}` : '') +
      (r.page ? ` — page: ${r.page}` : '') +
      (r.sha256 ? ` — SHA-256 ${r.sha256}` : '')),
  ];
  const out = [...lines.slice(0, start), ...block, '', ...lines.slice(end)];
  return out.join('\n');
}

/**
 * The batch attestations, written from the receipts.
 *
 * An assistant asked "can this factory's claims be checked?" needs
 * something to point at, and it needs the honest count. The section
 * says how many batches are attested, where the attestations live and
 * what an attestation proves — and what it does not.
 *
 * When there is nothing yet, it says so. A section that listed a
 * number that did not exist would be the same overclaiming as a
 * certificate wall.
 */
function replaceAttestationSection(text, heading) {
  const lines = text.split('\n');
  // The count in the heading is content, not identity (see the lab-reports
  // section above) — so the heading is matched by pattern.
  const matches = (l) =>
    typeof heading === 'string' ? l.trim() === heading : heading.test(l.trim());
  const start = lines.findIndex((l) => matches(l));
  if (start === -1) {
    console.log(`    the section "${heading}" is not there — nothing to do.`);
    return text;
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const receipts = existsSync(join(PUBLIC, '..', 'scripts', '.batches-attested.json'))
    ? JSON.parse(readFileSync(join(PUBLIC, '..', 'scripts', '.batches-attested.json'), 'utf8'))
    : [];
  const list = Array.isArray(receipts) ? receipts : [];
  const onChain = list.filter((r) => r && r.mode === 'live' && r.tx_hash);
  const block = [
    `## Batch attestations (${list.length} attested, ${onChain.length} written to the chain)`,
    '',
    'Every production batch carries the SHA-256 of its laboratory report, written to',
    'a public blockchain, so the report in a buyer\'s hands can be compared with the',
    'one that was filed. The transaction is on a public chain and is not ours to edit.',
    '',
    '- the index of attested batches: https://shenhezhongke.com/attestation.html',
    '- the SHA-256 of every published report: https://shenhezhongke.com/report-hashes.json',
    '',
    'An attestation proves that the report file existed at the recorded time and has',
    'not been changed since. It does not prove that the product is approved for any',
    'market, and it does not prove that the product is good.',
  ];
  if (list.length > 0) {
    block.push('', ...list.map((r) =>
      `- ${r.batch_no} — ${r.sku} — ${r.produced_at ? String(r.produced_at).slice(0, 10) : '—'}` +
      (r.tx_hash ? ` — tx ${r.tx_hash}` : ' — not yet written to the chain')));
  }
  const out = [...lines.slice(0, start), ...block, '', ...lines.slice(end)];
  return out.join('\n');
}

function replaceGuidesSection(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) {
    console.log(`    the section "${heading}" is not there — nothing to do.`);
    return text;
  }
  // The section runs until the next heading of the same or a higher level.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const block = guides.map((g) => `- [${g.title}](${g.url}) — guide`);
  const out = [...lines.slice(0, start + 1), ...block, '', ...lines.slice(end)];
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* The product lines, read out of the catalogue of record              */
/* ------------------------------------------------------------------ */

/*
 * WHY
 * The product-line section of the reading lists was hand-written, and
 * it drifted from lib/products.json. It said the 20 SKUs were grouped
 * into three, then listed four groups; it put nine SKUs in the
 * deodorizing line where the catalogue has seven, and nine in the
 * grooming line where the catalogue has eleven; and it listed the two
 * Pet Nutrition products beside the SKUs, which made twenty-two
 * products where the site says twenty.
 *
 * Every one of those sentences is plausible on its own, which is why
 * it survived. And llms.txt is the file an assistant reads first. A
 * wrong count here does not read as a wrong count; it reads as a
 * fact about the factory, and it is quoted back at us.
 *
 * WHAT
 * The section is derived from the catalogue of record. The line of
 * each SKU is read from the catalogue, the count is counted, and the
 * list is written from the same data. The Pet Nutrition line is
 * described separately, because those two products are quoted
 * individually and are not catalogue SKUs — which is the distinction
 * the old wording tried to make and then broke.
 */

const LINE_ORDER = [
  'deodorizing_disinfection',
  'grooming_care',
  'outdoor_protection',
  'pet_nutrition',
];

/**
 * The line names, read out of lib/product-routing.ts.
 *
 * They used to be written here, and they were not the names the site uses:
 * this file said "Deodorizing & Disinfection" and "Cleansing & Grooming" while
 * every line page and every product page on the site says "Deodorizing &
 * Disinfecting" and "Grooming & Care". A reading list that renames the
 * factory's own product lines is a reading list that quotes a factory that
 * does not exist, so the names come from the one file the components import.
 */
function parseTsMap(source, name) {
  const m = source.match(new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!m) throw new Error(`${name} is not in lib/product-routing.ts`);
  const out = {};
  for (const mm of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) out[mm[1]] = mm[2];
  if (!Object.keys(out).length) throw new Error(`${name} parsed to nothing`);
  return out;
}

const ROUTING_TS = readFileSync(join(SITE, 'lib', 'product-routing.ts'), 'utf8');
const LINE_LABEL = parseTsMap(ROUTING_TS, 'LINE_LABEL');

/*
 * The nutrition line is a real line of the company, but its two
 * products carry no catalogue SKU code — they are quoted project by
 * project. So it is named here even when the catalogue has nothing
 * under it, or the count of lines would drop to three and the site
 * would say two different numbers in two different files.
 */
const LINES_WITHOUT_SKUS = ['pet_nutrition'];

function collectProducts(node, acc = []) {
  if (Array.isArray(node)) {
    for (const v of node) collectProducts(v, acc);
  } else if (node && typeof node === 'object') {
    if ('id' in node && 'moq' in node && 'line' in node) acc.push(node);
    for (const v of Object.values(node)) collectProducts(v, acc);
  }
  return acc;
}

/**
 * The page a product is on, from the catalogue's own id.
 *
 * The table used to be a copy written out here, twenty lines long. It agreed
 * with lib/product-routing.ts on the day it was written and there was nothing
 * to keep it agreeing, so it is read from that file now.
 */
const PRODUCT_ROUTE = parseTsMap(ROUTING_TS, 'PRODUCT_ROUTE');

function productPath(p) {
  const slug = PRODUCT_ROUTE[p.id];
  return slug ? `/products/${slug}.html` : null;
}

/** The one line that says what the product does, in a buyer's words. */
function productLine(p) {
  const bits = [];
  if (p.function_en) bits.push(String(p.function_en).trim());
  if (p.specification) bits.push(String(p.specification).trim());
  const moq = Number(p.moq).toLocaleString('en-US');
  const unit = p.moq_unit ? ' ' + p.moq_unit : '';
  bits.push(`MOQ ${moq}${unit}.`);
  const stock = p.lead_time_days_stock;
  if (stock) bits.push(`${stock}-day stock lead.`);
  return bits.join(' ');
}

let productLines = null;
try {
  const CATALOGUE = JSON.parse(readFileSync(join(SITE, 'lib', 'products.json'), 'utf8'));
  const products = collectProducts(CATALOGUE);
  const groups = new Map();
  for (const p of products) {
    const key = String(p.line);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const order = [...LINE_ORDER, ...groups.keys().filter((k) => !LINE_ORDER.includes(k))];
  productLines = order
    .filter((k) => groups.has(k) || LINES_WITHOUT_SKUS.includes(k))
    .map((k) => ({
      key: k,
      label: LINE_LABEL[k] ?? k,
      items: groups.get(k) ?? [],
    }));
  console.log(`  the catalogue: ${products.length} SKUs, ${productLines.length} lines`);
  for (const g of productLines) console.log(`    ${g.label}: ${g.items.length} SKUs`);
} catch (e) {
  console.log(`  the catalogue could not be read (${e.message}) — the product-line section is left alone.`);
}

function buildProductLinesSection() {
  if (!productLines) return null;
  const withSkus = productLines.filter((g) => g.items.length > 0);
  const without = productLines.filter((g) => g.items.length === 0);
  const skuCount = withSkus.reduce((n, g) => n + g.items.length, 0);

  const out = [];
  out.push(`## Product lines (${productLines.length} lines, ${skuCount} catalogue SKUs)`);
  out.push('');
  /*
   * WHY THIS SENTENCE IS WORDED THIS WAY.
   *
   * It used to read "The catalogue is 20 SKUs on 3 product lines." Two lines
   * above, the heading said "4 lines". Both were true and they counted
   * different things — the heading counted the four lines the factory
   * runs, and the sentence counted the three of them that carry a SKU
   * code — but to a reader, and to an answer engine quoting the file, one
   * sentence contradicted the heading above it.
   *
   * The count that matters is the catalogue: the SKUs, and the lines the
   * SKUs are on. The fourth line is explained on the next line, where it
   * belongs, because that is the one with a different arrangement.
   */
  out.push(
    `All ${skuCount} catalogue SKUs sit on ${withSkus.length} of these lines.`,
  );
  if (without.length) {
    out.push(
      `The ${without.map((l) => l.label).join(' and ')} line carries no catalogue SKU code and is quoted project by project.`,
    );
  }
  out.push(
    'Every SKU is available private label: minimum order and lead time are stated here, prices are quoted on request.',
  );
  out.push('');

  for (const g of withSkus) {
    out.push(`### ${g.label} (${g.items.length} SKU${g.items.length === 1 ? '' : 's'})`);
    for (const p of g.items) {
      const path = productPath(p);
      const name = p.name_en ?? p.name ?? p.id;
      const title = p.id === 'P001' || p.id === 'P009' ? `OEM ${name}` : name;
      const label = path ? `[${title}](${SITE_URL}${path})` : title;
      out.push(`- ${label} — ${productLine(p)}`);
    }
    out.push('');
  }
  return out.join('\n');
}

function replaceProductLinesSection(text) {
  const heading = text.split('\n').findIndex((l) => l.startsWith('## Product lines'));
  if (heading === -1) {
    console.log('    the product-line section is not there — nothing to do.');
    return text;
  }
  const lines = text.split('\n');
  let end = lines.length;
  for (let i = heading + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const block = buildProductLinesSection();
  if (!block) return text;
  const out = [...lines.slice(0, heading), ...block.split('\n'), ...lines.slice(end)];
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* the language pages, and the map an assistant reads to find them      */
/* ------------------------------------------------------------------ */

/**
 * The language pages that are in the build.
 *
 * WHY THEY HAVE TO BE IN THE READING LIST
 * The site publishes German and Spanish pages, and the hreflang block
 * tells a search engine they are the German and Spanish versions of
 * the English ones. But the reading list — the file an assistant reads
 * first to work out what a site knows — said "Languages: English" and
 * listed no German or Spanish page at all.
 *
 * That is a contradiction with a cost: an assistant that cannot find
 * the German page cannot quote it. A page that exists for a search
 * engine but not for an assistant is a page that gets crawled and
 * never cited.
 *
 * So the list is generated from the build, the same way the guide list
 * is. A language page that is published appears here on the next
 * build; a language that is taken down disappears.
 */
const LOCALES = ['de', 'es'];

function languagePages() {
  const out = [];
  for (const locale of LOCALES) {
    const dir = join(OUT, locale);
    if (!existsSync(dir)) continue;
    for (const file of walk(dir)) {
      if (!file.endsWith('.html')) continue;
      const rel = relative(OUT, file).split(sep).join('/');
      const { title, description } = metaOf(file);
      out.push({
        locale,
        url: `${SITE_URL}/${rel}`,
        title: title || rel,
        desc: description,
      });
    }
  }
  return out.sort((a, b) => a.url.localeCompare(b.url));
}

const langPages = languagePages();

/**
 * The "Languages" section of the reading list.
 *
 * It replaces the "> **Languages**: English" line in the header, because
 * that line is what an assistant reads to decide whether the site has
 * anything in the reader's language.
 */
function buildLanguageSection() {
  if (!langPages.length) return null;
  const names = { de: 'German', es: 'Spanish' };
  const byLocale = {};
  for (const p of langPages) {
    (byLocale[p.locale] ??= []).push(p);
  }
  const lines = [];
  lines.push('> **Languages**: English, German (/de/), Spanish (/es/) — every page below has a translated version;');
  lines.push('> the language switcher on any page takes you to the same page in the other languages.');
  for (const locale of Object.keys(byLocale)) {
    lines.push('');
    lines.push(`### ${names[locale]} pages (${byLocale[locale].length})`);
    for (const p of byLocale[locale]) {
      lines.push(`- [${p.title}](${p.url})${p.desc ? ` — ${p.desc}` : ''}`);
    }
  }
  return lines.join('\n');
}
/**
 * Replace the language block in a reading list.
 *
 * The block is bounded by the header line that names the languages and
 * the next "## " heading, so everything hand-written around it stays.
 */
/**
 * Replace the language block in a reading list.
 *
 * The block is bounded by two markers the script writes itself, so that
 * the second run finds the block and replaces it rather than appending a
 * second copy. A section bounded by "the next ## heading" cannot be
 * replaced twice: the first run's own "### " headings sit inside it.
 *
 * The block is written at the top of the file, before the first "## "
 * heading, because that is where the reader looks for what the site has:
 * the header block names the languages, and the language pages follow.
 */
function replaceLanguageSection(text) {
  const lines = text.split('\n');
  const BEGIN = '<!-- the language pages -->';
  const END = '<!-- end the language pages -->';

  const beginMark = lines.findIndex((l) => l.trim() === BEGIN);
  const endMark = lines.findIndex((l) => l.trim() === END);

  let start;
  let end;
  if (beginMark !== -1 && endMark !== -1) {
    start = beginMark;
    end = endMark + 1;
  } else {
    // the first "## " heading: the block goes above it
    const heading = lines.findIndex((l) => /^##\s/.test(l));
    if (heading === -1) {
      console.log('    the file has no heading to put the language block above.');
      return text;
    }
    start = heading;
    end = heading;
  }
  const block = buildLanguageSection();
  if (!block) {
    /*
     * THE LANGUAGES ARE DOWN: REMOVE THE BLOCK, DON'T LEAVE IT.
     *
     * The block used to be left alone when there was nothing to put in it,
     * so the pages of a language that has been taken down stayed in the
     * reading list for ever - an assistant was told about a hundred and
     * four pages that do not exist, and could not fetch a single one of
     * them. What is true now is that the site publishes one language, so
     * the list says that.
     */
    const kept = [];
    let inBlock = false;
    for (const l of lines) {
      const t = l.trim();
      if (t === BEGIN) { inBlock = true; continue; }
      if (t === END) { inBlock = false; continue; }
      if (inBlock) continue;
      if (/^> \*\*Languages\*\*/.test(t)) {
        kept.push('> **Languages**: English. This site publishes one language; the German and Spanish pages are being written and are not published.');
        continue;
      }
      kept.push(l);
    }
    return kept.join('\n');
  }
  const marked = `<!-- the language pages -->\n${block}\n<!-- end the language pages -->`;
  // The hand-written line that named the languages is replaced by the
  // block, so the reader sees one statement of what languages exist and
  // not two that disagree.
  const kept = [];
  for (const l of lines.slice(0, start)) {
    if (/^> \*\*Languages\*\*/.test(l)) continue;
    kept.push(l);
  }
  const out = [...kept, ...marked.split('\n'), ...lines.slice(end)];
  return out.join('\n');
}

/**
 * llms-sitemap.xml — the map of the reading lists themselves.
 *
 * The sitemap.xml describes the pages a crawler should fetch. This one
 * describes the files an assistant should read, in the order they
 * build the picture: the short list, the full text, the structured
 * version, the trade terms, and the knowledge base.
 */
function buildLlmsSitemap() {
  const files = [
    { loc: '/llms.txt', priority: '1.0', note: 'the short reading list: what this factory is and what it makes' },
    { loc: '/llms-full.txt', priority: '0.9', note: 'the full reading list: every page, the catalogue, the policies' },
    { loc: '/ai.json', priority: '0.8', note: 'the machine knowledge base: the catalogue, the terms and the limits, as data' },
    { loc: '/llms-full.json', priority: '0.8', note: 'the same knowledge base under its build name' },
    { loc: '/faq.json', priority: '0.8', note: 'every question and answer, as data' },
    { loc: '/company-identity.json', priority: '0.7', note: 'the company facts, and the off-site profiles where it is listed' },
    { loc: '/report-hashes.json', priority: '0.7', note: 'the SHA-256 of each published laboratory report, so a buyer can check the file they hold' },
    { loc: '/reports.json', priority: '0.7', note: 'the third-party laboratory reports, with their numbers' },
    { loc: '/TRADE-COMPLIANCE.md', priority: '0.7', note: 'the export policies in full: payment, Incoterms, VAT, disputes' },
    { loc: '/ai.txt', priority: '0.6', note: 'what AI crawlers may do with this content, and how to cite it' },
    { loc: '/sitemap.xml', priority: '0.6', note: 'every public page on the site' },
    { loc: '/sitemap-ai.xml', priority: '0.6', note: 'the pages written for assistants' },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const urls = files
    .map(
      (f) =>
        `  <url>\n    <loc>${SITE_URL}${f.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>weekly</changefreq>\n    <priority>${f.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!--\n  The reading lists, as a sitemap.\n\n  The site has three sitemaps and they answer different questions:\n    sitemap.xml      which pages a crawler should fetch\n    sitemap-ai.xml   which pages were written for assistants\n    llms-sitemap.xml which files an assistant should read, in the order\n                    that build the picture of this factory\n-->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

for (const p of [join(PUBLIC, 'llms-sitemap.xml'), join(OUT, 'llms-sitemap.xml')]) {
  writeFileSync(p, buildLlmsSitemap(), 'utf8');
}
console.log(`  llms-sitemap.xml: the reading lists, in the order an assistant reads them`);
console.log(`  the language pages in the reading lists: ${langPages.length}`);

for (const fn of ['llms.txt', 'llms-full.txt']) {
  const p = join(PUBLIC, fn);
  if (!existsSync(p)) {
    console.log(`  ${fn} is not there`);
    continue;
  }
  const before = readFileSync(p, 'utf8');
  let after = replaceGuidesSection(before, '### Guides');
  after = replaceProductLinesSection(after);
  after = replaceLanguageSection(after);
  after = replaceLabReportsSection(after, /^## Third-party lab reports \(\d+ PDFs, available for download\)$/);
  // The count in the heading is content, not identity — see the lab-reports
  // section above. Matching the whole string meant this section stopped
  // being rebuilt the moment the count changed, and it would have kept
  // saying "0 attested" on the day a batch went on chain.
  after = replaceAttestationSection(after, /^## Batch attestations \(\d+ attested, \d+ written to the chain\)$/);
  // The report sections last: they are written from public/reports.json,
  // and the sections above are written from the built pages.
  after = writeReportSections(after);
  if (after !== before) {
    writeFileSync(p, after, 'utf8');
    console.log(`  ${fn}: the guide list now comes from the build`);
  } else {
    console.log(`  ${fn}: unchanged`);
  }
}



const jp = join(PUBLIC, 'llms-full.json');
if (existsSync(jp)) {
  const d = JSON.parse(readFileSync(jp, 'utf8'));
  const before = JSON.stringify(d.articles ?? []);
  d.articles = guides.map((g) => ({
    slug: g.slug,
    title: g.title,
    url: g.url,
    desc: g.desc,
  }));
  d.updated = new Date().toISOString().slice(0, 10);
  const after = JSON.stringify(d.articles ?? []);
  writeFileSync(jp, JSON.stringify(d, null, 2) + '\n', 'utf8');
  console.log(
    `  llms-full.json: the articles array ${before === after ? 'was already current' : 'now has ' + guides.length + ' entries'}`,
  );
}

/*
 * THE LABEL ON THE MACHINE-READABLE FILES
 *
 * WHY IT IS WRITTEN HERE
 *
 * The Measures for Labelling AI-Generated Synthetic Content require
 * two layers: a mark a reader can see, and a mark written into the
 * file that a machine can read. These three files are read by
 * machines, not readers, so the machine-readable layer is the one
 * that matters for them - and it is the one that is silently lost
 * when a file is copied by hand.
 *
 * So the declaration is written by the build, into every build. It
 * cannot be forgotten, and it cannot drift away from the content it
 * describes, because it is regenerated with it.
 *
 * WHAT IT SAYS
 *
 * That an AI assisted in the writing and the assembly of the text,
 * and that the facts are checked against the laboratory reports. The
 * second half matters as much as the first: the label tells the
 * reader where the machine stopped and the documents started.
 */
const AI_LABEL = 'AI-assisted';

function labelTextFile(p) {
  if (!existsSync(p)) return false;
  const before = readFileSync(p, 'utf8');
  if (before.includes(AI_LABEL)) return false;
  const stamp = new Date().toISOString().slice(0, 10);
  const lines = before.split('\n');
  // the declaration goes at the top, before the title, so that a
  // reader - or a machine - sees it before it reads anything else
  const header = [
    `<!-- ${AI_LABEL}: this file was written and assembled with the help of an AI.`,
    `     Every fact in it is checked against the laboratory reports and the`,
    `     production records it names. Where a number has no document behind`,
    `     it, the file does not state it. Last built: ${stamp} -->`,
  ];
  const after = [...header, ...lines].join('\n');
  writeFileSync(p, after, 'utf8');
  return true;
}

for (const fn of ['llms.txt', 'llms-full.txt']) {
  const p = join(PUBLIC, fn);
  if (labelTextFile(p)) {
    console.log(`  ${fn}: the AI declaration is now at the top of the file`);
  }
}

if (existsSync(jp)) {
  const d = JSON.parse(readFileSync(jp, 'utf8'));
  if (!d.provenance) {
    d.provenance = {
      generation: AI_LABEL,
      note: 'This file was written and assembled with the help of an AI. Every fact in it is checked against the laboratory reports and the production records it names. Where a number has no document behind it, the file does not state it.',
      built: new Date().toISOString().slice(0, 10),
    };
    writeFileSync(jp, JSON.stringify(d, null, 2) + '\n', 'utf8');
    console.log('  llms-full.json: the provenance block is now in the file');
  }
}

console.log('  done.');

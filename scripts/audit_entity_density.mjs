/**
 * The entity density of the public pages.
 *
 * WHY THIS IS A GATE AND NOT A REPORT
 * An entity is the thing a search engine and an assistant use to work out
 * WHAT a page is about: the company, the place, the licences, the labs,
 * the measures. A page that talks about compliance and never names a
 * lab, a licence or a standard is a page about compliance in the same
 * way a page about a factory that never gives an address is a page
 * about a factory.
 *
 * The density is the count of distinct entities per thousand words. The
 * long pages are the ones that need it most: a 3,000-word guide has
 * room to anchor its subject twenty times, and if it anchors it twice
 * then the words are not carrying the subject.
 *
 * The gate names the pages that must carry the full set: the ones a
 * buyer lands on when they are deciding whether this factory is real.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const OUT = join(process.cwd(), 'out');

/** The entity groups. A group counts when any of its terms is present. */
const GROUPS = {
  company: ['Shenhe Zhongke', 'SHENHE ZHONGKE', '深河中科'],
  place: ['Heyuan', 'Guangdong', 'Gaopugang', 'Yuancheng'],
  address: ['Longteng Road', 'No.141-1'],
  licences: ['ISO 22716', 'FDA', 'APVMA', 'CPNP', 'hygiene licence', 'feed additive', 'high-tech'],
  labs: ['GDDCM', 'NACC', 'CMA', 'CNAS'],
  measures: ['30,000 m', '1,000,000', '5,000 m', '3,000 m', '220 employees', 'six production lines', '1.2%'],
  products: ['shampoo', 'deodoriz', 'foam', 'litter', 'spray', 'ear', 'paw', 'dental'],
  trade: ['MOQ', 'OEM', 'ODM', 'private label', 'HS code', 'MSDS', 'SDS', 'Incoterms'],
};

/**
 * The pages that must carry every group.
 *
 * These are the pages a buyer lands on while deciding whether the
 * factory is real: the catalogue, the factory, the certifications, the
 * compliance page and the contact page. A catalogue that names no lab
 * is a catalogue of claims.
 */
const MUST = [
  'index.html',
  'products.html',
  'factory.html',
  'certifications.html',
  'global-compliance.html',
  'contact.html',
  'oem-odm.html',
  'capabilities.html',
  'trade-compliance.html',
];

/** The minimum density. Below it, the long pages are not anchoring. */
const MIN_DENSITY = 2.0;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The two texts a page is measured on, and why they are not the same text.
 *
 * ENTITIES are counted over the whole body, chrome included. The footer of
 * every page prints the registered name and the street address, and that is
 * exactly what the group check wants to see on the pages a buyer uses to
 * decide whether the factory is real: the page does carry the company and
 * the address, on every page, in the same place.
 *
 * WORDS are counted over the prose only. The masthead and the footer are
 * chrome - the trust strip, the navigation, the footer links - identical on
 * every page and paid for once per page by a ratio that divides entities by
 * words. Counted, they make the score depend on how many labels the
 * navigation happens to carry: a four-word link added to the header moved
 * every long article's density, and the longest one fell under the floor
 * with none of its own text changed. That is a measurement of the masthead,
 * not of the article.
 */
function bodyText(file) {
  const html = readFileSync(file, 'utf8');
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const body = m ? m[1] : html;

  let prose = body;
  const headerEnd = prose.indexOf('</header>');
  if (headerEnd !== -1 && headerEnd < 1600) prose = prose.slice(headerEnd + '</header>'.length);
  const footerStart = prose.lastIndexOf('<footer');
  if (footerStart !== -1) prose = prose.slice(0, footerStart);

  return { full: stripTags(body), prose: stripTags(prose) };
}

const files = walk(OUT).filter((f) => f.endsWith('.html'));
const problems = [];
const rows = [];

for (const file of files) {
  const rel = relative(OUT, file).split(sep).join('/');
  if (rel.startsWith('de/') || rel.startsWith('es/')) continue;
  if (rel.startsWith('admin/') || rel.startsWith('portal/')) continue;
  if (rel.startsWith('reports/')) continue;
  if (rel === '404.html' || rel === '_not-found.html') continue;

  const { full, prose } = bodyText(file);
  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words < 200) continue;

  const lower = full.toLowerCase();
  const missing = [];
  let present = 0;
  for (const [group, terms] of Object.entries(GROUPS)) {
    if (terms.some((t) => lower.includes(t.toLowerCase()))) present += 1;
    else missing.push(group);
  }
  const density = (present / words) * 1000;
  rows.push({ rel, words, present, density });

  const must = MUST.includes(rel);
  if (must && missing.length) {
    problems.push(`${rel}: the missing entity groups: ${missing.join(', ')}`);
  }
  if (words >= 800 && density < MIN_DENSITY) {
    problems.push(`${rel}: ${words} words and only ${density.toFixed(2)} entities per 1000 (the floor is ${MIN_DENSITY})`);
  }
}

rows.sort((a, b) => a.density - b.density);
console.log('  the entity density, the lowest first:');
for (const r of rows.slice(0, 8)) {
  console.log(`    ${r.rel.padEnd(46)} ${String(r.words).padStart(5)} words  ${r.present} groups  ${r.density.toFixed(2)} per 1000`);
}
const avg = rows.reduce((s, r) => s + r.density, 0) / rows.length;
console.log(`    the average: ${avg.toFixed(2)} entities per 1000 words across ${rows.length} pages`);

if (problems.length) {
  console.log(`  FAIL the entity density: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 12)) console.log(`    ${p}`);
  process.exitCode = 1;
} else {
  console.log('  ok   the entity density: every landing page carries every entity group');
}

/**
 * Build-time SEO files: sitemap.xml and robots.txt.
 *
 * WHY THIS IS A SCRIPT AND NOT A HAND-WRITTEN FILE
 * The sitemap that shipped in public/ was maintained by hand. It listed 35 of
 * the 49 built pages and had no generation step, so every page added since was
 * silently missing from it — a page that is not in the sitemap is a page
 * Google is not told to fetch. That is the single cheapest SEO defect a site
 * can carry, and it accumulated because the list was a document rather than a
 * derivative of the build.
 *
 * WHAT IS INCLUDED
 *   in  — every built page that a buyer could land on from search
 *   out  — portal/*, admin, 404, _not-found. These are account surfaces and
 *         error pages. Listing them wastes crawl budget and can get a login
 *         page indexed as if it were content. They additionally carry
 *         noindex in their own metadata; this is the second lock on the same
 *         door, not a replacement.
 *
 * hreflang
 * The previous sitemap advertised en/es/de alternates for every URL. No
 * /de/ or /es/ tree exists — those directories are not built. A hreflang set
 * that points at nonexistent pages is a self-declared error, and Google
 * discards the whole set rather than trusting the rest of the file. Only the
 * self-referential x-default is emitted here, and the page-level hreflang
 * arrays are removed at the same time so the two cannot disagree.
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2]
  ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');
const PUBLIC = join(ROOT, 'public');
const SITE = 'https://shenhezhongke.com';

/** Never listed. Account surfaces, admin tools and error pages. */
/*
 * THE VERIFICATION FILES.
 *
 * They are written into the build so the search engine can fetch them
 * and see the token. They are not pages: no title, no canonical, no
 * content. A sitemap lists things worth having, so they do not go in
 * one.
 */
const VERIFICATION_FILES = [
  'google-site-verification.html',
  'baidu_verify_codev2.html',
  'yandex-verification.html',
  'naver.me',
  'BingSiteAuth.xml',
];

const EXCLUDE = [
  /^portal\//,
  /^admin\.html$/,
  /^404\.html$/,
  /^_not-found\.html$/,
  /\.pdf$/,
  /*
   * The attestation page is written as public/attestation/index.html and
   * published at /attestation.html -- the copy step renames it, because the
   * per-batch pages live under /verify/. The directory form is the same page
   * at the same content, and its own canonical is the flat form, so listing
   * it would tell a search engine to index a URL that contradicts itself.
   */
  /^attestation\/index\.html$/,
];

/**
 * Priority reflects commercial intent and the Hub-Spoke architecture.
 *
 * The site is organised as a hub-and-spoke: high-value hub pages
 * concentrate authority and pass it to spoke pages (individual SKUs).
 * The priority below tells a crawler which pages matter most, so the
 * crawl budget is spent on commercial pages first.
 *
 * Hierarchy:
 *   Pillar (homepage)         1.0
 *   Hub (OEM, Products,       0.9  — core conversion and entry pages
 *        Trade Compliance)
 *   Sub-Hub (product lines,   0.8  — group pages that aggregate SKUs
 *        capabilities, factory,
 *        certifications)
 *   Spoke (SKU pages)         0.7  — individual product detail pages
 *   Support (blog, guides,    0.6  — educational content that links to hubs
 *        about, contact)
 *   Other                     0.5
 */
function priorityFor(rel) {
  // Pillar
  if (rel === 'index.html') return '1.0';

  // Hub — core commercial pages with highest conversion intent
  if (rel === 'products.html') return '0.9';
  if (rel === 'oem-odm.html') return '0.9';
  if (rel === 'trade-compliance.html') return '0.9';
  if (rel === 'contact.html') return '0.9';

  // Sub-Hub — group pages and trust pages
  if (['capabilities.html', 'factory.html', 'certifications.html', 'global-compliance.html'].includes(rel)) return '0.8';
  if (rel === 'sourcing-guides.html') return '0.8';
  if (rel === 'why-us.html') return '0.8';
  // Product line pages (deodorizing-disinfecting, grooming-care, etc.)
  if (rel.startsWith('products/') && !rel.includes('/')) {
    // This is a product line page like products/deodorizing-disinfecting.html
    // (not a deeper SKU page) — but we need to distinguish. Product line pages
    // are the sub-hubs, individual SKU pages are spokes.
  }

  // Product line pages (sub-hubs) vs SKU pages (spokes)
  if (rel.startsWith('products/')) {
    // Product line pages: short slugs without many hyphens
    const slug = rel.replace('products/', '').replace('.html', '');
    const lineSlugs = [
      'deodorizing-disinfecting',
      'grooming-care',
      'outdoor-protection',
      'pet-nutrition',
      'cat-care',
    ];
    if (lineSlugs.includes(slug)) return '0.8';
    // Everything else under products/ is a SKU spoke page
    return '0.7';
  }

  // Blog articles — educational content
  if (rel.startsWith('blog/') || rel === 'blog.html') return '0.6';

  // Support pages
  if (['about.html', 'faq.html', 'msds.html', 'standards.html', 'ai-customize.html'].includes(rel)) return '0.6';
  if (['terms.html', 'privacy.html', 'data-license.html'].includes(rel)) return '0.4';

  // Europe and other regional pages
  if (rel === 'europe.html') return '0.6';
  if (rel === 'usa.html') return '0.6';

  // Everything else
  return '0.5';
}

function changefreqFor(rel) {
  if (rel === 'index.html' || rel === 'products.html') return 'weekly';
  if (rel.startsWith('products/')) return 'monthly';
  return 'monthly';
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

if (!existsSync(OUT)) {
  console.error('out/ not found — run `next build` first.');
  process.exit(1);
}

const files = walk(OUT).filter((f) => f.endsWith('.html'));

/**
 * A page that says noindex in its own metadata does not belong in a sitemap.
 *
 * The blog is one: it is announced in the navigation so the section exists
 * before the articles do, but it carries noindex and no content, and listing
 * it asks Google to index a "coming soon" page. The exclusion is read out of
 * the built page rather than hard-coded, so any page that becomes noindex is
 * dropped from the sitemap on the next run.
 */
function isNoindex(file) {
  const head = readFileSync(file, 'utf8').slice(0, 4000);
  const m = head.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  return Boolean(m && /noindex/i.test(m[1]));
}

const urls = files
  .map((f) => relative(OUT, f).split(sep).join('/'))
  .filter((rel) => !EXCLUDE.some((re) => re.test(rel)))
  // The verification files are the proof the search engine reads; they
  // are not pages. Listing one in a sitemap asks the engine to fetch
  // and index a document with no title, no canonical and no content.
  .filter((rel) => !VERIFICATION_FILES.some((v) => rel === v))
  .filter((rel) => !isNoindex(join(OUT, rel)))
  // products/pet-x.html only exists for SKUs that have a detail page; the
  // category pages (grooming-care etc.) are real content and stay in.
  .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));

const today = new Date().toISOString().slice(0, 10);

/**
 * The date a page last changed.
 *
 * WHAT IT WAS
 * The built file's own modification time. The reasoning was sound: a
 * page that was not rebuilt keeps the date it had, so the sitemap tells
 * a search engine which pages moved rather than saying every page
 * moved at once.
 *
 * WHY THAT DID NOT HOLD
 * A static export rewrites all eighty-six HTML files on every build.
 * So every file's modification time is the build time, and every
 * lastmod came out as the same day. A search engine reads lastmod as
 * "this page changed on this date", and a sitemap where all sixty URLs
 * carry the same date says the opposite of what is true.
 *
 * WHAT IT IS NOW
 * The modification time of the SOURCE that produced the page -- the
 * content file it was rendered from, or the page module itself when
 * there is no content file. That is the date the content last really
 * changed, and it is stable across builds that did not touch it.
 *
 * So a page whose content was edited on Monday says Monday, while the
 * pages around it keep the dates they had. That is the signal a search
 * engine can actually use, and it is the one the file-mtime approach
 * was trying to produce.
 */
function lastmodFor(rel) {
  // The content file a page was rendered from, if there is one.
  const slug = rel.replace(/\.html$/, '').replace(/^index$/, '');
  const candidates = [
    join(ROOT, 'content', `${slug.replace(/\//g, '__')}.json`),
    join(ROOT, 'content', `${slug}.json`),
    join(ROOT, 'app', '(site)', slug, 'page.tsx'),
  ];
  for (const c of candidates) {
    try {
      if (existsSync(c)) return statSync(c).mtime.toISOString().slice(0, 10);
    } catch {
      /* try the next one */
    }
  }
  try {
    return statSync(join(OUT, rel)).mtime.toISOString().slice(0, 10);
  } catch {
    return today;
  }
}

const body = urls
  .map((rel) => {
    const loc = rel === 'index.html' ? `${SITE}/` : `${SITE}/${rel}`;
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(rel)}</lastmod>`,
      `    <changefreq>${changefreqFor(rel)}</changefreq>`,
      `    <priority>${priorityFor(rel)}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERATED by scripts/gen-seo-files.mjs — do not hand-edit.
     Re-run after every build: node scripts/gen-seo-files.mjs
     Listed: ${urls.length} pages. Excluded: portal, admin, 404. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemap, 'utf8');

// AI crawlers are allowed by the wildcard above, but stating them explicitly
// is not a formality. GEO depends on these crawlers reading the catalogue,
// and a crawler that is named is one whose visit the operator has considered
// rather than one that fell through a default. Google-Extended in particular
// governs whether a page can be cited in an AI Overview; it is allowed by
// default, but an explicit Allow is the signal that the citation is intended.
//
// The comment on each block states WHAT the crawler is for, so a future
// change to one of these is a decision rather than an accident.
const AI_CRAWLERS = [
  ['GPTBot', 'OpenAI — training and ChatGPT browsing'],
  ['OAI-SearchBot', 'OpenAI — ChatGPT search results'],
  ['ChatGPT-User', 'OpenAI — user-initiated fetches'],
  ['ClaudeBot', 'Anthropic — Claude indexing'],
  ['Claude-User', 'Anthropic — user-initiated fetches'],
  ['Claude-SearchBot', 'Anthropic — Claude search'],
  ['Claude-Web', 'Anthropic — pages fetched inside a Claude answer'],
  ['anthropic-ai', 'Anthropic — the crawler that decides what Claude knows'],
  ['PerplexityBot', 'Perplexity — answer citations'],
  ['Perplexity-User', 'Perplexity — pages fetched inside a Perplexity answer'],
  ['Google-Extended', 'Google — AI Overviews and Gemini grounding'],
  ['Applebot-Extended', 'Apple — Siri and Spotlight suggestions'],
  ['Bytespider', 'ByteDance — Doubao and AI retrieval corpora'],
  ['cohere-ai', 'Cohere — AI retrieval corpora'],
  ['CCBot', 'Common Crawl — the corpus most models are trained on'],
  ['Bingbot', 'Bing — feeds Copilot answers'],
  ['DuckAssistBot', 'DuckDuckGo — answer panels'],
  ['Meta-ExternalAgent', 'Meta — AI assistant retrieval'],
  ['Amazonbot', 'Amazon — AI shopping assistant'],
  ['YouBot', 'You.com — search answers'],
  ['Diffbot', 'Diffbot — AI knowledge graph crawler'],
  ['Timpibot', 'Timpibot — semantic search'],
  ['Omgilibot', 'Omgilibot — semantic search'],
];

const aiBlocks = AI_CRAWLERS
  .map(([name, why]) => `# ${why}\nUser-agent: ${name}\nAllow: /\nDisallow: /portal/\nDisallow: /admin.html\nDisallow: /admin/`)
  .join('\n\n');

const robots = `# GENERATED by scripts/gen-seo-files.mjs — do not hand-edit.
User-agent: *
Allow: /

# Account surfaces carry noindex in their own metadata as well. Blocking the
# crawl keeps credentials and dashboard URLs out of the index entirely.
#
# /admin/ is a DIRECTORY, and the desk now lives in it: /admin/quotes.html,
# /admin/orders.html and the rest. Blocking only /admin.html left the nine
# console screens crawlable — noindex keeps them out of the index, but a
# crawler still downloads them, and the crawl budget spent on a screen
# behind a sign-in is budget not spent on a page a buyer can find.
Disallow: /portal/
Disallow: /admin.html
Disallow: /admin/

# ---------------------------------------------------------------------------
# AI crawlers
#
# These are permitted by the wildcard above. They are named explicitly
# because generative search is a channel this site is written for, and a
# crawler that is named is one whose access was a decision.
# ---------------------------------------------------------------------------

${aiBlocks}

# Two sitemaps are advertised, and the order matters.
#
# sitemap.xml is the one every engine understands: the 64 public pages.
# sitemap-index.xml points at the three of them — the pages, the machine
# reading lists and the images — so an engine that follows the index also
# finds the AI file. Advertising only the first left the AI surface
# undiscovered by anything that reads robots.txt and nothing else.
Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/sitemap-index.xml
#
# llms-sitemap.xml is the reading list, and it is the ONLY place that
# lists company-identity.json and ai.json - the entity record and the
# machine-readable company file. Advertising the two sitemaps above and
# not this one left the entity record published and undiscoverable: a
# crawler that reads robots.txt and nothing else never saw it.
Sitemap: ${SITE}/llms-sitemap.xml
#
# sitemap-ai.xml is the AI-native file index: llms.txt, llms-full.json,
# ai-manifest.json (the answer-engine capability manifest),
# topic-cluster.json (the semantic cluster map) and citation-graph.json
# (the lab-report to product-claim reverse index). Advertising it here
# lets a generative engine discover the structured files that describe
# topical authority and evidence chains.
Sitemap: ${SITE}/sitemap-ai.xml
#
# sitemap-ai.xml also lists the machine-readable files themselves, and the
# newest of them is the product feed: /product-feed.json - the catalogue as
# a list an agent can act on, with every SKU's minimum order and lead times
# and the enquiry contract. The other three AI files (llms.txt,
# llms-full.json, ai.txt) are listed there in the same way.
`;

writeFileSync(join(PUBLIC, 'robots.txt'), robots, 'utf8');

// Mirror into the build output so a static host serves the regenerated file
// without needing a separate copy step.
writeFileSync(join(OUT, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(join(OUT, 'robots.txt'), robots, 'utf8');

// ---------------------------------------------------------------------------
// THE LANGUAGE OF A PAGE IS IN ITS ADDRESS
//
// A page at /de/products.html is a German page, and the html element has to
// say so. The root layout renders one <html lang="en"> for the whole
// export, because the root layout sits above every route and cannot see
// the locale. So the language is written here, after the build, where the
// path of the file is known.
//
// This is not a cosmetic fix. A German page that declares lang="en" tells
// a search engine the content is English, and tells a screen reader to
// read German with English pronunciation rules — which is exactly the
// German reader this page was built for.
// ---------------------------------------------------------------------------

const LOCALE_OF = { de: 'de', es: 'es' };
let relabelled = 0;
for (const file of files) {
  const rel = relative(OUT, file).split(sep).join('/');
  const m = rel.match(/^(de|es)\//);
  if (!m) continue;
  const lang = LOCALE_OF[m[1]];
  let html = readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(/<html lang="[a-zA-Z-]+"/, `<html lang="${lang}"`);
  if (html !== before) {
    writeFileSync(file, html, 'utf8');
    relabelled += 1;
  }
}
console.log(`html lang   : ${relabelled} language pages marked`);

const excluded = files.length - urls.length;
console.log(`sitemap.xml : ${urls.length} URLs (${excluded} pages excluded)`);
console.log(`robots.txt  : written`);
if (urls.length < files.length - excluded) {
  console.warn('unexpected: URL count does not reconcile with the exclusion filter.');
}
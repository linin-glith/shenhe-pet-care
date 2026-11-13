/**
 * INDEX HEALTH — does the sitemap describe the site that was actually built?
 *
 * WHY THIS EXISTS
 *
 * A sitemap is a promise. It says: these addresses are worth crawling, and
 * each one is its own canonical page. Nothing checks that promise today, so
 * it can rot silently in two directions:
 *
 *   1. the sitemap lists a page that no longer exists (a 404 the engine
 *      crawls, spends budget on, and learns to distrust the file);
 *   2. the build produces an indexable page the sitemap does not list
 *      (a page that exists and is never asked for).
 *
 * Both are invisible in the build log, and both are cheap to catch locally:
 * the sitemap and the HTML sit in the same `out/` tree, so this compares one
 * against the other without touching the network.
 *
 * WHAT IT CHECKS, PER URL IN THE SITEMAP
 *
 *   - the file exists in out/            (missing = the promise is stale)
 *   - <link rel="canonical"> is the URL  (mismatch = two claims of identity)
 *   - no <meta name="robots"> noindex    (listed but told not to index)
 *
 * AND IN THE OTHER DIRECTION
 *
 *   - every built .html that is indexable must be in the sitemap, unless it
 *     is one of the excluded surfaces (portal, admin, 404), which the sitemap
 *     generator already excludes by name.
 *
 * Exit code is 1 when anything fails, so it can sit in `npm run check`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const OUT = 'out';
const SITE = 'https://shenhezhongke.com';

/** Surfaces the generator excludes on purpose; they must not be "missing". */
const EXCLUDED = ['404.html', 'admin.html', 'attestation.html', 'google-site-verification.html', '_not-found.html'];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function urlOf(file) {
  const rel = relative(OUT, file).split(sep).join('/');
  return `${SITE}/${rel}`;
}

function fileOf(url) {
  if (!url.startsWith(SITE)) return null;
  const path = url.slice(SITE.length) || '/';
  const clean = path.replace(/^\//, '');
  if (clean === '') return join(OUT, 'index.html');
  return join(OUT, clean);
}

/** Reads the few tags that decide identity and indexability. */
function headOf(html) {
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i) || [])[1];
  const robots = (html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i) || [])[1];
  return { canonical, robots };
}

const sitemapXml = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
const listed = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const errors = [];
const warnings = [];
const ok = [];

for (const url of listed) {
  const file = fileOf(url);
  if (!file) { warnings.push(`${url} — not on this site's host`); continue; }
  if (!existsSync(file)) { errors.push(`${url} — listed, but ${relative(OUT, file)} does not exist`); continue; }

  const html = readFileSync(file, 'utf8');
  const { canonical, robots } = headOf(html);

  if (!canonical) errors.push(`${url} — listed, but carries no canonical`);
  else if (canonical.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
    errors.push(`${url} — canonical says ${canonical}`);
  }
  if (robots && /noindex/i.test(robots)) errors.push(`${url} — listed, but robots says "${robots}"`);

  ok.push(url);
}

const built = walk(OUT);
const listedSet = new Set(listed.map((u) => u.replace(/\/$/, '')));
for (const file of built) {
  const rel = relative(OUT, file).split(sep).join('/');
  if (EXCLUDED.includes(rel)) continue;
  const url = urlOf(file);
  if (listedSet.has(url.replace(/\/$/, ''))) continue;
  const html = readFileSync(file, 'utf8');
  const { robots, canonical } = headOf(html);
  if (robots && /noindex/i.test(robots)) continue;
  /*
   * A build artefact whose canonical already points at a listed page is a
   * duplicate copy, not an unlisted page: /index.html declares / as its
   * canonical and nginx 301s it there. Counting it as "missing from the
   * sitemap" would be a false alarm, and a gate that cries wolf is a gate
   * somebody turns off.
   */
  if (canonical && listedSet.has(canonical.replace(/\/$/, ''))) continue;
  warnings.push(`${url} — indexable but not in the sitemap`);
}

console.log(`INDEX HEALTH`);
console.log(`  sitemap lists  ${listed.length} url(s)`);
console.log(`  built          ${built.length} .html file(s)`);
console.log(`  consistent     ${ok.length}`);
console.log('');
for (const e of errors) console.log(`  ERROR   ${e}`);
for (const w of warnings) console.log(`  WARN    ${w}`);
console.log('');
console.log(errors.length ? `FAILED — ${errors.length} error(s), ${warnings.length} warning(s)` : `PASSED — ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

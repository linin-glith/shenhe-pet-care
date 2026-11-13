/**
 * Copy the files that are written after the build into the published
 * folder.
 *
 * The sitemap and the robots file are written by a script that runs
 * after the build, into public/. Next copies public/ into out/ during
 * the build, so the file that was just written is one step behind the
 * folder that gets published. This puts it where it belongs.
 *
 * It also removes the files from earlier repairs that are no longer
 * listed by anything: a sitemap that nothing points at is a file that
 * drifts, and then it points at pages that have moved.
 */
import { copyFileSync, existsSync, readFileSync, unlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2]
  ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const OUT = join(ROOT, 'out');

/** The files the build writes after Next has copied public/ into out/. */
const FILES = [
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'llms-full.txt',
  'llms-full.json',
  'llms-sitemap.xml',
  'company-identity.json',
  'report-hashes.json',
  'ai.txt',
  // AI-native index files — the answer-engine capability manifest,
  // the semantic cluster map, and the citation graph.
  '.well-known/ai-manifest.json',
  'topic-cluster.json',
  'citation-graph.json',
];


/**
 * The files that are published under another name.
 *
 * The knowledge is not written twice: the machine version of the reading
 * list is llms-full.json, and every question and answer is in
 * assets/data/faq.json. The assistant is told to read "/ai.json" and
 * "/faq.json", so those are the addresses the same content is served
 * at. Two names, one file - the content cannot drift between them.
 */
const COPY_AS = [
  ['llms-full.json', 'ai.json'],
  ['assets/data/faq.json', 'faq.json'],
];
for (const [fromName, toName] of COPY_AS) {
  const from = join(PUBLIC, fromName);
  const to = join(OUT, toName);
  if (!existsSync(from)) {
    console.log('  not there, skipped: ' + fromName);
    continue;
  }
  copyFileSync(from, to);
  console.log('  published ' + toName + ' from ' + fromName);
}

/** The files from earlier repairs that nothing points at any more. */
const STALE = [
  'sitemap-fixed.xml',
  /*
   * The attestation page in its directory form.
   *
   * The generator writes public/attestation/index.html and the block above
   * copies it to out/attestation.html, which is the URL the site's own
   * convention uses and the URL the page's canonical names. The directory
   * form is the same page at a URL nothing points at -- and because `next
   * build` copies public/ into out/, it also came back as a second live URL
   * carrying a stale copy of the page. Two URLs, one page, and the older one
   * had the older meta description, which is what the build gate caught.
   *
   * It is removed here, after the copy, so the generator can write it again
   * on the next build.
   */
  'attestation/index.html',
];

for (const f of FILES) {
  const from = join(PUBLIC, f);
  const to = join(OUT, f);
  if (!existsSync(from)) {
    console.log('  not there, skipped: ' + f);
    continue;
  }
  // Ensure the parent directory exists (e.g. .well-known/ for ai-manifest.json)
  const dir = join(to, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  copyFileSync(from, to);
  console.log('  copied ' + f);
}

/**
 * The report pages.
 *
 * The report generator writes into public/reports/, and Next has already
 * copied public/ into out/ by the time it runs. Without this the built
 * site kept the previous year's report pages — which is how the report
 * descriptions stayed thirty-five characters long after they had been
 * rewritten, and why the search results for a report still read like a
 * note in a table.
 */
{
  const from = join(PUBLIC, 'reports');
  const to = join(OUT, 'reports');
  if (existsSync(from)) {
    mkdirSync(to, { recursive: true });
    let n = 0;
    for (const f of readdirSync(from)) {
      if (!f.endsWith('.html')) continue;
      copyFileSync(join(from, f), join(to, f));
      n += 1;
    }
    console.log('  copied ' + n + ' report pages');
  }
}

/**
 * The verification pages, the same way and for the same reason.
 *
 * The batch attestation generator writes into public/verify/ after Next
 * has copied public/ into out/. Without this the pages exist in the
 * repository and not on the site, and the batch a buyer scans the code
 * on the carton for has no page to land on.
 */
{
  const from = join(PUBLIC, 'verify');
  const to = join(OUT, 'verify');
  if (existsSync(from)) {
    mkdirSync(to, { recursive: true });
    // the target is cleared first: a page for a batch that no longer
    // exists is a page that sends a buyer to a proof of nothing
    for (const old of readdirSync(to)) {
      unlinkSync(join(to, old));
    }
    let n = 0;
    for (const f of readdirSync(from)) {
      if (!f.endsWith('.html')) continue;
      copyFileSync(join(from, f), join(to, f));
      n += 1;
    }
    console.log('  copied ' + n + ' verification pages');
  }
}

/**
 * The carton labels, the same way.
 *
 * The label generator writes into public/labels/ after Next has copied
 * public/ into out/, so without this the labels exist in the repository
 * and not on the site — and the desk needs to be able to hand the
 * printer a file.
 */
{
  const from = join(PUBLIC, 'labels');
  const to = join(OUT, 'labels');
  if (existsSync(from)) {
    mkdirSync(to, { recursive: true });
    // the target is cleared first: a label for a batch that no longer
    // exists is worse than no label, because the printer will put it on
    // a carton
    for (const old of readdirSync(to)) {
      unlinkSync(join(to, old));
    }
    let n = 0;
    for (const f of readdirSync(from)) {
      if (!f.endsWith('.svg') && !f.endsWith('.pdf')) continue;
      copyFileSync(join(from, f), join(to, f));
      n += 1;
    }
    console.log('  copied ' + n + ' carton labels');
  }
}

/**
 * The attestation index.
 *
 * It is written as public/attestation/index.html and published at
 * /attestation.html, so the copy renames it: the generator makes a
 * directory because the page and the per-batch pages live together.
 */
{
  const from = join(PUBLIC, 'attestation', 'index.html');
  const to = join(OUT, 'attestation.html');
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log('  copied the attestation index');
  }
}

for (const f of STALE) {
  for (const dir of [PUBLIC, OUT]) {
    const p = join(dir, f);
    if (existsSync(p)) {
      unlinkSync(p);
      console.log('  removed the stale ' + f + ' from ' + dir);
    }
  }
}

// The index of sitemaps, if it is in public/.
for (const f of ['sitemap-index.xml', 'sitemap-ai.xml', 'sitemap-images.xml']) {
  const from = join(PUBLIC, f);
  const to = join(OUT, f);
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log('  copied ' + f);
  }
}

// The count, so the build log says what was published.
const sitemapPath = join(OUT, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  const text = readFileSync(sitemapPath, 'utf8');
  const n = (text.match(/<loc>/g) ?? []).length;
  console.log('  the published sitemap holds ' + n + ' urls');
}

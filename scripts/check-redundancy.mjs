/**
 * The redundancy check.
 *
 * `scripts/check-build.mjs` guards what the build produced: are the pages
 * there, do the links resolve, does the structured data parse. This script
 * guards the other side of the same coin: what the build did NOT produce.
 *
 * Dead code is not free. A page copy that nothing imports still costs
 * every future reader the time to work out which copy is real, and it
 * costs every future edit the risk of changing the wrong one. The
 * `app/(site)/__shared/` directory was exactly that: 43 parallel copies of
 * pages that live, and are rendered, in `app/(site)/<route>/page.tsx`.
 * They were removed on 2026-11-02 once a script could prove nothing
 * imported them.
 *
 * THREE CHECKS
 *
 *   1. `app/(site)/__shared/` is gone, or holds no files. The directory
 *      held copies of pages. If a copy ever comes back, it will drift
 *      from the page that actually renders.
 *
 *   2. `server/` and `server-pg/` do not silently diverge. They are two
 *      implementations of the same API - one SQLite for a laptop, one
 *      PostgreSQL for the server - and they share file names. When the
 *      same name holds different bytes, that is a fork, and a fork is
 *      where a fix gets applied to one side only. This check REPORTS the
 *      fork. It does not touch it: the two sides differ on purpose in
 *      several files, and the one that answers production requests is
 *      `server-pg/`.
 *
 *   3. No `.tsx`/`.ts` file sits outside the import graph. A file
 *      nothing imports renders nothing. The exceptions are listed
 *      below and each one is a reason.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not delete anything, and it does not fail the build. It exits
 * non-zero when it finds something, so it can be used as a gate, but it
 * is not wired into `npm run build` — the build gate is
 * `scripts/check-build.mjs`, and this one is a separate opinion about
 * the source tree.
 *
 *   node scripts/check-redundancy.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const SITE = process.cwd();

/* ------------------------------------------------------------------ *
 * the helpers
 * ------------------------------------------------------------------ */

function walk(dir, out = [], skipDirs = new Set()) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(join(dir, entry.name), out, skipDirs);
    } else if (entry.isFile()) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'out', '_backup-handwritten',
]);

/* the reasons a file is allowed to have no importer */
const IMPORTLESS_ALLOWED = [
  // Next.js reaches these by convention, not by import.
  { re: /^app\/(.*\/)?page\.tsx$/, why: 'a route: Next.js renders it by convention' },
  { re: /^app\/(.*\/)?layout\.tsx$/, why: 'a layout: Next.js renders it by convention' },
  { re: /^app\/(.*\/)?template\.tsx$/, why: 'a template: Next.js renders it by convention' },
  { re: /^app\/(.*\/)?loading\.tsx$/, why: 'a loading state: Next.js renders it by convention' },
  { re: /^app\/(.*\/)?error\.tsx$/, why: 'an error boundary: Next.js renders it by convention' },
  { re: /^app\/(.*\/)?global-error\.tsx$/, why: 'a global error boundary: Next.js renders it by convention' },
  { re: /^app\/not-found\.tsx$/, why: 'the 404 page: Next.js renders it by convention' },
  // The entry points of the tooling itself.
  { re: /^scripts\//, why: 'a script: run from the command line' },
  // Content and parked routes are data, not modules.
  { re: /^content\//, why: 'content: imported as data, not as a module graph' },
  { re: /^i18n-routes-parked\//, why: 'parked routes: kept out of the build on purpose' },
  // public/ is copied to the site root verbatim; the HTML links to it by
  // URL, so it is not part of the module graph.
  { re: /^public\//, why: 'a static asset: copied to the site root and linked by URL' },
  // The two apis are started as processes.
  { re: /^server\/index\.mjs$/, why: 'the local api: started as a process' },
  { re: /^server-pg\/server\.js$/, why: 'the production api: started as a process' },
  // The build entry points.
  { re: /^(next-env\.d\.ts|next\.config\.ts|tsconfig\.json)$/, why: 'a build entry point' },
  // Type declarations that ship with the framework.
  { re: /^node_modules\//, why: 'a dependency' },
];

function allowedReason(rel) {
  for (const rule of IMPORTLESS_ALLOWED) {
    if (rule.re.test(rel)) return rule.why;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 1. the __shared directory
 * ------------------------------------------------------------------ */

function checkShared() {
  const dir = join(SITE, 'app', '(site)', '__shared');
  const problems = [];
  let files = 0;
  let bytes = 0;

  if (!existsSync(dir)) {
    return { ok: true, files: 0, bytes: 0, problems, absent: true };
  }

  for (const f of walk(dir)) {
    files += 1;
    bytes += statSync(f).size;
    problems.push(`app/(site)/__shared/${relative(dir, f).split(sep).join('/')}`);
  }

  return { ok: files === 0, files, bytes, problems, absent: false };
}

/* ------------------------------------------------------------------ *
 * 2. the two apis
 * ------------------------------------------------------------------ */

function checkApiFork() {
  const a = join(SITE, 'server');
  const b = join(SITE, 'server-pg');
  const forks = [];

  if (!existsSync(a) || !existsSync(b)) {
    return { ok: false, forks, missing: true, note: 'server/ or server-pg/ is missing' };
  }

  const filesA = walk(a, [], SKIP_DIRS);
  const filesB = walk(b, [], SKIP_DIRS);

  const byName = (files, base) => {
    const m = new Map();
    for (const f of files) {
      const rel = relative(base, f).split(sep).join('/');
      m.set(rel, f);
    }
    return m;
  };

  const mapA = byName(filesA, a);
  const mapB = byName(filesB, b);

  const shared = [...mapA.keys()].filter((k) => mapB.has(k)).sort();

  for (const rel of shared) {
    // Documentation is not code. The two READMEs describe two different
    // apis on purpose, so their bytes are supposed to differ.
    if (rel.toLowerCase().endsWith('.md')) continue;
    const pa = mapA.get(rel);
    const pb = mapB.get(rel);
    const ba = readFileSync(pa);
    const bb = readFileSync(pb);
    if (!ba.equals(bb)) {
      forks.push({
        name: rel,
        bytesServer: ba.length,
        bytesServerPg: bb.length,
      });
    }
  }

  return {
    ok: forks.length === 0,
    forks,
    missing: false,
    onlyInServer: [...mapA.keys()].filter((k) => !mapB.has(k)).sort(),
    onlyInServerPg: [...mapB.keys()].filter((k) => !mapA.has(k)).sort(),
    compared: shared.length,
  };
}

/* ------------------------------------------------------------------ *
 * 3. files outside the import graph
 * ------------------------------------------------------------------ */

const SPECIFIER_RE = new RegExp(
  [
    String.raw`\bfrom\s+["'](?<spec>[^"']+)["']`,
    String.raw`\bimport\s+["'](?<spec>[^"']+)["']`,
    String.raw`\brequire\s*\(\s*["'](?<spec>[^"']+)["']\s*\)`,
    String.raw`\bimport\s*\(\s*["'](?<spec>[^"']+)["']\s*\)`,
  ].join('|'),
  'g',
);

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function checkUnreferenced() {
  const sources = walk(SITE, [], SKIP_DIRS).filter((f) => {
    const ext = f.slice(f.lastIndexOf('.'));
    return SOURCE_EXT.has(ext);
  });

  const relOf = (f) => relative(SITE, f).split(sep).join('/');

  /* the set of every path that something resolves to */
  const imported = new Set();

  const resolve = (fromFile, spec) => {
    const clean = spec.split('?')[0].split('#')[0];
    const bases = [];
    if (clean.startsWith('@/')) {
      bases.push(join(SITE, clean.slice(2)));
    } else if (clean.startsWith('.')) {
      bases.push(join(dirname(fromFile), clean));
    } else {
      // a bare specifier: a package. It resolves into node_modules, which
      // is not part of the site's own graph.
      return null;
    }
    const hits = [];
    for (const base of bases) {
      hits.push(base);
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
        hits.push(base + ext);
      }
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
        hits.push(join(base, 'index' + ext));
      }
    }
    for (const h of hits) {
      try {
        if (existsSync(h) && statSync(h).isFile()) return h;
      } catch {
        /* not resolvable */
      }
    }
    return null;
  };

  for (const file of sources) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    SPECIFIER_RE.lastIndex = 0;
    let m;
    while ((m = SPECIFIER_RE.exec(text)) !== null) {
      const spec = m.groups && m.groups.spec;
      if (!spec) continue;
      const target = resolve(file, spec);
      if (target) imported.add(target);
    }
  }

  const orphans = [];
  for (const file of sources) {
    if (imported.has(file)) continue;
    const rel = relOf(file);
    const reason = allowedReason(rel);
    if (reason) continue;
    orphans.push(rel);
  }

  orphans.sort();
  return { orphans, scanned: sources.length };
}

/* ------------------------------------------------------------------ *
 * the report
 * ------------------------------------------------------------------ */

const findings = [];

console.log('');
console.log('the redundancy check');
console.log('--------------------');

/* 1 */
const shared = checkShared();
if (shared.absent) {
  console.log('  ok   the copies: app/(site)/__shared/ is gone (0 files)');
} else if (shared.ok) {
  console.log('  ok   the copies: app/(site)/__shared/ holds no files');
} else {
  console.log(`  FAIL the copies: app/(site)/__shared/ holds ${shared.files} file(s), ${shared.bytes} bytes`);
  for (const p of shared.problems) {
    console.log(`         ${p}`);
  }
  findings.push(`app/(site)/__shared/ holds ${shared.files} file(s)`);
}

/* 2 */
const api = checkApiFork();
if (api.missing) {
  console.log('  FAIL the two apis: ' + api.note);
  findings.push(api.note);
} else {
  if (api.forks.length === 0) {
    console.log(`  ok   the two apis: ${api.compared} same-named file(s) agree byte for byte`);
  } else {
    console.log(`  FAIL the two apis: ${api.forks.length} same-named file(s) differ — a fork, report only:`);
    for (const f of api.forks) {
      console.log(`         ${f.name}  server=${f.bytesServer}B  server-pg=${f.bytesServerPg}B`);
    }
    findings.push(`${api.forks.length} file(s) differ between server/ and server-pg/`);
  }
  for (const only of api.onlyInServer || []) {
    console.log(`  note only in server/: ${only}`);
  }
  for (const only of api.onlyInServerPg || []) {
    console.log(`  note only in server-pg/: ${only}`);
  }
}

/* 3 */
const unref = checkUnreferenced();
if (unref.orphans.length === 0) {
  console.log(`  ok   the import graph: ${unref.scanned} source file(s), nothing outside it`);
} else {
  console.log(`  FAIL the import graph: ${unref.orphans.length} file(s) that nothing imports:`);
  for (const o of unref.orphans) {
    console.log(`         ${o}`);
  }
  findings.push(`${unref.orphans.length} file(s) outside the import graph`);
}

console.log('');

if (findings.length === 0) {
  console.log('  no redundancy found.');
  console.log('');
  process.exit(0);
}

console.log(`  ${findings.length} finding(s). Nothing was changed — this script only reports.`);
console.log('');
process.exit(1);

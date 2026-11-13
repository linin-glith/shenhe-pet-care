/**
 * The files the search engines look for to prove the site is yours.
 *
 * WHY
 * A search engine will not index a site it cannot prove belongs to
 * whoever is asking. The proof is a file, and the file has a name the
 * engine decides. So the files are written at build time, into the
 * site root, and the deployment puts them back.
 *
 * The values come from environment variables, so a value the engine
 * gave us is never typed into the source and never forgotten:
 *
 *   GOOGLE_SITE_VERIFICATION   the content of google-site-verification.html
 *   BING_SITE_AUTH             the content of BingSiteAuth.xml
 *   BAIDU_VERIFY_CODE          the content of baidu_verify_codev2.html
 *   YANDEX_VERIFICATION        the content of yandex-verification.html
 *   NAVER_VERIFICATION         the content of naver.me
 *
 * A file whose value is not set is not written at all. A verification
 * file with a placeholder in it is worse than no file: the engine
 * reads it, fails, and may remember the failure.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.cwd();
const OUT = join(SITE, 'out');
const PUBLIC = join(SITE, 'public');

if (!existsSync(OUT)) {
  console.error('out/ not found — run `next build` first.');
  process.exit(1);
}

/** The files, and the environment variable that holds each value. */
const FILES = [
  {
    name: 'google-site-verification.html',
    env: 'GOOGLE_SITE_VERIFICATION',
    build: (v) => `google-site-verification: google${v}.html\n`,
    note: 'Google Search Console — HTML tag verification',
  },
  {
    name: 'BingSiteAuth.xml',
    env: 'BING_SITE_AUTH',
    build: (v) => `<?xml version="1.0"?>\n<users>\n  <user>${v}</user>\n</users>\n`,
    note: 'Bing Webmaster Tools — XML file verification',
  },
  {
    name: 'baidu_verify_codev2.html',
    env: 'BAIDU_VERIFY_CODE',
    build: (v) => `${v}\n`,
    note: 'Baidu search resource platform — file verification',
  },
  {
    name: 'yandex-verification.html',
    env: 'YANDEX_VERIFICATION',
    build: (v) => `${v}\n`,
    note: 'Yandex Webmaster — file verification',
  },
  {
    name: 'naver.me',
    env: 'NAVER_VERIFICATION',
    build: (v) => `${v}\n`,
    note: 'Naver — file verification',
  },
];

let written = 0;
for (const f of FILES) {
  const value = process.env[f.env];
  if (!value) {
    console.log(`  skipped ${f.name}  (${f.env} is not set)`);
    continue;
  }
  const content = f.build(value);
  for (const dir of [OUT, PUBLIC]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, f.name), content, 'utf8');
  }
  console.log(`  written ${f.name}  ${f.note}`);
  written++;
}

console.log(`  the verification files: ${written}`);

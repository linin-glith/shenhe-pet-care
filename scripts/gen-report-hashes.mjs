#!/usr/bin/env node
/**
 * The report hash manifest.
 *
 * WHY A MANIFEST AND NOT A HASH IN THE DATABASE
 * The buyer has to be able to check the proof, and the check is: take
 * the PDF you downloaded from this site, compute its SHA-256, and see
 * whether it is the hash that the chain recorded. For that to work, the
 * hash has to be of the exact bytes the buyer downloads.
 *
 * The files in public/assets/img/certs/ are copied into the build
 * unchanged, so their bytes are fixed. Their hashes can therefore be
 * computed once, here, and written down. The database then refers to
 * this manifest rather than holding a hash of its own, and there is one
 * number rather than two that can disagree.
 *
 * If a report file is ever re-exported, its hash changes, and this
 * manifest is where that change becomes visible — the build gate below
 * fails, because a report whose hash moved means the proof a buyer was
 * given no longer matches the file on the site.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const CERTS = join(PUBLIC, 'assets', 'img', 'certs');
const OUT_JSON = join(PUBLIC, 'report-hashes.json');
const OUT_TS = join(ROOT, 'lib', 'report-hashes.ts');

/**
 * The typed copy of the manifest.
 *
 * It used to be a hand copy of the JSON: nobody wrote it, nobody read it,
 * and it was a second published number that could disagree with the first
 * without anything noticing. It is written from the same object as the JSON,
 * so the two are the same file by construction.
 */
const TS_HEADER = `/**
 * The published laboratory reports and their hashes.
 *
 * THE HASH IS OF THE FILE THE SITE SERVES
 * A buyer downloads the PDF from the url in the manifest and computes its
 * SHA-256. If it matches the hash that the chain recorded for the batch, the
 * file has not been changed since the batch was attested.
 *
 * GENERATED: scripts/gen-report-hashes.mjs writes this file and
 * public/report-hashes.json from the same data. Do not edit it by hand --
 * the build gate checks that the two are the same file.
 */
`;


function main() {
  // the report index: the number, the issuer and the file
  const indexPath = join(PUBLIC, 'reports.json');
  if (!existsSync(indexPath)) {
    console.error('  reports.json is not there — run gen-reports-index.mjs first.');
    process.exit(1);
  }
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));

  const records = [];
  const missing = [];
  for (const r of index.reports ?? []) {
    const fileName = r.fileName;
    const path = join(CERTS, fileName);
    if (!existsSync(path)) {
      missing.push(fileName);
      continue;
    }
    const bytes = readFileSync(path);
    records.push({
      reportNumber: r.reportNumber,
      title: r.title,
      issuer: r.issuer,
      fileName,
      // the address the buyer downloads it from
      url: r.file,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }

  if (missing.length) {
    console.error('  the report files that are missing: ' + missing.join(', '));
    process.exit(1);
  }

  const out = {
    _readme:
      'The SHA-256 of each published laboratory report. A buyer downloads the file from ' +
      'the url and computes the same hash; if it matches the one recorded on the chain, ' +
      'the file has not been changed since the batch was attested. The hashes are computed ' +
      'at build time from the exact bytes the site serves.',
    generatedBy: 'scripts/gen-report-hashes.mjs',
    algorithm: 'sha256',
    count: records.length,
    reports: records,
  };
  const text = JSON.stringify(out, null, 2) + '\n';
  JSON.parse(text);
  writeFileSync(OUT_JSON, text, 'utf8');

  const ts = TS_HEADER + 'export const REPORT_HASHES = ' + text.replace(/\n$/, '') + ';\n\n'
    + 'export const REPORTS = REPORT_HASHES.reports;\n';
  writeFileSync(OUT_TS, ts, 'utf8');

  console.log('  report-hashes.json: %d reports, %d bytes', records.length, text.length);
  console.log('  lib/report-hashes.ts: the typed copy, written from the same data');
  return 0;
}

process.exit(main());

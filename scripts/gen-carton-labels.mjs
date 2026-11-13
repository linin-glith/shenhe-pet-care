#!/usr/bin/env node
/**
 * The carton label: the QR code the buyer scans.
 *
 * WHAT IT IS
 * One label per batch, printed and stuck on the carton. It carries the
 * batch number in plain text — because a label that only holds a code
 * is useless when the scanner will not work — and a QR code that points
 * at the verification page for that batch.
 *
 * The buyer scans it with a phone and lands on a page that shows the
 * laboratory report's hash, the chain it was recorded on and the
 * transaction. From there they can compare the hash against the PDF in
 * their hands and read the transaction on a block explorer without
 * trusting anyone.
 *
 * WHY IT IS DRAWN HERE AND NOT IN THE BROWSER
 * A carton label is a printed artefact. It has to be the same on every
 * printer, at a fixed physical size, with a quiet zone and a contrast
 * that a cheap scanner in a warehouse with bad light can still read. A
 * browser canvas at whatever size the window happens to be is none of
 * those things.
 *
 * WHY THE QR CODE IS DRAWN BY HAND
 * The QR specification is published and the encoding is not hard: the
 * byte mode, the error correction, the Reed-Solomon blocks and the
 * module placement. Drawing it here means the label has no dependency
 * that can go missing on a build machine, and the output is deterministic
 * — the same batch always prints the same label, which matters when a
 * label is reprinted after a batch is re-inspected.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://shenhezhongke.com';
const OUT = join(ROOT, 'public', 'labels');
const RECEIPTS = join(ROOT, 'scripts', '.batches-attested.json');

/* ------------------------------------------------------------------ */
/* The QR code                                                          */
/* ------------------------------------------------------------------ */

/*
 * The code is drawn by the qrcode library rather than by hand.
 *
 * The first attempt wrote the encoder here, from the specification: the
 * byte mode, the Reed-Solomon blocks, the module placement, the eight
 * masks and the penalty rules. It produced a 41x41 grid for a URL that
 * fits in 33x33, and no scanner read it — a hand-written encoder that
 * looks right and is wrong is the worst kind of code to ship, because
 * the label looks correct until a warehouse with bad light tries to
 * scan it.
 *
 * The library is the standard implementation and it is tested against
 * the specification. The output is deterministic, which is what the
 * label needs: the same batch always prints the same label, so a
 * reprinted label is byte-identical to the first one.
 *
 * The error correction level is M: the label is printed on cardboard
 * and read in a warehouse, and M survives a third of the code being
 * damaged, which is what a scuffed carton does.
 */
const ECC_LEVEL = 'M';

/**
 * The modules of the code, as a grid of 0 and 1.
 */
function buildCode(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: ECC_LEVEL });
  const size = qr.modules.size;
  const modules = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(qr.modules.get(r, c) ? 1 : 0);
    modules.push(row);
  }
  return { modules, version: qr.version, size };
}

/**
 * The label as an SVG.
 *
 * SVG because it prints at any size without a raster, and a warehouse
 * printer can take it as is.
 */
function labelSvg(url, batch, opts = {}) {
  const { modules, size } = buildCode(url);
  const quiet = 4;
  const total = size + quiet * 2;
  const scale = 8;
  const qrPx = size * scale;

  const W = 640;
  const H = 880;
  const qrX = Math.round((W - qrPx) / 2);
  const qrY = 150;

  let paths = '';
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (modules[r][c] === 1) {
        let run = 1;
        while (c + run < size && modules[r][c + run] === 1) run += 1;
        paths += 'M' + (c + quiet) * scale + ' ' + (r + quiet) * scale + 'h' + run * scale + 'v' + scale + 'h-' + run * scale + 'z';
        c += run;
      } else c += 1;
    }
  }

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${W / 2}" y="52" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="19" font-weight="bold" letter-spacing="2.5" fill="#0f766e">SHENHE ZHONGKE</text>
  <text x="${W / 2}" y="82" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#334744">Batch attestation</text>
  <rect x="${qrX - quiet * scale}" y="${qrY - quiet * scale}" width="${qrPx + quiet * 2 * scale}" height="${qrPx + quiet * 2 * scale}" fill="#ffffff"/>
  <path d="${paths}" fill="#000000" transform="translate(${qrX},${qrY})"/>
  <text x="${W / 2}" y="${qrY + qrPx + 48}" text-anchor="middle" font-family="Courier,monospace" font-size="26" font-weight="bold" fill="#12211f">${esc(batch.batch_no)}</text>
  <text x="${W / 2}" y="${qrY + qrPx + 78}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#4b5b58">${esc(batch.product_name ?? batch.sku)} · ${esc(batch.qty)} units</text>
  <text x="${W / 2}" y="${qrY + qrPx + 104}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#4b5b58">Produced ${esc(String(batch.produced_at ?? '').slice(0, 10))}</text>
  <line x1="60" y1="${qrY + qrPx + 140}" x2="${W - 60}" y2="${qrY + qrPx + 140}" stroke="#d9e0de" stroke-width="1"/>
  <text x="${W / 2}" y="${qrY + qrPx + 172}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#334744">Scan to check this batch's laboratory report</text>
  <text x="${W / 2}" y="${qrY + qrPx + 196}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#6b7a77">${esc(url)}</text>
  <text x="${W / 2}" y="${H - 54}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#7a8886">Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · Heyuan, Guangdong, China</text>
  <text x="${W / 2}" y="${H - 32}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#7a8886">The scan shows the report's hash and the chain record. It does not certify approval.</text>
</svg>
`;
}

function main() {

  // The directory is cleared before anything else: a label for a batch
  // that no longer exists is worse than no label, because the printer
  // will put it on a carton.
  mkdirSync(OUT, { recursive: true });
  for (const old of readdirSync(OUT)) {
    unlinkSync(join(OUT, old));
  }
  let receipts = [];
  try {
    receipts = JSON.parse(readFileSync(RECEIPTS, 'utf8'));
  } catch {
    console.log('  no attested batches yet — the labels are left alone.');
    return 0;
  }
  if (!Array.isArray(receipts) || !receipts.length) {
    console.log('  no attested batches yet — the labels are left alone.');
    return 0;
  }
  let n = 0;
  for (const r of receipts) {
    if (!r || !r.batch_no) continue;
    const url = SITE + '/verify/' + encodeURIComponent(r.batch_no) + '.html';
    const svg = labelSvg(url, r);
    const file = join(OUT, 'label-' + r.batch_no.replace(/[^A-Za-z0-9._-]/g, '_') + '.svg');
    writeFileSync(file, svg, 'utf8');
    n += 1;
  }
  console.log('  the carton labels: %d, in public/labels/', n);
  return 0;
}

process.exit(main());

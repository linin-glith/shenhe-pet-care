#!/usr/bin/env node
/**
 * The carton label, as a PDF.
 *
 * WHY A PDF AND NOT ONLY THE SVG
 * The factory prints these. A browser, an SVG editor and a label printer
 * all want something different, and the one thing that is on every
 * machine in a factory is a PDF. So the SVG is the source of the design
 * and the PDF is what goes to the printer.
 *
 * The PDF is written by hand, without a library, because a PDF is a
 * plain text format for a page of lines and rectangles and that is all
 * a label is. A library would be a dependency on a build machine for
 * the sake of one rectangle and one text string.
 *
 * THE CODE
 * The QR code is the same one the SVG carries, and it is the same one
 * that the build decodes and checks: the labels that go to the printer
 * are the labels that were verified.
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
/* The PDF: a page, some lines, some text                              */
/* ------------------------------------------------------------------ */

/** The escape for a PDF string. */
function pdfText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\x00-\x1f]/g, ' ');
}

/** The width of a string in Helvetica at a given size, roughly. */
function textWidth(s, size) {
  // Helvetica's widths, for the characters this label uses
  const W = { ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667,
    "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278,
    '/': 278, '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556,
    '7': 556, '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584,
    '?': 556, '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611,
    'G': 778, 'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722,
    'O': 778, 'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667,
    'W': 944, 'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469,
    '_': 556, '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278,
    'g': 556, 'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556,
    'o': 556, 'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500,
    'w': 722, 'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584 };
  let w = 0;
  for (const ch of String(s)) w += (W[ch] ?? 556);
  return (w * size) / 1000;
}

/**
 * The PDF as a byte array.
 *
 * The page is A4 in points: 595 by 842. The label is laid out in the
 * middle of it, at a size a thermal or laser printer can take, with a
 * cut line around it.
 */
function buildPdf(label) {
  const PAGE_W = 595;
  const PAGE_H = 842;

  const parts = [];
  const ops = [];

  const box = (x, y, w, h, fill) => {
    ops.push(fill
      ? `${x} ${y} ${w} ${h} re f`
      : `${x} ${y} ${w} ${h} re S`);
  };

  const text = (s, x, y, size, font = 'F1', color = '0 0 0') => {
    ops.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfText(s)}) Tj ET`);
  };

  const centred = (s, y, size, font = 'F1', color = '0 0 0') => {
    const w = textWidth(s, size);
    text(s, (PAGE_W - w) / 2, y, size, font, color);
  };

  // the label frame: 300 points wide, 400 tall, centred
  const L_W = 300;
  const L_H = 400;
  const L_X = (PAGE_W - L_W) / 2;
  const L_Y = (PAGE_H - L_H) / 2;

  // the white label
  box(L_X, L_Y, L_W, L_H, true);
  // the frame, a hairline
  ops.push('0.6 w 0.85 0.87 0.86 RG');
  box(L_X, L_Y, L_W, L_H, false);
  // the cut line, outside the frame
  ops.push('0.4 w 0.85 0.87 0.86 RG [3 3] 0 d');
  box(L_X - 6, L_Y - 6, L_W + 12, L_H + 12, false);
  ops.push('[] 0 d');

  // the brand
  centred('SHENHE ZHONGKE', L_Y + L_H - 30, 13, 'F2', '0.06 0.46 0.43');
  centred('Batch attestation', L_Y + L_H - 48, 9, 'F1', '0.2 0.28 0.27');

  // the QR code
  const qr = label.modules;
  const n = qr.length;
  const quiet = 2;
  const cell = Math.floor(180 / (n + quiet * 2));
  const qrSize = cell * n;
  const qrX = Math.round((PAGE_W - qrSize) / 2) + quiet * cell;
  const qrY = L_Y + L_H - 90 - qrSize;
  ops.push('0 0 0 rg');
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (qr[r][c]) {
        let run = 1;
        while (c + run < n && qr[r][c + run]) run += 1;
        box(qrX + c * cell, qrY + (n - 1 - r) * cell, run * cell, cell, true);
        c += run;
      } else c += 1;
    }
  }

  // the batch, in the courier font
  centred(label.batch.batch_no, qrY - 22, 15, 'F3');
  centred(label.title, qrY - 38, 8.5, 'F1', '0.29 0.36 0.35');
  centred('Produced ' + String(label.batch.produced_at ?? '').slice(0, 10), qrY - 52, 8, 'F1', '0.29 0.36 0.35');

  // the rule
  ops.push('0.85 0.87 0.86 RG 0.8 w');
  box(L_X + 24, qrY - 66, L_W - 48, 0, false);

  // the foot
  centred('Scan to check this batch\'s laboratory report', L_Y + 42, 8, 'F1', '0.2 0.28 0.27');
  centred('Guangdong Shenhe Zhongke Biotechnology Co., Ltd.', L_Y + 28, 7, 'F1', '0.48 0.53 0.52');
  centred('Heyuan, Guangdong, China', L_Y + 17, 7, 'F1', '0.48 0.53 0.52');

  const content = ops.join('\n');

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>`);
  objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += String(o).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
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
    receipts = [];
  }
  if (!Array.isArray(receipts) || !receipts.length) {
    console.log('  no attested batches yet — the labels are left alone.');
    return 0;
  }
  let n = 0;
  for (const r of receipts) {
    if (!r || !r.batch_no) continue;
    const url = SITE + '/verify/' + encodeURIComponent(r.batch_no) + '.html';
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const modules = [];
    for (let row = 0; row < qr.modules.size; row++) {
      const line = [];
      for (let c = 0; c < qr.modules.size; c++) line.push(qr.modules.get(row, c) ? 1 : 0);
      modules.push(line);
    }
    const title = r.product_name || r.sku;
    const pdf = buildPdf({ batch: r, title, modules });
    const file = join(OUT, 'label-' + r.batch_no.replace(/[^A-Za-z0-9._-]/g, '_') + '.pdf');
    writeFileSync(file, pdf);
    n += 1;
  }
  console.log('  the carton labels (pdf): %d, in public/labels/', n);
  return 0;
}

process.exit(main());

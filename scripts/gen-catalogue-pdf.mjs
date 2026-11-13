#!/usr/bin/env node
/**
 * The catalogue, as a PDF.
 *
 * WHY
 * Every off-site platform asks for the same file: the product
 * catalogue. Made-in-China wants one, Alibaba wants one, Global
 * Sources wants one. So it is made once here and uploaded seven
 * times.
 *
 * WHAT IS IN IT
 * Twenty SKUs, four product lines, the specification, the minimum
 * order quantity, the two lead times, the packaging, the shelf life,
 * the HS code and the ingredients. Enough for a buyer to know whether
 * to ask for a quotation - which is what a catalogue is for.
 *
 * WHAT IS NOT IN IT
 * NO PRICE. Not a unit price, not a range, not a "from", not a
 * discount band.
 *
 * That is not a style choice. The site is quote-on-request, and a
 * price list is a discount list: publishing one lets a buyer take
 * the smallest number in it and treat it as the price. It is also
 * permanent - a file uploaded to a platform can be read by anyone,
 * forever, and it cannot be taken back. The policy on the site says
 * unit prices are quoted per request, and this file has to agree
 * with it or the platform becomes the place the policy is broken.
 *
 * The build gate reads this file back and fails if a number that
 * looks like a price is in it.
 *
 * THE PDF
 * Written by hand, without a library, the same way the carton label
 * is: a PDF is a plain text format for a page of lines and text, and
 * a catalogue is a table. A library would be a dependency on every
 * build machine for the sake of a table.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'catalogue');
const SITE = 'https://shenhezhongke.com';

/*
 * THE ADDRESS IS READ, NOT TYPED.
 *
 * This PDF is a file a buyer saves and forwards, so the address printed
 * on it is the address they will write to. It used to be typed in here,
 * and when the site's address moved to postmaster@shenhezhongke.com this
 * file kept the old one - so the catalogue said one thing and the site
 * said another, and nothing failed, because no check ever read the PDF.
 *
 * So the address comes from lib/shenhe.config.ts, the one place the site
 * keeps it, and a build that cannot find it stops here rather than
 * printing an address nobody chose.
 */
function configuredEmail() {
  const text = readFileSync(join(ROOT, 'lib', 'shenhe.config.ts'), 'utf8');
  // READ THE CONSTANT BY NAME. The configuration holds several fields
  // called email - the brand mailbox, the sales mailbox, and a sentence
  // about how fast we answer. Searching for the first quoted one found
  // the sentence, and printed it on the catalogue as the address.
  const m = text.match(/const PUBLIC_EMAIL = '([^']+)'/);
  if (!m) throw new Error('PUBLIC_EMAIL not found in lib/shenhe.config.ts');
  if (!m[1].endsWith('@shenhezhongke.com')) {
    throw new Error(`the public address is ${m[1]}, which is not a mailbox on our own domain`);
  }
  return m[1];
}

const EMAIL = configuredEmail();

/* ------------------------------------------------------------------ */
/* The data, read from the one place it lives                          */
/* ------------------------------------------------------------------ */

const catalogue = JSON.parse(readFileSync(join(ROOT, 'lib', 'products.json'), 'utf8'));

const LINE_ORDER = [
  ['disinfection_odor_control', 'Odor control and disinfection'],
  ['cleansing_grooming', 'Grooming and care'],
  ['outdoor_protection', 'Outdoor protection'],
];

const LINE_LABEL = {
  disinfection_odor_control: 'Odor control and disinfection',
  cleansing_grooming: 'Grooming and care',
  outdoor_protection: 'Outdoor protection',
};

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

/** Helvetica's widths, for the characters this document uses. */
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
  'w': 722, 'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584,
  '°': 400, '·': 278, '—': 1000, '–': 556, '×': 584, '≥': 584, '±': 584,
  '“': 333, '”': 333, '’': 191, '‘': 222, '®': 737, '™': 1000,
};

function textWidth(s, size) {
  let w = 0;
  for (const ch of String(s ?? '')) w += (W[ch] ?? 556);
  return (w * size) / 1000;
}

/** Helvetica-Bold's widths differ; the letters that matter are the same. */
function textWidthBold(s, size) {
  const BOLD = { ' ': 278, 'A': 722, 'B': 722, 'C': 722, 'D': 722, 'E': 667, 'F': 611,
    'G': 778, 'H': 722, 'I': 278, 'J': 556, 'K': 722, 'L': 611, 'M': 833, 'N': 722,
    'O': 778, 'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667,
    'W': 944, 'X': 667, 'Y': 667, 'Z': 611, 'a': 556, 'b': 611, 'c': 556, 'd': 611,
    'e': 556, 'f': 333, 'g': 611, 'h': 611, 'i': 278, 'j': 278, 'k': 556, 'l': 278,
    'm': 889, 'n': 611, 'o': 611, 'p': 611, 'q': 611, 'r': 389, 's': 556, 't': 333,
    'u': 611, 'v': 556, 'w': 778, 'x': 556, 'y': 556, 'z': 500,
    '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
    '8': 556, '9': 556, '.': 278, ',': 278, '-': 333, '(': 333, ')': 333, '/': 278,
    ':': 333, ';': 333, "'": 238, '"': 500, '%': 889, '&': 722, '+': 584, '=': 584,
    '·': 278, '—': 1000, '–': 556, '°': 400 };
  let w = 0;
  for (const ch of String(s ?? '')) w += (BOLD[ch] ?? 556);
  return (w * size) / 1000;
}

/**
 * A page of text, lines and rectangles.
 *
 * The content stream is built as a list of operations and written at
 * the end, so a page can be written in the order it is drawn.
 */
class Page {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.ops = [];
  }
  text(x, y, s, { size = 9, bold = false, color = '0 0 0' } = {}) {
    this.ops.push(
      `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${(this.height - y).toFixed(2)} Tm (${pdfText(s)}) Tj ET`,
    );
  }
  textRight(x, y, s, opts = {}) {
    const w = opts.bold ? textWidthBold(s, opts.size ?? 9) : textWidth(s, opts.size ?? 9);
    this.text(x - w, y, s, opts);
  }
  rect(x, y, w, h, fill) {
    this.ops.push(`${fill} rg ${x.toFixed(2)} ${(this.height - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }
  line(x1, y1, x2, y2, color = '0.85 0.85 0.85', width = 0.5) {
    this.ops.push(`${color} RG ${width} w ${x1.toFixed(2)} ${(this.height - y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.height - y2).toFixed(2)} l S`);
  }
  /** A line of text that is cut to fit a width, with an ellipsis. */
  textFit(x, y, s, maxWidth, opts = {}) {
    let out = String(s ?? '');
    const size = opts.size ?? 9;
    const w = () => (opts.bold ? textWidthBold(out, size) : textWidth(out, size));
    if (w() <= maxWidth) {
      this.text(x, y, out, opts);
      return;
    }
    while (out.length > 1 && w() > maxWidth) out = out.slice(0, -1);
    this.text(x, y, out + '…', opts);
  }
}

/** The PDF file itself: the pages, the fonts, the cross-reference table. */
function buildPdf(pages, title) {
  const objects = [];
  const push = (body) => {
    objects.push(body);
    return objects.length; // 1-based object number
  };

  const fontRegular = push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  const contentIds = [];

  for (const p of pages) {
    const stream = p.ops.join('\n');
    const cid = push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
    contentIds.push(cid);
  }

  for (let i = 0; i < pages.length; i += 1) {
    const pid = push(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pages[i].width} ${pages[i].height}] ` +
        `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`,
    );
    pageIds.push(pid);
  }

  const pagesId = push(
    `<< /Type /Pages /Kids [${pageIds.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageIds.length} >>`,
  );
  // the parent has to point at the pages object
  objects[pageIds[0] - 1] = objects[pageIds[0] - 1].replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`);

  const infoId = push(`<< /Title (${pdfText(title)}) /Producer (Shenhe Zhongke) >>`);
  const catalogId = push(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

/* ------------------------------------------------------------------ */
/* The document                                                         */
/* ------------------------------------------------------------------ */

/**
 * The thousands separator, by hand.
 *
 * toLocaleString asks the machine for its locale data, and a build
 * machine does not always have it - so the number came out NaN. A
 * separator is three lines of code and it always works.
 */
function groupDigits(n) {
  const s = String(n ?? '');
  if (!/^\d+$/.test(s)) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const A4 = { width: 595.28, height: 841.89 };
const M = 40;
const TEAL = '0.06 0.35 0.33';

const pages = [];
let page = new Page(A4.width, A4.height);
let y = 0;

function newPage() {
  pages.push(page);
  page = new Page(A4.width, A4.height);
  y = 0;
}

function footer(p, n) {
  p.line(M, A4.height - 30, A4.width - M, A4.height - 30);
  p.text(M, A4.height - 20, `${SITE}`, { size: 7.5, color: '0.45 0.45 0.45' });
  p.textRight(A4.width - M, A4.height - 20, `Page ${n}`, { size: 7.5, color: '0.45 0.45 0.45' });
}

/* ---- the cover ---- */
page.rect(0, 0, A4.width, 116, TEAL);
page.text(M, 44, 'SHENHE ZHONGKE', { size: 17, bold: true, color: '1 1 1' });
page.text(M, 64, 'Pet care products - OEM and ODM manufacturing', { size: 10.5, color: '0.86 0.95 0.94' });
page.text(M, 82, `Guangdong Shenhe Zhongke Biotechnology Co., Ltd.  ·  Heyuan, Guangdong, China  ·  since 2020`, {
  size: 8.5,
  color: '0.86 0.95 0.94',
});
page.text(M, 98, 'Product catalogue', { size: 12, bold: true, color: '1 1 1' });
y = 146;

page.text(M, y, 'ABOUT THIS CATALOGUE', { size: 9, bold: true, color: TEAL });
y += 14;
for (const line of [
  `Twenty products in three lines, from a 30,000 m2 industrial park with a 5,000 m2 GMP workshop and six production lines.`,
  `Monthly capacity 1,000,000 bottles. Around 220 staff, including eight in-house chemists.`,
  '',
  `Minimum order quantities and lead times are stated for every product. Prices are not: they are quoted per request,`,
  `because the price depends on the volume, the label, the packaging and the shipping terms you need.`,
]) {
  page.text(M, y, line, { size: 9, color: '0.15 0.15 0.15' });
  y += 12;
}
y += 6;

page.text(M, y, 'WHAT WE PUBLISH AND WHAT WE HOLD BACK', { size: 9, bold: true, color: TEAL });
y += 14;
for (const line of [
  `Published: the specification, the minimum order quantity, the lead time, the packaging, the shelf life, the HS code,`,
  `the ingredients, the third-party laboratory reports, the certifications and the licences.`,
  '',
  `Held back: unit prices and discount tiers. Ask for a quotation and we will send one, with the sample, the method`,
  `and the cost confirmed in writing before anything is ordered.`,
]) {
  page.text(M, y, line, { size: 9, color: '0.15 0.15 0.15' });
  y += 12;
}
y += 14;

/* ---- the table ---- */
const COLS = [
  { key: 'ref', label: 'Ref', x: M, w: 46, size: 8 },
  { key: 'name', label: 'Product', x: M + 46, w: 176, size: 8 },
  { key: 'spec', label: 'Specification', x: M + 222, w: 92, size: 8 },
  { key: 'moq', label: 'MOQ', x: M + 314, w: 66, size: 8 },
  { key: 'lead', label: 'Lead time', x: M + 380, w: 96, size: 8 },
];

function tableHead(p, atY) {
  p.rect(M, atY - 4, A4.width - M * 2, 16, '0.94 0.96 0.96');
  for (const c of COLS) {
    p.text(c.x + 4, atY + 7, c.label.toUpperCase(), { size: 7, bold: true, color: '0.25 0.25 0.25' });
  }
  return atY + 18;
}

y = tableHead(page, y);

/** The two lead times, as one cell. */
function leadText(p) {
  const stock = (p.lead_time_days_stock ?? '').trim();
  const oem = (p.lead_time_days_oem ?? '').trim();
  return [stock, oem].filter(Boolean).join(' / ');
}

for (const [cat, label] of LINE_ORDER) {
  const items = catalogue.products.filter((p) => p.category === cat);
  if (!items.length) continue;

  if (y > A4.height - 140) {
    footer(page, pages.length);
    newPage();
    y = 60;
    y = tableHead(page, y);
  }

  page.text(M, y, label.toUpperCase(), { size: 7.5, bold: true, color: TEAL });
  y += 6;
  page.line(M, y, A4.width - M, y, '0.85 0.9 0.9', 0.7);
  y += 13;

  for (const p of items) {
    if (y > A4.height - 70) {
      footer(page, pages.length);
      newPage();
      y = 60;
      y = tableHead(page, y);
    }
    const ref = p.id;
    const name = p.name_en ?? '';
    const spec = p.specification ?? '';
    const moq = `${groupDigits(p.moq)} ${p.moq_unit ?? ''}`.trim();
    const lead = leadText(p);

    page.textFit(COLS[0].x + 4, y, ref, COLS[0].w - 8, { size: 8, color: '0.35 0.35 0.35' });
    page.textFit(COLS[1].x + 4, y, name, COLS[1].w - 8, { size: 8 });
    page.textFit(COLS[2].x + 4, y, spec, COLS[2].w - 8, { size: 8, color: '0.25 0.25 0.25' });
    page.textFit(COLS[3].x + 4, y, moq, COLS[3].w - 8, { size: 8, color: '0.25 0.25 0.25' });
    page.textFit(COLS[4].x + 4, y, lead, COLS[4].w - 8, { size: 8, color: '0.25 0.25 0.25' });
    y += 13;

    // the second line of each row: what it is for, and its actives
    const fn = p.function_en ?? '';
    const ing = p.ingredients_en ?? '';
    if (fn || ing) {
      const bits = [];
      if (fn) bits.push(fn);
      if (ing) bits.push(`Actives: ${ing}`);
      page.textFit(COLS[1].x + 4, y - 1, bits.join('  ·  '), COLS[4].x + COLS[4].w - COLS[1].x - 8, {
        size: 7.5,
        color: '0.45 0.45 0.45',
      });
      y += 12;
    }
    page.line(M, y - 4, A4.width - M, y - 4, '0.92 0.92 0.92', 0.4);
  }
  y += 8;
}

/* ---- the last page: the details every platform asks for ---- */
if (y > A4.height - 260) {
  footer(page, pages.length);
  newPage();
  y = 60;
}

page.text(M, y, 'THE DETAILS', { size: 9, bold: true, color: TEAL });
y += 16;

const details = [
  ['Legal name', 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.'],
  // The Chinese name (广东深河中科生物科技有限公司) cannot be set here: this
  // writer emits Type1 Helvetica with WinAnsiEncoding, which has no CJK
  // glyphs, so the characters came out as mojibake on the printed page.
  // The registered Chinese name is published on the site (about.html,
  // company-identity.json) and in every quotation we send. Putting it back
  // into this PDF needs a CJK font embedded as an Identity-H CID font.
  ['Founded', '2020'],
  ['Address', 'No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China'],
  ['Telephone', '+86-762-3909998'],
  ['WhatsApp', '+86 172 6665 9928'],
  ['Email', EMAIL],
  ['Website', SITE],
  ['Plant', '30,000 m2 industrial park, 5,000 m2 GMP workshop, 3,000 m2 office area'],
  ['Capacity', '6 production lines, 1,000,000 bottles per month'],
  ['Staff', 'around 220, including 8 in-house chemists (5 MSc, 3 BSc, 2 SCUT PhD)'],
  ['Quality', 'ISO 22716 GMP; US FDA establishment registration'],
  ['Licences', 'high and new technology enterprise; disinfection and sanitation licence; feed additive production licence'],
  ['Laboratory reports', '10 third-party reports published in full on the website, each with its number and issuing institute'],
  ['Export markets', '12 and counting'],
];

for (const [k, v] of details) {
  if (y > A4.height - 70) {
    footer(page, pages.length);
    newPage();
    y = 60;
  }
  page.text(M, y, k, { size: 8.5, bold: true, color: '0.2 0.2 0.2' });
  page.textFit(M + 92, y, v, A4.width - M * 2 - 92, { size: 8.5, color: '0.25 0.25 0.25' });
  y += 13;
}

y += 10;
page.text(M, y, 'PRICING', { size: 9, bold: true, color: TEAL });
y += 14;
for (const line of [
  'Prices are not published. Send us the product, the volume, the packaging you need and the destination, and we will',
  'send a quotation. We will confirm the sample, the method and the cost in writing before anything is ordered.',
]) {
  page.text(M, y, line, { size: 8.5, color: '0.25 0.25 0.25' });
  y += 12;
}

footer(page, pages.length);
pages.push(page);

/* ------------------------------------------------------------------ */
/* Write it                                                             */
/* ------------------------------------------------------------------ */

mkdirSync(OUT, { recursive: true });
const file = join(OUT, 'Shenhe-Zhongke-Product-Catalogue.pdf');
const pdf = buildPdf(pages, 'Shenhe Zhongke - Pet Care Products Catalogue');
writeFileSync(file, Buffer.from(pdf, 'latin1'));

console.log(`  the catalogue pdf: ${pages.length} pages, ${Buffer.byteLength(pdf, 'latin1')} bytes`);
console.log(`  ${file.replace(ROOT, '.')}`);

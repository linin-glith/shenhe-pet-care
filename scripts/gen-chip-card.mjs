/**
 * THE TAP CARD — the print artwork for the card that goes in the carton.
 *
 * WHAT IT IS
 * A card with an NFC inlay on the back. Touch it with a phone and the
 * site opens. It is the same mechanism as the QR code on the carton
 * label, with the phone doing the scanning instead of the buyer
 * pointing a camera.
 *
 * WHY THE ARTWORK IS GENERATED AND NOT DRAWN
 * The address on the card has to be the address the site serves, and a
 * card is printed once and sits in a warehouse for months. If the
 * address is typed into a design file, it is a second copy of a fact
 * that lives in lib/shenhe.config.ts, and the two drift the first time
 * the domain or the scheme changes.
 *
 * So the artwork is drawn here, from the configuration, on every build,
 * and the check that the build runs afterwards asks the printed card and
 * the site whether they still agree.
 *
 * THE SIZE
 * The artwork is vector and its units are tenths of a millimetre, so it
 * prints at any card size: the drawing below is nominal (85.6 x 54 mm,
 * the ID-1 size) and the factory scales it to the card it has.
 *
 * THE BACK
 * The back is where the inlay goes, so the back is left plain. The
 * inlay is a disc; the artwork must not print under it.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');

/**
 * THE ADDRESS, FROM THE CONFIGURATION.
 *
 * This is the one place the card's address is written down, and it is
 * the same place the site's canonical address lives. The check compares
 * the two, so a card printed before a domain change cannot outlive it.
 */
const CONFIG_TS = readFileSync(join(ROOT, 'lib', 'shenhe.config.ts'), 'utf8');
const SITE = /siteUrl:\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!SITE) throw new Error('the site address is not in lib/shenhe.config.ts');

/** What the tag carries. The scheme matters: a bare domain opens a search. */
const TAG_URL = SITE + '/';

/* ------------------------------------------------------------------ */
/* The QR code                                                          */
/* ------------------------------------------------------------------ */

/*
 * The same code the carton label draws, with the same error correction
 * (M: the card is printed on cardboard and read in a warehouse, and M
 * survives a third of the code being scuffed).
 *
 * The QR is here for the phone that cannot read NFC. It carries the same
 * address as the tag, because a card that sends a buyer to one place by
 * tapping and another by scanning is a card that teaches the buyer to
 * distrust it.
 */
const ECC_LEVEL = 'M';

function buildCode(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: ECC_LEVEL });
  const size = qr.modules.size;
  const modules = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(qr.modules.get(r, c) ? 1 : 0);
    modules.push(row);
  }
  return { modules, size };
}

/* ------------------------------------------------------------------ */
/* The card                                                             */
/* ------------------------------------------------------------------ */

/* Tenths of a millimetre: 85.6 x 54 mm, the nominal ID-1 card. */
const W = 856;
const H = 540;

const INK = '#12211f';
const TEAL = '#0f766e';
const MUTED = '#4b5b58';
const HAIRLINE = '#d9e0de';

function cardSvg(url) {
  const { modules, size } = buildCode(url);
  const quiet = 4;
  /*
   * The size of the code is set by the card, not by the code.
   *
   * The first drawing scaled the modules by a fixed 3, which made the code
   * about 7 mm across - too small to read off a carton in a warehouse
   * with bad light, which is the one place this card has to work. So the
   * scale is computed from the card: the code is a quarter of the card's
   * height, whatever size that is.
   */
  const targetPx = Math.round(H * 0.42);
  const scale = Math.max(4, Math.floor(targetPx / size));
  const qrPx = size * scale;

  const qrX = W - qrPx - quiet * scale - 56;
  const qrY = 118;

  let paths = '';
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (modules[r][c] === 1) {
        let run = 1;
        while (c + run < size && modules[r][c + run] === 1) run += 1;
        paths +=
          'M' + (c + quiet) * scale + ' ' + (r + quiet) * scale +
          'h' + run * scale + 'v' + scale + 'h-' + run * scale + 'z';
        c += run;
      } else c += 1;
    }
  }

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W / 10}mm" height="${H / 10}mm" viewBox="0 0 ${W} ${H}">
  <desc>${esc(url)}</desc>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${TEAL}"/>
  <text x="56" y="92" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold" letter-spacing="3" fill="${TEAL}">SHENHE ZHONGKE</text>
  <text x="56" y="126" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${MUTED}">Private-label pet care manufacturing · Heyuan, Guangdong</text>
  <text x="56" y="216" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold" fill="${INK}">Touch this card with a phone</text>
  <text x="56" y="256" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold" fill="${INK}">to open the site</text>
  <text x="56" y="300" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${MUTED}">or scan the code. No app, no account.</text>
  <text x="56" y="366" font-family="Courier,monospace" font-size="22" fill="${INK}">${esc(url)}</text>
  <line x1="56" y1="404" x2="${W - 56}" y2="404" stroke="${HAIRLINE}" stroke-width="1"/>
  <text x="56" y="444" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${MUTED}">Every batch's laboratory report hash is published there,</text>
  <text x="56" y="472" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${MUTED}">written to a public chain, and readable by anyone.</text>
  <text x="56" y="512" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="${MUTED}">Ask for this card with your order.</text>
  <rect x="${qrX - quiet * scale}" y="${qrY - quiet * scale}" width="${qrPx + quiet * 2 * scale}" height="${qrPx + quiet * 2 * scale}" fill="#ffffff"/>
  <path d="${paths}" fill="#000000" transform="translate(${qrX},${qrY})"/>
  <text x="${qrX + qrPx / 2}" y="${qrY + qrPx + quiet * 2 * scale + 30}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="16" fill="${MUTED}">The tag is on the back</text>
</svg>
`;
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const svg = cardSvg(TAG_URL);
  writeFileSync(join(OUT, 'chip-card.svg'), svg, 'utf8');
  // Template literals, not "%": in JavaScript a percent sign between a
  // string and a number is the modulo operator, and it prints NaN.
  console.log(`  the tap card: public/chip-card.svg (${Buffer.byteLength(svg)} bytes)`);
  console.log(`  write this into the NFC tag: ${TAG_URL}`);
}

main();

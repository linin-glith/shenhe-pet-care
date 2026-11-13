#!/usr/bin/env node
/**
 * The verification pages: one per attested batch.
 *
 * WHY THE PAGES ARE BUILT HERE AND NOT IN THE APP
 * The batches live in the database on the server, and the site is a
 * static export. A batch attested after the build has to have a page
 * without a rebuild — and the page has to be readable by anyone, with
 * no login, because the person who needs it is the buyer standing in a
 * warehouse with a phone in their hand.
 *
 * So the pages are written from the same source as the reports: a
 * script that reads the batches and writes one HTML file per batch.
 *
 * WHAT THE PAGE PROVES, AND WHAT IT DOES NOT
 * It proves that this report's hash existed at this time and has not
 * changed. It does NOT prove that the product is approved, and it does
 * NOT prove that the product is good. Those are the laboratory's
 * judgement and the buyer's, and a page that blurs the two is the same
 * overclaiming as a certificate wall — only harder to take back.
 *
 * The page reads the chain, not the database. That is the whole point:
 * the database is ours and can be edited; the chain is not.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://shenhezhongke.com';

/**
 * The path of the page that says what may be done with the published
 * records. It is read from the configuration, which is the one place it
 * is written down.
 */
const CONFIG_TS = readFileSync(join(ROOT, 'lib', 'shenhe.config.ts'), 'utf8');
const DATA_LICENSE_PATH = /DATA_LICENSE_PATH\s*=\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!DATA_LICENSE_PATH) {
  throw new Error('the data license path is not in lib/shenhe.config.ts');
}

/**
 * The sentence that says how this business is priced. It is read from
 * the configuration, which is the one place it is written down - the
 * same reason the licence path is read from there.
 */
const PRICING_DECLARATION = /declaration:\s*'([^']+)'/.exec(CONFIG_TS)?.[1];
if (!PRICING_DECLARATION) {
  throw new Error('the pricing declaration is not in lib/shenhe.config.ts');
}
const OUT = join(ROOT, 'public', 'verify');
const CHAIN_FILE = join(ROOT, 'scripts', '.batches-attested.json');

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The attested batches.
 *
 * The desk writes this file when a batch is attested, so the page
 * generator does not need the database. The database is behind a
 * password on another machine; this file is the receipt.
 */
function loadAttested() {
  try {
    const raw = JSON.parse(readFileSync(CHAIN_FILE, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const EXCHANGE = {
  'base-sepolia': { name: 'Base Sepolia', explorer: 'https://sepolia.basescan.org' },
  base: { name: 'Base', explorer: 'https://basescan.org' },
};

function pageHtml(a) {
  const net = EXCHANGE[a.chain] ?? { name: a.chain, explorer: 'https://basescan.org' };
  const simulated = a.mode !== 'live';
  const explorerUrl = a.tx_hash ? net.explorer + '/tx/' + a.tx_hash : null;

  const rows = [
    ['Batch', a.batch_no],
    ['SKU', a.sku],
    ['Quantity', a.qty ? a.qty.toLocaleString('en-US') : '—'],
    ['Produced', a.produced_at ? String(a.produced_at).slice(0, 10) : '—'],
    ...(a.report_number ? [['Report', a.report_number]] : []),
    ['Report SHA-256', a.report_sha256 || '—'],
    ['Payload hash', a.payload_hash || '—'],
    ['Chain', net.name + ' (' + (a.chain_id ?? '') + ')'],
    ['Block', a.block ?? '—'],
    ['Transaction', a.tx_hash || (simulated ? 'not sent — no wallet key configured' : '—')],
    ['Recorded at', a.at ? String(a.at).slice(0, 19).replace('T', ' ') + ' UTC' : '—'],
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Certifications & Lab Reports', item: SITE + '/certifications.html' },
          { '@type': 'ListItem', position: 3, name: 'Batch attestation ' + a.batch_no, item: SITE + '/verify/' + encodeURIComponent(a.batch_no) + '.html' },
        ],
      },
      {
    '@type': 'Dataset',
    name: 'Batch attestation ' + a.batch_no,
    /*
     * The terms under which this record may be used. Google's rich
     * result test named the field as missing on 2026-11-08:
     * "未填写字段 license".
     */
    license: SITE + DATA_LICENSE_PATH,
    description:
      'A batch attestation: the hash of this batch\'s test report, recorded on ' +
      net.name + '. The proof is that the report file existed at this time and has not changed.',
    url: SITE + '/verify/' + encodeURIComponent(a.batch_no) + '.html',
    dateModified: a.at ? String(a.at).slice(0, 10) : undefined,
    creator: {
      '@type': 'Organization',
      name: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
      /* How this business is priced. The same sentence every organisation
         node of ours carries, read from the configuration. */
      description: PRICING_DECLARATION,
      url: SITE,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'No.141-1 Longteng Road, Gaopugang, Yuancheng District',
        addressLocality: 'Heyuan',
        addressRegion: 'Guangdong',
        addressCountry: 'CN',
        /* The postal code, from lib/shenhe.config.ts. */
        postalCode: '517000',
      },
    },
    ...(a.tx_hash ? { identifier: a.tx_hash } : {}),
      },
    ],
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Batch ${escapeHtml(a.batch_no)} — Attestation | SHENHE ZHONGKE</title>
<meta name="description" content="Chain attestation for batch ${escapeHtml(a.batch_no)}: the SHA-256 of this batch's laboratory report, recorded on ${escapeHtml(net.name)}.">
<link rel="canonical" href="${SITE}/verify/${encodeURIComponent(a.batch_no)}.html">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="Batch ${escapeHtml(a.batch_no)} — Attestation | SHENHE ZHONGKE">
<meta property="og:description" content="The SHA-256 of this batch's laboratory report, recorded on ${escapeHtml(net.name)}.">
<meta property="og:url" content="${SITE}/verify/${encodeURIComponent(a.batch_no)}.html">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; background:#f7f8f7; color:#12211f; font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  main { max-width:780px; margin:0 auto; padding:44px 20px 72px; }
  .card { background:#fff; border:1px solid #e2e6e5; border-radius:14px; padding:28px; margin-top:18px; }
  .brand { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#0f766e; font-weight:700; }
  h1 { font-size:26px; line-height:1.25; margin:10px 0 6px; letter-spacing:-.01em; }
  .lead { color:#4b5b58; margin:0; }
  .badge { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:7px 13px; border-radius:999px; font-size:13px; font-weight:600; }
  .badge.live { background:#e6f5f1; color:#0b6b58; border:1px solid #b7e2d6; }
  .badge.dry { background:#fdf3e3; color:#8a5a12; border:1px solid #f0d9ab; }
  dl { margin:0; }
  .row { display:grid; grid-template-columns:180px 1fr; gap:16px; padding:11px 0; border-top:1px solid #eef1f0; }
  dt { color:#6b7a77; font-size:13px; }
  dd { margin:0; font-size:14px; word-break:break-all; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; }
  a { color:#0f766e; }
  .note { margin-top:20px; padding:16px 18px; border-left:3px solid #0f766e; background:#f1f8f6; color:#334744; font-size:14px; }
  .note b { color:#12211f; }
  .warn { border-left-color:#c8871c; background:#fdf8ef; }
  footer { margin-top:28px; font-size:13px; color:#7a8886; }
  @media (max-width:560px){ .row { grid-template-columns:1fr; gap:2px; } }
</style>
</head>
<body>
<main>
  <p class="brand">SHENHE ZHONGKE · Chain attestation</p>
  <nav aria-label="Breadcrumb" style="font-size:13px;color:#6b7a77;margin-top:10px">
    <a href="${SITE}/" data-journey="nav">Home</a> &rsaquo;
    <a href="${SITE}/certifications.html" data-journey="certifications">Certifications &amp; Lab Reports</a> &rsaquo;
    <span>Batch ${escapeHtml(a.batch_no)}</span>
  </nav>
  <h1>Batch ${escapeHtml(a.batch_no)}</h1>
  <p class="lead">This page records what was written about this batch, and lets you check it yourself.</p>
  ${
    simulated
      ? `<p class="badge dry">&#9888; Simulated — no transaction was sent</p>
         <p class="lead" style="margin-top:12px">No wallet key is configured on the server, so the batch was hashed and recorded but no transaction was sent. The shape below is the shape a real attestation has; the transaction hash is missing because there is none.</p>`
      : `<p class="badge live">&#10003; Recorded on ${escapeHtml(net.name)}</p>`
  }
  <div class="card">
    <dl>
      ${rows.map(([k, v]) => `<div class="row"><dt>${escapeHtml(k)}</dt><dd class="mono">${escapeHtml(v)}</dd></div>`).join('\n      ')}
    </dl>
  </div>
  ${
    explorerUrl
      ? `<p style="margin-top:18px"><a href="${escapeHtml(explorerUrl)}" rel="noopener noreferrer" target="_blank">Read the transaction on the block explorer &rarr;</a></p>`
      : ''
  }
  ${
    a.report_url && a.report_sha256
      ? `<div class="card" style="margin-top:18px">
    <p style="font-size:13px;font-weight:600;margin:0 0 6px">Check it yourself</p>
    <p style="font-size:14px;color:#334744;margin:0 0 10px">Download the laboratory report, compute its SHA-256, and compare it with the fingerprint above. If they match, this is the same file that was recorded.</p>
    <p style="margin:0"><a href="${escapeHtml(a.report_url)}" download data-journey="pdf">Download the report (${escapeHtml(a.report_file ?? 'PDF')}) &rarr;</a></p>
    <p style="font-size:12.5px;color:#6b7a77;margin:10px 0 0">On a Mac: <span class="mono">shasum -a 256 &lt;file&gt;</span>. On Linux: <span class="mono">sha256sum &lt;file&gt;</span>. On Windows: <span class="mono">certutil -hashfile &lt;file&gt; SHA256</span>.</p>
  </div>`
      : a.report_sha256
        ? `<div class="card" style="margin-top:18px">
    <p style="font-size:13px;font-weight:600;margin:0 0 6px">Check it yourself</p>
    <p style="font-size:14px;color:#334744;margin:0">The fingerprint of this batch's laboratory report is above. It is the SHA-256 of the file; if you hold the report, compute the same hash and the two will match.</p>
  </div>`
        : ''
  }
  <div class="note">
    <b>What this proves.</b> That this batch's laboratory report file existed at the time recorded here and has not been changed since — the SHA-256 in the table is the fingerprint, and you can compare it against the PDF in your hands.
    <br><br>
    <b>What this does not prove.</b> It does not prove that the product is approved for any market, and it does not prove that the product is good. Approval is the market authority's decision and quality is the laboratory's. This page proves one thing only: that a file has not been swapped.
  </div>
  ${
    simulated
      ? `<div class="note warn"><b>Read this before you rely on it.</b> This attestation was simulated: the hash was computed and stored, but no transaction reached the chain. There is nothing to look up on the block explorer. When the server has a wallet key, the same batch is written as a real transaction and this page carries the hash and the block.</div>`
      : ''
  }
  <footer>
    Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China · <a href="${SITE}/">shenhezhongke.com</a>
  </footer>
</main>
</body>
</html>
`;
}

const attested = loadAttested();
// The directory is cleared first: a page for a batch that no longer
// exists is a page that sends a buyer to a proof of nothing.
mkdirSync(OUT, { recursive: true });
for (const old of readdirSync(OUT)) {
  unlinkSync(join(OUT, old));
}

if (!attested.length) {
  console.log('  no attested batches yet — the verification pages are left alone.');
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const a of attested) {
  if (!a || !a.batch_no) continue;
  const file = join(OUT, encodeURIComponent(a.batch_no) + '.html');
  writeFileSync(file, pageHtml(a), 'utf8');
  n += 1;
}
console.log('  the verification pages: %d, in public/verify/', n);

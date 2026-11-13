#!/usr/bin/env node
/**
 * The attestation index: every batch this factory has attested.
 *
 * WHY IT EXISTS
 * The per-batch page is what a buyer reaches by scanning the code on a
 * carton. This page is what a buyer reaches before they buy, when the
 * question is "is this factory's claim to verification real, or is it
 * one PDF with a logo on it". One page with a lot of PDFs is a claim.
 * A list of batches, each with a transaction on a public chain that
 * anyone can read, is a record.
 *
 * It is also the page an AI assistant can be pointed at when it is
 * asked whether this factory's claims can be checked.
 *
 * WHAT IT SAYS WHEN THERE IS NOTHING
 * When no batch has been attested, the page says so, in as many words,
 * and lists nothing. An empty index that hides its emptiness is a
 * worse thing than no index at all — it looks like a page that has
 * something to show and does not.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://shenhezhongke.com';
const OUT = join(ROOT, 'public', 'attestation');
const RECEIPTS = join(ROOT, 'scripts', '.batches-attested.json');

const EXCHANGE = {
  'base-sepolia': { name: 'Base Sepolia', explorer: 'https://sepolia.basescan.org' },
  base: { name: 'Base', explorer: 'https://basescan.org' },
};

/*
 * The WhatsApp number, read out of the one place it lives.
 *
 * The site's own lib/contact-links.ts reads the same field for the same
 * reason: a number typed into a second file is a number that goes out of
 * date without anything saying so.
 */
const CONFIG_TS = readFileSync(join(ROOT, 'lib', 'shenhe.config.ts'), 'utf8');

function cfgValue(key) {
  const m = CONFIG_TS.match(new RegExp(`^\\s{4}${key}:\\s*'([^']*)'`, 'm'));
  return m ? m[1] : null;
}

const WHATSAPP = (cfgValue('whatsapp') || '').replace(/\D/g, '');
if (!WHATSAPP) throw new Error('the WhatsApp number is not in lib/shenhe.config.ts');

/**
 * The path of the page that says what may be done with the published
 * records. It is read from the configuration, which is the one place it
 * is written down - a path typed into this file as well would be two
 * answers, and two answers is how this project keeps getting things
 * wrong.
 */
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

/**
 * The day the site's content was last changed. It is read from the one
 * place it is written down — lib/seo/build-date.ts — for the same reason
 * the licence path and the pricing sentence are read from the
 * configuration. A second copy of the date here is a second place for it
 * to drift, and it has drifted before.
 */
const BUILD_DATE = /export const BUILD_DATE = '([^']+)'/.exec(
  readFileSync(join(ROOT, 'lib', 'seo', 'build-date.ts'), 'utf8'),
)?.[1];
if (!BUILD_DATE) {
  throw new Error('the build date is not in lib/seo/build-date.ts');
}

/** The WhatsApp message, in the buyer's voice - the shape the site uses elsewhere. */
function whatsappHref(text) {
  const message = [
    'Hello, I would like a quotation for a pet care product.',
    '',
    'Please send me the price, the minimum order quantity and the production lead time.',
  ].join('\n');
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text + '\n' + message)}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadAttested() {
  try {
    const raw = JSON.parse(readFileSync(RECEIPTS, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function indexHtml(attested) {
  const live = attested.filter((a) => a && a.mode === 'live' && a.tx_hash);
  const simulated = attested.filter((a) => a && a.mode !== 'live');

  // the chains in use
  const chains = [...new Set(attested.map((a) => a.chain).filter(Boolean))];
  const chainNames = chains.map((c) => (EXCHANGE[c]?.name ?? c));

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Batch attestations', item: SITE + '/attestation.html' },
        ],
      },
      {
        '@type': 'Dataset',
        /* The dataset's own address in the graph, so the page node below
           can point at it. */
        '@id': `${SITE}/attestation.html#dataset`,
        name: 'Batch attestations',
        /*
         * The terms under which these records may be used. Google's rich
         * result test named the field as missing on 2026-11-08:
         * "未填写字段 license".
         */
        license: SITE + DATA_LICENSE_PATH,
        description:
          'Every production batch this factory has attested on a public chain, with the ' +
          'transaction hash and the block, so that each one can be read by anyone. The ' +
          'proof is that each laboratory report file existed at the recorded time and has ' +
          'not been changed since. It is not an approval and it is not a judgement on the ' +
          'product.',
        url: SITE + '/attestation.html',
        creator: {
          /* The same organisation, by its address. The site publishes the
             company as one entity on every page it renders, with an @id.
             This node used to be a second, partial declaration of the same
             company — a name, a URL and an address, with no @id to tie it
             to the first one — so a reader that merged the two would have
             found two companies with one name. */
          '@id': `${SITE}/#organization`,
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
            /* The postal code, from lib/shenhe.config.ts. Google's rich
               result test named it on 2026-11-04: "postalCode 未填写". */
            postalCode: '517000',
          },
        },
        ...(attested.length
          ? {
              distribution: attested.map((a) => ({
                '@type': 'DataDownload',
                encodingFormat: 'text/html',
                contentUrl: SITE + '/verify/' + encodeURIComponent(a.batch_no) + '.html',
              })),
            }
          : {}),
      },
      /*
       * THE PAGE ITSELF.
       *
       * The attestation index is written by this script rather than by a
       * page component, so it never went through the layout that publishes
       * the site graph — and it carried no page node at all. A page with
       * no page node says nothing about what it is, when it was published,
       * what it belongs to, or what it is about.
       *
       * So it says all four now, and points at the dataset above: the
       * records are the subject of the page, and the page is where they
       * can be read.
       */
      {
        '@type': 'WebPage',
        '@id': `${SITE}/attestation.html#webpage`,
        name: 'Batch attestations',
        url: `${SITE}/attestation.html`,
        description:
          'Every production batch this factory has attested on a public chain, with the ' +
          'transaction hash and the block, so that each one can be read by anyone.',
        datePublished: BUILD_DATE,
        dateModified: BUILD_DATE,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/#organization` },
        mainEntity: { '@id': `${SITE}/attestation.html#dataset` },
        inLanguage: 'en',
      },
    ],
  };

  const rows = attested
    .map((a) => {
      const net = EXCHANGE[a.chain] ?? { name: a.chain, explorer: 'https://basescan.org' };
      const page = SITE + '/verify/' + encodeURIComponent(a.batch_no) + '.html';
      const tx = a.tx_hash
        ? `<a href="${escapeHtml(net.explorer + '/tx/' + a.tx_hash)}" rel="noopener noreferrer" target="_blank" class="mono">${escapeHtml(a.tx_hash.slice(0, 20))}…</a>`
        : '<span class="dim">no transaction sent</span>';
      return `      <tr>
        <td class="mono">${escapeHtml(a.batch_no)}</td>
        <td>${escapeHtml(a.product_name ?? a.sku)}</td>
        <td class="num">${Number(a.qty ?? 0).toLocaleString('en-US')}</td>
        <td>${escapeHtml(String(a.produced_at ?? '').slice(0, 10))}</td>
        <td>${escapeHtml(net.name)}</td>
        <td>${a.block ?? '—'}</td>
        <td>${tx}</td>
        <td><a href="${escapeHtml(page)}" data-journey="report">verification page</a></td>
      </tr>`;
    })
    .join('\n');

  const liveNote = live.length
    ? `Every row below carries a transaction on ${escapeHtml(chainNames.join(', '))}. Open the transaction and read it: the payload in it is the batch number, the SKU, the quantity, the production date and the SHA-256 of the laboratory report.`
    : `No batch has been written to the chain yet. When one is, this page will list it here with its transaction, and anyone will be able to read that transaction on the block explorer — the same way they can read anyone else's.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Batch attestations — SHENHE ZHONGKE</title>
<meta name="description" content="Every batch this factory has attested on a public chain, with its transaction hash and block, so a buyer can check the record independently of what we say.">
<link rel="canonical" href="${SITE}/attestation.html">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="Batch attestations — SHENHE ZHONGKE">
<meta property="og:description" content="Every production batch attested on a public chain, with the transaction hash and block.">
<meta property="og:url" content="${SITE}/attestation.html">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; background:#f7f8f7; color:#12211f; font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  main { max-width:960px; margin:0 auto; padding:44px 20px 72px; }
  .brand { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#0a6e65; font-weight:700; }
  h1 { font-size:28px; line-height:1.25; margin:10px 0 8px; letter-spacing:-.01em; }
  .lead { color:#4b5b58; margin:0 0 4px; max-width:72ch; }
  .card { background:#fff; border:1px solid #e2e6e5; border-radius:14px; padding:22px 24px; margin-top:20px; }
  .stats { display:flex; flex-wrap:wrap; gap:26px; margin-top:18px; }
  .stat b { display:block; font-size:24px; letter-spacing:-.02em; }
  .stat span { font-size:12px; text-transform:uppercase; letter-spacing:.1em; color:#5f6d69; }
  table { width:100%; border-collapse:collapse; margin-top:14px; font-size:14px; }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:#5f6d69; font-weight:600; padding:8px 10px 8px 0; border-bottom:1px solid #e2e6e5; }
  td { padding:10px; border-bottom:1px solid #eef1f0; vertical-align:top; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; }
  .dim { color:#8a9694; }
  a { color:#0a6e65; }
  .note { margin-top:20px; padding:16px 18px; border-left:3px solid #0a6e65; background:#f1f8f6; color:#334744; font-size:14px; }
  .note b { color:#12211f; }
  .warn { border-left-color:#c8871c; background:#fdf8ef; }
  .empty { padding:26px; text-align:center; color:#5f6d69; }
  .next { margin-top:22px; }
  .next h2 { font-size:12px; text-transform:uppercase; letter-spacing:.1em; color:#0a6e65; margin:0 0 10px; }
  .next p { color:#4b5b58; margin:0 0 16px; }
  .btn { display:inline-block; margin:0 10px 8px 0; padding:11px 20px; border-radius:8px; background:#0a6e65; color:#fff; font-weight:600; font-size:15px; text-decoration:none; }
  .btn.ghost { background:transparent; color:#0a6e65; border:1px solid #0a6e65; }
  footer { margin-top:28px; font-size:13px; color:#667470; }
</style>
</head>
<body>
<main>
  <p class="brand">SHENHE ZHONGKE</p>
  <nav aria-label="Breadcrumb" style="font-size:13px;color:#5f6d69;margin-top:10px">
    <a href="${SITE}/" data-journey="nav">Home</a> &rsaquo; <span>Batch attestations</span>
  </nav>
  <h1>Batch attestations</h1>
  <p class="lead">Every production batch this factory has attested on a public chain. Each attestation records the SHA-256 of that batch's laboratory report, so the report in a buyer's hands can be compared with the one that was filed.</p>

  <div class="stats">
    <div class="stat"><b>${attested.length}</b><span>attested batches</span></div>
    <div class="stat"><b>${live.length}</b><span>written to the chain</span></div>
    <div class="stat"><b>${simulated.length}</b><span>hashed, not yet written</span></div>
    <div class="stat"><b>${chainNames.length ? escapeHtml(chainNames.join(', ')) : '—'}</b><span>the chain</span></div>
  </div>

  <div class="card">
    ${
      attested.length
        ? `<table>
      <thead><tr><th>Batch</th><th>Product</th><th>Qty</th><th>Produced</th><th>Chain</th><th>Block</th><th>Transaction</th><th></th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>`
        : `<div class="empty">No batch has been attested yet.</div>`
    }
  </div>

  <div class="note">
    <b>What an attestation proves.</b> That the laboratory report file for that batch existed at the recorded time and has not been changed since — the SHA-256 in the transaction is the fingerprint, and you can compare it against the PDF in your hands.
    <br><br>
    <b>What it does not prove.</b> It does not prove that the product is approved for any market, and it does not prove that the product is good. Approval is the market authority's decision; quality is the laboratory's. An attestation proves one thing only: that a file has not been swapped.
  </div>

  ${
    live.length
      ? ''
      : `<div class="note warn"><b>Read this before you rely on the table above.</b> ${liveNote}</div>`
  }

  <div class="card next">
    <h2>Where to go from here</h2>
    <p>${
      live.length
        ? 'Every batch above carries a transaction anyone can read on the block explorer. The laboratory reports those batches point at are published as well, each with its number, the laboratory that issued it and the products it covers.'
        : 'No batch has been written to the chain yet, so the table above is empty. The evidence this factory holds today is the set of third-party laboratory reports &#8212; each with its number, the laboratory that issued it, the file itself, and the products it covers.'
    }</p>
    <a class="btn" href="/certifications.html" data-journey="certifications">The third-party lab reports</a>
    <a class="btn ghost" href="/contact.html" data-journey="ask">Request a quotation</a>
    <a class="btn ghost" href="${escapeHtml(whatsappHref('I read the batch attestation page.'))}" data-journey="whatsapp">Ask on WhatsApp</a>
  </div>

  <footer>
    Guangdong Shenhe Zhongke Biotechnology Co., Ltd. · No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China · <a href="${SITE}/">shenhezhongke.com</a>
    <!--
      THE ORDER, STAGE BY STAGE.

      This page is written by a script rather than by a page component, so it
      does not get the site layout - and the layout is what carries the
      footer. The one-line footer below was therefore the only way onward
      from a page a buyer reaches after downloading a report, and a buyer
      who has just seen the evidence has nowhere to go from it.

      The five stage links are the same five the site footer carries, so a
      reader who has finished the evidence can carry on to the quotation,
      the sample, the production run, the shipment or the claims procedure.
      The build gate checks that every page with a footer links all five.
    -->
    <nav class="journey" aria-label="The order, stage by stage">
      <a href="${SITE}/quotation.html" data-journey="footer">Quotation and terms</a>
      <a href="${SITE}/samples.html" data-journey="footer">Samples and approval</a>
      <a href="${SITE}/production.html" data-journey="footer">Production and inspection</a>
      <a href="${SITE}/shipping.html" data-journey="footer">Shipping and customs</a>
      <a href="${SITE}/after-sales.html" data-journey="footer">After-sales and reorders</a>
    </nav>
  </footer>
</main>
</body>
</html>
`;
}

function main() {
  const attested = loadAttested();

  // the directory is cleared first: an index that lists a batch which no
  // longer exists is worse than no index
  mkdirSync(OUT, { recursive: true });
  for (const old of readdirSync(OUT)) {
    unlinkSync(join(OUT, old));
  }

  const html = indexHtml(attested);
  writeFileSync(join(OUT, 'index.html'), html, 'utf8');
  console.log('  the attestation index: %d batches', attested.length);
  return 0;
}

process.exit(main());

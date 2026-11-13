/**
 * The entity keys in the machine-readable file.
 *
 * WHY
 * An assistant decides whether two mentions are the same company by
 * looking for the same entity in more than one place. The `sameAs`
 * list is what does that. Without it, the website, the certifications
 * page and the factory page read as three unrelated things that happen
 * to share a name — and a claim made against one of them cannot be
 * checked against the others.
 *
 * The other keys fill the same gap: what the registered business is,
 * what the company is called, where it is reachable, and what it holds.
 *
 * WHERE THE FACTS COME FROM
 * The company name, the legal name, the address, the year and the
 * contact details are read out of the site configuration, which is the
 * one place the pages read them from too. A fact written in two places
 * is a fact that will be right in one and stale in the other, and a
 * machine reading both will believe the one that disagrees.
 *
 * The certifications are read out of the built certification page, and
 * each one carries the limit that goes with it — because the whole
 * point of stating a certificate is to state what it covers.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.cwd();
const PUBLIC = join(SITE, 'public');
const OUT = join(SITE, 'out');

/*
 * THE PUBLIC ADDRESS, SEPARATE FROM THE BUILD DIRECTORY.
 *
 * `SITE` is the folder this script runs in. It is NOT an address, and it
 * must never be used where an address belongs.
 *
 * It was, once. The attestation block published
 *
 *   "index": "<the build directory>\\Desktop\\shenhe-v2/attestation.html"
 *
 * — the build machine's own home directory and folder layout, handed to
 * every answer engine that reads llms-full.json. It was the file's only
 * reference to where the attestation index lives, and it pointed at a
 * path that exists on one laptop and nowhere else.
 *
 * The same mistake would have put the directory into `verificationPage`
 * on every attested batch, and into any future field written beside
 * them. So the address is its own constant now, and the two are named
 * for what they are.
 */
const SITE_URL = 'https://shenhezhongke.com';

if (!existsSync(OUT)) {
  console.error('out/ not found — run `next build` first.');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* The facts, read out of the configuration                             */
/* ------------------------------------------------------------------ */

/*
 * The configuration is a TypeScript file, and this is a build script.
 * The values are read out of it by shape rather than by importing it,
 * because importing TypeScript from a plain node script is a build
 * step of its own. The shape is fixed: the values sit in the `brand`
 * block, one per line.
 */
const cfg = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');

/**
 * A value that is written as a CONSTANT, e.g. `email: PUBLIC_EMAIL`.
 *
 * The addresses are constants, so a reader that only understands quoted
 * literals reads straight past them and finds the next field with the
 * same name - which is how the AI files ended up publishing "Within one
 * business day by email during China Standard Time working hours." as
 * the company's email address.
 */
function cfgConst(name) {
  const m = cfg.match(new RegExp(`^const ${name} = '([^']*)'`, 'm'));
  return m ? m[1] : null;
}

function cfgValue(key) {
  const m = cfg.match(
    new RegExp(`^\\s{4}${key}:\\s*(?:'([^']*)'|"([^"]*)"|\`([^\`]*)\`|([A-Za-z_][A-Za-z0-9_]*))`, 'm'),
  );
  if (!m) return null;
  if (m[4]) return cfgConst(m[4]);
  return m[1] ?? m[2] ?? m[3] ?? null;
}

/** A value that is written across two lines, as a template string. */
function cfgBlock(key) {
  const re = new RegExp(`^\\s{4}${key}:\\s*\\n\\s*([\\s\\S]{0,600}?)\\n\\s{4}\\w`, 'm');
  const m = cfg.match(re);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').replace(/['"`]/g, '').trim();
}

const brand = {
  name: cfgValue('name'),
  nameTitle: cfgValue('nameTitle'),
  nameCN: cfgValue('nameCN'),
  legalName: cfgValue('legalName'),
  positioning: cfgValue('positioning'),
  domain: cfgValue('domain'),
  siteUrl: cfgValue('siteUrl'),
  foundedYear: cfgValue('foundedYear'),
  address: cfgValue('address'),
  addressCN: cfgValue('addressCN'),
  tel: cfgValue('tel'),
  email: cfgValue('email'),
  emailSales: cfgValue('emailSales'),
  whatsapp: cfgValue('whatsapp'),
  whatsappDisplay: cfgValue('whatsappDisplay'),
};


/**
 * The index of the bracket that closes the array opened at `start`.
 *
 * It walks the text and tracks three things: whether it is inside a
 * line comment, whether it is inside a string, and the depth of the
 * brackets. A bracket inside a comment or a string does not count,
 * so the answer is the bracket that actually closes the array.
 */
function findArrayEnd(text, start) {
  let depth = 0;
  let inLine = false;
  let inBlock = false;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === '\n') inLine = false;
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i++; }
      continue;
    }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
const entityBlock = (() => {
  const i = cfg.indexOf('entity: {');
  if (i === -1) return null;
  // The entity block ends at the sameAs array's closing bracket. The
  // social block that follows has URLs in it too, and those are channels
  // to reach the company — not places the company is identified — so
  // the block is cut before it starts.
  const j = cfg.indexOf('sameAs:', i);
  if (j === -1) return null;
  const arrStart = cfg.indexOf('[', j);
  // The end of the array is the closing bracket that is not inside a
  // comment and not inside a string. A plain indexOf(']') finds the
  // first one, and a comment inside the array — which is where the
  // report pages are explained — contains brackets of its own, so the
  // list was cut in the middle of a sentence.
  const arrEnd = findArrayEnd(cfg, arrStart);
  if (arrEnd === -1) return null;
  const arr = cfg.slice(arrStart, arrEnd + 1);
  // The same list, without repeats: an identity list with the same URL
  // twice tells a reader nothing and looks like a mistake.
  // The URLs, taken from the array with the comments removed first.
  //
  // A quote inside a comment is still a quote to a regular expression,
  // so the comment lines are stripped before the URLs are picked out.
  // Otherwise the list picks up the tail of an English sentence and
  // every second entry is a fragment of a comment.
  /*
   * BOTH COMMENT STYLES ARE STRIPPED, AND ONLY URLS ARE TAKEN.
   *
   * The filter used to remove line comments only. A block comment - the
   * kind that explains why a URL is in the list - was left in, and the
   * URLs written inside it as examples were picked up as if they were
   * entries. The list said eleven URLs and the file said four, and
   * nothing in the build said so.
   *
   * So: the block comments go as well, and only a quoted string that
   * starts with http is an entry. A quoted sentence in a comment is
   * not an address.
   */
  const arrNoComments = arr
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  const sameAs = [
    ...new Set(
      [...arrNoComments.matchAll(/'([^']+)'/g)]
        .map((m) => m[1])
        .filter((v) => v.startsWith('http://') || v.startsWith('https://')),
    ),
  ];
  const scope = cfg.slice(i, j).match(/businessScope:\s*\n?\s*'([^']+)'/);
  return { sameAs, businessScope: scope ? scope[1] : null };
})();

console.log('  the brand, read from the configuration:');
for (const [k, v] of Object.entries(brand)) {
  if (v) console.log(`    ${k}: ${String(v).slice(0, 70)}`);
}
if (!entityBlock?.sameAs?.length) {
  console.error('  the sameAs list was not found in the configuration.');
  process.exit(1);
}
console.log(`    sameAs: ${entityBlock.sameAs.length} places`);

/* ------------------------------------------------------------------ */
/* The certifications, read out of the built page                     */
/* ------------------------------------------------------------------ */

const certPage = join(OUT, 'certifications.html');
const certifications = [];
if (existsSync(certPage)) {
  const s = readFileSync(certPage, 'utf8');
  const text = s.replace(/<script[^>]*>[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const CERTS = [
    {
      name: 'ISO 22716',
      title: 'ISO 22716 — Good Manufacturing Practices for cosmetics',
      scope: 'Cosmetic production, control, storage and shipment, at the manufacturing site.',
      limit: 'A guideline, not a product approval. It does not cover a biocidal claim.',
      reference: 'ISO 22716:2007',
    },
    {
      name: 'FDA registration',
      title: 'FDA registered establishment',
      scope: 'The establishment is listed with the US Food and Drug Administration.',
      limit: 'A listing, not a product clearance. It does not by itself permit a claim in any market.',
      reference: 'Establishment registration',
    },
    {
      name: 'MSDS',
      title: 'Safety data sheets, 16 languages',
      scope: 'A safety data sheet for every catalogue product, in the language of the consignment.',
      limit: 'A record of the consignment. It is not an approval of the wording on a label for any market.',
      reference: 'SDS, 16 languages',
    },
  ];
  for (const c of CERTS) {
    if (text.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) {
      certifications.push(c);
    }
  }
}
console.log(`  the certifications, read from the built page: ${certifications.length}`);

/* ------------------------------------------------------------------ */
/* Write them into the machine-readable file                           */
/* ------------------------------------------------------------------ */

const jp = join(PUBLIC, 'llms-full.json');
if (!existsSync(jp)) {
  console.error('  llms-full.json is not there.');
  process.exit(1);
}
const d = JSON.parse(readFileSync(jp, 'utf8'));

d.brand = {
  name: brand.name,
  nameTitle: brand.nameTitle,
  nameCN: brand.nameCN,
  legalName: brand.legalName,
  positioning: brand.positioning,
  domain: brand.domain,
  founded: brand.foundedYear,
  website: brand.siteUrl,
};

d.legalRepresentative = {
  note: 'The legal entity is Guangdong Shenhe Zhongke Biotechnology Co., Ltd. A director is not named on this site, so none is stated here.',
  entity: brand.legalName,
  registeredAddress: brand.address,
  registeredAddressCN: brand.addressCN,
};

d.businessScope = entityBlock.businessScope;

d.sameAs = entityBlock.sameAs;

/*
 * The attestation block.
 *
 * An assistant asked "can this factory's claims be checked?" needs
 * something to point at. This block says where the attestations live,
 * what an attestation proves, and — honestly — how many there are
 * right now. A block that listed a number that did not exist would be
 * the same overclaiming as a certificate wall, only harder to take
 * back.
 */
{
  const receiptsPath = join(SITE, 'scripts', '.batches-attested.json');
  let batches = [];
  try {
    const raw = JSON.parse(readFileSync(receiptsPath, 'utf8'));
    if (Array.isArray(raw)) batches = raw;
  } catch {
    batches = [];
  }
  const live = batches.filter((b) => b && b.mode === 'live' && b.tx_hash);
  d.attestation = {
    what: 'Batch attestations on a public blockchain. Each one records the SHA-256 of a production batch\'s laboratory report, so the report can be checked against the file a buyer holds.',
    proves: 'That the laboratory report file existed at the recorded time and has not been changed since.',
    doesNotProve: 'That the product is approved for any market, and that the product is good. Approval is the market authority\'s decision and quality is the laboratory\'s.',
    chain: live.length ? live[0].chain : 'base-sepolia',
    index: SITE_URL + '/attestation.html',
    attestedBatches: batches.length,
    batchesOnChain: live.length,
    batches: batches.map((b) => ({
      batch: b.batch_no,
      sku: b.sku,
      qty: b.qty,
      producedAt: b.produced_at ? String(b.produced_at).slice(0, 10) : null,
      chain: b.chain,
      tx: b.tx_hash ?? null,
      block: b.block ?? null,
      verificationPage: SITE_URL + '/verify/' + encodeURIComponent(b.batch_no) + '.html',
    })),
  };
}

/*
 * The contact block, from the configuration.
 *
 * It used to be hand-written in the file, and it was wrong: the
 * WhatsApp number had been changed to an American number while the
 * site said +86 172 6665 9928 in fifty places, and the same file's
 * social block had it right. An assistant reads company.contact more
 * often than it reads social, so the wrong number was the one most
 * likely to be quoted back.
 *
 * The numbers now come from the site configuration, which is the
 * authority, so the block cannot drift from what the site says.
 */
if (d.company) {
  d.company.contact = {
    tel: brand.tel,
    mobile: brand.whatsappDisplay,
    whatsapp: brand.whatsappDisplay,
    whatsappLink: `https://wa.me/${brand.whatsapp}`,
    emailSales: brand.emailSales,
    emailSecurity: brand.email,
  };
  if (d.company.address) {
    d.company.address.street = brand.addressCN || d.company.address.street;
  }
}

d.social = {
  website: brand.siteUrl,
  whatsapp: `https://wa.me/${brand.whatsapp}`,
  whatsappDisplay: brand.whatsappDisplay,
  email: brand.email,
  telephone: brand.tel,
};

d.certifications = certifications;

d.updated = new Date().toISOString().slice(0, 10);

// Checked before it is written: a file that fails to parse is a file
// that has been destroyed.
const text = JSON.stringify(d, null, 2) + '\n';
JSON.parse(text);
const tmp = jp + '.tmp';
writeFileSync(tmp, text, 'utf8');
const { renameSync } = await import('node:fs');
renameSync(tmp, jp);

console.log('');
console.log('  llms-full.json now has:');
for (const k of Object.keys(d)) console.log(`    ${k}`);
console.log(`  the certifications: ${certifications.length}`);
console.log('  the sameAs: ' + d.sameAs.length);

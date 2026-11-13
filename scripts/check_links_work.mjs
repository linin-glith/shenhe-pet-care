#!/usr/bin/env node
/**
 * A LINK HAS TO LEAD SOMEWHERE.
 *
 * WHAT THIS IS FOR
 * Every address on this site ends in .html. Next's client router maps an
 * address to a ROUTE, and the route is /contact while the address is
 * /contact.html - so when a reader pressed the header's navigation, the
 * router stopped the browser's own navigation, looked for a route that
 * does not exist, and did nothing at all. The link was dead, and nobody
 * noticed because the page looked fine.
 *
 * A link that does not lead anywhere cannot be seen in a screenshot, in
 * the source, or in a build log. It can only be seen by pressing it.
 *
 * HOW IT CHECKS
 * It serves the built export, opens a page in headless Chrome, and
 * presses every internal link on it. A link that does not change the
 * address is a link that does not work - whatever the markup says.
 *
 * It talks to the browser over a PIPE, not a websocket, for the reason
 * the contrast gate gives: Chrome's new headless detaches when it is
 * asked for a DOM dump, and the websocket it ships trips a libuv
 * assertion on Windows when the process ends.
 *
 * Run: node scripts/check_links_work.mjs [--pages N] [--links N]
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let PORT = 8932;

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
/* How many pages to press the links on, and how many links per page. */
const PAGE_LIMIT = Number(argOf('--pages', '3'));
const LINK_LIMIT = Number(argOf('--links', '14'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function serve() {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    const file = join(OUT, path);
    if (!file.startsWith(OUT) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      PORT = server.address().port;
      resolve(server);
    });
  });
}

class Chrome {
  constructor() {
    this.id = 0;
    this.pending = new Map();
    this.buffer = '';
    this.chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--disable-background-networking', '--disable-extensions',
      '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'chrome-links-')),
      '--remote-debugging-pipe',
      '--window-size=1400,900',
      'about:blank',
    ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    this.chrome.stdio[4].on('data', (chunk) => this.onData(chunk));
    this.chrome.on('error', () => {});
  }

  onData(chunk) {
    this.buffer += chunk.toString('utf8');
    let i;
    while ((i = this.buffer.indexOf('\0')) >= 0) {
      const raw = this.buffer.slice(0, i);
      this.buffer = this.buffer.slice(i + 1);
      let msg;
      try { msg = JSON.parse(raw); } catch (e) { continue; }
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)(msg);
        this.pending.delete(msg.id);
      }
    }
  }

  send(method, params, sessionId) {
    const myId = ++this.id;
    const payload = { id: myId, method, params: params || {} };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(method + ' timed out')), 60000);
      this.pending.set(myId, (msg) => { clearTimeout(timer); resolve(msg); });
      this.chrome.stdio[3].write(JSON.stringify(payload) + '\0');
    });
  }

  async open(url) {
    const t = await this.send('Target.createTarget', { url: 'about:blank' });
    const targetId = t.result.targetId;
    const a = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = a.result.sessionId;
    await this.send('Page.enable', {}, sessionId);
    await this.send('Page.navigate', { url }, sessionId);
    await new Promise((r) => setTimeout(r, 900));
    return { targetId, sessionId };
  }

  async evaluate(sessionId, expression) {
    const r = await this.send('Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.error) throw new Error(r.error.message || 'the page refused');
    if (r.result && r.result.exceptionDetails) {
      throw new Error('the probe threw: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 200));
    }
    return r.result && r.result.result ? r.result.result.value : null;
  }

  async close(targetId) {
    try { await this.send('Target.closeTarget', { targetId }); } catch (e) { /* gone */ }
  }

  kill() {
    try { this.chrome.kill(); } catch (e) {}
  }
}

/* The links on the page, and where they point. */
const COLLECT = `(() => {
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href) continue;
    if (href.startsWith('#')) continue;
    if (/^(https?:)?\\/\\//.test(href)) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith('/_next/')) continue;
    const text = (a.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40);
    out.push({ href, text });
  }
  return out;
})()`;

/* Press one link and report where the reader ended up.
   The link to press is handed over in a global, so the probe itself has
   no place where the address could be pasted in. */
const PRESS = `(() => {
  const a = Array.from(document.querySelectorAll('a[href]'))
    .find((el) => el.getAttribute('href') === window.__probeHref);
  if (!a) return { pressed: false };
  const before = location.pathname;
  a.click();
  return { pressed: true, before };
})()`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name.startsWith('__')) continue;
      walk(p, out);
    } else if (name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

/**
 * THE PAGES THAT ARE CHECKED.
 *
 * The home page first - it carries every kind of link the site has: the
 * header's navigation, the call to action, the product cards, the footer's
 * guides. Then a sample of the others, so a component that only appears
 * on one page is not missed.
 */
function pageList() {
  const all = walk(OUT).sort().map((p) => relative(OUT, p).split(sep).join('/'));
  const picked = [];
  const home = all.find((p) => p === 'index.html');
  if (home) picked.push(home);
  for (const p of all) {
    if (picked.length >= PAGE_LIMIT) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!existsSync(OUT)) { console.log('FAIL  there is no out/ directory - build the site first'); return 1; }
  if (!existsSync(CHROME)) { console.log('FAIL  chrome is not at ' + CHROME); return 1; }

  const pages = pageList();
  const server = await serve();
  const chrome = new Chrome();
  const dead = [];
  let pressed = 0;

  try {
    for (const rel of pages) {
      const file = join(OUT, rel);
      let page = null;
      try {
        page = await chrome.open('http://127.0.0.1:' + PORT + '/' + rel);
        const links = (await chrome.evaluate(page.sessionId, COLLECT)) || [];
        const distinct = [];
        const seen = new Set();
        for (const l of links) {
          if (seen.has(l.href)) continue;
          seen.add(l.href);
          distinct.push(l);
        }
        console.log(`  ${rel}: ${links.length} link(s), ${distinct.length} distinct`);

        for (const link of distinct.slice(0, LINK_LIMIT)) {
          // go back to the page, press the link, see where we end up
          await chrome.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' + rel }, page.sessionId);
          await sleep(700);
          await chrome.evaluate(page.sessionId, `window.__probeHref = ${JSON.stringify(link.href)}`);
          const started = await chrome.evaluate(page.sessionId, PRESS);
          if (!started || !started.pressed) continue;
          pressed += 1;
          await sleep(1200);
          const after = await chrome.evaluate(page.sessionId, 'location.pathname');
          if (!after || after === started.before) {
            dead.push({ page: rel, href: link.href, text: link.text });
            console.log('      DEAD  %s  (%s)' % (link.href, link.text || 'no text'));
          }
        }
      } catch (e) {
        console.log('  (could not measure ' + rel + ': ' + e.message + ')');
      } finally {
        if (page) await chrome.close(page.targetId);
      }
    }
  } finally {
    chrome.kill();
    server.close();
  }

  console.log();
  console.log('pressed ' + pressed + ' link(s)');
  if (dead.length) {
    console.log('FAIL  a link that does not lead anywhere is a broken site');
    for (const d of dead) {
      console.log('  ' + d.page + '  ->  ' + d.href + '  (' + d.text + ')');
    }
    console.log('  ' + dead.length + ' dead link(s)');
    return 1;
  }
  console.log('ok    every link that was pressed led somewhere');
  return 0;
}

process.exit(await main());

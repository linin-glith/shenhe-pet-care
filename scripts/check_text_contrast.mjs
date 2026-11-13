#!/usr/bin/env node
/**
 * TEXT THAT IS THE COLOUR OF ITS BACKGROUND IS NOT TEXT.
 *
 * WHAT THIS IS FOR
 * It happened twice, in the same shape:
 *
 *   - the headings, when an unlayered `h1,h2,h3,h4 { color }` rule in the
 *     stylesheet beat every Tailwind colour utility (fixed in globals.css);
 *   - the data bars, when every data bar on the site stood on bg-v2-ink-900
 *     and asked for the light tone - so the figure was painted with
 *     text-v2-ink-900. #0b0f12 on #0b0f12. The band looked like it was
 *     missing its numbers rather than wrong, and nobody said so for a week.
 *
 * A figure painted in the colour of the ground it stands on is invisible.
 * Nobody writes that down in a design, so the only way to catch it is to
 * MEASURE.
 *
 * HOW IT MEASURES
 * It serves the built export, opens every page in headless Chrome, and asks
 * the browser - not the source - what each piece of text is painted with and
 * what it stands on. Then it compares.
 *
 * Reading the source is not enough: a background can come from an ancestor,
 * an alpha can wash a colour out, and a utility can lose the cascade. Only
 * the rendered page knows.
 *
 * HOW IT TALKS TO THE BROWSER
 * Over a PIPE, not a websocket. Chrome 156's new headless detaches when it
 * is asked for a DOM dump, and the websocket it ships trips a libuv
 * assertion on Windows when the process ends - which turns a green gate
 * red for the wrong reason. `--remote-debugging-pipe` has neither problem:
 * no port, no socket, no teardown race.
 *
 * WHAT IT REPORTS
 * Text whose colour is the SAME as the background behind it - invisible. A
 * colour that is merely DIM is a design decision; a colour that is IDENTICAL
 * to the background is a bug.
 *
 * Run: node scripts/check_text_contrast.mjs [--threshold 1.5] [--pages N]
 *      node scripts/check_text_contrast.mjs --only products.html
 *      node scripts/check_text_contrast.mjs --distribution
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
/* The port the local server listens on. It is a fixed number until the
 * server starts, and then it is whatever the kernel gave us - see serve(). */
let PORT = 8931;

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
/**
 * THE THRESHOLD, AND WHERE IT CAME FROM.
 *
 * It is not a guess. The distribution is measured over every page (the
 * --distribution switch prints it) and this line is drawn where the
 * evidence says:
 *
 *   - the bug that was reported: a figure painted #0b0f12 on #0b0f12 = 1.0
 *   - the console's sign-in word: #1f2a2e on #0b0f12 = 1.31
 *   - the tables left inside a teal band: 1.58
 *   - after the fixes: nothing below 1.80 (the worst left is a decorative
 *     breadcrumb slash at 1.84)
 *
 * So 1.5 catches every one of the three real defects and leaves the
 * decorations alone.
 */
const THRESHOLD = Number(argOf('--threshold', '1.5'));
/*
 * TWO STANDARDS, ONE MEASUREMENT.
 *
 * 'same' - the default, and the reason this file exists: text painted in
 *   the colour of the ground it stands on. Invisible. Threshold 1.5.
 *
 * 'aa' - the standard Lighthouse and the accessibility auditors judge by:
 *   WCAG AA. 4.5:1 for ordinary text, 3:1 for large text (24px and up, or
 *   18.66px and up when bold). The cut-off the page is probed with is the
 *   widest of those, and the per-element rule is applied outside.
 */
const STANDARD = argOf('--standard', 'same');
const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;
/* The widest threshold of the mode: 1.5 for 'same', 4.5 for 'aa'. */
const PROBE_LIMIT = STANDARD === 'aa' ? AA_NORMAL : THRESHOLD;
const PAGE_LIMIT = Number(argOf('--pages', '0'));
const ONLY = argOf('--only', '');
/* How many failures per page to print. Four is enough to see what
   is wrong; a measurement wants all of them. */
const SHOW = Number(argOf('--show', '4'));

/* THE PROBE, RUN INSIDE THE PAGE. */
const PROBE = `(() => {
  function parseColor(value) {
    if (!value) return null;
    const rgb = value.match(/rgba?\\(([^)]+)\\)/);
    if (rgb) {
      const p = rgb[1].split(',').map((x) => parseFloat(x));
      if (p.length < 3 || isNaN(p[0])) return null;
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    /*
     * THE COLOURS CHROME HANDS BACK FOR A TAILWIND ALPHA.
     *
     * "text-white/45" is color-mix(in oklab, #fff 45%, transparent), and
     * the resolved value comes back as an OKLAB colour. A probe that
     * only reads rgb() sees no colour at all there and skips the
     * element - which is how the whole family of muted text on a dark
     * ground went unmeasured while the audit failed it.
     *
     * So oklab is converted to sRGB here, because the contrast ratio is
     * defined on sRGB.
     */
    const lab = value.match(/oklab\\(([^)]+)\\)/);
    if (lab) {
      const parts = lab[1].split('/');
      const p = parts[0].trim().split(/\\s+/).map((x) => parseFloat(x));
      const a = parts.length > 1 ? parseFloat(parts[1]) : 1;
      if (p.length < 3 || isNaN(p[0])) return null;
      const l_ = p[0], a_ = p[1], b_ = p[2];
      const l = Math.pow(l_ + 0.3963377774 * a_ + 0.2158037573 * b_, 3);
      const m = Math.pow(l_ - 0.1055613458 * a_ - 0.0638541728 * b_, 3);
      const s = Math.pow(l_ - 0.0894841775 * a_ - 1.2914855480 * b_, 3);
      const to8 = (v) => Math.max(0, Math.min(255, Math.round(
        255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055))));
      return {
        r: to8(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        g: to8(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        b: to8(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
        a: isNaN(a) ? 1 : a,
      };
    }
    const srgb = value.match(/color\\(srgb ([^)]+)\\)/);
    if (srgb) {
      const parts = srgb[1].split('/');
      const p = parts[0].trim().split(/\\s+/).map((x) => parseFloat(x));
      const a = parts.length > 1 ? parseFloat(parts[1]) : 1;
      if (p.length < 3 || isNaN(p[0])) return null;
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: isNaN(a) ? 1 : a };
    }
    return null;
  }
  function over(fg, bg) {
    if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 };
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };
  }
  function luminance(c) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function backgroundBehind(el) {
    const stack = [];
    let p = el;
    while (p && p !== document.documentElement) {
      const st = getComputedStyle(p);
      /*
       * A GRADIENT OR A PICTURE IS NOT A COLOUR.
       *
       * The dark bands on this site are a linear-gradient, so their
       * backgroundColor is transparent and the colour behind the text is in
       * the gradient itself. Reading past that to the page's white body
       * would call every white heading on a dark band "white on white" -
       * which is why this returns nothing rather than a guess. An element
       * whose ground cannot be read is not reported.
       */
      if (st.backgroundImage && st.backgroundImage !== 'none') return null;
      const c = parseColor(st.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
      p = p.parentElement;
    }
    stack.push({ r: 255, g: 255, b: 255, a: 1 });
    let base = stack.pop();
    while (stack.length) base = over(stack.pop(), base);
    return base;
  }
  function ownText(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.replace(/\\s+/g, ' ').trim();
  }
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const text = ownText(el);
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    /* AN INACTIVE CONTROL IS EXEMPT.
     * WCAG 1.4.3 lists "inactive user interface components" as incidental.
     * The auditors agree: a disabled button at half opacity is not a
     * contrast failure, so measuring it would report a defect that is not
     * one. */
    if (el.closest('[disabled],[aria-disabled="true"]')) continue;
    const opacity = style.opacity === '' ? 1 : parseFloat(style.opacity);
    if (!opacity) continue;
    const colour = parseColor(style.color);
    if (!colour) continue;
    const bg = backgroundBehind(el);
    if (!bg) continue;
    const painted = over({ r: colour.r, g: colour.g, b: colour.b, a: colour.a * opacity }, bg);
    const l1 = luminance(painted);
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio >= ${'${PROBE_LIMIT}'}) continue;
    out.push({
      ratio: Math.round(ratio * 100) / 100,
      size: parseFloat(style.fontSize) || 0,
      weight: style.fontWeight === 'normal' ? 400 : (parseInt(style.fontWeight, 10) || 400),
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').slice(0, 180),
      text: text.slice(0, 70),
      colour: 'rgb(' + Math.round(painted.r) + ',' + Math.round(painted.g) + ',' + Math.round(painted.b) + ')',
      bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')',
    });
  }
  out.sort((a, b) => a.ratio - b.ratio);
  return out;
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
  /*
   * A FREE PORT, NOT A FIXED ONE.
   *
   * The port used to be a constant, so two builds at the same time - the
   * second one usually the other session's - collided with EADDRINUSE and
   * the contrast gate reported a false failure ("a piece of text cannot be
   * read where it stands") for a page that reads perfectly well.
   *
   * The server asks the kernel for any free port and the browser is told
   * which one it got. Two checks can now run side by side.
   */
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const chosen = server.address().port;
      if (chosen !== PORT) {
        console.log('  (the contrast server took port ' + chosen + '; ' + PORT + ' was taken)');
      }
      PORT = chosen;
      resolve(server);
    });
  });
}

/* ------------------------------------------------------------------ */
/* THE BROWSER, OVER A PIPE                                           */
/* ------------------------------------------------------------------ */

class Chrome {
  constructor() {
    this.id = 0;
    this.pending = new Map();
    this.buffer = '';
    this.chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--disable-background-networking', '--disable-extensions',
      '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'chrome-contrast-')),
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
    // the page has to be laid out before the probe means anything
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

/*
 * WHAT ONE PIECE OF TEXT HAS TO REACH.
 *
 * WCAG AA: 4.5:1 for ordinary text, 3:1 for large text. "Large" is 24px and
 * up, or 18.66px and up when the weight is 700 or more - the same rule the
 * auditors use, so this gate and Lighthouse agree on what is a failure.
 */
function aaLimit(d) {
  const size = d.size || 0;
  const weight = d.weight || 400;
  const large = size >= 24 || (size >= 18.66 && weight >= 700);
  return large ? AA_LARGE : AA_NORMAL;
}

async function measure(chrome, file, threshold) {
  const rel = relative(OUT, file).split(sep).join('/');
  const url = 'http://127.0.0.1:' + PORT + '/' + rel;
  let page = null;
  try {
    page = await chrome.open(url);
    const limit = STANDARD === 'aa' ? AA_NORMAL : threshold;
    const data = await chrome.evaluate(page.sessionId, PROBE.replace('${PROBE_LIMIT}', String(limit)));
    if (!Array.isArray(data)) return { rel, bad: ['the page produced no report'] };
    const bad = data
      .filter((d) => (STANDARD === 'aa' ? d.ratio < aaLimit(d) : d.ratio < threshold))
      .map((d) =>
        `${d.tag} (ratio ${d.ratio}${STANDARD === 'aa' ? ', needs ' + aaLimit(d) : ''}, ${d.colour} on ${d.bg}) "${d.text}"  ${d.cls}`);
    return { rel, bad };
  } catch (e) {
    return { rel, bad: ['the page could not be measured: ' + e.message] };
  } finally {
    if (page) await chrome.close(page.targetId);
  }
}

function pageList() {
  const pages = walk(OUT).sort();
  if (ONLY) {
    const wanted = ONLY.replace(/^\//, '');
    const picked = pages.filter((p) => relative(OUT, p).split(sep).join('/') === wanted);
    if (!picked.length) { console.log('FAIL  no page matches --only ' + ONLY); process.exit(1); }
    return picked;
  }
  return PAGE_LIMIT ? pages.slice(0, PAGE_LIMIT) : pages;
}

async function main() {
  if (!existsSync(OUT)) { console.log('FAIL  there is no out/ directory - build the site first'); return 1; }
  if (!existsSync(CHROME)) { console.log('FAIL  chrome is not at ' + CHROME); return 1; }

  const list = pageList();
  if (STANDARD === 'aa') {
    console.log('checking ' + list.length + ' page(s) against WCAG AA (4.5:1, or 3:1 for large text)');
  } else {
    console.log('checking ' + list.length + ' page(s) for text that cannot be read (below ' + THRESHOLD + ':1)');
  }

  const server = await serve();
  const chrome = new Chrome();
  const problems = [];
  try {
    for (const file of list) {
      const { rel, bad } = await measure(chrome, file, THRESHOLD);
      if (bad.length) problems.push([rel, bad]);
    }
  } finally {
    chrome.kill();
    server.close();
  }

  if (problems.length) {
    console.log(STANDARD === 'aa'
      ? 'FAIL  the text does not reach the contrast the standard asks for'
      : 'FAIL  the text has to be readable on the ground it stands on');
    for (const [rel, bad] of problems) {
      console.log('  ' + rel);
      for (const b of bad.slice(0, SHOW)) console.log('      ' + b);
    }
    console.log('  ' + problems.length + ' page(s) affected');
    return 1;
  }
  console.log('ok    every piece of text on ' + list.length + ' page(s) can be read on its ground');
  return 0;
}

/**
 * THE DISTRIBUTION.
 *
 * The threshold is not a guess. This prints how many pieces of text on the
 * site fall below each ratio, so the line between "a design decision" and
 * "a defect" is drawn where the evidence says.
 */
async function distribution() {
  const pages = walk(OUT).sort();
  const server = await serve();
  const chrome = new Chrome();
  const all = [];
  try {
    for (const file of pages) {
      const rel = relative(OUT, file).split(sep).join('/');
      let page = null;
      try {
        page = await chrome.open('http://127.0.0.1:' + PORT + '/' + rel);
        const data = await chrome.evaluate(page.sessionId, PROBE.replace('${PROBE_LIMIT}', '999'));
        if (Array.isArray(data)) for (const d of data) all.push({ rel, ...d });
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
  console.log('measured ' + all.length + ' piece(s) of text across ' + pages.length + ' page(s)');
  console.log('');
  console.log('  ratio   how many pieces of text');
  for (const t of [1.05, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.5, 3.0]) {
    console.log('  < ' + t.toFixed(2) + '   ' + all.filter((d) => d.ratio < t).length);
  }
  console.log('');
  console.log('  the worst 20:');
  all.sort((a, b) => a.ratio - b.ratio);
  for (const d of all.slice(0, 20)) {
    console.log('    ' + String(d.ratio).padEnd(6) + d.rel + '  ' + d.colour + ' on ' + d.bg + '  "' + d.text + '"');
  }
  return 0;
}

process.exit(args.includes('--distribution') ? await distribution() : await main());

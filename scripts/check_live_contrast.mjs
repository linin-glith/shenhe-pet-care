#!/usr/bin/env node
/**
 * MEASURE THE LIVE SITE, not the build.
 *
 * The build can be right and the site can still be wrong - that happened
 * today: the repository carried the fix, the build was right, and the site
 * was still serving the old one. So the last check before "done" is a
 * measurement of the pages a buyer actually loads.
 *
 * Run: node scripts/check_live_contrast.mjs [url ...]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const urls = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
    'https://shenhezhongke.com/products.html',
    'https://shenhezhongke.com/oem-odm.html',
    'https://shenhezhongke.com/admin.html',
    'https://shenhezhongke.com/global-compliance.html',
    'https://shenhezhongke.com/capabilities.html',
    'https://shenhezhongke.com/factory.html',
    'https://shenhezhongke.com/',
  ];

const PROBE = `(() => {
  function parseColor(v){ if(!v) return null; const m=v.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p=m[1].split(',').map(parseFloat); if(p.length<3||isNaN(p[0])) return null;
    return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; }
  function over(f,b){ if(f.a>=1) return {r:f.r,g:f.g,b:f.b,a:1};
    return {r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1}; }
  function lum(c){ const f=(v)=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
  function bgBehind(el){ const st=[]; let p=el;
    while(p&&p!==document.documentElement){ const s=getComputedStyle(p);
      if(s.backgroundImage&&s.backgroundImage!=='none') return null;
      const c=parseColor(s.backgroundColor); if(c&&c.a>0){st.push(c); if(c.a>=1)break;} p=p.parentElement; }
    st.push({r:255,g:255,b:255,a:1}); let b=st.pop(); while(st.length) b=over(st.pop(),b); return b; }
  function ownText(el){ let t=''; for(const n of el.childNodes) if(n.nodeType===3) t+=n.nodeValue; return t.replace(/\\s+/g,' ').trim(); }
  const out=[];
  for(const el of document.querySelectorAll('body *')){ const text=ownText(el); if(!text) continue;
    const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
    const s=getComputedStyle(el); if(s.visibility==='hidden'||s.display==='none') continue;
    const op=s.opacity===''?1:parseFloat(s.opacity); if(!op) continue;
    const c=parseColor(s.color); if(!c) continue;
    const bg=bgBehind(el); if(!bg) continue;
    const painted=over({r:c.r,g:c.g,b:c.b,a:c.a*op},bg);
    const l1=lum(painted), l2=lum(bg);
    const ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    if(ratio>=1.5) continue;
    out.push({ratio:Math.round(ratio*100)/100, tag:el.tagName.toLowerCase(),
      cls:(el.getAttribute('class')||'').slice(0,160), text:text.slice(0,60),
      colour:'rgb('+Math.round(painted.r)+','+Math.round(painted.g)+','+Math.round(painted.b)+')',
      bg:'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')'}); }
  out.sort((a,b)=>a.ratio-b.ratio); return out; })()`;

class Chrome {
  constructor() {
    this.id = 0; this.pending = new Map(); this.buffer = '';
    this.chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--disable-background-networking',
      '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'chrome-live-')),
      '--remote-debugging-pipe', '--window-size=1400,900', 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    this.chrome.stdio[4].on('data', (c) => this.onData(c));
    this.chrome.on('error', () => {});
  }
  onData(chunk) {
    this.buffer += chunk.toString('utf8');
    let i;
    while ((i = this.buffer.indexOf('\0')) >= 0) {
      const raw = this.buffer.slice(0, i); this.buffer = this.buffer.slice(i + 1);
      let m; try { m = JSON.parse(raw); } catch (e) { continue; }
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m); this.pending.delete(m.id); }
    }
  }
  send(method, params, sessionId) {
    const myId = ++this.id;
    const payload = { id: myId, method, params: params || {} };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(method + ' timed out')), 60000);
      this.pending.set(myId, (m) => { clearTimeout(timer); resolve(m); });
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
    await new Promise((r) => setTimeout(r, 2500));
    return { targetId, sessionId };
  }
  async evaluate(sessionId, expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.result && r.result.exceptionDetails) throw new Error('the probe threw');
    return r.result && r.result.result ? r.result.result.value : null;
  }
  async close(targetId) { try { await this.send('Target.closeTarget', { targetId }); } catch (e) {} }
  kill() { try { this.chrome.kill(); } catch (e) {} }
}

const chrome = new Chrome();
let bad = 0;
try {
  for (const url of urls) {
    let page = null;
    try {
      page = await chrome.open(url);
      const data = await chrome.evaluate(page.sessionId, PROBE);
      if (!Array.isArray(data)) { console.log('  ' + url + '  (no report)'); bad++; continue; }
      if (!data.length) { console.log('  ok  ' + url); continue; }
      bad++;
      console.log('  FAIL ' + url);
      for (const d of data.slice(0, 5)) {
        console.log('      ' + d.tag + ' (ratio ' + d.ratio + ', ' + d.colour + ' on ' + d.bg + ') "' + d.text + '"  ' + d.cls);
      }
    } catch (e) {
      bad++;
      console.log('  FAIL ' + url + '  (' + e.message + ')');
    } finally {
      if (page) await chrome.close(page.targetId);
    }
  }
} finally {
  chrome.kill();
}
console.log('');
console.log(bad ? bad + ' live page(s) have text that cannot be read' : 'every live page listed can be read');
process.exit(bad ? 1 : 0);

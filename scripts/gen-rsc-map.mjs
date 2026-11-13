import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * THE MAP FILE nginx reads to serve the RSC payload.
 *
 * WHAT THIS IS FOR
 *
 * Next 16 asks for the payload of a page like this:
 *
 *   /__next.IKHNpdGUp.index._PAGE_.txt
 *   /__next.IKHNpdGUp.blog.howto.how-to-choose-a-pet-shampoo._PAGE_.txt
 *   /index.html/_next/IKHNpdGUp._PAGE_.txt
 *
 * and writes the file at:
 *
 *   __next.!KHNpdGUp/__PAGE__.txt
 *   about/__next.!KHNpdGUp/about/__PAGE__.txt
 *   blog/howto/<slug>/__next.!KHNpdGUp/blog/$d$category/$d$slug/__PAGE__.txt
 *
 * Three things stand between the two:
 *
 *   the encoded group  "IKHNpdGUp" in the request, "!KHNpdGUp" on
 *                    disk - Next writes it differently for a URL
 *                    than for a directory name
 *   the segment        "_PAGE_" in the request, "__PAGE__.txt" on disk
 *   the route          the request carries the RESOLVED route (with
 *                    the slug filled in), while the directory on disk
 *                    carries the route PATTERN ("$d$category/$d$slug")
 *                    - so the path cannot be worked out from the
 *                    request and has to be looked up
 *
 * So the build writes the map: one line per page, the path the
 * browser asks for and the path the file is at. nginx reads it when
 * it reloads.
 *
 * WITHOUT IT
 * Every page of the site asks for a file that is not there and gets
 * a 404, and the page cannot be navigated on the client.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');

/**
 * The un-escaped build id.
 *
 * The request carries "IKHNpdGUp" and the disk carries "!KHNpdGUp".
 * Only the first character differs: Next writes a character that is
 * not safe in a path with "!" in front of it, and the safe form of
 * "I" here is "K" - so the pair "!K" on the disk is the "I" of the
 * request, and the rest of the name is the same on both sides.
 */
function unescapeId(escaped) {
  if (!escaped.startsWith('!')) return escaped;
  return 'I' + escaped.slice(1);
}

/**
 * The resolved route of a page, read out of its own html.
 *
 * The flight data in the page carries it:
 *
 *   0:{"P":null,"c":["","blog","howto","how-to-choose-a-pet-shampoo"],...
 *
 * The "c" array is the route with its dynamic parts filled in, and it
 * is what the browser puts in the payload request. The directory on
 * disk carries the PATTERN instead, so the two have to be read from
 * different places - and only the html knows the resolved one.
 */
function resolvedRoute(htmlPath) {
  let t;
  try {
    t = fs.readFileSync(htmlPath, 'utf8');
  } catch {
    return null;
  }
  // The flight data is written into the page as a script, so its
  // quotes are escaped:
  //
  //   \"c\":[\"\",\"blog\",\"howto\",\"the-slug\"]
  //
  // Find the array, then split it on the commas and take the quotes
  // off. Matching the escapes one by one is harder to get right than
  // this.
  const m = t.match(/\\?"c\\?":\[(.*?)\]/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.replace(/\\?"/g, '').trim());
  if (parts[0] === '') parts.shift();
  if (!parts.length) return null;
  return parts.join('/');
}

/** Every page's payload file. */
function findPayloads(dir) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith('__next.')) {
      const escaped = e.name.slice('__next.'.length);
      if (escaped.startsWith('_')) continue; // _not-found
      const walkRoute = (routeDir, route) => {
        for (const sub of fs.readdirSync(routeDir, { withFileTypes: true })) {
          if (sub.isDirectory()) {
            walkRoute(path.join(routeDir, sub.name), route ? route + '/' + sub.name : sub.name);
            continue;
          }
          if (!sub.name.endsWith('.txt')) continue;
          found.push({
            // the directory the payload directory sits in: the page's
            // own directory, or the top of the export for the home
            pageDir: path.relative(OUT, dir).replace(/\\/g, '/'),
            route,
            file: sub.name,
            escaped,
          });
        }
      };
      walkRoute(full, '');
      continue;
    }
    found.push(...findPayloads(full));
  }
  return found;
}

/**
 * The html of the page a payload belongs to.
 *
 * The html sits NEXT TO the payload directory, not inside it:
 *
 *   out/about.html
 *   out/about/__next.!KHNpdGUp/about/__PAGE__.txt
 *
 *   out/blog/howto/<slug>.html
 *   out/blog/howto/<slug>/__next.!KHNpdGUp/blog/$d$category/$d$slug/__PAGE__.txt
 *
 * So the html is the page's own path with ".html" on it - and the
 * page's own path is the payload directory's path without the payload
 * directory itself.
 */
function htmlOf(pageDir) {
  if (!pageDir) return path.join(OUT, 'index.html');
  const c = path.join(OUT, pageDir + '.html');
  if (fs.existsSync(c)) return c;
  return null;
}

function main() {
  if (!fs.existsSync(OUT)) {
    console.error('  the build output is not there');
    process.exit(1);
  }

  const payloads = findPayloads(OUT);
  if (payloads.length === 0) {
    console.error('  no payload files were found in the build');
    process.exit(1);
  }

  // THE PAYLOAD IS COPIED WHERE THE MAP CAN POINT AT IT
  //
  // One directory name carries a dollar sign - the dynamic segments of
  // a route, "$d$category/$d$slug" - and a dollar sign in a map value
  // is a variable, with no escape for it.
  //
  // So the build copies every payload file into a directory whose name
  // has no dollar sign in it:
  //
  //   __rsc/blog/<category>/<slug>/__PAGE__.txt
  //
  // and the map points there. The copy is made by the build, so it is
  // always in step with the files it copies, and the map's value has
  // no dollar sign in it at all.
  const lines = [];
  const seen = new Set();
  for (const p of payloads) {
    const unescaped = unescapeId(p.escaped);
    const segOnDisk = p.file.replace(/\.txt$/, '');
    // THE SEGMENT NAME
    //
    // The disk carries the segment with an underscore at each end:
    //
    //   __PAGE__.txt
    //
    // and the request carries it with one:
    //
    //   _PAGE_.txt
    //
    // So the disk name is the request name with one underscore taken
    // off each end.
    const segOnRequest = '_' + segOnDisk.replace(/^_+/, '').replace(/_+$/, '') + '_';

    // the route the browser asks for: the RESOLVED one, read out of
    // the page's own html
    const html = htmlOf(p.pageDir);
    const resolved = html ? resolvedRoute(html) : null;
    // the home page's route is empty in the flight data - it is filed
    // under "index", and that is the name the browser asks for
    const route = (resolved || p.route || '').replace(/^\/+|\/+$/g, '');
    const routeOnRequest = (route || 'index').replace(/\//g, '.');

    // the copy: the page's own path, with the file's own name
    const copyName = p.file;
    const dir = p.pageDir ? path.join(OUT, '__rsc', p.pageDir) : path.join(OUT, '__rsc');
    fs.mkdirSync(dir, { recursive: true });
    const from = path.join(OUT, p.pageDir || '', '__next.' + p.escaped, p.route, p.file);
    fs.copyFileSync(from, path.join(dir, copyName));

    const value = `__rsc/${p.pageDir ? p.pageDir + '/' : ''}${copyName}`;

    // the older shape: the route is in the path
    const keyOld = `/__next.${unescaped}.${routeOnRequest}.${segOnRequest}.txt`;
    if (!seen.has(keyOld)) {
      seen.add(keyOld);
      lines.push(`${keyOld} ${value};`);
    }

    // the newer shape: the PAGE is in the path and the route is in
    // the file name - and the page's name is what the build knows and
    // the request carries
    const pageName = p.pageDir ? p.pageDir.split('/').pop() : 'index';
    const keyNew = `/${pageName}.html/_next/${unescaped}.${routeOnRequest}.${segOnRequest}.txt`;
    if (!seen.has(keyNew)) {
      seen.add(keyNew);
      lines.push(`${keyNew} ${value};`);
    }

    // and the form without the route in the file name - the one the
    // performance report shows. It only makes sense for a page whose
    // route IS the page, so it is only written for those.
    if (routeOnRequest === pageName || (p.pageDir === '' && routeOnRequest === 'index')) {
      const keyPlain = `/${pageName}.html/_next/${unescaped}.${segOnRequest}.txt`;
      if (!seen.has(keyPlain)) {
        seen.add(keyPlain);
        lines.push(`${keyPlain} ${value};`);
      }
    }

    // THE SHAPE NEXT 16 ASKS FOR
    //
    // The browser was seen asking for the payload like this:
    //
    //   /about.html/__next.!KHNpdGUp.about.__PAGE__.txt
    //
    // - in the page's own path, with the build id and the segment written
    // the way they are ON DISK rather than the way an older Next wrote
    // them for a URL. The map is what turns that request into the file.
    //
    // The route in the name is the resolved one ("blog.howto.the-slug"),
    // because that is what the request carries; the pattern on disk
    // ("$d$category/$d$slug") is what the directory is named.
    const keyNext16 =
      `/${p.pageDir ? p.pageDir + '.html' : ''}/__next.${p.escaped}.${routeOnRequest}.${segOnDisk}.txt`;
    if (!seen.has(keyNext16)) {
      seen.add(keyNext16);
      lines.push(`${keyNext16} ${value};`);
    }

    // and the home page, which is asked for at the root of the site with
    // no route in the name at all
    if (!p.pageDir) {
      const keyHome = `/__next.${p.escaped}.${segOnDisk}.txt`;
      if (!seen.has(keyHome)) {
        seen.add(keyHome);
        lines.push(`${keyHome} ${value};`);
      }
    }
  }

  // nginx reads this file with the configuration parser, so it holds
  // nothing but the pairs: no comments, no blank lines, and every
  // line ends with a semicolon like any other directive.
  const out = lines.join('\n') + '\n';

  const dest = path.join(ROOT, 'public', '__rsc-map.entries');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out, 'utf8');
  console.log(`  the rsc map: ${lines.length} entries, ${out.length} bytes`);
}

main();

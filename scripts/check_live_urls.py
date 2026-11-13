#!/usr/bin/env python3
"""
Check the LIVE site for the URL problems that cost traffic.

WHY THIS IS A SCRIPT AND NOT A BUILD GATE
The build gate reads out/, and out/ has one file per page. The duplication
lives in the SERVER: /about and /about.html both answered 200 with the same
bytes, so half the known URL space was a second copy of every page. A build
gate cannot see that; only a probe of the running site can.

WHAT IT CHECKS
For every address the site advertises to a crawler - in robots.txt, in
every sitemap, and in the AI manifest:

  1. It answers 200.

And for every PAGE among them:

  2. Its canonical names itself.
  3. Its extensionless form does NOT answer 200 -- it must 301 to the .html
     form. A 200 there is a duplicate URL: the crawler reads it, the index
     stores it, and the page's authority is split in two.
  4. The trailing-slash form does not answer 200 either.

WHY IT READS EVERY ADVERTISED ADDRESS AND NOT ONE SITEMAP
It used to read sitemap.xml - the pages - and the pages were fine. The
site advertises three more sitemaps and an AI manifest, and two machine
files in them answered 404 for a week: the server's rule that refuses
every .json had no name-based exception for them. The gate was looking
at the pages, and the pages were never the problem.

Exit code is non-zero when anything is wrong, so it can gate a deploy.

Usage
  python scripts/check_live_urls.py
  python scripts/check_live_urls.py --base http://127.0.0.1:8099   # local
"""
from __future__ import annotations

import argparse
import hashlib
import io
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

DEFAULT_BASE = "https://shenhezhongke.com"


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """A redirect is a finding, not something to follow.

    The whole question this script asks of the extensionless form is whether
    it answers 200 (a second copy of the page) or 301 (one address). An
    opener that follows the redirect hides the difference: both end as a 200
    with the same bytes, so the report would call a repaired site broken.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_NO_REDIRECT = urllib.request.build_opener(_NoRedirect)


def fetch(url, method="GET", tries=5, follow=True):
    """Five tries, with room between them.

    The check runs a hundred and thirty requests against the live site in
    parallel, and the occasional connection is dropped -- by the server, or
    by the reader's own network (a proxy, a tunnel). A dropped connection is
    not a finding about the site, so it is retried and, if it still fails,
    reported as a fetch error rather than as a page problem -- otherwise the
    report says "62 problems" when it means "one request did not get
    through".

    Three tries was not enough. On 2026-11-12 this gate stopped a deploy
    because /factory.html timed out three times in a row; the page was
    fine, and answered 200 five times out of five from the same machine
    seconds later. So: five tries, a longer timeout, and a pause that
    grows -- the burst of parallel requests is what the local proxy is
    carrying, and backing off lets it breathe.

    A page that is genuinely gone still fails, in about three minutes
    instead of one. That is the right trade: the cost of waiting is
    minutes, and the cost of a false alarm is a deploy that did not
    happen.
    """
    last = (None, url, b"", "")
    for attempt in range(tries):
        req = urllib.request.Request(url, method=method, headers={"User-Agent": "Mozilla/5.0"})
        try:
            opener = urllib.request.urlopen if follow else _NO_REDIRECT.open
            r = opener(req, timeout=35)
            return r.status, r.geturl(), r.read(), r.headers.get("Location", "")
        except urllib.error.HTTPError as e:
            loc = e.headers.get("Location", "") if e.headers else ""
            return e.code, url, e.read(), loc
        except Exception as e:
            last = (None, f"{type(e).__name__}: {e}", b"", "")
            if attempt + 1 < tries:
                time.sleep(2 + 2 * attempt)
    return last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=DEFAULT_BASE)
    args = ap.parse_args()
    base = args.base.rstrip("/")

    # EVERY address the site advertises, from every file that advertises
    # one. robots.txt names the sitemaps; the sitemaps name the pages and
    # the machine files; the AI manifest names the machine files again.
    st, _f, body, _l = fetch(base + "/sitemap.xml")
    if st != 200:
        print(f"cannot read the sitemap: {st}")
        return 2

    sitemaps = set()
    st, _f, robots_body, _l = fetch(base + "/robots.txt")
    if st == 200:
        for u in re.findall(r"^Sitemap:\s*(\S+)", robots_body.decode("utf-8", "replace"), re.M):
            sitemaps.add(u)
    for name in ("/sitemap.xml", "/sitemap-ai.xml", "/llms-sitemap.xml", "/sitemap-index.xml"):
        sitemaps.add(base + name)

    urls = set()
    for sm in sorted(sitemaps):
        st, _f, smbody, _l = fetch(sm)
        if st != 200:
            print(f"  (the sitemap {sm} answers {st} - skipped)")
            continue
        for u in re.findall(r"<loc>([^<]+)</loc>", smbody.decode("utf-8", "replace")):
            urls.add(u)
    st, _f, manifest_body, _l = fetch(base + "/.well-known/ai-manifest.json")
    if st == 200:
        for u in re.findall(r'https://shenhezhongke\.com(/[A-Za-z0-9_.\-/]+)',
                            manifest_body.decode("utf-8", "replace")):
            urls.add(base + u)

    paths = sorted((u.replace(base, "") or "/" for u in urls))
    pages = [p for p in paths if p.endswith(".html") or p == "/"]
    others = [p for p in paths if p not in pages]
    print(f"the site advertises {len(paths)} address(es): {len(pages)} page(s) and {len(others)} machine file(s)\n")

    def check(p):
        problems = []
        page = base + p
        st, final, raw, _loc = fetch(page)
        if st is None:
            problems.append(f"{p} -> the request did not get through ({final})")
            return p, problems, None
        if st != 200:
            problems.append(f"{p} -> {st}")
            return p, problems, None
        sha = hashlib.sha256(raw).hexdigest()[:12]
        canon = re.findall(rb'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', raw)
        canon = canon[0].decode() if canon else ""
        if not canon:
            problems.append(f"{p} has no canonical")
        elif canon.rstrip("/") != page.rstrip("/"):
            problems.append(f"{p} -> canonical says {canon}")
        # The extensionless form. The redirect is NOT followed: the whole
        # question is whether it answers 200 (a second copy of the page) or
        # 301 (one address). An opener that follows it makes the two look
        # the same, and a repaired site reads as a broken one.
        stem = p[:-5] if p.endswith(".html") else p
        if stem and stem != "/":
            st2, final2, raw2, loc2 = fetch(base + stem, follow=False)
            if st2 == 200:
                sha2 = hashlib.sha256(raw2).hexdigest()[:12]
                kind = "the same content" if sha2 == sha else "different content"
                problems.append(f"{stem} answers 200 too ({kind}) -- one page, two URLs")
            elif st2 in (301, 302, 307, 308):
                if st2 != 301:
                    problems.append(f"{stem} redirects with {st2}, not 301 -- the address is not permanent")
                target = re.sub(r"^https?://[^/]+", "", loc2 or "")
                if not target:
                    problems.append(f"{stem} redirects but names no target")
                elif target.rstrip("/") != p.rstrip("/"):
                    problems.append(f"{stem} redirects to {loc2}, not to {p}")
            elif st2 not in (404, 410):
                problems.append(f"{stem} -> {st2}")
            # the trailing-slash form is a third name for the same page
            st3, _f3, _r3, _l3 = fetch(base + stem + "/", follow=False)
            if st3 == 200:
                problems.append(f"{stem}/ answers 200 too -- one page, two URLs")
        return p, problems, sha

    # The machine files have no canonical and no second form: they are
    # files, not pages. They have to answer, and that is all.
    def check_file(p):
        st, _f, _r, _l = fetch(base + p)
        if st != 200:
            return p, ["%s -> %s -- the site advertises it and it does not answer" % (p, st)]
        return p, []

    all_problems = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        for p, problems, sha in ex.map(check, pages):
            if problems:
                all_problems.append((p, problems))
    with ThreadPoolExecutor(max_workers=8) as ex:
        for p, problems in ex.map(check_file, others):
            if problems:
                all_problems.append((p, problems))

    print(f"=== {len(all_problems)} page(s) with a problem ===")
    for p, problems in all_problems[:30]:
        for x in problems:
            print(f"   {x}")
    if len(all_problems) > 30:
        print(f"   ... and {len(all_problems)-30} more pages")

    if all_problems:
        print(f"\nRESULT: FAIL ({len(all_problems)} page(s))")
        return 1
    print(f"\nRESULT: PASS ({len(pages)} pages: one URL each, canonical, no duplicate form; "
          f"{len(others)} machine file(s) answer)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

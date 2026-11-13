#!/usr/bin/env python3
"""
ONE PAGE, ONE URL - the 301 that the extensionless URLs now get.

ALREADY APPLIED ON THE SERVER (2026-11-02). The rule is live: /about answers
301 and /about.html answers 200, and scripts/check_live_urls.py reports PASS
for all 63 pages of the sitemap.

It was applied from the Tencent Cloud console's command runner rather than over
SSH, because the SSH port in DEPLOY.md was wrong (the server only ever listens
on 22). This file stays in the repository for two reasons: to say what the rule
is and where it lives, and so that a server rebuilt from scratch gets it too.

WHERE IT LIVES ON THE SERVER
  the vhost         /etc/nginx/conf.d/shenhe-site.conf
                    (nginx.conf line 41: include /etc/nginx/conf.d/*.conf)
  the nginx binary  /usr/sbin/nginx
  the web root      /www/wwwroot/shenhezhongke.com
  the backup taken  /etc/nginx/conf.d/shenhe-site.conf.bak.20261102_124231

THE RULE
  It sits in the "location /" block, right above the try_files line:

      if (-f $document_root$uri.html) { return 301 $uri.html; }

  WHY THAT FORM, AND NOT A SERVER-LEVEL REWRITE
  A server-level "rewrite ^/(.*?)/?$ /$1.html redirect" redirects every path
  that has no .html sibling to a page that does not exist: /traffic/ (the
  staff dashboard), /nonexistent-xyz, every path a scanner guesses. Each one
  would answer 301 and then 404 - a redirect to a dead end, and the crawlers
  would keep the dead end in the index. The -f test asks the filesystem
  whether the target page is really there, so only the real pages move.

  WHY INSIDE "location /" AND NOT AT THE SERVER LEVEL
  The exact-match locations (/de/, /blog/index.html), the API (/api/), the
  build assets (/_next/, /assets/) and the reading lists (/llms.json, ...) are
  chosen by the location matcher. A server-level rewrite runs BEFORE the
  matcher and would take those away from the rules that already handle them
  correctly - /de/ would stop using its own 301, and /traffic/ would start
  answering 301. Inside "location /" the rule only sees the requests that no
  other rule claimed, which is exactly the set of page URLs.

WHAT IT DOES NOT CHANGE
  /about.html    200   the page itself
  /              200   the home page
  /about/        404   unchanged - it was a 404 before the change as well
  /nonexistent-xyz 404 unchanged - a made-up path is still a made-up path
  /api/health    200   the API keeps its own longer-prefix location
  /de/           301   to /de.html, by the rule that was already there

SAFE TO RE-RUN
  The script finds the rule by its marker comment. A file that already carries
  it is left alone and the script only verifies the result.

REHEARSED
  scripts/rehearse_apply_url_canonical.py exercises the script against a mock
  tree: the happy path (rule inserted, backup taken, nginx -t run, reload,
  verification), a second run (no second backup, the rule is not inserted
  twice, nginx is not run again) and a failing nginx -t (the file comes back
  byte-identical and nothing is reloaded). Run it from the repo:

    python scripts/rehearse_apply_url_canonical.py

RUN IT ON THE SERVER
  python3 apply_url_canonical.py
"""
import os
import re
import shutil
import subprocess
import sys
import time

# The paths can be pointed at a mock tree for a rehearsal:
#   SHENHE_SITE / SHENHE_VHOST / SHENHE_WEBROOT / SHENHE_NGINX
SITE = os.environ.get("SHENHE_SITE", "shenhezhongke.com")
VHOST = os.environ.get("SHENHE_VHOST", "/etc/nginx/conf.d/shenhe-site.conf")
WEBROOT = os.environ.get("SHENHE_WEBROOT", "/www/wwwroot/shenhezhongke.com")
NGINX_CANDIDATES = [os.environ.get("SHENHE_NGINX", "/usr/sbin/nginx"),
                    "/usr/local/nginx/sbin/nginx", "/usr/local/sbin/nginx"]

MARKER = "One address per page"
RULE = "if (-f $document_root$uri.html) { return 301 $uri.html; }"
COMMENT = [
    "# One address per page. The .html file is the one that exists, so",
    "# the short form must point at it instead of copying the same bytes",
    "# under a second name and splitting the crawlers between the two.",
]

# the line the rule has to sit above: this is what answered /about with the
# bytes of /about.html, because try_files falls through to $uri.html.
ANCHOR = re.compile(r"^([ \t]*)try_files \$uri \$uri/index\.html \$uri\.html =404;", re.M)

EXPECTED = [
    ("/", "200"),
    ("/about.html", "200"),
    ("/about", "301"),
    ("/about/", "404"),
    ("/products/multi-purpose-pet-wash-300", "301"),
    ("/nonexistent-xyz", "404"),
    ("/de/", "301"),
    ("/api/health", "200"),
    ("/sitemap.xml", "200"),
]


def find_nginx():
    for c in NGINX_CANDIDATES:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    p = shutil.which("nginx")
    if p:
        return p
    print("!! nginx binary not found; looked at %s" % ", ".join(NGINX_CANDIDATES))
    return None


def curl_status(path):
    """The status of one URL, from this machine, without following redirects.

    A redirect must not be followed here: the question is whether the short
    form answers 200 (a duplicate) or 301 (one address), and following the
    redirect makes the two look the same.
    """
    cmd = [
        "curl", "-sk", "-o", "/dev/null", "-w", "%{http_code}",
        "--resolve", "%s:443:127.0.0.1" % SITE,
        "https://%s%s" % (SITE, path),
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return r.stdout.strip()
    except Exception as e:
        return "ERR(%s)" % type(e).__name__


def main():
    if not os.path.isfile(VHOST):
        print("!! %s is not there." % VHOST)
        print("   find it with:")
        print("   grep -rl '%s' /etc/nginx/ 2>/dev/null" % SITE)
        return 1

    text = open(VHOST, encoding="utf-8", errors="replace").read()

    if MARKER in text:
        print("=== the rule is already in %s ===" % VHOST)
        print("    nothing is patched. The result is verified below.")
    else:
        m = ANCHOR.search(text)
        if not m:
            print("!! the try_files line was not found in %s." % VHOST)
            print("   the rule has to go above it. Look at the file by hand.")
            return 1

        indent = m.group(1)
        block = "".join(indent + line + "\n" for line in COMMENT)
        block += indent + RULE + "\n"
        new_text = text[: m.start()] + block + text[m.start():]

        backup = VHOST + ".bak-" + time.strftime("%Y%m%d_%H%M%S")
        shutil.copy2(VHOST, backup)
        with open(VHOST, "w", encoding="utf-8", newline="") as fh:
            fh.write(new_text)
        print("=== patched %s ===" % VHOST)
        print("    backup: %s" % backup)

        nginx = find_nginx()
        if not nginx:
            print("!! nginx could not be found. The patch is in the file but")
            print("   nothing was reloaded, so the running site is untouched.")
            print("   restore with: cp -a %s %s" % (backup, VHOST))
            return 1

        print("\n=== %s -t ===" % nginx)
        r = subprocess.run([nginx, "-t"], capture_output=True, text=True, timeout=60)
        out = ((r.stdout or "") + (r.stderr or "")).strip()
        print(out)
        if r.returncode != 0:
            print("\n!! the syntax check did not pass. The backup is restored;")
            print("   nothing was reloaded and the running site is untouched.")
            shutil.copy2(backup, VHOST)
            print("   restored %s" % VHOST)
            return 1

        print("\n=== reload ===")
        subprocess.run([nginx, "-s", "reload"], capture_output=True, text=True, timeout=60)
        time.sleep(2)
        print("reloaded")

    print("\n=== the result ===")
    bad = 0
    for path, want in EXPECTED:
        got = curl_status(path)
        ok = got == want
        if not ok:
            bad += 1
        print("   %-42s %-4s (expected %s)%s" % (path, got, want, "" if ok else "   <-- UNEXPECTED"))
    if bad:
        print("\n!! %d of %d answers were not what was expected." % (bad, len(EXPECTED)))
        print("   the backup is printed above; restore it and reload.")
        return 1

    print("\nRESULT: PASS - one URL per page, the short form redirects, the")
    print("        rest of the site is untouched.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

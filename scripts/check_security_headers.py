#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""THE SECURITY HEADERS HAVE TO BE ON EVERY RESPONSE, AND HAVE TO MATCH THE POLICY.

WHAT WENT WRONG
The site declared HSTS, nosniff, X-Frame-Options and Referrer-Policy, and
a check of the home page found all four. The home page was the only place
they were. In nginx, a location block that declares ANY add_header of its
own does not inherit the ones from the server block - it replaces them.
The `location ~* \.html$` block declares Cache-Control, so every .html
page, every asset and every 404 page was served with none of them.

So "the header is in the config" and "the header is on the response" are
two different facts, and only the second one protects a visitor.

WHAT THIS CHECKS
  static
    1. the policy file names the directives a policy has to name;
    2. the policy and the built site agree - a page with an inline event
       handler needs script-src-attr to be something other than 'none';
       a page with an inline script needs 'unsafe-inline' in script-src;
       a page with an inline style needs it in style-src;
    3. every origin the built site loads FROM is allowed by the directive
       that governs it. This is the one that matters going forward: add a
       new analytics script and the policy blocks it silently, because
       nobody reads the console of a buyer's phone.
    4. every browser feature the code uses is not switched off by the
       Permissions-Policy.

  live
    5. one address per kind of nginx location answers with every header
       present, once, and with the value this policy says - so the
       server's copy cannot drift away from this file.

Run:  python scripts/check_security_headers.py            # both
      python scripts/check_security_headers.py --static   # no network
      python scripts/check_security_headers.py --live
      python scripts/check_security_headers.py --render   # the nginx snippet
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
POLICY_FILE = os.path.join(ROOT, "lib", "security-headers.json")
SELF_HOST = "shenhezhongke.com"

problems: list[str] = []
notes: list[str] = []


# ---------------------------------------------------------------------------
# the policy, and how it is written out
# ---------------------------------------------------------------------------
def load_policy():
    try:
        with io.open(POLICY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError) as e:
        problems.append("lib/security-headers.json cannot be read: %s" % e)
        return None


def render_csp(directives: dict) -> str:
    parts = []
    for name, sources in directives.items():
        parts.append(("%s %s" % (name, " ".join(sources))) if sources else name)
    return ";".join(parts)


def render_permissions(features: dict) -> str:
    return ",".join("%s=(%s)" % (f, " ".join(v)) for f, v in features.items())


def csp_header_name(mode: str) -> str:
    return ("Content-Security-Policy" if mode == "enforce"
            else "Content-Security-Policy-Report-Only")


# ---------------------------------------------------------------------------
# does a source expression allow an origin?
# ---------------------------------------------------------------------------
def expr_allows(expr: str, url: str) -> bool:
    expr = expr.strip()
    if expr == "'self'":
        host = (urlparse(url).hostname or "").lower()
        return host == SELF_HOST or host == "www." + SELF_HOST
    if expr == "'none'":
        return False
    if expr.startswith("data:"):
        return url.startswith("data:")
    if expr.startswith("blob:"):
        return url.startswith("blob:")
    m = re.match(r"^(https?):\/\/(\*\.)?([A-Za-z0-9.\-]+)(?::\d+)?$", expr)
    if not m:
        return False
    scheme, wildcard, host = m.groups()
    parsed = urlparse(url)
    if parsed.scheme != scheme:
        return False
    h = (parsed.hostname or "").lower()
    if wildcard:
        return h == host.lower() or h.endswith("." + host.lower())
    return h == host.lower()


def directive_allows(directives: dict, directive: str, url: str) -> bool:
    for expr in directives.get(directive, []):
        if expr_allows(expr, url):
            return True
    return False


# ---------------------------------------------------------------------------
# what the built site loads from somewhere else
# ---------------------------------------------------------------------------
ATTR = re.compile(r'([A-Za-z-]+)\s*=\s*"([^"]*)"')


def attrs_of(tag: str) -> dict:
    return {k.lower(): v for k, v in ATTR.findall(tag)}


def external(url: str):
    """The origin of a subresource URL, or None if it is ours."""
    if not url:
        return None
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    if not re.match(r"^(https?|data|blob):", url, re.I):
        return None
    return url


def collect_subresources():
    """(directive, url, where) for every subresource the build points at."""
    found = []
    if not os.path.isdir(OUT):
        return found

    for dirpath, dirs, files in os.walk(OUT):
        dirs[:] = [d for d in dirs if d not in (".git",)]
        for fn in files:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, OUT).replace("\\", "/")
            if fn.endswith(".html"):
                try:
                    text = io.open(p, "r", encoding="utf-8", errors="replace").read()
                except OSError:
                    continue
                for tag in re.findall(r"<script\b[^>]*>", text, re.I):
                    u = external(attrs_of(tag).get("src", ""))
                    if u:
                        found.append(("script-src", u, rel))
                for tag in re.findall(r"<link\b[^>]*>", text, re.I):
                    a = attrs_of(tag)
                    rel_attr = a.get("rel", "").lower()
                    u = external(a.get("href", ""))
                    if not u:
                        continue
                    if "stylesheet" in rel_attr:
                        found.append(("style-src", u, rel))
                    elif "preload" in rel_attr or "prefetch" in rel_attr:
                        as_attr = a.get("as", "").lower()
                        directive = {"script": "script-src", "style": "style-src",
                                     "font": "font-src", "image": "img-src",
                                     "fetch": "connect-src"}.get(as_attr)
                        if directive:
                            found.append((directive, u, rel))
                for tag in re.findall(r"<img\b[^>]*>", text, re.I):
                    a = attrs_of(tag)
                    u = external(a.get("src", ""))
                    if u:
                        found.append(("img-src", u, rel))
                    for part in a.get("srcset", "").split(","):
                        u = external(part.strip().split(" ")[0])
                        if u:
                            found.append(("img-src", u, rel))
                for tag in re.findall(r"<iframe\b[^>]*>", text, re.I):
                    u = external(attrs_of(tag).get("src", ""))
                    if u:
                        found.append(("frame-src", u, rel))
                for tag in re.findall(r"<(?:video|audio|source)\b[^>]*>", text, re.I):
                    u = external(attrs_of(tag).get("src", ""))
                    if u:
                        found.append(("media-src", u, rel))
            elif fn.endswith(".css"):
                try:
                    text = io.open(p, "r", encoding="utf-8", errors="replace").read()
                except OSError:
                    continue
                font_block = False
                for chunk in re.findall(r"@font-face\s*\{[^}]*\}|[^;{}]*url\([^)]*\)", text, re.I):
                    if chunk.lower().startswith("@font-face"):
                        font_block = True
                    u = external(re.sub(r"^\s*url\(", "", chunk).rstrip(")").strip("'\""))
                    if u:
                        found.append(("font-src" if font_block else "img-src", u, rel))
                    font_block = False
            elif fn.endswith(".js"):
                try:
                    text = io.open(p, "r", encoding="utf-8", errors="replace").read()
                except OSError:
                    continue
                for m in re.finditer(r"fetch\(\s*[\"']([^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("connect-src", u, rel))
                for m in re.finditer(r"\.open\(\s*[\"'][A-Z]+[\"']\s*,\s*[\"']([^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("connect-src", u, rel))
                for m in re.finditer(r"sendBeacon\(\s*[\"']([^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("connect-src", u, rel))
                # A script the page creates for itself. The Clarity tag is
                # not a <script src> in the HTML - the code makes the
                # element and sets its src - so a scanner that only reads
                # the HTML is one origin short.
                for m in re.finditer(r"\.src\s*=\s*[\"'](https?://[^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("script-src", u, rel))
                for m in re.finditer(r"import\(\s*[\"'](https?://[^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("script-src", u, rel))
                for m in re.finditer(r"new Worker\(\s*[\"'](https?://[^\"']+)[\"']", text):
                    u = external(m.group(1))
                    if u:
                        found.append(("worker-src", u, rel))
    return found


# ---------------------------------------------------------------------------
# the static half
# ---------------------------------------------------------------------------
REQUIRED_DIRECTIVES = ("default-src", "base-uri", "object-src", "frame-ancestors",
                       "form-action", "script-src", "script-src-attr", "style-src",
                       "img-src", "connect-src", "font-src", "frame-src", "manifest-src")

INLINE_SCRIPT = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.S | re.I)
INLINE_HANDLER = re.compile(r'\son[a-z]+\s*=\s*"', re.I)


def build_facts():
    facts = {"inlineScripts": 0, "inlineHandlers": 0, "inlineStyles": 0,
             "iframes": 0, "media": 0, "files": 0}
    if not os.path.isdir(OUT):
        return facts
    for dirpath, _dirs, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith(".html"):
                continue
            p = os.path.join(dirpath, fn)
            facts["files"] += 1
            try:
                text = io.open(p, "r", encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            for attrs, body in INLINE_SCRIPT.findall(text):
                if "src=" in attrs.lower() or "ld+json" in attrs.lower():
                    continue
                if body.strip():
                    facts["inlineScripts"] += 1
            facts["inlineHandlers"] += len(INLINE_HANDLER.findall(text))
            facts["inlineStyles"] += len(re.findall(r'\sstyle\s*=\s*"', text))
            facts["iframes"] += len(re.findall(r"<iframe\b", text, re.I))
            facts["media"] += len(re.findall(r"<(?:video|audio)\b", text, re.I))
    return facts


def code_features():
    """The browser features the source code uses."""
    used = set()
    patterns = {
        "camera": r"getUserMedia|mediaDevices",
        "microphone": r"getUserMedia\([^)]*audio|MediaRecorder",
        "geolocation": r"navigator\.geolocation",
        "fullscreen": r"requestFullscreen|webkitRequestFullScreen",
        "payment": r"PaymentRequest",
        "clipboard": r"navigator\.clipboard",
        "notifications": r"Notification\.requestPermission|new Notification",
        "midi": r"requestMIDIAccess",
        "usb": r"navigator\.usb",
        "bluetooth": r"navigator\.bluetooth",
        "serial": r"navigator\.serial",
        "xr": r"navigator\.xr",
        "wake lock": r"wakeLock",
        "screen capture": r"getDisplayMedia",
        "shared workers": r"SharedWorker",
        "service worker": r"serviceWorker\.register",
        "web share": r"navigator\.share",
    }
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", "out", ".git",
                                                "docs", "_audit", "server-pg")]
        for fn in files:
            if not fn.endswith((".ts", ".tsx", ".js", ".mjs")):
                continue
            p = os.path.join(dirpath, fn)
            try:
                text = io.open(p, "r", encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            for name, rx in patterns.items():
                if re.search(rx, text, re.I):
                    used.add(name)
    return used


def check_static(policy):
    csp = policy["contentSecurityPolicy"]
    perms = policy["permissionsPolicy"]

    for name in REQUIRED_DIRECTIVES:
        if name not in csp:
            problems.append("the policy does not name %s" % name)
    for name, wanted in (("base-uri", "'self'"), ("object-src", "'none'"),
                         ("frame-ancestors", "'self'"), ("form-action", "'self'")):
        got = csp.get(name)
        if got != [wanted]:
            problems.append("%s is %s, and it has to be %s" % (name, got, wanted))

    facts = build_facts()
    print("  the build: %d html file(s), %d inline script(s), %d inline handler(s), "
          "%d inline style(s), %d iframe(s), %d media element(s)"
          % (facts["files"], facts["inlineScripts"], facts["inlineHandlers"],
             facts["inlineStyles"], facts["iframes"], facts["media"]))

    if facts["inlineHandlers"] and csp.get("script-src-attr") == ["'none'"]:
        problems.append(
            "the built pages carry %d inline event handler(s) and script-src-attr is "
            "'none', so the policy would block them" % facts["inlineHandlers"])
    if facts["inlineScripts"] and "'unsafe-inline'" not in csp.get("script-src", []):
        problems.append(
            "the built pages carry %d inline script(s) and script-src has no "
            "'unsafe-inline', so the policy would block the whole site"
            % facts["inlineScripts"])
    if facts["inlineStyles"] and "'unsafe-inline'" not in csp.get("style-src", []):
        problems.append(
            "the built pages carry %d inline style attribute(s) and style-src has no "
            "'unsafe-inline', so the policy would block the styling" % facts["inlineStyles"])
    if facts["iframes"] and csp.get("frame-src") == ["'none'"]:
        problems.append("the built pages carry %d iframe(s) and frame-src is 'none'" % facts["iframes"])
    if facts["media"] and "autoplay" in perms and perms.get("autoplay") == []:
        notes.append("there are %d media element(s) and autoplay is switched off" % facts["media"])

    # the allow lists have to cover what the site really loads
    subs = collect_subresources()
    blocked = {}
    for directive, url, where in subs:
        if not directive_allows(csp, directive, url):
            blocked.setdefault((directive, url), []).append(where)
    if blocked:
        for (directive, url), places in sorted(blocked.items()):
            problems.append("%s does not allow %s  (%s, and %d more place(s))"
                            % (directive, url[:90], places[0], len(places) - 1))
    external_hosts = sorted(set(urlparse(u).hostname for _, u, _ in subs if urlparse(u).hostname))
    print("  the site loads from %d origin(s): %s"
          % (len(external_hosts), ", ".join(external_hosts) if external_hosts else "none"))

    # the features the code uses must not be switched off
    used = code_features()
    feature_map = {"camera": "camera", "microphone": "microphone",
                   "geolocation": "geolocation", "fullscreen": "fullscreen",
                   "payment": "payment", "notifications": "notifications",
                   "midi": "midi", "usb": "usb", "bluetooth": "bluetooth",
                   "serial": "serial", "xr": "xr-spatial-tracking",
                   "wake lock": "screen-wake-lock", "screen capture": "display-capture",
                   "shared workers": "worker-src", "service worker": "worker-src",
                   "web share": "web-share"}
    for feature in sorted(used):
        directive = feature_map.get(feature)
        if not directive:
            continue
        if directive in perms and perms[directive] == []:
            problems.append("the code uses %s and the Permissions-Policy switches it off" % feature)
    if "clipboard" in used:
        allowed = perms.get("clipboard-write", [])
        if "self" not in allowed:
            problems.append("the code uses the clipboard and clipboard-write does not "
                            "allow this origin")
        else:
            print("  the clipboard is used by the code and clipboard-write=(self) allows it")
    return facts


# ---------------------------------------------------------------------------
# the live half
# ---------------------------------------------------------------------------
def live_paths(policy):
    paths = dict(policy.get("livePaths") or {})
    chunk = paths.get("nextStatic", "")
    if "__NEXT_CHUNK__" in chunk:
        found = ""
        cdir = os.path.join(OUT, "_next", "static", "chunks")
        if os.path.isdir(cdir):
            for fn in sorted(os.listdir(cdir)):
                if fn.endswith(".js"):
                    found = fn
                    break
        paths["nextStatic"] = chunk.replace("__NEXT_CHUNK__", found)
    return [(k, v) for k, v in paths.items() if not k.startswith("_") and v]


def fetch_headers(url: str, attempts: int = 3):
    """Any status is an answer - including 404, which is a thing to
    judge. A connection error is not an answer, so it is retried: a
    timeout is a flaky socket, not a broken site, and a gate that goes
    red on a timeout stops deploys for no reason."""
    import time
    import urllib.error
    import urllib.request
    last = None
    for attempt in range(attempts):
        req = urllib.request.Request(
            url, method="GET",
            headers={"User-Agent": "Mozilla/5.0 (compatible; shenhe-security-gate)"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.headers
        except urllib.error.HTTPError as e:
            return e.code, e.headers
        except Exception as e:
            last = e
            if attempt < attempts - 1:
                time.sleep(2 + attempt * 3)
    return 0, last


def check_live(policy):
    import http.client

    csp = render_csp(policy["contentSecurityPolicy"])
    perms = render_permissions(policy["permissionsPolicy"])
    mode = policy.get("mode", "report-only")
    name = csp_header_name(mode)
    base = "https://" + SELF_HOST

    print("  the policy the server has to send:")
    print("    %s: %s" % (name, csp[:110] + ("..." if len(csp) > 110 else "")))
    print("    Permissions-Policy: %s" % (perms[:110] + ("..." if len(perms) > 110 else "")))

    for label, path in live_paths(policy):
        status, headers = fetch_headers(base + path)
        if status == 0:
            problems.append("%s (%s) could not be fetched: %s" % (label, path, headers))
            continue
        items = headers.items()
        counts = {}
        for k, v in items:
            counts.setdefault(k.lower(), []).append(v)
        missing = []
        for required in ("strict-transport-security", "x-content-type-options",
                         "x-frame-options", "referrer-policy", "permissions-policy"):
            if required not in counts:
                missing.append(required)
        if name.lower() not in counts:
            missing.append(name)
        if missing:
            problems.append("%s (%s, %s) is missing: %s"
                            % (label, path, status, ", ".join(missing)))
            continue
        if len(counts[name.lower()]) > 1:
            problems.append("%s (%s) sends %s %d times"
                            % (label, path, name, len(counts[name.lower()])))
        got_csp = counts[name.lower()][0]
        if got_csp.strip() != csp:
            problems.append("%s (%s) sends a %s that is not the policy in "
                            "lib/security-headers.json" % (label, path, name))
        got_perms = counts["permissions-policy"][0]
        if got_perms.strip() != perms:
            problems.append("%s (%s) sends a Permissions-Policy that is not the policy "
                            "in lib/security-headers.json" % (label, path))
        other = ("content-security-policy-report-only" if mode == "enforce"
                 else "content-security-policy")
        if other in counts:
            problems.append("%s (%s) also sends %s - the mode in "
                            "lib/security-headers.json says %s" % (label, path, other, mode))
        print("    %-12s %-58s %s  all headers present" % (label, path, status))
    return True


# ---------------------------------------------------------------------------
# rendering the nginx snippet from the policy
# ---------------------------------------------------------------------------
def render_snippet(policy):
    csp = render_csp(policy["contentSecurityPolicy"])
    perms = render_permissions(policy["permissionsPolicy"])
    name = csp_header_name(policy.get("mode", "report-only"))
    server = policy.get("server") or {}
    return """# The site's security headers.
#
# GENERATED FROM lib/security-headers.json - do not hand-edit.
#   python scripts/check_security_headers.py --render
#
# %(inherit)s is the load-bearing line.
#
# In nginx, a location that declares any add_header of its own does not
# inherit the ones from the server block - it replaces them. The
# `location ~* \\.html$` block declares Cache-Control, so until this file
# existed every .html page was served with no HSTS, no nosniff, no
# X-Frame-Options and no Referrer-Policy. The headers were on the site
# and on the home page, and nowhere else.
#
# `merge` makes a location keep its own header and inherit these as well.
# It needs nginx %(minver)s or newer. If nginx is ever replaced by an
# older build, `nginx -t` will say "unknown directive" and this file
# will refuse to load - which is the right way to find out.

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # What the browser is allowed to do with this page. Everything the
    # code does not use is switched off; the clipboard stays for this
    # origin because the admin copies passwords with it.
    add_header Permissions-Policy "%(perms)s" always;

    # The Content-Security-Policy. The allow list is what the site
    # actually loads, measured: *.googletagmanager.com (gtag),
    # *.clarity.ms (the Clarity tag, script and collector), *.bing.com
    # (Microsoft's cookie sync, which Clarity calls), and
    # *.google-analytics.com (the GA4 collector).
    #
    # 'unsafe-inline' in script-src is not a shortcut. The static export
    # of Next.js writes its flight data into 250 different inline
    # scripts, one set per page, and every one of them is different - so
    # their hashes cannot be listed in a header (250 hashes would be
    # about 19 KB, past what nginx puts in one header) and they would
    # change with every edit. script-src-attr 'none' is the part that
    # can be strict: the built pages carry no inline event handlers.
    add_header %(name)s "%(csp)s" always;

    # Without this, a location with its own add_header replaces ours.
    %(inherit)s
""" % {"inherit": server.get("inheritDirective", "add_header_inherit merge;"),
       "minver": server.get("minNginxVersion", "1.29.3"),
       "perms": perms, "name": name, "csp": csp}


def main() -> int:
    ap = argparse.ArgumentParser()
    # Mutually exclusive on purpose. The old code said "run the static
    # half unless --live" and "run the live half unless --static", so
    # passing both switched both off - and the gate printed "ok" having
    # checked nothing.
    only = ap.add_mutually_exclusive_group()
    only.add_argument("--static", action="store_true",
                      help="check the built site against the policy, no network")
    only.add_argument("--live", action="store_true",
                      help="check the deployed site against the policy")
    ap.add_argument("--render", action="store_true",
                    help="print the nginx snippet the policy renders")
    args = ap.parse_args()

    policy = load_policy()
    if policy is None:
        print("FAIL  the policy file cannot be read")
        return 1

    if args.render:
        sys.stdout.write(render_snippet(policy))
        return 0

    do_static = args.static or not args.live
    do_live = args.live or not args.static
    if not (do_static or do_live):
        print("FAIL  the gate was asked to do nothing - refusing to say ok")
        return 1
    if do_static:
        print("STATIC")
        check_static(policy)
    if do_live:
        if do_static:
            print()
        print("LIVE")
        check_live(policy)

    for n in notes:
        print("note  " + n)
    if problems:
        print()
        print("FAIL  the security headers are not right")
        for p in problems[:16]:
            print("    " + p)
        return 1
    print()
    print("ok    the headers are on every response, and they are the policy")
    return 0


if __name__ == "__main__":
    sys.exit(main())

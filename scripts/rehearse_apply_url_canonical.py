# -*- coding: utf-8 -*-
"""Rehearse scripts/apply_url_canonical.py.

The script's own logic has to hold:
  A. a file without the rule gets the rule, a backup, a reload and a clean check
  B. running it again does not insert the rule twice and does not make a second backup
  C. a failing nginx -t leaves the file byte-identical and does not reload

The nginx and curl calls are injected (the script runs on Linux; this
rehearsal runs on Windows, where a shell script is not an executable), so
what is tested is the script's own logic: the file it writes, the backup it
takes, the order of the checks and the rollback.
"""
import contextlib
import importlib.util
import io
import os
import shutil
import sys
import tempfile

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "apply_url_canonical.py")

CONFIG = """server {
    listen 443 ssl;
    server_name shenhezhongke.com;
    root /www/wwwroot/shenhezhongke.com;
    location / {
        if ($shenhe_anon_args) { return 404; }
        try_files $uri $uri/index.html $uri.html =404;
    }
}
"""

CURL_CODES = {
    "/": "200", "/about.html": "200", "/about": "301", "/about/": "404",
    "/products/multi-purpose-pet-wash-300": "301", "/nonexistent-xyz": "404",
    "/de/": "301", "/api/health": "200", "/sitemap.xml": "200",
}

spec = importlib.util.spec_from_file_location("auc", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

failures = []


def check(name, cond, detail=""):
    print(("  OK   " if cond else "  FAIL ") + name + (("  -- " + detail) if detail and not cond else ""))
    if not cond:
        failures.append(name)


class FakeResult:
    def __init__(self, returncode=0, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def make_fake_run(calls, nginx_ok=True):
    def fake_run(cmd, *a, **kw):
        calls.append(list(cmd))
        exe = os.path.basename(str(cmd[0])).lower()
        if "nginx" in exe:
            if "-t" in cmd:
                if nginx_ok:
                    return FakeResult(0, "syntax is ok\n", "")
                return FakeResult(1, "", "test failed\n")
            return FakeResult(0, "", "")
        if "curl" in exe:
            url = cmd[-1]
            path = url.split("://", 1)[-1].split("/", 1)[-1]
            path = "/" + path if path else "/"
            return FakeResult(0, CURL_CODES.get(path, "404"), "")
        raise AssertionError("unexpected command: %r" % (cmd,))
    return fake_run


def run_scenario(conf, nginx_ok=True):
    calls = []
    mod.VHOST = conf
    mod.SITE = "shenhezhongke.com"
    mod.find_nginx = lambda: "/fake/sbin/nginx"
    mod.subprocess.run = make_fake_run(calls, nginx_ok)
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = mod.main()
    return code, buf.getvalue(), calls


tmp = tempfile.mkdtemp(prefix="shenhe-rehearse-")
try:
    conf = os.path.join(tmp, "shenhe-site.conf")
    io.open(conf, "w", encoding="utf-8", newline="").write(CONFIG)

    code, out, calls = run_scenario(conf)
    now = io.open(conf, encoding="utf-8", newline="").read()
    print("--- A: the first run ---")
    check("A: it exited zero", code == 0, out[-500:])
    check("A: the rule was inserted", "if (-f $document_root$uri.html) { return 301 $uri.html; }" in now)
    check("A: the rule sits above try_files", now.index("return 301 $uri.html") < now.index("try_files $uri"))
    check("A: the comment came with it", "# One address per page" in now)
    baks = [f for f in os.listdir(tmp) if ".bak-" in f]
    check("A: a backup was written", len(baks) == 1, str(os.listdir(tmp)))
    check("A: nginx -t was run", any("-t" in c for c in calls))
    check("A: the reload happened", any("-s" in c for c in calls))
    check("A: the verification passed", "RESULT: PASS" in out, out[-500:])

    code, out, calls = run_scenario(conf)
    now = io.open(conf, encoding="utf-8", newline="").read()
    print("--- B: the second run ---")
    baks = [f for f in os.listdir(tmp) if ".bak-" in f]
    check("B: it exited zero", code == 0, out[-500:])
    check("B: no second backup", len(baks) == 1, str(baks))
    check("B: the rule was not inserted twice", now.count("return 301 $uri.html") == 1)
    check("B: it said the rule is already there", "already in" in out)
    check("B: it did not run nginx -t again", not any("-t" in c for c in calls), str(calls))
    check("B: it still verified", "RESULT: PASS" in out, out[-500:])

    # ------------------------------------------------------------- C
    conf2 = os.path.join(tmp, "second.conf")
    original = CONFIG
    io.open(conf2, "w", encoding="utf-8", newline="").write(original)
    code, out, calls = run_scenario(conf2, nginx_ok=False)
    now = io.open(conf2, encoding="utf-8", newline="").read()
    print("--- C: nginx -t fails ---")
    check("C: it exited non-zero", code == 1)
    check("C: the file came back byte-identical", now == original, repr(now[:120]))
    check("C: nothing was reloaded", not any("-s" in c for c in calls), str(calls))
    check("C: it said the backup was restored", "restored" in out, out[-500:])
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print()
if failures:
    print("REHEARSAL FAILED: " + ", ".join(failures))
    sys.exit(1)
print("REHEARSAL PASSED: the happy path, the second run and the rollback all hold")

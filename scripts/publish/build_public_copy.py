#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build the published copy of the site, in one command.

  1. the copy      - the working tree minus what must not be published
  2. the redaction - the internal reference prices come out of the catalogue
  3. the chain     - two build steps that only make sense inside the company
  4. the documents - the README describes what the copy actually contains
  5. the checks    - nothing internal left, and the four documents in place

The copy is regenerated from the company's repository every time, so it can
be rebuilt after any change.
"""

import argparse
import io
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
TARGET = None  # the directory to write the published copy into
BT = chr(96)
NL = chr(10)

PUBLISHED_DOCS = {
    "docs/买家评价接入流程.md",
    "docs/欧美市场认证清单-2026-11-13.md",
    "docs/AI服务合规-2026-11-06.md",
    "docs/设计系统-颜色与可读性.md",
}

PATH_RULES = [
    ("the ledger", lambda p: p == "HEALTH-CHECK.md"),
    ("the working documents",
     lambda p: p.startswith("docs/") and p not in PUBLISHED_DOCS),
    ("the API service and the internal console",
     lambda p: p.startswith("server/") or p.startswith("server-pg/")),
    ("the archives", lambda p: p.lower().endswith(
        (".tar.gz", ".tgz", ".zip", ".7z", ".rar"))),
    ("the internal console pages", lambda p: p.startswith("app/(console)/")),
    ("the internal dashboards and the live snapshot",
     lambda p: p in ("content/systems.json", "content/_livejsonld.json")),
    ("the provenance ledger", lambda p: p == "PROVENANCE.md"),
    ("the legacy price catalogue", lambda p: p.startswith("legacy/")),
    ("parked and backed-up work",
     lambda p: p.startswith("_backup-handwritten/")
     or p.startswith("i18n-routes-parked/")),
    ("the operating leftovers",
     lambda p: p in ("DEPLOY.md", "build.log", "_tmp-ai-refs.txt", "_tmp-latest.txt",
                     "layer1-seo-audit.csv", "SEO-DIFF-REPORT.json",
                     "scripts/shenhe-ai-refs", "scripts/.contract-last-run")),
    ("the scripts that carry the legacy price list",
     lambda p: p in ("scripts/_remove_legacy_prices.py",
                     "scripts/audit_kb_coverage.py")),
]

SHAPE_RULES = [
    ("talks to the internal console", re.compile(r"/api/(?:console|admin)")),
    ("carries a personal address",
     re.compile(r"\b[A-Za-z0-9._%+-]+@(?:gmail|qq|163|126)\.com\b", re.I)),
    ("names the production .env", re.compile(r"shenhe-api/\.env")),
]

TEXT_SUFFIXES = (".py", ".mjs", ".js", ".ts", ".tsx", ".cjs", ".json", ".md",
                 ".sh", ".txt", ".sql", ".css", ".html", ".csv", ".yml", ".yaml")

PRICE_SENTENCE = re.compile(r"\s*Pricing:\s*B2B\s+EXW\s+RMB\s+[\d.]+\s+per\s+[^.]*\.")
PRICE_CLAIM = re.compile(r"Reference EXW RMB [\d.]+/")
AMOUNT = re.compile(r"(?:US\$|USD|RMB|\$)\s*\d[\d,]*(?:\.\d+)?\s*[MK]?")

ALLOWED = {
    "USD30,000", "$30,000", "USD100,000", "USD5,000,000", "USD500", "USD30",
    "USD1,000,000", "USD1M", "USD2M", "USD5M", "USD200", "RMB25500", "35%", "65%",
}

LOCAL_PATH = re.compile(r"[A-Za-z]:\\\\?Users\\\\?[^\"'\\n]*")
LOCAL_PATH = re.compile(r"[A-Za-z]:[\\/]{1,2}Users[\\/]{1,2}[^\"'\\n]*")

BUILD_CHAIN_STEPS = (
    "python scripts/normalize_public_email.py",
    "python scripts/check_ledger_encoding.py",
)


def git(*args):
    p = subprocess.run(["git", "-c", "core.quotePath=false"] + list(args),
                       cwd=REPO, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return p.stdout


def read(path, root=REPO):
    try:
        with io.open(os.path.join(root, path.replace("/", os.sep)),
                     encoding="utf-8", newline="") as f:
            return f.read()
    except OSError:
        return None


def write(path, text, root=None):
    root = root or TARGET
    full = os.path.join(root, path.replace("/", os.sep))
    with io.open(full, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def build_chain():
    pkg = json.loads(read("package.json"))
    parts = [p.strip() for p in pkg["scripts"]["build"].split("&&")]
    scripts = set()
    for p in parts:
        m = re.search(r"(scripts/[A-Za-z0-9_.-]+)", p)
        if m:
            scripts.add(m.group(1))
    return parts, scripts


def main():
    global TARGET
    parser = argparse.ArgumentParser(
        description="build the published copy of the site")
    parser.add_argument("--target", required=True,
                        help="the directory to write the published copy into")
    args = parser.parse_args()
    TARGET = os.path.abspath(args.target)
    if TARGET == REPO or TARGET.startswith(REPO + os.sep):
        raise SystemExit(
            "the published copy may not be written inside the repository it is made from")
    print("=== the target ===")
    print("   %s" % TARGET)

    parts, chain_scripts = build_chain()

    files = [p for p in git("ls-files").split(NL) if p.strip()]
    remove, keep = {}, []
    for p in files:
        why = None
        for label, rule in PATH_RULES:
            if rule(p):
                why = label
                break
        if why is None and p.startswith("scripts/"):
            s = read(p)
            if s and LOCAL_PATH.search(s) and p not in chain_scripts:
                why = "a one-off script bound to one machine"
        if why is None and p.lower().endswith(TEXT_SUFFIXES):
            s = read(p)
            if s is not None:
                for label, rx in SHAPE_RULES:
                    if rx.search(s):
                        why = label
                        break
        if why:
            remove[p] = why
        else:
            keep.append(p)

    print("=== the copy ===")
    print("   tracked in the source : %d" % len(files))
    print("   published              : %d" % len(keep))
    print("   left out               : %d" % len(remove))
    reasons = {}
    for why in remove.values():
        reasons[why] = reasons.get(why, 0) + 1
    for why in sorted(reasons):
        print("      %-46s %4d" % (why, reasons[why]))

    if os.path.isdir(TARGET):
        for e in os.listdir(TARGET):
            if e == ".git":
                continue
            full = os.path.join(TARGET, e)
            if os.path.isdir(full):
                try:
                    # a junction goes here: RemoveDirectory on a reparse
                    # point removes the link and nothing behind it
                    os.rmdir(full)
                    continue
                except OSError:
                    pass
                shutil.rmtree(full)
            else:
                os.remove(full)
    os.makedirs(TARGET, exist_ok=True)
    total = 0
    for p in keep:
        src = os.path.join(REPO, p.replace("/", os.sep))
        dst = os.path.join(TARGET, p.replace("/", os.sep))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        total += os.path.getsize(dst)
    print("   copied %d files, %.1f MB" % (len(keep), total / 1048576.0))

    print()
    print("=== the redaction ===")
    path = "lib/products.json"
    raw = read(path, TARGET)
    data = json.loads(raw)
    if json.dumps(data, ensure_ascii=False, indent=2) + NL != raw:
        raise SystemExit("products.json does not round trip")
    fields = claims = 0
    for sku in data.get("products", []):
        for key in ("b2b_price_rmb", "b2b_price_currency"):
            if key in sku:
                del sku[key]
                fields += 1
        c = sku.get("claims")
        if isinstance(c, list):
            kc = [x for x in c if not PRICE_CLAIM.search(str(x))]
            claims += len(c) - len(kc)
            sku["claims"] = kc
        d = sku.get("description")
        if isinstance(d, str):
            sku["description"] = PRICE_SENTENCE.sub("", d).strip()
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + NL)
    print("   lib/products.json: %d price fields and %d price claims out" % (fields, claims))

    p = "lib/products.ts"
    raw = read(p, TARGET)
    out = raw.replace("  b2b_price_rmb: number;", "  b2b_price_rmb?: number;")
    out = out.replace("  b2b_price_currency: string;", "  b2b_price_currency?: string;")
    write(p, out)
    print("   lib/products.ts: the price fields are optional now")

    for p in ("content/v2/home.ts", "content/v2/product.ts", "lib/seo/brand.ts"):
        raw = read(p, TARGET)
        if raw is None:
            continue
        out = re.sub(r"EXW RMB [\d.]+", "EXW RMB <amount>", raw)
        if out != raw:
            write(p, out)
            print("   %s: the example figure is generalised" % p)

    for p in ("lib/i18n/translations-de.json", "lib/i18n/translations-es.json",
              "lib/i18n/translations-fr.json", "lib/i18n/translations-it.json",
              "lib/i18n/translations-nl.json", "lib/i18n/translations-ja.json",
              "lib/i18n/translations-pt.json"):
        raw = read(p, TARGET)
        if raw is None:
            continue
        d = json.loads(raw)
        if not isinstance(d, dict):
            continue
        hits = [k for k in d if "EXW RMB" in str(k) or "EXW RMB" in str(d[k])]
        if not hits:
            continue
        for k in hits:
            del d[k]
        write(p, json.dumps(d, ensure_ascii=False, indent=2, sort_keys=True) + NL)
        print("   %s: %d price entry(ies) out" % (p, len(hits)))

    # the two comments that quote a build machine's home directory
    for p in ("scripts/check_published_numbers.py", "scripts/gen-ai-entity.mjs"):
        raw = read(p, TARGET)
        if raw is None:
            continue
        out = LOCAL_PATH.sub("<the build directory>", raw)
        if out != raw:
            write(p, out)
            print("   %s: the build path in the comment is generalised" % p)

    print()
    print("=== the build chain ===")
    pkg = json.loads(read("package.json", TARGET))
    kept = [p for p in parts if p not in BUILD_CHAIN_STEPS]
    pkg["scripts"]["build"] = " && ".join(kept)
    write("package.json", json.dumps(pkg, ensure_ascii=False, indent=2) + NL)
    print("   dropped %d step(s): %s" % (len(parts) - len(kept),
                                         ", ".join(BUILD_CHAIN_STEPS)))

    p = ".gitignore"
    raw = read(p, TARGET) or ""
    need = [x for x in ("node_modules/", ".next/", "out/") if x not in raw]
    if need:
        write(p, raw.rstrip(NL) + NL + NL.join(need) + NL)
        print("   .gitignore: added %s" % ", ".join(need))

    print()
    print("=== the documents ===")
    docs = os.path.join(HERE, "write_publishing_docs.py")
    p = subprocess.run([sys.executable, docs, "--target", TARGET],
                       capture_output=True, text=True, encoding="utf-8",
                       errors="replace")
    print((p.stdout or "").strip() or "   (no output)")
    if p.returncode != 0:
        print((p.stderr or "").strip())
        raise SystemExit("the documents could not be written")

    print()
    print("=== checks ===")
    leaked, amounts = [], {}
    for base, dirs, names in os.walk(TARGET):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", ".next", "out")]
        for n in names:
            full = os.path.join(base, n)
            rel = os.path.relpath(full, TARGET).replace(os.sep, "/")
            if rel.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".pdf",
                                     ".ico", ".woff", ".woff2", ".ttf", ".mp4")):
                continue
            try:
                with io.open(full, encoding="utf-8", errors="replace") as f:
                    s = f.read()
            except OSError:
                continue
            for label, rx in SHAPE_RULES:
                m = rx.search(s)
                if m:
                    leaked.append((rel, label, m.group(0)))
            for m in AMOUNT.finditer(s):
                a = re.sub(r"\s+", "", m.group(0))
                if a not in ALLOWED:
                    amounts.setdefault(a, []).append(rel)
    print("   internal console / personal address / .env path : %s"
          % ("none" if not leaked else leaked[:5]))
    print("   currency amounts outside the payment terms     : %s"
          % ("none" if not amounts else
             {a: sorted(set(v))[:3] for a, v in sorted(amounts.items())}))
    survived = [p for p in remove if os.path.exists(
        os.path.join(TARGET, p.replace("/", os.sep)))]
    print("   removed paths still present                     : %s"
          % (survived if survived else "none"))
    local = []
    for base, dirs, names in os.walk(TARGET):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", ".next", "out")]
        for n in names:
            full = os.path.join(base, n)
            rel = os.path.relpath(full, TARGET).replace(os.sep, "/")
            if rel.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".pdf",
                                     ".ico", ".woff", ".woff2", ".ttf", ".mp4")):
                continue
            try:
                with io.open(full, encoding="utf-8", errors="replace") as f:
                    s = f.read()
            except OSError:
                continue
            if LOCAL_PATH.search(s):
                local.append(rel)
    print("   local paths left in the copy                   : %s"
          % (local if local else "none"))

    # The two lists go into the copy, not next to this script: a script
    # that writes its working files into the repository it was run from is a
    # script that leaves litter behind.
    with io.open(os.path.join(TARGET, "publish-manifest.txt"),
                 "w", encoding="utf-8", newline=NL) as f:
        f.write("# what this published copy carries" + NL)
        for p in keep:
            f.write(p + NL)
    with io.open(os.path.join(TARGET, "publish-excluded.txt"),
                 "w", encoding="utf-8", newline=NL) as f:
        f.write("# what was left out, and why" + NL)
        for p in sorted(remove):
            f.write("%s\t%s" % (p, remove[p]) + NL)


if __name__ == "__main__":
    main()

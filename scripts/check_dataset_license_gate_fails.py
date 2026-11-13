#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the dataset-license gate can fail.

The gate is there because Google's rich result test named the missing
field on 2026-11-08: "未填写字段 license" on /attestation.html. A gate
that has never been seen to fail is a gate whose failure nobody has
seen.

So this takes the license off a Dataset in the BUILT site - the same way
the field went missing the first time - and the gate has to go red on it.
Then the file goes back exactly as it was, and the gate has to be green
again.

The file is restored in a `finally` block and the bytes are compared
afterwards, so the build output is back exactly as it was whether the
check passes, fails or throws.
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
GATE = os.path.join(ROOT, "scripts", "check_dataset_license.py")

JSONLD = re.compile(
    r'(<script[^>]+type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
    re.S | re.I,
)


def read_bytes(path):
    with io.open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    with io.open(path, "wb") as f:
        f.write(data)


def run_gate():
    p = subprocess.run(
        [sys.executable, GATE], cwd=ROOT, capture_output=True, text=True, timeout=600,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def nodes_of(data):
    """Every node in a JSON-LD document, including the ones inside @graph.

    The attestation index puts its nodes in a @graph, so a reader that
    only looks at the top level finds nothing - which is how the first
    version of this proof failed: it said the license could not be
    taken off, on a page that has one.
    """
    out = []
    if isinstance(data, list):
        for item in data:
            out.extend(nodes_of(item))
        return out
    if not isinstance(data, dict):
        return out
    out.append(data)
    graph = data.get("@graph")
    if isinstance(graph, list):
        for item in graph:
            out.extend(nodes_of(item))
    return out


def strip_license(html):
    """Take the license off the first Dataset in the page, and say so."""
    for m in JSONLD.finditer(html):
        raw = m.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        nodes = nodes_of(data)
        hit = False
        for node in nodes:
            if node.get("@type") == "Dataset" and "license" in node:
                del node["license"]
                hit = True
        if not hit:
            continue
        new_raw = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
        return html[: m.start(2)] + new_raw + html[m.end(2):]
    return None


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    target = None
    for base, dirs, names in os.walk(OUT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in names:
            if name.endswith(".html"):
                path = os.path.join(base, name)
                try:
                    html = io.open(path, "r", encoding="utf-8", errors="replace").read()
                except Exception:
                    continue
                if '"@type": "Dataset"' in html or '"@type":"Dataset"' in html:
                    target = path
                    break
        if target:
            break

    if not target:
        print("FAIL  no page with a Dataset was found in the build")
        return 1

    rel = os.path.relpath(target, ROOT).replace("\\", "/")
    original = read_bytes(target)
    before = hashlib.sha256(original).hexdigest()
    html = original.decode("utf-8", errors="replace")
    patched = strip_license(html)
    if patched is None:
        print("FAIL  the license could not be taken off %s" % rel)
        return 1

    try:
        write_bytes(target, patched.encode("utf-8"))
        code, out = run_gate()
        if code == 0:
            print("THE GATE PASSED - it did not notice the missing license")
            return 1
        if "has no license" not in out:
            print("THE GATE WENT RED, but not for the license check:")
            for line in out.splitlines()[-12:]:
                print("   " + line.strip()[:170])
            return 1
        print("THE GATE CAUGHT IT:")
        for line in out.splitlines():
            if "has no license" in line:
                print("   " + line.strip()[:170])
    finally:
        write_bytes(target, original)
        after = hashlib.sha256(read_bytes(target)).hexdigest()
        print("  (the file is restored: %s)" % ("the same bytes" if after == before else "NOT THE SAME BYTES"))
        if after != before:
            return 1

    code, out = run_gate()
    if code != 0:
        print("THE GATE IS RED ON THE RESTORED FILE:")
        print(out[-1500:])
        return 1
    print("  and it is green again on the restored file")
    print()
    print("THE GATE CAN FAIL: a dataset without a license is caught, and the page it names has to exist.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

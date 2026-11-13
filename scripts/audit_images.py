"""Every image the built pages reference must exist in the export.

WHY: the catalogue card renders a <picture> with a .webp source and a .png
fallback. A browser that matches the <source> does NOT fall back to the <img>
when the .webp 404s — it shows a broken image. That is how a freshly cropped
photograph took the product row down with it.

This walks every built page, collects every src / srcset / href that points at
a local file, and reports the ones that are not there.

Run: python scripts/audit_images.py
"""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")

SRC = re.compile(r'(?:src|srcset|href|data-src)\s*=\s*"([^"]+)"', re.I)

SKIP_PREFIX = ("http://", "https://", "//", "data:", "mailto:", "tel:", "#")


def main() -> int:
    missing: dict[str, set[str]] = {}
    checked = 0
    for base, _dirs, files in os.walk(OUT):
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(base, f)
            rel = "/" + os.path.relpath(p, OUT).replace("\\", "/")
            raw = open(p, encoding="utf-8", errors="replace").read()
            for value in SRC.findall(raw):
                for part in value.split(","):
                    url = part.strip().split(" ")[0]
                    if not url or url.startswith(SKIP_PREFIX):
                        continue
                    path = url.split("?")[0].split("#")[0]
                    if not path or "." not in path.rsplit("/", 1)[-1]:
                        continue  # a route, not a file
                    checked += 1
                    target = os.path.join(OUT, path.lstrip("/"))
                    if not os.path.isfile(target):
                        missing.setdefault(path, set()).add(rel)

    print(f"{checked} local file references checked across the export")
    if not missing:
        print("no missing files")
        return 0
    print(f"\n{len(missing)} MISSING:")
    for path in sorted(missing):
        pages = sorted(missing[path])
        print(f"   {path}   (referenced by {len(pages)} page(s))")
        for pg in pages[:4]:
            print(f"        {pg}")
        if len(pages) > 4:
            print(f"        ... and {len(pages) - 4} more")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

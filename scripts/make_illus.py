"""Generate the technical-illustration SVG for a SKU.

WHY
Three SKUs have a photograph whose bottle says a DIFFERENT size from the
catalogue record:

    P005  Pet Ear Cleansing Solution     record 100 mL   photo 60 ml
    P006  Probiotic Pet Dental Water     record 150 mL   photo 300 ml
    P009  Pet Deodorizing Spray Gun Kit  record 220 mL x 2 + gun   photo 200 ml x 1

A picture that contradicts the page is the one thing a procurement lead cannot
ignore — it is not a style opinion, it is a wrong specification on a product
page. The legacy site carried the same mismatch (its titles said 250 ml and
300 ml), so it is old, not new; PROVENANCE.md lists it as "same product, a
different size" and still needs the customer's answer.

Until that answer comes, the page shows a DRAWING derived from the record —
the right size, the right minimum order, labelled as an illustration — instead
of a bottle that says something else. This script writes that drawing.

The drawing is deliberately plain: a silhouette, the size, the minimum order,
a dimension line, and a strip that says what it is.

Run: python scripts/make_illus.py P005 P006 P009
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = json.load(open(os.path.join(ROOT, "lib", "products.json"), encoding="utf-8"))
BY_ID = {p["id"]: p for p in CAT["products"]}

OUT_DIR = os.path.join(ROOT, "public", "assets", "img", "products", "illus")

# The line colour, matching the packaging palette.
LINE = {
    "disinfection_odor_control": ("#d7f0ec", "#0f766e", "#134e4a"),
    "cleansing_grooming": ("#dbe9f3", "#2f6690", "#1d4258"),
    "outdoor_protection": ("#f3e6d5", "#8a5a2b", "#5c3a1a"),
}


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build(p: dict) -> str:
    soft, band, deep = LINE.get(p["category"], LINE["disinfection_odor_control"])
    spec = p["specification"].replace(" / bottle", "").replace(" / pack", "").replace(" / sachet", "")
    size_line = spec if len(spec) <= 16 else spec[:15] + "…"
    moq = f"{p['moq']:,} {p['moq_unit']}"
    name = p["name_en"]

    W, H = 600, 750
    cx = 300
    body_top, body_h, body_w = 130, 230, 230
    base_y = body_top + body_h
    label_top, label_h = body_top + 58, 99

    parts: list[str] = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
        f'role="img" aria-label="{esc(name)} {esc(spec)} — technical illustration, not a photograph">'
    )
    # ground shadow
    parts.append(f'<ellipse cx="{cx}" cy="{base_y + 8}" rx="{body_w * 0.72:.1f}" ry="14" fill="#0b0f12" opacity="0.07"/>')

    if "gun" in spec.lower() or "spray gun" in p["name_en"].lower():
        # a bottle AND the trigger sprayer that makes it a kit
        parts.append(
            f'<rect x="{cx - 170}" y="{body_top + 40}" width="150" height="190" rx="16" '
            f'fill="{soft}" stroke="{band}" stroke-width="3"/>'
        )
        parts.append(
            f'<rect x="{cx - 132}" y="{body_top}" width="74" height="52" rx="8" fill="{deep}"/>'
        )
        parts.append(
            f'<rect x="{cx - 152}" y="{body_top + 14}" width="114" height="26" rx="10" fill="{band}"/>'
        )
        parts.append(
            f'<path d="M{cx + 18} {body_top + 30} h86 v34 h-44 l-30 44" fill="none" '
            f'stroke="{deep}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>'
        )
        parts.append(
            f'<rect x="{cx - 4}" y="{body_top + 26}" width="40" height="70" rx="8" fill="{deep}"/>'
        )
    else:
        # cap + body
        parts.append(f'<rect x="{cx - 16}" y="50" width="32" height="80" rx="6" fill="{deep}"/>')
        parts.append(f'<rect x="{cx - 26}" y="58" width="52" height="30" rx="6" fill="{deep}"/>')
        parts.append(
            f'<rect x="{cx - body_w / 2}" y="{body_top}" width="{body_w}" height="{body_h}" rx="18" '
            f'fill="{soft}" stroke="{band}" stroke-width="3"/>'
        )

    # label
    parts.append(
        f'<rect x="{cx - body_w / 2 + 4}" y="{label_top}" width="{body_w - 8}" height="{label_h}" '
        f'rx="8" fill="#ffffff" opacity="0.94"/>'
    )
    parts.append(
        f'<text x="{cx}" y="{label_top + 39}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" '
        f'font-size="23" font-weight="700" fill="{band}">{esc(size_line)}</text>'
    )
    parts.append(
        f'<text x="{cx}" y="{label_top + 71}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" '
        f'font-size="19" fill="{band}">MOQ {esc(moq)}</text>'
    )
    # dimension line with the size
    parts.append(
        f'<line x1="40" y1="{base_y - 14}" x2="40" y2="{body_top}" stroke="{band}" stroke-width="2" opacity="0.5"/>'
    )
    parts.append(
        f'<text x="50" y="{body_top + 4}" font-family="Helvetica,Arial,sans-serif" font-size="18" '
        f'fill="{band}">{esc(spec.split(" ")[0])}</text>'
    )
    # honesty strip
    parts.append(f'<rect x="0" y="708" width="600" height="42" fill="{deep}" opacity="0.92"/>')
    parts.append(
        f'<text x="300" y="735" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" '
        f'font-size="18" letter-spacing="3" fill="#ffffff">TECHNICAL ILLUSTRATION — NOT A PHOTOGRAPH</text>'
    )
    parts.append("</svg>")
    return "".join(parts)


def main() -> int:
    ids = sys.argv[1:] or ["P005", "P006", "P009"]
    os.makedirs(OUT_DIR, exist_ok=True)
    for pid in ids:
        p = BY_ID.get(pid)
        if not p:
            print(f"!! {pid} not in the catalogue")
            continue
        svg = build(p)
        path = os.path.join(OUT_DIR, f"{pid.lower()}-illus.svg")
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(svg)
        print(f"wrote {path}  ({len(svg)} bytes)  {p['name_en']} {p['specification']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

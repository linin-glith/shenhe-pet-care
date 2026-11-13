#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prove the three new gates can fail - one rule at a time.

A gate that cannot go red is a gate that cannot say anything. This puts
each defect the gates are there to catch back into the built site, checks
that the gate goes red FOR THAT REASON, puts the site back exactly as it
was, and checks that the gate is green again.

THE DEFECTS

check_faq_schema.py
  1. a question the schema names and the page does not show;
  2. a page that shows questions and publishes no FAQPage at all;
  3. two FAQPage blocks on one page.

check_semantic_structure.py
  4. a page with no page node;
  5. two organisations for this company on one page;
  6. an organisation with no credentials;
  7. an organisation that claims the certificate of a related company;
  8. an organisation that claims an award it does not hold;
  9. a speakable selector that matches nothing;
  10. a credential number the certifications page does not print.

check_page_weight.py
  11. markup over the ceiling on one page;
  12. a page over the ceiling.

The files are restored in a `finally` block and the bytes are compared
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

FAQ_GATE = os.path.join(ROOT, "scripts", "check_faq_schema.py")
SEM_GATE = os.path.join(ROOT, "scripts", "check_semantic_structure.py")
WEIGHT_GATE = os.path.join(ROOT, "scripts", "check_page_weight.py")
JOURNEY_GATE = os.path.join(ROOT, "scripts", "check_journey_pages.py")

SCRIPT = re.compile(
    r'(<script[^>]+type="application/ld\+json"[^>]*>)(.*?)(</script>)', re.S | re.I
)
ANY_SCRIPT = re.compile(r"<script\b.*?</script>", re.S | re.I)

PRODUCT_PAGE = os.path.join(OUT, "products", "pet-shampoo-antibacterial-500.html")
HOME_PAGE = os.path.join(OUT, "index.html")
CERTS_PAGE = os.path.join(OUT, "certifications.html")


def read_bytes(path):
    with io.open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    with io.open(path, "wb") as f:
        f.write(data)


def run_gate(gate):
    p = subprocess.run(
        [sys.executable, gate], cwd=ROOT, capture_output=True, text=True, timeout=900,
        encoding="utf-8", errors="replace",
    )
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def blocks(html):
    """The JSON-LD blocks of a page, as (match, parsed) pairs."""
    out = []
    for m in SCRIPT.finditer(html):
        raw = m.group(2).strip()
        try:
            out.append((m, json.loads(raw)))
        except Exception:
            continue
    return out


def nodes(data):
    """Every node in a block, however deep."""
    out = []
    if isinstance(data, list):
        for x in data:
            out.extend(nodes(x))
    elif isinstance(data, dict):
        out.append(data)
        g = data.get("@graph")
        if isinstance(g, list):
            for x in g:
                out.extend(nodes(x))
    return out


def find_node(data, type_name):
    for n in nodes(data):
        t = n.get("@type")
        types = t if isinstance(t, list) else [t]
        if type_name in [str(x) for x in types]:
            return n
    return None


def rewrite(html, match, data):
    raw = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
    return html[: match.start(2)] + raw + html[match.end(2) :]


# ---------------------------------------------------------------- the defects


def m_schema_question_not_on_page(html):
    for match, data in blocks(html):
        faq = find_node(data, "FAQPage")
        if not faq:
            continue
        faq = dict(faq)
        faq["mainEntity"] = list(faq.get("mainEntity", [])) + [
            {
                "@type": "Question",
                "name": "A question the page does not answer?",
                "acceptedAnswer": {"@type": "Answer", "text": "No."},
            }
        ]
        if isinstance(data, dict) and "@graph" in data:
            data = json.loads(json.dumps(data))
            for n in nodes(data):
                if n.get("@type") == "FAQPage":
                    n.update(faq)
        else:
            data = faq
        return rewrite(html, match, data)
    return None


def m_no_faqpage_at_all(html):
    for match, data in blocks(html):
        if isinstance(data, dict) and data.get("@type") == "FAQPage":
            return html[: match.start()] + html[match.end() :]
        if isinstance(data, dict) and isinstance(data.get("@graph"), list):
            if find_node(data, "FAQPage"):
                data = json.loads(json.dumps(data))
                data["@graph"] = [
                    n for n in data["@graph"]
                    if not (isinstance(n, dict) and n.get("@type") == "FAQPage")
                ]
                if not data["@graph"]:
                    return html[: match.start()] + html[match.end() :]
                return rewrite(html, match, data)
    return None


def m_two_faqpages(html):
    """Put the FAQPage block on the page a second time."""
    for match, data in blocks(html):
        if find_node(data, "FAQPage"):
            return html[: match.end()] + match.group(0) + html[match.end() :]
    return None


def patch_node(html, type_name, mutate):
    """Mutate the first node of a type, wherever it sits in the block."""
    for match, data in blocks(html):
        target = find_node(data, type_name)
        if not target:
            continue
        data = json.loads(json.dumps(data))
        target = find_node(data, type_name)
        mutate(target)
        return rewrite(html, match, data)
    return None


def m_no_page_node(html):
    for match, data in blocks(html):
        if isinstance(data, dict) and data.get("@type") == "FAQPage":
            continue
        if find_node(data, "WebPage"):
            if isinstance(data, dict) and isinstance(data.get("@graph"), list):
                data = json.loads(json.dumps(data))
                data["@graph"] = [
                    n for n in data["@graph"]
                    if not (isinstance(n, dict) and n.get("@type") == "WebPage")
                ]
                if not data["@graph"]:
                    return html[: match.start()] + html[match.end() :]
                return rewrite(html, match, data)
            return html[: match.start()] + html[match.end() :]
    return None


def m_two_organisations(html):
    for match, data in blocks(html):
        org = find_node(data, "Organization")
        if org and org.get("@id", "").endswith("/#organization"):
            extra = dict(org)
            extra.pop("@id", None)
            if isinstance(data, dict) and isinstance(data.get("@graph"), list):
                data = json.loads(json.dumps(data))
                data["@graph"].append(extra)
                return rewrite(html, match, data)
            return html[: match.end()] + (
                '<script type="application/ld+json">'
                + json.dumps(extra, ensure_ascii=False).replace("<", "\\u003c")
                + "</script>"
            ) + html[match.end() :]
    return None


def m_no_credentials(html):
    def drop(node):
        node.pop("hasCredential", None)

    return patch_node(html, "Organization", drop) if _has_our_org(html) else None


def _has_our_org(html):
    for _, data in blocks(html):
        org = find_node(data, "Organization")
        if org and org.get("@id", "").endswith("/#organization"):
            return True
    return False


def m_claims_the_related_certificate(html):
    def add(node):
        creds = list(node.get("hasCredential") or [])
        creds.append(
            {
                "@type": "EducationalOccupationalCredential",
                "name": "High-tech enterprise certificate",
                "identifier": "GR202544200988",
            }
        )
        node["hasCredential"] = creds

    return patch_node(html, "Organization", add) if _has_our_org(html) else None


def m_claims_an_award(html):
    def add(node):
        node["award"] = "An award nobody has checked"

    return patch_node(html, "Organization", add) if _has_our_org(html) else None


def m_broken_speakable_selector(html):
    def break_it(node):
        sp = node.get("speakable")
        if isinstance(sp, dict):
            sp["cssSelector"] = [".a-class-that-is-not-on-this-page"]

    return patch_node(html, "WebPage", break_it)


def m_credential_number_not_printed(html):
    """
    Take the licence number out of the page the buyer reads it on.

    Only the VISIBLE text is changed. The number also lives in the
    markup on that page — in the organisation's credential list — and
    removing it there as well would mean the site no longer claimed the
    credential, which is a different defect. This one is about the
    reader: the number has to be printed on the page.
    """
    parts = []
    last = 0
    for m in SCRIPT.finditer(html):
        parts.append(html[last : m.start()])
        parts.append(m.group(0))
        last = m.end()
    parts.append(html[last:])
    out = []
    changed = False
    for i, part in enumerate(parts):
        if i % 2 == 1:
            out.append(part)
            continue
        new = part
        for ident in ("粤卫消证字[2023]-07-第0002号", "粤饲添(2023)H07002"):
            if ident in new:
                new = new.replace(ident, "（编号已移除）")
                changed = True
        out.append(new)
    return "".join(out) if changed else None


def m_markup_over_the_ceiling(html):
    big = {
        "@context": "https://schema.org",
        "@type": "Thing",
        "description": "x" * 50000,
    }
    return html + (
        '<script type="application/ld+json">'
        + json.dumps(big, ensure_ascii=False).replace("<", "\\u003c")
        + "</script>"
    )


def m_page_over_the_ceiling(html):
    return html + ("<!-- " + "x" * 420000 + " -->")


def m_h1_is_not_a_question(html):
    """Turn the buyer's question on a journey page into a title."""
    for m in re.finditer(r"<h1[^>]*>(.*?)</h1>", html, re.S):
        inner = m.group(1)
        if "?" not in inner:
            continue
        stripped = inner.replace("?", "")
        return html[: m.start(1)] + stripped + html[m.end(1) :]
    return None


def m_a_price_on_a_journey_page(html):
    """Put a unit price on a stage page — the thing the site does not publish."""
    return html.replace("<main", "<main><p>EXW USD 8.50 per bottle for 2,000 bottles.</p>", 1)


JOURNEY_PAGE = os.path.join(OUT, "quotation.html")


CASES = [
    ("check_faq_schema.py", FAQ_GATE, PRODUCT_PAGE, m_schema_question_not_on_page,
     "the page does not show"),
    ("check_faq_schema.py", FAQ_GATE, PRODUCT_PAGE, m_no_faqpage_at_all,
     "the markup does not say so"),
    ("check_faq_schema.py", FAQ_GATE, PRODUCT_PAGE, m_two_faqpages,
     "FAQPage blocks on one page"),
    ("check_semantic_structure.py", SEM_GATE, HOME_PAGE, m_no_page_node,
     "no page node"),
    ("check_semantic_structure.py", SEM_GATE, HOME_PAGE, m_two_organisations,
     "declare this company"),
    ("check_semantic_structure.py", SEM_GATE, HOME_PAGE, m_no_credentials,
     "carries no hasCredential"),
    ("check_semantic_structure.py", SEM_GATE, HOME_PAGE, m_claims_the_related_certificate,
     "without naming the entity"),
    ("check_semantic_structure.py", SEM_GATE, HOME_PAGE, m_claims_an_award,
     "claims an award"),
    ("check_semantic_structure.py", SEM_GATE, PRODUCT_PAGE, m_broken_speakable_selector,
     "matches nothing on the page"),
    ("check_semantic_structure.py", SEM_GATE, CERTS_PAGE, m_credential_number_not_printed,
     "does not print that number"),
    ("check_page_weight.py", WEIGHT_GATE, HOME_PAGE, m_markup_over_the_ceiling,
     "over the"),
    ("check_page_weight.py", WEIGHT_GATE, HOME_PAGE, m_page_over_the_ceiling,
     "over the"),
    ("check_journey_pages.py", JOURNEY_GATE, JOURNEY_PAGE, m_h1_is_not_a_question,
     "is not a question"),
    ("check_journey_pages.py", JOURNEY_GATE, JOURNEY_PAGE, m_a_price_on_a_journey_page,
     "is a currency amount"),
]


def main():
    if not os.path.isdir(OUT):
        print("FAIL  out/ is not there - build the site first")
        return 1

    failures = []
    seen_gates = set()

    for gate_name, gate, target, mutate, expect in CASES:
        if not os.path.exists(target):
            failures.append("%s: %s is not there" % (gate_name, target))
            continue
        original = read_bytes(target)
        before = hashlib.sha256(original).hexdigest()
        label = mutate.__name__.replace("m_", "").replace("_", " ")
        try:
            patched = mutate(original.decode("utf-8", errors="replace"))
            if patched is None:
                failures.append("%s: %s — the defect could not be injected" % (gate_name, label))
                continue
            write_bytes(target, patched.encode("utf-8"))
            code, out = run_gate(gate)
            if code == 0:
                failures.append("%s: %s — the gate PASSED, it did not notice" % (gate_name, label))
                continue
            if expect not in out:
                failures.append(
                    "%s: %s — the gate went red, but not for that reason (wanted %r)"
                    % (gate_name, label, expect)
                )
                continue
            seen_gates.add(gate_name)
            print("THE GATE CAUGHT IT: %s — %s" % (gate_name, label))
            for line in out.splitlines():
                if expect in line:
                    print("   " + line.strip()[:170])
        finally:
            write_bytes(target, original)
            after = hashlib.sha256(read_bytes(target)).hexdigest()
            if after != before:
                failures.append("%s: %s — the file came back changed" % (gate_name, label))

    print()
    print("=== and the gates are green again on the restored site ===")
    for gate_name, gate, _, _, _ in CASES:
        if gate_name in seen_gates:
            code, out = run_gate(gate)
            if code != 0:
                failures.append("%s: the gate is red on the restored site" % gate_name)
                print("%s: THE GATE IS RED ON THE RESTORED SITE" % gate_name)
                print(out[-1200:])
            else:
                print("%s: green" % gate_name)

    print()
    if failures:
        print("THE GATES DID NOT HOLD:")
        for f in failures:
            print("   " + f)
        return 1

    print("THE GATES CAN FAIL: every rule they hold, one defect at a time, and the site "
          "comes back the way it was.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

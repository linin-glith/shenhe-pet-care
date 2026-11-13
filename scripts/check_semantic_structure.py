#!/usr/bin/env python3
"""
THE SEMANTIC STRUCTURE GATE.

The site publishes a graph on every public page: the company, the website,
the brand, and — now — a page node for the page itself. This gate is what
keeps that true, and it checks the things a graph can be wrong about.

THE RULES

  1. EVERY PUBLIC PAGE SAYS WHAT PAGE IT IS.
     A page with no page node carries no `about`, no `isPartOf`, no
     `datePublished`, no `dateModified` and no `inLanguage`. Before this
     gate, eighty-four of the ninety-nine pages had none: the captured
     legacy heads carried a company and a product and nothing else. The
     report pages are the same story — they are written by a script rather
     than by a page component, so they never went through the layout that
     publishes the graph.

  2. THE COMPANY IS DECLARED ONCE, AND COMPLETELY.
     Two organisation nodes for one company on one page is two companies
     with the same name. The captured heads carried a thin one; the live
     one carries the address, the mark, the contact point and the
     credentials. Only the live one may remain.

  3. THE COMPANY'S CREDENTIALS ARE ON THE PAGE.
     A buyer asking "can this factory be trusted with my market" needs a
     document number to check. The credentials are the documents this
     company holds — and the high-tech enterprise certificate, which is
     issued to another entity of the same Shenhe group, IS claimed, because
     the owner confirmed on 2026-11-12 that it is ours as a group. What the
     gate holds is that the claim NAMES the holder: the scan names another
     legal entity, and a buyer who reads the scan has to be able to
     reconcile the markup with it.

  4. EVERY `speakable` SELECTOR RESOLVES.
     `speakable` points at the part of the page an assistant should read
     out. A selector that matches nothing says the page has a spoken
     summary and does not. The gate parses the page and checks.

  5. NO AWARD WE DO NOT HOLD.
     This company holds no award in its own name. A claimed award is a
     false E-E-A-T signal, and a false signal is worse than a missing one.

  6. `reviewedBy` NAMES SOMETHING.
     A reviewer with no name is not a reviewer.

WHAT IT DELIBERATELY DOES NOT CHECK
It does not judge whether the markup will win a rich result. It checks
that the markup says what the page can back up — which is the only part a
build can be responsible for.
"""
from __future__ import annotations

import html as htmllib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"

LD_BLOCK = re.compile(
    r'<script type="application/ld\+json"[^>]*>(.*?)</script>', re.S
)
TAG = re.compile(r"<[^>]+>")

OUR_ID = "https://shenhezhongke.com/#organization"
OUR_NAME = "Guangdong Shenhe Zhongke Biotechnology Co., Ltd."

# The certificate that is issued to another entity of the same Shenhe group.
# It IS ours as a group, and the owner confirmed that on 2026-11-12 — so it
# is claimed. What the gate holds is that the claim names the holder: the
# scan names 深圳市永盛环境工程有限公司, and a buyer who reads the scan has to
# be able to reconcile the markup with it.
RELATED_CERTIFICATE = "GR202544200988"
HOLDER_NAME = "深圳市永盛环境工程有限公司"

PAGE_TYPES = {
    "WebPage",
    "AboutPage",
    "CollectionPage",
    "ContactPage",
    "Blog",
    "ProfilePage",
    "ItemPage",
    "SearchResultsPage",
}

SKIP_FILES = {"404.html", "_not-found.html", "google-site-verification.html"}
SKIP_DIRS = ("portal/", "admin/")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", htmllib.unescape(TAG.sub(" ", s))).strip()


def walk_nodes(value) -> list[dict]:
    """Every schema node in a JSON-LD value, however deeply nested."""
    found: list[dict] = []
    if isinstance(value, list):
        for item in value:
            found.extend(walk_nodes(item))
    elif isinstance(value, dict):
        found.append(value)
        graph = value.get("@graph")
        if isinstance(graph, list):
            for item in graph:
                found.extend(walk_nodes(item))
    return found


def top_level_nodes(value) -> list[dict]:
    """
    The nodes a block DECLARES, as opposed to the ones it points at.

    A block that holds an @graph declares the nodes inside it. A block
    that holds a plain node declares that node. Everything deeper — the
    publisher inside a list entry, the parent of an author — is a
    reference: it says who is involved without declaring a new company.

    The distinction matters because a page that names this company in ten
    report entries has not declared ten companies. It has published one
    company and pointed at it ten times.
    """
    out: list[dict] = []
    items = value if isinstance(value, list) else [value]
    for item in items:
        if not isinstance(item, dict):
            continue
        graph = item.get("@graph")
        if isinstance(graph, list):
            out.extend(n for n in graph if isinstance(n, dict))
        else:
            out.append(item)
    return out


def nodes_of(page: str) -> list[dict]:
    out: list[dict] = []
    for m in LD_BLOCK.finditer(page):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception as e:
            out.append({"__parse_error__": str(e)})
            continue
        out.extend(walk_nodes(data))
    return out


def top_level_nodes_of(page: str) -> list[dict]:
    """The nodes the page DECLARES, one level down from each block."""
    out: list[dict] = []
    for m in LD_BLOCK.finditer(page):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        out.extend(top_level_nodes(data))
    return out


def types_of(node: dict) -> set[str]:
    t = node.get("@type")
    if isinstance(t, list):
        return {str(x) for x in t}
    return {str(t)} if t else set()


def is_ours(node: dict) -> bool:
    if "Organization" not in types_of(node):
        return False
    if node.get("@id") == OUR_ID:
        return True
    return node.get("name") == OUR_NAME


def selector_matches(page: str, selector: str) -> int:
    """
    How many elements a simple CSS selector matches.

    Only the selector shapes this site actually uses are supported: a class
    (.name) and an element with a class (p.name). Anything else is counted
    as unresolved rather than guessed at, so a selector the gate cannot
    check fails the build instead of passing silently.
    """
    s = selector.strip()
    m = re.fullmatch(r"\.([A-Za-z0-9_-]+)", s)
    if m:
        cls = re.escape(m.group(1))
        return len(re.findall(r'class="[^"]*\b' + cls + r'\b', page))
    m = re.fullmatch(r"([a-zA-Z][a-zA-Z0-9]*)\.([A-Za-z0-9_-]+)", s)
    if m:
        cls = re.escape(m.group(2))
        return len(re.findall(r'<' + m.group(1) + r'[^>]*class="[^"]*\b' + cls + r'\b', page))
    return -1


def main() -> int:
    if not OUT.exists():
        print(f"!! {OUT} does not exist — build first")
        return 2

    problems: list[str] = []
    visible_text_all = ""
    public_pages = 0
    with_page_node = 0
    with_credentials = 0
    credential_names: set[str] = set()
    credential_ids: set[str] = set()
    certifications_html = ""

    for p in sorted(OUT.rglob("*.html")):
        rel = str(p.relative_to(OUT)).replace("\\", "/")
        if rel in SKIP_FILES or rel.startswith(SKIP_DIRS):
            continue
        page = p.read_text(encoding="utf-8", errors="replace")
        if 'name="robots"' in page and "noindex" in page:
            continue
        public_pages += 1
        if rel == "certifications.html":
            certifications_html = page
        # The text a reader can see, with the scripts taken out: the markup
        # carries the same numbers in the credential list, and a check that
        # read the raw HTML would pass on the schema alone.
        visible_text_all += " " + norm(
            re.sub(r"<script\b.*?</script>", " ", page, flags=re.S | re.I)
        )

        nodes = nodes_of(page)
        for n in nodes:
            if "__parse_error__" in n:
                problems.append(f"{rel}: a JSON-LD block does not parse: {n['__parse_error__']}")

        # --- rule 1: a page node ---
        page_nodes = [n for n in nodes if types_of(n) & PAGE_TYPES]
        if not page_nodes:
            problems.append(
                f"{rel}: no page node — the page does not say what it is, when it was "
                f"published, or what it belongs to"
            )
        else:
            with_page_node += 1
            if len(page_nodes) > 1:
                problems.append(f"{rel}: {len(page_nodes)} page nodes on one page")
            pn = page_nodes[0]
            for prop in ("datePublished", "dateModified", "inLanguage", "about", "isPartOf", "name", "url"):
                if prop not in pn:
                    problems.append(f"{rel}: the page node has no {prop}")

        # --- rule 2: one complete organisation ---
        #
        # The count is of DECLARATIONS, not of mentions. A page that names
        # this company as the publisher of ten report entries has published
        # one company and pointed at it ten times; that is not ten
        # companies.
        declared = [n for n in top_level_nodes_of(page) if is_ours(n)]
        if len(declared) > 1:
            problems.append(
                f"{rel}: {len(declared)} organisation nodes declare this company on one "
                f"page — a reader that merged them would find two companies with one name"
            )
        for n in declared:
            # --- rule 3: the credentials ---
            creds = n.get("hasCredential")
            if not isinstance(creds, list) or not creds:
                problems.append(f"{rel}: the organisation carries no hasCredential")
            else:
                with_credentials += 1
                for c in creds:
                    if not isinstance(c, dict):
                        continue
                    name = str(c.get("name", ""))
                    ident = str(c.get("identifier", ""))
                    credential_names.add(name)
                    if ident:
                        credential_ids.add(ident)
                    if RELATED_CERTIFICATE in json.dumps(c, ensure_ascii=False):
                        # The certificate IS ours — it is held by another
                        # entity of the same Shenhe group, which the owner
                        # confirmed on 2026-11-12. What must not happen is
                        # claiming it WITHOUT saying who the document names,
                        # because the scan names another legal entity and a
                        # buyer who reads the scan has to be able to
                        # reconcile the two.
                        blob = json.dumps(c, ensure_ascii=False)
                        if HOLDER_NAME not in blob and "Shenzhen Yongsheng" not in blob:
                            problems.append(
                                f"{rel}: the organisation claims {RELATED_CERTIFICATE} without "
                                f"naming the entity the document is issued to — the scan names "
                                f"another legal entity of the same group, and the markup has to say so"
                            )
            # --- rule 5: no award ---
            if "award" in n:
                problems.append(
                    f"{rel}: the organisation claims an award — this company holds no award "
                    f"in its own name, and a claimed award is a false E-E-A-T signal"
                )

        # every mention of us, wherever it sits, must say how this business
        # is priced — the question an assistant asks when it reads a
        # wholesale supplier's markup.
        for n in nodes:
            if "Organization" not in types_of(n):
                continue
            if not is_ours(n):
                continue
            d = n.get("description")
            if not isinstance(d, str) or not re.search(r"B2B|wholesale", d, re.I):
                problems.append(
                    f"{rel}: an organisation that names this company does not say how "
                    f"this business is priced"
                )

        # --- rule 4: speakable selectors resolve ---
        for n in nodes:
            sp = n.get("speakable")
            if not sp:
                continue
            sels = sp.get("cssSelector") if isinstance(sp, dict) else None
            for sel in sels or []:
                hits = selector_matches(page, str(sel))
                if hits == 0:
                    problems.append(
                        f"{rel}: the speakable selector {sel!r} matches nothing on the page"
                    )
                elif hits < 0:
                    problems.append(
                        f"{rel}: the speakable selector {sel!r} is a shape the gate cannot "
                        f"check — teach the gate to read it or change the selector"
                    )

        # --- rule 6: reviewedBy names something ---
        for n in nodes:
            rb = n.get("reviewedBy")
            if rb is None:
                continue
            named = False
            for r in rb if isinstance(rb, list) else [rb]:
                if isinstance(r, dict) and (r.get("name") or r.get("@id")):
                    named = True
            if not named:
                problems.append(f"{rel}: a reviewedBy with no name and no id")

    # --- rule 3, second half: the credentials are really published ---
    #
    # The check is on the VISIBLE text of the certifications page, not on
    # its raw HTML. The raw HTML carries the same numbers in the markup —
    # the schema on that page holds the credentials — so a raw-text check
    # would pass on the schema alone and say nothing about what the reader
    # can see. The number has to be printed on the page, in the section
    # that shows the licence scans, because that is the number a buyer
    # writes down.
    # THE VISIBLE TEXT OF THE WHOLE BUILD.
    #
    # The scripts are taken out first: the markup carries the same numbers
    # in the organisation's credential list, and checking the raw text
    # would pass on the schema alone and say nothing about what a reader
    # can see. The number has to be printed ON A PAGE, because that is
    # where a buyer writes it down.
    #
    # It is the whole build and not one page, because a credential is
    # printed where it belongs: the licences on the certifications page,
    # the patent on the intellectual-property page. The rule is that the
    # number is findable by a reader, not that it lives on one address.
    for ident in sorted(credential_ids):
        if ident not in visible_text_all:
            problems.append(
                f"the markup claims {ident}, and no page prints that number — the "
                f"document and the claim have drifted apart"
            )

    print(f"public pages checked        : {public_pages}")
    print(f"pages with a page node      : {with_page_node}")
    print(f"pages with hasCredential    : {with_credentials}")
    print(f"credentials declared        : {len(credential_names)}")
    for n in sorted(credential_names):
        print(f"   - {n}")
    print(f"credential identifiers      : {len(credential_ids)}")

    if problems:
        print(f"\n!! {len(problems)} semantic structure problem(s):\n")
        for x in problems:
            print(f"  - {x}")
        return 1

    print("\nOK: every public page says what it is, the company is declared once and carries its credentials, and every speakable selector resolves.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

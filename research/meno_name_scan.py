#!/usr/bin/env python3
"""Reproducible first-pass scan of explicit Greek proper names in Plato's Meno.

Input: Perseus TEI Greek, downloaded separately from a pinned public source.
Output: candidate identities, every matching token/locus, classification audit.
This is a lexicon-based detector, NOT automatic proof of historical attribution
or completeness beyond the names/capitalized-token inventory audited below.

No TLG corpus, original Greek passages, or translations are published.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
import re
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

SOURCE_COMMIT = "a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00"
SOURCE_URL = (
    "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/"
    + SOURCE_COMMIT
    + "/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml"
)
SOURCE_URN = "urn:cts:greekLit:tlg0059.tlg024.perseus-grc2"
TEI = "{http://www.tei-c.org/ns/1.0}"
WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)
LOC_RE = re.compile(r"^\d{1,3}[a-e]$")

# The lexicon is an explicit, inspectable research choice, not an
# 'AI found everyone' claim. Category 'poet' is intentionally included:
# a named poet can be an intellectual authority in an argument.
INTELLECTUALS = {
    "gorgias": ("Gorgias", "sophist", ("γοργι",)),
    "prodicus": ("Prodicus", "sophist", ("προδικ",)),
    "empedocles": ("Empedocles", "philosopher", ("εμπεδοκλ",)),
    "pindar": ("Pindar", "poet", ("πινδαρ",)),
    "protagoras": ("Protagoras", "sophist", ("πρωταγορ",)),
    "theognis": ("Theognis", "poet", ("θεογν",)),
    "homer": ("Homer", "poet; historicity uncertain", ("ομηρ",)),
}

# Review of every OTHER capitalized Greek token in the text body (not
# edition headers, stage directions, speaker labels, or editor's notes).
# Category/reason is retained in the report for independent inspection.
OTHER_NAMES = {
    "dialogue participant": {
        "Socrates": ("σωκρατ",),
        "Meno": ("μενων",),
        "Anytus": ("ανυτ",),
    },
    "political or family figure, not an intellectual-authority match": {
        "Aristippus of Larissa (not the Cyrenaic philosopher)": ("αριστιππ",),
        "Anthemion": ("ανθεμιων",),
        "Alexidemus": ("αλεξιδημ",),
        "Ismenias": ("ισμηνι",),
        "Polycrates": ("πολυκρατ",),
        "Themistocles": ("θεμιστοκλ",),
        "Cleophantus": ("κλεοφαντ",),
        "Aristides": ("αριστειδ",),
        "Lysimachus": ("λυσιμαχ",),
        "Pericles": ("περικλ",),
        "Paralus": ("παραλ",),
        "Xanthippus": ("ξανθιππ",),
        "Thucydides son of Melesias (not the historian)": ("θουκυδιδ",),
        "Melesias": ("μελησι",),
        "Stephanus": ("στεφαν",),
        "Eudorus": ("ευδωρ",),
        "Xanthias": ("ξανθι",),
    },
    "artist or mythic figure, not a historical thinker": {
        "Phidias": ("φειδι",),
        "Daedalus (mythic)": ("δαιδαλ",),
        "Tiresias (mythic)": ("τειρεσι",),
        "Persephone (divinity)": ("φερσεφον",),
        "Heracles (divinity)": ("ηρακλει",),
        "Zeus (divinity/oath)": ("δια", "δι"),
        "Hades (divinity/place)": ("αιδου",),
    },
    "geographic, ethnic, or collective name": {
        "Athenians": ("αθηναι",),
        "Aleuadae": ("αλευαδ",),
        "Thessalians": ("θετταλ",),
        "Larisa or Larisaeans": ("λαρισ",),
        "Greeks or Greece": ("ελλ",),
        "Theban": ("θηβαι",),
        "Spartans": ("λακων",),
    },
}
# Generic unclassified capitalized words are reported as a warning;
# the scan MUST NOT quietly promote them to intellectual authorities.

def fold(s: str) -> str:
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return s.lower().replace("ς", "σ")

def local(tag: str) -> str:
    return tag.split("}", 1)[-1]

def greek_sections(tei_xml: bytes) -> list[tuple[str, str]]:
    root = ET.fromstring(tei_xml)
    body = root.find(".//" + TEI + "body")
    if body is None:
        raise ValueError("Missing TEI text/body")
    sections: list[tuple[str, list[str]]] = []
    current: list[str] | None = None

    def add(s: str | None):
        if current is not None and s:
            current.append(s)

    def visit(node: ET.Element):
        nonlocal current
        tag = local(node.tag)
        if tag in {"note", "label", "head", "bibl"}:
            return
        if tag == "milestone" and node.get("unit") == "section":
            locus = node.get("n", "")
            if not LOC_RE.fullmatch(locus):
                # Some TEI files have structural milestones with unit="section"
                # but without a Stephanus citation (e.g. "imbedded dialogue").
                # Preserve the current citation and skip those markers.
                return
            sections.append((locus, []))
            current = sections[-1][1]
        else:
            add(node.text)
            for child in node:
                visit(child)
                add(child.tail)

    visit(body)
    result = [(locus, "".join(parts)) for locus, parts in sections]
    if len({locus for locus, _ in result}) != len(result):
        raise ValueError("Duplicate Stephanus sections in input")
    return result

def classify(token: str):
    key = fold(token)
    for person_id, (name, category, stems) in INTELLECTUALS.items():
        if any(key.startswith(stem) for stem in stems):
            return "intellectual", person_id, name, category
    for reason, entries in OTHER_NAMES.items():
        for label, stems in entries.items():
            if any(key.startswith(stem) for stem in stems):
                return "excluded", "", label, reason
    return "unclassified", "", "", ""

def scan(tei_xml: bytes) -> dict:
    sections = greek_sections(tei_xml)
    mentions = []
    others: dict[tuple[str, str], Counter] = defaultdict(Counter)
    unmatched = defaultdict(set)
    for locus, section_text in sections:
        for m in WORD_RE.finditer(unicodedata.normalize("NFC", section_text)):
            word = m.group(0)
            group, person_id, name, category = classify(word)
            if group == "intellectual":
                mentions.append({"id": person_id, "name": name,
                                 "category": category, "locus": locus,
                                 "token": word})
            elif word[0].isupper():
                if group == "excluded":
                    others[(name, category)][locus] += 1
                else:
                    unmatched[word].add(locus)

    rollup = []
    for person_id, (name, category, _stems) in INTELLECTUALS.items():
        matches = [m for m in mentions if m["id"] == person_id]
        if matches:
            loci = list(dict.fromkeys(m["locus"] for m in matches))
            rollup.append({"id": person_id, "name": name,
                           "category": category, "occurrences": len(matches),
                           "sections": loci})
    rollup.sort(key=lambda item: item["name"])
    other_report = [
        {"name": name, "classification": category,
         "sections": sorted(locations),
         "occurrences": sum(locations.values())}
        for (name, category), locations in sorted(others.items())
    ]
    return {
        "work": "Meno", "text_urn": SOURCE_URN,
        "source_url": SOURCE_URL,
        "license": "PerseusDL/canonical-greekLit, CC BY-SA 4.0",
        "source_editor": "John Burnet, Platonis Opera, vol. III (1903)",
        "method": "Greek TEI body, Stephanus milestones, accent-insensitive prefix lexicon; labels and editorial notes excluded",
        "sections_scanned": len(sections), "first_section": sections[0][0],
        "last_section": sections[-1][0],
        "intellectual_identities": rollup,
        "mentions": mentions,
        "total_name_occurrences": len(mentions),
        "distinct_mentioned_sections": len({m["locus"] for m in mentions}),
        "excluded_capitalized_names": other_report,
        "unclassified_capitalized_tokens": [
            {"token": token, "sections": sorted(loci)}
            for token, loci in sorted(unmatched.items())
        ],
        "review": {
            "status": "candidate extraction, not scholarly verification",
            "limitations": [
                "Lexicon-based matching may miss names not in INTELLECTUALS.",
                "Inflection stems were manually reviewed for this one source.",
                "Uncapitalized proper names require additional scrutiny.",
                "The name occurrences include repeated tokens within sections.",
                "Poets are included as intellectual authorities; political exemplars and speakers are not.",
                "Homer's historical individuality is disputed.",
                "The report cites, but does not republish, Greek passages."
            ]
        }
    }

def compare(report: dict, expected: dict) -> list[str]:
    issues = []
    for k in ["sections_scanned", "first_section", "last_section",
              "total_name_occurrences", "distinct_mentioned_sections"]:
        if report[k] != expected[k]:
            issues.append(f"{k}: got {report[k]!r}, expected {expected[k]!r}")
    actual = {item["id"]: {"occurrences": item["occurrences"],
                             "sections": item["sections"]}
              for item in report["intellectual_identities"]}
    if actual != expected["identities"]:
        issues.append("Person/occurrence/section inventory differs from human-reviewed baseline")
        issues.append("actual: " + json.dumps(actual, ensure_ascii=False))
    if report["unclassified_capitalized_tokens"]:
        issues.append("Unclassified capitalized tokens require human review: "
                      + json.dumps(report["unclassified_capitalized_tokens"], ensure_ascii=False))
    return issues

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tei", type=Path, help="Local copy of the pinned Perseus Greek TEI")
    parser.add_argument("--expected", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = scan(args.tei.read_bytes())
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                               encoding="utf-8")
    print(f"{report['sections_scanned']} sections | "
          f"{len(report['intellectual_identities'])} intellectual figures | "
          f"{report['total_name_occurrences']} name occurrences | "
          f"{report['distinct_mentioned_sections']} distinct cited sections")
    for x in report["intellectual_identities"]:
        print(f"{x['name']:<12} {x['occurrences']:>2}: {', '.join(x['sections'])}")
    if args.expected:
        issues = compare(report, json.loads(args.expected.read_text(encoding="utf-8")))
        for issue in issues:
            print("AUDIT FAILURE:", issue)
        return 1 if issues else 0
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Audit candidate explicit intellectual names in Plato's Theaetetus.

Reuses Meno's TEI/Stephanus parsing; all Greek input stays temporary.
The lexicon is a research aid, not evidence of complete coverage.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import unicodedata
from research.meno_name_scan import greek_sections, fold, WORD_RE, compare

REV = "a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00"
SOURCE_URL = (
    "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/"
    + REV + "/data/tlg0059/tlg006/tlg0059.tlg006.perseus-grc2.xml"
)
URN = "urn:cts:greekLit:tlg0059.tlg006.perseus-grc2"

INTELLECTUALS = {
    "protagoras": ("Protagoras", "sophist", ("πρωταγορ",)),
    "heraclitus": ("Heraclitus", "philosopher", ("ηρακλειτ",)),
    "parmenides": ("Parmenides", "philosopher", ("παρμενιδ",)),
    "empedocles": ("Empedocles", "philosopher", ("εμπεδοκλ",)),
    "epicharmus": ("Epicharmus", "comic poet", ("επιχαρμ",)),
    "homer": ("Homer", "poet; historicity uncertain", ("ομηρ",)),
    "pindar": ("Pindar", "poet", ("πινδαρ",)),
    "thales": ("Thales", "philosopher", ("θαλη",)),
    "melissus": ("Melissus", "philosopher; pluralized school reference", ("μελισσ",)),
    "hesiod": ("Hesiod", "poet", ("ησιοδ",)),
}

# All other capitalized tokens in the source are expected to be covered
# by these audited categories; new unexplained tokens fail the audit.
EXCLUDE = {
    "derived adjective or plural philosophical school": {
        "Protagorean": ("πρωταγορει",),
        "Heracliteans": ("ηρακλειτει",),
        "Parmenideans": ("παρμενιδαι",),
        "Homeric followers": ("ομηρει",),
        "Euripidean expression": ("ευριπιδει",),
    },
    "dialogue participant": {
        "Socrates": ("σωκρατ",),
        "Theaetetus": ("θεαιτητ",),
        "Theodorus": ("θεοδωρ",),
        "Euclides": ("ευκλειδ",),
        "Terpsion": ("τερψι",),
        "speaker label": ("σω",),
    },
    "historical person, family or incidental example": {
        "Aristides": ("αριστειδ",),
        "Lysimachus": ("λυσιμαχ",),
        "Euphronius": ("ευφρονι",),
        "Phaenarete": ("φαιναρετ",),
        "Callias": ("καλλια",),
        "Hipponicus": ("ιππονικ",),
        "Meletus": ("μελητ",),
    },
    "mythological and divine": {
        "Zeus": ("δια", "δι", "διοσ"),
        "Artemis": ("αρτεμ",),
        "Hera": ("ηραν",),
        "Iris": ("ιριν",),
        "Thaumas": ("θαυμαντ",),
        "Charites": ("χαριτων",),
        "Oceanus": ("ωκεαν",),
        "Tethys": ("τηθυ",),
        "Antaeus": ("ανται",),
        "Heracles": ("ηρακλεα", "ηρακλεε"),
        "Theseus": ("θησε",),
        "Sciron": ("σκιρων",),
        "Amphitryon": ("αμφιτρυων",),
        "Mnemosyne": ("μνημοσυν",),
        "Muses": ("μουσ",),
    },
    "place, ethnicity or unnamed person": {
        "toward Athens": ("αθηναζ",),
        "Corinth": ("κορινθ",),
        "Megara": ("μεγαρο",),
        "Erineus": ("εριν",),
        "Cyrene": ("κυρην",),
        "Sounion": ("σουνι",),
        "Lacedaemon": ("λακεδαιμ",),
        "Greeks": ("ελλην",),
        "Ionia": ("ιωνι",),
        "Ephesus": ("εφεσ",),
        "Mysians": ("μυσ",),
        "unnamed Thracian woman": ("θρα",),
        "cavalrymen": ("ιππεασ",),
    },
    "book title or sentence-initial ordinary word": {
        "Protagoras' Truth": ("αληθει",),
        "moves": ("κινειται",),
    },
}

def classify(token: str):
    # This avoids lowercase μέλισσον ("bee") being treated as Melissus.
    if not token[0].isupper():
        return ("none", "", "", "")
    normal = fold(token)
    for category, entries in EXCLUDE.items():
        for label, stems in entries.items():
            if any(normal.startswith(stem) for stem in stems):
                return ("excluded", "", label, category)
    for name_id, (name, category, stems) in INTELLECTUALS.items():
        if any(normal.startswith(stem) for stem in stems):
            return ("intellectual", name_id, name, category)
    return ("unclassified", "", "", "")

def scan(xml: bytes):
    sections = greek_sections(xml)
    matches = []
    excluded = defaultdict(Counter)
    unmatched = defaultdict(set)
    for locus, text in sections:
        for word in WORD_RE.finditer(unicodedata.normalize("NFC", text)):
            token = word.group()
            kind, name_id, name, category = classify(token)
            if kind == "intellectual":
                matches.append({"id": name_id, "name": name, "category": category,
                                "locus": locus, "token": token})
            elif kind == "excluded":
                excluded[(name, category)][locus] += 1
            elif kind == "unclassified":
                unmatched[token].add(locus)
    identities = []
    for name_id, (name, category, _) in INTELLECTUALS.items():
        these = [m for m in matches if m["id"] == name_id]
        if these:
            identities.append({"id": name_id, "name": name, "category": category,
                               "occurrences": len(these),
                               "sections": list(dict.fromkeys(m["locus"] for m in these))})
    identities.sort(key=lambda item: item["name"])
    return {
        "work": "Theaetetus",
        "text_urn": URN,
        "source_url": SOURCE_URL,
        "license": "PerseusDL/canonical-greekLit, CC BY-SA 4.0",
        "source_editor": "John Burnet, Platonis Opera (1903)",
        "method": "Greek TEI body with Stephanus milestones; capitalized, accent-folded names",
        "sections_scanned": len(sections),
        "first_section": sections[0][0],
        "last_section": sections[-1][0],
        "intellectual_identities": identities,
        "mentions": matches,
        "total_name_occurrences": len(matches),
        "distinct_mentioned_sections": len({m["locus"] for m in matches}),
        "excluded_capitalized_names": [
            {"name": name, "classification": reason, "sections": sorted(loci),
             "occurrences": sum(loci.values())}
            for (name, reason), loci in sorted(excluded.items())
        ],
        "unclassified_capitalized_tokens": [
            {"token": token, "sections": sorted(loci)}
            for token, loci in sorted(unmatched.items())
        ],
        "review": {
            "status": "machine candidate; not text-checked or scholar-verified",
            "limitations": [
                "Lexicon limited to inspected names; indirect allusions not scanned",
                "Melissus at 180e appears in pluralized form; interpretation remains open",
                "Poets are included as intellectual authorities",
                "No Greek passage or translation is published"
            ]
        }
    }

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("tei", type=Path)
    ap.add_argument("--expected", required=True, type=Path)
    ap.add_argument("--output", required=True, type=Path)
    args = ap.parse_args()
    report = scan(args.tei.read_bytes())
    issues = compare(report, json.loads(args.expected.read_text(encoding="utf-8")))
    for issue in issues:
        print("AUDIT FAILURE:", issue)
    print(f"Theaetetus: {report['sections_scanned']} sections, "
          f"{len(report['intellectual_identities'])} figures, "
          f"{report['total_name_occurrences']} name tokens, "
          f"{report['distinct_mentioned_sections']} cited sections")
    for name in report["intellectual_identities"]:
        print(f"  {name['name']}: {name['occurrences']} — {', '.join(name['sections'])}")
    if issues:
        return 1
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

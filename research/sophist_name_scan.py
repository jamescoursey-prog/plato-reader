#!/usr/bin/env python3
"""Sophist's named thinkers, using the same audited TEI scanner as Meno and Theaetetus.

Explicit person names only. The Eleatic and Sicilian/Ionian traditions and
the Protagorean adjective are logged as exclusions pending *separate*
indirect-allusion research; none is silently equated to an individual.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from research.greek_name_scan import scan_names, compare

REV = "a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00"
SOURCE_URL = ("https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/"
              + REV + "/data/tlg0059/tlg007/tlg0059.tlg007.perseus-grc2.xml")
URN = "urn:cts:greekLit:tlg0059.tlg007.perseus-grc2"

INTELLECTUALS = {
    "parmenides": ("Parmenides", "philosopher", ("παρμενιδ",)),
    "zeno": ("Zeno of Elea", "philosopher", ("ζηνων",)),
    "xenophanes": ("Xenophanes", "philosopher and poet", ("ξενοφαν",)),
    "homer": ("Homer", "poet; historicity uncertain", ("ομηρ",)),
}

EXCLUDE = {
    "dialogue participants": {
        "Socrates": ("σωκρατ",),
        "Theaetetus": ("θεαιτητ",),
        "Theodorus": ("θεοδωρ",),
    },
    "names related to a tradition, not explicit name mentions": {
        "Protagorean writings (232d)": ("πρωταγορει",),
        "Eleatic descriptor (242d)": ("ελεατικ",),
        "Elea place-name": ("ελεα",),
        "Ionian muses / philosophical tradition": ("ιαδε",),
        "Sicilian muses / philosophical tradition": ("σικελ",),
    },
    "mythic personification or divinity": {
        "Zeus": ("διοσ",),
        "Justice (Dike)": ("δικη",),
        "Muses": ("μουσ",),
    },
    "place, ethnic designation or incidental individual": {
        "Greeks": ("ελλη",),
        "Eurycles, proverbial ventriloquist (252c)": ("ευρυκλ",),
    },
}

def scan(xml: bytes) -> dict:
    return scan_names(
        xml, work="Sophist", source_url=SOURCE_URL, urn=URN,
        intellectuals=INTELLECTUALS, exclusions=EXCLUDE,
        capital_only=True, exclude_first=True,
        editor="John Burnet, Platonis Opera (1903)",
        additional_limitations=[
            "Protagorean adjective (232d) and Eleatic/Sicilian/Ionian tradition references (242d) are outside explicit-name counts.",
            "Eurycles at 252c is a proverbial comparison, not indexed as a philosophical authority."
        ]
    )

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tei",type=Path)
    parser.add_argument("--expected",required=True,type=Path)
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    report=scan(args.tei.read_bytes())
    issues=compare(report,json.loads(args.expected.read_text(encoding="utf-8")))
    for issue in issues:
        print("AUDIT FAILURE:",issue)
    print(f"Sophist: {report['sections_scanned']} sections | "
          f"{len(report['intellectual_identities'])} figures | "
          f"{report['total_name_occurrences']} name occurrences | "
          f"{report['distinct_mentioned_sections']} cited sections")
    for x in report["intellectual_identities"]:
        print(f"  {x['name']}: {x['occurrences']} | {', '.join(x['sections'])}")
    if issues:return 1
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return 0

if __name__=="__main__":
    raise SystemExit(main())

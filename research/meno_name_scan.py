#!/usr/bin/env python3
"""Meno configuration for the common Greek name scanner."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from research.greek_name_scan import scan_names, fold, greek_sections, WORD_RE, compare

SOURCE_COMMIT = "a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00"
SOURCE_URL = ("https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/"
              + SOURCE_COMMIT + "/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml")
SOURCE_URN = "urn:cts:greekLit:tlg0059.tlg024.perseus-grc2"

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

def scan(tei_xml: bytes) -> dict:
    return scan_names(
        tei_xml, work="Meno", source_url=SOURCE_URL, urn=SOURCE_URN,
        intellectuals=INTELLECTUALS, exclusions=OTHER_NAMES,
        capital_only=False, exclude_first=False,
        editor="John Burnet, Platonis Opera, vol. III (1903)"
    )



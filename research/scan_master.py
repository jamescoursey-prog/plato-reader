#!/usr/bin/env python3
"""First-pass master-name scan of the project's fixed 26-dialogue corpus.

ONLY exact, enumerated Greek personal-name forms from a 31-person starter
roster count as matches. This is a conservative discovery pass, not a verified
or exhaustive survey. False negatives are preferable to silently converting
Greek adjectives, plural school names or ordinary words into people.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import csv
import json
from pathlib import Path
import unicodedata

from research.greek_name_scan import fold, greek_sections, WORD_RE

REV = "a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00"
PINNED_ROOT = "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/" + REV + "/data/tlg0059"

def accent_exact(word: str) -> str:
    # Preserve vowel accents to separate proper Agathon (Ἀγάθων) from
    # the otherwise identical string ἀγαθῶν ('of good things').
    return unicodedata.normalize("NFC", word).casefold()

def build_lexicon(roster: dict) -> tuple[dict, dict]:
    if len(roster["people"]) != 31:
        raise ValueError("Seed roster must contain exactly 31 distinct figures")
    plain, sensitive, ids = {}, {}, set()
    for entry in roster["people"]:
        if entry["id"] in ids:
            raise ValueError("Duplicate thinker id")
        ids.add(entry["id"])
        for written in entry["forms"]:
            target = sensitive if entry.get("match") == "accent_sensitive" else plain
            key = accent_exact(written) if target is sensitive else fold(written)
            if key in target and target[key]["id"] != entry["id"]:
                raise ValueError("Ambiguous Greek form shared by two people: " + written)
            target[key] = entry
    return plain, sensitive

def source_url(work: dict) -> str:
    tlg, edition = work["tlg"], work["edition"]
    return f"{PINNED_ROOT}/{tlg}/tlg0059.{tlg}.{edition}.xml"

def scan_corpus(corpus: dict, roster: dict, sources: Path) -> dict:
    if corpus["pinned_commit"] != REV:
        raise ValueError("Manifest revision differs from scanner revision")
    works = corpus["works"]
    if len(works) != 26 or len({w["title"] for w in works}) != 26:
        raise ValueError("The project scan requires 26 unique dialogues")
    if works[-1]["title"] != "Critias" or any(w["title"] == "Laws" for w in works):
        raise ValueError("Corpus must end at Critias and exclude Laws")
    if [w["order"] for w in works] != list(range(1,27)):
        raise ValueError("Dialogue sequence must be numbered 1–26")
    plain, sensitive = build_lexicon(roster)
    by_person_section = defaultdict(lambda: {"tokens": [], "occurrences": 0})
    audits = []
    for work in works:
        key = work["tlg"]
        path = sources / (key + ".xml")
        sections = greek_sections(path.read_bytes())
        if not sections:
            raise ValueError("No cited sections: " + work["title"])
        seen_matches = 0
        for locus, text in sections:
            for hit in WORD_RE.finditer(unicodedata.normalize("NFC", text)):
                token = hit.group()
                if not token[0].isupper():
                    continue
                entry = sensitive.get(accent_exact(token)) or plain.get(fold(token))
                if entry is None:
                    continue
                combined = (entry["id"], work["title"], locus)
                row = by_person_section[combined]
                row["occurrences"] += 1
                row["tokens"].append(token)
                seen_matches += 1
        audits.append({
            "work":work["title"], "order":work["order"],
            "sections_scanned":len(sections),
            "first_section":sections[0][0], "last_section":sections[-1][0],
            "name_occurrences":seen_matches,
            "source_url":source_url(work),
            "urn":"urn:cts:greekLit:tlg0059."+key+"."+work["edition"]
        })
    known = {p["id"]:p for p in roster["people"]}
    order = {w["title"]:w["order"] for w in works}
    matches = [
        {"person_id":person, "work":work, "section":section,
         "occurrences":details["occurrences"],
         "tokens":sorted(set(details["tokens"])),
         "review_flag":known[person]["review_flag"] or "candidate"}
        for (person,work,section),details in by_person_section.items()
    ]
    matches.sort(key=lambda m:(known[m["person_id"]]["group"],
                               known[m["person_id"]]["name"],
                               order[m["work"]],
                               int(m["section"][:-1]), m["section"][-1]))
    appearances = defaultdict(list)
    for match in matches:
        appearances[match["person_id"]].append(match)
    people = [
        {"id":p["id"],"name":p["name"],"group":p["group"],
         "review_flag":p["review_flag"],"sections":len(appearances[p["id"]]),
         "dialogues":len({a["work"] for a in appearances[p["id"]]}),
         "occurrences":sum(a["occurrences"] for a in appearances[p["id"]])}
        for p in roster["people"]
    ]
    return {
        "version":"0.1", "status":"provisional: exact Greek lexical matches, not independently text checked",
        "scope":corpus["scope"],"source_revision":REV,
        "works_scanned":len(works),"roster_size":len(people),
        "people_with_hits":sum(1 for p in people if p["sections"]),
        "matched_sections":len(matches),
        "name_occurrences":sum(m["occurrences"] for m in matches),
        "sources":audits,"people":people,"matches":matches,
        "limitations":[
            "Only exact Greek forms specified in the starter roster are accepted; omissions are expected.",
            "Capitals in the selected Greek edition constrain recall.",
            "Some historical names have homonyms. Identity flags request review.",
            "Name matching is not a checked identification or doctrinal engagement.",
            "An individual named in a work title or editorial note is not a text mention.",
            "Existing three-dialogue checked records have not been overwritten.",
        ]
    }

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--roster",type=Path,default=Path("research/master_roster.json"))
    p.add_argument("--corpus",type=Path,default=Path("research/corpus_26.json"))
    p.add_argument("--sources",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    corpus=json.loads(args.corpus.read_text(encoding="utf-8"))
    roster=json.loads(args.roster.read_text(encoding="utf-8"))
    report=scan_corpus(corpus,roster,args.sources)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Master roster scan:",report["works_scanned"],"dialogues;",
          report["roster_size"],"names;",
          report["people_with_hits"],"people with matches;",
          report["matched_sections"],"person–passage records;",
          report["name_occurrences"],"matched word occurrences")
    for w in report["sources"]:
        print(f"  {w['order']:02} {w['work']}: {w['sections_scanned']} sections, "
              f"{w['name_occurrences']} name tokens ({w['first_section']}–{w['last_section']})")

if __name__=="__main__":
    main()

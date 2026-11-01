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
    identity_review = json.loads(
        (Path(__file__).with_name("identity_review.json")).read_text(encoding="utf-8")
    )
    excluded_identity = {
        (r["id"], r["work"], r["section"]): r
        for r in identity_review["excluded_identity"]
    }
    allowed_lowercase = {
        (r["id"], r["work"], r["section"], fold(r["token"])): r
        for r in identity_review["allowed_lowercase"]
    }
    collective_names = {
        (r["id"],r["work"],r["section"]):r
        for r in identity_review.get("collective_name_forms",[])
    }
    # This name's exact Greek forms were cross-checked against the
    # reader's independent morphological lexicon (57 occurrences in
    # 13 works, of which one work is outside this 26-dialogue scope).
    lowercase_name_allowlist = set(identity_review["full_lowercase_name_ids"])
    if len(excluded_identity) != len(identity_review["excluded_identity"]) or (
        len(allowed_lowercase) != len(identity_review["allowed_lowercase"])
    ):
        raise ValueError("Duplicated research identity exceptions")
    excluded_seen = set()
    lowercase_seen = set()
    excluded_matches = []
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
                entry = sensitive.get(accent_exact(token)) or plain.get(fold(token))
                if entry is None:
                    continue
                context_key = (entry["id"], work["title"], locus)
                if not token[0].isupper():
                    lower_key = (*context_key, fold(token))
                    if lower_key not in allowed_lowercase and entry["id"] not in lowercase_name_allowlist:
                        continue
                    if lower_key in allowed_lowercase:
                        lowercase_seen.add(lower_key)
                if context_key in excluded_identity:
                    excluded_seen.add(context_key)
                    excluded_matches.append({
                        "person_id": entry["id"], "work": work["title"],
                        "section": locus, "token": token,
                        "identified_as": excluded_identity[context_key]["wrong_identity"],
                        "reference": excluded_identity[context_key]["reference"]
                    })
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
    # Fail closed if a known namesake or permitted lowercase token disappears.
    # A changed source edition must trigger fresh scholarly inspection.
    scanned_work_names = {work["title"] for work in works}
    expected_exclusions = {key for key in excluded_identity if key[1] in scanned_work_names}
    expected_lowercase = {key for key in allowed_lowercase if key[1] in scanned_work_names}
    if excluded_seen != expected_exclusions:
        raise ValueError("Expected homonym exclusion missing from Greek source: " +
                         str(expected_exclusions - excluded_seen))
    if lowercase_seen != expected_lowercase:
        raise ValueError("Expected lowercase proper-name exception missing: " +
                         str(expected_lowercase - lowercase_seen))
    known = {p["id"]:p for p in roster["people"]}
    order = {w["title"]:w["order"] for w in works}
    matches = [
        {"person_id":person, "work":work, "section":section,
         "occurrences":details["occurrences"],
         "tokens":sorted(set(details["tokens"])),
         "review_flag":("collective_plural" if (person,work,section) in collective_names
                        else known[person]["review_flag"] or "candidate")}
        for (person,work,section),details in by_person_section.items()
    ]
    matches.sort(key=lambda m:(known[m["person_id"]]["group"],
                               known[m["person_id"]]["name"],
                               order[m["work"]],
                               int(m["section"][:-1]), m["section"][-1]))
    # Known independent lexicon comparisons (same source tradition).
    # These guard regressions; they are not claims of historical identity
    # verification for the entire 31-person roster.
    canonical_corpus = [w["title"] for w in works] == [
        w["title"] for w in json.loads(
            (Path(__file__).with_name("corpus_26.json")).read_text(encoding="utf-8")
        )["works"]
    ]
    if canonical_corpus:
        expected_names = {"empedocles":2, "euthydemus":71, "prodicus":56}
        for person_id, expected in expected_names.items():
            actual = sum(m["occurrences"] for m in matches
                         if m["person_id"] == person_id)
            if actual != expected:
                raise ValueError(f"Cross-checked form inventory changed for {person_id}: "
                                 f"{actual} rather than {expected}; review Greek forms")
    # Only the specifically documented passages below have received
    # passage-level scholarly identity checks. Other lexical hits remain
    # unreviewed, even when they are adjacent in the same dialogue.
    observed = {(m["person_id"], m["work"], m["section"]) for m in matches}
    checked = identity_review["documented_positive"]
    if canonical_corpus and not set(collective_names).issubset(observed):
        raise ValueError("Collective plural name reference missing from Greek source: "+
                         str(set(collective_names)-observed))
    checked_keys = {(item["id"],item["work"],item["section"]) for item in checked}
    if canonical_corpus and not checked_keys.issubset(observed):
        raise ValueError("Documented positive identity citation is missing: "+
                         str(checked_keys - observed))
    checked_passages = [
        {"person_id":item["id"], "work":item["work"],
         "section":item["section"],"reference":item["reference"],
         "reason":item["reason"]}
        for item in checked
        if (item["id"],item["work"],item["section"]) in observed
    ]
    triage = json.loads(
        (Path(__file__).with_name("roster_identity_triage.json")).read_text(encoding="utf-8")
    )
    triage_entries = triage["entries"]
    triage_ids = [r["id"] for r in triage_entries]
    if len(triage_ids) != len(roster["people"]) or set(triage_ids) != set(known):
        raise ValueError("Final identity risk triage must cover exactly the 31 roster members")
    if canonical_corpus:
        example_keys = {(r["id"],r["example_work"],r["example_section"])
                        for r in triage_entries}
        if not example_keys.issubset(observed):
            raise ValueError("Identity risk triage cites missing example matches: "+
                             str(example_keys-observed))
    historicity_notes = [
        {"person_id":item["id"], "status":item["status"],
         "note":item["note"],"reference":item["reference"]}
        for item in identity_review.get("historicity_notes",[])
        if item["id"] in known
    ]
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
        "identity_exclusions":excluded_matches,
        "documented_identity_checks":checked_passages,
        "collective_name_candidates":[
            {"person_id":x["id"],"work":x["work"],"section":x["section"],
             "note":x["note"],"reference":x["reference"]}
            for x in collective_names.values()
            if (x["id"],x["work"],x["section"]) in observed
        ],
        "historicity_notes":historicity_notes,
        "roster_identity_triage":triage_entries,
        "lowercase_name_exceptions": [
            {"person_id":key[0],"work":key[1],"section":key[2],
             "source_url":allowed_lowercase[key]["reference"]}
            for key in sorted(lowercase_seen)
        ],
        "limitations":[
            "Only exact Greek forms specified in the starter roster are accepted; omissions are expected.",
            "Most matches require capitalization; exceptions are separately documented and source-checked.",
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
    # Log an inspectable, name-by-dialogue identity review queue (no Greek text).
    from collections import defaultdict
    by_person_work = defaultdict(list)
    for row in report["matches"]:
        by_person_work[(row["person_id"], row["work"])].append(row["section"])
    print("IDENTITY AUDIT QUEUE (name => work: cited Stephanus sections):")
    for person in roster["people"]:
        works = [(work["title"], by_person_work[(person["id"], work["title"])])
                 for work in corpus["works"]
                 if by_person_work[(person["id"], work["title"])]]
        print(f"  {person['name']}: "
              + ("; ".join(f"{title}: {', '.join(locations)}"
                           for title, locations in works) if works else "NONE"))
    print("Seed roster, sorted by the defined category/name sequence:")
    for item in report["people"]:
        print(f"  {item['name']}: {item['sections']} cited sections in "
              f"{item['dialogues']} works ({item['occurrences']} word occurrences)"
              + (f"; flag={item['review_flag']}" if item['review_flag'] else ""))

if __name__=="__main__":
    main()

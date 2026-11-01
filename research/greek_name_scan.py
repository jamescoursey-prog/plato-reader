#!/usr/bin/env python3
"""Shared source-aware name detector for Greek TEI dialogues.

One implementation for tokenizing, Stephanus citations, provenance and
candidate/exception audits. Work-specific dictionaries live in small
configuration wrappers. No generated claim implies scholarly verification.
"""
from __future__ import annotations
from collections import Counter, defaultdict
import json
import re
import unicodedata
from xml.etree import ElementTree as ET

TEI = "{http://www.tei-c.org/ns/1.0}"
WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)
LOC_RE = re.compile(r"^\d{1,3}[a-e]$")

def fold(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower().replace("ς", "σ")

def greek_sections(xml: bytes) -> list[tuple[str, str]]:
    root = ET.fromstring(xml)
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
        tag = node.tag.split("}", 1)[-1]
        if tag in {"note", "label", "head", "bibl"}:
            return
        if tag == "milestone" and node.get("unit") == "section":
            locus = node.get("n", "")
            if LOC_RE.fullmatch(locus):
                sections.append((locus, []))
                current = sections[-1][1]
            # Non-Stephanus "section" marker (e.g. an embedded dialogue)
            return
        add(node.text)
        for child in node:
            visit(child)
            add(child.tail)

    visit(body)
    result = [(locus, "".join(parts)) for locus, parts in sections]
    if not result:
        raise ValueError("No Stephanus sections found")
    if len({locus for locus, _ in result}) != len(result):
        raise ValueError("Duplicate Stephanus sections")
    return result

def scan_names(
    xml: bytes, *, work: str, source_url: str, urn: str,
    intellectuals: dict, exclusions: dict,
    capital_only: bool, exclude_first: bool, editor: str,
    additional_limitations: list[str] | None = None
) -> dict:
    """Lexicon scan; exclusion precedence is controlled per dialogue."""
    sections = greek_sections(xml)
    matches = []
    others = defaultdict(Counter)
    unknown = defaultdict(set)

    def lookup(stem: str, collection: dict, intellectual: bool):
        if intellectual:
            for key, (name, category, stems) in collection.items():
                if any(stem.startswith(s) for s in stems):
                    return ("intellectual", key, name, category)
        else:
            for reason, entries in collection.items():
                for label, stems in entries.items():
                    if any(stem.startswith(s) for s in stems):
                        return ("excluded", "", label, reason)
        return None

    for locus, passage in sections:
        for found in WORD_RE.finditer(unicodedata.normalize("NFC", passage)):
            token = found.group()
            uppercase = token[0].isupper()
            if capital_only and not uppercase:
                continue
            normalized = fold(token)
            found_person = lookup(normalized, intellectuals, True)
            excluded = lookup(normalized, exclusions, False) if uppercase else None
            selected = ((excluded or found_person) if exclude_first
                        else (found_person or excluded))
            if selected:
                kind, id_, name, category = selected
                if kind == "intellectual":
                    matches.append({"id": id_, "name": name, "category": category,
                                    "locus": locus, "token": token})
                elif uppercase:
                    others[(name, category)][locus] += 1
            elif uppercase:
                unknown[token].add(locus)

    identities = []
    for id_, (name, category, _stems) in intellectuals.items():
        occurrences = [m for m in matches if m["id"] == id_]
        if occurrences:
            identities.append({"id": id_, "name": name, "category": category,
                               "occurrences": len(occurrences),
                               "sections": list(dict.fromkeys(m["locus"] for m in occurrences))})
    identities.sort(key=lambda m: m["name"])
    return {
        "work": work, "text_urn": urn, "source_url": source_url,
        "license": "PerseusDL/canonical-greekLit, CC BY-SA 4.0",
        "source_editor": editor,
        "method": "Shared Greek TEI scanner; Stephanus milestones; accent-folded lexicon; audited named-person exclusions",
        "sections_scanned": len(sections),
        "first_section": sections[0][0],
        "last_section": sections[-1][0],
        "intellectual_identities": identities,
        "mentions": matches,
        "total_name_occurrences": len(matches),
        "distinct_mentioned_sections": len({m["locus"] for m in matches}),
        "excluded_capitalized_names": [
            {"name": name, "classification": category, "sections": sorted(loci),
             "occurrences": sum(loci.values())}
            for (name, category), loci in sorted(others.items())
        ],
        "unclassified_capitalized_tokens": [
            {"token": token, "sections": sorted(loci)}
            for token, loci in sorted(unknown.items())
        ],
        "review": {
            "status": "machine candidate extraction, not human-checked",
            "limitations": [
                "Name dictionaries can miss unlisted people and indirect allusions.",
                "Capitalization and inflection depend on the selected edition.",
                "An identified name does not prove an independently interpreted doctrine.",
                "Only name forms and citations are published; no passage text.",
                *(additional_limitations or []),
            ]
        }
    }

def compare(report: dict, expected: dict) -> list[str]:
    errors = []
    for field in ("sections_scanned", "first_section", "last_section",
                  "total_name_occurrences", "distinct_mentioned_sections"):
        if report[field] != expected[field]:
            errors.append(f"{field}: got {report[field]!r}, expected {expected[field]!r}")
    actual = {item["id"]: {"occurrences": item["occurrences"],
                           "sections": item["sections"]}
              for item in report["intellectual_identities"]}
    if actual != expected["identities"]:
        errors.append("Person/occurrence/section inventory differs from audited baseline")
        errors.append("actual: " + json.dumps(actual, ensure_ascii=False))
    if report["unclassified_capitalized_tokens"]:
        errors.append("Unclassified capitalized tokens require review: " +
                      json.dumps(report["unclassified_capitalized_tokens"], ensure_ascii=False))
    return errors

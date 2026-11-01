# Meno: automatic discovery of explicitly named intellectuals

This is an **extraction experiment**, not a verified historical index. It
scans an independently sourced Greek TEI of Plato's *Meno* and produces a
candidate inventory (Greek proper-name tokens, not full passages). Its
current manually reviewed name lexicon includes philosophers, sophists, and
poets; it explicitly separates dialogue participants, historical political
examples, artists, mythical figures, and geographic names.

## Source and reproducibility

- Text: Perseus Digital Library, Plato, *Meno*, Greek TEI
  \`tlg0059.tlg024.perseus-grc2.xml\`, from **John Burnet, 1903**.
- Text repository: https://github.com/PerseusDL/canonical-greekLit
- Pinned revision: \`a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00\`.
- File URL: see \`SOURCE_URL\` in \`meno_name_scan.py\`.
- Perseus repo license: CC BY-SA 4.0 (unless otherwise indicated).
- **No text is committed or published here.** CI downloads a temporary
  source copy and publishes only candidate metadata as a workflow artifact.

## Current manual audit: candidate inventory

The scan of all 151 Stephanus sections (70a–100c) identifies 7 named
intellectual figures and 18 name-token occurrences in **15 distinct
Stephanus sections** (18 occurrences ≠ 18 sections).

| Named figure | Category | Occurrences | Stephanus sections |
|---|---|---:|---|
| Gorgias | sophist | 8 | 70b, 71c, 71d, 73c, 76b, 76c, 95c, 96d |
| Prodicus | sophist | 2 | 75e, 96d |
| Empedocles | philosopher | 1 | 76c |
| Pindar | poet | 2 | 76d, 81b |
| Protagoras | sophist | 3 | 91d, 91e (twice) |
| Theognis | poet | 1 | 95d |
| Homer | poet; historicity disputed | 1 | 100a |

Cross-checking the Greek confirms the relevant functions in context:

- Gorgias is cited for his teaching and explanations of virtue
  (especially 70b–71d, 73c, 76b–c, 95c, 96d).
- Prodicus is invoked regarding terminological distinctions (75e)
  and rhetorically as Socrates' instructor (96d).
- Empedocles is explicitly named with the doctrine of effluences (76c).
- Pindar appears in a poetic allusion (76d) and as an authority
  invoked in the discussion of the soul (81b).
- Protagoras is named in Socrates' discussion of sophists' earnings and
  reputation (91d–e), twice at 91e.
- Theognis is cited in discussing whether virtue can be taught (95d);
  the quoted verses continue into 96a.
- Homer is explicitly cited regarding Tiresias (100a).

The *Meno* also names many non-target individuals. Socrates, Meno,
and Anytus speak in the dialogue. Themistocles, Aristides, Pericles,
and Thucydides son of Melesias are political exemplars, not authors
of doctrines in these passages. Crucially, **this Thucydides is the
politician, not the historian**, and **Aristippus at 70b is the
Thessalian/Larisaean associate, not the later Cyrenaic philosopher**.
Phidias is a sculptor; Daedalus and Tiresias are mythic figures.
The scanner reports excluded capitalized names for audit.

## How to run it

With Python 3.11+ installed:

\`\`\`sh
curl -fsSL 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml' -o /tmp/meno-grc.xml
python -m unittest discover -s research/tests -p 'test_*.py'
python research/meno_name_scan.py /tmp/meno-grc.xml \
  --expected research/meno_expected.json \
  --output /tmp/meno-candidates.json
\`\`\`

CI downloads this pinned XML, executes this test suite, and checks the
result against \`meno_expected.json\`. That check identifies regressions in
the known name list but **cannot prove** that our selected dictionary
captures every name. The full list of otherwise-unclassified capitalized
tokens is also checked; no detector can identify every possible indirect
allusion from capitalization alone.

## What is intentionally NOT automatic

The output is an **evidence queue**, not a promotion of research records.
A proper name in one section does not automatically imply a substantive
philosophical engagement; historical identity and doctrinal attribution
still require scholarly review. No machine-generated entry is promoted
to text-checked or verified. Poets remain visible as intellectual
authorities rather than silently treated as philosophers.

The next increment can import the deduplicated candidate inventory into
the public preview, preserving the status and provenance of our existing
text-checked *Meno* 76c–d record. That import is not part of this first scan.

## Connected website preview

The Pages and CI preview now call `bash preview/build-with-meno.sh`.
This program regenerates the extracted candidate metadata and merges it
with the curated record list **at build time**, rather than requiring manual
data entry or editing of a committed JSON file. The published website
contains only the resulting brief candidate metadata, citation links, and
attribution; it never includes the downloaded Greek source.

Candidate identities must already be registered in the app's canonical
`THINKERS` registry. Deduplication uses dialogue + Stephanus starting
section + thinker ID. The checked *Meno* 76c–d record wins over the
automated match and retains its reviewer/source notes. No automatic
candidate is marked `text_checked` or `verified`.

# Master-name discovery scan (26 works, 31-name seed roster)

We deliberately scan **only a predefined list of intellectual figures** and
only enumerated, exact Greek **personal-name inflections**. This prevents
capturing ordinary uppercase words and epithets that happen to resemble
historical names. It also creates *false negatives*: unlisted inflections,
lowercase names, and unknown figures will not appear. We explicitly accept
that tradeoff for a conservative first version.

- `research/master_roster.json`: seed list of 31 names, accepted Greek forms
  and ambiguity flags; not a fully verified Plato-specific prosopography.
- `research/corpus_26.json`: the exact 26 agreed dialogues from *Apology*
  through *Critias*, with pinned Perseus TEI filenames. *Laws* excluded.
- `research/scan_master.py`: reusable exact-form name scan using shared TEI
  and Stephanus parsing, exports metadata only.
- `research/tests/test_master_scan.py`: tests designed to reject plural schools,
  Protagorean/Heraclitean adjectives and the ordinary genitive *ἀγαθῶν*.

Match status is **provisional**. A name appearing at a section does not yet
prove that it refers to the intended historical individual. Particular
identity ambiguity (e.g., a character with the same name as a sophist) is
separately flagged. The two existing human research records remain unchanged.

The first output is a *master person-to-passage index*, not an exhaustive
intellectual engagement or doctrine index. We can refine accepted forms
against Abbott, Nails, or textual editions after seeing the first report.

## Publication

`preview/master-index.mjs` generates a standalone searchable HTML roster,
with individual thinker headings, every matched dialogue and Stephanus
location, direct links to John Boyer's reader, and a CSV download.
These are **unreviewed lexical candidates**, not previously text-checked
pilot records. The previously published index is preserved at the website
root. An unrecognized name inflection can lead to false negatives; identity
flags are not silently converted into approvals.

## Independent citation/name-form cross-check

The reader's Greek word lexicon lists 73 occurrences of *Euthydemus*
in four works; exactly 70 occur in the `Euthydemus` dialogue, one
in `Cratylus` 386d, and two refer to distinct namesakes in
`Republic` 328b and `Symposium` 222b. Our restricted index must
retain only **71** occurrences of the sophist's name, not all 73.
Citation evidence is saved in `research/identity_review.json`.

Similarly, the reader's Prodicus lemma lists 57 occurrences in 13
works, including *Theages*, which is beyond our chosen 26-dialogue
corpus. After adding the missing vocative forms and safely accepting
case-insensitive **exact forms for Prodicus only**, the restricted
corpus should contain **56** lexical occurrences. Other names are
not automatically made case insensitive. Regression checks in
`research/scan_master.py` enforce both inventories and Empedocles' two
explicit name tokens; these are limited, source-dependent checks,
not blanket scholarly verification.

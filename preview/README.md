# Public concordance preview and provisional master index

There are now **two separate research outputs**:

1. The original three-dialogue passage preview (*Meno*, *Theaetetus*,
   *Sophist*): 74 candidate/review records, with one human text-checked
   entry and zero fully verified philosophical engagements.
2. A first-pass **31-person master name roster scanned against all 26
   project dialogues** (*Apology* to *Critias*, with *Laws* excluded).
   Open `master-index.html` and download the corresponding
   `master-index.csv` for an easily usable prototype.

The master list is a *restricted exact-Greek-name-form search*: it only
matches names and inflections explicitly enumerated in
`research/master_roster.json`. It ignores unrelated proper nouns and
excludes ordinary lookalike words and school adjectives. It is NOT a
complete philological identification: missing forms and namesakes
remain possible, and zero matches are not evidence of absence.

A single script prepares both indexes and tests the source inventory:

```bash
bash preview/build-with-meno.sh
```

The script's historical name survives for CI compatibility. The build
downloads all 26 pinned Perseus TEI sources temporarily, scans their
Greek text, and generates metadata pages. The Greek texts and intermediate
JSON are **never** copied into the published output. Both HTML indexes,
the metadata-only CSV, `LICENSE.txt`, and `.nojekyll` are deployed.

This is a build-time research mechanism, **not a user-initiated website
database rebuild**. The published master index does not overwrite or
promote the original manually assessed entries.

## Identity audits and Version 1.0 release candidate

The current 31-name inventory covers **26 selected dialogues**, produces
**861 person–section records** and **1,056 Greek name tokens**, and has
matches for **all 31 roster members**. Counts describe lexical and
person–passage *candidates*, not 861 independently certified identities.

The final roster-level identity triage is documented in
`research/roster_identity_triage.json` (31/31 names). Of these,
17 have no identified ambiguity in the sampled context,
11 require namesake/context checks, one has a collective-plural
usage (Melissus), and two have separate historicity concerns.
It is a risk screen, **not a review of every mention**.

In `research/identity_review.json`, **11 particular identities**
have separately documented passage checks. Two known homonymous
Euthydemuses (Republic 328b and Symposium 222b) are explicitly
excluded. `Cratylus` 386d retains Euthydemus of Chios.
The scanner includes the vocatives of Euthydemus and Prodicus
and only permits lowercase forms when explicitly justified.
The independent lexicon guard expects 71 Euthydemus and 56 Prodicus
name tokens in this exact corpus.

Melissus is now included at `Theaetetus` **183e**, where Plato
uses a lowercase accusative of his personal name, and **180e**,
where the rhetorical plural *Melissuses* refers to the philosopher
and his school collectively. The latter remains flagged and
is not treated as another individual. The source and scholarly
interpretation are recorded in the identity-review JSON.

The 10-book `Republic` is now linked to the **correct book route**
for each Stephanus page rather than incorrectly sending all
citations to Book I. The CSV exports that full reader URL and
an explicit review-status field.

For both the published page and CSV, the build script scans the
pinned Perseus texts and runs tests, without republishing Greek
source texts or copyrighted translations. The original 3-dialogue
passage research preview and its review statuses remain unchanged.

The public Pages build is deliberately a **release candidate on the
feature branch**. No main-branch merge, release tag, or automatic
claim of universal verification is implied.


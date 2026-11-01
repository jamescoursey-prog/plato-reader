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

# Version 1.0 release-candidate review — November 1, 2026

**Scope:** Plato thinker-name concordance; 31 predefined historical/intellectual
names, 26 selected dialogues through *Critias*. The *Laws* and later texts
remain outside scope. No intent to infer unnamed influences.

## Historical-identity audit

- **Roster coverage:** 31/31 figures screened at representative passage
  level in `research/roster_identity_triage.json`; 17 low-risk,
  11 context-sensitive, 1 collective/plural, 2 historicity cautions.
- **Documented positive checks:** 11 individual passage-specific references,
  never generalized to all matches.
- **Known wrong identities excluded:** Euthydemus son of Cephalus
  (`Republic` 328b) and Euthydemus son of Diocles
  (`Symposium` 222b).
- **Melissus correction:** `Theaetetus` 183e explicitly names Melissus
  in a lowercase form. At 180e the plural *Melissuses* is a
  collective reference, separately flagged as such.
- **Open scholarly caveats:** historical attestation of Euthydemus
  and Dionysodorus; two ancient Parian poets called Evenus;
  authorship/historicity questions about Homer; the collective
  language about Melissus at 180e. These are disclosed in the
  interface, not silently marked verified.
- **Lexical scope:** inflected Greek first names on a constrained
  seed list. Variants outside the explicit list may be omitted.
  Machine matches are still provisional even if they appear in a
  screened dialogue. This is a research concordance, not a critical
  prosopography or full proof of all 861 identifications.

## Data and build review

- **31 roster persons represented**; 26 pinned Greek TEI works, all
  using preserved Stephanus section locations.
- Expected output is **861 person–section candidate records** from
  **1,056 Greek name tokens**. The 11 independently checked positives
  remain a subset of these records.
- `master-index.csv` provides citations, Greek detected forms,
  full source URNs, the working reader URL, and review status.
  No raw Greek text, copyrighted English translation, or intermediate
  scanner output is published.
- The original three-dialogue research preview and its manually
  entered review states remain unchanged.

## Link and interface review

- Fixed the earlier error that routed every Republic citation to Book I.
  `preview/reader-link.mjs` now uses the explicit ten-book
  Stephanus boundaries verified against the reader's own *Republic*
  table of contents.
- All ten Republic start-page routes, malformed reference rejection,
  single-book routes, generated citation-count consistency and
  CSV reader links are included in automated regression tests.
- Name search is connected to the input field and live result count.
  Responsive CSS and wrapping navigation are present.
- Citation links open the credited reader with `noopener noreferrer`;
  source links point to pinned provenance.
- The public release remains a GitHub Pages **candidate**, with
  `noindex` intentionally retained pending explicit release approval.

## Acceptance and limitations

**Automated acceptance:** All repository CI jobs and the metadata-only
Pages deployment must be green at the final branch commit. The
release check has a pinned source revision and fails if evidence
for required citations disappears. Count and link tests are safeguards,
not substitutes for philological review.

**Not independently completed here:** Real-phone/browser visual inspection,
manual click-through of every citation on the remote reader, and
independent textual collation of all provisional records.
These are residual limits, not claims of verified completion.

**Merge policy:** Work remains on
`feature/thinker-concordance-pilot`, within draft PR #1.
Do not merge or tag Version 1.0 without the project owner's approval.

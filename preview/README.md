# Rights-limited visual preview (Meno scanner integrated)

The public preview is generated from two inputs: (1) the original,
human-curated research records in `app/src/lib/thinker-concordance.ts`; and
(2) the automatically extracted, **candidate-only** name locations from the
pinned Perseus Greek *Meno*.

The build process is identical in CI and GitHub Pages:

```sh
bash preview/build-with-meno.sh
```

It downloads the pinned Perseus Greek TEI to a **temporary directory**,
executes `research/meno_name_scan.py` and compares its output with
`research/meno_expected.json`, then merges the JSON output using
`preview/merge-candidates.mjs`. Records are uniquely keyed by dialogue,
Stephanus start section, and thinker identity. An existing human-reviewed
record always takes precedence, preserving *Meno* 76c–d as `text_checked`.
The independent *Theaetetus* 152e candidate remains unchanged.

The site displays 18 passage records, 7 indexed thinkers, 1 text-checked
record, and 0 fully verified engagements: 16 new automatic candidates
plus the original 2 human-managed records. These totals describe **our
current audited name lexicon**, not all historical thinkers in Plato.

The output contains only:
- `index.html` (metadata, names, source references, links)
- `LICENSE.txt` (original MIT notice)
- `.nojekyll`

**The input Greek TEI, the generated JSON report, and any English
translations are never deployed or committed.** Names and Stephanus references
are displayed, not passage texts. The scanner's pinned Perseus source URL,
license, and provisional machine provenance are shown. The site links to John
Boyer’s independently hosted reader, instead of rehosting his Greek texts.

Both `preview/merge-candidates.test.mjs` and
`preview/check.test.mjs` run in CI and before Pages deployment. Failure
to download or pass the source audit blocks deployment rather than silently
dropping records or lowering review status.

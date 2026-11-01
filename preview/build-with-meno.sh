#!/usr/bin/env bash
# Reproducible full-corpus name discovery plus the original three-dialogue pilot.
# All downloaded source XML and intermediary JSON remain temporary.
set -euo pipefail
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT
mkdir -p "$TEMP/sources"
python - <<'PY' > "$TEMP/manifest.tsv"
import json
manifest=json.load(open("research/corpus_26.json",encoding="utf-8"))
for work in manifest["works"]:
    print(work["tlg"] + "\t" + work["edition"])
PY
while IFS=$'\t' read -r tlg edition; do
  curl --fail --location --silent --show-error --retry 3 \
    "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/$tlg/tlg0059.$tlg.$edition.xml" \
    -o "$TEMP/sources/$tlg.xml"
done < "$TEMP/manifest.tsv"

# Keep the original three independently audited candidate inventories intact.
python -m research.meno_name_scan "$TEMP/sources/tlg024.xml" \
  --expected research/meno_expected.json --output "$TEMP/meno.json"
python -m research.theaetetus_name_scan "$TEMP/sources/tlg006.xml" \
  --expected research/theaetetus_expected.json --output "$TEMP/theaetetus.json"
python -m research.sophist_name_scan "$TEMP/sources/tlg007.xml" \
  --expected research/sophist_expected.json --output "$TEMP/sophist.json"

# Restricted 31-person roster across the complete 26-dialogue project corpus.
python -m research.scan_master --sources "$TEMP/sources" --output "$TEMP/master.json"
node --experimental-strip-types preview/build.mjs \
  "$TEMP/meno.json" "$TEMP/theaetetus.json" "$TEMP/sophist.json"
node --experimental-strip-types preview/master-index.mjs "$TEMP/master.json"
node --experimental-strip-types --test \
  preview/merge-candidates.test.mjs preview/theaetetus-import.test.mjs \
  preview/sophist-import.test.mjs preview/check.test.mjs \
  preview/master-index.test.mjs

#!/usr/bin/env bash
# Rebuild the public metadata index from two audited, pinned source texts.
set -euo pipefail
temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
curl --fail --location --silent --show-error --retry 3 \
  'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml' \
  -o "$temporary/meno.xml"
python research/meno_name_scan.py "$temporary/meno.xml" \
  --expected research/meno_expected.json --output "$temporary/meno.json"
curl --fail --location --silent --show-error --retry 3 \
  'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg006/tlg0059.tlg006.perseus-grc2.xml' \
  -o "$temporary/theaetetus.xml"
python -m research.theaetetus_name_scan "$temporary/theaetetus.xml" \
  --expected research/theaetetus_expected.json --output "$temporary/theaetetus.json"
node --experimental-strip-types preview/build.mjs "$temporary/meno.json" "$temporary/theaetetus.json"
node --experimental-strip-types --test \
  preview/merge-candidates.test.mjs \
  preview/theaetetus-import.test.mjs preview/check.test.mjs

#!/usr/bin/env bash
# Reproducibly derive name metadata; do not publish text or temporary JSON.
set -euo pipefail
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT
for spec in "meno:tlg024" "theaetetus:tlg006" "sophist:tlg007"; do
  IFS=: read -r work id <<< "$spec"
  curl --fail --location --silent --show-error --retry 3 \
    "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/$id/tlg0059.$id.perseus-grc2.xml" \
    -o "$TEMP/$work.xml"
  python -m "research.${work}_name_scan" "$TEMP/$work.xml" \
    --expected "research/${work}_expected.json" --output "$TEMP/$work.json"
done
node --experimental-strip-types preview/build.mjs \
  "$TEMP/meno.json" "$TEMP/theaetetus.json" "$TEMP/sophist.json"
node --experimental-strip-types --test \
  preview/merge-candidates.test.mjs preview/theaetetus-import.test.mjs \
  preview/sophist-import.test.mjs preview/check.test.mjs

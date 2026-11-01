#!/usr/bin/env bash
# Both CI and Pages call the same source/audit/build sequence. No Greek source
# data is copied to published files or committed to Git.
set -euo pipefail
source_url='https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml'
temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
curl --fail --location --silent --show-error --retry 3 "$source_url" -o "$temporary/meno.xml"
python research/meno_name_scan.py "$temporary/meno.xml" \
  --expected research/meno_expected.json --output "$temporary/meno-candidates.json"
node --experimental-strip-types preview/build.mjs "$temporary/meno-candidates.json"
node --experimental-strip-types --test preview/merge-candidates.test.mjs preview/check.test.mjs

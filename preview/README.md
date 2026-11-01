# Three-dialogue preview and reusable scanner

A single Greek TEI parser and named-reference scanner is now shared by the
*Meno*, *Theaetetus*, and *Sophist*, with separate dialogue-specific
dictionaries of names and exclusions and independently audited Stephanus
citation inventories.

Build and test: `bash preview/build-with-meno.sh` from the repository
root. The historical script name now runs all three dialogues.

The *Sophist* scan identifies Parmenides, Zeno of Elea, Xenophanes, and
Homer by name, ten occurrences in eight cited sections. The adjective
describing Protagorean writings at 232d and the named traditions at 242d
are excluded from **explicit individual-name** counts and remain
candidates for later investigation of philosophical allusions.

Expected preview: 74 records, 15 distinct people, 72 machine suggestions,
1 human text-checked record, and 0 fully verified engagements.
No existing scholarly status is promoted by the detector.

Only index.html, LICENSE.txt, and .nojekyll are deployed: temporary Greek
source texts, English translations, and intermediate JSON are not
published. The index is prepared during GitHub deployment, not on visits.

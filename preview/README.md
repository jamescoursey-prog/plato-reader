# Public research-index preview: Meno + Theaetetus

During deployment (not when a visitor opens the site), GitHub downloads
two pinned Perseus Greek TEI files into a temporary working directory.
Both scanner programs validate the data against per-dialogue name inventories.
The build then merges their generated metadata with the independently curated
records and publishes only index.html, LICENSE.txt and .nojekyll.

Run the same build as CI and GitHub Pages with:

```sh
bash preview/build-with-meno.sh
```

The original script name is retained for compatibility, although it now
runs both dialogues.

The preview includes 64 distinct (dialogue, section, person) records, 13
indexed people, 1 text-checked record, and 0 verified engagements:
62 scanner candidates plus two existing research records. The human
text check on *Meno* 76c-d takes precedence over the machine match;
the earlier *Theaetetus* 152e candidate is also preserved. No machine
candidate is automatically text-checked, and the plural name of Melissus
at 180e remains an explicitly identified research ambiguity.

The published page includes no original Greek passage, English translation
or copyrighted TLG text. Source citations and the MIT upstream notice
remain present. These inventories do not establish corpus completeness.

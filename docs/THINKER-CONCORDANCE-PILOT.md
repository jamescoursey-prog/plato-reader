# Historical Thinkers Concordance — Pilot

Development branch: `feature/thinker-concordance-pilot`

## Research purpose

Build a passage-level, auditable index of Plato's engagement with historical
thinkers, their doctrines, and arguments. Initial methodological scope:
the user's selected **26 dialogues ending with Critias**, excluding *Laws*
and other later/extra works. The application can retain the parent reader's
broader corpus without treating those additional works as research results.

## What this first change does

- Adds a **Thinkers** navigation item and `/thinkers` research-pilot page.
- Adds a typed, source-first data model, a single Empedocles/*Meno* 76c–d
  research record (now **text checked**), a reader deep link, and a filter.
- Adds tests ensuring candidate observations do not inflate certified
  thinker counts. Even a `verified` flag is insufficient without explicit
  provenance and a reviewer field.
- **Does not** perform text extraction, independently collate the Greek,
  complete a scholarly validation, reproduce Greek source text, or make claims
  of complete corpus coverage.
- **Does not** import numerical claims from the earlier conversational
  concordance. The old P1–P737 register is exploratory and unaudited.

## Sources and licensing

Preserve the original copyright and MIT notice. This repository's TLG-derived
Greek build input is **not included** in the fork. Review `sources/INVENTORY.md`
and `app/src/pages/attribution.astro` before downloading, copying,
publishing, or redistributing source data. A working build of the public
Greek/English reader requires additional corpus preparation, which this PR
does not attempt. No source passages are redistributed in this pilot.

The original application has its own canonical domain/CNAME configuration.
**Do not enable public deployment of the fork unchanged.** Before deployment,
use a fork-specific domain, base URL, branding, and notices.

## What a future 'verified' research record requires

1. Correct primary-text edition and retrievable source identifier.
2. Precisely located Greek passage with independently checked transcription.
3. Historical-person identification including ambiguity assessment.
4. Scholarly attribution of the doctrine or argument; label indirect
   identification differently from explicit naming.
5. Documented review by a named reviewer.
6. Independent extraction coverage audit and error/exception report.
7. Counts computed *only* from the stored records that pass verification.

The code's `isCountable` predicate checks field presence. It is a structural
gate; it **cannot** establish philological or historical truth.

## Checks

In a fully provisioned repository, run the normal application tests:
`cd app && npm ci && npm test`

The new model tests are in
`app/src/__tests__/thinker-concordance.test.ts`.

CI runs the app, shared-code, pipeline, and independent preview checks.
The preview is compiled from the same research records as the app.

## First passage check (2026-11-01)

The project researcher inspected Plato, *Meno* 76c–d at John Boyer's
Plato Reader: https://plato.johnhboyer.com/Meno/book/1/?trans=lamb .
The reader identifies John Burnet's Greek text (OCT, 1903) and
W. R. M. Lamb's English translation (Loeb, 1924). The project researcher
confirmed that Socrates explicitly names Empedocles and invokes effluences
and passages in the exchange concerning color. Record
`meno-76c-empedocles` is therefore `text_checked`, not `verified`.
The text is linked, not republished in the preview. Independent Greek
collation and scholarly assessment of the doctrinal relationship remain open.

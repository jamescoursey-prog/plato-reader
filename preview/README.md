# Rights-limited visual preview

This is a **standalone research-interface preview**, not a publication of the
entire forked Plato Reader. It is generated from
\`app/src/lib/thinker-concordance.ts\`, so its records and candidate/verified
counts share the application's existing data model.

Build: \`node --experimental-strip-types preview/build.mjs\`
Test: \`node --experimental-strip-types --test preview/check.test.mjs\`

CI runs both commands with Node 22 and uploads exactly three files from
\`preview/dist/\`: \`index.html\`, \`LICENSE.txt\`, and \`.nojekyll\`.

No TLG data or Loeb English text is copied. No inherited font or image files,
custom domain, feedback addresses, or public app build outputs are included.
External links lead to Boyer's independently hosted reader. The required
original MIT notice is included for attribution. Individual original research
claims are still unverified until the audit requirements are satisfied.

GitHub Pages is **not enabled or published by this commit**. Publishing is a
separate, explicit configuration step after CI verifies the generated output.

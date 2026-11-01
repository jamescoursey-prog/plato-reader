// Rights-limited public preview. Build with Node 22:
// node --experimental-strip-types preview/build.mjs
// Deliberately does not load the fork's Greek/English corpus or generated data.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  THINKERS, ENGAGEMENTS, PILOT_WORKS,
  verifiedEngagements, distinctVerifiedThinkerCount,
} from '../app/src/lib/thinker-concordance.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = resolve(here, 'dist');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderRecord(e) {
  const person = THINKERS.find((p) => p.id === e.thinkerId);
  if (!person) throw new Error('Unresolved thinker ID: ' + e.thinkerId);
  const statusLabels = {
    candidate: 'Awaiting source verification',
    text_checked: 'Text checked; review pending',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  const types = {
    explicit_name: 'Explicit name — proposed',
    indirect_allusion: 'Indirect identification — proposed',
    incidental_mention: 'Passing mention — excluded from engagement counts',
  };
  const status = statusLabels[e.status];
  const kind = types[e.kind];
  if (!status || !kind) throw new Error('Invalid record status or kind: ' + e.id);
  const search = [person.name, person.greekName, e.workId, e.stephanus,
    e.doctrinalClaim, e.interpretiveNote].join(' ').toLocaleLowerCase();
  const reader = new URL('/' + encodeURIComponent(e.workId) +
    '/book/1?loc=' + encodeURIComponent(e.startSection),
    'https://plato.johnhboyer.com');
  return [
    '<article class="record" data-record data-search="' + escapeHtml(search) + '">',
    '<div class="record-title"><div>',
    '<p class="eyebrow">' + escapeHtml(e.workId) + ' · ' + escapeHtml(e.stephanus) + '</p>',
    '<h3>' + escapeHtml(person.name) + ' <span lang="grc">' +
      escapeHtml(person.greekName) + '</span></h3>',
    '</div><span class="status">' + escapeHtml(status) + '</span></div>',
    '<p class="kind">' + escapeHtml(kind) + '</p>',
    '<p class="claim">' + escapeHtml(e.doctrinalClaim) + '</p>',
    '<p class="note">' + escapeHtml(e.interpretiveNote) + '</p>',
    '<dl class="audit">',
    '<div><dt>Greek text</dt><dd>' +
      (e.primaryGreekExcerpt && e.status !== 'candidate' ? 'Review record available' : 'Not independently checked') +
      '</dd></div>',
    '<div><dt>Primary edition</dt><dd>' + escapeHtml(e.sourceEdition || 'Pending') + '</dd></div>',
    '<div><dt>Scholarly reference</dt><dd>' + escapeHtml(e.scholarlyReference || 'Pending') + '</dd></div>',
    '<div><dt>Reviewer</dt><dd>' + escapeHtml(e.reviewedBy || 'Pending') + '</dd></div>',
    '</dl>',
    '<p class="review">' + escapeHtml(e.reviewNote || 'No review note entered.') + '</p>',
    '<a class="reader" href="' + escapeHtml(reader.href) +
      '" target="_blank" rel="noopener noreferrer">Read in John Boyer’s Plato Reader ↗</a>',
    '</article>',
  ].join('\n');
}

let html = await readFile(resolve(here, 'template.html'), 'utf8');
const replacements = {
  '%%CANDIDATES%%': String(ENGAGEMENTS.filter((e) => e.status === 'candidate').length),
  '%%VERIFIED%%': String(verifiedEngagements(ENGAGEMENTS).length),
  '%%PEOPLE%%': String(distinctVerifiedThinkerCount(ENGAGEMENTS)),
  '%%PILOT_WORKS%%': escapeHtml(PILOT_WORKS.join(' · ')),
  '%%RECORDS%%': ENGAGEMENTS.map(renderRecord).join('\n'),
  '%%TOTAL%%': String(ENGAGEMENTS.length),
};
for (const [key, value] of Object.entries(replacements)) {
  if (!html.includes(key)) throw new Error('Template missing marker ' + key);
  html = html.replaceAll(key, () => value);
}
if (/%%[A-Z_]+%%/.test(html)) throw new Error('Unresolved template marker');

const readme = await readFile(resolve(root, 'README.md'), 'utf8');
const mitIndex = readme.indexOf('Copyright © 2026 John Boyer');
if (mitIndex < 0) throw new Error('MIT attribution not present in source; aborting');
const license = 'Plato Reader software — https://github.com/johnhboyer-sys/plato-reader\n\n'
  + readme.slice(mitIndex).trim() + '\n';

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, 'index.html'), html);
await writeFile(resolve(dist, 'LICENSE.txt'), license);
await writeFile(resolve(dist, '.nojekyll'), '');
console.log('Preview generated:', ENGAGEMENTS.length, 'research records,',
  verifiedEngagements(ENGAGEMENTS).length, 'verified');

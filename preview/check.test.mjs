import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, verifiedEngagements } from '../app/src/lib/thinker-concordance.ts';
const dir = dirname(fileURLToPath(import.meta.url));
const html = await readFile(join(dir, 'dist/index.html'), 'utf8');
const license = await readFile(join(dir, 'dist/LICENSE.txt'), 'utf8');
describe('rights-limited automated concordance preview', () => {
  it('contains only three publishable files (not the input Greek corpus)', async () => {
    assert.deepEqual((await readdir(join(dir, 'dist'))).sort(),
      ['index.html', 'LICENSE.txt', '.nojekyll'].sort());
  });
  it('preserves the existing Meno text check and Theaetetus provisional record', () => {
    assert.equal(ENGAGEMENTS.length, 2);
    assert.equal(ENGAGEMENTS[0].status, 'text_checked');
    assert.equal(ENGAGEMENTS[1].status, 'candidate');
    assert.equal(verifiedEngagements(ENGAGEMENTS).length, 0);
    assert.match(html, /Text checked; review pending/);
    assert.match(html, /W\. R\. M\. Lamb/);
    assert.match(html, /Theaetetus · 152e/);
    assert.equal((html.match(/Meno · 76c–d/g) ?? []).length, 1);
  });
  it('contains all 16 new Meno candidates without duplicating Empedocles 76c', () => {
    assert.match(html, /16 machine-generated Meno candidates/);
    assert.match(html, />18<\/span><span class="label">Passage records/);
    assert.match(html, />7<\/span><span class="label">Thinkers indexed/);
    assert.match(html, />1<\/span><span class="label">Text-checked records/);
    assert.match(html, />0<\/span><span class="label">Verified engagements/);
    assert.match(html, /Showing 18 research record/);
    for (const name of ['Gorgias', 'Prodicus', 'Pindar', 'Protagoras', 'Theognis', 'Homer']) {
      assert.match(html, new RegExp('<h3>' + name));
    }
    assert.match(html, /Machine-generated candidate/);
  });
  it('deep-links both checked and automatically discovered candidates', () => {
    assert.match(html, /https:\/\/plato\.johnhboyer\.com\/Meno\/book\/1\/\?trans=lamb&amp;loc=76c/);
    assert.match(html, /https:\/\/plato\.johnhboyer\.com\/Meno\/book\/1\/\?loc=75e/);
    assert.match(html, /https:\/\/plato\.johnhboyer\.com\/Theaetetus\/book\/1\/\?loc=152e/);
  });
  it('retains attribution, and excludes inherited reading data, fonts, and domains', () => {
    assert.match(license, /Copyright © 2026 John Boyer/);
    assert.match(license, /Permission is hereby granted/);
    assert.match(html, /John H. Boyer/);
    assert.match(html, /Perseus Digital Library/);
    assert.match(html, /canonical-greekLit/);
    assert.doesNotMatch(html, /<script[^>]+src=/);
    assert.doesNotMatch(html, /<link[^>]+(?:woff|fonts)/);
    assert.doesNotMatch(html, /<iframe/);
    assert.doesNotMatch(html, /<base /);
    assert.doesNotMatch(html, /<title>.*plato\.johnhboyer\.com/);
  });
});

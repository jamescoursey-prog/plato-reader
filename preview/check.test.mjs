import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, verifiedEngagements } from '../app/src/lib/thinker-concordance.ts';
const dir = dirname(fileURLToPath(import.meta.url));
const html = await readFile(join(dir, 'dist/index.html'), 'utf8');
const license = await readFile(join(dir, 'dist/LICENSE.txt'), 'utf8');
describe('license-limited preview build', () => {
  it('contains exactly the expected three publishable files', async () => {
    assert.deepEqual((await readdir(join(dir,'dist'))).sort(),
      ['index.html','LICENSE.txt','.nojekyll'].sort());
  });
  it('contains the app’s research records without counting unverified evidence', () => {
    assert.equal(ENGAGEMENTS.length,1);
    assert.equal(verifiedEngagements(ENGAGEMENTS).length,0);
    assert.match(html,/Awaiting source verification/);
    assert.match(html,/Showing 1 research record/);
  });
  it('uses an external reader deep link', () => {
    assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Meno\/book\/1\?loc=76c/);
  });
  it('retains author and license notice', () => {
    assert.match(license,/Copyright © 2026 John Boyer/);
    assert.match(license,/Permission is hereby granted/);
    assert.match(html,/John H. Boyer/);
  });
  it('does not publish inherited reading data or custom-domain configuration', () => {
    assert.doesNotMatch(html,/<script[^>]+src=/);
    assert.doesNotMatch(html,/<link[^>]+(?:woff|fonts)/);
    assert.doesNotMatch(html,/<iframe/);
    assert.doesNotMatch(html,/<base /);
  });
});

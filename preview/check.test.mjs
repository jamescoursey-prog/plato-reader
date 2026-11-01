import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, verifiedEngagements } from '../app/src/lib/thinker-concordance.ts';

const dir=dirname(fileURLToPath(import.meta.url));
const html=await readFile(join(dir,'dist/index.html'),'utf8');
const license=await readFile(join(dir,'dist/LICENSE.txt'),'utf8');
describe('two-dialogue provenance-limited preview',()=>{
  it('publishes only the expected three files and never the Greek source',async()=>{
    assert.deepEqual((await readdir(join(dir,'dist'))).sort(),
      ['index.html','LICENSE.txt','.nojekyll'].sort());
  });
  it('retains the independent Meno text check and Theaetetus candidate',()=>{
    assert.equal(ENGAGEMENTS.length,2);
    assert.equal(ENGAGEMENTS[0].status,'text_checked');
    assert.equal(ENGAGEMENTS[1].status,'candidate');
    assert.equal(verifiedEngagements(ENGAGEMENTS).length,0);
    assert.match(html,/Text checked; review pending/);
    assert.equal((html.match(/Meno · 76c–d/g)??[]).length,1);
    assert.equal((html.match(/Theaetetus · 152e/g)??[]).length,6);
  });
  it('distinguishes passage candidates from unique persons and verification',()=>{
    assert.match(html,/62 machine-generated candidates from Meno and Theaetetus/);
    assert.match(html,/>64<\/span><span class="label">Passage records/);
    assert.match(html,/>13<\/span><span class="label">Thinkers indexed/);
    assert.match(html,/>1<\/span><span class="label">Text-checked records/);
    assert.match(html,/>0<\/span><span class="label">Verified engagements/);
    assert.match(html,/Showing 64 research record/);
    for(const name of ['Heraclitus','Parmenides','Epicharmus','Thales','Melissus','Hesiod']){
      assert.match(html,new RegExp('<h3>'+name));
    }
    assert.match(html,/The plural form may refer to a school or tradition/);
  });
  it('links to readers and credits both pinned source editions',()=>{
    assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Meno\/book\/1\/\?loc=75e/);
    assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Theaetetus\/book\/1\/\?loc=174a/);
    assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Theaetetus\/book\/1\/\?loc=152e/);
    assert.match(html,/tlg0059\.tlg024\.perseus-grc2/);
    assert.match(html,/tlg0059\.tlg006\.perseus-grc2/);
  });
  it('preserves the MIT notice and omits inherited reading content and assets',()=>{
    assert.match(license,/Copyright © 2026 John Boyer/);
    assert.match(html,/Perseus Digital Library/);
    assert.doesNotMatch(html,/<script[^>]+src=/);
    assert.doesNotMatch(html,/<link[^>]+(?:woff|fonts)/);
    assert.doesNotMatch(html,/<iframe/);
    assert.doesNotMatch(html,/<base /);
  });
});

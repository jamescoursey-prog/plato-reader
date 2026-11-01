import {readFile,readdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {ENGAGEMENTS,verifiedEngagements} from '../app/src/lib/thinker-concordance.ts';
const dir=dirname(fileURLToPath(import.meta.url));
const html=await readFile(join(dir,'dist/index.html'),'utf8');
const license=await readFile(join(dir,'dist/LICENSE.txt'),'utf8');
describe('three-dialogue metadata-only preview',()=>{
 it('publishes exactly three files, excluding source text',async()=>{
  assert.deepEqual((await readdir(join(dir,'dist'))).sort(),
    ['index.html','LICENSE.txt','.nojekyll','master-index.html','master-index.csv'].sort());
 });
 it('retains original reviewed records independently of machine candidates',()=>{
  assert.equal(ENGAGEMENTS.length,2);
  assert.equal(ENGAGEMENTS[0].status,'text_checked');
  assert.equal(ENGAGEMENTS[1].status,'candidate');
  assert.equal(verifiedEngagements(ENGAGEMENTS).length,0);
  assert.equal((html.match(/Meno · 76c–d/g)??[]).length,1);
  assert.equal((html.match(/Theaetetus · 152e/g)??[]).length,6);
 });
 it('adds ten Sophist candidates with the expected status counters',()=>{
  assert.match(html,/72 machine-generated candidates from Meno, Theaetetus, and Sophist/);
  assert.match(html,/>74<\/span><span class="label">Passage records/);
  assert.match(html,/>15<\/span><span class="label">Thinkers indexed/);
  assert.match(html,/>1<\/span><span class="label">Text-checked records/);
  assert.match(html,/>0<\/span><span class="label">Verified engagements/);
  assert.match(html,/Showing 74 research record/);
  assert.match(html,/Sophist · 242d/);
  for(const name of ['Zeno of Elea','Xenophanes','Parmenides','Homer'])
    assert.match(html,new RegExp('<h3>'+name));
 });
 it('links externally to reader and cites all three Greek editions',()=>{
  assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Meno\/book\/1\/\?loc=75e/);
  assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Theaetetus\/book\/1\/\?loc=174a/);
  assert.match(html,/https:\/\/plato\.johnhboyer\.com\/Sophist\/book\/1\/\?loc=242d/);
  assert.match(html,/tlg0059\.tlg024\.perseus-grc2/);
  assert.match(html,/tlg0059\.tlg006\.perseus-grc2/);
  assert.match(html,/tlg0059\.tlg007\.perseus-grc2/);
 });
 it('retains MIT attribution and excludes inherited content and fonts',()=>{
  assert.match(license,/Copyright © 2026 John Boyer/);
  assert.match(html,/Perseus Digital Library/);
  assert.doesNotMatch(html,/<script[^>]+src=/);
  assert.doesNotMatch(html,/<link[^>]+(?:woff|fonts)/);
  assert.doesNotMatch(html,/<iframe/);
  assert.doesNotMatch(html,/<base /);
 });
});

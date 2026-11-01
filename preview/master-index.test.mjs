import {readFile,readdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'dist');
const html=await readFile(resolve(dir,'master-index.html'),'utf8');
const csv=await readFile(resolve(dir,'master-index.csv'),'utf8');
describe('26-dialogue, 31-name master index',()=>{
 it('shows the complete fixed roster and full corpus',()=>{
  assert.match(html,/data-roster-size="31"/);
  assert.match(html,/data-works-scanned="26"/);
  assert.equal((html.match(/class="person"/g)||[]).length,31);
  assert.equal((html.match(/Greek source<\/a><\/li>/g)||[]).length,26);
 });
 it('separates provisional name matches from reviewed pilot records',()=>{
  assert.match(html,/Provisional/);
  assert.match(html,/id="person-parmenides"/);
  assert.match(html,/id="person-anaxagoras"/);
  assert.match(html,/master-index\.csv/);
  assert.match(html,/Euthydemus son of Cephalus/);
  assert.match(html,/Euthydemus son of Diocles/);
  assert.match(html,/Cratylus/);
  assert.match(html,/861<\/strong>/);
  assert.match(html,/id="person-melissus"/);
  assert.match(html,/Melissuses/);
  assert.match(html,/31 roster members received a name-identity risk screen/);
  assert.match(html,/source-checked historical identification/);
  assert.match(html,/scholarly identity cautions/);
 });
 it('exports only short citation metadata',()=>{
  const lines=csv.trim().split('\n');
  assert.match(lines[0],/"thinker","category","dialogue","stephanus"/);
  assert.match(lines[0],/"reader_url","identity_review_status"/);
  assert.equal(lines.length-1,861);
  assert.match(csv,/https:\/\/plato\.johnhboyer\.com\/Republic\/book\/10\/\?loc=600a/);
  assert.match(csv,/Melissus of Samos/);
  assert.match(csv,/source_checked/);
  assert.match(csv,/collective_plural_candidate/);
  assert.ok(lines.length>10);
  assert.ok(lines.every(line=>line.length<1500));
 });
 it('contains exactly one direct citation link per candidate, with correct Republic books',()=>{
  const citations=[...html.matchAll(/<a href="https:\/\/plato\.johnhboyer\.com\/[^"]+\?loc=\d+[a-e]"[^>]+title="[^"]+">/g)];
  assert.equal(citations.length,861);
  assert.match(html,/Republic\/book\/1\/\?loc=336b/);
  assert.match(html,/Republic\/book\/2\/\?loc=357a/);
  assert.match(html,/Republic\/book\/8\/\?loc=545a/);
  assert.match(html,/Republic\/book\/10\/\?loc=600a/);
 });
 it('is a responsive, metadata-only page with a usable search control',()=>{
  assert.match(html,/name="viewport"/);
  assert.match(html,/@media\(max-width:650px\)/);
  assert.match(html,/id="find"/);
  assert.match(html,/addEventListener\(["']input["'],search\)/);
  assert.match(html,/noopener noreferrer/);
  assert.doesNotMatch(html,/<iframe|<script[^>]+src=|<link[^>]+\.woff/);
 });
 it('publishes only expected metadata files',async()=>{
  assert.deepEqual((await readdir(dir)).sort(),
   ['.nojekyll','LICENSE.txt','index.html','master-index.csv','master-index.html'].sort());
 });
});

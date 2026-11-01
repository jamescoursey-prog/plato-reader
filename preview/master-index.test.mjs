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
 });
 it('exports only short citation metadata',()=>{
  const lines=csv.trim().split('\n');
  assert.match(lines[0],/"thinker","category","dialogue","stephanus"/);
  assert.ok(lines.length>10);
  assert.ok(lines.every(line=>line.length<1500));
 });
 it('publishes only expected metadata files',async()=>{
  assert.deepEqual((await readdir(dir)).sort(),
   ['.nojekyll','LICENSE.txt','index.html','master-index.csv','master-index.html'].sort());
 });
});

import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import { importAuditedDialogue } from './theaetetus-import.mjs';
import { ENGAGEMENTS,THINKERS } from '../app/src/lib/thinker-concordance.ts';
const make=()=>({
 work:'Sophist',sections_scanned:262,
 text_urn:'urn:cts:greekLit:tlg0059.tlg007.perseus-grc2',
 source_url:'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg007/tlg0059.tlg007.perseus-grc2.xml',
 unclassified_capitalized_tokens:[],total_name_occurrences:3,distinct_mentioned_sections:2,
 intellectual_identities:[
   {id:'parmenides',name:'Parmenides',category:'philosopher',occurrences:2,sections:['216a','237a']},
   {id:'zeno',name:'Zeno of Elea',category:'philosopher',occurrences:1,sections:['216a']}],
 mentions:[
   {id:'parmenides',locus:'216a',token:'Παρμενίδην'},
   {id:'zeno',locus:'216a',token:'Ζήνωνα'},
   {id:'parmenides',locus:'237a',token:'Παρμενίδης'}]
});
describe('generic additional-dialogue importer',()=>{
 it('generates unreviewed, citation-specific Sophist candidates',()=>{
  const rows=importAuditedDialogue(make(),ENGAGEMENTS,THINKERS);
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(e=>e.startSection),['216a','237a','216a']);
  assert.ok(rows.every(e=>e.status==='candidate'&&e.reviewedBy===undefined));
  assert.ok(rows.every(e=>e.primaryGreekExcerpt===undefined&&e.scholarlyReference===undefined));
 });
 it('curated record outranks an automated duplicate',()=>{
  const manual={workId:'Sophist',startSection:'216a',thinkerId:'zeno',id:'checked',status:'text_checked'};
  const rows=importAuditedDialogue(make(),[...ENGAGEMENTS,manual],THINKERS);
  assert.equal(rows.length,2);
  assert.equal(rows.some(e=>e.thinkerId==='zeno'),false);
 });
 it('rejects mismatched source or incomplete audit',()=>{
  const bad=make();bad.source_url='https://example.org/';
  assert.throws(()=>importAuditedDialogue(bad,ENGAGEMENTS,THINKERS),/audit/);
  const wrong=make();wrong.total_name_occurrences=9;
  assert.throws(()=>importAuditedDialogue(wrong,ENGAGEMENTS,THINKERS),/totals/);
  const dup=make();dup.intellectual_identities[0].sections=['216a','216a'];
  assert.throws(()=>importAuditedDialogue(dup,ENGAGEMENTS,THINKERS),/Duplicate/);
 });
});

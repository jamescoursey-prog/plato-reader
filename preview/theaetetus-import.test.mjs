import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import { importTheaetetus } from './theaetetus-import.mjs';
import { ENGAGEMENTS,THINKERS } from '../app/src/lib/thinker-concordance.ts';
const report=()=>({
  work:'Theaetetus',sections_scanned:343,
  text_urn:'urn:cts:greekLit:tlg0059.tlg006.perseus-grc2',
  source_url:'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg006/tlg0059.tlg006.perseus-grc2.xml',
  unclassified_capitalized_tokens:[],total_name_occurrences:2,distinct_mentioned_sections:2,
  intellectual_identities:[
    {id:'empedocles',name:'Empedocles',category:'philosopher',occurrences:1,sections:['152e']},
    {id:'thales',name:'Thales',category:'philosopher',occurrences:1,sections:['174a']}],
  mentions:[
    {id:'empedocles',locus:'152e',token:'Ἐμπεδοκλῆς'},
    {id:'thales',locus:'174a',token:'Θαλῆν'}
  ]
});
describe('Theaetetus metadata-only importer',()=>{
  it('does not overwrite or duplicate the existing Empedocles record',()=>{
    const generated=importTheaetetus(report(),ENGAGEMENTS,THINKERS);
    assert.equal(generated.length,1);
    assert.equal(generated[0].id,'auto-theaetetus-174a-thales');
    assert.equal(generated[0].status,'candidate');
    assert.equal(generated[0].primaryGreekExcerpt,undefined);
    assert.equal(generated[0].reviewedBy,undefined);
  });
  it('refuses untrusted data, missing names, or changed totals',()=>{
    const wrong=report();wrong.total_name_occurrences=3;
    assert.throws(()=>importTheaetetus(wrong,ENGAGEMENTS,THINKERS),/totals/);
    const bad=report();bad.source_url='https://other.example';
    assert.throws(()=>importTheaetetus(bad,ENGAGEMENTS,THINKERS),/audit/);
    const blank=report();blank.mentions[1].id='unregistered';
    assert.throws(()=>importTheaetetus(blank,ENGAGEMENTS,THINKERS),/Invalid Greek/);
  });
});

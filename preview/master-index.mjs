// Static, metadata-only 31-name index for the fixed 26-dialogue corpus.
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readerHref} from './reader-link.mjs';
if(process.argv.length!==3)throw Error('Usage: node preview/master-index.mjs <scanner-report.json>');
const data=JSON.parse(await readFile(process.argv[2],'utf8'));
const REV='a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00';
if(data.version!=='0.1'||data.source_revision!==REV||data.works_scanned!==26||
   data.roster_size!==31||data.people?.length!==31||data.sources?.length!==26||
   !Array.isArray(data.matches))throw Error('Wrong master index corpus or roster');
const people=new Map(data.people.map(p=>[p.id,p]));
const sources=new Map(data.sources.map(s=>[s.work,s]));
const matches=new Map(data.people.map(p=>[p.id,[]]));
if(!Array.isArray(data.documented_identity_checks)||!Array.isArray(data.historicity_notes))
 throw Error('Missing historical-identity review inventory');
const checks=new Map(data.documented_identity_checks.map(x=>[x.person_id+':'+x.work+':'+x.section,x]));
const cautions=new Map(data.historicity_notes.map(x=>[x.person_id,x]));
if(!Array.isArray(data.roster_identity_triage)||data.roster_identity_triage.length!==31||
   !Array.isArray(data.collective_name_candidates))throw Error('Missing full identity triage');
const triage=new Map(data.roster_identity_triage.map(x=>[x.id,x]));
if(triage.size!==31||data.people.some(x=>!triage.has(x.id)))throw Error('Incomplete identity screening');
const plurals=new Map(data.collective_name_candidates.map(x=>[x.person_id+':'+x.work+':'+x.section,x]));
if(!Array.isArray(data.identity_exclusions)||!Array.isArray(data.lowercase_name_exceptions)||
   data.identity_exclusions.length!==2||data.lowercase_name_exceptions.length!==3)
  throw Error('Missing independently audited identity exceptions');

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const s of data.sources){
 const prefix='https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/'+REV+'/data/tlg0059/';
 if(!s.source_url?.startsWith(prefix)||!/tlg0059\.tlg\d{3}\.perseus-grc[12]\.xml$/.test(s.source_url))throw Error('Unpinned Greek source '+s.work);
}
for(const match of data.matches){
 if(!people.has(match.person_id)||!sources.has(match.work)||
    !/^\d{1,3}[a-e]$/.test(match.section)||!Array.isArray(match.tokens)||
    !Number.isInteger(match.occurrences)||match.occurrences<1)throw Error('Invalid citation candidate');
 matches.get(match.person_id).push(match);
}
const link=readerHref;
const groups=[['presocratic','Presocratic and Pythagorean philosophers'],['sophist','Sophists and rhetorical teachers'],['poet','Poets and intellectual authorities']];
function renderPerson(p){
 const found=matches.get(p.id);
 const byWork=new Map();
 for(const row of found){
  if(!byWork.has(row.work))byWork.set(row.work,[]);
  byWork.get(row.work).push(row);
 }
 const citations=[...byWork.entries()].sort((a,b)=>sources.get(a[0]).order-sources.get(b[0]).order)
 .map(([work,rows])=>'<li><strong><i>'+esc(work)+'</i></strong>: '+
   rows.map(m=>{
     const review=checks.get(p.id+':'+work+':'+m.section);
     const plural=plurals.get(p.id+':'+work+':'+m.section);
     const title=m.tokens.join(', ')+(review?' — identity checked at this passage':plural?' — collective plural, provisional':' — unreviewed name candidate');
     return '<a href="'+esc(link(work,m.section))+'" target="_blank" rel="noopener noreferrer" title="'+esc(title)+'">'+esc(m.section)+'</a>'+
       (review?'<sup title="Identity checked at this passage; other references remain provisional">✓</sup>':'');
   }).join(', ')+
   '</li>').join('\n');
 return '<article class="person" id="person-'+esc(p.id)+'"><header><h3>'+esc(p.name)+'</h3>'+
   '<span class="count">'+found.length+' cited sections in '+p.dialogues+' dialogues</span></header>'+
   (triage.get(p.id)?.risk!=='low'?'<p class="muted"><strong>Identity audit:</strong> '+
    esc(triage.get(p.id)?.note||'Review context carefully')+'</p>':'')+
   (cautions.get(p.id)?'<p class="muted"><strong>Historical caution:</strong> '+esc(cautions.get(p.id).note)+
    ' <a href="'+esc(cautions.get(p.id).reference)+'" target="_blank" rel="noopener noreferrer">Scholarly source</a></p>':'')+
   (citations?'<ul>'+citations+'</ul>':'<p class="muted">No matches in this restricted scan; this does not establish absence.</p>')+
   '</article>';
}
const sections=groups.map(([id,label])=>'<section class="group"><h2>'+esc(label)+'</h2>'+
  data.people.filter(p=>p.group===id).map(renderPerson).join('\n')+'</section>').join('\n');
const scanned=data.sources.map(s=>'<li><i>'+esc(s.work)+'</i> — '+s.name_occurrences+
  ' word matches · <a href="'+esc(s.source_url)+'" target="_blank" rel="noopener noreferrer">Greek source</a></li>').join('\n');
const html=['<!doctype html><html lang="en"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width, initial-scale=1">',
 '<meta name="robots" content="noindex,nofollow">',
 '<title>Master Thinker Index — Plato Concordance</title>',
 '<style>:root{--bg:#f6f2eb;--ink:#282923;--muted:#615c55;--rule:#d3ccc0;--link:#874a3a}',
 'body{margin:0;background:var(--bg);color:var(--ink);font:1.08rem/1.5 Georgia,serif}',
 '.wrap{width:min(1020px,calc(100% - 2.5rem));margin:auto}',
 'nav{padding:1rem 0;border-bottom:1px solid var(--rule);display:flex;flex-wrap:wrap;gap:.5rem 1.5rem}',
 'a{color:var(--link);text-underline-offset:3px}',
 'h1{font-size:clamp(2.3rem,5vw,3.6rem);line-height:1.1;font-weight:400}',
 'h2{font-size:1.85rem;font-weight:400;margin:2.8rem 0 0;border-bottom:1px solid var(--rule)}',
 'h3{font-size:1.36rem;font-weight:400;margin:0}',
 '.hero{padding:2rem 0}.stats{display:flex;gap:2rem;flex-wrap:wrap;border-block:1px solid var(--rule);padding:1rem 0}',
 '.stats strong{display:block;font-size:2.2rem;font-weight:400}',
 '.stats span,.count,.muted,.caution{font:.87rem/1.5 system-ui,sans-serif;color:var(--muted)}',
 '.person{padding:1.1rem 0;border-bottom:1px solid var(--rule)}',
 '.person header{display:flex;gap:1rem;justify-content:space-between;align-items:baseline;flex-wrap:wrap}',
 '.person li{margin:.35rem 0}.person ul{padding-left:1.4rem}',
 '.disclaimer{border-left:3px solid var(--rule);padding:.4rem 1rem}',
 'input{width:100%;box-sizing:border-box;border:1px solid var(--rule);padding:.85rem;font:1rem system-ui,sans-serif}',
 '.person[hidden],.group[hidden]{display:none}.scans{columns:2;line-height:1.9}',
 'footer{border-top:1px solid var(--rule);padding:2rem 0;margin-top:3rem}',
 '@media(max-width:650px){.scans{columns:1}}',
 '</style></head>',
 '<body data-roster-size="'+data.roster_size+'" data-works-scanned="'+data.works_scanned+'">',
 '<div class="wrap"><nav><a href="./">Plato Concordance</a><strong>Master thinker index · Version 1.0 candidate</strong></nav>',
 '<section class="hero"><p class="muted">PRELIMINARY NAME INDEX / 26-DIALOGUE CORPUS</p>',
 '<h1>Master thinker index</h1>',
 '<p>Explicit Greek name matches from a conservative roster of 31 intellectual figures, with Stephanus citations. The roster and its accepted Greek forms—not indiscriminate proper-name discovery—determine which candidates appear.</p>',
 '<div class="stats">',
 '<div><strong>'+data.works_scanned+'</strong><span>Dialogues scanned</span></div>',
 '<div><strong>'+data.roster_size+'</strong><span>Seed thinkers</span></div>',
 '<div><strong>'+data.people_with_hits+'</strong><span>Thinkers with matches</span></div>',
 '<div><strong>'+data.matched_sections+'</strong><span>Person–passage candidates</span></div>',
 '</div><p class="disclaimer"><strong>Provisional:</strong> These names and Stephanus references are automated candidates, not independently verified identities or philosophical engagements. Namesakes and missing Greek inflections require checking. Existing reviewed records are unchanged.</p>',
 '<p><a href="./master-index.csv">Download the candidate citations (CSV)</a></p>',
 '<p class="muted">All 31 roster members received a name-identity risk screen; individual citations remain provisional unless specifically checked. A checkmark ✓ beside a citation identifies a <em>specific, source-checked historical identification</em>, not an approval of every occurrence of that name. '+
 data.documented_identity_checks.length+' positive identifications are documented individually; '+data.historicity_notes.length+
 ' scholarly identity cautions are tracked.</p>',
 '<p class="muted">Source-checked corrections: '+data.identity_exclusions.length+
 ' references to namesakes excluded; '+data.lowercase_name_exceptions.length+
 ' lowercase proper names specifically checked (with additional Prodicus forms allowed after lexicon comparison). Other identifications remain provisional.</p>',
 '<details><summary>View the corrected historical identifications</summary><ul>'+
 data.identity_exclusions.map(x=>'<li><strong>'+esc(people.get(x.person_id)?.name||x.person_id)+
 ' — <i>'+esc(x.work)+'</i> '+esc(x.section)+'</strong>: this is '+
 esc(x.identified_as)+', not the listed thinker. <a href="'+
 esc(link(x.work,x.section))+'" target="_blank" rel="noopener noreferrer">Inspect the passage</a></li>').join('')+
 '</ul></details></section>',
 '<label for="find">Find a thinker</label>',
 '<input id="find" type="search" placeholder="Search thinker names..." autocomplete="off">',
 '<p id="shown" class="muted" aria-live="polite"></p>',
 sections,
 '<section><h2>All 26 dialogues scanned</h2><ol class="scans">'+scanned+'</ol></section>',
 '<footer><p>Source: <a href="https://github.com/PerseusDL/canonical-greekLit/tree/'+REV+'/data/tlg0059">Perseus Greek TEI at pinned revision '+REV+'</a>. Brief citation metadata only; no primary Greek passages or English translations are republished.</p>',
 '<p>The corpus ends with <i>Critias</i>. <i>Laws</i> is excluded. Version 1.0 release candidate; no claim of exhaustive scholarly verification.</p></footer></div>',
 '<script>const input=document.getElementById("find"),people=[...document.querySelectorAll(".person")];',
 'function search(){const query=input.value.toLowerCase().trim();let n=0;',
 'for(const p of people){p.hidden=!p.querySelector("h3").textContent.toLowerCase().includes(query);if(!p.hidden)n++;}',
 'for(const g of document.querySelectorAll(".group"))g.hidden=![...g.querySelectorAll(".person")].some(p=>!p.hidden);',
 'document.getElementById("shown").textContent=n+" of "+people.length+" roster names";}',
 'input.addEventListener("input",search);search();</script></body></html>'].join('\n');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const rows=[['thinker','category','dialogue','stephanus','greek_forms','occurrences','review_flag','source_urn','reader_url','identity_review_status'].map(quote).join(',')];
for(const match of data.matches){
 const p=people.get(match.person_id),s=sources.get(match.work);
 const key=match.person_id+':'+match.work+':'+match.section;
 rows.push([p.name,p.group,match.work,match.section,match.tokens.join(' | '),match.occurrences,match.review_flag,s.urn,link(match.work,match.section),
   checks.has(key)?'source_checked':plurals.has(key)?'collective_plural_candidate':'candidate'].map(quote).join(','));
}
const dist=resolve(dirname(fileURLToPath(import.meta.url)),'dist');
await writeFile(resolve(dist,'master-index.html'),html,'utf8');
await writeFile(resolve(dist,'master-index.csv'),rows.join('\n')+'\n','utf8');
console.log('MASTER INDEX:',data.people_with_hits,'of',data.roster_size,'names;',
 data.matched_sections,'person-passages across',data.works_scanned,'dialogues');

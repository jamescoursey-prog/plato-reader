// One metadata-only importer for all post-Meno dialogues.
// Curated observations take precedence over machine-generated suggestions.
const REV='a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00';
const WORKS={Theaetetus:{id:'tlg006',sections:343},Sophist:{id:'tlg007',sections:262}};
export function importAuditedDialogue(report,existing,registry){
  const spec=WORKS[report?.work];
  const source=spec && 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/'+REV+
    '/data/tlg0059/'+spec.id+'/tlg0059.'+spec.id+'.perseus-grc2.xml';
  const urn=spec && 'urn:cts:greekLit:tlg0059.'+spec.id+'.perseus-grc2';
  if(!spec||report.source_url!==source||report.text_urn!==urn||
     report.sections_scanned!==spec.sections||!Array.isArray(report.mentions)||
     !Array.isArray(report.intellectual_identities)||
     !Array.isArray(report.unclassified_capitalized_tokens)||
     report.unclassified_capitalized_tokens.length!==0){
    throw Error('Source audit rejected for dialogue');
  }
  const people=new Map(registry.map(p=>[p.id,p]));
  const known=new Set(existing.map(e=>e.workId+':'+e.startSection+':'+e.thinkerId));
  const terms=new Map(),valid=s=>typeof s==='string'&&/^\d{1,3}[a-e]$/.test(s);
  for(const m of report.mentions){
    if(!people.has(m.id)||!valid(m.locus)||typeof m.token!=='string'||!m.token.trim())throw Error('Invalid Greek name match');
    const key=m.id+':'+m.locus,forms=terms.get(key)||[];
    forms.push(m.token);
    terms.set(key,forms);
  }
  if(report.mentions.length!==report.total_name_occurrences||
     new Set(report.mentions.map(m=>m.locus)).size!==report.distinct_mentioned_sections){
    throw Error('Dialogue name occurrence totals disagree');
  }
  const generated=[],seenPeople=new Set();
  let counted=0;
  for(const entity of report.intellectual_identities){
    if(seenPeople.has(entity.id)||people.get(entity.id)?.name!==entity.name||
       !Array.isArray(entity.sections)||!Number.isInteger(entity.occurrences)){
      throw Error('Invalid thinker summary');
    }
    seenPeople.add(entity.id);
    let n=0;
    const sections=new Set();
    for(const sec of entity.sections){
      if(!valid(sec)||sections.has(sec))throw Error('Duplicate or invalid Stephanus section');
      sections.add(sec);
      const words=terms.get(entity.id+':'+sec)||[];
      if(!words.length)throw Error('Missing Greek evidence');
      n+=words.length;
      const key=report.work+':'+sec+':'+entity.id;
      if(known.has(key))continue;
      known.add(key);
      const forms=[...new Set(words)].sort();
      generated.push({
        id:'auto-'+report.work.toLowerCase()+'-'+sec+'-'+entity.id,
        workId:report.work,stephanus:sec,startSection:sec,thinkerId:entity.id,
        kind:'explicit_name',status:'candidate',category:entity.category,
        extractionSourceUrl:source,extractionSourceURN:urn,detectedForms:forms,
        sourceEdition:'John Burnet, Platonis Opera (1903); Perseus Greek TEI, machine scanned',
        doctrinalClaim:'Automated proper-name match for '+entity.name+' at '+report.work+' '+sec+
          '. No philosophical interpretation assigned.',
        interpretiveNote:'Observed Greek form(s): '+forms.join(', ')+
          '. The passage requires examination.'+
          (entity.id==='melissus'?' The plural form may denote a school or tradition.':''),
        reviewNote:'Machine-generated candidate. No human source check or scholarly verification recorded.'
      });
    }
    if(n!==entity.occurrences||
       sections.size!==[...terms.keys()].filter(k=>k.startsWith(entity.id+':')).length){
      throw Error('Thinker citation totals disagree');
    }
    counted+=n;
  }
  if(counted!==report.mentions.length)throw Error('Unaccounted Greek name tokens');
  generated.sort((a,b)=>a.thinkerId.localeCompare(b.thinkerId)||
    Number.parseInt(a.startSection)-Number.parseInt(b.startSection)||a.startSection.localeCompare(b.startSection));
  return generated;
}
export function importTheaetetus(report,existing,registry){
  if(report?.work!=='Theaetetus')throw Error('Source audit rejected for Theaetetus');
  return importAuditedDialogue(report,existing,registry);
}

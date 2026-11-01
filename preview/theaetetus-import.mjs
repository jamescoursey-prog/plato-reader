// Import independently audited Theaetetus name matches as unreviewed candidates.
// Human-maintained records always take precedence.
export function importTheaetetus(report, existing, registry) {
  const revision='a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00';
  const url='https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/'+revision+
    '/data/tlg0059/tlg006/tlg0059.tlg006.perseus-grc2.xml';
  if(report?.work!=='Theaetetus'||report.text_urn!=='urn:cts:greekLit:tlg0059.tlg006.perseus-grc2'||
     report.source_url!==url||report.sections_scanned!==343||
     !Array.isArray(report.intellectual_identities)||!Array.isArray(report.mentions)||
     !Array.isArray(report.unclassified_capitalized_tokens)||
     report.unclassified_capitalized_tokens.length)throw Error('Theaetetus source audit rejected');
  const people=new Map(registry.map(p=>[p.id,p]));
  const known=new Set(existing.map(e=>e.workId+':'+e.startSection+':'+e.thinkerId));
  const mentions=new Map();
  const validLoc=s=>typeof s==='string'&&/^\d{1,3}[a-e]$/.test(s);
  for(const m of report.mentions){
    if(!people.has(m.id)||!validLoc(m.locus)||typeof m.token!=='string')throw Error('Invalid Greek name match');
    const key=m.id+':'+m.locus;
    const words=mentions.get(key)||[];
    words.push(m.token);
    mentions.set(key,words);
  }
  if(report.mentions.length!==report.total_name_occurrences||
     new Set(report.mentions.map(m=>m.locus)).size!==report.distinct_mentioned_sections){
    throw Error('Theaetetus name occurrence totals disagree');
  }
  const result=[];
  const ids=new Set();
  let counted=0;
  for(const item of report.intellectual_identities){
    if(ids.has(item.id)||people.get(item.id)?.name!==item.name||
       !Array.isArray(item.sections)||!Number.isInteger(item.occurrences))throw Error('Invalid thinker rollup');
    ids.add(item.id);
    let n=0;
    const seenSections=new Set();
    for(const section of item.sections){
      if(!validLoc(section)||seenSections.has(section))throw Error('Duplicate or invalid section');
      seenSections.add(section);
      const words=mentions.get(item.id+':'+section)||[];
      if(!words.length)throw Error('No Greek evidence for name');
      n+=words.length;
      const key='Theaetetus:'+section+':'+item.id;
      if(known.has(key))continue;
      known.add(key);
      const forms=[...new Set(words)].sort();
      result.push({
        id:'auto-theaetetus-'+section+'-'+item.id,
        workId:'Theaetetus',stephanus:section,startSection:section,thinkerId:item.id,
        kind:'explicit_name',status:'candidate',category:item.category,
        extractionSourceUrl:url,extractionSourceURN:report.text_urn,detectedForms:forms,
        sourceEdition:'John Burnet, Platonis Opera (1903); Perseus Greek TEI, machine scanned',
        doctrinalClaim:'Automated proper-name match for '+item.name+' at Theaetetus '+section+
          '. No philosophical doctrine has been assigned.',
        interpretiveNote:'Observed Greek form(s): '+forms.join(', ')+'. Context requires research.'+
          (item.id==='melissus'?' The plural form may refer to a school or tradition.':''),
        reviewNote:'Machine-generated candidate. No source check or scholarly verification recorded.'
      });
    }
    if(n!==item.occurrences||seenSections.size!==[...mentions.keys()].filter(k=>k.startsWith(item.id+':')).length)throw Error('Thinker rollup inconsistent');
    counted+=n;
  }
  if(counted!==report.mentions.length)throw Error('Unaccounted name matches');
  result.sort((a,b)=>a.thinkerId.localeCompare(b.thinkerId)||Number.parseInt(a.startSection)-Number.parseInt(b.startSection)||
    a.startSection.localeCompare(b.startSection));
  return result;
}

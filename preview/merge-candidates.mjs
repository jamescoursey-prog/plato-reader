// Convert reproducible Meno scanner output into provisional research records.
// This is a pure transformation: no source text or extraction results are committed.
import { THINKERS, ENGAGEMENTS, PILOT_WORKS } from '../app/src/lib/thinker-concordance.ts';

export function mergeCandidates(report, manual = ENGAGEMENTS, registry = THINKERS) {
  if (report?.work !== 'Meno' ||
      report.text_urn !== 'urn:cts:greekLit:tlg0059.tlg024.perseus-grc2' ||
      report.sections_scanned !== 151 ||
      !Array.isArray(report.intellectual_identities) ||
      !Array.isArray(report.mentions) ||
      !Array.isArray(report.unclassified_capitalized_tokens) ||
      report.unclassified_capitalized_tokens.length !== 0 ||
      !/^https:\/\/raw\.githubusercontent\.com\/PerseusDL\/canonical-greekLit\/[a-f0-9]{40}\/data\/tlg0059\/tlg024\/tlg0059\.tlg024\.perseus-grc2\.xml$/.test(report.source_url ?? '')) {
    throw new Error('Meno candidate report did not meet the source and extraction audit requirements');
  }
  // The extractor is deliberately limited to the named thinkers in its audited lexicon.
  // The registry supplies the historical identity, not the machine's guessed category.
  const people = new Map(registry.map(person => [person.id, person]));
  const manualKeys = new Set();
  const manualIds = new Set();
  for (const entry of manual) {
    if (!people.has(entry.thinkerId)) throw new Error('Unknown existing thinker: ' + entry.thinkerId);
    const key = entry.workId + ':' + entry.startSection + ':' + entry.thinkerId;
    if (manualKeys.has(key) || manualIds.has(entry.id)) throw new Error('Duplicate manually curated record: ' + key);
    manualKeys.add(key);
    manualIds.add(entry.id);
  }
  const generated = [];
  const generatedKeys = new Set();
  let locusCount = 0;
  let tokenCount = 0;
  const reportedMentions = new Map();
  for (const mention of report.mentions) {
    if (!people.has(mention.id) || mention.locus === undefined ||
        !/^\d{1,3}[a-e]$/.test(mention.locus) ||
        typeof mention.token !== 'string') throw new Error('Invalid scanner mention');
    const k = mention.id + ':' + mention.locus;
    const arr = reportedMentions.get(k) ?? [];
    arr.push(mention.token);
    reportedMentions.set(k, arr);
    tokenCount++;
  }
  if (tokenCount !== report.total_name_occurrences) throw new Error('Name occurrence totals differ');
  if (new Set(report.mentions.map(m => m.locus)).size !== report.distinct_mentioned_sections) {
    throw new Error('Distinct Stephanus-section totals differ');
  }
  const identityIds = new Set();
  for (const entity of report.intellectual_identities) {
    if (!people.has(entity.id) || identityIds.has(entity.id) ||
        typeof entity.name !== 'string' || !Array.isArray(entity.sections) ||
        !Number.isInteger(entity.occurrences)) throw new Error('Invalid or duplicate person in scanner report');
    identityIds.add(entity.id);
    const person = people.get(entity.id);
    if (entity.name !== person.name) throw new Error('Thinker registry disagrees with scanner: ' + entity.id);
    const seenSections = new Set();
    for (const section of entity.sections) {
      if (!/^\d{1,3}[a-e]$/.test(section) || seenSections.has(section)) {
        throw new Error('Invalid/duplicate name location for ' + entity.id);
      }
      seenSections.add(section);
      const key = 'Meno:' + section + ':' + entity.id;
      const words = reportedMentions.get(entity.id + ':' + section) ?? [];
      if (words.length === 0) throw new Error('No Greek token supports location ' + key);
      locusCount += words.length;
      if (manualKeys.has(key)) continue; // manual scholarship outranks generated leads
      if (generatedKeys.has(key)) throw new Error('Duplicate generated record: ' + key);
      generatedKeys.add(key);
      const greekForms = [...new Set(words)].sort();
      generated.push({
        id: 'auto-meno-' + section + '-' + entity.id,
        thinkerId: entity.id,
        workId: 'Meno',
        stephanus: section,
        startSection: section,
        kind: 'explicit_name',
        status: 'candidate',
        sourceEdition: 'John Burnet, Platonis Opera (1903), Greek TEI supplied by Perseus Digital Library; machine-scanned, not text checked',
        extractionSourceUrl: report.source_url,
        extractionSourceURN: report.text_urn,
        detectedForms: greekForms,
        category: entity.category,
        doctrinalClaim: 'Automated proper-name match for ' + person.name + ' at Meno ' + section + '. No philosophical doctrine is assigned by the scanner.',
        interpretiveNote: 'Greek name form(s): ' + greekForms.join(', ') + '. The role of this reference must be examined in context.',
        reviewNote: 'Machine-generated candidate. Requires identification, interpretation, and a recorded source check before promotion.',
      });
    }
    const trueOccurrences = [...reportedMentions.entries()]
      .filter(([key]) => key.startsWith(entity.id + ':'))
      .reduce((total, [, words]) => total + words.length, 0);
    if (trueOccurrences !== entity.occurrences || seenSections.size !== [...reportedMentions.keys()].filter(k => k.startsWith(entity.id + ':')).length) {
      throw new Error('Person totals differ for ' + entity.id);
    }
  }
  if (locusCount !== tokenCount) throw new Error('Scanner contains mentions absent from its identity rollup');
  generated.sort((a, b) => a.thinkerId.localeCompare(b.thinkerId) ||
    Number.parseInt(a.startSection) - Number.parseInt(b.startSection) ||
    a.startSection.localeCompare(b.startSection));
  const records = [...manual, ...generated];
  return {
    records,
    thinkers: registry.filter(person => records.some(entry => entry.thinkerId === person.id)),
    manuallyCurated: manual.length,
    machineCandidates: generated.length,
    scannedMentions: tokenCount,
    source: report.source_url,
  };
}

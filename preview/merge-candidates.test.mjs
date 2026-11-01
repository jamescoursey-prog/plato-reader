import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCandidates } from './merge-candidates.mjs';
import { THINKERS, ENGAGEMENTS } from '../app/src/lib/thinker-concordance.ts';

const source = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/' +
  'a6eb0cc3e6f6e382934a2c8b33577d2fb4371e00/data/tlg0059/tlg024/tlg0059.tlg024.perseus-grc2.xml';
const make = () => ({
  work: 'Meno', text_urn: 'urn:cts:greekLit:tlg0059.tlg024.perseus-grc2',
  source_url: source, sections_scanned: 151, total_name_occurrences: 3,
  distinct_mentioned_sections: 2, unclassified_capitalized_tokens: [],
  mentions: [
    { id: 'empedocles', locus: '76c', token: 'Ἐμπεδοκλέα' },
    { id: 'gorgias', locus: '76c', token: 'Γοργίαν' },
    { id: 'gorgias', locus: '76d', token: 'Γοργίας' },
  ],
  intellectual_identities: [
    { id: 'empedocles', name: 'Empedocles', category: 'philosopher',
      occurrences: 1, sections: ['76c'] },
    { id: 'gorgias', name: 'Gorgias', category: 'sophist',
      occurrences: 2, sections: ['76c', '76d'] },
  ],
});

describe('machine candidate import', () => {
  it('preserves a checked record rather than producing an Empedocles duplicate', () => {
    const result = mergeCandidates(make());
    assert.equal(result.manuallyCurated, 2);
    assert.equal(result.machineCandidates, 2);
    assert.equal(result.records.length, 4);
    const checked = result.records.find(e => e.workId === 'Meno' && e.thinkerId === 'empedocles');
    assert.strictEqual(checked, ENGAGEMENTS[0]);
    assert.equal(checked.status, 'text_checked');
    assert.deepEqual(result.records.filter(e => e.id.startsWith('auto-')).map(e => e.startSection),
      ['76c', '76d']);
    assert.equal(result.scannedMentions, 3);
  });
  it('creates provisional records with only names and source metadata', () => {
    const { records } = mergeCandidates(make());
    const candidate = records.find(e => e.id === 'auto-meno-76c-gorgias');
    assert.equal(candidate.status, 'candidate');
    assert.deepEqual(candidate.detectedForms, ['Γοργίαν']);
    assert.equal(candidate.extractionSourceUrl, source);
    assert.equal(candidate.scholarlyReference, undefined);
  });
  it('rejects unknown identities, invalid provenance, or inconsistent inventory', () => {
    const unknown = make();
    unknown.intellectual_identities[1].id = 'unregistered';
    assert.throws(() => mergeCandidates(unknown), /Unknown|Invalid/);
    const bad = make();
    bad.source_url = 'https://not-the-source.example/';
    assert.throws(() => mergeCandidates(bad), /audit requirements/);
    const wrong = make();
    wrong.total_name_occurrences = 19;
    assert.throws(() => mergeCandidates(wrong), /totals differ/);
    const dup = make();
    dup.intellectual_identities[1].sections = ['76c', '76c'];
    assert.throws(() => mergeCandidates(dup), /duplicate/i);
  });
  it('does not publish Greek sentences or full source text', () => {
    const { records } = mergeCandidates(make());
    for (const record of records.filter(e => e.id.startsWith('auto-'))) {
      assert.equal(record.primaryGreekExcerpt, undefined);
      assert.ok(!record.reviewedBy);
      assert.ok(!record.scholarlyReference);
    }
    assert.equal(THINKERS.some(person => person.id === 'gorgias'), true);
  });
});

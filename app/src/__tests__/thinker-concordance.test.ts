import { describe, expect, it } from 'vitest';
import { WORKS } from '@shared/lib/works';
import {
  ENGAGEMENTS, THINKERS, PILOT_WORKS, readerHref,
  isCountable, verifiedEngagements, distinctIndexedThinkerCount, distinctVerifiedThinkerCount,
  type Engagement,
} from '../lib/thinker-concordance';

describe('thinker concordance: pilot quality gates', () => {
  it('contains only registered works and resolvable thinker identifiers', () => {
    const works = new Set(WORKS.map((w) => w.id));
    const people = new Set(THINKERS.map((p) => p.id));
    expect(new Set(ENGAGEMENTS.map((e) => e.id)).size).toBe(ENGAGEMENTS.length);
    for (const work of PILOT_WORKS) expect(works.has(work)).toBe(true);
    for (const record of ENGAGEMENTS) {
      expect(works.has(record.workId)).toBe(true);
      expect(people.has(record.thinkerId)).toBe(true);
      expect(record.startSection).toMatch(/^\d{1,3}[a-e]$/);
    }
  });

  it('does not report a text-checked record as a verified engagement', () => {
    expect(ENGAGEMENTS).toHaveLength(2);
    expect(ENGAGEMENTS[0].status).toBe('text_checked');
    expect(ENGAGEMENTS[1].status).toBe('candidate');
    expect(ENGAGEMENTS[0].sourceIdentifier).toBe('https://plato.johnhboyer.com/Meno/book/1/?trans=lamb');
    expect(ENGAGEMENTS[0].sourceEdition).toContain('W. R. M. Lamb');
    expect(ENGAGEMENTS[0].scholarlyReference).toBeUndefined();
    expect(verifiedEngagements(ENGAGEMENTS)).toEqual([]);
    expect(distinctVerifiedThinkerCount(ENGAGEMENTS)).toBe(0);
  });

  it('indexes two distinct passages for one thinker with independent status and evidence', () => {
    expect(THINKERS.filter((p) => p.id === 'empedocles')).toHaveLength(1);
    expect(ENGAGEMENTS.map((e) => e.workId)).toEqual(['Meno', 'Theaetetus']);
    expect(ENGAGEMENTS.map((e) => e.stephanus)).toEqual(['76c–d', '152e']);
    expect(ENGAGEMENTS.every((e) => e.thinkerId === 'empedocles')).toBe(true);
    expect(distinctIndexedThinkerCount(ENGAGEMENTS)).toBe(1);
    expect(ENGAGEMENTS.filter((e) => e.status === 'text_checked')).toHaveLength(1);
    expect(ENGAGEMENTS.filter((e) => e.status === 'candidate')).toHaveLength(1);
    expect(verifiedEngagements(ENGAGEMENTS)).toHaveLength(0);
    expect(ENGAGEMENTS[1].reviewedBy).toBeUndefined();
  });

  it('does not count rejected leads as indexed identities', () => {
    expect(distinctIndexedThinkerCount([{ ...ENGAGEMENTS[1], status: 'rejected' }])).toBe(0);
  });

  it('does not count a verified flag without scholarly provenance', () => {
    const falselyFlagged = { ...ENGAGEMENTS[0], status: 'verified' } as Engagement;
    expect(isCountable(falselyFlagged)).toBe(false);
  });

  it('deduplicates distinct identities across independently reviewed passages', () => {
    const checked: Engagement = {
      ...ENGAGEMENTS[0],
      status: 'verified',
      primaryGreekExcerpt: 'Ἐμπεδοκλέα',
      sourceEdition: 'Test fixture only',
      sourceIdentifier: 'test-source:76c',
      scholarlyReference: 'Test reference only',
      reviewedBy: 'test-reviewer',
    };
    expect(isCountable(checked)).toBe(true);
    expect(distinctVerifiedThinkerCount([checked, { ...checked, id: 'other-mention' }])).toBe(1);
  });

  it('excludes incidental mentions even when the source record is complete', () => {
    const reviewedMention: Engagement = {
      ...ENGAGEMENTS[0],
      kind: 'incidental_mention',
      status: 'verified',
      primaryGreekExcerpt: 'Test fixture only',
      sourceEdition: 'Test edition only',
      sourceIdentifier: 'test-source:76c',
      scholarlyReference: 'Test reference only',
      reviewedBy: 'test-reviewer',
    };
    expect(isCountable(reviewedMention)).toBe(false);
    expect(verifiedEngagements([reviewedMention])).toEqual([]);
  });

  it('links the source citation to the existing reader route', () => {
    expect(readerHref(ENGAGEMENTS[0])).toBe('/Meno/book/1?loc=76c');
    expect(readerHref(ENGAGEMENTS[0], '/plato-reader')).toBe('/plato-reader/Meno/book/1?loc=76c');
    expect(readerHref(ENGAGEMENTS[1])).toBe('/Theaetetus/book/1?loc=152e');
  });
});

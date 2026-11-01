import { describe, expect, it } from 'vitest';
import { WORKS } from '@shared/lib/works';
import {
  ENGAGEMENTS, THINKERS, PILOT_WORKS, readerHref,
  isCountable, verifiedEngagements, distinctVerifiedThinkerCount,
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

  it('does not report any candidate as a verified engagement', () => {
    expect(ENGAGEMENTS).toHaveLength(1);
    expect(ENGAGEMENTS[0].status).toBe('candidate');
    expect(verifiedEngagements(ENGAGEMENTS)).toEqual([]);
    expect(distinctVerifiedThinkerCount(ENGAGEMENTS)).toBe(0);
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
  });
});

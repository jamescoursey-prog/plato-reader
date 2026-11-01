/**
 * Provisional, provenance-first thinker concordance.
 *
 * Every observation is an independently reviewable passage-level claim.
 * Nothing is "verified" merely because it was entered in this file.
 * Do not import conversational concordance totals as evidence.
 */
export type HistoricalConfidence = 'secure' | 'probable' | 'disputed';
export type EngagementKind = 'explicit_name' | 'indirect_allusion' | 'incidental_mention';
export type ReviewStatus = 'candidate' | 'text_checked' | 'verified' | 'rejected';

export interface Thinker {
  id: string;
  name: string;
  greekName: string;
  historicalConfidence: HistoricalConfidence;
}

export interface Engagement {
  id: string;
  thinkerId: string;
  workId: string;                   // matches shared/lib/works.ts
  stephanus: string;                // display range, e.g. 76c–d
  startSection: string;             // reader navigation, e.g. 76c
  kind: EngagementKind;
  doctrinalClaim: string;           // claim to investigate, not a finding
  interpretiveNote: string;
  status: ReviewStatus;
  // Only verified from a real edition after a human/reproducible source check:
  primaryGreekExcerpt?: string;
  sourceEdition?: string;
  sourceIdentifier?: string;
  scholarlyReference?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

/** Initial corpus for extraction experiments; NOT a completeness claim. */
export const PILOT_WORKS = ['Meno', 'Theaetetus', 'Sophist'] as const;

export const THINKERS: readonly Thinker[] = [
  { id: 'empedocles', name: 'Empedocles', greekName: 'Ἐμπεδοκλῆς', historicalConfidence: 'secure' },
];

export const ENGAGEMENTS: readonly Engagement[] = [
  {
    id: 'meno-76c-empedocles',
    thinkerId: 'empedocles',
    workId: 'Meno',
    stephanus: '76c–d',
    startSection: '76c',
    kind: 'explicit_name',
    doctrinalClaim: 'Socrates invokes an account of effluences when discussing the nature of color.',
    interpretiveNote: 'Research candidate. Inspect the Greek and relevant testimonia before deciding how the argument engages Empedocles.',
    status: 'candidate',
    reviewNote: 'The passage, attribution, and edition have not been checked within this fork.',
  },
];

/**
 * A structural gate, not a substitute for scholarly review:
 * a "verified" flag alone is insufficient for a record to count.
 */
export function isCountable(e: Engagement): boolean {
  return e.status === 'verified'
    && e.kind !== 'incidental_mention'
    && Boolean(e.primaryGreekExcerpt?.trim())
    && Boolean(e.sourceEdition?.trim())
    && Boolean(e.sourceIdentifier?.trim())
    && Boolean(e.scholarlyReference?.trim())
    && Boolean(e.reviewedBy?.trim());
}

export function verifiedEngagements(records: readonly Engagement[]): Engagement[] {
  return records.filter(isCountable);
}

export function distinctVerifiedThinkerCount(records: readonly Engagement[]): number {
  return new Set(verifiedEngagements(records).map((e) => e.thinkerId)).size;
}

/** A citation pointer, not a claim that this fork already serves built texts. */
export function readerHref(e: Pick<Engagement, 'workId' | 'startSection'>, base = ''): string {
  return `${base}/${encodeURIComponent(e.workId)}/book/1?loc=${encodeURIComponent(e.startSection)}`;
}

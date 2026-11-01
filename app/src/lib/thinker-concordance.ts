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
    interpretiveNote: 'The named reference and its subject have been checked against the displayed passage. The precise doctrinal interpretation and independent textual collation remain open.',
    status: 'text_checked',
    sourceEdition: 'Plato, Meno: Greek, John Burnet (OCT, 1903); English, W. R. M. Lamb (Loeb, 1924), via John Boyer’s Plato Reader.',
    sourceIdentifier: 'https://plato.johnhboyer.com/Meno/book/1/?trans=lamb',
    reviewedBy: 'Project researcher (passage check)',
    reviewNote: '2026-11-01: Project researcher confirmed that Meno 76c–d explicitly names Empedocles and associates effluences and passages with an explanation of color. Text checked against the cited reader; independent Greek collation and secondary scholarship are still pending.',
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

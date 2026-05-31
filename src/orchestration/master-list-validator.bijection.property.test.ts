/**
 * Property-based test for the Master_Task_List ↔ Stage bijection flag.
 *
 * Implements Property 5 from the design's Correctness Properties:
 * "Биекция записей Master_Task_List и Stage".
 *
 * The property: `validateMasterList(entries, stages).stageBijectionHolds` is
 * true IF AND ONLY IF there is exactly one top-level entry for every stage —
 * i.e. a bijection between the entries' stages and the `stages` list. This
 * fails when a stage is missing, a stage is duplicated among entries, an
 * unknown/extra stage appears among entries, or the `stages` list itself has
 * duplicates.
 *
 * The oracle below is expressed at the specification level (independent of the
 * implementation's counting strategy): the bijection holds iff `stages` has no
 * duplicates AND the multiset of entry stages equals the multiset of `stages`.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateMasterList,
  MasterTaskListEntry,
} from './master-list-validator.js';

/** Pool of stage labels used to build distinct stage sets (and collisions). */
const STAGE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

/** A label guaranteed NOT to be drawn from {@link STAGE_LABELS}. */
const UNKNOWN_STAGE = 'Z';

/** Builds a (structurally valid) entry whose `stage` is the given label. */
function entryFor(stage: string): MasterTaskListEntry {
  return { stage, documentation: [{ id: 'docs/arch.md' }], specialistAgent: 'JavaScript' };
}

/** Multiset (order-insensitive) equality of two string arrays. */
function sameMultiset(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Specification-level oracle for the bijection: holds iff `stages` is a true
 * set (no duplicates) and the entries' stages are exactly that set, each once.
 */
function expectedBijection(
  entries: readonly MasterTaskListEntry[],
  stages: readonly string[],
): boolean {
  const stagesAreDistinct = new Set(stages).size === stages.length;
  return stagesAreDistinct && sameMultiset(entries.map((e) => e.stage), stages);
}

/** Arbitrary non-empty array of DISTINCT stage labels. */
const distinctStagesArb = fc.uniqueArray(fc.constantFrom(...STAGE_LABELS), {
  minLength: 1,
  maxLength: STAGE_LABELS.length,
});

describe('validateMasterList — stage bijection (Property 5)', () => {
  // Feature: fork-rebrand-task-workflow, Property 5: Биекция записей Master_Task_List и Stage

  it('stageBijectionHolds is true IFF entries are a bijection over stages (arbitrary inputs)', () => {
    // Validates: Requirements 4.2
    // Small label pool (collisions allowed) so that both true and false cases occur.
    const label = fc.constantFrom('A', 'B', 'C', UNKNOWN_STAGE);
    fc.assert(
      fc.property(
        fc.array(label, { maxLength: 5 }),
        fc.array(label.map(entryFor), { maxLength: 5 }),
        (stages, entries) => {
          const { stageBijectionHolds } = validateMasterList(entries, stages);
          expect(stageBijectionHolds).toBe(expectedBijection(entries, stages));
        },
      ),
      { numRuns: 300 },
    );
  });

  it('exact bijection (any entry order) → true', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(distinctStagesArb, (stages) => {
        // Reverse the order to demonstrate the check is order-independent.
        const entries = [...stages].reverse().map(entryFor);
        const result = validateMasterList(entries, stages);
        expect(result.stageBijectionHolds).toBe(true);
        expect(result.stageBijectionHolds).toBe(expectedBijection(entries, stages));
      }),
      { numRuns: 150 },
    );
  });

  it('a missing stage (entry omitted) → false', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(distinctStagesArb, (stages) => {
        // Drop one stage's entry so at least one stage has no entry.
        const entries = stages.slice(1).map(entryFor);
        const result = validateMasterList(entries, stages);
        expect(result.stageBijectionHolds).toBe(false);
        expect(result.stageBijectionHolds).toBe(expectedBijection(entries, stages));
      }),
      { numRuns: 150 },
    );
  });

  it('a duplicated stage among entries → false', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(distinctStagesArb, (stages) => {
        // Cover every stage once, then duplicate the first stage's entry.
        const entries = [...stages.map(entryFor), entryFor(stages[0])];
        const result = validateMasterList(entries, stages);
        expect(result.stageBijectionHolds).toBe(false);
        expect(result.stageBijectionHolds).toBe(expectedBijection(entries, stages));
      }),
      { numRuns: 150 },
    );
  });

  it('an extra/unknown stage among entries → false', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(distinctStagesArb, (stages) => {
        // Cover every stage once, then add an entry for a stage not in `stages`.
        const entries = [...stages.map(entryFor), entryFor(UNKNOWN_STAGE)];
        const result = validateMasterList(entries, stages);
        expect(result.stageBijectionHolds).toBe(false);
        expect(result.stageBijectionHolds).toBe(expectedBijection(entries, stages));
      }),
      { numRuns: 150 },
    );
  });

  it('duplicate stages in the `stages` list itself → false', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(distinctStagesArb, (distinct) => {
        // Duplicate the first stage in the `stages` list; mirror it in entries
        // so the only defect is the non-set `stages` list.
        const stages = [...distinct, distinct[0]];
        const entries = stages.map(entryFor);
        const result = validateMasterList(entries, stages);
        expect(result.stageBijectionHolds).toBe(false);
        expect(result.stageBijectionHolds).toBe(expectedBijection(entries, stages));
      }),
      { numRuns: 150 },
    );
  });
});

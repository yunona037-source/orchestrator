// Feature: fork-rebrand-task-workflow, Property 14: Ошибка формирования останавливает делегирование последующих документов
/**
 * Property-based test for {@link recordError} (Task 8.3).
 *
 * Property 14 — "Ошибка формирования останавливает делегирование последующих
 * документов":
 *   For ANY starting {@link PipelineState} and ANY stage `s`, the state returned
 *   by `recordError(state, s)` records the error (`errorStage === s`) and blocks
 *   delegation of EVERY document. Because any recorded error blocks the whole
 *   pipeline (Req 9.8), `canDelegate(next, d) === false` holds not only for
 *   documents following `s` in {@link DOC_ORDER} but for every stage. `recordError`
 *   is pure: it never mutates its input (`input.errorStage` is unchanged).
 *
 * **Validates: Requirements 9.8**
 *
 * Generation strategy:
 *  - We generate an arbitrary `PipelineState`: each of the four `formed` flags is
 *    drawn independently as a boolean, and `errorStage` is drawn uniformly from
 *    `DOC_ORDER ∪ {null}`. This covers fresh states, fully-formed states, and
 *    states that already carry an error, which is the full input space.
 *  - We draw the error stage `s` uniformly from `DOC_ORDER`.
 *  - After computing `next = recordError(state, s)` we assert the error is
 *    recorded, that delegation is blocked for every stage (including all stages
 *    after `s`), and that the input state's `errorStage` was not mutated.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  DOC_ORDER,
  DocStage,
  PipelineState,
  canDelegate,
  recordError,
} from './document-pipeline.js';

const stageArb: fc.Arbitrary<DocStage> = fc.constantFrom(...DOC_ORDER);

/** Arbitrary error stage: any DocStage or `null` (no error yet). */
const errorStageArb: fc.Arbitrary<DocStage | null> = fc.constantFrom<
  (DocStage | null)[]
>(...DOC_ORDER, null);

/** Arbitrary PipelineState across the full input space. */
const stateArb: fc.Arbitrary<PipelineState> = fc.record({
  formed: fc.record({
    Requirements_Document: fc.boolean(),
    Tech_Design_Document: fc.boolean(),
    Tasks_Document: fc.boolean(),
    Project_Rules: fc.boolean(),
  }),
  errorStage: errorStageArb,
});

describe('Property 14: Ошибка формирования останавливает делегирование последующих документов (recordError)', () => {
  it('records the error, blocks delegation of every document, and never mutates its input', () => {
    fc.assert(
      fc.property(stateArb, stageArb, (state, s) => {
        const inputErrorBefore = state.errorStage;

        const next = recordError(state, s);

        // The error stage is recorded on the returned state (Req 9.8).
        expect(next.errorStage).toBe(s);

        // Any recorded error blocks delegation of EVERY document, which in
        // particular covers every stage following `s` in DOC_ORDER (Req 9.8).
        for (const d of DOC_ORDER) {
          expect(canDelegate(next, d)).toBe(false);
        }

        // Purity: recordError must not mutate the input state's errorStage.
        expect(state.errorStage).toBe(inputErrorBefore);
      }),
      { numRuns: 200 }
    );
  });
});

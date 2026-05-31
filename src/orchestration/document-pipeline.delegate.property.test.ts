// Feature: fork-rebrand-task-workflow, Property 13: Делегирование документа разрешено только при сформированных предшественниках
/**
 * Property-based test for {@link canDelegate} (Task 8.2).
 *
 * Property 13 — "Делегирование документа разрешено только при сформированных
 * предшественниках":
 *   For ANY pipeline state, `canDelegate(state, stage)` is true if and only if
 *   every document preceding `stage` in the fixed order
 *   `Requirements_Document → Tech_Design_Document → Tasks_Document → Project_Rules`
 *   has been formed and saved (`formed === true`) AND no error has been recorded
 *   in the pipeline (`errorStage === null`). The first stage has no predecessors,
 *   so it is delegable iff `errorStage === null`.
 *
 * **Validates: Requirements 4.6, 9.1, 9.5, 9.6, 9.7**
 *
 * Generation strategy:
 *  - We build an arbitrary `PipelineState` by drawing an independent boolean for
 *    each `DocStage` in `formed`, and an `errorStage` that is either `null` or
 *    any one of the stages. This explores the full state space (any combination
 *    of formed predecessors with/without a recorded error).
 *  - We draw an arbitrary target `stage` from `DOC_ORDER`, including the first
 *    stage (no predecessors) to cover that boundary case.
 *  - For each (state, stage) pair we independently recompute the oracle —
 *    `errorStage === null` AND all predecessors of `stage` formed — and assert
 *    `canDelegate` agrees. The oracle is computed directly from the spec rather
 *    than reusing the implementation, so it is a genuine cross-check.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  DOC_ORDER,
  DocStage,
  PipelineState,
  canDelegate,
} from './document-pipeline.js';

/** Arbitrary that picks any single document stage from the fixed order. */
const stageArb: fc.Arbitrary<DocStage> = fc.constantFrom(...DOC_ORDER);

/** Arbitrary `formed` map: an independent boolean for each DocStage. */
const formedArb: fc.Arbitrary<Record<DocStage, boolean>> = fc.record({
  Requirements_Document: fc.boolean(),
  Tech_Design_Document: fc.boolean(),
  Tasks_Document: fc.boolean(),
  Project_Rules: fc.boolean(),
});

/** Arbitrary error stage: either no error (null) or any one of the stages. */
const errorStageArb: fc.Arbitrary<DocStage | null> = fc.option(stageArb, {
  nil: null,
});

/** Arbitrary full pipeline state. */
const pipelineStateArb: fc.Arbitrary<PipelineState> = fc.record({
  formed: formedArb,
  errorStage: errorStageArb,
});

/**
 * Spec oracle, derived directly from Property 13:
 * delegation of `stage` is allowed iff no error is recorded AND every
 * predecessor of `stage` in DOC_ORDER has been formed.
 */
const shouldDelegate = (state: PipelineState, stage: DocStage): boolean => {
  if (state.errorStage !== null) return false;
  const stageIndex = DOC_ORDER.indexOf(stage);
  for (let i = 0; i < stageIndex; i++) {
    if (!state.formed[DOC_ORDER[i]]) return false;
  }
  return true;
};

describe('Property 13: Делегирование документа разрешено только при сформированных предшественниках (canDelegate)', () => {
  it('canDelegate(state, stage) === (no error AND all predecessors formed)', () => {
    fc.assert(
      fc.property(pipelineStateArb, stageArb, (state, stage) => {
        expect(canDelegate(state, stage)).toBe(shouldDelegate(state, stage));
      }),
      { numRuns: 200 }
    );
  });

  it('the first stage (no predecessors) is delegable iff no error is recorded', () => {
    const firstStage = DOC_ORDER[0];
    fc.assert(
      fc.property(pipelineStateArb, (state) => {
        // No predecessors, so delegability depends solely on errorStage.
        expect(canDelegate(state, firstStage)).toBe(state.errorStage === null);
      }),
      { numRuns: 100 }
    );
  });
});

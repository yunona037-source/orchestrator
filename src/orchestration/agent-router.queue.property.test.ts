// Feature: fork-rebrand-task-workflow, Property 8: Очередь задач соблюдает «одна за раз» и FIFO
/**
 * Property-based test for {@link TaskQueue} (Task 7.2).
 *
 * Property 8 — "Очередь задач соблюдает «одна за раз» и FIFO":
 *   For ANY sequence of `enqueue` / `completeCurrent` operations, at every
 *   moment at most one Task is in progress (`current` holds at most one task),
 *   and the order in which tasks become `current` exactly matches the order in
 *   which they were enqueued (FIFO). `pending` always reflects arrival order.
 *
 * **Validates: Requirements 7.4, 7.5, 7.6, 7.7**
 *
 * Generation strategy:
 *  - We generate arbitrary sequences of operations, each being either an
 *    `enqueue` (biased a bit more frequent so the queue actually fills up) or a
 *    `completeCurrent`. Sequences freely interleave the two, so they exercise
 *    enqueue-while-idle (immediate promotion), enqueue-while-busy (tail
 *    buffering), completion-with-waiters (head promotion) and
 *    completion-while-idle (no-op).
 *  - Every enqueued Task carries a unique, strictly increasing `id` marker so
 *    we can track identity by value (the queue stores object references, so the
 *    same objects come back out of `current` / `pending`).
 *  - We run the real {@link TaskQueue} alongside an independent oracle: a plain
 *    array-based FIFO plus a single `current` slot. After every operation we
 *    compare the real queue's observable state (current id, pending ids) to the
 *    oracle, assert at-most-one-in-progress, that `pending` stays in strictly
 *    increasing (i.e. arrival) order, and that the current task never also sits
 *    in `pending`. Finally we assert the sequence of ids that ever occupied the
 *    `current` slot equals the enqueue order prefix — the core FIFO guarantee,
 *    checked against arrival order as independent ground truth.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TaskQueue } from './agent-router.js';
import { Task } from './task-validator.js';
import { newTaskTodo } from './task-todo.js';

/** A Task tagged with a unique identity marker for order/identity tracking. */
interface TaggedTask extends Task {
  id: number;
}

/** Builds a minimal, valid Task carrying a unique identity marker. */
function makeTask(id: number): TaggedTask {
  return {
    id,
    assignedAgent: `agent-${id}`,
    neededDocs: [{ id: `doc-${id}` }],
    docsToUpdate: [{ id: `doc-update-${id}` }],
    parts: [],
    todo: newTaskTodo(),
    report: null,
  };
}

/** Reads back the identity marker of a Task reference returned by the queue. */
function idOf(task: Task | null): number | null {
  return task === null ? null : (task as TaggedTask).id;
}

type Op = { kind: 'enqueue' } | { kind: 'complete' };

/** enqueue is weighted higher than complete so the pending queue actually grows. */
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 3, arbitrary: fc.constant<Op>({ kind: 'enqueue' }) },
  { weight: 2, arbitrary: fc.constant<Op>({ kind: 'complete' }) }
);

const opsArb: fc.Arbitrary<Op[]> = fc.array(opArb, {
  minLength: 1,
  maxLength: 30,
});

describe('Property 8: Очередь задач соблюдает «одна за раз» и FIFO (TaskQueue)', () => {
  it('keeps at most one task current and promotes tasks strictly in enqueue (FIFO) order', () => {
    // Validates: Requirements 7.4, 7.5, 7.6, 7.7
    fc.assert(
      fc.property(opsArb, (ops) => {
        const queue = new TaskQueue();

        // Independent oracle: array-based FIFO + single current slot.
        let modelCurrent: number | null = null;
        const modelPending: number[] = [];

        // Ground truth for FIFO checks.
        const arrivals: number[] = []; // ids in enqueue order
        const promotedOrder: number[] = []; // ids in the order they became `current`
        let nextId = 0;

        for (const op of ops) {
          const prevCurrent = idOf(queue.current);

          if (op.kind === 'enqueue') {
            const id = nextId++;
            arrivals.push(id);
            queue.enqueue(makeTask(id));

            // Oracle: idle executor takes the task immediately; otherwise tail.
            if (modelCurrent === null) {
              modelCurrent = id;
            } else {
              modelPending.push(id);
            }
          } else {
            queue.completeCurrent();

            // Oracle: drop current, promote head of the waiting queue if any.
            if (modelCurrent !== null) {
              modelCurrent = modelPending.shift() ?? null;
            }
          }

          const newCurrent = idOf(queue.current);

          // A new id occupying the `current` slot is a promotion event.
          if (newCurrent !== null && newCurrent !== prevCurrent) {
            promotedOrder.push(newCurrent);
          }

          // (Req 7.4, 7.5) At most one task in progress, matching the oracle.
          expect(newCurrent).toBe(modelCurrent);

          // (Req 7.6) pending mirrors arrival order and matches the oracle.
          const realPending = queue.pending.map((t) => (t as TaggedTask).id);
          expect(realPending).toEqual(modelPending);

          // pending ids strictly increase => arrival order preserved (FIFO).
          for (let i = 1; i < realPending.length; i++) {
            expect(realPending[i]).toBeGreaterThan(realPending[i - 1]);
          }

          // The current task is never simultaneously pending (no duplication).
          if (newCurrent !== null) {
            expect(realPending).not.toContain(newCurrent);
          }
        }

        // (Req 7.6, 7.7) Tasks become `current` exactly in enqueue order: the
        // observed promotion sequence equals the enqueue-order prefix.
        expect(promotedOrder).toEqual(arrivals.slice(0, promotedOrder.length));
      }),
      { numRuns: 200 }
    );
  });
});

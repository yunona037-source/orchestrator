// Feature: fork-rebrand-task-workflow, Property 11: Пункты Task_TODO отмечаются строго по порядку
/**
 * Property-based test for {@link checkItem} (Task 6.3).
 *
 * Property 11 — "Пункты Task_TODO отмечаются строго по порядку":
 *   For ANY sequence of attempts to check Task_TODO items, an attempt to check
 *   an item succeeds (`ok: true`) only if all items preceding it in the fixed
 *   order `readDocs → doTask → updateDocs` are already checked; otherwise the
 *   attempt fails (`ok: false`) and leaves the todo unchanged. After ANY
 *   sequence of operations the invariant `updateDocs ⇒ doTask ⇒ readDocs`
 *   holds. `checkItem` is pure: it never mutates its input and returns a NEW
 *   object on success.
 *
 * **Validates: Requirements 8.3, 8.4, 8.5, 8.6**
 *
 * Generation strategy:
 *  - We generate arbitrary sequences of check attempts, each attempt drawing an
 *    item uniformly from `'readDocs' | 'doTask' | 'updateDocs'`. Because items
 *    are drawn freely (not "in order"), the sequences exercise both legal
 *    in-order checks and illegal out-of-order attempts, which is exactly the
 *    input space the strict-order rule must constrain.
 *  - We fold each sequence through `checkItem`, starting from `newTaskTodo()`.
 *    At every step we independently recompute, from the current (pre-step)
 *    state, whether the attempt SHOULD succeed (all predecessors checked) and
 *    assert `checkItem`'s `ok` matches, that the resulting state is correct,
 *    that the input object is never mutated, and that the order invariant holds.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  newTaskTodo,
  checkItem,
  TODO_ORDER,
  TaskTodo,
  TodoItem,
} from './task-todo.js';

const itemArb: fc.Arbitrary<TodoItem> = fc.constantFrom(...TODO_ORDER);

/** Arbitrary sequence of check attempts (items may repeat / be out of order). */
const attemptsArb: fc.Arbitrary<TodoItem[]> = fc.array(itemArb, {
  minLength: 1,
  maxLength: 12,
});

/** A snapshot of a TaskTodo's three fields, for mutation detection. */
const snapshot = (t: TaskTodo): [boolean, boolean, boolean] => [
  t.readDocs,
  t.doTask,
  t.updateDocs,
];

/** True iff all items preceding `item` in TODO_ORDER are checked in `todo`. */
const predecessorsChecked = (todo: TaskTodo, item: TodoItem): boolean => {
  const index = TODO_ORDER.indexOf(item);
  for (let i = 0; i < index; i++) {
    if (!todo[TODO_ORDER[i]]) return false;
  }
  return true;
};

/** The order invariant: updateDocs ⇒ doTask, and doTask ⇒ readDocs (Req 8.5). */
const orderInvariantHolds = (todo: TaskTodo): boolean => {
  const updateImpliesDo = !todo.updateDocs || todo.doTask;
  const doImpliesRead = !todo.doTask || todo.readDocs;
  return updateImpliesDo && doImpliesRead;
};

describe('Property 11: Пункты Task_TODO отмечаются строго по порядку (checkItem)', () => {
  it('checks items strictly in order, never mutates input, and preserves the order invariant', () => {
    fc.assert(
      fc.property(attemptsArb, (attempts) => {
        let current = newTaskTodo();

        // Freshly initialized state already satisfies the invariant.
        expect(orderInvariantHolds(current)).toBe(true);

        for (const item of attempts) {
          const before = snapshot(current);
          const expectOk = predecessorsChecked(current, item);

          const result = checkItem(current, item);

          // `ok` is true exactly when all predecessors were already checked
          // (Req 8.3, 8.4, 8.6 — strict ordering of the three steps).
          expect(result.ok).toBe(expectOk);

          // Purity: the passed-in object is never mutated (Req 8.5).
          expect(snapshot(current)).toEqual(before);

          if (expectOk) {
            // Success returns a NEW object distinct from the input.
            expect(result.todo).not.toBe(current);
            // The target item is now checked; predecessors stay checked.
            expect(result.todo[item]).toBe(true);
            for (let i = 0; i < TODO_ORDER.indexOf(item); i++) {
              expect(result.todo[TODO_ORDER[i]]).toBe(true);
            }
          } else {
            // Failure returns the original todo unchanged (Req 8.5).
            expect(result.todo).toBe(current);
            expect(snapshot(result.todo)).toEqual(before);
          }

          // The order invariant holds after every operation (Req 8.5).
          expect(orderInvariantHolds(result.todo)).toBe(true);

          current = result.todo;
        }
      }),
      { numRuns: 200 }
    );
  });
});

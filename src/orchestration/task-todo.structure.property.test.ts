// Feature: fork-rebrand-task-workflow, Property 10: Структура Task_TODO фиксирована и инициализируется непомеченной
/**
 * Property-based test for {@link newTaskTodo} / {@link TODO_ORDER} (Task 6.2).
 *
 * Property 10 — "Структура Task_TODO фиксирована и инициализируется непомеченной":
 *   For any newly created `TaskTodo` (via `newTaskTodo()`), it contains exactly
 *   three items in the order `readDocs → doTask → updateDocs`, all three
 *   initialized to "not checked" (`false`), and there is NO item for preparing
 *   the Report (the object has exactly those three keys).
 *
 * **Validates: Requirements 8.1, 8.2, 8.8**
 *
 * Generation strategy:
 *   `newTaskTodo()` is deterministic and takes no input, so the property is
 *   driven by an arbitrary dummy integer that exercises repeated, independent
 *   construction of the TODO. Each iteration builds a fresh `TaskTodo` and
 *   re-asserts the full structural invariant, satisfying the ≥100-iteration
 *   property-test convention while keeping this a genuine fast-check property.
 *   TODO_ORDER itself is a module-level constant, so its fixed length/order is
 *   asserted once outside the property (it cannot vary per iteration).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { newTaskTodo, TODO_ORDER, TaskTodo } from './task-todo.js';

/** The exact, fixed set of Task_TODO keys in their mandated order (Req 8.1). */
const EXPECTED_ORDER: ReadonlyArray<keyof TaskTodo> = [
  'readDocs',
  'doTask',
  'updateDocs',
];

describe('Property 10: Структура Task_TODO фиксирована и инициализируется непомеченной', () => {
  it('TODO_ORDER has exactly three items in the order readDocs → doTask → updateDocs', () => {
    // The fixed order is a module constant (Req 8.1): exactly three items, in
    // the mandated sequence, with no slot for Report preparation (Req 8.8).
    expect(TODO_ORDER).toHaveLength(3);
    expect(TODO_ORDER).toEqual(['readDocs', 'doTask', 'updateDocs']);
  });

  it('every freshly created TaskTodo has exactly the three ordered items, all unchecked, and no Report item', () => {
    fc.assert(
      // The dummy integer only drives repeated, independent construction; the
      // structural invariant must hold identically on every fresh TaskTodo.
      fc.property(fc.integer(), () => {
        const todo = newTaskTodo();

        // Req 8.1 / 8.8: object has EXACTLY the three keys, in fixed order, and
        // therefore no field for preparing the Report.
        const keys = Object.keys(todo);
        expect(keys).toEqual(['readDocs', 'doTask', 'updateDocs']);
        expect(keys).toHaveLength(3);

        // The keys present match the fixed TODO_ORDER set exactly.
        expect(new Set(keys)).toEqual(new Set(EXPECTED_ORDER));

        // Req 8.2: all three items are initialized to "not checked" (false).
        for (const item of EXPECTED_ORDER) {
          expect(todo[item]).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

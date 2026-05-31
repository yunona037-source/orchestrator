/**
 * Property-based test for the Task_TODO state machine — Property 12.
 *
 * Feature: fork-rebrand-task-workflow, Property 12: Завершённость Task
 * эквивалентна полному TODO и наличию Report
 *
 * For any `TaskTodo` state and any `report` value (either `null` or a `Report`
 * object), `isTaskComplete(todo, report)` is `true` if and only if all three
 * Task_TODO items are checked AND a Report has been prepared (`report !== null`).
 *
 * Validates: Requirements 8.9, 8.10
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isTaskComplete, TaskTodo, Report } from './task-todo.js';

/** An arbitrary Task_TODO state across all generated boolean combinations. */
const taskTodoArb: fc.Arbitrary<TaskTodo> = fc.record({
  readDocs: fc.boolean(),
  doTask: fc.boolean(),
  updateDocs: fc.boolean(),
});

/** An arbitrary Report object with a list of change descriptions. */
const reportArb: fc.Arbitrary<Report> = fc.record({
  changes: fc.array(fc.string(), { maxLength: 5 }),
});

/** Either `null` (Report not prepared) or a concrete Report object. */
const reportOrNullArb: fc.Arbitrary<Report | null> = fc.oneof(
  fc.constant(null),
  reportArb
);

describe('task-todo — Property 12: completeness equals full TODO and present Report', () => {
  it('isTaskComplete(todo, report) === (todo fully checked && report !== null)', () => {
    fc.assert(
      fc.property(taskTodoArb, reportOrNullArb, (todo, report) => {
        const expected =
          todo.readDocs && todo.doTask && todo.updateDocs && report !== null;
        expect(isTaskComplete(todo, report)).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });
});

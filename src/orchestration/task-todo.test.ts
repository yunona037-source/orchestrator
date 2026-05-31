/**
 * Unit tests for the Task_TODO protocol state machine
 * (`src/orchestration/task-todo.ts`).
 *
 * These cover the concrete protocol steps called out by Task 6.5 as worked
 * examples: checking the "read Documentation" step (Req 8.3), the "do task"
 * step (Req 8.4) and the "update Documentation" step (Req 8.6) in order; the
 * rejection of out-of-order checks; and the Report semantics — a Report carries
 * the list of all changes made (Req 8.13) and a Task only counts as complete
 * once all three Task_TODO items are checked AND a Report is present
 * (Req 8.7, 8.9). These are example-based checks; the universal ordering and
 * completeness properties are covered separately by property tests
 * (Tasks 6.2–6.4).
 *
 * Validates: Requirements 8.3, 8.4, 8.6, 8.7, 8.13
 */

import { describe, it, expect } from 'vitest';
import {
  newTaskTodo,
  checkItem,
  isTaskComplete,
  Report,
  TaskTodo,
} from './task-todo.js';

describe('checkItem - protocol steps in order (Req 8.3, 8.4, 8.6)', () => {
  it('"прочитать" step: from a fresh todo, checking readDocs succeeds (Req 8.3)', () => {
    const todo = newTaskTodo();

    const result = checkItem(todo, 'readDocs');

    expect(result.ok).toBe(true);
    expect(result.todo.readDocs).toBe(true);
    // Later items remain unchecked.
    expect(result.todo.doTask).toBe(false);
    expect(result.todo.updateDocs).toBe(false);
    // Input is not mutated (pure function).
    expect(todo.readDocs).toBe(false);
  });

  it('"выполнить" step: after readDocs, checking doTask succeeds (Req 8.4)', () => {
    const afterRead = checkItem(newTaskTodo(), 'readDocs').todo;

    const result = checkItem(afterRead, 'doTask');

    expect(result.ok).toBe(true);
    expect(result.todo.readDocs).toBe(true);
    expect(result.todo.doTask).toBe(true);
    expect(result.todo.updateDocs).toBe(false);
  });

  it('"обновить" step: after readDocs and doTask, checking updateDocs succeeds (Req 8.6)', () => {
    const afterRead = checkItem(newTaskTodo(), 'readDocs').todo;
    const afterDo = checkItem(afterRead, 'doTask').todo;

    const result = checkItem(afterDo, 'updateDocs');

    expect(result.ok).toBe(true);
    expect(result.todo).toEqual({
      readDocs: true,
      doTask: true,
      updateDocs: true,
    });
  });
});

describe('checkItem - out-of-order checks are rejected (Req 8.5)', () => {
  it('from a fresh todo, checking doTask fails and leaves the todo unchanged', () => {
    const todo = newTaskTodo();

    const result = checkItem(todo, 'doTask');

    expect(result.ok).toBe(false);
    expect(result.todo).toBe(todo);
    expect(result.todo).toEqual({
      readDocs: false,
      doTask: false,
      updateDocs: false,
    });
  });

  it('checking updateDocs with only readDocs checked fails and leaves the todo unchanged', () => {
    const onlyRead = checkItem(newTaskTodo(), 'readDocs').todo;

    const result = checkItem(onlyRead, 'updateDocs');

    expect(result.ok).toBe(false);
    expect(result.todo).toBe(onlyRead);
    expect(result.todo).toEqual({
      readDocs: true,
      doTask: false,
      updateDocs: false,
    });
  });
});

describe('Report semantics and task completion (Req 8.7, 8.9, 8.13)', () => {
  /** A Report carrying several change entries (Req 8.13). */
  const report: Report = {
    changes: [
      'Updated src/orchestration/task-todo.ts',
      'Added src/orchestration/task-todo.test.ts',
      'Updated docs/ARCHITECTURE.md',
    ],
  };

  /** A fully-checked Task_TODO produced by following the protocol in order. */
  function fullyChecked(): TaskTodo {
    const afterRead = checkItem(newTaskTodo(), 'readDocs').todo;
    const afterDo = checkItem(afterRead, 'doTask').todo;
    return checkItem(afterDo, 'updateDocs').todo;
  }

  it('Report.changes reflects the provided list of changes (Req 8.13)', () => {
    expect(report.changes).toEqual([
      'Updated src/orchestration/task-todo.ts',
      'Added src/orchestration/task-todo.test.ts',
      'Updated docs/ARCHITECTURE.md',
    ]);
    expect(report.changes).toHaveLength(3);
  });

  it('isTaskComplete is true only when all three items are checked AND a Report is present (Req 8.7, 8.9)', () => {
    expect(isTaskComplete(fullyChecked(), report)).toBe(true);
  });

  it('isTaskComplete is false when all items are checked but no Report is prepared', () => {
    expect(isTaskComplete(fullyChecked(), null)).toBe(false);
  });

  it('isTaskComplete is false when a Report exists but the todo is not fully checked', () => {
    const afterRead = checkItem(newTaskTodo(), 'readDocs').todo;
    const afterDo = checkItem(afterRead, 'doTask').todo;

    // updateDocs still unchecked.
    expect(isTaskComplete(afterDo, report)).toBe(false);
    // Fresh todo with a report is also incomplete.
    expect(isTaskComplete(newTaskTodo(), report)).toBe(false);
  });
});

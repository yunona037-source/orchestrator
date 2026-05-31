/**
 * Property-based test for the regular-Task completeness validator.
 *
 * Implements Property 7 from the design's Correctness Properties:
 * "Полнота обычной Task проверяется по всем обязательным атрибутам".
 *
 * Strategy: generate arbitrary Task objects whose validation-relevant fields
 * (neededDocs / docsToUpdate doc refs, assignedAgent, parts' assignedAgent)
 * are biased toward the edge cases that decide each flag — null, empty,
 * whitespace-only, and genuine non-blank strings — plus empty/non-empty
 * arrays. For each generated Task we INDEPENDENTLY recompute the expected set
 * of flagged attributes (without reusing the implementation's helpers) and
 * assert it equals the set returned by `validateTask`.
 *
 * Flag rules under test (IFF):
 * - 'neededDocs'     <=> no needed doc ref has a non-blank `id`.
 * - 'docsToUpdate'   <=> no docs-to-update ref has a non-blank `id`.
 * - 'assignedAgent'  <=> task.assignedAgent is null/empty/whitespace.
 * - 'partAssignment' <=> some part has a null/empty/whitespace assignedAgent
 *                        (empty parts array => NOT flagged).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Task, TaskAttribute, TaskPart, validateTask } from './task-validator.js';
import { DocRef } from './types.js';
import { newTaskTodo, Report } from './task-todo.js';

/**
 * Reference predicate (independent of the implementation): a value counts as
 * "specified" only when it is a non-empty, non-whitespace string.
 */
function isNonBlank(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** A doc-ref set is valid IFF at least one ref carries a non-blank `id`. */
function hasValidDoc(docs: DocRef[]): boolean {
  return docs.some((doc) => isNonBlank(doc.id));
}

/** Independently compute the expected set of flagged attributes for a Task. */
function expectedFlags(task: Task): Set<TaskAttribute> {
  const flags = new Set<TaskAttribute>();
  if (!hasValidDoc(task.neededDocs)) flags.add('neededDocs');
  if (!hasValidDoc(task.docsToUpdate)) flags.add('docsToUpdate');
  if (!isNonBlank(task.assignedAgent)) flags.add('assignedAgent');
  if (task.parts.some((part) => !isNonBlank(part.assignedAgent))) {
    flags.add('partAssignment');
  }
  return flags;
}

/** Whitespace-only / empty strings that must NOT count as specified. */
const blankString = fc.constantFrom('', ' ', '   ', '\t', '\n', ' \t \n ');

/** Strings guaranteed to be non-blank (have trimmable content). */
const nonBlankString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

/** Mix of blank, non-blank, and arbitrary strings for thorough coverage. */
const docId = fc.oneof(blankString, nonBlankString, fc.string());

/** assignedAgent: nullable, biased toward blank / non-blank edge cases. */
const agentArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  blankString,
  nonBlankString,
  fc.string()
);

const docRefArb: fc.Arbitrary<DocRef> = fc.record({ id: docId });
const docsArb: fc.Arbitrary<DocRef[]> = fc.array(docRefArb, { maxLength: 5 });

const partArb: fc.Arbitrary<TaskPart> = fc.record({
  description: fc.string(),
  assignedAgent: agentArb,
});
const partsArb: fc.Arbitrary<TaskPart[]> = fc.array(partArb, { maxLength: 5 });

const reportArb: fc.Arbitrary<Report | null> = fc.oneof(
  fc.constant(null),
  fc.record({ changes: fc.array(fc.string(), { maxLength: 3 }) })
);

const taskArb: fc.Arbitrary<Task> = fc.record({
  assignedAgent: agentArb,
  neededDocs: docsArb,
  docsToUpdate: docsArb,
  parts: partsArb,
  todo: fc.constant(newTaskTodo()),
  report: reportArb,
});

describe('validateTask — completeness across all mandatory attributes (Property 7)', () => {
  // Feature: fork-rebrand-task-workflow, Property 7: Полнота обычной Task проверяется по всем обязательным атрибутам
  it('flags exactly the attributes that violate their completeness rule', () => {
    // Validates: Requirements 5.5, 7.1, 7.2, 7.3, 8.11
    fc.assert(
      fc.property(taskArb, (task: Task) => {
        const actual = new Set(validateTask(task).map((flag) => flag.attribute));
        const expected = expectedFlags(task);

        // Order-insensitive set equality of flagged attributes.
        expect([...actual].sort()).toEqual([...expected].sort());
      }),
      { numRuns: 200 }
    );
  });
});

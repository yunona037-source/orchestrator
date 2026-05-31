// Feature: fork-rebrand-task-workflow, Property 6: Полнота записей Master_Task_List проверяется для каждой записи
/**
 * Property-based test for {@link validateMasterList} (Task 5.3).
 *
 * Property 6 — "Полнота записей Master_Task_List проверяется для каждой записи":
 *   For any list of Master_Task_List entries, `validateMasterList` processes
 *   EVERY entry (it never stops at the first error) and:
 *     - flags an entry with attribute `documentation` IFF it has no identifiable
 *       Documentation reference (missing / null / undefined / empty array, or
 *       every contained ref is null / has a missing / empty / whitespace-only
 *       `id`), and
 *     - flags an entry with attribute `specialistAgent` IFF it does not specify
 *       exactly one Specialist_Agent (missing / null / empty / whitespace-only,
 *       or more than one expressed via a `,`/`;` list separator).
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 *
 * Test design:
 *  - We build an INDEPENDENT oracle (`expectedDocFlag` / `expectedAgentFlag`)
 *    that encodes the acceptance criteria directly, then compare, for every
 *    entry index, the exact set of attributes reported by `validateMasterList`
 *    against the oracle's expected set. Per-index set equality simultaneously
 *    proves the IFF conditions (6.1/6.2/6.4/6.5) AND that all entries are
 *    processed (6.3): if the validator stopped early, later problematic entries
 *    would be missing their expected flags and the equality would fail.
 *  - Generators intelligently span the input space: valid/blank/null doc refs,
 *    empty/null/undefined documentation arrays, valid single agents, blank
 *    agents, multi-agent strings with separators, and free-form random strings.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateMasterList,
  MasterTaskListEntry,
  EntryAttribute,
} from './master-list-validator.js';
import { DocRef } from './types.js';

// --- Independent oracle (encodes the acceptance criteria, not the impl) -------

/**
 * Expected: an entry is flagged `documentation` IFF it has no identifiable
 * Documentation reference (Req 6.1, 6.4). Identifiable = the value is an array
 * containing at least one non-null ref whose `id` is a non-blank string.
 */
function expectedDocFlag(documentation: unknown): boolean {
  if (!Array.isArray(documentation) || documentation.length === 0) {
    return true;
  }
  const hasIdentifiable = documentation.some(
    (doc) =>
      doc != null &&
      typeof (doc as DocRef).id === 'string' &&
      (doc as DocRef).id.trim().length > 0,
  );
  return !hasIdentifiable;
}

/**
 * Expected: an entry is flagged `specialistAgent` IFF it does not specify
 * exactly one Specialist_Agent (Req 6.2, 6.5). Zero = non-string / null /
 * empty / whitespace-only; more-than-one = a `,` or `;` separator is present.
 */
function expectedAgentFlag(agent: unknown): boolean {
  if (typeof agent !== 'string' || agent.trim().length === 0) {
    return true; // zero agents
  }
  if (/[,;]/.test(agent)) {
    return true; // more than one agent
  }
  return false; // exactly one
}

// --- Generators ---------------------------------------------------------------

/** A single Documentation ref: valid id, blank id, free-form id, or a null ref. */
const docRefArb: fc.Arbitrary<DocRef | null> = fc.oneof(
  fc.record({ id: fc.constantFrom('docs/a.md', 'README.md', 'docs/arch/overview.md', 'guide') }),
  fc.record({ id: fc.constantFrom('', '   ', '\t', '\n  ', ' \t ') }),
  fc.record({ id: fc.string() }),
  fc.constant(null),
);

/** Documentation field: an array of refs, or a missing/null/undefined value. */
const documentationArb = fc.oneof(
  fc.array(docRefArb, { maxLength: 5 }),
  fc.constant(null),
  fc.constant(undefined),
);

/** specialistAgent field spanning zero / exactly-one / more-than-one cases. */
const specialistAgentArb: fc.Arbitrary<string | null> = fc.oneof(
  // exactly one (no list separator)
  fc.constantFrom('JavaScript', 'Rust', 'Python', 'Go', 'TypeScript', 'CSS', 'agent-1'),
  // zero: empty / whitespace-only
  fc.constantFrom('', '   ', '\t', '\n', '  \t '),
  // more than one (comma / semicolon separators)
  fc.constantFrom('Alice, Bob', 'X;Y', 'A,B,C', 'JavaScript; Rust', ' , '),
  // missing
  fc.constant(null),
  // free-form (may or may not contain separators / blanks)
  fc.string(),
);

const entryArb: fc.Arbitrary<MasterTaskListEntry> = fc
  .record({
    stage: fc.string(),
    documentation: documentationArb,
    specialistAgent: specialistAgentArb,
  })
  .map((r) => ({
    stage: r.stage,
    // The runtime tolerates null/undefined arrays and null refs; cast for typing.
    documentation: r.documentation as unknown as DocRef[],
    specialistAgent: r.specialistAgent,
  }));

const entriesArb = fc.array(entryArb, { maxLength: 12 });
const stagesArb = fc.array(fc.string(), { maxLength: 12 });

// --- Property -----------------------------------------------------------------

describe('Property 6: Полнота записей Master_Task_List проверяется для каждой записи', () => {
  it('flags exactly the expected attributes for every entry (IFF) and processes all entries', () => {
    fc.assert(
      fc.property(entriesArb, stagesArb, (entries, stages) => {
        const result = validateMasterList(entries, stages);

        // No flag may reference an index outside the entry range, and no
        // (index, attribute) pair may be duplicated.
        const seen = new Set<string>();
        for (const flag of result.flags) {
          expect(flag.index).toBeGreaterThanOrEqual(0);
          expect(flag.index).toBeLessThan(entries.length);
          const key = `${flag.index}:${flag.attribute}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }

        // For EVERY entry, the reported set of flagged attributes must equal the
        // oracle's expected set. This proves both the IFF conditions and that
        // all entries are processed (no early stop) — including entries that
        // exhibit BOTH problems, which must yield BOTH flags.
        entries.forEach((entry, index) => {
          const actual = new Set<EntryAttribute>(
            result.flags.filter((f) => f.index === index).map((f) => f.attribute),
          );

          const expected = new Set<EntryAttribute>();
          if (expectedDocFlag(entry.documentation)) {
            expected.add('documentation');
          }
          if (expectedAgentFlag(entry.specialistAgent)) {
            expected.add('specialistAgent');
          }

          expect(actual).toEqual(expected);
        });
      }),
      { numRuns: 200 },
    );
  });
});

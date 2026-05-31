/**
 * Property-based test for the README validator's missing-section reporting.
 *
 * Implements Property 4 from the design's Correctness Properties:
 * "Валидатор README перечисляет ровно отсутствующие обязательные разделы".
 *
 * Strategy: generate an arbitrary subset of the three required sections to
 * INCLUDE in a README, render each included section using a canonical heading
 * phrasing that the validator recognizes unambiguously (1:1 mapping, no
 * cross-matching between sections), then assert that `missingSections` is
 * exactly the set of required sections that were NOT included.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateReadme } from './readme-validator.js';
import { RebrandConfig, RequiredSection } from './types.js';

/** The three mandatory README sections (Req 2.4, 2.7). */
const ALL_SECTIONS: readonly RequiredSection[] = [
  'what-it-does',
  'who-its-for',
  'how-to-start',
];

/**
 * Canonical heading phrasings chosen so each maps to exactly one required
 * section under the validator's normalization rules, with no cross-matching:
 * - "What It Does" -> words {what, it, does}        => only `what-it-does`.
 * - "Who It's For" -> {who, it, s, for}             => only `who-its-for`.
 * - "How To Start" -> contains phrase "how to start"=> only `how-to-start`.
 */
const CANONICAL_HEADING: Record<RequiredSection, string> = {
  'what-it-does': 'What It Does',
  'who-its-for': "Who It's For",
  'how-to-start': 'How To Start',
};

/** A fixed config; `validateReadme` ignores it for section detection. */
const CONFIG: RebrandConfig = {
  newProjectName: 'My Tool',
  newPackageName: 'my-tool',
  newCliCommand: 'my-tool',
  newModeSlug: 'my-tool',
};

/** Builds a README with a title plus exactly the given sections (as headings). */
function buildReadme(included: readonly RequiredSection[]): string {
  const lines: string[] = ['# My Tool', ''];
  for (const section of included) {
    lines.push(`## ${CANONICAL_HEADING[section]}`);
    lines.push('Some narrative body text without any heading markers.');
    lines.push('');
  }
  return lines.join('\n');
}

describe('validateReadme — missing required sections (Property 4)', () => {
  // Feature: fork-rebrand-task-workflow, Property 4: Валидатор README перечисляет ровно отсутствующие обязательные разделы
  it('reports exactly the required sections that are absent', () => {
    // Validates: Requirements 2.7
    fc.assert(
      fc.property(
        fc.subarray([...ALL_SECTIONS]),
        (included: RequiredSection[]) => {
          const readme = buildReadme(included);
          const { missingSections } = validateReadme(readme, CONFIG);

          const expectedMissing = ALL_SECTIONS.filter(
            (section) => !included.includes(section)
          );

          // Order-insensitive set equality.
          expect([...missingSections].sort()).toEqual(
            [...expectedMissing].sort()
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

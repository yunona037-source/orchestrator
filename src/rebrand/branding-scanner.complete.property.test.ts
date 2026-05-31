/**
 * Property-based test for the branding scanner — Property 2.
 *
 * Feature: fork-rebrand-task-workflow, Property 2: Завершённость ребрендинга
 * эквивалентна пустому сканированию
 *
 * For any set of tracked files, `isRebrandComplete(files)` returns `true` if and
 * only if `scanBranding(files)` (with `CHANGELOG.md` excluded) returns an empty
 * list. Excluded files may contain branding tokens but must never affect
 * completeness.
 *
 * Validates: Requirements 1.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanBranding, isRebrandComplete } from './branding-scanner.js';
import { BRANDING_TOKENS, FileContent } from './types.js';

/**
 * Safe words that cannot, on their own or when space-joined, form any branding
 * token. Used to build "clean" lines so that completeness is genuinely `true`
 * for a meaningful fraction of generated cases.
 */
const SAFE_WORDS = [
  'flow',
  'orchestrator',
  'build',
  'ship',
  'code',
  'docs',
  'plan',
  'task',
  'agent',
  'review',
] as const;

/** A clean line guaranteed to contain no branding tokens. */
const cleanLine = fc
  .array(fc.constantFrom(...SAFE_WORDS), { maxLength: 6 })
  .map((words) => words.join(' '));

/** A branding token in a few representative casings (the scanner is case-insensitive). */
const cased = (token: string): string[] => {
  const title = token.replace(/\b\w/g, (c) => c.toUpperCase());
  return [token, token.toUpperCase(), title];
};
const brandingVariant = fc.constantFrom(
  ...BRANDING_TOKENS.flatMap((token) => cased(token))
);

/** A line that is guaranteed to contain at least one branding token. */
const taintedLine = fc
  .tuple(cleanLine, brandingVariant, cleanLine)
  .map(([prefix, token, suffix]) => `${prefix} ${token} ${suffix}`);

/** A line that may or may not contain branding tokens. */
const anyLine = fc.oneof(cleanLine, taintedLine);

/** A non-excluded tracked file whose content sometimes contains branding. */
const normalFile = fc
  .tuple(fc.stringMatching(/^[a-z]{1,8}$/), fc.array(anyLine, { maxLength: 5 }))
  .map(
    ([name, lines]): FileContent => ({
      path: `src/${name}.ts`,
      excluded: false,
      lines,
    })
  );

/**
 * An excluded file (CHANGELOG.md). Its lines are biased toward branding tokens
 * so the generator routinely produces excluded files that DO contain branding,
 * which must not affect completeness.
 */
const excludedFile = fc
  .array(fc.oneof(taintedLine, taintedLine, anyLine), { maxLength: 5 })
  .map(
    (lines): FileContent => ({
      path: 'CHANGELOG.md',
      excluded: true,
      lines,
    })
  );

const fileSet = fc
  .tuple(
    fc.array(normalFile, { maxLength: 6 }),
    fc.array(excludedFile, { maxLength: 2 })
  )
  .map(([normal, excluded]) => [...normal, ...excluded]);

describe('branding-scanner — Property 2: completeness equals empty scan', () => {
  it('isRebrandComplete(files) === (scanBranding(files).length === 0)', () => {
    fc.assert(
      fc.property(fileSet, (files) => {
        expect(isRebrandComplete(files)).toBe(scanBranding(files).length === 0);
      }),
      { numRuns: 200 }
    );
  });
});

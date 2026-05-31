/**
 * Property-based test for `validateProjectRules` loadability semantics.
 *
 * Implements Property 16 from the design's Correctness Properties:
 * "Пригодность Project_Rules эквивалентна отсутствию плейсхолдеров".
 *
 * Strategy: build arbitrary resolved-rules text by interleaving safe literal
 * text (guaranteed free of `{` / `}` so it can never form an accidental
 * `{{PLACEHOLDER}}`) with optional `{{NAME}}` placeholder tokens. Because the
 * only braces in the generated text come from the tokens we inject, we can
 * INDEPENDENTLY track the exact set of remaining placeholder names (in order of
 * first appearance) and assert it against the implementation.
 *
 * Properties under test (IFF):
 * - `validateProjectRules(text).loadable === true`  <=>  no `{{PLACEHOLDER}}`
 *   is present, i.e. `scanPlaceholders(text).length === 0`.
 * - `validateProjectRules(text).unresolved` equals exactly the set/sequence of
 *   remaining placeholder names — identical to `scanPlaceholders(text)`.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanPlaceholders, validateProjectRules } from './placeholder-resolver.js';

/**
 * Placeholder name: at least one char from the alphabet accepted by
 * `PLACEHOLDER_RE` (`A-Z`, `0-9`, `_`), so every generated `{{NAME}}` is a
 * genuine placeholder match.
 */
const placeholderName: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('')), {
    minLength: 1,
    maxLength: 12,
  })
  .map((chars) => chars.join(''));

/**
 * Safe literal text: arbitrary strings with all braces stripped, so literals
 * can never accidentally contribute a `{{...}}` token. This isolates the only
 * placeholder matches to the tokens we explicitly inject.
 */
const safeLiteral: fc.Arbitrary<string> = fc
  .string()
  .map((s) => s.replace(/[{}]/g, ''));

type Segment = { kind: 'literal'; text: string } | { kind: 'placeholder'; name: string };

const segmentArb: fc.Arbitrary<Segment> = fc.oneof(
  safeLiteral.map((text) => ({ kind: 'literal' as const, text })),
  placeholderName.map((name) => ({ kind: 'placeholder' as const, name }))
);

/** A whole resolved-rules document: a sequence of literal/placeholder segments. */
const segmentsArb: fc.Arbitrary<Segment[]> = fc.array(segmentArb, { maxLength: 12 });

describe('validateProjectRules — loadability equivalent to absence of placeholders (Property 16)', () => {
  // Feature: fork-rebrand-task-workflow, Property 16: Пригодность Project_Rules эквивалентна отсутствию плейсхолдеров
  it('is loadable IFF no placeholder remains, and lists exactly the remaining placeholders', () => {
    // Validates: Requirements 10.5, 10.6
    fc.assert(
      fc.property(segmentsArb, (segments: Segment[]) => {
        // Build the document and INDEPENDENTLY track inserted placeholder names
        // in order of first appearance (de-duplicated).
        let text = '';
        const seen = new Set<string>();
        const expectedUnresolved: string[] = [];
        for (const segment of segments) {
          if (segment.kind === 'literal') {
            text += segment.text;
          } else {
            text += `{{${segment.name}}}`;
            if (!seen.has(segment.name)) {
              seen.add(segment.name);
              expectedUnresolved.push(segment.name);
            }
          }
        }

        const result = validateProjectRules(text);
        const scanned = scanPlaceholders(text);

        // `unresolved` lists exactly the remaining placeholder names — and is
        // identical to `scanPlaceholders` (same content and order).
        expect(result.unresolved).toEqual(scanned);
        expect(result.unresolved).toEqual(expectedUnresolved);

        // `loadable` is true IFF there are no placeholders left.
        expect(result.loadable).toBe(scanned.length === 0);
        expect(result.loadable).toBe(expectedUnresolved.length === 0);
      }),
      { numRuns: 200 }
    );
  });
});

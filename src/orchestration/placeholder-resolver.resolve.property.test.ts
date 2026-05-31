/**
 * Property-based test for placeholder resolution (`resolvePlaceholders`).
 *
 * Implements Property 15 from the design's Correctness Properties:
 * "Разрешение плейсхолдеров сохраняет нерешённые и подставляет известные".
 *
 * Strategy: build templates from a fixed pool of KNOWN placeholder names,
 * interleaving real `{{NAME}}` tokens with literal text drawn from a SAFE
 * alphabet that contains no braces (so the only `{{ }}` in a template come
 * from intentionally emitted placeholders). The set of placeholder names used
 * is tracked independently during construction (an oracle that does NOT call
 * the implementation). A values map is generated as an arbitrary subset of the
 * known names plus some extra names that never appear in any template; each
 * value is a distinctive, brace-free marker so substituted text is detectable
 * and can never look like a placeholder.
 *
 * Assertions (for every template `t` and values map `v`):
 * 1. scanPlaceholders(resolvePlaceholders(t, v)) === templateNames \ keys(v).
 *    (Known placeholders are substituted; unknown ones survive verbatim.)
 * 2. For each template placeholder whose name is in `v`, the substituted value
 *    is present in the resolved output.
 * 3. Idempotency under the same map:
 *    resolvePlaceholders(resolvePlaceholders(t, v), v) === resolvePlaceholders(t, v).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanPlaceholders, resolvePlaceholders } from './placeholder-resolver.js';

/** Fixed pool of valid placeholder names ([A-Z0-9_]+) that templates draw from. */
const KNOWN_NAMES = [
  'ALPHA',
  'BETA',
  'GAMMA',
  'DELTA',
  'PROJECT_NAME',
  'CLI_CMD',
  'SLUG',
  'X1',
  'Y2',
] as const;

/** Names that may appear in the values map but never in any template. */
const EXTRA_NAMES = ['EXTRA1', 'EXTRA2', 'UNUSED'] as const;

const ALL_VALUE_NAMES = [...KNOWN_NAMES, ...EXTRA_NAMES];

/**
 * Safe literal/value characters: deliberately excludes `{` and `}` so neither
 * literal text nor substituted values can ever form or resemble a
 * `{{PLACEHOLDER}}` token.
 */
const SAFE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789 .,;:-_/()'.split('');
const safeChar = fc.constantFrom(...SAFE_CHARS);

/** Brace-free literal text fragment placed between placeholders. */
const literalText = fc.array(safeChar, { maxLength: 12 }).map((cs) => cs.join(''));

/** A template segment: either literal text or a placeholder from KNOWN_NAMES. */
type Segment = { kind: 'literal'; text: string } | { kind: 'ph'; name: string };

const segmentArb: fc.Arbitrary<Segment> = fc.oneof(
  literalText.map((text) => ({ kind: 'literal' as const, text })),
  fc.constantFrom(...KNOWN_NAMES).map((name) => ({ kind: 'ph' as const, name }))
);

const segmentsArb = fc.array(segmentArb, { maxLength: 20 });

/**
 * Build a template string from segments and, independently of the
 * implementation, track the set of placeholder names that were emitted.
 */
function buildTemplate(segments: Segment[]): { template: string; names: Set<string> } {
  let template = '';
  const names = new Set<string>();
  for (const seg of segments) {
    if (seg.kind === 'literal') {
      template += seg.text;
    } else {
      template += `{{${seg.name}}}`;
      names.add(seg.name);
    }
  }
  return { template, names };
}

/** Brace-free content used to build distinctive substitution values. */
const valueContent = fc.array(safeChar, { maxLength: 6 }).map((cs) => cs.join(''));

/**
 * Values map: an arbitrary subset of ALL_VALUE_NAMES (each name independently
 * present or absent) mapped to a distinctive, brace-free marker value.
 */
const valuesArb: fc.Arbitrary<Record<string, string>> = fc
  .record(
    Object.fromEntries(
      ALL_VALUE_NAMES.map((name) => [name, fc.option(valueContent, { nil: undefined })])
    ) as Record<string, fc.Arbitrary<string | undefined>>
  )
  .map((rec) => {
    const map: Record<string, string> = {};
    for (const [name, content] of Object.entries(rec)) {
      if (content !== undefined) {
        // Marker uses square brackets (never braces) so it cannot be mistaken
        // for a placeholder, and embeds the name to stay unique per key.
        map[name] = `[[V_${name}_${content}]]`;
      }
    }
    return map;
  });

describe('resolvePlaceholders — preserves unknown placeholders and substitutes known ones (Property 15)', () => {
  // Feature: fork-rebrand-task-workflow, Property 15: Разрешение плейсхолдеров сохраняет нерешённые и подставляет известные
  it('leaves exactly the unresolved placeholders, injects known values, and is idempotent', () => {
    // Validates: Requirements 10.4
    fc.assert(
      fc.property(segmentsArb, valuesArb, (segments, values) => {
        const { template, names: templateNames } = buildTemplate(segments);

        const resolved = resolvePlaceholders(template, values);

        // (1) Remaining placeholders == template placeholders minus resolved keys.
        const remaining = new Set(scanPlaceholders(resolved));
        const expectedRemaining = new Set(
          [...templateNames].filter(
            (name) => !Object.prototype.hasOwnProperty.call(values, name)
          )
        );
        expect([...remaining].sort()).toEqual([...expectedRemaining].sort());

        // (2) Every provided value for a name present in the template appears
        //     verbatim in the resolved output.
        for (const name of templateNames) {
          if (Object.prototype.hasOwnProperty.call(values, name)) {
            expect(resolved.includes(values[name])).toBe(true);
          }
        }

        // (3) Idempotency under the same values map.
        expect(resolvePlaceholders(resolved, values)).toBe(resolved);
      }),
      { numRuns: 200 }
    );
  });
});

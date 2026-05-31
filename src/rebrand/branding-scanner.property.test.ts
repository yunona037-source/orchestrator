// Feature: fork-rebrand-task-workflow, Property 3: Сканер точно локализует все вхождения брендинга
/**
 * Property-based test for the branding scanner's localization guarantee.
 *
 * Property 3: Сканер точно локализует все вхождения брендинга.
 * For any set of files where branding tokens are inserted at KNOWN positions
 * (interleaved with random non-branding filler text), `scanBranding` returns a
 * finding for each inserted occurrence with the correct `filePath`, `line` and
 * `column`, with NO findings in excluded files and NO extra/spurious findings.
 * The findings correspond 1:1 to the inserted occurrences.
 *
 * **Validates: Requirements 1.7**
 *
 * Generator soundness
 * -------------------
 * All three branding tokens (`roo-commander`, `roocommander`, `roo commander`)
 * begin with the letter `r`. The scanner lowercases each line, matches the
 * longest applicable token first, and advances past every match so that matches
 * never overlap. Consequently a match can only START at a character that
 * lowercases to `r`. By drawing filler text from an alphabet that excludes
 * `r`/`R`, the only possible match-start positions are exactly the inserted
 * tokens, and each inserted token is fully consumed when matched (its internal
 * characters, including any trailing `r`, are never re-examined). This makes the
 * mapping between inserted occurrences and findings exact, with no accidental
 * branding tokens in the filler and no boundary-overlap artifacts.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanBranding } from './branding-scanner.js';
import { BRANDING_TOKENS, FileContent, BrandingFinding } from './types.js';

/**
 * A line is built from an ordered list of segments. Filler segments contribute
 * no findings; token segments contribute exactly one finding at their column.
 */
type Segment =
  | { type: 'filler'; text: string }
  | { type: 'token'; base: string; cased: string };

interface FileSpec {
  excluded: boolean;
  lines: Segment[][];
}

/**
 * Filler alphabet: all letters except `r`/`R`, digits, spaces and a few
 * punctuation marks. Excluding `r`/`R` guarantees filler can never start or
 * contain a branding token (every token starts with `r`).
 */
const SAFE_CHARS: string[] = (() => {
  const chars: string[] = [];
  for (const c of 'abcdefghijklmnopqrstuvwxyz') if (c !== 'r') chars.push(c);
  for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (c !== 'R') chars.push(c);
  for (const c of '0123456789 .,!_/-') chars.push(c);
  return chars;
})();

/** Applies a per-character upper/lower casing pattern to a token. */
function applyCasing(base: string, flags: boolean[]): string {
  let out = '';
  for (let i = 0; i < base.length; i += 1) {
    out += flags[i] ? base[i].toUpperCase() : base[i].toLowerCase();
  }
  return out;
}

const fillerSegmentArb = fc
  .array(fc.constantFrom(...SAFE_CHARS), { maxLength: 10 })
  .map((chars): Segment => ({ type: 'filler', text: chars.join('') }));

const tokenSegmentArb = fc
  .constantFrom(...BRANDING_TOKENS)
  .chain((base) =>
    fc
      .array(fc.boolean(), { minLength: base.length, maxLength: base.length })
      .map((flags): Segment => ({
        type: 'token',
        base,
        cased: applyCasing(base, flags),
      }))
  );

const segmentArb = fc.oneof(fillerSegmentArb, tokenSegmentArb);
const lineArb = fc.array(segmentArb, { maxLength: 6 });
const fileSpecArb = fc.record<FileSpec>({
  excluded: fc.boolean(),
  lines: fc.array(lineArb, { maxLength: 5 }),
});
const scenarioArb = fc.array(fileSpecArb, { maxLength: 5 });

/**
 * Materializes file specs into concrete {@link FileContent} inputs and the
 * findings expected from a correct scanner, walking files -> lines -> segments
 * left-to-right (exactly the order in which {@link scanBranding} reports them).
 */
function buildScenario(specs: FileSpec[]): {
  files: FileContent[];
  expected: BrandingFinding[];
} {
  const files: FileContent[] = [];
  const expected: BrandingFinding[] = [];

  specs.forEach((spec, fileIndex) => {
    const path = `src/file-${fileIndex}.md`;
    const lines: string[] = [];

    spec.lines.forEach((segments, lineIndex) => {
      let lineText = '';
      let column = 0;

      for (const segment of segments) {
        if (segment.type === 'filler') {
          lineText += segment.text;
          column += segment.text.length;
          continue;
        }

        // Excluded files (CHANGELOG.md) must produce no findings (Req 1.5/1.7).
        if (!spec.excluded) {
          expected.push({
            filePath: path,
            line: lineIndex + 1,
            column,
            matchedText: segment.cased,
            token: segment.base,
          });
        }

        lineText += segment.cased;
        column += segment.cased.length;
      }

      lines.push(lineText);
    });

    files.push({ path, excluded: spec.excluded, lines });
  });

  return { files, expected };
}

describe('scanBranding — Property 3: exact localization of branding occurrences', () => {
  it('reports every inserted occurrence with correct path/line/column and nothing more', () => {
    fc.assert(
      fc.property(scenarioArb, (specs) => {
        const { files, expected } = buildScenario(specs);
        const findings = scanBranding(files);

        // 1:1 correspondence in count, position and order with inserted tokens.
        expect(findings).toEqual(expected);

        // Explicit restatements of the property's clauses for clear diagnostics.
        expect(findings).toHaveLength(expected.length);

        const excludedPaths = new Set(
          files.filter((f) => f.excluded).map((f) => f.path)
        );
        const findingInExcluded = findings.some((f) =>
          excludedPaths.has(f.filePath)
        );
        expect(findingInExcluded).toBe(false);
      }),
      { numRuns: 200 }
    );
  });
});

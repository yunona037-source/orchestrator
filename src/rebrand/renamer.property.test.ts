// Feature: fork-rebrand-task-workflow, Property 1: Ребрендинг устраняет весь брендинг
/**
 * Property-based test for {@link applyRebrand} (Task 2.6).
 *
 * Property 1 — "Ребрендинг устраняет весь брендинг":
 *   For any set of tracked files, after applying `applyRebrand` with a VALID
 *   {@link RebrandConfig} (whose derived names contain no branding token),
 *   re-scanning with `scanBranding` finds ZERO branding occurrences in every
 *   non-excluded file. `CHANGELOG.md` files are excluded: their branding is left
 *   in place and the scanner skips them, so they never produce findings.
 *
 * **Validates: Requirements 1.1, 1.6**
 *
 * Generation strategy (kept faithful to the spec's intent):
 *  - Non-excluded files contain lines built by interleaving "safe filler" words
 *    (which contain no branding fragments) with whole branding tokens inserted
 *    at random positions, joined by single spaces.
 *  - Branding tokens are drawn in several letter-cases to exercise the
 *    case-insensitive matching/replacement (Req 1.1).
 *  - CHANGELOG.md files (excluded === true) may also contain branding tokens;
 *    they must remain untouched and must never be flagged.
 *  - The RebrandConfig is generated from safe name parts so that no derived name
 *    contains a branding token (a precondition of the rebrand) and so that no
 *    derived name can combine with neighbouring text to re-form a token.
 *
 * `applyRebrand` mutates `file.lines` in place, so each run clones its inputs
 * before applying the rebrand.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { applyRebrand } from './renamer.js';
import { scanBranding } from './branding-scanner.js';
import { FileContent, RebrandConfig } from './types.js';

/**
 * Filler words used to surround inserted branding tokens. None of them contains
 * a branding fragment ("roo" / "commander"), so the only branding in generated
 * content comes from the explicitly inserted tokens.
 */
const SAFE_WORDS = [
  'alpha', 'beta', 'gamma', 'module', 'function', 'config', 'value', 'data',
  'hello', 'world', 'build', 'deploy', 'engine', 'system', 'widget', 'docs',
] as const;

/**
 * Branding tokens in assorted letter-cases. All are matched case-insensitively
 * by the scanner and replaced case-insensitively by `applyRebrand`.
 */
const BRANDING_TOKEN_VARIANTS = [
  'roo-commander', 'Roo-Commander', 'ROO-COMMANDER',
  'roocommander', 'RooCommander', 'ROOCOMMANDER',
  'roo commander', 'Roo Commander', 'ROO COMMANDER',
] as const;

/**
 * Safe name parts used to build config derived names. None contains "roo" or
 * "commander", and none ends in "roo" or starts with a "commander" fragment, so
 * no generated derived name can re-form a branding token with adjacent text.
 */
const NAME_PARTS = [
  'flow', 'nova', 'orch', 'engine', 'forge', 'atlas', 'prism', 'vertex', 'spark',
] as const;

const safeWordArb = fc.constantFrom(...SAFE_WORDS);
const brandingTokenArb = fc.constantFrom(...BRANDING_TOKEN_VARIANTS);

/** A line: safe words and branding tokens interleaved at random and space-joined. */
const lineArb = fc
  .array(fc.oneof(safeWordArb, brandingTokenArb), { maxLength: 6 })
  .map((segments) => segments.join(' '));

const linesArb = fc.array(lineArb, { maxLength: 5 });

/** A normal (non-excluded) tracked file. */
const nonExcludedFileArb: fc.Arbitrary<FileContent> = fc
  .tuple(
    fc.tuple(fc.constantFrom(...SAFE_WORDS), fc.constantFrom('a', 'b', 'c', 'd')),
    linesArb
  )
  .map(([[dir, name], lines]) => ({
    path: `${dir}/${name}.md`,
    excluded: false,
    lines,
  }));

/** An excluded CHANGELOG.md file whose branding must be preserved and skipped. */
const excludedFileArb: fc.Arbitrary<FileContent> = linesArb.map((lines) => ({
  path: 'CHANGELOG.md',
  excluded: true,
  lines,
}));

/** A set of tracked files, optionally including an excluded CHANGELOG.md. */
const filesArb: fc.Arbitrary<FileContent[]> = fc
  .tuple(
    fc.array(nonExcludedFileArb, { maxLength: 5 }),
    fc.option(excludedFileArb, { nil: undefined })
  )
  .map(([normal, changelog]) =>
    changelog ? [...normal, changelog] : normal
  );

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** A valid RebrandConfig: derived names never contain (or can re-form) a token. */
const configArb: fc.Arbitrary<RebrandConfig> = fc
  .tuple(
    fc.constantFrom(...NAME_PARTS),
    fc.constantFrom(...NAME_PARTS),
    fc.constantFrom(...NAME_PARTS)
  )
  .map(([a, b, c]) => ({
    newProjectName: `${titleCase(a)} ${titleCase(b)}`,
    newPackageName: `${a}-${b}`,
    newCliCommand: `${a}-${c}`,
    newModeSlug: `${a}-${b}-${c}`,
  }));

/** Deep-clones files so the in-place mutation by `applyRebrand` is isolated per run. */
const cloneFiles = (files: FileContent[]): FileContent[] =>
  files.map((f) => ({ path: f.path, excluded: f.excluded, lines: [...f.lines] }));

describe('Property 1: Ребрендинг устраняет весь брендинг (applyRebrand)', () => {
  it('leaves zero branding occurrences in non-excluded files after rebrand', () => {
    fc.assert(
      fc.property(filesArb, configArb, (files, config) => {
        const working = cloneFiles(files);

        applyRebrand(working, config);

        // After a valid rebrand, no branding token remains in any scannable
        // (non-excluded) file (Req 1.1, 1.6). CHANGELOG.md is skipped by the
        // scanner, so its preserved branding never appears here.
        expect(scanBranding(working)).toEqual([]);
      }),
      { numRuns: 200 }
    );
  });
});

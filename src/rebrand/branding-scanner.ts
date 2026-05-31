/**
 * Branding Scanner for the Rebranding Layer (`src/rebrand/`)
 *
 * Locates every occurrence of the old branding tokens across the set of tracked
 * files so that they can be flagged for fixing. Scanning is case-insensitive and
 * exhaustive (it never stops on the first match), and files marked `excluded`
 * (i.e. `CHANGELOG.md`) are skipped entirely.
 *
 * An empty scan result means the rebrand is complete; {@link isRebrandComplete}
 * exposes that equivalence directly.
 *
 * Validates: Requirements 1.5, 1.6, 1.7
 */

import { BRANDING_TOKENS, FileContent, BrandingFinding } from './types.js';

/**
 * Branding tokens sorted by descending length.
 *
 * Matching longest-first guarantees that, at any given position, the longest
 * applicable token is reported. The three tokens differ at their 4th character
 * (`'-'`, `'c'`, `' '`), so no two tokens can ever match at the same start
 * position; the ordering only matters for determinism and future-proofing.
 */
const SORTED_TOKENS: readonly string[] = [...BRANDING_TOKENS].sort(
  (a, b) => b.length - a.length
);

/**
 * Scans a set of tracked files and returns ALL branding-token occurrences
 * (case-insensitive), EXCEPT in files marked `excluded` (`CHANGELOG.md`).
 *
 * Files are processed in full (scanning does not stop on the first match), and
 * each occurrence is reported exactly once with the token it matched. Matches
 * are non-overlapping: once a token is matched at a position, scanning continues
 * after the matched fragment. An empty result means no branding remains, i.e.
 * the rebrand is complete (Req 1.5 / 1.6).
 *
 * @param files - Tracked files with their content split into lines.
 * @returns Every located occurrence as a {@link BrandingFinding}.
 */
export function scanBranding(files: FileContent[]): BrandingFinding[] {
  const findings: BrandingFinding[] = [];

  for (const file of files) {
    // Excluded files (CHANGELOG.md) are exempt from branding removal (Req 1.5).
    if (file.excluded) {
      continue;
    }

    file.lines.forEach((lineText, lineIndex) => {
      scanLine(file.path, lineIndex + 1, lineText, findings);
    });
  }

  return findings;
}

/**
 * Determines whether the rebrand is complete.
 *
 * Completeness is defined as the absence of any branding occurrence in the
 * scannable (non-excluded) files, so this is exactly the emptiness of
 * {@link scanBranding} (Req 1.5).
 *
 * @param files - Tracked files with their content split into lines.
 * @returns `true` if and only if {@link scanBranding} returns an empty list.
 */
export function isRebrandComplete(files: FileContent[]): boolean {
  return scanBranding(files).length === 0;
}

/**
 * Scans a single line for non-overlapping, case-insensitive branding matches and
 * appends a finding for each occurrence.
 *
 * @param filePath - Path of the file the line belongs to.
 * @param lineNumber - 1-indexed line number.
 * @param lineText - The original (case-preserving) line content.
 * @param findings - Accumulator the located occurrences are appended to.
 */
function scanLine(
  filePath: string,
  lineNumber: number,
  lineText: string,
  findings: BrandingFinding[]
): void {
  const haystack = lineText.toLowerCase();

  let position = 0;
  while (position < haystack.length) {
    const token = SORTED_TOKENS.find((candidate) =>
      haystack.startsWith(candidate, position)
    );

    if (token === undefined) {
      position += 1;
      continue;
    }

    findings.push({
      filePath,
      line: lineNumber,
      column: position,
      matchedText: lineText.slice(position, position + token.length),
      token,
    });

    // Advance past the matched fragment to keep matches non-overlapping and to
    // report each occurrence position exactly once.
    position += token.length;
  }
}

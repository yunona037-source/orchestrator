/**
 * Sanity unit tests for the branding scanner.
 *
 * These cover concrete examples and edge cases. The universal properties for the
 * scanner (Property 2 and Property 3) are implemented separately in tasks 2.3/2.4.
 */

import { describe, it, expect } from 'vitest';
import { scanBranding, isRebrandComplete } from './branding-scanner.js';
import { FileContent } from './types.js';

function file(
  path: string,
  lines: string[],
  excluded = false
): FileContent {
  return { path, excluded, lines };
}

describe('scanBranding', () => {
  it('returns no findings for clean files', () => {
    const files = [file('README.md', ['Flow Orchestrator', 'A clean tool'])];
    expect(scanBranding(files)).toEqual([]);
  });

  it('locates a match with 1-indexed line and 0-based column', () => {
    const files = [file('docs/a.md', ['intro', 'see roo-commander here'])];
    const findings = scanBranding(files);

    expect(findings).toEqual([
      {
        filePath: 'docs/a.md',
        line: 2,
        column: 4,
        matchedText: 'roo-commander',
        token: 'roo-commander',
      },
    ]);
  });

  it('matches case-insensitively but preserves the original matched text', () => {
    const files = [file('a.md', ['Powered by Roo Commander!'])];
    const findings = scanBranding(files);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      matchedText: 'Roo Commander',
      token: 'roo commander',
      line: 1,
      column: 11,
    });
  });

  it('reports the distinct tokens roocommander and roo-commander', () => {
    const files = [file('pkg.md', ['roocommander and roo-commander'])];
    const tokens = scanBranding(files).map((f) => f.token);

    expect(tokens).toEqual(['roocommander', 'roo-commander']);
  });

  it('finds multiple non-overlapping matches on a single line', () => {
    const files = [file('a.md', ['roo-commander roo-commander'])];
    const findings = scanBranding(files);

    expect(findings.map((f) => f.column)).toEqual([0, 14]);
  });

  it('skips files marked as excluded (CHANGELOG.md)', () => {
    const files = [
      file('CHANGELOG.md', ['- renamed roo-commander to flow'], true),
      file('README.md', ['clean']),
    ];
    expect(scanBranding(files)).toEqual([]);
  });

  it('processes every file fully without stopping on the first match', () => {
    const files = [
      file('a.md', ['roocommander']),
      file('b.md', ['roo commander']),
    ];
    expect(scanBranding(files).map((f) => f.filePath)).toEqual([
      'a.md',
      'b.md',
    ]);
  });
});

describe('isRebrandComplete', () => {
  it('is true when there are no findings', () => {
    expect(isRebrandComplete([file('README.md', ['clean'])])).toBe(true);
  });

  it('is false when a branding token remains', () => {
    expect(isRebrandComplete([file('README.md', ['roocommander'])])).toBe(
      false
    );
  });

  it('is true when the only occurrence is in an excluded file', () => {
    expect(
      isRebrandComplete([file('CHANGELOG.md', ['roo-commander'], true)])
    ).toBe(true);
  });
});

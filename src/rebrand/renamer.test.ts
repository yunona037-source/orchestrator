/**
 * Unit tests for the mechanical rebrander (`src/rebrand/renamer.ts`).
 *
 * These cover the concrete rebranding points called out by Task 2.7: package
 * identity replacement in a `package.json`-like file (`name` + `bin` key),
 * mode-slug replacement, renaming of the `rules-roo-commander/` directory path,
 * and rejection of a {@link RebrandConfig} whose derived names still contain an
 * old branding token. These are example-based checks; the universal "no branding
 * remains" property is covered separately by the property test (Task 2.6).
 *
 * Validates: Requirements 1.2, 1.3, 1.4
 */

import { describe, it, expect } from 'vitest';
import { applyRebrand, assertConfigHasNoBranding } from './renamer.js';
import { FileContent, RebrandConfig } from './types.js';

/** Representative rebrand config (Flow Orchestrator). */
const config: RebrandConfig = {
  newProjectName: 'Flow Orchestrator',
  newPackageName: 'flow-orchestrator',
  newCliCommand: 'flow-orch',
  newModeSlug: 'flow-orchestrator',
};

function file(path: string, lines: string[], excluded = false): FileContent {
  return { path, excluded, lines };
}

describe('applyRebrand - package.json rebranding points (Req 1.2, 1.3)', () => {
  it('replaces the package "name" and the "bin" key with the new package name', () => {
    const pkg = file('package.json', [
      '{',
      '  "name": "roocommander",',
      '  "bin": {',
      '    "roocommander": "./dist/index.js"',
      '  }',
      '}',
    ]);

    const result = applyRebrand([pkg], config);

    expect(pkg.lines[1]).toBe('  "name": "flow-orchestrator",');
    expect(pkg.lines[3]).toBe('    "flow-orchestrator": "./dist/index.js"');
    expect(result.changedFiles).toContain('package.json');
  });

  it('replaces the mode slug roo-commander with the new mode slug (Req 1.4)', () => {
    const modes = file('.roomodes-entry.yaml', ['slug: roo-commander']);

    applyRebrand([modes], config);

    expect(modes.lines[0]).toBe('slug: flow-orchestrator');
  });

  it('maps each branding token form to its distinct derived name', () => {
    // Use a config where every derived name differs so the per-token mapping is
    // observable: "roocommander" -> package, "roo-commander" -> slug,
    // "roo commander" -> project name.
    const distinct: RebrandConfig = {
      newProjectName: 'Flow Orchestrator',
      newPackageName: 'flow-pkg',
      newCliCommand: 'flow-orch',
      newModeSlug: 'flow-mode',
    };
    const f = file('mix.md', ['roocommander roo-commander Roo Commander']);

    applyRebrand([f], distinct);

    expect(f.lines[0]).toBe('flow-pkg flow-mode Flow Orchestrator');
  });

  it('leaves CHANGELOG.md untouched and reports no change for it', () => {
    const changelog = file('CHANGELOG.md', ['- renamed roocommander'], true);

    const result = applyRebrand([changelog], config);

    expect(changelog.lines[0]).toBe('- renamed roocommander');
    expect(result.changedFiles).not.toContain('CHANGELOG.md');
  });
});

describe('applyRebrand - rules directory rename (Req 1.4)', () => {
  it('reports the rules-roo-commander/ path renamed to rules-<newModeSlug>', () => {
    const rulePath = 'src/templates/rules-roo-commander/00-core-identity.md';
    const ruleFile = file(rulePath, ['# Core Identity']);

    const result = applyRebrand([ruleFile], config);

    expect(result.renamedPaths).toContainEqual({
      from: rulePath,
      to: 'src/templates/rules-flow-orchestrator/00-core-identity.md',
    });
    // The path itself is reported, not mutated in place.
    expect(ruleFile.path).toBe(rulePath);
  });

  it('does not report a rename for a path without a branding token', () => {
    const clean = file('src/templates/rules/02-cli-usage.md', ['# Usage']);

    const result = applyRebrand([clean], config);

    expect(result.renamedPaths).toEqual([]);
  });
});

describe('config validation rejects residual branding (Req 1.2, 1.3, 1.4)', () => {
  it('throws when newPackageName still contains a branding token', () => {
    const bad: RebrandConfig = { ...config, newPackageName: 'roocommander-x' };

    expect(() => assertConfigHasNoBranding(bad)).toThrow();
    expect(() => applyRebrand([file('a.md', ['hi'])], bad)).toThrow();
  });

  it('throws when newModeSlug still contains a branding token', () => {
    const bad: RebrandConfig = { ...config, newModeSlug: 'roo-commander-2' };

    expect(() => assertConfigHasNoBranding(bad)).toThrow();
    expect(() => applyRebrand([file('a.md', ['hi'])], bad)).toThrow();
  });

  it('accepts a config whose derived names contain no branding token', () => {
    expect(() => assertConfigHasNoBranding(config)).not.toThrow();
  });
});

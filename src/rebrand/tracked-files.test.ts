import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listTrackedFiles } from './tracked-files.js';

/**
 * Unit / smoke tests for `listTrackedFiles`.
 *
 * These exercise the wrapper against a real git repository (the orchestrator
 * repo itself) and against a non-git directory, covering the success path and
 * the required error behavior (Requirements 1.1, 1.5).
 */
describe('listTrackedFiles', () => {
  // Resolve the orchestrator repo root from this test file's location:
  // src/rebrand/tracked-files.test.ts -> repo root is two levels up from src/rebrand.
  const repoRoot = join(__dirname, '..', '..');

  it('returns a non-empty list of tracked files for the repo', () => {
    const files = listTrackedFiles(repoRoot);

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    // This very test file is tracked... but to avoid ordering assumptions we
    // assert on a stable, known-tracked file instead.
    expect(files).toContain('package.json');
  });

  it('drops empty trailing entries (no blank paths)', () => {
    const files = listTrackedFiles(repoRoot);

    expect(files.every((f) => f.length > 0)).toBe(true);
  });

  it('throws a clear error when the directory is not a git repository', () => {
    const nonRepo = mkdtempSync(join(tmpdir(), 'not-a-git-repo-'));

    try {
      expect(() => listTrackedFiles(nonRepo)).toThrow(/not a git repository|git is unavailable/i);
    } finally {
      rmSync(nonRepo, { recursive: true, force: true });
    }
  });

  it('does not modify any files (read-only wrapper)', () => {
    // git status --porcelain should report the same dirty state before and
    // after listing tracked files (i.e. the call introduces no changes).
    const statusBefore = execFileSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    listTrackedFiles(repoRoot);

    const statusAfter = execFileSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    expect(statusAfter).toBe(statusBefore);
  });
});

/**
 * End-to-end integration tests for the new CLI commands (Task 11.8).
 *
 * These are EXAMPLE-BASED integration tests (not property tests). They drive
 * the command modules the same way the CLI does — by invoking the exported
 * async command functions — against real temporary fixtures on disk:
 *
 * - `verify-branding` (Req 1.7): runs over a real temporary git repository and
 *   asserts it exits NON-ZERO when a tracked file outside `CHANGELOG.md`
 *   contains a branding token, and does NOT exit non-zero when the tree is
 *   clean (or when the only branding lives in the exempt `CHANGELOG.md`).
 * - `resolve-rules` (Req 10.6): runs over a real temporary template + values
 *   JSON and asserts it exits NON-ZERO when placeholders remain unresolved, and
 *   succeeds (writing the resolved file via `--out`) when every placeholder
 *   resolves.
 * - Agent timeout / unavailability (Req 3.7): the 60-second-timeout /
 *   "agent reports it is unavailable" behaviour is a behavioural rule encoded in
 *   the orchestrator's markdown rules, not in an executable CLI command. What is
 *   structurally checkable at the code layer is the routing decision the
 *   Orchestrator relies on to report a blocking situation instead of doing the
 *   work itself: when every matching specialist is busy the Task is `queued`,
 *   and when no specialist matches the area the Task is `blocked`. The two
 *   examples below simulate exactly that — and only that — honestly.
 *
 * Both commands call `process.exit(1)` on failure and write via `console`, so we
 * spy on `process.exit` and the console methods and restore them in afterEach.
 * Temp directories are created with `mkdtempSync(os.tmpdir())` and removed after
 * each test.
 *
 * Validates: Requirements 1.7, 3.7, 10.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { execFileSync } from 'child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';

import { verifyBrandingCommand } from './verify-branding.js';
import { resolveRulesCommand } from './resolve-rules.js';
import { route, SpecialistAgent, RouteOutcome } from '../orchestration/agent-router.js';

// --- Shared spies / temp-dir bookkeeping -----------------------------------

let exitSpy: MockInstance;
const createdTempDirs: string[] = [];

beforeEach(() => {
  // Prevent the commands from actually terminating the test runner; record the
  // exit code so we can assert on the failure (non-zero) contract instead.
  exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation(((_code?: number): never => undefined as never) as never);

  // Keep command output out of the test log.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  // Remove every temp directory created during the test.
  for (const dir of createdTempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Create a temp directory (tracked for cleanup) under the OS temp dir. */
function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  createdTempDirs.push(dir);
  return dir;
}

/**
 * Create a temporary git repository, write the given files into it and stage
 * them with `git add` so they become tracked (verify-branding only scans
 * git-tracked files). No commit is needed: `git ls-files` lists staged files.
 */
function makeTempGitRepo(files: Record<string, string>): string {
  const dir = makeTempDir('verify-branding-');
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = join(dir, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, 'utf-8');
  }

  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' });
  return dir;
}

// --- verify-branding (Req 1.7) ---------------------------------------------

describe('verify-branding command — end-to-end (Req 1.7)', () => {
  it('exits non-zero when a tracked file outside CHANGELOG.md contains branding', async () => {
    const repo = makeTempGitRepo({
      'README.md': '# Sample Project\n\nA clean introduction.\n',
      'docs/guide.md': 'This onboarding guide was written for Roo Commander users.\n',
    });

    await verifyBrandingCommand({ cwd: repo });

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not exit non-zero when no branding is present in any tracked file', async () => {
    const repo = makeTempGitRepo({
      'README.md': '# Sample Project\n\nA clean introduction.\n',
      'docs/guide.md': 'A clean guide with no leftover branding tokens.\n',
    });

    await verifyBrandingCommand({ cwd: repo });

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not flag branding that lives only in the exempt CHANGELOG.md', async () => {
    const repo = makeTempGitRepo({
      'README.md': '# Sample Project\n\nA clean introduction.\n',
      // History entries in CHANGELOG.md are exempt from branding removal (Req 1.5).
      'CHANGELOG.md': '## v1.0.0\n- Forked from Roo Commander.\n',
    });

    await verifyBrandingCommand({ cwd: repo });

    expect(exitSpy).not.toHaveBeenCalled();
  });
});

// --- resolve-rules (Req 10.6) ----------------------------------------------

describe('resolve-rules command — end-to-end (Req 10.6)', () => {
  it('exits non-zero (incomplete) when some placeholders remain unresolved', async () => {
    const dir = makeTempDir('resolve-rules-');
    const templatePath = join(dir, 'template.md');
    const valuesPath = join(dir, 'values.json');

    writeFileSync(
      templatePath,
      '# {{PROJECT_NAME}}\n\nLanguage: {{REPLY_LANGUAGE}}\nOwners: {{OWNER_PATHS}}\n',
      'utf-8'
    );
    // Resolves only ONE of the three placeholders; two remain unresolved.
    writeFileSync(valuesPath, JSON.stringify({ PROJECT_NAME: 'Sample Project' }), 'utf-8');

    await resolveRulesCommand({ values: valuesPath, template: templatePath });

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('succeeds and writes the resolved file when every placeholder resolves', async () => {
    const dir = makeTempDir('resolve-rules-');
    const templatePath = join(dir, 'template.md');
    const valuesPath = join(dir, 'values.json');
    const outPath = join(dir, 'out', 'Project_Rules.md');

    writeFileSync(
      templatePath,
      '# {{PROJECT_NAME}}\n\nLanguage: {{REPLY_LANGUAGE}}\n',
      'utf-8'
    );
    writeFileSync(
      valuesPath,
      JSON.stringify({ PROJECT_NAME: 'Sample Project', REPLY_LANGUAGE: 'English' }),
      'utf-8'
    );

    await resolveRulesCommand({ values: valuesPath, template: templatePath, out: outPath });

    // Fully resolved => no non-zero exit.
    expect(exitSpy).not.toHaveBeenCalled();

    // --out wrote the resolved Project_Rules with substitutions applied and no
    // placeholders left behind.
    expect(existsSync(outPath)).toBe(true);
    const written = readFileSync(outPath, 'utf-8');
    expect(written).toContain('Sample Project');
    expect(written).toContain('English');
    expect(written).not.toMatch(/\{\{[A-Z0-9_]+\}\}/);
  });
});

// --- Agent unavailability / timeout representation (Req 3.7) ----------------
//
// Req 3.7 (Orchestrator reports a blocking situation and does NOT self-create
// when a specialist times out / is unavailable) is enforced in the markdown
// rules layer. At the code layer we can only honestly simulate the routing
// decision the Orchestrator depends on: an unavailable matching pool yields
// `queued`, and a missing specialization yields `blocked` (the unmatched area
// the Orchestrator must report). These two examples represent that decision.

describe('agent unavailability/timeout representation via routing (Req 3.7)', () => {
  it("queues the Task when every matching specialist is busy (none available now)", () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: true },
      { id: 'js-2', specialization: 'javascript', busy: true },
    ];

    const outcome = route('javascript', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'queued' });
  });

  it('blocks and reports the unmatched area when no specialist serves it (unavailable)', () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: false },
    ];

    const outcome = route('python', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'blocked', unmatchedArea: 'python' });
  });
});

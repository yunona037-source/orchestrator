/**
 * Structural (smoke) tests for the template artifacts (Task 12.9).
 *
 * These are EXAMPLE-BASED smoke tests (NOT property tests). They verify that the
 * shipped markdown/YAML template artifacts are structurally sound and carry the
 * mandated content, rather than exercising universal properties over generated
 * inputs.
 *
 * Artifacts under test (all under `src/templates/`):
 * - `Orchestrator_Template.md` — must describe delegation (Req 3), planning /
 *   Master_Task_List (Req 4) and the fixed document order (Req 9), and must
 *   carry the mandated instruction wording «НЕ делегируй — только создай»
 *   (Req 3.3).
 * - `Project_Rules_Template.md` — its set of `{{PLACEHOLDER}}` tokens must equal
 *   the set in the source `AGENTS.template.md` (Req 10.2, 10.3). The source lives
 *   OUTSIDE the orchestrator package, at the `d:\orch` workspace root.
 * - `.flow-orchestratormodes-entry.yaml` — the mode's `groups` list must contain
 *   neither `edit` nor `command` (delegation-only tool access, Req 3.4), and the
 *   mode slug must be `flow-orchestrator`.
 *
 * Validates: Requirements 3.3, 3.4, 10.1, 10.2, 10.3
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

import { scanPlaceholders } from '../orchestration/placeholder-resolver.js';

// --- Artifact path resolution ----------------------------------------------

/** Directory of this test file: `src/templates/`. */
const TEMPLATES_DIR = __dirname;

const ORCHESTRATOR_TEMPLATE_PATH = join(TEMPLATES_DIR, 'Orchestrator_Template.md');
const PROJECT_RULES_TEMPLATE_PATH = join(TEMPLATES_DIR, 'Project_Rules_Template.md');
const MODE_ENTRY_PATH = join(TEMPLATES_DIR, '.flow-orchestratormodes-entry.yaml');

/**
 * `AGENTS.template.md` is the source the Project_Rules_Template is copied from.
 * It lives OUTSIDE the orchestrator package, two package levels up from
 * `src/templates/` (i.e. at the `d:\orch` workspace root):
 *   src/templates -> src -> <package root> -> <workspace root>/AGENTS.template.md
 */
const AGENTS_TEMPLATE_PATH = join(TEMPLATES_DIR, '..', '..', '..', 'AGENTS.template.md');

/** Reads a UTF-8 text file from disk, failing loudly if it is missing. */
function readArtifact(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Expected artifact not found at: ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

// --- 1. Orchestrator_Template.md content (Req 10.1, 3.3) -------------------

describe('Orchestrator_Template.md — delegation/planning/document-order content (Req 10.1, 3.3)', () => {
  const text = readArtifact(ORCHESTRATOR_TEMPLATE_PATH);

  it('describes the delegation discipline of Requirement 3', () => {
    // Orchestrator only delegates; it never creates artifacts itself (Req 3).
    expect(text).toContain('делеги');
    expect(text).toContain('только делегирует');
  });

  it('describes plan-first / Master_Task_List of Requirement 4', () => {
    expect(text).toContain('Master_Task_List');
    expect(text).toContain('Планирование');
  });

  it('describes the fixed document order of Requirement 9', () => {
    // Requirements -> Tech Design -> Tasks -> Project Rules, in order.
    const iReq = text.indexOf('Requirements_Document');
    const iDesign = text.indexOf('Tech_Design_Document');
    const iTasks = text.indexOf('Tasks_Document');
    const iRules = text.indexOf('Project_Rules');

    expect(iReq).toBeGreaterThanOrEqual(0);
    expect(iDesign).toBeGreaterThan(iReq);
    expect(iTasks).toBeGreaterThan(iDesign);
    expect(iRules).toBeGreaterThan(iTasks);
  });

  it('carries the mandated instruction wording «НЕ делегируй — только создай» (Req 3.3)', () => {
    // Explicit phrase presence (also covers assertion #4 of the task).
    expect(text).toContain('НЕ делегируй');
    expect(text).toContain('только создай');
    expect(text).toContain('НЕ делегируй — только создай');
  });
});

// --- 2. Project_Rules_Template.md placeholders vs AGENTS.template.md --------
//        (Req 10.2, 10.3)

describe('Project_Rules_Template.md — placeholder set equals AGENTS.template.md (Req 10.2, 10.3)', () => {
  it('has the identical sorted, unique set of {{PLACEHOLDER}} tokens as the source template', () => {
    const projectRules = readArtifact(PROJECT_RULES_TEMPLATE_PATH);
    const agentsTemplate = readArtifact(AGENTS_TEMPLATE_PATH);

    const projectRulesPlaceholders = [...new Set(scanPlaceholders(projectRules))].sort();
    const agentsPlaceholders = [...new Set(scanPlaceholders(agentsTemplate))].sort();

    // Sanity: the source actually contains placeholders (guards against an
    // empty-vs-empty false positive).
    expect(agentsPlaceholders.length).toBeGreaterThan(0);
    expect(projectRulesPlaceholders).toEqual(agentsPlaceholders);
  });
});

// --- 3. .flow-orchestratormodes-entry.yaml groups + slug (Req 3.4) ---------

describe('.flow-orchestratormodes-entry.yaml — delegation-only tool access (Req 3.4)', () => {
  const parsed = parse(readArtifact(MODE_ENTRY_PATH)) as {
    customModes: Array<{ slug: string; groups: unknown[] }>;
  };
  const mode = parsed.customModes[0];

  it('defines the flow-orchestrator mode', () => {
    expect(mode).toBeDefined();
    expect(mode.slug).toBe('flow-orchestrator');
  });

  it('restricts groups so neither `edit` nor `command` is present', () => {
    expect(Array.isArray(mode.groups)).toBe(true);
    expect(mode.groups).not.toContain('edit');
    expect(mode.groups).not.toContain('command');
  });
});

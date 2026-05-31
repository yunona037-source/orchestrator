/**
 * Type Definitions for the Rebranding Layer (`src/rebrand/`)
 *
 * These types describe the structural inputs and outputs of the rebranding
 * verification layer:
 * - {@link RebrandConfig}: the single configuration input from which all derived
 *   names (package name, CLI command, mode slug) are produced.
 * - {@link BRANDING_TOKENS}: the branding tokens to be removed (case-insensitive).
 * - {@link FileContent}: a tracked file together with its lines and exclusion flag.
 * - {@link BrandingFinding}: a single located occurrence of a branding token.
 * - {@link RenameResult}: the outcome of applying a mechanical rebrand.
 * - {@link RequiredSection} / {@link ReadmeValidationResult}: README structure checks.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

/**
 * Rebrand configuration chosen by the Maintainer.
 *
 * The concrete New_Project_Name value is a Maintainer decision; this config is
 * the single input from which the package name, CLI command name and mode slug
 * are derived. None of the derived names may contain the old branding tokens.
 */
export interface RebrandConfig {
  /** New project name chosen by the Maintainer (e.g. "Flow Orchestrator"). */
  newProjectName: string;
  /** npm package identifier (e.g. "flow-orchestrator"); must not contain the old name. */
  newPackageName: string;
  /** CLI command / bin name (e.g. "flow-orch"); must not contain the old name. */
  newCliCommand: string;
  /** Mode slug (e.g. "flow-orchestrator"); must not contain the old name. */
  newModeSlug: string;
}

/** Branding tokens that must be removed (matched case-insensitively). */
export const BRANDING_TOKENS = ['roo-commander', 'roocommander', 'roo commander'] as const;

/**
 * A tracked file with its content split into lines.
 *
 * `excluded === true` only for `CHANGELOG.md`, whose change-history entries are
 * exempt from branding removal.
 */
export interface FileContent {
  /** Path to the tracked file. */
  path: string;
  /** Whether the file is excluded from branding checks (CHANGELOG.md). */
  excluded: boolean;
  /** File content split into lines. */
  lines: string[];
}

/**
 * A single located occurrence of a branding token, used for flagging files that
 * require fixing (Requirement 1.7).
 */
export interface BrandingFinding {
  /** Path to the tracked file containing the match. */
  filePath: string;
  /** Line number (1-indexed). */
  line: number;
  /** Start position of the match within the line. */
  column: number;
  /** The actually matched text fragment. */
  matchedText: string;
  /** The normalized token from {@link BRANDING_TOKENS}. */
  token: string;
}

/**
 * Outcome of applying a mechanical rebrand: the set of changed files and any
 * renamed paths (e.g. `rules-roo-commander` -> `rules-<new-slug>`).
 */
export interface RenameResult {
  /** Paths of files whose content was changed. */
  changedFiles: string[];
  /** Paths that were renamed, as `{ from, to }` pairs. */
  renamedPaths: Array<{ from: string; to: string }>;
}

/** The three mandatory README sections. */
export type RequiredSection = 'what-it-does' | 'who-its-for' | 'how-to-start';

/**
 * Result of validating README structure (Requirements 2.2-2.8).
 */
export interface ReadmeValidationResult {
  /** Mandatory sections missing from the README (Req 2.4, 2.7). */
  missingSections: RequiredSection[];
  /** Whether the old name is used as the project name (Req 2.6, 2.8). */
  usesOldNameAsProjectName: boolean;
  /** Whether the intro section is the first section (Req 2.2). */
  introIsFirstSection: boolean;
  /** Indices of intro sentences exceeding the 25-word limit (Req 2.2). */
  introSentencesOverLimit: number[];
  /** Whether the "how to start" section has numbered steps (Req 2.5). */
  howToStartHasNumberedSteps: boolean;
  /** True when there are no violations. */
  isComplete: boolean;
}

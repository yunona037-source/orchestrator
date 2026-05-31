/**
 * Mechanical Rebranding (`src/rebrand/renamer.ts`)
 *
 * Implements {@link applyRebrand}: a deterministic, filesystem-free ("pure")
 * transformation that replaces the old branding tokens with names derived from
 * a {@link RebrandConfig} across all tracked files EXCEPT `CHANGELOG.md`
 * (files with `excluded === true` are left untouched).
 *
 * The three branding token forms (see {@link BRANDING_TOKENS}) map to distinct
 * derived names, because each form is used in a different syntactic position:
 *
 *   - `"roo commander"`  (display form, with a space)  -> `config.newProjectName`
 *   - `"roo-commander"`  (slug / hyphen form)          -> `config.newModeSlug`
 *   - `"roocommander"`   (package / no-separator form) -> `config.newPackageName`
 *
 * Matching is case-insensitive and the derived name is substituted verbatim
 * (the design's "механическая замена"). Because the three token forms differ in
 * the separator between `roo` and `commander` (space / hyphen / none), they can
 * never overlap at the same position, so the order of replacement is immaterial.
 *
 * Mutation contract: for each non-excluded file, the matching lines in
 * `file.lines` are rewritten in place; `file.path` is never mutated. Path
 * renames are reported (not applied) via {@link RenameResult.renamedPaths}; the
 * actual filesystem renames happen later (Tasks 13.x). This keeps the function
 * free of I/O side effects while still allowing callers to persist the result.
 *
 * Idempotency: a valid {@link RebrandConfig} has no derived name containing a
 * branding token (this is enforced — see {@link assertConfigHasNoBranding}), so
 * replacement never reintroduces a token. Running {@link applyRebrand} again on
 * already-rebranded content therefore changes nothing (`changedFiles` is empty).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import {
  BRANDING_TOKENS,
  FileContent,
  RebrandConfig,
  RenameResult,
} from './types.js';

/** A compiled replacement rule: a token form, its matcher, and the derived name. */
interface Replacement {
  /** The normalized branding token from {@link BRANDING_TOKENS}. */
  token: string;
  /** Case-insensitive, global matcher for the token. */
  regex: RegExp;
  /** The derived name substituted for the token. */
  replacement: string;
}

/** Escapes regex metacharacters so a token is matched as a literal string. */
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the ordered list of replacement rules from the config.
 *
 * Each branding token form is mapped to the appropriate derived name. The order
 * is irrelevant for correctness (the forms cannot overlap), but is kept aligned
 * with {@link BRANDING_TOKENS} for readability.
 */
function buildReplacements(config: RebrandConfig): Replacement[] {
  const mapping: Array<{ token: string; replacement: string }> = [
    // slug / hyphen form -> mode slug
    { token: 'roo-commander', replacement: config.newModeSlug },
    // package / no-separator form -> package name
    { token: 'roocommander', replacement: config.newPackageName },
    // display form (with space) -> project name
    { token: 'roo commander', replacement: config.newProjectName },
  ];

  return mapping.map(({ token, replacement }) => ({
    token,
    regex: new RegExp(escapeRegExp(token), 'gi'),
    replacement,
  }));
}

/** Applies every replacement rule to a single string, returning the rewritten text. */
function rebrandText(text: string, replacements: Replacement[]): string {
  let result = text;
  for (const { regex, replacement } of replacements) {
    // `String.prototype.replace` with a global regex ignores/resets lastIndex,
    // so reusing the compiled regex across calls is safe.
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Rejects a {@link RebrandConfig} whose derived names still contain a branding
 * token (case-insensitive). A valid config is the precondition for the
 * idempotency and "no branding remains" guarantees, and supports the validation
 * requirement exercised by Task 2.7.
 *
 * @throws Error if any of `newProjectName`, `newPackageName`, `newCliCommand`
 *   or `newModeSlug` contains a branding token.
 */
export function assertConfigHasNoBranding(config: RebrandConfig): void {
  const fields: Array<[keyof RebrandConfig, string]> = [
    ['newProjectName', config.newProjectName],
    ['newPackageName', config.newPackageName],
    ['newCliCommand', config.newCliCommand],
    ['newModeSlug', config.newModeSlug],
  ];

  for (const [field, value] of fields) {
    const lower = (value ?? '').toLowerCase();
    for (const token of BRANDING_TOKENS) {
      if (lower.includes(token)) {
        throw new Error(
          `Invalid RebrandConfig: "${field}" (${JSON.stringify(value)}) ` +
            `contains branding token "${token}"`
        );
      }
    }
  }
}

/**
 * Applies the mechanical rebrand to a set of tracked files.
 *
 * For each non-excluded file, branding tokens in `file.lines` are replaced in
 * place with the derived names from `config`. Excluded files (`CHANGELOG.md`)
 * are left untouched. Files whose `path` contains a branding token are reported
 * in `renamedPaths` with their rebranded target path (no filesystem operation is
 * performed here; `file.path` is not mutated).
 *
 * @param files - Tracked files (their `lines` are mutated in place when changed).
 * @param config - The rebrand configuration; must contain no branding tokens.
 * @returns The set of changed file paths and the path-rename mapping.
 * @throws Error if `config` contains a branding token (see
 *   {@link assertConfigHasNoBranding}).
 */
export function applyRebrand(
  files: FileContent[],
  config: RebrandConfig
): RenameResult {
  assertConfigHasNoBranding(config);

  const replacements = buildReplacements(config);
  const changedFiles: string[] = [];
  const renamedPaths: Array<{ from: string; to: string }> = [];

  for (const file of files) {
    // Path rename detection is content-independent: any tracked path containing
    // a branding token (e.g. `.../rules-roo-commander/...`) maps to a rebranded
    // path. Reported only; the actual rename is performed later (Tasks 13.x).
    const renamedPath = rebrandText(file.path, replacements);
    if (renamedPath !== file.path) {
      renamedPaths.push({ from: file.path, to: renamedPath });
    }

    // CHANGELOG.md and any other excluded file: content is left untouched.
    if (file.excluded) {
      continue;
    }

    let changed = false;
    for (let i = 0; i < file.lines.length; i++) {
      const rewritten = rebrandText(file.lines[i], replacements);
      if (rewritten !== file.lines[i]) {
        file.lines[i] = rewritten;
        changed = true;
      }
    }
    if (changed) {
      changedFiles.push(file.path);
    }
  }

  return { changedFiles, renamedPaths };
}

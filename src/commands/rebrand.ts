/**
 * Rebrand Command
 *
 * Mechanically removes the old "Roo Commander" branding from the project. It
 * wires together the rebranding layer:
 *
 *   1. Build a {@link RebrandConfig} from the CLI options. The package name,
 *      CLI command and mode slug default to a kebab-case form of `--name` when
 *      not given explicitly.
 *   2. Reject any config whose derived names still contain a branding token
 *      (via {@link assertConfigHasNoBranding}) — exits NON-ZERO so a bad
 *      New_Project_Name (e.g. one that kebab-cases back into "roo-commander")
 *      can never be applied.
 *   3. Gather the git-tracked files (`listTrackedFiles`) and read each one into
 *      a {@link FileContent} (`CHANGELOG.md` is marked `excluded`).
 *   4. Apply the mechanical rebrand (`applyRebrand`), which rewrites the matching
 *      lines in place and reports both `changedFiles` and `renamedPaths`.
 *   5. Persist the result: write changed file contents back, then move any
 *      renamed files/directories on disk (e.g. `rules-roo-commander/` ->
 *      `rules-<new-slug>/`).
 *
 * The command follows the established command style (chalk output, friendly
 * error handling, `process.exit` on failure).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import { basename, dirname, relative, resolve } from 'path';
import chalk from 'chalk';
import { move, readFile, readdir, remove, writeFile } from 'fs-extra';
import { listTrackedFiles } from '../rebrand/tracked-files.js';
import { applyRebrand, assertConfigHasNoBranding } from '../rebrand/renamer.js';
import { FileContent, RebrandConfig } from '../rebrand/types.js';

/** The only file whose branding (change-history) is exempt from rewriting. */
const EXCLUDED_FILE = 'CHANGELOG.md';

/**
 * Rebrand command options.
 *
 * `name` is required (the New_Project_Name); the remaining derived names default
 * to a kebab-case form of `name` when omitted.
 */
export interface RebrandOptions {
  /** New_Project_Name chosen by the Maintainer (required). */
  name?: string;
  /** npm package identifier; defaults to the kebab-case slug of `name`. */
  package?: string;
  /** CLI command / bin name; defaults to the kebab-case slug of `name`. */
  cli?: string;
  /** Mode slug; defaults to the kebab-case slug of `name`. */
  slug?: string;
  /** Repository root to operate on (default: `process.cwd()`). */
  cwd?: string;
}

/**
 * Converts a project name to a kebab-case slug: lowercased, with every run of
 * non-alphanumeric characters collapsed to a single hyphen and leading/trailing
 * hyphens trimmed.
 */
function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds a {@link RebrandConfig} from the options, deriving the package name,
 * CLI command and mode slug from `name` when they are not provided.
 *
 * Validation that none of these derived names contain a branding token is the
 * caller's responsibility (see {@link assertConfigHasNoBranding}); this function
 * only assembles the config.
 */
function buildConfig(options: RebrandOptions): RebrandConfig {
  const newProjectName = (options.name ?? '').trim();
  const slug = (options.slug ?? toKebabCase(newProjectName)).trim();

  return {
    newProjectName,
    newPackageName: (options.package ?? slug).trim(),
    newCliCommand: (options.cli ?? slug).trim(),
    newModeSlug: slug,
  };
}

/**
 * Execute the rebrand command.
 *
 * @param options - Command options (`--name`, `--package`, `--cli`, `--slug`).
 */
export async function rebrandCommand(options: RebrandOptions = {}): Promise<void> {
  const repoRoot = resolve(options.cwd || process.cwd());

  // --- 1. Require a New_Project_Name -------------------------------------
  if (!options.name || !options.name.trim()) {
    console.error(chalk.red('\n❌ Missing required option: --name <New_Project_Name>'));
    console.log(
      chalk.gray(
        '\nUsage: rebrand --name <New_Project_Name> ' +
          '[--package <id>] [--cli <cmd>] [--slug <slug>]\n'
      )
    );
    process.exit(1);
    return;
  }

  const config = buildConfig(options);

  console.log(chalk.bold.cyan('\n🔁 Rebrand'));
  console.log(chalk.gray(`Repository: ${repoRoot}`));
  console.log(chalk.gray(`Project name: ${config.newProjectName}`));
  console.log(chalk.gray(`Package:      ${config.newPackageName}`));
  console.log(chalk.gray(`CLI command:  ${config.newCliCommand}`));
  console.log(chalk.gray(`Mode slug:    ${config.newModeSlug}\n`));

  // --- 2. Reject a config whose derived names still contain branding ------
  try {
    assertConfigHasNoBranding(config);
  } catch (error) {
    console.error(chalk.red(`\n❌ ${(error as Error).message}`));
    console.log(
      chalk.gray(
        '\nChoose a New_Project_Name (or explicit --package/--cli/--slug) ' +
          'that does not contain the old branding.\n'
      )
    );
    process.exit(1);
    return;
  }

  // --- 3. Gather tracked files and read their contents --------------------
  let trackedFiles: string[];
  try {
    trackedFiles = listTrackedFiles(repoRoot);
  } catch (error) {
    console.error(chalk.red(`\n❌ ${(error as Error).message}\n`));
    process.exit(1);
    return;
  }

  const files: FileContent[] = [];
  for (const relPath of trackedFiles) {
    const absPath = resolve(repoRoot, relPath);
    let raw: string;
    try {
      raw = await readFile(absPath, 'utf-8');
    } catch (error) {
      // A tracked path that cannot be read (e.g. removed from the working tree)
      // is skipped with a warning rather than aborting the whole rebrand.
      console.log(
        chalk.yellow(`  ⚠️  Skipping unreadable file: ${relPath} (${(error as Error).message})`)
      );
      continue;
    }

    files.push({
      path: relPath,
      excluded: basename(relPath) === EXCLUDED_FILE,
      // Split on "\n" only so a trailing "\r" stays attached to each line; this
      // makes lines.join("\n") a faithful round-trip for both LF and CRLF files.
      lines: raw.split('\n'),
    });
  }

  // --- 4. Apply the mechanical rebrand ------------------------------------
  const { changedFiles, renamedPaths } = applyRebrand(files, config);

  // --- 5a. Write changed file contents back -------------------------------
  const byPath = new Map(files.map((f) => [f.path, f]));
  for (const relPath of changedFiles) {
    const file = byPath.get(relPath);
    if (!file) continue;
    const absPath = resolve(repoRoot, relPath);
    try {
      await writeFile(absPath, file.lines.join('\n'), 'utf-8');
    } catch (error) {
      console.error(
        chalk.red(`\n❌ Failed to write ${relPath}: ${(error as Error).message}\n`)
      );
      process.exit(1);
      return;
    }
  }

  // --- 5b. Apply path renames on the filesystem ---------------------------
  // Each renamed path may carry updated content (written above to its original
  // location); moving it preserves that content. Directories that become empty
  // after their files move out are cleaned up.
  const sourceDirs = new Set<string>();
  for (const { from, to } of renamedPaths) {
    const absFrom = resolve(repoRoot, from);
    const absTo = resolve(repoRoot, to);
    if (absFrom === absTo) continue;
    try {
      await move(absFrom, absTo, { overwrite: true });
      sourceDirs.add(dirname(absFrom));
    } catch (error) {
      console.error(
        chalk.red(`\n❌ Failed to move ${from} -> ${to}: ${(error as Error).message}\n`)
      );
      process.exit(1);
      return;
    }
  }

  for (const dir of sourceDirs) {
    await removeEmptyDirsUpward(dir, repoRoot);
  }

  // --- 6. Report -----------------------------------------------------------
  console.log(
    chalk.green(
      `\n✅ Rebrand applied: ${changedFiles.length} file(s) updated, ` +
        `${renamedPaths.length} path(s) renamed.`
    )
  );

  if (changedFiles.length > 0) {
    console.log(chalk.bold('\nUpdated files:'));
    for (const f of changedFiles) {
      console.log(chalk.gray(`  • ${f}`));
    }
  }

  if (renamedPaths.length > 0) {
    console.log(chalk.bold('\nRenamed paths:'));
    for (const { from, to } of renamedPaths) {
      console.log(chalk.gray(`  • ${from} -> ${to}`));
    }
  }

  console.log(
    chalk.gray(
      '\nRun verify-branding to confirm no branding remains outside CHANGELOG.md.\n'
    )
  );
}

/**
 * Removes `startDir` and its ancestors while they are empty, stopping at (and
 * never removing) `repoRoot`. Used to clean up the old, now-empty source
 * directory left behind after files are moved into a renamed directory.
 *
 * Conservative by design: it only removes directories that contain no remaining
 * entries (so untracked files are never lost) and swallows errors so cleanup
 * never breaks the main rebrand flow.
 */
async function removeEmptyDirsUpward(startDir: string, repoRoot: string): Promise<void> {
  let dir = resolve(startDir);
  const root = resolve(repoRoot);

  while (true) {
    const rel = relative(root, dir);
    // Stop once we reach the repo root or step outside it.
    if (rel === '' || rel.startsWith('..')) break;

    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      break;
    }
    if (entries.length > 0) break;

    try {
      await remove(dir);
    } catch {
      break;
    }
    dir = dirname(dir);
  }
}

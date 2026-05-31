import { execFileSync } from 'child_process';

/**
 * Tracked Files (`src/rebrand/tracked-files.ts`)
 *
 * Provides the source of truth for which files the rebranding layer operates on:
 * the set of files tracked by git. The rebranding scanner and renamer only ever
 * touch version-controlled files (Requirements 1.1, 1.5), so this module
 * centralizes the `git ls-files` invocation and its error handling.
 *
 * This is a thin, read-only wrapper over `git ls-files`. It never modifies any
 * file; if the target directory is not a git repository (or git is otherwise
 * unavailable), it throws rather than silently returning an empty list.
 *
 * Validates: Requirements 1.1, 1.5
 */

/**
 * Returns the list of git-tracked files in `repoRoot`, as produced by
 * `git ls-files`.
 *
 * The command runs with `cwd: repoRoot` and does not modify any files. If the
 * directory is not a git repository (or git is unavailable / exits non-zero for
 * any reason), this throws an {@link Error} with a clear message rather than
 * returning a partial or empty list.
 *
 * @param repoRoot Path to the repository root in which to list tracked files.
 * @returns Array of tracked file paths (relative to `repoRoot`), with empty
 *   trailing entries removed.
 * @throws {Error} If `repoRoot` is not a git repository or the git command fails.
 */
export function listTrackedFiles(repoRoot: string): string[] {
  let stdout: string;

  try {
    // execFileSync (no shell) avoids shell interpolation of `repoRoot`. `git` is
    // an executable resolved from PATH; a non-zero exit (e.g. "not a git
    // repository") throws, which we catch and rethrow with context below.
    stdout = execFileSync('git', ['ls-files'], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });
  } catch (error) {
    throw new Error(
      `Failed to list tracked files in "${repoRoot}": not a git repository or git is unavailable (${(error as Error).message})`
    );
  }

  return parseTrackedFiles(stdout);
}

/**
 * Parses the raw stdout of `git ls-files` into a list of paths.
 *
 * Splits on newlines (tolerating both `\n` and `\r\n`) and drops empty entries,
 * including the empty trailing entry produced by the final newline.
 */
function parseTrackedFiles(stdout: string): string[] {
  return stdout.split(/\r?\n/).filter((line) => line.length > 0);
}

/**
 * Verify Branding Command
 *
 * Scans every git-tracked file for leftover branding tokens
 * ("Roo Commander" / `roocommander` / `roo-commander`, case-insensitive) and
 * reports each occurrence as `file:line`. The change-history file
 * `CHANGELOG.md` is exempt from the check.
 *
 * Exit behavior (Requirements 1.5, 1.6, 1.7):
 * - If any occurrence is found, every match is printed as `file:line` together
 *   with the matched text/token, and the process exits with a NON-ZERO code so
 *   the command can be used as a git hook / CI gate.
 * - If no occurrence is found, a success message is printed and the process
 *   exits 0 (rebrand is complete).
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import { join, basename } from 'path';
import { listTrackedFiles } from '../rebrand/tracked-files.js';
import { scanBranding } from '../rebrand/branding-scanner.js';
import { FileContent, BrandingFinding } from '../rebrand/types.js';

/**
 * Verify-branding command options.
 */
export interface VerifyBrandingOptions {
  /** Repository root to scan (defaults to the current working directory). */
  cwd?: string;
}

/** File name whose change-history entries are exempt from branding removal. */
const EXCLUDED_FILE = 'CHANGELOG.md';

/**
 * Execute the verify-branding command.
 *
 * Gathers the git-tracked files, reads each into a {@link FileContent} (with
 * `excluded === true` for `CHANGELOG.md`), runs {@link scanBranding}, and prints
 * a `file:line` line per finding. Exits non-zero when any finding exists.
 *
 * @param options - Command options.
 */
export async function verifyBrandingCommand(
  options: VerifyBrandingOptions = {}
): Promise<void> {
  const repoRoot = options.cwd || process.cwd();

  let trackedFiles: string[];
  try {
    trackedFiles = listTrackedFiles(repoRoot);
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
    process.exit(1);
    return;
  }

  // Read each tracked file into a FileContent. CHANGELOG.md is marked excluded
  // so the scanner skips it entirely (Req 1.5).
  const files: FileContent[] = [];
  for (const relativePath of trackedFiles) {
    const absolutePath = join(repoRoot, relativePath);

    let content: string;
    try {
      content = await fs.readFile(absolutePath, 'utf-8');
    } catch {
      // Skip files that can no longer be read (e.g. removed from disk while
      // still tracked). They cannot contain leftover branding to flag.
      continue;
    }

    files.push({
      path: relativePath,
      excluded: basename(relativePath) === EXCLUDED_FILE,
      lines: content.split(/\r?\n/),
    });
  }

  const findings = scanBranding(files);

  if (findings.length === 0) {
    console.log(chalk.green('\n✅ No branding occurrences found.'));
    console.log(
      chalk.gray(
        `Scanned ${files.length} tracked file(s) (excluding ${EXCLUDED_FILE}).\n`
      )
    );
    return;
  }

  // Findings exist: list each as `file:line` with the matched text/token, then
  // exit non-zero so this can gate a git hook / CI run (Req 1.7).
  console.log(
    chalk.bold.red(`\n❌ Found ${findings.length} branding occurrence(s):\n`)
  );

  for (const finding of findings) {
    printFinding(finding);
  }

  const affectedFiles = new Set(findings.map((f) => f.filePath)).size;
  console.log(
    chalk.gray(
      `\n${findings.length} occurrence(s) across ${affectedFiles} file(s) require fixing.\n`
    )
  );

  process.exit(1);
}

/**
 * Print a single finding as `file:line` followed by the matched text and the
 * normalized token it matched.
 */
function printFinding(finding: BrandingFinding): void {
  const location = chalk.cyan(`${finding.filePath}:${finding.line}`);
  const matched = chalk.yellow(`"${finding.matchedText}"`);
  const token = chalk.dim(`(token: ${finding.token})`);
  console.log(`  ${location}  ${matched} ${token}`);
}

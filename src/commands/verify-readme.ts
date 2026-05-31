/**
 * Verify README Command
 *
 * Runs the structural README validator (`src/rebrand/readme-validator.ts`) over
 * the project's README and reports every finding in human-readable form:
 *   - missing required sections (Req 2.7)
 *   - use of the old name as the project name (Req 2.6, 2.8)
 *   - intro placement / sentence-length issues (Req 2.2)
 *   - absence of numbered steps in "how to start" (Req 2.5)
 *
 * The command exits with a NON-ZERO status when the README is not complete or
 * still uses the old branding as its project name, so it can be wired into a
 * git-hook / CI gate. Otherwise it reports success and exits 0.
 *
 * Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8
 */

import chalk from 'chalk';
import { readFile } from 'fs-extra';
import { validateReadme } from '../rebrand/readme-validator.js';
import {
  RebrandConfig,
  RequiredSection,
  ReadmeValidationResult,
} from '../rebrand/types.js';

/** Default README path (relative to the current working directory). */
const DEFAULT_README_FILE = 'README.md';

/** Default New_Project_Name used to build the RebrandConfig when none is given. */
const DEFAULT_PROJECT_NAME = 'Flow Orchestrator';

/**
 * Verify-readme command options.
 */
export interface VerifyReadmeOptions {
  /** Path to the README file to validate (default: README.md). */
  file?: string;
  /** New_Project_Name used to build the RebrandConfig (default: "Flow Orchestrator"). */
  name?: string;
}

/** Friendly labels for the three mandatory README sections. */
const SECTION_LABELS: Record<RequiredSection, string> = {
  'what-it-does': 'What it does',
  'who-its-for': 'Who it is for',
  'how-to-start': 'How to start',
};

/**
 * Derives a {@link RebrandConfig} from a New_Project_Name.
 *
 * The slug form lowercases the name and replaces any run of non-alphanumeric
 * characters with a single hyphen; the package name strips the hyphens. These
 * derived names are not used by {@link validateReadme} (which keys off the fixed
 * branding tokens), but a complete config keeps the call well-typed and lets the
 * command surface the configured project name in its output.
 */
function buildConfig(newProjectName: string): RebrandConfig {
  const slug = newProjectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    newProjectName,
    newPackageName: slug.replace(/-/g, '') || slug,
    newCliCommand: slug,
    newModeSlug: slug,
  };
}

/**
 * Execute the verify-readme command.
 *
 * @param options - Command options (`--file`, `--name`).
 */
export async function verifyReadmeCommand(
  options: VerifyReadmeOptions = {}
): Promise<void> {
  const file = options.file || DEFAULT_README_FILE;
  const projectName = options.name || DEFAULT_PROJECT_NAME;
  const config = buildConfig(projectName);

  let readme: string;
  try {
    readme = await readFile(file, 'utf-8');
  } catch (error) {
    console.error(chalk.red(`\n❌ Could not read README: ${(error as Error).message}`));
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(chalk.gray(`\nFile not found: ${file}`));
      console.log(chalk.gray('Specify a different file with --file <path>.\n'));
    }
    process.exit(1);
    return;
  }

  const result = validateReadme(readme, config);

  console.log(chalk.bold.cyan(`\n📄 Verifying README: ${file}`));
  console.log(chalk.gray(`Project name: ${projectName}\n`));

  reportFindings(result);

  // README needs fixing when it is structurally incomplete OR still uses the old
  // name as the project name (Req 2.7, 2.8). `isComplete` already accounts for
  // the old-name check, but both conditions are stated explicitly for clarity.
  const needsFixing = !result.isComplete || result.usesOldNameAsProjectName;

  if (needsFixing) {
    console.log(chalk.red('\n❌ README needs fixing (see findings above).\n'));
    process.exit(1);
    return;
  }

  console.log(chalk.green('\n✅ README is complete. All structural checks passed.\n'));
}

/**
 * Prints each structural finding. Passing checks are shown in green, problems in
 * yellow/red so the output reads as an at-a-glance checklist.
 */
function reportFindings(result: ReadmeValidationResult): void {
  // Req 2.7 — missing required sections.
  if (result.missingSections.length === 0) {
    console.log(chalk.green('  ✓ All required sections present'));
    console.log(
      chalk.gray(
        `    (${(Object.keys(SECTION_LABELS) as RequiredSection[])
          .map((s) => SECTION_LABELS[s])
          .join(', ')})`
      )
    );
  } else {
    console.log(chalk.red('  ✗ Missing required sections:'));
    for (const section of result.missingSections) {
      console.log(chalk.yellow(`    • ${SECTION_LABELS[section]} (${section})`));
    }
  }

  // Req 2.6 / 2.8 — old name used as the project name.
  if (result.usesOldNameAsProjectName) {
    console.log(
      chalk.red('  ✗ Old branding ("Roo Commander") is used as the project name')
    );
  } else {
    console.log(chalk.green('  ✓ Old branding is not used as the project name'));
  }

  // Req 2.2 — intro placement.
  if (result.introIsFirstSection) {
    console.log(chalk.green('  ✓ Intro section comes first (right after the title)'));
  } else {
    console.log(
      chalk.red('  ✗ Intro section is missing or not placed first after the title')
    );
  }

  // Req 2.2 — intro sentence length (<= 25 words).
  if (result.introSentencesOverLimit.length === 0) {
    console.log(chalk.green('  ✓ All intro sentences are within the 25-word limit'));
  } else {
    const positions = result.introSentencesOverLimit
      .map((i) => `#${i + 1}`)
      .join(', ');
    console.log(
      chalk.red(
        `  ✗ Intro sentences over the 25-word limit: ${positions}`
      )
    );
  }

  // Req 2.5 — numbered steps in "how to start".
  if (result.howToStartHasNumberedSteps) {
    console.log(chalk.green('  ✓ "How to start" has numbered step-by-step instructions'));
  } else {
    console.log(
      chalk.red(
        '  ✗ "How to start" is missing numbered step-by-step instructions ' +
          '(install + first run)'
      )
    );
  }
}

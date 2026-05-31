/**
 * Resolve Rules Command
 *
 * Resolves `{{PLACEHOLDER}}` tokens in the Project_Rules_Template using a JSON
 * map of concrete project values, then verifies that no placeholders remain.
 *
 * Behaviour (Req 10.4, 10.5, 10.6):
 * - Read the template and the values file (JSON: placeholder name -> value).
 * - Substitute known placeholders via `resolvePlaceholders` (unknown ones are
 *   left untouched — Req 10.4).
 * - Validate the result via `validateProjectRules` (Req 10.5).
 * - IF any placeholders remain unresolved, LIST every unresolved placeholder,
 *   mark Project_Rules as incomplete / not loadable, FORBID its use and exit
 *   with a NON-ZERO code (Req 10.6).
 * - IF fully resolved (loadable), optionally write the resolved Project_Rules to
 *   `--out` and report success (exit 0).
 *
 * CLI surface: `resolve-rules --values <file> [--template <path>] [--out <path>]`
 *
 * Validates: Requirements 10.4, 10.5, 10.6
 */

import { join, dirname } from 'path';
import chalk from 'chalk';
import { pathExists, readFile, readJson, ensureDir, writeFile } from 'fs-extra';
import {
  resolvePlaceholders,
  validateProjectRules,
} from '../orchestration/placeholder-resolver.js';

/**
 * Options for the `resolve-rules` command.
 */
export interface ResolveRulesOptions {
  /** Path to a JSON file mapping placeholder names to concrete values. */
  values?: string;
  /** Path to the template to resolve (defaults to Project_Rules_Template.md). */
  template?: string;
  /** Optional path to write the fully resolved Project_Rules to. */
  out?: string;
}

/**
 * Resolve the default Project_Rules_Template path bundled with the package.
 *
 * Mirrors the template resolution used by the installer: at runtime this file
 * is compiled to `dist/commands/`, so the templates live two levels up under
 * `src/templates/`.
 *
 * @returns Absolute path to `src/templates/Project_Rules_Template.md`.
 */
function getDefaultTemplatePath(): string {
  return join(__dirname, '..', '..', 'src', 'templates', 'Project_Rules_Template.md');
}

/**
 * Execute the `resolve-rules` command.
 *
 * @param options - Command options.
 */
export async function resolveRulesCommand(
  options: ResolveRulesOptions = {}
): Promise<void> {
  const valuesPath = options.values;
  const templatePath = options.template || getDefaultTemplatePath();

  // --values is required: it provides the placeholder substitutions.
  if (!valuesPath) {
    console.error(chalk.red('\n❌ Error: --values <file> is required'));
    console.log(
      chalk.gray('\nUsage: resolve-rules --values <file> [--template <path>] [--out <path>]\n')
    );
    process.exit(1);
    return;
  }

  try {
    // Verify inputs exist before reading for clearer error messages.
    if (!(await pathExists(templatePath))) {
      console.error(chalk.red(`\n❌ Template not found: ${templatePath}\n`));
      process.exit(1);
      return;
    }

    if (!(await pathExists(valuesPath))) {
      console.error(chalk.red(`\n❌ Values file not found: ${valuesPath}\n`));
      process.exit(1);
      return;
    }

    // Read template content and the JSON values map.
    const template = await readFile(templatePath, 'utf-8');

    let rawValues: unknown;
    try {
      rawValues = await readJson(valuesPath);
    } catch (parseError) {
      console.error(
        chalk.red(
          `\n❌ Failed to parse values file as JSON: ${(parseError as Error).message}\n`
        )
      );
      process.exit(1);
      return;
    }

    // The values file must be a JSON object mapping placeholder names to values.
    if (
      rawValues === null ||
      typeof rawValues !== 'object' ||
      Array.isArray(rawValues)
    ) {
      console.error(
        chalk.red('\n❌ Values file must be a JSON object mapping placeholder names to values.\n')
      );
      process.exit(1);
      return;
    }

    // Normalise into a string->string map; non-string values are reported and
    // skipped (resolvePlaceholders only substitutes string values).
    const values: Record<string, string> = {};
    const nonStringKeys: string[] = [];
    for (const [key, value] of Object.entries(rawValues as Record<string, unknown>)) {
      if (typeof value === 'string') {
        values[key] = value;
      } else {
        nonStringKeys.push(key);
      }
    }

    if (nonStringKeys.length > 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  Ignoring non-string values for: ${nonStringKeys.join(', ')}`
        )
      );
    }

    // Resolve placeholders, then validate completeness (Req 10.4, 10.5).
    const resolved = resolvePlaceholders(template, values);
    const validation = validateProjectRules(resolved);

    console.log(chalk.bold.cyan('\n📝 Resolve Project_Rules'));
    console.log(chalk.gray(`Template: ${templatePath}`));
    console.log(chalk.gray(`Values:   ${valuesPath}\n`));

    // Req 10.6: unresolved placeholders => incomplete / not loadable, forbid use.
    if (!validation.loadable) {
      console.error(
        chalk.red(
          `❌ Project_Rules is incomplete: ${validation.unresolved.length} unresolved placeholder(s).`
        )
      );
      console.error(chalk.red('   Project_Rules is NOT loadable and MUST NOT be used until resolved.\n'));
      console.log(chalk.yellow('Unresolved placeholders:'));
      for (const name of validation.unresolved) {
        console.log(chalk.yellow(`  • {{${name}}}`));
      }
      console.log();
      process.exit(1);
      return;
    }

    // Fully resolved (Req 10.5): optionally persist the result.
    if (options.out) {
      await ensureDir(dirname(options.out));
      await writeFile(options.out, resolved, 'utf-8');
      console.log(chalk.gray(`Wrote resolved Project_Rules to: ${options.out}`));
    }

    console.log(chalk.green('✅ Project_Rules fully resolved — no placeholders remain. Loadable.\n'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { listCommand } from './commands/list.js';
import { readCommand } from './commands/read.js';
import { searchCommand } from './commands/search.js';
import { generateIndexCommand } from './commands/generate-index.js';
import { syncIndexCommand } from './commands/sync-index.js';
import { initCommand } from './commands/init.js';
import { rebrandCommand } from './commands/rebrand.js';
import { verifyBrandingCommand } from './commands/verify-branding.js';
import { verifyReadmeCommand } from './commands/verify-readme.js';
import { validateMasterListCommand } from './commands/validate-master-list.js';
import { validateTasksCommand } from './commands/validate-tasks.js';
import { resolveRulesCommand } from './commands/resolve-rules.js';
import { isGloballyInstalled } from './installer/global-installer.js';
import { isInstalled } from './installer/template-installer.js';

/**
 * Main CLI Program
 *
 * Defines all commands and global options for flow-orch.
 */

const cli = new Command();

cli
  .name('flow-orch')
  .description('CLI tool that brings reusable coding skills into Roo Code and Kilo Code')
  .version('9.5.0');

/**
 * Command: list
 * Show all available skills with descriptions
 */
cli
  .command('list')
  .description('List all available skills from ~/.claude/skills/')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-v, --verbose', 'Show full descriptions and details')
  .action(async (options) => {
    await listCommand(options);
  });

/**
 * Command: read <skill>
 * Output skill content to stdout
 */
cli
  .command('read <skill>')
  .description('Read and output a specific skill content')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-r, --raw', 'Output raw markdown without formatting')
  .action(async (skill: string, options) => {
    await readCommand(skill, options);
  });

/**
 * Command: search <keyword>
 * Find skills matching keyword
 */
cli
  .command('search <keyword>')
  .description('Search for skills by keyword')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-v, --verbose', 'Show full descriptions and details')
  .action(async (keyword: string, options) => {
    await searchCommand(keyword, options);
  });

/**
 * Command: generate-index
 * Generate skills index markdown file
 */
cli
  .command('generate-index')
  .description('Generate skills index for custom instructions')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-o, --output <path>', 'Output file path', '.roo/rules/01-skills-index.md')
  .action(async (options) => {
    await generateIndexCommand(options);
  });

/**
 * Command: sync-index
 * Update existing skills index
 */
cli
  .command('sync-index')
  .description('Update skills index after skills change')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-o, --output <path>', 'Output file path', '.roo/rules/01-skills-index.md')
  .action(async (options) => {
    await syncIndexCommand(options);
  });

/**
 * Command: init
 * Initialize Flow Orchestrator setup (global by default)
 */
cli
  .command('init')
  .description('Initialize Flow Orchestrator (global by default, use --project for local)')
  .option('-s, --source <path>', 'Custom skills directory path')
  .option('-r, --repo <url>', 'GitHub repository URL for skills (e.g., user/repo)')
  .option('--force', 'Force reinstall (overwrite existing files)')
  .option('--project', 'Install to current project only (not globally)')
  .option('--classic', 'Install classic MDTM-based version (v8) instead of modern')
  .action(async (options) => {
    await initCommand(options);
  });

/**
 * Command: rebrand
 * Mechanically remove the old upstream branding from the project.
 */
cli
  .command('rebrand')
  .description('Rebrand the project: replace old branding with a new project name')
  .option('--name <New_Project_Name>', 'New project name (required)')
  .option('--package <id>', 'npm package identifier (defaults to kebab-case of --name)')
  .option('--cli <cmd>', 'CLI command / bin name (defaults to kebab-case of --name)')
  .option('--slug <slug>', 'Mode slug (defaults to kebab-case of --name)')
  .action(async (options) => {
    await rebrandCommand(options);
  });

/**
 * Command: verify-branding
 * Scan every git-tracked file for leftover branding tokens.
 */
cli
  .command('verify-branding')
  .description('Verify no old branding remains in tracked files (excludes CHANGELOG.md)')
  .action(async (options) => {
    await verifyBrandingCommand(options);
  });

/**
 * Command: verify-readme
 * Validate the README structure and branding.
 */
cli
  .command('verify-readme')
  .description('Verify the README is structurally complete and free of old branding')
  .option('--file <path>', 'Path to the README file to validate', 'README.md')
  .option('--name <New_Project_Name>', 'New project name used to validate branding')
  .action(async (options) => {
    await verifyReadmeCommand(options);
  });

/**
 * Command: validate-master-list <file>
 * Validate a Master_Task_List JSON document.
 */
cli
  .command('validate-master-list <file>')
  .description('Validate a Master_Task_List JSON document (completeness + Stage bijection)')
  .option('-v, --verbose', 'Print the parsed document and validation details')
  .action(async (file: string, options) => {
    await validateMasterListCommand(file, options);
  });

/**
 * Command: validate-tasks <dir>
 * Validate every Task JSON file in a directory.
 */
cli
  .command('validate-tasks <dir>')
  .description('Validate Task JSON files in a directory (attributes + Task_TODO protocol)')
  .action(async (dir: string, options) => {
    await validateTasksCommand(dir, options);
  });

/**
 * Command: resolve-rules
 * Resolve placeholders in the Project_Rules_Template.
 */
cli
  .command('resolve-rules')
  .description('Resolve {{PLACEHOLDER}} tokens in the Project_Rules_Template from a values file')
  .option('--values <file>', 'JSON file mapping placeholder names to values (required)')
  .option('--template <path>', 'Path to the template to resolve (defaults to Project_Rules_Template.md)')
  .option('--out <path>', 'Path to write the fully resolved Project_Rules to')
  .action(async (options) => {
    await resolveRulesCommand(options);
  });

// Handle unknown commands
cli.on('command:*', () => {
  console.error(chalk.red(`\nError: Unknown command '${cli.args.join(' ')}'`));
  console.log(chalk.white('\nRun \'flow-orch --help\' for available commands.\n'));
  process.exit(1);
});

/**
 * Smart auto-init when no command provided
 * Detects installation status and offers appropriate actions
 */
export async function handleNoCommand() {
  const projectRoot = process.cwd();
  const globalInstalled = isGloballyInstalled();
  const projectInstalled = isInstalled(projectRoot);

  // Case D: Both global AND project installed - show help
  if (globalInstalled && projectInstalled) {
    cli.help();
    return;
  }

  // Case A: Nothing installed - first time setup
  if (!globalInstalled && !projectInstalled) {
    console.log(chalk.bold.cyan('\n👋 Welcome to Flow Orchestrator!\n'));
    console.log(chalk.white('Flow Orchestrator bridges Claude Code skills to Roo Code with intelligent orchestration.\n'));
    console.log(chalk.white('It looks like this is your first time running Flow Orchestrator.'));
    console.log(chalk.white('Let\'s get you set up with an interactive installation.\n'));

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue with setup?',
        default: true,
      },
    ]);

    if (proceed) {
      await initCommand({});
    } else {
      console.log(chalk.white('\nSetup cancelled. Run \'flow-orch init\' when you\'re ready.\n'));
    }
    return;
  }

  // Case B: Global installed, but NOT in current project
  if (globalInstalled && !projectInstalled) {
    console.log(chalk.bold.cyan('\n👋 Flow Orchestrator is installed globally\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View available commands (help)', value: 'help', short: 'Help' },
          { name: 'Install to this project as well', value: 'install-project', short: 'Install to project' },
          { name: 'Exit', value: 'exit', short: 'Exit' },
        ],
        default: 'help',
      },
    ]);

    if (action === 'help') {
      console.log(); // blank line
      cli.help();
    } else if (action === 'install-project') {
      await initCommand({ project: true });
    } else {
      console.log(chalk.white('\nExiting...\n'));
    }
    return;
  }

  // Case C: Project installed (current directory)
  if (projectInstalled) {
    console.log(chalk.bold.cyan('\n👋 Flow Orchestrator is installed in this project\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View available commands (help)', value: 'help', short: 'Help' },
          { name: 'Reinstall/reconfigure this project', value: 'reinstall', short: 'Reinstall' },
          { name: 'Install to a different folder', value: 'install-other', short: 'Install elsewhere' },
          { name: 'Exit', value: 'exit', short: 'Exit' },
        ],
        default: 'help',
      },
    ]);

    if (action === 'help') {
      console.log(); // blank line
      cli.help();
    } else if (action === 'reinstall') {
      await initCommand({ project: true, force: true });
    } else if (action === 'install-other') {
      console.log(chalk.yellow('\n💡 Tip: Navigate to the target folder and run \'flow-orch init --project\'\n'));
    } else {
      console.log(chalk.white('\nExiting...\n'));
    }
    return;
  }
}

export { cli };

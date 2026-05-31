import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import yaml from 'yaml';
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Global Installer for Flow Orchestrator
 *
 * Installs Flow Orchestrator as a custom mode in the global settings of a
 * supported VS Code editor. Flow Orchestrator works with any Roo-Code-compatible
 * editor; the two supported targets share the same `custom_modes.yaml` format
 * because Kilo Code is a fork of Roo Code:
 *
 *   - Roo Code  → globalStorage/rooveterinaryinc.roo-cline/settings/
 *   - Kilo Code → globalStorage/kilocode.kilo-code/settings/
 */

interface InstallResult {
  success: boolean;
  error?: string;
}

/** A supported editor target. */
export type EditorId = 'roo' | 'kilo';

/** Static metadata describing how to locate an editor's config on disk. */
export interface EditorInfo {
  id: EditorId;
  /** Human-readable name shown in CLI output. */
  name: string;
  /** VS Code extension id used as the globalStorage folder name. */
  globalStorageId: string;
  /** Global rules directory under the user's home (e.g. `.roo`, `.kilocode`). */
  globalRulesDirName: string;
  /** Project-level custom-modes file name (e.g. `.roomodes`, `.kilocodemodes`). */
  projectModesFile: string;
  /** Project-level config directory name (e.g. `.roo`, `.kilocode`). */
  projectConfigDir: string;
}

/** The editors Flow Orchestrator can install into, in priority order. */
export const SUPPORTED_EDITORS: Record<EditorId, EditorInfo> = {
  roo: {
    id: 'roo',
    name: 'Roo Code',
    globalStorageId: 'rooveterinaryinc.roo-cline',
    globalRulesDirName: '.roo',
    projectModesFile: '.roomodes',
    projectConfigDir: '.roo',
  },
  kilo: {
    id: 'kilo',
    name: 'Kilo Code',
    globalStorageId: 'kilocode.kilo-code',
    globalRulesDirName: '.kilocode',
    projectModesFile: '.kilocodemodes',
    projectConfigDir: '.kilocode',
  },
};

/**
 * Get an editor's global settings directory for the current platform.
 *
 * @param editor Target editor (defaults to Roo Code for backward compatibility).
 * @returns Absolute path to the editor's `settings/` directory.
 */
export function getEditorSettingsDir(editor: EditorInfo = SUPPORTED_EDITORS.roo): string {
  const platform = process.platform;
  const { globalStorageId } = editor;

  if (platform === 'win32') {
    // Windows: %APPDATA%\Code\User\globalStorage\<ext-id>\settings
    return join(
      process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'),
      'Code',
      'User',
      'globalStorage',
      globalStorageId,
      'settings'
    );
  } else if (platform === 'darwin') {
    // macOS: ~/Library/Application Support/Code/User/globalStorage/<ext-id>/settings
    return join(
      homedir(),
      'Library',
      'Application Support',
      'Code',
      'User',
      'globalStorage',
      globalStorageId,
      'settings'
    );
  }

  // Linux: ~/.config/Code/User/globalStorage/<ext-id>/settings
  return join(
    homedir(),
    '.config',
    'Code',
    'User',
    'globalStorage',
    globalStorageId,
    'settings'
  );
}

/**
 * @deprecated Use {@link getEditorSettingsDir}. Kept for backward compatibility.
 * @returns Path to Roo Code global settings directory
 */
export function getRooCodeSettingsDir(): string {
  return getEditorSettingsDir(SUPPORTED_EDITORS.roo);
}

/**
 * Detect every supported editor that has been installed and run at least once
 * (its globalStorage settings directory exists).
 *
 * @returns List of detected editors (may be empty).
 */
export function detectInstalledEditors(): EditorInfo[] {
  return Object.values(SUPPORTED_EDITORS).filter((editor) =>
    existsSync(getEditorSettingsDir(editor))
  );
}

/**
 * Get an editor's global rules directory under the user's home.
 *
 * @param editor Target editor (defaults to Roo Code).
 * @returns Path to e.g. `~/.roo` or `~/.kilocode`.
 */
export function getGlobalRulesDir(editor: EditorInfo = SUPPORTED_EDITORS.roo): string {
  return join(homedir(), editor.globalRulesDirName);
}

/**
 * @deprecated Use {@link getGlobalRulesDir}. Kept for backward compatibility.
 */
export function getGlobalRooDir(): string {
  return getGlobalRulesDir(SUPPORTED_EDITORS.roo);
}

/**
 * Read and parse the Flow Orchestrator mode entry from the template file.
 *
 * @param templatePath Path to `.flow-orchestratormodes-entry.yaml`.
 * @returns The parsed mode object, or an error result.
 */
function readModeEntry(
  templatePath: string
): { mode: any } | { error: string } {
  if (!existsSync(templatePath)) {
    return { error: `Template file not found: ${templatePath}` };
  }

  const templateContent = readFileSync(templatePath, 'utf-8');
  const yamlStart = templateContent.indexOf('customModes:');
  if (yamlStart === -1) {
    return {
      error: 'Invalid .flow-orchestratormodes-entry.yaml template (missing customModes key)',
    };
  }

  const parsedTemplate = yaml.parse(templateContent.substring(yamlStart));
  if (!parsedTemplate?.customModes || !Array.isArray(parsedTemplate.customModes)) {
    return {
      error: 'Invalid .flow-orchestratormodes-entry.yaml template (customModes must be an array)',
    };
  }

  return { mode: parsedTemplate.customModes[0] };
}

/**
 * Install the Flow Orchestrator mode into a single editor's global settings.
 *
 * @param editor Target editor.
 * @param flowOrchestratorMode The parsed mode entry to install.
 * @param force Force reinstall if already present.
 * @returns Install result.
 */
async function installModeForEditor(
  editor: EditorInfo,
  flowOrchestratorMode: any,
  force: boolean
): Promise<InstallResult> {
  const settingsDir = getEditorSettingsDir(editor);

  if (!existsSync(settingsDir)) {
    return {
      success: false,
      error: `${editor.name} settings directory not found at ${settingsDir}`,
    };
  }

  const yamlPath = join(settingsDir, 'custom_modes.yaml');
  const jsonPath = join(settingsDir, 'custom_modes.json');

  let existingModes: any = { customModes: [] };
  if (existsSync(yamlPath)) {
    existingModes = yaml.parse(readFileSync(yamlPath, 'utf-8')) || { customModes: [] };
  }
  if (!existingModes.customModes) {
    existingModes.customModes = [];
  }

  const hasFlowOrchestrator = existingModes.customModes.some(
    (mode: any) => mode.slug === 'flow-orchestrator'
  );

  if (hasFlowOrchestrator && !force) {
    console.log(
      chalk.yellow(`\n⚠️  Flow Orchestrator is already installed in ${editor.name}`)
    );
    const overrideAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldOverride',
        message: `Override existing ${editor.name} Flow Orchestrator configuration?`,
        default: false,
      },
    ]);

    if (!overrideAnswer.shouldOverride) {
      console.log(
        chalk.gray(`\nSkipping ${editor.name} mode update (existing configuration preserved)\n`)
      );
      return { success: true };
    }
  }

  if (hasFlowOrchestrator) {
    existingModes.customModes = existingModes.customModes.filter(
      (mode: any) => mode.slug !== 'flow-orchestrator'
    );
    existingModes.customModes.push(flowOrchestratorMode);
    console.log(chalk.gray(`\n  Updated Flow Orchestrator entry in ${editor.name} settings`));
  } else {
    existingModes.customModes.push(flowOrchestratorMode);
    console.log(chalk.gray(`\n  Added Flow Orchestrator entry to ${editor.name} settings`));
  }

  writeFileSync(yamlPath, yaml.stringify(existingModes), 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(existingModes, null, 2), 'utf-8');
  console.log(chalk.gray(`     Location: ${yamlPath}`));

  return { success: true };
}

/**
 * Install Flow Orchestrator globally in every detected editor (Roo Code and/or
 * Kilo Code). If no supported editor is detected, returns an error.
 *
 * @param templatePath Path to .flow-orchestratormodes-entry.yaml template
 * @param force Force reinstall if already exists
 * @returns Install result (success if at least one editor was configured)
 */
export async function installGlobalMode(
  templatePath: string,
  force: boolean = false
): Promise<InstallResult> {
  try {
    const entry = readModeEntry(templatePath);
    if ('error' in entry) {
      return { success: false, error: entry.error };
    }

    const editors = detectInstalledEditors();
    if (editors.length === 0) {
      return {
        success: false,
        error:
          'No supported editor found.\n\n' +
          'Install Roo Code or Kilo Code (VS Code extensions) and run it once,\n' +
          'or use the --project flag for a project-scoped installation.',
      };
    }

    const errors: string[] = [];
    for (const editor of editors) {
      const result = await installModeForEditor(editor, entry.mode, force);
      if (!result.success && result.error) {
        errors.push(result.error);
      }
    }

    if (errors.length === editors.length) {
      return { success: false, error: errors.join('\n') };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to install global mode: ${(error as Error).message}`,
    };
  }
}

/**
 * Install global custom instructions into every detected editor's home rules
 * directory (`~/.roo/rules-flow-orchestrator/` and/or
 * `~/.kilocode/rules-flow-orchestrator/`).
 *
 * @param rulesDir Source rules directory (src/templates/rules-flow-orchestrator)
 * @param force Force reinstall
 * @returns Install result
 */
export function installGlobalRules(rulesDir: string, force: boolean = false): InstallResult {
  try {
    const editors = detectInstalledEditors();
    // Fall back to Roo Code so existing behavior is preserved when nothing is detected.
    const targets = editors.length > 0 ? editors : [SUPPORTED_EDITORS.roo];
    const fs = require('fs-extra');

    for (const editor of targets) {
      const globalDir = getGlobalRulesDir(editor);
      const targetDir = join(globalDir, 'rules-flow-orchestrator');

      if (!existsSync(globalDir)) {
        mkdirSync(globalDir, { recursive: true });
        console.log(chalk.gray(`\n  Created ${globalDir}`));
      }

      if (existsSync(targetDir) && !force) {
        console.log(
          chalk.yellow(`\n  ⚠️  ${editor.name} custom instructions already installed`)
        );
        console.log(chalk.gray('     Use --force to reinstall\n'));
        continue;
      }

      fs.copySync(rulesDir, targetDir, { overwrite: force });
      console.log(chalk.gray(`\n  Installed ${editor.name} custom instructions`));
      console.log(chalk.gray(`     Location: ${targetDir}`));
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to install global rules: ${(error as Error).message}`,
    };
  }
}

/**
 * Check whether any supported editor (Roo Code or Kilo Code) is installed.
 *
 * @returns True if at least one supported editor was detected.
 */
export function isRooCodeInstalled(): boolean {
  return detectInstalledEditors().length > 0;
}

/**
 * Check if Flow Orchestrator is installed globally in any supported editor.
 *
 * @returns True if Flow Orchestrator mode exists in a global settings file.
 */
export function isGloballyInstalled(): boolean {
  return detectInstalledEditors().some((editor) => {
    try {
      const settingsDir = getEditorSettingsDir(editor);
      const yamlPath = join(settingsDir, 'custom_modes.yaml');
      const jsonPath = join(settingsDir, 'custom_modes.json');

      if (existsSync(yamlPath)) {
        const parsed = yaml.parse(readFileSync(yamlPath, 'utf-8'));
        if (parsed?.customModes && Array.isArray(parsed.customModes)) {
          return parsed.customModes.some((mode: any) => mode.slug === 'flow-orchestrator');
        }
      }

      if (existsSync(jsonPath)) {
        const parsed = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        if (parsed?.customModes && Array.isArray(parsed.customModes)) {
          return parsed.customModes.some((mode: any) => mode.slug === 'flow-orchestrator');
        }
      }

      return false;
    } catch {
      return false;
    }
  });
}

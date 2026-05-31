/**
 * Validate Tasks Command
 *
 * CLI surface: `validate-tasks <dir>`
 *
 * Reads every `*.json` file in <dir>, where each file describes a regular Task
 * (see `src/orchestration/task-validator.ts` → `Task`). For each task file the
 * command:
 *
 *  1. Runs `validateTask` and prints any `TaskFlag` (attribute + reason) —
 *     covers the mandatory Task attributes: at least one identifiable needed
 *     Documentation reference (Req 7.1, 7.8), at least one identifiable
 *     Documentation reference to update (Req 7.2, 7.9), an assigned
 *     Specialist_Agent, and a Specialist_Agent for every work part (Req 7.3).
 *  2. Checks the Task_TODO protocol invariants: the `todo` has exactly the
 *     three ordered items `readDocs / doTask / updateDocs` (Req 8.1) and the
 *     monotonic order holds — `updateDocs ⇒ doTask ⇒ readDocs` (Req 8.5).
 *  3. Reports completeness via `isTaskComplete` (Req 8.9): a Task is complete
 *     iff all three TODO items are checked AND a Report is prepared.
 *
 * If any task file is flagged, incomplete, or violates the Task_TODO protocol
 * (or cannot be read/parsed), the command exits with a NON-ZERO code; otherwise
 * it exits with 0.
 *
 * IO and JSON parse errors are handled gracefully: the offending file is
 * reported and counted as a problem, and processing continues with the
 * remaining files.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.8, 7.9, 8.1, 8.5, 8.9
 */

import path from 'path';
import chalk from 'chalk';
import { readdir, readFile } from 'fs-extra';
import { validateTask, Task, TaskFlag } from '../orchestration/task-validator.js';
import { isTaskComplete, TaskTodo, Report, TODO_ORDER } from '../orchestration/task-todo.js';

/**
 * Options for the validate-tasks command. Reserved for future flags; kept for
 * parity with the other CLI command signatures.
 */
export interface ValidateTasksOptions {
  /** Reserved: no options are currently consumed. */
  [key: string]: unknown;
}

/**
 * Outcome of validating a single task file.
 */
interface FileValidation {
  file: string;
  /** Read/parse error message, if the file could not be loaded. */
  ioError?: string;
  /** Attribute flags returned by `validateTask`. */
  flags: TaskFlag[];
  /** Task_TODO protocol violations (structure + ordering). */
  protocolViolations: string[];
  /** Whether the Task is complete per `isTaskComplete`. */
  complete: boolean;
}

/**
 * Execute the validate-tasks command.
 *
 * @param dir - Directory containing `*.json` task definition files.
 * @param options - Reserved command options.
 */
export async function validateTasksCommand(
  dir: string,
  options: ValidateTasksOptions = {}
): Promise<void> {
  void options;

  // Discover *.json files in the target directory. A missing/unreadable
  // directory is a hard IO error.
  let jsonFiles: string[];
  try {
    const entries = await readdir(dir);
    jsonFiles = entries
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Не удалось прочитать каталог задач: ${dir}`)
    );
    console.error(chalk.red(`   ${(error as Error).message}\n`));
    process.exit(1);
    return;
  }

  console.log(chalk.bold.cyan(`\n🧪 Проверка задач в каталоге: ${dir}`));

  if (jsonFiles.length === 0) {
    console.log(
      chalk.yellow('\n⚠️  В каталоге не найдено ни одного *.json файла задачи.\n')
    );
    // Нет задач — нет нарушений: успех (exit 0).
    return;
  }

  console.log(chalk.gray(`Найдено файлов задач: ${jsonFiles.length}\n`));

  const results: FileValidation[] = [];

  for (const fileName of jsonFiles) {
    const filePath = path.join(dir, fileName);
    results.push(await validateTaskFile(filePath, fileName));
  }

  // Render per-file results.
  let problemCount = 0;
  for (const result of results) {
    const hasProblem =
      result.ioError != null ||
      result.flags.length > 0 ||
      result.protocolViolations.length > 0 ||
      !result.complete;

    if (hasProblem) {
      problemCount++;
      console.log(chalk.bold.red(`✗ ${result.file}`));

      if (result.ioError) {
        console.log(chalk.red(`    Ошибка чтения/разбора: ${result.ioError}`));
      }

      for (const flag of result.flags) {
        console.log(
          chalk.yellow(`    [${flag.attribute}] `) + chalk.gray(flag.reason)
        );
      }

      for (const violation of result.protocolViolations) {
        console.log(chalk.yellow('    [Task_TODO] ') + chalk.gray(violation));
      }

      // Only report incompleteness when the file was at least parseable.
      if (result.ioError == null && !result.complete) {
        console.log(
          chalk.yellow('    [incomplete] ') +
            chalk.gray(
              'Task не завершена: требуется отметить все три пункта Task_TODO ' +
                'и подготовить Report (Req 8.9).'
            )
        );
      }

      console.log();
    } else {
      console.log(chalk.green(`✓ ${result.file}`));
    }
  }

  console.log(chalk.gray('\n─────────────────────────────────────────────'));

  if (problemCount > 0) {
    console.log(
      chalk.red(
        `\n❌ Обнаружены проблемы в ${problemCount} из ${results.length} файлов задач.\n`
      )
    );
    process.exit(1);
    return;
  }

  console.log(
    chalk.green(`\n✅ Все ${results.length} файлов задач корректны и завершены.\n`)
  );
}

/**
 * Validate a single task file: read + parse, run `validateTask`, check the
 * Task_TODO protocol, and compute completeness.
 */
async function validateTaskFile(
  filePath: string,
  fileName: string
): Promise<FileValidation> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (error) {
    return {
      file: fileName,
      ioError: `не удалось прочитать файл (${(error as Error).message})`,
      flags: [],
      protocolViolations: [],
      complete: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      file: fileName,
      ioError: `некорректный JSON (${(error as Error).message})`,
      flags: [],
      protocolViolations: [],
      complete: false,
    };
  }

  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      file: fileName,
      ioError: 'содержимое не является объектом Task',
      flags: [],
      protocolViolations: [],
      complete: false,
    };
  }

  const task = parsed as Partial<Task>;

  // `validateTask` is defensive against missing/blank attributes, so a partial
  // object is safe to pass through.
  const flags = validateTask(task as Task);

  const protocolViolations = checkTodoProtocol(task.todo);

  // Completeness uses normalized booleans so a malformed `todo` cannot throw.
  const normalizedTodo = normalizeTodo(task.todo);
  const report = (task.report ?? null) as Report | null;
  const complete = isTaskComplete(normalizedTodo, report);

  return {
    file: fileName,
    flags,
    protocolViolations,
    complete,
  };
}

/**
 * Verify the Task_TODO protocol invariants (Req 8.1, 8.5):
 *  - the `todo` is an object with exactly the three ordered items
 *    `readDocs / doTask / updateDocs`, each a boolean;
 *  - the monotonic order holds: `updateDocs ⇒ doTask ⇒ readDocs`.
 *
 * Returns a list of human-readable violation messages (empty when valid).
 */
function checkTodoProtocol(todo: unknown): string[] {
  const violations: string[] = [];

  if (todo == null || typeof todo !== 'object' || Array.isArray(todo)) {
    violations.push(
      `Task_TODO отсутствует или не является объектом с тремя пунктами ` +
        `${TODO_ORDER.join(' / ')} (Req 8.1).`
    );
    return violations;
  }

  const todoObj = todo as Record<string, unknown>;
  const keys = Object.keys(todoObj);
  const allBooleans = TODO_ORDER.every((k) => typeof todoObj[k] === 'boolean');
  const extraKeys = keys.filter((k) => !TODO_ORDER.includes(k as never));

  if (!allBooleans || keys.length !== TODO_ORDER.length || extraKeys.length > 0) {
    violations.push(
      `Task_TODO должен содержать ровно три булевых пункта в порядке ` +
        `${TODO_ORDER.join(' → ')} (обнаружены ключи: ${keys.join(', ') || '—'}, Req 8.1).`
    );
  }

  // Monotonic order check on normalized booleans (Req 8.5).
  const normalized = normalizeTodo(todo);
  for (let i = 1; i < TODO_ORDER.length; i++) {
    const current = TODO_ORDER[i];
    const previous = TODO_ORDER[i - 1];
    if (normalized[current] && !normalized[previous]) {
      violations.push(
        `Нарушен порядок Task_TODO: пункт "${current}" отмечен, а предшествующий ` +
          `"${previous}" — нет (инвариант updateDocs ⇒ doTask ⇒ readDocs, Req 8.5).`
      );
    }
  }

  return violations;
}

/**
 * Coerce an arbitrary parsed `todo` value into a {@link TaskTodo} with boolean
 * fields, so ordering/completeness checks never throw on malformed input.
 */
function normalizeTodo(todo: unknown): TaskTodo {
  const source =
    todo != null && typeof todo === 'object' && !Array.isArray(todo)
      ? (todo as Record<string, unknown>)
      : {};

  return {
    readDocs: source.readDocs === true,
    doTask: source.doTask === true,
    updateDocs: source.updateDocs === true,
  };
}

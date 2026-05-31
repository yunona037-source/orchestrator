/**
 * Validate Master_Task_List Command
 *
 * CLI-обёртка над чистой функцией `validateMasterList`
 * (`src/orchestration/master-list-validator.ts`). Читает JSON-документ,
 * описывающий Master_Task_List, проверяет полноту КАЖДОЙ записи (наличие хотя
 * бы одной идентифицируемой ссылки на Documentation и ровно одного
 * Specialist_Agent) и биекцию записей со Stage, после чего печатает флаги и
 * завершает процесс ненулевым кодом при наличии нарушений.
 *
 * Контракт документа (см. JSON-форму ниже):
 *
 * ```json
 * {
 *   "stages": ["Stage 1", "Stage 2"],
 *   "entries": [
 *     {
 *       "stage": "Stage 1",
 *       "documentation": [{ "id": "docs/ARCHITECTURE.md" }],
 *       "specialistAgent": "JavaScript"
 *     }
 *   ]
 * }
 * ```
 *
 * Требования: 4.2 (биекция записей и Stage), 6.3 (обработка каждой записи),
 * 6.4 (флаг отсутствующей/некорректной Documentation), 6.5 (флаг отсутствующего
 * или неоднозначного Specialist_Agent).
 */

import chalk from 'chalk';
import { readFile } from 'fs-extra';
import {
  validateMasterList,
  MasterTaskListEntry,
} from '../orchestration/master-list-validator.js';

/**
 * Опции команды `validate-master-list`.
 */
export interface ValidateMasterListOptions {
  /** Вывести разобранный документ и подробности проверки. */
  verbose?: boolean;
}

/**
 * Ожидаемая JSON-форма документа Master_Task_List, передаваемого команде.
 *
 * Намеренно простая и документированная структура: список Stage и записи
 * верхнего уровня. Поля `documentation` и `specialistAgent` повторяют
 * {@link MasterTaskListEntry}, чтобы документ напрямую разбирался в записи
 * валидатора.
 */
interface MasterListDocument {
  stages: string[];
  entries: MasterTaskListEntry[];
}

/**
 * Проверяет, что произвольный JSON соответствует ожидаемой форме
 * {@link MasterListDocument}. Возвращает массив человекочитаемых ошибок формы
 * (пустой массив ⇒ форма корректна).
 *
 * Проверяется только СТРУКТУРА (типы полей), а не содержательная полнота
 * записей — последнюю выполняет `validateMasterList` и сообщает через флаги.
 */
function validateDocumentShape(data: unknown): string[] {
  const errors: string[] = [];

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return ['Корневой элемент документа должен быть JSON-объектом.'];
  }

  const doc = data as Record<string, unknown>;

  if (!Array.isArray(doc.stages)) {
    errors.push('Поле "stages" должно быть массивом строк.');
  } else if (!doc.stages.every((s) => typeof s === 'string')) {
    errors.push('Поле "stages" должно содержать только строки.');
  }

  if (!Array.isArray(doc.entries)) {
    errors.push('Поле "entries" должно быть массивом записей.');
  } else {
    doc.entries.forEach((entry, index) => {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`entries[${index}] должна быть объектом.`);
        return;
      }
      const e = entry as Record<string, unknown>;

      if (typeof e.stage !== 'string') {
        errors.push(`entries[${index}].stage должно быть строкой.`);
      }

      if (!Array.isArray(e.documentation)) {
        errors.push(
          `entries[${index}].documentation должно быть массивом ссылок вида { "id": string }.`
        );
      } else {
        e.documentation.forEach((doc, docIndex) => {
          if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
            errors.push(
              `entries[${index}].documentation[${docIndex}] должна быть объектом вида { "id": string }.`
            );
          }
        });
      }

      const agent = e.specialistAgent;
      if (agent !== null && agent !== undefined && typeof agent !== 'string') {
        errors.push(
          `entries[${index}].specialistAgent должно быть строкой или null.`
        );
      }
    });
  }

  return errors;
}

/**
 * Печатает понятное сообщение об ошибке и завершает процесс ненулевым кодом.
 */
function failWith(message: string, hint?: string): never {
  console.error(chalk.red(`\n❌ ${message}`));
  if (hint) {
    console.log(chalk.gray(hint));
  }
  console.log();
  process.exit(1);
}

/**
 * Выполнить команду `validate-master-list <file>`.
 *
 * @param file - путь к JSON-документу Master_Task_List.
 * @param options - опции команды.
 */
export async function validateMasterListCommand(
  file: string,
  options: ValidateMasterListOptions = {}
): Promise<void> {
  const verbose = options.verbose || false;

  // 1. Чтение файла (ввод-вывод) — ошибки обрабатываются явно.
  let raw: string;
  try {
    raw = await readFile(file, 'utf-8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      failWith(
        `Файл не найден: ${file}`,
        'Укажите путь к JSON-документу Master_Task_List.'
      );
    }
    failWith(`Не удалось прочитать файл ${file}: ${(error as Error).message}`);
  }

  // 2. Разбор JSON — синтаксические ошибки обрабатываются явно.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    failWith(
      `Не удалось разобрать JSON в файле ${file}: ${(error as Error).message}`,
      'Документ должен быть валидным JSON вида { "stages": string[], "entries": [...] }.'
    );
  }

  // 3. Проверка формы документа.
  const shapeErrors = validateDocumentShape(parsed);
  if (shapeErrors.length > 0) {
    console.error(chalk.red('\n❌ Документ не соответствует ожидаемой форме:'));
    shapeErrors.forEach((err) => console.error(chalk.red(`  • ${err}`)));
    console.log(
      chalk.gray(
        '\nОжидаемая форма: { "stages": string[], "entries": [{ "stage": string, ' +
          '"documentation": [{ "id": string }], "specialistAgent": string | null }] }\n'
      )
    );
    process.exit(1);
  }

  const doc = parsed as MasterListDocument;
  const stages = doc.stages;
  const entries = doc.entries;

  if (verbose) {
    console.log(chalk.gray(`\nИсточник: ${file}`));
    console.log(chalk.gray(`Stages (${stages.length}): ${stages.join(', ')}`));
    console.log(chalk.gray(`Записей: ${entries.length}\n`));
  }

  // 4. Проверка через чистую функцию слоя оркестрации.
  const result = validateMasterList(entries, stages);

  console.log(chalk.bold.cyan(`\n🔎 Проверка Master_Task_List (${file})`));

  // 5. Печать флагов по записям (index + attribute + reason) — Req 6.3–6.5.
  if (result.flags.length === 0) {
    console.log(chalk.green('  ✓ Все записи полны (Documentation + Specialist_Agent).'));
  } else {
    console.log(
      chalk.yellow(`  Обнаружено флагов: ${result.flags.length}`)
    );
    for (const flag of result.flags) {
      console.log(
        chalk.red(
          `    • entries[${flag.index}] — ${flag.attribute}: ${flag.reason}`
        )
      );
    }
  }

  // 6. Печать признака биекции записей и Stage — Req 4.2.
  if (result.stageBijectionHolds) {
    console.log(
      chalk.green('  ✓ Биекция записей и Stage соблюдена (ровно одна запись на Stage).')
    );
  } else {
    console.log(
      chalk.red(
        '  ✗ Биекция записей и Stage НЕ соблюдена ' +
          '(пропущенный, дублирующий или лишний Stage).'
      )
    );
  }

  // 7. Итог и код возврата.
  const hasProblems = result.flags.length > 0 || !result.stageBijectionHolds;
  if (hasProblems) {
    console.error(
      chalk.red('\n❌ Master_Task_List неполон или нарушает биекцию Stage.\n')
    );
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Master_Task_List корректен.\n'));
}

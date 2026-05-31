/**
 * Валидатор Master_Task_List (`src/orchestration/master-list-validator.ts`).
 *
 * Чистая функция верификации структурных инвариантов Master_Task_List:
 * - полнота КАЖДОЙ записи (наличие хотя бы одной идентифицируемой ссылки на
 *   Documentation и ровно одного Specialist_Agent), без прекращения обработки
 *   на первой ошибке (Req 6.1–6.5);
 * - биекция записей и Stage: ровно одна запись верхнего уровня на каждый Stage
 *   (Req 4.2).
 *
 * Модуль не выполняет ввод-вывод и не зависит от файловой системы — он получает
 * уже разобранные записи и список Stage и возвращает результат проверки. См.
 * design.md → "Components and Interfaces" → "Слой оркестрации —
 * src/orchestration/" → `master-list-validator.ts`, а также "Data Models" →
 * "Инварианты данных".
 *
 * Validates: Requirements 4.2, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { DocRef } from './types';

/**
 * Запись верхнего уровня Master_Task_List.
 *
 * @property stage - Stage из документации архитектуры, к которому относится
 *   запись (Req 4.2).
 * @property documentation - идентифицируемые ссылки на необходимую
 *   Documentation; валидной запись считается, только если есть хотя бы одна
 *   ссылка с непустым, не-whitespace `id` (Req 6.1, 6.4).
 * @property specialistAgent - ответственный Specialist_Agent; валидным значение
 *   считается, только если указан РОВНО ОДИН агент (Req 6.2, 6.5).
 *   Тип — одиночная строка, поэтому случай "более одного" моделируется строкой,
 *   содержащей разделитель из {@link MULTI_AGENT_SEPARATOR_RE} (см. ниже).
 */
export interface MasterTaskListEntry {
  /** Stage из документации архитектуры. */
  stage: string;
  /** Идентифицируемые ссылки на необходимую Documentation (Req 6.1). */
  documentation: DocRef[];
  /** Ровно один ответственный Specialist_Agent (Req 6.2). */
  specialistAgent: string | null;
}

/** Атрибут записи Master_Task_List, который может быть помечен как некорректный. */
export type EntryAttribute = 'documentation' | 'specialistAgent';

/**
 * Флаг некорректного атрибута конкретной записи Master_Task_List.
 *
 * @property index - индекс записи в исходном массиве `entries` (0-индексация).
 * @property attribute - конкретный некорректный атрибут (Req 6.4, 6.5).
 * @property reason - человекочитаемое пояснение причины пометки.
 */
export interface EntryFlag {
  index: number;
  attribute: EntryAttribute;
  reason: string;
}

/**
 * Результат проверки Master_Task_List.
 *
 * @property flags - все обнаруженные некорректные атрибуты по всем записям;
 *   обработка не прекращается на первой ошибке (Req 6.3).
 * @property stageBijectionHolds - `true` ⇔ между записями и Stage существует
 *   биекция: ровно одна запись на каждый Stage (Req 4.2).
 */
export interface MasterListValidation {
  flags: EntryFlag[];
  stageBijectionHolds: boolean;
}

/**
 * Разделители, наличие которых в непустой (не-whitespace) строке
 * `specialistAgent` трактуется как перечисление НЕСКОЛЬКИХ Specialist_Agent —
 * то есть "более одного", что недопустимо по Req 6.2/6.5 (требуется ровно один).
 *
 * Интерпретация "ровно одного Specialist_Agent" (зафиксирована здесь, так как
 * на неё опираются property-тесты задач 5.2/5.3):
 *  - тип поля — одиночная строка `string | null`, поэтому "ноль агентов" — это
 *    `null` / `undefined` / пустая строка / строка только из пробелов;
 *  - "более одного агента" моделируется одной строкой, которая после
 *    обрезки пробелов содержит хотя бы один разделитель списка — запятую `,`
 *    или точку с запятой `;` (см. {@link MULTI_AGENT_SEPARATOR_RE});
 *  - "ровно один агент" — непустая, не-whitespace строка БЕЗ таких разделителей.
 *
 * Запятая и точка с запятой выбраны как канонические разделители списков; имена
 * специализаций (например, "JavaScript", "Rust") их не содержат, поэтому данное
 * правило не даёт ложных срабатываний на корректных одиночных агентах.
 */
export const MULTI_AGENT_SEPARATOR_RE = /[,;]/;

/**
 * Проверяет, является ли значение непустой, не состоящей только из пробелов
 * строкой. Используется для проверки `DocRef.id` и `specialistAgent`
 * (Req 6.4, 6.5).
 */
function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Запись имеет хотя бы одну идентифицируемую ссылку на Documentation, если
 * `documentation` — непустой массив, в котором есть хотя бы один `DocRef` с
 * непустым, не-whitespace `id` (Req 6.1, 6.4).
 */
function hasIdentifiableDoc(documentation: DocRef[] | null | undefined): boolean {
  if (!Array.isArray(documentation) || documentation.length === 0) {
    return false;
  }
  return documentation.some((doc) => doc != null && isNonBlankString(doc.id));
}

/**
 * Значение `specialistAgent` указывает ровно одного Specialist_Agent, если это
 * непустая, не-whitespace строка, не содержащая разделителей нескольких агентов
 * (Req 6.2, 6.5). См. {@link MULTI_AGENT_SEPARATOR_RE}.
 */
function hasExactlyOneSpecialistAgent(specialistAgent: string | null | undefined): boolean {
  if (!isNonBlankString(specialistAgent)) {
    return false; // ноль агентов: null / undefined / пусто / только пробелы
  }
  if (MULTI_AGENT_SEPARATOR_RE.test(specialistAgent.trim())) {
    return false; // более одного агента
  }
  return true;
}

/**
 * Проверяет биекцию между записями и Stage: ровно одна запись верхнего уровня
 * на каждый Stage из `stages`, без пропущенных и без дублирующих Stage
 * (Req 4.2).
 *
 * Условие истинно тогда и только тогда, когда:
 *  - `stages` не содержит дубликатов (является множеством);
 *  - каждый Stage из `stages` встречается среди `entry.stage` ровно один раз;
 *  - среди записей нет лишних Stage (отсутствующих в `stages`).
 *
 * Пустой `entries` против пустого `stages` даёт тривиальную (пустую) биекцию —
 * `true`.
 */
function checkStageBijection(entries: MasterTaskListEntry[], stages: string[]): boolean {
  // `stages` должен быть множеством (без дубликатов).
  const stageSet = new Set(stages);
  if (stageSet.size !== stages.length) {
    return false;
  }

  // Подсчёт вхождений каждого Stage среди записей.
  const entryStageCounts = new Map<string, number>();
  for (const entry of entries) {
    entryStageCounts.set(entry.stage, (entryStageCounts.get(entry.stage) ?? 0) + 1);
  }

  // Среди записей не должно быть Stage, встречающегося более одного раза
  // (а также любого Stage, отсутствующего в `stages`).
  for (const [stage, count] of entryStageCounts) {
    if (count !== 1 || !stageSet.has(stage)) {
      return false;
    }
  }

  // Множества Stage записей и `stages` должны совпадать по размеру; вместе с
  // проверкой выше это гарантирует точное покрытие каждого Stage ровно раз.
  return entryStageCounts.size === stageSet.size;
}

/**
 * Проверяет полноту каждой записи Master_Task_List и биекцию записей со Stage.
 *
 * Обрабатывает ВСЕ записи (не прекращает на первой ошибке, Req 6.3). Для каждой
 * записи добавляет флаг с атрибутом `documentation`, если у неё нет ни одной
 * идентифицируемой ссылки на Documentation (Req 6.1, 6.4), и флаг с атрибутом
 * `specialistAgent`, если не указан ровно один Specialist_Agent (Req 6.2, 6.5).
 *
 * @param entries - записи Master_Task_List.
 * @param stages - список Stage из документации архитектуры (Req 4.2).
 * @returns результат проверки с перечнем флагов и признаком биекции.
 */
export function validateMasterList(
  entries: MasterTaskListEntry[],
  stages: string[],
): MasterListValidation {
  const flags: EntryFlag[] = [];

  entries.forEach((entry, index) => {
    if (!hasIdentifiableDoc(entry.documentation)) {
      flags.push({
        index,
        attribute: 'documentation',
        reason:
          'Запись не содержит ни одной идентифицируемой ссылки на Documentation ' +
          '(отсутствует, пустой массив, либо все id пусты/null/только пробелы).',
      });
    }

    if (!hasExactlyOneSpecialistAgent(entry.specialistAgent)) {
      flags.push({
        index,
        attribute: 'specialistAgent',
        reason:
          'Запись не указывает ровно одного Specialist_Agent ' +
          '(отсутствует, null, пусто, только пробелы либо более одного агента).',
      });
    }
  });

  return {
    flags,
    stageBijectionHolds: checkStageBijection(entries, stages),
  };
}

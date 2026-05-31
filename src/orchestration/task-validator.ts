/**
 * Валидатор обычной Task (`src/orchestration/task-validator.ts`).
 *
 * Чистая функция верификации полноты обычной Task по её обязательным
 * атрибутам, без прекращения обработки на первом нарушении. Проверяются:
 * - наличие хотя бы одной идентифицируемой ссылки на необходимую Documentation
 *   (`neededDocs`, Req 7.1, 7.8);
 * - наличие хотя бы одной идентифицируемой ссылки на обновляемую Documentation
 *   (`docsToUpdate`, Req 7.2, 7.9);
 * - указание назначенного Specialist_Agent в первой строке Task
 *   (`assignedAgent`, Req 5.5, 8.11);
 * - назначение каждой части работы ровно одному Specialist_Agent — ни одна
 *   часть не должна оставаться без назначенного агента (`partAssignment`,
 *   Req 7.3).
 *
 * Модуль не выполняет ввод-вывод и не зависит от файловой системы: он получает
 * уже разобранную Task и возвращает перечень флагов некорректных атрибутов.
 * Пустой результат означает, что Task полна по всем обязательным атрибутам.
 *
 * Типы {@link TaskTodo} и {@link Report} переиспользуются из модуля
 * `task-todo`, чтобы избежать дублирующих определений конечного автомата
 * протокола Task_TODO. Общий тип {@link DocRef} берётся из `types`.
 *
 * См. design.md → "Components and Interfaces" → "Слой оркестрации —
 * src/orchestration/" → `task-validator.ts`, а также "Data Models" →
 * "Инварианты данных".
 *
 * Validates: Requirements 5.5, 7.1, 7.2, 7.3, 7.8, 7.9, 8.11
 */

import { DocRef } from './types';
import { TaskTodo, Report } from './task-todo';

/**
 * Часть работы внутри Task, когда над ней должны работать несколько
 * Specialist_Agent (Req 7.3).
 *
 * @property description - описание части работы.
 * @property assignedAgent - назначенный за часть Specialist_Agent; валидным
 *   считается, только если это непустая, не-whitespace строка (ровно один
 *   агент). Значение `null` / пусто / только пробелы означает, что часть
 *   оставлена без назначенного агента (Req 7.3).
 */
export interface TaskPart {
  description: string;
  assignedAgent: string | null;
}

/**
 * Обычная (регулярная) Task, формируемая Specialist_Agent на основе
 * Master_Task_List.
 *
 * @property assignedAgent - назначенный Specialist_Agent, указываемый в первой
 *   строке Task; валидным считается только непустая, не-whitespace строка
 *   (Req 5.5, 8.11).
 * @property neededDocs - идентифицируемые ссылки на необходимую Documentation;
 *   валидно, если есть хотя бы одна ссылка с непустым, не-whitespace `id`
 *   (Req 7.1, 7.8).
 * @property docsToUpdate - идентифицируемые ссылки на обновляемую по итогам
 *   Documentation; валидно по тому же правилу непустоты (Req 7.2, 7.9).
 * @property parts - части работы при нескольких агентах; каждая часть должна
 *   быть назначена ровно одному Specialist_Agent (Req 7.3). Пустой массив
 *   означает отсутствие разбиения на части и не помечается.
 * @property todo - чек-лист протокола Task_TODO (см. `task-todo`).
 * @property report - подготовленный Report или `null`, если он ещё не готов.
 */
export interface Task {
  assignedAgent: string | null;
  neededDocs: DocRef[];
  docsToUpdate: DocRef[];
  parts: TaskPart[];
  todo: TaskTodo;
  report: Report | null;
}

/** Атрибут Task, который может быть помечен как некорректный/неполный. */
export type TaskAttribute =
  | 'neededDocs'
  | 'docsToUpdate'
  | 'assignedAgent'
  | 'partAssignment';

/**
 * Флаг некорректного/неполного атрибута Task.
 *
 * @property attribute - конкретный некорректный атрибут (Req 7.8, 7.9, 8.11,
 *   7.3).
 * @property reason - человекочитаемое пояснение причины пометки.
 */
export interface TaskFlag {
  attribute: TaskAttribute;
  reason: string;
}

/**
 * Проверяет, является ли значение непустой, не состоящей только из пробелов
 * строкой. Используется для проверки `DocRef.id`, `assignedAgent` и
 * `TaskPart.assignedAgent` (Req 7.8, 7.9, 8.11, 7.3).
 */
function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Набор ссылок на Documentation содержит хотя бы одну идентифицируемую ссылку,
 * если это непустой массив, в котором есть хотя бы один `DocRef` с непустым,
 * не-whitespace `id` (Req 7.1/7.8, 7.2/7.9).
 */
function hasIdentifiableDoc(docs: DocRef[] | null | undefined): boolean {
  if (!Array.isArray(docs) || docs.length === 0) {
    return false;
  }
  return docs.some((doc) => doc != null && isNonBlankString(doc.id));
}

/**
 * Проверяет полноту обычной Task по всем обязательным атрибутам.
 *
 * Возвращает перечень флагов: по одному на каждый некорректный атрибут.
 * Обработка не прекращается на первом нарушении — проверяются все атрибуты.
 * Пустой результат означает, что Task полна.
 *
 * Правила пометки:
 * - `neededDocs` — если нет ни одной идентифицируемой ссылки на необходимую
 *   Documentation (отсутствует, пустой массив либо все `id` пусты/null/только
 *   пробелы), Req 7.1, 7.8;
 * - `docsToUpdate` — если нет ни одной идентифицируемой ссылки на обновляемую
 *   Documentation (то же правило), Req 7.2, 7.9;
 * - `assignedAgent` — если назначенный Specialist_Agent не указан (null, пусто
 *   или только пробелы), Req 5.5, 8.11;
 * - `partAssignment` — если существует часть работы, оставленная без ровно
 *   одного назначенного Specialist_Agent (assignedAgent части null/пусто/только
 *   пробелы), Req 7.3.
 *
 * @param task - проверяемая Task.
 * @returns массив флагов некорректных атрибутов (возможно пустой).
 */
export function validateTask(task: Task): TaskFlag[] {
  const flags: TaskFlag[] = [];

  if (!hasIdentifiableDoc(task.neededDocs)) {
    flags.push({
      attribute: 'neededDocs',
      reason:
        'Task не указывает ни одной идентифицируемой ссылки на необходимую ' +
        'Documentation (отсутствует, пустой массив либо все id пусты/null/только пробелы).',
    });
  }

  if (!hasIdentifiableDoc(task.docsToUpdate)) {
    flags.push({
      attribute: 'docsToUpdate',
      reason:
        'Task не указывает ни одной идентифицируемой ссылки на обновляемую ' +
        'Documentation (отсутствует, пустой массив либо все id пусты/null/только пробелы).',
    });
  }

  if (!isNonBlankString(task.assignedAgent)) {
    flags.push({
      attribute: 'assignedAgent',
      reason:
        'Task не указывает назначенного Specialist_Agent в первой строке ' +
        '(отсутствует, null, пусто или только пробелы).',
    });
  }

  if (
    Array.isArray(task.parts) &&
    task.parts.some((part) => part == null || !isNonBlankString(part.assignedAgent))
  ) {
    flags.push({
      attribute: 'partAssignment',
      reason:
        'Существует часть работы, оставленная без ровно одного назначенного ' +
        'Specialist_Agent (assignedAgent части null/пусто/только пробелы).',
    });
  }

  return flags;
}

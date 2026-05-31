/**
 * Конечный автомат протокола Task_TODO (`src/orchestration/task-todo.ts`).
 *
 * Чистый функциональный модуль, кодирующий протокол чек-листа из трёх пунктов,
 * который исполняющий Specialist_Agent отмечает по ходу работы над Task
 * (Requirement 8). Все функции — чистые: они НЕ мутируют входные значения и
 * возвращают новые объекты.
 *
 * Состав протокола:
 * - {@link TaskTodo} — ровно три булевых пункта в фиксированном порядке
 *   `readDocs → doTask → updateDocs` (Req 8.1). У протокола НЕТ отмечаемого
 *   пункта для подготовки Report (Req 8.8).
 * - {@link newTaskTodo} — инициализация: все три пункта «не отмечено» (Req 8.2).
 * - {@link checkItem} — отметка пункта допустима, только если все
 *   предшествующие пункты уже отмечены (строгий порядок, Req 8.3–8.6).
 * - {@link Report} — отчёт об изменениях для Orchestrator (Req 8.13).
 * - {@link isTaskComplete} — Task завершена ⇔ все три пункта отмечены И Report
 *   подготовлен (Req 8.9, 8.10).
 *
 * Инвариант, сохраняемый после любой последовательности операций:
 * `updateDocs ⇒ doTask ⇒ readDocs` (монотонность по порядку, Req 8.5).
 *
 * См. design.md → "Components and Interfaces" → "task-todo.ts" и
 * "Инварианты данных" → "TaskTodo".
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 8.9, 8.10, 8.13
 */

/**
 * Task_TODO — чек-лист ровно из трёх отмечаемых пунктов в фиксированном порядке
 * (Req 8.1). Значение `true` означает «отмечено», `false` — «не отмечено».
 *
 * Структура намеренно фиксирована: здесь НЕТ четвёртого поля для подготовки
 * Report (Req 8.8); подготовка Report моделируется отдельно через
 * {@link Report} и {@link isTaskComplete}.
 */
export interface TaskTodo {
  /** Пункт 1: прочитать необходимую Documentation (Req 8.3). */
  readDocs: boolean;
  /** Пункт 2: выполнить задачу (Req 8.4). */
  doTask: boolean;
  /** Пункт 3: обновить Documentation (Req 8.6). */
  updateDocs: boolean;
}

/** Идентификатор отмечаемого пункта Task_TODO. */
export type TodoItem = 'readDocs' | 'doTask' | 'updateDocs';

/**
 * Фиксированный порядок отметки пунктов Task_TODO (Req 8.1, 8.5):
 * (1) прочитать Documentation → (2) выполнить задачу → (3) обновить Documentation.
 */
export const TODO_ORDER: TodoItem[] = ['readDocs', 'doTask', 'updateDocs'];

/**
 * Report — отчёт об изменениях, подготавливаемый Specialist_Agent для
 * Orchestrator после выполнения Task (Req 8.13).
 */
export interface Report {
  /** Перечень всех внесённых в рамках Task изменений (Req 8.13). */
  changes: string[];
}

/**
 * Создаёт новый Task_TODO со всеми пунктами в состоянии «не отмечено» (Req 8.2).
 *
 * @returns Свежий {@link TaskTodo}, в котором `readDocs`, `doTask` и
 *   `updateDocs` равны `false`.
 */
export function newTaskTodo(): TaskTodo {
  return {
    readDocs: false,
    doTask: false,
    updateDocs: false,
  };
}

/**
 * Пытается отметить указанный пункт Task_TODO с соблюдением строгого порядка
 * (Req 8.3–8.6).
 *
 * Отметка пункта успешна (`ok: true`) ТОЛЬКО ЕСЛИ все предшествующие ему пункты
 * в порядке {@link TODO_ORDER} уже отмечены. В этом случае возвращается НОВЫЙ
 * {@link TaskTodo} с отмеченным пунктом. Иначе попытка завершается неуспехом
 * (`ok: false`), а исходный `todo` возвращается без изменений (Req 8.5).
 *
 * Функция чистая: входной `todo` не мутируется.
 *
 * Повторная отметка уже отмеченного пункта корректна: все предшественники (и сам
 * пункт) уже отмечены, поэтому возвращается `ok: true` с эквивалентным
 * состоянием.
 *
 * @param todo - текущее состояние Task_TODO.
 * @param item - пункт, который требуется отметить.
 * @returns `{ ok, todo }`, где `ok` указывает на успех, а `todo` — итоговое
 *   состояние (новое при успехе, неизменное при неуспехе).
 */
export function checkItem(
  todo: TaskTodo,
  item: TodoItem
): { ok: boolean; todo: TaskTodo } {
  const index = TODO_ORDER.indexOf(item);

  // Все предшествующие пункты в фиксированном порядке должны быть отмечены.
  for (let i = 0; i < index; i++) {
    if (!todo[TODO_ORDER[i]]) {
      return { ok: false, todo };
    }
  }

  return {
    ok: true,
    todo: { ...todo, [item]: true },
  };
}

/**
 * Определяет, завершена ли Task (Req 8.9, 8.10).
 *
 * Task завершена тогда и только тогда, когда все три пункта Task_TODO отмечены
 * И Report для Orchestrator подготовлен (`report != null`). Во всех остальных
 * случаях Task считается незавершённой (Req 8.10).
 *
 * @param todo - состояние Task_TODO.
 * @param report - подготовленный Report или `null`, если он ещё не готов.
 * @returns `true`, если Task завершена; иначе `false`.
 */
export function isTaskComplete(todo: TaskTodo, report: Report | null): boolean {
  return todo.readDocs && todo.doTask && todo.updateDocs && report != null;
}

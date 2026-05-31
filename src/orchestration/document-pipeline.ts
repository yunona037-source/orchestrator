/**
 * Конвейер порядка документов форка (`src/orchestration/document-pipeline.ts`).
 *
 * Чистый модуль без побочных эффектов, кодирующий инвариант фиксированного
 * порядка формирования документов форка:
 *
 *   Requirements_Document → Tech_Design_Document → Tasks_Document → Project_Rules
 *
 * Делегирование формирования документа `stage` разрешается тогда и только тогда,
 * когда все предшествующие ему документы (по {@link DOC_ORDER}) уже сформированы
 * и сохранены, и при этом в конвейере не зафиксирована ошибка формирования.
 * Любая ошибка формирования (`recordError`) блокирует делегирование всех
 * последующих документов.
 *
 * См. design.md → "Components and Interfaces" → "Слой оркестрации —
 * src/orchestration/" → `document-pipeline.ts`, и "Data Models" →
 * "Инварианты данных" → PipelineState.
 *
 * Validates: Requirements 4.6, 9.1, 9.5, 9.6, 9.7, 9.8
 */

/**
 * Этап формирования документа форка.
 *
 * Перечисление совпадает по составу и порядку с {@link DOC_ORDER} (Req 9.1).
 */
export type DocStage =
  | 'Requirements_Document'
  | 'Tech_Design_Document'
  | 'Tasks_Document'
  | 'Project_Rules';

/**
 * Фиксированный порядок формирования документов форка (Req 9.1).
 *
 * Без пропусков и без изменения последовательности: требования предшествуют
 * дизайну, дизайн — задачам, а правила проекта оформляются последними.
 */
export const DOC_ORDER: DocStage[] = [
  'Requirements_Document',
  'Tech_Design_Document',
  'Tasks_Document',
  'Project_Rules',
];

/**
 * Состояние конвейера документов.
 *
 * @property formed - для каждого {@link DocStage} признак «сформирован и
 *   сохранён» (Req 9.1).
 * @property errorStage - этап, на котором возникла ошибка формирования, либо
 *   `null`, если ошибок не было. Ненулевое значение блокирует делегирование
 *   всех документов (Req 9.8).
 */
export interface PipelineState {
  /** Для каждого этапа: сформирован и сохранён ли соответствующий документ. */
  formed: Record<DocStage, boolean>;
  /** Этап, на котором возникла ошибка формирования (Req 9.8). */
  errorStage: DocStage | null;
}

/**
 * Создаёт начальное состояние конвейера: ни один документ не сформирован и
 * ошибок не зафиксировано.
 *
 * Удобно для инициализации и тестов.
 *
 * @returns Новое {@link PipelineState} со всеми `formed === false` и
 *   `errorStage === null`.
 */
export function newPipelineState(): PipelineState {
  return {
    formed: {
      Requirements_Document: false,
      Tech_Design_Document: false,
      Tasks_Document: false,
      Project_Rules: false,
    },
    errorStage: null,
  };
}

/**
 * Проверяет, разрешено ли делегировать формирование документа `stage`.
 *
 * Делегирование разрешено тогда и только тогда, когда:
 * - в конвейере не зафиксирована ошибка (`state.errorStage === null`, Req 9.8); и
 * - все документы, предшествующие `stage` в {@link DOC_ORDER}, сформированы и
 *   сохранены (`state.formed[...] === true`, Req 9.5–9.7).
 *
 * Первый этап ({@link DOC_ORDER}[0], `Requirements_Document`) не имеет
 * предшественников, поэтому для него условие сводится к отсутствию ошибки.
 *
 * Validates: Requirements 4.6, 9.1, 9.5, 9.6, 9.7
 *
 * @param state - текущее состояние конвейера.
 * @param stage - документ, делегирование которого проверяется.
 * @returns `true`, если делегирование `stage` допустимо; иначе `false`.
 */
export function canDelegate(state: PipelineState, stage: DocStage): boolean {
  if (state.errorStage !== null) {
    return false;
  }

  const stageIndex = DOC_ORDER.indexOf(stage);

  // Все предшественники по DOC_ORDER должны быть сформированы и сохранены.
  for (let i = 0; i < stageIndex; i++) {
    if (!state.formed[DOC_ORDER[i]]) {
      return false;
    }
  }

  return true;
}

/**
 * Фиксирует ошибку формирования на этапе `stage`.
 *
 * Возвращает НОВОЕ состояние (без мутации входного `state`), у которого
 * `errorStage` установлен в `stage`. Поскольку {@link canDelegate} требует
 * `errorStage === null`, после `recordError` делегирование любого документа
 * становится недопустимым — это блокирует формирование всех последующих
 * документов (Req 9.8).
 *
 * Validates: Requirements 9.8
 *
 * @param state - текущее состояние конвейера (не изменяется).
 * @param stage - этап, на котором возникла ошибка формирования.
 * @returns Новое {@link PipelineState} с зафиксированной ошибкой.
 */
export function recordError(state: PipelineState, stage: DocStage): PipelineState {
  return {
    formed: { ...state.formed },
    errorStage: stage,
  };
}

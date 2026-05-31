/**
 * Базовые доменные типы слоя оркестрации (`src/orchestration/`).
 *
 * Здесь определяются ТОЛЬКО общие (cross-cutting) типы, разделяемые несколькими
 * модулями-валидаторами слоя оркестрации. Модуль-специфичные типы
 * (`MasterTaskListEntry`, `Task`, `TaskTodo`, `SpecialistAgent`, `PipelineState`
 * и т. п.) объявляются в собственных файлах соответствующих модулей, чтобы
 * избежать дублирования.
 *
 * См. design.md → "Components and Interfaces" → "Слой оркестрации —
 * src/orchestration/".
 */

/**
 * Идентифицируемая ссылка на документ (Documentation).
 *
 * Используется как в `master-list-validator` (поле `documentation` записи
 * Master_Task_List, Req 6.1), так и в `task-validator` (поля `neededDocs` и
 * `docsToUpdate` обычной Task, Req 7.1/7.2). Является общим типом слоя
 * оркестрации.
 *
 * @property id - путь/идентификатор документа; считается валидной ссылкой,
 *   только если это непустая, не состоящая из одних пробелов строка
 *   (Req 6.4, 7.8, 7.9).
 */
export interface DocRef {
  /** Идентифицируемая ссылка на документ (путь/идентификатор). */
  id: string;
}

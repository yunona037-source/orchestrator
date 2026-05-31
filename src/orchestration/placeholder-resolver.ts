/**
 * Резолвер плейсхолдеров шаблонов (`src/orchestration/placeholder-resolver.ts`).
 *
 * Чистый модуль без побочных эффектов для работы с плейсхолдерами формата
 * `{{PLACEHOLDER}}` в шаблонах (прежде всего — Project_Rules_Template на основе
 * `AGENTS.template.md`):
 *
 * - {@link scanPlaceholders} — извлекает множество имён плейсхолдеров,
 *   встречающихся в тексте (без дубликатов);
 * - {@link resolvePlaceholders} — подставляет значения известных плейсхолдеров,
 *   оставляя неизвестные нетронутыми; операция идемпотентна при той же карте
 *   значений (Req 10.4);
 * - {@link validateProjectRules} — проверяет, что в результирующем тексте не
 *   осталось неразрешённых плейсхолдеров, и определяет пригодность Project_Rules
 *   к загрузке (Req 10.5, 10.6).
 *
 * Модель плейсхолдеров (см. design.md → "Data Models" → "Модель шаблонов"):
 * множество плейсхолдеров `P = scanPlaceholders(template)`; карта значений
 * `V: Record<string, string>`. После `resolvePlaceholders(template, V)` множество
 * оставшихся плейсхолдеров равно `P \ dom(V)`.
 *
 * См. design.md → "Components and Interfaces" → "Слой оркестрации —
 * src/orchestration/" → `placeholder-resolver.ts`.
 *
 * Validates: Requirements 10.3, 10.4, 10.5, 10.6
 */

/**
 * Регулярное выражение плейсхолдера `{{PLACEHOLDER}}`.
 *
 * Имя плейсхолдера состоит из заглавных латинских букв, цифр и подчёркиваний
 * (`A-Z`, `0-9`, `_`) и захватывается в группу 1. Флаг `g` обязателен для
 * сканирования всех вхождений и для использования в
 * {@link String.prototype.matchAll} / {@link String.prototype.replace}.
 *
 * ВНИМАНИЕ: глобальное регулярное выражение хранит состояние `lastIndex`.
 * Все функции модуля используют `matchAll`/`replace`, которые НЕ зависят от
 * внешнего `lastIndex` и не оставляют его в изменённом состоянии, поэтому
 * экземпляр безопасно переиспользуется между вызовами. Не используйте
 * `PLACEHOLDER_RE.test()` / `PLACEHOLDER_RE.exec()` напрямую без сброса
 * `lastIndex`.
 */
export const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g;

/**
 * Извлекает множество имён плейсхолдеров `{{PLACEHOLDER}}`, встречающихся в
 * тексте, без дубликатов и в порядке первого появления.
 *
 * Возвращаются именно ИМЕНА (содержимое внутри `{{ }}`), а не сами обёртки.
 * Если плейсхолдер встречается несколько раз, его имя присутствует в результате
 * ровно один раз.
 *
 * Использует {@link String.prototype.matchAll}, который создаёт собственный
 * итератор и не мутирует `lastIndex` у {@link PLACEHOLDER_RE}.
 *
 * Validates: Requirements 10.5
 *
 * @param text - исходный текст (шаблон или разрешённый Project_Rules).
 * @returns Массив уникальных имён плейсхолдеров в порядке первого появления.
 */
export function scanPlaceholders(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    // match[1] — захваченное имя плейсхолдера (без `{{`/`}}`).
    names.add(match[1]);
  }
  return [...names];
}

/**
 * Подставляет значения известных плейсхолдеров `{{PLACEHOLDER}}` в шаблоне,
 * оставляя неизвестные плейсхолдеры нетронутыми (Req 10.3, 10.4).
 *
 * Семантика — однопроходная замена по исходному шаблону:
 * - каждое вхождение `{{NAME}}`, для которого `NAME` присутствует в `values`,
 *   заменяется на `values[NAME]`;
 * - вхождения, имя которых отсутствует в `values`, сохраняются дословно
 *   (Req 10.3);
 * - подставленные значения трактуются как литеральный текст и повторно НЕ
 *   сканируются в рамках этого же вызова.
 *
 * Идемпотентность при той же карте (Req 10.4): для произвольного шаблона и
 * карты значений, не вводящей в подстановках новых плейсхолдеров-ключей,
 * повторный вызов с той же `values` не изменяет результат —
 * `resolve(resolve(t, V), V) === resolve(t, V)`. Это обеспечивается тем, что
 * оставшиеся после первого прохода плейсхолдеры по определению отсутствуют в
 * `dom(V)`, поэтому второй проход их не затрагивает.
 *
 * Использует {@link String.prototype.replace} с глобальным
 * {@link PLACEHOLDER_RE}; `replace` управляет `lastIndex` внутренне и безопасен
 * при повторных вызовах.
 *
 * Validates: Requirements 10.3, 10.4
 *
 * @param template - исходный шаблон с плейсхолдерами `{{PLACEHOLDER}}`.
 * @param values - карта «имя плейсхолдера → значение подстановки».
 * @returns Текст с подставленными известными значениями.
 */
export function resolvePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(PLACEHOLDER_RE, (whole, name: string) => {
    // Подставляем значение только для собственного ключа карты с валидным
    // строковым значением; иначе оставляем плейсхолдер нетронутым (Req 10.3).
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      const value = values[name];
      if (typeof value === 'string') {
        return value;
      }
    }
    return whole;
  });
}

/**
 * Результат проверки пригодности сформированного Project_Rules.
 *
 * @property unresolved - имена всех плейсхолдеров `{{PLACEHOLDER}}`, оставшихся
 *   неразрешёнными (без дубликатов); перечисляются для пометки Project_Rules как
 *   неполного (Req 10.6).
 * @property loadable - `true` тогда и только тогда, когда `unresolved` пуст;
 *   `false` запрещает использование Project_Rules как загружаемого до разрешения
 *   всех плейсхолдеров (Req 10.6).
 */
export interface ProjectRulesValidation {
  /** Оставшиеся неразрешённые плейсхолдеры (Req 10.5, 10.6). */
  unresolved: string[];
  /** Пригодность к загрузке: `true` ⇔ `unresolved` пуст (Req 10.6). */
  loadable: boolean;
}

/**
 * Проверяет, что в сформированном Project_Rules не осталось неразрешённых
 * плейсхолдеров `{{PLACEHOLDER}}` (Req 10.5), и определяет его пригодность к
 * загрузке (Req 10.6).
 *
 * `loadable` истинно тогда и только тогда, когда {@link scanPlaceholders} не
 * находит в тексте ни одного плейсхолдера. При наличии хотя бы одного
 * неразрешённого плейсхолдера он попадает в `unresolved`, а `loadable`
 * становится `false`.
 *
 * Validates: Requirements 10.5, 10.6
 *
 * @param resolved - текст Project_Rules после разрешения плейсхолдеров.
 * @returns Результат проверки с перечнем неразрешённых плейсхолдеров и признаком
 *   пригодности к загрузке.
 */
export function validateProjectRules(resolved: string): ProjectRulesValidation {
  const unresolved = scanPlaceholders(resolved);
  return {
    unresolved,
    loadable: unresolved.length === 0,
  };
}

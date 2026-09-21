// src/core/utils/attributes.ts

/**
 * HTML attributes whose presence alone means true.
 *
 * The parser does not read their value: `disabled="false"`, `disabled=""` and
 * `disabled="disabled"` are all a disabled control. So writing `String(false)`
 * for one of these produces the opposite of what the caller asked for, which
 * is FLO-240 — `createElement({ disabled: false })` returned a disabled
 * button, and the same inversion reached `checked`, `required` and `hidden`.
 *
 * The list is the HTML boolean attributes a component configuration is
 * plausibly built from. It is deliberately a known set rather than "any false
 * value", because two neighbouring families would be caught by that rule and
 * must not be:
 *
 *   - `aria-*`, where `aria-hidden="false"` is meaningful and differs from the
 *     attribute being absent. Dropping it changes what assistive technology
 *     reports.
 *   - `data-*`, where "false" is an ordinary string an application may read
 *     back with `dataset.x === "false"`.
 */
export const BOOLEAN_ATTRIBUTES = new Set([
  "disabled",
  "checked",
  "readonly",
  "required",
  "hidden",
  "selected",
  "open",
  "multiple",
]);

/**
 * Whether an attribute must be left off the element entirely.
 *
 * True only for a boolean attribute given `false`. Every other value, and
 * every other attribute, is written as usual — including the string `"false"`,
 * which is what a caller passing `"false"` deliberately asked for.
 */
export const omitsAttribute = (key: string, value: unknown): boolean =>
  value === false && BOOLEAN_ATTRIBUTES.has(key.toLowerCase());

// src/core/utils/index.ts

export { isObject, byString } from './object';
export { normalizeEvent, hasTouchSupport, TOUCH_CONFIG, PASSIVE_EVENTS } from './mobile';
export { getInheritedBackground } from './background';
export { throttle, debounce, once } from './performance';
export { getThemeColor } from './theme';
export { colorToRGBA } from './color';

/**
 * Creates a transformer that only runs if a condition is met
 * @param {Function} predicate - Condition to check
 * @param {Function} transformer - Transformer to run if condition is true
 * @returns {Function} Conditional transformer
 */
export const when = <T, C>(
  predicate: (obj: T, context: C) => boolean, 
  transformer: (obj: T, context: C) => T
) => 
  (obj: T, context: C): T =>
    predicate(obj, context) ? transformer(obj, context) : obj;

/**
 * Joins class names, filtering out falsy values
 * @param {...(string | undefined | null | false)} classes - Class names to join
 * @returns {string} Joined class names
 */
export const classNames = (...classes: (string | undefined | null | false)[]): string => 
  classes.filter(Boolean).join(' ');
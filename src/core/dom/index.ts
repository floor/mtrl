// src/core/dom/index.ts

export { createElement, createSVGElement } from "./create";
export type { CreateElementOptions } from "./create";

export {
  setAttributes,
  removeAttributes,
  batchAttributes,
  hasAttribute,
  getAttribute,
} from "./attributes";
export {
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  normalizeClasses,
} from "./classes";

export { createEventManager } from "./events";
export type { EventManager } from "./events";

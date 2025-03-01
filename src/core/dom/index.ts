// src/core/dom/index.ts

export { createElement, withAttributes, withClasses, withContent } from './create';
export type { CreateElementOptions } from './create';

export { setAttributes, removeAttributes } from './attributes';
export { addClass, removeClass, toggleClass, hasClass } from './classes';

export { createEventManager } from './events';
export type { EventManager } from './events';
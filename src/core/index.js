// src/core/index.js
/**
 * @module core
 * @description Core utilities and building blocks for the component system
 */
// Build
export { createText } from './build/text'
export { createIcon } from './build/icon'

// Classes management
export { addClass, removeClass } from './dom/classes'

// State Management
export { createDisabled } from './state/disabled'
export { createEventManager } from './state/events'
export { createLifecycle } from './state/lifecycle'
export { createEmitter } from './state/emitter'

// Composition Utilities
export { pipe, compose, transform } from './compose'

// General Utilities
export { classNames } from './utils'

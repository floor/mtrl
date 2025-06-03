// src/core/index.ts
/**
 * @module core
 * @description Core utilities and building blocks for the component system
 * 
 * This module provides the foundational elements used to build components
 * in a functional, composable way.
 * 
 * @packageDocumentation
 */

// Re-export core modules by category
// This makes imports cleaner for library users while maintaining an organized codebase

// 1. Component composition system
export * from './compose';

// 2. DOM manipulation utilities
export * from './dom';

// 3. State management
// Explicit re-exports to avoid ambiguity
export { createEmitter } from './state/emitter';
export type { Emitter, EventCallback } from './state/emitter';

export { createStore, loggingMiddleware, deriveFiltered } from './state/store';
export type { Store, StoreOptions, Selector, Computation, Updater } from './state/store';

export { createLifecycle } from './state/lifecycle';
export type { LifecycleManager, LifecycleManagers } from './state/lifecycle';

export { createDisabled } from './state/disabled';
export type { DisabledState } from './state/disabled';

// Renamed to avoid conflict with DOM's createEventManager
export { createEventManager as createStateEventManager } from './state/events';
export type { EventManagerState } from './state/events';

// 4. Layout system
export * from './layout';

// 5. Collection
export * from './collection';

// 6. Canvas utilities
export * from './canvas';

// 7. Config and constants
export { 
  PREFIX, 
  COMPONENTS, 
  STATES, 
  classNames,
  getComponentClass,
  getModifierClass,
  getElementClass
} from './config';

// 8. Utility functions
export { 
  when, 
  classNames as joinClasses, 
  isObject, 
  byString,
  hasTouchSupport,
  normalizeEvent,
  throttle,
  debounce,
  once,
  getInheritedBackground
} from './utils';

// 9. Gesture system
export { createGestureManager } from './gestures';
export type {
  GestureManager,
  GestureConfig,
  GestureEvent,
  TapEvent,
  SwipeEvent,
  LongPressEvent,
  PinchEvent,
  RotateEvent,
  PanEvent,
  AnyGestureEvent,
  GestureHandler
} from './gestures';

// Type re-exports for better developer experience
export type { 
  ThemeConfig, 
  ComponentConfig, 
  ThemedComponentConfig, 
  VariantComponentConfig, 
  StateComponentConfig
} from './config';

export type { NormalizedEvent } from './utils/mobile';
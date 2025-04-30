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
export * from './state';

// 4. Layout system
export * from './layout';

// 5. Collection
export * from './collection';

// 6. Config and constants
export { 
  PREFIX, 
  COMPONENTS, 
  STATES, 
  classNames,
  getComponentClass,
  getModifierClass,
  getElementClass
} from './config';

// 7. Utility functions
export { 
  normalizeClasses, 
  when, 
  classNames as joinClasses, 
  isObject, 
  byString,
  hasTouchSupport,
  isMobileDevice,
  normalizeEvent,
  throttle,
  debounce,
  once,
  getInheritedBackground
} from './utils';

// 8. Gesture system
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

// Export specialized build utilities directly for convenience
export { createText } from './build/text';
export { createIcon } from './build/icon';
export { createRipple } from './build/ripple';
export { RIPPLE_TIMING } from './build/constants';

export type { 
  TextManager, 
  TextConfig 
} from './build/text';

export type { 
  IconManager, 
  IconConfig 
} from './build/icon';

export type { 
  RippleController, 
  RippleConfig 
} from './build/ripple';

export type { 
  NormalizedEvent 
} from './utils/mobile';
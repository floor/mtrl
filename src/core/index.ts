// src/core/index.ts
/**
 * @module core
 * @description Core utilities and building blocks for the component system
 */

// Config
export { PREFIX, COMPONENTS, STATES, classNames } from './config';
export type { 
  ThemeConfig, 
  ComponentConfig, 
  ThemedComponentConfig, 
  VariantComponentConfig, 
  StateComponentConfig
} from './config';

// Build
export { createText } from './build/text';
export { createIcon } from './build/icon';
export { createRipple } from './build/ripple';
export { RIPPLE_TIMING } from './build/constants';

// DOM manipulation
export { createElement, withAttributes, withClasses, withContent } from './dom/create';
export { setAttributes, removeAttributes } from './dom/attributes';
export { addClass, removeClass, toggleClass, hasClass } from './dom/classes';

// State Management
export { createDisabled } from './state/disabled';
export { createEventManager } from './state/events';
export { createLifecycle } from './state/lifecycle';
export { createEmitter } from './state/emitter';
export { createStore } from './state/store';

// Composition Utilities
export { pipe, compose, transform } from './compose/pipe';
export { createBase, withElement } from './compose/component';
export {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withSize,
  withPosition,
  withDisabled,
  withLifecycle,
  withRipple,
  withThrottle,
  withDebounce,
  withGestures
} from './compose/features';

// Gesture features
export { withTapGesture } from './compose/features/gestures/tap';
export { withSwipeGesture } from './compose/features/gestures/swipe';
export { withLongPressGesture } from './compose/features/gestures/longpress';
export { withPanGesture } from './compose/features/gestures/pan';

// Utilities
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
  once
} from './utils';

// Component feature interfaces for better developer experience
export type { 
  BaseComponent, 
  ElementComponent, 
  TouchState 
} from './compose/component';

export type {
  EventComponent,
  TextComponent,
  IconComponent,
  LifecycleComponent,
  Lifecycle,
  DisabledComponent,
  DisabledManager,
  RippleComponent,
  ThrottleComponent,
  DebounceComponent,
  GestureComponent
} from './compose/features';

// Other interfaces
export type { 
  CreateElementOptions 
} from './dom/create';

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
  Emitter, 
  EventCallback 
} from './state/emitter';

export type { 
  DisabledState 
} from './state/disabled';

export type { 
  NormalizedEvent 
} from './utils/mobile';

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

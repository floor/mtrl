// src/core/compose/index.ts
/**
 * @module core/compose
 * @description Core composition utilities for creating and combining components
 */

export { pipe, compose, transform } from './pipe';
export { createComponent } from './base';
export { createBase, withElement } from './component';
export {
  withEvents,
  withIcon,
  withSize,
  withPosition,
  withText,
  withVariant,
  withDisabled,
  withLifecycle,
  withRipple,
  withInput,
  withCheckable,
  withStyle,
  withTextInput,
  withTextLabel,
  withTrack,
  withEnhancedEvents,
  withThrottle,
  withDebounce,
  withGestures
} from './features';

// Gesture features
export { withTapGesture } from './features/gestures/tap';
export { withSwipeGesture } from './features/gestures/swipe';
export { withLongPressGesture } from './features/gestures/longpress';
export { withPanGesture } from './features/gestures/pan';

// Component feature interfaces
export type { Component } from './base';
export type { 
  BaseComponent, 
  ElementComponent, 
  TouchState,
  WithElementOptions
} from './component';

export type {
  EventComponent,
  TextComponent,
  IconComponent,
  LifecycleComponent,
  Lifecycle,
  DisabledComponent,
  DisabledManager,
  RippleComponent,
  InputComponent,
  CheckableComponent,
  CheckableManager,
  TextInputComponent,
  LabelComponent,
  TrackComponent,
  EnhancedEventComponent,
  ThrottleComponent,
  ThrottleConfig,
  DebounceComponent,
  DebounceConfig,
  GestureComponent,
  GestureFeatureConfig
} from './features';
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
  withEnhancedEvents
} from './features';

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
  EnhancedEventComponent
} from './features';
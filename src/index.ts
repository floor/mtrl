// src/index.ts
/**
 * Main mtrl library exports
 *
 * The root is the components and the few helpers an app configures them with.
 * The rest of core is at its subpath (`mtrl/core/compose`, `mtrl/core/dom`, ...);
 * the names below marked deprecated leave the root in `material` 3.0.0 (FLO-351). The subpaths
 * are ESM-only, as `material` 3.0.0 is; on 0.10.x CommonJS reaches only the root. The list
 * is pinned by scripts/fixtures/root-exports.json: `bun run root-exports:update`.
 *
 * @packageDocumentation
 */

export * from "./components";

// The public root beyond the components
export { setComponentDefaults, getComponentDefaults, setGlobalDefaults, clearGlobalDefaults, schemeToTokens, THEME_ROLES, configureHTML } from "./core";
export type { ThemeRole, SchemeRoles, SchemeToTokensOptions, ThemeTokens, ComponentConfigMap, HTMLPolicy, HTMLInput, TrustedHTMLLike } from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core'
export {
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  joinClasses,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createStateEventManager,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  PREFIX,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createComponentConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createElementConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  classNames,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getComponentClass,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getModifierClass,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getElementClass,
} from "./core";
export type {
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ThemeConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ComponentConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ThemedComponentConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  VariantComponentConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  StateComponentConfig,
  /** @deprecated Import from 'mtrl/core' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  NormalizedEvent,
} from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core/canvas'
export {
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createRoundedRectPath,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  fillRoundedRect,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  clipRoundedRect,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  fillRoundedRectLR,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  clearCanvas,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  observeCanvasResize,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  easeOutCubic,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ANIMATION_DURATIONS,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EASING_FUNCTIONS,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createCanvasContext,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  updateCanvasDimensions,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  initializeCanvasWithRetry,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createCanvasThemeObserver,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  AnimationFrameManager,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  CleanupManager,
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createStyledCanvas,
} from "./core";
export type {
  /** @deprecated Import from 'mtrl/core/canvas' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  CanvasContext,
} from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core/compose'
export {
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withEnhancedEvents,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  pipe,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  compose,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  transform,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createBase,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withElement,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withEvents,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withIcon,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withSize,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withPosition,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withText,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withVariant,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withDisabled,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withLifecycle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withRipple,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withInput,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withCheckable,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withStyle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withTextInput,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withTextLabel,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withTrack,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withThrottle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  withDebounce,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hasLifecycle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hasEmit,
} from "./core";
export type {
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Component,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  BaseComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  BaseConfig,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ElementComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TouchState,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  WithElementOptions,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EventComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TextComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  IconComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  LifecycleComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Lifecycle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  DisabledComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  DisabledManager,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  RippleComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  InputComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  CheckableComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  CheckableManager,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TextInputComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  LabelComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TrackComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EnhancedEventComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ThrottleComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ThrottleConfig,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  DebounceComponent,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  DebounceConfig,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ComponentWithLifecycle,
  /** @deprecated Import from 'mtrl/core/compose' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ComponentWithEmit,
} from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core/dom'
export {
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  addClass,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  removeClass,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hasClass,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  toggleClass,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createElement,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createSVGElement,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  setAttributes,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  removeAttributes,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  batchAttributes,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hasAttribute,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getAttribute,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  normalizeClasses,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createEventManager,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  setHTML,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getHTMLPolicy,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  activeElementOf,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  deepActiveElement,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createRoving,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  isTextEditable,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  supportsTopLayer,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  showInTopLayer,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hideFromTopLayer,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  onTopLayerClose,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  inertOutside,
} from "./core";
export type {
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  CreateElementOptions,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  ForwardedEventPayload,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EventManager,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Roving,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  RovingOptions,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TopLayerKind,
  /** @deprecated Import from 'mtrl/core/dom' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  TopLayerOptions,
} from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core/state'
export {
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createEmitter,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  createStore,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  loggingMiddleware,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  deriveFiltered,
} from "./core";
export type {
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Emitter,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EventCallback,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Store,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  StoreOptions,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Selector,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Computation,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  Updater,
  /** @deprecated Import from 'mtrl/core/state' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  EventManagerState,
} from "./core";

// Leaving the root in `material` 3.0.0: import from 'mtrl/core/utils'
export {
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  throttle,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  debounce,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  once,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  when,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  isObject,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  byString,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  hasTouchSupport,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  normalizeEvent,
  /** @deprecated Import from 'mtrl/core/utils' (ESM); removed from the root in `material` 3.0.0, which is ESM-only (FLO-351). */
  getInheritedBackground,
} from "./core";

// NOTE: Constants are no longer exported from the main entry point
// to enable proper tree-shaking. Import constants directly from
// component paths:
//
//   import { BUTTON_VARIANTS } from 'mtrl/components/button/constants'
//
// The constants subpath is the one place every component's constants are
// exported from: most component indexes do not re-export them.

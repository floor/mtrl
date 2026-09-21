// src/components/slider/types.ts

import {
  SliderSize,
  SLIDER_COLORS,
  SLIDER_EVENTS,
  SLIDER_SIZES,
} from "./constants";
import { BaseComponentConfig } from "../../core/config/component";

// Re-export constants from constants.ts
export { SLIDER_COLORS, SLIDER_EVENTS, SLIDER_SIZES };

/**
 * Available slider color variants
 */
export type SliderColor = "primary" | "secondary" | "tertiary" | "error";

/**
 * Available slider event types
 */
export type SliderEventType =
  | "change"
  | "input"
  | "focus"
  | "blur"
  | "start"
  | "end";

/**
 * Configuration options for the slider component
 * @interface SliderConfig
 */
export interface SliderConfig extends BaseComponentConfig {
  /** Minimum value of the slider */
  min?: number;

  /** Maximum value of the slider */
  max?: number;

  /** Current value of the slider */
  value?: number;

  /** Secondary value for range slider (when using two handles) */
  secondValue?: number;

  /** Step size for discrete slider */
  step?: number;

  /** Whether the slider is disabled */
  disabled?: boolean;

  /**
   * Form field name. A slider renders no form control of its own, so it
   * submits nothing unless this is set; with it, a hidden input inside the
   * slider carries the current value. A range slider submits two fields,
   * `name` and `name-end`. A disabled slider submits neither.
   */
  name?: string;

  /** Color variant of the slider *
   * A stylesheet can override the drawn colours per slider with the custom
   * properties `--<prefix>-slider-color` and `--<prefix>-slider-on-color`,
   * where `<prefix>` is the configured component prefix (mtrl by default).
   */
  color?: SliderColor;

  /** Size variant of the slider */
  size?: SliderSize;

  /** Whether to show tick marks */
  ticks?: boolean;

  /** Custom labels for ticks, if provided */
  tickLabels?: string[] | Record<number, string>;

  /** Format function for displayed values */
  valueFormatter?: (value: number) => string;

  /** Whether to show the current value while dragging */
  showValue?: boolean;

  /** Whether to snap to steps while dragging (discrete slider) */
  snapToSteps?: boolean;

  /** Whether the slider is a range slider (two handles) */
  range?: boolean;

  /** Whether the slider is a centered slider (with active track from center) */
  centered?: boolean;

  /** Label text for the slider */
  label?: string;

  /** Position of the label (start or end) - defaults to 'start' */
  labelPosition?: "start" | "end";

  /** Icon to display with the slider */
  icon?: string;

  /** Position of the icon (start or end) */
  iconPosition?: "start" | "end";

  /** Additional CSS classes */
  class?: string;

  /** Event handlers for slider events */
  on?: {
    [key in SliderEventType]?: (event: SliderEvent) => void;
  };

  /** CSS class prefix */
  prefix?: string;

  /** Component schema */
  schema?: object;
}

/**
 * Slider event data
 * @interface SliderEvent
 */
export interface SliderEvent {
  /** The slider component that triggered the event */
  slider: SliderComponent;

  /** Current slider value */
  value: number;

  /** Secondary value (for range sliders) */
  secondValue: number | null;

  /** Original DOM event if available */
  originalEvent: Event | null;

  /** Function to prevent default behavior */
  preventDefault: () => void;

  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

/**
 * Slider component public API interface
 * @interface SliderComponent
 */
/**
 * Which handle an interaction is acting on. Null when none is.
 *
 * @category Components
 * @internal
 */
export type SliderActiveHandle = "first" | "second" | null;

/**
 * The controller's state, shared with the handlers it builds.
 *
 * Written down once because controller.ts owns it and handlers.ts reads every
 * field of it; two descriptions of the same object is how they drift.
 *
 * @category Components
 * @internal
 */
export interface SliderState {
  /** The component the controller was handed, with its DOM features */
  component: SliderStateComponent;
  value: number;
  secondValue: number | null;
  /** The value before the last change, kept for centred sliders */
  previousValue?: number;
  min: number;
  max: number;
  step: number;
  dragging: boolean;
  /** Whether a handle is held down */
  pressed: boolean;
  activeHandle: SliderActiveHandle;
  activeBubble: HTMLElement | null;
  valueHideTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * The DOM the controller and handlers reach for through `state.component`.
 *
 * Every element is optional: withDom installs them, and a range slider has the
 * second pair while a single one does not. `components` is the older place the
 * same elements were kept, which both files still fall back to.
 *
 * @category Components
 * @internal
 */
export interface SliderStateComponent {
  // Required: withElement, withEvents and createBase all run before the
  // controller, so the element, the emitter and getClass are there. Only the
  // pieces a range slider adds, and the features installed alongside, are
  // optional.
  element: HTMLElement;
  container?: HTMLElement | null;
  handle?: HTMLElement | null;
  valueBubble?: HTMLElement | null;
  secondHandle?: HTMLElement | null;
  secondValueBubble?: HTMLElement | null;
  components?: Record<string, HTMLElement | null | undefined>;
  getClass: (name: string) => string;
  emit: (event: string, data: unknown) => unknown;
  /** withStates installs this whole, so the member is not optional inside it */
  disabled?: { isDisabled: () => boolean };
  /**
   * The hidden inputs withDom builds when the slider has a name.
   *
   * Null, not undefined: withDom sets it to null for an unnamed slider, and a
   * host that said undefined is not satisfied by one that says null.
   */
  formFields?: (HTMLInputElement | null)[] | null;
  /** withTracks installs this; the controller calls it with the state after every change */
  renderTracks?: (state?: unknown) => void;
  lifecycle?: { destroy?: () => void; mount?: () => void };
  /** The controller's own API, once withController has installed it */
  slider?: { setValue?: (value: number, triggerEvent?: boolean) => unknown };
}

/**
 * What drives a drag: the same handlers are registered for mouse and for
 * touch, so each one takes either.
 *
 * @category Components
 * @internal
 */
export type SliderPointerEvent = MouseEvent | TouchEvent;

/**
 * The slider's elements, gathered from wherever they are kept.
 *
 * The index signature is for the legacy `components` bag, which is spread over
 * the named five so anything else it holds comes through too.
 *
 * @category Components
 * @internal
 */
export interface SliderElements {
  container?: HTMLElement | null;
  handle?: HTMLElement | null;
  valueBubble?: HTMLElement | null;
  secondHandle?: HTMLElement | null;
  secondValueBubble?: HTMLElement | null;
  [key: string]: HTMLElement | null | undefined;
}

/**
 * The drawing and measuring helpers the controller hands to its handlers.
 *
 * @category Components
 * @internal
 */
export interface SliderUiRenderer {
  getPercentage: (value: number) => number;
  getValueFromPosition: (position: number) => number;
  roundToStep: (value: number) => number;
  clamp: (value: number, min?: number, max?: number) => number;
  showValueBubble: (bubbleElement: HTMLElement | null, show: boolean) => void;
  /** Alias of render, kept for callers that used the older name */
  updateUi: () => void;
  render: () => void;
}

/**
 * How the handlers report what happened.
 *
 * @category Components
 * @internal
 */
export interface SliderEventHelpers {
  triggerEvent: (eventName: string, originalEvent?: Event | null) => void;
}

export interface SliderComponent {
  /** The root element of the slider */
  element: HTMLElement;

  /** Sets slider value */
  setValue: (value: number, triggerEvent?: boolean) => SliderComponent;

  /** Gets slider value */
  getValue: () => number;

  /** Sets secondary slider value (for range slider) */
  setSecondValue: (value: number, triggerEvent?: boolean) => SliderComponent;

  /** Gets secondary slider value */
  getSecondValue: () => number | null;

  /** Sets slider minimum value */
  setMin: (min: number) => SliderComponent;

  /** Gets slider minimum value */
  getMin: () => number;

  /** Sets slider maximum value */
  setMax: (max: number) => SliderComponent;

  /** Gets slider maximum value */
  getMax: () => number;

  /** Sets slider step size */
  setStep: (step: number) => SliderComponent;

  /** Gets slider step size */
  getStep: () => number;

  /** Enables the slider */
  enable: () => SliderComponent;

  /** Disables the slider */
  disable: () => SliderComponent;

  /** Checks if slider is disabled */
  isDisabled: () => boolean;

  /** Sets slider color */
  setColor: (color: SliderColor) => SliderComponent;

  /** Gets slider color */
  getColor: () => string;

  /** Sets slider size */
  setSize: (size: SliderSize) => SliderComponent;

  /** Gets slider size */
  getSize: () => string;

  /** Shows or hides tick marks */
  showTicks: (show: boolean) => SliderComponent;

  /** Shows or hides current value while dragging */
  showCurrentValue: (show: boolean) => SliderComponent;

  /** Sets label text */
  setLabel: (text: string) => SliderComponent;

  /** Gets label text */
  getLabel: () => string;

  /** Sets icon HTML */
  setIcon: (iconHtml: string) => SliderComponent;

  /** Gets icon HTML */
  getIcon: () => string;

  /** Adds event listener */
  on: (
    event: SliderEventType,
    handler: (event: SliderEvent) => void
  ) => SliderComponent;

  /** Removes event listener */
  off: (
    event: SliderEventType,
    handler: (event: SliderEvent) => void
  ) => SliderComponent;

  /** Destroys the slider component and cleans up resources */
  destroy: () => void;
}


/**
 * Registers SliderConfig with the global defaults map, so
 * `setComponentDefaults("slider", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    slider?: Partial<SliderConfig>;
  }
}

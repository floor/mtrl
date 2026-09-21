// src/core/compose/component.ts
/**
 * @module core/compose/component
 * @description Core utilities for component composition and creation with built-in mobile support
 */

import { getCleanup, type CleanupScope } from "./cleanup";
import {
  createElement,
  CreateElementOptions,
  EventCondition,
  removeEventHandlers,
} from "../dom/create";
import {
  normalizeEvent,
  hasTouchSupport,
  TOUCH_CONFIG,
  PASSIVE_EVENTS,
} from "../utils/mobile";

/**
 * Touch state interface to track touch interactions
 */
export interface TouchState {
  startTime: number;
  startPosition: { x: number; y: number };
  isTouching: boolean;
  activeTarget: EventTarget | null;
}

/**
 * Config keys the base component and withElement read
 */
export interface BaseConfig {
  componentName?: string;
  prefix?: string;
  // Null, because BaseComponentConfig admits it and withElement reads this
  // with `||`, which treats null as "no parent" exactly as undefined is.
  parent?: HTMLElement | string | null;
}

/**
 * Base component interface with prefix utilities
 */
export interface BaseComponent {
  resources?: CleanupScope;
  config: BaseConfig & Record<string, unknown>;
  componentName?: string;
  getClass: (name: string) => string;
  getModifierClass: (base: string, modifier: string) => string;
  getElementClass: (base: string, element: string) => string;
  touchState: TouchState;
  updateTouchState: (event: Event, status: "start" | "end") => void;
}

/**
 * Element component extends base with element
 */
export interface ElementComponent extends BaseComponent {
  element: HTMLElement;
  addClass(...classes: string[]): this;
  destroy: () => void;
}

/**
 * Options for withElement enhancer
 */
export interface WithElementOptions {
  tag?: string;
  componentName?: string;
  attributes?: Record<string, unknown>;
  className?: string | string[];
  // Common HTML attributes
  id?: string; // Element ID
  name?: string; // Form element name
  title?: string; // Tooltip text (native browser tooltip on hover)
  tabIndex?: number; // Keyboard navigation order (-1 to remove from tab order, 0+ for custom order)
  // Inline styles. Object only: a style string is written verbatim to the
  // style attribute, so one interpolated value can carry extra declarations
  // (FLO-111). Assigning per property confines a value to that property.
  style?: Partial<CSSStyleDeclaration>;
  // Data attributes
  data?: Record<string, string>; // Data attributes (e.g., { name: 'value' } → data-name="value")
  // ARIA attributes for accessibility
  role?: string; // ARIA role (e.g., 'button', 'menuitem', 'dialog')
  ariaLabel?: string; // Accessible label for screen readers
  ariaDescribedBy?: string; // ID of element that describes this element
  ariaLabelledBy?: string; // ID of element that labels this element
  ariaHidden?: boolean; // Hide from screen readers
  forwardEvents?: Record<string, EventCondition>;
  interactive?: boolean;
  parent?: HTMLElement | string;
}

/**
 * Creates helper functions for managing CSS class names with a prefix
 * @param {string} prefix - Prefix to apply to class names
 * @returns {Object} Class name utilities
 */
const getModifierClass = (base: string, modifier: string): string => `${base}--${modifier}`;
const getElementClass = (base: string, element: string): string => `${base}-${element}`;
const withPrefix = (prefix: string) => ({
  /**
   * Gets a prefixed class name
   * @param {string} name - Base class name
   * @returns {string} Prefixed class name
   */
  getClass: (name: string): string => `${prefix}-${name}`,

  /**
   * Gets a prefixed modifier class name
   * @param {string} base - Base class name
   * @param {string} modifier - Modifier name
   * @returns {string} Prefixed modifier class
   */
  getModifierClass,

  /**
   * Gets a prefixed element class name
   * @param {string} base - Base class name
   * @param {string} element - Element name
   * @returns {string} Prefixed element class
   */
  getElementClass,
});

/**
 * Creates a base component with configuration and prefix utilities.
 * This forms the foundation for all components in the system.
 *
 * @param {Object} config - Component configuration
 * @returns {BaseComponent} Base component with prefix utilities
 */
export const createBase = <T extends BaseConfig & object = BaseConfig & object>(
  config: T = {} as T,
): BaseComponent & { config: T } => ({
  // Generic over the config, so a component keeps the type it was created
  // with. Declared as BaseComponent it was widened to a Record here, and
  // every reader downstream saw `unknown` for its own options — which is why
  // the hand-written pre-API interfaces could never match (FLO-235).
  config: config as BaseComponent["config"] & T,
  componentName: config.componentName,
  ...withPrefix(config.prefix || "mtrl"),

  /**
   * Manages the touch interaction state for the component.
   */
  touchState: {
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    isTouching: false,
    activeTarget: null,
  },

  /**
   * Updates the component's touch state based on user interactions.
   * Tracks touch position and timing for gesture recognition.
   */
  updateTouchState(event: Event, status: "start" | "end"): void {
    // Cast to MouseEvent as a safe fallback when working with general Events
    const normalized = normalizeEvent(event as MouseEvent);

    if (status === "start") {
      this.touchState = {
        startTime: Date.now(),
        startPosition: {
          x: normalized.clientX,
          y: normalized.clientY,
        },
        isTouching: true,
        activeTarget: normalized.target,
      };
    } else if (status === "end") {
      this.touchState.isTouching = false;
      this.touchState.activeTarget = null;
    }
  },
});

// Allocate gesture handlers only for interactive elements on touch devices.
const setupTouch = (element: HTMLElement, base: BaseComponent, options: WithElementOptions): (() => void) => {
  /**
   * Handles the start of a touch interaction.
   */
  const handleTouchStart = (event: Event): void => {
    base.updateTouchState(event, "start");
    element.classList.add(`${base.getClass("touch-active")}`);

    if (options.forwardEvents?.touchstart && "emit" in base && typeof base.emit === "function") {
      base.emit("touchstart", normalizeEvent(event));
    }
  };

  /**
   * Handles the end of a touch interaction.
   */
  const handleTouchEnd = (event: Event): void => {
    if (!base.touchState.isTouching) return;

    const touchDuration = Date.now() - base.touchState.startTime;
    element.classList.remove(`${base.getClass("touch-active")}`);
    base.updateTouchState(event, "end");

    // Emit tap event for short touches
    if (touchDuration < TOUCH_CONFIG.TAP_THRESHOLD && "emit" in base && typeof base.emit === "function") {
      base.emit("tap", normalizeEvent(event));
    }

    if (options.forwardEvents?.touchend && "emit" in base && typeof base.emit === "function") {
      base.emit("touchend", normalizeEvent(event));
    }
  };

  /**
   * Handles touch movement.
   */
  const handleTouchMove = (event: Event): void => {
    if (!base.touchState.isTouching) return;

    const normalized = normalizeEvent(event);
    const deltaX = normalized.clientX - base.touchState.startPosition.x;
    const deltaY = normalized.clientY - base.touchState.startPosition.y;

    // Detect and emit swipe gestures
    if (
      Math.abs(deltaX) > TOUCH_CONFIG.SWIPE_THRESHOLD &&
      "emit" in base && typeof base.emit === "function"
    ) {
      base.emit("swipe", {
        direction: deltaX > 0 ? "right" : "left",
        deltaX,
        deltaY,
      });
    }

    if (options.forwardEvents?.touchmove && "emit" in base && typeof base.emit === "function") {
      base.emit("touchmove", { ...normalized, deltaX, deltaY });
    }
  };

  element.addEventListener("touchstart", handleTouchStart, PASSIVE_EVENTS);
  element.addEventListener("touchend", handleTouchEnd);
  element.addEventListener("touchmove", handleTouchMove, PASSIVE_EVENTS);
  return () => {
    element.removeEventListener("touchstart", handleTouchStart);
    element.removeEventListener("touchend", handleTouchEnd);
    element.removeEventListener("touchmove", handleTouchMove);
  };
};

/**
 * Higher-order function that adds a DOM element to a component
 * @param {WithElementOptions} options - Element creation options
 * @returns {Function} Component enhancer
 */
export const withElement =
  (options: WithElementOptions = {}) =>
  <T extends BaseComponent>(component: T): T & ElementComponent => {
    const resources = getCleanup(component);

    // Get the base component for reference
    const base = component;

    // Check for parent in component config
    let parent: HTMLElement | string | null | undefined =
      component.config.parent || options.parent;

    // Handle string selectors
    if (typeof parent === "string") {
      parent = document.querySelector(parent) as HTMLElement | null;
    }

    // Create element options from component options
    const elementOptions: CreateElementOptions = {
      tag: options.tag || "div",
      className: [
        base.getClass(
          options.componentName || base.componentName || "component",
        ),
        hasTouchSupport() && options.interactive
          ? base.getClass("interactive")
          : null,
        ...(Array.isArray(options.className)
          ? options.className
          : [options.className]),
      ].filter((name): name is string => Boolean(name)),
      attributes: options.attributes || {},
      // Common HTML attributes
      id: options.id,
      name: options.name,
      title: options.title,
      tabIndex: options.tabIndex,
      style: options.style,
      // Data attributes
      data: options.data,
      // ARIA attributes
      role: options.role,
      ariaLabel: options.ariaLabel,
      ariaDescribedBy: options.ariaDescribedBy,
      ariaLabelledBy: options.ariaLabelledBy,
      ariaHidden: options.ariaHidden,
      forwardEvents: options.forwardEvents || {},
      context: component, // Pass component as context for events
      container: parent, // Pass to createElement's container option (internal use)
    };

    // Create the element with appropriate classes
    const element = createElement(elementOptions);

    const cleanupTouch = hasTouchSupport() && options.interactive
      ? setupTouch(element, base, options)
      : undefined;

    resources.add(() => {
      cleanupTouch?.();
      base.touchState.activeTarget = null;
      base.touchState.isTouching = false;
      removeEventHandlers(element);
      element.remove();
    });

    return {
      ...component,
      element,

      /**
       * Adds CSS classes to the element
       * @param {...string} classes - CSS classes to add
       * @returns Component instance for chaining. Left to infer: `this` is not
       *   an available annotation in an object literal, and naming
       *   ElementComponent here is the narrowing the declaration above exists
       *   to undo.
       */
      addClass(...classes: string[]) {
        element.classList.add(...classes.filter(Boolean));
        return this;
      },

      /**
       * Removes the element and cleans up event listeners.
       * Ensures proper resource cleanup when the component is destroyed.
       */
      destroy(): void {
        resources.destroy();
      },
    };
  };

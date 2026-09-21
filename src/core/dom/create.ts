// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { omitsAttribute } from "../utils/attributes";
import { setAttributes } from "./attributes";
import { addClass } from "./classes";
import { safeUrl, URL_ATTRIBUTES } from "../utils/url";

import { setHTML } from "./html";
/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => void;

/**
 * Element type that can be either HTMLElement or SVGElement
 */
export type DOMElement = HTMLElement | SVGElement;

/**
 * Component context passed to created elements for event forwarding
 */
export interface ElementContext {
  /** Emits forwarded events */
  emit?(
    event: string,
    data: { event: Event; element: DOMElement; originalEvent: Event },
  ): void;
  /** Subscribes to events */
  on?(event: string, handler: (...args: unknown[]) => void): unknown;
}

/**
 * Event condition type
 * Declared through a method signature so conditions typed for a specific
 * component or event subtype stay assignable under strictFunctionTypes
 */
export type EventCondition =
  | boolean
  | {
      condition(
        context: ElementContext & { element: DOMElement },
        event: Event,
      ): boolean;
    }["condition"];

/**
 * Options for element creation with comprehensive configuration
 */
export interface CreateElementOptions {
  /** HTML tag name */
  tag?: string;
  /** Container to append element to */
  container?: HTMLElement | null;
  /** Inner HTML content */
  html?: string;
  /** Text content */
  text?: string;
  // Common HTML attributes
  /** Element ID */
  id?: string;
  /** Form element name */
  name?: string;
  /** Element title (native browser tooltip on hover) */
  title?: string;
  /** Keyboard navigation order (-1 to remove from tab order, 0+ for custom order) */
  tabIndex?: number;
  /** Inline styles (string or object) */
  /**
   * Inline styles. Object only: a style string is written verbatim to the
   * style attribute, so one interpolated value can carry extra declarations
   * (FLO-111). Assigning per property confines a value to that property.
   */
  style?: Partial<CSSStyleDeclaration>;
  // Data attributes
  /** Dataset attributes (e.g., { name: 'value' } → data-name="value") */
  data?: Record<string, string>;
  // ARIA attributes for accessibility
  /** ARIA role (e.g., 'button', 'menuitem', 'dialog') */
  role?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** ID of element that describes this element */
  ariaDescribedBy?: string;
  /** ID of element that labels this element */
  ariaLabelledBy?: string;
  /** Hide from screen readers */
  ariaHidden?: boolean;
  /** CSS classes (will be automatically prefixed with 'mtrl-') - alias for className */
  class?: string | string[];
  /** CSS classes (will be automatically prefixed with 'mtrl-') - alias for class */
  className?: string | string[];
  /** CSS classes that will NOT be prefixed - added as-is to the element */
  /**
   * @deprecated Since FLO-117 `class` and `className` are not prefixed either,
   * so this option does the same thing as those. It is kept for the release
   * that changes the behaviour and will be removed in 1.0.0.
   */
  rawClass?: string | string[];
  /** HTML attributes */
  attributes?: object;
  /** Events to forward when component has emit method */
  forwardEvents?: Record<string, EventCondition>;
  /** Callback after element creation */
  onCreate?(element: HTMLElement, context?: ElementContext): void;
  /** Component context */
  context?: ElementContext & object;
}

/**
 * Options for SVG element creation
 */
export interface CreateSVGElementOptions
  extends Omit<CreateElementOptions, "container" | "onCreate"> {
  container?: DOMElement | null;
  onCreate?(element: SVGElement, context?: ElementContext): void;
}

/**
 * Event handler storage
 */
export interface EventHandlerStorage {
  [eventName: string]: EventHandler;
}

/**
 * Attribute names that install an event handler. Refused by the options spread.
 */
const EVENT_HANDLER_ATTRIBUTE = /^on[a-z]/i;

/**
 * Elements whose `name` means something: form-associated elements, plus the
 * few others HTML defines it for. On any other tag the attribute is invalid,
 * and worse than inert -- `form.querySelector('[name="x"]')` and
 * `document.getElementsByName` find a component's root div before the input
 * that actually submits the value.
 */
const NAMEABLE_TAGS = new Set([
  "button", "fieldset", "form", "iframe", "img", "input",
  "map", "meta", "object", "output", "select", "slot", "textarea",
]);

const RESERVED_OPTIONS: Record<string, unknown> = {
  __proto__: null,
  tag: true,
  container: true,
  html: true,
  text: true,
  id: true,
  name: true,
  title: true,
  tabIndex: true,
  style: true,
  role: true,
  ariaLabel: true,
  ariaDescribedBy: true,
  ariaLabelledBy: true,
  ariaHidden: true,
  data: true,
  class: true,
  className: true,
  rawClass: true,
  attributes: true,
  forwardEvents: true,
  onCreate: true,
  context: true,
};

/**
 * Touch events that should use passive listeners for better scroll performance
 */
const PASSIVE_TOUCH_EVENTS = new Set(["touchstart", "touchmove"]);

/**
 * Set up event forwarding for an element
 */
const setupEventForwarding = (
  element: HTMLElement | SVGElement,
  forwardEvents: Record<string, EventCondition>,
  context: ElementContext | undefined,
): void => {
  if (!forwardEvents || (!context?.emit && !context?.on)) return;

  element.__eventHandlers = {};

  for (const nativeEvent in forwardEvents) {
    const eventConfig = forwardEvents[nativeEvent];
    const handler = (event: Event) => {
      let shouldForward = true;

      if (typeof eventConfig === "function") {
        try {
          shouldForward = eventConfig({ ...context, element }, event);
        } catch (error) {
          console.warn(`Error in event condition for ${nativeEvent}:`, error);
          shouldForward = false;
        }
      } else {
        shouldForward = Boolean(eventConfig);
      }

      if (shouldForward && context.emit) {
        context.emit(nativeEvent, { event, element, originalEvent: event });
      }
    };

    element.__eventHandlers[nativeEvent] = handler;

    // Use passive listeners for touch events to avoid scroll-blocking warnings
    const options = PASSIVE_TOUCH_EVENTS.has(nativeEvent)
      ? { passive: true }
      : undefined;
    element.addEventListener(nativeEvent, handler, options);
  }
};

/**
 * Element pool for reusing elements
 */
class ElementPool {
  private pools = new Map<string, HTMLElement[]>();
  private maxSize = 20;

  acquire(tag: string = "div"): HTMLElement {
    const pool = this.pools.get(tag);
    if (pool?.length) {
      const element = pool.pop()!;
      element.className = "";
      element.replaceChildren();
      element.removeAttribute("id");
      Object.keys(element.dataset).forEach(
        (key) => delete element.dataset[key],
      );
      return element;
    }
    return document.createElement(tag);
  }

  release(element: HTMLElement): void {
    const tag = element.tagName.toLowerCase();
    let pool = this.pools.get(tag);

    if (!pool) {
      pool = [];
      this.pools.set(tag, pool);
    }

    if (pool.length < this.maxSize) {
      this.cleanElement(element);
      pool.push(element);
    }
  }

  private cleanElement(element: HTMLElement): void {
    const handlers = element.__eventHandlers;
    if (handlers) {
      for (const event in handlers) {
        element.removeEventListener(event, handlers[event]);
      }
      delete element.__eventHandlers;
    }

    element.className = "";
    element.replaceChildren();
    element.removeAttribute("id");
    Object.keys(element.dataset).forEach((key) => delete element.dataset[key]);
    element.parentNode?.removeChild(element);
  }
}

let elementPool: ElementPool | undefined;
const getElementPool = (): ElementPool => elementPool ??= new ElementPool();

/**
 * Create an HTML element with comprehensive options and optimizations
 * Fast paths for common scenarios, full feature support for complex cases
 *
 * @param {CreateElementOptions} options - Element creation options
 * @returns {HTMLElement} Created HTML element
 */
export const createElement = (
  options: CreateElementOptions = {},
): HTMLElement => {
  // Fast path 1: Empty options - return basic div
  if (!options || Object.keys(options).length === 0) {
    return document.createElement("div");
  }

  // Fast path 2: String tag only (legacy support)
  if (typeof options === "string") {
    return document.createElement(options);
  }

  // Create base element
  const element = document.createElement(options.tag || "div");

  // Apply basic properties first for optimal performance
  if (options.html) setHTML(element, options.html);
  else if (options.text) element.textContent = options.text;

  // Common HTML attributes
  if (options.id) element.id = options.id;
  if (options.name && NAMEABLE_TAGS.has(element.tagName.toLowerCase())) {
    element.setAttribute("name", options.name);
  }
  if (options.title) element.title = options.title;
  if (options.tabIndex !== undefined) element.tabIndex = options.tabIndex;

  // Inline styles, by property. A string form existed here and was written
  // straight through with setAttribute("style", ...), which let a single
  // interpolated value carry any number of further declarations -- enough to
  // build a full-viewport overlay out of what a caller thought was a colour.
  // The CSSOM property setter parses one value and drops it if it does not
  // fit, so this route cannot be widened the same way. FLO-111.
  if (options.style) {
    Object.assign(element.style, options.style);
  }

  // ARIA attributes
  if (options.role) element.setAttribute("role", options.role);
  if (options.ariaLabel) element.setAttribute("aria-label", options.ariaLabel);
  if (options.ariaDescribedBy)
    element.setAttribute("aria-describedby", options.ariaDescribedBy);
  if (options.ariaLabelledBy)
    element.setAttribute("aria-labelledby", options.ariaLabelledBy);
  if (options.ariaHidden !== undefined)
    element.setAttribute("aria-hidden", String(options.ariaHidden));

  // Apply classes with automatic prefixing and raw classes
  const classSource = options.className || options.class;
  if (classSource) addClass(element, classSource);
  if (options.rawClass) {
    const classes = Array.isArray(options.rawClass)
      ? options.rawClass
      : options.rawClass.split(" ");
    element.classList.add(...classes.filter(Boolean));
  }

  // Apply data attributes efficiently using Object.assign
  if (options.data) {
    Object.assign(element.dataset, options.data);
  }

  // Apply structured attributes
  if (options.attributes) {
    setAttributes(element, options.attributes);
  }

  // Apply other attributes from options spread (rest parameters).
  // Event-handler attributes are refused: spreading CMS-shaped props must not be able to
  // attach onclick or onerror. Listeners belong on forwardEvents or addEventListener.
  for (const key in options) {
    if (!(key in RESERVED_OPTIONS) && !EVENT_HANDLER_ATTRIBUTE.test(key)) {
      const value = options[key as keyof CreateElementOptions];
      // A boolean attribute given `false` is left off: the parser reads any
      // value, "false" included, as the attribute being present. FLO-240.
      if (value != null && !omitsAttribute(key, value)) {
        const text = String(value);
        element.setAttribute(
          key,
          URL_ATTRIBUTES.has(key.toLowerCase()) ? safeUrl(text) : text
        );
      }
    }
  }

  // Set up event forwarding if configured
  if (options.forwardEvents) {
    setupEventForwarding(element, options.forwardEvents, options.context);
  }

  // Finalize: append to container and call onCreate callback
  if (options.container) options.container.appendChild(element);
  if (options.onCreate) options.onCreate(element, options.context);

  return element;
};

/**
 * Create a pooled HTML element
 * @param options - Element creation options
 * @returns Created HTML element from pool
 */
export const createElementPooled = (
  options: CreateElementOptions = {},
): HTMLElement => {
  const element = getElementPool().acquire(options.tag || "div");

  // Apply properties similar to createElement but skip creating new element
  if (options.html) setHTML(element, options.html);
  else if (options.text) element.textContent = options.text;
  if (options.id) element.id = options.id;

  const classSource = options.className || options.class;
  if (classSource) addClass(element, classSource);

  if (options.data) Object.assign(element.dataset, options.data);
  if (options.attributes) setAttributes(element, options.attributes);
  if (options.forwardEvents)
    setupEventForwarding(element, options.forwardEvents, options.context);
  if (options.container) options.container.appendChild(element);
  if (options.onCreate) options.onCreate(element, options.context);

  return element;
};

/**
 * Release an element back to the pool
 * @param element - Element to release
 */
export const releaseElement = (element: HTMLElement): void => {
  getElementPool().release(element);
};

/**
 * Create an SVG element
 * @param options - SVG element creation options
 * @returns Created SVG element
 */
export const createSVGElement = (
  options: CreateSVGElementOptions = {},
): SVGElement => {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    options.tag || "svg",
  ) as SVGElement;

  if (options.text) element.textContent = options.text;
  if (options.id) element.id = options.id;
  if (options.attributes) setAttributes(element, options.attributes);
  if (options.forwardEvents)
    setupEventForwarding(element, options.forwardEvents, options.context);
  if (options.container) options.container.appendChild(element);
  if (options.onCreate) options.onCreate(element, options.context);

  return element;
};

/**
 * Remove event handlers from an element
 * @param element - Element to clean up
 */
export const removeEventHandlers = (
  element: HTMLElement | SVGElement,
): void => {
  const handlers = element.__eventHandlers;
  if (handlers) {
    for (const event in handlers) {
      element.removeEventListener(event, handlers[event]);
    }
    delete element.__eventHandlers;
  }
};

// Type augmentation for event handler storage
declare global {
  interface HTMLElement {
    __eventHandlers?: EventHandlerStorage;
  }
  interface SVGElement {
    __eventHandlers?: EventHandlerStorage;
  }
}

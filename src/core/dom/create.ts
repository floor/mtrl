// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from "./attributes";
import { addClass } from "./classes";

/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => void;

/**
 * Event condition type
 */
export type EventCondition =
  | boolean
  | ((context: any, event: Event) => boolean);

/**
 * Element type that can be either HTMLElement or SVGElement
 */
export type DOMElement = HTMLElement | SVGElement;

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
  /** Element ID */
  id?: string;
  /** Element aria-label */
  ariaLabel?: string;
  /** Dataset attributes */
  data?: Record<string, string>;
  /** CSS classes (will be automatically prefixed with 'mtrl-') - alias for className */
  class?: string | string[];
  /** CSS classes (will be automatically prefixed with 'mtrl-') - alias for class */
  className?: string | string[];
  /** CSS classes that will NOT be prefixed - added as-is to the element */
  rawClass?: string | string[];
  /** HTML attributes */
  attributes?: Record<string, any>;
  /** Events to forward when component has emit method */
  forwardEvents?: Record<string, EventCondition>;
  /** Callback after element creation */
  onCreate?: (element: HTMLElement, context?: any) => void;
  /** Component context */
  context?: any;
  /** Additional attributes via spread */
  [key: string]: any;
}

/**
 * Options for SVG element creation
 */
export interface CreateSVGElementOptions
  extends Omit<CreateElementOptions, "container" | "onCreate"> {
  container?: DOMElement | null;
  onCreate?: (element: SVGElement, context?: any) => void;
}

/**
 * Event handler storage
 */
export interface EventHandlerStorage {
  [eventName: string]: EventHandler;
}

/**
 * SVG element tags
 */
const SVG_TAGS = [
  "svg",
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "g",
  "text",
  "tspan",
  "textPath",
  "defs",
  "clipPath",
  "mask",
  "pattern",
  "marker",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "foreignObject",
];

/**
 * Set up event forwarding for an element
 */
const setupEventForwarding = (
  element: HTMLElement | SVGElement,
  forwardEvents: Record<string, EventCondition>,
  context: any
): void => {
  if (!forwardEvents || (!context?.emit && !context?.on)) return;

  (element as any).__eventHandlers = {};

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

    (element as any).__eventHandlers[nativeEvent] = handler;
    element.addEventListener(nativeEvent, handler);
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
      element.innerHTML = "";
      element.removeAttribute("id");
      Object.keys(element.dataset).forEach(
        (key) => delete element.dataset[key]
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
    const handlers = (element as any).__eventHandlers;
    if (handlers) {
      for (const event in handlers) {
        element.removeEventListener(event, handlers[event]);
      }
      delete (element as any).__eventHandlers;
    }

    element.className = "";
    element.innerHTML = "";
    element.removeAttribute("id");
    Object.keys(element.dataset).forEach((key) => delete element.dataset[key]);
    element.parentNode?.removeChild(element);
  }
}

const elementPool = new ElementPool();

/**
 * Create an HTML element with comprehensive options and optimizations
 * Fast paths for common scenarios, full feature support for complex cases
 *
 * @param {CreateElementOptions} options - Element creation options
 * @returns {HTMLElement} Created HTML element
 */
export const createElement = (
  options: CreateElementOptions = {}
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
  if (options.html) element.innerHTML = options.html;
  else if (options.text) element.textContent = options.text;
  if (options.id) element.id = options.id;
  if (options.ariaLabel) element.setAttribute("aria-label", options.ariaLabel);

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

  // Apply other attributes from options spread (rest parameters)
  for (const key in options) {
    if (
      ![
        "tag",
        "container",
        "html",
        "text",
        "id",
        "ariaLabel",
        "data",
        "class",
        "className",
        "rawClass",
        "attributes",
        "forwardEvents",
        "onCreate",
        "context",
      ].includes(key)
    ) {
      const value = options[key];
      if (value != null) {
        element.setAttribute(key, String(value));
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
  options: CreateElementOptions = {}
): HTMLElement => {
  const element = elementPool.acquire(options.tag || "div");

  // Apply properties similar to createElement but skip creating new element
  if (options.html) element.innerHTML = options.html;
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
  elementPool.release(element);
};

/**
 * Create an SVG element
 * @param options - SVG element creation options
 * @returns Created SVG element
 */
export const createSVGElement = (
  options: CreateSVGElementOptions = {}
): SVGElement => {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    options.tag || "svg"
  ) as SVGElement;

  if (options.text) element.textContent = options.text;
  if (options.id) element.id = options.id;
  if (options.attributes) setAttributes(element as any, options.attributes);
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
  element: HTMLElement | SVGElement
): void => {
  const handlers = (element as any).__eventHandlers;
  if (handlers) {
    for (const event in handlers) {
      element.removeEventListener(event, handlers[event]);
    }
    delete (element as any).__eventHandlers;
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

// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from './attributes';
import { normalizeClasses } from './classes';
import { PREFIX } from '../config';
import { addClass } from './classes'; // Import addClass

/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => void;

/**
 * Event condition type - either a boolean or a function that returns a boolean
 */
export type EventCondition = boolean | ((context: any, event: Event) => boolean);

/**
 * Element type that can be either HTMLElement or SVGElement
 */
export type DOMElement = HTMLElement | SVGElement;

/**
 * Options for element creation
 */
export interface CreateElementOptions {
  /**
   * HTML tag name
   */
  tag?: string;
  
  /**
   * Container to append element to
   */
  container?: HTMLElement | null;
  
  /**
   * Inner HTML content
   */
  html?: string;
  
  /**
   * Text content
   */
  text?: string;
  
  /**
   * Element ID
   */
  id?: string;

  /**
   * Element ariaLabel
   */
  ariaLabel?: string;
  
  /**
   * Dataset attributes
   */
  data?: Record<string, string>;
  
  /**
   * CSS classes (will be automatically prefixed with 'mtrl-')
   * Alias for 'className'
   */
  class?: string | string[];
  
  /**
   * CSS classes (will be automatically prefixed with 'mtrl-')
   * Alias for 'class'
   */
  className?: string | string[];
  
  /**
   * CSS classes that will NOT be prefixed
   * Added as-is to the element
   */
  rawClass?: string | string[];
  
  /**
   * HTML attributes
   */
  attributes?: Record<string, any>;
  
  /**
   * Events to forward when component has emit method
   */
  forwardEvents?: Record<string, EventCondition>;
  
  /**
   * Callback after element creation
   */
  onCreate?: (element: HTMLElement, context?: any) => void;
  
  /**
   * Component context
   */
  context?: any;
  
  /**
   * Additional attributes
   */
  [key: string]: any;
}

/**
 * Options for SVG element creation, extends regular element options
 */
export interface CreateSVGElementOptions extends Omit<CreateElementOptions, 'container' | 'onCreate'> {
  /**
   * Container to append element to
   */
  container?: DOMElement | null;
  
  /**
   * Callback after element creation
   */
  onCreate?: (element: SVGElement, context?: any) => void;
}

/**
 * Event handler storage to facilitate cleanup
 */
export interface EventHandlerStorage {
  [eventName: string]: EventHandler;
}

/**
 * List of SVG element tags to detect when to use namespaces
 */
const SVG_TAGS = [
  'svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 
  'rect', 'g', 'text', 'tspan', 'textPath', 'defs', 'clipPath', 'mask',
  'pattern', 'marker', 'linearGradient', 'radialGradient', 'stop', 'use',
  'foreignObject', 'desc', 'title', 'metadata', 'symbol', 'switch'
];

/**
 * Sets up event forwarding for an element
 * @private
 * @param element - The element to set up events for
 * @param forwardEvents - Event configuration
 * @param context - Component context
 */
const _setupEventForwarding = (element: HTMLElement | SVGElement, forwardEvents: Record<string, EventCondition>, context: any): void => {
  if (!forwardEvents || (!context?.emit && !context?.on)) return;
  
  (element as any).__eventHandlers = {};
  
  for (const nativeEvent in forwardEvents) {
    const eventConfig = forwardEvents[nativeEvent];
    
    const handler = (event: Event) => {
      let shouldForward = true;
      
      if (typeof eventConfig === 'function') {
        try {
          // Create a lightweight context clone
          const ctxWithElement = { ...context, element };
          shouldForward = eventConfig(ctxWithElement, event);
        } catch (error) {
          console.warn(`Error in event condition for ${nativeEvent}:`, error);
          shouldForward = false;
        }
      } else {
        shouldForward = Boolean(eventConfig);
      }
      
      if (shouldForward) {
        if (context.emit) {
          context.emit(nativeEvent, { event, element, originalEvent: event });
        } else if (context.on) {
          element.dispatchEvent(new CustomEvent(nativeEvent, {
            detail: { event, element, originalEvent: event },
            bubbles: true,
            cancelable: true
          }));
        }
      }
    };
    
    (element as any).__eventHandlers[nativeEvent] = handler;
    element.addEventListener(nativeEvent, handler);
  }
};

/**
 * Applies common properties to an element
 * @private
 * @param element - The element to apply properties to
 * @param options - Element options
 */
const _applyCommonProperties = (
  element: HTMLElement | SVGElement, 
  { html, text, id }: { html?: string; text?: string; id?: string; }
): void => {
  if (html) element.innerHTML = html;
  if (text) element.textContent = text;
  if (id) element.id = id;
};

/**
 * Applies classes to an element
 * @private
 * @param element - The element to apply classes to
 * @param prefixedClassSource - Classes to be prefixed
 * @param rawClass - Classes to be applied without prefix
 */
const _applyClasses = (
  element: HTMLElement | SVGElement,
  prefixedClassSource: string | string[] | undefined,
  rawClass: string | string[] | undefined
): void => {
  // Handle prefixed classes
  if (prefixedClassSource) {
    // Use type assertion to make TypeScript happy
    addClass(element as HTMLElement, prefixedClassSource);
  }
  
  // Handle raw classes (no prefix)
  if (rawClass) {
    const rawClasses = normalizeClasses(rawClass);
    if (rawClasses.length) {
      element.classList.add(...rawClasses);
    }
  }
};

/**
 * Finalizes element creation by appending to container and calling onCreate
 * @private
 * @param element - The created element
 * @param container - Container to append to
 * @param onCreate - Callback after creation
 * @param context - Component context
 */
const _finalizeElement = <T extends HTMLElement | SVGElement>(
  element: T, 
  container: HTMLElement | SVGElement | null | undefined, 
  onCreate: ((element: T, context?: any) => void) | undefined,
  context: any
): T => {
  // Append to container if provided
  if (container) container.appendChild(element);
  if (onCreate) onCreate(element, context);
  return element;
};

/**
 * Creates an HTML element with the specified options
 *
 * @param {CreateElementOptions} options - Element creation options
 * @returns {HTMLElement} Created HTML element
 */
export const createElement = (options: CreateElementOptions = {}): HTMLElement => {
  const {
    tag = 'div',
    container = null,
    html = '',
    text = '',
    id = '',
    data = {},
    class: classOption,
    className,
    rawClass,
    attributes = {},
    forwardEvents = {},
    onCreate,
    context,
    ...rest
  } = options;

  // Create standard HTML element
  const element = document.createElement(tag);

  // Apply basic properties
  _applyCommonProperties(element, { html, text, id });

  // Apply classes
  _applyClasses(element, classOption || className, rawClass);
  
  // Handle data attributes directly
  for (const key in data) {
    element.dataset[key] = data[key];
  }

  // Handle regular attributes with setAttribute for HTML elements
  const allAttributes = { ...attributes, ...rest };
  for (const key in allAttributes) {
    const value = allAttributes[key];
    if (value != null) {
      element.setAttribute(key, String(value));
    }
  }

  // Handle event forwarding
  _setupEventForwarding(element, forwardEvents, context);

  // Finalize element (append to container, call onCreate)
  return _finalizeElement(element, container, onCreate, context);
};

/**
 * Creates an SVG element with the specified options
 *
 * @param {CreateSVGElementOptions} options - SVG element creation options
 * @returns {SVGElement} Created SVG element
 */
export const createSVGElement = (options: CreateSVGElementOptions = {}): SVGElement => {
  const {
    tag = 'svg',
    container = null,
    html = '',
    text = '',
    id = '',
    class: classOption,
    className,
    rawClass,
    attributes = {},
    forwardEvents = {},
    onCreate,
    context,
    ...rest
  } = options;

  // Ensure we're using a valid SVG tag name
  if (!SVG_TAGS.includes(tag.toLowerCase())) {
    console.warn(`Warning: '${tag}' is not a standard SVG element tag.`);
  }

  // Create SVG element with proper namespace
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);

  // Apply basic properties
  _applyCommonProperties(element, { html, text, id });

  // Apply classes
  _applyClasses(element, classOption || className, rawClass);

  // Handle regular attributes with setAttributeNS for SVG elements to preserve case sensitivity
  const allAttributes = { ...attributes, ...rest };
  for (const key in allAttributes) {
    const value = allAttributes[key];
    if (value != null) {
      element.setAttributeNS(null, key, String(value));
    }
  }

  // Handle event forwarding
  _setupEventForwarding(element, forwardEvents, context);

  // Finalize element (append to container, call onCreate)
  return _finalizeElement(element, container, onCreate, context);
};

/**
 * Removes event handlers from an element
 * @param element - Element to cleanup
 */
export const removeEventHandlers = (element: HTMLElement | SVGElement): void => {
  const handlers = (element as any).__eventHandlers;
  if (handlers) {
    for (const event in handlers) {
      element.removeEventListener(event, handlers[event]);
    }
    delete (element as any).__eventHandlers;
  }
};

/**
 * Higher-order function to add attributes to an element
 * @param {Record<string, any>} attributes - Attributes to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withAttributes = (attributes: Record<string, any>) => 
  (element: HTMLElement): HTMLElement => {
    setAttributes(element, attributes);
    return element;
  };

/**
 * Higher-order function to add classes to an element
 * @param {...(string | string[])} classes - Classes to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withClasses = (...classes: (string | string[])[]) => 
  (element: HTMLElement): HTMLElement => {
    addClass(element, ...classes);
    return element;
  };

/**
 * Higher-order function to add content to an element
 * @param {Node|string} content - Content to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withContent = (content: Node | string) => 
  (element: HTMLElement): HTMLElement => {
    if (content instanceof Node) element.appendChild(content);
    else element.textContent = content;
    return element;
  };

// Extend interfaces to add eventHandlers property
declare global {
  interface HTMLElement {
    /**
     * Storage for event handlers to enable cleanup
     */
    __eventHandlers?: EventHandlerStorage;
  }
  
  interface SVGElement {
    /**
     * Storage for event handlers to enable cleanup
     */
    __eventHandlers?: EventHandlerStorage;
  }
}
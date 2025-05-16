// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from './attributes';
import { normalizeClasses } from '../utils';
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
 * Event handler storage to facilitate cleanup
 */
export interface EventHandlerStorage {
  [eventName: string]: EventHandler;
}

/**
 * Creates a DOM element with the specified options
 *
 * @param {CreateElementOptions} options - Element creation options
 * @returns {HTMLElement} Created element
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

  const element = document.createElement(tag);

  // Apply basic properties
  if (html) element.innerHTML = html;
  if (text) element.textContent = text;
  if (id) element.id = id;

  // 1. Handle prefixed classes using addClass
  const prefixedClassSource = classOption || className;
  if (prefixedClassSource) {
    addClass(element, prefixedClassSource);
  }
  
  // 2. Handle raw classes (no prefix)
  if (rawClass) {
    const rawClasses = normalizeClasses(rawClass);
    if (rawClasses.length) {
      element.classList.add(...rawClasses);
    }
  }

  // Handle data attributes directly
  for (const key in data) {
    element.dataset[key] = data[key];
  }

  // Handle regular attributes
  const allAttributes = { ...attributes, ...rest };
  for (const key in allAttributes) {
    const value = allAttributes[key];
    if (value != null) element.setAttribute(key, String(value));
  }

  // Handle event forwarding
  if (forwardEvents && (context?.emit || context?.on)) {
    element.__eventHandlers = {};
    
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
      
      element.__eventHandlers[nativeEvent] = handler;
      element.addEventListener(nativeEvent, handler);
    }
  }

  // Append to container if provided
  if (container) container.appendChild(element);
  if (onCreate) onCreate(element, context);

  return element;
};

/**
 * Removes event handlers from an element
 * @param element - Element to cleanup
 */
export const removeEventHandlers = (element: HTMLElement): void => {
  const handlers = element.__eventHandlers;
  if (handlers) {
    for (const event in handlers) {
      element.removeEventListener(event, handlers[event]);
    }
    delete element.__eventHandlers;
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

// Extend HTMLElement interface to add eventHandlers property
declare global {
  interface HTMLElement {
    /**
     * Storage for event handlers to enable cleanup
     */
    __eventHandlers?: EventHandlerStorage;
  }
}